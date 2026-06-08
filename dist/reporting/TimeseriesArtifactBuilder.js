"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeseriesArtifactBuilder = void 0;
const TimeseriesRuntime_1 = require("../runtime/TimeseriesRuntime");
const TimeseriesStreamParser_1 = require("./TimeseriesStreamParser");
/** Read a metric value handling both k6 handleSummary ({values:{…}}) and --summary-export (flat) formats. */
function metricVal(metric, key) {
    if (!metric)
        return 0;
    const nested = metric.values?.[key];
    if (typeof nested === 'number')
        return nested;
    const flat = metric[key];
    return typeof flat === 'number' ? flat : 0;
}
class TimeseriesArtifactBuilder {
    static async build(options) {
        const runtime = new TimeseriesRuntime_1.TimeseriesRuntime(options.bucketSizeSeconds, options.startTime);
        const endTs = options.endTime;
        const metrics = options.summaryData.metrics ?? {};
        // ── Per-bucket time series from the k6 stream output ────────────────
        // When this succeeds, every overview / per-transaction chart in the
        // report becomes a real line chart over the run's wallclock.
        const parsed = options.metricsStreamPath
            ? await TimeseriesStreamParser_1.TimeseriesStreamParser.parseFile(options.metricsStreamPath, {
                bucketSizeSeconds: options.bucketSizeSeconds,
                transactionNames: options.transactionNames,
            }).catch(() => null)
            : null;
        if (parsed) {
            // Each overview bucket is fully aggregated by the parser, so we can
            // hand it to the runtime as a single point. The runtime's per-key
            // sum-on-insert is a no-op when called once per (key, ts).
            for (const b of parsed.overview) {
                runtime.addOverviewPoint(b.ts, {
                    requests: b.requests,
                    requestRate: b.requestRate,
                    httpDurationAvg: b.httpDurationAvg,
                    httpDurationP90: b.httpDurationP90,
                    httpDurationP95: b.httpDurationP95,
                    httpDurationP99: b.httpDurationP99,
                    httpDurationMin: b.httpDurationMin,
                    httpDurationMax: b.httpDurationMax,
                    httpFailedCount: b.httpFailedCount,
                    httpFailedRate: b.httpFailedRate,
                    vus: b.vus,
                    vusMax: b.vusMax,
                    iterations: b.iterations,
                    iterationDurationAvg: b.iterationDurationAvg,
                    iterationDurationP90: b.iterationDurationP90,
                    iterationDurationP95: b.iterationDurationP95,
                    iterationDurationP99: b.iterationDurationP99,
                    dataReceived: b.dataReceived,
                    dataSent: b.dataSent,
                    // HTTP request-timing breakdown — six phases × four percentile
                    // aggregates each. Flattened with prefixed keys so each lives in
                    // its own TimeSeriesPoint slot and chart renderers can pull a
                    // single series by name (e.g. `httpReqWaitingP95`). Mirrors what
                    // k6's web-dashboard plots in its Timings tab.
                    httpReqWaitingAvg: b.httpReqWaiting.avg,
                    httpReqWaitingP90: b.httpReqWaiting.p90,
                    httpReqWaitingP95: b.httpReqWaiting.p95,
                    httpReqWaitingP99: b.httpReqWaiting.p99,
                    httpReqTlsHandshakingAvg: b.httpReqTlsHandshaking.avg,
                    httpReqTlsHandshakingP90: b.httpReqTlsHandshaking.p90,
                    httpReqTlsHandshakingP95: b.httpReqTlsHandshaking.p95,
                    httpReqTlsHandshakingP99: b.httpReqTlsHandshaking.p99,
                    httpReqSendingAvg: b.httpReqSending.avg,
                    httpReqSendingP90: b.httpReqSending.p90,
                    httpReqSendingP95: b.httpReqSending.p95,
                    httpReqSendingP99: b.httpReqSending.p99,
                    httpReqConnectingAvg: b.httpReqConnecting.avg,
                    httpReqConnectingP90: b.httpReqConnecting.p90,
                    httpReqConnectingP95: b.httpReqConnecting.p95,
                    httpReqConnectingP99: b.httpReqConnecting.p99,
                    httpReqReceivingAvg: b.httpReqReceiving.avg,
                    httpReqReceivingP90: b.httpReqReceiving.p90,
                    httpReqReceivingP95: b.httpReqReceiving.p95,
                    httpReqReceivingP99: b.httpReqReceiving.p99,
                    httpReqBlockedAvg: b.httpReqBlocked.avg,
                    httpReqBlockedP90: b.httpReqBlocked.p90,
                    httpReqBlockedP95: b.httpReqBlocked.p95,
                    httpReqBlockedP99: b.httpReqBlocked.p99,
                    // Compatibility keys consumed by the older "Load Overview" KV
                    // panel — keeps existing renderers/tests happy until they migrate
                    // to the richer fields above.
                    errorRate: b.httpFailedRate,
                    avgDuration: b.httpDurationAvg,
                    p95Duration: b.httpDurationP95,
                });
            }
            for (const [name, buckets] of Object.entries(parsed.transactions)) {
                for (const b of buckets) {
                    runtime.addTransactionPoint(name, b.ts, {
                        count: b.count,
                        durationAvg: b.durationAvg,
                        durationP90: b.durationP90,
                        durationP95: b.durationP95,
                        durationP99: b.durationP99,
                        durationMin: b.durationMin,
                        durationMax: b.durationMax,
                        pass: b.pass,
                        fail: b.fail,
                        // Compatibility keys for older renderers / tests.
                        avg: b.durationAvg,
                        min: b.durationMin,
                        max: b.durationMax,
                        p90: b.durationP90,
                        p95: b.durationP95,
                        p99: b.durationP99,
                    });
                }
            }
        }
        else {
            // Legacy fallback — single endTime point per metric. Preserves the
            // pre-Wave-1 behavior for runs where the stream file is missing.
            runtime.addOverviewPoint(endTs, {
                requests: metricVal(metrics.http_reqs, 'count'),
                iterations: metricVal(metrics.framework_iterations, 'count') || metricVal(metrics.iterations, 'count'),
                errorRate: metricVal(metrics.http_req_failed, 'rate') || metricVal(metrics.http_req_failed, 'value'),
                avgDuration: metricVal(metrics.http_req_duration, 'avg'),
                p95Duration: metricVal(metrics.http_req_duration, 'p(95)'),
                vus: metricVal(metrics.vus, 'value'),
                vusMax: metricVal(metrics.vus_max, 'value'),
            });
            for (const row of options.transactions.transactions) {
                runtime.addTransactionPoint(row.transaction, endTs, {
                    count: row.count,
                    pass: row.pass,
                    fail: row.fail,
                    avg: row.avg ?? this.asNumber(row['avg']),
                    min: row.min ?? this.asNumber(row['min']),
                    max: row.max ?? this.asNumber(row['max']),
                    p90: this.asNumber(row['p(90)'] ?? row['p90']),
                    p95: this.asNumber(row['p(95)'] ?? row['p95']),
                    p99: this.asNumber(row['p(99)'] ?? row['p99']),
                });
            }
        }
        // ── System series ───────────────────────────────────────────────
        // Per-agent CPU% / memory% over time. Buckets follow the same window
        // size as the overview/transaction series so the System tab's line
        // chart aligns on the X axis with the rest of the report.
        const agentName = options.agents[0]?.host ?? 'local-agent';
        if (options.agents.length > 0) {
            runtime.addSystemPoint(agentName, endTs, {
                activeAgents: options.agents.length,
            });
        }
        for (const snapshot of options.systemSnapshots) {
            runtime.addSystemPoint(snapshot.agent.host ?? agentName, snapshot.ts, {
                cpuPercent: snapshot.cpuPercent,
                memoryPercent: snapshot.memoryPercent,
            });
        }
        // ── Event markers ───────────────────────────────────────────────
        for (const error of options.errors) {
            runtime.addEvent(error.ts, error.type, 'error', error.transaction);
        }
        for (const warning of options.warnings) {
            runtime.addEvent(warning.ts, warning.type, 'warning', warning.transaction);
        }
        const file = runtime.build(endTs);
        // Wave 1 enrichment: expose run-wide totals on the artifact so the
        // Summary tab can show them without re-summing every bucket. Only
        // populated when the parser produced data — legacy runs leave it
        // undefined and the renderer falls back to summary-aggregate values.
        if (parsed) {
            file.totals = parsed.totals;
        }
        return file;
    }
    static asNumber(value) {
        return typeof value === 'number' ? value : 0;
    }
}
exports.TimeseriesArtifactBuilder = TimeseriesArtifactBuilder;
