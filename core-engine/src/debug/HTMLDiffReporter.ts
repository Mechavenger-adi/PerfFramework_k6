import * as fs from 'fs';
import * as path from 'path';
import { DiffResult, HeaderDiffEntry } from './DiffChecker';
import { VariableEvent } from './ExchangeLog';
import { K6Metrics } from './ReplayRunner';

interface IterationSummary {
  iteration: number;
  warnings: string[];
  items: DiffResult[];
}

export interface ReportOptions {
  k6Errors?: string[];
  k6Metrics?: K6Metrics;
}

export class HTMLDiffReporter {
  static generateReport(results: DiffResult[], outPath: string, options?: ReportOptions): void {
    const groupedByIteration = this.groupByIteration(results);
    const iterationKeys = Array.from(groupedByIteration.keys()).sort((a, b) => a - b);
    const overallScore = this.average(results.map((result) => result.matchScore));
    const k6Errors = options?.k6Errors ?? [];
    const k6Metrics = options?.k6Metrics;

    const iterationSummaryRows = iterationKeys
      .map((iteration) => this.renderIterationSummaryRow(groupedByIteration.get(iteration)!))
      .join('\n');

    const iterationSections = iterationKeys
      .map((iteration, index) => {
        const summary = groupedByIteration.get(iteration)!;
        return this.renderIterationSection(summary, index === 0);
      })
      .join('\n');

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Replay Insights</title>
    <style>
      html { scroll-behavior: smooth; }
      :root {
        --bg: #f8fafc;
        --surface: #ffffff;
        --surface-alt: #f1f5f9;
        --ink: #0f172a;
        --muted: #64748b;
        --border: #e2e8f0;
        --good: #16a34a;
        --warn: #d97706;
        --bad: #dc2626;
        --accent: #2563eb;
        --radius: 12px;
        --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.05);
        --shadow-lg: 0 4px 12px rgba(0,0,0,0.08), 0 20px 48px rgba(0,0,0,0.08);
        --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        --font-mono: 'SF Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace;
        --highlight: #fef08a;
      }
      * { box-sizing: border-box; margin: 0; }
      body {
        padding: 24px;
        background: var(--bg);
        color: var(--ink);
        font-family: var(--font);
        font-size: 14px;
        line-height: 1.6;
        -webkit-font-smoothing: antialiased;
        overflow-x: hidden;
      }
      .shell { max-width: 1440px; margin: 0 auto; overflow-x: clip; }
      .hero, .section-card, .transaction, .request-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
      }
      .hero {
        padding: 32px;
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        color: #f8fafc;
        border: none;
      }
      .hero h1 { margin: 0 0 4px; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
      .hero .muted { color: #94a3b8; }
      .sticky-bar {
        position: sticky;
        top: 0;
        z-index: 100;
        background: rgba(255,255,255,0.88);
        backdrop-filter: blur(16px) saturate(180%);
        -webkit-backdrop-filter: blur(16px) saturate(180%);
        border-bottom: 1px solid var(--border);
        padding: 10px 24px;
        margin: 0 -24px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        transition: box-shadow 0.3s ease;
      }
      .sticky-bar.scrolled { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      .sticky-left { display: flex; align-items: center; gap: 8px; font-size: 13px; }
      .sticky-left label { font-weight: 600; color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
      .sticky-left select, .search-input {
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 6px 12px;
        background: var(--surface);
        color: var(--ink);
        font-family: var(--font);
        font-size: 13px;
        cursor: pointer;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .sticky-left select:focus, .search-input:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
      }
      .search-group {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-left: auto;
        position: relative;
      }
      .search-input {
        width: 260px;
        padding-left: 32px;
        cursor: text;
      }
      .search-icon {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--muted);
        font-size: 14px;
        pointer-events: none;
      }
      .search-scope {
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 6px 8px;
        background: var(--surface);
        color: var(--ink);
        font-family: var(--font);
        font-size: 12px;
        cursor: pointer;
        outline: none;
      }
      .search-badge {
        font-size: 11px;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 999px;
        background: var(--accent);
        color: white;
        min-width: 20px;
        text-align: center;
      }
      .search-badge.zero { background: var(--muted); }
      .search-clear {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--muted);
        font-size: 16px;
        padding: 2px 6px;
        border-radius: 4px;
        line-height: 1;
      }
      .search-clear:hover { background: var(--surface-alt); color: var(--ink); }
      mark { background: var(--highlight); color: inherit; border-radius: 2px; padding: 0 1px; transition: background 0.15s; }
      mark.current { background: #f97316; color: white; border-radius: 3px; padding: 0 2px; }
      .search-hidden { display: none !important; }
      .search-nav {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 3px 8px;
        cursor: pointer;
        font-size: 14px;
        font-family: var(--font);
        color: var(--muted);
        line-height: 1;
        transition: all 0.15s;
      }
      .search-nav:hover { background: var(--surface-alt); color: var(--ink); }
      .search-nav:disabled { opacity: 0.3; cursor: default; }
      .search-pos { font-size: 11px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; min-width: 40px; text-align: center; }
      .clickable-row { cursor: pointer; }
      .clickable-row:hover { background: #dbeafe !important; }
      .clickable-cell { color: var(--accent); cursor: pointer; font-weight: 500; }
      .clickable-cell:hover { text-decoration: underline; }
      .sticky-right { display: flex; align-items: center; gap: 8px; }
      .sticky-score {
        padding: 4px 14px;
        border-radius: 999px;
        font-weight: 700;
        font-size: 13px;
        color: white;
      }
      .btn-top {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 5px 12px;
        cursor: pointer;
        font-size: 12px;
        font-family: var(--font);
        color: var(--muted);
        font-weight: 600;
        transition: all 0.2s;
      }
      .btn-top:hover { background: var(--surface-alt); color: var(--ink); }
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 12px;
        margin-top: 20px;
      }
      .stat {
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 10px;
        padding: 16px;
        transition: transform 0.2s, background 0.2s;
      }
      .stat:hover { transform: translateY(-2px); background: rgba(255,255,255,0.12); }
      .hero .label {
        color: #94a3b8;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 500;
      }
      .hero .value {
        display: block;
        margin-top: 4px;
        font-size: 28px;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: #f8fafc;
      }
      .iter-stat .label { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; }
      .iter-stat .value { display: block; margin-top: 4px; font-size: 26px; font-weight: 700; letter-spacing: -0.02em; }
      .iter-stat {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 16px;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .iter-stat:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
      .section-card {
        margin-top: 16px;
        padding: 24px;
        overflow: hidden;
      }
      .section-card h2 { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
      .iteration-panel { display: none; margin-top: 16px; }
      .iteration-panel.active { display: block; animation: fadeIn 0.25s ease; }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .warning {
        margin-top: 12px;
        padding: 10px 14px;
        background: #fef9c3;
        border: 1px solid #fde047;
        border-radius: 8px;
        color: #854d0e;
        font-size: 13px;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: 1.2fr 1fr;
        gap: 18px;
        margin-top: 18px;
      }
      .summary-grid.single {
        grid-template-columns: 1fr;
      }
      table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        margin-top: 12px;
        font-size: 13px;
        table-layout: fixed;
        max-width: 100%;
      }
      th, td {
        border-bottom: 1px solid var(--border);
        border-right: 1px solid var(--border);
        padding: 9px 12px;
        text-align: left;
        vertical-align: top;
      }
      th:first-child, td:first-child { border-left: 1px solid var(--border); }
      thead tr:first-child th { border-top: 1px solid var(--border); }
      thead tr:first-child th:first-child { border-top-left-radius: 8px; }
      thead tr:first-child th:last-child { border-top-right-radius: 8px; }
      tbody tr:last-child td:first-child { border-bottom-left-radius: 8px; }
      tbody tr:last-child td:last-child { border-bottom-right-radius: 8px; }
      td { overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; white-space: normal; transition: background 0.1s; }
      th { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; position: relative; background: linear-gradient(to bottom, var(--surface-alt), #e8ecf1); border-bottom: 2px solid var(--border); white-space: nowrap; }
      .col-resize { position: absolute; right: -2px; top: 0; bottom: 0; width: 5px; cursor: col-resize; background: transparent; z-index: 2; }
      .col-resize:hover, .col-resize.active { background: var(--accent); opacity: 0.5; }
      body.resizing, body.resizing * { cursor: col-resize !important; user-select: none !important; }
      tbody tr:nth-child(even) td { background: rgba(241,245,249,0.5); }
      tbody tr:hover td { background: #dbeafe; }
      th.sortable { cursor: pointer; position: relative; padding-right: 20px; }
      th.sortable:hover { background: #dbeafe; color: var(--accent); }
      th.sortable::after { content: '⇅'; position: absolute; right: 4px; top: 50%; transform: translateY(-50%); font-size: 10px; color: var(--muted); opacity: 0.5; }
      th.sortable.sort-asc::after { content: '▲'; opacity: 1; color: var(--accent); }
      th.sortable.sort-desc::after { content: '▼'; opacity: 1; color: var(--accent); }
      .transaction {
        margin-top: 16px;
        overflow: hidden;
      }
      .transaction-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border);
        background: var(--surface-alt);
        list-style: none;
        transition: background 0.15s;
      }
      .transaction-header:hover { background: #e2e8f0; }
      .transaction-header::-webkit-details-marker {
        display: none;
      }
      .transaction-title {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .transaction-header h2 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
      }
      .transaction-toggle {
        white-space: nowrap;
        color: var(--accent);
        font-size: 12px;
        font-weight: 600;
      }
      .request-card {
        margin: 12px 16px 16px;
        padding: 20px;
        border-left: 3px solid var(--border);
        transition: box-shadow 0.2s;
        overflow: clip;
        position: relative;
      }
      .request-card:hover { box-shadow: var(--shadow-lg); }
      .request-card.score-good { border-left-color: var(--good); }
      .request-card.score-warn { border-left-color: var(--warn); }
      .request-card.score-bad { border-left-color: var(--bad); }
      .request-card-sticky {
        position: sticky;
        top: 52px;
        z-index: 50;
        background: var(--surface);
        margin: -20px -20px 0;
        padding: 14px 20px 12px;
        border-bottom: 1px solid var(--border);
        transition: box-shadow 0.2s;
      }
      .request-card-sticky.stuck { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
      .request-header {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .request-header h3 { font-size: 14px; font-weight: 600; }
      .request-meta {
        color: var(--muted);
        margin-top: 6px;
        font-size: 13px;
        word-break: break-all;
      }
      .score {
        padding: 4px 12px;
        border-radius: 8px;
        color: white;
        font-weight: 700;
        min-width: 56px;
        text-align: center;
        font-size: 13px;
      }
      .good { background: var(--good); color: white; }
      .warn { background: var(--warn); color: white; }
      .bad { background: var(--bad); color: white; }
      .chips {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 12px;
      }
      .chip {
        border-radius: 6px;
        padding: 4px 10px;
        border: 1px solid var(--border);
        background: var(--surface-alt);
        font-size: 12px;
        color: var(--ink);
        font-weight: 500;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-top: 16px;
      }
      .grid > * { min-width: 0; }
      .panel {
        background: var(--surface-alt);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 16px;
        overflow-x: auto;
        overflow-y: hidden;
        max-width: 100%;
      }
      .panel h4 { font-size: 13px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }
      .body-section {
        margin-top: 16px;
        background: var(--surface-alt);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 16px;
        overflow: clip;
        max-width: 100%;
      }
      .body-section details {
        margin-top: 0;
        border-top: 0;
        padding-top: 0;
      }
      .body-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
        margin-top: 12px;
      }
      .body-grid > * { min-width: 0;
      }
      .body-pane { position: relative; }
      pre {
        margin: 10px 0 0;
        white-space: pre-wrap;
        word-break: break-word;
        background: #f8fafc;
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 12px;
        font-size: 12px;
        line-height: 1.5;
        font-family: var(--font-mono);
        max-height: 400px;
        overflow: auto;
      }
      details {
        margin-top: 14px;
        border-top: 1px dashed var(--border);
        padding-top: 12px;
      }
      summary {
        cursor: pointer;
        font-weight: bold;
        padding: 2px 0;
        user-select: none;
        transition: color 0.2s;
      }
      summary:hover { color: var(--accent); }
      .muted { color: var(--muted); }
      .empty { color: var(--muted); font-style: italic; }
      .tag-list { margin-top: 12px; }
      .tag-list code {
        display: inline-block;
        margin-right: 6px;
        margin-bottom: 4px;
        padding: 3px 8px;
        border-radius: 6px;
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        font-family: var(--font-mono);
        font-size: 12px;
      }
      .chip.good {
        color: #166534;
        background: #dcfce7;
        border-color: #86efac;
      }
      .chip.warn {
        color: #92400e;
        background: #fef3c7;
        border-color: #fde68a;
      }
      .chip.bad {
        color: #991b1b;
        background: #fee2e2;
        border-color: #fca5a5;
      }
      .body-preview {
        max-height: 120px;
        overflow: auto;
        font-size: 12px;
        white-space: pre-wrap;
        word-break: break-all;
        background: #f8fafc;
        padding: 8px;
        border-radius: 6px;
        margin: 4px 0 0;
        font-family: var(--font-mono);
      }
      .redirect-warning {
        background: #fef9c3;
        border-left: 3px solid #eab308;
        padding: 8px 12px;
        margin-bottom: 8px;
        font-size: 13px;
        border-radius: 4px;
        color: #854d0e;
      }
      /* View mode toggle */
      .mode-toggle-group { display: flex; align-items: center; gap: 6px; }
      .mode-toggle { position: relative; display: inline-block; width: 36px; height: 20px; flex-shrink: 0; }
      .mode-toggle input { opacity: 0; width: 0; height: 0; }
      .toggle-slider {
        position: absolute; cursor: pointer; inset: 0;
        background: var(--border); border-radius: 20px; transition: background 0.2s;
      }
      .toggle-slider::before {
        content: ''; position: absolute; height: 14px; width: 14px; left: 3px; bottom: 3px;
        background: white; border-radius: 50%; transition: transform 0.2s;
      }
      .mode-toggle input:checked + .toggle-slider { background: var(--accent); }
      .mode-toggle input:checked + .toggle-slider::before { transform: translateX(16px); }
      .mode-label { font-size: 12px; font-weight: 600; color: var(--muted); white-space: nowrap; }
      /* Decoded/raw display */
      .decoded { word-break: break-all; }
      .raw { word-break: break-all; display: none; }
      .body-raw { display: none; }
      /* Request summary table */
      .req-summary-table { table-layout: fixed; }
      .req-summary-table th:nth-child(1) { width: 5%; }
      .req-summary-table th:nth-child(2) { width: 15%; }
      .req-summary-table th:nth-child(3) { width: 7%; }
      .req-summary-table th:nth-child(4) { width: 41%; }
      .req-summary-table th:nth-child(5) { width: 7%; }
      .req-summary-table th:nth-child(6) { width: 10%; }
      .req-summary-table th:nth-child(7) { width: 15%; }
      .req-summary-table td:nth-child(2),
      .req-summary-table td:nth-child(7) { max-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .req-summary-table td:nth-child(4) { max-width: 0; word-break: break-all; overflow-wrap: break-word; white-space: normal; }
      .req-summary-table td:nth-child(4) .raw { display: none; }
      /* Status code colors */
      .status-2xx { color: var(--good); font-weight: 600; }
      .status-3xx { color: var(--accent); font-weight: 600; }
      .status-4xx { color: var(--warn); font-weight: 600; }
      .status-5xx { color: var(--bad); font-weight: 600; }
      /* Raw mode overrides */
      .shell.raw-mode .decoded { display: none; }
      .shell.raw-mode .raw { display: inline; }
      .shell.raw-mode pre.raw, .shell.raw-mode pre.body-raw { display: block; }
      .shell.raw-mode pre.decoded, .shell.raw-mode pre.body-formatted { display: none; }
      .shell.raw-mode .req-summary-table td:nth-child(2),
      .shell.raw-mode .req-summary-table td:nth-child(7) { white-space: normal; overflow: visible; max-width: none; }
      .shell.raw-mode .req-summary-table td:nth-child(4) { white-space: normal; overflow: visible; max-width: none; }
      .shell.raw-mode .req-summary-table td:nth-child(4) .decoded { display: none; }
      .shell.raw-mode .req-summary-table td:nth-child(4) .raw { display: inline; white-space: normal; overflow-wrap: break-word; }
      .shell.raw-mode .body-formatted { display: none; }
      .shell.raw-mode .body-raw { display: block; }
      .error-panel { background: #fef2f2; border: 1px solid var(--bad); border-radius: var(--radius); padding: 16px 20px; margin-bottom: 20px; }
      .error-panel h2 { color: var(--bad); font-size: 16px; margin: 0 0 10px; display: flex; align-items: center; gap: 8px; }
      .error-panel h2::before { content: '⚠'; font-size: 18px; }
      .error-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
      .error-item { background: #fff; border: 1px solid #fecaca; border-radius: 6px; padding: 8px 12px; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 12px; color: #991b1b; word-break: break-word; white-space: pre-wrap; }
      /* Performance metrics section */
      .metrics-section { margin-top: 16px; margin-bottom: 20px; }
      .metrics-section h2 { font-size: 16px; font-weight: 700; margin: 0 0 14px; display: flex; align-items: center; gap: 8px; }
      .metrics-section h2::before { content: '⚡'; font-size: 16px; }
      .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .metrics-grid .metrics-card.full-width { grid-column: 1 / -1; }
      @media (max-width: 960px) { .metrics-grid { grid-template-columns: 1fr; } }
      .metrics-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
      .metrics-card h3 { font-size: 13px; font-weight: 700; color: var(--ink); padding: 12px 16px; margin: 0; background: var(--surface-alt); border-bottom: 1px solid var(--border); text-transform: uppercase; letter-spacing: 0.04em; }
      .metrics-card table { margin: 0; font-size: 12px; }
      .metrics-card th { font-size: 10px; }
      .metrics-card td { font-family: var(--font-mono); font-size: 12px; }
      .metrics-card td:not(:first-child) { text-align: right; font-variant-numeric: tabular-nums; }
      .metrics-card th:not(:first-child) { text-align: right; }
      .check-pass { color: var(--good); font-weight: 700; }
      .check-fail { color: var(--bad); font-weight: 700; }
      .check-pass::before { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--good); margin-right: 6px; vertical-align: middle; }
      .check-fail::before { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--bad); margin-right: 6px; vertical-align: middle; }
      .metric-kv { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 16px; }
      .metric-kv-item { background: var(--surface-alt); border: 1px solid var(--border); border-radius: 8px; padding: 8px 14px; flex: 1; min-width: 120px; }
      .metric-kv-item .mk-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 600; }
      .metric-kv-item .mk-value { display: block; margin-top: 2px; font-size: 16px; font-weight: 700; font-family: var(--font-mono); color: var(--ink); }
      .body-pane > .pane-header { display: flex; align-items: center; }
      .body-pane > .pane-header > .pane-label { flex: 1; }
      /* Section search */
      .section-search-btn {
        background: var(--surface-alt); border: 1px solid var(--border); cursor: pointer;
        color: var(--muted); font-size: 13px; width: 26px; height: 26px;
        display: inline-flex; align-items: center; justify-content: center;
        border-radius: 6px; transition: all 0.2s; flex-shrink: 0;
      }
      .section-search-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent); box-shadow: 0 1px 4px rgba(0,0,0,0.12); }
      .section-search-btn svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
      .section-search-bar {
        display: none; align-items: center; gap: 6px;
        padding: 6px 10px; margin-top: 8px;
        background: var(--surface); border: 1px solid var(--border);
        border-radius: 8px; font-size: 12px;
      }
      .section-search-bar.open { display: flex; flex-wrap: wrap; }
      .section-search-bar input {
        border: 1px solid var(--border); border-radius: 6px;
        padding: 4px 8px; font-size: 12px; font-family: var(--font);
        outline: none; min-width: 140px; flex: 1;
      }
      .section-search-bar input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(37,99,235,0.12); }
      .section-search-bar .ss-badge {
        font-size: 10px; font-weight: 600; padding: 2px 6px;
        border-radius: 999px; background: var(--accent); color: white;
        min-width: 16px; text-align: center;
      }
      .section-search-bar .ss-badge.zero { background: var(--muted); }
      .section-search-bar button {
        background: var(--surface-alt); border: 1px solid var(--border);
        border-radius: 4px; padding: 2px 6px; cursor: pointer;
        font-size: 12px; color: var(--muted); line-height: 1; transition: all 0.15s;
      }
      .section-search-bar button:hover { background: var(--border); color: var(--ink); }
      .section-search-bar button:disabled { opacity: 0.3; cursor: default; }
      .body-section summary { display: flex; align-items: center; }
      .ss-sync-group { display: inline-flex; align-items: center; gap: 4px; margin-left: auto; font-weight: normal; }
      .ss-sync-group label { font-size: 11px; color: var(--muted); cursor: pointer; user-select: none; }
      .ss-sync-toggle { width: 28px; height: 16px; position: relative; display: inline-block; vertical-align: middle; }
      .ss-sync-toggle input { opacity: 0; width: 0; height: 0; }
      .ss-sync-toggle .ss-slider {
        position: absolute; cursor: pointer; inset: 0;
        background: var(--border); border-radius: 16px; transition: background 0.2s;
      }
      .ss-sync-toggle .ss-slider::before {
        content: ''; position: absolute; height: 12px; width: 12px; left: 2px; bottom: 2px;
        background: white; border-radius: 50%; transition: transform 0.2s;
      }
      .ss-sync-toggle input:checked + .ss-slider { background: var(--accent); }
      .ss-sync-toggle input:checked + .ss-slider::before { transform: translateX(12px); }
      @media (max-width: 960px) {
        body { padding: 12px; }
        .summary-grid, .grid, .body-grid { grid-template-columns: 1fr; }
        .sticky-bar { flex-direction: column; align-items: stretch; margin: 0 -12px 16px; padding: 10px 12px; gap: 8px; }
        .search-group { margin-left: 0; }
        .search-input { width: 100%; }
        .hero { padding: 20px; border-radius: var(--radius); }
        .hero h1 { font-size: 20px; }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <section class="hero">
        <h1>Replay Insights</h1>
        <p class="muted">Iteration-aware replay debugging with request diffs, request timings, and captured variable values.</p>
        <div class="stats">
          <div class="stat">
            <span class="label">Overall Score</span>
            <span class="value">${overallScore}%</span>
          </div>
          <div class="stat">
            <span class="label">Iterations</span>
            <span class="value">${iterationKeys.length}</span>
          </div>
          <div class="stat">
            <span class="label">Requests Compared</span>
            <span class="value">${results.length}</span>
          </div>
          <div class="stat">
            <span class="label">Warnings</span>
            <span class="value">${this.countWarnings(results)}</span>
          </div>
        </div>
      </section>

      ${k6Errors.length > 0 ? `
      <section class="error-panel">
        <h2>k6 Runtime Errors (${k6Errors.length})</h2>
        <ul class="error-list">
          ${k6Errors.map(e => `<li class="error-item">${this.escapeHtml(e)}</li>`).join('\n          ')}
        </ul>
      </section>
      ` : ''}

      ${k6Metrics ? this.renderMetricsSection(k6Metrics) : ''}

      <div class="sticky-bar" id="sticky-bar">
        <div class="sticky-left">
          <label for="iteration-select">Iteration</label>
          <select id="iteration-select" onchange="window.showIteration(this.value)">
            ${iterationKeys.map((iteration) => `<option value="${iteration}">Iteration ${iteration}</option>`).join('')}
          </select>
        </div>
        <div class="search-group">
          <span class="search-icon">&#128269;</span>
          <input type="text" class="search-input" id="search-input" placeholder="Search URLs, bodies, headers\u2026" autocomplete="off" />
          <select class="search-scope" id="search-scope" title="Search scope">
            <option value="all">All</option>
            <option value="url">URL</option>
            <option value="request-body">Request Body</option>
            <option value="response-body">Response Body</option>
            <option value="headers">Headers</option>
          </select>
          <span class="search-badge zero" id="search-count" style="display:none">0</span>
          <button class="search-nav" id="search-prev" style="display:none" title="Previous match (Shift+Enter)">&#9650;</button>
          <span class="search-pos" id="search-pos" style="display:none"></span>
          <button class="search-nav" id="search-next" style="display:none" title="Next match (Enter)">&#9660;</button>
          <button class="search-clear" id="search-clear" style="display:none" title="Clear search">&times;</button>
        </div>
        <div class="sticky-right">
          <div class="mode-toggle-group">
            <label class="mode-toggle"><input type="checkbox" id="mode-toggle" checked /><span class="toggle-slider"></span></label>
            <span class="mode-label">Decoded</span>
          </div>
          <span class="sticky-score ${this.scoreClass(overallScore)}">${overallScore}%</span>
          <button class="btn-top" onclick="window.scrollTo({top:0,behavior:'smooth'})" title="Back to top">&#8593; Top</button>
        </div>
      </div>

      <section class="section-card">
        <h2>All Iterations Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Iteration</th>
              <th>Requests</th>
              <th>Matched</th>
              <th>Missing</th>
              <th>Extra</th>
              <th>Avg Match Score</th>
              <th>Total Request Time</th>
            </tr>
          </thead>
          <tbody>
            ${iterationSummaryRows}
          </tbody>
        </table>
      </section>

      ${iterationSections}
    </div>
    <script>
      (function() {
        var searchInput = document.getElementById('search-input');
        var searchScope = document.getElementById('search-scope');
        var searchCount = document.getElementById('search-count');
        var searchClear = document.getElementById('search-clear');
        var searchPrev = document.getElementById('search-prev');
        var searchNext = document.getElementById('search-next');
        var searchPos = document.getElementById('search-pos');
        var stickyBar = document.getElementById('sticky-bar');
        var debounceTimer = null;
        var currentIdx = -1;
        var allMarks = [];

        window.showIteration = function(iteration) {
          document.querySelectorAll('.iteration-panel').forEach(function(panel) {
            panel.classList.toggle('active', panel.getAttribute('data-iteration') === String(iteration));
          });
          document.getElementById('iteration-select').value = String(iteration);
          if (searchInput.value.trim()) doSearch();
        };

        window.scrollToElement = function(id) {
          var el = document.getElementById(id);
          if (!el) return;
          var details = el.closest('details');
          if (details && !details.open) details.open = true;
          var parentDetails = el.querySelector('details');
          if (parentDetails && !parentDetails.open) parentDetails.open = true;
          setTimeout(function() {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            el.style.outline = '2px solid var(--accent)';
            el.style.outlineOffset = '4px';
            el.style.borderRadius = 'var(--radius)';
            setTimeout(function() { el.style.outline = 'none'; }, 2000);
          }, 50);
        };

        function escapeRegex(s) { return s.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&'); }

        function clearHighlights(root) {
          root.querySelectorAll('mark').forEach(function(m) {
            var parent = m.parentNode;
            parent.replaceChild(document.createTextNode(m.textContent), m);
            parent.normalize();
          });
        }

        function highlightText(node, regex) {
          var count = 0;
          var walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
          var textNodes = [];
          while (walk.nextNode()) textNodes.push(walk.currentNode);
          textNodes.forEach(function(tn) {
            if (tn.parentNode.tagName === 'SCRIPT' || tn.parentNode.tagName === 'STYLE' || tn.parentNode.tagName === 'MARK') return;
            var val = tn.nodeValue;
            if (!regex.test(val)) return;
            regex.lastIndex = 0;
            var frag = document.createDocumentFragment();
            var lastIdx = 0;
            var match;
            while ((match = regex.exec(val)) !== null) {
              if (match.index > lastIdx) frag.appendChild(document.createTextNode(val.slice(lastIdx, match.index)));
              var mark = document.createElement('mark');
              mark.textContent = match[0];
              frag.appendChild(mark);
              count++;
              lastIdx = regex.lastIndex;
              if (!regex.global) break;
            }
            if (lastIdx < val.length) frag.appendChild(document.createTextNode(val.slice(lastIdx)));
            tn.parentNode.replaceChild(frag, tn);
          });
          return count;
        }

        function getScopeSelector(scope) {
          switch (scope) {
            case 'url': return '.request-meta';
            case 'request-body': return '.body-section:first-of-type';
            case 'response-body': return '.body-section:last-of-type';
            case 'headers': return '.panel';
            default: return null;
          }
        }

        function showSearchControls(show) {
          var d = show ? 'inline-block' : 'none';
          searchCount.style.display = d;
          searchClear.style.display = d;
          searchPrev.style.display = d;
          searchNext.style.display = d;
          searchPos.style.display = d;
        }

        function updatePosition() {
          if (allMarks.length === 0) {
            searchPos.textContent = '';
            searchPrev.disabled = true;
            searchNext.disabled = true;
            return;
          }
          searchPos.textContent = (currentIdx + 1) + '/' + allMarks.length;
          searchPrev.disabled = allMarks.length <= 1;
          searchNext.disabled = allMarks.length <= 1;
        }

        function goToMark(idx) {
          if (allMarks.length === 0) return;
          if (allMarks[currentIdx]) allMarks[currentIdx].classList.remove('current');
          currentIdx = ((idx % allMarks.length) + allMarks.length) % allMarks.length;
          var m = allMarks[currentIdx];
          m.classList.add('current');
          var parentDetails = m.closest('details');
          while (parentDetails) {
            if (!parentDetails.open) parentDetails.open = true;
            parentDetails = parentDetails.parentElement ? parentDetails.parentElement.closest('details') : null;
          }
          m.scrollIntoView({ behavior: 'smooth', block: 'center' });
          updatePosition();
        }

        function doSearch() {
          var query = searchInput.value.trim();
          var activePanel = document.querySelector('.iteration-panel.active');
          if (!activePanel) return;
          var cards = activePanel.querySelectorAll('.request-card');
          clearHighlights(activePanel);
          cards.forEach(function(c) { c.classList.remove('search-hidden'); });
          allMarks = [];
          currentIdx = -1;

          if (!query) {
            showSearchControls(false);
            return;
          }

          var scope = searchScope.value;
          var scopeSel = getScopeSelector(scope);
          var totalMatches = 0;

          cards.forEach(function(card) {
            var target = scopeSel ? card.querySelectorAll(scopeSel) : [card];
            var cardMatches = 0;
            for (var i = 0; i < target.length; i++) {
              cardMatches += highlightText(target[i], new RegExp(escapeRegex(query), 'gi'));
            }
            if (cardMatches > 0) {
              totalMatches += cardMatches;
            } else {
              card.classList.add('search-hidden');
            }
          });

          allMarks = Array.from(activePanel.querySelectorAll('mark'));
          searchCount.textContent = totalMatches + ' match' + (totalMatches !== 1 ? 'es' : '');
          searchCount.className = 'search-badge' + (totalMatches === 0 ? ' zero' : '');
          showSearchControls(true);

          if (allMarks.length > 0) goToMark(0);
          else updatePosition();
        }

        searchInput.addEventListener('input', function() {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(doSearch, 200);
        });
        searchScope.addEventListener('change', function() { if (searchInput.value.trim()) doSearch(); });
        searchClear.addEventListener('click', function() {
          searchInput.value = '';
          doSearch();
          searchInput.focus();
        });
        searchPrev.addEventListener('click', function() { goToMark(currentIdx - 1); });
        searchNext.addEventListener('click', function() { goToMark(currentIdx + 1); });
        searchInput.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') { searchInput.value = ''; doSearch(); return; }
          if (e.key === 'Enter') {
            e.preventDefault();
            if (allMarks.length === 0) return;
            if (e.shiftKey) goToMark(currentIdx - 1);
            else goToMark(currentIdx + 1);
          }
        });
        document.addEventListener('keydown', function(e) {
          if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
          }
        });

        window.showIteration(${iterationKeys[0] ?? 1});
        window.addEventListener('scroll', function() {
          if (stickyBar) stickyBar.classList.toggle('scrolled', window.scrollY > 80);
        });

        var modeToggle = document.getElementById('mode-toggle');
        var shellEl = document.querySelector('.shell');
        modeToggle.addEventListener('change', function() {
          shellEl.classList.toggle('raw-mode', !this.checked);
        });

        // Column resize
        function initTableResize(table) {
          if (table.dataset.resizeInit) return;
          table.dataset.resizeInit = '1';
          var ths = table.querySelectorAll('thead th');
          if (ths.length === 0) return;
          // Capture natural widths before switching to fixed layout
          var widths = [];
          ths.forEach(function(th) { widths.push(th.offsetWidth); });
          if (widths[0] === 0) return; // not visible yet
          table.style.tableLayout = 'fixed';
          ths.forEach(function(th, i) { th.style.width = widths[i] + 'px'; });
          ths.forEach(function(th, i) {
            if (i === ths.length - 1) return;
            var handle = document.createElement('div');
            handle.className = 'col-resize';
            th.appendChild(handle);
            handle.addEventListener('mousedown', function(e) {
              e.preventDefault();
              var startX = e.pageX;
              var startW = th.offsetWidth;
              var nextTh = ths[i + 1];
              var nextW = nextTh ? nextTh.offsetWidth : 0;
              document.body.classList.add('resizing');
              handle.classList.add('active');
              function onMove(ev) {
                var dx = ev.pageX - startX;
                var newW = Math.max(60, startW + dx);
                var newNextW = nextTh ? Math.max(60, nextW - dx) : 0;
                if (nextTh && (newNextW <= 60 || newW <= 60)) return;
                th.style.width = newW + 'px';
                if (nextTh) nextTh.style.width = newNextW + 'px';
              }
              function onUp() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                document.body.classList.remove('resizing');
                handle.classList.remove('active');
              }
              document.addEventListener('mousemove', onMove);
              document.addEventListener('mouseup', onUp);
            });
          });
        }
        // Init visible tables
        document.querySelectorAll('table').forEach(function(t) { initTableResize(t); });
        // Init tables inside details when opened
        document.addEventListener('toggle', function(e) {
          if (e.target.tagName === 'DETAILS' && e.target.open) {
            e.target.querySelectorAll('table').forEach(function(t) { initTableResize(t); });
          }
        }, true);

        // ── Section-scoped search with scroll sync ──
        function ssClearHighlights(container) {
          container.querySelectorAll('mark.ss-mark').forEach(function(m) {
            var p = m.parentNode;
            p.replaceChild(document.createTextNode(m.textContent), m);
            p.normalize();
          });
        }

        function ssHighlight(node, regex) {
          var count = 0;
          var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
          var nodes = [];
          while (walker.nextNode()) nodes.push(walker.currentNode);
          nodes.forEach(function(tn) {
            if (tn.parentNode.tagName === 'SCRIPT' || tn.parentNode.tagName === 'STYLE' || tn.parentNode.closest('.section-search-bar')) return;
            if (tn.parentNode.tagName === 'MARK') return;
            var val = tn.nodeValue;
            if (!regex.test(val)) return;
            regex.lastIndex = 0;
            var frag = document.createDocumentFragment();
            var last = 0, match;
            while ((match = regex.exec(val)) !== null) {
              if (match.index > last) frag.appendChild(document.createTextNode(val.slice(last, match.index)));
              var mk = document.createElement('mark');
              mk.className = 'ss-mark';
              mk.textContent = match[0];
              frag.appendChild(mk);
              count++;
              last = regex.lastIndex;
              if (!regex.global) break;
            }
            if (last < val.length) frag.appendChild(document.createTextNode(val.slice(last)));
            tn.parentNode.replaceChild(frag, tn);
          });
          return count;
        }

        function ssGetPre(pane) {
          var pre = pane.querySelector('pre.body-formatted');
          if (pre && pre.offsetParent === null) pre = pane.querySelector('pre.body-raw');
          return pre || pane.querySelector('pre');
        }

        function ssGetSiblingPane(pane) {
          var grid = pane.closest('.body-grid');
          if (!grid) return null;
          var panes = grid.querySelectorAll('.body-pane');
          for (var i = 0; i < panes.length; i++) {
            if (panes[i] !== pane) return panes[i];
          }
          return null;
        }

        function ssIsSyncEnabled(pane) {
          var section = pane.closest('.body-section');
          if (!section) return false;
          var check = section.querySelector('.scroll-sync-check');
          return check && check.checked;
        }

        function ssDoSearch(bar) {
          var pane = bar.closest('.body-pane');
          var input = bar.querySelector('input');
          var badge = bar.querySelector('.ss-badge');
          var prev = bar.querySelector('.ss-prev');
          var next = bar.querySelector('.ss-next');
          var pos = bar.querySelector('.ss-pos');
          var query = input.value.trim();

          ssClearHighlights(pane);
          bar._marks = [];
          bar._idx = -1;

          if (!query) {
            badge.textContent = '0';
            badge.className = 'ss-badge zero';
            pos.textContent = '';
            prev.disabled = true;
            next.disabled = true;
            return;
          }

          var pre = ssGetPre(pane);
          if (pre) {
            ssHighlight(pre, new RegExp(escapeRegex(query), 'gi'));
          }

          bar._marks = Array.from(pane.querySelectorAll('mark.ss-mark'));
          var cnt = bar._marks.length;
          badge.textContent = cnt;
          badge.className = 'ss-badge' + (cnt === 0 ? ' zero' : '');
          prev.disabled = cnt <= 1;
          next.disabled = cnt <= 1;

          if (cnt > 0) {
            ssGoTo(bar, 0);
          } else {
            pos.textContent = '';
          }
        }

        function ssGoTo(bar, idx) {
          var marks = bar._marks || [];
          if (marks.length === 0) return;
          if (marks[bar._idx]) marks[bar._idx].classList.remove('current');
          bar._idx = ((idx % marks.length) + marks.length) % marks.length;
          var m = marks[bar._idx];
          m.classList.add('current');
          var pre = m.closest('pre');
          if (pre) {
            var preRect = pre.getBoundingClientRect();
            var markRect = m.getBoundingClientRect();
            pre.scrollTop += markRect.top - preRect.top - preRect.height / 2 + markRect.height / 2;
          }
          bar.querySelector('.ss-pos').textContent = (bar._idx + 1) + '/' + marks.length;

          // Scroll sync: if section-level toggle enabled, sync sibling pane
          var pane = bar.closest('.body-pane');
          if (ssIsSyncEnabled(pane) && pre) {
            var siblingPane = ssGetSiblingPane(pane);
            if (siblingPane) {
              var sibPre = ssGetPre(siblingPane);
              if (sibPre && pre.scrollHeight > pre.clientHeight) {
                var ratio = pre.scrollTop / (pre.scrollHeight - pre.clientHeight);
                sibPre.scrollTop = ratio * (sibPre.scrollHeight - sibPre.clientHeight);
              }
            }
          }
        }

        window.openSectionSearch = function(btn) {
          var pane = btn.closest('.body-pane');
          if (!pane) return;
          var bar = pane.querySelector('.section-search-bar');
          if (!bar) return;
          bar.classList.toggle('open');
          if (bar.classList.contains('open')) {
            var inp = bar.querySelector('input');
            inp.focus();
            inp.select();
          } else {
            ssClearHighlights(pane);
            bar._marks = [];
            bar._idx = -1;
          }
        };

        // Bind all section search bars
        document.querySelectorAll('.section-search-bar').forEach(function(bar) {
          var input = bar.querySelector('input');
          var timer = null;
          input.addEventListener('input', function() {
            clearTimeout(timer);
            timer = setTimeout(function() { ssDoSearch(bar); }, 200);
          });
          input.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
              bar.classList.remove('open');
              ssClearHighlights(bar.closest('.body-pane'));
              bar._marks = []; bar._idx = -1;
              return;
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              if (!(bar._marks || []).length) return;
              if (e.shiftKey) ssGoTo(bar, (bar._idx || 0) - 1);
              else ssGoTo(bar, (bar._idx || 0) + 1);
            }
          });
          bar.querySelector('.ss-prev').addEventListener('click', function() { ssGoTo(bar, (bar._idx || 0) - 1); });
          bar.querySelector('.ss-next').addEventListener('click', function() { ssGoTo(bar, (bar._idx || 0) + 1); });
          bar.querySelector('.ss-close').addEventListener('click', function() {
            bar.classList.remove('open');
            ssClearHighlights(bar.closest('.body-pane'));
            bar._marks = []; bar._idx = -1;
          });
        });

        // Section-level scroll sync: bind pre scroll events per body-section
        document.querySelectorAll('.body-section').forEach(function(section) {
          var panes = section.querySelectorAll('.body-pane');
          panes.forEach(function(pane) {
            var pre = ssGetPre(pane);
            if (!pre) return;
            pre.addEventListener('scroll', function() {
              if (!ssIsSyncEnabled(pane)) return;
              var sib = ssGetSiblingPane(pane);
              if (!sib) return;
              var sibPre = ssGetPre(sib);
              if (!sibPre || pre.scrollHeight <= pre.clientHeight) return;
              var r = pre.scrollTop / (pre.scrollHeight - pre.clientHeight);
              sibPre.scrollTop = r * (sibPre.scrollHeight - sibPre.clientHeight);
            });
          });
        });
      })();

      // ── Metrics table sorting ──
      (function() {
        document.querySelectorAll('table.m-sortable th.sortable').forEach(function(th) {
          th.addEventListener('click', function() {
            var table = th.closest('table');
            var tbody = table.querySelector('tbody');
            var colIdx = parseInt(th.dataset.col, 10);
            var type = th.dataset.type || 'string';
            var isAsc = th.classList.contains('sort-asc');
            // Clear sort classes on sibling headers
            table.querySelectorAll('th.sortable').forEach(function(h) {
              h.classList.remove('sort-asc', 'sort-desc');
            });
            var dir = isAsc ? -1 : 1;
            th.classList.add(dir === 1 ? 'sort-asc' : 'sort-desc');
            var rows = Array.from(tbody.querySelectorAll('tr'));
            rows.sort(function(a, b) {
              var cellA = a.children[colIdx];
              var cellB = b.children[colIdx];
              if (type === 'num') {
                var nA = parseFloat(cellA.dataset.val || cellA.textContent.replace(/[^0-9.\-]/g, '')) || 0;
                var nB = parseFloat(cellB.dataset.val || cellB.textContent.replace(/[^0-9.\-]/g, '')) || 0;
                return (nA - nB) * dir;
              }
              var sA = cellA.textContent.trim().toLowerCase();
              var sB = cellB.textContent.trim().toLowerCase();
              return sA < sB ? -dir : sA > sB ? dir : 0;
            });
            rows.forEach(function(row) { tbody.appendChild(row); });
          });
        });
      })();
    </script>
  </body>
</html>`;

    const absPath = path.resolve(process.cwd(), outPath);
    const dir = path.dirname(absPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absPath, html, 'utf-8');
  }

  private static renderIterationSummaryRow(summary: IterationSummary): string {
    const matched = summary.items.filter((item) => item.comparisonType === 'matched').length;
    const missing = summary.items.filter((item) => item.comparisonType === 'missing_in_replay').length;
    const extra = summary.items.filter((item) => item.comparisonType === 'extra_in_replay').length;
    const totalDuration = summary.items.reduce((sum, item) => sum + (item.durationMs ?? 0), 0);
    return `<tr>
      <td>Iteration ${summary.iteration}</td>
      <td>${summary.items.length}</td>
      <td>${matched}</td>
      <td>${missing}</td>
      <td>${extra}</td>
      <td>${this.average(summary.items.map((item) => item.matchScore))}%</td>
      <td>${this.formatDuration(totalDuration)}</td>
    </tr>`;
  }

  private static renderIterationSection(summary: IterationSummary, active: boolean): string {
    const warnings = summary.warnings.map((warning) => `<div class="warning">${this.escapeHtml(warning)}</div>`).join('');
    const globalVariables = this.renderGlobalVariables(summary.items);
    const transactionSummary = this.renderTransactionSummaryTable(summary.items);
    const requestSummary = this.renderRequestSummaryTable(summary.items);
    const transactionSections = this.renderTransactions(summary.items);

    return `<section class="iteration-panel ${active ? 'active' : ''}" data-iteration="${summary.iteration}">
      <section class="section-card">
        <h2>Iteration ${summary.iteration}</h2>
        ${warnings}
        <div class="stats">
          <div class="iter-stat">
            <span class="label">Avg Match Score</span>
            <span class="value">${this.average(summary.items.map((item) => item.matchScore))}%</span>
          </div>
          <div class="iter-stat">
            <span class="label">Request Count</span>
            <span class="value">${summary.items.length}</span>
          </div>
          <div class="iter-stat">
            <span class="label">Total Request Time</span>
            <span class="value">${this.formatDuration(summary.items.reduce((sum, item) => sum + (item.durationMs ?? 0), 0))}</span>
          </div>
          <div class="iter-stat">
            <span class="label">Replay Only</span>
            <span class="value">${summary.items.filter((item) => item.comparisonType === 'extra_in_replay').length}</span>
          </div>
        </div>
      </section>

      <section class="section-card">
        <details open>
          <summary>Global Variables</summary>
          ${globalVariables}
        </details>
      </section>

      <section class="section-card">
        <div class="summary-grid single">
          <div>
            <h2>Transaction Timing Summary</h2>
            ${transactionSummary}
          </div>
          <div>
            <details>
              <summary>Request Timing Summary</summary>
              ${requestSummary}
            </details>
          </div>
        </div>
      </section>

      ${transactionSections}
    </section>`;
  }

  private static renderTransactions(results: DiffResult[]): string {
    const grouped = results.reduce<Record<string, DiffResult[]>>((acc, result) => {
      const key = result.transactionName || 'Ungrouped';
      acc[key] ??= [];
      acc[key].push(result);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([transaction, items]) => {
        const totalDuration = items.reduce((sum, item) => sum + (item.durationMs ?? 0), 0);
        const requestCards = items
          .sort((a, b) => (a.requestSequence ?? 99999) - (b.requestSequence ?? 99999))
          .map((item) => this.renderRequestCard(item))
          .join('\n');

        const txnId = `txn-${items[0]?.iteration ?? 0}-${this.sanitizeId(transaction)}`;

        return `<section class="transaction" id="${txnId}">
          <details>
            <summary class="transaction-header">
              <span class="transaction-title">
                <h2>${this.escapeHtml(transaction)}</h2>
                <span class="muted">${items.length} request(s), total replay time ${this.formatDuration(totalDuration)}</span>
              </span>
              <span class="transaction-toggle">Expand / Collapse</span>
            </summary>
            ${requestCards}
          </details>
        </section>`;
      })
      .join('\n');
  }

  private static renderRequestCard(result: DiffResult): string {
    const scoreClass = this.scoreClass(result.matchScore);
    const comparisonLabel =
      result.comparisonType === 'matched'
        ? 'Matched'
        : result.comparisonType === 'missing_in_replay'
          ? 'Missing In Replay'
          : 'Replay Only';
    const requestHeaderSummary = this.headerSummary(result.requestHeaderDiffs);
    const responseHeaderSummary = this.headerSummary(result.responseHeaderDiffs);
    const tags = result.tags
      ? `<div class="tag-list">${Object.entries(result.tags).map(([key, value]) => `<code>${this.escapeHtml(key)}=${this.escapeHtml(value)}</code>`).join('')}</div>`
      : '';
    const requestVariables = this.renderRequestVariables(result.variableEvents);

    const reqId = `req-${result.iteration}-${result.requestSequence ?? 0}`;

    return `<article class="request-card score-${this.scoreClass(result.matchScore)}" id="${reqId}">
      <div class="request-card-sticky">
        <div class="request-header">
          <div>
            <h3>${this.escapeHtml(result.harEntryId)}</h3>
            <div class="request-meta">
              Request #${result.requestSequence ?? '-'} | ${this.escapeHtml(result.replayed.method || result.recorded.method || '-')}
              ${this.renderUrl(result.replayed.url || result.recorded.url || '-')}
            </div>
          </div>
          <div class="score ${scoreClass}">${result.matchScore}%</div>
        </div>
        <div class="chips">
          <span class="chip">${comparisonLabel}</span>
          <span class="chip">VU ${result.vu ?? '-'}</span>
          <span class="chip">Duration ${this.formatDuration(result.durationMs)}</span>
          <span class="chip ${requestHeaderSummary.className}">Request headers ${requestHeaderSummary.label}</span>
          <span class="chip ${responseHeaderSummary.className}">Response headers ${responseHeaderSummary.label}</span>
          <span class="chip ${this.statusCodeClass(result.replayed.status ?? result.recorded.status)}">${result.replayed.status ?? result.recorded.status ?? '-'}</span>
        </div>
        ${tags}
      </div>
      <div class="grid">
        <section class="panel">
          <h4>Recorded</h4>
          ${this.renderSnapshot(result.recorded, result.comparisonType === 'extra_in_replay')}
        </section>
        <section class="panel">
          <h4>Replayed</h4>
          ${this.renderSnapshot(result.replayed, false)}
        </section>
      </div>
      ${this.renderBodyComparison('Request Body', result.requestBody.summary, result.recorded.requestBody, result.replayed.requestBody, result.comparisonType === 'extra_in_replay', this.isBodyMethod(result.recorded.method || result.replayed.method))}
      ${this.renderBodyComparison('Response Body', result.responseBody.summary, result.recorded.responseBody, result.replayed.responseBody, result.comparisonType === 'extra_in_replay', false, this.detectRedirect(result))}
      <section class="body-section">
        <details>
          <summary>Headers</summary>
          <section class="body-section" style="margin-top:12px">
            <details>
              <summary>Request Headers</summary>
              <div class="body-grid">
                <div>
                  <div class="muted">Recorded</div>
                  ${this.renderHeaderList(result.recorded.requestHeaders)}
                </div>
                <div>
                  <div class="muted">Replayed</div>
                  ${this.renderHeaderList(result.replayed.requestHeaders)}
                </div>
              </div>
            </details>
          </section>
          <section class="body-section" style="margin-top:12px">
            <details>
              <summary>Response Headers</summary>
              <div class="body-grid">
                <div>
                  <div class="muted">Recorded</div>
                  ${this.renderHeaderList(result.recorded.responseHeaders)}
                </div>
                <div>
                  <div class="muted">Replayed</div>
                  ${this.renderHeaderList(result.replayed.responseHeaders)}
                </div>
              </div>
            </details>
          </section>
        </details>
      </section>
      <section class="body-section">
        <details>
          <summary>Cookies</summary>
          <section class="body-section" style="margin-top:12px">
            <details>
              <summary>Request Cookies</summary>
              <div class="body-grid">
                <div>
                  <div class="muted">Recorded</div>
                  ${this.renderCookieList(result.recorded.requestCookies)}
                </div>
                <div>
                  <div class="muted">Replayed</div>
                  ${this.renderCookieList(result.replayed.requestCookies)}
                </div>
              </div>
            </details>
          </section>
          <section class="body-section" style="margin-top:12px">
            <details>
              <summary>Response Cookies</summary>
              <div class="body-grid">
                <div>
                  <div class="muted">Recorded</div>
                  ${this.renderCookieList(result.recorded.responseCookies)}
                </div>
                <div>
                  <div class="muted">Replayed</div>
                  ${this.renderCookieList(result.replayed.responseCookies)}
                </div>
              </div>
            </details>
          </section>
        </details>
      </section>
      <section class="body-section">
        <details>
          <summary>Variables</summary>
          ${requestVariables}
        </details>
      </section>
    </article>`;
  }

  private static renderTransactionSummaryTable(results: DiffResult[]): string {
    const iteration = results[0]?.iteration ?? 0;
    const transactionMap = results.reduce<Map<string, { count: number; duration: number; avgScore: number[] }>>((acc, result) => {
      const entry = acc.get(result.transactionName) ?? { count: 0, duration: 0, avgScore: [] };
      entry.count += 1;
      entry.duration += result.durationMs ?? 0;
      entry.avgScore.push(result.matchScore);
      acc.set(result.transactionName, entry);
      return acc;
    }, new Map());

    const rows = Array.from(transactionMap.entries()).map(([transaction, stats]) => {
      const txnId = `txn-${iteration}-${this.sanitizeId(transaction)}`;
      return `<tr class="clickable-row" onclick="window.scrollToElement('${txnId}')">
      <td class="clickable-cell">${this.escapeHtml(transaction)}</td>
      <td>${stats.count}</td>
      <td>${this.formatDuration(stats.duration)}</td>
      <td>${this.average(stats.avgScore)}%</td>
    </tr>`;
    }).join('\n');

    return `<table>
      <thead>
        <tr>
          <th>Transaction</th>
          <th>Requests</th>
          <th>Total Time</th>
          <th>Avg Match Score</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="4" class="empty">No transaction data.</td></tr>'}</tbody>
    </table>`;
  }

  private static renderRequestSummaryTable(results: DiffResult[]): string {
    const iteration = results[0]?.iteration ?? 0;
    const rows = results
      .sort((a, b) => (a.requestSequence ?? 99999) - (b.requestSequence ?? 99999))
      .map((result) => {
        const reqId = `req-${iteration}-${result.requestSequence ?? 0}`;
        const status = result.replayed.status ?? result.recorded.status;
        const url = result.replayed.url || result.recorded.url || '-';
        return `<tr class="clickable-row" onclick="window.scrollToElement('${reqId}')">
        <td class="clickable-cell">${result.requestSequence ?? '-'}</td>
        <td title="${this.escapeHtml(result.transactionName)}">${this.escapeHtml(result.transactionName)}</td>
        <td>${this.escapeHtml(result.replayed.method || result.recorded.method || '-')}</td>
        <td title="${this.escapeHtml(url)}">${this.renderUrl(url)}</td>
        <td class="${this.statusCodeClass(status)}">${status ?? '-'}</td>
        <td>${this.formatDuration(result.durationMs)}</td>
        <td title="${this.escapeHtml(result.comparisonType)}">${this.escapeHtml(result.comparisonType)}</td>
      </tr>`;
      })
      .join('\n');

    return `<table class="req-summary-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Transaction</th>
          <th>Method</th>
          <th>URL</th>
          <th>Status</th>
          <th>Duration</th>
          <th>State</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="7" class="empty">No request data.</td></tr>'}</tbody>
    </table>`;
  }

  private static renderGlobalVariables(results: DiffResult[]): string {
    const latestValues = new Map<string, VariableEvent & { requestSequence?: number; transactionName?: string }>();

    results.forEach((result) => {
      result.variableEvents.forEach((event) => {
        latestValues.set(event.name, {
          ...event,
          requestSequence: result.requestSequence,
          transactionName: result.transactionName,
        });
      });
    });

    if (latestValues.size === 0) {
      return '<p class="empty">No parameterization or correlation variables were captured for this iteration.</p>';
    }

    const rows = Array.from(latestValues.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((event) => `<tr>
        <td>${this.escapeHtml(event.name)}</td>
        <td>${this.escapeHtml(event.type)}</td>
        <td>${this.escapeHtml(event.value)}</td>
        <td>${this.escapeHtml(event.source || '-')}</td>
        <td>${this.escapeHtml(event.transactionName || '-')}</td>
        <td>${event.requestSequence ?? '-'}</td>
      </tr>`)
      .join('\n');

    return `<table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Value</th>
          <th>Source</th>
          <th>Last Request Transaction</th>
          <th>Last Request #</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  private static renderRequestVariables(variableEvents: VariableEvent[]): string {
    if (!variableEvents.length) {
      return '<p class="empty">No request variables were captured for this request.</p>';
    }

    const rows = variableEvents
      .map((event) => `<tr>
        <td>${this.escapeHtml(event.name)}</td>
        <td>${this.escapeHtml(event.type)}</td>
        <td>${this.escapeHtml(event.action)}</td>
        <td>${this.escapeHtml(event.value)}</td>
        <td>${this.escapeHtml(event.source || '-')}</td>
      </tr>`)
      .join('\n');

    return `<table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Action</th>
          <th>Value</th>
          <th>Source</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  private static renderSnapshot(snapshot: DiffResult['recorded'], noData: boolean): string {
    if (noData || (!snapshot.method && !snapshot.url && snapshot.status === undefined)) {
      return '<p class="empty">No data</p>';
    }

    return `<table>
      <tbody>
        <tr><th>Method</th><td>${this.escapeHtml(snapshot.method || '-')}</td></tr>
        <tr><th>URL</th><td>${this.renderUrl(snapshot.url || '-')}</td></tr>
        <tr><th>Status</th><td>${snapshot.status ?? '-'}</td></tr>
        <tr><th>Req Headers</th><td>${snapshot.requestHeaders.length}</td></tr>
        <tr><th>Resp Headers</th><td>${snapshot.responseHeaders.length}</td></tr>
        <tr><th>Req Cookies</th><td>${(snapshot.requestCookies ?? []).length}</td></tr>
        <tr><th>Resp Cookies</th><td>${(snapshot.responseCookies ?? []).length}</td></tr>
      </tbody>
    </table>`;
  }

  private static renderHeaderTable(diffs: HeaderDiffEntry[]): string {
    if (diffs.length === 0) {
      return '<p class="empty">No headers to compare.</p>';
    }

    const rows = diffs.map((diff) => `<tr>
      <td>${this.escapeHtml(diff.name)}</td>
      <td><span class="decoded">${this.escapeHtml(this.decodeText(diff.recordedValue || ''))}</span><span class="raw">${this.escapeHtml(diff.recordedValue || '')}</span></td>
      <td><span class="decoded">${this.escapeHtml(this.decodeText(diff.replayedValue || ''))}</span><span class="raw">${this.escapeHtml(diff.replayedValue || '')}</span></td>
      <td>${this.escapeHtml(diff.status)}</td>
    </tr>`).join('\n');

    return `<table>
      <thead>
        <tr>
          <th>Header</th>
          <th>Recorded</th>
          <th>Replayed</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  private static renderHeaderList(headers: { name: string; value: string }[]): string {
    if (!headers || headers.length === 0) {
      return '<p class="empty">No headers.</p>';
    }
    const rows = headers.map(h => `<tr>
      <td>${this.escapeHtml(h.name)}</td>
      <td><span class="decoded">${this.escapeHtml(this.decodeText(h.value))}</span><span class="raw">${this.escapeHtml(h.value)}</span></td>
    </tr>`).join('\n');
    return `<table>
      <thead><tr><th>Header</th><th>Value</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  private static renderCookieList(cookies?: { name: string; value: string }[]): string {
    const list = cookies ?? [];
    if (list.length === 0) {
      return '<p class="empty">No cookies.</p>';
    }
    const rows = list.map(c => `<tr>
      <td>${this.escapeHtml(c.name)}</td>
      <td>${this.escapeHtml(c.value)}</td>
    </tr>`).join('\n');
    return `<table>
      <thead><tr><th>Cookie</th><th>Value</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  private static renderCookieTable(
    replayedCookies?: { name: string; value: string }[],
    recordedCookies?: { name: string; value: string }[],
  ): string {
    const replayed = replayedCookies ?? [];
    const recorded = recordedCookies ?? [];
    if (replayed.length === 0 && recorded.length === 0) {
      return '<p class="empty">No cookies.</p>';
    }
    const replayedMap = new Map(replayed.map(c => [c.name, c.value]));
    const recordedMap = new Map(recorded.map(c => [c.name, c.value]));
    const allNames = new Set([...replayedMap.keys(), ...recordedMap.keys()]);
    const rows = Array.from(allNames).sort().map(name => {
      const rec = recordedMap.get(name) ?? '';
      const rep = replayedMap.get(name) ?? '';
      const status = !recordedMap.has(name) ? 'extra_in_replay'
        : !replayedMap.has(name) ? 'missing_in_replay'
        : rec === rep ? 'match' : 'mismatch';
      return `<tr>
        <td>${this.escapeHtml(name)}</td>
        <td>${this.escapeHtml(rec)}</td>
        <td>${this.escapeHtml(rep)}</td>
        <td>${this.escapeHtml(status)}</td>
      </tr>`;
    }).join('\n');
    return `<table>
      <thead>
        <tr>
          <th>Cookie</th>
          <th>Recorded</th>
          <th>Replayed</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  private static renderBodyComparison(
    title: string,
    summary: string,
    recordedBody?: string,
    replayedBody?: string,
    recordedMissing?: boolean,
    autoExpand?: boolean,
    redirectWarning?: string,
  ): string {
    const emptyLabel = /request body/i.test(title) ? 'No request body' : 'No response body';
    const openAttr = autoExpand ? ' open' : '';
    const warningHtml = redirectWarning
      ? `<div class="redirect-warning">${this.escapeHtml(redirectWarning)}</div>`
      : '';
    return `<section class="body-section">
      <details${openAttr}>
        <summary>${this.escapeHtml(title)}
          <span class="ss-sync-group">
            <label class="ss-sync-toggle"><input type="checkbox" class="scroll-sync-check" /><span class="ss-slider"></span></label>
            <label>Scroll sync</label>
          </span>
        </summary>
        ${warningHtml}
        <div class="muted">${this.escapeHtml(summary)}</div>
        <div class="body-grid">
          <div class="body-pane">
            <div class="muted pane-header"><span class="pane-label">Recorded</span><button class="section-search-btn" title="Search this panel" onclick="window.openSectionSearch(this)"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg></button></div>
            <div class="section-search-bar">
              <input type="text" placeholder="Search\u2026" autocomplete="off" />
              <span class="ss-badge zero">0</span>
              <button class="ss-prev" title="Previous" disabled>&#9650;</button>
              <span class="ss-pos"></span>
              <button class="ss-next" title="Next" disabled>&#9660;</button>
              <button class="ss-close" title="Close">&times;</button>
            </div>
            <pre class="body-formatted">${this.escapeHtml(this.formatBody(recordedMissing ? 'No data' : (recordedBody ?? emptyLabel)))}</pre>
            <pre class="body-raw">${this.escapeHtml(recordedMissing ? 'No data' : (recordedBody ?? emptyLabel))}</pre>
          </div>
          <div class="body-pane">
            <div class="muted pane-header"><span class="pane-label">Replayed</span><button class="section-search-btn" title="Search this panel" onclick="window.openSectionSearch(this)"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg></button></div>
            <div class="section-search-bar">
              <input type="text" placeholder="Search\u2026" autocomplete="off" />
              <span class="ss-badge zero">0</span>
              <button class="ss-prev" title="Previous" disabled>&#9650;</button>
              <span class="ss-pos"></span>
              <button class="ss-next" title="Next" disabled>&#9660;</button>
              <button class="ss-close" title="Close">&times;</button>
            </div>
            <pre class="body-formatted">${this.escapeHtml(this.formatBody(replayedBody ?? emptyLabel))}</pre>
            <pre class="body-raw">${this.escapeHtml(replayedBody ?? emptyLabel)}</pre>
          </div>
        </div>
      </details>
    </section>`;
  }

  private static renderUrl(url: string): string {
    const urlStr = typeof url === 'object' ? (url && typeof (url as any).toString === 'function' && (url as any).toString() !== '[object Object]' ? (url as any).toString() : JSON.stringify(url)) : String(url ?? '');
    if (!urlStr || urlStr === '-') return this.escapeHtml(urlStr);
    const escaped = this.escapeHtml(urlStr);
    const decoded = this.escapeHtml(this.decodeText(urlStr));
    return `<span class="decoded">${decoded}</span><span class="raw">${escaped}</span>`;
  }

  private static decodeText(value: string): string {
    const str = String(value ?? '');
    try { return decodeURIComponent(str); } catch { return str; }
  }

  private static formatBody(body: string): string {
    if (!body || body === 'No data' || body === 'No request body' || body === 'No response body') return body;
    // URL-encoded form data
    if (/^[\w%.+~-]+=/.test(body) && body.includes('&') && !body.includes('{')) {
      try {
        const params = new URLSearchParams(body);
        return Array.from(params.entries()).map(([k, v]) => `${decodeURIComponent(k)} = ${decodeURIComponent(v)}`).join('\n');
      } catch { /* fall through */ }
    }
    // JSON
    const trimmed = body.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try { return JSON.stringify(JSON.parse(trimmed), null, 2); } catch { /* fall through */ }
    }
    return body;
  }

  private static groupByIteration(results: DiffResult[]): Map<number, IterationSummary> {
    const grouped = new Map<number, IterationSummary>();

    results.forEach((result) => {
      const existing = grouped.get(result.iteration) ?? {
        iteration: result.iteration,
        warnings: [],
        items: [],
      };
      existing.items.push(result);
      result.warnings.forEach((warning) => {
        if (!existing.warnings.includes(warning)) {
          existing.warnings.push(warning);
        }
      });
      grouped.set(result.iteration, existing);
    });

    return grouped;
  }

  private static headerSummary(diffs: HeaderDiffEntry[]): { label: string; className: string } {
    const mismatches = diffs.filter((diff) => diff.status !== 'match').length;
    if (mismatches === 0) return { label: 'match', className: 'good' };
    if (mismatches <= 2) return { label: `${mismatches} diff`, className: 'warn' };
    return { label: `${mismatches} diff`, className: 'bad' };
  }

  private static formatDuration(durationMs?: number): string {
    if (durationMs === undefined || durationMs === null) return '-';
    return `${Math.round(durationMs)} ms`;
  }

  private static average(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  private static countWarnings(results: DiffResult[]): number {
    return new Set(results.flatMap((result) => result.warnings)).size;
  }

  private static scoreClass(score: number): string {
    if (score >= 90) return 'good';
    if (score >= 70) return 'warn';
    return 'bad';
  }

  private static statusCodeClass(status?: number): string {
    if (!status) return '';
    if (status >= 200 && status < 300) return 'status-2xx';
    if (status >= 300 && status < 400) return 'status-3xx';
    if (status >= 400 && status < 500) return 'status-4xx';
    if (status >= 500) return 'status-5xx';
    return '';
  }

  private static formatHeaders(headers: { name: string; value: string }[]): string {
    if (!headers.length) return '(none)';
    return headers.map((header) => `${header.name}: ${header.value}`).join('\n');
  }

  private static renderMetricsSection(m: K6Metrics): string {
    const topRow: string[] = [];
    const midRow: string[] = [];
    const bottomRow: string[] = [];

    // Row 1: Execution Summary (full width, overview KV tiles)
    const kvItems: string[] = [];
    if (m.httpSummary.reqs) kvItems.push(`<div class="metric-kv-item"><span class="mk-label">Total Requests</span><span class="mk-value">${this.escapeHtml(m.httpSummary.reqs)}</span></div>`);
    if (m.httpSummary.failedPct) kvItems.push(`<div class="metric-kv-item"><span class="mk-label">Failed %</span><span class="mk-value">${this.escapeHtml(m.httpSummary.failedPct)}</span></div>`);
    if (m.execution.iterations) kvItems.push(`<div class="metric-kv-item"><span class="mk-label">Iterations</span><span class="mk-value">${this.escapeHtml(m.execution.iterations)}</span></div>`);
    if (m.execution.vus) kvItems.push(`<div class="metric-kv-item"><span class="mk-label">VUs</span><span class="mk-value">${this.escapeHtml(m.execution.vus)}</span></div>`);
    if (m.network.received) kvItems.push(`<div class="metric-kv-item"><span class="mk-label">Data Received</span><span class="mk-value">${this.escapeHtml(m.network.received)}</span></div>`);
    if (m.network.sent) kvItems.push(`<div class="metric-kv-item"><span class="mk-label">Data Sent</span><span class="mk-value">${this.escapeHtml(m.network.sent)}</span></div>`);
    if (kvItems.length > 0) {
      topRow.push(`<div class="metrics-card full-width"><h3>Execution Summary</h3><div class="metric-kv">${kvItems.join('')}</div></div>`);
    }

    // Row 2 left: Checks (narrow)
    if (m.checks.length > 0) {
      const rows = m.checks.map(c =>
        `<tr><td>${this.escapeHtml(c.name)}</td><td class="${c.passed ? 'check-pass' : 'check-fail'}">${c.passed ? '✓ PASS' : '✗ FAIL'}</td></tr>`
      ).join('');
      midRow.push(`<div class="metrics-card"><h3>Checks</h3><table class="m-sortable"><thead><tr><th class="sortable" data-col="0" data-type="string">Check</th><th class="sortable" style="width:90px" data-col="1" data-type="string">Status</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    }

    // Row 2 right: HTTP Metrics
    if (m.http.length > 0) {
      const rows = m.http.map(h =>
        `<tr><td>${this.escapeHtml(h.name)}</td><td data-val="${this.parseMetricNum(h.avg)}">${h.avg}</td><td data-val="${this.parseMetricNum(h.min)}">${h.min}</td><td data-val="${this.parseMetricNum(h.med)}">${h.med}</td><td data-val="${this.parseMetricNum(h.max)}">${h.max}</td><td data-val="${this.parseMetricNum(h.p90)}">${h.p90}</td><td data-val="${this.parseMetricNum(h.p95)}">${h.p95}</td></tr>`
      ).join('');
      midRow.push(`<div class="metrics-card"><h3>HTTP Metrics</h3><table class="m-sortable"><thead><tr><th class="sortable" data-col="0" data-type="string">Metric</th><th class="sortable" data-col="1" data-type="num">Avg</th><th class="sortable" data-col="2" data-type="num">Min</th><th class="sortable" data-col="3" data-type="num">Med</th><th class="sortable" data-col="4" data-type="num">Max</th><th class="sortable" data-col="5" data-type="num">P90</th><th class="sortable" data-col="6" data-type="num">P95</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    }

    // Row 3: Transaction Timings (full width, many rows)
    if (m.transactions.length > 0) {
      const rows = m.transactions.map(t =>
        `<tr><td>${this.escapeHtml(t.name)}</td><td data-val="${this.parseMetricNum(t.avg)}">${t.avg}</td><td data-val="${this.parseMetricNum(t.min)}">${t.min}</td><td data-val="${this.parseMetricNum(t.med)}">${t.med}</td><td data-val="${this.parseMetricNum(t.max)}">${t.max}</td><td data-val="${this.parseMetricNum(t.p90)}">${t.p90}</td><td data-val="${this.parseMetricNum(t.p95)}">${t.p95}</td></tr>`
      ).join('');
      bottomRow.push(`<div class="metrics-card full-width"><h3>Transaction Timings</h3><table class="m-sortable"><thead><tr><th class="sortable" data-col="0" data-type="string">Transaction</th><th class="sortable" data-col="1" data-type="num">Avg</th><th class="sortable" data-col="2" data-type="num">Min</th><th class="sortable" data-col="3" data-type="num">Med</th><th class="sortable" data-col="4" data-type="num">Max</th><th class="sortable" data-col="5" data-type="num">P90</th><th class="sortable" data-col="6" data-type="num">P95</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    }

    const allCards = [...topRow, ...midRow, ...bottomRow];
    if (allCards.length === 0) return '';

    return `<section class="metrics-section section-card" style="padding:24px">
        <h2>Performance Metrics</h2>
        <div class="metrics-grid">${allCards.join('\n')}</div>
      </section>`;
  }

  private static escapeHtml(value: string): string {
    const str = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Extract pure numeric value from metric strings like "147.69ms", "12.05s", "545" for sorting */
  private static parseMetricNum(val: string): string {
    const n = parseFloat(String(val ?? '').replace(/[^0-9.\-]/g, ''));
    return isNaN(n) ? '0' : String(n);
  }

  private static sanitizeId(value: string): string {
    return String(value ?? '').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  }

  private static readonly REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
  private static readonly BODY_PREVIEW_MAX = 200;

  private static isBodyMethod(method?: string): boolean {
    if (!method) return false;
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  }

  private static bodyPreview(body?: string, method?: string): string | null {
    if (!body) return null;
    if (method && !this.isBodyMethod(method) && body.length > 500) return null;
    if (body.length <= this.BODY_PREVIEW_MAX) return body;
    return body.slice(0, this.BODY_PREVIEW_MAX) + '…';
  }

  private static detectRedirect(result: DiffResult): string | undefined {
    const recordedStatus = result.recorded.status;
    const replayedStatus = result.replayed.status;
    if (
      recordedStatus !== undefined &&
      this.REDIRECT_STATUSES.has(recordedStatus) &&
      replayedStatus !== undefined &&
      !this.REDIRECT_STATUSES.has(replayedStatus)
    ) {
      return `Recording returned ${recordedStatus} redirect. k6 follows redirects by default, so the replayed response (${replayedStatus}) is the final destination response. Body and status differences are expected.`;
    }
    return undefined;
  }
}
