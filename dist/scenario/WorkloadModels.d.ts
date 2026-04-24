/**
 * WorkloadModels.ts
 * Phase 1 – Pure functions that translate high-level workload model names
 * into k6-native executor configurations.
 *
 * These are building blocks — ScenarioBuilder and ExecutorFactory use them.
 */
import { GlobalLoadProfile, LoadStage } from '../types/TestPlanSchema';
/** k6-native scenario executor config (partial, used for options.scenarios) */
export interface K6ExecutorConfig {
    executor: string;
    startVUs?: number;
    stages?: LoadStage[];
    vus?: number;
    duration?: string;
    iterations?: number;
    exec?: string;
    tags?: Record<string, string>;
    env?: Record<string, string>;
}
/** Build a standard load test: ramp-up -> steady -> ramp-down */
export declare function buildLoadProfile(options: {
    rampUp: string;
    steady: string;
    rampDown: string;
    targetVUs: number;
}): GlobalLoadProfile;
/** Build a stress test: aggressive ramp-up, short steady, ramp-down */
export declare function buildStressProfile(options: {
    targetVUs: number;
    rampUp?: string;
    steady?: string;
    rampDown?: string;
}): GlobalLoadProfile;
/** Build a soak test: low steady load for an extended duration */
export declare function buildSoakProfile(options: {
    targetVUs: number;
    duration: string;
    rampUp?: string;
    rampDown?: string;
}): GlobalLoadProfile;
/** Build a spike test: sudden surge then back to baseline */
export declare function buildSpikeProfile(options: {
    baselineVUs: number;
    spikeVUs: number;
    spikeDuration?: string;
}): GlobalLoadProfile;
/** Build a fixed-iteration profile */
export declare function buildIterationProfile(options: {
    vus: number;
    iterations: number;
}): GlobalLoadProfile;
/** Translate a GlobalLoadProfile into a k6 executor config block */
export declare function toK6ExecutorConfig(profile: GlobalLoadProfile): K6ExecutorConfig;
//# sourceMappingURL=WorkloadModels.d.ts.map