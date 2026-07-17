import { ReportBundle } from '../types/ReportingContracts';

export class RunReportGenerator {
  static generate(bundle: ReportBundle): string {
    const serialized = JSON.stringify(bundle).replace(/</g, '\\u003c');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Run Report - ${this.escapeHtml(bundle.meta.plan)}</title>
  <style>
    :root {
      --bg: #f7f8fb;
      --bg-2: #eef1f7;
      --panel: #ffffff;
      --ink: #1b2735;
      --muted: #6b7888;
      --accent: #0e7490;
      --accent-2: #0891b2;
      --accent-soft: #e6f4f9;
      --border: #e8ebf2;
      --border-soft: #f1f4f8;
      --warn: #b45309;
      --error: #dc2626;
      --ok: #15803d;
      --shadow: 0 1px 2px rgba(16,24,40,.03), 0 6px 22px rgba(16,24,40,.05);
      --shadow-lg: 0 2px 6px rgba(16,24,40,.04), 0 18px 50px rgba(16,24,40,.09);
      --radius: 16px;
      --radius-sm: 11px;
    }
    [data-theme="dark"] {
      --bg: #0f141a; --bg-2: #222c38; --panel: #18212b; --ink: #e6edf3; --muted: #9aa7b4;
      --accent: #22d3ee; --accent-2: #38bdf8; --accent-soft: #0e2a33; --border: #39424f; --border-soft: #2a3340;
      --warn: #fbbf24; --error: #f87171; --ok: #34d399;
      --shadow: 0 1px 2px rgba(0,0,0,.5), 0 12px 32px rgba(0,0,0,.55);
    }
    [data-theme="dark"] thead th { background: #1b232e; }
    [data-theme="dark"] tbody tr:nth-child(even) td { background: #121822; }
    [data-theme="dark"] .status.failed  { background: #3a1a1a; color: var(--error); }
    [data-theme="dark"] .status.passed  { background: #12321f; color: var(--ok); }
    [data-theme="dark"] .status.warning { background: #33270d; color: var(--warn); }
    [data-theme="dark"] .status-banner.failed  { background: linear-gradient(90deg,#2a1414,var(--panel) 60%); }
    [data-theme="dark"] .status-banner.passed  { background: linear-gradient(90deg,#0f2417,var(--panel) 60%); }
    [data-theme="dark"] .status-banner.warning { background: linear-gradient(90deg,#2a2110,var(--panel) 60%); }
    [data-theme="dark"] .global-toolbar { background: rgba(22,29,39,0.94); }
    [data-theme="dark"] input, [data-theme="dark"] select { background: var(--bg-2); color: var(--ink); }
    [data-theme="dark"] input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(1) brightness(1.4); cursor: pointer; }
    [data-theme="dark"] .modal-panel, [data-theme="dark"] .modal-body pre { background: var(--panel); }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Inter", "Segoe UI", Tahoma, system-ui, sans-serif;
      background: var(--bg);
      color: var(--ink);
      font-size: 14px;
      line-height: 1.5;
      letter-spacing: -.003em;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    /* ── App shell: fixed left sidebar + scrollable main ── */
    .app { display: flex; min-height: 100vh; }
    .sidebar {
      position: sticky; top: 0; align-self: flex-start; height: 100vh; z-index: 60;
      width: 62px; flex: 0 0 62px; background: var(--panel); border-right: 1px solid var(--border);
      display: flex; flex-direction: column; padding: 14px 8px; gap: 4px; overflow: hidden;
      transition: width .18s ease, flex-basis .18s ease;
    }
    .sidebar:hover { width: 212px; flex-basis: 212px; box-shadow: 6px 0 28px rgba(0,0,0,.10); }
    .brand { display: flex; align-items: center; gap: 10px; padding: 6px 10px 14px; font-weight: 700; font-size: 17px; letter-spacing: -.01em; }
    .brand-mark { font-size: 20px; flex: 0 0 22px; text-align: center; }
    /* Labels fade in only when the rail is expanded (hover). */
    .brand-name, .tab-lbl, .tt-lbl { white-space: nowrap; opacity: 0; transition: opacity .12s ease; }
    .sidebar:hover .brand-name, .sidebar:hover .tab-lbl, .sidebar:hover .tt-lbl { opacity: 1; }
    .sidebar-foot { margin-top: auto; padding: 10px 4px 4px; border-top: 1px solid var(--border-soft); }
    .theme-toggle {
      width: 100%; border: 1px solid var(--border); background: var(--bg-2); color: var(--ink);
      border-radius: 10px; padding: 9px 0; cursor: pointer; font: inherit; font-size: 13px; font-weight: 600;
      display: flex; align-items: center; gap: 8px; justify-content: flex-start; padding-left: 13px;
    }
    .theme-toggle:hover { border-color: var(--accent); color: var(--accent); }
    .main { flex: 1 1 auto; min-width: 0; max-width: 1440px; margin: 0 auto; padding: 32px 36px 88px; width: 100%; }
    /* #2: compact hero strip */
    .hero {
      background: var(--panel); border: 1px solid var(--border-soft); border-radius: var(--radius);
      padding: 18px 24px; box-shadow: var(--shadow);
      display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
    }
    .hero h1 { margin: 0; font-size: 21px; font-weight: 700; letter-spacing: -.02em; flex-shrink: 0; }
    .meta { color: var(--muted); display: flex; gap: 18px; flex-wrap: wrap; font-size: 12.5px; margin-left: auto; }
    .status {
      display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 999px; font-weight: 700; font-size: 12px;
      background: var(--accent-soft); color: var(--accent); text-transform: uppercase; letter-spacing: .05em; flex-shrink: 0;
    }
    .status.failed { background: #fee2e2; color: var(--error); }
    .status.passed { background: #dcfce7; color: var(--ok); }
    .status.warning { background: #fef3c7; color: var(--warn); }
    /* Sidebar nav: vertical icon+label rows. buildTabs() fills #tabs. */
    .tabs { display: flex; flex-direction: column; gap: 2px; }
    .tab-btn {
      text-align: left; border: 1px solid transparent; background: transparent; color: var(--muted);
      padding: 10px 9px; border-radius: 9px; cursor: pointer; font-weight: 600; font-size: 14px;
      transition: background .15s ease, color .15s ease; display: flex; align-items: center; gap: 11px;
    }
    .tab-ico { flex: 0 0 22px; text-align: center; font-size: 16px; }
    .tab-btn:hover { background: var(--bg-2); color: var(--ink); }
    .tab-btn.active { background: var(--accent); color: white; border-color: var(--accent); }
    @media (max-width: 860px) {
      .app { flex-direction: column; }
      .sidebar, .sidebar:hover { position: static; height: auto; width: auto; flex: none; flex-direction: row; flex-wrap: wrap; align-items: center; border-right: none; border-bottom: 1px solid var(--border); overflow: visible; box-shadow: none; }
      .brand { padding: 6px 12px; }
      .brand-name, .tab-lbl, .tt-lbl { opacity: 1; }
      .tabs { flex-direction: row; flex-wrap: wrap; flex: 1; }
      .sidebar-foot { margin: 0; border-top: none; padding: 6px; }
      .theme-toggle { width: auto; }
      .main { padding: 16px 12px 48px; }
    }
    .tab-panel {
      display: none; background: var(--panel);
      border: 1px solid var(--border-soft); border-radius: var(--radius); padding: 26px; box-shadow: var(--shadow);
    }
    .tab-panel.active { display: block; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 26px; }
    .card {
      background: var(--panel); border: 1px solid var(--border-soft); border-radius: 14px; padding: 18px 20px;
      box-shadow: var(--shadow); transition: transform .16s ease, box-shadow .16s ease;
      min-width: 0; /* allow grid/flex children to shrink so wide tables scroll INSIDE the card instead of overflowing the page */
    }
    .card:hover { transform: translateY(-1px); box-shadow: var(--shadow-lg); }
    .card h3 { margin: 0 0 10px; font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; font-weight: 600; }
    .card strong { font-size: 27px; font-weight: 700; letter-spacing: -.02em; color: var(--ink); }
    /* ── Phase 3: KPI cards (sparkline + trend + state) ── */
    .kpi .kpi-row { display: flex; align-items: baseline; gap: 8px; }
    .kpi-trend { font-size: 13px; color: var(--muted); font-weight: 700; }
    .spark { width: 100%; height: 30px; margin-top: 10px; display: block; opacity: .9; }
    .card.kpi-crit { border-left: 3px solid var(--error); }
    .card.kpi-warn { border-left: 3px solid var(--warn); }
    .card.kpi-ok   { border-left: 3px solid var(--ok); }
    .card.kpi-crit strong { color: var(--error); }
    .card.kpi-warn strong { color: var(--warn); }
    /* ── Phase 4: Top-N bar widgets, threshold severity, error groups ── */
    .topn { display: flex; flex-direction: column; gap: 9px; }
    .topn-row { display: grid; grid-template-columns: minmax(80px, 1.4fr) 2fr auto; gap: 12px; align-items: center; font-size: 13px; }
    .topn-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
    .topn-bar { background: var(--bg-2); border-radius: 6px; height: 16px; overflow: hidden; }
    .topn-fill { display: block; height: 100%; border-radius: 6px; transition: width .3s ease; }
    .topn-val { font-variant-numeric: tabular-nums; font-weight: 700; color: var(--ink); white-space: nowrap; }
    .sev { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; }
    .sev-critical { background: #fee2e2; color: var(--error); }
    .sev-major { background: #ffedd5; color: var(--warn); }
    .sev-minor { background: var(--accent-soft); color: var(--accent); }
    [data-theme="dark"] .sev-critical { background: #3a1a1a; } [data-theme="dark"] .sev-major { background: #33270d; }
    .pill-pass { color: var(--ok); font-weight: 700; } .pill-fail { color: var(--error); font-weight: 700; }
    .thr-dev { display: inline-block; font-size: 11.5px; font-weight: 700; white-space: nowrap; }
    .thr-dev-bad { color: var(--error); } .thr-dev-ok { color: var(--muted); }
    .cluster-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-bottom: 18px; }
    .cluster-card { background: var(--panel); border: 1px solid var(--border); border-left: 4px solid var(--cc); border-radius: 10px; padding: 12px 14px; cursor: pointer; transition: box-shadow .12s, transform .12s; }
    .cluster-card:hover { box-shadow: var(--shadow); transform: translateY(-1px); }
    .cluster-card.active { outline: 2px solid var(--cc); box-shadow: var(--shadow); }
    .cluster-top { display: flex; align-items: center; justify-content: space-between; }
    .cluster-ico { font-size: 18px; } .cluster-n { font-size: 24px; font-weight: 700; color: var(--cc); }
    .cluster-lbl { font-size: 12.5px; font-weight: 600; color: var(--text); margin-top: 2px; }
    .cluster-bar { height: 5px; border-radius: 99px; background: var(--bg-2); margin: 8px 0 5px; overflow: hidden; }
    .cluster-bar > span { display: block; height: 100%; border-radius: 99px; background: var(--cc); }
    .cluster-pct { font-size: 11px; color: var(--muted); }
    /* ── #1: generic sortable + resizable table columns ── */
    .table-scroll table th { position: relative; }
    th.gensort { cursor: pointer; }
    th.gensort:hover { color: var(--accent); }
    th.gensort::after { content: '⇅'; opacity: .35; margin-left: 6px; font-size: 10px; }
    th.gensort[data-sortdir="asc"]::after { content: '▲'; opacity: 1; color: var(--accent); }
    th.gensort[data-sortdir="desc"]::after { content: '▼'; opacity: 1; color: var(--accent); }
    .col-resize { position: absolute; top: 0; right: 0; width: 8px; height: 100%; cursor: col-resize; user-select: none; }
    .col-resize:hover { background: var(--accent); opacity: .4; }
    /* ── refinements: config details, health breakdown, journey flow ── */
    details.adv > summary { cursor: pointer; list-style: none; padding: 2px 0; }
    details.adv > summary::-webkit-details-marker { display: none; }
    details.adv > summary::before { content: '▸'; margin-right: 8px; color: var(--muted); }
    details.adv[open] > summary::before { content: '▾'; }
    .health-breakdown { margin-top: 6px; }
    .health-breakdown > summary { cursor: pointer; font-size: 11px; color: var(--muted); list-style: none; text-decoration: underline dotted; }
    .health-breakdown > summary::-webkit-details-marker { display: none; }
    .health-breakdown ul { margin: 8px 0 0; padding: 0; list-style: none; text-align: left; font-size: 12px; }
    .health-breakdown li { display: flex; justify-content: space-between; gap: 14px; padding: 2px 0; }
    .health-breakdown li b { color: var(--error); }
    .health-breakdown li.base b { color: var(--ink); }
    /* ── Phase 1: insight-first layer (status banner, health score, findings, insights) ── */
    .status-banner {
      display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
      border: 1px solid var(--border-soft); border-radius: var(--radius); padding: 22px 26px; margin-bottom: 24px;
      box-shadow: var(--shadow);
    }
    .status-banner.failed  { background: linear-gradient(90deg,#fef2f2,#fff 55%); border-left: 4px solid var(--error); }
    .status-banner.passed  { background: linear-gradient(90deg,#f0fdf4,#fff 55%); border-left: 4px solid var(--ok); }
    .status-banner.warning { background: linear-gradient(90deg,#fffbeb,#fff 55%); border-left: 4px solid var(--warn); }
    .sb-main { flex: 1; min-width: 240px; }
    .sb-status { font-size: 19px; font-weight: 700; text-transform: uppercase; letter-spacing: .02em; }
    .status-banner.failed  .sb-status { color: var(--error); }
    .status-banner.passed  .sb-status { color: var(--ok); }
    .status-banner.warning .sb-status { color: var(--warn); }
    .sb-reason { color: var(--ink); font-size: 14px; margin-top: 4px; }
    .health { text-align: center; min-width: 132px; padding: 4px 14px; border-left: 1px solid var(--border); }
    .health .num { font-size: 36px; font-weight: 700; line-height: 1; }
    .health .num small { font-size: 16px; color: var(--muted); font-weight: 600; }
    .health .lbl { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); margin-top: 4px; }
    .grade-excellent { color: var(--ok); } .grade-good { color: #0a9396; }
    .grade-fair { color: var(--warn); } .grade-poor, .grade-critical { color: var(--error); }
    .findings { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 16px; margin-bottom: 26px; }
    .finding {
      background: var(--panel); border: 1px solid var(--border-soft); border-left-width: 4px; border-radius: 12px;
      padding: 16px 18px; box-shadow: var(--shadow); min-width: 0;
    }
    .finding.crit { border-left-color: var(--error); }
    .finding.warn { border-left-color: var(--warn); }
    .finding.ok   { border-left-color: var(--ok); }
    .finding h4 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); font-weight: 600; }
    .finding .fv { font-size: 18px; font-weight: 700; word-break: break-word; }
    .finding .fs { color: var(--muted); font-size: 13px; margin-top: 3px; }
    .insights { background: var(--panel); border: 1px solid var(--border-soft); border-radius: 12px; padding: 8px 22px 8px 8px; box-shadow: var(--shadow); margin-bottom: 26px; }
    .insights ul { margin: 10px 0; padding-left: 34px; }
    .insights li { margin: 8px 0; font-size: 14px; line-height: 1.5; }
    .section-title { font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); font-weight: 700; margin: 4px 0 10px; }
    /* Info badge + pure-CSS hover/focus tooltip. */
    .info {
      display: inline-flex; align-items: center; justify-content: center;
      width: 15px; height: 15px; flex: 0 0 15px; border-radius: 50%;
      border: 1px solid var(--border); color: var(--muted);
      font-size: 10px; font-weight: 700; font-style: normal; font-family: Georgia, 'Times New Roman', serif;
      line-height: 1; cursor: help; margin-left: 7px; vertical-align: middle;
      position: relative; text-transform: none; letter-spacing: 0; user-select: none;
    }
    .info:hover, .info:focus { color: var(--accent); border-color: var(--accent); outline: none; }
    .info::after {
      content: attr(data-tip);
      position: absolute; top: 150%; left: 50%; transform: translateX(-50%);
      background: var(--ink); color: #fff; padding: 9px 11px; border-radius: 8px;
      font-size: 12px; font-weight: 400; font-style: normal; font-family: inherit;
      line-height: 1.45; letter-spacing: normal; text-align: left; text-transform: none;
      width: max-content; max-width: 300px; white-space: normal;
      opacity: 0; visibility: hidden; transition: opacity .12s ease;
      z-index: 100; box-shadow: 0 6px 22px rgba(0,0,0,.28); pointer-events: none;
    }
    .info::before {
      content: ''; position: absolute; top: calc(150% - 6px); left: 50%; transform: translateX(-50%);
      border: 6px solid transparent; border-bottom-color: var(--ink);
      opacity: 0; visibility: hidden; transition: opacity .12s ease; z-index: 100; pointer-events: none;
    }
    .info:hover::after, .info:focus::after, .info:hover::before, .info:focus::before { opacity: 1; visibility: visible; }
    [data-theme="dark"] .info::after { background: #0b1015; box-shadow: 0 6px 22px rgba(0,0,0,.6); }
    [data-theme="dark"] .info::before { border-bottom-color: #0b1015; }
    h3 .info { margin-left: 8px; }
    .toolbar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 14px; }
    input, select {
      border: 1px solid var(--border); border-radius: 10px; padding: 9px 12px; background: #fff; color: var(--ink);
      font: inherit; font-size: 13px;
    }
    input:focus, select:focus { outline: 2px solid var(--accent-soft); border-color: var(--accent); }
    .table-scroll {
      width: 100%; overflow: auto; max-height: 70vh; border: 1px solid var(--border-soft); border-radius: var(--radius-sm);
      -webkit-overflow-scrolling: touch;
    }
    table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 640px; }
    th, td { padding: 13px 16px; text-align: left; border-bottom: 1px solid var(--border-soft); font-size: 13px; white-space: nowrap; }
    /* Text-heavy columns (messages, URLs, request names) opt out of nowrap so
       long content wraps inside the cell instead of overflowing the table. */
    td.wrap, th.wrap { white-space: normal; word-break: break-word; overflow-wrap: anywhere; max-width: 420px; }
    thead th {
      position: sticky; top: 0; z-index: 1; background: var(--panel-2, #f9fafc); color: var(--muted);
      font-size: 11px; text-transform: uppercase; letter-spacing: .07em; font-weight: 600;
    }
    tbody tr:nth-child(even) td { background: color-mix(in srgb, var(--bg-2) 36%, transparent); }
    tbody tr:hover td { background: var(--accent-soft); }
    tbody tr:last-child td { border-bottom: none; }
    .split { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; align-items: start; margin-bottom: 24px; }
    /* Plan + one-or-more compliance pie cards on a wrapping row.
       Plan is pinned to 45 %; pies share the remaining space and wrap
       individually to the next row when the container is too narrow. */
    .flex-row { display: flex; gap: 20px; flex-wrap: wrap; align-items: stretch; margin-bottom: 24px; }
    .flex-row > .card { flex: 1 1 180px; min-width: 160px; margin-bottom: 0; }
    .flex-row > .plan-card { flex: 0 0 calc(45% - 10px); min-width: 280px; max-width: calc(45% - 10px); }
    @media (max-width: 980px) { .flex-row > .card, .flex-row > .plan-card { flex: 1 1 100%; max-width: 100%; } }
    /* Collapsible + scrollable scenario list inside the Plan card. Bounded height
       keeps the card the same size no matter how many journeys a plan has. */
    .plan-scenarios { margin-top: 10px; }
    .plan-scenarios > summary { cursor: pointer; font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; user-select: none; list-style-position: inside; }
    .plan-scenarios > summary:hover { color: var(--accent); }
    .plan-scenarios .scroll-list { max-height: 150px; overflow-y: auto; margin-top: 6px; border: 1px solid var(--border-soft); border-radius: 8px; padding: 4px 10px; }
    .plan-scenarios .scroll-list ul { margin: 4px 0; padding-left: 18px; }
    .plan-scenarios .scroll-list li { margin: 5px 0; font-size: 13px; word-break: break-word; }
    /* Wide-right variant: hand the larger column to the second card. Used for the
       Plan/Thresholds row so the 6-column threshold table isn't crammed into the
       narrow side and clipped. */
    .split.sp-wide-right { grid-template-columns: 1fr 1.6fr; }
    /* Even 50/50 columns (default .split is 1.5fr : 1fr). */
    .split.sp-even { grid-template-columns: 1fr 1fr; }
    /* Inside the graph grid the gap already spaces stacked splits — drop the
       extra margin so chart rows don't get a double gap. */
    .graph-shell .split { margin-bottom: 0; }
    @media (max-width: 980px) { .split, .split.sp-wide-right, .split.sp-even { grid-template-columns: 1fr; } }
    @media (max-width: 640px) {
      .shell { padding: 16px 12px 48px; }
      .hero h1 { font-size: 22px; }
      .tab-panel { padding: 14px; }
    }
    .placeholder {
      min-height: 260px; border: 1px dashed var(--border); border-radius: 16px; padding: 18px;
      background: linear-gradient(180deg, rgba(255,255,255,.75), rgba(240,246,244,.9));
      color: var(--muted);
    }
    .empty { color: var(--muted); padding: 18px 0; }
    .graph-shell { display: grid; gap: 16px; }
    .chart-box {
      background: var(--panel); border: 1px solid var(--border-soft); border-radius: var(--radius); padding: 18px;
    }
    .bar-chart { display: flex; align-items: end; gap: 10px; min-height: 220px; padding-top: 16px; }
    .bar-wrap { flex: 1; min-width: 56px; text-align: center; }
    .bar {
      width: 100%;
      border-radius: 10px 10px 0 0;
      background: linear-gradient(180deg, #0a9396, #005f73);
      min-height: 6px;
    }
    .bar-label, .bar-value { font-size: 12px; color: var(--muted); margin-top: 8px; }
    .subtle { color: var(--muted); font-size: 13px; }
    .chart-canvas-wrap { position: relative; width: 100%; min-height: 280px; }
    .chart-canvas-wrap canvas { width: 100% !important; }
    .donut-wrap { position: relative; width: 100%; max-width: 280px; margin: 0 auto; }
    @media (max-width: 980px) { .split { grid-template-columns: 1fr; } }
    /* ── Phase 5: snapshot SIDE DRAWER (slides in from the right) ── */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: none;
      align-items: stretch; justify-content: flex-end; z-index: 1000;
    }
    .modal-overlay.open { display: flex; }
    .modal-panel {
      background: var(--panel); border-left: 1px solid var(--border);
      max-width: 760px; width: 92vw; height: 100vh; overflow: hidden;
      display: flex; flex-direction: column; box-shadow: -24px 0 80px rgba(0,0,0,0.24);
      transform: translateX(24px); transition: transform .2s ease;
    }
    .modal-overlay.open .modal-panel { transform: translateX(0); }
    .modal-header {
      padding: 16px 20px; border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
    }
    .modal-header h3 { margin: 0; font-size: 16px; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .modal-close {
      background: none; border: 1px solid var(--border); border-radius: 999px;
      padding: 4px 14px; cursor: pointer; font-weight: 600; flex-shrink: 0; color: var(--ink);
    }
    .modal-body { overflow-y: auto; padding: 16px 20px; }
    .modal-body pre {
      background: #1d2731; color: #c8d8e0; border-radius: 12px; padding: 14px;
      font-size: 12px; line-height: 1.6; overflow-x: auto; white-space: pre-wrap;
      word-break: break-word; margin: 0;
    }
    /* Drawer structured sections */
    .dw-sec { margin-bottom: 16px; }
    .dw-sec > h4 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
    .dw-line { font-size: 14px; word-break: break-all; }
    .dw-badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-weight: 700; font-size: 12px; }
    .dw-kv { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .dw-kv td { padding: 5px 8px; border-bottom: 1px solid var(--border-soft); vertical-align: top; word-break: break-all; }
    .dw-kv td:first-child { color: var(--muted); white-space: nowrap; width: 1%; font-weight: 600; }
    .dw-meta { display: flex; gap: 16px; flex-wrap: wrap; color: var(--muted); font-size: 12.5px; margin-bottom: 14px; }
    .dw-meta b { color: var(--ink); font-weight: 600; }
    .view-btn {
      background: var(--accent-soft); color: var(--accent); border: 1px solid var(--accent);
      border-radius: 999px; padding: 3px 10px; cursor: pointer; font-size: 12px; font-weight: 600;
    }
    /* ── Wave 2: sticky global toolbar + saved intervals + sortable tables ── */
    .global-toolbar {
      position: sticky; top: 0; z-index: 50;
      background: color-mix(in srgb, var(--bg) 82%, transparent);
      backdrop-filter: blur(16px) saturate(160%);
      -webkit-backdrop-filter: blur(16px) saturate(160%);
      border: 1px solid var(--border-soft); border-radius: var(--radius);
      padding: 11px 14px; margin: 14px 0 18px;
      display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
      box-shadow: var(--shadow);
    }
    .global-toolbar label { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
    .global-toolbar input[type="datetime-local"], .global-toolbar input[type="text"], .global-toolbar select {
      padding: 6px 10px; font-size: 13px;
    }
    .small-btn {
      background: var(--panel); border: 1px solid var(--border); color: var(--ink);
      border-radius: 999px; padding: 6px 12px; cursor: pointer; font-weight: 600; font-size: 12px;
    }
    .small-btn:hover { background: var(--accent-soft); border-color: var(--accent); }
    .small-btn.primary { background: var(--accent); color: white; border-color: var(--accent); }
    .global-toolbar .divider { width: 1px; height: 22px; background: var(--border); margin: 0 4px; }
    /* Filter fields form a full-width second row inside the time-range ribbon,
       revealed by the "More filters" toggle. flex-basis:100% forces the wrap. */
    .filter-fields { flex-basis: 100%; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 4px; padding-top: 10px; border-top: 1px dashed var(--border); }
    .saved-list { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .saved-chip {
      display: inline-flex; align-items: center; gap: 4px;
      background: var(--accent-soft); color: var(--accent);
      border: 1px solid var(--accent); border-radius: 999px;
      padding: 3px 4px 3px 10px; font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .saved-chip:hover { background: #cdebef; }
    .saved-chip .x {
      display: inline-flex; align-items: center; justify-content: center;
      width: 18px; height: 18px; border-radius: 50%;
      background: transparent; color: var(--accent); border: none;
      cursor: pointer; font-size: 14px; line-height: 1; padding: 0;
    }
    .saved-chip .x:hover { background: rgba(0,95,115,0.12); }
    th.sortable { cursor: pointer; user-select: none; white-space: nowrap; }
    th.sortable:hover { color: var(--accent); }
    th.sortable .sort-arrow { opacity: 0.4; margin-left: 4px; font-size: 11px; }
    th.sortable.sorted .sort-arrow { opacity: 1; color: var(--accent); }
    .txn-toolbar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }
    .txn-toolbar input[type="search"] { padding: 6px 10px; font-size: 13px; min-width: 240px; }
    .csv-btn {
      background: var(--accent); color: white; border: none;
      border-radius: 999px; padding: 6px 14px; cursor: pointer; font-weight: 600; font-size: 12px;
    }
    .csv-btn:hover { background: #004a5c; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
  <!-- chartjs-plugin-zoom: drag/pinch to zoom every line chart; selections become the global time range. -->
  <script src="https://cdn.jsdelivr.net/npm/hammerjs@2.0.8"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.0.1"></script>
</head>
<body>
  <div class="app">
    <aside class="sidebar" id="sidebar">
      <div class="brand"><span class="brand-mark">⚡</span><span class="brand-name">k6 Perf</span></div>
      <nav class="tabs" id="tabs"></nav>
      <div class="sidebar-foot">
        <button class="theme-toggle" id="theme-toggle" title="Toggle light / dark">🌙 Dark</button>
      </div>
    </aside>
    <main class="main">
      <section class="hero">
        <!-- Run pass/fail is shown once, in the Summary status banner alongside
             the health score — not duplicated here. -->
        <h1>${this.escapeHtml(bundle.meta.plan)}</h1>
        <div class="meta">
          <span>${this.escapeHtml(bundle.meta.environment)}</span>
          <span>Run: ${this.escapeHtml(bundle.meta.runId)}</span>
          <span>${this.escapeHtml(bundle.meta.startTime)} → ${this.escapeHtml(bundle.meta.endTime)}</span>
        </div>
      </section>
      <!-- Global time range toolbar (sticky). Single source of truth for the
           visible window across every tab. Saved intervals persist to
           localStorage keyed by runId so analyses survive page reloads. -->
      <div class="global-toolbar" id="global-toolbar">
        <label>Time Range</label>
        <input id="gtb-from" type="datetime-local" />
        <span>→</span>
        <input id="gtb-to" type="datetime-local" />
        <button class="small-btn primary" id="gtb-apply">Apply</button>
        <button class="small-btn" id="gtb-reset">Full run</button>
        <span class="divider"></span>
        <label>Save as</label>
        <input id="gtb-name" type="text" placeholder="interval name" />
        <button class="small-btn" id="gtb-save">Save</button>
        <span class="divider"></span>
        <span class="saved-list" id="gtb-saved-list"></span>
        <span class="divider"></span>
        <!-- Global scenario / transaction filters live in this same ribbon. The
             toggle reveals a full-width second row (ftb-fields) below the time
             controls; selections apply across every range-aware tab. -->
        <button class="small-btn" id="ftb-toggle" aria-expanded="false">⚙ More filters</button>
        <div class="filter-fields" id="ftb-fields" style="display:none">
          <label>Scenario</label>
          <select id="ftb-scenario"><option value="">All scenarios</option></select>
          <label>Transaction</label>
          <select id="ftb-transaction"><option value="">All transactions</option></select>
          <button class="small-btn" id="ftb-clear">Clear</button>
        </div>
      </div>
      <section id="panel-summary" class="tab-panel active"></section>
      <section id="panel-graphs" class="tab-panel"></section>
      <section id="panel-transactions" class="tab-panel"></section>
      <section id="panel-errors" class="tab-panel"></section>
      <section id="panel-warnings" class="tab-panel"></section>
      <section id="panel-snapshots" class="tab-panel"></section>
      <section id="panel-system" class="tab-panel"></section>
    </main>
  </div>
  <div class="modal-overlay" id="snapshot-modal" onclick="closeSnapshotModal(event)">
    <div class="modal-panel">
      <div class="modal-header">
        <h3 id="snapshot-modal-title">Snapshot Detail</h3>
        <button class="modal-close" onclick="document.getElementById('snapshot-modal').classList.remove('open')">Close</button>
      </div>
      <div class="modal-body">
        <div id="snapshot-modal-content"></div>
      </div>
    </div>
  </div>
  <script>
    const reportData = ${serialized};
    const tabs = [
      ['summary', 'Summary', '📋'],
      ['graphs', 'Graphs', '📈'],
      ['transactions', 'Transactions', '📊'],
      ['errors', 'Errors', '❌'],
      ['warnings', 'Warnings', '⚠️'],
      ['snapshots', 'Snapshots', '📷'],
      ['system', 'System', '🖥️']
    ];

    function escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // Small "i" badge with a hover tooltip. Pure CSS (data-tip → ::after), so it
    // works in the static HTML with no JS. Use beside any section heading to
    // explain what the section shows.
    function infoTip(tip) {
      return '<span class="info" tabindex="0" data-tip="' + escapeHtml(tip) + '" aria-label="' + escapeHtml(tip) + '">i</span>';
    }

    // ── Global scenario / transaction filters ─────────────────────
    // A second, collapsible toolbar under the time-range row. Selecting a
    // scenario and/or transaction narrows every range-aware tab (Summary aside)
    // via matchesGlobalFilters(), which each render function consults.
    window.__k6PerfFilters = { scenario: '', transaction: '' };
    function getActiveFilters() { return window.__k6PerfFilters || { scenario: '', transaction: '' }; }

    // First non-empty value among the given keys, or null when none is present.
    // Returning null (vs '') lets matchesGlobalFilters treat "field absent" as a
    // pass rather than a mismatch, so rows that simply don't carry a scenario key
    // aren't dropped by a scenario filter.
    function _firstField(obj, keys) {
      for (let i = 0; i < keys.length; i++) {
        const v = obj[keys[i]];
        if (v !== undefined && v !== null && v !== '') return String(v);
      }
      return null;
    }
    function matchesGlobalFilters(obj, scenarioKeys, txnKeys) {
      const f = getActiveFilters();
      if (f.scenario) { const v = _firstField(obj, scenarioKeys); if (v !== null && v !== f.scenario) return false; }
      if (f.transaction) { const v = _firstField(obj, txnKeys); if (v !== null && v !== f.transaction) return false; }
      return true;
    }

    // transaction name → scenario (journey), from the authoritative metrics rows.
    // Memoized; used to filter per-transaction charts by the global scenario.
    let _txnJourneyCache = null;
    function txnJourneyMap() {
      if (_txnJourneyCache) return _txnJourneyCache;
      const map = {};
      ((reportData.transactions && reportData.transactions.transactions) || []).forEach((t) => {
        if (t.transaction) map[String(t.transaction)] = t.journey ? String(t.journey) : '';
      });
      _txnJourneyCache = map;
      return map;
    }
    // True when a transaction name passes the active global scenario/transaction
    // filter — the chart-side equivalent of matchesGlobalFilters for series keyed
    // only by transaction name.
    function txnAllowedByFilters(name) {
      const f = getActiveFilters();
      if (f.transaction && String(name) !== f.transaction) return false;
      if (f.scenario) { const j = txnJourneyMap()[String(name)]; if (j && j !== f.scenario) return false; }
      return true;
    }

    // Distinct scenario (journey) + transaction values, pooled from the
    // transaction metrics (authoritative journey↔transaction pairs) plus errors
    // and snapshots so the dropdowns cover everything the tabs can show.
    function collectFilterOptions() {
      const scen = new Set(), txn = new Set(), pairs = [];
      const txnRows = (reportData.transactions && reportData.transactions.transactions) || [];
      txnRows.forEach((r) => {
        if (r.journey) scen.add(String(r.journey));
        if (r.transaction) txn.add(String(r.transaction));
        if (r.transaction) pairs.push({ scenario: r.journey ? String(r.journey) : '', transaction: String(r.transaction) });
      });
      (reportData.errors || []).forEach((e) => { const s = e.scenario || e.journey; if (s) scen.add(String(s)); if (e.transaction) txn.add(String(e.transaction)); });
      (reportData.snapshots || []).forEach((s) => { const j = s.journey || s.scenario; if (j) scen.add(String(j)); if (s.transaction) txn.add(String(s.transaction)); });
      return { scenarios: [...scen].sort(), transactions: [...txn].sort(), pairs: pairs };
    }

    function setupFilterToolbar() {
      const toggle = document.getElementById('ftb-toggle');
      const fields = document.getElementById('ftb-fields');
      const scenSel = document.getElementById('ftb-scenario');
      const txnSel = document.getElementById('ftb-transaction');
      const clearBtn = document.getElementById('ftb-clear');
      if (!toggle || !fields || !scenSel || !txnSel) return;
      const opts = collectFilterOptions();

      const fillTxn = (scenario) => {
        const cur = txnSel.value;
        const list = scenario
          ? [...new Set(opts.pairs.filter((p) => p.scenario === scenario).map((p) => p.transaction))].sort()
          : opts.transactions;
        txnSel.innerHTML = '<option value="">All transactions</option>'
          + list.map((t) => '<option value="' + escapeHtml(t) + '">' + escapeHtml(t) + '</option>').join('');
        // Preserve the current pick if still valid under the new scenario.
        if (cur && list.indexOf(cur) !== -1) txnSel.value = cur;
      };

      scenSel.innerHTML = '<option value="">All scenarios</option>'
        + opts.scenarios.map((s) => '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + '</option>').join('');
      fillTxn('');

      // Hide the toggle (and its divider) when there's nothing to filter by.
      if (!opts.scenarios.length && !opts.transactions.length) {
        toggle.style.display = 'none';
        if (toggle.previousElementSibling) toggle.previousElementSibling.style.display = 'none';
        return;
      }

      toggle.onclick = () => {
        const open = fields.style.display !== 'none';
        fields.style.display = open ? 'none' : 'flex';
        toggle.setAttribute('aria-expanded', String(!open));
      };
      scenSel.onchange = () => {
        window.__k6PerfFilters.scenario = scenSel.value;
        // When a transaction no longer belongs to the chosen scenario, reset it.
        fillTxn(scenSel.value);
        window.__k6PerfFilters.transaction = txnSel.value;
        document.dispatchEvent(new CustomEvent('filterchange'));
      };
      txnSel.onchange = () => {
        window.__k6PerfFilters.transaction = txnSel.value;
        document.dispatchEvent(new CustomEvent('filterchange'));
      };
      clearBtn.onclick = () => {
        window.__k6PerfFilters = { scenario: '', transaction: '' };
        scenSel.value = ''; fillTxn(''); txnSel.value = '';
        document.dispatchEvent(new CustomEvent('filterchange'));
      };
    }

    function buildTabs() {
      const root = document.getElementById('tabs');
      tabs.forEach(([id, label, icon], index) => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn' + (index === 0 ? ' active' : '');
        btn.innerHTML = '<span class="tab-ico">' + (icon || '•') + '</span><span class="tab-lbl">' + label + '</span>';
        btn.title = label;
        btn.onclick = () => activateTab(id, btn);
        root.appendChild(btn);
      });
    }

    function activateTab(id, button) {
      document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));
      document.getElementById('panel-' + id).classList.add('active');
      button.classList.add('active');
      // Chart.js charts created while their panel was display:none get a 0x0
      // canvas and render blank. Now that this panel is visible, rebuild its
      // charts so they size to the real container. (Cheap; only the just-shown
      // tab re-renders, and each render fully replaces its panel content.)
      if (id === 'graphs') renderGraphs();
      else if (id === 'system') renderSystem();
    }

    // ── Phase 3: KPI sparkline + trend + card helpers ─────────────
    // Inline SVG sparkline (no Chart.js) from a numeric series.
    function spark(values, stroke) {
      const v = (values || []).map(Number).filter((n) => !isNaN(n));
      if (v.length < 2) return '';
      const w = 110, h = 30;
      const max = Math.max(...v), min = Math.min(...v), rng = (max - min) || 1;
      const pts = v.map((y, i) => (i / (v.length - 1) * w).toFixed(1) + ',' + (h - 2 - ((y - min) / rng) * (h - 4)).toFixed(1)).join(' ');
      return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none"><polyline points="' + pts + '" fill="none" stroke="' + stroke + '" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    }
    // Intra-run direction (first third vs last third) — neutral indicator.
    function trendArrow(values) {
      const v = (values || []).map(Number).filter((n) => !isNaN(n));
      if (v.length < 4) return '';
      const t = Math.max(1, Math.floor(v.length / 3));
      const fa = v.slice(0, t).reduce((s, x) => s + x, 0) / t;
      const la = v.slice(-t).reduce((s, x) => s + x, 0) / t;
      if (Math.abs(la - fa) < (Math.abs(fa) || 1) * 0.05) return '<span class="kpi-trend">→</span>';
      return la > fa ? '<span class="kpi-trend">▲</span>' : '<span class="kpi-trend">▼</span>';
    }
    function kpiCard(label, value, o) {
      o = o || {};
      const cls = o.state ? ' kpi-' + o.state : '';
      const sparkHtml = o.series ? spark(o.series, o.sparkColor || '#0e7490') : '';
      // Trend up/down/flat arrow removed per request — it read as a stray
      // dropdown caret next to the value. Sparklines already convey direction.
      const trendHtml = '';
      return '<div class="card kpi' + cls + '"><h3>' + label + '</h3><div class="kpi-row"><strong>' + value + '</strong>' + trendHtml + '</div>' + sparkHtml + '</div>';
    }
    // Phase 4: ranked horizontal-bar widget (replaces plain Top-N tables).
    function renderTopN(items, valueKey, color, fmt) {
      const rows = (items || []).filter((i) => Number(i[valueKey] || 0) > 0);
      if (!rows.length) return '<div class="empty">No data.</div>';
      const max = Math.max(...rows.map((i) => Number(i[valueKey] || 0))) || 1;
      return '<div class="topn">' + rows.map((i) => {
        const v = Number(i[valueKey] || 0);
        const pct = Math.max(3, (v / max) * 100);
        return '<div class="topn-row"><span class="topn-label" title="' + escapeHtml(String(i.transaction)) + '">' + escapeHtml(String(i.transaction)) + '</span>'
          + '<span class="topn-bar"><span class="topn-fill" style="width:' + pct.toFixed(1) + '%;background:' + color + '"></span></span>'
          + '<span class="topn-val">' + (fmt ? fmt(v) : v) + '</span></div>';
      }).join('') + '</div>';
    }
    // Phase 4: threshold severity from the rule shape (rate/checkrate → critical, p99 → major, else minor).
    function thresholdSeverity(rule, metric) {
      const r = String(rule || '') + ' ' + String(metric || '');
      if (r.indexOf('rate') >= 0 || r.indexOf('checkrate') >= 0 || r.indexOf('http_req_failed') >= 0) return 'critical';
      if (r.indexOf('p(99') >= 0 || r.indexOf('p(95') >= 0) return 'major';
      return 'minor';
    }

    // Wave 3: deeper Summary tab. Sections (top → bottom):
    //   1. KV cards: top-level run health (transactions, total reqs, errors,
    //      warnings, threshold failures, total iterations).
    //   2. Plan card: name + env + executor + journey breakdown.
    //   3. Threshold table: every rule with pass/fail icon.
    //   4. Top tables: slowest + most-failing transactions.
    //   5. Runtime snapshot: the knobs the run used (think time, error
    //      behavior, http config, monitoring, …).
    function renderSummary() {
      destroySummaryCharts();
      const summary = reportData.summary || {};
      const ci = summary.ciSummary || { thresholdFailures: 0, errorCount: 0, warningCount: 0 };
      const fullTotals = summary.totals || {};
      const planProfile = summary.planProfile || {};
      const runtimeSnapshot = summary.runtimeSnapshot || {};
      const execution = summary.execution || null;
      const thresholds = summary.thresholds || [];

      // Window-aware: when a sub-range is selected, recompute the headline
      // numbers from the per-bucket overview + events so the Summary reflects the
      // selected time range (consistent with the Transactions tab). Full run uses
      // k6's authoritative totals.
      const ovAll = (reportData.timeseries && reportData.timeseries.series && reportData.timeseries.series.overview) || [];
      const ranged = !!window.__k6PerfRange && ovAll.length > 0;
      const range = getSelectedRange();
      const ov = ranged ? filterSeriesByRange(ovAll, range) : ovAll;
      const sumOv = (key) => ov.reduce((s, b) => s + Number(b[key] || 0), 0);
      const totals = ranged
        ? { requests: sumOv('requests'), iterations: sumOv('iterations'), httpFailures: sumOv('httpFailedCount'), dataReceived: sumOv('dataReceived'), dataSent: sumOv('dataSent') }
        : fullTotals;
      const inWin = (ts) => {
        if (!ranged) return true;
        const t = new Date(ts).getTime();
        return t >= new Date(range.from).getTime() && t <= new Date(range.to).getTime();
      };
      const errorCount = ranged ? (reportData.errors || []).filter((e) => inWin(e.ts)).length : ci.errorCount;
      const warningCount = ranged ? (reportData.warnings || []).filter((w) => inWin(w.ts)).length : ci.warningCount;

      // Windowed transaction rows (exact) drive the count card + top tables.
      const transactions = txnRowsForRange().rows;
      const slowest = [...transactions].sort((a, b) => (b.avg || 0) - (a.avg || 0)).slice(0, 5);
      const failing = [...transactions].sort((a, b) => (b.fail || 0) - (a.fail || 0)).slice(0, 5);
      const highestP90 = [...transactions].sort((a, b) => ((b['p(90)'] || 0) - (a['p(90)'] || 0))).slice(0, 5);
      // Slowest individual requests by p90 — window-aware: recomputed exactly from
      // the per-request series for the selected time range (falls back to the
      // server-precomputed list when no request series is present).
      const topReqs = reqRowsForRange(5).rows;
      const topRequestsHtml = topReqs.length
        ? '<div class="table-scroll"><table><thead><tr><th>Request Name</th><th>Method</th><th>Transaction</th><th>p90 (ms)</th><th>avg</th><th>min</th><th>max</th><th>count</th></tr></thead><tbody>'
            + topReqs.map((r) => '<tr>'
                + '<td class="wrap">' + escapeHtml(String(r.name)) + '</td>'
                + '<td>' + escapeHtml(String(r.method || '—')) + '</td>'
                + '<td class="wrap">' + escapeHtml(String(r.transaction || '—')) + '</td>'
                + '<td>' + escapeHtml(formatCellValue(r.p90)) + '</td>'
                + '<td>' + escapeHtml(formatCellValue(r.avg)) + '</td>'
                + '<td>' + escapeHtml(formatCellValue(r.min)) + '</td>'
                + '<td>' + escapeHtml(formatCellValue(r.max)) + '</td>'
                + '<td>' + escapeHtml(formatCellValue(r.count)) + '</td>'
              + '</tr>').join('')
          + '</tbody></table></div>'
        : '<div class="empty">No per-request timing captured (raw metrics stream unavailable).</div>';

      // Window duration (seconds) for the Duration + avg req/s cards.
      const windowMs = ranged
        ? (new Date(range.to).getTime() - new Date(range.from).getTime())
        : (new Date(reportData.meta.endTime).getTime() - new Date(reportData.meta.startTime).getTime());

      // Compact human formatter for bytes (B / KB / MB / GB).
      const fmtBytes = (n) => {
        const v = Number(n) || 0;
        if (v >= 1e9) return (v / 1e9).toFixed(2) + ' GB';
        if (v >= 1e6) return (v / 1e6).toFixed(2) + ' MB';
        if (v >= 1e3) return (v / 1e3).toFixed(2) + ' KB';
        return v.toFixed(0) + ' B';
      };
      const fmtDuration = () => {
        const ms = windowMs;
        if (!Number.isFinite(ms) || ms < 0) return '—';
        const totalSec = Math.round(ms / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        return (h > 0 ? h + 'h ' : '') + (m > 0 || h > 0 ? m + 'm ' : '') + s + 's';
      };

      // Plan card body — degrades gracefully when planProfile is absent
      // (e.g. older runs whose bundle predates Wave 3).
      const profile = planProfile.globalLoadProfile || {};
      const stagesRow = Array.isArray(profile.stages)
        ? profile.stages.map((s) => '<code>' + escapeHtml(s.duration) + ' → ' + s.target + ' VUs</code>').join(' ')
        : '';
      // Executor options that are actually present. Which apply depends on the
      // executor (ramping-vus uses startVUs/stages/gracefulRampDown; constant-vus
      // uses vus/duration; arrival-rate uses rate/timeUnit/preAllocatedVUs; …), so
      // we render only the keys the profile carries.
      const _optFields = [
        ['startVUs', 'startVUs'], ['vus', 'VUs'], ['maxVUs', 'maxVUs'],
        ['preAllocatedVUs', 'preAllocatedVUs'], ['duration', 'duration'],
        ['iterations', 'iterations'], ['rate', 'rate'], ['timeUnit', 'timeUnit'],
        ['gracefulRampDown', 'gracefulRampDown'], ['gracefulStop', 'gracefulStop'],
      ];
      const optionsRow = _optFields
        .filter((pair) => profile[pair[0]] !== undefined && profile[pair[0]] !== null && profile[pair[0]] !== '')
        .map((pair) => pair[1] + ': <code>' + escapeHtml(String(profile[pair[0]])) + '</code>')
        .join(' · ');
      const _journeys = planProfile.journeys || [];
      const journeyItems = _journeys.map((j) =>
        '<li><strong>' + escapeHtml(j.name || '') + '</strong>'
        + (j.weight != null ? ' <span class="subtle">(weight ' + j.weight + ')</span>' : '')
        + (j.vus != null ? ' <span class="subtle">(vus ' + j.vus + ')</span>' : '')
        + '<br><span class="subtle">' + escapeHtml(j.scriptPath || '') + '</span></li>'
      ).join('');

      const passedCount = thresholds.filter((t) => t.ok).length;
      const breachedCount = thresholds.length - passedCount;
      // One compliance pie per percentile declared in global_sla.transaction:
      // among transactions carrying a p(x) threshold (metric = a transaction name,
      // not http_*/{scenario:…}), how many Pass vs Fail that percentile SLA.
      const _txnNameSet = new Set((reportData.transactions.transactions || []).map((t) => String(t.transaction)));
      const compliancePcts = (reportData.summary && reportData.summary.compliancePercentiles) || [];
      const complianceData = compliancePcts.map(function(pct) {
        const rows = thresholds.filter((t) => String(t.stat || '') === pct && _txnNameSet.has(String(t.metric)));
        const pass = rows.filter((t) => t.ok).length;
        const num = String(pct).replace(/[^0-9.]/g, '');
        return { pct: pct, num: num, pass: pass, breach: rows.length - pass, total: rows.length, id: 'chart-compliance-' + num.replace('.', '_') };
      }).filter((d) => d.total > 0);
      const complianceCardsHtml = complianceData.map(function(d) {
        return '<div class="card"><h3>P' + escapeHtml(d.num) + ' Compliance'
          + infoTip('Transactions meeting (Pass) vs breaching (Fail) their ' + d.pct + ' SLA — global_sla.transaction. ' + d.pass + ' of ' + d.total + ' within SLA.')
          + '</h3><div class="donut-wrap" style="max-width:300px;height:260px;margin-top:6px"><canvas id="' + d.id + '"></canvas></div></div>';
      }).join('');
      // Sort: breached first, then by severity (critical → major → minor).
      const sevRank = { critical: 0, major: 1, minor: 2 };
      const sortedThresholds = [...thresholds].sort((a, b) => {
        if (a.ok !== b.ok) return a.ok ? 1 : -1;
        return sevRank[thresholdSeverity(a.rule, a.metric)] - sevRank[thresholdSeverity(b.rule, b.metric)];
      });
      // #12 Threshold storytelling — format a value in the metric's natural
      // unit (rate→%, duration/percentile→ms, else plain) and narrate the gap
      // between the configured limit and what actually happened.
      const isRateStat = (t) => t.stat === 'rate' || String(t.metric).indexOf('failed') >= 0 || String(t.metric).indexOf('checkrate') >= 0;
      const isDurStat = (t) => !isRateStat(t) && (String(t.metric).indexOf('duration') >= 0 || /^p\\(/.test(String(t.stat || '')) || ['avg', 'med', 'min', 'max'].indexOf(String(t.stat || '')) >= 0);
      const fmtThr = (t, v) => {
        if (v == null || !Number.isFinite(Number(v))) return '—';
        const n = Number(v);
        if (isRateStat(t)) return (n <= 1 ? n * 100 : n).toFixed(n <= 1 && n * 100 < 10 ? 2 : 1) + '%';
        if (isDurStat(t)) return n >= 1000 ? (n / 1000).toFixed(2) + ' s' : n.toFixed(n < 10 ? 1 : 0) + ' ms';
        return n.toLocaleString();
      };
      const thrStory = (t) => {
        if (t.limit == null || t.actual == null) return '<span class="subtle">—</span>';
        const lower = t.op === '<' || t.op === '<=';
        // Magnitude of the miss as a multiple of the limit (breach) or a shortfall.
        if (!t.ok) {
          if (lower && t.limit > 0) {
            const x = t.actual / t.limit;
            return '<span class="thr-dev thr-dev-bad">▲ exceeded by ' + x.toFixed(2) + '×</span>';
          }
          if (!lower) {
            const gap = t.limit - t.actual;
            return '<span class="thr-dev thr-dev-bad">▼ short by ' + fmtThr(t, gap) + '</span>';
          }
          return '<span class="thr-dev thr-dev-bad">breached</span>';
        }
        // Passing — show how much headroom is left.
        if (lower && t.limit > 0) {
          const used = t.actual / t.limit;
          return '<span class="thr-dev thr-dev-ok">' + Math.max(0, Math.round((1 - used) * 100)) + '% headroom</span>';
        }
        return '<span class="thr-dev thr-dev-ok">within target</span>';
      };
      const thresholdTableHtml = thresholds.length === 0
        ? '<div class="empty">No thresholds configured for this run.</div>'
        : '<div class="table-scroll"><table><thead><tr><th>Severity</th><th>Metric</th><th>Expected</th><th>Actual</th><th>Outcome</th><th>Status</th></tr></thead><tbody>'
          + sortedThresholds.map((t) => {
              const sev = thresholdSeverity(t.rule, t.metric);
              const expected = (t.stat && t.op && t.limit != null)
                ? '<code>' + escapeHtml(t.stat) + ' ' + escapeHtml(t.op) + ' ' + fmtThr(t, t.limit) + '</code>'
                : '<code>' + escapeHtml(t.rule) + '</code>';
              const actual = t.actual != null
                ? '<strong style="color:' + (t.ok ? 'var(--ok)' : 'var(--error)') + '">' + fmtThr(t, t.actual) + '</strong>'
                : '<span class="subtle">—</span>';
              return '<tr>'
                + '<td><span class="sev sev-' + sev + '">' + sev + '</span></td>'
                + '<td>' + escapeHtml(t.metric) + '</td>'
                + '<td>' + expected + '</td>'
                + '<td>' + actual + '</td>'
                + '<td>' + thrStory(t) + '</td>'
                + '<td>' + (t.ok ? '<span class="pill-pass">✓ pass</span>' : '<span class="pill-fail">✗ fail</span>') + '</td>'
                + '</tr>';
            }).join('')
          + '</tbody></table></div>';

      // Runtime snapshot — just the most-asked-about knobs. Pretty JSON
      // beneath so users can copy/paste exact values if they need to.
      const runtimeKeyLines = [
        ['🕒 Think time', (runtimeSnapshot.thinkTime && runtimeSnapshot.thinkTime.mode) || '—'],
        ['⏱️ Pacing', (runtimeSnapshot.pacing && runtimeSnapshot.pacing.enabled) ? 'enabled' : 'disabled'],
        ['⚠️ Error behavior', runtimeSnapshot.errorBehavior || '—'],
        ['⏳ HTTP timeout', (runtimeSnapshot.http && runtimeSnapshot.http.timeoutSeconds) ? runtimeSnapshot.http.timeoutSeconds + 's' : '—'],
        ['📸 Snapshots on failure', (runtimeSnapshot.errors && runtimeSnapshot.errors.captureSnapshotOnFailure) ? 'on (cap ' + runtimeSnapshot.errors.maxSnapshotsPerRun + ')' : 'off'],
        ['🖥️ Host monitoring', (runtimeSnapshot.monitoring && runtimeSnapshot.monitoring.enabled) ? 'enabled' : 'disabled'],
        ['🪣 Bucket size', (runtimeSnapshot.reporting && runtimeSnapshot.reporting.timeseries && runtimeSnapshot.reporting.timeseries.bucketSizeSeconds) + 's'],
      ];

      // "How this test was invoked" — the three pieces the framework assembles
      // to drive k6: the CLI command, the generated combined entry script, and
      // the resolved options/scenarios fed via --config. Lets users trace plan
      // → real k6 run.
      const execPre = (code) => '<pre style="background:#1d2731;color:#c8d8e0;border-radius:10px;padding:14px;font-size:11px;line-height:1.5;overflow:auto;max-height:340px;margin-top:6px">' + escapeHtml(code) + '</pre>';
      const executionHtml = execution
        ? '<details style="margin-top:14px"><summary class="subtle" style="cursor:pointer">How this test was invoked by the framework</summary>'
            + '<p class="subtle" style="font-size:12.5px;margin:10px 0 4px">The framework translates the test plan into a real k6 run: it generates a combined <strong>entry script</strong> that re-exports each journey under its scenario <code>exec</code> name (plus <code>handleSummary</code>), writes the <strong>scenarios/options</strong> to a JSON file, and launches k6 with that <code>--config</code>.</p>'
            + '<h4 style="margin:12px 0 2px">1 · k6 command</h4>' + execPre(String(execution.command || ''))
            + '<h4 style="margin:14px 0 2px">2 · Generated entry script <span class="subtle" style="font-weight:400">(temporary, deleted after the run)</span></h4>' + execPre(String(execution.entryScript || ''))
            + '<h4 style="margin:14px 0 2px">3 · Resolved options &amp; scenarios <span class="subtle" style="font-weight:400">(passed to k6 via --config)</span></h4>' + execPre(JSON.stringify(execution.options || {}, null, 2))
          + '</details>'
        : '';

      // ── Phase 1: insight-first layer (status banner, health score, findings, insights) ──
      // Always run-level (not windowed) — these summarize the whole test.
      const allTxns = reportData.transactions.transactions || [];
      const breached = thresholds.filter((t) => !t.ok);
      let status = String(reportData.meta.status || '').toLowerCase();
      if (status !== 'passed' && status !== 'failed' && status !== 'warning') {
        status = (ci.thresholdFailures > 0 || ci.errorCount > 0) ? 'failed' : (ci.warningCount > 0 ? 'warning' : 'passed');
      }
      const reqTotal = Number(fullTotals.requests || 0);
      const httpFailTotal = Number(fullTotals.httpFailures || 0);
      const errPct = reqTotal > 0 ? (httpFailTotal / reqTotal) * 100 : 0;
      // #4 Health score = the share of transactions that succeeded — one
      // signal, computed straight from the per-transaction pass/fail counts we
      // already track. A transaction iteration counts as "passed" only when
      // every check inside it passed and it raised no error, so:
      //   healthScore = round(100 − transactionFailureRate%)
      // e.g. 3% of transactions failed → 97. No weights, no caps — anyone asking
      // "why this number?" gets one sentence.
      //   • HTTP failures need no separate term: every generated request has a
      //     status check, so a 5xx/timeout fails that check and is already a
      //     transaction failure — and this also catches wrong-but-HTTP-200
      //     responses (failed body/correlation assertions) that http_req_failed
      //     would miss.
      //   • Latency/SLA is deliberately NOT in the score: the threshold gate and
      //     the PASS/FAIL banner already report that dimension, so folding it in
      //     here would just double-count what's shown elsewhere.
      let txnPass = 0, txnTotal = 0;
      for (const t of allTxns) { txnPass += Number(t.pass || 0); txnTotal += Number(t.pass || 0) + Number(t.fail || 0); }
      const txnFail = txnTotal - txnPass;
      const txnFailRate = txnTotal > 0 ? txnFail / txnTotal : 0; // no transactions → nothing failed → 100
      const healthScore = Math.max(0, Math.min(100, Math.round(100 * (1 - txnFailRate))));
      // Bands map directly to transaction failure rate now that the score IS the
      // success rate: ≥99 (≤1% failed) Excellent · ≥97 (≤3%) Good · ≥90 (≤10%)
      // Fair · ≥75 (≤25%) Poor · else Critical.
      const grade = healthScore >= 99 ? 'Excellent' : healthScore >= 97 ? 'Good' : healthScore >= 90 ? 'Fair' : healthScore >= 75 ? 'Poor' : 'Critical';
      const breakdownHtml = '<details class="health-breakdown"><summary>why?</summary><ul>'
        + '<li class="base"><span>Transactions passed</span><b>' + txnPass.toLocaleString() + ' / ' + txnTotal.toLocaleString() + '</b></li>'
        + '<li><span>Transaction failure rate</span><b>' + (txnFailRate * 100).toFixed(1) + '%</b></li>'
        + '<li class="base"><span>Health score (100 − failure rate)</span><b>' + healthScore + '</b></li></ul></details>';
      // Pass/fail is governed by the transaction failure rate vs. the configured
      // budget (global_sla.transaction.errorRate / global_sla.errorRate). Threshold
      // breaches are reported in the threshold table but do not flip this status.
      const budgetPct = ci.transactionErrorBudget != null ? ci.transactionErrorBudget : 0;
      const failPctStr = (txnFailRate * 100).toFixed(1);
      const reason = status === 'passed'
        ? 'Transaction failure rate ' + failPctStr + '% is within the ' + budgetPct + '% budget.'
        : (txnTotal === 0
            ? 'Run did not complete successfully — no transaction data was recorded.'
            : 'Transaction failure rate ' + failPctStr + '% exceeds the ' + budgetPct + '% budget.');
      const bannerHtml = '<div class="status-banner ' + status + '">'
        + '<div class="sb-main"><div class="sb-status">' + escapeHtml(status) + '</div><div class="sb-reason">' + reason + '</div></div>'
        + '<div class="health"><div class="num grade-' + grade.toLowerCase() + '">' + healthScore + '<small>/100</small></div><div class="lbl">Health · ' + grade + '</div>' + breakdownHtml + '</div>'
        + '</div>';

      // Slowest transaction + threshold sub-text helper — feed the Insights list.
      const slowTxn = [...allTxns].sort((a, b) => ((b['p(95)'] || b.avg || 0) - (a['p(95)'] || a.avg || 0)))[0];
      const thrSubText = (t) => {
        if (t.stat && t.op && t.limit != null && t.actual != null) {
          const lower = t.op === '<' || t.op === '<=';
          const x = (lower && t.limit > 0) ? ' · exceeded ' + (t.actual / t.limit).toFixed(2) + '×' : '';
          return 'expected ' + escapeHtml(String(t.stat)) + ' ' + escapeHtml(String(t.op)) + ' ' + fmtThr(t, t.limit) + ' · actual ' + fmtThr(t, t.actual) + x;
        }
        return 'threshold ' + escapeHtml(String(t.rule)) + ' breached';
      };

      // Auto-generated insights.
      const insights = [];
      for (const t of allTxns) { if ((t.count || 0) > 0 && (t.errorPct || 0) >= 99.5) insights.push('Transaction <strong>' + escapeHtml(String(t.transaction)) + '</strong> failed in <strong>100%</strong> of executions (' + (t.fail || 0) + '/' + (t.count || 0) + ').'); }
      if (errPct > 0) { const exceed = breached.find((b) => String(b.metric).indexOf('http_req_failed') >= 0); insights.push('Request failure rate is <strong>' + errPct.toFixed(1) + '%</strong>' + (exceed ? ' — exceeds the configured threshold (' + escapeHtml(String(exceed.rule)) + ').' : '.')); }
      if (slowTxn && (slowTxn['p(95)'] || slowTxn.avg)) insights.push('Slowest transaction <strong>' + escapeHtml(String(slowTxn.transaction)) + '</strong> has ' + (slowTxn['p(95)'] != null ? 'p95 = ' + Math.round(slowTxn['p(95)']) + ' ms' : 'avg = ' + Math.round(slowTxn.avg) + ' ms') + '.');
      for (const b of breached.slice(0, 4)) insights.push('Threshold <strong>' + escapeHtml(String(b.metric)) + '</strong> breached — ' + thrSubText(b) + '.');
      const insightsHtml = insights.length ? '<div class="insights"><ul>' + insights.slice(0, 8).map((s) => '<li>' + s + '</li>').join('') + '</ul></div>' : '';

      // ── Phase 3: KPI grid (sparklines from the windowed overview + states) ──
      const sRequests = ov.map((b) => Number(b.requests || 0));
      const sIters = ov.map((b) => Number(b.iterations || 0));
      const sRate = ov.map((b) => Number(b.requestRate || 0));
      const sRtAvg = ov.map((b) => Number(b.httpDurationAvg || 0));
      const sRecv = ov.map((b) => Number(b.dataReceived || 0));
      const sSent = ov.map((b) => Number(b.dataSent || 0));
      const kReq = Number(totals.requests || 0);
      // Transaction-level failure rate: Σfail / Σ executions across transactions
      // (the same signal the health score uses).
      let kTxnTotal = 0, kTxnFail = 0;
      for (const t of allTxns) { kTxnTotal += (Number(t.pass) || 0) + (Number(t.fail) || 0); kTxnFail += Number(t.fail) || 0; }
      const kTxnFailPct = kTxnTotal > 0 ? (kTxnFail / kTxnTotal) * 100 : 0;
      // Exact weighted avg response time over the window.
      let rtW = 0, rtR = 0;
      for (const b of ov) { const r = Number(b.requests || 0); rtW += Number(b.httpDurationAvg || 0) * r; rtR += r; }
      const avgRt = rtR > 0 ? rtW / rtR : 0;
      const kpiHtml = '<div class="cards">'
        + kpiCard('Transactions', transactions.length, {})
        + kpiCard('Total Requests', kReq.toLocaleString(), { series: sRequests, sparkColor: '#0e7490', trend: true })
        + kpiCard('Total Iterations', (totals.iterations || 0).toLocaleString(), { series: sIters, sparkColor: '#0a9396', trend: true })
        + kpiCard('Throughput', (kReq / Math.max(1, windowMs / 1000)).toFixed(2) + ' /s', { series: sRate, sparkColor: '#0891b2', trend: true })
        + kpiCard('Avg Response Time', Math.round(avgRt).toLocaleString() + ' ms', { series: sRtAvg, sparkColor: '#7c3aed', trend: true })
        + kpiCard('Transaction Failure %', kTxnFailPct.toFixed(1) + '%', { state: kTxnFailPct > 5 ? 'crit' : kTxnFailPct > 1 ? 'warn' : 'ok' })
        + kpiCard('Errors', errorCount, { state: errorCount > 0 ? 'crit' : 'ok' })
        + kpiCard('Warnings', warningCount, { state: warningCount > 0 ? 'warn' : 'ok' })
        + kpiCard('Threshold Failures', ci.thresholdFailures, { state: ci.thresholdFailures > 0 ? 'crit' : 'ok' })
        + kpiCard('Data Received', fmtBytes(totals.dataReceived), { series: sRecv, sparkColor: '#15803d' })
        + kpiCard('Data Sent', fmtBytes(totals.dataSent), { series: sSent, sparkColor: '#15803d' })
        + kpiCard('Duration' + (ranged ? ' (window)' : ''), fmtDuration(), {})
        + '</div>';

      document.getElementById('panel-summary').innerHTML = \`
        \${bannerHtml}
        \${insightsHtml ? '<div class="section-title">Insights' + infoTip('Auto-generated observations from this run\\'s metrics.') + '</div>' + insightsHtml : ''}
        \${ranged ? '<div class="notice" style="margin-bottom:14px;padding:10px 14px;border-left:4px solid #0891b2;background:#e0f2fe;color:#0c4a6e;border-radius:4px;font-size:13px">Showing the <strong>selected time window</strong>. Counts, data and req/s are summed over the range; threshold results stay run-level. Click <strong>Full run</strong> to reset.</div>' : ''}
        <div class="section-title">Key Metrics\${infoTip('Headline totals for the run, with trend sparklines.')}</div>
        \${kpiHtml}
        \${ov.length > 1 ? '<div class="card" style="margin-bottom:22px"><h3>Execution Timeline — VUs &amp; failed requests' + infoTip('Active VUs vs failed requests over time.') + '</h3><div class="chart-canvas-wrap" style="min-height:240px"><canvas id="chart-timeline"></canvas></div></div>' : ''}

        <div class="flex-row">
          <div class="card plan-card">
            <h3>Plan\${infoTip('What was run: plan, environment, execution mode, executor, load-profile options and the scenarios (scripts).')}</h3>
            <p style="margin:6px 0"><strong>\${escapeHtml(planProfile.name || reportData.meta.plan || '—')}</strong></p>
            <p style="margin:6px 0" class="subtle">env: <code>\${escapeHtml(planProfile.environment || reportData.meta.environment || '—')}</code>
              · Mode: <code>\${escapeHtml(planProfile.executionMode || '—')}</code>
              · Executor: <code>\${escapeHtml(profile.executor || '—')}</code>
            </p>
            \${optionsRow ? '<p style="margin:6px 0" class="subtle">' + optionsRow + '</p>' : ''}
            \${stagesRow ? '<p style="margin:6px 0">Stages: ' + stagesRow + '</p>' : ''}
            \${journeyItems ? '<details open class="plan-scenarios"><summary>Scenarios (' + _journeys.length + ')</summary><div class="scroll-list"><ul>' + journeyItems + '</ul></div></details>' : ''}
          </div>
          \${complianceCardsHtml}
        </div>

        <div class="card" style="margin-bottom:24px">
          <h3>Thresholds (\${passedCount}/\${thresholds.length} passing\${breachedCount > 0 ? ', <span style="color:#b91c1c">' + breachedCount + ' breached</span>' : ''})\${infoTip('Pass/fail SLA rules: expected limit vs actual value.')}</h3>
          \${thresholdTableHtml}
        </div>

        <div class="split sp-even">
          <div class="card">
            <h3>Highest P90 — Transactions (ms)\${infoTip('Transactions ranked by 90th-percentile response time.')}</h3>
            \${renderTopN(highestP90, 'p(90)', '#f59e0b', (v) => Math.round(v).toLocaleString())}
          </div>
          <div class="card">
            <h3>Top 5 Slowest Requests — p90 (ms)\${infoTip('Individual requests (by request name) ranked by p90 response time. Window-aware — recomputed exactly for the selected time range.')}</h3>
            \${topRequestsHtml}
          </div>
        </div>

        <div class="split sp-even">
          <div class="card">
            <h3>Top Slowest Transactions (avg ms)\${infoTip('Transactions with the highest average response time.')}</h3>
            \${renderTopN(slowest, 'avg', '#0e7490', (v) => Math.round(v).toLocaleString())}
          </div>
          <div class="card">
            <h3>Most Failing Transactions\${infoTip('Transactions with the most failed iterations.')}</h3>
            \${renderTopN(failing, 'fail', '#dc2626', (v) => v.toLocaleString())}
          </div>
        </div>

        <details class="card adv" style="margin-top:18px">
          <summary><span class="section-title" style="margin:0;display:inline">⚙️ Advanced Settings &amp; Configuration\${infoTip('Runtime config and how the framework invoked k6.')}</span></summary>
          <p class="subtle" style="margin:10px 0 4px;font-size:12px;font-style:italic">ℹ️ For developer reference — the resolved runtime configuration and how the framework invoked k6. Not required for interpreting test results.</p>
          <div class="cards" style="margin:14px 0 12px">
            \${runtimeKeyLines.map(([k, v]) => '<div class="card"><h3>' + escapeHtml(k) + '</h3><strong style="font-size:14px">' + escapeHtml(String(v)) + '</strong></div>').join('')}
          </div>
          <details>
            <summary class="subtle" style="cursor:pointer">Show full runtime config (JSON)</summary>
            <pre style="background:#1d2731;color:#c8d8e0;border-radius:10px;padding:14px;font-size:11px;line-height:1.5;overflow:auto;max-height:360px;margin-top:10px">\${escapeHtml(JSON.stringify(runtimeSnapshot, null, 2))}</pre>
          </details>
          \${executionHtml}
        </details>
      \`;
      renderTimelineChart(ov);
      for (const d of complianceData) renderCompliancePie(d.id, d.pct, d.pass, d.breach);
    }

    // ── Wave 1 (Proposal 5): per-second line charts ─────────────────
    // The streaming JSON output is post-parsed into per-bucket aggregates
    // (see TimeseriesStreamParser), so every chart below is a real trend
    // line over wallclock time — req/s, HTTP duration percentiles, VUs,
    // iterations, data in/out, per-transaction response time, per-
    // transaction checkrate. The legacy bar/donut charts are kept only as
    // a fallback when the stream file was unreadable.
    let graphChartInstances = [];
    // Per-transaction charts are tracked separately: they re-render on their
    // own (txn metric/filter change) without rebuilding the rest of the tab,
    // so they need an independent lifecycle. Keeping them out of
    // graphChartInstances also prevents the per-txn cleanup from accidentally
    // destroying the overview / data / phase charts that precede them.
    let perTxnChartInstances = [];
    function destroyGraphCharts() {
      for (const c of graphChartInstances) { try { c.destroy(); } catch {} }
      graphChartInstances = [];
      for (const c of perTxnChartInstances) { try { c.destroy(); } catch {} }
      perTxnChartInstances = [];
    }

    // Format helper: trim "2026-06-01T14:53:54.000Z" → "14:53:54". The bucket
    // ts is ISO, but for hourly+ runs an absolute time on the X axis would
    // be unreadable — short form keeps tick labels legible.
    function fmtBucketTs(ts) {
      const d = new Date(ts);
      const pad = (v) => String(v).padStart(2, '0');
      return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    // gapZero=true: treat empty/zero buckets as "no sample" (null) instead of
    // 0. Essential for latency/percentile series — a bucket with no requests
    // has no duration, and plotting it as 0 ms drew misleading spikes down to
    // the X axis. With spanGaps the trend line connects across these gaps over
    // the real measurements. Count/rate series keep 0 (a real "zero" reading).
    function lineDataset(label, color, points, valueKey, gapZero) {
      return {
        label,
        data: points.map((p) => {
          const v = Number(p[valueKey]);
          if (gapZero) return Number.isFinite(v) && v > 0 ? v : null;
          return Number.isFinite(v) ? v : 0;
        }),
        borderColor: color,
        backgroundColor: color + '22',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.2,
        fill: false,
        spanGaps: true,
      };
    }

    // Percentiles to plot on the duration charts, driven by the run's
    // configured reporting.transactionStats. avg is always shown separately;
    // p90 is always included here. Add e.g. p(50) to the config and it appears.
    function configuredPercentiles() {
      const stats = (reportData.config && reportData.config.transactionStats) || [];
      const set = new Set([90]);
      for (const s of stats) {
        const m = /^p\\(?(\\d+(?:\\.\\d+)?)\\)?$/i.exec(String(s).trim());
        if (m) { const n = Number(m[1]); if (n > 0 && n < 100) set.add(n); }
      }
      return [...set].sort((a, b) => a - b);
    }
    // Stable colors for percentile lines (lower = cooler, higher = warmer).
    function pctColor(p) {
      const map = { '50': '#3b82f6', '75': '#22c55e', '90': '#94a3b8', '95': '#f59e0b', '99': '#b91c1c', '99.9': '#7c3aed' };
      return map[String(p)] || '#7c3aed';
    }
    // Build avg + one line per configured percentile for a duration series.
    // keyPrefix is e.g. 'httpDuration' → reads httpDurationAvg / httpDurationP90.
    function durationDatasets(points, keyPrefix) {
      const ds = [lineDataset('avg', '#0a9396', points, keyPrefix + 'Avg', true)];
      for (const p of configuredPercentiles()) {
        ds.push(lineDataset('p' + p, pctColor(p), points, keyPrefix + 'P' + p, true));
      }
      return ds;
    }

    // Legend click = ISOLATE that series (show only it); click the isolated one
    // again to restore all. Fixes the "click a transaction, nothing shows until
    // toggling repeatedly" confusion of Chart.js's default (which just hides one).
    function isolateLegend(e, legendItem, legend) {
      const ci = legend.chart;
      const idx = legendItem.datasetIndex;
      const vis = ci.data.datasets.map((_, i) => ci.isDatasetVisible(i));
      const onlyThis = vis[idx] && vis.every((v, i) => i === idx ? v : !v);
      ci.data.datasets.forEach((_, i) => ci.setDatasetVisibility(i, onlyThis ? true : i === idx));
      ci.update();
    }

    // \`points\` is the source bucket array backing the chart — its index
    // aligns with chart.scales.x ticks, so a zoom selection maps cleanly
    // back to bucket timestamps and broadcasts via updateGlobalTimeRange.
    // Pass null to disable zoom→range broadcast (e.g. for the per-transaction
    // charts where the user picks the metric/filter separately).
    function lineOptions(yTitle, opts, points) {
      opts = opts || {};
      const zoomPlugin = points && points.length > 1 ? {
        zoom: {
          // Drag a rectangle to zoom; resulting range becomes the global
          // time window so every other chart and tab updates in lockstep.
          drag: { enabled: true, backgroundColor: 'rgba(0,95,115,0.12)' },
          mode: 'x',
          onZoomComplete: ({ chart }) => {
            const xs = chart.scales.x;
            const lo = Math.max(0, Math.floor(xs.min));
            const hi = Math.min(points.length - 1, Math.ceil(xs.max));
            const startTs = points[lo] && points[lo].ts;
            const endTs = points[hi] && points[hi].ts;
            if (startTs && endTs && startTs !== endTs) {
              // Defer OUT of the plugin's event callback. Applying the range
              // re-renders (destroys + recreates) every chart; doing that
              // synchronously here destroys THIS chart mid-callback and freezes
              // the page. A 0ms timeout lets Chart.js finish the zoom event
              // first; the re-render rebuilds charts from the zoomed data (no
              // resetZoom — calling it here can re-fire this same event).
              setTimeout(() => {
                updateGlobalTimeRange(startTs, endTs);
                hydrateTimeInputs(
                  document.getElementById('gtb-from'),
                  document.getElementById('gtb-to'),
                );
              }, 0);
            }
          },
        },
        pan: { enabled: true, mode: 'x', modifierKey: 'shift' },
        limits: { x: { min: 'original', max: 'original' } },
      } : undefined;
      return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { usePointStyle: true, padding: 12, boxWidth: 10 }, onClick: isolateLegend },
          tooltip: {
            backgroundColor: 'rgba(29,39,49,0.92)',
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            padding: 10,
            cornerRadius: 8,
          },
          ...(zoomPlugin ? { zoom: zoomPlugin } : {}),
        },
        scales: {
          x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10, font: { size: 11 } }, grid: { color: gridColor() } },
          y: {
            title: { display: !!yTitle, text: yTitle || '' },
            grid: { color: gridColor() },
            beginAtZero: opts.beginAtZero !== false,
            ...(opts.suggestedMax ? { suggestedMax: opts.suggestedMax } : {}),
          },
        },
      };
    }

    function renderGraphs() {
      destroyGraphCharts();
      const stats = reportData.config.transactionStats;
      const transactions = reportData.transactions.transactions;
      const range = getSelectedRange();
      const overviewPoints = filterSeriesByRange(reportData.timeseries.series.overview || [], range);
      const hasTimeseries = overviewPoints.length > 1;
      const labels = overviewPoints.map((p) => fmtBucketTs(p.ts));
      // Per-transaction series filtered by the same range. Keys here are the
      // transaction names declared via the framework manifest.
      const txnSeriesMap = reportData.timeseries.series.transactions || {};
      const txnNames = Object.keys(txnSeriesMap).sort();
      const filteredTxnSeries = {};
      for (const name of txnNames) {
        filteredTxnSeries[name] = filterSeriesByRange(txnSeriesMap[name] || [], range);
      }

      // Banner only renders when we don't have proper time-series data — the
      // single-point legacy fallback can't be drawn as a line.
      const banner = !hasTimeseries
        ? '<div class="notice notice-warn" style="margin-bottom:12px;padding:10px 14px;border-left:4px solid #f59e0b;background:#fef3c7;color:#78350f;border-radius:4px;font-size:13px;line-height:1.5">'
            + '<strong>No per-second time-series available.</strong> The k6 streaming output (<code>metrics-stream.json</code>) was missing or unreadable for this run, so the charts below show a single end-of-run sample only. Future runs will produce full line charts automatically.'
          + '</div>'
        : '';

      // When a global scenario/transaction filter is active, the per-transaction
      // charts below reflect it. The aggregate charts (request rate, VUs, timing
      // phases, …) are whole-run infrastructure metrics with no per-transaction
      // breakdown in the series, so they stay run-level — flag that so the user
      // isn't surprised the top charts don't change.
      const _gf = getActiveFilters();
      const filterNotice = (_gf.scenario || _gf.transaction)
        ? '<div class="notice" style="margin-bottom:12px;padding:10px 14px;border-left:4px solid #0891b2;background:#e0f2fe;color:#0c4a6e;border-radius:4px;font-size:13px;line-height:1.5">'
            + '<strong>Filter active'
            + (_gf.scenario ? ' · scenario: ' + escapeHtml(_gf.scenario) : '')
            + (_gf.transaction ? ' · transaction: ' + escapeHtml(_gf.transaction) : '')
            + '.</strong> The <strong>Per-Transaction</strong> charts below reflect this filter. Aggregate charts (request rate, VUs, timing phases) remain run-level.'
          + '</div>'
        : '';

      document.getElementById('panel-graphs').innerHTML = banner + filterNotice + \`
        <div class="graph-shell">
          <div class="chart-box">
            <h3>HTTP Request Rate\${infoTip('Requests per second over time.')}</h3>
            <div class="chart-canvas-wrap" style="min-height:240px"><canvas id="chart-req-rate"></canvas></div>
          </div>
          <div class="chart-box">
            <h3>HTTP Response Time (ms)\${infoTip('Response time over time (avg / p90 / p95 / p99).')}</h3>
            <div class="chart-canvas-wrap" style="min-height:280px"><canvas id="chart-http-duration"></canvas></div>
          </div>
          <div class="chart-box">
            <h3>Request Failure Rate\${infoTip('Percentage of requests that failed over time.')}</h3>
            <div class="chart-canvas-wrap" style="min-height:220px"><canvas id="chart-http-failed"></canvas></div>
          </div>
          <div class="split">
            <div class="chart-box">
              <h3>Virtual Users\${infoTip('Active virtual users over time.')}</h3>
              <div class="chart-canvas-wrap" style="min-height:220px"><canvas id="chart-vus"></canvas></div>
            </div>
            <div class="chart-box">
              <h3>Iteration Rate (per bucket)\${infoTip('Journey iterations completed per time bucket.')}</h3>
              <div class="chart-canvas-wrap" style="min-height:220px"><canvas id="chart-iter-rate"></canvas></div>
            </div>
          </div>
          <div class="chart-box">
            <h3>Iteration Duration (ms)\${infoTip('Full journey duration over time (incl. think time).')}</h3>
            <div class="chart-canvas-wrap" style="min-height:240px"><canvas id="chart-iter-duration"></canvas></div>
          </div>
          <div class="chart-box">
            <h3>Data Transferred (bytes/sec)\${infoTip('Network bytes received and sent per second.')}</h3>
            <div class="chart-canvas-wrap" style="min-height:220px"><canvas id="chart-data"></canvas></div>
          </div>
        \` + /* ── HTTP Timing Breakdown markup DISABLED ─────────────────────────
             Commented out to shrink the report. Restore by uncommenting this HTML
             together with the phaseChart() calls above, the switch cases in
             TimeseriesStreamParser.ts, and the phase fields in
             TimeseriesArtifactBuilder.ts.

          <!-- ── HTTP timing breakdown (parity with k6 web-dashboard Timings tab) ── -->
          <h3 style="margin:20px 0 8px;font-size:18px;color:var(--accent)">HTTP Timing Breakdown\${infoTip('Each request split into its k6 timing phases.')}</h3>
          <p class="subtle" style="margin:0 0 12px">Each phase is a slice of the total <code>http_req_duration</code>. Useful for pinpointing whether slow requests are server-side (waiting), network-side (sending/receiving), or pool-side (blocked).</p>
          <div class="split">
            <div class="chart-box">
              <h3>Request Waiting (TTFB)\${infoTip('Time to first byte — server processing time.')}</h3>
              <div class="chart-canvas-wrap" style="min-height:200px"><canvas id="chart-http-waiting"></canvas></div>
            </div>
            <div class="chart-box">
              <h3>TLS Handshaking\${infoTip('TLS negotiation time (new connections only).')}</h3>
              <div class="chart-canvas-wrap" style="min-height:200px"><canvas id="chart-http-tls"></canvas></div>
            </div>
          </div>
          <div class="split">
            <div class="chart-box">
              <h3>Request Sending\${infoTip('Time writing the request onto the wire.')}</h3>
              <div class="chart-canvas-wrap" style="min-height:200px"><canvas id="chart-http-sending"></canvas></div>
            </div>
            <div class="chart-box">
              <h3>Request Connecting\${infoTip('TCP connection setup time (new connections only).')}</h3>
              <div class="chart-canvas-wrap" style="min-height:200px"><canvas id="chart-http-connecting"></canvas></div>
            </div>
          </div>
          <div class="split">
            <div class="chart-box">
              <h3>Request Receiving\${infoTip('Time reading the response body.')}</h3>
              <div class="chart-canvas-wrap" style="min-height:200px"><canvas id="chart-http-receiving"></canvas></div>
            </div>
            <div class="chart-box">
              <h3>Request Blocked\${infoTip('Time waiting for a free connection from the pool.')}</h3>
              <div class="chart-canvas-wrap" style="min-height:200px"><canvas id="chart-http-blocked"></canvas></div>
            </div>
          </div>
        */ \`
          <div class="chart-box">
            <h3>Per-Transaction Response Time\${infoTip('Response-time trend per transaction; pick a metric below.')}
              <span style="font-weight:400;font-size:12px;color:#66717d">— pick a metric below; lines are per-transaction</span>
            </h3>
            <div class="toolbar" style="margin:8px 0">
              <label>Metric</label>
              <select id="txn-metric">
                <option value="durationAvg">Average</option>
                \${configuredPercentiles().map((p) => '<option value="durationP' + p + '"' + (p === 90 ? ' selected' : '') + '>p' + p + '</option>').join('')}
                <option value="durationMax">Max</option>
              </select>
              <input id="txn-filter" type="search" placeholder="Filter transactions (substring)" />
            </div>
            <div class="chart-canvas-wrap" style="min-height:320px"><canvas id="chart-per-txn-duration"></canvas></div>
          </div>
          <div class="chart-box">
            <h3>Per-Transaction Pass Rate\${infoTip('Percent of each transaction\\'s checks passing over time.')}</h3>
            <div class="chart-canvas-wrap" style="min-height:280px"><canvas id="chart-per-txn-pass"></canvas></div>
          </div>
        </div>
      \`;

      // Time range is now driven by the sticky global toolbar — see
      // setupGlobalToolbar() + the rangechange listener wired below.
      const txnMetricSelect = document.getElementById('txn-metric');
      const txnFilter = document.getElementById('txn-filter');
      txnMetricSelect.onchange = renderPerTransactionChart;
      txnFilter.oninput = renderPerTransactionChart;

      if (!overviewPoints.length) return;

      // All overview charts share the same X-axis points; passing
      // \`overviewPoints\` into lineOptions lights up drag-to-zoom on every
      // chart and makes the resulting selection the global time range.
      // ── HTTP request rate (req/s) ──────────────────────────────
      graphChartInstances.push(new Chart(document.getElementById('chart-req-rate'), {
        type: 'line',
        data: {
          labels,
          datasets: [lineDataset('Requests / sec', '#005f73', overviewPoints, 'requestRate')],
        },
        options: lineOptions('req/s', {}, overviewPoints),
      }));

      // ── HTTP duration percentile series ─────────────────────────
      graphChartInstances.push(new Chart(document.getElementById('chart-http-duration'), {
        type: 'line',
        data: {
          labels,
          datasets: durationDatasets(overviewPoints, 'httpDuration'),
        },
        options: lineOptions('ms', {}, overviewPoints),
      }));

      // ── HTTP failed rate ────────────────────────────────────────
      graphChartInstances.push(new Chart(document.getElementById('chart-http-failed'), {
        type: 'line',
        data: {
          labels,
          datasets: [lineDataset('Failed (%)', '#b91c1c', overviewPoints.map((p) => ({ pct: Number(p.httpFailedRate || 0) * 100 })), 'pct')],
        },
        options: lineOptions('%', { suggestedMax: 5 }, overviewPoints),
      }));

      // ── VUs ─────────────────────────────────────────────────────
      graphChartInstances.push(new Chart(document.getElementById('chart-vus'), {
        type: 'line',
        data: {
          labels,
          datasets: [
            lineDataset('VUs (active)', '#005f73', overviewPoints, 'vus'),
            lineDataset('VUs Max', '#94a3b8', overviewPoints, 'vusMax'),
          ],
        },
        options: lineOptions('VUs', {}, overviewPoints),
      }));

      // ── Iteration rate (counts only — duration gets its own chart so
      //   the percentile lines aren't crushed by the count scale).
      graphChartInstances.push(new Chart(document.getElementById('chart-iter-rate'), {
        type: 'line',
        data: {
          labels,
          datasets: [
            lineDataset('iterations / bucket', '#0a9396', overviewPoints, 'iterations'),
          ],
        },
        options: lineOptions('count', {}, overviewPoints),
      }));

      // ── Iteration Duration (avg + percentile overlay) ───────────
      graphChartInstances.push(new Chart(document.getElementById('chart-iter-duration'), {
        type: 'line',
        data: {
          labels,
          datasets: durationDatasets(overviewPoints, 'iterationDuration'),
        },
        options: lineOptions('ms', {}, overviewPoints),
      }));

      // ── Data received / sent ────────────────────────────────────
      graphChartInstances.push(new Chart(document.getElementById('chart-data'), {
        type: 'line',
        data: {
          labels,
          datasets: [
            lineDataset('data_received (B/s)', '#005f73', overviewPoints, 'dataReceived'),
            lineDataset('data_sent (B/s)', '#0a9396', overviewPoints, 'dataSent'),
          ],
        },
        options: lineOptions('bytes/sec', {}, overviewPoints),
      }));

      // ── HTTP timing breakdown (six phases × four percentiles each) ──
      // One helper since all six charts share the same dataset shape.
      // Hovering tooltips show all four lines stacked for a given bucket.
      //
      // Special case: TLS handshake, TCP connect, and connection-pool block
      // only fire on NEW connection establishment. Once HTTP/2 + connection
      // reuse kicks in, every subsequent request skips these phases and the
      // metric is 0 for nearly every bucket. Rather than draw a flat line
      // along the X axis (which reads as "broken chart"), we detect the all-
      // zero case and swap in a friendly placeholder explaining why.
      function phaseChart(canvasId, fieldBase) {
        const el = document.getElementById(canvasId);
        if (!el) return;
        // Walk overviewPoints once to test whether the bucket window has any
        // non-zero sample across any of the four percentile keys. Cheaper
        // than instantiating Chart.js and finding an empty canvas after.
        const keys = [fieldBase + 'Avg', fieldBase + 'P90', fieldBase + 'P95', fieldBase + 'P99'];
        let hasData = false;
        for (const p of overviewPoints) {
          for (const k of keys) { if (Number(p[k]) > 0) { hasData = true; break; } }
          if (hasData) break;
        }
        if (!hasData) {
          // Replace the canvas with an inline notice. We rebuild the parent's
          // innerHTML so future re-renders (on rangechange) get a fresh canvas
          // to draw into when data DOES exist in the new window.
          const parent = el.parentElement;
          if (parent) {
            parent.innerHTML = '<div class="empty" style="padding:24px;text-align:center;font-size:13px;line-height:1.6">'
              + 'No samples in this window. <span class="subtle">This phase typically only fires on new connection establishment; persistent / HTTP/2 connections skip it.</span>'
              + '</div>';
          }
          return;
        }
        graphChartInstances.push(new Chart(el, {
          type: 'line',
          data: {
            labels,
            datasets: [
              lineDataset('avg', '#0a9396', overviewPoints, fieldBase + 'Avg', true),
              lineDataset('p90', '#94a3b8', overviewPoints, fieldBase + 'P90', true),
              lineDataset('p95', '#f59e0b', overviewPoints, fieldBase + 'P95', true),
              lineDataset('p99', '#b91c1c', overviewPoints, fieldBase + 'P99', true),
            ],
          },
          options: lineOptions('ms', {}, overviewPoints),
        }));
      }
      // ── HTTP Timing Breakdown DISABLED ──────────────────────────────
      // Phase charts commented out (their canvases + section HTML above are
      // removed too, and the underlying data is no longer produced by the
      // timeseries pipeline). Uncomment to restore alongside the parser +
      // artifact-builder phase code and the section markup below.
      // phaseChart('chart-http-waiting',    'httpReqWaiting');
      // phaseChart('chart-http-tls',        'httpReqTlsHandshaking');
      // phaseChart('chart-http-sending',    'httpReqSending');
      // phaseChart('chart-http-connecting', 'httpReqConnecting');
      // phaseChart('chart-http-receiving',  'httpReqReceiving');
      // phaseChart('chart-http-blocked',    'httpReqBlocked');

      function renderPerTransactionChart() {
        // Drop any prior per-txn chart instances and re-create. These live in
        // their own array (perTxnChartInstances), so this never touches the
        // overview / data / phase charts in graphChartInstances.
        for (const c of perTxnChartInstances) { try { c.destroy(); } catch {} }
        perTxnChartInstances = [];

        const metric = txnMetricSelect.value;
        const filterText = txnFilter.value.toLowerCase();
        // Honor the global scenario/transaction filter AND the local substring box.
        const visibleNames = txnNames.filter((n) =>
          txnAllowedByFilters(n) && (!filterText || n.toLowerCase().includes(filterText)),
        );
        // Stable color palette per transaction — modulo a 10-color cycle.
        const palette = ['#005f73','#0a9396','#f59e0b','#b91c1c','#7c3aed','#15803d','#c2410c','#0369a1','#a16207','#6b21a8'];
        // We use the FIRST txn series for labels; assumes all series share
        // the same bucket grid (true by construction in the parser).
        const baseLabels = visibleNames.length > 0
          ? filteredTxnSeries[visibleNames[0]].map((p) => fmtBucketTs(p.ts))
          : labels;
        const durationDatasets = visibleNames.map((name, idx) => lineDataset(name, palette[idx % palette.length], filteredTxnSeries[name], metric, true));
        // Per-txn charts use the first-txn's bucket array for zoom mapping.
        // All transactions share the same bucket grid by construction, so
        // any of their series works as the index→ts mapping for zoom.
        const zoomPoints = visibleNames.length > 0 ? filteredTxnSeries[visibleNames[0]] : null;
        perTxnChartInstances.push(new Chart(document.getElementById('chart-per-txn-duration'), {
          type: 'line',
          data: { labels: baseLabels, datasets: durationDatasets },
          options: lineOptions('ms', {}, zoomPoints),
        }));

        // Pass rate per transaction over time: pass / (pass+fail) per bucket
        const passDatasets = visibleNames.map((name, idx) => ({
          label: name,
          data: filteredTxnSeries[name].map((p) => {
            const pass = Number(p.pass || 0), fail = Number(p.fail || 0);
            return pass + fail > 0 ? (pass / (pass + fail)) * 100 : null;
          }),
          borderColor: palette[idx % palette.length],
          backgroundColor: palette[idx % palette.length] + '22',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.2,
          spanGaps: true,
        }));
        perTxnChartInstances.push(new Chart(document.getElementById('chart-per-txn-pass'), {
          type: 'line',
          data: { labels: baseLabels, datasets: passDatasets },
          options: lineOptions('% pass', { suggestedMax: 100 }, zoomPoints),
        }));
      }
      renderPerTransactionChart();
      // Charts created during the panel's initial grid layout can mis-measure
      // their container: creating the early charts reflows the grid, so charts
      // further down read a stale/unsettled height and stick at Chart.js's
      // default 150px backing (they appear blank/squished). Force a resize once
      // layout has settled so every canvas matches its real container. A double
      // rAF guarantees we run after the browser's layout+paint for this frame.
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            for (const c of graphChartInstances) { try { c.resize(); } catch {} }
            for (const c of perTxnChartInstances) { try { c.resize(); } catch {} }
          });
        });
      }
    }

    // Wave 2: Transactions tab gains search + sortable columns + CSV export.
    // Sort state lives in module scope so re-renders (e.g. after the global
    // range changes or new sort is applied) preserve the user's last choice.
    const _txnSortState = { column: 'count', direction: 'desc' };
    let _txnFilterText = '';

    // Exact percentile (linear interpolation) over an ascending-sorted array.
    function _pct(sorted, q) {
      const n = sorted.length;
      if (n === 0) return 0;
      if (n === 1) return sorted[0];
      const idx = (q / 100) * (n - 1);
      const lo = Math.floor(idx), hi = Math.ceil(idx);
      if (lo === hi) return sorted[lo];
      return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
    }
    // Population standard deviation (matches k6's stddev).
    function _stdDev(arr, mean) {
      const n = arr.length;
      if (n === 0) return 0;
      let ss = 0;
      for (const v of arr) { const d = v - mean; ss += d * d; }
      return Math.sqrt(ss / n);
    }

    // Transaction rows for the active time window. With no sub-range selected we
    // return the exact precomputed full-run aggregates (k6's authoritative
    // summary). With a sub-range, we recompute EXACTLY from the raw duration
    // samples carried in each bucket (b.durations): count/pass/fail/errorPct are
    // summed, and avg/min/max/std/median/any percentile are computed from the
    // real samples in the window — never approximated.
    function txnRowsForRange() {
      const full = reportData.transactions.transactions || [];
      const txnSeries = (reportData.timeseries && reportData.timeseries.series && reportData.timeseries.series.transactions) || {};
      if (!window.__k6PerfRange || Object.keys(txnSeries).length === 0) {
        // Full run: keep k6's authoritative count/avg/percentiles, but replace
        // the (often percentile-approximated) std with the EXACT std from raw
        // samples so std is trustworthy and consistent with sub-range values.
        const rows = full.map(function(r) {
          const copy = Object.assign({}, r);
          // Surface journey under a scenario field so the table can show it.
          copy.scenario = r.journey ? String(r.journey) : '';
          const series = txnSeries[String(r.transaction)];
          if (series) {
            const durs = [];
            for (const b of series) { if (Array.isArray(b.durations)) { for (const d of b.durations) durs.push(Number(d)); } }
            if (durs.length > 0) {
              let s = 0; for (const v of durs) s += v;
              const exact = _stdDev(durs, s / durs.length);
              copy.std = exact; copy.stddev = exact;
            }
          }
          return copy;
        });
        return { rows: rows, ranged: false };
      }
      const range = getSelectedRange();
      const statsList = reportData.config.transactionStats || [];
      const out = [];
      for (const name of Object.keys(txnSeries)) {
        const buckets = filterSeriesByRange(txnSeries[name] || [], range);
        let count = 0, pass = 0, fail = 0;
        const durations = [];
        for (const b of buckets) {
          const c = Number(b.count || 0);
          count += c; pass += Number(b.pass || 0); fail += Number(b.fail || 0);
          if (Array.isArray(b.durations)) { for (const d of b.durations) durations.push(Number(d)); }
        }
        if (count === 0) continue; // no activity in this window — drop the row
        durations.sort((a, b) => a - b);
        const n = durations.length;
        const mean = n ? durations.reduce((s, v) => s + v, 0) / n : 0;
        const _scen = txnJourneyMap()[name] || '';
        const row = {
          transaction: name,
          scenario: _scen,
          journey: _scen,
          count: count, pass: pass, fail: fail,
          errorPct: count > 0 ? (fail / count) * 100 : 0,
        };
        for (const stat of statsList) {
          if (stat === 'count' || stat === 'pass' || stat === 'fail') continue;
          if (stat === 'avg') row.avg = mean;
          else if (stat === 'min') row.min = n ? durations[0] : 0;
          else if (stat === 'max') row.max = n ? durations[n - 1] : 0;
          else if (stat === 'std' || stat === 'stddev') row[stat] = _stdDev(durations, mean);
          else if (stat === 'med' || stat === 'median') row[stat] = _pct(durations, 50);
          else {
            const m = stat.match(/^p\\(?(\\d+(?:\\.\\d+)?)\\)?$/);
            if (m) row[stat] = _pct(durations, Number(m[1]));
          }
        }
        out.push(row);
      }
      return { rows: out, ranged: true };
    }

    // Top individual requests (by request name) for the active time window.
    // Mirrors txnRowsForRange but for the per-request series: concatenates the
    // raw duration samples in-window and computes EXACT p90/avg/min/max/count +
    // failed, so the Top Requests table tracks the time-window selector. Falls
    // back to the server-precomputed summary.topRequests when no request series
    // is present (legacy artifacts). Returns up to topN rows sorted by p90 desc.
    function reqRowsForRange(topN) {
      const reqSeries = (reportData.timeseries && reportData.timeseries.series && reportData.timeseries.series.requests) || {};
      const names = Object.keys(reqSeries);
      if (names.length === 0) {
        const fallback = (reportData.summary && reportData.summary.topRequests) || [];
        return { rows: fallback.slice(0, topN), ranged: false };
      }
      const ranged = !!window.__k6PerfRange;
      const range = getSelectedRange();
      const rows = [];
      for (const name of names) {
        const buckets = ranged ? filterSeriesByRange(reqSeries[name] || [], range) : (reqSeries[name] || []);
        let count = 0, failed = 0;
        let method = '', transaction = '', url = name;
        const durations = [];
        for (const b of buckets) {
          count += Number(b.count || 0);
          failed += Number(b.failed || 0);
          if (Array.isArray(b.durations)) { for (const d of b.durations) durations.push(Number(d)); }
          if (!method && b.method) method = String(b.method);
          if (!transaction && b.transaction) transaction = String(b.transaction);
          if (b.url) url = String(b.url);
        }
        if (count === 0 && durations.length === 0) continue;
        durations.sort((a, b) => a - b);
        const n = durations.length;
        const sum = n ? durations.reduce((s, v) => s + v, 0) : 0;
        rows.push({
          name: name,
          method: method,
          transaction: transaction,
          url: url,
          count: count || n,
          failed: failed,
          p90: Math.round(_pct(durations, 90)),
          avg: n ? Math.round(sum / n) : 0,
          min: n ? Math.round(durations[0]) : 0,
          max: n ? Math.round(durations[n - 1]) : 0,
        });
      }
      rows.sort((a, b) => (b.p90 - a.p90) || (b.max - a.max));
      return { rows: rows.slice(0, topN), ranged: ranged };
    }

    function renderTransactions() {
      const host = document.getElementById('panel-transactions');
      const __src = txnRowsForRange();
      const __ranged = __src.ranged;
      let rows = __src.rows.filter((r) => matchesGlobalFilters(r, ['journey', 'scenario'], ['transaction']));
      if (!rows.length) {
        host.innerHTML = '<div class="empty">No transaction activity in the selected window.</div>';
        return;
      }
      // Show a Scenario (journey) column when at least one row carries a
      // scenario — keeps single-journey/legacy runs from getting an empty column.
      const hasScenario = rows.some((r) => r.scenario);
      const columns = [...(hasScenario ? ['scenario'] : []), 'transaction', 'count', 'pass', 'fail', 'errorPct', ...reportData.config.transactionStats.filter((stat) => !['count', 'pass', 'fail'].includes(stat))];

      // Pass/fail are always exact (the per-iteration checkrate Rate metric) —
      // the pre-flight ScriptContractGuard blocks the raw check()/group() shapes
      // that used to produce approximate rows, so there's no ≈ marker any more.
      const presentationRows = rows;

      // Banner when the table reflects a selected sub-window. Values are EXACT —
      // recomputed from the raw duration samples within the window.
      const rangeBanner = __ranged
        ? '<div class="notice" style="margin-bottom:12px;padding:10px 14px;border-left:4px solid #0891b2;background:#e0f2fe;color:#0c4a6e;border-radius:4px;font-size:13px;line-height:1.5">'
            + '<strong>Showing the selected time window.</strong> '
            + 'All values are exact for this range (recomputed from raw samples). Click <strong>Full run</strong> to reset.'
          + '</div>'
        : '';
      const banner = rangeBanner;

      // Filter toolbar: free-text substring match on the transaction name +
      // CSV export of the currently-visible rows (post-filter, post-sort).
      const toolbar =
        '<div class="txn-toolbar">'
          + '<input id="txn-search" type="search" placeholder="Filter transactions…" value="' + escapeHtml(_txnFilterText) + '" />'
          + '<span class="subtle" id="txn-count-label"></span>'
          + '<span style="flex:1"></span>'
          + '<button class="csv-btn" id="txn-csv">Export CSV</button>'
        + '</div>';

      const txnTitle = '<div class="section-title">Transaction Metrics' + infoTip('Per-transaction stats; sortable and window-aware.') + '</div>';
      host.innerHTML = banner + txnTitle + toolbar + '<div id="txn-table-host"></div>';

      const searchInput = document.getElementById('txn-search');
      const tableHost = document.getElementById('txn-table-host');
      const countLabel = document.getElementById('txn-count-label');
      const csvBtn = document.getElementById('txn-csv');

      function renderInner() {
        // Filter → sort → render from the (exact) transaction rows.
        const filtered = presentationRows.filter((r) =>
          !_txnFilterText || String(r.transaction || '').toLowerCase().includes(_txnFilterText.toLowerCase()),
        );
        const sortKey = _txnSortState.column;
        const dir = _txnSortState.direction === 'asc' ? 1 : -1;
        const sorted = [...filtered].sort((a, b) => {
          const va = a[sortKey], vb = b[sortKey];
          if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
          return String(va == null ? '' : va).localeCompare(String(vb == null ? '' : vb)) * dir;
        });
        tableHost.innerHTML = renderSortableTable(sorted, columns, _txnSortState);
        countLabel.textContent = sorted.length + ' of ' + presentationRows.length + ' transactions';
        // Wire header clicks for sort toggling. Re-run after every render
        // because innerHTML wipes the prior listeners.
        tableHost.querySelectorAll('th.sortable').forEach((th) => {
          th.addEventListener('click', () => {
            const col = th.dataset.col;
            if (_txnSortState.column === col) {
              _txnSortState.direction = _txnSortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
              _txnSortState.column = col;
              // Numeric defaults are most useful in descending order
              // (largest count/fail/avg first); strings ascending.
              const sampleVal = sorted[0] ? sorted[0][col] : null;
              _txnSortState.direction = typeof sampleVal === 'number' ? 'desc' : 'asc';
            }
            renderInner();
          });
        });
      }

      searchInput.addEventListener('input', () => {
        _txnFilterText = searchInput.value;
        renderInner();
      });

      csvBtn.onclick = () => {
        // Export the currently-visible rows (after filter + sort). Includes
        // a leading column header row. Each cell is quoted if it contains
        // a comma, double-quote, or newline; embedded quotes are doubled.
        const csvEscape = (v) => {
          const s = v == null ? '' : String(v);
          // Note the regex source is double-escaped because this entire
          // script lives inside a TS template literal. A bare backslash-n
          // there would emit an actual newline into the regex literal in
          // the rendered JS, breaking the report.
          return /[",\\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        };
        const visible = presentationRows
          .filter((r) => !_txnFilterText || String(r.transaction || '').toLowerCase().includes(_txnFilterText.toLowerCase()));
        const sortKey = _txnSortState.column;
        const dir = _txnSortState.direction === 'asc' ? 1 : -1;
        visible.sort((a, b) => {
          const va = a[sortKey], vb = b[sortKey];
          if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
          return String(va == null ? '' : va).localeCompare(String(vb == null ? '' : vb)) * dir;
        });
        const lines = [columns.map(csvEscape).join(',')];
        for (const row of visible) {
          lines.push(columns.map((c) => csvEscape(formatCellValue(row[c]))).join(','));
        }
        const blob = new Blob([lines.join('\\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transactions-' + (reportData.meta.runId || 'export') + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      renderInner();
    }

    // Sortable variant of renderTable — adds clickable header attributes
    // (\`th.sortable[data-col]\`) and an arrow indicator on the active column.
    // Human-friendly column headers. The key stays the data/sort identifier;
    // only the displayed text changes.
    const COL_LABELS = { errorPct: 'error%' };
    function renderSortableTable(rows, columns, sortState) {
      const header = columns.map((c) => {
        const isSorted = c === sortState.column;
        const arrow = isSorted ? (sortState.direction === 'asc' ? '▲' : '▼') : '⇅';
        return '<th class="sortable' + (isSorted ? ' sorted' : '') + '" data-col="' + escapeHtml(c) + '">'
          + escapeHtml(COL_LABELS[c] || c) + '<span class="sort-arrow">' + arrow + '</span></th>';
      }).join('');
      const body = rows.map((row) =>
        '<tr>' + columns.map((c) => {
          const cls = (c === 'transaction' || c === 'scenario') ? ' class="wrap"' : '';
          return '<td' + cls + '>' + escapeHtml(formatCellValue(row[c])) + '</td>';
        }).join('') + '</tr>'
      ).join('');
      return '<div class="table-scroll"><table><thead><tr>' + header + '</tr></thead><tbody>' + body + '</tbody></table></div>';
    }

    // Local (Errors-tab-only) filter state: a clicked category card and a Type
    // dropdown. These are separate from the global scenario/transaction filters
    // and reset when there are no error events.
    let _errCat = '';
    let _errType = '';
    function renderErrors() {
      const panel = document.getElementById('panel-errors');
      const baseRows = (reportData.errors || []).filter((r) => matchesGlobalFilters(r, ['scenario', 'journey'], ['transaction']));
      if (!baseRows.length) {
        _errCat = ''; _errType = '';
        panel.innerHTML = '<div class="empty">No structured error events were captured for this run yet.</div>';
        return;
      }
      const snapshots = reportData.snapshots || [];
      const snapshotByTxn = {};
      snapshots.forEach(function(snap, idx) {
        const txn = snap.transaction;
        if (txn && !(txn in snapshotByTxn)) snapshotByTxn[txn] = idx;
      });

      // #11 Error clustering — bucket every event into a semantic category
      // (Auth, Server 5xx, Client 4xx, Validation, Timeout/Network, …) from its
      // status code + type + message, so the noise collapses into a handful of
      // actionable groups shown as cards above the table.
      const CATS = [
        { key: 'auth', label: 'Authentication', icon: '🔑', color: '#a855f7' },
        { key: 'server', label: 'Server Errors (5xx)', icon: '🔥', color: '#dc2626' },
        { key: 'client', label: 'Client Errors (4xx)', icon: '🚫', color: '#f59e0b' },
        { key: 'validation', label: 'Validation / Assertion', icon: '🧪', color: '#0ea5e9' },
        { key: 'timeout', label: 'Timeout / Network', icon: '⏱️', color: '#14b8a6' },
        { key: 'other', label: 'Other', icon: '❔', color: '#64748b' }
      ];
      const classify = (r) => {
        const st = Number(r.status || 0);
        const txt = (String(r.type || '') + ' ' + String(r.message || '')).toLowerCase();
        if (st === 401 || st === 403 || /unauthor|forbidden|\\btoken\\b|\\bauth\\b|login|credential/.test(txt)) return 'auth';
        if (/timeout|timed out|econnrefused|econnreset|enotfound|dial|socket|network|connection|eof|refused|reset by peer/.test(txt)) return 'timeout';
        if (st >= 500 && st <= 599) return 'server';
        if (st >= 400 && st <= 499) return 'client';
        if (/assert|check_failed|check failed|validation|expected|mismatch|did not (match|equal)|correlation/.test(txt)) return 'validation';
        if (st >= 500) return 'server';
        return 'other';
      };

      // Category counts + type options are computed over the globally-filtered
      // rows (NOT the local filters) so the cards + dropdown always show the full
      // picture. Drop any active local filter that no longer has matches.
      const catCounts = {};
      for (const r of baseRows) { const c = classify(r); catCounts[c] = (catCounts[c] || 0) + 1; }
      const totalErr = baseRows.length;
      const types = [...new Set(baseRows.map((r) => String(r.type || '')).filter(Boolean))].sort();
      if (_errCat && !catCounts[_errCat]) _errCat = '';
      if (_errType && types.indexOf(_errType) === -1) _errType = '';

      // Apply the local category + type filters to get the visible rows.
      const rows = baseRows.filter((r) =>
        (!_errCat || classify(r) === _errCat) && (!_errType || String(r.type || '') === _errType),
      );

      const clusterCards = CATS.filter((c) => catCounts[c.key]).map((c) => {
        const n = catCounts[c.key];
        const pct = totalErr ? Math.round((n / totalErr) * 100) : 0;
        const active = _errCat === c.key ? ' active' : '';
        return '<div class="cluster-card' + active + '" data-cat="' + c.key + '" style="--cc:' + c.color + '" title="Click to filter the table by this category">'
          + '<div class="cluster-top"><span class="cluster-ico">' + c.icon + '</span><span class="cluster-n">' + n + '</span></div>'
          + '<div class="cluster-lbl">' + c.label + '</div>'
          + '<div class="cluster-bar"><span style="width:' + pct + '%"></span></div>'
          + '<div class="cluster-pct">' + pct + '% of events</div></div>';
      }).join('');
      const clustersHtml = clusterCards
        ? '<div class="section-title">Error Categories (' + totalErr + ' events)' + infoTip('Each error is placed in one category from its HTTP status + type + message (first match wins, in this order). Click a card to filter the table. — Authentication: status 401/403 or text mentioning unauthorized/forbidden/token/auth/login/credential. Timeout / Network: timeout, connection reset/refused, DNS, socket, EOF. Server Errors: status 5xx. Client Errors: status 4xx. Validation / Assertion: failed checks (check_failed) or text mentioning assert/validation/expected/mismatch/correlation. Other: anything that matches none of the above.') + '</div><div class="cluster-grid">' + clusterCards + '</div>'
        : '';

      // Local filter toolbar: a Type dropdown (options = the error types actually
      // present) + a live count + a Clear button when any local filter is set.
      const typeOptions = '<option value="">All types</option>'
        + types.map((t) => '<option value="' + escapeHtml(t) + '"' + (t === _errType ? ' selected' : '') + '>' + escapeHtml(t) + '</option>').join('');
      const anyLocal = _errCat || _errType;
      const toolbar = '<div class="txn-toolbar">'
        + '<label style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.04em">Type</label>'
        + '<select id="err-type-filter">' + typeOptions + '</select>'
        + '<span class="subtle" id="err-count-label">' + rows.length + ' of ' + totalErr + ' events'
        + (_errCat ? ' · category: ' + escapeHtml(_errCat) : '') + '</span>'
        + '<span style="flex:1"></span>'
        + (anyLocal ? '<button class="small-btn" id="err-clear">Clear filters</button>' : '')
        + '</div>';

      const anyMachine = rows.some(function(r){ return r.machine; });
      const machColH = anyMachine ? '<th>Machine</th>' : '';
      const header = '<tr><th>Timestamp</th>' + machColH + '<th>Type</th><th>Transaction</th><th>Request</th><th>VU</th><th>Iteration</th><th>Message</th><th></th></tr>';
      const body = rows.length ? rows.map(function(row) {
        const snapIdx = snapshotByTxn[row.transaction];
        const hasSnap = typeof snapIdx === 'number';
        const vu = row.vu != null ? row.vu : (hasSnap ? snapshots[snapIdx].vu : '');
        const iteration = row.iteration != null ? row.iteration : (hasSnap ? snapshots[snapIdx].iteration : '');
        return '<tr>' +
          '<td style="white-space:nowrap">' + escapeHtml(String(row.ts || '')) + '</td>' +
          (anyMachine ? '<td>' + escapeHtml(String(row.machine || '')) + '</td>' : '') +
          '<td>' + escapeHtml(String(row.type || '')) + '</td>' +
          '<td>' + escapeHtml(String(row.transaction || '')) + '</td>' +
          '<td class="wrap">' + escapeHtml(String(row.request || row.requestName || '')) + '</td>' +
          '<td>' + escapeHtml(String(vu ?? '')) + '</td>' +
          '<td>' + escapeHtml(String(iteration ?? '')) + '</td>' +
          '<td class="wrap">' + escapeHtml(String(row.message || '')) + '</td>' +
          '<td>' + (hasSnap ? '<button class="view-btn" onclick="showSnapshotDetail(' + snapIdx + ')">View Request</button>' : '') + '</td>' +
          '</tr>';
      }).join('') : '<tr><td colspan="' + (anyMachine ? 9 : 8) + '" class="subtle" style="text-align:center;padding:18px">No events match the current filter.</td></tr>';

      const groupsHtml = '<div class="section-title">All Error Events' + infoTip('Every captured error event; View opens the snapshot.') + '</div>';
      panel.innerHTML = clustersHtml + groupsHtml + toolbar + '<div class="table-scroll"><table><thead>' + header + '</thead><tbody>' + body + '</tbody></table></div>';

      // Wire the local filters (Errors tab only). Handlers re-run renderErrors,
      // which preserves _errCat/_errType across the re-render.
      panel.querySelectorAll('.cluster-card').forEach((card) => {
        card.addEventListener('click', () => {
          const k = card.getAttribute('data-cat');
          _errCat = (_errCat === k) ? '' : k; // toggle
          renderErrors();
        });
      });
      const typeSel = document.getElementById('err-type-filter');
      if (typeSel) typeSel.addEventListener('change', () => { _errType = typeSel.value; renderErrors(); });
      const clearBtn = document.getElementById('err-clear');
      if (clearBtn) clearBtn.addEventListener('click', () => { _errCat = ''; _errType = ''; renderErrors(); });
    }

    // Local (Warnings-tab-only) Type filter — mirrors the Errors tab.
    let _warnType = '';
    function renderWarnings() {
      const panel = document.getElementById('panel-warnings');
      const baseRows = reportData.warnings || [];
      if (!baseRows.length) {
        _warnType = '';
        panel.innerHTML = '<div class="empty">No structured warning events were captured for this run yet.</div>';
        return;
      }
      const types = [...new Set(baseRows.map((r) => String(r.type || '')).filter(Boolean))].sort();
      if (_warnType && types.indexOf(_warnType) === -1) _warnType = '';
      const rows = baseRows.filter((r) => !_warnType || String(r.type || '') === _warnType);

      const typeOptions = '<option value="">All types</option>'
        + types.map((t) => '<option value="' + escapeHtml(t) + '"' + (t === _warnType ? ' selected' : '') + '>' + escapeHtml(t) + '</option>').join('');
      const toolbar = '<div class="txn-toolbar">'
        + '<label style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.04em">Type</label>'
        + '<select id="warn-type-filter">' + typeOptions + '</select>'
        + '<span class="subtle">' + rows.length + ' of ' + baseRows.length + ' warnings</span>'
        + '<span style="flex:1"></span>'
        + (_warnType ? '<button class="small-btn" id="warn-clear">Clear filters</button>' : '')
        + '</div>';

      const title = '<div class="section-title">Warnings' + infoTip('Non-fatal advisories — worth reviewing, won\\'t fail the test.') + '</div>';
      const table = rows.length
        ? renderTable(rows, ['ts', 'type', 'message'])
        : '<div class="empty">No warnings match the current filter.</div>';
      panel.innerHTML = title + toolbar + table;

      const typeSel = document.getElementById('warn-type-filter');
      if (typeSel) typeSel.addEventListener('change', () => { _warnType = typeSel.value; renderWarnings(); });
      const clearBtn = document.getElementById('warn-clear');
      if (clearBtn) clearBtn.addEventListener('click', () => { _warnType = ''; renderWarnings(); });
    }

    function renderSnapshots() {
      // Map over the ORIGINAL array so the index passed to showSnapshotDetail()
      // still points at reportData.snapshots; skip non-matching rows in place so
      // the global scenario/transaction filter narrows the table without breaking
      // the View-drawer index mapping.
      const allRows = reportData.snapshots || [];
      const matches = allRows.filter((r) => matchesGlobalFilters(r, ['journey', 'scenario'], ['transaction']));
      if (!matches.length) {
        document.getElementById('panel-snapshots').innerHTML = '<div class="empty">No failure snapshots were captured for this run.</div>';
        return;
      }
      const header = '<tr><th>#</th><th>Timestamp</th><th>Type</th><th>Transaction</th><th>VU</th><th>Iteration</th><th></th></tr>';
      let seq = 0;
      const body = allRows.map(function(row, index) {
        if (!matchesGlobalFilters(row, ['journey', 'scenario'], ['transaction'])) return '';
        seq++;
        return '<tr>' +
          '<td>' + escapeHtml(String(seq)) + '</td>' +
          '<td>' + escapeHtml(String(row.ts || '')) + '</td>' +
          '<td>' + escapeHtml(String(row.type || '')) + '</td>' +
          '<td class="wrap">' + escapeHtml(String(row.transaction || '')) + '</td>' +
          '<td>' + escapeHtml(row.vu != null ? String(row.vu) : '') + '</td>' +
          '<td>' + escapeHtml(row.iteration != null ? String(row.iteration) : '') + '</td>' +
          '<td><button class="view-btn" onclick="showSnapshotDetail(' + index + ')">View</button></td>' +
          '</tr>';
      }).join('');
      const title = '<div class="section-title">Failure Snapshots' + infoTip('Request/response captured at the moment of failure.') + '</div>';
      document.getElementById('panel-snapshots').innerHTML = title + '<div class="table-scroll"><table><thead>' + header + '</thead><tbody>' + body + '</tbody></table></div>';
    }

    // Phase 5: render a snapshot as a structured side-drawer (request / response /
    // headers / correlation) instead of raw JSON — DevTools-style.
    function _kvTable(obj) {
      const keys = obj && typeof obj === 'object' ? Object.keys(obj) : [];
      if (!keys.length) return '<div class="subtle" style="font-size:12.5px">—</div>';
      return '<table class="dw-kv"><tbody>' + keys.map((k) =>
        '<tr><td>' + escapeHtml(String(k)) + '</td><td>' + escapeHtml(typeof obj[k] === 'object' ? JSON.stringify(obj[k]) : String(obj[k])) + '</td></tr>'
      ).join('') + '</tbody></table>';
    }
    function _drawerSection(title, inner) {
      return '<div class="dw-sec"><h4>' + title + '</h4>' + inner + '</div>';
    }
    function showSnapshotDetail(index) {
      const s = (reportData.snapshots || [])[index];
      if (!s) return;
      document.getElementById('snapshot-modal-title').textContent = 'Snapshot #' + (index + 1) + (s.transaction ? ' — ' + s.transaction : '');
      const req = s.request || {};
      const res = s.response || {};
      const status = res.status != null ? Number(res.status) : null;
      const stColor = status == null ? 'var(--muted)' : (status >= 200 && status < 400) ? 'var(--ok)' : 'var(--error)';
      let html = '';
      html += '<div class="dw-meta">'
        + (s.type ? '<span>Type <b>' + escapeHtml(String(s.type)) + '</b></span>' : '')
        + (s.vu != null ? '<span>VU <b>' + escapeHtml(String(s.vu)) + '</b></span>' : '')
        + (s.iteration != null ? '<span>Iteration <b>' + escapeHtml(String(s.iteration)) + '</b></span>' : '')
        + (s.phase ? '<span>Phase <b>' + escapeHtml(String(s.phase)) + '</b></span>' : '')
        + (s.ts ? '<span>' + escapeHtml(String(s.ts)) + '</span>' : '')
        + '</div>';
      if (s.message) html += _drawerSection('Message', '<div class="dw-line">' + escapeHtml(String(s.message)) + '</div>');
      html += _drawerSection('Request',
        '<div class="dw-line" style="margin-bottom:8px"><strong>' + escapeHtml(String(req.method || 'REQ')) + '</strong> ' + escapeHtml(String(req.url || '—')) + '</div>'
        + (req.headers ? '<h4 style="margin:10px 0 6px">Request Headers</h4>' + _kvTable(req.headers) : '')
        + (req.body === undefined || req.body === null
            ? ''
            : '<h4 style="margin:10px 0 6px">Request Body</h4>'
              + (typeof req.body === 'string' && req.body.length === 0
                  ? '<div class="subtle" style="font-style:italic">(empty — no request body sent)</div>'
                  : '<pre>' + escapeHtml(typeof req.body === 'object' ? JSON.stringify(req.body, null, 2) : String(req.body)) + '</pre>')));
      html += _drawerSection('Response',
        '<div class="dw-line" style="margin-bottom:8px">Status <span class="dw-badge" style="color:' + stColor + ';background:var(--bg-2)">' + (status != null ? status : '—') + '</span></div>'
        + ((res.error || res.errorCode) ? '<div class="dw-line" style="margin-bottom:8px;color:var(--error)">Error: ' + escapeHtml(String(res.error || '')) + (res.errorCode ? ' (code ' + escapeHtml(String(res.errorCode)) + ')' : '') + '</div>' : '')
        + (res.headers ? '<h4 style="margin:10px 0 6px">Response Headers</h4>' + _kvTable(res.headers) : '')
        // Distinguish three states instead of hiding them all: a captured
        // empty body shows "(empty)", a present body renders, and an absent
        // field (capture disabled) shows nothing.
        + (res.body === undefined || res.body === null
            ? ''
            : '<h4 style="margin:10px 0 6px">Response Body</h4>'
              + (typeof res.body === 'string' && res.body.length === 0
                  ? '<div class="subtle" style="font-style:italic">(empty — server returned no response body)</div>'
                  : '<pre>' + escapeHtml(typeof res.body === 'object' ? JSON.stringify(res.body, null, 2) : String(res.body)) + '</pre>')));
      if (s.correlation && Object.keys(s.correlation).length) html += _drawerSection('Correlation Values', _kvTable(s.correlation));
      html += '<details style="margin-top:8px"><summary class="subtle" style="cursor:pointer;font-size:12.5px">Raw JSON</summary><pre style="margin-top:8px">' + escapeHtml(JSON.stringify(s, null, 2)) + '</pre></details>';
      document.getElementById('snapshot-modal-content').innerHTML = html;
      document.getElementById('snapshot-modal').classList.add('open');
    }

    function closeSnapshotModal(event) {
      if (event.target === event.currentTarget) {
        document.getElementById('snapshot-modal').classList.remove('open');
      }
    }

    // System tab chart instances kept module-scoped so re-renders clean up.
    let systemChartInstances = [];
    function destroySystemCharts() {
      for (const c of systemChartInstances) { try { c.destroy(); } catch {} }
      systemChartInstances = [];
    }

    // Phase 6: Execution Timeline chart (VUs + HTTP failures over time) on Summary.
    let summaryChartInstances = [];
    function destroySummaryCharts() {
      for (const c of summaryChartInstances) { try { c.destroy(); } catch {} }
      summaryChartInstances = [];
    }
    function renderTimelineChart(ov) {
      const el = document.getElementById('chart-timeline');
      if (!el || !ov || ov.length < 2 || !window.Chart) return;
      summaryChartInstances.push(new Chart(el, {
        type: 'line',
        data: {
          labels: ov.map((b) => fmtBucketTs(b.ts)),
          datasets: [
            { label: 'VUs', data: ov.map((b) => Number(b.vus || 0)), borderColor: '#0e7490', backgroundColor: '#0e749022', fill: true, tension: 0.3, pointRadius: 0, yAxisID: 'y' },
            { label: 'Failed requests', data: ov.map((b) => Number(b.httpFailedCount || 0)), borderColor: '#dc2626', backgroundColor: '#dc262622', fill: true, tension: 0.2, pointRadius: 0, yAxisID: 'y1' },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: { legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 10 }, onClick: isolateLegend } },
          scales: {
            x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10, font: { size: 11 } }, grid: { color: gridColor() } },
            y: { position: 'left', beginAtZero: true, title: { display: true, text: 'VUs' }, grid: { color: gridColor() } },
            y1: { position: 'right', beginAtZero: true, title: { display: true, text: 'Failed requests' }, grid: { drawOnChartArea: false } },
          },
        },
      }));
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => requestAnimationFrame(() => { for (const c of summaryChartInstances) { try { c.resize(); } catch {} } }));
      }
    }

    // Transaction p(x)-SLA pass/breach doughnut on the Summary tab (one per
    // compliance percentile). Tracked in summaryChartInstances so it's torn down
    // with the rest on re-render. \`pctLabel\` is e.g. "p(90)".
    function renderCompliancePie(canvasId, pctLabel, passed, breached) {
      const el = document.getElementById(canvasId);
      if (!el || !window.Chart || (passed + breached) === 0) return;
      const withinLabel = 'within ' + String(pctLabel).replace(/[()]/g, '') + ' SLA';
      const total = passed + breached;
      const colors = ['#16a34a', '#dc2626'];
      const pctOf = (v) => total > 0 ? Math.round((v / total) * 100) : 0;
      // Always-on center text: the headline "within SLA" percentage. Per-arc %
      // labels were removed; the pass/fail percentages live in the legend.
      const alwaysOnLabels = {
        id: 'pieAlwaysOnLabels',
        afterDraw(chart) {
          const ctx = chart.ctx;
          const meta = chart.getDatasetMeta(0);
          const first = meta.data[0];
          if (!first) return;
          ctx.save();
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = currentTheme() === 'dark' ? '#e7edf5' : '#1b2735';
          ctx.font = '800 26px Inter, Segoe UI, sans-serif';
          ctx.fillText(pctOf(passed) + '%', first.x, first.y - 6);
          ctx.fillStyle = currentTheme() === 'dark' ? '#9aa8b7' : '#6b7888';
          ctx.font = '600 11px Inter, Segoe UI, sans-serif';
          ctx.fillText(withinLabel, first.x, first.y + 14);
          ctx.restore();
        },
      };
      summaryChartInstances.push(new Chart(el, {
        type: 'doughnut',
        data: {
          labels: ['Pass', 'Fail'],
          datasets: [{
            data: [passed, breached],
            backgroundColor: colors,
            borderColor: currentTheme() === 'dark' ? '#151d27' : '#ffffff',
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '62%',
          layout: { padding: { top: 12, bottom: 6, left: 12, right: 12 } },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true, boxWidth: 10, padding: 14,
                // Explicit theme-aware text color — without it the legend labels
                // render dark-on-dark and are invisible in dark mode.
                color: currentTheme() === 'dark' ? '#e7edf5' : '#1b2735',
                generateLabels: (chart) => {
                  const d = chart.data.datasets[0].data;
                  return chart.data.labels.map((lbl, i) => ({
                    text: lbl + ' — ' + (Number(d[i]) || 0) + ' (' + pctOf(Number(d[i]) || 0) + '%)',
                    fillStyle: colors[i], strokeStyle: colors[i], pointStyle: 'circle', index: i,
                    fontColor: currentTheme() === 'dark' ? '#e7edf5' : '#1b2735',
                  }));
                },
              },
            },
            tooltip: { callbacks: { label: (ctx) =>
              ' ' + ctx.label + ': ' + ctx.parsed + ' (' + pctOf(ctx.parsed) + '%)',
            } },
          },
        },
        plugins: [alwaysOnLabels],
      }));
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => requestAnimationFrame(() => { for (const c of summaryChartInstances) { try { c.resize(); } catch {} } }));
      }
    }

    function renderSystem() {
      destroySystemCharts();
      const agents = reportData.system?.agents || [];
      const snapshots = reportData.system?.snapshots || [];
      const agentsTable = agents.length ? renderTable(agents, ['host', 'pid', 'jobId', 'containerId']) : '<div class="empty">No agent identity metadata recorded.</div>';
      // Per-agent system series come from the timeseries artifact; the older
      // snapshots array stays as a table fallback (and for backwards-compat
      // with reports generated before the line chart shipped).
      const systemSeries = reportData.timeseries?.series?.system || {};
      const agentNames = Object.keys(systemSeries);
      const hasSeries = agentNames.some((name) => (systemSeries[name] || []).length > 1);

      // min / avg / max CPU & memory across all agents' samples in the window.
      const sysRange = getSelectedRange();
      const allCpu = [], allMem = [];
      for (const name of agentNames) {
        for (const p of filterSeriesByRange(systemSeries[name] || [], sysRange)) {
          if (p.cpuPercent != null) allCpu.push(Number(p.cpuPercent));
          if (p.memoryPercent != null) allMem.push(Number(p.memoryPercent));
        }
      }
      const mmm = (arr) => {
        if (!arr.length) return null;
        let mn = Infinity, mx = -Infinity, s = 0;
        for (const v of arr) { if (v < mn) mn = v; if (v > mx) mx = v; s += v; }
        return { min: mn, avg: s / arr.length, max: mx };
      };
      const cpu = mmm(allCpu), mem = mmm(allMem);
      const statCard = (label, st) => st
        ? '<div class="card"><h3>' + label + '</h3><strong>' + st.min.toFixed(1) + ' / ' + st.avg.toFixed(1) + ' / ' + st.max.toFixed(1) + '%</strong></div>'
        : '';
      const statCards = (cpu || mem)
        ? '<div class="section-title">Load Generator Health' + infoTip('CPU/memory of the test machine (min / avg / max).') + '</div>'
          + '<div class="cards" style="margin-bottom:18px">'
            + statCard('CPU % — min / avg / max', cpu)
            + statCard('Memory % — min / avg / max', mem)
          + '</div>'
        : '';

      document.getElementById('panel-system').innerHTML = \`
        \${statCards}
        <div class="chart-box" style="margin-bottom:18px">
          <h3>Host Resource Usage Over Time\${infoTip('Load-generator CPU% and memory% over time.')}</h3>
          \${hasSeries
            ? '<div class="chart-canvas-wrap" style="min-height:260px"><canvas id="chart-system-cpu-mem"></canvas></div>'
            : '<div class="empty">No host monitoring data captured. Enable <code>runtime.monitoring.enabled</code> in your runtime settings to record per-bucket CPU/memory percent.</div>'
          }
        </div>
        <div class="split">
          <div class="card">
            <h3>Agents\${infoTip('The load-generator host(s) that ran the test.')}</h3>
            \${agentsTable}
          </div>
          <div class="card">
            <h3>Raw Host Snapshots\${infoTip('Raw CPU/memory samples behind the chart.')}</h3>
            \${snapshots.length ? renderTable(snapshots, ['ts', 'cpuPercent', 'memoryPercent']) : '<div class="empty">No raw host snapshots recorded.</div>'}
          </div>
        </div>
      \`;

      if (!hasSeries) return;

      // Build a unified per-bucket label set across agents. In practice all
      // agents share the same bucket grid (set by TimeseriesArtifactBuilder)
      // so the first agent's labels are authoritative.
      const firstName = agentNames.find((n) => (systemSeries[n] || []).length > 1) || agentNames[0];
      const points = systemSeries[firstName] || [];
      const range = getSelectedRange();
      const filtered = filterSeriesByRange(points, range);
      const labels = filtered.map((p) => fmtBucketTs(p.ts));

      const datasets = [];
      const palette = ['#005f73','#b91c1c','#0a9396','#f59e0b','#7c3aed','#15803d'];
      agentNames.forEach((name, idx) => {
        const pts = filterSeriesByRange(systemSeries[name] || [], range);
        datasets.push({
          label: name + ' — CPU %',
          data: pts.map((p) => Number(p.cpuPercent || 0)),
          borderColor: palette[(idx * 2) % palette.length],
          backgroundColor: palette[(idx * 2) % palette.length] + '22',
          borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0.2, spanGaps: true,
        });
        datasets.push({
          label: name + ' — Memory %',
          data: pts.map((p) => Number(p.memoryPercent || 0)),
          borderColor: palette[(idx * 2 + 1) % palette.length],
          backgroundColor: palette[(idx * 2 + 1) % palette.length] + '22',
          borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0.2,
          borderDash: [4, 4], spanGaps: true,
        });
      });

      systemChartInstances.push(new Chart(document.getElementById('chart-system-cpu-mem'), {
        type: 'line',
        data: { labels, datasets },
        options: lineOptions('%', { suggestedMax: 100 }, filtered),
      }));
    }

    function renderMiniTable(rows, columns) {
      return renderTable(rows, columns);
    }

    function formatCellValue(value) {
      if (value == null || value === '') return '';
      if (typeof value === 'number') {
        return Number.isInteger(value) ? value.toString() : value.toFixed(2);
      }
      return String(value);
    }

    function renderTable(rows, columns) {
      const header = columns.map((column) => '<th>' + escapeHtml(column) + '</th>').join('');
      const body = rows.map((row) => '<tr>' + columns.map((column) => '<td>' + escapeHtml(formatCellValue(row[column])) + '</td>').join('') + '</tr>').join('');
      return '<div class="table-scroll"><table><thead><tr>' + header + '</tr></thead><tbody>' + body + '</tbody></table></div>';
    }

    function renderOverviewCards(point) {
      const cards = [
        ['Requests', point.requests ?? 0],
        ['Iterations', point.iterations ?? 0],
        ['Error Rate', point.errorRate ?? 0],
        ['Avg Duration', point.avgDuration ?? 0],
        ['P95 Duration', point.p95Duration ?? 0],
        ['VUs Max', point.vusMax ?? point.vus ?? 0]
      ];
      return '<div class="cards">' + cards.map(([label, value]) => '<div class="card"><h3>' + escapeHtml(label) + '</h3><strong>' + escapeHtml(Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 2)) + '</strong></div>').join('') + '</div>';
    }

    // renderTransactionBars removed — replaced by Chart.js renderBarChart()

    // ── Wave 2: global range as a broadcasted singleton ────────────
    // Every range-aware tab listens on \`document\` for \`rangechange\` and
    // re-renders its visible content. Pages that don't care (Warnings,
    // raw event tables) just ignore the event. Initial state is the full
    // run window; null means "reset to full run".
    function getSelectedRange() {
      if (window.__k6PerfRange) return window.__k6PerfRange;
      // Prefer the actual series bounds over meta.startTime/endTime.
      // Meta times come from k6StartTime/k6EndTime at runtime; if they
      // ever fall outside the parsed bucket window, filtering by them
      // would silently drop every bucket and produce empty charts.
      const ov = (reportData.timeseries && reportData.timeseries.series && reportData.timeseries.series.overview) || [];
      if (ov.length > 0) return { from: ov[0].ts, to: ov[ov.length - 1].ts };
      return { from: reportData.meta.startTime, to: reportData.meta.endTime };
    }

    function updateGlobalTimeRange(from, to) {
      if (!from && !to) {
        window.__k6PerfRange = null;
      } else {
        window.__k6PerfRange = {
          from: from ? new Date(from).toISOString() : reportData.meta.startTime,
          to: to ? new Date(to).toISOString() : reportData.meta.endTime
        };
      }
      document.dispatchEvent(new CustomEvent('rangechange', { detail: getSelectedRange() }));
    }

    function hydrateTimeInputs(fromInput, toInput) {
      const range = getSelectedRange();
      fromInput.value = toLocalInputValue(range.from);
      toInput.value = toLocalInputValue(range.to);
    }

    // ── Wave 2: saved intervals (localStorage, runId-keyed) ─────────
    // Allows users to bookmark time windows ("steady-state", "ramp-up",
    // "spike at minute 12") inside the report itself. Persists across
    // reloads, scoped per run so different runs' intervals don't mix.
    const SAVED_INTERVALS_KEY = 'k6perf-intervals-' + reportData.meta.runId;

    function loadSavedIntervals() {
      try {
        const raw = localStorage.getItem(SAVED_INTERVALS_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    }

    function persistSavedIntervals(list) {
      try { localStorage.setItem(SAVED_INTERVALS_KEY, JSON.stringify(list)); } catch {}
    }

    function saveCurrentInterval(name) {
      const list = loadSavedIntervals();
      const r = getSelectedRange();
      // Replace existing entry with the same name (idempotent re-save).
      const without = list.filter((x) => x.name !== name);
      without.push({ name, from: r.from, to: r.to });
      persistSavedIntervals(without);
      renderSavedIntervals();
    }

    function deleteSavedInterval(name) {
      persistSavedIntervals(loadSavedIntervals().filter((x) => x.name !== name));
      renderSavedIntervals();
    }

    function applySavedInterval(name) {
      const found = loadSavedIntervals().find((x) => x.name === name);
      if (!found) return;
      updateGlobalTimeRange(found.from, found.to);
      const fromInput = document.getElementById('gtb-from');
      const toInput = document.getElementById('gtb-to');
      fromInput.value = toLocalInputValue(found.from);
      toInput.value = toLocalInputValue(found.to);
    }

    function renderSavedIntervals() {
      const host = document.getElementById('gtb-saved-list');
      const list = loadSavedIntervals();
      if (list.length === 0) {
        host.innerHTML = '<span class="subtle" style="font-size:12px">No saved intervals — name one and click Save.</span>';
        return;
      }
      host.innerHTML = list.map((iv) =>
        '<span class="saved-chip" title="' + escapeHtml(iv.from + ' → ' + iv.to) + '">' +
          '<span data-action="apply" data-name="' + escapeHtml(iv.name) + '">' + escapeHtml(iv.name) + '</span>' +
          '<button class="x" data-action="delete" data-name="' + escapeHtml(iv.name) + '" title="Delete">×</button>' +
        '</span>'
      ).join('');
      // Event delegation — apply/delete dispatched from a single listener.
      host.onclick = (e) => {
        const t = e.target;
        if (!t || !t.dataset) return;
        const name = t.dataset.name || (t.parentElement && t.parentElement.dataset.name);
        if (!name) return;
        if (t.dataset.action === 'delete') deleteSavedInterval(name);
        else if (t.dataset.action === 'apply' || t.classList.contains('saved-chip')) applySavedInterval(name);
      };
    }

    function setupGlobalToolbar() {
      const fromInput = document.getElementById('gtb-from');
      const toInput = document.getElementById('gtb-to');
      const nameInput = document.getElementById('gtb-name');
      hydrateTimeInputs(fromInput, toInput);
      document.getElementById('gtb-apply').onclick = () => {
        updateGlobalTimeRange(fromInput.value, toInput.value);
      };
      document.getElementById('gtb-reset').onclick = () => {
        updateGlobalTimeRange(null, null);
        hydrateTimeInputs(fromInput, toInput);
      };
      document.getElementById('gtb-save').onclick = () => {
        const name = nameInput.value.trim();
        if (!name) return;
        saveCurrentInterval(name);
        nameInput.value = '';
      };
      renderSavedIntervals();
    }

    function toLocalInputValue(ts) {
      const date = new Date(ts);
      const pad = (value) => String(value).padStart(2, '0');
      return date.getFullYear() + '-' +
        pad(date.getMonth() + 1) + '-' +
        pad(date.getDate()) + 'T' +
        pad(date.getHours()) + ':' +
        pad(date.getMinutes());
    }

    function filterSeriesByRange(rows, range) {
      const from = new Date(range.from).getTime();
      const to = new Date(range.to).getTime();
      return rows.filter((row) => {
        const value = new Date(row.ts).getTime();
        return value >= from && value <= to;
      });
    }

    // ── Phase 2: theme (light/dark) ───────────────────────────────
    function currentTheme() {
      return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }
    // Theme-aware chart grid line color (Chart.js draws on canvas → needs a real color).
    function gridColor() {
      return currentTheme() === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
    }
    function applyTheme(theme, rerender) {
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('k6perf-theme', theme); } catch {}
      if (window.Chart) {
        Chart.defaults.color = theme === 'dark' ? '#9aa7b4' : '#66717d';
        Chart.defaults.borderColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
      }
      const btn = document.getElementById('theme-toggle');
      if (btn) btn.innerHTML = '<span class="tt-ico">' + (theme === 'dark' ? '☀️' : '🌙') + '</span><span class="tt-lbl">' + (theme === 'dark' ? 'Light' : 'Dark') + '</span>';
      if (rerender) {
        try { renderGraphs(); } catch {}
        try { renderSystem(); } catch {}
        try { renderSummary(); } catch {}
      }
    }
    // Apply saved theme BEFORE the first render so charts pick up the right colors.
    (function initTheme() {
      let t = 'light';
      try { t = localStorage.getItem('k6perf-theme') || 'light'; } catch {}
      applyTheme(t, false);
    })();
    const _themeBtn = document.getElementById('theme-toggle');
    if (_themeBtn) _themeBtn.onclick = () => applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);

    // ── #1: make every rendered table sortable (click header) + columns
    // resizable (drag the right edge). Generic + idempotent; re-run after each
    // render since innerHTML replaces table elements. Skips headers that already
    // own their sort (the Transactions table's th.sortable) — those just get
    // resize handles.
    function sortTableByColumn(table, idx) {
      const tbody = table.querySelector('tbody');
      if (!tbody) return;
      const rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
      const dir = (table.__sortIdx === idx && table.__sortDir === 1) ? -1 : 1;
      table.__sortIdx = idx; table.__sortDir = dir;
      const num = (s) => {
        const t = String(s).replace(/,/g, '').replace(/\\s*(ms|%|s|KB|MB|GB|B|\\/s)$/i, '').trim();
        if (t === '') return null;
        const n = Number(t);
        return isNaN(n) ? null : n;
      };
      rows.sort((a, b) => {
        const av = a.children[idx] ? a.children[idx].textContent.trim() : '';
        const bv = b.children[idx] ? b.children[idx].textContent.trim() : '';
        const an = num(av), bn = num(bv);
        if (an !== null && bn !== null) return (an - bn) * dir;
        return av.localeCompare(bv) * dir;
      });
      rows.forEach((r) => tbody.appendChild(r));
      table.querySelectorAll('thead th').forEach((h, i) => {
        if (i === idx) h.setAttribute('data-sortdir', dir === 1 ? 'asc' : 'desc');
        else h.removeAttribute('data-sortdir');
      });
    }
    function startColResize(ev, table, th) {
      ev.preventDefault(); ev.stopPropagation();
      if (!table.__fixed) {
        const ths = table.querySelectorAll('thead th');
        table.style.width = table.offsetWidth + 'px';
        ths.forEach((h) => { h.style.width = h.offsetWidth + 'px'; });
        table.style.tableLayout = 'fixed';
        table.__fixed = true;
      }
      const startX = ev.clientX, startW = th.offsetWidth;
      const move = (e) => { th.style.width = Math.max(48, startW + (e.clientX - startX)) + 'px'; };
      const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); document.body.style.userSelect = ''; };
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    }
    function enhanceTables(root) {
      (root || document).querySelectorAll('.table-scroll table').forEach((table) => {
        if (table.__enhanced) return;
        table.__enhanced = true;
        table.querySelectorAll('thead th').forEach((th, idx) => {
          const handle = document.createElement('span');
          handle.className = 'col-resize';
          handle.addEventListener('mousedown', (ev) => startColResize(ev, table, th));
          handle.addEventListener('click', (ev) => ev.stopPropagation());
          th.appendChild(handle);
          if (!th.classList.contains('sortable')) { // transactions table owns its sort
            th.classList.add('gensort');
            th.addEventListener('click', (ev) => { if (ev.target && ev.target.classList && ev.target.classList.contains('col-resize')) return; sortTableByColumn(table, idx); });
          }
        });
      });
    }

    buildTabs();
    setupGlobalToolbar();
    setupFilterToolbar();
    renderSummary();
    renderGraphs();
    renderTransactions();
    renderErrors();
    renderWarnings();
    renderSnapshots();
    renderSystem();
    enhanceTables();

    // ── Wave 2: rangechange / filterchange broadcast ──────────────
    // Re-render every range-aware tab when the user applies a new
    // window OR changes the global scenario/transaction filter. Cheap
    // because each render fully replaces its panel's innerHTML — we
    // don't try to incrementally update. Tabs that ignore both (raw
    // warnings) re-render identically.
    function rerenderRangeAwareTabs() {
      renderSummary();
      renderGraphs();
      renderTransactions();
      renderErrors();
      renderSnapshots();
      renderSystem();
      enhanceTables();
    }
    document.addEventListener('rangechange', rerenderRangeAwareTabs);
    document.addEventListener('filterchange', rerenderRangeAwareTabs);
  </script>
</body>
</html>`;
  }

  private static escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
