/**
 * ConfigurationManager.ts
 * Phase 1 – Merges configs in documented precedence order:
 *   framework defaults -> environment -> runtime -> suite -> CLI -> .env secrets
 */
import { ResolvedConfig } from '../types/ConfigContracts';
import { TestPlan } from '../types/TestPlanSchema';
export declare class ConfigurationManager {
    private readonly envResolver;
    private readonly schemaValidator;
    constructor(envFilePath?: string);
    /**
     * Load and merge all config layers, returning a fully resolved config.
     * Throws descriptively if any required piece is missing or schema-invalid.
     */
    resolve(options: {
        environmentConfigPath: string;
        runtimeSettingsPath: string;
        cliOverrides?: Record<string, unknown>;
    }): ResolvedConfig;
    loadTestPlan(planPath: string): TestPlan;
    private loadEnvironmentConfig;
    private loadRuntimeSettings;
    private readJsonFile;
    /** Recursive deep merge – source keys override target keys. */
    private deepMerge;
    private printResolvedConfig;
}
//# sourceMappingURL=ConfigurationManager.d.ts.map