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
//# sourceMappingURL=RunSummaryBuilder.d.ts.map