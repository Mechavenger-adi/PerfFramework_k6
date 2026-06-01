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
     * Aggregate native k6 `check()` totals for a single root_group node.
     *
     * IMPORTANT — what these numbers are:
     *   k6 records per-check `{ passes, fails }` aggregates under the group the
     *   check executed in. These are NATIVE k6 check counts, NOT per-iteration
     *   transaction outcomes. A single transaction iteration may evaluate the
     *   same check multiple times (multi-request transactions, retry loops), so
     *   summed `passes`/`fails` don't directly map to "iterations passed/failed".
     *
     * This function feeds the legacy aggregation fallback used by `buildGroupRow`
     * when the per-iteration `<name>_checkrate` Rate metric is absent (older
     * runs or scripts that don't use `transaction()`). In that fallback path:
     *   - `count`            ← min(check.passes + check.fails) per check, summed
     *                          across nested groups (rough lower bound on
     *                          transaction iterations when no Counter exists)
     *   - `pass`             ← min(check.passes), summed across nested groups
     *                          (legacy "min of passes" semantic — kept only for
     *                          diagnostic interest; superseded by maxCheckFails)
     *   - `maxCheckFails`    ← max single check's `fails` value across this group
     *                          and descendants. The fallback uses this as a
     *                          best-effort estimate of failed iterations:
     *                          `fail = min(count, maxCheckFails)`. NOT a tight
     *                          bound — it under-counts when failures spread
     *                          across multiple checks and can over-cap to
     *                          `count` when a single check runs multiple times
     *                          per iteration. Best we can do without the Rate
     *                          metric; rows using this path are flagged.
     *
     * The exact, non-estimated values come from `<name>_checkrate` (a Rate
     * metric pushed exactly once per transaction iteration by `transaction()`);
     * see Proposal 3 in `ai_context/design-proposals.md`.
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
