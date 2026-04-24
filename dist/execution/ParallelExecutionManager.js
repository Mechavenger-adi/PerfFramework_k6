"use strict";
/**
 * ParallelExecutionManager.ts
 * Phase 1 – Orchestrates execution mode, wires up VU allocations,
 * and produces the final k6 options object ready for injection.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParallelExecutionManager = void 0;
const ThresholdManager_1 = require("../assertions/ThresholdManager");
const ScenarioBuilder_1 = require("../scenario/ScenarioBuilder");
const JourneyAllocator_1 = require("./JourneyAllocator");
class ParallelExecutionManager {
    /**
     * Resolve the full k6 options object from a test plan.
     * Handles VU allocation for parallel weighted journeys.
     */
    static resolve(plan, runtimeMetadata) {
        const summaryTrendStats = this.buildSummaryTrendStats(runtimeMetadata);
        // For parallel execution with weights, we recalculate per-journey VUs
        if (plan.execution_mode === 'parallel') {
            const maxVUs = this.extractMaxVUs(plan);
            // If journeys have weights, distribute VUs proportionally
            const hasWeights = plan.user_journeys.some((j) => j.weight !== undefined);
            if (hasWeights && maxVUs > 0) {
                const allocations = JourneyAllocator_1.JourneyAllocator.allocate(plan.user_journeys, maxVUs);
                JourneyAllocator_1.JourneyAllocator.printTable(allocations);
                // Build a modified plan with explicit per-journey VU counts applied to their profile
                const modifiedPlan = {
                    ...plan,
                    user_journeys: plan.user_journeys.map((journey) => {
                        const allocation = allocations.find((a) => a.journeyName === journey.name);
                        if (!allocation)
                            return journey;
                        const profile = journey.loadProfile ?? plan.global_load_profile;
                        return {
                            ...journey,
                            loadProfile: this.scaleProfileToVUs(profile, allocation.allocatedVUs),
                        };
                    }),
                };
                return {
                    noCookiesReset: plan.noCookiesReset !== false,
                    summaryTrendStats,
                    scenarios: ScenarioBuilder_1.ScenarioBuilder.build(modifiedPlan, runtimeMetadata),
                    thresholds: ThresholdManager_1.ThresholdManager.apply(modifiedPlan)
                };
            }
        }
        return {
            noCookiesReset: plan.noCookiesReset !== false,
            summaryTrendStats,
            scenarios: ScenarioBuilder_1.ScenarioBuilder.build(plan, runtimeMetadata),
            thresholds: ThresholdManager_1.ThresholdManager.apply(plan)
        };
    }
    /**
     * Extract the peak VU count from the global load profile.
     * Used for weight-based proportional distribution.
     */
    static extractMaxVUs(plan) {
        const profile = plan.global_load_profile;
        if (profile.stages && profile.stages.length > 0) {
            return Math.max(...profile.stages.map((s) => s.target));
        }
        return profile.vus ?? 0;
    }
    /**
     * Scale a load profile's VU count to the allocated amount.
     * Preserves stage ratios for ramping profiles.
     */
    static scaleProfileToVUs(profile, allocatedVUs) {
        if (profile.stages && profile.stages.length > 0) {
            const peak = Math.max(...profile.stages.map((s) => s.target));
            if (peak === 0)
                return profile;
            const ratio = allocatedVUs / peak;
            return {
                ...profile,
                startVUs: Math.max(0, Math.round((profile.startVUs ?? 0) * ratio)),
                stages: profile.stages.map((stage) => ({
                    ...stage,
                    target: Math.max(stage.target === 0 ? 0 : 1, Math.round(stage.target * ratio)),
                })),
            };
        }
        return { ...profile, vus: allocatedVUs };
    }
    /**
     * Build the summaryTrendStats array for k6 options.
     * Merges the k6 defaults (avg, min, med, max, p(90), p(95)) with any
     * additional percentiles configured in runtime reporting.transactionStats.
     * Without this, k6 wouldn't compute custom percentiles like p(97) or p(99).
     */
    static buildSummaryTrendStats(runtimeMetadata) {
        const k6Defaults = ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'];
        const configured = runtimeMetadata?.runtime?.reporting?.transactionStats ?? [];
        const extraPercentiles = configured
            .map((s) => {
            // Match p(N) or pN notation
            const match = s.trim().toLowerCase().match(/^p\(?(\d+(?:\.\d+)?)\)?$/);
            return match ? `p(${match[1]})` : null;
        })
            .filter((p) => p !== null);
        const merged = new Set([...k6Defaults, ...extraPercentiles]);
        return [...merged];
    }
}
exports.ParallelExecutionManager = ParallelExecutionManager;
//# sourceMappingURL=ParallelExecutionManager.js.map