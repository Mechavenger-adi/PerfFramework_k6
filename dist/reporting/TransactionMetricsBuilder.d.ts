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
    /**
     * Approximate standard deviation from percentile data when handleSummary stddev is absent.
     * Uses normal-distribution relationship p90 = avg + 1.282*σ (or p95 = avg + 1.645*σ).
     */
    private static approximateStddev;
    private static collectGroups;
    /**
     * Collect a group's name and a last-resort iteration count from a root_group
     * node. The count (min of each check's total executions, plus nested groups)
     * is used only when the `<name>_count` Counter is missing. Pass/fail are NOT
     * derived here — they come exclusively from the `<name>_checkrate` Rate metric
     * in `buildGroupRow`. (The native-check estimation that used to live here was
     * removed: the pre-flight ScriptContractGuard rejects raw `check()`/`group()`,
     * so every runnable transaction always has the Rate metric.)
     */
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
    /**
     * Find the <name>_checkrate Rate metric for a transaction, if present.
     * Emitted by transaction() (Proposal 3): one sample per iteration carrying
     * whether that iteration observed any failure (failed k6Check or thrown
     * error). Exact per-iteration counts — no approximation.
     */
    private static findResultMetric;
    private static displayName;
    private static normalize;
    private static mapStatToMetricValueKey;
}
export {};
