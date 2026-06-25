/**
 * MergedReportBuilder.ts
 * Turns a MergeEngine result + per-machine timeseries into the merged timeseries
 * and a ReportBundle the existing RunReportGenerator renders unchanged.
 *
 * Timeseries merge (design §1.5.1):
 *   - overview counters (requests/failures/iterations/data/vus) summed by 2s bucket → exact
 *   - overview duration percentiles injected from the MERGED histogram (per 10s bucket) → exact
 *   - per-transaction series merged by concatenating the raw per-bucket `durations`
 *     arrays and recomputing stats (R-7) → exact per-bucket transaction percentiles
 *   - totals summed; events concatenated and time-sorted
 */

import { percentileR7, RelativeHistogram } from '../reporting/Histogram';
import { HistogramArtifact } from '../reporting/HistogramArtifactBuilder';
import {
  ReportBundle, TimeSeriesFile, TimeSeriesPoint, TransactionMetricsFile, CiSummary,
} from '../types/ReportingContracts';
import { MergeResult } from './MergeEngine';

export interface MachineTimeseries {
  machineName: string;
  timeseries?: TimeSeriesFile;
  errors?: Array<Record<string, unknown>>;
  warnings?: Array<Record<string, unknown>>;
}

export interface MergedReportInput {
  merge: MergeResult;
  machines: MachineTimeseries[];
  plan: { name: string; environment: string; executionMode?: string };
  /** Counter bucket seconds (default 2, from runtime settings). */
  counterBucketSeconds?: number;
  transactionStats?: string[];
}

export class MergedReportBuilder {
  static build(input: MergedReportInput): { bundle: ReportBundle; timeseries: TimeSeriesFile } {
    const counterBucket = input.counterBucketSeconds ?? 2;
    const tsFiles = input.machines.map((m) => m.timeseries).filter((t): t is TimeSeriesFile => !!t);

    const timeseries = this.mergeTimeseries(tsFiles, input.merge.histogram, counterBucket);
    const bundle = this.assembleBundle(input, timeseries);
    return { bundle, timeseries };
  }

  private static mergeTimeseries(
    files: TimeSeriesFile[],
    mergedHist: HistogramArtifact | null,
    counterBucket: number,
  ): TimeSeriesFile {
    const overview = new Map<string, TimeSeriesPoint>();
    const txns: Record<string, Map<string, TimeSeriesPoint & { _durations: number[] }>> = {};
    const events: TimeSeriesFile['series']['events'] = [];
    const totals = { requests: 0, iterations: 0, httpFailures: 0, dataReceived: 0, dataSent: 0 };
    let startTime = '';
    let endTime = '';

    const num = (p: TimeSeriesPoint, k: string): number => (typeof p[k] === 'number' ? (p[k] as number) : 0);

    for (const f of files) {
      if (f.totals) {
        totals.requests += f.totals.requests; totals.iterations += f.totals.iterations;
        totals.httpFailures += f.totals.httpFailures; totals.dataReceived += f.totals.dataReceived;
        totals.dataSent += f.totals.dataSent;
      }
      if (f.startTime && (!startTime || f.startTime < startTime)) startTime = f.startTime;
      if (f.endTime && f.endTime > endTime) endTime = f.endTime;

      // ── overview: sum counters by ts ──
      for (const p of f.series.overview) {
        const ts = String(p.ts);
        const acc = overview.get(ts) ?? { ts, requests: 0, httpFailedCount: 0, iterations: 0, dataReceived: 0, dataSent: 0, vus: 0, vusMax: 0, _durAvgW: 0, _durW: 0, httpDurationMin: Infinity, httpDurationMax: -Infinity } as TimeSeriesPoint;
        (acc.requests as number) += num(p, 'requests');
        (acc.httpFailedCount as number) += num(p, 'httpFailedCount');
        (acc.iterations as number) += num(p, 'iterations');
        (acc.dataReceived as number) += num(p, 'dataReceived');
        (acc.dataSent as number) += num(p, 'dataSent');
        (acc.vus as number) += num(p, 'vus');           // concurrent VUs across machines add
        (acc.vusMax as number) += num(p, 'vusMax');
        // request-weighted avg accumulator + min/max
        const req = num(p, 'requests');
        (acc as Record<string, number>)._durAvgW += num(p, 'httpDurationAvg') * req;
        (acc as Record<string, number>)._durW += req;
        if (num(p, 'httpDurationMin') || p.httpDurationMin !== undefined) acc.httpDurationMin = Math.min(acc.httpDurationMin as number, num(p, 'httpDurationMin'));
        acc.httpDurationMax = Math.max(acc.httpDurationMax as number, num(p, 'httpDurationMax'));
        overview.set(ts, acc);
      }

      // ── per-transaction: concat raw durations by ts (exact merge) ──
      for (const [name, points] of Object.entries(f.series.transactions)) {
        const map = txns[name] ?? (txns[name] = new Map());
        for (const p of points) {
          const ts = String(p.ts);
          const acc = map.get(ts) ?? { ts, count: 0, pass: 0, fail: 0, _durations: [] };
          (acc.count as number) += num(p, 'count');
          (acc.pass as number) += num(p, 'pass');
          (acc.fail as number) += num(p, 'fail');
          const d = p.durations;
          if (Array.isArray(d)) acc._durations.push(...(d as number[]));
          map.set(ts, acc);
        }
      }

      for (const e of f.series.events) events.push(e);
    }

    // Finalize overview: rates, weighted avg, inject percentiles from merged histogram.
    const histOverview = mergedHist
      ? Object.fromEntries(Object.entries(mergedHist.overview).map(([k, h]) => [new Date(Number(k)).toISOString(), RelativeHistogram.fromJSON(h)]))
      : {};
    const overviewPoints: TimeSeriesPoint[] = [];
    for (const [ts, acc] of [...overview].sort((a, b) => a[0].localeCompare(b[0]))) {
      const requests = num(acc, 'requests');
      const w = (acc as Record<string, number>)._durW || 0;
      acc.requestRate = counterBucket > 0 ? requests / counterBucket : 0;
      acc.httpFailedRate = requests > 0 ? num(acc, 'httpFailedCount') / requests : 0;
      acc.httpDurationAvg = w > 0 ? (acc as Record<string, number>)._durAvgW / w : 0;
      if (acc.httpDurationMin === Infinity) acc.httpDurationMin = 0;
      if (acc.httpDurationMax === -Infinity) acc.httpDurationMax = 0;
      // Exact percentiles from the merged histogram bucket aligned to this ts (10s grid).
      const hist = this.histForTs(histOverview, ts, mergedHist?.bucketSeconds ?? 10);
      if (hist && hist.count > 0) {
        acc.httpDurationP90 = hist.valueAtPercentile(0.9);
        acc.httpDurationP95 = hist.valueAtPercentile(0.95);
        acc.httpDurationP99 = hist.valueAtPercentile(0.99);
      }
      delete (acc as Record<string, unknown>)._durAvgW;
      delete (acc as Record<string, unknown>)._durW;
      overviewPoints.push(acc);
    }

    // Finalize transactions: recompute stats from merged raw durations (R-7 exact).
    const txnSeries: Record<string, TimeSeriesPoint[]> = {};
    for (const [name, map] of Object.entries(txns)) {
      const pts: TimeSeriesPoint[] = [];
      for (const [ts, acc] of [...map].sort((a, b) => a[0].localeCompare(b[0]))) {
        const ds = acc._durations;
        const sorted = ds.slice().sort((x, y) => x - y);
        const point: TimeSeriesPoint = {
          ts, count: acc.count, pass: acc.pass, fail: acc.fail, durations: ds,
        };
        if (sorted.length > 0) {
          point.durationAvg = sorted.reduce((s, v) => s + v, 0) / sorted.length;
          point.durationMin = sorted[0];
          point.durationMax = sorted[sorted.length - 1];
          point.durationP90 = percentileR7(sorted, 0.9, true);
          point.durationP95 = percentileR7(sorted, 0.95, true);
          point.durationP99 = percentileR7(sorted, 0.99, true);
          point.avg = point.durationAvg; point.min = point.durationMin; point.max = point.durationMax;
        }
        pts.push(point);
      }
      txnSeries[name] = pts;
    }

    events.sort((a, b) => String(a.ts).localeCompare(String(b.ts)));

    return {
      bucketSizeSeconds: counterBucket,
      startTime, endTime,
      totals,
      series: { overview: overviewPoints, transactions: txnSeries, system: {}, events },
    };
  }

  /** Find the merged-histogram bucket (10s) whose window contains `ts`. */
  private static histForTs(histByIso: Record<string, RelativeHistogram>, ts: string, bucketSeconds: number): RelativeHistogram | null {
    const ms = Date.parse(ts);
    if (!Number.isFinite(ms)) return null;
    const bucketStart = Math.floor(ms / (bucketSeconds * 1000)) * bucketSeconds * 1000;
    return histByIso[new Date(bucketStart).toISOString()] ?? null;
  }

  private static assembleBundle(input: MergedReportInput, timeseries: TimeSeriesFile): ReportBundle {
    const { merge, plan } = input;
    const ci: CiSummary = merge.ciSummary;
    const tm: TransactionMetricsFile = merge.transactionMetrics;
    const stats = input.transactionStats ?? tm.stats;
    const startTime = timeseries.startTime || (merge.histogram?.startTime ?? new Date().toISOString());
    const endTime = timeseries.endTime || (merge.histogram?.endTime ?? new Date().toISOString());

    const allErrors = input.machines.flatMap((m) => m.errors ?? []);
    const allWarnings = input.machines.flatMap((m) => m.warnings ?? []);

    return {
      meta: {
        runId: merge.runId, plan: plan.name, environment: plan.environment,
        startTime, endTime, status: ci.status, bucketSizeSeconds: timeseries.bucketSizeSeconds,
      },
      config: { transactionStats: stats, defaultTopTransactions: 5, timeseriesEnabled: true },
      summary: {
        ciSummary: ci,
        planProfile: {
          name: plan.name, environment: plan.environment, executionMode: plan.executionMode ?? '',
          journeys: [], globalLoadProfile: {},
        },
        runtimeSnapshot: {},
        thresholds: [],
        totals: timeseries.totals,
        topRequests: [],
        compliancePercentiles: [],
        // Provenance: this is a merged, multi-machine report.
        distributed: { machines: merge.machines, warnings: merge.warnings },
      },
      transactions: tm,
      timeseries,
      errors: allErrors,
      warnings: allWarnings,
      snapshots: [],
      system: { agents: [], machines: merge.machines },
    };
  }
}
