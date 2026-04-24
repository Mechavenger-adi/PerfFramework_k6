"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunReportGenerator = void 0;
class RunReportGenerator {
    static generate(bundle) {
        const serialized = JSON.stringify(bundle).replace(/</g, '\\u003c');
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Run Report - ${this.escapeHtml(bundle.meta.plan)}</title>
  <style>
    :root {
      --bg: #f3f0e8;
      --panel: #fffdf8;
      --ink: #1d2731;
      --muted: #66717d;
      --accent: #005f73;
      --accent-soft: #dff3f4;
      --border: #d5ddd9;
      --warn: #c2410c;
      --error: #b91c1c;
      --ok: #15803d;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Tahoma, sans-serif;
      background: linear-gradient(180deg, #f3f0e8 0%, #eef5f2 100%);
      color: var(--ink);
    }
    .shell { max-width: 1400px; margin: 0 auto; padding: 24px; }
    .hero {
      background: radial-gradient(circle at top left, #e2f3eb, #fffdf8 45%, #eef5f2 100%);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.06);
    }
    .hero h1 { margin: 0 0 8px; font-size: 32px; }
    .meta { color: var(--muted); display: flex; gap: 16px; flex-wrap: wrap; }
    .status {
      display: inline-block; padding: 6px 12px; border-radius: 999px; font-weight: 700;
      background: var(--accent-soft); color: var(--accent); margin-bottom: 12px;
    }
    .status.failed { background: #fde2e2; color: var(--error); }
    .status.passed { background: #def7e5; color: var(--ok); }
    .tabs { display: flex; gap: 8px; flex-wrap: wrap; margin: 20px 0 16px; }
    .tab-btn {
      border: 1px solid var(--border); background: var(--panel); color: var(--ink);
      padding: 10px 14px; border-radius: 999px; cursor: pointer; font-weight: 600;
    }
    .tab-btn.active { background: var(--accent); color: white; border-color: var(--accent); }
    .tab-panel {
      display: none; background: rgba(255,255,255,0.82); backdrop-filter: blur(6px);
      border: 1px solid var(--border); border-radius: 18px; padding: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.05);
    }
    .tab-panel.active { display: block; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 20px; }
    .card { background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 14px; }
    .card h3 { margin: 0 0 6px; font-size: 13px; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; }
    .card strong { font-size: 24px; }
    .toolbar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 14px; }
    input, select {
      border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; background: white;
    }
    table { width: 100%; border-collapse: separate; border-spacing: 0; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--border); }
    th { background: #edf4f3; font-size: 13px; text-transform: uppercase; letter-spacing: .04em; }
    tr:hover td { background: #f7fbfb; }
    .split { display: grid; grid-template-columns: 1.5fr 1fr; gap: 18px; }
    .placeholder {
      min-height: 260px; border: 1px dashed var(--border); border-radius: 16px; padding: 18px;
      background: linear-gradient(180deg, rgba(255,255,255,.75), rgba(240,246,244,.9));
      color: var(--muted);
    }
    .empty { color: var(--muted); padding: 18px 0; }
    .graph-shell { display: grid; gap: 16px; }
    .chart-box {
      background: var(--panel); border: 1px solid var(--border); border-radius: 16px; padding: 16px;
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
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
</head>
<body>
  <div class="shell">
    <section class="hero">
      <div class="status ${this.escapeHtml(bundle.meta.status)}">${this.escapeHtml(bundle.meta.status.toUpperCase())}</div>
      <h1>${this.escapeHtml(bundle.meta.plan)}</h1>
      <div class="meta">
        <span>Run ID: ${this.escapeHtml(bundle.meta.runId)}</span>
        <span>Environment: ${this.escapeHtml(bundle.meta.environment)}</span>
        <span>Started: ${this.escapeHtml(bundle.meta.startTime)}</span>
        <span>Ended: ${this.escapeHtml(bundle.meta.endTime)}</span>
      </div>
    </section>
    <div class="tabs" id="tabs"></div>
    <section id="panel-summary" class="tab-panel active"></section>
    <section id="panel-graphs" class="tab-panel"></section>
    <section id="panel-transactions" class="tab-panel"></section>
    <section id="panel-errors" class="tab-panel"></section>
    <section id="panel-warnings" class="tab-panel"></section>
    <section id="panel-snapshots" class="tab-panel"></section>
    <section id="panel-system" class="tab-panel"></section>
  </div>
  <script>
    const reportData = ${serialized};
    const tabs = [
      ['summary', 'Summary'],
      ['graphs', 'Graphs'],
      ['transactions', 'Transactions'],
      ['errors', 'Errors'],
      ['warnings', 'Warnings'],
      ['snapshots', 'Snapshots'],
      ['system', 'System']
    ];

    function escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function buildTabs() {
      const root = document.getElementById('tabs');
      tabs.forEach(([id, label], index) => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn' + (index === 0 ? ' active' : '');
        btn.textContent = label;
        btn.onclick = () => activateTab(id, btn);
        root.appendChild(btn);
      });
    }

    function activateTab(id, button) {
      document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));
      document.getElementById('panel-' + id).classList.add('active');
      button.classList.add('active');
    }

    function renderSummary() {
      const summary = reportData.summary;
      const ci = summary.ciSummary;
      const transactions = reportData.transactions.transactions;
      const slowest = [...transactions].sort((a, b) => (b.avg || 0) - (a.avg || 0)).slice(0, 5);
      const failing = [...transactions].sort((a, b) => (b.fail || 0) - (a.fail || 0)).slice(0, 5);

      document.getElementById('panel-summary').innerHTML = \`
        <div class="cards">
          <div class="card"><h3>Transactions</h3><strong>\${transactions.length}</strong></div>
          <div class="card"><h3>Threshold Failures</h3><strong>\${ci.thresholdFailures}</strong></div>
          <div class="card"><h3>Errors</h3><strong>\${ci.errorCount}</strong></div>
          <div class="card"><h3>Warnings</h3><strong>\${ci.warningCount}</strong></div>
        </div>
        <div class="split">
          <div class="card">
            <h3>Top Slowest Transactions</h3>
            \${renderMiniTable(slowest, ['transaction', 'avg', 'max'])}
          </div>
          <div class="card">
            <h3>Top Failing Transactions</h3>
            \${renderMiniTable(failing, ['transaction', 'fail', 'errorPct'])}
          </div>
        </div>
      \`;
    }

    function renderGraphs() {
      const stats = reportData.config.transactionStats;
      const transactions = reportData.transactions.transactions;
      const topFive = [...transactions].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, reportData.config.defaultTopTransactions || 5);
      const range = getSelectedRange();
      const overviewPoints = filterSeriesByRange(reportData.timeseries.series.overview, range);
      const selectedOverview = overviewPoints[overviewPoints.length - 1] || null;

      document.getElementById('panel-graphs').innerHTML = \`
        <div class="toolbar">
          <label><strong>Time Range</strong></label>
          <input id="global-from" type="datetime-local" />
          <input id="global-to" type="datetime-local" />
          <button id="apply-time-filter" class="tab-btn">Apply</button>
          <label><strong>Transaction View</strong></label>
          <select id="txn-view-mode">
            <option value="top">Top 5</option>
            <option value="all">All</option>
          </select>
          <input id="txn-filter" type="search" placeholder="Filter transactions" />
        </div>
        <div class="split">
          <div class="graph-shell">
            <div class="chart-box">
              <h3>Load Overview</h3>
              \${selectedOverview ? renderOverviewCards(selectedOverview) : '<div class="empty">No overview points in the selected time range.</div>'}
            </div>
            <div class="chart-box">
              <h3>Transaction Response Time (ms)</h3>
              <div class="chart-canvas-wrap"><canvas id="txn-bar-chart"></canvas></div>
            </div>
            <div class="chart-box">
              <h3>Pass / Fail Distribution</h3>
              <div class="donut-wrap"><canvas id="txn-donut-chart"></canvas></div>
            </div>
          </div>
          <div class="card">
            <h3>Attached Summary Table</h3>
            <div id="graph-table-host"></div>
          </div>
        </div>
      \`;

      const host = document.getElementById('graph-table-host');
      const select = document.getElementById('txn-view-mode');
      const filter = document.getElementById('txn-filter');
      const fromInput = document.getElementById('global-from');
      const toInput = document.getElementById('global-to');
      const applyButton = document.getElementById('apply-time-filter');

      hydrateTimeInputs(fromInput, toInput);

      let barChartInstance = null;
      let donutChartInstance = null;

      function renderAttachedTable() {
        const source = select.value === 'all' ? transactions : topFive;
        const filtered = source.filter((row) => row.transaction.toLowerCase().includes(filter.value.toLowerCase()));
        const columns = ['transaction', ...stats];
        host.innerHTML = filtered.length ? renderTable(filtered, columns) : '<div class="empty">No transactions match the current filter.</div>';
        renderBarChart(filtered);
        renderDonutChart(transactions);
      }

      function renderBarChart(rows) {
        if (barChartInstance) barChartInstance.destroy();
        const canvas = document.getElementById('txn-bar-chart');
        if (!canvas || !rows.length) return;
        const labels = rows.map(r => r.transaction.length > 30 ? r.transaction.slice(0, 27) + '...' : r.transaction);
        const avgData = rows.map(r => Number(r.avg || 0));
        const p90Data = rows.map(r => Number(r['p(90)'] || 0));
        const maxData = rows.map(r => Number(r.max || 0));
        barChartInstance = new Chart(canvas, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              { label: 'Avg', data: avgData, backgroundColor: 'rgba(0,95,115,0.85)', borderRadius: 4, barPercentage: 0.7, categoryPercentage: 0.8 },
              { label: 'p90', data: p90Data, backgroundColor: 'rgba(10,147,150,0.7)', borderRadius: 4, barPercentage: 0.7, categoryPercentage: 0.8 },
              { label: 'Max', data: maxData, backgroundColor: 'rgba(194,65,12,0.5)', borderRadius: 4, barPercentage: 0.7, categoryPercentage: 0.8 }
            ]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top', labels: { usePointStyle: true, padding: 16 } },
              tooltip: {
                backgroundColor: 'rgba(29,39,49,0.92)',
                titleFont: { size: 13 },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                  afterBody: function(items) {
                    const idx = items[0].dataIndex;
                    const row = rows[idx];
                    return 'Count: ' + (row.count || 0) + '  |  Fail: ' + (row.fail || 0) + '  |  Err%: ' + (row.errorPct || 0) + '%';
                  }
                }
              }
            },
            scales: {
              x: { title: { display: true, text: 'Duration (ms)', color: '#66717d' }, grid: { color: 'rgba(0,0,0,0.04)' } },
              y: { grid: { display: false }, ticks: { font: { size: 11 } } }
            }
          }
        });
        canvas.parentElement.style.minHeight = Math.max(280, rows.length * 50) + 'px';
      }

      function renderDonutChart(rows) {
        if (donutChartInstance) donutChartInstance.destroy();
        const canvas = document.getElementById('txn-donut-chart');
        if (!canvas || !rows.length) return;
        const totalPass = rows.reduce((s, r) => s + (r.pass || 0), 0);
        const totalFail = rows.reduce((s, r) => s + (r.fail || 0), 0);
        donutChartInstance = new Chart(canvas, {
          type: 'doughnut',
          data: {
            labels: ['Pass', 'Fail'],
            datasets: [{
              data: [totalPass, totalFail],
              backgroundColor: ['#15803d', '#b91c1c'],
              hoverBackgroundColor: ['#16a34a', '#dc2626'],
              borderWidth: 2,
              borderColor: '#fffdf8'
            }]
          },
          options: {
            responsive: true,
            cutout: '60%',
            plugins: {
              legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } },
              tooltip: {
                backgroundColor: 'rgba(29,39,49,0.92)',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                  label: function(ctx) {
                    const total = totalPass + totalFail;
                    const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : '0';
                    return ctx.label + ': ' + ctx.parsed.toLocaleString() + ' (' + pct + '%)';
                  }
                }
              }
            }
          }
        });
      }

      select.onchange = renderAttachedTable;
      filter.oninput = renderAttachedTable;
      applyButton.onclick = () => {
        updateGlobalTimeRange(fromInput.value, toInput.value);
        renderGraphs();
      };
      renderAttachedTable();
    }

    function renderTransactions() {
      const rows = reportData.transactions.transactions;
      document.getElementById('panel-transactions').innerHTML = rows.length
        ? renderTable(rows, ['transaction', 'count', 'pass', 'fail', 'errorPct', ...reportData.config.transactionStats.filter((stat) => !['count', 'pass', 'fail'].includes(stat))])
        : '<div class="empty">No transaction metrics were captured for this run.</div>';
    }

    function renderErrors() {
      const rows = reportData.errors || [];
      document.getElementById('panel-errors').innerHTML = rows.length
        ? renderTable(rows, ['ts', 'type', 'transaction', 'vu', 'iteration', 'message'])
        : '<div class="empty">No structured error events were captured for this run yet.</div>';
    }

    function renderWarnings() {
      const rows = reportData.warnings || [];
      document.getElementById('panel-warnings').innerHTML = rows.length
        ? renderTable(rows, ['ts', 'type', 'message'])
        : '<div class="empty">No structured warning events were captured for this run yet.</div>';
    }

    function renderSnapshots() {
      const rows = reportData.snapshots || [];
      document.getElementById('panel-snapshots').innerHTML = rows.length
        ? renderTable(rows, ['ts', 'type', 'transaction', 'vu', 'iteration'])
        : '<div class="empty">No failure snapshots were captured for this run.</div>';
    }

    function renderSystem() {
      const agents = reportData.system?.agents || [];
      const snapshots = reportData.system?.snapshots || [];
      const agentsTable = agents.length ? renderTable(agents, ['host', 'pid', 'jobId', 'containerId']) : '<div class="empty">No agent identity metadata recorded.</div>';
      const snapshotsTable = snapshots.length ? renderTable(snapshots, ['ts', 'cpuPercent', 'memoryPercent']) : '<div class="empty">No host monitoring snapshots captured for this run.</div>';
      document.getElementById('panel-system').innerHTML = \`
        <div class="split">
          <div class="card">
            <h3>Agents</h3>
            \${agentsTable}
          </div>
          <div class="card">
            <h3>Host Snapshots</h3>
            \${snapshotsTable}
          </div>
        </div>
      \`;
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
      return '<table><thead><tr>' + header + '</tr></thead><tbody>' + body + '</tbody></table>';
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

    function getSelectedRange() {
      return window.__k6PerfRange || { from: reportData.meta.startTime, to: reportData.meta.endTime };
    }

    function updateGlobalTimeRange(from, to) {
      window.__k6PerfRange = {
        from: from ? new Date(from).toISOString() : reportData.meta.startTime,
        to: to ? new Date(to).toISOString() : reportData.meta.endTime
      };
    }

    function hydrateTimeInputs(fromInput, toInput) {
      const range = getSelectedRange();
      fromInput.value = toLocalInputValue(range.from);
      toInput.value = toLocalInputValue(range.to);
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

    buildTabs();
    renderSummary();
    renderGraphs();
    renderTransactions();
    renderErrors();
    renderWarnings();
    renderSnapshots();
    renderSystem();
  </script>
</body>
</html>`;
    }
    static escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
exports.RunReportGenerator = RunReportGenerator;
//# sourceMappingURL=RunReportGenerator.js.map