/**
 * monitor.ts
 * Controller (aggregator) side of live monitoring (EDD §Live Monitoring). Polls the
 * shared `live_<runId>/*.status.json` heartbeats and renders a combined live table:
 * summed VUs / transactions / throughput and combined error rate are EXACT; latency
 * is shown per-machine (worst-transaction p95) — a true merged p95 is a post-run,
 * end-of-test number (see EDD §Accuracy). Reads only; no inbound port.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Logger, ansi } from '../utils/logger';
import { LiveStatusSnapshot } from './LiveStatusHeartbeat';

export interface MonitorOptions {
  liveDir?: string;
  collectDir?: string;
  runId?: string;
  intervalMs?: number;
  once?: boolean;
}

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

const padR = (s: string, n: number): string => (s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length));
const padL = (s: string, n: number): string => (s.length >= n ? s : ' '.repeat(n - s.length) + s);

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

  const head = `${padR('MACHINE', 14)} ${padR('STATE', 9)} ${padL('ELAPSED', 8)} ${padL('VUs', 5)} ${padL('TXNS', 8)} ${padL('ERR%', 7)} ${padL('TPS', 8)} ${padL('P95ms', 8)}`;
  out.push(`${ansi.bold}${head}${ansi.reset}`);
  out.push('─'.repeat(head.length));

  let vus = 0;
  let txns = 0;
  let fail = 0;
  let tps = 0;
  for (const s of [...snaps].sort((a, b) => a.machine.localeCompare(b.machine))) {
    vus += s.currentVus;
    txns += s.transactionsTotal;
    fail += s.failTotal;
    tps += s.throughputTps;
    const p95 = s.transactions.length ? Math.max(...s.transactions.map((t) => t.p95)) : 0;
    const c = s.state === 'running' ? ansi.green : s.state === 'aborted' ? ansi.red : s.state === 'stopped' ? ansi.yellow : ansi.dim;
    out.push(
      `${padR(s.machine, 14)} ${c}${padR(s.state, 9)}${ansi.reset} ${padL(`${s.elapsedSec}s`, 8)} ${padL(String(s.currentVus), 5)} ` +
      `${padL(String(s.transactionsTotal), 8)} ${padL(s.errorRate.toFixed(1), 7)} ${padL(s.throughputTps.toFixed(1), 8)} ${padL(p95.toFixed(0), 8)}`,
    );
  }
  out.push('─'.repeat(head.length));
  const errPct = txns ? (fail / txns) * 100 : 0;
  out.push(
    `${ansi.bold}${padR('TOTAL', 14)} ${padR('', 9)} ${padL('', 8)} ${padL(String(vus), 5)} ` +
    `${padL(String(txns), 8)} ${padL(errPct.toFixed(1), 7)} ${padL(tps.toFixed(1), 8)} ${padL('', 8)}${ansi.reset}`,
  );
  out.push('');
  out.push(`${ansi.dim}per-machine P95 = worst transaction (merged P95 is in the final report) · Ctrl+C to exit${ansi.reset}`);
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
