/**
 * generate-byos.ts
 * Implements the CLI command to scaffold a Bring Your Own Script (BYOS) template.
 */

import * as fs from 'fs';
import * as path from 'path';
import { SCRIPT_API_MODULE } from '../recording/ScriptGenerator';

export function runGenerateByos(
  teamName: string,
  scriptName: string,
  opts: { overwrite?: boolean } = {},
): void {
  const targetDir = path.join(process.cwd(), 'testSuites', teamName, 'tests');

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const scriptPath = path.join(targetDir, `${scriptName}.js`);

  if (fs.existsSync(scriptPath) && !opts.overwrite) {
    console.error(`[FAIL]  Script already exists at: ${scriptPath}`);
    process.exit(1);
  }


  const template = `import { transaction, k6Check, request, createJourneyLifecycleStore, runJourneyLifecycle, thinktime, clearCookies, getEnvContext } from '${SCRIPT_API_MODULE}';
// Optional explicit trackers (Proxy on ctx.* auto-registers in most cases):
// import { trackCorrelation, trackParameter, trackDataRow } from '${SCRIPT_API_MODULE}';

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
    // FRAMEWORK RULES (do NOT use raw k6 APIs):
    //   • Use request() instead of http.get/post/etc. — auto-tags transaction,
    //     replay-logs in debug mode, snapshots failures.
    //   • Use k6Check() instead of native k6 check() — records the same metric
    //     PLUS applies the configured errorBehavior (continue / stop_iteration
    //     / stop_vu / abort_test) when a check fails.
    //   • Wrap each logical step in transaction('Name', () => { ... }) for
    //     hierarchical metrics and lifecycle gating.
    //   • Use thinktime() between transactions — honors runtime settings.
    //
    // Example:
    //   const res = request('GET', \\\`\\\${env.baseUrl}public/crocodiles/\\\`);
    //   k6Check(res, { 'status 200': (r) => r.status === 200 });
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
