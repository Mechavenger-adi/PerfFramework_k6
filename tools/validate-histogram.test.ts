/**
 * validate-histogram.test.ts
 * Validate the histogram substrate against REAL recorded k6 numbers.
 *
 * For a given results run dir, it rebuilds per-transaction histograms from that
 * run's metrics-stream.json and compares the histogram-derived percentiles/avg/
 * min/max to the same run's transaction-metrics.json (which carries k6's own exact
 * values). This proves the histogram tracks k6 on real data — not just synthetic.
 *
 * Usage:
 *   npm run validate:histogram -- <path-to-results-run-dir>
 *   (defaults to the most recent run under results/ if no path is given)
 */

import * as fs from 'fs';
import * as path from 'path';
import { RelativeHistogram } from '../core_engine/src/reporting/Histogram';
import { HistogramArtifactBuilder } from '../core_engine/src/reporting/HistogramArtifactBuilder';
import { TransactionMetricsFile } from '../core_engine/src/types/ReportingContracts';

function mostRecentRunDir(): string | null {
  const base = 'results';
  if (!fs.existsSync(base)) return null;
  const candidates: { dir: string; mtime: number }[] = [];
  for (const plan of fs.readdirSync(base)) {
    const planDir = path.join(base, plan);
    if (!fs.statSync(planDir).isDirectory()) continue;
    for (const run of fs.readdirSync(planDir)) {
      const runDir = path.join(planDir, run);
      // run-summary.json is the current consolidated artifact; transaction-metrics.json
      // is the legacy pair member, still accepted for older run folders.
      const hasTxns = fs.existsSync(path.join(runDir, 'run-summary.json'))
        || fs.existsSync(path.join(runDir, 'transaction-metrics.json'));
      if (fs.existsSync(path.join(runDir, 'metrics-stream.json')) && hasTxns) {
        candidates.push({ dir: runDir, mtime: fs.statSync(runDir).mtimeMs });
      }
    }
  }
  candidates.sort((a, b) => b.mtime - a.mtime);
  return candidates[0]?.dir ?? null;
}

function statFraction(stat: string): number | null {
  const s = stat.trim().toLowerCase();
  if (s === 'med') return 0.5;
  const m = s.match(/^p\(?([\d.]+)\)?$/);
  return m ? parseFloat(m[1]) / 100 : null;
}

(async () => {
  const runDir = process.argv[2] || mostRecentRunDir();
  if (!runDir || !fs.existsSync(runDir)) {
    console.error('No run dir found. Pass one: npm run validate:histogram -- <run-dir>');
    process.exit(2);
  }
  console.log(`Validating histogram vs k6 recorded numbers for:\n  ${runDir}\n`);

  // Prefer the consolidated run-summary.json; fall back to the legacy file.
  const runSummaryPath = path.join(runDir, 'run-summary.json');
  const txnSource = fs.existsSync(runSummaryPath) ? runSummaryPath : path.join(runDir, 'transaction-metrics.json');
  const tm = JSON.parse(fs.readFileSync(txnSource, 'utf-8')) as TransactionMetricsFile;
  const txnNames = tm.transactions.map((t) => t.transaction);
  const art = await HistogramArtifactBuilder.build(path.join(runDir, 'metrics-stream.json'), {
    bucketSeconds: 10, relativeAccuracy: 0.001, transactionNames: txnNames,
  });
  if (!art) { console.error('Could not build histogram (missing/empty metrics-stream.json)'); process.exit(2); }

  const pctStats = tm.stats.filter((s) => statFraction(s) !== null);
  let rows = 0, fails = 0, maxErr = 0;
  const hdr = ['transaction', 'n', 'metric', 'k6', 'histogram', 'relErr%'];
  console.log(hdr.map((h, i) => h.padEnd([26, 5, 8, 10, 10, 8][i])).join(''));
  console.log('-'.repeat(72));

  for (const row of tm.transactions) {
    const buckets = art.transactions[row.transaction];
    if (!buckets) { console.log(`${row.transaction.padEnd(26)}(no histogram series — skipped)`); continue; }
    const whole = new RelativeHistogram(art.relativeAccuracy);
    for (const ts of Object.keys(buckets)) whole.merge(RelativeHistogram.fromJSON(buckets[ts]));

    const compare = (metric: string, k6val: number | undefined, histVal: number, tol: number) => {
      if (typeof k6val !== 'number') return;
      rows++;
      const relErr = k6val !== 0 ? Math.abs(histVal - k6val) / Math.abs(k6val) : (histVal === 0 ? 0 : 1);
      maxErr = Math.max(maxErr, relErr);
      const ok = relErr <= tol;
      if (!ok) fails++;
      console.log(
        `${(ok ? '' : '✗ ') + row.transaction}`.padEnd(26) +
        String(row.count).padEnd(5) + metric.padEnd(8) +
        k6val.toFixed(2).padEnd(10) + histVal.toFixed(2).padEnd(10) +
        (relErr * 100).toFixed(4),
      );
    };
    // avg/min/max — exact-ish (min/max exact; avg may differ slightly as histogram
    // mean uses recorded sum, which is exact, so avg should match closely).
    compare('avg', row.avg, whole.mean, 0.005);
    compare('min', row.min, whole.min, 0.002);
    compare('max', row.max, whole.max, 0.002);
    for (const stat of pctStats) {
      const frac = statFraction(stat)!;
      compare(stat, row[stat] as number, whole.valueAtPercentile(frac), 0.005);
    }
  }

  console.log('-'.repeat(72));
  console.log(`\n${rows} comparisons, ${fails} outside tolerance, max relErr ${(maxErr * 100).toFixed(4)}%`);
  console.log(fails === 0 ? '✅ HISTOGRAM MATCHES k6 RECORDED NUMBERS' : `❌ ${fails} comparison(s) exceeded tolerance`);
  process.exit(fails === 0 ? 0 : 1);
})();
