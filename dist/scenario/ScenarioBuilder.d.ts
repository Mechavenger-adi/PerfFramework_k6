/**
 * ScenarioBuilder.ts
 * Phase 1 – Converts a TestPlan into k6-native options.scenarios object.
 * This is the bridge between the human-facing test plan and k6's execution model.
 */
import { TestPlan, GlobalLoadProfile } from '../types/TestPlanSchema';
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
export interface ScenarioRuntimeMetadata {
    runId: string;
    planName: string;
    environment: string;
    executionMode: TestPlan['execution_mode'];
    reportDir: string;
    generatedAt: string;
    runtime: {
        errorBehavior: string;
        thinkTimeMode: string;
        pacingEnabled: boolean;
        pacingSeconds: number;
        reporting: {
            transactionStats: string[];
            includeTransactionTable: boolean;
            includeErrorTable: boolean;
            timeseriesEnabled: boolean;
            timeseriesBucketSizeSeconds: number;
        };
    };
}
interface ScenarioPhaseEnvelope {
    mode: 'ramping-vus' | 'per-vu-iterations' | 'shared-iterations' | 'unsupported';
    startVUs?: number;
    totalIterations?: number;
    vus?: number;
    timeline?: Array<{
        endMs: number;
        vus: number;
    }>;
}
export declare class ScenarioBuilder {
    /**
     * Build a k6 options.scenarios map from a test plan.
     * Handles parallel, sequential, and hybrid execution modes.
     */
    static build(plan: TestPlan, metadata?: ScenarioRuntimeMetadata): K6ScenariosMap;
    private static buildParallel;
    private static buildSequential;
    private static buildHybrid;
    /** Sanitize journey name to a valid k6 exec function name */
    private static sanitizeExecName;
    private static buildScenarioEnv;
    private static computePhaseEnvelope;
    static computeDebugPhaseEnvelope(profile: GlobalLoadProfile): ScenarioPhaseEnvelope;
    /** Estimate total duration of a load profile in seconds */
    private static estimateTotalDurationSeconds;
    /** Parse k6 duration strings: '2m', '30s', '1h30m' */
    private static parseDurationToSeconds;
}
export {};
//# sourceMappingURL=ScenarioBuilder.d.ts.map