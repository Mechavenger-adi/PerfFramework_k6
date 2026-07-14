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
import { readTransactionCsvStats } from './transactionCsv';

export type LiveState = 'running' | 'stopping' | 'aborting' | 'done' | 'stopped' | 'aborted';

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
  /** Windowed (current) transaction throughput, txn/s. */
  throughputTps: number;
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
  private readonly statusPath: string;

  constructor(private readonly opts: HeartbeatOptions) {
    this.statusPath = path.join(opts.liveDir, `${opts.machine}.status.json`);
  }

  start(): void {
    try { fs.mkdirSync(this.opts.liveDir, { recursive: true }); } catch { /* best-effort */ }
    this.startMs = Date.now();
    this.prevMs = this.startMs;
    this.state = 'running';
    this.write(this.state);
    this.timer = setInterval(() => this.write(this.state), this.opts.intervalMs ?? 4000);
    if (this.timer.unref) this.timer.unref();
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
        currentVus: stats.lastVus,
        transactionsTotal: stats.totalCount,
        failTotal: stats.totalFail,
        errorRate: stats.totalCount ? (stats.totalFail / stats.totalCount) * 100 : 0,
        throughputTps,
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
