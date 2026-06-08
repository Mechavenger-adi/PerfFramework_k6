import { HostSnapshot } from '../execution/HostMonitor';
import { AgentContext, ErrorEvent, WarningEvent } from '../types/EventContracts';
import { TimeSeriesFile, TransactionMetricsFile } from '../types/ReportingContracts';
interface SummaryMetric {
    values?: Record<string, number>;
    [key: string]: unknown;
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
}
export declare class TimeseriesArtifactBuilder {
    static build(options: BuildTimeseriesArtifactOptions): Promise<TimeSeriesFile>;
    private static asNumber;
}
export {};
