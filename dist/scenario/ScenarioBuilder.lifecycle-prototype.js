"use strict";
/**
 * ScenarioBuilder.ts
 * Phase 1 – Converts a TestPlan into k6-native options.scenarios object.
 * This is the bridge between the human-facing test plan and k6's execution model.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenarioBuilder = void 0;
const ExecutorFactory_1 = require("./ExecutorFactory");
class ScenarioBuilder {
    /**
     * Build a k6 options.scenarios map from a test plan.
     * Handles parallel, sequential, and hybrid execution modes.
     */
    static build(plan) {
        switch (plan.execution_mode) {
            case 'parallel':
                return this.buildParallel(plan);
            case 'sequential':
                return this.buildSequential(plan);
            case 'hybrid':
                return this.buildHybrid(plan);
            default:
                throw new Error(`[ScenarioBuilder] Unknown execution_mode: '${plan.execution_mode}'`);
        }
    }
    // ---------------------------------------------
    // Parallel Mode – all journeys run concurrently
    // ---------------------------------------------
    static buildParallel(plan) {
        const scenarios = {};
        for (const journey of plan.user_journeys) {
            const profile = journey.loadProfile ?? plan.global_load_profile;
            const executorConfig = ExecutorFactory_1.ExecutorFactory.build(profile);
            scenarios[journey.name] = {
                ...executorConfig,
                exec: this.sanitizeExecName(journey.name),
                tags: { journey: journey.name, ...journey.tags },
                env: this.buildLifecycleEnv(profile, journey.lifecycle),
            };
        }
        return scenarios;
    }
    // ---------------------------------------------
    // Sequential Mode – journeys run one after another
    // Uses startTime offsets calculated from cumulative stage durations
    // ---------------------------------------------
    static buildSequential(plan) {
        const scenarios = {};
        let offsetSeconds = 0;
        for (const journey of plan.user_journeys) {
            const profile = journey.loadProfile ?? plan.global_load_profile;
            const executorConfig = ExecutorFactory_1.ExecutorFactory.build(profile);
            const durationSecs = this.estimateTotalDurationSeconds(profile);
            scenarios[journey.name] = {
                ...executorConfig,
                exec: this.sanitizeExecName(journey.name),
                tags: { journey: journey.name, ...journey.tags },
                env: this.buildLifecycleEnv(profile, journey.lifecycle),
                // k6 uses string startTime in sequential scenarios
                ...(offsetSeconds > 0 && { startTime: `${offsetSeconds}s` }),
            };
            offsetSeconds += durationSecs;
        }
        return scenarios;
    }
    // ---------------------------------------------
    // Hybrid Mode – groups of journeys with mixed modes
    // ---------------------------------------------
    static buildHybrid(plan) {
        if (!plan.hybrid_groups || plan.hybrid_groups.length === 0) {
            throw new Error('[ScenarioBuilder] Hybrid mode requires hybrid_groups to be defined.');
        }
        const journeyMap = new Map(plan.user_journeys.map((j) => [j.name, j]));
        const scenarios = {};
        let groupOffset = 0;
        for (const group of plan.hybrid_groups) {
            if (group.mode === 'parallel') {
                for (const name of group.journeys) {
                    const journey = journeyMap.get(name);
                    if (!journey)
                        throw new Error(`[ScenarioBuilder] Journey '${name}' not found in hybrid group.`);
                    const profile = journey.loadProfile ?? plan.global_load_profile;
                    const executorConfig = ExecutorFactory_1.ExecutorFactory.build(profile);
                    scenarios[name] = {
                        ...executorConfig,
                        exec: this.sanitizeExecName(name),
                        tags: { journey: name, ...journey.tags },
                        env: this.buildLifecycleEnv(profile, journey.lifecycle),
                        ...(groupOffset > 0 && { startTime: `${groupOffset}s` }),
                    };
                }
                // Advance offset by the longest journey in this parallel group
                const maxDuration = Math.max(...group.journeys.map((name) => {
                    const journey = journeyMap.get(name);
                    const profile = journey?.loadProfile ?? plan.global_load_profile;
                    return this.estimateTotalDurationSeconds(profile);
                }));
                groupOffset += maxDuration;
            }
            else {
                // sequential sub-group
                for (const name of group.journeys) {
                    const journey = journeyMap.get(name);
                    if (!journey)
                        throw new Error(`[ScenarioBuilder] Journey '${name}' not found in hybrid group.`);
                    const profile = journey.loadProfile ?? plan.global_load_profile;
                    const executorConfig = ExecutorFactory_1.ExecutorFactory.build(profile);
                    const durationSecs = this.estimateTotalDurationSeconds(profile);
                    scenarios[name] = {
                        ...executorConfig,
                        exec: this.sanitizeExecName(name),
                        tags: { journey: name, ...journey.tags },
                        env: this.buildLifecycleEnv(profile, journey.lifecycle),
                        startTime: `${groupOffset}s`,
                    };
                    groupOffset += durationSecs;
                }
            }
        }
        return scenarios;
    }
    // ---------------------------------------------
    // Utilities
    // ---------------------------------------------
    /** Sanitize journey name to a valid k6 exec function name */
    static sanitizeExecName(name) {
        return name.replace(/[^a-zA-Z0-9_]/g, '_');
    }
    static buildLifecycleEnv(profile, lifecycle) {
        if (!lifecycle)
            return undefined;
        return {
            K6_PERF_PHASES: JSON.stringify(this.computePhases(profile)),
            K6_PERF_LIFECYCLE: JSON.stringify({
                init: lifecycle.init ?? [],
                end: lifecycle.end ?? [],
            }),
        };
    }
    static computePhases(profile) {
        if (profile.executor === 'per-vu-iterations') {
            return {
                mode: 'per-vu-iterations',
                startVUs: profile.vus ?? 0,
                peakVUs: profile.vus ?? 0,
                totalIterations: profile.iterations ?? 0,
                timeline: [],
            };
        }
        if (profile.executor !== 'ramping-vus') {
            return {
                mode: 'unsupported',
                startVUs: profile.startVUs ?? 0,
                peakVUs: profile.vus ?? 0,
                totalIterations: 0,
                timeline: [],
            };
        }
        let elapsedMs = 0;
        let peakVUs = profile.startVUs ?? 0;
        const timeline = [];
        for (const stage of profile.stages ?? []) {
            elapsedMs += this.parseDurationToMs(stage.duration);
            peakVUs = Math.max(peakVUs, stage.target);
            timeline.push({
                endMs: elapsedMs,
                vus: stage.target,
            });
        }
        return {
            mode: 'ramping-vus',
            startVUs: profile.startVUs ?? 0,
            peakVUs,
            totalIterations: 0,
            timeline,
        };
    }
    /** Estimate total duration of a load profile in seconds */
    static estimateTotalDurationSeconds(profile) {
        if (profile.stages && profile.stages.length > 0) {
            return profile.stages.reduce((total, stage) => {
                return total + this.parseDurationToSeconds(stage.duration);
            }, 0);
        }
        if (profile.duration) {
            return this.parseDurationToSeconds(profile.duration);
        }
        return 300; // default fallback: 5 minutes
    }
    /** Parse k6 duration strings: '2m', '30s', '1h30m' */
    static parseDurationToSeconds(duration) {
        let total = 0;
        const matches = duration.matchAll(/(\d+(?:\.\d+)?)(h|m|s)/g);
        for (const match of matches) {
            const value = parseFloat(match[1]);
            switch (match[2]) {
                case 'h':
                    total += value * 3600;
                    break;
                case 'm':
                    total += value * 60;
                    break;
                case 's':
                    total += value;
                    break;
            }
        }
        return total || 60;
    }
    static parseDurationToMs(duration) {
        return Math.round(this.parseDurationToSeconds(duration) * 1000);
    }
}
exports.ScenarioBuilder = ScenarioBuilder;
//# sourceMappingURL=ScenarioBuilder.lifecycle-prototype.js.map