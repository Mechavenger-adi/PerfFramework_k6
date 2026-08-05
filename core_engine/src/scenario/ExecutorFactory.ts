/**
 * ExecutorFactory.ts
 * Phase 1 – Maps executor names to their k6 configuration requirements
 * and provides validation helpers.
 */

import { GlobalLoadProfile, ExecutorType } from '../types/TestPlanSchema';
import {
  ITERATION_EXECUTORS,
  K6ExecutorConfig,
  parseK6DurationToSeconds,
  toK6ExecutorConfig,
} from './WorkloadModels';

interface ExecutorSpec {
  requiredFields: (keyof GlobalLoadProfile)[];
  description: string;
}

const EXECUTOR_SPECS: Record<ExecutorType, ExecutorSpec> = {
  'ramping-vus': {
    requiredFields: ['stages'],
    description: 'Ramps VUs through defined stages. Requires stages[].',
  },
  'constant-vus': {
    requiredFields: ['vus', 'duration'],
    description: 'Holds a fixed VU count for a duration. Requires vus + duration.',
  },
  'ramping-arrival-rate': {
    requiredFields: ['stages', 'preAllocatedVUs'],
    description:
      'Ramps request arrival rate through stages. Requires stages[] (with rate targets), preAllocatedVUs. Optional: maxVUs, timeUnit.',
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
  'externally-controlled': {
    requiredFields: ['maxVUs'],
    description:
      'VU count controlled via k6 REST API at runtime. Requires maxVUs. Optional: vus (initial count), duration.',
  },
};

export class ExecutorFactory {
  /**
   * Validate that the profile has all required fields for its executor type.
   * Returns an array of error strings (empty = valid).
   */
  static validate(profile: GlobalLoadProfile): string[] {
    const spec = EXECUTOR_SPECS[profile.executor as ExecutorType];
    if (!spec) {
      return [`Unknown executor type: '${profile.executor}'.`];
    }

    const missing = spec.requiredFields.filter(
      (field) => profile[field] === undefined || profile[field] === null,
    );

    const errors = missing.map(
      (field) =>
        `Executor '${profile.executor}' requires field '${field}'. ${spec.description}`,
    );

    // maxDuration is iteration-executor-only, and k6 rejects anything under 1s
    // (`minDuration` in lib/executor). Catch both here rather than letting k6
    // fail the run after the whole plan has been generated.
    if (profile.maxDuration !== undefined) {
      if (!ITERATION_EXECUTORS.includes(profile.executor)) {
        errors.push(
          `Executor '${profile.executor}' does not accept 'maxDuration' — it is only valid on `
          + `${ITERATION_EXECUTORS.join(' / ')}. Use 'duration' or 'stages' instead.`,
        );
      } else if (parseK6DurationToSeconds(profile.maxDuration) < 1) {
        errors.push(
          `Executor '${profile.executor}' has an invalid 'maxDuration' ('${profile.maxDuration}'). `
          + 'It must be a k6 duration string of at least 1s, e.g. \'30m\'.',
        );
      }
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
