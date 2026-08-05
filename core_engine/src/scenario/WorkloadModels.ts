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
  maxDuration?: string;
  iterations?: number;
  rate?: number;
  timeUnit?: string;
  preAllocatedVUs?: number;
  maxVUs?: number;
  gracefulRampDown?: string;
  gracefulStop?: string;
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

/**
 * Build a fixed-iteration profile.
 * `maxDuration` is the wall-clock cap on the iteration pool; omit it to inherit
 * k6's 10m default (which truncates silently — see DEFAULT_MAX_DURATION_MS).
 */
export function buildIterationProfile(options: {
  vus: number;
  iterations: number;
  maxDuration?: string;
}): GlobalLoadProfile {
  return {
    executor: 'shared-iterations',
    vus: options.vus,
    iterations: options.iterations,
    ...(options.maxDuration !== undefined && { maxDuration: options.maxDuration }),
  };
}

/** Build a constant arrival-rate profile */
export function buildConstantArrivalRateProfile(options: {
  rate: number;
  duration: string;
  preAllocatedVUs: number;
  timeUnit?: string;
  maxVUs?: number;
}): GlobalLoadProfile {
  return {
    executor: 'constant-arrival-rate',
    rate: options.rate,
    duration: options.duration,
    preAllocatedVUs: options.preAllocatedVUs,
    timeUnit: options.timeUnit ?? '1s',
    maxVUs: options.maxVUs,
  };
}

/** Build a ramping arrival-rate profile */
export function buildRampingArrivalRateProfile(options: {
  stages: LoadStage[];
  preAllocatedVUs: number;
  timeUnit?: string;
  maxVUs?: number;
}): GlobalLoadProfile {
  return {
    executor: 'ramping-arrival-rate',
    stages: options.stages,
    preAllocatedVUs: options.preAllocatedVUs,
    timeUnit: options.timeUnit ?? '1s',
    maxVUs: options.maxVUs,
  };
}

/** Build an externally-controlled profile */
export function buildExternallyControlledProfile(options: {
  maxVUs: number;
  vus?: number;
  duration?: string;
}): GlobalLoadProfile {
  return {
    executor: 'externally-controlled',
    maxVUs: options.maxVUs,
    vus: options.vus ?? 0,
    duration: options.duration ?? '0',
  };
}

/**
 * Executor-specific fields each k6 executor accepts, verified against the vendored k6
 * source (`k6-master/lib/executor/*.go`). k6 decodes scenario options with
 * DisallowUnknownFields, so emitting a field the executor doesn't recognise fails the
 * whole run with `unknown field "<name>"`. The classic trap: a plan's shared
 * `global_load_profile` keeps `startVUs` (valid for ramping-vus) and an arrival-rate
 * journey reuses it — k6 then rejects `startVUs`. `executor` + the base fields
 * (`gracefulStop`, and `exec`/`tags`/`env`/`startTime`, which ScenarioBuilder adds) are
 * always valid, so they're not listed here.
 *
 * Notable per-executor rules baked in below:
 *  - `startVUs` and `gracefulRampDown` are ramping-VUs only (NOT ramping-arrival-rate).
 *  - iteration executors use k6's `maxDuration`, not `duration`, so `duration` is dropped
 *    for them and `maxDuration` is emitted instead. Leaving `maxDuration` unset does NOT
 *    mean "unbounded": k6 defaults it to 10m (see DEFAULT_MAX_DURATION_MS) and silently
 *    truncates the iteration pool at that point.
 */
const EXECUTOR_FIELDS: Record<string, ReadonlyArray<keyof K6ExecutorConfig>> = {
  'ramping-vus': ['startVUs', 'stages', 'gracefulRampDown'],
  'constant-vus': ['vus', 'duration'],
  'ramping-arrival-rate': ['stages', 'timeUnit', 'preAllocatedVUs', 'maxVUs'],
  'constant-arrival-rate': ['rate', 'timeUnit', 'duration', 'preAllocatedVUs', 'maxVUs'],
  'shared-iterations': ['vus', 'iterations', 'maxDuration'],
  'per-vu-iterations': ['vus', 'iterations', 'maxDuration'],
  'externally-controlled': ['vus', 'maxVUs', 'duration'],
};

/**
 * k6's own default for `maxDuration` on both iteration executors
 * (`NewSharedIterationsConfig` / `NewPerVUIterationsConfig` = 10 minutes).
 * The framework mirrors it so the lifecycle engine knows when k6 will cut the
 * run short even for plans that never mention maxDuration.
 */
export const DEFAULT_MAX_DURATION_MS = 10 * 60 * 1000;

/** Executors that accept `maxDuration` (and therefore carry k6's 10m default). */
export const ITERATION_EXECUTORS: ReadonlyArray<string> = ['shared-iterations', 'per-vu-iterations'];

/** Seconds per unit accepted by k6 duration strings (Go's time.ParseDuration + k6's `d`). */
const DURATION_UNIT_SECONDS: Record<string, number> = {
  ns: 1e-9,
  us: 1e-6,
  'µs': 1e-6,
  ms: 1e-3,
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};

/**
 * Parse a k6 duration string into seconds.
 * Shared by ScenarioBuilder (timelines, startTime offsets) and ExecutorFactory
 * (validation), which cannot import each other without a cycle.
 *
 * Mirrors k6's ParseExtendedDuration (lib/types/types.go): Go's units
 * ns/us/µs/ms/s/m/h, k6's `d` (days) extension, compound forms like '1h30m',
 * and a bare number meaning MILLISECONDS. The multi-character units are matched
 * before the single-character ones — otherwise '500ms' reads as 500 minutes.
 *
 * Returns 0 for strings with no recognisable unit — callers decide the fallback.
 */
export function parseK6DurationToSeconds(duration: string): number {
  const trimmed = duration.trim();

  // Bare number = milliseconds, per k6's "assume millisecond values" rule.
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed) / 1000;
  }

  let total = 0;
  const matches = trimmed.matchAll(/(\d+(?:\.\d+)?)(ns|us|µs|ms|d|h|m|s)/g);
  for (const match of matches) {
    total += parseFloat(match[1]) * DURATION_UNIT_SECONDS[match[2]];
  }
  return total;
}

/**
 * Translate a GlobalLoadProfile into a k6 executor config block, emitting ONLY the
 * fields valid for that executor (see EXECUTOR_FIELDS) so k6 never sees an unknown field.
 */
export function toK6ExecutorConfig(profile: GlobalLoadProfile): K6ExecutorConfig {
  const out: K6ExecutorConfig = { executor: profile.executor };
  // gracefulStop is a base-config field valid on every executor.
  if (profile.gracefulStop !== undefined) out.gracefulStop = profile.gracefulStop;

  const allowed = EXECUTOR_FIELDS[profile.executor] ?? [];
  for (const field of allowed) {
    const value = (profile as GlobalLoadProfile)[field as keyof GlobalLoadProfile];
    if (value !== undefined) {
      (out as unknown as Record<string, unknown>)[field] = value;
    }
  }
  return out;
}
