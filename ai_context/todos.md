# Framework To-Do List

> A shared task list for AI agents to maintain continuity across sessions.
> **All AI agents MUST update this file when completing tasks or discovering new work.**

## Completed Tasks

- **Environment Architecture:** Completed migration to `scrum_suites`-based environment configuration per team.
- **Dynamic Session Handling:** Refactored URL resolution and `getEnvContext` to avoid URL encoding issues with template literals.
- **Session Debugging:** Improved `session.ts` missing config error message to include the active environment file name (dynamic via `K6_PERF_ENVIRONMENT`).
- **Think Time Refactoring:** Replaced raw `sleep()` and `getFrameworkThinkTime()` with a robust `thinktime(minOrFixed?, max?)` utility.
  - Supports `ignoreThinkTime` and `globalOverride` in runtime settings.
  - Supports inline random range: `thinktime(2, 5)` for 2–5s random delay.
  - Script Generator and Converter preserve think times properly between groups (not at phase start).
- **Error Behavior Audit:** Validated and fixed all four error behaviors (`continue`, `stop_iteration`, `stop_vu`, `abort_test`).
  - Fixed `stop_vu`: terminated VUs no longer sleep in an infinite loop — they return immediately.
  - Fixed init/action phase guards: changed from checking `=== 'stop_iteration'` to `!== 'continue'` so all non-continue behaviors (including `stop_vu`) are handled explicitly.
- **Step-up / Multi-spike Support:** Fixed `getEndSignal` to distinguish intermediate ramp-downs from the final ramp-down using `isFinalRampDown`. VUs no longer get permanently `state.ended` during intermediate dips in spike/step scenarios.
- **Templates Folder Moved:** Relocated `config/templates/` → root-level `templates/`. Updated CLI references in `templates.ts` and `new.ts`.
- **Folder Structure Decision:** Schemas remain in `config/schemas/` (required for `$schema` relative paths in JSON files). Templates moved to root since they are scaffolding, not runtime config.
- **Proposal 1 — `transaction()` Wrapper (Design Proposals):** Fully implemented.
  - Added `getTransactionGate()` to `lifecycle.ts` — single owner of executor-aware end detection (C1 satisfied).
  - Added `transaction(name, fn)` wrapper to `transaction.ts`: `group()` wrapping, `startTransaction`/`endTransaction` pairing in `finally`, lifecycle gate check before start, error boundary (continue/stop_iteration/stop_vu/abort_test), nested transaction rejection with descriptive error.
  - Added `autoInitTransactionsFromEnv()` IIFE in `transaction.ts` module init: reads `K6_PERF_TRANSACTION_NAMES` and auto-registers Trend + Counter metrics in k6 init context.
  - Added `getCurrentTransaction()` export — consumed by `request.ts` to attach transaction context to replay log entries.
  - `initTransactions([...])` retained as backward-compatible fallback for legacy and standalone scripts.
  - `ScenarioBuilder.ts` updated: `ScenarioRuntimeMetadata.journeyTransactionNames` field added; injects `K6_PERF_TRANSACTION_NAMES` per journey when provided.
- **Proposal 2 — `request()` Helper (Design Proposals):** Fully implemented.
  - Created `core_engine/src/utils/request.ts` (k6-safe, no Node.js imports).
  - `request(method, pathOrUrl, options?)` resolves relative paths via `resolvePath()`, executes `http.*`, auto-calls `logExchange()` when `K6_PERF_DEBUG` is set, returns native k6 `Response`.
  - Header sanitization: strips `content-length`, `transfer-encoding`, `host` before passing to k6 (fixes HAR-recorded Content-Length mismatch warnings).
  - Snapshot emission: emits `[k6-perf][snapshot-event]` JSON lines on 4xx/5xx responses; Node.js-side pipeline captures these and writes `results/{run}/snapshots/snapshot-NNN.json` files.
  - `session.ts` extended: `_primaryBaseUrl` tracking (set on first `registerBaseUrl()` call), new `resolvePath(pathOrUrl, service?)` export — resolution priority: absolute → service URL → `K6_PERF_BASE_URL` env → primary registered URL.
  - `ScriptGenerator.ts` overhauled: new output uses `transaction()` wrapper + `request()` helper; removes manual `initTransactions([...])`, `group()`, `startTransaction()`, `endTransaction()`, `logExchange()` boilerplate; relative paths emitted for primary origin; headers preserved in options.headers.
  - `ScriptConverter.ts` updated: now emits same `transaction()` + `request()` format as ScriptGenerator (was still emitting old group/startTransaction/logExchange pattern).
  - `index.ts` updated: exports `transaction`, `getCurrentTransaction` alongside existing transaction exports.
- **Source Map Fix:** Disabled source maps in `tsconfig.json` (`sourceMap: false`, `declarationMap: false`) to prevent k6 from following `.js.map` source paths into `core_engine/src/utils/` where no `.js` files exist, causing module resolution failures.
- **Snapshot Pipeline:** `ScenarioRuntimeMetadata.runtime.errors` field added; `buildScenarioRuntimeMetadata()` in `run.ts` populates it from `RuntimeConfigManager`; `PipelineRunner.executeAsync` accepts `onLine` callback for real-time stdout/stderr interception; `buildSnapshotLineHandler()` in `run.ts` parses snapshot events and writes JSON files.
- **Pipeline wiring for transaction names:** `extractJourneyTransactionNames()` in `run.ts` reads `transaction('Name', ...)` and `startTransaction('Name')` patterns from script source; injects `K6_PERF_TRANSACTION_NAMES` per journey and globally via `buildRunEnvironment()`.
- **init.ts scaffold templates updated:** Browse and checkout journey templates now use `transaction()` + `request()` format; removed `group/startTransaction/endTransaction/logExchange/initTransactions` boilerplate; added missing `check()` in the Checkout transaction.
- **Step-up and multi-spike templates:** Added `templates/test_plans/step-up.jsonc` and `templates/test_plans/multi-spike.jsonc`.
- **Arrival-rate executor fail-fast:** `ExecutorFactory.build()` now throws a clear error for `ramping-arrival-rate` and `constant-arrival-rate` explaining that lifecycle phase-envelope support is not yet implemented.
- **Full Executor Support (All 7 k6 Executors):** Extended the framework to support all 7 k6 executor types: `ramping-vus`, `constant-vus`, `shared-iterations`, `per-vu-iterations`, `constant-arrival-rate`, `ramping-arrival-rate`, `externally-controlled`.
  - `TestPlanSchema.ts`: Added `externally-controlled` to `ExecutorType` union; added `rate`, `timeUnit`, `preAllocatedVUs`, `maxVUs` fields to `GlobalLoadProfile`.
  - `ExecutorFactory.ts`: Fixed arrival-rate required fields (`rate`/`preAllocatedVUs` instead of `vus`); added `externally-controlled` executor definition.
  - `WorkloadModels.ts`: Added `buildConstantArrivalRateProfile()`, `buildRampingArrivalRateProfile()`, `buildExternallyControlledProfile()` builder functions; extended `K6ExecutorConfig` with new fields.
  - `ScenarioBuilder.ts`: Extended `ScenarioPhaseEnvelope` to cover all 7 executor modes; implemented `computePhaseEnvelope()` for arrival-rate (duration/stage-based) and externally-controlled (open-ended).
  - `SchemaValidator.ts`: Added all 7 executor types to schema enum; added `rate`, `timeUnit`, `preAllocatedVUs`, `maxVUs` properties.
  - Created 7 template JSON files in `config/test_plans/templates/` (one per executor type).
- **ScriptConverter Modernization:** Updated `ScriptConverter.ts` to align with current framework patterns.
  - `buildImportBlock()`: Uses `core_engine/src/utils/` import paths; adds session.js imports; deduplicates lifecycle/session imports.
  - `applyPhaseContract()`: Added stale pattern normalization — strips `variableEvents: []`, fixes `dist/` → `core_engine/src/` paths. Emits `transaction()` + `request()` format matching ScriptGenerator output.
- **Auto Variable Tracking via Context Proxy:** `lifecycle.ts` `createContext()` now wraps `ctx.data`, `ctx.session`, `ctx.correlation`, `ctx.meta` in Proxies that auto-register every scalar assignment into the replay variable registry (via `trackCorrelation` / `trackParameter`). Scripts no longer need explicit tracking calls for ctx-based variables; `detectVariableEvents` finds the values inside request URLs/bodies/headers and surfaces them in the Variables section of the debug report.
- **Debug Run Behavior Fixes:**
  - `ReplayRunner.ts`: removed hardcoded `thinkTime: { ignoreThinkTime: true }` from `K6_PERF_RUNTIME_METADATA` so debug runs honor configured think time instead of skipping it.
  - `transaction.ts` + `check()`: every error path now logs with full behavior context — e.g. `[k6-perf][transaction:select_product] ERROR: <msg> → continuing to next transaction` / `→ stopping iteration` / `→ stopping VU permanently` / `→ aborting test`. Failed `check()` now also includes the active transaction name in the error message.
- **CLI Passthrough Token Merge:** `filterPassthroughArgs` in `run.ts` now merges `["--flag", "=value"]` (space before `=`) into `--flag=value` so user-supplied k6 flags like `--http-debug =full` don't trip k6's "accepts 1 arg, received 2" error.
- **ScriptConverter: Module-Level Variable Hoisting (Points 2 + 3):** `partitionLifecycleStatements` now returns a `moduleLevelDecls` bucket that `applyPhaseContract` emits at file scope (between the env block and `__journeyLifecycleStore`). Routes `let match;`, `let regex;`, and any simple `let varname[=literal];` declaration from the prelude to module scope so values set in one phase/transaction are visible to all others — eliminating the cross-phase `ReferenceError` class of bug (the original `p_check` issue). Per-VU isolation preserved (k6 instantiates the module fresh per VU).
- **ScriptConverter: Auto-Inject `variables` Option Per Request (Point 4):** `buildRequestCallString` now scans the request's url/body/headers for `${...}` template expressions and emits a `variables: { ... }` option containing each non-framework-tracked identifier (skips `env.*`, `correlation_vars[*]`, `ctx.*`, `getUniqueItem(FILES[*])`). The runtime evaluates these at the moment of the request call, so the debug report's Variables section shows the **current** value of every local/global variable used in a request — including ones the user assigns mid-transaction (e.g. `p_check`). `extractRequestVars` is the helper that powers this.
- **Folder Naming: Dashes → Underscores:** Across `run.ts`, `ReplayRunner.ts`, and `PipelineRunner.ts`, all run-folder timestamps and safe-name sanitizers now produce underscore-only path segments. Timestamps go from `Run_2026-05-21T04-30-21-486Z` → `Run_2026_05_21T04_30_21_486Z`; safe-name regex changed from `[^a-zA-Z0-9_\-]` → `[^a-zA-Z0-9_]` so plan/journey names like `WebUI-Load-Test` become `WebUI_Load_Test`.
- **Init & BYOS Scaffolds Refreshed:**
  - `init.ts` sample journeys (`browse-journey.js`, `checkout-journey.js`): dropped the obsolete `registerBaseUrl` call, switched `getEnvContext` to the correct object-form signature (`getEnvContext('team', { baseUrl: '...' })`), use `${env.baseUrl}...` template literals for URLs, and added the `ctx.correlation` Proxy bridge in the checkout journey.
  - `generate-byos.ts` template: replaced `initTransactions / group / startTransaction / endTransaction / logExchange / sleep` boilerplate with the modern `transaction() / request() / thinktime()` pattern; corrected `getEnvContext` signature; updated inline comments to explain Proxy-based correlation tracking.
- **Live Metrics Display Overhaul:**
  - `startLiveTransactionDisplay` now uses an ANSI **scroll region** to split the terminal: k6 owns rows `1..(tableTop - 1)` (banner + animated progress bar live there, can scroll naturally), and the live metrics table is frozen at the bottom in rows `tableTop..termRows`. Render flow per tick: `\x1b7` save cursor → clear table area → draw new table at `tableTop` → `\x1b8` restore cursor. k6's progress bar continues animating without ever touching the table area, and the table updates in place (no scrollback churn). Helper split: `buildLiveTableLines` returns the styled strings; `renderFixedTable` does the scroll-region/cursor dance; `renderScrollbackTable` is the fallback used when stdout isn't a TTY or the terminal is too short (`termRows < tableRows + 12`) to fit both regions.
  - On `stop()`, the scroll region is reset (`\x1b[r`) and the cursor is parked below the table so post-run output (transaction summary table, etc.) appears below cleanly.
  - Corrected pass/fail formula. Old logic used `count - min(checkPasses)` which silently reported `0` fails whenever the `checkPasses` map was empty (e.g. when all checks for a transaction were failing). New logic computes `failedIterations = min(max(checkFails), count)` and `pass = count - failedIterations`, with a `count` fallback when no check data exists at all.

## Current / In-Progress Tasks

*(Currently no active tasks)*

## Future Tasks / Backlog

- Evaluate and tune SLAs (e.g. `p95` and `errorRate`) for complex scenarios after gathering baseline results.
- Implement comprehensive unit tests for `ScriptConverter` to validate group statement and think time ordering.
- Bulk check other teams/scripts to confirm removal of legacy `registerFrameworkEnvironmentUrls` implementations.
- Add regression coverage for lifecycle end detection across all supported executor modes and load shapes: load, stress, soak, spike, step/staircase, iteration-based, arrival-rate-based, and externally-controlled.
- Realtime Result Generation in Terminal: Develop a robust console output formatter that provides live, real-time updates of transaction metrics, active VUs, pass/fail counts, and execution progress directly in the terminal during load tests.
- Auto-Code Support / IDE Intellisense: Leverage framework rules and native k6 functionality to provide advanced intellisense, type definitions, and auto-completion support (e.g. JSDoc or `.d.ts` generation) for faster and more accurate script authoring.
