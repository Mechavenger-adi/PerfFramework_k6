# K6 Performance Framework

A TypeScript-powered performance testing framework on top of Grafana k6. The framework helps teams organize k6 scripts into scrum-suite folders, generate scripts from HAR recordings, validate configuration before execution, run load/debug test plans, and produce structured reports for humans and CI.

## What This Framework Provides

- Declarative test plans for parallel, sequential, and hybrid journey execution.
- Team-owned test suites under `testSuites/<team>/`.
- HAR-to-k6 script generation with transaction grouping and replay metadata.
- BYOS support for wrapping existing k6 scripts in the framework lifecycle.
- Environment, runtime, SLA, and secret configuration resolution.
- Gatekeeper validation before running a test.
- Transaction metrics, snapshots, warnings, errors, CI summaries, and HTML reports.
- Debug replay mode for comparing generated scripts with original recordings.

## Repository Layout

```text
K6-PerfFramework/
  core_engine/                 Framework TypeScript source
  dist/                        Compiled JavaScript output
  config/
    environments/              Environment configs such as dev.json
    runtime_settings/          Runtime behavior such as think time and reporting
    schemas/                   JSON schemas for validation
    test_plans/                Runnable test plans
  testSuites/
    <team>/
      tests/                   k6 journey scripts
      recordings/              HAR files and normalized recording logs
      data/                    CSV/JSON test data
  templates/                   Reusable test-plan and runtime templates
  results/                     Generated local run artifacts
```

## Prerequisites

Install these before running the framework:

- Node.js 22 or later
- npm 11 or later
- Grafana k6 installed and available on `PATH`
- Git

Verify the tools:

```bash
node --version
npm --version
k6 version
git --version
```

Install k6:

```bash
# Windows
winget install k6

# macOS
brew install k6

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install k6
```

## First-Time Setup

From the repository root:

```bash
npm install
npm run build
```

Create a local `.env` file when secrets or local output overrides are needed:

```bash
copy .env.template .env
```

On macOS/Linux:

```bash
cp .env.template .env
```

Do not commit `.env`.

Useful `.env` values:

```dotenv
K6_RESULTS_BASE_DIR=results
K6_INFLUXDB_URL=http://localhost:8086/k6
```

`K6_INFLUXDB_URL` is optional. When set, the runner adds an InfluxDB k6 output.

## Common Commands

Run all commands from the repository root.

```bash
# Show CLI help
npm run cli -- --help

# Build TypeScript
npm run build

# Type-check without emitting files
npm run typecheck

# Validate a test plan
npm run validate -- --plan config/test_plans/load_test.json

# Run the default load test plan shortcut
npm run loadtest

# Run the default debug test plan shortcut
npm run debug

# Run any test plan
npm run cli -- run --plan config/test_plans/load_test.json
```

## Configuration Files

### Environment Config

Environment files live in `config/environments/`. The test plan `environment` value must match one of these files.

Example: `config/environments/dev.json`

```json
{
  "$schema": "../schemas/environment.schema.json",
  "name": "dev",
  "testSuites": {
    "Jpet_new": {
      "baseUrl": "https://jpetstore.aspectran.com"
    }
  }
}
```

Use `testSuites` keys that match the team folder under `testSuites/`.

### Runtime Settings

Runtime settings live in `config/runtime_settings/default.json`. They control think time, pacing, HTTP behavior, error behavior, reporting, snapshots, monitoring, and debug verbosity.

Use a custom runtime file with:

```bash
npm run cli -- run --plan config/test_plans/load_test.json --runtime config/runtime_settings/default.json
```

### Test Plan

Test plans live in `config/test_plans/`. A plan selects the environment, workload model, journeys, and SLA rules.

Example:

```json
{
  "$schema": "../schemas/test-plan.schema.json",
  "name": "WebUI Load Test - jpet",
  "environment": "dev",
  "execution_mode": "parallel",
  "global_load_profile": {
    "executor": "ramping-vus",
    "startVUs": 0,
    "stages": [
      { "duration": "5s", "target": 5 },
      { "duration": "30s", "target": 5 },
      { "duration": "5s", "target": 0 }
    ]
  },
  "noCookiesReset": true,
  "user_journeys": [
    {
      "name": "buyanimal_raw_19thmay",
      "scriptPath": "buyanimal_raw_19thmay.js",
      "weight": 100
    }
  ],
  "global_sla": {
    "p99": 2000,
    "errorRate": 10
  }
}
```

When a journey script path is just a file name, the framework resolves it from the matching scrum-suite test folder. Fully qualified relative paths such as `testSuites/Jpet_new/tests/buyanimal_raw_19thmay.js` are also supported.

## Creating a New Suite or Script

### Initialize Project Structure

```bash
npm run init
```

To scaffold into another directory:

```bash
npm run cli -- init --dir path/to/project
```

### Use the Interactive Wizard

```bash
npm run cli -- new
```

Use this to create test plans or runtime settings from built-in templates.

### Create a BYOS Script Template

Use this when you already have a k6 script or want a blank framework-compatible script:

```bash
npm run cli -- generate-byos Jpet_new buyanimal
```

This creates a script under:

```text
testSuites/Jpet_new/tests/
```

### Convert an Existing k6 Script

```bash
npm run convert -- path/to/input-script.js Jpet_new converted-script
```

To overwrite the input file:

```bash
npm run cli -- convert path/to/input-script.js Jpet_new converted-script --in-place
```

### Generate a Script from HAR

Place a browser HAR file under your suite recordings folder, for example:

```text
testSuites/Jpet_new/recordings/buyanimal.har
```

Generate the script:

```bash
npm run generate -- Jpet_new buyanimal --har testSuites/Jpet_new/recordings/buyanimal.har
```

The generator prompts for domain selection and whether static assets should be included. It writes the generated k6 script and a normalized recording log for debug comparisons.

## Running a Test

Recommended flow:

```bash
npm run build
npm run validate -- --plan config/test_plans/load_test.json --verbose
npm run cli -- run --plan config/test_plans/load_test.json
```

Optional run flags:

```bash
# Use explicit environment config
npm run cli -- run --plan config/test_plans/load_test.json --env-config config/environments/dev.json

# Use explicit runtime settings
npm run cli -- run --plan config/test_plans/load_test.json --runtime config/runtime_settings/default.json

# Use a custom .env path
npm run cli -- run --plan config/test_plans/load_test.json --env-file .env

# Pass an additional k6 output
npm run cli -- run --plan config/test_plans/load_test.json --out json=results/raw-k6-output.json

# Print resolved config/debug information
npm run cli -- run --plan config/test_plans/load_test.json --debug
```

## Debug Replay Mode

Debug mode runs journeys with a small VU/iteration count and generates an HTML diff report against the normalized recording log.

Use the ready-made shortcut:

```bash
npm run debug
```

Or run a debug-enabled plan:

```bash
npm run cli -- run --plan config/test_plans/debug_test.json
```

Standalone debug for one script:

```bash
npm run cli -- debug --script testSuites/Jpet_new/tests/buyanimal_raw_19thmay.js
```

With an explicit recording log and output path:

```bash
npm run cli -- debug ^
  --script testSuites/Jpet_new/tests/buyanimal_raw_19thmay.js ^
  --recording-log testSuites/Jpet_new/recordings/buyanimal_raw_19thmay.recording-log.json ^
  --out results/debug-diff.html
```

On macOS/Linux, replace `^` with `\` for multiline commands.

## Reports and Artifacts

Normal runs write timestamped artifacts under:

```text
results/<safe-test-plan-name>/Run_<timestamp>/
```

If `K6_RESULTS_BASE_DIR` is set, that directory is used instead of `results`.

Important files:

- `RunReport.html` - primary human-readable report.
- `TestSummary.html` - k6 web dashboard export.
- `handleSummary.json` - raw k6 end-of-test summary (the only k6 summary artifact).
- `run-summary.json` - CI-friendly pass/fail gate **plus** the per-transaction table.
- `errors.ndjson` - structured run errors.
- `warnings.ndjson` - structured warnings.
- `timeseries.json` - bucketed trend data.
- `system-metrics.json` - host monitoring snapshots.
- `run-manifest.json` - run metadata and artifact paths.

Debug runs write reports under the configured debug report directory, usually:

```text
results/debug/<safe-test-plan-name>/Run_<timestamp>/
```

## Built-In Discovery Commands

```bash
# List framework capabilities
npm run cli -- features

# List test-plan templates
npm run cli -- templates list --type test_plans

# Show a test-plan template
npm run cli -- templates show smoke --type test_plans

# List runtime-setting templates
npm run cli -- templates list --type runtime_settings

# Show a runtime-setting template
npm run cli -- templates show local-debug --type runtime_settings

# Regenerate schema documentation
npm run cli -- docs

# Inspect final merged configuration
npm run cli -- config inspect --plan config/test_plans/load_test.json
```

## Authoring Journey Scripts

Generated and BYOS scripts use a phase-based shape:

```javascript
import http from 'k6/http';
import { check, group } from 'k6';
import { initTransactions, startTransaction, endTransaction } from '../../../core_engine/src/utils/transaction.js';
import { createJourneyLifecycleStore, runJourneyLifecycle } from '../../../core_engine/src/utils/lifecycle.js';

initTransactions(['Launch']);
const lifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
  // Optional login/setup work.
}

export function actionPhase(ctx) {
  group('Launch', function () {
    startTransaction('Launch');
    const res = http.get('https://example.com');
    check(res, { 'Launch status is 200': (r) => r.status === 200 });
    endTransaction('Launch');
  });
}

export function endPhase(ctx) {
  // Optional logout/cleanup work.
}

export default function () {
  runJourneyLifecycle(lifecycleStore, { initPhase, actionPhase, endPhase });
}
```

Use transaction names consistently. They appear in console summaries, `run-summary.json`, SLA checks, and `RunReport.html`.

## Troubleshooting

- `k6` command not found: install k6 and ensure it is available on `PATH`.
- Validation fails for environment: confirm the test plan `environment` matches `config/environments/<name>.json`.
- Journey script not found: confirm the `scriptPath` and team folder are correct.
- Missing recording log in debug: pass `recordingLogPath` in the test plan or use `--recording-log`.
- Reports are not where expected: check `K6_RESULTS_BASE_DIR` in `.env`.
- TypeScript changes not reflected: run `npm run build`.

## More Documentation

Start at the [Framework Atlas](FrameworkAtlas.md) (navigation for humans and AI) or the
[docs index](docs/index.md).

- [Installation](docs/installation.md) · [Getting Started](docs/getting-started.md)
- [CLI Reference](docs/cli-reference.md) *(generated)* · [Configuration Guide](docs/configuration.md) · [Configuration Reference](docs/configuration-reference.md) *(generated)*
- [Migration](docs/migration.md) · [Troubleshooting](docs/troubleshooting.md) · [FAQ](docs/faq.md)
- Engineering deep-dives: `engineering_docs/edd/` (lifecycle, correlation, replay, reporting, config)
- Historical/superseded docs are frozen under `archive/`.
