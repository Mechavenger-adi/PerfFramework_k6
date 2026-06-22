import { AgentContext } from './EventContracts';
export interface TransactionMetricRow {
    journey: string;
    transaction: string;
    count: number;
    pass?: number;
    fail?: number;
    errorPct?: number;
    avg?: number;
    min?: number;
    max?: number;
    [stat: string]: string | number | boolean | undefined;
}
export interface TransactionMetricsFile {
    runId: string;
    stats: string[];
    transactions: TransactionMetricRow[];
}
export interface CiTransactionSummary {
    name: string;
    count: number;
    pass: number;
    fail: number;
    errorPct?: number;
    avg?: number;
    min?: number;
    max?: number;
    p95?: number;
    p99?: number;
}
export interface CiSummary {
    status: 'passed' | 'failed' | 'aborted';
    runId: string;
    plan: string;
    environment: string;
    thresholdFailures: number;
    /** Actual transaction failure rate (percent 0–100) — the run's pass/fail driver. */
    transactionFailureRate?: number;
    /** Allowed transaction failure rate (percent 0–100) from global_sla; run fails when exceeded. */
    transactionErrorBudget?: number;
    errorCount: number;
    warningCount: number;
    aborted: boolean;
    transactions: CiTransactionSummary[];
    gate: {
        failedRules: string[];
    };
}
/**
 * A single time-series bucket point. Fields beyond `ts` are open-ended on
 * purpose: the same shape is used for overview, per-transaction, and per-
 * agent series, and the field set has expanded over time (Proposal 5 adds
 * per-second `httpDurationP95`, `requestRate`, `httpFailedRate`, etc.; older
 * runs may only carry the legacy `avg` / `p95` / `errorRate` keys). Renderers
 * should treat any field as optional and fall back gracefully.
 *
 * Overview point keys (Wave 1):
 *   requests, requestRate, httpDurationAvg, httpDurationP90, httpDurationP95,
 *   httpDurationP99, httpDurationMin, httpDurationMax,
 *   httpFailedCount, httpFailedRate, vus, vusMax, iterations,
 *   iterationDurationAvg, iterationDurationP95, dataReceived, dataSent
 *   (plus legacy: errorRate, avgDuration, p95Duration)
 *
 * Per-transaction point keys:
 *   count, durationAvg, durationP90, durationP95, durationP99,
 *   durationMin, durationMax, pass, fail
 *   (plus legacy: avg, min, max, p90, p95, p99)
 *
 * Per-agent system point keys:
 *   cpuPercent, memoryPercent, activeAgents
 */
export interface TimeSeriesPoint {
    ts: string;
    [key: string]: string | number | number[] | undefined;
}
export interface TimeSeriesFile {
    bucketSizeSeconds: number;
    startTime: string;
    endTime: string;
    /**
     * Run-wide totals derived from the streaming JSON output. Present when
     * the parser found a usable `metrics-stream.json` (Proposal 5, Wave 1);
     * absent on legacy runs that only have summary aggregates.
     */
    totals?: {
        requests: number;
        iterations: number;
        httpFailures: number;
        dataReceived: number;
        dataSent: number;
    };
    series: {
        overview: TimeSeriesPoint[];
        transactions: Record<string, TimeSeriesPoint[]>;
        /**
         * Per-request series keyed by request name (k6 `name` tag). Each point carries
         * count/failed/durations plus method/transaction/url metadata so the report's
         * Top Requests table can be recomputed exactly for any selected time window.
         * Optional for back-compat with artifacts produced before per-request series.
         */
        requests?: Record<string, TimeSeriesPoint[]>;
        system: Record<string, TimeSeriesPoint[]>;
        events: Array<{
            ts: string;
            type: string;
            transaction?: string;
            severity: 'error' | 'warning';
        }>;
    };
}
export interface ReportBundleMeta {
    runId: string;
    plan: string;
    environment: string;
    startTime: string;
    endTime: string;
    status: 'passed' | 'failed' | 'aborted';
    bucketSizeSeconds: number;
}
export interface ReportBundleConfig {
    transactionStats: string[];
    defaultTopTransactions: number;
    timeseriesEnabled: boolean;
}
export interface ReportBundle {
    meta: ReportBundleMeta;
    config: ReportBundleConfig;
    summary: Record<string, unknown>;
    transactions: TransactionMetricsFile;
    timeseries: TimeSeriesFile;
    errors: Array<Record<string, unknown>>;
    warnings: Array<Record<string, unknown>>;
    snapshots: Array<Record<string, unknown>>;
    system: {
        agents: AgentContext[];
        [key: string]: unknown;
    };
}
