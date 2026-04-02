# K6 Performance Framework: A Detailed Guide

This guide provides a comprehensive overview of the K6 Performance Framework, from initial setup to advanced features. It is based on the framework's documentation and source code analysis.

## 1. Overview

The K6 Performance Framework is a powerful, configuration-driven platform built on top of the popular open-source load testing tool, k6. It aims to provide an enterprise-grade solution for performance engineering, combining the scripting flexibility of k6 with the structure, reusability, and maintainability required for large-scale projects.

### Core Principles

*   **Configuration-Driven:** Behavior is controlled through JSON configuration files, not hard-coded in scripts.
*   **Convention-Based:** The framework follows sensible defaults and established patterns to reduce boilerplate and increase consistency.
*   **Decoupled Architecture:** The core engine is separated from team-specific test suites, allowing for independent development and centralized governance.
*   **CI/CD Ready:** Designed for seamless integration into automated pipelines with CLI-based execution.
*   **Enterprise-Ready Features:** Includes advanced capabilities like automated correlation, detailed debugging, and pluggable reporting.

## 2. Prerequisites

Before you begin, ensure you have the following installed and configured:

| Requirement      | Version | Notes                                                               |
| ---------------- | ------- | ------------------------------------------------------------------- |
| Node.js          | ≥ 22    | Check with `node --version`                                         |
| npm              | ≥ 11    | Check with `npm --version`                                          |
| k6               | Latest  | [Install k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) |
| TypeScript       | Basic   | Knowledge of TypeScript is beneficial for writing journey scripts.    |

## 3. Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Raaaka/K6-PerfFramework.git
    cd K6-PerfFramework
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## 4. Project Structure

The framework uses a clear and organized folder structure to separate concerns:

```
/K6-PerfFramework
│
├── /core-engine/src          ← Framework internals (do not edit)
│
├── /scrum-suites             ← Your team's test suites live here
│   └── /<your-team>
│       ├── /tests            ← Your journey scripts (.js or .ts)
│       ├── /data             ← Test data files (e.g., .csv, .json)
│       └── /results          ← Test output files
│
├── /config
│   ├── /environments         ← Environment-specific settings (e.g., dev.json)
│   ├── /runtime-settings     ← Global test execution settings
│   └── /test-plans           ← Test plan definitions
│
├── .env                      ← Your secrets (e.g., API keys). Copy from .env.template.
├── .env.template             ← A template for the .env file.
├── package.json              ← Project dependencies and scripts.
└── tsconfig.json             ← TypeScript compiler options.
```

## 5. Getting Started: A Step-by-Step Guide

This tutorial will walk you through creating and running your first performance test.

### Step 1: Initialize a New Project

The framework provides a CLI command to scaffold a new sample test suite.

```bash
npm run cli -- init
```

This will create a new directory inside `scrum-suites` containing a sample project structure and files. You can rename the created directory to match your team or project name.

### Step 2: Set Up the Environment

1.  **Create a `.env` file:**
    Copy the `.env.template` to a new file named `.env` and fill in any required secrets.

    ```bash
    cp .env.template .env
    ```

    **Example `.env` file:**
    ```env
    K6_API_KEY=your-secret-api-key
    ```

2.  **Create an environment configuration file:**
    In the `config/environments` directory, create a JSON file for your target environment (e.g., `dev.json`).

    **Example `config/environments/dev.json`:**
    ```json
    {
      "name": "dev",
      "baseUrl": "https://test-api.k6.io"
    }
    ```

### Step 3: Configure Runtime Settings

The `config/runtime-settings/default.json` file controls the global behavior of your tests. You can customize think time, HTTP settings, and error handling here.

**Example `config/runtime-settings/default.json`:**
```json
{
  "thinkTime": { "mode": "random", "min": 1, "max": 3 },
  "http": { "timeoutSeconds": 60, "throwOnError": false },
  "errorBehavior": "continue"
}
```

### Step 4: Write a Journey Script

A journey script is a standard k6 script that simulates a user's actions. Create a new file in your team's `tests` directory (e.g., `scrum-suites/my-new-team/tests/browse.js`).

**Example `browse.js`:**
```javascript
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// Create a Trend metric for each transaction
const txn_HomePage = new Trend('txn_HomePage');

export default function () {
  // Use group() to define a transaction
  group('Homepage', function () {
    const start = Date.now();

    const res = http.get('https://test.k6.io/');

    check(res, { 'status is 200': (r) => r.status === 200 });

    // Add the transaction duration to the Trend metric
    txn_HomePage.add(Date.now() - start);
  });

  sleep(1); // Think time
}
```

### Step 5: Create a Test Plan

The test plan is a JSON file in the `config/test-plans` directory that brings everything together.

**Example `config/test-plans/my-load-test.json`:**
```json
{
  "name": "My First Load Test",
  "environment": "dev",
  "execution_mode": "parallel",
  "global_load_profile": {
    "executor": "ramping-vus",
    "stages": [
      { "duration": "10s", "target": 5 },
      { "duration": "30s", "target": 5 },
      { "duration": "10s", "target": 0 }
    ]
  },
  "user_journeys": [
    {
      "name": "browse_homepage",
      "scriptPath": "browse.js",
      "weight": 100
    }
  ],
  "global_sla": {
    "p95": 1000,
    "errorRate": 5
  }
}
```
*Note: The framework will automatically find `browse.js` inside the `scrum-suites` directory.*

### Step 6: Validate the Test Plan

Before running the test, use the `validate` command to check your configuration for errors.

```bash
npm run cli -- validate --plan config/test-plans/my-load-test.json
```

This will check for issues like missing files, invalid schemas, and incorrect configurations.

### Step 7: Run the Test

Once validation passes, run the test using the `run` command.

```bash
npm run cli -- run --plan config/test-plans/my-load-test.json
```

You can also use various options to customize the run:
```bash
# Override the environment
npm run cli -- run --plan <plan> --env-config config/environments/staging.json

# Enable debug mode
npm run cli -- run --plan <plan> --debug

# Output results to a JSON file
npm run cli -- run --plan <plan> --out json=results/output.json
```

## 6. Key Features in Detail

### Test Authoring (Journeys)

*   **Standard k6:** Journey scripts use the standard k6 API, making them easy to write for anyone with k6 experience.
*   **Transactions with `group()`:** Use the `group()` function to define logical transactions within your script.
*   **Framework Transaction Helpers:** Prefer `initTransactions`, `startTransaction`, and `endTransaction` so transaction timing stays aligned with the framework's `txn_*` metrics and generated scripts look consistent.

    ```javascript
    import { initTransactions, startTransaction, endTransaction } from '../../../core-engine/src/utils/transaction.js';
    initTransactions(['MyTransaction']);

    group('MyTransaction', function() {
        startTransaction('MyTransaction');
        // ... your requests ...
        endTransaction('MyTransaction');
    });
    ```
*   **Framework Logger:** While you can use `console.log`, it is recommended to use the framework's built-in logger for consistent, formatted output.

    ```javascript
    import { Logger } from '@k6-perf/core-engine';
    Logger.info('This is an info message');
    Logger.error('This is an error message');
    ```

### Data Parameterization

*   **CSV Data:** The framework supports loading data from CSV files. Create a CSV file in your team's `data` directory (e.g., `p_users.csv`). The `p_` prefix is a convention for parameterized data.

    To use the data in your script:
    ```javascript
    import { SharedArray } from 'k6/data';
    import papaparse from 'https://jslib.k6.io/papaparse/5.3.2/index.js';

    const users = new SharedArray('users', function () {
      return papaparse.parse(open('../data/p_users.csv'), { header: true }).data;
    });

    export default function () {
      const user = users[__VU - 1 % users.length];
      console.log(`Username: ${user.p_username}`);
    }
    ```
*   **Dynamic Value Factory:** The framework provides a factory for generating dynamic data at runtime.

    ```javascript
    import { DynamicValueFactory } from '@k6-perf/core-engine';

    const timestamp = DynamicValueFactory.timestamp('YYYY-MM-DD');
    const uuid = DynamicValueFactory.uuid();
    const randomInt = DynamicValueFactory.randomInt(1, 100);
    ```

### Assertions and SLAs

Define your Service Level Agreements (SLAs) directly in your test plan. The framework will automatically create k6 thresholds based on your SLA definitions.

```json
"global_sla": {
  "p95": 500,        // 95th percentile response time < 500ms
  "errorRate": 1     // Error rate < 1%
}
```

You can also define SLAs for specific transactions:
```json
"user_journeys": [
  {
    "name": "login",
    "scriptPath": "login.js",
    "weight": 50,
    "sla": {
      "p99": 800
    }
  }
]
```

### Bring Your Own Script (BYOS)

If you have existing k6 scripts, you can easily integrate them into the framework using the `generate-byos` command.

```bash
npm run cli -- generate-byos <your-team> <script-name>
```

This creates a template script in your team's `tests` directory. Simply paste your existing k6 code into the designated area in the template.

## 7. CLI Reference

The framework provides a set of CLI commands for common tasks.

*   `npm run cli -- init <team-name>`: Scaffolds a new test suite.
*   `npm run cli -- validate --plan <path-to-plan>`: Validates a test plan.
*   `npm run cli -- run --plan <path-to-plan>`: Runs a test plan.
*   `npm run cli -- generate-byos <team> <script>`: Generates a template for an existing k6 script.
*   `npm run cli -- generate <your-team> <script-name> --har <path-to-har>`: Generates a journey script from a HAR file and interactively asks which domains to include and whether to keep static assets.
*     `npm run cli -- generate sample-team login-test --har scrum-suites/sample-team/recordings/sample-login-flow.har`
*   The generator also writes a normalized recording log JSON file so replay comparison can match by `harEntryId` instead of relying only on URL/order.
*   The generator updates a suite-local registry in `scrum-suites/<team>/recordings/.recording-index.json`, which the debug resolver uses to auto-link scripts to their recording logs.

## 8. Debug Replay Automation

The framework now supports test-plan driven replay debugging.

Use a debug test plan like:

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
    "iterations": 2,
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

Run it with:

```bash
npm run cli -- run --plan config/test-plans/debug-test.json
```

Behavior:

- If `recordingLogPath` is provided on the journey, that path wins.
- If it is omitted, the framework auto-resolves the recording log from the same suite `recordings` folder.
- If the recording log is missing, the framework still generates a replay-only HTML report with a warning banner.
- If multiple recording logs match, the framework fails and asks for explicit `recordingLogPath`.
- The HTML report includes:
  - iteration selector and all-iterations summary
  - request and transaction timing summaries
  - side-by-side request and response bodies
  - global variables section per iteration
  - collapsible request variables section

## 8. Troubleshooting

| Problem                      | Likely Cause                                | Solution                                                                 |
| ---------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `Script file not found`      | `scriptPath` in test plan is incorrect.     | Ensure the script exists in one of the `scrum-suites` directories.       |
| `k6: command not found`      | k6 is not installed or not in your PATH.    | [Install k6](https://grafana.com/docs/k6/latest/set-up/install-k6/).       |
| `Required variable missing`  | A required secret is not in your `.env` file. | Copy `.env.template` to `.env` and fill in all required values.        |
| Test fails on `401` or `403` | Script requires authentication.             | Ensure you are handling login and authentication cookies correctly.      |
| Type errors on `npm run typecheck` | Code has TypeScript errors.                 | `tsx` does not type-check by default. Run `npm run typecheck` separately. |
