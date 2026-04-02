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

// ---------------------------------------------
// Factory Functions
// ---------------------------------------------

/** Build a standard load test: ramp-up -> steady -> ramp-down */
export function buildLoadProfile(options: {
  rampUp: string;
  steady: string;
  rampDown: string;
  targetVUs: number;
}): GlobalLoadProfile {
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
export function buildStressProfile(options: {
  targetVUs: number;
  rampUp?: string;
  steady?: string;
  rampDown?: string;
}): GlobalLoadProfile {
  return buildLoadProfile({
    rampUp: options.rampUp ?? '2m',
    steady: options.steady ?? '5m',
    rampDown: options.rampDown ?? '2m',
    targetVUs: options.targetVUs,
  });
}

/** Build a soak test: low steady load for an extended duration */
export function buildSoakProfile(options: {
  targetVUs: number;
  duration: string;
  rampUp?: string;
  rampDown?: string;
}): GlobalLoadProfile {
  return buildLoadProfile({
    rampUp: options.rampUp ?? '5m',
    steady: options.duration,
    rampDown: options.rampDown ?? '5m',
    targetVUs: options.targetVUs,
  });
}

/** Build a spike test: sudden surge then back to baseline */
export function buildSpikeProfile(options: {
  baselineVUs: number;
  spikeVUs: number;
  spikeDuration?: string;
}): GlobalLoadProfile {
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
export function buildIterationProfile(options: {
  vus: number;
  iterations: number;
}): GlobalLoadProfile {
  return {
    executor: 'shared-iterations',
    vus: options.vus,
    iterations: options.iterations,
  };
}

/** Translate a GlobalLoadProfile into a k6 executor config block */
export function toK6ExecutorConfig(profile: GlobalLoadProfile): K6ExecutorConfig {
  return {
    executor: profile.executor,
    startVUs: profile.startVUs,
    stages: profile.stages,
    vus: profile.vus,
    duration: profile.duration,
    iterations: profile.iterations,
  };
}
