/**
 * config-inspect.ts
 * Phase 5 – Config resolution inspection
 */

import { ConfigurationManager } from '../config/ConfigurationManager';
import { TestPlanLoader } from '../scenario/TestPlanLoader';
import * as path from 'path';

export function inspectConfig(planPath: string, envConfigPath?: string, runtimeSettingsPath?: string, envFilePath?: string) {
  console.log('\n  Inspecting Configuration Resolution Chain...\n');

  try {
    const loader = new TestPlanLoader();
    const plan = loader.load(planPath);

    const envPath = envConfigPath ?? path.join('config', 'environments', `${plan.environment}.json`);
    const runtimePath = runtimeSettingsPath ?? path.join('config', 'runtime-settings', 'default.json');

    const configManager = new ConfigurationManager(envFilePath);
    
    // Note: resolve() internally calls printResolvedConfig if debugMode is true.
    // To explicitly inspect, we can just resolve and print it.
    console.log(`[1] Framework Defaults: Embedded in Core Engine`);
    console.log(`[2] Environment Config: ${envPath}`);
    console.log(`[3] Runtime Settings:   ${runtimePath}`);
    if (envFilePath) console.log(`[4] Secrets (.env):     ${envFilePath}`);
    console.log(`[5] Test Plan:          ${planPath}`);
    console.log('');
    
    const resolved = configManager.resolve({
      environmentConfigPath: envPath,
      runtimeSettingsPath: runtimePath,
    });
    
    const safe = {
      environment: resolved.environment,
      runtime: resolved.runtime,
      cliOverrides: resolved.cliOverrides,
      secrets: Object.keys(resolved.secrets).length > 0 ? '(Loaded and Redacted)' : '(None Loaded)'
    };
    
    console.log('--- Final Merged Resolution ---');
    console.log(JSON.stringify(safe, null, 2));

  } catch (err) {
    console.error(`\n[FAIL]  Config inspection failed:\n   ${(err as Error).message}\n`);
    process.exit(1);
  }
}
