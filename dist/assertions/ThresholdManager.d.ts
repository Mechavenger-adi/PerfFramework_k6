import { TestPlan } from '../types/TestPlanSchema';
export declare class ThresholdManager {
    /**
     * Translates SLA definitions from the test plan into k6-native thresholds.
     *
     * Scope + precedence (most specific wins, per individual percentile/errorRate):
     *   • REQUEST-level    journey_slas[j]  >  global_sla.request  >  legacy flat global_sla
     *                      → http_req_duration[{scenario:j}] / http_req_failed[...]
     *   • TRANSACTION-level transaction_slas[t]  >  global_sla.transaction
     *                      → <txn> Trend / <txn>_checkrate, applied to EVERY transaction.
     *
     * `journeyTransactionNames` (journey → transaction names, extracted from the
     * scripts) is required for the global_sla.transaction default to reach every
     * transaction; without it only explicitly-named transaction_slas get thresholds.
     */
    static apply(testPlan: TestPlan, journeyTransactionNames?: Record<string, string[]>): Record<string, string[]>;
    /** Flat (non-nested) keys of a global SLA — the legacy request-level shorthand. */
    private static flatGlobalKeys;
    /** Merge two SLA definitions; `override` keys win over `base` keys, per key. */
    private static mergeSla;
    /**
     * Build k6 duration threshold rules from an SLA definition.
     * Dynamically handles any percentile key (p50, p75, p90, p95, p99, p99.9, etc.).
     */
    private static buildDurationRules;
    /**
     * Collect all percentile values referenced across all SLA definitions in the plan.
     * Returns k6-format percentile strings like 'p(90)', 'p(99)', 'p(99.9)'.
     */
    static collectPercentiles(testPlan: TestPlan): string[];
}
