/**
 * monitor.ts
 * Controller (aggregator) console view of a distributed run. Renders two live panels
 * from the shared heartbeats (see liveAggregate): FLEET (per-machine health) and
 * COMBINED TRANSACTIONS (merged across machines). Reads only; no inbound port. The
 * browser equivalent is liveDashboard.ts — both share `aggregate()`.
 */

import { Logger, ansi } from '../utils/logger';
import { aggregate, resolveRunContext, LiveAggregate } from './liveAggregate';
import { runMerge } from './runMerge';

export interface MonitorOptions {
  liveDir?: string;
  collectDir?: string;
  runId?: string;
  intervalMs?: number;
  once?: boolean;
  /** Auto-merge when all machines finish (default true). */
  autoMerge?: boolean;
  mergeTimeoutSec?: number;
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

/** CLI handler for `k6-framework monitor` (console). Auto-merges when all machines finish. */
export async function runMonitor(o: MonitorOptions): Promise<boolean> {
  const ctx = resolveRunContext(o);
  if (!ctx) {
    Logger.fail('[monitor] provide --live-dir, or --collect-dir together with --run-id');
    return false;
  }
  const intervalMs = o.intervalMs ?? 3000;
  const autoMerge = o.autoMerge !== false;

  return new Promise<boolean>((resolve) => {
    let timer: NodeJS.Timeout | null = null;
    let ended = false;
    const finish = (v: boolean): void => { if (ended) return; ended = true; if (timer) clearInterval(timer); resolve(v); };
    const tick = async (): Promise<void> => {
      if (ended) return;
      const agg = aggregate(ctx.liveDir);
      process.stdout.write('\x1b[2J\x1b[H');
      process.stdout.write(render(agg, ctx.liveDir));
      if (o.once) { finish(true); return; }
      if (agg.allDone) {
        ended = true; // stop further ticks before the (awaited) merge
        if (timer) clearInterval(timer);
        if (autoMerge && ctx.runId) {
          const machines = agg.fleet.map((f) => f.machine);
          Logger.info(`\n[monitor] all ${machines.length} machine(s) finished — auto-merging…`);
          const ok = await runMerge({ runDir: ctx.sharedDir, wait: true, machines, pollSec: 3, waitTimeoutSec: o.mergeTimeoutSec ?? 300 });
          resolve(ok);
        } else {
          resolve(true);
        }
      }
    };
    process.on('SIGINT', () => finish(true));
    void tick();
    if (!o.once) timer = setInterval(() => void tick(), intervalMs);
  });
}
