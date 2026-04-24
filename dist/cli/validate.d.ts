/**
 * validate.ts
 * Phase 1 – Validates configs before execution.
 * Runs the Gatekeeper checklist and reports all issues in one pass.
 */
export interface ValidateOptions {
    planPath: string;
    envConfigPath?: string;
    runtimeSettingsPath?: string;
    dataRoot?: string;
    envFilePath?: string;
}
export declare function runValidate(opts: ValidateOptions): boolean;
//# sourceMappingURL=validate.d.ts.map