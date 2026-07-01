"use strict";
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
exports.TimeseriesStreamParser = void 0;
const fs = __importStar(require("fs"));
const readline = __importStar(require("readline"));
/** Normalize a percentile list: ensure p90 is present, dedupe, sort ascending. */
function normalizePercentiles(input) {
    const set = new Set([90]);
    for (const p of input ?? [95, 99]) {
        if (Number.isFinite(p) && p > 0 && p < 100)
            set.add(p);
    }
    return [...set].sort((a, b) => a - b);
}
class TimeseriesStreamParser {
    /** Stream-parse the file. Returns `null` if the file doesn't exist or is empty. */
    static async parseFile(streamPath, options) {
        if (!fs.existsSync(streamPath))
            return null;
        if (fs.statSync(streamPath).size === 0)
            return null;
        const bucketMs = Math.max(1, options.bucketSizeSeconds) * 1000;
        const pcts = normalizePercentiles(options.percentiles);
        const overview = new Map();
        const txns = new Map();
        const reqs = new Map();
        const knownTxns = new Set(options.transactionNames ?? []);
        // Bucket a single request sample (duration or failed-flag) under its `name`
        // tag. k6 defaults `name` to the URL when the caller didn't name the request,
        // so every http_req_* sample maps to some request series.
        const addRequestSample = (tags, bucketKey, kind, value) => {
            const reqName = tags.name || tags.url;
            if (!reqName)
                return;
            // The owning transaction comes from k6's native `group` tag (value
            // "::<txn>"); strip the leading "::". No separate `transaction` tag exists.
            const grpTxn = (tags.group || '').replace(/^::/, '');
            const map = reqs.get(reqName) ?? new Map();
            const b = map.get(bucketKey) ?? {
                count: 0, failed: 0, duration: [],
                method: tags.method || '', transaction: grpTxn, url: tags.url || reqName,
            };
            if (kind === 'duration') {
                b.count += 1;
                b.duration.push(value);
            }
            else if (value === 1)
                b.failed += 1;
            // Backfill metadata if the first sample for this bucket lacked a tag.
            if (!b.method && tags.method)
                b.method = tags.method;
            if (!b.transaction && grpTxn)
                b.transaction = grpTxn;
            map.set(bucketKey, b);
            reqs.set(reqName, map);
        };
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
            if (!line || line.length < 32)
                continue; // cheap early-out
            // Only Point lines carry samples. Skip Metric definitions / Submetric.
            // The substring check is ~5x faster than parsing every line then
            // discarding non-Points.
            if (line.indexOf('"type":"Point"') === -1)
                continue;
            let p;
            try {
                p = JSON.parse(line);
            }
            catch {
                continue;
            }
            const metric = p.metric;
            const time = p.data?.time;
            const value = p.data?.value;
            if (!metric || !time || typeof value !== 'number')
                continue;
            const tsMs = Date.parse(time);
            if (!Number.isFinite(tsMs))
                continue;
            const bucketKey = Math.floor(tsMs / bucketMs) * bucketMs;
            if (bucketKey < earliestMs)
                earliestMs = bucketKey;
            if (bucketKey > latestMs)
                latestMs = bucketKey;
            const tags = p.data?.tags ?? {};
            // ── Overview metrics (no per-transaction split) ────────────────
            switch (metric) {
                case 'http_reqs':
                    getOverview(overview, bucketKey).httpReqs += value;
                    totalRequests += value;
                    break;
                case 'http_req_duration':
                    getOverview(overview, bucketKey).httpReqDuration.push(value);
                    addRequestSample(tags, bucketKey, 'duration', value);
                    break;
                // Six request-timing phases — k6's standard breakdown. The
                // dashboard's Timings tab plots one chart per phase with avg/
                // p90/p95/p99; this mirror lets the custom report do the same.
                //
                // ── HTTP Timing Breakdown DISABLED ──────────────────────────────
                // Collection of the six phase metrics is commented out to shrink the
                // timeseries artifact and the report. These samples now fall through to
                // `default`, which harmlessly ignores them (no matching transaction).
                // To restore the Timing Breakdown graphs, uncomment this block together
                // with the phase output in TimeseriesArtifactBuilder.ts and the charts
                // in RunReportGenerator.ts.
                // case 'http_req_waiting':
                //   getOverview(overview, bucketKey).httpReqWaiting.push(value);
                //   break;
                // case 'http_req_tls_handshaking':
                //   getOverview(overview, bucketKey).httpReqTlsHandshaking.push(value);
                //   break;
                // case 'http_req_sending':
                //   getOverview(overview, bucketKey).httpReqSending.push(value);
                //   break;
                // case 'http_req_connecting':
                //   getOverview(overview, bucketKey).httpReqConnecting.push(value);
                //   break;
                // case 'http_req_receiving':
                //   getOverview(overview, bucketKey).httpReqReceiving.push(value);
                //   break;
                // case 'http_req_blocked':
                //   getOverview(overview, bucketKey).httpReqBlocked.push(value);
                //   break;
                case 'http_req_failed':
                    addRequestSample(tags, bucketKey, 'failed', value);
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
                        if (value > b.vusMaxSeen)
                            b.vusMaxSeen = value;
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
                    let txnName = null;
                    let kind = null;
                    if (metric.endsWith('_count')) {
                        txnName = metric.slice(0, -'_count'.length);
                        kind = 'count';
                    }
                    else if (metric.endsWith('_checkrate')) {
                        txnName = metric.slice(0, -'_checkrate'.length);
                        kind = 'rate';
                    }
                    else if (knownTxns.size > 0 && knownTxns.has(metric)) {
                        txnName = metric;
                        kind = 'duration';
                    }
                    else if (knownTxns.size === 0 && (tags.group || '').replace(/^::/, '')) {
                        // No manifest available — fall back to k6's native `group` tag
                        // (value "::<txn>") on duration samples. Less precise but functional
                        // for legacy runs.
                        txnName = (tags.group || '').replace(/^::/, '');
                        kind = 'duration';
                        // Only treat http_req_duration samples this way to avoid spamming
                        // every metric into the per-transaction map.
                        if (metric !== 'http_req_duration')
                            break;
                    }
                    if (!txnName || !kind)
                        break;
                    const map = txns.get(txnName) ?? new Map();
                    const tBucket = map.get(bucketKey) ?? { count: 0, duration: [], pass: 0, fail: 0 };
                    if (kind === 'count')
                        tBucket.count += value;
                    else if (kind === 'duration')
                        tBucket.duration.push(value);
                    else if (kind === 'rate') {
                        if (value === 1)
                            tBucket.pass += 1;
                        else
                            tBucket.fail += 1;
                    }
                    map.set(bucketKey, tBucket);
                    txns.set(txnName, map);
                    break;
                }
            }
        }
        if (!Number.isFinite(earliestMs) || !Number.isFinite(latestMs))
            return null;
        // ── Finalize: build dense, contiguous bucket arrays ───────────────
        // Sparse map → dense ts-ordered array so chart libraries can plot a flat
        // line through empty buckets instead of jumping over gaps. Empty buckets
        // get zeroed counters and empty percentiles.
        const bucketSeconds = options.bucketSizeSeconds;
        const overviewBuckets = [];
        for (let k = earliestMs; k <= latestMs; k += bucketMs) {
            const raw = overview.get(k);
            overviewBuckets.push(finalizeOverview(raw, k, bucketSeconds, pcts));
        }
        const transactionsOut = {};
        for (const [name, map] of txns) {
            const arr = [];
            for (let k = earliestMs; k <= latestMs; k += bucketMs) {
                const raw = map.get(k);
                arr.push(finalizeTransaction(raw, k, pcts));
            }
            transactionsOut[name] = arr;
        }
        const requestsOut = {};
        for (const [name, map] of reqs) {
            // Stable metadata for the series — take it from any bucket that has it.
            let meta = { method: '', transaction: '', url: name };
            for (const raw of map.values()) {
                meta = { method: raw.method, transaction: raw.transaction, url: raw.url };
                break;
            }
            const arr = [];
            for (let k = earliestMs; k <= latestMs; k += bucketMs) {
                arr.push(finalizeRequest(map.get(k), k, pcts, meta));
            }
            requestsOut[name] = arr;
        }
        return {
            bucketSizeSeconds: bucketSeconds,
            startTime: new Date(earliestMs).toISOString(),
            endTime: new Date(latestMs + bucketMs).toISOString(),
            overview: overviewBuckets,
            transactions: transactionsOut,
            requests: requestsOut,
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
exports.TimeseriesStreamParser = TimeseriesStreamParser;
// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
function getOverview(map, key) {
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
function emptyPhase() {
    return { avg: 0, p90: 0, p95: 0, p99: 0 };
}
/**
 * Phase charts keep a fixed avg/p90/p95/p99 shape (k6 web-dashboard parity),
 * independent of the configured percentile set.
 */
function phaseStats(values) {
    if (values.length === 0)
        return emptyPhase();
    const s = computeTrendStats(values, [90, 95, 99]);
    return { avg: s.avg, p90: s.pct['90'], p95: s.pct['95'], p99: s.pct['99'] };
}
function finalizeOverview(raw, bucketKey, bucketSeconds, pcts) {
    if (!raw) {
        return {
            ts: new Date(bucketKey).toISOString(),
            requests: 0, requestRate: 0,
            httpDurationAvg: 0, httpDurationMin: 0, httpDurationMax: 0, httpDurationPct: {},
            httpFailedCount: 0, httpFailedRate: 0,
            vus: 0, vusMax: 0,
            iterations: 0, iterationDurationAvg: 0, iterationDurationPct: {},
            dataReceived: 0, dataSent: 0,
            httpReqWaiting: emptyPhase(),
            httpReqTlsHandshaking: emptyPhase(),
            httpReqSending: emptyPhase(),
            httpReqConnecting: emptyPhase(),
            httpReqReceiving: emptyPhase(),
            httpReqBlocked: emptyPhase(),
        };
    }
    const httpStats = computeTrendStats(raw.httpReqDuration, pcts);
    const iterStats = computeTrendStats(raw.iterationDuration, pcts);
    const failedRate = raw.httpReqs > 0 ? raw.httpFailedCount / raw.httpReqs : 0;
    return {
        ts: new Date(bucketKey).toISOString(),
        requests: raw.httpReqs,
        requestRate: bucketSeconds > 0 ? raw.httpReqs / bucketSeconds : 0,
        httpDurationAvg: httpStats.avg,
        httpDurationMin: httpStats.min,
        httpDurationMax: httpStats.max,
        httpDurationPct: httpStats.pct,
        httpFailedCount: raw.httpFailedCount,
        httpFailedRate: failedRate,
        vus: raw.vusLast,
        vusMax: raw.vusMaxSeen,
        iterations: raw.iterations,
        iterationDurationAvg: iterStats.avg,
        iterationDurationPct: iterStats.pct,
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
function finalizeTransaction(raw, bucketKey, pcts) {
    if (!raw) {
        return {
            ts: new Date(bucketKey).toISOString(),
            count: 0,
            durationAvg: 0, durationMin: 0, durationMax: 0, durationPct: {},
            pass: 0, fail: 0,
            durations: [],
        };
    }
    const stats = computeTrendStats(raw.duration, pcts);
    return {
        ts: new Date(bucketKey).toISOString(),
        count: raw.count,
        durationAvg: stats.avg,
        durationMin: stats.min,
        durationMax: stats.max,
        durationPct: stats.pct,
        pass: raw.pass,
        fail: raw.fail,
        durations: raw.duration,
    };
}
function finalizeRequest(raw, bucketKey, pcts, meta) {
    if (!raw) {
        return {
            ts: new Date(bucketKey).toISOString(),
            count: 0, failed: 0,
            durationAvg: 0, durationMin: 0, durationMax: 0, durationPct: {},
            durations: [],
            method: meta.method, transaction: meta.transaction, url: meta.url,
        };
    }
    const stats = computeTrendStats(raw.duration, pcts);
    return {
        ts: new Date(bucketKey).toISOString(),
        count: raw.count,
        failed: raw.failed,
        durationAvg: stats.avg,
        durationMin: stats.min,
        durationMax: stats.max,
        durationPct: stats.pct,
        durations: raw.duration,
        method: raw.method || meta.method,
        transaction: raw.transaction || meta.transaction,
        url: raw.url || meta.url,
    };
}
/**
 * Compute Trend-metric stats from a per-bucket sample array. Sorts in place
 * (caller's array is discarded after finalize so the mutation is safe and
 * saves a copy). Percentiles use LINEAR INTERPOLATION between neighboring
 * ranks — the exact algorithm k6 itself uses (TrendSink.P): the report's
 * graph traces therefore match k6's reported numbers and, crucially,
 * percentiles separate even for the small per-bucket sample counts produced by
 * low-VU runs (nearest-rank used to collapse them all onto the bucket's max).
 */
function computeTrendStats(values, pcts) {
    const pct = {};
    if (values.length === 0) {
        for (const p of pcts)
            pct[String(p)] = 0;
        return { avg: 0, min: 0, max: 0, pct };
    }
    values.sort((a, b) => a - b);
    let sum = 0;
    for (const v of values)
        sum += v;
    for (const p of pcts)
        pct[String(p)] = percentile(values, p / 100);
    return {
        avg: sum / values.length,
        min: values[0],
        max: values[values.length - 1],
        pct,
    };
}
/**
 * Linear-interpolation percentile matching k6's TrendSink.P: index =
 * p·(n−1), then interpolate between the floor/ceil samples. `sorted` must be
 * ascending. `p` is a fraction in [0,1].
 */
function percentile(sorted, p) {
    const n = sorted.length;
    if (n === 0)
        return 0;
    if (n === 1)
        return sorted[0];
    const idx = p * (n - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi)
        return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}
