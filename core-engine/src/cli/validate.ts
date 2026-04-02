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
}

export function runValidate(opts: ValidateOptions): boolean {
  const {
    planPath,
    dataRoot = 'scrum-suites',
    envFilePath,
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
    opts.runtimeSettingsPath ?? path.join('config', 'runtime-settings', 'default.json');

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

  return result.passed;
}
