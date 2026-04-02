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

  const template = `import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend } from 'k6/metrics';
import { Logger } from '@k6-perf/core-engine';

// -- Transaction Trends (Add your custom trends here) --
const txn_BYOS_Sample = new Trend('txn_BYOS_Sample');

export default function () {
  Logger.info('Starting BYOS script execution...');

  group('BYOS Custom Logic', function () {
    const start = Date.now();
    
    // ==========================================================
    //   PASTE YOUR GRAFANA STUDIO / CUSTOM K6 SCRIPT BELOW  
    // ==========================================================

    /* 
    const res = http.get('https://test-api.k6.io/public/crocodiles/');
    check(res, { 'status 200': (r) => r.status === 200 });
    */

    // ==========================================================
    //   PASTE YOUR GRAFANA STUDIO / CUSTOM K6 SCRIPT ABOVE  
    // ==========================================================

    txn_BYOS_Sample.add(Date.now() - start);
  });

  sleep(1);
}
`;

  fs.writeFileSync(scriptPath, template, 'utf8');
  console.log(`\n[PASS]  BYOS template created successfully at:`);
  console.log(`   ${scriptPath}\n`);
  console.log(`Open the file and paste your Grafana Studio script in the designated area.`);
}
