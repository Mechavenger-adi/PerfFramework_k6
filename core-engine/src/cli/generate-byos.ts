/**
 * generate-byos.ts
 * Implements the CLI command to scaffold a Bring Your Own Script (BYOS) template.
 */

import * as fs from 'fs';
import * as path from 'path';

export function runGenerateByos(teamName: string, scriptName: string): void {
  const targetDir = path.join(process.cwd(), 'scrum-suites', teamName, 'tests');
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const scriptPath = path.join(targetDir, `${scriptName}.js`);

  if (fs.existsSync(scriptPath)) {
    console.error(`[FAIL]  Script already exists at: ${scriptPath}`);
    process.exit(1);
  }


  const template = `import { check } from 'k6';
import { transaction } from '../../../dist/utils/transaction.js';
import { request } from '../../../dist/utils/request.js';
import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';
import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';
// Optional explicit trackers (Proxy on ctx.* auto-registers in most cases):
// import { trackCorrelation, trackParameter, trackDataRow } from '../../../dist/utils/replayLogger.js';

const env = getEnvContext('${teamName}', { baseUrl: 'https://your-dev-environment.com/' });
const __journeyLifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
  clearCookies();
}

export function actionPhase(ctx) {
  const correlation_vars = ctx.correlation;

  transaction('BYOS_Custom_Logic', () => {
    // ==========================================================
    //   PASTE YOUR GRAFANA STUDIO / CUSTOM K6 SCRIPT BELOW
    // ==========================================================
    //
    // Use the framework's request() helper instead of http.* directly so each
    // call is auto-tagged with the active transaction, replay-logged in debug
    // mode, and snapshot-captured on 4xx/5xx.
    //
    // Example:
    //   const res = request('GET', \\\`\\\${env.baseUrl}public/crocodiles/\\\`);
    //   check(res, { 'status 200': (r) => r.status === 200 });
    //
    // For correlation, assign to ctx.correlation[...] (auto-tracked via Proxy):
    //   correlation_vars["authToken"] = res.json("token");
  });

  thinktime();
}

export function endPhase(ctx) {
}

export default function () {
  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });
}
`;

  fs.writeFileSync(scriptPath, template, 'utf8');
  console.log(`\n[PASS]  BYOS template created successfully at:`);
  console.log(`   ${scriptPath}\n`);
  console.log(`Open the file and paste your Grafana Studio script in the designated area.`);
}
