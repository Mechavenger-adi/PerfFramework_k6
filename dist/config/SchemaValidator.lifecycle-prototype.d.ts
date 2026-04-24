/**
 * SchemaValidator.ts
 * Phase 1 – JSON Schema validation using ajv.
 * Validates test plans and runtime settings against their contracts at startup.
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
export declare class SchemaValidator {
    private readonly ajv;
    private readonly validateRuntimeSettings;
    private readonly validateTestPlan;
    constructor();
    validateRuntime(data: unknown): ValidationResult;
    validatePlan(data: unknown): ValidationResult;
    private runValidation;
}
//# sourceMappingURL=SchemaValidator.lifecycle-prototype.d.ts.map