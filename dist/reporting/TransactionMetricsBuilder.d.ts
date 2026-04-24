import { TransactionMetricsFile } from '../types/ReportingContracts';
/**
 * k6 --summary-export metric shape:
 * Trend  → { avg, min, max, med, "p(90)", "p(95)", thresholds? }
 * Rate   → { value, passes, fails, thresholds? }
 * Counter→ { count, rate, thresholds? }
 */
interface SummaryMetric {
    [key: string]: unknown;
    thresholds?: Record<string, {
        ok?: boolean;
    }>;
}
interface SummaryCheck {
    name?: string;
    passes?: number;
    fails?: number;
}
interface SummaryGroup {
    name?: string;
    groups?: Record<string, SummaryGroup> | SummaryGroup[];
    checks?: Record<string, SummaryCheck> | SummaryCheck[];
}
interface BuildTransactionMetricsOptions {
    runId: string;
    stats: string[];
    journeyName: string;
    summaryData: {
        metrics?: Record<string, SummaryMetric>;
        root_group?: SummaryGroup;
    };
}
export declare class TransactionMetricsBuilder {
    private static readonly BUILT_IN_METRICS;
    static build(options: BuildTransactionMetricsOptions): TransactionMetricsFile;
    private static buildGroupRow;
    private static buildMetricOnlyRow;
    private static applyConfiguredStats;
    private static collectGroups;
    private static aggregateGroup;
    /** Normalize k6 summary groups (object-map or array) to array. */
    private static toGroupArray;
    /** Normalize k6 summary checks (object-map or array) to array. */
    private static toCheckArray;
    /** Detect Trend metrics by presence of 'avg' (only Trend metrics have it). */
    /** Detect Trend metrics: handleSummary has type:'trend', --summary-export has flat avg. */
    private static isTrend;
    /** Read a metric value from either handleSummary (values.key) or --summary-export (flat key). */
    private static metricValue;
    private static isTransactionMetric;
    private static findMatchingMetric;
    /** Find <name>_count Counter metric and return its count value. */
    private static findCounterValue;
    private static displayName;
    private static normalize;
    private static mapStatToMetricValueKey;
}
export {};
//# sourceMappingURL=TransactionMetricsBuilder.d.ts.map