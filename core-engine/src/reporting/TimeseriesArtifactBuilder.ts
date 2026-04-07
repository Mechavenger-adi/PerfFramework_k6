import { TimeseriesRuntime } from '../runtime/TimeseriesRuntime';
import { TimeSeriesFile, TransactionMetricsFile } from '../types/ReportingContracts';
import { AgentContext, ErrorEvent, WarningEvent } from '../types/EventContracts';
import { HostSnapshot } from '../execution/HostMonitor';

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
}

export class TimeseriesArtifactBuilder {
  static build(options: BuildTimeseriesArtifactOptions): TimeSeriesFile {
    const runtime = new TimeseriesRuntime(options.bucketSizeSeconds, options.startTime);
    const endTs = options.endTime;
    const metrics = options.summaryData.metrics ?? {};

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

    for (const error of options.errors) {
      runtime.addEvent(error.ts, error.type, 'error', error.transaction);
    }

    for (const warning of options.warnings) {
      runtime.addEvent(warning.ts, warning.type, 'warning', warning.transaction);
    }

    return runtime.build(endTs);
  }

  private static asNumber(value: string | number | undefined): number {
    return typeof value === 'number' ? value : 0;
  }
}
