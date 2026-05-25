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
    'config/test_plans',
    'config/runtime_settings',
    'config/schemas',
    'config/correlation-rules',
    'testSuites/sample_team/tests',
    'testSuites/sample_team/data',
    'testSuites/sample_team/recordings',
    'testSuites/sample_team/results',
    'results',
  ];

  // Create folders
  for (const dir of dirs) {
    const fullPath = path.join(projectDir, dir);
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`  [PASS]  Created: ${dir}/`);
  }

  // -- Copy JSON schemas from framework into new project -----------
  // The framework's schemas serve as the single source of truth for validation,
  // IDE autocomplete, and doc generation. Copying them lets the new project
  // validate against the rich external schemas instead of falling back to the
  // limited inline schemas in SchemaValidator.
  // From dist/cli/init.js (__dirname = dist/cli), two levels up = repo root.
  const frameworkSchemasDir = path.resolve(__dirname, '..', '..', 'config', 'schemas');
  if (fs.existsSync(frameworkSchemasDir)) {
    for (const file of fs.readdirSync(frameworkSchemasDir)) {
      if (!file.endsWith('.schema.json')) continue;
      const src = path.join(frameworkSchemasDir, file);
      const dest = path.join(projectDir, 'config/schemas', file);
      writeIfNotExists(dest, fs.readFileSync(src, 'utf-8'), `config/schemas/${file}`);
    }
  } else {
    console.log(`  [WARN]  Framework schemas not found at ${frameworkSchemasDir} — skipping schema copy`);
  }

  // -- Sample: environment config --------------
  writeIfNotExists(
    path.join(projectDir, 'config/environments/dev.json'),
    JSON.stringify(
      {
        $schema: '../schemas/environment.schema.json',
        name: 'dev',
        baseUrl: 'https://your-dev-environment.com',
        serviceUrls: {
          auth: 'https://auth.your-dev-environment.com',
        },
        custom: {
          tenantId: 'tenant-001',
        },
        teamOverrides: {
          'sample_team': {
            baseUrl: 'https://sample_team.dev.your-company.com',
            serviceUrls: {
              auth: 'https://auth.sample_team.dev.your-company.com',
            },
            custom: {
              tenantId: 'sample_team-dev',
            },
          },
        },
      },
      null,
      2,
    ),
    'config/environments/dev.json',
  );

  // -- Sample: runtime settings -----------------
  writeIfNotExists(
    path.join(projectDir, 'config/runtime_settings/default.json'),
    JSON.stringify(
      {
        $schema: '../schemas/runtime_settings.schema.json',
        thinkTime: { ignoreThinkTime: false, globalOverride: true, mode: 'fixed', fixed: 1 },
        pacing: { enabled: false },
        http: { timeoutSeconds: 60, maxRedirects: 10, throwOnError: false },
        errorBehavior: 'continue',
        reporting: {
          transactionStats: ['count', 'pass', 'fail', 'avg', 'min', 'max', 'p(90)', 'p(95)'],
          includeTransactionTable: true,
          includeErrorTable: true,
          timeseries: {
            enabled: true,
            bucketSizeSeconds: 10,
          },
        },
        errors: {
          captureSnapshotOnFailure: true,
          maxSnapshotsPerRun: 20,
          includeRequestHeaders: true,
          includeRequestBody: true,
          includeResponseHeaders: true,
          includeResponseBody: false,
        },
        monitoring: {
          enabled: false,
          cpuWarningPercent: 80,
          memoryWarningPercent: 80,
          sampleIntervalSeconds: 10,
        },
        debugMode: false,
      },
      null,
      2,
    ),
    'config/runtime_settings/default.json',
  );

  // -- Sample: test plan -------------------------
  writeIfNotExists(
    path.join(projectDir, 'config/test_plans/load_test.json'),
    JSON.stringify(
      {
        $schema: '../schemas/test-plan.schema.json',
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
            scriptPath: 'testSuites/sample_team/tests/browse-journey.js',
            weight: 70,
          },
          {
            name: 'checkout',
            scriptPath: 'testSuites/sample_team/tests/checkout-journey.js',
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
    'config/test_plans/load_test.json',
  );

  // -- Sample: debug test plan -------------------
  writeIfNotExists(
    path.join(projectDir, 'config/test_plans/debug_test.json'),
    JSON.stringify(
      {
        $schema: '../schemas/test-plan.schema.json',
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
            scriptPath: 'testSuites/sample_team/tests/browse-journey.js',
            recordingLogPath: 'testSuites/sample_team/recordings/browse-journey.recording-log.json',
          },
        ],
      },
      null,
      2,
    ),
    'config/test_plans/debug_test.json',
  );

  // -- Sample: .env template --------------------
  writeIfNotExists(
    path.join(projectDir, '.env.template'),
    `# Copy this file to .env and fill in your values
# NEVER commit .env to source control

# Base URLs belong in config/environments/*.json
K6_API_KEY=your-api-key-here
K6_DEBUG=false
`,
    '.env.template',
  );

  // -- Sample: CSV data file --------------------
  writeIfNotExists(
    path.join(projectDir, 'testSuites/sample_team/data/p_users.csv'),
    `p_username,p_password,p_email
testuser001,P@ssw0rd1,testuser001@perf-test.local
testuser002,P@ssw0rd2,testuser002@perf-test.local
testuser003,P@ssw0rd3,testuser003@perf-test.local
`,
    'testSuites/sample_team/data/p_users.csv',
  );

  // -- Sample: recording log ---------------------
  writeIfNotExists(
    path.join(projectDir, 'testSuites/sample_team/recordings/browse-journey.recording-log.json'),
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
    'testSuites/sample_team/recordings/browse-journey.recording-log.json',
  );

  // -- Sample: browse journey script -------------
  writeIfNotExists(
    path.join(projectDir, 'testSuites/sample_team/tests/browse-journey.js'),
    `import { transaction, k6Check } from '../../../dist/utils/transaction.js';
import { request } from '../../../dist/utils/request.js';
import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';
import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';
import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';

const env = getEnvContext('sample_team', { baseUrl: 'https://your-dev-environment.com/' });
const __journeyLifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
  clearCookies();
}

export function actionPhase(ctx) {
  transaction('Homepage', () => {
    const res1 = request('GET', \`\${env.baseUrl}\`);
    k6Check(res1, { 'Homepage: status 2xx': (r) => r.status >= 200 && r.status < 300 });
  });

  thinktime();

  transaction('Product_List', () => {
    const res1 = request('GET', \`\${env.baseUrl}products\`);
    k6Check(res1, { 'ProductList: status 2xx': (r) => r.status >= 200 && r.status < 300 });
  });

  thinktime();
}

export function endPhase(ctx) {
}

export default function () {
  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });
}
`,
    'testSuites/sample_team/tests/browse-journey.js',
  );

  // -- Sample: checkout journey script -----------
  writeIfNotExists(
    path.join(projectDir, 'testSuites/sample_team/tests/checkout-journey.js'),
    `import { transaction, k6Check } from '../../../dist/utils/transaction.js';
import { request } from '../../../dist/utils/request.js';
import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';
import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';
import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';

const env = getEnvContext('sample_team', { baseUrl: 'https://your-dev-environment.com/' });
const __journeyLifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
  clearCookies();

  transaction('Login', () => {
    // TODO: parameterize with p_username and p_password from data file (use trackDataRow)
    const res1 = request('POST', \`\${env.baseUrl}auth/login\`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser001', password: 'P@ssw0rd1' }),
    });
    k6Check(res1, { 'Login: status 200': (r) => r.status === 200 });
    // TODO: extract auth token → ctx.correlation["authToken"] (auto-tracked via Proxy)
  });
}

export function actionPhase(ctx) {
  const correlation_vars = ctx.correlation;

  transaction('Add_To_Cart', () => {
    const res1 = request('POST', \`\${env.baseUrl}cart/add\`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'PROD-001', quantity: 1 }),
    });
    k6Check(res1, { 'AddToCart: status 2xx': (r) => r.status >= 200 && r.status < 300 });
  });

  thinktime();

  transaction('Checkout', () => {
    const res1 = request('POST', \`\${env.baseUrl}checkout\`, {
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    k6Check(res1, { 'Checkout: status 2xx': (r) => r.status >= 200 && r.status < 300 });
  });

  thinktime();
}

export function endPhase(ctx) {
}

export default function () {
  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });
}
`,
    'testSuites/sample_team/tests/checkout-journey.js',
  );

  console.log(`\n[PASS]  Project scaffolded successfully!\n`);
  console.log('Next steps:');
  console.log('  1. Copy .env.template -> .env and fill in your values');
  console.log('  2. Update config/environments/dev.json with your base URL');
  console.log('  3. Update scripts in testSuites/sample_team/tests/');
  console.log('  4. Run: npx tsx core_engine/src/cli/run.ts validate --plan config/test_plans/load_test.json');
  console.log('  5. Run: npx tsx core_engine/src/cli/run.ts run --plan config/test_plans/load_test.json');
  console.log('  6. For replay debugging, start from: config/test_plans/debug_test.json\n');
}

function writeIfNotExists(filePath: string, content: string, label: string): void {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  [PASS]  Created: ${label}`);
  } else {
    console.log(`  –  Skipped (already exists): ${label}`);
  }
}
