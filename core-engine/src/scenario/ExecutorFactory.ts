/**
 * ExecutorFactory.ts
 * Phase 1 – Maps executor names to their k6 configuration requirements
 * and provides validation helpers.
 */

import { GlobalLoadProfile, ExecutorType } from '../types/TestPlanSchema';
import { K6ExecutorConfig, toK6ExecutorConfig } from './WorkloadModels';

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
    description: 'Distributes N iterations across VUs. Requires vus + iterations.',
  },
  'per-vu-iterations': {
    requiredFields: ['vus', 'iterations'],
    description: 'Each VU runs N iterations. Requires vus + iterations.',
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

    return missing.map(
      (field) =>
        `Executor '${profile.executor}' requires field '${field}'. ${spec.description}`,
    );
  }

  /**
   * Build a k6-compatible executor config from a GlobalLoadProfile.
   * Validates required fields first and rejects arrival-rate executors that
   * lack phase-envelope support in the framework lifecycle engine.
   */
  static build(profile: GlobalLoadProfile): K6ExecutorConfig {
    const unsupported = new Set(['ramping-arrival-rate', 'constant-arrival-rate']);
    if (unsupported.has(profile.executor)) {
      throw new Error(
        `[ExecutorFactory] Executor '${profile.executor}' is not yet supported by the framework lifecycle engine. ` +
        `The lifecycle end-detection model (initPhase/actionPhase/endPhase) requires explicit phase-envelope support ` +
        `which has not been implemented for arrival-rate executors. ` +
        `Use 'ramping-vus', 'constant-vus', 'per-vu-iterations', or 'shared-iterations' instead.`,
      );
    }
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
