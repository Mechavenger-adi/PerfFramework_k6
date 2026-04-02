/**
 * init.ts
 * Phase 1 – Scaffolds a new k6 performance project.
 * Creates the standard folder structure, example config files, and a sample journey.
 */

import * as fs from 'fs';
import * as path from 'path';

export function runInit(projectDir: string = process.cwd()): void {
  console.log(`\n Initializing k6 Performance Framework project at: ${projectDir}\n`);

  const dirs = [
    'config/environments',
    'config/test-plans',
    'config/runtime-settings',
    'config/correlation-rules',
    'scrum-suites/sample-team/tests',
    'scrum-suites/sample-team/data',
    'scrum-suites/sample-team/recordings',
    'scrum-suites/sample-team/results',
    'results',
  ];

  // Create folders
  for (const dir of dirs) {
    const fullPath = path.join(projectDir, dir);
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`  [PASS]  Created: ${dir}/`);
  }

  // -- Sample: environment config --------------
  writeIfNotExists(
    path.join(projectDir, 'config/environments/dev.json'),
    JSON.stringify(
      {
        name: 'dev',
        baseUrl: 'https://your-dev-environment.com',
        serviceUrls: {
          auth: 'https://auth.your-dev-environment.com',
        },
        custom: {
          tenantId: 'tenant-001',
        },
      },
      null,
      2,
    ),
    'config/environments/dev.json',
  );

  // -- Sample: runtime settings -----------------
  writeIfNotExists(
    path.join(projectDir, 'config/runtime-settings/default.json'),
    JSON.stringify(
      {
        thinkTime: { mode: 'fixed', fixed: 1 },
        pacing: { enabled: false },
        http: { timeoutSeconds: 60, maxRedirects: 10, throwOnError: false },
        errorBehavior: 'continue',
        debugMode: false,
      },
      null,
      2,
    ),
    'config/runtime-settings/default.json',
  );

  // -- Sample: test plan -------------------------
  writeIfNotExists(
    path.join(projectDir, 'config/test-plans/load-test.json'),
    JSON.stringify(
      {
        name: 'Sample Load Test',
        environment: 'dev',
        execution_mode: 'parallel',
        global_load_profile: {
          executor: 'ramping-vus',
          startVUs: 0,
          stages: [
            { duration: '2m', target: 50 },
            { duration: '5m', target: 50 },
            { duration: '2m', target: 0 },
          ],
        },
        user_journeys: [
          {
            name: 'browse',
            scriptPath: 'scrum-suites/sample-team/tests/browse-journey.js',
            weight: 70,
          },
          {
            name: 'checkout',
            scriptPath: 'scrum-suites/sample-team/tests/checkout-journey.js',
            weight: 30,
          },
        ],
        global_sla: {
          p95: 3000,
          errorRate: 1,
        },
      },
      null,
      2,
    ),
    'config/test-plans/load-test.json',
  );

  // -- Sample: debug test plan -------------------
  writeIfNotExists(
    path.join(projectDir, 'config/test-plans/debug-test.json'),
    JSON.stringify(
      {
        name: 'Sample Debug Test',
        environment: 'dev',
        execution_mode: 'parallel',
        global_load_profile: {
          executor: 'shared-iterations',
          vus: 1,
          iterations: 1,
        },
        debug: {
          enabled: true,
          mode: 'diff',
          vus: 1,
          iterations: 1,
          reportDir: 'results/debug',
          failOnMissingRecordingLog: true,
        },
        user_journeys: [
          {
            name: 'browse',
            scriptPath: 'scrum-suites/sample-team/tests/browse-journey.js',
            recordingLogPath: 'scrum-suites/sample-team/recordings/browse-journey.recording-log.json',
          },
        ],
      },
      null,
      2,
    ),
    'config/test-plans/debug-test.json',
  );

  // -- Sample: .env template --------------------
  writeIfNotExists(
    path.join(projectDir, '.env.template'),
    `# Copy this file to .env and fill in your values
# NEVER commit .env to source control

K6_BASE_URL=https://your-environment.com
K6_API_KEY=your-api-key-here
K6_DEBUG=false
`,
    '.env.template',
  );

  // -- Sample: CSV data file --------------------
  writeIfNotExists(
    path.join(projectDir, 'scrum-suites/sample-team/data/p_users.csv'),
    `p_username,p_password,p_email
testuser001,P@ssw0rd1,testuser001@perf-test.local
testuser002,P@ssw0rd2,testuser002@perf-test.local
testuser003,P@ssw0rd3,testuser003@perf-test.local
`,
    'scrum-suites/sample-team/data/p_users.csv',
  );

  // -- Sample: recording log ---------------------
  writeIfNotExists(
    path.join(projectDir, 'scrum-suites/sample-team/recordings/browse-journey.recording-log.json'),
    JSON.stringify(
      [
        {
          harEntryId: 'sample_req_1',
          transaction: 'Homepage',
          recordingStartedAt: '2026-03-30T00:00:00.000Z',
          tags: {
            transaction: 'Homepage',
            har_entry_id: 'sample_req_1',
            recording_started_at: '2026-03-30T00:00:00.000Z',
          },
          request: {
            method: 'GET',
            url: 'https://your-dev-environment.com/',
            headers: [],
            queryParams: {},
            cookies: [],
            body: null,
          },
          response: {
            status: 200,
            headers: [],
            cookies: [],
            body: '<html></html>',
          },
        },
      ],
      null,
      2,
    ),
    'scrum-suites/sample-team/recordings/browse-journey.recording-log.json',
  );

  // -- Sample: browse journey script -------------
  writeIfNotExists(
    path.join(projectDir, 'scrum-suites/sample-team/tests/browse-journey.js'),
    `import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend } from 'k6/metrics';

// Transaction Trend metrics (LoadRunner-style per-transaction timing)
const txn_Homepage = new Trend('txn_Homepage');
const txn_ProductList = new Trend('txn_ProductList');

export default function () {
  group('Homepage', function () {
    const start = Date.now();
    // TODO: Replace with your baseUrl from config
    const res = http.get('https://your-dev-environment.com/');
    check(res, { 'Homepage: status 2xx': (r) => r.status >= 200 && r.status < 300 });
    txn_Homepage.add(Date.now() - start);
  });

  sleep(1); // think time between transactions

  group('Product List', function () {
    const start = Date.now();
    const res = http.get('https://your-dev-environment.com/products');
    check(res, { 'ProductList: status 2xx': (r) => r.status >= 200 && r.status < 300 });
    txn_ProductList.add(Date.now() - start);
  });

  sleep(1);
}
`,
    'scrum-suites/sample-team/tests/browse-journey.js',
  );

  // -- Sample: checkout journey script -----------
  writeIfNotExists(
    path.join(projectDir, 'scrum-suites/sample-team/tests/checkout-journey.js'),
    `import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend } from 'k6/metrics';

// Transaction Trend metrics (LoadRunner-style per-transaction timing)
const txn_Login = new Trend('txn_Login');
const txn_AddToCart = new Trend('txn_AddToCart');
const txn_Checkout = new Trend('txn_Checkout');

export default function () {
  group('Login', function () {
    const start = Date.now();
    const res = http.post('https://your-dev-environment.com/auth/login', JSON.stringify({
      // TODO: parameterize with p_username and p_password from data file
      username: 'testuser001',
      password: 'P@ssw0rd1',
    }), { headers: { 'Content-Type': 'application/json' } });
    check(res, { 'Login: status 200': (r) => r.status === 200 });
    // TODO: Correlate auth token -> c_authToken
    txn_Login.add(Date.now() - start);
  });

  sleep(1);

  group('Add To Cart', function () {
    const start = Date.now();
    const res = http.post('https://your-dev-environment.com/cart/add', JSON.stringify({
      productId: 'PROD-001',
      quantity: 1,
    }), { headers: { 'Content-Type': 'application/json' } });
    check(res, { 'AddToCart: status 2xx': (r) => r.status >= 200 && r.status < 300 });
    txn_AddToCart.add(Date.now() - start);
  });

  sleep(1);

  group('Checkout', function () {
    const start = Date.now();
    const res = http.post('https://your-dev-environment.com/checkout', '{}', {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res, { 'Checkout: status 2xx': (r) => r.status >= 200 && r.status < 300 });
    txn_Checkout.add(Date.now() - start);
  });

  sleep(1);
}
`,
    'scrum-suites/sample-team/tests/checkout-journey.js',
  );

  console.log(`\n[PASS]  Project scaffolded successfully!\n`);
  console.log('Next steps:');
  console.log('  1. Copy .env.template -> .env and fill in your values');
  console.log('  2. Update config/environments/dev.json with your base URL');
  console.log('  3. Update scripts in scrum-suites/sample-team/tests/');
  console.log('  4. Run: npx tsx core-engine/src/cli/run.ts validate --plan config/test-plans/load-test.json');
  console.log('  5. Run: npx tsx core-engine/src/cli/run.ts run --plan config/test-plans/load-test.json');
  console.log('  6. For replay debugging, start from: config/test-plans/debug-test.json\n');
}

function writeIfNotExists(filePath: string, content: string, label: string): void {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  [PASS]  Created: ${label}`);
  } else {
    console.log(`  –  Skipped (already exists): ${label}`);
  }
}
