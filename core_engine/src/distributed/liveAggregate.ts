/**
 * liveAggregate.ts
 * Shared live aggregation for the distributed monitor (console) and the live
 * dashboard (HTTP). Reads the `live_<runId>/*.status.json` heartbeats and merges them
 * into one combined view: fleet health + per-transaction metrics (counts/min/max/avg
 * exact; percentiles off the merged histogram, ≤0.1%). Single source of truth so the
 * console and the browser show identical numbers.
 */

import * as fs from 'fs';
import * as path from 'path';
import { RelativeHistogram } from '../reporting/Histogram';
import { LiveStatusSnapshot } from './LiveStatusHeartbeat';
import { HostMonitor } from '../execution/HostMonitor';

// ── Controller's own host resources — sampled on a cached cadence so the (sync)
// aggregate/render never blocks on the ~250ms CPU read. ──
let ctrlHost = { cpu: 0, mem: 0 };
let ctrlTimer: NodeJS.Timeout | null = null;
export function startControllerHostSampling(intervalMs = 4000): void {
  if (ctrlTimer) return;
  const tick = async (): Promise<void> => {
    try { const s = await HostMonitor.captureSnapshot(); ctrlHost = { cpu: s.cpuPercent, mem: s.memoryPercent }; } catch { /* never break monitoring */ }
  };
  void tick();
  ctrlTimer = setInterval(() => void tick(), intervalMs);
  ctrlTimer.unref?.();
}
export function controllerHost(): { cpu: number; mem: number } { return ctrlHost; }

export const DEFAULT_STATS = ['avg', 'min', 'max', 'p(90)', 'p(95)', 'p(99)'];

export interface LiveAggregate {
  updatedAt: string;
  allDone: boolean;
  machineCount: number;
  stats: string[];
  fleet: Array<{ machine: string; state: string; elapsedSec: number; vus: number; txns: number; errorRate: number; tps: number; cpu: number; mem: number }>;
  totals: { vus: number; txns: number; errorRate: number; tps: number };
  transactions: Array<{ name: string; count: number; fail: number; errPct: number; values: Record<string, number> }>;
  /** Combined errors/warnings across machines: totals + recent messages (machine-tagged). */
  events: {
    errorCount: number;
    warnCount: number;
    recentErrors: Array<{ machine: string; msg: string }>;
    recentWarnings: Array<{ machine: string; msg: string }>;
  };
  /** The controller's own host resources (filled in by the monitor/dashboard). */
  controller?: { cpu: number; mem: number };
}

export function resolveLiveDir(o: { liveDir?: string; collectDir?: string; runId?: string }): string | null {
  if (o.liveDir) return path.resolve(o.liveDir);
  if (o.collectDir && o.runId) return path.resolve(o.collectDir, o.runId, 'live');
  return null;
}

export interface RunContext { liveDir: string; sharedDir: string; runId: string; }

/** Resolve the live/shared dirs (+ runId) under <collectDir>/<runId>/ for a monitor/auto-merge. */
export function resolveRunContext(o: { liveDir?: string; collectDir?: string; runId?: string }): RunContext | null {
  if (o.collectDir && o.runId) {
    const base = path.join(path.resolve(o.collectDir), o.runId);
    return { liveDir: path.join(base, 'live'), sharedDir: path.join(base, 'shared'), runId: o.runId };
  }
  if (o.liveDir) {
    // Expect <collectDir>/<runId>/live → runId is the parent folder's name.
    const live = path.resolve(o.liveDir);
    const runIdFolder = path.dirname(live);
    return { liveDir: live, sharedDir: path.join(runIdFolder, 'shared'), runId: o.runId || path.basename(runIdFolder) };
  }
  return null;
}

/** The newest Final_… report under a shared dir, or null. */
export function findLatestFinalReport(sharedDir: string): string | null {
  try {
    const finals = fs.readdirSync(sharedDir).filter((f) => f.startsWith('Final_')).map((f) => path.join(sharedDir, f));
    if (finals.length === 0) return null;
    finals.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    return path.join(finals[0], 'RunReport.html');
  } catch {
    return null;
  }
}

export function readSnapshots(dir: string): LiveStatusSnapshot[] {
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

function statValue(stat: string, hist: RelativeHistogram): number {
  const s = stat.trim().toLowerCase();
  if (s === 'avg') return hist.mean;
  if (s === 'min') return Number.isFinite(hist.min) ? hist.min : 0;
  if (s === 'max') return Number.isFinite(hist.max) ? hist.max : 0;
  const frac = statToFraction(s);
  return frac !== null ? hist.valueAtPercentile(frac) : 0;
}

/** Keep only stats a response-time histogram can produce (drop count/pass/fail/std/etc). */
export function timingStats(stats: string[]): string[] {
  const kept = stats.filter((st) => {
    const s = st.trim().toLowerCase();
    return s === 'avg' || s === 'min' || s === 'max' || s === 'med' || statToFraction(s) !== null;
  });
  return kept.length ? kept : DEFAULT_STATS;
}

interface MergedTxn { name: string; count: number; fail: number; hist: RelativeHistogram | null; }

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

/** Merge all heartbeats in `dir` into one combined live view. */
export function aggregate(dir: string): LiveAggregate {
  const snaps = readSnapshots(dir);
  const stats = timingStats((snaps.find((s) => s.stats && s.stats.length)?.stats) ?? DEFAULT_STATS);

  const fleet = [...snaps].sort((a, b) => a.machine.localeCompare(b.machine)).map((s) => ({
    machine: s.machine, state: s.state, elapsedSec: s.elapsedSec, vus: s.currentVus,
    txns: s.transactionsTotal, errorRate: s.errorRate, tps: s.throughputTps,
    cpu: s.host?.cpu ?? 0, mem: s.host?.mem ?? 0,
  }));

  let vus = 0; let txns = 0; let fail = 0; let tps = 0;
  let errorCount = 0; let warnCount = 0;
  const recentErrors: Array<{ machine: string; msg: string }> = [];
  const recentWarnings: Array<{ machine: string; msg: string }> = [];
  for (const s of snaps) {
    vus += s.currentVus; txns += s.transactionsTotal; fail += s.failTotal; tps += s.throughputTps;
    errorCount += s.errorCount ?? 0;
    warnCount += s.warnCount ?? 0;
    for (const m of s.recentErrors ?? []) recentErrors.push({ machine: s.machine, msg: m });
    for (const m of s.recentWarnings ?? []) recentWarnings.push({ machine: s.machine, msg: m });
  }

  const transactions = mergeTransactions(snaps).map((t) => {
    const values: Record<string, number> = {};
    for (const st of stats) values[st] = t.hist ? statValue(st, t.hist) : 0;
    return { name: t.name, count: t.count, fail: t.fail, errPct: t.count ? (t.fail / t.count) * 100 : 0, values };
  });

  return {
    updatedAt: new Date().toISOString(),
    allDone: snaps.length > 0 && !snaps.some((s) => s.state === 'running'),
    machineCount: snaps.length,
    stats,
    fleet,
    totals: { vus, txns, errorRate: txns ? (fail / txns) * 100 : 0, tps },
    transactions,
    events: { errorCount, warnCount, recentErrors: recentErrors.slice(-8), recentWarnings: recentWarnings.slice(-8) },
  };
}
