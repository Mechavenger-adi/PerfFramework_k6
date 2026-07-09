---
title: k6 Process Execution — Mini EDD
layer: L2
owns: execution
sources: [core_engine/src/execution/**]
related: [orchestration-map, risk-zones, fragile-areas]
updated: 2026-07-09
---

# k6 Process Execution (Mini-EDD)

**Purpose.** Spawn and supervise the k6 process, assemble k6Options (scenarios + thresholds +
summaryTrendStats), distribute VUs across journeys, sample host CPU/mem, and consume runner-side
`writeData()` output.

**Owning files.** `PipelineRunner.ts` (spawn), `ParallelExecutionManager.ts` (k6Options assembly),
`JourneyAllocator.ts` (weight-based VU split), `HostMonitor.ts` (CPU/mem sampling), `FileWriteSink.ts`
(writeData consumer).

**Entry point + condensed runtime flow (§4A).**
1. `PipelineRunner.run(options)` → `execute()` (sync) or `executeAsync()` (async) ([PipelineRunner.ts:59](../../core_engine/src/execution/PipelineRunner.ts#L59), [:69](../../core_engine/src/execution/PipelineRunner.ts#L69), [:175](../../core_engine/src/execution/PipelineRunner.ts#L175)).
2. Builds k6 CLI args, `childProcess.spawnSync('k6', …)` (sync, [:130](../../core_engine/src/execution/PipelineRunner.ts#L130)/[:144](../../core_engine/src/execution/PipelineRunner.ts#L144)) or `spawn` (async, [:236](../../core_engine/src/execution/PipelineRunner.ts#L236)).
3. `ensureSuccess(result)` gates on exit code ([:324](../../core_engine/src/execution/PipelineRunner.ts#L324)); `printCapturedOutput` for captured mode ([:310](../../core_engine/src/execution/PipelineRunner.ts#L310)).

**Key types.** `RunOptions`, `PipelineRunResult`.

**Configuration + env influence.** k6Options (`scenarios`, `thresholds`, `noCookiesReset`); env map
injected per journey (`K6_PERF_*`); `summaryTrendStats` MUST be a CLI flag not JSON (RZ5/F6).

**Extension points.** `extraK6Args` passthrough; new k6 output sinks via `--out`.

**Known limitations.** Not all k6 options behave the same via JSON vs CLI flags (RZ5). Entry-script
location determines relative data-file resolution (RZ2/F8).

**Risks.** RZ2, RZ5, F6 (summaryTrendStats), F8 (entry-script path).

**Tests to run.** Manual: `npm run loadtest`; multi-journey weight split; `writeData` file output.

**Related.** [[orchestration-map]], [[EDD-lifecycle]], [[EDD-reporting]].
