/**
 * merge-validation.test.ts
 * Deterministic merge-correctness check (design §6.3 / review #19).
 *
 * Splits a dataset across N synthetic "machines", builds per-machine artifacts,
 * runs MergeEngine, and asserts the merged result matches the single-machine
 * baseline within tolerance:
 *   - counts / pass / fail: EXACT (additive)
 *   - count-weighted avg:   EXACT
 *   - percentiles:          within the histogram relative-accuracy bound
 *
 * Run: npm run test:merge
 */

import { percentileR7, RelativeHistogram } from '../core_engine/src/reporting/Histogram';
import { HistogramArtifact } from '../core_engine/src/reporting/HistogramArtifactBuilder';
import { MergeEngine, MachineArtifacts } from '../core_engine/src/distributed/MergeEngine';
import { TransactionMetricsFile, CiSummary } from '../core_engine/src/types/ReportingContracts';

const ALPHA = 0.001;
const STATS = ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'];
let failures = 0;
function assert(ok: boolean, msg: string): void {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`);
}
function within(got: number, want: number, relTol: number): boolean {
  if (want === 0) return Math.abs(got) <= relTol;
  return Math.abs(got - want) / Math.abs(want) <= relTol;
}

// ── Synthesize a dataset: 2 transactions, skewed latency, with some failures ──
type TxnData = { values: number[]; pass: number; fail: number };
function genTxn(seed: number, n: number, failEvery: number): TxnData {
  const values: number[] = [];
  let pass = 0, fail = 0;
  for (let i = 0; i < n; i++) {
    const base = 50 + seed * 10 + Math.abs(Math.sin(i + seed) * 60) + (i % 911) * 0.07;
    const spike = i % 37 === 0 ? 600 + (i % 1500) : 0;
    values.push(base + spike);
    if (failEvery > 0 && i % failEvery === 0) fail++; else pass++;
  }
  return { values, pass, fail };
}

const txnNames = ['login', 'checkout'];
const NMACHINES = 3;
const PER = 20000;

// Full (baseline) data per transaction = union of all machine slices.
const fullByTxn: Record<string, TxnData> = {};
const machineData: Array<Record<string, TxnData>> = [];
for (let m = 0; m < NMACHINES; m++) {
  const md: Record<string, TxnData> = {};
  txnNames.forEach((name, ti) => {
    const d = genTxn(m + ti, PER, ti === 1 ? 50 : 0); // checkout has ~2% failures
    md[name] = d;
    const full = (fullByTxn[name] ??= { values: [], pass: 0, fail: 0 });
    full.values.push(...d.values); full.pass += d.pass; full.fail += d.fail;
  });
  machineData.push(md);
}

// ── Build per-machine artifacts ──
function buildHistogram(md: Record<string, TxnData>): HistogramArtifact {
  const overview = new RelativeHistogram(ALPHA);
  const transactions: HistogramArtifact['transactions'] = {};
  for (const [name, d] of Object.entries(md)) {
    const h = new RelativeHistogram(ALPHA);
    for (const v of d.values) { h.record(v); overview.record(v); }
    transactions[name] = { '0': h.toJSON() };
  }
  return {
    schemaVersion: 1, metric: 'duration-histograms', bucketSeconds: 10, relativeAccuracy: ALPHA,
    startTime: '2026-01-01T00:00:00.000Z', endTime: '2026-01-01T00:10:00.000Z',
    overview: { '0': overview.toJSON() }, transactions,
  };
}
function buildTxnMetrics(md: Record<string, TxnData>): TransactionMetricsFile {
  return {
    runId: 'split_run', stats: STATS,
    transactions: Object.entries(md).map(([name, d]) => {
      const count = d.values.length;
      const avg = d.values.reduce((s, v) => s + v, 0) / count;
      return {
        journey: 'j', transaction: name, count, pass: d.pass, fail: d.fail,
        errorPct: (d.fail / count) * 100,
        avg, min: Math.min(...d.values), max: Math.max(...d.values),
      };
    }),
  };
}
const ciTemplate: CiSummary = {
  status: 'passed', runId: 'split_run', plan: 'p', environment: 'dev',
  thresholdFailures: 0, transactionErrorBudget: 5, errorCount: 0, warningCount: 0,
  aborted: false, transactions: [], gate: { failedRules: [] },
};

const machines: MachineArtifacts[] = machineData.map((md, i) => ({
  machineName: `lg-${i}`,
  histogram: buildHistogram(md),
  transactionMetrics: buildTxnMetrics(md),
  ciSummary: { ...ciTemplate },
}));

// ── Merge ──
const result = MergeEngine.merge(machines, { stats: STATS });

// ── Assert against single-machine baseline ──
console.log(`merged ${result.machines.length} machines, ${result.transactionMetrics.transactions.length} transactions\n`);
for (const name of txnNames) {
  const row = result.transactionMetrics.transactions.find((r) => r.transaction === name)!;
  const full = fullByTxn[name];
  const total = full.values.length;
  const exactAvg = full.values.reduce((s, v) => s + v, 0) / total;

  assert(row.count === total, `${name} count exact (${row.count} == ${total})`);
  assert((row.pass ?? 0) === full.pass, `${name} pass exact (${row.pass} == ${full.pass})`);
  assert((row.fail ?? 0) === full.fail, `${name} fail exact (${row.fail} == ${full.fail})`);
  assert(within(row.avg as number, exactAvg, 1e-9), `${name} avg weighted exact (${(row.avg as number).toFixed(3)} ~ ${exactAvg.toFixed(3)})`);
  for (const p of [0.5, 0.9, 0.95, 0.99]) {
    const exact = percentileR7(full.values, p);
    const got = row[`p(${p * 100})`] ?? (p === 0.5 ? row['med'] : undefined);
    const val = typeof got === 'number' ? got : NaN;
    const ok = within(val, exact, ALPHA * 1.5);
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} p${p * 100}: merged=${val.toFixed(2)} exact=${exact.toFixed(2)} relErr=${(Math.abs(val - exact) / exact * 100).toFixed(4)}%`);
  }
}

// CI summary: checkout ~2% fail < 5% budget → passed; failure rate recomputed.
const totalFail = txnNames.reduce((s, n) => s + fullByTxn[n].fail, 0);
const totalTxn = txnNames.reduce((s, n) => s + fullByTxn[n].values.length, 0);
const expectedRate = (totalFail / totalTxn) * 100;
assert(within(result.ciSummary.transactionFailureRate as number, expectedRate, 1e-9), `ci failure rate exact (${(result.ciSummary.transactionFailureRate as number).toFixed(4)}% ~ ${expectedRate.toFixed(4)}%)`);
assert(result.ciSummary.status === 'passed', `ci status passed (rate ${expectedRate.toFixed(2)}% <= 5% budget)`);

console.log(failures === 0 ? '\n✅ ALL MERGE CHECKS PASSED' : `\n❌ ${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
