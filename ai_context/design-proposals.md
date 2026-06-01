# Design Proposals

> Approved architectural proposals awaiting implementation.
> AI agents MUST read this file before modifying related subsystems.

This file is not a brainstorming note. It is the implementation-direction contract for the pending DX simplification work. Any implementation of these proposals MUST preserve:

- `initPhase(ctx)` / `actionPhase(ctx)` / `endPhase(ctx)` + compatibility `default` export
- Existing replay-log schema and extraction contract
- Existing artifact schemas and reporting pipeline
- Existing non-lifecycle scripts continuing to run
- Existing lifecycle behavior across all supported executor modes and load-test shapes

---

## Cross-Cutting Constraints

### C1. Single Owner For Lifecycle End Detection

`lifecycle.ts` remains the only owner of executor-aware end detection and "should this VU start more work?" logic.

Do NOT introduce a second ramp-down algorithm inside `transaction.ts`, `request.ts`, generators, or converters.

### C2. Explicit Runtime Contracts Only

If `transaction()` or `request()` needs lifecycle state, it must obtain it through an explicit k6-side runtime helper contract, not by parsing `execution.test.options` ad hoc and not by introducing undocumented cross-module globals.

### C3. Init-Context Metric Registration Remains Mandatory

k6 custom metrics must still be created in init context. `transaction()` does not remove that requirement.

The revised direction is to move transaction metric registration out of user scripts and into framework-managed runtime bootstrap.

Required contract:

- the Node-side framework injects a transaction manifest before k6 execution starts
- the k6-side transaction runtime auto-registers those metrics during module init
- generated and converted scripts should not need to call `initTransactions([...])` manually

`initTransactions([...])` remains available only as a backward-compatibility fallback for legacy or non-framework-managed scripts.

### C4. Replay And Snapshot Contracts Must Be Reused

Proposal 2 must reuse the existing replay-log and snapshot/event contracts rather than inventing parallel output formats.

### C5. Unsupported Executor Modes Must Fail Fast

If lifecycle semantics are not explicitly defined for a supported k6 executor, `ScenarioBuilder` / `ExecutorFactory` must fail fast with a descriptive error. Silent downgrade to `"unsupported"` is not acceptable once these proposals are implemented.

---

## Proposal 1: `transaction()` Wrapper - Group-Level Error Boundaries

**Status:** Approved - revised for implementation
**Affects:** `transaction.ts`, `lifecycle.ts`, `ScriptGenerator.ts`, `ScriptConverter.ts`, runtime contract docs

### Problem

Error behavior (`continue`, `stop_iteration`, `stop_vu`, `abort_test`) currently applies at the phase level. If one request inside a transaction fails, the rest of that phase may be skipped even when the configured behavior is `"continue"`.

The current generated pattern also has two DX and correctness issues:

- `endTransaction()` is easy to miss on failure paths, which can lose transaction timing metrics
- transaction boundaries do not currently participate in lifecycle gating, so a VU may begin a new action transaction even when the lifecycle has already decided it should transition to `endPhase()`

### Revised Solution

Introduce a `transaction(name, fn)` wrapper that is responsible for:

- `group(name, fn)` wrapping
- `startTransaction(name)` / `endTransaction(name)` pairing
- transaction-local error boundary behavior
- consulting a lifecycle-owned "transaction gate" before starting a new action-phase transaction

It is NOT responsible for owning executor math itself.

Additionally, transaction metric initialization moves behind the framework/runtime boundary:

- before the script executes, the framework provides the full list of declared transaction names
- at k6 init time, `transaction.ts` auto-registers Trend + Counter metrics from that list
- by the time `transaction(name, fn)` is first called, the corresponding metrics are already initialized

### Public API

```typescript
export function transaction(
  name: string,
  fn: () => void,
): void;
```

No extra user-facing parameters are required in generated scripts. Any lifecycle-aware gating must be resolved through an explicit helper imported from `lifecycle.ts` or a dedicated k6-side runtime contract.

Framework/runtime bootstrap contract:

```typescript
// Node-side framework injects:
K6_PERF_TRANSACTION_NAMES='["Login","Search","Checkout"]'

// k6-side transaction runtime performs during module init:
autoInitTransactionsFromEnv();
```

The exact env var name may change, but the design requires a framework-injected transaction manifest that is consumed in k6 init context before VU execution begins.

### Required Behavior

```typescript
export function transaction(name: string, fn: () => void): void {
  const gate = getTransactionGate();

  if (gate.shouldSkipBeforeStart) {
    gate.onSkip(name);
    return;
  }

  group(name, () => {
    startTransaction(name);
    try {
      gate.onTransactionStart?.(name);
      fn();
    } catch (error) {
      applyTransactionErrorBehavior(error, name);
    } finally {
      endTransaction(name);
      gate.onTransactionEnd?.(name);
    }
  });
}
```

The important part is not the exact helper names above. The important part is the ownership split:

- `transaction.ts` owns transaction wrapping and metric closure
- `lifecycle.ts` owns executor-aware decisions about whether another action transaction may start
- framework bootstrap owns pre-test transaction manifest injection

### Automatic Transaction Registration

The framework must initialize transactions automatically at the very start of the test.

Required behavior:

- `ScenarioBuilder` or the execution pipeline injects all transaction names for the journey/script before k6 starts
- `transaction.ts` consumes that manifest in init context and calls the internal registration logic automatically
- new generated and converted scripts only import and use `transaction(...)`
- no explicit `initTransactions([...])` line should be required in new script output

Important boundary:

- Node-side code does not directly construct k6 `Trend` / `Counter` objects
- Node-side code only provides metadata
- k6-side code still performs the actual metric creation during init context

### Error Behavior Mapping

| Behavior | Transaction wrapper action |
|---|---|
| `continue` | Log error with VU/iteration/transaction context, swallow, continue to next transaction |
| `stop_iteration` | Log error, re-throw so lifecycle skips the rest of the current iteration |
| `stop_vu` | Log error, mark VU terminated through lifecycle/runtime contract, re-throw |
| `abort_test` | Abort immediately through `exec.test.abort()` |

### Phase Scope Rules

Lifecycle gating applies only when deciding whether to start the next **action-phase** transaction.

Rules:

- `initPhase` transactions always run once `initPhase` has started
- `actionPhase` transactions may be skipped if lifecycle says "transition to end now"
- `endPhase` transactions always run once `endPhase` has started
- active/in-flight transactions are never interrupted mid-transaction

### Nested Transaction Rule

Nested `transaction()` calls are not part of the supported contract for the first implementation.

Required behavior:

- either explicitly reject nesting with a descriptive runtime error
- or define stack semantics before implementation begins

Default recommendation: reject nested transactions to keep metrics, active-transaction tags, and lifecycle gating unambiguous.

### Lifecycle Coverage Requirement

Proposal 1 must preserve or extend lifecycle correctness across all supported k6 executor modes and framework load-test shapes.

#### Executor coverage matrix

| Executor mode | Lifecycle behavior requirement |
|---|---|
| `ramping-vus` | Use existing interpolated VU-target logic; only final ramp-down permanently ends the VU |
| `constant-vus` | Convert to a duration-based synthetic final ramp-down buffer so `endPhase()` still runs |
| `shared-iterations` | Run `endPhase()` after the last iteration assigned to that VU |
| `per-vu-iterations` | Run `endPhase()` after the VU completes its configured final iteration |
| `ramping-arrival-rate` | Define a time-window-based lifecycle gate so no new action transaction starts after the executor enters its final shutdown window, while in-flight transactions finish cleanly |
| `constant-arrival-rate` | Define a duration-based shutdown window equivalent to `constant-vus`, but for arrival-rate scheduling |

#### Load-test shape coverage

The lifecycle contract must continue to work for:

- standard load
- stress
- soak
- spike
- step / staircase
- custom multi-stage ramping profiles
- iteration-based test plans
- arrival-rate-based test plans

For ramp-shaped profiles, intermediate decreases must not permanently end VUs unless the lifecycle is in the final shutdown segment.

### Implementation Notes

- Replace manual `initTransactions([...])` in generated and converted scripts with framework-driven auto-registration
- Inject transaction names through scenario/runtime metadata before k6 execution begins
- Perform actual `Trend` / `Counter` creation in `transaction.ts` module init, not in Node-side code
- The generator may emit `transaction(...)` instead of `group(...) + startTransaction(...) + endTransaction(...)`
- Backward compatibility for old scripts remains mandatory
- Legacy scripts that continue to call `group()` + `startTransaction()` + `endTransaction()` still work, but will not gain the new transaction-local error boundary automatically
- Legacy scripts may continue calling `initTransactions([...])` explicitly when they are not run through framework-managed bootstrap

### Backward Compatibility

- Existing scripts using the old manual transaction pattern continue to run
- Existing scripts that explicitly call `initTransactions([...])` continue to run
- Existing transaction metric names remain unchanged
- Existing lifecycle contract remains unchanged at the script export surface

---

## Proposal 2: Unified `request()` Function - Single-Entry HTTP Execution

**Status:** Approved - revised for implementation
**Affects:** new `request.ts` k6-side helper, `replayLogger.ts`, `session.ts`, `ScriptGenerator.ts`, `ScriptConverter.ts`, runtime/reporting contract docs

### Problem

Generated and converted scripts currently emit too much boilerplate per request:

- request definition object construction
- raw `http.*` call
- explicit `logExchange(...)`
- separate assertion block

This reduces readability and makes the intent of the business flow hard to scan. It also leaves too much diagnostics wiring in generated script output.

### Revised Solution

Introduce a unified `request()` helper that owns transport execution and request diagnostics, while preserving native k6 `check()` as a separate concern.

This helper is intentionally narrower than the original draft. It should do one thing well: execute a request in a framework-aware way and return the native k6 `Response`.

### Non-Goals

`request()` does NOT:

- replace native k6 `check()`
- own lifecycle end detection
- invent a second snapshot schema
- hide all data/correlation tracking behind magic

### Public API

```typescript
interface RequestReplayMeta {
  harEntryId?: string;
  recordingStartedAt?: string;
}

interface RequestOptions {
  name?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: string | Record<string, unknown>;
  redirects?: number;
  service?: string;
  tags?: Record<string, string>;
  replay?: RequestReplayMeta;
}

export function request(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  pathOrUrl: string,
  options?: RequestOptions,
): Response;
```

### Responsibilities Of `request()`

`request()` must:

1. Resolve relative path vs absolute URL using the existing environment/session contract
2. Build the internal request definition required for replay logging
3. Attach transaction tags from the active transaction context
4. Execute the underlying `http.*` call
5. Auto-call replay logging when debug mode is enabled
6. Return the native k6 `Response`
7. Emit a failure/snapshot event through the existing snapshot contract when configured and applicable

### Responsibilities That Stay Outside `request()`

- assertions stay in `check(...)`
- correlation extraction stays explicit in script code
- parameter/data tracking remains explicit, though helpers may be improved later

This keeps transport, diagnostics, and business assertions from being conflated.

### Request Flow

```text
request(method, pathOrUrl, options)
  -> resolveFrameworkUrl(pathOrUrl, { service })
  -> build replay-aware request metadata
  -> execute http call
  -> if K6_PERF_DEBUG=true, call logExchange(...)
  -> if configured failure conditions match, emit snapshot/error payload
  -> return native Response
```

### Request Metadata Rules

Generated and converted scripts must preserve replay fidelity.

That means:

- generated/replayed requests should pass stable replay metadata such as `harEntryId` and `recordingStartedAt`
- hand-written scripts may omit replay metadata and allow auto-generated request names/IDs
- request numbering used for replay/debug must remain deterministic within a VU iteration

### Context And Tracking Rules

The earlier draft proposed a generic centralized Context that would eliminate `trackDataRow(...)`.

That is too vague for implementation.

The revised rule is:

- lifecycle context (`ctx.data`, `ctx.correlation`, `ctx.session`, `ctx.meta`) remains the primary per-VU lifecycle state
- replay/debug variable tracking must either reuse that state explicitly or document a single k6-side registry contract
- do not maintain two parallel "truth" models for tracked variables without a documented bridge

The first implementation may keep `trackCorrelation`, `trackParameter`, and `trackDataRow` explicit if that is the safer path.

### Snapshot Rules

If snapshot capture is triggered, Proposal 2 must reuse the existing snapshot/error artifact contract.

Minimum rules:

- respect runtime settings such as `captureSnapshotOnFailure` and `maxSnapshotsPerRun`
- reuse the existing `SnapshotPayload` shape
- include VU, iteration, journey, transaction, request name, request details, and response details where configured
- do not create a debug-only snapshot format that bypasses the reporting pipeline

### Failure Semantics

Proposal 2 must define failure classes explicitly:

| Failure class | Required behavior |
|---|---|
| Transport/runtime exception | Always participate in error behavior handling |
| HTTP `4xx/5xx` response | Eligible for snapshot/error emission when configured; does not automatically replace `check()` |
| Failed k6 `check()` | Remains a separate assertion concern unless a future proposal explicitly unifies it |

### Environment And URL Resolution

`request()` must align with the existing team-aware environment model.

It must support:

- relative paths resolved against the effective runtime base URL
- absolute URLs passed through unchanged
- optional named service resolution via runtime service URLs
- recorded fallback behavior where the framework already supports it

### Generator / Converter Output

#### Before

```javascript
const request_1 = { ... };
const res_1 = http.get(request_1.url, request_1.params);
logExchange(request_1, res_1);
check(res_1, { "status 200": (r) => r.status === 200 });
```

#### After

```javascript
const res1 = request("GET", "/action/Catalog.action?categoryId=FISH", {
  replay: {
    harEntryId: "req_1",
    recordingStartedAt: "2026-01-01T10:00:00.000Z",
  },
});

check(res1, { "status 200": (r) => r.status === 200 });
```

### Import Strategy

Do not assume a new `dist/k6-perf.js` barrel exists unless it is implemented intentionally.

Implementation options:

- keep importing k6-side helpers from `dist/utils/*.js`
- or add a dedicated k6-safe barrel as its own explicit deliverable

If a barrel is introduced, it must contain only k6-safe runtime helpers.

---

## Proposal 3: Per-Iteration Transaction Pass/Fail Metric

**Status:** Approved — ready for implementation
**Affects:** `transaction.ts`, `TransactionMetricsBuilder.ts`. Scripts that go through `transaction()` / `k6Check()` automatically benefit; no script-level changes required.

### Problem

Transaction pass/fail in `transaction-metrics.json` and the unified report is currently reconstructed from k6's check aggregates in `handleSummary.json` via:

```
pass = min(check.passes across the group's checks)  capped at <name>_count
fail = count - pass
```

This silently hides failures in several real scenarios:

- A check is evaluated more than once per transaction iteration (multi-request transactions, retry loops). `min(passes)` can exceed the transaction execution count, so capping at `count` forces `fail = 0` even when fails are non-zero.
  - Concrete case from a real run: `select_product` transaction, `count = 163`, check `status is 503` `passes=163/fails=0`, check `status is 200` `passes=194/fails=132`. `min(163, 194) = 163 = count` → reported `fail = 0` despite 132 real check failures.
- Different requests inside the same transaction have independent checks with different totals; `min` latches onto the cleanest one and ignores the failing one.
- A request throws (transport error, correlation failure, runtime error inside `request()`). No check ran, so summary-based aggregation reports the transaction as fully passed.

k6's native `checks` view and the live metrics stream show these failures correctly. Only our per-transaction rollup is wrong.

### Solution

Track transaction pass/fail at the point of truth — the iteration itself — and publish it as a first-class k6 `Rate` metric. Stop trying to reconstruct it from check aggregates after the fact.

A transaction iteration is **failed** if any of the following happened during it:

- a `k6Check(...)` returned `false` while the transaction was active
- the transaction body threw — including transport errors surfaced by `request()`, correlation/extraction errors, and any user-thrown exception

Otherwise it is **passed** (transactions with zero checks count as passed — successful completion with no observed failure).

Exactly **one** sample is added to the per-transaction `Rate` metric per `transaction()` invocation, in the `finally` block, before `endTransaction()`. This holds regardless of how many checks the body contains — N checks ≠ N samples.

### Required behavior

```typescript
const txnResults: Record<string, Rate> = {};
let _currentIterationFailed = false;   // per-VU, per-active-transaction flag

export function transaction(name: string, fn: () => void): void {
  // existing nesting / VU-terminated guards unchanged

  _activeTransaction = name;
  try {
    group(name, () => {
      startTransaction(name);
      _currentIterationFailed = false;          // reset at iteration boundary
      try {
        fn();
      } catch (error) {
        _currentIterationFailed = true;         // any thrown error = failed iteration
        // existing errorBehavior handling unchanged
      } finally {
        txnResults[name]?.add(!_currentIterationFailed);   // exactly one sample
        endTransaction(name);
      }
    });
  } finally {
    _activeTransaction = '';
  }
}

export function k6Check(val, sets): boolean {
  const passed = nativeCheck(val, sets);
  if (!passed && _activeTransaction !== '') {
    _currentIterationFailed = true;
  }
  // existing errorBehavior handling unchanged
  return passed;
}
```

### Metric contract

For every transaction registered via the auto-init manifest (`K6_PERF_TRANSACTION_NAMES`) or legacy `initTransactions([...])`, three metrics are created in init context:

| Metric name      | Type    | Purpose                                                                                                       |
|------------------|---------|---------------------------------------------------------------------------------------------------------------|
| `<name>`         | Trend   | Duration of each transaction (existing)                                                                       |
| `<name>_count`   | Counter | Number of `startTransaction` calls (existing)                                                                 |
| `<name>_checkrate` | Rate    | One sample per iteration: `true` if all checks passed and no error was raised, `false` otherwise (**new**)    |

Invariants:

- `passes + fails === <name>_count.count` by construction — one `Rate.add` per `startTransaction`.
- VUs skipped via `stop_vu` / lifecycle gating neither increment the counter nor push to the Rate.
- Nested-transaction rejection happens before `startTransaction`, so neither metric is touched.
- The Rate's samples are implicitly group-tagged because `.add` runs inside `group(name, ...)`.

### Edge-case truth table

| Scenario                                                       | flag at finally | Rate sample |
|----------------------------------------------------------------|-----------------|-------------|
| All checks pass, body completes                                | false           | pass        |
| At least one `k6Check` returns false (continue mode)           | true            | fail        |
| Body throws transport error                                    | true            | fail        |
| Body throws under `stop_iteration` (re-thrown)                 | true            | fail (finally pushes before re-throw propagates) |
| Body throws under `stop_vu` (no re-throw)                      | true            | fail        |
| Body throws under `abort_test`                                 | true            | fail (push happens before VU exits) |
| Body completes with zero checks called                         | false           | pass        |
| Raw k6 `check()` used instead of `k6Check` and fails           | unchanged       | pass (documented limitation; framework-generated scripts always use `k6Check`) |
| `k6Check` called outside any transaction                       | unchanged       | nothing pushed |

### Reporting integration

`TransactionMetricsBuilder` MUST prefer the new `Rate` metric when present:

- If `<name>_checkrate` exists in the summary, set `row.pass = values.passes`, `row.fail = values.fails`. `count` continues to come from `<name>_count`.
- If absent (legacy runs, scripts that don't go through `transaction()`), fall back to the existing `min(passes)` aggregation. This preserves the previous behavior for historical reports.

`errorPct` continues to derive from `(fail / count) * 100`.

### Backward compatibility

- Old generated scripts that pre-date `transaction()` continue to work; their reports use the existing aggregation fallback.
- Existing `<name>` Trend and `<name>_count` Counter names are unchanged. Adding the Rate adds one extra metric per transaction; no removals.
- Thresholds keyed off `<name>_checkrate` can be expressed by users (e.g. `'login_checkrate': ['rate>0.99']`).

### Acceptance criteria

1. A transaction whose body throws an error (with no checks) is reported `fail`, not `pass`.
2. A transaction with multiple checks where exactly one fails per iteration is reported with `fail = number-of-failing-iterations`, regardless of how many checks live in the body.
3. `passes + fails === count` for every transaction in every summary produced by the new code path.
4. Live metrics stream, k6 native `checks` view, and the custom report agree on the direction of failure (whenever any of them shows fails, the others do too).
5. Reports from older runs that lack `<name>_checkrate` still render via the legacy aggregation path.
6. The live transaction display reads the same `<name>_checkrate` Point samples from the streaming JSON output, so the live view and the post-run summary report agree by construction.

---

## Proposal 4: Interactive Command Panel

**Status:** Approved — initial implementation shipped (2026-06-01).
**Affects:** `core_engine/src/cli/interactive.ts` (new), `core_engine/src/cli/run.ts` (root-action wiring), `core_engine/src/cli/import.ts` (`--curl '#'` parse fix).

### Problem

The framework exposes ~15 CLI commands (`init`, `new`, `docs`, `templates`, `generate`, `generate-byos`, `convert`, `import curl`, `import postman`, `validate`, `run`, `debug`, `config inspect`, `features`, …). Each has its own required flags, options, and argument order. New users — and even returning users coming back to the project after time away — can't remember the exact invocation and are blocked at the terminal.

CI / scripted environments don't have this problem (the commands are versioned in shell scripts), so the friction is concentrated locally.

### Goal

Ship a discoverable, menu-driven entry point that walks users through framework actions without removing or renaming the existing direct CLI commands. The panel exists in addition to the flags-based commands, not instead of them. CI and any caller that pipes input/output continues to work unchanged.

### Required behavior

1. **Invocation surface (two routes, same handler):**
   - Bare `k6-framework` / `npm run cli` with no subcommand AND on a TTY → launches the panel.
   - Explicit `k6-framework menu` / `npm run cli menu` → always launches the panel.
   - Non-TTY or piped invocations (CI) → falls through to commander's help output unchanged.
2. **Thin orchestrator.** The panel is a UX layer over existing CLI handlers (`runGenerate`, `runConvert`, `runImportCurl`, `runImportPostman`, `runGenerateByos`, `runInit`, `runValidate`, `listTemplates`, `inspectConfig`, `listFeatures`). No business logic duplication — every fix in a CLI handler benefits the panel automatically.
3. **Workspace detection on entry.** If the current directory has neither `config/` nor `testSuites/`, prompt the user to initialize a project before entering the menu loop. The user can decline; subsequent actions will surface their own errors.
4. **Team scaffolding from actions.** Author wizards (Generate / Convert / BYOS / Import cURL / Import Postman) all share a `pickOrCreateTeam` helper. Creating a new team auto-creates `testSuites/<team>/{tests,data,recordings}/`. Idempotent — safe to call when the team already exists.
5. **Smart input discovery.** File pickers glob the cwd + immediate subdirs for `.har`, `.postman_collection.json`, `*.js`, etc., present a numbered list, and allow manual path entry as a fallback. Skips `node_modules`, `.git`, `dist`, `results`, and dot-folders. Test plan picker lists `config/test_plans/*.json`.
6. **cURL input modes.** Three sources presented as a sub-menu: clipboard (default — pairs with browser DevTools "Copy as cURL"), file path, or paste-here (read until blank line). All three feed the same downstream `runImportCurl` so the `# Transaction name` comment is honored uniformly.
7. **`run` and `debug` re-spawn.** These actions re-spawn the CLI as a child process (`spawn(process.execPath, [argv[1], 'run', '--plan', path], { stdio: 'inherit' })`) instead of calling the handler in-process. Reason: `run` installs an ANSI scroll region for the live transaction table; running it inside the panel's `readline` loop would corrupt both displays.
8. **Stickiness.** After each action completes, prompt for Enter to return to the menu. Ctrl+C exits cleanly via a SIGINT trap. Per-action errors are caught and reported; the panel doesn't crash.

### Top-level menu structure

Three groups, twelve actions, plus exit:

```
Author
  1. Generate script from HAR
  2. Convert native k6 script → framework script
  3. Bring Your Own Script (BYOS scaffold)
  4. Create API test from cURL (clipboard or file)
  5. Create API test from Postman collection
Run
  6. Run a test plan
  7. Debug replay (single-iteration HTML diff)
  8. Validate a test plan
Project
  9. Initialize a new project / scaffold
  10. List or show templates
  11. Inspect resolved config for a plan
  12. List framework features
  0. Exit
```

### Non-goals (v1)

- No arrow-key / fuzzy navigation (no `@inquirer/prompts` or `ink` dependency). Built-in `readline/promises` only — matches the existing `new` / `LifecyclePrompt` style.
- No live preview pane / split-screen TUI.
- No editing of existing test plans inline (`new` already handles creation).
- No watch-mode or filesystem-event triggers.
- No remote / SSH execution.

### Backward compatibility

- Every existing direct CLI command (`generate`, `convert`, `import curl`, …) is untouched. The root `program.action(...)` only fires when no subcommand is provided.
- TTY gate on the bare-invocation route ensures piped contexts (CI, pre-commit hooks, `| tee`) keep their current help-output behavior.
- The new `menu` subcommand is additive.

### Bonus fix bundled in this proposal

`--curl '<string>'` mode in `runImportCurl` previously bypassed `splitMultiCurlFile`, so a leading `# Transaction name` line passed inline got treated as part of the curl body. Now the same multi-block splitter runs for all four input modes (`--file`, `--stdin`, `--clipboard`, `--curl`), so the `#` naming convention works uniformly.

### Acceptance criteria

1. `k6-framework` with no args on a TTY shows the menu; piped or non-TTY invocations show help.
2. Every direct CLI command continues to work identically — no regressions.
3. Creating a team via the panel produces `testSuites/<team>/{tests,data,recordings}/`.
4. The panel detects a non-workspace cwd and offers `init` before entering the menu.
5. `--curl '# Name\ncurl ...'` (single-string) names the transaction "Name" — same behavior as `--file` and `--clipboard`.

---

## Combined Generated Script Direction

### Target Pattern

```javascript
import { check } from 'k6';
import { transaction } from '../../../dist/utils/transaction.js';
import { request } from '../../../dist/utils/request.js';
import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';
import { clearCookies, registerBaseUrl, getEnvContext } from '../../../dist/utils/session.js';

const env = getEnvContext('Jpet_new', 'https://jpetstore.aspectran.com');
registerBaseUrl(env.baseUrl);

const __journeyLifecycleStore = createJourneyLifecycleStore();

export function actionPhase(ctx) {
  transaction('t01_launch', function () {
    const res = request("GET", "/");
    check(res, { "status 200": (r) => r.status === 200 });
  });

  thinktime();

  transaction('search_animal', function () {
    const res1 = request("GET", "/action/Catalog.action?categoryId=FISH");
    check(res1, { "status 200": (r) => r.status === 200 });

    const res2 = request("GET", "/action/Catalog.action?productId=FI-SW-01");
    check(res2, { "status 200": (r) => r.status === 200 });
  });
}
```

### What Changes

- transaction wrapper removes manual start/end pairing from most generated code
- request helper removes manual request-def + logExchange boilerplate from most generated code
- checks remain explicit and readable

### What Does Not Change

- phase-based script contract
- init-context metric registration still happens, but automatically via framework bootstrap
- debug replay contract
- reporting/snapshot artifact contracts
- lifecycle correctness across executor modes

---

## Acceptance Criteria

Implementation is not complete until all of the following are true:

1. Generated scripts are materially shorter and easier to read.
2. Existing generated and converted scripts continue to run.
3. Replay debug output remains consumable by the current replay pipeline.
4. Snapshot/error events continue to feed the existing reporting artifacts.
5. New generated and converted scripts do not need to emit `initTransactions([...])`.
6. Transaction metrics are initialized automatically before VU execution begins.
7. Legacy scripts that still call `initTransactions([...])` continue to work.
8. Lifecycle behavior remains correct for:
   - `ramping-vus`
   - `constant-vus`
   - `shared-iterations`
   - `per-vu-iterations`
   - `ramping-arrival-rate`
   - `constant-arrival-rate`
9. Load-test shapes remain correct for:
   - load
   - stress
   - soak
   - spike
   - step / staircase
   - iteration-based
   - arrival-rate-based
10. Intermediate stage decreases do not permanently end VUs unless the final shutdown window has begun.
11. `endTransaction()` always runs for transactions that have started.
12. If an executor cannot support lifecycle semantics safely, the framework fails fast with a descriptive message instead of silently degrading.

---

## Suggested Implementation Order

1. Extend the lifecycle phase envelope and runtime contract so all supported executor modes have explicit end-detection semantics.
2. Add framework-driven transaction manifest injection to scenario/runtime metadata.
3. Update `transaction.ts` to auto-register transaction metrics during k6 init context from the injected manifest.
4. Introduce the lifecycle-owned transaction gate API.
5. Add `transaction()` wrapper and remove mandatory `initTransactions([...])` from new generated/converter output.
6. Introduce `request()` with replay logging and URL-resolution support first.
7. Integrate snapshot/error emission into `request()` using the existing artifact contract.
8. Update generator and converter output.
9. Add regression coverage for executor modes, load shapes, replay logging, automatic transaction initialization, and backward compatibility.

---

# Proposal: Request Import (`import curl|postman|openapi`)

> **Status:** Approved scope. **Phase 1 (cURL) ✅ IMPLEMENTED.** **Phase 2 (Postman) ✅ IMPLEMENTED.** Phases 3–4 pending.
> **Goal:** Let users create framework-compliant k6 scripts from ad-hoc request specs (cURL strings, Postman collections, OpenAPI operations) without hand-authoring transaction/request boilerplate.

## Motivation

The existing `generate` command produces a script from a HAR recording — a recorded *real* interaction. For ad-hoc work (a single endpoint a dev wants to load-test, a Postman collection someone shared, an OpenAPI operation), there is no fast path today. Users hand-author the script, often diverging from framework conventions (raw `http.get`, missing `transaction()` wrapper, no `k6Check`, no `getEnvContext`, etc.).

A new `import` command family — sibling to `generate`, not nested inside it — closes this gap.

## Design Principles

1. **Single emission pipeline.** Every input adapter normalizes to the same internal IR (`HAREntry[]` wrapped in `TransactionGroup`) and feeds the existing `ScriptGenerator`. **Do not** write a parallel emitter per input source.
2. **Dumb 1:1 translation in v1.** No correlation hinting, no parameterization detection, no auth-flow generation. Hardcode all values, emit a default `k6Check(res, { 'status is 2xx': ... })`, and let the user evolve from there.
3. **No append mode in v1.** Always emit new files. Append (insert a new `transaction()` into an existing script via AST) is a separate feature with its own design pass.
4. **No interactive wizard in v1.** All inputs are textual (curl string, file path, collection path). A wizard is a separate v-future feature, only justified if usage data demands it.
5. **One subcommand per input source.** `import curl ...`, `import postman ...`, `import openapi ...`. Each has its own help, flags, and tests. Avoids polymorphic `--from-*` flag soup on a single command.

## Phased Plan

### Phase 1 — cURL (v1) ✅ IMPLEMENTED

**Status:** Shipped. Files: `core_engine/src/recording/CurlAdapter.ts`, `core_engine/src/cli/import.ts`, registered in `core_engine/src/cli/run.ts` as `import curl <team> <script-name>`. Smoke-tested with single-curl, multi-curl file (named transactions via `# comment`), basic auth, empty bodies, multi-line `\`-continuations, and unsupported-flag warnings. Build + typecheck clean.

**Why first:** cURL is the universal hand-off format. Every browser devtool, every API client, every CLI exports it. Single-curl and multi-curl-file inputs together cover both "single request" and "build a journey" use cases without needing a separate journey-building UX.

**Scope:**
- New CLI subcommand: `import curl --curl '<string>' <team> <script-name>` and `import curl --file <path> <team> <script-name>`.
- New module: `core_engine/src/recording/CurlAdapter.ts`. Parses one or more curl invocations into `HAREntry[]`.
- Adapter feeds existing `ScriptGenerator.generate()` via a single-element `TransactionGroup`.
- Multi-curl file format: blank-line-separated curl blocks. An optional `# Transaction name` comment line above a block sets the transaction name.
- Output: `testSuites/<team>/tests/<script-name>.js`, framework-shaped, ready to run.

**cURL subset supported in v1:**
- HTTP method via `-X` / `--request` (default GET, or POST if `-d` present without `-X`)
- URL (positional, last non-flag arg)
- Headers via `-H` / `--header` (repeatable)
- Body via `-d` / `--data`, `--data-raw`, `--data-binary` (file refs `@path` resolved at parse time)
- Basic auth via `-u user:pass` → emitted as an `Authorization: Basic ...` header
- Multi-line continuations (`\` at end of line)

**cURL flags silently ignored in v1:**
- `-k` / `--insecure`, `--compressed`, `-v`, `-s` / `--silent`, `-L` / `--location`, `-o`, `-O`, `-i`, `--max-time`, `--connect-timeout`, `-w` / `--write-out`

**cURL flags that emit a warning (parse continues):**
- `--cookie` / `-b` / `-c` (cookie jar — k6 manages cookies natively, hint dropped)
- `--data-urlencode` (different encoding semantics; emit as plain `-d` with a TODO comment)
- `-F` / `--form` (multipart — TODO comment, body emitted as-is)

**Library decision:** in-house parser. Curl's CLI grammar is well-scoped for our v1 subset (~200 LOC) and adding `parse-curl-js` or similar pulls in a dependency we don't otherwise need. Edge cases hit by the in-house parser get a warning + a fall-back literal pass-through rather than a crash, so users always get *something* and a hint.

**Out of scope for Phase 1:**
- OAuth / token-refresh flows
- Multipart file uploads
- Body schema inference
- Auto-correlation (no upstream to extract from)
- Append-to-existing-script

### Phase 2 — Postman (v2) ✅ IMPLEMENTED

**Status:** Shipped. Files: `core_engine/src/recording/PostmanAdapter.ts`, `runImportPostman` in `core_engine/src/cli/import.ts`, `import postman <team> <script-name>` registered in `core_engine/src/cli/run.ts`. Smoke-tested with a v2.1 collection containing a top-level request, nested folders with multiple requests, bearer auth, basic auth, raw JSON body, urlencoded body, disabled headers/params, query strings, and a pre-request script. The `--folder <name>` filter also works (verified by filtering to just the `Auth` folder). Build + typecheck clean.

**Documented deviation from the original sketch:** Pre-request and test scripts emit a console **warning** at import time (so the user knows manual porting is required) but are NOT injected as `// TODO:` block comments inside the generated script body. Injecting comments would require changing either `HAREntry` shape or `ScriptGenerator` emission, which violated the "no emitter changes in Phase 2" architectural constraint. Acceptable tradeoff: the warning is loud, and the user can read the original collection to recover the script body.

**Trigger satisfied:** explicit user request to begin Phase 2.

**Library revision:** **in-house Postman v2.1 parser** (deviation from earlier sketch that named `postman-collection` SDK). Reasons mirror the cURL decision: no new runtime dependency, dumb 1:1 mapping doesn't need the full Postman runtime model, and walking a well-documented JSON schema is ~200 LOC.

**Scope:**
- `import postman <team> <script-name> --file <collection.json> [--folder <name>]`
- Input format: Postman Collection v2.1 (the dominant export format since 2017). v1 collections are not supported; users must re-export.
- Mapping rules:
  - Postman folder → `TransactionGroup`. Nested folders flatten with dot notation (`API.Auth.Login`).
  - Postman request → `HAREntry` inside the group it lives in.
  - Top-level (no-folder) requests → single-entry `TransactionGroup` named after the request.
  - `request.url` (string or object) → resolved URL string. Query params and path variables preserved literally (incl. `{{var}}` references).
  - `request.header` → `{ name, value }[]`, dropping entries with `disabled: true`.
  - `request.body` modes handled:
    - `raw` → body text + content-type from headers (or inferred from `language` hint)
    - `urlencoded` → form-encoded string, `application/x-www-form-urlencoded`
    - `formdata` (multipart) → emit body text + warning + TODO comment
    - `file` / `graphql` / `none` → empty body
  - `request.auth` (request-level only in v1, not cascaded from folder/collection): `bearer`, `basic`, `apikey` (header position only); emitted as headers. `oauth2`, `digest`, etc. → warning + TODO.
  - `event[].listen === "prerequest"` / `event[].listen === "test"` scripts → block-comment `// TODO: port Postman <prerequest|test> script manually` with the original script body preserved as a comment. Postman's sandbox is a different runtime — not translatable.
- Postman variables (`{{var}}`) → preserved literally in URL/headers/body. User wires to env or CSV after generation.
- Insomnia → deferred. Plan: thin Insomnia v4 → Postman v2.1 normalizer feeding the same Postman adapter. Out of scope for the first Phase 2 ship.

**Out of scope for Phase 2:**
- Collection/folder-level auth cascade (request-level only)
- Resolving `{{variable}}` placeholders against `collection.variable`
- Postman environment files (`*.postman_environment.json`)
- Multipart file uploads (warning + TODO)
- Mock-server / monitor metadata in the collection
- Insomnia format (deferred to a Phase 2.5)
- `--folder <name>` filter is optional but if implemented in v1, only matches direct folder name; no nested path filtering

### Phase 3 — OpenAPI / Swagger (v3, conditional)

**Trigger:** Phase 2 ships AND there is concrete demand from API teams that maintain a spec.

**Why conditional:** OpenAPI specs frequently lack `example` payloads, so the emitted body is `{}` with a TODO. Without parameterization (intentionally cut from v1), the resulting script is rarely runnable without manual filling — diminishes the value prop. Reassess after Phase 2 reception.

**Scope sketch:**
- `import openapi <spec.yaml> --operation <opId> [--server <url>] <team> <script-name>`
- Library: `@apidevtools/swagger-parser` (resolves refs, validates spec)
- Operation selection by `operationId` (no `--operation` → list operations and exit)
- Body: use schema `example` if present, else `{}` with TODO
- Server: first `servers[]` entry or `--server` override
- Security schemes: emit auth placeholder comment

### Phase 4+ — Deferred / conditional

- **Append mode** (`--append-to <script>`): AST-based insertion into existing scripts. Requires `@babel/parser` + `recast`. Multi-day work with permanent maintenance cost. Defer until usage patterns show it's needed beyond manual copy-paste.
- **Interactive wizard:** only build if real users without a curl/Postman/OpenAPI source request it. Wizard audience is thin in perf-testing contexts.
- **Smart emission** (parameterization detection, auth-flow scaffolding, body inference): each is its own design pass once we see real Phase 1–3 user friction.

## CLI Shape (Phase 1)

```
k6-framework import                                   # parent (lists subcommands)
k6-framework import curl --curl '<curl-string>' <team> <script-name>
k6-framework import curl --file <path>           <team> <script-name>
```

Exactly one of `--curl` or `--file` is required. Both supplied → error.

## Internal Pipeline (Phase 1)

```
curl string  ─►  CurlAdapter.parse()  ─►  HAREntry[]  ─►  [single TransactionGroup]  ─►  ScriptGenerator.generate()  ─►  .js
```

The `HAREntry[]` produced by the adapter is *synthetic* — `id`, `pageref`, `time`, `status`, `responseHeaders`, `responseBody` are filled with sensible defaults (status: 200, empty response, generated id). The downstream emitter only consumes request-side fields, so the synthetic response fields never reach the generated script.

## Architectural Constraints

1. **No new IR.** Adapters produce `HAREntry[]`. Adding a separate `RequestSpec` IR would duplicate fields that already exist in `HAREntry` and create translation tax forever.
2. **Adapters live under `core_engine/src/recording/`.** Same neighborhood as the HAR pipeline. Keeps "things that produce TransactionGroups" co-located.
3. **No emitter changes for Phase 1.** `ScriptGenerator.generate()` already handles single-element groups correctly. If Phase 2/3 surfaces an emitter gap, address it then.
4. **Idempotent output.** Same input → byte-identical output. Required for version control sanity. Means: deterministic naming, sorted header keys in emitted code, no timestamps.
5. **Failure mode: warn + degrade, don't crash.** Unsupported curl flag → log warning, emit `// TODO:` comment, continue. The user always gets a file they can edit.

## Suggested Implementation Order (Phase 1) ✅ COMPLETE

1. ✅ `CurlAdapter.ts` — tokenizer + flag parser + `HAREntry` builder + multi-curl file splitter.
2. ✅ `cli/import.ts` — `runImportCurl(team, scriptName, opts)` entry point. Reads input, calls adapter, calls `ScriptGenerator.generate()`, writes file.
3. ✅ `cli/run.ts` — registered `import` parent command and `import curl` subcommand.
4. ✅ Smoke test: realistic POST curl with JSON body + basic auth → framework-shaped script with hoisted env baseUrl, base64 Authorization header, default k6Check.
5. ✅ Edge-case sweep: empty body (`-d ''`), JSON body, basic auth, multi-line `\` continuation, multi-curl file with `# name` comments, unsupported flags producing warnings (not crashes). One tokenizer bug found and fixed mid-implementation (empty quoted strings now flush as tokens).
