/**
 * TestPlanLoader.ts
 * Phase 1 – Loads and parses a test plan JSON file.
 * Delegates schema validation to SchemaValidator.
 */
import { TestPlan } from '../types/TestPlanSchema';
export declare class TestPlanLoader {
    private readonly schemaValidator;
    constructor();
    /**
     * Load and validate a test plan from a JSON file.
     * Throws with a descriptive message on parse failure or schema violations.
     */
    load(planFilePath: string): TestPlan;
}
//# sourceMappingURL=TestPlanLoader.d.ts.map