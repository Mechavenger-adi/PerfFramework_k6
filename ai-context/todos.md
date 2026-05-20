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
  - Created `core-engine/src/utils/request.ts` (k6-safe, no Node.js imports).
  - `request(method, pathOrUrl, options?)` resolves relative paths via `resolvePath()`, executes `http.*`, auto-calls `logExchange()` when `K6_PERF_DEBUG` is set, returns native k6 `Response`.
  - Header sanitization: strips `content-length`, `transfer-encoding`, `host` before passing to k6 (fixes HAR-recorded Content-Length mismatch warnings).
  - Snapshot emission: emits `[k6-perf][snapshot-event]` JSON lines on 4xx/5xx responses; Node.js-side pipeline captures these and writes `results/{run}/snapshots/snapshot-NNN.json` files.
  - `session.ts` extended: `_primaryBaseUrl` tracking (set on first `registerBaseUrl()` call), new `resolvePath(pathOrUrl, service?)` export — resolution priority: absolute → service URL → `K6_PERF_BASE_URL` env → primary registered URL.
  - `ScriptGenerator.ts` overhauled: new output uses `transaction()` wrapper + `request()` helper; removes manual `initTransactions([...])`, `group()`, `startTransaction()`, `endTransaction()`, `logExchange()` boilerplate; relative paths emitted for primary origin; headers preserved in options.headers.
  - `ScriptConverter.ts` updated: now emits same `transaction()` + `request()` format as ScriptGenerator (was still emitting old group/startTransaction/logExchange pattern).
  - `index.ts` updated: exports `transaction`, `getCurrentTransaction` alongside existing transaction exports.
- **Source Map Fix:** Disabled source maps in `tsconfig.json` (`sourceMap: false`, `declarationMap: false`) to prevent k6 from following `.js.map` source paths into `core-engine/src/utils/` where no `.js` files exist, causing module resolution failures.
- **Snapshot Pipeline:** `ScenarioRuntimeMetadata.runtime.errors` field added; `buildScenarioRuntimeMetadata()` in `run.ts` populates it from `RuntimeConfigManager`; `PipelineRunner.executeAsync` accepts `onLine` callback for real-time stdout/stderr interception; `buildSnapshotLineHandler()` in `run.ts` parses snapshot events and writes JSON files.
- **Pipeline wiring for transaction names:** `extractJourneyTransactionNames()` in `run.ts` reads `transaction('Name', ...)` and `startTransaction('Name')` patterns from script source; injects `K6_PERF_TRANSACTION_NAMES` per journey and globally via `buildRunEnvironment()`.
- **init.ts scaffold templates updated:** Browse and checkout journey templates now use `transaction()` + `request()` format; removed `group/startTransaction/endTransaction/logExchange/initTransactions` boilerplate; added missing `check()` in the Checkout transaction.
- **Step-up and multi-spike templates:** Added `templates/test-plans/step-up.jsonc` and `templates/test-plans/multi-spike.jsonc`.
- **Arrival-rate executor fail-fast:** `ExecutorFactory.build()` now throws a clear error for `ramping-arrival-rate` and `constant-arrival-rate` explaining that lifecycle phase-envelope support is not yet implemented.
- **Full Executor Support (All 7 k6 Executors):** Extended the framework to support all 7 k6 executor types: `ramping-vus`, `constant-vus`, `shared-iterations`, `per-vu-iterations`, `constant-arrival-rate`, `ramping-arrival-rate`, `externally-controlled`.
  - `TestPlanSchema.ts`: Added `externally-controlled` to `ExecutorType` union; added `rate`, `timeUnit`, `preAllocatedVUs`, `maxVUs` fields to `GlobalLoadProfile`.
  - `ExecutorFactory.ts`: Fixed arrival-rate required fields (`rate`/`preAllocatedVUs` instead of `vus`); added `externally-controlled` executor definition.
  - `WorkloadModels.ts`: Added `buildConstantArrivalRateProfile()`, `buildRampingArrivalRateProfile()`, `buildExternallyControlledProfile()` builder functions; extended `K6ExecutorConfig` with new fields.
  - `ScenarioBuilder.ts`: Extended `ScenarioPhaseEnvelope` to cover all 7 executor modes; implemented `computePhaseEnvelope()` for arrival-rate (duration/stage-based) and externally-controlled (open-ended).
  - `SchemaValidator.ts`: Added all 7 executor types to schema enum; added `rate`, `timeUnit`, `preAllocatedVUs`, `maxVUs` properties.
  - Created 7 template JSON files in `config/test-plans/templates/` (one per executor type).
- **ScriptConverter Modernization:** Updated `ScriptConverter.ts` to align with current framework patterns.
  - `buildImportBlock()`: Uses `core-engine/src/utils/` import paths; adds session.js imports; deduplicates lifecycle/session imports.
  - `applyPhaseContract()`: Added stale pattern normalization — strips `variableEvents: []`, fixes `dist/` → `core-engine/src/` paths. Emits `transaction()` + `request()` format matching ScriptGenerator output.

## Current / In-Progress Tasks

*(Currently no active tasks)*

## Future Tasks / Backlog

- Evaluate and tune SLAs (e.g. `p95` and `errorRate`) for complex scenarios after gathering baseline results.
- Implement comprehensive unit tests for `ScriptConverter` to validate group statement and think time ordering.
- Bulk check other teams/scripts to confirm removal of legacy `registerFrameworkEnvironmentUrls` implementations.
- Add regression coverage for lifecycle end detection across all supported executor modes and load shapes: load, stress, soak, spike, step/staircase, iteration-based, arrival-rate-based, and externally-controlled.
- Realtime Result Generation in Terminal: Develop a robust console output formatter that provides live, real-time updates of transaction metrics, active VUs, pass/fail counts, and execution progress directly in the terminal during load tests.
- Auto-Code Support / IDE Intellisense: Leverage framework rules and native k6 functionality to provide advanced intellisense, type definitions, and auto-completion support (e.g. JSDoc or `.d.ts` generation) for faster and more accurate script authoring.
