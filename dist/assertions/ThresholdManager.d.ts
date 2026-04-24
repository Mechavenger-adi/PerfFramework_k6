import { TestPlan } from '../types/TestPlanSchema';
export declare class ThresholdManager {
    /**
     * Translates SLA definitions from the test plan into k6-native thresholds.
     * Supports global, per-journey, and per-transaction SLAs.
     * Percentile keys are dynamic — any key matching /^p\d+(\.\d+)?$/ is accepted.
     */
    static apply(testPlan: TestPlan): Record<string, string[]>;
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
//# sourceMappingURL=ThresholdManager.d.ts.map