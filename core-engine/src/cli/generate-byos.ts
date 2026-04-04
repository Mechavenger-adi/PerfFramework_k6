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
import { initTransactions, startTransaction, endTransaction } from '../../../core-engine/src/utils/transaction.js';
import { logExchange } from '../../../core-engine/src/utils/replayLogger.js';

initTransactions(['BYOS_Custom_Logic']);

export default function () {
  group('BYOS Custom Logic', function () {
    startTransaction('BYOS_Custom_Logic');
    
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

    endTransaction('BYOS_Custom_Logic');
  });

  sleep(1);
}
`;

  fs.writeFileSync(scriptPath, template, 'utf8');
  console.log(`\n[PASS]  BYOS template created successfully at:`);
  console.log(`   ${scriptPath}\n`);
  console.log(`Open the file and paste your Grafana Studio script in the designated area.`);
}
