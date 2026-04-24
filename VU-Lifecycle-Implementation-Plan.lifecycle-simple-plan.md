# VU Lifecycle Implementation Plan

## Objective

Replicate LoadRunner-style `vuser_init` / `Action` / `vuser_end` behavior in k6 while keeping the **user-facing journey script as simple as possible**.

The agreed design goal is:

- **Simple for script authors**
- **Framework handles lifecycle complexity internally**
- **Safe for load and endurance execution**

---

## Final Direction

### User-facing script contract

Journey authors should write only business-flow code using these exports:

```javascript
export function initPhase(ctx) {}
export function actionPhase(ctx) {}
export function endPhase(ctx) {}
```

Where:

- `initPhase(ctx)` = run once per VU when the VU enters an active window
- `actionPhase(ctx)` = repeat for the life of that VU
- `endPhase(ctx)` = run once when the VU is scheduled to exit, when k6 allows it

### Per-VU memory

The framework provides a per-VU `ctx` object:

```javascript
ctx = {
  data: {},
  session: {},
  correlation: {},
  meta: {},
}
```

Recommended use:

- `ctx.data` = parameterized CSV / test data values
- `ctx.session` = cookies, auth tokens, login state
- `ctx.correlation` = dynamic extracted values like product id, order id, csrf token
- `ctx.meta` = optional helper/debug values

### Hidden framework wrapper

The framework, not the user script, will own:

- VU lifecycle routing
- per-VU state initialization/reset
- ramp-down exit-time math
- executor-specific lifecycle handling
- reactivation handling for multi-spike scenarios

This logic should live in a shared runtime helper or generated wrapper layer, **not** directly in the user-visible journey script.

---

## Why We Changed Direction

The earlier prototype proved the logic works, but it also made the generated script too complex for new users:

- large `default()` controller
- `__PHASES` / `__getExitInfoForVU()`
- state reset logic
- lifecycle math in the script
- too much framework plumbing mixed with business flow

That would make script authorship, review, and onboarding harder than necessary.

The new direction keeps the author-facing file close to the LoadRunner mental model while preserving the framework’s ability to simulate per-VU init/action/end.

---

## Example: Desired User-Facing Script

### buyanimal journey shape

For the existing buy-animal flow, the intended split is:

- **Init**: `t01_launch`, `t02_login`
- **Action**: `search_animal`, `select_product`, `add_to_cart`, `increase_quantity_to_2_and_proceed_to_checkout`, `click_continue`, `click_confirm`
- **End**: `logout`

### Example author-facing script

```javascript
export function initPhase(ctx) {
  // choose user data
  // login
  // save tokens/session to ctx
}

export function actionPhase(ctx) {
  // search animal
  // select product
  // add to cart
  // checkout
  // save dynamic IDs to ctx.correlation
}

export function endPhase(ctx) {
  // logout using ctx.session / ctx.correlation
}
```

The user should not have to care about:

- `exec.vu.idInInstance`
- elapsed time
- stage analysis
- VU removal math
- reactivation windows

---

## Runtime Model

### Lifecycle wrapper behavior

The hidden wrapper should do this:

1. Create one `ctx` per VU.
2. Read lifecycle config and computed phase timing from framework env/config.
3. On first active call for a VU window, run `initPhase(ctx)` if present.
4. On normal iterations, run `actionPhase(ctx)`.
5. When the VU reaches its scheduled exit time, run `endPhase(ctx)` if present.
6. If k6 reuses a VU for a later spike window, reset the VU context and run init again.

### Supported executors for v1

Lifecycle support should be officially supported in v1 only for:

- `ramping-vus` with explicit final `target: 0`
- optionally `per-vu-iterations`

Lifecycle should be **unsupported or clearly best-effort** for:

- `constant-vus`
- `shared-iterations`
- `ramping-arrival-rate`
- `constant-arrival-rate`

### Exit timing model

For `ramping-vus`, the framework computes a cumulative timeline from stages and determines which VU IDs are removed during each ramp-down segment.

For a ramp-down segment from `prevVUs` to `targetVUs`:

```text
removedCount = prevVUs - targetVUs
offset = prevVUs - vuId
exitTime = segmentStart + segmentDuration * (offset / removedCount)
```

This correctly handles cases like `10 -> 4` and avoids the earlier incorrect simplification that only worked when the target was `0`.

---

## Performance / Endurance Design Rules

To keep lifecycle support safe for load and endurance testing:

- Keep the wrapper thin.
- Keep `ctx` small.
- Never store full response bodies in `ctx`.
- Disable replay/debug logging in normal load runs.
- Avoid generating large duplicated helper code into every script when a shared runtime helper will do.
- Limit correlation and variable tracking to what the journey actually needs.

Expected impact:

- lifecycle control logic itself should be low overhead
- the real execution cost remains dominated by HTTP, checks, parsing, and debug/reporting features

---

## Runtime Settings Precedence

The framework also needs a clear rule for runtime-controlled behavior such as:

- think time
- pacing
- request timeout
- max redirects
- throw-on-error behavior
- error behavior (`continue`, `stop_iteration`, `stop_vu`, `abort_test`)

### Current state

Today, runtime settings are defined in config and exposed via `RuntimeConfigManager`, but they are not yet consistently enforced inside generated/converted scripts.

So currently:

- `sleep(5)` written in script stays `5s`
- runtime `thinkTime.fixed = 1` does **not** automatically replace it
- request params written in script are not automatically overwritten by runtime timeout/max-redirect settings

### Final precedence rule

The recommended rule is:

1. **Explicit script value wins** when the script author intentionally overrides behavior.
2. **Runtime settings provide the default** for framework-managed behavior.
3. **Generated and converted scripts should call framework helpers** instead of hardcoding generic waits or HTTP defaults.

### Practical meaning

#### Think time

- If user script explicitly writes `sleep(5)`, keep `5s`
- If script uses framework-managed think time helper, use runtime config value

Recommended framework helper:

```javascript
sleep(getFrameworkThinkTime());
```

#### Pacing

- Pacing should be controlled by the framework wrapper, not hardcoded in scripts
- Runtime settings should define pacing target when enabled
- Script authors should not manually implement iteration pacing
- The framework should expose a helper similar to think time, for example:

```javascript
sleep(getFrameworkPacing());
```

- Pacing should be applied **after the last transaction in `actionPhase(ctx)`**, not between every transaction
- `initPhase(ctx)` and `endPhase(ctx)` should not be padded with normal pacing by default

#### HTTP timeout / redirects / throw-on-error

- Generated/converted requests should inherit runtime defaults unless the request explicitly sets its own override
- If script explicitly sets request timeout or redirects, keep that explicit value

### Implementation plan for precedence

To achieve this cleanly:

1. Add shared runtime helper functions for:
   - `getFrameworkThinkTime()`
   - `getFrameworkPacing()`
   - `applyFrameworkHttpDefaults(params)`
   - `applyFrameworkErrorBehavior(error, ctx)`
   - pacing helper inside the hidden lifecycle wrapper
   - structured error/event logging helper
   - shared transaction metric helper
2. Update generator output to use framework helpers instead of hardcoded generic `sleep(1)` and generic request defaults.
3. Update converter output to:
   - preserve explicit hardcoded waits if user already wrote them intentionally
   - optionally rewrite framework-generated/default sleeps to helper-driven waits
4. Keep the precedence rule documented in the framework guide so users know when script values override runtime defaults.

### Summary rule

> **Framework runtime settings should act as defaults; explicit script behavior should override them.**

---

## Error Behavior Contract

The framework should support explicit runtime-controlled behavior for execution failures via:

```json
"errorBehavior": "continue"
```

### Supported values

- `continue`
- `stop_iteration`
- `stop_vu`
- `abort_test`

### Expected behavior

#### `continue`

- log the error
- continue the current iteration
- allow future iterations for that VU to continue

#### `stop_iteration`

- log the error
- stop only the current iteration for that VU
- allow the next iteration for that VU to continue

#### `stop_vu`

- log the error
- stop that VU completely
- no further iterations should run for that VU

#### `abort_test`

- log the error
- abort the entire test execution

### What counts as an error

The runtime should apply `errorBehavior` to framework-managed execution failures such as:

- HTTP/network failure
- request timeout
- critical correlation extraction failure
- critical parameter/data lookup failure
- explicit critical validation/check failure
- script/runtime exception inside framework-managed journey execution

### Implementation plan for error behavior

To achieve this cleanly:

1. Expand the runtime config contract to support:
   - `continue`
   - `stop_iteration`
   - `stop_vu`
   - `abort_test`
2. Route all framework-managed execution failures through a shared error handler.
3. The shared error handler should:
   - build a structured error event
   - attach VU, iteration, transaction, request, and correlation context
   - apply the configured runtime behavior
4. The hidden lifecycle/runtime wrapper should enforce the chosen behavior consistently across:
   - `initPhase(ctx)`
   - `actionPhase(ctx)`
   - `endPhase(ctx)`

### Design note

`stop_vu` may require framework-managed VU termination handling because k6 does not expose a perfect LoadRunner-style stop-this-one-VU-forever primitive in the same user-facing way. The framework should still preserve this behavior as the contract and implement the closest reliable runtime handling possible.

---

## Transaction Metrics And Reporting

The framework should provide a transaction-level performance matrix similar to traditional performance tools while remaining CI/CD friendly.

### Required transaction metrics

For each transaction, the framework should capture:

- execution count
- pass count
- fail count
- error percentage
- response time stats such as:
  - `avg`
  - `min`
  - `max`
  - `p(90)`
  - `p(95)`
  - `p(99)`

### Recommended metric model

Use shared custom metrics tagged by transaction:

- `txn_duration` as `Trend`
- `txn_pass` as `Counter`
- `txn_fail` as `Counter`
- `txn_error_rate` as `Rate` or derived from pass/fail counts

Each metric point should be tagged with:

- `journey`
- `transaction`
- `scenario`

### Configurable transaction matrix

Users should be able to add or remove visible transaction columns from configuration without code changes.

Recommended config shape:

```json
{
  "reporting": {
    "transactionStats": ["count", "pass", "fail", "avg", "min", "max", "p(90)", "p(95)", "p(99)"],
    "includeTransactionTable": true,
    "includeErrorTable": true
  }
}
```

This lets users:

- add `p(99)` or any supported percentile
- remove `min`, `max`, or other columns
- keep reports aligned with project and pipeline needs

### CI/CD artifacts

The framework should produce machine-readable artifacts by default:

- `summary.json`
- `transaction-metrics.json`
- `errors.ndjson`
- `warnings.ndjson`
- `ci-summary.json`

Optional human-facing artifacts can include:

- HTML summary report
- HTML error insights report

### Artifact schemas

#### `errors.ndjson`

One JSON object per line. Required fields should include:

- `ts`
- `level`
- `type`
- `runId`
- `journey`
- `transaction`
- `vu`
- `iteration`
- `phase`
- `behavior`
- `message`

Recommended payload shape:

```json
{
  "ts": "2026-04-06T14:32:10.123Z",
  "level": "error",
  "type": "http_request_failed",
  "runId": "Run_2026-04-06T14-30-00-000Z",
  "plan": "BuyAnimal_Load",
  "environment": "dev",
  "journey": "buyanimal",
  "scenario": "buyanimal",
  "transaction": "t02_login",
  "requestName": "signon_submit",
  "requestId": "req_4",
  "method": "POST",
  "url": "https://jpetstore.aspectran.com/account/signon",
  "status": 500,
  "vu": 12,
  "iteration": 4,
  "phase": "action",
  "agent": {
    "host": "runner-01",
    "pid": 1234,
    "jobId": "ado-4812",
    "containerId": "abc123"
  },
  "behavior": "stop_iteration",
  "message": "HTTP 500 returned from login request",
  "cause": {
    "kind": "http_status",
    "code": "HTTP_500",
    "detail": "Expected 200, received 500"
  },
  "correlation": {
    "missing": [],
    "used": {
      "csrfToken": "abc",
      "sessionId": "xyz"
    }
  },
  "data": {
    "used": {
      "username": "j2ee"
    }
  },
  "snapshot": {
    "captured": true,
    "path": "artifacts/snapshots/failure_0001.json"
  }
}
```

#### `warnings.ndjson`

One JSON object per line with lighter-severity warnings.

Recommended payload shape:

```json
{
  "ts": "2026-04-06T14:35:00.000Z",
  "level": "warning",
  "type": "high_cpu_warning",
  "runId": "Run_2026-04-06T14-30-00-000Z",
  "plan": "BuyAnimal_Load",
  "agent": {
    "host": "runner-01",
    "pid": 1234
  },
  "message": "CPU crossed warning threshold",
  "metric": {
    "name": "cpuPercent",
    "value": 84.2,
    "threshold": 80
  }
}
```

#### `transaction-metrics.json`

This file should contain the final transaction matrix and the configured visible stats.

Recommended payload shape:

```json
{
  "runId": "Run_2026-04-06T14-30-00-000Z",
  "stats": ["count", "pass", "fail", "avg", "min", "max", "p(90)", "p(95)", "p(99)"],
  "transactions": [
    {
      "journey": "buyanimal",
      "transaction": "t01_launch",
      "count": 128,
      "pass": 128,
      "fail": 0,
      "avg": 210,
      "min": 90,
      "max": 480,
      "p(90)": 320,
      "p(95)": 370,
      "p(99)": 450
    }
  ]
}
```

#### `ci-summary.json`

This should be the compact CI gate artifact.

Recommended payload shape:

```json
{
  "status": "failed",
  "runId": "Run_2026-04-06T14-30-00-000Z",
  "plan": "BuyAnimal_Load",
  "environment": "dev",
  "thresholdFailures": 2,
  "errorCount": 14,
  "warningCount": 5,
  "aborted": false,
  "transactions": [
    {
      "name": "t02_login",
      "count": 128,
      "pass": 120,
      "fail": 8,
      "errorPct": 6.25,
      "avg": 842,
      "min": 120,
      "max": 5100,
      "p95": 3400,
      "p99": 4900
    }
  ],
  "gate": {
    "failedRules": [
      "threshold:p95<t02_login>",
      "errorCountAbove"
    ]
  }
}
```

---

## Error And Warning Observability

The framework should move toward LoadRunner-style runtime visibility using structured events.

### Structured event model

Each error/warning event should include:

- timestamp
- level (`error` / `warning`)
- type
- journey
- transaction
- request name
- scenario
- VU
- iteration
- agent / runner identity
- message
- details payload

### Recommended event categories

- `http_request_failed`
- `timeout`
- `connection_error`
- `check_failed`
- `assertion_failed`
- `correlation_missing`
- `parameter_missing`
- `runtime_exception`
- `stop_iteration_triggered`
- `stop_vu_triggered`
- `abort_test_triggered`
- `high_cpu_warning`
- `high_memory_warning`
- `snapshot_captured`

### Snapshot on failure

Support optional snapshot capture for failed requests only.

Recommended config shape:

```json
{
  "errors": {
    "captureSnapshotOnFailure": true,
    "maxSnapshotsPerRun": 20,
    "includeRequestHeaders": true,
    "includeRequestBody": true,
    "includeResponseHeaders": true,
    "includeResponseBody": false
  }
}
```

This keeps the framework useful for debugging without making long-running tests too heavy.

Recommended snapshot file:

- `artifacts/snapshots/failure_0001.json`

Suggested snapshot payload:

```json
{
  "ts": "2026-04-06T14:32:10.123Z",
  "type": "http_request_failed",
  "journey": "buyanimal",
  "transaction": "t02_login",
  "requestName": "signon_submit",
  "vu": 12,
  "iteration": 4,
  "phase": "action",
  "request": {
    "method": "POST",
    "url": "https://jpetstore.aspectran.com/account/signon",
    "headers": {
      "content-type": "application/x-www-form-urlencoded"
    },
    "body": "username=j2ee&password=j2ee"
  },
  "response": {
    "status": 500,
    "headers": {
      "content-type": "text/html"
    },
    "body": "<html>...</html>"
  },
  "correlation": {
    "used": {
      "csrfToken": "abc"
    },
    "missing": []
  },
  "data": {
    "used": {
      "username": "j2ee"
    }
  }
}
```

### Snapshot trigger rules

Snapshots should be captured only when:

- the error type is one of:
  - `http_request_failed`
  - `timeout`
  - `connection_error`
  - `correlation_missing`
  - `runtime_exception`
- snapshot capture is enabled
- the max snapshot limit for the run has not been reached

---

## Agent And Host Monitoring

To support warnings such as CPU or memory crossing 80%, the framework should add runner-side monitoring outside the journey script.

### Monitoring goals

Track:

- CPU %
- memory %
- optional extra host metrics later

Recommended config:

```json
{
  "monitoring": {
    "enabled": true,
    "cpuWarningPercent": 80,
    "memoryWarningPercent": 80,
    "sampleIntervalSeconds": 10
  }
}
```

Warnings should be emitted as structured warning events and written to CI/CD-friendly artifacts.

### Agent identity

Attach runner metadata to events when available:

- hostname
- process id
- container/pod id if present
- CI job/build id if present

This gives the framework a path toward agent-level diagnostics similar to traditional performance tools.

---

## Reporting Architecture And Output Flow

Reporting should be designed in three layers so the framework stays useful for humans, automation, and CI/CD at the same time.

### Layer 1: Console reporting

Console output should stay concise and execution-friendly.

Recommended console behavior:

- print test start summary
- print resolved plan/environment/runtime summary
- print periodic progress updates during execution
- print running error/warning counters
- print final verdict and artifact locations

The console should **not** try to dump every failure in detail during long tests. Detailed investigation belongs in JSON/NDJSON artifacts and HTML reports.

### Layer 2: Machine-readable reporting

Machine-readable outputs should be the primary source for:

- CI/CD gating
- automation
- downstream dashboards
- historical comparison tooling

Mandatory machine-readable artifacts:

- `summary.json`
- `transaction-metrics.json`
- `errors.ndjson`
- `warnings.ndjson`
- `ci-summary.json`
- `timeseries.json`

### Layer 3: Human-friendly reporting

HTML reports should be generated for manual review and analysis.

Recommended human-facing outputs:

- single unified `RunReport.html`

These reports should summarize:

- transaction performance matrix
- threshold breaches
- top errors by type/transaction
- warning summary
- host/resource warnings
- snapshot links
- run metadata

Recommended unified report tabs:

- `Summary`
- `Graphs`
- `Transactions`
- `Errors`
- `Warnings`
- `Snapshots`
- `System`

### Output ownership

Recommended ownership by component:

- **Runtime wrapper / shared runtime helper**
  - emits structured error/warning events
  - emits transaction metrics
  - emits snapshot metadata
- **Pipeline/execution layer**
  - writes machine-readable artifacts to disk
  - manages run directories
  - aggregates CI summary
- **Reporting layer**
  - renders HTML from the machine-readable artifacts
  - renders compact terminal summary after run completion

### Run directory layout

Recommended output structure:

```text
results/<PlanName>/Run_<timestamp>/
  summary.json
  transaction-metrics.json
  timeseries.json
  errors.ndjson
  warnings.ndjson
  ci-summary.json
  TestSummary.html
  RunReport.html
  snapshots/
    failure_0001.json
    failure_0002.json
```

### Write timing

Recommended file-writing flow:

#### During run

- append to `errors.ndjson` as errors happen
- append to `warnings.ndjson` as warnings happen
- write snapshot files on demand when enabled
- aggregate time-bucketed metrics for eventual `timeseries.json`
- optionally maintain in-memory transaction aggregation with periodic flush or final flush

#### End of run

- write `timeseries.json`
- write `transaction-metrics.json`
- write/update `summary.json`
- write `ci-summary.json`
- generate unified HTML report from the final artifact set

### Progress update cadence

During load test execution, progress output should be periodic and compact.

Recommended cadence:

- every 15s or 30s in console
- final summary always printed

Recommended progress content:

- elapsed time
- active scenarios
- current VUs / iterations if available
- total error count
- total warning count
- top 3 failing transactions if available

### CI/CD reporting rules

For CI/CD:

- pipelines should consume `ci-summary.json` for pass/fail decisions
- detailed diagnostics should come from:
  - `transaction-metrics.json`
  - `errors.ndjson`
  - `warnings.ndjson`
- HTML reports should be published as optional artifacts, not required for gate evaluation

### Interactive graphs and global time filter

The unified HTML report should support interactive graphs and a **single global time filter** that updates all graphs and drill-down views together.

#### Requirement

This requires **time-series data**, not only end-of-test summary data.

Summary-only files such as `summary.json` and `transaction-metrics.json` are not enough for cross-filtered graph exploration.

#### Recommended solution

Introduce `timeseries.json` containing bucketed time-series data.

Use bucketed aggregates instead of raw per-request data so the report remains usable for load and endurance runs.

#### Recommended `timeseries.json` shape

```json
{
  "bucketSizeSeconds": 10,
  "startTime": "2026-04-06T10:00:00Z",
  "endTime": "2026-04-06T10:30:00Z",
  "series": {
    "overview": [
      { "ts": "2026-04-06T10:00:00Z", "vus": 10, "iterations": 12, "requests": 240, "errors": 1 }
    ],
    "transactions": {
      "t02_login": [
        { "ts": "2026-04-06T10:00:00Z", "count": 12, "pass": 11, "fail": 1, "avg": 320, "p95": 700, "p99": 900 }
      ]
    },
    "system": {
      "runner-01": [
        { "ts": "2026-04-06T10:00:00Z", "cpu": 72, "memory": 65 }
      ]
    },
    "events": [
      { "ts": "2026-04-06T10:04:21Z", "type": "timeout", "transaction": "checkout", "severity": "error" }
    ]
  }
}
```

#### Global time filter behavior

When the user selects a time range such as `10:05-10:12`, the report should:

- update all graphs to that time range
- filter transaction views to that range when supported
- filter errors and warnings to that range
- filter snapshots to failures in that range
- filter host/system graphs to the same range

The selected global time window should persist across tab switches.

#### Deep-dive behavior

Recommended interactions:

- click a transaction line in the graph -> focus that transaction in the Transactions tab
- click an error spike -> open/filter the Errors tab for the same time window/type
- click a snapshot marker -> open snapshot details

#### Transaction response-time widget

The `Graphs` tab should include a combined transaction response-time widget with:

- a response-time-over-time graph on top
- an attached summary table directly below it

Both parts must always stay synchronized.

Recommended behavior:

- by default show **top 5 transactions**
- provide a toggle to switch between:
  - `Top 5`
  - `All`
- provide search/filter/multi-select so users can choose exactly which transactions to display

The graph should support:

- multi-line time-series by transaction
- metric selection such as:
  - `avg`
  - `p90`
  - `p95`
  - `p99`

The attached table should show configured transaction stats for the same selected transactions and the same selected time window.

Recommended attached table columns:

- `Transaction`
- `Min`
- `Max`
- `Avg`
- `P90`
- `P95`
- `P99`

Only configured stats should be rendered.

Recommended default rule:

- show top 5 transactions initially
- allow ranking mode for top transactions, for example:
  - by request count
  - by slowest percentile
  - by failure count

#### Window recalculation rule

When the global time range changes:

- the transaction graph should update to the selected range
- the attached summary table should recalculate window-level values for the same selected transactions
- the Transactions tab should use the same selected window when in `window` mode

#### Scale rules

To keep artifact size under control:

- store bucketed aggregates, not full raw time-series for every request
- keep detailed request/response payloads only in error/snapshot artifacts
- make bucket size configurable, for example `5s`, `10s`, `30s`, or `60s`

Recommended config:

```json
{
  "reporting": {
    "timeseries": {
      "enabled": true,
      "bucketSizeSeconds": 10
    }
  }
}
```

### Design rules

To keep reporting scalable for load and endurance tests:

- never depend on parsing console output for critical decisions
- keep console output compact
- stream NDJSON incrementally instead of accumulating huge in-memory logs
- cap snapshot creation
- derive HTML from persisted JSON/NDJSON/time-series artifacts instead of duplicating runtime logic

---

## Implementation Strategy

### Phase 1: Define the user-facing script contract

Add framework conventions for:

- `initPhase(ctx)`
- `actionPhase(ctx)`
- `endPhase(ctx)`

`actionPhase(ctx)` should be required.
`initPhase(ctx)` and `endPhase(ctx)` should be optional.

### Phase 2: Add lifecycle config to the test-plan schema

Add `lifecycle` to `UserJourney`:

```json
{
  "lifecycle": {
    "init": ["t01_launch", "t02_login"],
    "end": ["logout"]
  }
}
```

Meaning:

- generated/converted scripts can be split automatically
- hand-authored scripts can either export phases directly or rely on grouping rules

### Phase 3: Framework validation

Schema + gatekeeper validation should:

- validate `lifecycle.init` and `lifecycle.end` arrays
- warn on overlap between `init` and `end`
- fail/warn on unsupported executors
- warn when `ramping-vus` does not end with explicit `target: 0`
- require enough iterations for `per-vu-iterations`

### Phase 4: Compute per-VU phase timing

`ScenarioBuilder` should:

- parse stages into cumulative timeline windows
- compute `peakVUs`
- inject `K6_PERF_PHASES` into scenario env
- inject lifecycle metadata used by the wrapper/runtime

### Phase 5: Create a shared lifecycle runtime wrapper

Introduce a lifecycle runtime helper responsible for:

- creating `ctx`
- tracking VU lifecycle state
- evaluating exit timing
- handling reactivation between spike windows
- invoking `initPhase`, `actionPhase`, and `endPhase`
- applying runtime pacing behavior
- exposing framework think-time / HTTP-default helpers
- enforcing configured `errorBehavior`
- routing runtime failures through the shared error handler
- attaching VU/iteration/runner metadata to runtime events
- coordinating optional snapshot-on-failure behavior

Pacing rule:

- apply pacing once after `actionPhase(ctx)` completes
- do not inject pacing between transactions inside the phase unless explicitly designed as think time

This should be shared runtime code, not duplicated heavy logic in every user script.

### Phase 6: Generator output

`ScriptGenerator` should emit **simple user-facing scripts**, not large lifecycle controllers.

For generated HAR journeys:

- list discovered groups/transactions to the user during generation
- ask which groups should go to `initPhase(ctx)`
- ask which groups should go to `endPhase(ctx)`
- offer a clear **skip lifecycle split** option
- put early setup/login groups into `initPhase(ctx)`
- put repeatable business groups into `actionPhase(ctx)`
- put logout/signoff groups into `endPhase(ctx)`
- use framework runtime helpers for default think time and HTTP settings instead of baking in generic values

If the user skips lifecycle selection:

- still generate `initPhase(ctx)` and `endPhase(ctx)`
- keep both functions empty
- place all groups in `actionPhase(ctx)`

That keeps every generated script in the same easy-to-learn structure.

### Phase 7: Converter output

`ScriptConverter` should convert conventional k6 scripts into the same simple contract:

- list discovered groups/transactions to the user during conversion
- ask which groups should go to `initPhase(ctx)`
- ask which groups should go to `endPhase(ctx)`
- offer a clear **skip lifecycle split** option
- transform group sections into `initPhase(ctx)`, `actionPhase(ctx)`, `endPhase(ctx)`
- rewrite tracked parameter values to `ctx.data`
- rewrite correlation storage to `ctx.correlation`
- keep the resulting file readable and business-focused
- preserve explicit script-specific waits and request overrides where they are clearly intentional
- optionally normalize framework-default waits/params to runtime-helper calls

If the user skips lifecycle selection:

- still emit `initPhase(ctx)` and `endPhase(ctx)`
- leave them empty
- move all detected groups into `actionPhase(ctx)`

Validation rule:

- a group cannot belong to both `initPhase` and `endPhase`
- overlapping selection should be blocked or corrected during the prompt flow

### Phase 8: CLI/runtime integration

The execution path should detect whether a journey exports:

- `initPhase`
- `actionPhase`
- `endPhase`

Then the framework should execute the hidden wrapper entry instead of exposing lifecycle logic inside the journey file itself.

The CLI/runtime layer should also:

- emit machine-readable artifacts for CI/CD
- write structured error/warning files
- write transaction metric summaries
- write compact CI gate summary output

### Phase 9: Debug mode behavior

Debug mode should remain simple:

- ignore lifecycle timing
- run phases sequentially in one pass
- preserve diff/replay readability

For debug mode, behavior should effectively be:

```text
initPhase -> actionPhase -> endPhase
```

with 1 VU / 1 iteration as today.

### Phase 10: Transaction reporting and CI artifacts

Add transaction reporting support:

- collect transaction duration/pass/fail metrics
- render configurable transaction matrix
- expose configurable percentile/stat columns
- generate JSON artifacts for CI/CD

### Phase 11: Error and warning telemetry

Add structured observability support:

- structured error events
- structured warning events
- correlation/parameter failure logging
- snapshot on failure
- VU/iteration/request metadata in errors

### Phase 12: Host monitoring

Add runner-side monitoring:

- CPU/memory sampling
- warning thresholds
- runner identity enrichment
- warning artifacts for CI/CD and HTML reporting

### Phase 13: Reporting pipeline

Implement the full reporting/output flow:

- compact live console progress
- streaming NDJSON artifacts during execution
- final JSON summary artifacts
- HTML rendering from persisted artifacts
- CI gate summary generation
- unified tabbed HTML report
- time-series artifact generation for interactive graphs
- transaction graph + attached table behavior

### Phase 14: Reporting ownership cleanup

Ensure responsibilities stay separated:

- runtime emits events/metrics
- execution layer persists artifacts
- reporting layer renders human-friendly outputs
- CI uses `ci-summary.json` instead of console scraping

## File-By-File Implementation Map

### Config and contracts

- `core-engine/src/types/ConfigContracts.ts`
  - add reporting / errors / monitoring / timeseries config
  - extend `errorBehavior`
- new `core-engine/src/types/EventContracts.ts`
  - define `ErrorEvent`, `WarningEvent`, snapshot metadata contracts
- new `core-engine/src/types/ReportingContracts.ts`
  - define `TransactionMetricsFile`, `CiSummary`, `TimeSeriesFile`, report bundle contracts

### Validation and config access

- `core-engine/src/config/SchemaValidator.ts`
  - validate new config sections
- `core-engine/src/config/GatekeeperValidator.ts`
  - validate lifecycle/reporting/monitoring combinations
- `core-engine/src/config/RuntimeConfigManager.ts`
  - expose helper accessors for reporting, monitoring, timeseries, snapshots, error behavior

### Shared runtime layer

- new `core-engine/src/runtime/LifecycleRuntime.ts`
  - hidden `initPhase/actionPhase/endPhase` execution wrapper
- new `core-engine/src/runtime/ErrorRuntime.ts`
  - structured error/warning handling + errorBehavior enforcement
- new `core-engine/src/runtime/MetricsRuntime.ts`
  - transaction metrics collection
- new `core-engine/src/runtime/SnapshotRuntime.ts`
  - snapshot capture + limits
- new `core-engine/src/runtime/TimeseriesRuntime.ts`
  - bucketed aggregate generation

### Generation and conversion

- `core-engine/src/recording/ScriptGenerator.ts`
  - emit simple phase-based scripts
- `core-engine/src/recording/ScriptConverter.ts`
  - convert into simple phase-based scripts + `ctx` usage
- `core-engine/src/cli/generate.ts`
  - prompt for init/end group selection with skip option
- `core-engine/src/cli/convert.ts`
  - prompt for init/end group selection with skip option

### Scenario and execution

- `core-engine/src/scenario/ScenarioBuilder.ts`
  - lifecycle env injection
- `core-engine/src/cli/run.ts`
  - wrapper wiring, run output orchestration, artifact publishing
- `core-engine/src/execution/PipelineRunner.ts`
  - artifact lifecycle integration

### Artifact persistence and reporting

- new `core-engine/src/reporting/ArtifactWriter.ts`
  - write JSON/NDJSON artifacts
- new `core-engine/src/reporting/TransactionMetricsBuilder.ts`
  - final transaction matrix generation
- new `core-engine/src/reporting/RunSummaryBuilder.ts`
  - `ci-summary.json` and summary verdicts
- new `core-engine/src/reporting/RunReportGenerator.ts`
  - unified `RunReport.html`

### Monitoring

- new `core-engine/src/execution/HostMonitor.ts`
  - CPU/memory sampling and warning events

### Docs and templates

- `core-engine/src/cli/init.ts`
- `core-engine/src/cli/generate-byos.ts`
- framework docs / sample plans / guides

## Non-Regression Rule

All implementation work must preserve existing framework behavior unless a change is explicitly part of the agreed design.

Required rule:

- existing framework functionality should not break while adding lifecycle, metrics, reporting, and CI/CD capabilities

This means:

- preserve current non-lifecycle execution paths until replacements are fully wired and verified
- keep debug replay behavior working
- keep existing CLI commands working
- introduce new behavior incrementally behind stable contracts
- add validation and verification for each implementation phase

## Developer Task Breakdown

Execution should proceed as an incremental, verifiable checklist. A dedicated checklist file should be maintained and updated alongside `AGENT-CONTEXT.md` as implementation progresses.

---

## UX Rules For New Users

The framework should optimize for clarity:

- authors should mostly read business transactions, not framework plumbing
- no lifecycle math in journey files
- no internal state-machine code in journey files
- keep naming explicit: `initPhase`, `actionPhase`, `endPhase`, `ctx`
- keep the generated/converter interaction guided and simple
- always produce the same phase-based script shape, even when the user skips lifecycle grouping
- documentation should teach only the simple contract first

If users need advanced behavior, it should be additive, not the default authoring experience.

---

## Open Decisions

### 1. Script authoring style

Need to choose one of these as the official convention:

- scripts directly export `initPhase/actionPhase/endPhase`
- generator/converter emit those exports automatically
- framework can still accept legacy `default()` scripts for backward compatibility

### 2. Auto-detection rules

Need final heuristics for generated/converted journeys:

- detect login/signon as init
- detect signoff/logout as end
- put everything else into action

### 3. Runtime helper placement

Need to decide where the hidden lifecycle wrapper lives:

- shared runtime utility module
- generated temp wrapper per run
- mixed model (shared helper + tiny generated wrapper)

Preferred direction: **shared helper + tiny generated wrapper**

---

## Recommended v1 Scope

v1 should deliver:

- simple user-facing phase exports
- per-VU `ctx`
- hidden lifecycle wrapper
- support for `ramping-vus`
- optional support for `per-vu-iterations`
- validation and documentation

v1 should **not** try to solve everything:

- no full lifecycle guarantee for all executors
- no user-facing lifecycle math
- no complex generated state machine in script files

---

## Files Likely To Change In The Real Implementation

- `core-engine/src/types/TestPlanSchema.ts`
- `core-engine/src/config/SchemaValidator.ts`
- `core-engine/src/config/GatekeeperValidator.ts`
- `core-engine/src/scenario/ScenarioBuilder.ts`
- `core-engine/src/recording/ScriptGenerator.ts`
- `core-engine/src/recording/ScriptConverter.ts`
- new shared lifecycle runtime helper file(s)
- CLI/execution entry integration for wrapper generation/loading
- docs / examples / sample plans

---

## Summary

The implementation plan is now based on this principle:

> **Keep the user script simple. Hide lifecycle mechanics inside the framework.**

That gives the framework:

- LoadRunner-like authoring
- less user frustration
- cleaner onboarding
- lower risk of unreadable generated scripts
- lifecycle support without compromising load/endurance suitability

---

## Cookie Persistence Across Iterations (Added 2026-04-08)

### Problem

k6's default behavior (`noCookiesReset: false`) clears the VU's cookie jar after each iteration. This differs from LoadRunner, which preserves cookies across iterations by default. For applications that rely on server-side sessions (e.g., JSESSIONID), this causes authentication failures on iteration 2+.

### Solution

The framework defaults to `noCookiesReset: true` in k6 options, matching LoadRunner behavior. This is configurable at both plan and journey level.

### Config

```json
{
  "noCookiesReset": true
}
```

- **TestPlan.noCookiesReset** (default `true`): Global cookie persistence setting.
- **UserJourney.noCookiesReset** (default inherits plan): Per-journey override. Note: k6's `noCookiesReset` is global; per-journey control requires using `clearCookies()` from `session.js` in the journey's `initPhase`.

### session.js Utilities

For per-journey cookie control when the global setting persists cookies:

```javascript
import { clearCookies, registerBaseUrl, deleteCookie } from '../../../core-engine/src/utils/session.js';

// Register base URLs (auto-called by generated/converted scripts)
registerBaseUrl('https://myapp.example.com/');

// Clear all registered URLs' cookies
clearCookies();

// Clear specific URL's cookies
clearCookies('https://myapp.example.com/');

// Delete a specific cookie
deleteCookie('https://myapp.example.com/', 'JSESSIONID');
```

### Generated/Converted Script Behavior

- ScriptGenerator and ScriptConverter auto-import `clearCookies` and `registerBaseUrl` from `session.js`
- Base URLs are extracted from HAR entries (generator) or regex-scanned from source code (converter)
- `registerBaseUrl()` calls are emitted at module init scope
- `clearCookies()` is called as the first line of `initPhase` to ensure a clean cookie state at the start of each VU lifecycle
