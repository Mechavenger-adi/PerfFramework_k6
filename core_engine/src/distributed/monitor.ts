/**
 * monitor.ts
 * Controller (aggregator) side of live monitoring (EDD §Live Monitoring). Polls the
 * shared `live_<runId>/*.status.json` heartbeats and renders two live panels:
 *   • FLEET — per-machine health (state, VUs, throughput, error rate) to catch a
 *     lagging/saturated LG.
 *   • COMBINED TRANSACTIONS — per transaction merged across machines: count, err%,
 *     and the configured stats (avg/min/max/p90/p95/p99). Counts/min/max/avg are
 *     EXACT; percentiles come from the merged histogram (≤0.1%). The bit-exact
 *     numbers are the final report's. Reads only; no inbound port.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Logger, ansi } from '../utils/logger';
import { RelativeHistogram } from '../reporting/Histogram';
import { LiveStatusSnapshot } from './LiveStatusHeartbeat';

export interface MonitorOptions {
  liveDir?: string;
  collectDir?: string;
  runId?: string;
  intervalMs?: number;
  once?: boolean;
}

const DEFAULT_STATS = ['avg', 'min', 'max', 'p(90)', 'p(95)', 'p(99)'];

function resolveLiveDir(o: MonitorOptions): string | null {
  if (o.liveDir) return path.resolve(o.liveDir);
  if (o.collectDir && o.runId) return path.resolve(o.collectDir, `live_${o.runId}`);
  return null;
}

function readSnapshots(dir: string): LiveStatusSnapshot[] {
  try {
    return fs.readdirSync(dir)
      .filter((f) => f.endsWith('.status.json'))
      .map((f) => {
        try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as LiveStatusSnapshot; } catch { return null; }
      })
      .filter((x): x is LiveStatusSnapshot => x !== null);
  } catch {
    return [];
  }
}

/** Parse a stat label into a percentile fraction in [0,1], or null if not a percentile. */
function statToFraction(stat: string): number | null {
  const s = stat.trim().toLowerCase();
  if (s === 'med') return 0.5;
  const m = s.match(/^p\(?([\d.]+)\)?$/);
  if (m) { const n = parseFloat(m[1]); if (Number.isFinite(n) && n >= 0 && n <= 100) return n / 100; }
  return null;
}

/** Value of a stat label from a merged histogram (avg/min/max handled directly). */
function statValue(stat: string, hist: RelativeHistogram): number {
  const s = stat.trim().toLowerCase();
  if (s === 'avg') return hist.mean;
  if (s === 'min') return Number.isFinite(hist.min) ? hist.min : 0;
  if (s === 'max') return Number.isFinite(hist.max) ? hist.max : 0;
  const frac = statToFraction(s);
  return frac !== null ? hist.valueAtPercentile(frac) : 0;
}

interface MergedTxn { name: string; count: number; fail: number; hist: RelativeHistogram | null; }

/** Merge per-transaction histograms + counts across all machines. */
function mergeTransactions(snaps: LiveStatusSnapshot[]): MergedTxn[] {
  const byName = new Map<string, MergedTxn>();
  for (const snap of snaps) {
    for (const t of snap.transactions ?? []) {
      let e = byName.get(t.name);
      if (!e) { e = { name: t.name, count: 0, fail: 0, hist: null }; byName.set(t.name, e); }
      e.count += t.count;
      e.fail += t.fail;
      const h = RelativeHistogram.fromJSON(t.hist);
      if (!e.hist) e.hist = h; else e.hist.merge(h);
    }
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const padR = (s: string, n: number): string => (s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length));
const padL = (s: string, n: number): string => (s.length >= n ? s : ' '.repeat(n - s.length) + s);

function renderFleet(snaps: LiveStatusSnapshot[], out: string[]): void {
  const head = `${padR('MACHINE', 14)} ${padR('STATE', 9)} ${padL('ELAPSED', 8)} ${padL('VUs', 5)} ${padL('TXNS', 8)} ${padL('ERR%', 7)} ${padL('TPS', 8)}`;
  out.push(`${ansi.bold}FLEET${ansi.reset}`);
  out.push(`${ansi.bold}${head}${ansi.reset}`);
  out.push('─'.repeat(head.length));
  let vus = 0; let txns = 0; let fail = 0; let tps = 0;
  for (const s of [...snaps].sort((a, b) => a.machine.localeCompare(b.machine))) {
    vus += s.currentVus; txns += s.transactionsTotal; fail += s.failTotal; tps += s.throughputTps;
    const c = s.state === 'running' ? ansi.green : s.state === 'aborted' ? ansi.red : s.state === 'stopped' ? ansi.yellow : ansi.dim;
    out.push(
      `${padR(s.machine, 14)} ${c}${padR(s.state, 9)}${ansi.reset} ${padL(`${s.elapsedSec}s`, 8)} ${padL(String(s.currentVus), 5)} ` +
      `${padL(String(s.transactionsTotal), 8)} ${padL(s.errorRate.toFixed(1), 7)} ${padL(s.throughputTps.toFixed(1), 8)}`,
    );
  }
  out.push('─'.repeat(head.length));
  const errPct = txns ? (fail / txns) * 100 : 0;
  out.push(`${ansi.bold}${padR('TOTAL', 14)} ${padR('', 9)} ${padL('', 8)} ${padL(String(vus), 5)} ${padL(String(txns), 8)} ${padL(errPct.toFixed(1), 7)} ${padL(tps.toFixed(1), 8)}${ansi.reset}`);
}

/** Keep only stats a response-time histogram can produce (drop count/pass/fail/std/etc). */
function timingStats(stats: string[]): string[] {
  const kept = stats.filter((st) => {
    const s = st.trim().toLowerCase();
    return s === 'avg' || s === 'min' || s === 'max' || s === 'med' || statToFraction(s) !== null;
  });
  return kept.length ? kept : DEFAULT_STATS;
}

function renderTransactions(snaps: LiveStatusSnapshot[], out: string[]): void {
  const stats = timingStats((snaps.find((s) => s.stats && s.stats.length)?.stats) ?? DEFAULT_STATS);
  const merged = mergeTransactions(snaps);
  out.push('');
  out.push(`${ansi.bold}COMBINED TRANSACTIONS${ansi.reset} ${ansi.dim}(merged across machines; percentiles ≤0.1% — exact in the final report)${ansi.reset}`);
  let head = `${padR('TRANSACTION', 22)} ${padL('COUNT', 7)} ${padL('ERR%', 7)}`;
  for (const st of stats) head += ` ${padL(st, 8)}`;
  out.push(`${ansi.bold}${head}${ansi.reset}`);
  out.push('─'.repeat(head.length));
  for (const t of merged) {
    const errPct = t.count ? (t.fail / t.count) * 100 : 0;
    let row = `${padR(t.name, 22)} ${padL(String(t.count), 7)} ${padL(errPct.toFixed(1), 7)}`;
    for (const st of stats) row += ` ${padL(t.hist ? statValue(st, t.hist).toFixed(0) : '-', 8)}`;
    out.push(row);
  }
}

function render(snaps: LiveStatusSnapshot[], dir: string): string {
  const out: string[] = [];
  out.push(`${ansi.bold}${ansi.cyan}k6-framework — distributed live monitor${ansi.reset}`);
  out.push(`${ansi.dim}${dir}  ·  ${new Date().toLocaleTimeString()}${ansi.reset}`);
  out.push('');
  if (snaps.length === 0) {
    out.push(`${ansi.dim}waiting for machines to report…${ansi.reset}`);
    out.push('');
    out.push(`${ansi.dim}Ctrl+C to exit${ansi.reset}`);
    return out.join('\n') + '\n';
  }
  renderFleet(snaps, out);
  renderTransactions(snaps, out);
  out.push('');
  out.push(`${ansi.dim}Ctrl+C to exit · refreshes automatically${ansi.reset}`);
  return out.join('\n') + '\n';
}

/** CLI handler for `k6-framework monitor`. Resolves true when all machines have finished. */
export async function runMonitor(o: MonitorOptions): Promise<boolean> {
  const dir = resolveLiveDir(o);
  if (!dir) {
    Logger.fail('[monitor] provide --live-dir, or --collect-dir together with --run-id');
    return false;
  }
  const intervalMs = o.intervalMs ?? 3000;

  return new Promise<boolean>((resolve) => {
    let timer: NodeJS.Timeout | null = null;
    const finish = (): void => { if (timer) clearInterval(timer); resolve(true); };
    const tick = (): void => {
      const snaps = readSnapshots(dir);
      process.stdout.write('\x1b[2J\x1b[H'); // clear screen + home
      process.stdout.write(render(snaps, dir));
      const allDone = snaps.length > 0 && !snaps.some((s) => s.state === 'running');
      if (o.once || allDone) finish();
    };
    process.on('SIGINT', finish);
    tick();
    if (!o.once) timer = setInterval(tick, intervalMs);
  });
}
