/**
 * monitor.ts
 * Controller (aggregator) console view of a distributed run. Renders two live panels
 * from the shared heartbeats (see liveAggregate): FLEET (per-machine health) and
 * COMBINED TRANSACTIONS (merged across machines). Reads only; no inbound port. The
 * browser equivalent is liveDashboard.ts — both share `aggregate()`.
 */

import { Logger, ansi } from '../utils/logger';
import { aggregate, resolveLiveDir, LiveAggregate } from './liveAggregate';

export interface MonitorOptions {
  liveDir?: string;
  collectDir?: string;
  runId?: string;
  intervalMs?: number;
  once?: boolean;
}

const padR = (s: string, n: number): string => (s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length));
const padL = (s: string, n: number): string => (s.length >= n ? s : ' '.repeat(n - s.length) + s);

function render(agg: LiveAggregate, dir: string): string {
  const out: string[] = [];
  out.push(`${ansi.bold}${ansi.cyan}k6-framework — distributed live monitor${ansi.reset}`);
  out.push(`${ansi.dim}${dir}  ·  ${new Date().toLocaleTimeString()}${ansi.reset}`);
  out.push('');
  if (agg.machineCount === 0) {
    out.push(`${ansi.dim}waiting for machines to report…${ansi.reset}`);
    out.push('');
    out.push(`${ansi.dim}Ctrl+C to exit${ansi.reset}`);
    return out.join('\n') + '\n';
  }

  // ── FLEET ──
  const fhead = `${padR('MACHINE', 14)} ${padR('STATE', 9)} ${padL('ELAPSED', 8)} ${padL('VUs', 5)} ${padL('TXNS', 8)} ${padL('ERR%', 7)} ${padL('TPS', 8)}`;
  out.push(`${ansi.bold}FLEET${ansi.reset}`);
  out.push(`${ansi.bold}${fhead}${ansi.reset}`);
  out.push('─'.repeat(fhead.length));
  for (const m of agg.fleet) {
    const c = m.state === 'running' ? ansi.green : m.state === 'aborted' ? ansi.red : m.state === 'stopped' ? ansi.yellow : ansi.dim;
    out.push(
      `${padR(m.machine, 14)} ${c}${padR(m.state, 9)}${ansi.reset} ${padL(`${m.elapsedSec}s`, 8)} ${padL(String(m.vus), 5)} ` +
      `${padL(String(m.txns), 8)} ${padL(m.errorRate.toFixed(1), 7)} ${padL(m.tps.toFixed(1), 8)}`,
    );
  }
  out.push('─'.repeat(fhead.length));
  out.push(`${ansi.bold}${padR('TOTAL', 14)} ${padR('', 9)} ${padL('', 8)} ${padL(String(agg.totals.vus), 5)} ${padL(String(agg.totals.txns), 8)} ${padL(agg.totals.errorRate.toFixed(1), 7)} ${padL(agg.totals.tps.toFixed(1), 8)}${ansi.reset}`);

  // ── COMBINED TRANSACTIONS ──
  out.push('');
  out.push(`${ansi.bold}COMBINED TRANSACTIONS${ansi.reset} ${ansi.dim}(merged across machines; percentiles ≤0.1% — exact in the final report)${ansi.reset}`);
  let thead = `${padR('TRANSACTION', 22)} ${padL('COUNT', 7)} ${padL('ERR%', 7)}`;
  for (const st of agg.stats) thead += ` ${padL(st, 8)}`;
  out.push(`${ansi.bold}${thead}${ansi.reset}`);
  out.push('─'.repeat(thead.length));
  for (const t of agg.transactions) {
    let row = `${padR(t.name, 22)} ${padL(String(t.count), 7)} ${padL(t.errPct.toFixed(1), 7)}`;
    for (const st of agg.stats) row += ` ${padL((t.values[st] ?? 0).toFixed(0), 8)}`;
    out.push(row);
  }

  out.push('');
  out.push(`${ansi.dim}Ctrl+C to exit · refreshes automatically${ansi.reset}`);
  return out.join('\n') + '\n';
}

/** CLI handler for `k6-framework monitor` (console). Resolves true when all machines finish. */
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
      const agg = aggregate(dir);
      process.stdout.write('\x1b[2J\x1b[H');
      process.stdout.write(render(agg, dir));
      if (o.once || agg.allDone) finish();
    };
    process.on('SIGINT', finish);
    tick();
    if (!o.once) timer = setInterval(tick, intervalMs);
  });
}
