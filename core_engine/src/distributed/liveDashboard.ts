/**
 * liveDashboard.ts
 * Browser-facing live view of a distributed run (EDD §Live Monitoring / Serving).
 * A tiny local HTTP server on the controller serves a self-contained page that polls
 * `/data.json` (the same `aggregate()` the console monitor uses) and re-renders the
 * fleet + combined-transaction tables. Built with a configurable bind host/port:
 * TODAY it binds locally (view on the controller / via RDP); when a firewall port is
 * opened, binding 0.0.0.0 exposes a shareable URL — the same dashboard the future
 * automated controller will serve. Node built-ins only; the page has no external
 * resources (air-gap / CSP safe).
 */

import * as http from 'http';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { aggregate, resolveLiveDir } from './liveAggregate';
import { writeControl, ControlAction } from './control';

export interface DashboardOptions {
  liveDir?: string;
  collectDir?: string;
  runId?: string;
  host: string;
  port: number;
  intervalMs: number;
}

function page(intervalMs: number): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>k6 distributed live monitor</title>
<style>
  :root { color-scheme: light dark; --bg:#0b0e14; --fg:#e6e6e6; --dim:#8a93a6; --line:#232a39; --card:#121722; --run:#4ade80; --stop:#fbbf24; --abort:#f87171; --accent:#38bdf8; }
  @media (prefers-color-scheme: light){ :root{ --bg:#f6f7f9; --fg:#1a1f2b; --dim:#5b6472; --line:#e2e6ee; --card:#fff; } }
  * { box-sizing:border-box; } body{ margin:0; background:var(--bg); color:var(--fg); font:14px/1.4 ui-monospace,Menlo,Consolas,monospace; }
  header{ padding:14px 18px; border-bottom:1px solid var(--line); display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
  h1{ font-size:15px; margin:0; font-weight:600; }
  .badge{ padding:2px 9px; border-radius:999px; font-size:12px; font-weight:600; }
  .live{ background:var(--run); color:#04240f; } .done{ background:var(--dim); color:#000; }
  .meta{ color:var(--dim); font-size:12px; }
  main{ padding:18px; max-width:1100px; margin:0 auto; }
  h2{ font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--accent); margin:22px 0 8px; }
  .cards{ display:flex; gap:12px; flex-wrap:wrap; margin-bottom:6px; }
  .kpi{ background:var(--card); border:1px solid var(--line); border-radius:10px; padding:10px 14px; min-width:120px; }
  .kpi .v{ font-size:20px; font-weight:700; } .kpi .l{ color:var(--dim); font-size:11px; text-transform:uppercase; letter-spacing:.05em; }
  .scroll{ overflow-x:auto; }
  table{ border-collapse:collapse; width:100%; font-size:13px; } th,td{ padding:6px 10px; text-align:right; white-space:nowrap; border-bottom:1px solid var(--line); }
  th:first-child,td:first-child{ text-align:left; } thead th{ color:var(--dim); font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:.04em; }
  .st-running{ color:var(--run); } .st-done{ color:var(--dim); } .st-stopped{ color:var(--stop); } .st-aborted{ color:var(--abort); }
  tfoot td{ font-weight:700; border-top:2px solid var(--line); border-bottom:none; }
  .note{ color:var(--dim); font-size:11px; margin-top:6px; }
  .ctls{ margin-left:auto; display:flex; gap:8px; }
  .ctl{ font:inherit; font-size:12px; font-weight:600; padding:5px 12px; border-radius:7px; border:1px solid var(--line); cursor:pointer; color:var(--fg); background:var(--card); }
  .ctl.stop{ border-color:var(--stop); color:var(--stop); } .ctl.abort{ border-color:var(--abort); color:var(--abort); }
  .ctl:disabled{ opacity:.4; cursor:default; }
</style></head><body>
<header>
  <h1>k6 · distributed live monitor</h1>
  <span id="badge" class="badge live">LIVE</span>
  <span class="meta" id="meta"></span>
  <span class="ctls" id="ctls">
    <button id="btn-stop" class="ctl stop">Stop (graceful)</button>
    <button id="btn-abort" class="ctl abort">Abort</button>
  </span>
</header>
<main>
  <div class="cards" id="kpis"></div>
  <h2>Fleet</h2><div class="scroll"><table id="fleet"></table></div>
  <h2>Combined transactions</h2><div class="scroll"><table id="txns"></table></div>
  <div class="note">Percentiles are histogram-based (≤0.1%); the bit-exact numbers are in the final report. Counts, throughput, min, max and avg are exact.</div>
</main>
<script>
const INTERVAL = ${intervalMs};
const esc = s => String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
async function postControl(action){
  const effectiveAt = action==='stop' ? new Date(Date.now()+10000).toISOString() : undefined;
  try{ await fetch('control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,effectiveAt})}); }catch(e){}
}
document.getElementById('btn-stop').onclick=()=>{ if(confirm('Gracefully STOP the test in ~10s?\\nEach machine finishes in-flight iterations and writes a valid (partial-window) report.')) postControl('stop'); };
document.getElementById('btn-abort').onclick=()=>{ if(confirm('ABORT now?\\nk6 is killed immediately; artifacts are partial and flagged INVALID.')) postControl('abort'); };
const n0 = x => (x==null?'-':Number(x).toFixed(0));
const n1 = x => (x==null?'-':Number(x).toFixed(1));
function kpi(l,v){ return '<div class="kpi"><div class="v">'+v+'</div><div class="l">'+l+'</div></div>'; }
async function tick(){
  let d; try { d = await (await fetch('data.json',{cache:'no-store'})).json(); } catch(e){ return; }
  const badge=document.getElementById('badge');
  badge.textContent = d.allDone ? 'DONE' : 'LIVE'; badge.className='badge '+(d.allDone?'done':'live');
  document.getElementById('ctls').style.display = d.allDone ? 'none' : 'flex';
  document.getElementById('meta').textContent = d.machineCount+' machine(s) · updated '+new Date(d.updatedAt).toLocaleTimeString();
  document.getElementById('kpis').innerHTML =
    kpi('VUs',d.totals.vus)+kpi('Transactions',d.totals.txns)+kpi('Throughput/s',n1(d.totals.tps))+kpi('Error %',n1(d.totals.errorRate));
  // fleet
  let f='<thead><tr><th>Machine</th><th>State</th><th>Elapsed</th><th>VUs</th><th>Txns</th><th>Err%</th><th>TPS</th></tr></thead><tbody>';
  for(const m of d.fleet){ f+='<tr><td>'+esc(m.machine)+'</td><td class="st-'+esc(m.state)+'">'+esc(m.state)+'</td><td>'+m.elapsedSec+'s</td><td>'+m.vus+'</td><td>'+m.txns+'</td><td>'+n1(m.errorRate)+'</td><td>'+n1(m.tps)+'</td></tr>'; }
  f+='</tbody><tfoot><tr><td>TOTAL</td><td></td><td></td><td>'+d.totals.vus+'</td><td>'+d.totals.txns+'</td><td>'+n1(d.totals.errorRate)+'</td><td>'+n1(d.totals.tps)+'</td></tr></tfoot>';
  document.getElementById('fleet').innerHTML=f;
  // transactions
  let t='<thead><tr><th>Transaction</th><th>Count</th><th>Err%</th>';
  for(const st of d.stats) t+='<th>'+esc(st)+'</th>';
  t+='</tr></thead><tbody>';
  for(const r of d.transactions){ t+='<tr><td>'+esc(r.name)+'</td><td>'+r.count+'</td><td>'+n1(r.errPct)+'</td>'; for(const st of d.stats) t+='<td>'+n0(r.values[st])+'</td>'; t+='</tr>'; }
  t+='</tbody>';
  document.getElementById('txns').innerHTML=t;
}
tick(); setInterval(tick, INTERVAL);
</script></body></html>`;
}

/** Start the live dashboard HTTP server. Resolves once listening. */
export function startDashboardServer(o: { dir: string; host: string; port: number; intervalMs: number }): Promise<http.Server> {
  const html = page(o.intervalMs);
  // Control dir is the sibling of live_<runId>: control_<runId>.
  const base = path.basename(o.dir);
  const runId = base.startsWith('live_') ? base.slice('live_'.length) : '';
  const controlDir = path.join(path.dirname(o.dir), `control_${runId}`);

  const server = http.createServer((req, res) => {
    const url = (req.url || '/').split('?')[0];
    if (req.method === 'POST' && url === '/control') {
      let body = '';
      req.on('data', (c) => { body += c; if (body.length > 4096) req.destroy(); });
      req.on('end', () => {
        try {
          const { action, effectiveAt } = JSON.parse(body || '{}') as { action?: ControlAction; effectiveAt?: string };
          if (action !== 'abort' && action !== 'stop') { res.writeHead(400); res.end('{"ok":false}'); return; }
          const p = writeControl(controlDir, { action, effectiveAt, by: 'dashboard' });
          Logger.warning(`[dashboard] ${action} signal written → ${p}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, action }));
        } catch {
          res.writeHead(400); res.end('{"ok":false}');
        }
      });
      return;
    }
    if (url === '/data.json') {
      const body = JSON.stringify(aggregate(o.dir));
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(body);
      return;
    }
    if (url === '/' || url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
  });
  return new Promise<http.Server>((resolve, reject) => {
    server.once('error', reject);
    server.listen(o.port, o.host, () => { server.removeListener('error', reject); resolve(server); });
  });
}

/** CLI handler for `k6-framework monitor --serve`. Keeps running until interrupted. */
export async function runDashboardCli(o: DashboardOptions): Promise<void> {
  const dir = resolveLiveDir(o);
  if (!dir) {
    Logger.fail('[dashboard] provide --live-dir, or --collect-dir together with --run-id');
    process.exit(1);
  }
  try {
    const server = await startDashboardServer({ dir: dir as string, host: o.host, port: o.port, intervalMs: o.intervalMs });
    const viewHost = o.host === '0.0.0.0' || o.host === '' ? 'localhost' : o.host;
    Logger.header('k6-framework — distributed live dashboard');
    Logger.pass(`Serving at http://${viewHost}:${o.port}/`);
    Logger.detail(`Live dir: ${dir}`);
    if (o.host === '0.0.0.0') Logger.detail('Bound to all interfaces — shareable across the network once the firewall port is open.');
    else Logger.detail('Bound locally — view on this machine (open a port + `--host 0.0.0.0` to share).');
    Logger.detail('Ctrl+C to stop.');
    const shutdown = (): void => { server.close(() => process.exit(0)); };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'EADDRINUSE') Logger.fail(`[dashboard] port ${o.port} already in use on ${o.host}`);
    else if (e.code === 'EADDRNOTAVAIL') Logger.fail(`[dashboard] cannot bind ${o.host} — no such interface`);
    else Logger.fail(`[dashboard] failed to start: ${e.message}`);
    process.exit(1);
  }
}
