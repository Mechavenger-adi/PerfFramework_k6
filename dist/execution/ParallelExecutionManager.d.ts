/**
 * ParallelExecutionManager.ts
 * Phase 1 – Orchestrates execution mode, wires up VU allocations,
 * and produces the final k6 options object ready for injection.
 */
import { K6ScenariosMap, ScenarioRuntimeMetadata } from '../scenario/ScenarioBuilder';
import { TestPlan } from '../types/TestPlanSchema';
export interface K6Options {
    scenarios: K6ScenariosMap;
    thresholds?: Record<string, string[]>;
    summaryTrendStats?: string[];
    tags?: Record<string, string>;
    [key: string]: unknown;
}
export declare class ParallelExecutionManager {
    /**
     * Resolve the full k6 options object from a test plan.
     * Handles VU allocation for parallel weighted journeys.
     */
    static resolve(plan: TestPlan, runtimeMetadata?: ScenarioRuntimeMetadata): K6Options;
    /**
     * Extract the peak VU count from the global load profile.
     * Used for weight-based proportional distribution.
     */
    private static extractMaxVUs;
    /**
     * Scale a load profile's VU count to the allocated amount.
     * Preserves stage ratios for ramping profiles.
     */
    private static scaleProfileToVUs;
    /**
     * Build the summaryTrendStats array for k6 options.
     * Merges the k6 defaults (avg, min, med, max, p(90), p(95)) with any
     * additional percentiles configured in runtime reporting.transactionStats.
     * Without this, k6 wouldn't compute custom percentiles like p(97) or p(99).
     */
    private static buildSummaryTrendStats;
}
//# sourceMappingURL=ParallelExecutionManager.d.ts.map