"use strict";
/**
 * WorkloadModels.ts
 * Phase 1 – Pure functions that translate high-level workload model names
 * into k6-native executor configurations.
 *
 * These are building blocks — ScenarioBuilder and ExecutorFactory use them.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLoadProfile = buildLoadProfile;
exports.buildStressProfile = buildStressProfile;
exports.buildSoakProfile = buildSoakProfile;
exports.buildSpikeProfile = buildSpikeProfile;
exports.buildIterationProfile = buildIterationProfile;
exports.toK6ExecutorConfig = toK6ExecutorConfig;
// ---------------------------------------------
// Factory Functions
// ---------------------------------------------
/** Build a standard load test: ramp-up -> steady -> ramp-down */
function buildLoadProfile(options) {
    return {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: [
            { duration: options.rampUp, target: options.targetVUs },
            { duration: options.steady, target: options.targetVUs },
            { duration: options.rampDown, target: 0 },
        ],
    };
}
/** Build a stress test: aggressive ramp-up, short steady, ramp-down */
function buildStressProfile(options) {
    return buildLoadProfile({
        rampUp: options.rampUp ?? '2m',
        steady: options.steady ?? '5m',
        rampDown: options.rampDown ?? '2m',
        targetVUs: options.targetVUs,
    });
}
/** Build a soak test: low steady load for an extended duration */
function buildSoakProfile(options) {
    return buildLoadProfile({
        rampUp: options.rampUp ?? '5m',
        steady: options.duration,
        rampDown: options.rampDown ?? '5m',
        targetVUs: options.targetVUs,
    });
}
/** Build a spike test: sudden surge then back to baseline */
function buildSpikeProfile(options) {
    return {
        executor: 'ramping-vus',
        startVUs: options.baselineVUs,
        stages: [
            { duration: '30s', target: options.baselineVUs },
            { duration: '10s', target: options.spikeVUs },
            { duration: options.spikeDuration ?? '1m', target: options.spikeVUs },
            { duration: '10s', target: options.baselineVUs },
            { duration: '30s', target: options.baselineVUs },
        ],
    };
}
/** Build a fixed-iteration profile */
function buildIterationProfile(options) {
    return {
        executor: 'shared-iterations',
        vus: options.vus,
        iterations: options.iterations,
    };
}
/** Translate a GlobalLoadProfile into a k6 executor config block */
function toK6ExecutorConfig(profile) {
    return {
        executor: profile.executor,
        startVUs: profile.startVUs,
        stages: profile.stages,
        vus: profile.vus,
        duration: profile.duration,
        iterations: profile.iterations,
    };
}
//# sourceMappingURL=WorkloadModels.js.map