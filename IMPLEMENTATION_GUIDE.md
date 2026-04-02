# Implementation Guide: Achieving Framework Requirements

Based on the `framework-requirements.md`, this guide outlines the exact, step-by-step procedures to achieve every defined requirement using the existing `K6-PerfFramework` architecture and commands. 

---

## Step 1: Framework Initialization & CI/CD Packaging
**Covers Requirement:** 3.6 (Framework Architecture & Packaging)

The framework is designed to abstract core logic away from project-specific domains. To start a new project or onboard a new team, you use the `init` CLI command. This creates the expected structure (`config/`, `scrum-suites/`, etc.).

**Command:**
```bash
npx tsx core-engine/src/cli/init.ts
```
*(If packaged via npm globally later, this becomes `k6-framework init`).*

---

## Step 2: HAR-based Script Generation
**Covers Requirements:** 3.1.1 (HAR Script Generation), 3.1.4 (Reusable Modules - Auto 2xx checks), 3.3.1 (Record & Replay Logging)

Instead of manually writing k6 HTTP requests, record your browser session, save it as a `.har` file, and place it in `scrum-suites/<your-team>/recordings/`. The framework generator will:
* Filter URLs (strip third-party telemetry).
* Group requests into transactions (based on `pageref`).
* Auto-inject standard `sleep()` think-times.
* Auto-inject 2xx Status checks.
* Annotate requests with HAR IDs (e.g., `har_entry: "log_R01"`).

**Command:**
```bash
# Format: <cli> generate <har-path> <team-name> <output-script-name>
npx tsx core-engine/src/cli/run.ts generate sample-team login-flow --har scrum-suites/sample-team/recordings/sample-login-flow.har
```

---

## Step 3: Test Parameterization
**Covers Requirement:** 3.1.2 (Parameterization)

To make your test data dynamic (like usernames and passwords):
1. Create a data file (e.g., `p_users.csv`) in `scrum-suites/<team>/data/`.
2. Following the **Variable Naming** convention, prefix all your parameterized variables with `p_` (e.g., `p_username`, `p_password`).
3. Under the hood, the `DataPoolManager.ts` reads this file. If the Virtual Users exceed the data pool, you can configure the runtime to `terminate`, `cycle`, or `continue_with_last`.

**Example Usage in Script:**
```javascript
import { DataPoolManager } from '../../../core-engine/src/data/DataPoolManager.js';
// Fetch dynamically loaded p_ variable
const p_username = DataPoolManager.get('p_users.csv', 'p_username');
```

---

## Step 4: Rule-based Auto-Correlation
**Covers Requirements:** 3.1.3 (Correlation), 3.5.1 (AI/MCP Integration Layer)

For dynamic network states (CSRF tokens, dynamic session IDs), do not write complex Regex in your JavaScript. 
1. Use the **Variable Naming** convention: Prefix correlated values with `c_` (e.g., `c_sessionToken`).
2. Add your rules to `scrum-suites/<team>/correlation-rules.json`.
3. Set your fallback plans (`fail`, `skip`, or a `default` hardcoded value).

**Example `correlation-rules.json`:**
```json
[
  {
    "name": "c_sessionToken",
    "source": "body",
    "extractor": "jsonpath",
    "pattern": "$.token",
    "fallback": "skip"
  }
]
```

---

## Step 5: Test Execution, Scenarios, and Runtime Settings
**Covers Requirements:** 3.2.1 (Test Runner & Scenarios), 3.2.2 (Runtime Settings)

You do not define k6 `options` inside the scripts. You control execution purely through configuration files.

1. **Global Settings**: Edit `config/runtime-settings/default.json` to define global `thinkTime`, `pacing`, and `errorBehavior` (e.g., `continue` or `stop_iteration`).
2. **Execution & Load Profile**: Create a JSON test plan in `config/test-plans/`. Define your `user_journeys` and the `global_load_profile`. The framework dynamically allocates parallel testing behavior natively.

**Example Test Plan (`config/test-plans/my-load-test.json`):**
```json
{
  "name": "Release Test",
  "execution_mode": "parallel",
  "global_load_profile": {
    "executor": "ramping-vus",
    "stages": [{ "duration": "5m", "target": 50 }]
  },
  "user_journeys": [
    { "name": "browse", "scriptPath": "scrum-suites/sample-team/tests/login-flow.js", "weight": 100 }
  ]
}
```

---

## Step 6: Debugging & HTML Diff Checking
**Covers Requirement:** 3.3.2 (Debugging Utility - Diff Checker)

If your generated script is failing, you can run a 1-VU (Virtual User) debug replay against your original `.har` file. The framework will test the replayed k6 network traffic against the browser's traffic and generate a side-by-side comparison.

**Command:**
```bash
# Uses the utility script via tsx to trigger the DiffChecker and generate the HTML report
npx tsx scrum-suites/sample-team/run-debug.ts scrum-suites/sample-team/tests/login-flow.js scrum-suites/sample-team/recordings/sample-login-flow.har ./results/diff-report.html
```

---

## Step 7: Validation, Reporting Hooks, and Pipeline Run
**Covers Requirements:** 3.4.1 (Custom Reporting Hooks), 3.6 (CI/CD Integration)

Before running a massive load test, validate your configurations. Once validated, execute the run. Depending on your configuration, the `ResultTransformer.ts` and Custom Reporters (`AzureReporter`, `GrafanaReporter`) will push the metrics using custom reporting hooks to your dashboard.

**Command (Pre-flight Validation):**
```bash
npx tsx core-engine/src/cli/run.ts validate --plan config/test-plans/my-load-test.json
```

**Command (Execute Test for CI/CD Pipeline):**
```bash
npx tsx core-engine/src/cli/run.ts run --plan config/test-plans/my-load-test.json
```
*(In a CI environment, you would abstract this in your `package.json` under `"scripts": { "test": "..." }` and execute `npm test`).*
