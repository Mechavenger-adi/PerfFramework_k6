/**
 * MergeEngine.ts
 * The reusable aggregation substrate for distributed runs (see
 * .md/Distributed-Load-Test-Design-Approach.md §1.5.1). Combines per-machine
 * artifacts — by **logical transaction name**, not by machine — into single merged
 * artifacts the existing report consumes.
 *
 * Correctness rules:
 *   - Additive quantities (count, pass, fail, data, iterations) are **summed** → exact.
 *   - avg is **count-weighted**; min/max are min/max → exact.
 *   - Trend **percentiles cannot be averaged**: they are derived from the **merged
 *     histogram** (sum bin counts across machines and time buckets, then read the
 *     percentile) — exact-to-relativeAccuracy. In `exact` mode the caller may instead
 *     pool raw and apply percentileR7 (not done here; histogram path is the default).
 *   - The merge is associative/commutative and order-independent (bins/counters add),
 *     so tree/incremental reduction needs no redesign.
 *
 * This module computes the merged transaction metrics, CI summary, and merged
 * histogram. Timeseries assembly and report generation are layered on top.
 */

import { CiSummary, CiTransactionSummary, TransactionMetricRow, TransactionMetricsFile } from '../types/ReportingContracts';
import { HistogramArtifact } from '../reporting/HistogramArtifactBuilder';
import { HistogramJSON, RelativeHistogram } from '../reporting/Histogram';

export interface MachineArtifacts {
  machineName: string;
  transactionMetrics?: TransactionMetricsFile;
  histogram?: HistogramArtifact;
  ciSummary?: CiSummary;
}

export interface MergeOptions {
  /** Output runId for the merged result (defaults to the inputs' shared runId). */
  runId?: string;
  /** Stat columns to compute (defaults to the inputs' stats). */
  stats?: string[];
}

export interface MergeResult {
  runId: string;
  machines: string[];
  transactionMetrics: TransactionMetricsFile;
  ciSummary: CiSummary;
  /** Merged per-(transaction|overview, bucket) histograms (sum of all machines). */
  histogram: HistogramArtifact | null;
  warnings: string[];
}

interface TxnAccumulator {
  journey: string;
  count: number;
  pass: number;
  fail: number;
  sumForAvg: number; // Σ(avg_i * count_i) for the count-weighted mean
  avgWeight: number; // Σ count_i over rows that had an avg
  min: number;
  max: number;
}

/** Parse a stat label into a percentile fraction in [0,1], or null if not a percentile. */
function statToFraction(stat: string): number | null {
  const s = stat.trim().toLowerCase();
  if (s === 'med') return 0.5;
  const m = s.match(/^p\(?([\d.]+)\)?$/);
  if (m) {
    const n = parseFloat(m[1]);
    if (Number.isFinite(n) && n >= 0 && n <= 100) return n / 100;
  }
  return null;
}

export class MergeEngine {
  static merge(machines: MachineArtifacts[], options: MergeOptions = {}): MergeResult {
    const warnings: string[] = [];
    const present = machines.filter((m) => m.transactionMetrics || m.histogram || m.ciSummary);
    if (present.length === 0) throw new Error('[MergeEngine] no machine artifacts to merge');

    const runId =
      options.runId ??
      present.find((m) => m.transactionMetrics?.runId)?.transactionMetrics?.runId ??
      present.find((m) => m.ciSummary?.runId)?.ciSummary?.runId ??
      'merged';

    const stats =
      options.stats ??
      present.find((m) => m.transactionMetrics?.stats?.length)?.transactionMetrics?.stats ??
      ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'];

    // ── 1. Merge histograms (per transaction + overview), summing bin counts ──
    const merged = this.mergeHistograms(present.map((m) => m.histogram).filter((h): h is HistogramArtifact => !!h), warnings);

    // ── 2. Accumulate additive transaction metrics by logical name ──
    const acc = new Map<string, TxnAccumulator>();
    for (const m of present) {
      for (const row of m.transactionMetrics?.transactions ?? []) {
        const a = acc.get(row.transaction) ?? {
          journey: row.journey ?? '',
          count: 0, pass: 0, fail: 0, sumForAvg: 0, avgWeight: 0,
          min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY,
        };
        a.journey = a.journey || row.journey || '';
        a.count += row.count ?? 0;
        a.pass += row.pass ?? 0;
        a.fail += row.fail ?? 0;
        if (typeof row.avg === 'number' && (row.count ?? 0) > 0) {
          a.sumForAvg += row.avg * (row.count as number);
          a.avgWeight += row.count as number;
        }
        if (typeof row.min === 'number') a.min = Math.min(a.min, row.min);
        if (typeof row.max === 'number') a.max = Math.max(a.max, row.max);
        acc.set(row.transaction, a);
      }
    }

    // Transactions that appear only in the histogram (no metrics row) still get a row.
    for (const name of Object.keys(merged.transactions)) {
      if (!acc.has(name)) {
        const h = merged.transactions[name];
        acc.set(name, {
          journey: '', count: h.count, pass: 0, fail: 0, sumForAvg: 0, avgWeight: 0,
          min: h.count > 0 ? h.min : Number.POSITIVE_INFINITY,
          max: h.count > 0 ? h.max : Number.NEGATIVE_INFINITY,
        });
      }
    }

    // ── 3. Build merged transaction rows (percentiles from merged histograms) ──
    const rows: TransactionMetricRow[] = [];
    for (const [name, a] of [...acc].sort((x, y) => x[0].localeCompare(y[0]))) {
      const total = a.pass + a.fail;
      const hist = merged.transactions[name];
      const row: TransactionMetricRow = {
        journey: a.journey,
        transaction: name,
        count: a.count,
        pass: a.pass,
        fail: a.fail,
        errorPct: total > 0 ? (a.fail / total) * 100 : 0,
        avg: a.avgWeight > 0 ? a.sumForAvg / a.avgWeight : (hist ? hist.mean : undefined),
        min: Number.isFinite(a.min) ? a.min : (hist && hist.count > 0 ? hist.min : undefined),
        max: Number.isFinite(a.max) ? a.max : (hist && hist.count > 0 ? hist.max : undefined),
      };
      for (const stat of stats) {
        const frac = statToFraction(stat);
        if (frac !== null && hist) row[stat] = hist.valueAtPercentile(frac);
      }
      rows.push(row);
    }

    const transactionMetrics: TransactionMetricsFile = { runId, stats, transactions: rows };

    // ── 4. Merge CI summary (global pass/fail from summed pass/fail vs budget) ──
    const ciSummary = this.mergeCiSummary(present, runId, rows, warnings);

    // ── 5. Serialize the merged histogram artifact ──
    const histogram = this.serializeMergedHistogram(merged, present);

    return {
      runId,
      machines: present.map((m) => m.machineName),
      transactionMetrics,
      ciSummary,
      histogram,
      warnings,
    };
  }

  // Whole-run + per-bucket merged histograms.
  private static mergeHistograms(arts: HistogramArtifact[], warnings: string[]): {
    relativeAccuracy: number;
    bucketSeconds: number;
    overview: RelativeHistogram;
    overviewByBucket: Map<string, RelativeHistogram>;
    transactions: Record<string, RelativeHistogram>;
    transactionsByBucket: Record<string, Map<string, RelativeHistogram>>;
    startTime: string;
    endTime: string;
  } {
    // Initialize accuracy/bucket from the first artifact so accumulators use the
    // correct alpha (histograms with mismatched alpha/bucket cannot be merged).
    const alpha = arts.length > 0 ? arts[0].relativeAccuracy : 0.001;
    const bucketSeconds = arts.length > 0 ? arts[0].bucketSeconds : 10;
    let startTime = arts.length > 0 ? arts[0].startTime : '';
    let endTime = arts.length > 0 ? arts[0].endTime : '';
    const overview = new RelativeHistogram(alpha);
    const overviewByBucket = new Map<string, RelativeHistogram>();
    const transactions: Record<string, RelativeHistogram> = {};
    const transactionsByBucket: Record<string, Map<string, RelativeHistogram>> = {};

    const ensureWhole = (map: Record<string, RelativeHistogram>, key: string): RelativeHistogram => {
      if (!map[key]) map[key] = new RelativeHistogram(alpha);
      return map[key];
    };
    const ensureBucket = (map: Map<string, RelativeHistogram>, ts: string): RelativeHistogram => {
      let h = map.get(ts);
      if (!h) { h = new RelativeHistogram(alpha); map.set(ts, h); }
      return h;
    };

    for (const art of arts) {
      if (art.relativeAccuracy !== alpha) {
        warnings.push(`histogram relativeAccuracy mismatch (${art.relativeAccuracy} vs ${alpha}); skipping a machine's histogram`);
        continue;
      }
      if (art.bucketSeconds !== bucketSeconds) {
        warnings.push(`histogram bucketSeconds mismatch (${art.bucketSeconds} vs ${bucketSeconds}); skipping a machine's histogram`);
        continue;
      }
      if (art.startTime && (!startTime || art.startTime < startTime)) startTime = art.startTime;
      if (art.endTime && art.endTime > endTime) endTime = art.endTime;
      // overview
      for (const [ts, hj] of Object.entries(art.overview)) {
        const h = RelativeHistogram.fromJSON(hj);
        overview.merge(h);
        ensureBucket(overviewByBucket, ts).merge(h);
      }
      // transactions
      for (const [name, buckets] of Object.entries(art.transactions)) {
        const whole = ensureWhole(transactions, name);
        const byBucket = transactionsByBucket[name] ?? (transactionsByBucket[name] = new Map());
        for (const [ts, hj] of Object.entries(buckets)) {
          const h = RelativeHistogram.fromJSON(hj);
          whole.merge(h);
          ensureBucket(byBucket, ts).merge(h);
        }
      }
    }

    return { relativeAccuracy: alpha, bucketSeconds, overview, overviewByBucket, transactions, transactionsByBucket, startTime, endTime };
  }

  private static serializeMergedHistogram(
    merged: ReturnType<typeof MergeEngine.mergeHistograms>,
    machines: MachineArtifacts[],
  ): HistogramArtifact | null {
    if (!machines.some((m) => m.histogram)) return null;
    const ser = (map: Map<string, RelativeHistogram>): Record<string, HistogramJSON> => {
      const out: Record<string, HistogramJSON> = {};
      for (const [ts, h] of map) out[ts] = h.toJSON();
      return out;
    };
    const transactions: Record<string, Record<string, HistogramJSON>> = {};
    for (const [name, byBucket] of Object.entries(merged.transactionsByBucket)) {
      transactions[name] = ser(byBucket);
    }
    return {
      schemaVersion: 1,
      metric: 'duration-histograms',
      bucketSeconds: merged.bucketSeconds,
      relativeAccuracy: merged.relativeAccuracy,
      startTime: merged.startTime,
      endTime: merged.endTime,
      overview: ser(merged.overviewByBucket),
      transactions,
    };
  }

  private static mergeCiSummary(
    machines: MachineArtifacts[],
    runId: string,
    rows: TransactionMetricRow[],
    warnings: string[],
  ): CiSummary {
    const first = machines.find((m) => m.ciSummary)?.ciSummary;
    let txnTotal = 0;
    let txnFail = 0;
    for (const r of rows) {
      txnTotal += (r.pass ?? 0) + (r.fail ?? 0);
      txnFail += r.fail ?? 0;
    }
    const transactionFailureRate = txnTotal > 0 ? (txnFail / txnTotal) * 100 : 0;
    const budget = first?.transactionErrorBudget ?? 0;

    const anyAborted = machines.some((m) => m.ciSummary?.aborted);
    const anyCrashed = machines.some((m) => m.ciSummary?.status === 'failed' && (m.ciSummary?.transactionFailureRate ?? 0) === 0 && (m.ciSummary?.thresholdFailures ?? 0) === 0);
    if (anyCrashed) warnings.push('at least one machine reported a non-SLA failure (possible execution crash)');

    const status: CiSummary['status'] =
      anyAborted ? 'aborted'
        : (transactionFailureRate > budget || anyCrashed) ? 'failed'
          : 'passed';

    const ciTxns: CiTransactionSummary[] = rows.map((r) => ({
      name: r.transaction,
      count: r.count,
      pass: r.pass ?? 0,
      fail: r.fail ?? 0,
      errorPct: r.errorPct,
      avg: typeof r.avg === 'number' ? r.avg : undefined,
      min: typeof r.min === 'number' ? r.min : undefined,
      max: typeof r.max === 'number' ? r.max : undefined,
      p95: typeof r['p(95)'] === 'number' ? (r['p(95)'] as number) : undefined,
      p99: typeof r['p(99)'] === 'number' ? (r['p(99)'] as number) : undefined,
    }));

    return {
      status,
      runId,
      plan: first?.plan ?? '',
      environment: first?.environment ?? '',
      thresholdFailures: machines.reduce((s, m) => s + (m.ciSummary?.thresholdFailures ?? 0), 0),
      transactionFailureRate,
      transactionErrorBudget: budget,
      errorCount: machines.reduce((s, m) => s + (m.ciSummary?.errorCount ?? 0), 0),
      warningCount: machines.reduce((s, m) => s + (m.ciSummary?.warningCount ?? 0), 0),
      aborted: anyAborted,
      transactions: ciTxns,
      gate: { failedRules: [...new Set(machines.flatMap((m) => m.ciSummary?.gate?.failedRules ?? []))] },
    };
  }
}
