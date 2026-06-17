import { HostSnapshot } from '../execution/HostMonitor';
import { TimeseriesRuntime } from '../runtime/TimeseriesRuntime';
import { AgentContext, ErrorEvent, WarningEvent } from '../types/EventContracts';
import { TimeSeriesFile, TransactionMetricsFile } from '../types/ReportingContracts';
import { TimeseriesStreamParser } from './TimeseriesStreamParser';

interface SummaryMetric {
  values?: Record<string, number>;
  [key: string]: unknown;
}

/** Read a metric value handling both k6 handleSummary ({values:{…}}) and --summary-export (flat) formats. */
function metricVal(metric: SummaryMetric | undefined, key: string): number {
  if (!metric) return 0;
  const nested = metric.values?.[key];
  if (typeof nested === 'number') return nested;
  const flat = (metric as Record<string, unknown>)[key];
  return typeof flat === 'number' ? flat : 0;
}

interface BuildTimeseriesArtifactOptions {
  bucketSizeSeconds: number;
  startTime: string;
  endTime: string;
  summaryData: {
    metrics?: Record<string, SummaryMetric>;
  };
  transactions: TransactionMetricsFile;
  errors: ErrorEvent[];
  warnings: WarningEvent[];
  agents: AgentContext[];
  systemSnapshots: HostSnapshot[];
  /**
   * Path to the k6 streaming JSON output (one Metric/Point per line). When
   * provided AND parseable, the artifact carries per-bucket aggregates for
   * the full run — req/s, response-time percentiles, VUs, iterations, data
   * in/out, per-transaction duration & checkrate — turning the report's
   * "trend over time" panels from one-bar bar charts into proper line
   * charts (Proposal 5, Wave 1). When omitted or unreadable, falls back to
   * the legacy single-point-at-endTime behavior so existing runs and tests
   * keep working.
   */
  metricsStreamPath?: string;
  /**
   * Transaction-name manifest from `K6_PERF_TRANSACTION_NAMES`. Helps the
   * parser distinguish per-transaction Trend metrics from unrelated user-
   * named metrics. Optional — without it the parser uses the `transaction`
   * tag on `http_req_duration` samples as a fallback.
   */
  transactionNames?: string[];
  /**
   * Percentiles (numbers, e.g. [50, 90, 95, 99]) the report should plot,
   * derived from the run's reporting.transactionStats. Forwarded to the parser
   * so each duration bucket carries exactly these percentiles (p90 always
   * included). Optional — defaults to [90, 95, 99].
   */
  percentiles?: number[];
}

export class TimeseriesArtifactBuilder {
  static async build(options: BuildTimeseriesArtifactOptions): Promise<TimeSeriesFile> {
    const runtime = new TimeseriesRuntime(options.bucketSizeSeconds, options.startTime);
    const endTs = options.endTime;
    const metrics = options.summaryData.metrics ?? {};

    // ── Per-bucket time series from the k6 stream output ────────────────
    // When this succeeds, every overview / per-transaction chart in the
    // report becomes a real line chart over the run's wallclock.
    const parsed = options.metricsStreamPath
      ? await TimeseriesStreamParser.parseFile(options.metricsStreamPath, {
          bucketSizeSeconds: options.bucketSizeSeconds,
          transactionNames: options.transactionNames,
          percentiles: options.percentiles,
        }).catch(() => null)
      : null;

    if (parsed) {
      // Each overview bucket is fully aggregated by the parser, so we can
      // hand it to the runtime as a single point. The runtime's per-key
      // sum-on-insert is a no-op when called once per (key, ts).
      for (const b of parsed.overview) {
        // Spread the configured duration percentiles into flat per-series keys
        // (httpDurationP90, httpDurationP50, …) so the report can pull each
        // percentile line by name. Driven by reporting.transactionStats.
        const pctKeys: Record<string, number> = {};
        for (const [k, v] of Object.entries(b.httpDurationPct)) pctKeys['httpDurationP' + k] = v;
        for (const [k, v] of Object.entries(b.iterationDurationPct)) pctKeys['iterationDurationP' + k] = v;
        runtime.addOverviewPoint(b.ts, {
          requests: b.requests,
          requestRate: b.requestRate,
          httpDurationAvg: b.httpDurationAvg,
          httpDurationMin: b.httpDurationMin,
          httpDurationMax: b.httpDurationMax,
          httpFailedCount: b.httpFailedCount,
          httpFailedRate: b.httpFailedRate,
          vus: b.vus,
          vusMax: b.vusMax,
          iterations: b.iterations,
          iterationDurationAvg: b.iterationDurationAvg,
          dataReceived: b.dataReceived,
          dataSent: b.dataSent,
          ...pctKeys,
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
          p95Duration: b.httpDurationPct['95'] ?? b.httpDurationPct['90'] ?? b.httpDurationAvg,
        });
      }
      for (const [name, buckets] of Object.entries(parsed.transactions)) {
        for (const b of buckets) {
          // Flatten the configured percentiles into durationP90, durationP50, …
          const pctKeys: Record<string, number> = {};
          for (const [k, v] of Object.entries(b.durationPct)) pctKeys['durationP' + k] = v;
          runtime.addTransactionPoint(name, b.ts, {
            count: b.count,
            durationAvg: b.durationAvg,
            durationMin: b.durationMin,
            durationMax: b.durationMax,
            pass: b.pass,
            fail: b.fail,
            // Raw samples for EXACT sub-range stats in the report (no approximation).
            durations: b.durations ?? [],
            // Compatibility keys for older renderers / tests.
            avg: b.durationAvg,
            min: b.durationMin,
            max: b.durationMax,
            ...pctKeys,
          });
        }
      }
      for (const [name, buckets] of Object.entries(parsed.requests)) {
        for (const b of buckets) {
          const pctKeys: Record<string, number> = {};
          for (const [k, v] of Object.entries(b.durationPct)) pctKeys['durationP' + k] = v;
          runtime.addRequestPoint(name, b.ts, {
            count: b.count,
            failed: b.failed,
            durationAvg: b.durationAvg,
            durationMin: b.durationMin,
            durationMax: b.durationMax,
            // Raw samples for EXACT sub-range stats in the report (no approximation).
            durations: b.durations ?? [],
            // Constant per-request metadata for the Top Requests table.
            method: b.method,
            transaction: b.transaction,
            url: b.url,
            ...pctKeys,
          });
        }
      }
    } else {
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
          pass: row.pass ?? 0,
          fail: row.fail ?? 0,
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

  private static asNumber(value: string | number | boolean | undefined): number {
    return typeof value === 'number' ? value : 0;
  }
}
