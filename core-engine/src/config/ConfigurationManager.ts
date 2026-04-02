/**
 * ConfigurationManager.ts
 * Phase 1 – Merges configs in documented precedence order:
 *   framework defaults -> environment -> runtime -> suite -> CLI -> .env secrets
 */

import * as fs from 'fs';
import * as path from 'path';
import { EnvResolver } from './EnvResolver';
import { SchemaValidator } from './SchemaValidator';
import {
  EnvironmentConfig,
  RuntimeSettings,
  ResolvedConfig,
  FRAMEWORK_DEFAULTS,
} from '../types/ConfigContracts';
import { TestPlan } from '../types/TestPlanSchema';

export class ConfigurationManager {
  private readonly envResolver: EnvResolver;
  private readonly schemaValidator: SchemaValidator;

  constructor(envFilePath?: string) {
    this.envResolver = new EnvResolver(envFilePath);
    this.schemaValidator = new SchemaValidator();
  }

  /**
   * Load and merge all config layers, returning a fully resolved config.
   * Throws descriptively if any required piece is missing or schema-invalid.
   */
  resolve(options: {
    environmentConfigPath: string;
    runtimeSettingsPath: string;
    cliOverrides?: Record<string, unknown>;
  }): ResolvedConfig {
    // 1. Framework defaults
    let runtime: RuntimeSettings = structuredClone(FRAMEWORK_DEFAULTS);

    // 2. Environment config
    const environment = this.loadEnvironmentConfig(options.environmentConfigPath);

    // 3. Runtime settings (merge on top of defaults)
    const runtimeFromFile = this.loadRuntimeSettings(options.runtimeSettingsPath);
    runtime = this.deepMerge(runtime, runtimeFromFile) as RuntimeSettings;

    // 4. CLI overrides (applied after file-level merge)
    const cliOverrides = options.cliOverrides ?? {};
    if (cliOverrides['debugMode'] !== undefined) {
      runtime.debugMode = cliOverrides['debugMode'] as boolean;
    }

    // 5. .env secrets
    const secrets = this.envResolver.getAll();

    const resolved: ResolvedConfig = { environment, runtime, cliOverrides, secrets };

    if (runtime.debugMode) {
      this.printResolvedConfig(resolved);
    }

    return resolved;
  }

  // ---------------------------------------------
  // Loaders
  // ---------------------------------------------

  loadTestPlan(planPath: string): TestPlan {
    const raw = this.readJsonFile<TestPlan>(planPath, 'Test Plan');
    const result = this.schemaValidator.validatePlan(raw);
    if (!result.valid) {
      throw new Error(
        `[ConfigurationManager] Test plan validation failed:\n${result.errors.join('\n')}`,
      );
    }
    return raw;
  }

  private loadEnvironmentConfig(filePath: string): EnvironmentConfig {
    return this.readJsonFile<EnvironmentConfig>(filePath, 'Environment Config');
  }

  private loadRuntimeSettings(filePath: string): Partial<RuntimeSettings> {
    if (!fs.existsSync(filePath)) {
      console.warn(
        `[ConfigurationManager] No runtime-settings file found at '${filePath}'. Using framework defaults.`,
      );
      return {};
    }

    const raw = this.readJsonFile<Partial<RuntimeSettings>>(filePath, 'Runtime Settings');
    const result = this.schemaValidator.validateRuntime(raw);
    if (!result.valid) {
      throw new Error(
        `[ConfigurationManager] Runtime settings validation failed:\n${result.errors.join('\n')}`,
      );
    }
    return raw;
  }

  // ---------------------------------------------
  // Utilities
  // ---------------------------------------------

  private readJsonFile<T>(filePath: string, label: string): T {
    const abs = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(abs)) {
      throw new Error(`[ConfigurationManager] ${label} file not found: ${abs}`);
    }
    try {
      return JSON.parse(fs.readFileSync(abs, 'utf-8')) as T;
    } catch (err) {
      throw new Error(
        `[ConfigurationManager] Failed to parse ${label} JSON at ${abs}: ${(err as Error).message}`,
      );
    }
  }

  /** Recursive deep merge – source keys override target keys. */
  private deepMerge(target: unknown, source: unknown): unknown {
    if (
      typeof target !== 'object' ||
      target === null ||
      typeof source !== 'object' ||
      source === null
    ) {
      return source ?? target;
    }

    const result: Record<string, unknown> = { ...(target as Record<string, unknown>) };
    for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
      result[key] = this.deepMerge(result[key], value);
    }
    return result;
  }

  private printResolvedConfig(config: ResolvedConfig): void {
    const safe = {
      environment: config.environment,
      runtime: config.runtime,
      cliOverrides: config.cliOverrides,
      secrets: Object.keys(config.secrets).reduce(
        (acc, key) => {
          acc[key] = '***REDACTED***';
          return acc;
        },
        {} as Record<string, string>,
      ),
    };
    console.log('[ConfigurationManager] Resolved Config:\n' + JSON.stringify(safe, null, 2));
  }
}
