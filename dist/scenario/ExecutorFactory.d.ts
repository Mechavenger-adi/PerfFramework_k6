/**
 * ExecutorFactory.ts
 * Phase 1 – Maps executor names to their k6 configuration requirements
 * and provides validation helpers.
 */
import { GlobalLoadProfile } from '../types/TestPlanSchema';
import { K6ExecutorConfig } from './WorkloadModels';
export declare class ExecutorFactory {
    /**
     * Validate that the profile has all required fields for its executor type.
     * Returns an array of error strings (empty = valid).
     */
    static validate(profile: GlobalLoadProfile): string[];
    /**
     * Build a k6-compatible executor config from a GlobalLoadProfile.
     * Validates required fields first.
     */
    static build(profile: GlobalLoadProfile): K6ExecutorConfig;
    /** Return human-readable descriptions of all supported executors. */
    static listSupported(): void;
}
//# sourceMappingURL=ExecutorFactory.d.ts.map