/**
 * ExecutorFactory.ts
 * Phase 1 – Maps executor names to their k6 configuration requirements
 * and provides validation helpers.
 */

import { GlobalLoadProfile, ExecutorType } from '../types/TestPlanSchema';
import {
  ARRIVAL_RATE_EXECUTORS,
  DEFAULT_START_VUS,
  ITERATION_EXECUTORS,
  K6ExecutorConfig,
  parseK6DurationToSeconds,
  toK6ExecutorConfig,
} from './WorkloadModels';

/** k6's `minDuration` (lib/executor/constant_vus.go) — every duration floor. */
const MIN_DURATION_SECONDS = 1;

interface ExecutorSpec {
  requiredFields: (keyof GlobalLoadProfile)[];
  description: string;
}

const EXECUTOR_SPECS: Record<ExecutorType, ExecutorSpec> = {
  'ramping-vus': {
    requiredFields: ['stages'],
    description:
      'Ramps VUs through defined stages. Requires stages[]. Optional: startVUs (k6 default 1, NOT 0), gracefulRampDown.',
  },
  'constant-vus': {
    requiredFields: ['vus', 'duration'],
    description: 'Holds a fixed VU count for a duration. Requires vus + duration.',
  },
  'ramping-arrival-rate': {
    requiredFields: ['stages', 'preAllocatedVUs'],
    description:
      'Ramps request arrival rate through stages. Requires stages[] (with rate targets), preAllocatedVUs. Optional: startRate (rate before the first stage, k6 default 0), maxVUs, timeUnit. Note: no gracefulRampDown — k6 does not define one for this executor.',
  },
  'constant-arrival-rate': {
    requiredFields: ['rate', 'duration', 'preAllocatedVUs'],
    description:
      'Fixed request arrival rate. Requires rate, duration, preAllocatedVUs. Optional: maxVUs, timeUnit.',
  },
  'shared-iterations': {
    requiredFields: ['vus', 'iterations'],
    description:
      'Distributes N iterations across VUs. Requires vus + iterations. Optional: maxDuration (defaults to k6\'s 10m, which truncates the pool).',
  },
  'per-vu-iterations': {
    requiredFields: ['vus', 'iterations'],
    description:
      'Each VU runs N iterations. Requires vus + iterations. Optional: maxDuration (defaults to k6\'s 10m, which truncates the pool).',
  },
};

/**
 * Executors k6 used to register but no longer does. Kept only so a plan written
 * against an older k6 fails here with an explanation, instead of dying inside k6
 * with a bare `unknown executor type`.
 */
const REMOVED_EXECUTORS: Record<string, string> = {
  'externally-controlled':
    'k6 v2.0.0 removed the externally-controlled executor (it is no longer registered in '
    + 'lib/executor, and k6 fails at load with "unknown executor type"). Drive VU counts from '
    + 'stages with ramping-vus instead.',
};

export class ExecutorFactory {
  /**
   * Validate that the profile has all required fields for its executor type.
   * Returns an array of error strings (empty = valid).
   */
  static validate(profile: GlobalLoadProfile): string[] {
    const removed = REMOVED_EXECUTORS[profile.executor];
    if (removed) {
      return [`Executor '${profile.executor}' is no longer supported. ${removed}`];
    }

    const spec = EXECUTOR_SPECS[profile.executor as ExecutorType];
    if (!spec) {
      return [
        `Unknown executor type: '${profile.executor}'. Supported: `
        + `${Object.keys(EXECUTOR_SPECS).join(', ')}.`,
      ];
    }

    const missing = spec.requiredFields.filter(
      (field) => profile[field] === undefined || profile[field] === null,
    );

    const errors = missing.map(
      (field) =>
        `Executor '${profile.executor}' requires field '${field}'. ${spec.description}`,
    );

    errors.push(...this.validateMaxDuration(profile));
    errors.push(...this.validateStages(profile));
    errors.push(...this.validateArrivalRate(profile));
    errors.push(...this.validateDurations(profile));
    errors.push(...this.validateIterationCounts(profile));

    return errors;
  }

  // ---------------------------------------------
  // Pre-flight rules — each mirrors a k6 `Validate()` check in lib/executor/*.go.
  // Catching them here fails the plan before generation, with the offending
  // field named, instead of after k6 has been handed a fully-built script.
  // ---------------------------------------------

  /** `maxDuration`: iteration executors only, and >= k6's 1s `minDuration`. */
  private static validateMaxDuration(profile: GlobalLoadProfile): string[] {
    if (profile.maxDuration === undefined) return [];

    if (!ITERATION_EXECUTORS.includes(profile.executor)) {
      return [
        `Executor '${profile.executor}' does not accept 'maxDuration' — it is only valid on `
        + `${ITERATION_EXECUTORS.join(' / ')}. Use 'duration' or 'stages' instead.`,
      ];
    }
    if (parseK6DurationToSeconds(profile.maxDuration) < MIN_DURATION_SECONDS) {
      return [
        `Executor '${profile.executor}' has an invalid 'maxDuration' ('${profile.maxDuration}'). `
        + `It must be a k6 duration string of at least ${MIN_DURATION_SECONDS}s, e.g. '30m'.`,
      ];
    }
    return [];
  }

  /**
   * `stages`: k6's `validateStages` + ramping-vus' "something must be > 0" rule.
   * For ramping-arrival-rate a stage `target` is a RATE, not a VU count.
   */
  private static validateStages(profile: GlobalLoadProfile): string[] {
    const usesStages = profile.executor === 'ramping-vus'
      || profile.executor === 'ramping-arrival-rate';
    if (!usesStages || profile.stages === undefined) return [];

    const errors: string[] = [];
    if (profile.stages.length === 0) {
      errors.push(`Executor '${profile.executor}' requires at least one stage in 'stages'.`);
      return errors;
    }

    profile.stages.forEach((stage, i) => {
      const n = i + 1;
      if (stage.duration === undefined) {
        errors.push(`Stage ${n} of '${profile.executor}' has no 'duration'.`);
      } else if (parseK6DurationToSeconds(stage.duration) < 0) {
        errors.push(`The duration for stage ${n} of '${profile.executor}' can't be negative.`);
      }
      if (stage.target === undefined) {
        errors.push(`Stage ${n} of '${profile.executor}' has no 'target'.`);
      } else if (stage.target < 0) {
        errors.push(`The target for stage ${n} of '${profile.executor}' can't be negative.`);
      }
    });

    // k6: "either startVUs or one of the stages' target values must be greater than 0".
    // Only ramping-vus enforces this; ramping-arrival-rate may legitimately ramp to 0.
    if (profile.executor === 'ramping-vus') {
      const peak = Math.max(profile.startVUs ?? DEFAULT_START_VUS, ...profile.stages.map((s) => s.target ?? 0));
      if (peak <= 0) {
        errors.push(
          'Either \'startVUs\' or one of the stages\' target values must be greater than 0 '
          + `for executor '${profile.executor}' — as configured the scenario would never run a VU.`,
        );
      }
    }

    return errors;
  }

  /** Arrival-rate rules: `maxVUs >= preAllocatedVUs`, positive `timeUnit`/`rate`, non-negative `startRate`. */
  private static validateArrivalRate(profile: GlobalLoadProfile): string[] {
    const errors: string[] = [];

    if (profile.startRate !== undefined) {
      if (profile.executor !== 'ramping-arrival-rate') {
        errors.push(
          `Executor '${profile.executor}' does not accept 'startRate' — it is only valid on `
          + 'ramping-arrival-rate. Use \'rate\' for constant-arrival-rate.',
        );
      } else if (profile.startRate < 0) {
        errors.push('The \'startRate\' value can\'t be negative.');
      }
    }

    if (!ARRIVAL_RATE_EXECUTORS.includes(profile.executor)) return errors;

    if (profile.timeUnit !== undefined && parseK6DurationToSeconds(profile.timeUnit) <= 0) {
      errors.push(
        `The 'timeUnit' must be more than 0 for executor '${profile.executor}' `
        + `(got '${profile.timeUnit}').`,
      );
    }
    if (profile.rate !== undefined && profile.rate <= 0) {
      errors.push(`The iteration 'rate' must be more than 0 for executor '${profile.executor}'.`);
    }
    if (profile.preAllocatedVUs !== undefined && profile.preAllocatedVUs < 0) {
      errors.push('The number of \'preAllocatedVUs\' can\'t be negative.');
    }
    if (
      profile.maxVUs !== undefined
      && profile.preAllocatedVUs !== undefined
      && profile.maxVUs < profile.preAllocatedVUs
    ) {
      errors.push(
        `'maxVUs' (${profile.maxVUs}) can't be less than 'preAllocatedVUs' `
        + `(${profile.preAllocatedVUs}).`,
      );
    }

    return errors;
  }

  /** `duration` must be >= k6's 1s `minDuration` on the executors that take one. */
  private static validateDurations(profile: GlobalLoadProfile): string[] {
    const usesDuration = profile.executor === 'constant-vus'
      || profile.executor === 'constant-arrival-rate';
    if (!usesDuration || profile.duration === undefined) return [];

    if (parseK6DurationToSeconds(profile.duration) < MIN_DURATION_SECONDS) {
      return [
        `The 'duration' must be at least ${MIN_DURATION_SECONDS}s for executor `
        + `'${profile.executor}', but is '${profile.duration}'.`,
      ];
    }
    return [];
  }

  /** VU/iteration counts: positive VUs, and shared-iterations' `iterations >= vus`. */
  private static validateIterationCounts(profile: GlobalLoadProfile): string[] {
    const errors: string[] = [];

    if (profile.vus !== undefined && profile.vus <= 0
      && (profile.executor === 'constant-vus' || ITERATION_EXECUTORS.includes(profile.executor))) {
      errors.push(`The number of 'vus' must be more than 0 for executor '${profile.executor}'.`);
    }

    // k6 rejects a shared pool smaller than the VU count — those VUs would draw
    // zero work. per-vu-iterations has no such rule (each VU runs the full count).
    if (
      profile.executor === 'shared-iterations'
      && profile.iterations !== undefined
      && profile.vus !== undefined
      && profile.iterations < profile.vus
    ) {
      errors.push(
        `The number of 'iterations' (${profile.iterations}) can't be less than the number of `
        + `'vus' (${profile.vus}) for shared-iterations — ${profile.vus - profile.iterations} VU(s) `
        + 'would get no work.',
      );
    }

    return errors;
  }

  /**
   * Build a k6-compatible executor config from a GlobalLoadProfile.
   * Validates required fields first and rejects arrival-rate executors that
   * lack phase-envelope support in the framework lifecycle engine.
   */
  static build(profile: GlobalLoadProfile): K6ExecutorConfig {
    const errors = this.validate(profile);
    if (errors.length > 0) {
      throw new Error(`[ExecutorFactory] Invalid profile:\n${errors.join('\n')}`);
    }
    return toK6ExecutorConfig(profile);
  }

  /** Return human-readable descriptions of all supported executors. */
  static listSupported(): void {
    console.log('\nSupported k6 Executors:');
    for (const [name, spec] of Object.entries(EXECUTOR_SPECS)) {
      console.log(`  ${name.padEnd(28)} – ${spec.description}`);
    }
  }
}
