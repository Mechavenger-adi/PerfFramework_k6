# K6 Performance Framework: Comprehensive Usage Guide

Welcome to the K6-PerfFramework! This enterprise-grade framework wraps **k6** and **TypeScript** to provide a scalable, maintainable, and robust performance testing architecture. It separates reusable capabilities (the "Core Engine") from the actual load tests maintained by individual application teams ("Scrum Suites").

This guide will walk you through how the framework operates, the commands available, how configuration is managed, and provide concrete examples of the files you need to create to run your tests.

---

## 1. Core Concepts & Architecture

The framework is designed around several key operational layers:

- **Scenario Orchestration & Parallel Execution**: You don't need to manually configure complex k6 `options` objects in every script. The framework dynamically processes declarative test plans (JSON) to allocate Virtual Users (VUs) and structure scenarios logically (parallel, sequential, or hybrid).
- **Data Layer (`DataPoolManager`)**: Easily manages CSV/JSON test data. It ensures test data lines are shared safely and enforces uniqueness rules without exhausting data resources across active VUs.
- **Recording & Auto-Generation**: You can take standard `.har` recordings from a browser, discover domains interactively, choose which domains to keep, decide whether to include static assets, group actions into transactions based on page referrers, and output framework-aligned scripts with replay tags and replay logs.
- **Correlation Layer (`CorrelationEngine`)**: Extracts dynamic elements like CSRF or Bearer tokens transparently through explicit JSON rules, keeping your test scripts free from messy regex and parsing logic.
- **SLA & Reporting Layers**: Uses the framework transaction helpers (`initTransactions`, `startTransaction`, `endTransaction`) to record transaction metrics, tests them against SLA thresholds, and generates machine-readable run artifacts plus a unified tabbed HTML report for normal load runs.
- **Simple Lifecycle Authoring**: Generated and converted scripts now follow the framework shape of `initPhase(ctx)`, `actionPhase(ctx)`, and `endPhase(ctx)`, while the framework manages the per-VU lifecycle bridge underneath.

---

## 2. CLI Commands

The framework includes a CLI entrypoint (internally aliased as `k6-framework` or executed via `core-engine/src/cli/run.ts`) that orchestrates the entire workflow. 

Available commands include:

* **`init`**: Scaffolds a new performance project matching the framework's directory format in the targeted directory.
* **`generate <team> <script-name> --har <path>`**: Auto-generates a k6 script from a HAR recording and interactively asks which domains to include, whether to keep static assets, and which grouped transactions should belong to init/end phases.
* **`generate-byos <team> <script-name>`**: "Bring Your Own Script" - Scaffolds a ready-to-run phase-based template inside a team's scrum suite if you prefer to write boilerplate manually rather than dealing with HAR recordings.
* **`validate --plan <path> [options]`**: Runs the `GatekeeperValidator` to perform pre-flight checks on test plans and configs. It ensures you aren't referencing missing assets or violating schema definitions *before* wasting setup time on a broken run. 
* **`run --plan <path> [options]`**: Loads the plan, resolves the config, provisions VUs, injects temporary staging scripts under `.k6-temp`, and launches the native k6 binary under the hood with all appropriate outputs configured.
* **Test-plan driven debug mode**: If `debug.enabled` is set in the test plan, the `run` command automatically switches from load execution into per-journey replay debug mode, resolves the matching recording log, and generates HTML diff reports.

---

## 3. Configuration Hierarchy

Configuration follows a strict merge order utilizing the `ConfigurationManager.ts` to ensure consistency. The framework evaluates configuration in this precedence order (highest precedence wins):

1. **`.env` variables**: Secrets and tokens.
2. **CLI arguments**: Flags directly passed during run commands.
3. **Suite-level / Test Plan**: Specific test-plan SLAs and journey behavior (e.g., `load-test.json`).
4. **Runtime settings**: General `runtime-settings/default.json` controlling things like random think-time padding, error overrides, and pacing.
5. **Environment Config**: Environment-specific settings (e.g., `environments/dev.json`), usually pointing to specific base URLs.
6. **Framework defaults**: Built-in fallback values.

---

## 4. Run Artifacts & Reporting

Every normal local load run now produces a run folder containing:

- `summary.json`
- `transaction-metrics.json`
- `errors.ndjson`
- `warnings.ndjson`
- `ci-summary.json`
- `timeseries.json`
- `system-metrics.json`
- `RunReport.html`
- `run-manifest.json`

Compatibility outputs are still preserved:

- `TestDetails.html`
- `TestSummary.html`

For CI/CD, prefer consuming:

- `ci-summary.json` for pass/fail gating
- `transaction-metrics.json` for transaction-level stats
- `errors.ndjson` / `warnings.ndjson` for structured diagnostics

For humans, prefer:

- `RunReport.html`

---

## 5. Examples: Files You Need to Create

To run a test, you typically need to create or utilize three main components: a Test Plan, Correlation Rules (optional but recommended), and the actual Test Journey script.

### A. Test Plan (`config/test-plans/load-test.json`)

The Test Plan JSON dictates *how* the tests will run (the workload model). It splits test load by weights across journeys without you needing to do the math to allocate VUs mechanically.

```json
{
  "name": "Sample Load Test",
  "environment": "dev",
  "execution_mode": "parallel",
  "global_load_profile": {
    "executor": "ramping-vus",
    "startVUs": 0,
    "stages": [
      { "duration": "10s", "target": 5 },
      { "duration": "30s", "target": 5 },
      { "duration": "10s", "target": 0 }
    ]
  },
  "user_journeys": [
    { 
      "name": "browse_crocodiles", 
      "scriptPath": "scrum-suites/sample-team/tests/browse-journey.js", 
      "weight": 50 
    },
    { 
      "name": "checkout_crocodiles", 
      "scriptPath": "scrum-suites/sample-team/tests/checkout-journey.js", 
      "weight": 50 
    }
  ],
  "global_sla": { 
    "p95": 3000, 
    "errorRate": 40 
  }
}
```

### B. Correlation Rules (`scrum-suites/<team>/correlation-rules.json`)

Instead of burying token extractions heavily in JavaScript, you define rules in JSON files. The `CorrelationEngine` automatically intercepts responses, snags tokens based on these rules, and provides fallback behavior if it fails.

```json
[
  {
    "name": "csrfToken",
    "source": "body",
    "extractor": "jsonpath",
    "pattern": "csrfToken",
    "fallback": "fail",
    "isCritical": true
  },
  {
    "name": "sessionId",
    "source": "header",
    "extractor": "header",
    "pattern": "X-Session-Id",
    "fallback": "skip"
  }
]
```

### C. Typical Test Journey (`scrum-suites/<team>/tests/browse-journey.js`)

At its core, a journey is still a standard k6 script. The main difference now is that the framework expects the business flow to be split into `initPhase(ctx)`, `actionPhase(ctx)`, and `endPhase(ctx)`. The framework lifecycle helper then decides when each phase runs per VU for supported executors.

```javascript
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { initTransactions, startTransaction, endTransaction } from '../../../core-engine/src/utils/transaction.js';
import { createJourneyLifecycleStore, runJourneyLifecycle } from '../../../core-engine/src/utils/lifecycle.js';

initTransactions(['Login', 'Browse', 'Logout']);
const lifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
  group('Login', function () {
    startTransaction('Login');
    const res = http.post('https://example.com/login', JSON.stringify({
      username: 'user',
      password: 'pwd',
    }), { headers: { 'Content-Type': 'application/json' } });
    check(res, { 'Login: status 200': (r) => r.status === 200 });
    endTransaction('Login');
  });
}

export function actionPhase(ctx) {
  group('Browse', function () {
    startTransaction('Browse');
    const res = http.get('https://example.com/products');
    check(res, { 'Browse: status 200': (r) => r.status === 200 });
    endTransaction('Browse');
  });

  sleep(1); // think time
}

export function endPhase(ctx) {
  group('Logout', function () {
    startTransaction('Logout');
    const res = http.get('https://example.com/logout');
    check(res, { 'Logout: status 200': (r) => r.status === 200 });
    endTransaction('Logout');
  });
}

export default function () {
  runJourneyLifecycle(lifecycleStore, { initPhase, actionPhase, endPhase });
}
```

## 6. Getting Started Checklist

1. **Initialize your team's suite**: Run the `init` command or manually create your folder in `scrum-suites/<your-team>`.
2. **Generate baseline scripts**: Drop a `.har` file in your `recordings/` folder and run `generate <team> <script-name> --har <path>`. The generator will ask which domains to keep, whether to include static assets, and which grouped transactions belong in init/end. OR use `generate-byos` to create a blank phase-based template.
3. **Refine the Script**: Review the generated replay metadata logs and request tags, then adjust assertions, data, and correlation as needed.
4. **Extract dynamic values**: Add correlation definitions to your `correlation-rules.json`.
5. **Construct a Test Plan**: Create a new `.json` plan in `config/test-plans` targeting your new scripts.
6. **Validate & Run**: Run the `validate` command to ensure everything is correct, then execute the `run` command to kick off the load test.

---

## 6. Creating Scripts from a HAR File

The framework provides an automated pipeline (`HARParser` -> `TransactionGrouper` -> `ScriptGenerator`) to convert browser HAR recordings into ready-to-use k6 test scripts.

**How it works under the hood:**
1. **Discovery**: `HARParser` reads the `.har` file and the CLI shows you discovered request domains with request counts.
2. **Filtering**: You choose which domains to keep, and whether to include static assets such as CSS, JS, images, and fonts.
3. **Sanitization**: The parser sorts entries chronologically and removes unstable headers like `cookie`, `authorization`, `traceparent`, and `x-request-id`.
4. **Grouping**: `TransactionGrouper` aggregates refined requests into logical grouped blocks based on `pageref`.
5. **Generation**: `ScriptGenerator` outputs finalized k6 `.js` code that uses `initTransactions`, `startTransaction`, and `endTransaction`, and adds both replay tags and replay logs per request.

**Command Example:**
Using the framework's CLI generator:
```bash
# General format: k6-framework generate <team-name> <script-name> --har <path-to-har>

# Example using the main CLI entrypoint locally:
npx tsx core-engine/src/cli/run.ts generate sample-team login-test --har scrum-suites/sample-team/recordings/sample-login-flow.har
```

**Interactive prompts you will see:**
- domain selection from the HAR file
- whether to include static assets

**Generated script behavior:**
- keeps `har_entry` comments for readability
- logs structured replay metadata with `[k6-perf][replay]`
- attaches k6 request tags like `har_entry_id`, `transaction`, and `recording_started_at`
- uses framework transaction helpers instead of hand-written `Trend` timing blocks
- also writes a normalized recording log JSON file next to your HAR assets for later replay-to-recording matching
- updates a suite-local recording registry in `scrum-suites/<team>/recordings/.recording-index.json` so debug mode can auto-resolve the recording log later

---

## 7. Advanced Correlation Function Usage

The `CorrelationEngine` processes custom rules on the fly and extracts dynamic values (like CSRF tokens or session IDs) from HTTP responses without cluttering your script with complex regex logic.

**How it operates:**
1. **Initialize Engine**: Define your rules or load them from `correlation-rules.json`.
2. **Process Responses**: After a k6 HTTP call, pass the response to `engine.process(res)`. The engine applies extractors (Regex, JSONPath, etc.) and stores values in memory.
3. **Retrieve Values**: Use `engine.get('rule-name')` to fetch the token and inject it into your subsequent requests.

**Script Example:**
```javascript
import http from 'k6/http';
import { CorrelationEngine } from '../../../core-engine/src/correlation/CorrelationEngine.js';

// Load or define your correlation rules
const rules = [
    { name: 'csrf_token', extractor: 'regex', pattern: 'name="csrf" value="(.*)"' }
];
const engine = new CorrelationEngine(rules);

export default function() {
    // 1. Initial request to a page that returns a token
    let res = http.get('https://example.com/login');
    
    // 2. Trigger the correlation framework to extract the token into memory
    engine.process(res);       

    // 3. Safely retrieve the token
    let extractedToken = engine.get('csrf_token'); 

    // 4. Inject it into the subsequent POST request
    http.post('https://example.com/login', {
        username: 'user',
        password: 'pwd',
        csrf: extractedToken 
    });
}
```

---

## 8. Debugging Features

If a script is failing or dynamic values aren't correlating properly, the framework provides an internal `debug` suite (`DiffChecker`, `ReplayRunner`, and `RecordingLogResolver`) to compare your k6 script's network traffic against the original browser HAR recording.

- **`ReplayRunner.ts`**: Runs your target k6 script in constrained debug mode, captures replay-log output, and automatically compares it against the resolved recording log. Multiple debug iterations are supported.
- **`RecordingLogResolver.ts`**: Resolves the recording log from an explicit path, a suite-local registry entry, or the matching file in the same suite `recordings` folder. It never searches outside the journey's own suite.
- **`HTMLDiffReporter.ts` & `DiffChecker.ts`**: compare recorded vs replayed request and response details, score each step, support per-iteration views, group results by transaction, and generate a side-by-side HTML report with timings and variable sections.

**Debug test plan example:**
```json
{
  "name": "Sample Debug Test",
  "environment": "dev",
  "execution_mode": "parallel",
  "global_load_profile": {
    "executor": "shared-iterations",
    "vus": 1,
    "iterations": 1
  },
  "debug": {
    "enabled": true,
    "mode": "diff",
    "autoResolveRecordingLog": true,
    "vus": 1,
    "iterations": 3,
    "reportDir": "results/debug"
  },
  "user_journeys": [
    {
      "name": "login",
      "scriptPath": "scrum-suites/sample-team/tests/generated-sample-review.js"
    }
  ]
}
```

**Debug behavior notes:**
- `recordingLogPath` is optional unless you want to override the automatic resolver.
- If the recording log is missing, the report is still generated in replay-only mode and the recording side shows `No data`.
- If multiple recording logs match, the framework stops and asks you to set `recordingLogPath` explicitly.
- Reports now include:
  - iteration selector
  - all-iterations summary
  - request-wise replay duration from `response.timings.duration`
  - transaction-wise timing summary
  - global variables section per iteration
  - collapsible request variables section

**Example programmatic lifecycle:**
```typescript
import { ReplayRunner } from '../../../core-engine/src/debug/ReplayRunner.js';
import { DiffChecker } from '../../../core-engine/src/debug/DiffChecker.js';

// Step 1: Execute the script in diagnostic debug mode
ReplayRunner.runDebug({
    scriptPath: './scrum-suites/sample-team/tests/browse-journey.js',
    originalHarPath: './scrum-suites/sample-team/recordings/sample-login-flow.har',
    outHtmlPath: './results/debug-diff.html'
});

// Step 2 & 3: The DiffChecker compares the payloads
// (Under the hood, this generates request/response scores and an overall Match Score
// so you can see exactly which method, status, header, or body changed)
const diffResult = DiffChecker.compare(originalHarEntry, replayedK6Entry);
console.log(`Transaction: ${diffResult.transactionName}`);
console.log(`Overall Score: ${diffResult.matchScore}%`);
console.log(`Request Score: ${diffResult.requestScore}%`);
console.log(`Response Score: ${diffResult.responseScore}%`);
```

**Report output includes:**
- grouping by transaction
- percentage score per request
- side-by-side recorded vs replayed method, URL, status, headers, and bodies
- expandable request and response diff sections
- safer matching when you use normalized recording and replay logs keyed by `harEntryId`
