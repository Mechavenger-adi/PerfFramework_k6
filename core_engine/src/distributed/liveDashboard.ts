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
import { aggregate, resolveRunContext, findLatestFinalReport, startControllerHostSampling, controllerHost } from './liveAggregate';
import { writeControl, ControlAction } from './control';
import { runMerge } from './runMerge';

export interface DashboardOptions {
  liveDir?: string;
  collectDir?: string;
  runId?: string;
  host: string;
  port: number;
  intervalMs: number;
  /** Auto-merge when all machines finish (default true). */
  autoMerge?: boolean;
  mergeTimeoutSec?: number;
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
  .mergebar{ padding:9px 18px; font-size:13px; font-weight:600; border-bottom:1px solid var(--line); }
  .mergebar.merging{ background:rgba(56,189,248,.12); color:var(--accent); }
  .mergebar.done{ background:rgba(74,222,128,.14); color:var(--run); }
  .mergebar.failed{ background:rgba(248,113,113,.14); color:var(--abort); }
  .mergebar a{ color:inherit; }
  .chartwrap{ background:var(--card); border:1px solid var(--line); border-radius:10px; padding:10px 12px 6px; }
  svg.chart{ width:100%; height:auto; display:block; }
  .legend{ display:flex; gap:16px; font-size:12px; color:var(--dim); margin:6px 2px 0; }
  .legend i{ display:inline-block; width:12px; height:3px; border-radius:2px; margin-right:6px; vertical-align:middle; }
  .events{ display:flex; flex-direction:column; gap:4px; }
  .ev{ font-size:12px; padding:5px 9px; border-radius:6px; border:1px solid var(--line); background:var(--card); white-space:pre-wrap; }
  .ev.err{ border-left:3px solid var(--abort); } .ev.warn{ border-left:3px solid var(--stop); } .ev.none{ color:var(--dim); }
  .ev b{ color:var(--dim); font-weight:600; margin-right:6px; }
  .filter{ padding:6px 10px; margin-bottom:6px; border:1px solid var(--line); border-radius:7px; background:var(--card); color:var(--fg); font:inherit; font-size:13px; width:260px; max-width:100%; }
  thead th:hover{ color:var(--fg); }
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
<div id="mergebar" class="mergebar" style="display:none"></div>
<main>
  <div class="cards" id="kpis"></div>
  <h2>Active VUs &amp; request failure — over time</h2>
  <div class="chartwrap">
    <svg id="chart" class="chart" viewBox="0 0 1000 300" preserveAspectRatio="xMidYMid meet"></svg>
    <div class="legend"><span><i style="background:#38bdf8"></i>Active VUs</span><span><i style="background:#f87171"></i>Request failure %</span></div>
  </div>
  <h2>Fleet</h2><div class="scroll"><table id="fleet"></table></div>
  <h2>Host resources</h2><div class="scroll"><table id="resources"></table></div>
  <h2>Combined transactions</h2>
  <input id="txnFilter" class="filter" placeholder="filter by transaction…" oninput="txnFilter=this.value.toLowerCase(); renderTxns();">
  <div class="scroll"><table id="txns"></table></div>
  <h2>Errors &amp; warnings</h2><div id="events" class="events"></div>
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
const hist=[]; const MAXPTS=600; let frozen=false;
let lastTxns=[], lastStats=[], txnSort='count', txnDir=-1, txnFilter='';
function setSort(k){ if(txnSort===k) txnDir=-txnDir; else { txnSort=k; txnDir=(k==='name')?1:-1; } renderTxns(); }
function renderTxns(){
  const el=document.getElementById('txns'); if(!el) return;
  let rows=lastTxns.filter(r=>!txnFilter || String(r.name).toLowerCase().indexOf(txnFilter)>=0);
  rows=rows.slice().sort((a,b)=>{
    let av,bv;
    if(txnSort==='name'){av=String(a.name);bv=String(b.name);return txnDir*av.localeCompare(bv);}
    else if(txnSort==='count'){av=a.count;bv=b.count;}
    else if(txnSort==='errPct'){av=a.errPct;bv=b.errPct;}
    else {const st=txnSort.slice(5); av=a.values[st]||0; bv=b.values[st]||0;}
    return txnDir*(av-bv);
  });
  const arrow=k=> txnSort===k?(txnDir<0?' ▼':' ▲'):'';
  const th=(k,label)=>'<th data-sort="'+k+'" style="cursor:pointer">'+label+arrow(k)+'</th>';
  let t='<thead><tr>'+th('name','Transaction')+th('count','Count')+th('errPct','Err%');
  for(const st of lastStats) t+=th('stat:'+st, esc(st));
  t+='</tr></thead><tbody>';
  for(const r of rows){ t+='<tr><td>'+esc(r.name)+'</td><td>'+r.count+'</td><td>'+n1(r.errPct)+'</td>'; for(const st of lastStats) t+='<td>'+n0(r.values[st])+'</td>'; t+='</tr>'; }
  t+='</tbody>';
  el.innerHTML=t;
  el.querySelectorAll('th[data-sort]').forEach(function(x){ x.addEventListener('click',function(){ setSort(x.getAttribute('data-sort')); }); });
}
function drawChart(){
  const svg=document.getElementById('chart'); if(!svg) return;
  const W=1000,H=300,mL=46,mR=46,mT=14,mB=26, pw=W-mL-mR, ph=H-mT-mB, axis='#8a93a6';
  if(hist.length<2){ svg.innerHTML='<text x="500" y="150" fill="'+axis+'" text-anchor="middle" font-size="14">collecting…</text>'; return; }
  const t0=hist[0].t, t1=hist[hist.length-1].t, tr=Math.max(1,t1-t0);
  const maxV=Math.max(1,...hist.map(p=>p.vus)), maxE=Math.max(1,...hist.map(p=>p.err));
  const X=t=>mL+((t-t0)/tr)*pw, YV=v=>mT+ph-(v/maxV)*ph, YE=e=>mT+ph-(e/maxE)*ph;
  let g='';
  for(let i=0;i<=4;i++){ const y=mT+ph*(i/4);
    g+='<line x1="'+mL+'" y1="'+y+'" x2="'+(W-mR)+'" y2="'+y+'" stroke="'+axis+'" stroke-opacity="0.15"/>';
    g+='<text x="'+(mL-6)+'" y="'+(y+3)+'" fill="#38bdf8" text-anchor="end" font-size="11">'+(maxV*(1-i/4)).toFixed(0)+'</text>';
    g+='<text x="'+(W-mR+6)+'" y="'+(y+3)+'" fill="#f87171" text-anchor="start" font-size="11">'+(maxE*(1-i/4)).toFixed(1)+'</text>';
  }
  g+='<text x="'+mL+'" y="'+(H-8)+'" fill="'+axis+'" font-size="11">0s</text>';
  g+='<text x="'+(W-mR)+'" y="'+(H-8)+'" fill="'+axis+'" text-anchor="end" font-size="11">'+Math.round(tr/1000)+'s</text>';
  const poly=(fy,color)=>'<polyline fill="none" stroke="'+color+'" stroke-width="2" points="'+hist.map(p=>X(p.t).toFixed(1)+','+fy(p).toFixed(1)).join(' ')+'"/>';
  svg.innerHTML=g+poly(p=>YV(p.vus),'#38bdf8')+poly(p=>YE(p.err),'#f87171');
}
async function tick(){
  let d; try { d = await (await fetch('data.json',{cache:'no-store'})).json(); } catch(e){ return; }
  const badge=document.getElementById('badge');
  badge.textContent = d.allDone ? 'DONE' : 'LIVE'; badge.className='badge '+(d.allDone?'done':'live');
  document.getElementById('ctls').style.display = d.allDone ? 'none' : 'flex';
  const mb=document.getElementById('mergebar'), ms=(d.merge&&d.merge.state)||'idle';
  if(ms==='idle'){ mb.style.display='none'; }
  else { mb.style.display='block'; mb.className='mergebar '+ms;
    if(ms==='merging') mb.textContent='⏳ Merging results into the final report…';
    else if(ms==='done') mb.innerHTML='✅ Final report ready: <code>'+esc(d.merge.report||'')+'</code>';
    else mb.textContent='⚠️ Auto-merge failed — run merge manually.';
  }
  document.getElementById('meta').textContent = d.machineCount+' machine(s) · updated '+new Date(d.updatedAt).toLocaleTimeString();
  const ev=d.events||{errorCount:0,warnCount:0,recentErrors:[],recentWarnings:[]};
  document.getElementById('kpis').innerHTML =
    kpi('Active VUs',d.totals.vus)+kpi('Transactions',d.totals.txns)+kpi('Throughput/s',n1(d.totals.tps))+kpi('Req fail %',n1(d.totals.reqFailRate))+kpi('Errors',ev.errorCount)+kpi('Warnings',ev.warnCount);
  // VUs + failure-rate over time (freeze once all machines finish)
  if(!frozen){ hist.push({t:Date.now(), vus:Number(d.totals.vus)||0, err:Number(d.totals.reqFailRate)||0}); if(hist.length>MAXPTS) hist.shift(); if(d.allDone) frozen=true; }
  drawChart();
  // fleet
  let f='<thead><tr><th>Machine</th><th>State</th><th>Elapsed</th><th>Active VUs</th><th>Txns</th><th>Err%</th><th>TPS</th></tr></thead><tbody>';
  for(const m of d.fleet){ f+='<tr><td>'+esc(m.machine)+'</td><td class="st-'+esc(m.state)+'">'+esc(m.state)+'</td><td>'+m.elapsedSec+'s</td><td>'+m.vus+'</td><td>'+m.txns+'</td><td>'+n1(m.errorRate)+'</td><td>'+n1(m.tps)+'</td></tr>'; }
  f+='</tbody><tfoot><tr><td>TOTAL</td><td></td><td></td><td>'+d.totals.vus+'</td><td>'+d.totals.txns+'</td><td>'+n1(d.totals.errorRate)+'</td><td>'+n1(d.totals.tps)+'</td></tr></tfoot>';
  document.getElementById('fleet').innerHTML=f;
  // host resources (LGs + controller)
  let r='<thead><tr><th>Machine</th><th>CPU %</th><th>Memory %</th></tr></thead><tbody>';
  for(const m of d.fleet){ r+='<tr><td>'+esc(m.machine)+'</td><td>'+n1(m.cpu)+'</td><td>'+n1(m.mem)+'</td></tr>'; }
  if(d.controller){ r+='<tr><td>controller (this)</td><td>'+n1(d.controller.cpu)+'</td><td>'+n1(d.controller.mem)+'</td></tr>'; }
  r+='</tbody>';
  document.getElementById('resources').innerHTML=r;
  // transactions (sortable + filterable; state persists across ticks)
  lastTxns=d.transactions||[]; lastStats=d.stats||[]; renderTxns();
  // errors & warnings (combined, machine-tagged)
  const evRows=(arr,cls)=>arr.map(e=>'<div class="ev '+cls+'"><b>'+esc(e.machine)+'</b>'+esc(e.msg)+'</div>').join('');
  let evHtml=evRows(ev.recentErrors||[],'err')+evRows(ev.recentWarnings||[],'warn');
  if(!evHtml) evHtml='<div class="ev none">no errors or warnings</div>';
  document.getElementById('events').innerHTML=evHtml;
}
tick(); setInterval(tick, INTERVAL);
</script></body></html>`;
}

/** Start the live dashboard HTTP server. Resolves once listening. */
export function startDashboardServer(
  o: { dir: string; host: string; port: number; intervalMs: number; sharedDir?: string; runId?: string; autoMerge?: boolean; mergeTimeoutSec?: number },
): Promise<http.Server> {
  const html = page(o.intervalMs);
  startControllerHostSampling(); // controller's own CPU/mem for the Resources panel
  // Layout is <collectDir>/<runId>/{live,control,shared}; control is a sibling of live.
  const runIdFolder = path.dirname(o.dir);
  const runId = o.runId || path.basename(runIdFolder);
  const controlDir = path.join(runIdFolder, 'control');

  // ── Auto-merge state: fire once when every machine has finished. ──
  let mergeState: 'idle' | 'merging' | 'done' | 'failed' = 'idle';
  let finalReport = '';
  const maybeAutoMerge = async (): Promise<void> => {
    if (o.autoMerge === false || mergeState !== 'idle' || !o.sharedDir || !runId) return;
    const agg = aggregate(o.dir);
    if (agg.machineCount === 0 || !agg.allDone) return;
    mergeState = 'merging';
    Logger.info(`[dashboard] all ${agg.machineCount} machine(s) finished — auto-merging…`);
    const machines = agg.fleet.map((f) => f.machine);
    const ok = await runMerge({ runDir: o.sharedDir, wait: true, machines, pollSec: 3, waitTimeoutSec: o.mergeTimeoutSec ?? 300 });
    finalReport = findLatestFinalReport(o.sharedDir) ?? '';
    mergeState = ok ? 'done' : 'failed';
    Logger.pass(`[dashboard] auto-merge ${mergeState}${finalReport ? ` → ${finalReport}` : ''}`);
  };
  const amTimer = o.autoMerge === false ? null : setInterval(() => { void maybeAutoMerge(); }, Math.max(2000, o.intervalMs));
  if (amTimer?.unref) amTimer.unref();

  const server = http.createServer((req, res) => {
    const url = (req.url || '/').split('?')[0];
    if (req.method === 'POST' && url === '/control') {
      let body = '';
      req.on('data', (c: Buffer) => { body += c; if (body.length > 4096) req.destroy(); });
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
      const body = JSON.stringify({ ...aggregate(o.dir), controller: controllerHost(), merge: { state: mergeState, report: finalReport } });
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
  const ctx = resolveRunContext(o);
  if (!ctx) {
    Logger.fail('[dashboard] provide --live-dir, or --collect-dir together with --run-id');
    process.exit(1);
  }
  try {
    const server = await startDashboardServer({
      dir: ctx.liveDir, host: o.host, port: o.port, intervalMs: o.intervalMs,
      sharedDir: ctx.sharedDir, runId: ctx.runId, autoMerge: o.autoMerge, mergeTimeoutSec: o.mergeTimeoutSec,
    });
    const viewHost = o.host === '0.0.0.0' || o.host === '' ? 'localhost' : o.host;
    const url = `http://${viewHost}:${o.port}/`;
    // OSC 8 hyperlink → clickable in modern terminals (VS Code, Windows Terminal, iTerm).
    const clickable = `\x1b]8;;${url}\x07${url}\x1b]8;;\x07`;
    Logger.header('k6-framework — distributed live dashboard');
    Logger.pass(`Serving at ${clickable}`);
    Logger.detail(`Live dir: ${ctx.liveDir}`);
    Logger.detail(o.autoMerge === false ? 'Auto-merge: off (run `merge` manually).' : 'Auto-merge: on — the final report builds automatically when all machines finish.');
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
