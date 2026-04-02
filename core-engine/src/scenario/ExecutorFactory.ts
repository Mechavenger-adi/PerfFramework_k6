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
    requiredFields: ['stages'],
    description: 'Ramps arrival rate (RPS). Requires stages[].',
  },
  'constant-arrival-rate': {
    requiredFields: ['vus', 'duration'],
    description: 'Fixed arrival rate. Requires vus + duration.',
  },
  'shared-iterations': {
    requiredFields: ['vus', 'iterations'],
    description: 'Distributes N iterations across VUs. Requires vus + iterations.',
  },
  'per-vu-iterations': {
    requiredFields: ['vus', 'iterations'],
    description: 'Each VU runs N iterations. Requires vus + iterations.',
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
   * Validates required fields first.
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
