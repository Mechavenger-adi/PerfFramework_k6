# Framework Implementation TODO

This checklist tracks the agreed lifecycle, reporting, observability, and CI/CD work.

## Ground Rules

- Existing framework functionality must not break.
- Update this file and `AGENT-CONTEXT.md` as each task moves forward.
- Prefer incremental, verifiable changes over large rewrites.
- Keep user-facing script authoring simple.

## Task 1: Runtime Contracts And Config

**Status**
- Completed on 2026-04-06

**Scope**
- Extend runtime config contracts for:
  - `errorBehavior`
  - reporting
  - errors
  - monitoring
  - timeseries
- Add reporting/event TypeScript contracts
- Update schema validation and runtime config accessors

**Dependencies**
- None

**Expected outputs**
- `ConfigContracts.ts` updated
- `SchemaValidator.ts` updated
- `RuntimeConfigManager.ts` updated
- new `EventContracts.ts`
- new `ReportingContracts.ts`
- config schema supports new sections

**Delivered**
- Added reporting / errors / monitoring / timeseries runtime config contracts
- Extended `errorBehavior` to `continue`, `stop_iteration`, `stop_vu`, `abort_test`
- Added schema validation for new runtime sections
- Added runtime config accessors for reporting, snapshots, timeseries, monitoring, and pacing
- Added `EventContracts.ts` and `ReportingContracts.ts`
- Updated scaffolded default runtime settings in `core-engine/src/cli/init.ts`

## Task 2: Shared Runtime Foundation

**Status**
- Scaffolding completed on 2026-04-06

**Scope**
- Build shared runtime helpers for:
  - lifecycle execution
  - error handling
  - metrics collection
  - snapshot capture
  - timeseries aggregation

**Dependencies**
- Task 1

**Expected outputs**
- new runtime helper files under `core-engine/src/runtime/`
- hidden lifecycle wrapper skeleton
- structured error/warning event creation
- transaction metric helper
- bucketed timeseries helper

**Delivered so far**
- Added `LifecycleRuntime.ts`
- Added `ErrorRuntime.ts`
- Added `MetricsRuntime.ts`
- Added `SnapshotRuntime.ts`
- Added `TimeseriesRuntime.ts`
- Exported new runtime helpers from `core-engine/src/index.ts`
- Pacing direction agreed: expose pacing helper similar to think time and apply pacing after the last transaction in `actionPhase(ctx)`

**Next**
- Integrate these helpers into execution flow without breaking current behavior

**Lifecycle bridge update**
- Added shared k6-side lifecycle helper in `core-engine/src/utils/lifecycle.js`
- Generated and converted scripts now call the shared lifecycle helper instead of invoking `actionPhase(ctx)` directly
- Helper currently supports:
  - `ramping-vus` end timing from `K6_PERF_PHASES`
  - `per-vu-iterations` end timing from total iterations
  - action-end pacing via runtime metadata
  - basic `continue` / `stop_iteration` / `stop_vu` / `abort_test` handling for phase exceptions

## Task 3: Scenario And Execution Wiring

**Status**
- Completed on 2026-04-06

**Scope**
- Inject lifecycle/runtime metadata into scenarios
- Wire the run path to use shared runtime wrapper
- Prepare run output directories and artifact wiring

**Dependencies**
- Task 2

**Expected outputs**
- `ScenarioBuilder.ts` updated
- `run.ts` updated
- `PipelineRunner.ts` updated
- run metadata and output orchestration ready

**Delivered**
- `ScenarioBuilder.ts` now accepts optional scenario runtime metadata and injects per-scenario env values such as run ID, report directory, journey name, scenario metadata JSON, and runtime metadata JSON.
- `ScenarioBuilder.ts` now also injects `K6_PERF_PHASES` envelopes for supported executors (`ramping-vus`, `per-vu-iterations`) so generated/converted scripts can run init/action/end through the shared lifecycle helper.
- `ParallelExecutionManager.ts` now passes optional runtime metadata through to `ScenarioBuilder` without changing existing call sites.
- `run.ts` now prepares stable run metadata before execution, writes `run-manifest.json`, passes scenario metadata into k6 option building, and passes run/report env metadata into the k6 process.
- `PipelineRunner.ts` now carries `runId`, `reportDir`, and `runManifestPath` through execution metadata and writes per-run resolved options filenames.
- Existing execution shape remains unchanged: journey scripts still run through the current temporary entry script/export model.

## Task 4: Generator And Converter UX

**Status**
- Baseline completed on 2026-04-06

**Scope**
- Update generator and converter to emit:
  - `initPhase(ctx)`
  - `actionPhase(ctx)`
  - `endPhase(ctx)`
- Prompt users for init/end group selection
- Support skip option with empty init/end functions

**Dependencies**
- Task 2
- Task 3

**Expected outputs**
- `ScriptGenerator.ts` updated
- `ScriptConverter.ts` updated
- `generate.ts` updated
- `convert.ts` updated
- stable simple author-facing scripts

**Delivered so far**
- Added shared CLI lifecycle prompt in `core-engine/src/cli/LifecyclePrompt.ts`
- `generate` now prompts for init/end groups with a skip path
- `convert` now prompts for init/end groups with a skip path when running interactively
- `ScriptGenerator` now emits:
  - `initPhase(ctx)`
  - `actionPhase(ctx)`
  - `endPhase(ctx)`
  - compatibility `export default function () { runJourneyLifecycle(...); }`
- `ScriptConverter` now applies the same phase-based script contract after conversion
- generated/converted scripts now create one module-scope lifecycle store and delegate execution to the shared helper
- When lifecycle split is skipped:
  - `initPhase(ctx)` remains empty
  - all groups stay in `actionPhase(ctx)`
  - `endPhase(ctx)` remains empty

**Still pending**
- richer per-phase state mapping for converted scripts
- broader executor support and deeper runtime event integration

## Task 5: Artifact Persistence

**Status**
- Baseline completed on 2026-04-06

**Scope**
- Persist structured run artifacts:
  - `errors.ndjson`
  - `warnings.ndjson`
  - `transaction-metrics.json`
  - `ci-summary.json`
  - `timeseries.json`

**Dependencies**
- Task 2
- Task 3

**Expected outputs**
- new reporting/artifact writer helpers
- structured artifact persistence working
- CI-friendly outputs available after run

**Delivered so far**
- Added `core-engine/src/reporting/ArtifactWriter.ts`
- Added end-of-run artifact finalization in `run.ts`
- Local/non-debug load runs now generate:
  - `transaction-metrics.json`
  - `errors.ndjson` (currently empty placeholder until structured runtime event streaming is wired)
  - `warnings.ndjson` (currently empty placeholder)
  - `ci-summary.json`
  - `timeseries.json` (currently empty scaffold)
  - `RunReport.html`
- Existing `summary.json`, `TestDetails.html`, and `TestSummary.html` remain intact for compatibility
- `run-manifest.json` now lists the new artifact paths

## Task 6: Transaction Metrics Matrix

**Status**
- Baseline completed on 2026-04-06

**Scope**
- Implement transaction duration + pass/fail collection
- Support configurable visible stats:
  - `avg`
  - `min`
  - `max`
  - `p(90)`
  - `p(95)`
  - `p(99)`
  - pass/fail counts

**Dependencies**
- Task 2
- Task 5

**Expected outputs**
- transaction metric collection working
- `transaction-metrics.json` contains configured columns
- summary/gate logic can use transaction data

**Delivered so far**
- Added `core-engine/src/reporting/TransactionMetricsBuilder.ts`
- Transaction matrix now derives:
  - duration stats from k6 summary trend metrics
  - pass/fail counts from grouped check results in `summary.json`
- Supports configurable visible stats such as `count`, `pass`, `fail`, `avg`, `min`, `max`, `p(90)`, `p(95)`, `p(99)`
- Added `core-engine/src/reporting/RunSummaryBuilder.ts` so CI summary can consume transaction matrix output

## Task 7: Error, Warning, And Snapshot Flow

**Status**
- Baseline completed on 2026-04-06

**Scope**
- Implement structured error/warning event emission
- Implement `errorBehavior` flow:
  - `continue`
  - `stop_iteration`
  - `stop_vu`
  - `abort_test`
- Implement snapshot capture-on-failure

**Dependencies**
- Task 2
- Task 5

**Expected outputs**
- `errors.ndjson` schema working
- `warnings.ndjson` schema working
- snapshot files written when enabled
- errorBehavior enforced by shared runtime

**Delivered so far**
- Added `core-engine/src/reporting/EventArtifactBuilder.ts`
- `errors.ndjson` now contains structured error rows derived from:
  - failed k6 checks grouped by transaction
  - non-zero k6 process exit code
- `warnings.ndjson` now contains structured warning rows derived from:
  - threshold breaches present in `summary.json`
- `ci-summary.json` now reflects derived error/warning counts
- `RunReport.html` Errors and Warnings tabs now receive real artifact data instead of empty placeholders

**Still pending**
- request/response-level runtime event streaming
- snapshot JSON generation on failed requests
- exact `stop_iteration` / `stop_vu` / `abort_test` enforcement inside the shared lifecycle wrapper

## Task 8: Host Monitoring

**Status**
- Baseline completed on 2026-04-06

**Scope**
- Implement CPU/memory sampling
- Emit warning events on threshold breach
- Feed system time-series and system report tab

**Dependencies**
- Task 5

**Expected outputs**
- `HostMonitor.ts` or equivalent created
- system warnings emitted
- system metrics available for reports

**Delivered so far**
- Added `core-engine/src/execution/HostMonitor.ts`
- Local run path now captures host snapshots during execution plus final boundary snapshots when monitoring is enabled
- High CPU / high memory warnings are now emitted into `warnings.ndjson`
- Added `system-metrics.json`
- `RunReport.html` System tab now renders captured host snapshots and agent metadata
- `timeseries.json` system series can now carry CPU/memory points from captured host snapshots

## Task 9: Unified HTML Report

**Status**
- Baseline completed on 2026-04-06

**Scope**
- Build single `RunReport.html`
- Tabs:
  - Summary
  - Graphs
  - Transactions
  - Errors
  - Warnings
  - Snapshots
  - System

**Dependencies**
- Task 5
- Task 6
- Task 7
- Task 8

**Expected outputs**
- unified tabbed HTML report
- JSON/NDJSON-driven rendering
- no split report dependency

**Delivered so far**
- Added `core-engine/src/reporting/RunReportGenerator.ts`
- `RunReport.html` is now generated for local/non-debug load runs
- Current baseline tabs:
  - Summary
  - Graphs
  - Transactions
  - Errors
  - Warnings
  - Snapshots
  - System
- The report is currently driven by persisted JSON artifacts and scaffolded for future interactive time-series work
- Existing `TestDetails.html` / `TestSummary.html` are still generated to avoid breaking current users

## Task 10: Interactive Graphs And Global Time Filter

**Status**
- Baseline completed on 2026-04-06

**Scope**
- Add `timeseries.json` driven graphs
- Add one global time filter
- Add synchronized drill-down behavior across tabs
- Add transaction response-time graph + attached table

**Dependencies**
- Task 5
- Task 6
- Task 8
- Task 9

**Expected outputs**
- `Graphs` tab fully interactive
- global time filter works across report
- top-5/all transaction toggle
- transaction search/filter/multi-select
- attached table recalculates per selected time window

**Delivered so far**
- Added `core-engine/src/reporting/TimeseriesArtifactBuilder.ts`
- `timeseries.json` now contains:
  - overview series
  - per-transaction series
  - event markers from derived errors/warnings
  - system series scaffold
- `RunReport.html` Graphs tab now uses persisted `timeseries.json` data instead of pure placeholders
- Added baseline global time range controls in the report
- Added baseline transaction response-time visualization with:
  - top-5/all toggle
  - transaction filter
  - attached summary table

**Still pending**
- multi-point runtime bucket streaming during execution
- full cross-tab synchronized filtering
- richer interactive charting library integration
- transaction multi-select UX

## Task 11: CI/CD Integration

**Status**
- Baseline completed on 2026-04-06

**Scope**
- Finalize `ci-summary.json`
- Document pipeline consumption model
- Ensure console remains concise while artifacts remain rich

**Dependencies**
- Task 5
- Task 6
- Task 7

**Expected outputs**
- reliable CI gate artifact
- documented pipeline usage
- artifact-first CI model

**Delivered so far**
- `ci-summary.json` is now generated for normal runs
- `run-manifest.json` now lists the machine-readable artifacts
- `HOW_TO_USE_FRAMEWORK.md` now documents the preferred CI/CD artifact consumption model
- framework remains artifact-first for automation and does not require console scraping

## Task 12: Documentation And Templates

**Status**
- Baseline completed on 2026-04-06

**Scope**
- Update framework docs
- Update init/BYOS templates
- Add sample plans/examples for lifecycle/reporting

**Dependencies**
- Task 4
- Task 9
- Task 10
- Task 11

**Expected outputs**
- updated guides and templates
- examples aligned with final architecture

**Delivered so far**
- Updated `core-engine/src/cli/init.ts` sample journey templates to the phase-based script shape
- Updated `core-engine/src/cli/generate-byos.ts` to scaffold phase-based BYOS scripts
- Updated `HOW_TO_USE_FRAMEWORK.md` with:
  - phase-based script examples
  - run artifact overview
  - updated generator/BYOS behavior
  - CI/CD artifact guidance

## Verification Checklist

- Existing CLI commands still work
- Existing non-lifecycle test execution still works
- Existing debug replay still works
- New lifecycle path works
- New reporting artifacts are generated correctly
- Unified HTML report opens and filters correctly
- CI gate can run from `ci-summary.json`
