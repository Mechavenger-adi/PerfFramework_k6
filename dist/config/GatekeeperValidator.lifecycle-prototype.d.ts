/**
 * GatekeeperValidator.ts
 * Phase 1 – Pre-flight checklist. Runs after config merge, before k6 is invoked.
 * Accumulates ALL failures and reports them together — not just the first one.
 */
import { ResolvedConfig } from '../types/ConfigContracts';
import { TestPlan } from '../types/TestPlanSchema.lifecycle-prototype';
export interface GatekeeperResult {
    passed: boolean;
    failures: string[];
    warnings: string[];
}
export declare class GatekeeperValidator {
    /**
     * Run the full pre-flight checklist.
     * Returns a result object — never throws; caller decides how to handle failures.
     */
    validate(config: ResolvedConfig, plan: TestPlan, dataRoot: string): GatekeeperResult;
    /**
     * Print the result to console in a human-readable format.
     * Returns the same result for chaining.
     */
    printResult(result: GatekeeperResult): GatekeeperResult;
    /**
     * Scan a k6 script for data file references and column usage.
     * Detects: fs.open("path") → file mapping, FILES["name"]["col"] → column refs.
     */
    private extractDataReferences;
    private estimateRequestedVUs;
    private validateLifecycle;
}
//# sourceMappingURL=GatekeeperValidator.lifecycle-prototype.d.ts.map