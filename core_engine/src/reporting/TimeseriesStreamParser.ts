/**
 * TimeseriesStreamParser.ts
 *
 * Reads the line-delimited k6 `--out json=…` output (one Metric/Point per
 * line) and buckets samples into fixed-width time windows. Emits per-bucket
 * aggregates ready to feed the unified report's time-series view.
 *
 * Why this exists: prior reporting only stamped a single endTime point per
 * metric, which is why every "trend over time" chart in the report was
 * actually a one-bar bar chart. This module is the foundation that turns
 * that into proper line charts (Proposal 5, Wave 1).
 *
 * Memory: line-streaming + per-bucket aggregation. For Trend metrics we
 * retain the raw samples per bucket (needed for accurate percentiles), but
 * within each bucket the array is bounded by request volume in that window.
 * For 1-second buckets at 1000 req/s the peak per-bucket footprint is ~8 KB
 * per metric. Aggressive enough for everything we've seen.
 *
 * k6 Point shape (one per line):
 *   {"metric":"http_req_duration","type":"Point",
 *    "data":{"time":"2026-...","value":42.5,"tags":{"transaction":"login",...}}}
 */

import * as fs from 'fs';
import * as readline from 'readline';

// ────────────────────────────────────────────────────────────────────────────
// Output types
// ────────────────────────────────────────────────────────────────────────────

/**
 * Per-phase HTTP timing breakdown carries the same four percentile-ish
 * aggregates as the overall `http_req_duration` for one of the six phases
 * (waiting, tls handshaking, sending, connecting, receiving, blocked).
 * Mirrors what k6's web-dashboard surfaces in its Timings tab.
 */
export interface PhaseTimings {
  avg: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface OverviewBucket {
  ts: string;                  // ISO bucket start
  requests: number;            // http_reqs delta in this bucket
  requestRate: number;         // requests / bucketSeconds (req/s)
  httpDurationAvg: number;     // ms
  httpDurationP90: number;
  httpDurationP95: number;
  httpDurationP99: number;
  httpDurationMin: number;
  httpDurationMax: number;
  httpFailedCount: number;     // http_req_failed=1 samples in this bucket
  httpFailedRate: number;      // failedCount / requests (0..1)
  vus: number;                 // last sample in the bucket (gauge)
  vusMax: number;              // max(vus_max) observed
  iterations: number;          // iterations counter delta
  iterationDurationAvg: number;
  iterationDurationP90: number;
  iterationDurationP95: number;
  iterationDurationP99: number;
  dataReceived: number;        // bytes/sec
  dataSent: number;            // bytes/sec
  // Six HTTP request-timing phases. Same percentile shape for each so the
  // renderer can use one chart factory.
  httpReqWaiting: PhaseTimings;        // http_req_waiting (TTFB)
  httpReqTlsHandshaking: PhaseTimings; // http_req_tls_handshaking
  httpReqSending: PhaseTimings;        // http_req_sending
  httpReqConnecting: PhaseTimings;     // http_req_connecting
  httpReqReceiving: PhaseTimings;      // http_req_receiving
  httpReqBlocked: PhaseTimings;        // http_req_blocked
}

export interface TransactionBucket {
  ts: string;
  count: number;               // <txn>_count delta in this bucket
  durationAvg: number;
  durationP90: number;
  durationP95: number;
  durationP99: number;
  durationMin: number;
  durationMax: number;
  // From <txn>_checkrate (Rate metric pushed once per iteration by transaction()).
  // pass + fail === count by construction when both come from the same iteration.
  pass: number;
  fail: number;
}

export interface ParsedTimeseries {
  bucketSizeSeconds: number;
  /** Earliest bucket ts observed across all metrics. */
  startTime: string;
  /** Latest bucket ts observed across all metrics. */
  endTime: string;
  overview: OverviewBucket[];
  /** Per-transaction series keyed by transaction name. */
  transactions: Record<string, TransactionBucket[]>;
  /**
   * Total request count for the entire run, summed from all Points. Used by
   * the summary tab so we don't have to re-sum buckets in the renderer.
   */
  totals: {
    requests: number;
    iterations: number;
    httpFailures: number;
    dataReceived: number;
    dataSent: number;
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Internal bucket structures (retain raw samples until finalize)
// ────────────────────────────────────────────────────────────────────────────

interface OverviewRaw {
  httpReqDuration: number[];
  iterationDuration: number[];
  httpReqs: number;
  iterations: number;
  httpFailedCount: number;
  // For gauges we keep last value; for the max gauge we keep the max value.
  vusLast: number;
  vusMaxSeen: number;
  dataReceived: number;
  dataSent: number;
  // Six request-timing phases. Stored as raw sample arrays so percentile
  // computation at finalize is accurate per bucket (same as the overall
  // duration metric). Arrays are discarded after finalize.
  httpReqWaiting: number[];
  httpReqTlsHandshaking: number[];
  httpReqSending: number[];
  httpReqConnecting: number[];
  httpReqReceiving: number[];
  httpReqBlocked: number[];
}

interface TransactionRaw {
  count: number;
  duration: number[];
  pass: number;
  fail: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Parser
// ────────────────────────────────────────────────────────────────────────────

interface ParseOptions {
  bucketSizeSeconds: number;
  /** Comprehensive transaction-name allowlist drawn from the run's manifest. */
  transactionNames?: string[];
}

interface RawPoint {
  metric: string;
  data?: { time?: string; value?: number; tags?: Record<string, string> };
}

export class TimeseriesStreamParser {
  /** Stream-parse the file. Returns `null` if the file doesn't exist or is empty. */
  static async parseFile(
    streamPath: string,
    options: ParseOptions,
  ): Promise<ParsedTimeseries | null> {
    if (!fs.existsSync(streamPath)) return null;
    if (fs.statSync(streamPath).size === 0) return null;

    const bucketMs = Math.max(1, options.bucketSizeSeconds) * 1000;
    const overview = new Map<number, OverviewRaw>();
    const txns = new Map<string, Map<number, TransactionRaw>>();
    const knownTxns = new Set(options.transactionNames ?? []);

    let earliestMs = Number.POSITIVE_INFINITY;
    let latestMs = Number.NEGATIVE_INFINITY;
    let totalRequests = 0;
    let totalIterations = 0;
    let totalHttpFailures = 0;
    let totalDataReceived = 0;
    let totalDataSent = 0;

    const stream = fs.createReadStream(streamPath, { encoding: 'utf-8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (!line || line.length < 32) continue; // cheap early-out
      // Only Point lines carry samples. Skip Metric definitions / Submetric.
      // The substring check is ~5x faster than parsing every line then
      // discarding non-Points.
      if (line.indexOf('"type":"Point"') === -1) continue;

      let p: RawPoint;
      try {
        p = JSON.parse(line) as RawPoint;
      } catch {
        continue;
      }
      const metric = p.metric;
      const time = p.data?.time;
      const value = p.data?.value;
      if (!metric || !time || typeof value !== 'number') continue;

      const tsMs = Date.parse(time);
      if (!Number.isFinite(tsMs)) continue;
      const bucketKey = Math.floor(tsMs / bucketMs) * bucketMs;
      if (bucketKey < earliestMs) earliestMs = bucketKey;
      if (bucketKey > latestMs) latestMs = bucketKey;

      const tags = p.data?.tags ?? {};

      // ── Overview metrics (no per-transaction split) ────────────────
      switch (metric) {
        case 'http_reqs':
          getOverview(overview, bucketKey).httpReqs += value;
          totalRequests += value;
          break;
        case 'http_req_duration':
          getOverview(overview, bucketKey).httpReqDuration.push(value);
          break;
        // Six request-timing phases — k6's standard breakdown. The
        // dashboard's Timings tab plots one chart per phase with avg/
        // p90/p95/p99; this mirror lets the custom report do the same.
        case 'http_req_waiting':
          getOverview(overview, bucketKey).httpReqWaiting.push(value);
          break;
        case 'http_req_tls_handshaking':
          getOverview(overview, bucketKey).httpReqTlsHandshaking.push(value);
          break;
        case 'http_req_sending':
          getOverview(overview, bucketKey).httpReqSending.push(value);
          break;
        case 'http_req_connecting':
          getOverview(overview, bucketKey).httpReqConnecting.push(value);
          break;
        case 'http_req_receiving':
          getOverview(overview, bucketKey).httpReqReceiving.push(value);
          break;
        case 'http_req_blocked':
          getOverview(overview, bucketKey).httpReqBlocked.push(value);
          break;
        case 'http_req_failed':
          if (value === 1) {
            getOverview(overview, bucketKey).httpFailedCount += 1;
            totalHttpFailures += 1;
          }
          break;
        case 'vus':
          // Gauge — overwrite to "last sample seen in this bucket".
          getOverview(overview, bucketKey).vusLast = value;
          break;
        case 'vus_max':
          {
            const b = getOverview(overview, bucketKey);
            if (value > b.vusMaxSeen) b.vusMaxSeen = value;
          }
          break;
        case 'iterations':
          getOverview(overview, bucketKey).iterations += value;
          totalIterations += value;
          break;
        case 'iteration_duration':
          getOverview(overview, bucketKey).iterationDuration.push(value);
          break;
        case 'data_received':
          getOverview(overview, bucketKey).dataReceived += value;
          totalDataReceived += value;
          break;
        case 'data_sent':
          getOverview(overview, bucketKey).dataSent += value;
          totalDataSent += value;
          break;
        default: {
          // ── Per-transaction metrics ────────────────────────────────
          // Three suffixes are emitted by `transaction()` (Proposal 1+3):
          //   <txn>          — Trend (duration ms)
          //   <txn>_count    — Counter (1 per iteration)
          //   <txn>_checkrate — Rate (1 per passing iter, 0 per failing iter)
          // We strip the suffix to find the transaction name, then validate
          // against the manifest if one was supplied so we don't grab any
          // unrelated user-named metric.
          let txnName: string | null = null;
          let kind: 'duration' | 'count' | 'rate' | null = null;
          if (metric.endsWith('_count')) {
            txnName = metric.slice(0, -'_count'.length);
            kind = 'count';
          } else if (metric.endsWith('_checkrate')) {
            txnName = metric.slice(0, -'_checkrate'.length);
            kind = 'rate';
          } else if (knownTxns.size > 0 && knownTxns.has(metric)) {
            txnName = metric;
            kind = 'duration';
          } else if (knownTxns.size === 0 && tags.transaction) {
            // No manifest available — fall back to the `transaction` tag on
            // duration samples. Less precise but functional for legacy runs.
            txnName = tags.transaction;
            kind = 'duration';
            // Only treat http_req_duration samples this way to avoid spamming
            // every metric into the per-transaction map.
            if (metric !== 'http_req_duration') break;
          }
          if (!txnName || !kind) break;
          const map = txns.get(txnName) ?? new Map<number, TransactionRaw>();
          const tBucket = map.get(bucketKey) ?? { count: 0, duration: [], pass: 0, fail: 0 };
          if (kind === 'count') tBucket.count += value;
          else if (kind === 'duration') tBucket.duration.push(value);
          else if (kind === 'rate') {
            if (value === 1) tBucket.pass += 1;
            else tBucket.fail += 1;
          }
          map.set(bucketKey, tBucket);
          txns.set(txnName, map);
          break;
        }
      }
    }

    if (!Number.isFinite(earliestMs) || !Number.isFinite(latestMs)) return null;

    // ── Finalize: build dense, contiguous bucket arrays ───────────────
    // Sparse map → dense ts-ordered array so chart libraries can plot a flat
    // line through empty buckets instead of jumping over gaps. Empty buckets
    // get zeroed counters and empty percentiles.
    const bucketSeconds = options.bucketSizeSeconds;
    const overviewBuckets: OverviewBucket[] = [];
    for (let k = earliestMs; k <= latestMs; k += bucketMs) {
      const raw = overview.get(k);
      overviewBuckets.push(finalizeOverview(raw, k, bucketSeconds));
    }

    const transactionsOut: Record<string, TransactionBucket[]> = {};
    for (const [name, map] of txns) {
      const arr: TransactionBucket[] = [];
      for (let k = earliestMs; k <= latestMs; k += bucketMs) {
        const raw = map.get(k);
        arr.push(finalizeTransaction(raw, k));
      }
      transactionsOut[name] = arr;
    }

    return {
      bucketSizeSeconds: bucketSeconds,
      startTime: new Date(earliestMs).toISOString(),
      endTime: new Date(latestMs + bucketMs).toISOString(),
      overview: overviewBuckets,
      transactions: transactionsOut,
      totals: {
        requests: totalRequests,
        iterations: totalIterations,
        httpFailures: totalHttpFailures,
        dataReceived: totalDataReceived,
        dataSent: totalDataSent,
      },
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function getOverview(map: Map<number, OverviewRaw>, key: number): OverviewRaw {
  let b = map.get(key);
  if (!b) {
    b = {
      httpReqDuration: [],
      iterationDuration: [],
      httpReqs: 0,
      iterations: 0,
      httpFailedCount: 0,
      vusLast: 0,
      vusMaxSeen: 0,
      dataReceived: 0,
      dataSent: 0,
      httpReqWaiting: [],
      httpReqTlsHandshaking: [],
      httpReqSending: [],
      httpReqConnecting: [],
      httpReqReceiving: [],
      httpReqBlocked: [],
    };
    map.set(key, b);
  }
  return b;
}

/** Empty phase-timings struct for empty/missing buckets. */
function emptyPhase(): PhaseTimings {
  return { avg: 0, p90: 0, p95: 0, p99: 0 };
}

/** Compute the four phase percentiles from a per-bucket sample array. */
function phaseStats(values: number[]): PhaseTimings {
  if (values.length === 0) return emptyPhase();
  const s = computeTrendStats(values);
  return { avg: s.avg, p90: s.p90, p95: s.p95, p99: s.p99 };
}

function finalizeOverview(
  raw: OverviewRaw | undefined,
  bucketKey: number,
  bucketSeconds: number,
): OverviewBucket {
  if (!raw) {
    return {
      ts: new Date(bucketKey).toISOString(),
      requests: 0, requestRate: 0,
      httpDurationAvg: 0, httpDurationP90: 0, httpDurationP95: 0, httpDurationP99: 0,
      httpDurationMin: 0, httpDurationMax: 0,
      httpFailedCount: 0, httpFailedRate: 0,
      vus: 0, vusMax: 0,
      iterations: 0, iterationDurationAvg: 0, iterationDurationP90: 0,
      iterationDurationP95: 0, iterationDurationP99: 0,
      dataReceived: 0, dataSent: 0,
      httpReqWaiting: emptyPhase(),
      httpReqTlsHandshaking: emptyPhase(),
      httpReqSending: emptyPhase(),
      httpReqConnecting: emptyPhase(),
      httpReqReceiving: emptyPhase(),
      httpReqBlocked: emptyPhase(),
    };
  }
  const httpStats = computeTrendStats(raw.httpReqDuration);
  const iterStats = computeTrendStats(raw.iterationDuration);
  const failedRate = raw.httpReqs > 0 ? raw.httpFailedCount / raw.httpReqs : 0;
  return {
    ts: new Date(bucketKey).toISOString(),
    requests: raw.httpReqs,
    requestRate: bucketSeconds > 0 ? raw.httpReqs / bucketSeconds : 0,
    httpDurationAvg: httpStats.avg,
    httpDurationP90: httpStats.p90,
    httpDurationP95: httpStats.p95,
    httpDurationP99: httpStats.p99,
    httpDurationMin: httpStats.min,
    httpDurationMax: httpStats.max,
    httpFailedCount: raw.httpFailedCount,
    httpFailedRate: failedRate,
    vus: raw.vusLast,
    vusMax: raw.vusMaxSeen,
    iterations: raw.iterations,
    iterationDurationAvg: iterStats.avg,
    iterationDurationP90: iterStats.p90,
    iterationDurationP95: iterStats.p95,
    iterationDurationP99: iterStats.p99,
    dataReceived: bucketSeconds > 0 ? raw.dataReceived / bucketSeconds : 0,
    dataSent: bucketSeconds > 0 ? raw.dataSent / bucketSeconds : 0,
    httpReqWaiting: phaseStats(raw.httpReqWaiting),
    httpReqTlsHandshaking: phaseStats(raw.httpReqTlsHandshaking),
    httpReqSending: phaseStats(raw.httpReqSending),
    httpReqConnecting: phaseStats(raw.httpReqConnecting),
    httpReqReceiving: phaseStats(raw.httpReqReceiving),
    httpReqBlocked: phaseStats(raw.httpReqBlocked),
  };
}

function finalizeTransaction(raw: TransactionRaw | undefined, bucketKey: number): TransactionBucket {
  if (!raw) {
    return {
      ts: new Date(bucketKey).toISOString(),
      count: 0,
      durationAvg: 0, durationP90: 0, durationP95: 0, durationP99: 0,
      durationMin: 0, durationMax: 0,
      pass: 0, fail: 0,
    };
  }
  const stats = computeTrendStats(raw.duration);
  return {
    ts: new Date(bucketKey).toISOString(),
    count: raw.count,
    durationAvg: stats.avg,
    durationP90: stats.p90,
    durationP95: stats.p95,
    durationP99: stats.p99,
    durationMin: stats.min,
    durationMax: stats.max,
    pass: raw.pass,
    fail: raw.fail,
  };
}

interface TrendStats {
  avg: number;
  p90: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}

/**
 * Compute Trend-metric stats from a per-bucket sample array. Sorts in place
 * (caller's array is discarded after finalize so the mutation is safe and
 * saves a copy). Percentiles use "nearest-rank" — for k6's small per-bucket
 * sample counts this matches what the dashboard typically shows.
 */
function computeTrendStats(values: number[]): TrendStats {
  if (values.length === 0) return { avg: 0, p90: 0, p95: 0, p99: 0, min: 0, max: 0 };
  values.sort((a, b) => a - b);
  let sum = 0;
  for (const v of values) sum += v;
  const avg = sum / values.length;
  return {
    avg,
    p90: percentile(values, 0.9),
    p95: percentile(values, 0.95),
    p99: percentile(values, 0.99),
    min: values[0],
    max: values[values.length - 1],
  };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[idx];
}
