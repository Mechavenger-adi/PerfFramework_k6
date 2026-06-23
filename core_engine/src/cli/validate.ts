/**
 * validate.ts
 * Phase 1 – Validates configs before execution.
 * Runs the Gatekeeper checklist and reports all issues in one pass.
 */

import * as path from 'path';
import { ConfigurationManager } from '../config/ConfigurationManager';
import { GatekeeperValidator } from '../config/GatekeeperValidator';
import { TestPlanLoader } from '../scenario/TestPlanLoader';

export interface ValidateOptions {
  planPath: string;
  envConfigPath?: string;
  runtimeSettingsPath?: string;
  dataRoot?: string;
  envFilePath?: string;
  verbose?: boolean;
}

export function runValidate(opts: ValidateOptions): boolean {
  const {
    planPath,
    dataRoot = 'testSuites',
    envFilePath,
    verbose = false,
  } = opts;

  console.log('\n  Running pre-flight validation...\n');

  // 1. Load test plan
  let plan;
  try {
    const loader = new TestPlanLoader();
    plan = loader.load(planPath);
  } catch (err) {
    console.error(`\n[FAIL]  Failed to load test plan:\n   ${(err as Error).message}\n`);
    return false;
  }

  // 2. Resolve env config path
  const envConfigPath =
    opts.envConfigPath ?? path.join('config', 'environments', `${plan.environment}.json`);
  const runtimeSettingsPath =
    opts.runtimeSettingsPath ?? path.join('config', 'runtime_settings', 'default.json');

  // 3. Merge configs
  let resolvedConfig;
  try {
    const configManager = new ConfigurationManager(envFilePath);
    resolvedConfig = configManager.resolve({
      environmentConfigPath: envConfigPath,
      runtimeSettingsPath,
    });
  } catch (err) {
    console.error(`\n[FAIL]  Config resolution failed:\n   ${(err as Error).message}\n`);
    return false;
  }

  // 4. Run Gatekeeper
  const gatekeeper = new GatekeeperValidator();
  const result = gatekeeper.validate(resolvedConfig, plan, dataRoot);
  gatekeeper.printResult(result);

  // 5. Config Completeness Score
  if (verbose) {
    try {
      const fs = require('fs');
      const { parse } = require('jsonc-parser');
      const absPath = path.resolve(process.cwd(), runtimeSettingsPath);
      if (fs.existsSync(absPath)) {
        const rawRuntime = parse(fs.readFileSync(absPath, 'utf-8')) || {};
        const expectedFields = ['thinkTime', 'pacing', 'http', 'errorBehavior', 'reporting', 'errors', 'monitoring', 'debugMode'];
        const configuredFields = expectedFields.filter(f => rawRuntime[f] !== undefined);
        const missingFields = expectedFields.filter(f => rawRuntime[f] === undefined);
        
        const score = Math.round((configuredFields.length / expectedFields.length) * 100);
        console.log(`\nConfig completeness: ${score}% (${configuredFields.length}/${expectedFields.length} sections configured)`);
        
        for (const field of configuredFields) {
          console.log(`  \x1b[32m✔\x1b[0m ${field}`);
        }
        for (const field of missingFields) {
          console.log(`  \x1b[33m○\x1b[0m ${field} (using default)`);
        }
        console.log('\n');
      }
    } catch (err) {
      // Ignore if failed to parse for completeness calculation
    }
  }

  return result.passed;
}
