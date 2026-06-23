import { CiSummary, TimeSeriesFile, TransactionMetricsFile } from '../types/ReportingContracts';
interface BuildRunSummaryOptions {
    runId: string;
    planName: string;
    environment: string;
    executionStatus: number;
    summaryData: {
        metrics?: Record<string, {
            thresholds?: Record<string, {
                ok?: boolean;
            }>;
        }>;
    };
    transactions: TransactionMetricsFile;
    /**
     * Allowed transaction failure rate (percent 0–100), resolved from
     * global_sla.transaction.errorRate (preferred) or the flat global_sla.errorRate.
     * The run fails only when the observed transaction failure rate exceeds this.
     * Defaults to 0 (any transaction failure fails the run) when not configured.
     */
    transactionErrorBudget?: number;
}
export declare class RunSummaryBuilder {
    static buildCiSummary(options: BuildRunSummaryOptions): CiSummary;
    static buildEmptyTimeseries(startTime: string, bucketSizeSeconds: number): TimeSeriesFile;
    private static countThresholdFailures;
    private static collectFailedThresholdRules;
    /** k6 --summary-export: true = breached. handleSummary: { ok: false } = breached. */
    private static isThresholdBreached;
    private static asNumber;
}
export {};
