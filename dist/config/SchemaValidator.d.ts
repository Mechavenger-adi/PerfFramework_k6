/**
 * SchemaValidator.ts
 * Phase 1 – JSON Schema validation using ajv.
 * Validates test plans and runtime settings against their contracts at startup.
 *
 * Schemas are loaded from config/schemas/*.schema.json (single source of truth)
 * with inline fallbacks for robustness. The $schema property is allowed in all
 * config files for editor IntelliSense (works in VS Code, JetBrains, Sublime LSP,
 * Neovim LSP, and any JSON Schema-aware editor).
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
