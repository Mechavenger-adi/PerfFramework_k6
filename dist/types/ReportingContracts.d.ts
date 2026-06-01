import { AgentContext } from './EventContracts';
export interface TransactionMetricRow {
    journey: string;
    transaction: string;
    count: number;
    pass: number;
    fail: number;
    errorPct?: number;
    avg?: number;
    min?: number;
    max?: number;
    /**
     * True when pass/fail were derived from raw k6 check aggregates (legacy
     * fallback) instead of the per-iteration `<name>_checkrate` Rate metric.
     * Estimates can both under-count (failures span multiple checks) and
     * over-count (a single check runs more than once per iteration); they are
     * shown only when no Rate metric is available. See Proposal 3 in
     * `ai_context/design-proposals.md`.
     */
    estimated?: boolean;
    [stat: string]: string | number | boolean | undefined;
}
export interface TransactionMetricsFile {
    runId: string;
    stats: string[];
    transactions: TransactionMetricRow[];
    /**
     * True when at least one row in `transactions` was produced via the legacy
     * aggregation fallback (`estimated: true`). Lets downstream consumers emit
     * a single run-level warning without iterating the row list.
     */
    hasEstimatedRows?: boolean;
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
    errorCount: number;
    warningCount: number;
    aborted: boolean;
    transactions: CiTransactionSummary[];
    gate: {
        failedRules: string[];
    };
}
export interface TimeSeriesPoint {
    ts: string;
    [key: string]: string | number | undefined;
}
export interface TimeSeriesFile {
    bucketSizeSeconds: number;
    startTime: string;
    endTime: string;
    series: {
        overview: TimeSeriesPoint[];
        transactions: Record<string, TimeSeriesPoint[]>;
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
