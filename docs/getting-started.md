# Getting Started

> Derived from the root `README.md`. Assumes you've finished [Installation](installation.md).

This walks you from an empty project to a first load run and a debug diff report.

## 1. Scaffold a project

```bash
npm run init                        # scaffold into the current directory
# or: npm run cli -- init --dir path/to/project
```

This creates `config/`, `testSuites/`, and starter files.

## 2. Author a journey script

Fastest paths to a script:

```bash
# Generate from a browser HAR recording
npm run generate -- Jpet_new buyanimal --har testSuites/Jpet_new/recordings/buyanimal.har

# Convert an existing conventional k6 script
npm run convert -- path/to/input-script.js Jpet_new converted-script

# Start from a blank framework-shaped script (BYOS)
npm run cli -- generate-byos Jpet_new buyanimal

# Import a cURL command or Postman collection
npm run cli -- import curl Jpet_new login --clipboard
```

A framework journey script uses the phase-based shape (login once → actions repeat → logout once):

```javascript
import http from 'k6/http';
import { transaction, k6Check } from '../../../dist/index.js';
import { createJourneyLifecycleStore, runJourneyLifecycle } from '../../../dist/index.js';

const lifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) { /* login / setup, runs once per VU */ }

export function actionPhase(ctx) {
  transaction('Launch', () => {
    const res = http.get(`${ctx.session.baseUrl}/`);
    k6Check(res, { 'status 200': (r) => r.status === 200 });
  });
}

export function endPhase(ctx) { /* logout / cleanup, runs once per VU */ }

export default function () {
  runJourneyLifecycle(lifecycleStore, { initPhase, actionPhase, endPhase });
}
```

Use `transaction()` + `k6Check()` (not raw k6 `group()`/`check()`) — the framework's pre-flight guard
rejects raw calls because only `k6Check` inside `transaction` yields exact pass/fail. See
[EDD-lifecycle](../engineering_docs/edd/EDD-lifecycle.md) for why.

## 3. Validate before running

```bash
npm run validate -- --plan config/test_plans/load_test.json --verbose
```

## 4. Debug replay (recommended before load)

Run once, diff against the recording, get an HTML report:

```bash
npm run cli -- debug --script testSuites/Jpet_new/tests/buyanimal.js
```

## 5. Run the load test

```bash
npm run cli -- run --plan config/test_plans/load_test.json
# shortcut for the default plan:
npm run loadtest
```

## 6. Read the results

Artifacts land under `results/<plan-name>/Run_<timestamp>/`:

| File | What |
|------|------|
| `RunReport.html` | primary human report (tabs: summary, transactions, graphs, errors) |
| `ci-summary.json` | CI pass/fail — **consume this in pipelines, not console text** |
| `transaction-metrics.json` | per-transaction stats (pass/fail from `_checkrate`) |
| `timeseries.json` | bucketed trend data |
| `errors.ndjson` / `warnings.ndjson` | structured events |

## Next
- [CLI Reference](cli-reference.md) — all commands
- [Configuration Guide](configuration.md) — test plans, runtime settings, SLAs
- [Troubleshooting](troubleshooting.md)
