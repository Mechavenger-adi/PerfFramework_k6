/**
 * ScenarioBuilder.ts
 * Phase 1 – Converts a TestPlan into k6-native options.scenarios object.
 * This is the bridge between the human-facing test plan and k6's execution model.
 */
import { TestPlan, GlobalLoadProfile } from '../types/TestPlanSchema.lifecycle-prototype';
export interface PhaseStage {
    endMs: number;
    vus: number;
}
export interface VUPhasesConfig {
    mode: 'ramping-vus' | 'per-vu-iterations' | 'unsupported';
    startVUs: number;
    peakVUs: number;
    totalIterations: number;
    timeline: PhaseStage[];
}
/** k6-native scenario definition (what goes into options.scenarios) */
export interface K6ScenarioDefinition {
    executor: string;
    exec?: string;
    startVUs?: number;
    stages?: Array<{
        duration: string;
        target: number;
    }>;
    vus?: number;
    duration?: string;
    iterations?: number;
    startTime?: string;
    tags?: Record<string, string>;
    env?: Record<string, string>;
}
export type K6ScenariosMap = Record<string, K6ScenarioDefinition>;
export declare class ScenarioBuilder {
    /**
     * Build a k6 options.scenarios map from a test plan.
     * Handles parallel, sequential, and hybrid execution modes.
     */
    static build(plan: TestPlan): K6ScenariosMap;
    private static buildParallel;
    private static buildSequential;
    private static buildHybrid;
    /** Sanitize journey name to a valid k6 exec function name */
    private static sanitizeExecName;
    private static buildLifecycleEnv;
    static computePhases(profile: GlobalLoadProfile): VUPhasesConfig;
    /** Estimate total duration of a load profile in seconds */
    private static estimateTotalDurationSeconds;
    /** Parse k6 duration strings: '2m', '30s', '1h30m' */
    private static parseDurationToSeconds;
    private static parseDurationToMs;
}
//# sourceMappingURL=ScenarioBuilder.lifecycle-prototype.d.ts.map