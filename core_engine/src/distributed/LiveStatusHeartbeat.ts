/**
 * LiveStatusHeartbeat.ts
 * Agent (LG) side of live monitoring (EDD §Live Monitoring). During the run each LG
 * writes a small `<share>/live_<runId>/<machine>.status.json` every few seconds,
 * derived from the transaction CSV it is already writing locally. This is the LIGHT
 * push to the share (kilobytes, per-machine file) — the raw firehose stays local, so
 * a share hiccup never perturbs the run. The controller monitor aggregates these.
 *
 * The file is written to `<machine>.status.json.tmp` then renamed, so a reader never
 * observes a half-written file.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { RelativeHistogram, HistogramJSON } from '../reporting/Histogram';
import { readTransactionCsvStats, findRequestCsv, readRequestFailure } from './transactionCsv';
import { fetchK6Vus } from './control';
import { HostMonitor } from '../execution/HostMonitor';

export type LiveState = 'running' | 'stopping' | 'aborting' | 'done' | 'stopped' | 'aborted';

/** Count lines in an ndjson file + the last `n` as short messages. Best-effort. */
function tailNdjson(file: string, n: number): { count: number; recent: string[] } {
  try {
    if (!fs.existsSync(file)) return { count: 0, recent: [] };
    const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/).filter((l) => l.trim().length > 0);
    const recent = lines.slice(-n).map((l) => {
      try {
        const o = JSON.parse(l) as Record<string, unknown>;
        return String(o.message ?? o.msg ?? o.error ?? o.type ?? l).slice(0, 160);
      } catch { return l.slice(0, 160); }
    });
    return { count: lines.length, recent };
  } catch { return { count: 0, recent: [] }; }
}

export interface LiveStatusSnapshot {
  schemaVersion: 1;
  machine: string;
  runId: string;
  testId: string;
  updatedAt: string;
  state: LiveState;
  elapsedSec: number;
  currentVus: number;
  transactionsTotal: number;
  failTotal: number;
  errorRate: number;
  /** Request-level totals (from the request CSV isError) — for the request-failure graph. */
  reqTotal: number;
  reqFailed: number;
  /** Windowed (current) transaction throughput, txn/s. */
  throughputTps: number;
  /** This machine's host resource utilisation (%). */
  host: { cpu: number; mem: number };
  errorCount: number;
  warnCount: number;
  recentErrors: string[];
  recentWarnings: string[];
  /** Configured stat set (from the plan) so the monitor renders the same columns. */
  stats: string[];
  /**
   * Per-transaction: counts + a compact MERGEABLE response-time histogram (ms). The
   * controller sums bucket counts across machines → combined avg/min/max/percentiles.
   * A few KB per transaction, independent of request volume. Raw is never shipped.
   */
  transactions: Array<{ name: string; count: number; fail: number; hist: HistogramJSON }>;
}

export interface HeartbeatOptions {
  machine: string;
  runId: string;
  testId: string;
  /** The transaction CSV being written live on this machine. */
  csvPath: string;
  /** `<collectDir>/live_<runId>` — where this machine's status file lands. */
  liveDir: string;
  /** Configured transaction stats (e.g. ["avg","min","med","max","p(90)","p(99)"]). */
  stats?: string[];
  intervalMs?: number;
}

export class LiveStatusHeartbeat {
  private timer: NodeJS.Timeout | null = null;
  private startMs = Date.now();
  private prevCount = 0;
  private prevMs = Date.now();
  private state: LiveState = 'running';
  private vusCache = 0; // real active VU count from k6's REST API (refreshed each tick)
  private hostCache = { cpu: 0, mem: 0 }; // host CPU/mem % (refreshed each tick)
  private readonly statusPath: string;

  constructor(private readonly opts: HeartbeatOptions) {
    this.statusPath = path.join(opts.liveDir, `${opts.machine}.status.json`);
  }

  start(): void {
    try { fs.mkdirSync(this.opts.liveDir, { recursive: true }); } catch { /* best-effort */ }
    this.startMs = Date.now();
    this.prevMs = this.startMs;
    this.state = 'running';
    void this.refresh();
    this.write(this.state);
    this.timer = setInterval(() => { void this.refresh(); this.write(this.state); }, this.opts.intervalMs ?? 4000);
    if (this.timer.unref) this.timer.unref();
  }

  /** Refresh active VUs (k6 API) + host CPU/mem (best-effort; keep last good values). */
  private async refresh(): Promise<void> {
    const v = await fetchK6Vus();
    if (v !== null) this.vusCache = v;
    try {
      const s = await HostMonitor.captureSnapshot();
      this.hostCache = { cpu: s.cpuPercent, mem: s.memoryPercent };
    } catch { /* monitoring must never break the heartbeat */ }
  }

  /** Reflect a control transition (e.g. 'stopping'/'aborting') immediately. */
  setState(state: LiveState): void {
    this.state = state;
    this.write(state);
  }

  stop(state?: LiveState): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.state = state ?? this.state;
    this.write(this.state);
  }

  private write(state: LiveState): void {
    try {
      const stats = readTransactionCsvStats(this.opts.csvPath);
      const reportDir = path.dirname(this.opts.csvPath);
      const errs = tailNdjson(path.join(reportDir, 'errors.ndjson'), 3);
      const warns = tailNdjson(path.join(reportDir, 'warnings.ndjson'), 3);
      const reqCsv = findRequestCsv(reportDir);
      const req = reqCsv ? readRequestFailure(reqCsv) : { total: 0, failed: 0 };
      const now = Date.now();
      const elapsedSec = Math.max(0.001, (now - this.startMs) / 1000);
      const dt = Math.max(0.001, (now - this.prevMs) / 1000);
      const throughputTps = Math.max(0, (stats.totalCount - this.prevCount) / dt);
      this.prevCount = stats.totalCount;
      this.prevMs = now;

      const transactions = [...stats.perTxn.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, e]) => {
          const h = new RelativeHistogram();
          for (const t of e.times) h.record(t);
          return { name, count: e.count, fail: e.fail, hist: h.toJSON() };
        });

      const snap: LiveStatusSnapshot = {
        schemaVersion: 1,
        machine: this.opts.machine,
        runId: this.opts.runId,
        testId: this.opts.testId,
        updatedAt: new Date().toISOString(),
        state,
        elapsedSec: Math.round(elapsedSec),
        // Real active VUs from k6's REST API. Force 0 in terminal states — after the
        // test there are no active VUs (k6's last reading during ramp-down lingers otherwise).
        currentVus: (state === 'done' || state === 'stopped' || state === 'aborted') ? 0 : this.vusCache,
        transactionsTotal: stats.totalCount,
        failTotal: stats.totalFail,
        errorRate: stats.totalCount ? (stats.totalFail / stats.totalCount) * 100 : 0,
        reqTotal: req.total,
        reqFailed: req.failed,
        throughputTps,
        host: this.hostCache,
        errorCount: errs.count,
        warnCount: warns.count,
        recentErrors: errs.recent,
        recentWarnings: warns.recent,
        stats: this.opts.stats ?? [],
        transactions,
      };

      const tmp = `${this.statusPath}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(snap), 'utf-8');
      fs.renameSync(tmp, this.statusPath);
    } catch (err) {
      Logger.detail(`[live] heartbeat write failed: ${(err as Error).message}`);
    }
  }
}
