"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLDiffReporter = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class HTMLDiffReporter {
    static generateReport(results, outPath, options) {
        const payload = this.buildPayload(results, options);
        // Embed the report data once and let the browser render all views from it.
        // This keeps the HTML self-contained while making the UI behave like a small app.
        const serialized = JSON.stringify(payload)
            .replace(/</g, '\\u003c')
            .replace(/\u2028/g, '\\u2028')
            .replace(/\u2029/g, '\\u2029');
        const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Debug Replay Console</title>
  <style>
    :root {
      --bg: #f7f8fb;
      --bg-2: #eef1f7;
      --panel: #ffffff;
      --panel-2: #fafbfd;
      --ink: #1b2735;
      --muted: #6b7888;
      --border: #e8ebf2;
      --border-soft: #f1f4f8;
      --accent: #0e7490;
      --accent-2: #0891b2;
      --accent-soft: #e6f4f9;
      --good: #15803d;
      --warn: #b45309;
      --bad: #dc2626;
      --shadow: 0 1px 2px rgba(16,24,40,.03), 0 6px 22px rgba(16,24,40,.05);
      --shadow-lg: 0 2px 6px rgba(16,24,40,.04), 0 18px 50px rgba(16,24,40,.09);
      --radius: 16px;
      --radius-sm: 11px;
      --mono: "SF Mono", "Cascadia Code", "Fira Code", Consolas, monospace;
      --sans: "Inter", "Segoe UI", Tahoma, system-ui, sans-serif;
    }
    [data-theme="dark"] {
      --bg: #0f141a;
      --bg-2: #18212c;
      --panel: #151d27;
      --panel-2: #111822;
      --ink: #e7edf5;
      --muted: #9aa8b7;
      --border: #2a3644;
      --border-soft: #202a36;
      --accent: #22d3ee;
      --accent-2: #38bdf8;
      --accent-soft: #113642;
      --good: #34d399;
      --warn: #fbbf24;
      --bad: #f87171;
      --shadow: 0 1px 2px rgba(0,0,0,.4), 0 12px 32px rgba(0,0,0,.45);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: var(--sans);
      font-size: 14px;
      line-height: 1.5;
      letter-spacing: -.003em;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    button, input, select { font: inherit; }
    button { color: inherit; }
    /* Collapsed icon rail by default; hover-expands as an overlay so the main
       content never reflows (mirrors the custom report's sidebar). */
    .app { display: flex; min-height: 100vh; padding-left: 64px; }
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      width: 64px;
      z-index: 40;
      background: var(--panel);
      border-right: 1px solid var(--border);
      padding: 16px 8px;
      overflow-x: hidden;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: width .16s ease, box-shadow .16s ease;
    }
    .sidebar:hover, .sidebar:focus-within { width: 236px; box-shadow: 14px 0 44px rgba(16,24,40,.14); }
    [data-theme="dark"] .sidebar:hover, [data-theme="dark"] .sidebar:focus-within { box-shadow: 14px 0 44px rgba(0,0,0,.55); }
    .brand {
      padding: 6px 8px 12px;
      border-bottom: 1px solid var(--border-soft);
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 10px;
      white-space: nowrap;
    }
    .brand-mark { flex: 0 0 30px; text-align: center; font-size: 22px; line-height: 1; }
    .brand-text { min-width: 0; opacity: 0; transition: opacity .12s ease; }
    .sidebar:hover .brand-text, .sidebar:focus-within .brand-text { opacity: 1; }
    .brand-title { font-size: 17px; font-weight: 700; letter-spacing: -.01em; }
    .brand-subtitle { color: var(--muted); font-size: 12px; margin-top: 2px; }
    .nav { display: flex; flex-direction: column; gap: 2px; }
    .nav button {
      display: flex;
      align-items: center;
      gap: 10px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--muted);
      padding: 10px 11px;
      border-radius: 9px;
      cursor: pointer;
      text-align: left;
      font-weight: 650;
      white-space: nowrap;
      overflow: hidden;
    }
    .nav button:hover { background: var(--bg-2); color: var(--ink); }
    .nav button.active { background: var(--accent); border-color: var(--accent); color: #fff; }
    .nav-ico { flex: 0 0 24px; text-align: center; font-size: 16px; }
    .nav-lbl { flex: 1 1 auto; min-width: 0; overflow: hidden; opacity: 0; transition: opacity .12s ease; }
    .nav-count {
      min-width: 24px;
      text-align: center;
      border-radius: 999px;
      padding: 1px 7px;
      background: var(--bg-2);
      color: var(--muted);
      font-size: 11px;
      font-weight: 700;
      opacity: 0;
      transition: opacity .12s ease;
    }
    .sidebar:hover .nav-lbl, .sidebar:focus-within .nav-lbl,
    .sidebar:hover .nav-count, .sidebar:focus-within .nav-count { opacity: 1; }
    .nav button.active .nav-count { background: rgba(255,255,255,.18); color: #fff; }
    .sidebar-foot {
      margin-top: auto;
      border-top: 1px solid var(--border-soft);
      padding: 10px 4px 0;
      display: grid;
      gap: 8px;
    }
    .sidebar-foot .btn { display: flex; align-items: center; gap: 10px; overflow: hidden; white-space: nowrap; }
    .main {
      flex: 1 1 auto;
      min-width: 0;
      max-width: 1440px;
      margin: 0 auto;
      padding: 32px 36px 88px;
      width: 100%;
    }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 20;
      background: color-mix(in srgb, var(--bg) 82%, transparent);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 13px 14px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
      margin-bottom: 24px;
    }
    /* Direct children only — the search box and the two selects. Scoped with a
       child combinator so it does NOT match the checkbox nested inside each
       .toggle label (that broad match inflated every checkbox into a 38px
       padded box, making the toggle chips taller/bulkier than the rest of the
       row). */
    .topbar > input, .topbar > select {
      border: 1px solid var(--border);
      border-radius: 9px;
      background: var(--panel);
      color: var(--ink);
      padding: 8px 10px;
      min-height: 38px;
      outline: none;
    }
    .topbar > input:focus, .topbar > select:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
    }
    .search { flex: 1 1 280px; min-width: 220px; }
    .control-group { display: inline-flex; gap: 8px; align-items: center; color: var(--muted); font-size: 12px; font-weight: 700; }
    .toggle {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      border: 1px solid var(--border);
      background: var(--panel);
      border-radius: 9px;
      padding: 7px 9px;
      cursor: pointer;
      min-height: 38px;
    }
    .toggle input { accent-color: var(--accent); }
    .btn {
      border: 1px solid var(--border);
      background: var(--panel);
      border-radius: 9px;
      padding: 8px 11px;
      cursor: pointer;
      font-weight: 700;
      min-height: 38px;
    }
    .btn:hover { border-color: var(--accent); color: var(--accent); }
    .btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
    .hero {
      border: 1px solid var(--border-soft);
      background: var(--panel);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 28px 30px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 28px;
      flex-wrap: wrap;
    }
    .hero-main { flex: 1 1 360px; min-width: 0; }
    .eyebrow { color: var(--muted); text-transform: uppercase; letter-spacing: .12em; font-size: 11px; font-weight: 700; }
    h1, h2, h3 { margin: 0; letter-spacing: -.02em; }
    h1 { font-size: 28px; font-weight: 700; margin-top: 8px; }
    .hero-meta { margin-top: 12px; color: var(--muted); display: flex; gap: 18px; flex-wrap: wrap; font-size: 13px; }
    .health {
      min-width: 164px;
      text-align: center;
      border-left: 1px solid var(--border-soft);
      padding: 6px 22px;
    }
    .health-num { font-size: 46px; font-weight: 750; line-height: 1; letter-spacing: -.03em; }
    .health-label { color: var(--muted); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; margin-top: 6px; }
    .status-banner {
      border: 1px solid var(--border-soft);
      border-left-width: 4px;
      border-radius: var(--radius);
      background: var(--panel);
      padding: 18px 22px;
      box-shadow: var(--shadow);
      margin-bottom: 24px;
    }
    .status-banner.passed { border-left-color: var(--good); }
    .status-banner.drift { border-left-color: var(--warn); }
    .status-banner.broken { border-left-color: var(--bad); }
    .status-title { font-size: 16px; font-weight: 700; letter-spacing: .01em; }
    .status-banner.passed .status-title { color: var(--good); }
    .status-banner.drift .status-title { color: var(--warn); }
    .status-banner.broken .status-title { color: var(--bad); }
    .status-text { color: var(--muted); margin-top: 6px; line-height: 1.55; }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(192px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .card, .panel {
      border: 1px solid var(--border-soft);
      background: var(--panel);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      min-width: 0;
    }
    .card { padding: 18px 20px; transition: box-shadow .16s ease, transform .16s ease; }
    .card:hover { box-shadow: var(--shadow-lg); transform: translateY(-1px); }
    .card-label { color: var(--muted); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; }
    .card-value { display: block; margin-top: 10px; font-size: 27px; font-weight: 700; letter-spacing: -.02em; }
    .panel { margin-bottom: 24px; overflow: hidden; }
    .panel-head {
      padding: 18px 20px;
      border-bottom: 1px solid var(--border-soft);
      background: transparent;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .panel-title { font-size: 15px; font-weight: 700; letter-spacing: -.01em; }
    .panel-subtitle { color: var(--muted); font-size: 12px; margin-top: 3px; }
    .panel-body { padding: 20px; }
    .split {
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(320px, .65fr);
      gap: 18px;
      align-items: start;
    }
    .table-scroll { width: 100%; overflow: auto; max-height: 72vh; }
    table { border-collapse: separate; border-spacing: 0; width: 100%; min-width: 760px; }
    th, td {
      border-bottom: 1px solid var(--border-soft);
      padding: 13px 16px;
      text-align: left;
      vertical-align: top;
      white-space: nowrap;
      font-size: 13px;
    }
    th {
      position: sticky;
      top: 0;
      z-index: 1;
      background: var(--panel-2);
      color: var(--muted);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .07em;
      font-weight: 600;
    }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:nth-child(even) td { background: color-mix(in srgb, var(--panel-2) 50%, transparent); }
    tbody tr:hover td { background: var(--accent-soft); }
    td.wrap { white-space: normal; word-break: break-word; min-width: 260px; }
    td.mono, pre, code { font-family: var(--mono); }
    .row-action { cursor: pointer; }
    .pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      padding: 2px 9px;
      font-size: 11px;
      font-weight: 700;
      border: 1px solid var(--border);
      background: var(--panel-2);
      color: var(--ink);
      white-space: nowrap;
    }
    .pill.good { color: var(--good); background: color-mix(in srgb, var(--good) 12%, var(--panel)); border-color: color-mix(in srgb, var(--good) 30%, var(--border)); }
    .pill.warn { color: var(--warn); background: color-mix(in srgb, var(--warn) 12%, var(--panel)); border-color: color-mix(in srgb, var(--warn) 30%, var(--border)); }
    .pill.bad { color: var(--bad); background: color-mix(in srgb, var(--bad) 10%, var(--panel)); border-color: color-mix(in srgb, var(--bad) 30%, var(--border)); }
    .pill.accent { color: var(--accent); background: var(--accent-soft); border-color: color-mix(in srgb, var(--accent) 35%, var(--border)); }
    .score { font-weight: 700; font-variant-numeric: tabular-nums; }
    .score.good { color: var(--good); }
    .score.warn { color: var(--warn); }
    .score.bad { color: var(--bad); }
    .status-2xx { color: var(--good); font-weight: 700; }
    .status-3xx { color: var(--accent); font-weight: 700; }
    .status-4xx { color: var(--warn); font-weight: 700; }
    .status-5xx { color: var(--bad); font-weight: 700; }
    .issue-list { display: flex; flex-wrap: wrap; gap: 5px; }
    .insights { margin: 0; padding-left: 18px; color: var(--ink); line-height: 1.55; }
    .insights li { margin: 7px 0; }
    .empty { color: var(--muted); font-style: italic; padding: 12px 0; }
    .kvs { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px; }
    .kv {
      border: 1px solid var(--border);
      background: var(--panel-2);
      border-radius: 10px;
      padding: 10px 12px;
      min-width: 0;
    }
    .kv-label { color: var(--muted); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
    .kv-value { margin-top: 4px; word-break: break-word; }
    pre {
      margin: 0;
      background: #101820;
      color: #d7e3ee;
      border-radius: 10px;
      padding: 12px;
      max-height: 54vh;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
      font-size: 12px;
    }
    [data-theme="dark"] pre { background: #0a1017; color: #dce7ef; }
    .body-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .body-pane { min-width: 0; }
    .body-pane h4 { margin: 0 0 8px; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; font-size: 11px; }
    .diff-line { display: block; margin: 0 -4px; padding: 0 4px; border-radius: 4px; }
    .diff-line.changed { background: rgba(220, 38, 38, .22); }
    /* Foldable JSON tree — each object/array node collapses independently. */
    .jt-wrap {
      background: #101820; color: #d7e3ee; border-radius: 10px; padding: 12px;
      max-height: 54vh; overflow: auto; font-family: var(--mono); font-size: 12px;
      line-height: 1.55; white-space: normal; word-break: break-word;
    }
    [data-theme="dark"] .jt-wrap { background: #0a1017; color: #dce7ef; }
    .jt-node { display: inline; }
    .jt-kids { display: block; padding-left: 16px; border-left: 1px solid rgba(255,255,255,.09); margin-left: 1px; }
    .jt-row { display: block; }
    .jt-row.changed { background: rgba(220, 38, 38, .26); border-radius: 4px; margin: 0 -3px; padding: 0 3px; }
    .jt-key { color: #7dd3fc; }
    .jt-str { color: #a5d6a7; }
    .jt-num { color: #fca5a5; }
    .jt-bool { color: #fcd34d; }
    .jt-null { color: #94a3b8; }
    .jt-empty { color: #9aa8b7; }
    .jt-tog, .jt-stub { cursor: pointer; user-select: none; }
    .jt-tog::before { content: '▾'; display: inline-block; width: 12px; color: #7891a5; }
    .jt-stub::before { content: '▸'; display: inline-block; width: 12px; color: #7891a5; }
    .jt-stub { display: none; color: #9aa8b7; }
    .jt-node.collapsed > .jt-tog, .jt-node.collapsed > .jt-kids, .jt-node.collapsed > .jt-close { display: none; }
    .jt-node.collapsed > .jt-stub { display: inline; }
    .drawer-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, .45);
      z-index: 50;
      display: none;
      justify-content: flex-end;
    }
    .drawer-overlay.open { display: flex; }
    .drawer {
      position: relative;
      width: min(980px, 94vw);
      height: 100vh;
      background: var(--panel);
      border-left: 1px solid var(--border);
      box-shadow: -24px 0 72px rgba(0,0,0,.28);
      display: flex;
      flex-direction: column;
      transform: translateX(28px);
      animation: slideIn .18s ease forwards;
    }
    @keyframes slideIn { to { transform: translateX(0); } }
    /* Left-edge grip: drag to resize the panel width, double-click to reset. */
    .drawer-resizer {
      position: absolute; left: -3px; top: 0; width: 9px; height: 100%;
      cursor: ew-resize; z-index: 6; touch-action: none;
    }
    .drawer-resizer::after {
      content: ''; position: absolute; left: 3px; top: 0; width: 3px; height: 100%;
      background: transparent; transition: background .12s ease;
    }
    .drawer-resizer:hover::after, .drawer-resizer.dragging::after { background: color-mix(in srgb, var(--accent) 55%, transparent); }
    /* Header / tabs / controls never shrink; only the body scrolls. Without the
       fixed flex-basis, a tall body compressed these rows and clipped the
       active tab (it appeared hidden behind the controls strip). */
    .drawer-head, .drawer-tabs, .drawer-controls { flex: 0 0 auto; }
    .drawer-body { flex: 1 1 auto; min-height: 0; }
    .drawer-head {
      padding: 16px 18px;
      border-bottom: 1px solid var(--border);
      background: var(--panel-2);
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
    }
    .drawer-title { font-size: 16px; font-weight: 700; word-break: break-word; }
    .drawer-meta { color: var(--muted); font-size: 12px; margin-top: 4px; word-break: break-all; }
    .drawer-tabs {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      border-bottom: 1px solid var(--border);
      padding: 8px 12px;
      background: var(--panel);
    }
    .drawer-tabs button {
      border: 1px solid transparent;
      background: transparent;
      color: var(--muted);
      border-radius: 8px;
      padding: 7px 10px;
      cursor: pointer;
      font-weight: 750;
      white-space: nowrap;
    }
    .drawer-tabs button.active { background: var(--accent); border-color: var(--accent); color: #fff; }
    .drawer-body { padding: 16px 18px 28px; overflow-y: auto; }
    .mini-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .copy-ok { color: var(--good); font-size: 12px; font-weight: 700; align-self: center; }
    .dense table th, .dense table td { padding: 7px 9px; font-size: 12px; }
    .dense .card { padding: 11px 12px; }
    .dense .panel-body { padding: 12px; }
    /* Drawer control strip (iteration switcher, body search, scroll-sync) */
    .drawer-controls {
      display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
      padding: 9px 12px; border-bottom: 1px solid var(--border); background: var(--panel);
    }
    .drawer-controls .ctl-label { color: var(--muted); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
    /* Direct children only (iteration select + body-search input) — must NOT
       match the checkbox nested in the .toggle "Sync scroll" chip, or it gets
       inflated into a padded box like the rest. */
    .drawer-controls > select, .drawer-controls > input {
      border: 1px solid var(--border); border-radius: 8px; background: var(--panel);
      color: var(--ink); padding: 6px 9px; min-height: 34px; outline: none;
    }
    .drawer-controls > select:focus, .drawer-controls > input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent); }
    .drawer-controls .body-search { flex: 1 1 200px; min-width: 160px; }
    /* Match the drawer's smaller 34px control height (the global .toggle is 38px,
       which left the Sync-scroll chip taller than its select/input neighbors). */
    .drawer-controls .toggle { min-height: 34px; padding: 6px 9px; }
    .req-id { font-family: var(--mono); font-size: 11px; }
    mark { background: #fde68a; color: #1a1a1a; border-radius: 2px; padding: 0 1px; }
    [data-theme="dark"] mark { background: #b45309; color: #fff; }
    /* Collapsible raw-JSON / log blocks */
    details.raw-block { border: 1px solid var(--border); border-radius: 10px; background: var(--panel-2); margin-top: 10px; overflow: hidden; }
    details.raw-block > summary {
      cursor: pointer; padding: 10px 13px; font-weight: 750; color: var(--ink);
      list-style: none; user-select: none; display: flex; align-items: center; gap: 8px;
    }
    details.raw-block > summary::-webkit-details-marker { display: none; }
    details.raw-block > summary::before { content: '▸'; color: var(--muted); font-size: 12px; }
    details.raw-block[open] > summary::before { content: '▾'; }
    details.raw-block > summary .raw-meta { color: var(--muted); font-weight: 600; font-size: 12px; margin-left: auto; }
    details.raw-block > pre { margin: 0 12px 12px; }
    /* Info badge + pure-CSS hover/focus tooltip (matches the custom report). */
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
      background: var(--ink); color: var(--panel); padding: 9px 11px; border-radius: 8px;
      font-size: 12px; font-weight: 400; font-style: normal; font-family: var(--sans);
      line-height: 1.45; letter-spacing: normal; text-transform: none; text-align: left;
      width: max-content; max-width: 280px; white-space: normal;
      opacity: 0; visibility: hidden; transition: opacity .12s ease;
      z-index: 100; box-shadow: var(--shadow); pointer-events: none;
    }
    .info::before {
      content: ''; position: absolute; top: calc(150% - 6px); left: 50%; transform: translateX(-50%);
      border: 6px solid transparent; border-bottom-color: var(--ink);
      opacity: 0; visibility: hidden; transition: opacity .12s ease; z-index: 100; pointer-events: none;
    }
    .info:hover::after, .info:focus::after, .info:hover::before, .info:focus::before { opacity: 1; visibility: visible; }
    .panel-title .info { margin-left: 8px; }
    @media (max-width: 980px) {
      .app { flex-direction: column; padding-left: 0; }
      .sidebar { position: static; height: auto; width: auto; flex: none; border-right: none; border-bottom: 1px solid var(--border); overflow: visible; }
      .sidebar:hover, .sidebar:focus-within { width: auto; box-shadow: none; }
      .nav { flex-direction: row; flex-wrap: wrap; }
      .nav-lbl, .nav-count, .brand-text { opacity: 1; }
      .main { padding: 14px 12px 48px; }
      .health { border-left: none; border-top: 1px solid var(--border); width: 100%; padding-top: 14px; }
      .split, .body-grid { grid-template-columns: 1fr; }
      .topbar { top: 0; border-radius: 0; margin-left: -12px; margin-right: -12px; }
    }
  </style>
</head>
<body>
  <div class="app" id="app">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">&#128300;</span>
        <div class="brand-text">
          <div class="brand-title">Debug Replay Console</div>
          <div class="brand-subtitle">k6 Perf diagnostics</div>
        </div>
      </div>
      <nav class="nav" id="nav"></nav>
      <div class="sidebar-foot">
        <button class="btn theme-toggle" id="theme-toggle" type="button" title="Toggle light / dark"><span class="nav-ico">&#127769;</span><span class="nav-lbl">Dark</span></button>
      </div>
    </aside>
    <main class="main">
      <div class="topbar">
        <input class="search" id="search-input" type="search" placeholder="Search URL, transaction, headers, body, variables" autocomplete="off" />
        <select id="iteration-select" title="Iteration"></select>
        <select id="filter-select" title="Filter">
          <option value="all">All requests</option>
          <option value="issues">Only issues</option>
          <option value="bad-score">Score below 90</option>
          <option value="missing">Missing in replay</option>
          <option value="extra">Replay only</option>
          <option value="status">Status mismatch</option>
          <option value="body">Body mismatch</option>
          <option value="headers">Header mismatch</option>
          <option value="slow">Slowest 10</option>
        </select>
        <label class="toggle"><input type="checkbox" id="diff-only-toggle" /> Diff rows only</label>
        <label class="toggle"><input type="checkbox" id="raw-toggle" /> Raw values</label>
        <label class="toggle"><input type="checkbox" id="density-toggle" /> Dense</label>
      </div>
      <section id="hero"></section>
      <section id="content"></section>
    </main>
  </div>
  <div class="drawer-overlay" id="drawer-overlay"></div>

  <script>
    (function() {
      var DATA = ${serialized};
      var state = {
        section: 'overview',
        iteration: 'all',
        filter: 'all',
        search: '',
        diffOnly: false,
        raw: false,
        dense: false,
        drawerId: null,
        drawerTab: 'summary',
        scrollSync: true,
        bodySearch: '',
        drawerWidth: null
      };

      var navItems = [
        ['overview', 'Overview', '\\uD83C\\uDFE0'],
        ['iterations', 'Iterations', '\\uD83D\\uDD01'],
        ['transactions', 'Transactions', '\\uD83E\\uDDE9'],
        ['requests', 'Requests', '\\uD83C\\uDF10'],
        ['variables', 'Variables', '\\uD83D\\uDD11'],
        ['runtime', 'Runtime', '\\uD83D\\uDDA5\\uFE0F'],
        ['performance', 'Performance', '\\uD83D\\uDCC8']
      ];

      var el = {
        app: document.getElementById('app'),
        nav: document.getElementById('nav'),
        hero: document.getElementById('hero'),
        content: document.getElementById('content'),
        drawer: document.getElementById('drawer-overlay'),
        search: document.getElementById('search-input'),
        iteration: document.getElementById('iteration-select'),
        filter: document.getElementById('filter-select'),
        diffOnly: document.getElementById('diff-only-toggle'),
        raw: document.getElementById('raw-toggle'),
        dense: document.getElementById('density-toggle'),
        theme: document.getElementById('theme-toggle')
      };

      // Request ids are generated client-side so table rows and drawer actions
      // can address requests even when the original HAR entry id is duplicated.
      var requestIds = new Map();
      (DATA.results || []).forEach(function(r, i) {
        requestIds.set(r, 'req-' + i);
      });

      function esc(value) {
        return String(value == null ? '' : value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      // Small "i" badge with a hover/focus tooltip (pure CSS, no JS needed).
      function infoTip(tip) {
        return '<span class="info" tabindex="0" data-tip="' + esc(tip) + '" aria-label="' + esc(tip) + '">i</span>';
      }

      function decodeText(value) {
        var text = String(value == null ? '' : value);
        if (state.raw) return text;
        try { return decodeURIComponent(text); } catch (e) { return text; }
      }

      function formatBody(body) {
        var text = decodeText(body == null || body === '' ? '(empty)' : body);
        var trimmed = text.trim();
        if (!trimmed || trimmed === '(empty)' || trimmed.indexOf('[binary:') === 0) return text;
        if ((trimmed[0] === '{' || trimmed[0] === '[')) {
          try { return JSON.stringify(JSON.parse(trimmed), null, 2); } catch (e) {}
        }
        if (/^[\\w%.+~-]+=/.test(trimmed) && trimmed.indexOf('&') >= 0 && trimmed.indexOf('{') < 0) {
          try {
            var params = new URLSearchParams(trimmed);
            var lines = [];
            params.forEach(function(v, k) { lines.push(k + ' = ' + v); });
            if (lines.length) return lines.join('\\n');
          } catch (e) {}
        }
        return text;
      }

      function scoreClass(score) {
        if (score >= 90) return 'good';
        if (score >= 70) return 'warn';
        return 'bad';
      }

      function statusClass(status) {
        // status 0 is a real transport failure (timeout / reset / refused),
        // NOT "no data" — style it as an error so it can't be skimmed past.
        if (status === 0) return 'status-5xx';
        if (!status) return '';
        if (status >= 200 && status < 300) return 'status-2xx';
        if (status >= 300 && status < 400) return 'status-3xx';
        if (status >= 400 && status < 500) return 'status-4xx';
        if (status >= 500) return 'status-5xx';
        return '';
      }

      // The status to SHOW for a request: prefer the replayed side even when it
      // is 0. A bare "replayed.status OR recorded.status" hid transport failures
      // because 0 is falsy and fell through to the recorded code (e.g. 200),
      // making a timed-out request look like it succeeded.
      function effectiveStatusSide(r) {
        if (r.replayed && r.replayed.status !== undefined && r.replayed.status !== null) return r.replayed;
        if (r.recorded && r.recorded.status !== undefined && r.recorded.status !== null) return r.recorded;
        return r.replayed || r.recorded || {};
      }

      // Display text for a status: the code, or for a status-0 transport failure
      // the k6 reason (e.g. "0 · request timeout") so the user sees WHY.
      function statusDisplay(side) {
        side = side || {};
        var s = side.status;
        if (s === 0) return '0 · ' + (side.error ? String(side.error) : 'no response');
        return (s == null ? '-' : s);
      }

      function requestId(r) {
        return requestIds.get(r);
      }

      function methodOf(r) {
        return (r.replayed && r.replayed.method) || (r.recorded && r.recorded.method) || '-';
      }

      function urlOf(r) {
        return (r.replayed && r.replayed.url) || (r.recorded && r.recorded.url) || '-';
      }

      function shortUrl(url) {
        try {
          var u = new URL(String(url));
          return u.pathname + (u.search || '');
        } catch (e) {
          return String(url || '-');
        }
      }

      function comparisonLabel(type) {
        if (type === 'missing_in_replay') return 'Missing';
        if (type === 'extra_in_replay') return 'Replay only';
        return 'Matched';
      }

      function headerMismatchCount(diffs) {
        return (diffs || []).filter(function(d) { return d.status !== 'match'; }).length;
      }

      function hasStatusMismatch(r) {
        return r.statusMatch === false && r.comparisonType === 'matched';
      }

      function hasBodyMismatch(r) {
        return Boolean((r.requestBody && !r.requestBody.match) || (r.responseBody && !r.responseBody.match));
      }

      function hasHeaderMismatch(r) {
        return headerMismatchCount(r.requestHeaderDiffs) > 0 || headerMismatchCount(r.responseHeaderDiffs) > 0;
      }

      function hasIssue(r) {
        return r.matchScore < 90 || r.comparisonType !== 'matched' || hasStatusMismatch(r) || hasBodyMismatch(r) || hasHeaderMismatch(r) || (r.warnings || []).length > 0;
      }

      function issueBadges(r) {
        var badges = [];
        if (r.comparisonType === 'missing_in_replay') badges.push(['Missing', 'bad']);
        if (r.comparisonType === 'extra_in_replay') badges.push(['Replay only', 'warn']);
        if (hasStatusMismatch(r)) badges.push(['Status', 'bad']);
        if (r.requestBody && !r.requestBody.match) badges.push(['Req body', 'warn']);
        if (r.responseBody && !r.responseBody.match) badges.push(['Resp body', 'warn']);
        if (headerMismatchCount(r.requestHeaderDiffs) > 0) badges.push(['Req headers', 'warn']);
        if (headerMismatchCount(r.responseHeaderDiffs) > 0) badges.push(['Resp headers', 'warn']);
        if ((r.warnings || []).length > 0) badges.push(['Warning', 'accent']);
        if (badges.length === 0) badges.push(['Clean', 'good']);
        return badges.map(function(b) { return '<span class="pill ' + b[1] + '">' + esc(b[0]) + '</span>'; }).join('');
      }

      function allResults() {
        return (DATA.results || []).slice();
      }

      function byIteration(list) {
        if (state.iteration === 'all') return list;
        return list.filter(function(r) { return String(r.iteration) === String(state.iteration); });
      }

      function matchesSearch(r) {
        var q = state.search.trim().toLowerCase();
        if (!q) return true;
        var parts = [
          r.harEntryId,
          r.transactionName,
          methodOf(r),
          urlOf(r),
          r.comparisonType,
          r.recorded && r.recorded.requestBody,
          r.recorded && r.recorded.responseBody,
          r.replayed && r.replayed.requestBody,
          r.replayed && r.replayed.responseBody
        ];
        (r.variableEvents || []).forEach(function(v) {
          parts.push(v.name, v.type, v.action, v.value, v.source);
        });
        (r.requestHeaderDiffs || []).forEach(function(h) {
          parts.push(h.name, h.recordedValue, h.replayedValue, h.status);
        });
        (r.responseHeaderDiffs || []).forEach(function(h) {
          parts.push(h.name, h.recordedValue, h.replayedValue, h.status);
        });
        return parts.some(function(p) { return String(p == null ? '' : p).toLowerCase().indexOf(q) >= 0; });
      }

      function visibleResults() {
        var list = byIteration(allResults()).filter(matchesSearch);
        if (state.diffOnly) list = list.filter(hasIssue);
        if (state.filter === 'issues') list = list.filter(hasIssue);
        if (state.filter === 'bad-score') list = list.filter(function(r) { return r.matchScore < 90; });
        if (state.filter === 'missing') list = list.filter(function(r) { return r.comparisonType === 'missing_in_replay'; });
        if (state.filter === 'extra') list = list.filter(function(r) { return r.comparisonType === 'extra_in_replay'; });
        if (state.filter === 'status') list = list.filter(hasStatusMismatch);
        if (state.filter === 'body') list = list.filter(hasBodyMismatch);
        if (state.filter === 'headers') list = list.filter(hasHeaderMismatch);
        if (state.filter === 'slow') {
          list = list.sort(function(a, b) { return (b.durationMs || 0) - (a.durationMs || 0); }).slice(0, 10);
        }
        return list;
      }

      function average(values) {
        if (!values.length) return 0;
        return Math.round(values.reduce(function(sum, v) { return sum + Number(v || 0); }, 0) / values.length);
      }

      function formatDuration(ms) {
        if (ms == null) return '-';
        return Math.round(ms) + ' ms';
      }

      function groupBy(list, getter) {
        return list.reduce(function(map, item) {
          var key = getter(item) || 'Ungrouped';
          if (!map[key]) map[key] = [];
          map[key].push(item);
          return map;
        }, {});
      }

      function statusText() {
        if (DATA.summary.status === 'passed') return ['Replay Passed', 'The replay matches the recording closely enough for this debug run.'];
        if (DATA.summary.status === 'broken') return ['Replay Broken', 'Critical replay drift was detected. Start with missing, replay-only, and status-mismatch requests.'];
        return ['Replay Drift Detected', 'The replay completed, but one or more requests differ from the recording. Use the triage table to isolate the cause.'];
      }

      function renderHero() {
        var s = statusText();
        el.hero.innerHTML =
          '<div class="hero">' +
            '<div class="hero-main">' +
              '<div class="eyebrow">Debug replay diagnostics</div>' +
              '<h1>Debug Replay Console</h1>' +
              '<div class="hero-meta">' +
                '<span>Generated ' + esc(new Date(DATA.generatedAt).toLocaleString()) + '</span>' +
                '<span>' + esc(DATA.summary.totalRequests) + ' requests</span>' +
                '<span>' + esc(DATA.summary.iterations.length) + ' iteration(s)</span>' +
                '<span>Worst transaction: ' + esc(DATA.summary.worstTransaction || '-') + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="health">' +
              '<div class="health-num score ' + scoreClass(DATA.summary.overallScore) + '">' + esc(DATA.summary.overallScore) + '%</div>' +
              '<div class="health-label">Match score</div>' +
            '</div>' +
          '</div>' +
          '<div class="status-banner ' + esc(DATA.summary.status) + '">' +
            '<div class="status-title">' + esc(s[0]) + '</div>' +
            '<div class="status-text">' + esc(s[1]) + '</div>' +
          '</div>';
      }

      function summaryCards() {
        var cards = [
          ['Requests', DATA.summary.totalRequests],
          ['Warnings', DATA.summary.warningCount],
          ['Missing', DATA.summary.missingCount],
          ['Replay only', DATA.summary.replayOnlyCount],
          ['Mismatched', DATA.summary.mismatchCount],
          ['Runtime errors', (DATA.k6Errors || []).length]
        ];
        return '<div class="cards">' + cards.map(function(c) {
          return '<div class="card"><span class="card-label">' + esc(c[0]) + '</span><strong class="card-value">' + esc(c[1]) + '</strong></div>';
        }).join('') + '</div>';
      }

      function buildInsights() {
        var list = [];
        if ((DATA.k6Errors || []).length > 0) list.push('Runtime errors were captured. Review the Runtime section before chasing payload differences.');
        if (DATA.summary.missingCount > 0) list.push(DATA.summary.missingCount + ' recorded request(s) did not appear during replay.');
        if (DATA.summary.replayOnlyCount > 0) list.push(DATA.summary.replayOnlyCount + ' replay-only request(s) appeared. Check redirects, resource fetches, and conditional logic.');
        var statusCount = allResults().filter(hasStatusMismatch).length;
        if (statusCount > 0) list.push(statusCount + ' request(s) returned a different status code.');
        var bodyCount = allResults().filter(hasBodyMismatch).length;
        if (bodyCount > 0) list.push(bodyCount + ' request(s) have request or response body drift.');
        var headerCount = allResults().filter(hasHeaderMismatch).length;
        if (headerCount > 0) list.push(headerCount + ' request(s) have header drift. Cookies, auth headers, and correlation values are good first suspects.');
        if (list.length === 0) list.push('No major drift patterns were detected in this replay.');
        return list;
      }

      function renderOverview() {
        var worst = allResults().filter(hasIssue).sort(function(a, b) { return a.matchScore - b.matchScore; }).slice(0, 8);
        el.content.innerHTML =
          summaryCards() +
          '<div class="split">' +
            '<section class="panel">' +
              '<div class="panel-head"><div><div class="panel-title">Root Cause Hints' + infoTip('Auto-generated drift hints from the replay diff — start here.') + '</div><div class="panel-subtitle">Generated from the replay diff surface</div></div></div>' +
              '<div class="panel-body"><ul class="insights">' + buildInsights().map(function(i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></div>' +
            '</section>' +
            '<section class="panel">' +
              '<div class="panel-head"><div><div class="panel-title">Current View' + infoTip('Active iteration, filter and search context.') + '</div><div class="panel-subtitle">' + esc(visibleResults().length) + ' visible request(s)</div></div></div>' +
              '<div class="panel-body"><div class="kvs">' +
                '<div class="kv"><div class="kv-label">Iteration</div><div class="kv-value">' + esc(state.iteration === 'all' ? 'All' : state.iteration) + '</div></div>' +
                '<div class="kv"><div class="kv-label">Filter</div><div class="kv-value">' + esc(state.filter) + '</div></div>' +
                '<div class="kv"><div class="kv-label">Search</div><div class="kv-value">' + esc(state.search || '-') + '</div></div>' +
              '</div></div>' +
            '</section>' +
          '</div>' +
          renderRequestTable(worst, 'Highest Risk Requests', 'Open any row to inspect the complete recorded vs replayed exchange.', 'Lowest-scoring requests with issues — the most likely culprits.');
      }

      function renderIterations() {
        var groups = groupBy(allResults(), function(r) { return String(r.iteration); });
        var rows = Object.keys(groups).sort(function(a, b) { return Number(a) - Number(b); }).map(function(k) {
          var items = groups[k];
          var missing = items.filter(function(r) { return r.comparisonType === 'missing_in_replay'; }).length;
          var extra = items.filter(function(r) { return r.comparisonType === 'extra_in_replay'; }).length;
          var issues = items.filter(hasIssue).length;
          var duration = items.reduce(function(sum, r) { return sum + (r.durationMs || 0); }, 0);
          return '<tr class="row-action" data-iteration-open="' + esc(k) + '">' +
            '<td class="mono">' + esc(k) + '</td>' +
            '<td>' + esc(items.length) + '</td>' +
            '<td>' + esc(issues) + '</td>' +
            '<td>' + esc(missing) + '</td>' +
            '<td>' + esc(extra) + '</td>' +
            '<td><span class="score ' + scoreClass(average(items.map(function(r) { return r.matchScore; }))) + '">' + average(items.map(function(r) { return r.matchScore; })) + '%</span></td>' +
            '<td>' + esc(formatDuration(duration)) + '</td>' +
          '</tr>';
        }).join('');
        el.content.innerHTML = '<section class="panel"><div class="panel-head"><div><div class="panel-title">Iterations' + infoTip('Per-iteration roll-up of requests, issues and score. Click a row to filter.') + '</div><div class="panel-subtitle">Click an iteration to filter the console.</div></div></div><div class="table-scroll"><table><thead><tr><th>Iteration</th><th>Requests</th><th>Issues</th><th>Missing</th><th>Replay only</th><th>Avg score</th><th>Total time</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
      }

      function renderTransactions() {
        var groups = groupBy(visibleResults(), function(r) { return r.transactionName || 'Ungrouped'; });
        var rows = Object.keys(groups).sort().map(function(name) {
          var items = groups[name];
          var worst = items.reduce(function(min, r) { return Math.min(min, r.matchScore); }, 100);
          var duration = items.reduce(function(sum, r) { return sum + (r.durationMs || 0); }, 0);
          return '<tr class="row-action" data-search-transaction="' + esc(name) + '">' +
            '<td class="wrap">' + esc(name) + '</td>' +
            '<td>' + esc(items.length) + '</td>' +
            '<td>' + esc(items.filter(hasIssue).length) + '</td>' +
            '<td><span class="score ' + scoreClass(average(items.map(function(r) { return r.matchScore; }))) + '">' + average(items.map(function(r) { return r.matchScore; })) + '%</span></td>' +
            '<td><span class="score ' + scoreClass(worst) + '">' + worst + '%</span></td>' +
            '<td>' + esc(formatDuration(duration)) + '</td>' +
          '</tr>';
        }).join('');
        el.content.innerHTML = '<section class="panel"><div class="panel-head"><div><div class="panel-title">Transactions' + infoTip('Requests grouped by transaction for quick blast-radius analysis.') + '</div><div class="panel-subtitle">Aggregated by transaction name for quick blast-radius analysis.</div></div></div><div class="table-scroll"><table><thead><tr><th>Transaction</th><th>Requests</th><th>Issues</th><th>Avg score</th><th>Worst</th><th>Total time</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6" class="empty">No transactions match the current view.</td></tr>') + '</tbody></table></div></section>';
      }

      function renderRequests() {
        el.content.innerHTML = renderRequestTable(visibleResults(), 'Request Triage', 'Filtered, searchable replay exchange list. Click a row to open the inspector.', 'Every replayed request; filter/search and click a row to inspect.');
      }

      function renderRequestTable(list, title, subtitle, tip) {
        var rows = list.map(function(r) {
          var side = effectiveStatusSide(r);
          return '<tr class="row-action" data-open="' + esc(requestId(r)) + '">' +
            '<td class="mono">' + esc(r.requestSequence == null ? '-' : r.requestSequence) + '</td>' +
            '<td class="mono req-id">' + esc(r.harEntryId || '-') + '</td>' +
            '<td class="wrap">' + esc(r.transactionName || 'Ungrouped') + '</td>' +
            '<td>' + esc(methodOf(r)) + '</td>' +
            '<td class="wrap" title="' + esc(decodeText(urlOf(r))) + '">' + esc(shortUrl(decodeText(urlOf(r)))) + '</td>' +
            '<td class="' + statusClass(side.status) + '">' + esc(statusDisplay(side)) + '</td>' +
            '<td><span class="score ' + scoreClass(r.matchScore) + '">' + esc(r.matchScore) + '%</span></td>' +
            '<td>' + esc(formatDuration(r.durationMs)) + '</td>' +
            '<td><span class="pill ' + (r.comparisonType === 'matched' ? 'good' : r.comparisonType === 'missing_in_replay' ? 'bad' : 'warn') + '">' + esc(comparisonLabel(r.comparisonType)) + '</span></td>' +
            '<td><div class="issue-list">' + issueBadges(r) + '</div></td>' +
          '</tr>';
        }).join('');
        return '<section class="panel"><div class="panel-head"><div><div class="panel-title">' + esc(title) + (tip ? infoTip(tip) : '') + '</div><div class="panel-subtitle">' + esc(subtitle) + ' ' + esc(list.length) + ' row(s).</div></div></div><div class="table-scroll"><table><thead><tr><th>#</th><th>Request ID</th><th>Transaction</th><th>Method</th><th>URL path</th><th>Status</th><th>Score</th><th>Duration</th><th>State</th><th>Issues</th></tr></thead><tbody>' + (rows || '<tr><td colspan="10" class="empty">No requests match the current view.</td></tr>') + '</tbody></table></div></section>';
      }

      function renderVariables() {
        var latest = {};
        visibleResults().forEach(function(r) {
          (r.variableEvents || []).forEach(function(v) {
            latest[v.name] = {
              name: v.name,
              type: v.type,
              action: v.action,
              value: v.value,
              source: v.source,
              transactionName: r.transactionName,
              requestSequence: r.requestSequence
            };
          });
        });
        var rows = Object.keys(latest).sort().map(function(k) {
          var v = latest[k];
          return '<tr><td>' + esc(v.name) + '</td><td>' + esc(v.type) + '</td><td>' + esc(v.action) + '</td><td class="wrap mono">' + esc(decodeText(v.value)) + '</td><td class="wrap">' + esc(v.source || '-') + '</td><td class="wrap">' + esc(v.transactionName || '-') + '</td><td>' + esc(v.requestSequence == null ? '-' : v.requestSequence) + '</td></tr>';
        }).join('');
        el.content.innerHTML = '<section class="panel"><div class="panel-head"><div><div class="panel-title">Variables' + infoTip('Latest parameter & correlation values captured during replay.') + '</div><div class="panel-subtitle">Latest parameter and correlation values visible in the current filter context.</div></div></div><div class="table-scroll"><table><thead><tr><th>Name</th><th>Type</th><th>Action</th><th>Value</th><th>Source</th><th>Last transaction</th><th>Request #</th></tr></thead><tbody>' + (rows || '<tr><td colspan="7" class="empty">No variable events match the current view.</td></tr>') + '</tbody></table></div></section>';
      }

      function renderRuntime() {
        var errors = (DATA.k6Errors || []).map(function(e) { return '<pre>' + esc(e) + '</pre>'; }).join('<br />');
        // Console output can be huge — collapse it into a single expandable block.
        var logBlocks = (DATA.consoleLogs || []).length
          ? '<details class="raw-block" open><summary>Console output<span class="raw-meta">' + esc((DATA.consoleLogs || []).length) + ' line(s)</span></summary><pre>' + esc((DATA.consoleLogs || []).join('\\n')) + '</pre></details>'
          : '<p class="empty">No script console output captured.</p>';
        el.content.innerHTML =
          '<section class="panel"><div class="panel-head"><div><div class="panel-title">Runtime Errors' + infoTip('k6 runtime errors during replay — fix these before chasing diffs.') + '</div><div class="panel-subtitle">' + esc((DATA.k6Errors || []).length) + ' captured error(s)</div></div></div><div class="panel-body">' + (errors || '<p class="empty">No k6 runtime errors captured.</p>') + '</div></section>' +
          '<section class="panel"><div class="panel-head"><div><div class="panel-title">Console Output' + infoTip('console.log/warn/error captured from the replay script.') + '</div><div class="panel-subtitle">' + esc((DATA.consoleLogs || []).length) + ' captured line(s)</div></div></div><div class="panel-body">' + logBlocks + '</div></section>';
      }

      function renderPerformance() {
        var m = DATA.k6Metrics;
        if (!m) {
          el.content.innerHTML = '<section class="panel"><div class="panel-head"><div><div class="panel-title">Performance</div></div></div><div class="panel-body"><p class="empty">No performance metrics were embedded in this debug report.</p></div></section>';
          return;
        }
        var overview = [
          ['Total requests', m.httpSummary && m.httpSummary.reqs],
          ['Failed percent', m.httpSummary && m.httpSummary.failedPct],
          ['Iterations', m.execution && m.execution.iterations],
          ['VUs', m.execution && m.execution.vus],
          ['Data received', m.network && m.network.received],
          ['Data sent', m.network && m.network.sent]
        ].filter(function(x) { return x[1]; });
        el.content.innerHTML =
          '<div class="cards">' + overview.map(function(c) { return '<div class="card"><span class="card-label">' + esc(c[0]) + '</span><strong class="card-value">' + esc(c[1]) + '</strong></div>'; }).join('') + '</div>' +
          metricTable('Checks', 'Check', (m.checks || []).map(function(c) { return { name: c.name, values: { Status: c.passed ? 'PASS' : 'FAIL' } }; }), ['Status'], 'Pass/fail result of each k6 check during the debug run.') +
          metricTable('HTTP Metrics', 'Metric', m.http || [], (m.statsColumns || ['min', 'avg', 'max', 'p(90)', 'p(95)']).filter(function(c) { return c !== 'pass' && c !== 'fail'; }), 'k6 HTTP timing metrics for the debug run.') +
          metricTable('Transaction Timings', 'Transaction', m.transactions || [], m.statsColumns || ['min', 'avg', 'max', 'p(90)', 'p(95)'], 'Per-transaction response-time stats for the debug run.');
      }

      function metricTable(title, firstHeader, rows, columns, tip) {
        if (!rows || rows.length === 0) return '';
        var body = rows.map(function(r) {
          return '<tr><td class="wrap">' + esc(r.name) + '</td>' + columns.map(function(c) { return '<td class="mono">' + esc((r.values && (r.values[c] != null ? r.values[c] : r.values[String(c)])) || '-') + '</td>'; }).join('') + '</tr>';
        }).join('');
        return '<section class="panel"><div class="panel-head"><div><div class="panel-title">' + esc(title) + (tip ? infoTip(tip) : '') + '</div></div></div><div class="table-scroll"><table><thead><tr><th>' + esc(firstHeader) + '</th>' + columns.map(function(c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + body + '</tbody></table></div></section>';
      }

      function findRequestById(id) {
        var found = null;
        requestIds.forEach(function(v, k) { if (v === id) found = k; });
        return found;
      }

      function openDrawer(id) {
        state.drawerId = id;
        state.drawerTab = 'summary';
        renderDrawer();
      }

      function closeDrawer() {
        state.drawerId = null;
        el.drawer.classList.remove('open');
        el.drawer.innerHTML = '';
      }

      // The "same" request across iterations is identified by its HAR entry id
      // (falling back to transaction + sequence). Lets the drawer offer an
      // iteration switcher so users can compare one request across iterations.
      function requestKey(r) {
        return r.harEntryId || ((r.transactionName || '') + '#' + (r.requestSequence == null ? '' : r.requestSequence));
      }

      function iterationsForRequest(r) {
        var key = requestKey(r);
        return allResults()
          .filter(function(x) { return requestKey(x) === key; })
          .sort(function(a, b) { return Number(a.iteration) - Number(b.iteration); });
      }

      function drawerControls(r) {
        var peers = iterationsForRequest(r);
        var iterSelect = '';
        if (peers.length > 1) {
          iterSelect =
            '<span class="ctl-label">Iteration</span>' +
            '<select id="drawer-iteration">' + peers.map(function(p) {
              return '<option value="' + esc(requestId(p)) + '"' + (p === r ? ' selected' : '') + '>Iteration ' + esc(p.iteration) + '</option>';
            }).join('') + '</select>';
        } else {
          iterSelect = '<span class="ctl-label">Iteration ' + esc(r.iteration) + '</span>';
        }
        var bodyTools = '';
        if (state.drawerTab === 'bodies') {
          bodyTools =
            '<input class="body-search" id="body-search" type="search" placeholder="Search in bodies" value="' + esc(state.bodySearch) + '" autocomplete="off" />' +
            '<label class="toggle"><input type="checkbox" id="scroll-sync"' + (state.scrollSync ? ' checked' : '') + ' /> Sync scroll</label>';
        }
        return '<div class="drawer-controls">' + iterSelect + bodyTools + '</div>';
      }

      function renderDrawer() {
        var r = findRequestById(state.drawerId);
        if (!r) return closeDrawer();
        var tabs = ['summary', 'bodies', 'headers', 'cookies', 'variables', 'raw'];
        el.drawer.classList.add('open');
        // Re-apply a user-chosen width (innerHTML wipes inline styles each render).
        var widthStyle = state.drawerWidth ? ' style="width:' + state.drawerWidth + 'px"' : '';
        el.drawer.innerHTML =
          '<aside class="drawer" role="dialog" aria-modal="true"' + widthStyle + '>' +
            '<div class="drawer-resizer" title="Drag to resize · double-click to reset"></div>' +
            '<div class="drawer-head">' +
              '<div><div class="drawer-title">Request #' + esc(r.requestSequence == null ? '-' : r.requestSequence) + ' - ' + esc(r.transactionName || 'Ungrouped') + '</div>' +
                '<div class="drawer-meta"><span class="pill accent req-id">' + esc(r.harEntryId || 'no-id') + '</span> ' + esc(methodOf(r)) + ' ' + esc(decodeText(urlOf(r))) + '</div></div>' +
              '<button class="btn" type="button" data-close>Close</button>' +
            '</div>' +
            '<div class="drawer-tabs">' + tabs.map(function(t) { return '<button type="button" data-tab="' + esc(t) + '" class="' + (state.drawerTab === t ? 'active' : '') + '">' + esc(t.charAt(0).toUpperCase() + t.slice(1)) + '</button>'; }).join('') + '</div>' +
            drawerControls(r) +
            '<div class="drawer-body">' + drawerTabContent(r) + '</div>' +
          '</aside>';
        bindDrawerInteractions();
      }

      // Wire up the iteration switcher, body search and scroll-sync after the
      // drawer DOM is in place (innerHTML wipes any prior listeners).
      function bindDrawerInteractions() {
        bindDrawerResizer();
        var iterSel = document.getElementById('drawer-iteration');
        if (iterSel) {
          iterSel.addEventListener('change', function() { state.drawerId = this.value; renderDrawer(); });
        }
        var bodySearch = document.getElementById('body-search');
        if (bodySearch) {
          bodySearch.addEventListener('input', function() {
            state.bodySearch = this.value;
            var r = findRequestById(state.drawerId);
            var body = el.drawer.querySelector('.drawer-body');
            if (r && body) { body.innerHTML = drawerBodies(r); bindScrollSync(); scrollToFirstMark(); }
          });
        }
        var syncToggle = document.getElementById('scroll-sync');
        if (syncToggle) {
          syncToggle.addEventListener('change', function() { state.scrollSync = this.checked; bindScrollSync(); });
        }
        if (state.drawerTab === 'bodies') { bindScrollSync(); scrollToFirstMark(); }
      }

      // Drag the left-edge grip to resize the drawer; double-click resets to the
      // default width. The chosen width is held in state.drawerWidth so it
      // survives the innerHTML re-renders (tab switches, iteration changes).
      function bindDrawerResizer() {
        var aside = el.drawer.querySelector('.drawer');
        var grip = el.drawer.querySelector('.drawer-resizer');
        if (!aside || !grip) return;
        grip.addEventListener('mousedown', function(e) {
          e.preventDefault();
          var startX = e.clientX;
          var startW = aside.getBoundingClientRect().width;
          grip.classList.add('dragging');
          document.body.style.userSelect = 'none';
          function onMove(ev) {
            // Drawer is anchored to the right edge, so dragging LEFT widens it.
            var w = startW + (startX - ev.clientX);
            w = Math.max(380, Math.min(window.innerWidth * 0.98, w));
            aside.style.width = w + 'px';
            state.drawerWidth = Math.round(w);
          }
          function onUp() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            grip.classList.remove('dragging');
            document.body.style.userSelect = '';
          }
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        });
        grip.addEventListener('dblclick', function() {
          state.drawerWidth = null;
          aside.style.width = '';
        });
      }

      // Keep the recorded/replayed body panes scrolling together (by ratio so
      // panes of different lengths stay aligned).
      function bindScrollSync() {
        var panes = el.drawer.querySelectorAll('.body-grid pre, .body-grid .jt-wrap');
        panes.forEach(function(pre) {
          pre.onscroll = null;
          if (!state.scrollSync) return;
          pre.onscroll = function() {
            if (pre._syncing) return;
            var ratio = pre.scrollHeight > pre.clientHeight ? pre.scrollTop / (pre.scrollHeight - pre.clientHeight) : 0;
            panes.forEach(function(other) {
              if (other === pre) return;
              other._syncing = true;
              other.scrollTop = ratio * (other.scrollHeight - other.clientHeight);
              requestAnimationFrame(function() { other._syncing = false; });
            });
          };
        });
      }

      function scrollToFirstMark() {
        var mark = el.drawer.querySelector('.drawer-body mark');
        if (mark && mark.scrollIntoView) mark.scrollIntoView({ block: 'center' });
      }

      function drawerTabContent(r) {
        if (state.drawerTab === 'summary') return drawerSummary(r);
        if (state.drawerTab === 'bodies') return drawerBodies(r);
        if (state.drawerTab === 'headers') return drawerHeaders(r);
        if (state.drawerTab === 'cookies') return drawerCookies(r);
        if (state.drawerTab === 'variables') return drawerVariables(r);
        return drawerRaw(r);
      }

      function drawerSummary(r) {
        var statusSide = effectiveStatusSide(r);
        return '<div class="mini-actions">' +
            '<button class="btn" data-copy="' + esc(decodeText(urlOf(r))) + '">Copy URL</button>' +
            '<button class="btn" data-copy="' + esc(JSON.stringify(r, null, 2)) + '">Copy exchange JSON</button>' +
            '<span class="copy-ok" id="copy-status"></span>' +
          '</div>' +
          '<div class="cards">' +
            '<div class="card"><span class="card-label">Request ID</span><strong class="card-value req-id" style="font-size:15px">' + esc(r.harEntryId || '-') + '</strong></div>' +
            '<div class="card"><span class="card-label">Iteration</span><strong class="card-value">' + esc(r.iteration == null ? '-' : r.iteration) + '</strong></div>' +
            '<div class="card"><span class="card-label">Score</span><strong class="card-value score ' + scoreClass(r.matchScore) + '">' + esc(r.matchScore) + '%</strong></div>' +
            '<div class="card"><span class="card-label">State</span><strong class="card-value">' + esc(comparisonLabel(r.comparisonType)) + '</strong></div>' +
            '<div class="card"><span class="card-label">Status</span><strong class="card-value ' + statusClass(statusSide.status) + '">' + esc(statusDisplay(statusSide)) + '</strong></div>' +
            '<div class="card"><span class="card-label">Duration</span><strong class="card-value">' + esc(formatDuration(r.durationMs)) + '</strong></div>' +
          '</div>' +
          '<section class="panel"><div class="panel-head"><div><div class="panel-title">Issues</div></div></div><div class="panel-body"><div class="issue-list">' + issueBadges(r) + '</div>' + warningsHtml(r) + '</div></section>' +
          '<section class="panel"><div class="panel-head"><div><div class="panel-title">Recorded vs Replayed</div></div></div><div class="panel-body"><div class="kvs">' +
            snapshotKv('Recorded', r.recorded) + snapshotKv('Replayed', r.replayed) +
          '</div></div></section>';
      }

      function snapshotKv(label, snap) {
        snap = snap || {};
        return '<div class="kv"><div class="kv-label">' + esc(label) + '</div>' +
          '<div class="kv-value"><b>Method:</b> ' + esc(snap.method || '-') + '</div>' +
          '<div class="kv-value"><b>Status:</b> <span class="' + statusClass(snap.status) + '">' + esc(statusDisplay(snap)) + '</span></div>' +
          '<div class="kv-value"><b>URL:</b> ' + esc(decodeText(snap.url || '-')) + '</div>' +
          '<div class="kv-value"><b>Headers:</b> ' + esc((snap.requestHeaders || []).length) + ' request / ' + esc((snap.responseHeaders || []).length) + ' response</div>' +
        '</div>';
      }

      function warningsHtml(r) {
        var warnings = r.warnings || [];
        if (!warnings.length) return '';
        return '<ul class="insights">' + warnings.map(function(w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>';
      }

      function drawerBodies(r) {
        return '<section class="panel"><div class="panel-head"><div><div class="panel-title">Request Body</div><div class="panel-subtitle">' + esc(r.requestBody && r.requestBody.summary || '') + '</div></div></div><div class="panel-body">' + bodyPair(r.recorded && r.recorded.requestBody, r.replayed && r.replayed.requestBody) + '</div></section>' +
          '<section class="panel"><div class="panel-head"><div><div class="panel-title">Response Body</div><div class="panel-subtitle">' + esc(r.responseBody && r.responseBody.summary || '') + '</div></div></div><div class="panel-body">' + bodyPair(r.recorded && r.recorded.responseBody, r.replayed && r.replayed.responseBody) + '</div></section>';
      }

      function bodyPair(left, right) {
        // When either side is JSON, render a foldable tree so deeply nested
        // payloads can be collapsed node-by-node. Changed leaves are highlighted
        // against the opposite side. Non-JSON bodies keep the line-diff view.
        var lp = tryParseJson(left);
        var rp = tryParseJson(right);
        if (lp.ok || rp.ok) {
          var leftPane = lp.ok
            ? '<div class="jt-wrap">' + jsonTree(lp.value, rp.ok ? rp.value : undefined, rp.ok) + '</div>'
            : '<pre>' + highlightTerm(esc(formatBody(left))) + '</pre>';
          var rightPane = rp.ok
            ? '<div class="jt-wrap">' + jsonTree(rp.value, lp.ok ? lp.value : undefined, lp.ok) + '</div>'
            : '<pre>' + highlightTerm(esc(formatBody(right))) + '</pre>';
          return '<div class="body-grid"><div class="body-pane"><h4>Recorded</h4>' + leftPane + '</div><div class="body-pane"><h4>Replayed</h4>' + rightPane + '</div></div>';
        }
        var l = formatBody(left);
        var r = formatBody(right);
        return '<div class="body-grid"><div class="body-pane"><h4>Recorded</h4><pre>' + diffLines(l, r, 0) + '</pre></div><div class="body-pane"><h4>Replayed</h4><pre>' + diffLines(l, r, 1) + '</pre></div></div>';
      }

      // Case-insensitive highlight of the body-search term. Works on already-
      // escaped text (the search term is escaped too) and avoids regex so the
      // outer template literal stays simple.
      function highlightTerm(escaped) {
        var term = esc((state.bodySearch || '').trim());
        if (!term) return escaped;
        var lower = escaped.toLowerCase();
        var t = term.toLowerCase();
        var out = '';
        var idx = 0;
        var pos;
        while ((pos = lower.indexOf(t, idx)) >= 0) {
          out += escaped.slice(idx, pos) + '<mark>' + escaped.slice(pos, pos + term.length) + '</mark>';
          idx = pos + term.length;
        }
        return out + escaped.slice(idx);
      }

      // Parse a body into a JS value when it looks like JSON (raw or URL-encoded).
      function tryParseJson(body) {
        var raw = String(body == null ? '' : body).trim();
        var candidates = [raw];
        try { candidates.push(decodeURIComponent(raw)); } catch (e) {}
        for (var i = 0; i < candidates.length; i++) {
          var t = candidates[i];
          if (t && (t.charAt(0) === '{' || t.charAt(0) === '[')) {
            try { return { ok: true, value: JSON.parse(t) }; } catch (e) {}
          }
        }
        return { ok: false };
      }

      function jtPrim(v) {
        var cls, text;
        if (v === null) { cls = 'jt-null'; text = 'null'; }
        else if (typeof v === 'number') { cls = 'jt-num'; text = String(v); }
        else if (typeof v === 'boolean') { cls = 'jt-bool'; text = String(v); }
        else { cls = 'jt-str'; text = JSON.stringify(String(v)); }
        return '<span class="' + cls + '">' + highlightTerm(esc(text)) + '</span>';
      }

      function jtDiffers(a, b) {
        try { return JSON.stringify(a) !== JSON.stringify(b); } catch (e) { return true; }
      }

      // Recursive collapsible JSON renderer. \`other\` (optional) is the matching
      // value from the opposite snapshot so changed leaves can be highlighted.
      function jsonTree(value, other, hasOther) {
        if (value === null || typeof value !== 'object') return jtPrim(value);
        var isArr = Array.isArray(value);
        var open = isArr ? '[' : '{';
        var close = isArr ? ']' : '}';
        var keys = isArr ? value.map(function(_, i) { return i; }) : Object.keys(value);
        if (keys.length === 0) return '<span class="jt-empty">' + open + close + '</span>';
        var otherIsObj = hasOther && other !== null && typeof other === 'object';
        var rows = keys.map(function(k, idx) {
          var child = value[k];
          var childPresentInOther = otherIsObj && (isArr ? k < (other.length || 0) : Object.prototype.hasOwnProperty.call(other, k));
          var otherChild = childPresentInOther ? other[k] : undefined;
          var comma = idx < keys.length - 1 ? ',' : '';
          var keyHtml = isArr ? '' : '<span class="jt-key">' + highlightTerm(esc(JSON.stringify(String(k)))) + '</span>: ';
          var isObj = child !== null && typeof child === 'object';
          var changed = '';
          if (hasOther) {
            if (!childPresentInOther) changed = ' changed';
            else if (!isObj && jtDiffers(child, otherChild)) changed = ' changed';
          }
          return '<span class="jt-row' + changed + '">' + keyHtml + jsonTree(child, otherChild, childPresentInOther) + comma + '</span>';
        }).join('');
        return '<span class="jt-node">' +
            '<span class="jt-tog">' + open + '</span>' +
            '<span class="jt-stub">' + open + '\\u2026' + close + '</span>' +
            '<span class="jt-kids">' + rows + '</span>' +
            '<span class="jt-close">' + close + '</span>' +
          '</span>';
      }

      // Lightweight line comparison gives users a visual cue without shipping a diff library.
      function diffLines(left, right, side) {
        var a = String(left || '').split(/\\r?\\n/);
        var b = String(right || '').split(/\\r?\\n/);
        var max = Math.max(a.length, b.length);
        var out = [];
        for (var i = 0; i < max; i++) {
          var line = side === 0 ? (a[i] || '') : (b[i] || '');
          var changed = (a[i] || '') !== (b[i] || '');
          out.push('<span class="diff-line ' + (changed ? 'changed' : '') + '">' + highlightTerm(esc(line || ' ')) + '</span>');
        }
        return out.join('');
      }

      function drawerHeaders(r) {
        return '<section class="panel"><div class="panel-head"><div><div class="panel-title">Request Headers</div></div></div><div class="table-scroll">' + diffTable(r.requestHeaderDiffs || [], 'Header') + '</div></section>' +
          '<section class="panel"><div class="panel-head"><div><div class="panel-title">Response Headers</div></div></div><div class="table-scroll">' + diffTable(r.responseHeaderDiffs || [], 'Header') + '</div></section>';
      }

      function diffTable(rows, label) {
        var visible = state.diffOnly ? rows.filter(function(d) { return d.status !== 'match'; }) : rows;
        var body = visible.map(function(d) {
          var cls = d.status === 'match' ? 'good' : d.status === 'mismatch' ? 'bad' : 'warn';
          return '<tr><td class="wrap">' + esc(d.name) + '</td><td class="wrap mono">' + esc(decodeText(d.recordedValue || '')) + '</td><td class="wrap mono">' + esc(decodeText(d.replayedValue || '')) + '</td><td><span class="pill ' + cls + '">' + esc(d.status) + '</span></td></tr>';
        }).join('');
        return '<table><thead><tr><th>' + esc(label) + '</th><th>Recorded</th><th>Replayed</th><th>Status</th></tr></thead><tbody>' + (body || '<tr><td colspan="4" class="empty">No rows to show.</td></tr>') + '</tbody></table>';
      }

      function drawerCookies(r) {
        return '<section class="panel"><div class="panel-head"><div><div class="panel-title">Request Cookies</div></div></div><div class="table-scroll">' + cookieDiffTable((r.recorded && r.recorded.requestCookies) || [], (r.replayed && r.replayed.requestCookies) || []) + '</div></section>' +
          '<section class="panel"><div class="panel-head"><div><div class="panel-title">Response Cookies</div></div></div><div class="table-scroll">' + cookieDiffTable((r.recorded && r.recorded.responseCookies) || [], (r.replayed && r.replayed.responseCookies) || []) + '</div></section>';
      }

      function cookieDiffTable(recorded, replayed) {
        var names = {};
        recorded.forEach(function(c) { names[c.name] = true; });
        replayed.forEach(function(c) { names[c.name] = true; });
        var rows = Object.keys(names).sort().map(function(name) {
          var rec = recorded.find(function(c) { return c.name === name; });
          var rep = replayed.find(function(c) { return c.name === name; });
          var rv = rec ? rec.value : '';
          var pv = rep ? rep.value : '';
          var status = !rec ? 'extra_in_replay' : !rep ? 'missing_in_replay' : rv === pv ? 'match' : 'mismatch';
          if (state.diffOnly && status === 'match') return '';
          var cls = status === 'match' ? 'good' : status === 'mismatch' ? 'bad' : 'warn';
          return '<tr><td>' + esc(name) + '</td><td class="wrap mono">' + esc(rv) + '</td><td class="wrap mono">' + esc(pv) + '</td><td><span class="pill ' + cls + '">' + esc(status) + '</span></td></tr>';
        }).join('');
        return '<table><thead><tr><th>Cookie</th><th>Recorded</th><th>Replayed</th><th>Status</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4" class="empty">No cookies to show.</td></tr>') + '</tbody></table>';
      }

      function drawerVariables(r) {
        var rows = (r.variableEvents || []).map(function(v) {
          return '<tr><td>' + esc(v.name) + '</td><td>' + esc(v.type) + '</td><td>' + esc(v.action) + '</td><td class="wrap mono">' + esc(decodeText(v.value)) + '</td><td class="wrap">' + esc(v.source || '-') + '</td></tr>';
        }).join('');
        return '<section class="panel"><div class="panel-head"><div><div class="panel-title">Request Variables</div></div></div><div class="table-scroll"><table><thead><tr><th>Name</th><th>Type</th><th>Action</th><th>Value</th><th>Source</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5" class="empty">No variables captured for this request.</td></tr>') + '</tbody></table></div></section>';
      }

      // Collapsible raw-JSON block so large dumps don't dominate the panel.
      function rawBlock(title, obj, open) {
        var json = JSON.stringify(obj, null, 2);
        return '<details class="raw-block"' + (open ? ' open' : '') + '><summary>' + esc(title) +
          '<span class="raw-meta">' + esc(json.length.toLocaleString()) + ' chars</span></summary><div class="jt-wrap">' + jsonTree(obj) + '</div></details>';
      }

      function drawerRaw(r) {
        return '<div class="mini-actions"><button class="btn" data-copy="' + esc(JSON.stringify(r, null, 2)) + '">Copy raw JSON</button><span class="copy-ok" id="copy-status"></span></div>' +
          rawBlock('Full exchange JSON', r, true) +
          rawBlock('Recorded snapshot', r.recorded || {}, false) +
          rawBlock('Replayed snapshot', r.replayed || {}, false);
      }

      function renderNav() {
        var counts = {
          overview: DATA.summary.totalRequests,
          iterations: DATA.summary.iterations.length,
          transactions: Object.keys(groupBy(visibleResults(), function(r) { return r.transactionName || 'Ungrouped'; })).length,
          requests: visibleResults().length,
          variables: visibleResults().reduce(function(sum, r) { return sum + (r.variableEvents || []).length; }, 0),
          runtime: (DATA.k6Errors || []).length + (DATA.consoleLogs || []).length,
          performance: DATA.k6Metrics ? 1 : 0
        };
        el.nav.innerHTML = navItems.map(function(item) {
          return '<button type="button" data-section="' + item[0] + '" title="' + esc(item[1]) + '" class="' + (state.section === item[0] ? 'active' : '') + '"><span class="nav-ico">' + item[2] + '</span><span class="nav-lbl">' + esc(item[1]) + '</span><span class="nav-count">' + esc(counts[item[0]] || 0) + '</span></button>';
        }).join('');
      }

      function render() {
        el.app.classList.toggle('dense', state.dense);
        renderNav();
        renderHero();
        if (state.section === 'overview') renderOverview();
        if (state.section === 'iterations') renderIterations();
        if (state.section === 'transactions') renderTransactions();
        if (state.section === 'requests') renderRequests();
        if (state.section === 'variables') renderVariables();
        if (state.section === 'runtime') renderRuntime();
        if (state.section === 'performance') renderPerformance();
      }

      function currentDebugTheme() {
        return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      }
      // Apply a theme AND sync the toggle's icon + label so the button always
      // reflects the action it performs (mirrors the custom report): in light
      // mode it shows a moon + "Dark"; in dark mode a sun + "Light".
      function applyDebugTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        try { localStorage.setItem('debug-report-theme', theme); } catch (e) {}
        if (el.theme) {
          var ico = theme === 'dark' ? '&#9728;&#65039;' : '&#127769;'; // ☀️ : 🌙
          var lbl = theme === 'dark' ? 'Light' : 'Dark';
          el.theme.innerHTML = '<span class="nav-ico">' + ico + '</span><span class="nav-lbl">' + lbl + '</span>';
        }
      }

      function initControls() {
        el.iteration.innerHTML = '<option value="all">All iterations</option>' + (DATA.summary.iterations || []).map(function(i) { return '<option value="' + esc(i) + '">Iteration ' + esc(i) + '</option>'; }).join('');
        el.search.addEventListener('input', function() { state.search = this.value; render(); });
        el.iteration.addEventListener('change', function() { state.iteration = this.value; render(); });
        el.filter.addEventListener('change', function() { state.filter = this.value; render(); });
        el.diffOnly.addEventListener('change', function() { state.diffOnly = this.checked; if (state.drawerId) renderDrawer(); render(); });
        el.raw.addEventListener('change', function() { state.raw = this.checked; if (state.drawerId) renderDrawer(); render(); });
        el.dense.addEventListener('change', function() { state.dense = this.checked; render(); });
        el.theme.addEventListener('click', function() {
          applyDebugTheme(currentDebugTheme() === 'dark' ? 'light' : 'dark');
        });
        // Apply the saved theme (default light) so the toggle's icon/label start
        // in sync with the active mode instead of a static moon.
        var savedTheme = 'light';
        try { savedTheme = localStorage.getItem('debug-report-theme') || 'light'; } catch (e) {}
        applyDebugTheme(savedTheme);
      }

      document.addEventListener('click', function(e) {
        var jtToggle = e.target.closest('.jt-tog, .jt-stub');
        if (jtToggle) {
          var node = jtToggle.closest('.jt-node');
          if (node) node.classList.toggle('collapsed');
          return;
        }
        var sectionBtn = e.target.closest('[data-section]');
        if (sectionBtn) {
          state.section = sectionBtn.getAttribute('data-section');
          render();
          return;
        }
        var openRow = e.target.closest('[data-open]');
        if (openRow) {
          openDrawer(openRow.getAttribute('data-open'));
          return;
        }
        var iterRow = e.target.closest('[data-iteration-open]');
        if (iterRow) {
          state.iteration = iterRow.getAttribute('data-iteration-open');
          el.iteration.value = state.iteration;
          state.section = 'requests';
          render();
          return;
        }
        var txnRow = e.target.closest('[data-search-transaction]');
        if (txnRow) {
          state.search = txnRow.getAttribute('data-search-transaction');
          el.search.value = state.search;
          state.section = 'requests';
          render();
          return;
        }
        if (e.target.closest('[data-close]') || e.target === el.drawer) {
          closeDrawer();
          return;
        }
        var tab = e.target.closest('[data-tab]');
        if (tab) {
          state.drawerTab = tab.getAttribute('data-tab');
          renderDrawer();
          return;
        }
        var copy = e.target.closest('[data-copy]');
        if (copy) {
          var text = copy.getAttribute('data-copy') || '';
          var done = function() {
            var status = document.getElementById('copy-status');
            if (status) {
              status.textContent = 'Copied';
              setTimeout(function() { status.textContent = ''; }, 1300);
            }
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(done);
          } else {
            var ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (err) {}
            document.body.removeChild(ta);
            done();
          }
        }
      });

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && state.drawerId) closeDrawer();
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
          e.preventDefault();
          el.search.focus();
          el.search.select();
        }
      });

      initControls();
      render();
    })();
  </script>
</body>
</html>`;
        const absPath = path.resolve(process.cwd(), outPath);
        const dir = path.dirname(absPath);
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(absPath, html, 'utf-8');
    }
    static buildPayload(results, options) {
        const iterations = Array.from(new Set(results.map((result) => result.iteration))).sort((a, b) => a - b);
        const overallScore = this.average(results.map((result) => result.matchScore));
        const missingCount = results.filter((result) => result.comparisonType === 'missing_in_replay').length;
        const replayOnlyCount = results.filter((result) => result.comparisonType === 'extra_in_replay').length;
        const mismatchCount = results.filter((result) => this.hasMismatch(result)).length;
        const worstTransaction = this.findWorstTransaction(results);
        const k6Errors = options?.k6Errors ?? [];
        return {
            generatedAt: new Date().toISOString(),
            summary: {
                overallScore,
                totalRequests: results.length,
                iterations,
                warningCount: this.countWarnings(results),
                missingCount,
                replayOnlyCount,
                mismatchCount,
                worstTransaction,
                status: this.resolveStatus(overallScore, missingCount, replayOnlyCount, mismatchCount, k6Errors.length),
            },
            results,
            k6Errors,
            consoleLogs: options?.consoleLogs ?? [],
            k6Metrics: options?.k6Metrics,
        };
    }
    static hasMismatch(result) {
        return (result.matchScore < 90 ||
            result.comparisonType !== 'matched' ||
            !result.statusMatch ||
            !result.requestBody.match ||
            !result.responseBody.match ||
            result.requestHeaderDiffs.some((diff) => diff.status !== 'match') ||
            result.responseHeaderDiffs.some((diff) => diff.status !== 'match'));
    }
    static resolveStatus(overallScore, missingCount, replayOnlyCount, mismatchCount, errorCount) {
        if (errorCount > 0 || missingCount > 0 || overallScore < 70)
            return 'broken';
        if (replayOnlyCount > 0 || mismatchCount > 0 || overallScore < 95)
            return 'drift';
        return 'passed';
    }
    static findWorstTransaction(results) {
        const byTransaction = new Map();
        results.forEach((result) => {
            const key = result.transactionName || 'Ungrouped';
            const scores = byTransaction.get(key) ?? [];
            scores.push(result.matchScore);
            byTransaction.set(key, scores);
        });
        let worstName = '';
        let worstScore = Number.POSITIVE_INFINITY;
        byTransaction.forEach((scores, name) => {
            const score = this.average(scores);
            if (score < worstScore) {
                worstScore = score;
                worstName = name;
            }
        });
        return worstName;
    }
    static average(values) {
        if (values.length === 0)
            return 0;
        return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    }
    static countWarnings(results) {
        return new Set(results.flatMap((result) => result.warnings)).size;
    }
}
exports.HTMLDiffReporter = HTMLDiffReporter;
