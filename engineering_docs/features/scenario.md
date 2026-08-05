---
title: Scenario & Workload Modeling — Mini EDD
layer: L2
owns: scenario
sources: [core_engine/src/scenario/**]
related: [integration-contracts, risk-zones]
updated: 2026-08-06
---

# Scenario & Workload Modeling (Mini-EDD)

**Purpose.** Turn a validated test plan into k6 scenarios + phase metadata, build load/stress/soak/
spike/iteration profiles, validate executor config, and inject the per-VU phase envelope.

**Owning files.** `ScenarioBuilder.ts` (plan → scenarios + `K6_PERF_PHASES`), `WorkloadModels.ts`
(profile builders), `ExecutorFactory.ts` (executor validation/construction), `TestPlanLoader.ts`
(JSON/JSONC → validated `TestPlan`).

**Entry point + condensed runtime flow (§4A).**
1. `ScenarioBuilder.build(...)` composes per-journey scenarios and injects env: `K6_PERF_RUNTIME_METADATA`, `K6_PERF_PHASES`, `K6_PERF_TRANSACTION_NAMES` ([ScenarioBuilder.ts:302-304](../../core_engine/src/scenario/ScenarioBuilder.ts#L302)).
2. `computePhaseEnvelope(profile)` maps each executor to `{mode, startVUs, timeline[]|totalIterations|maxDurationMs|rate}` — ramping-vus, per-vu-iterations, constant-vus→synthetic ramp-down, shared-iterations, arrival-rate, external ([ScenarioBuilder.ts:310](../../core_engine/src/scenario/ScenarioBuilder.ts#L310)).
3. Reuses `existingEnv.K6_PERF_PHASES` verbatim if present.

**Key types.** `TestPlan`, `UserJourney`, `GlobalLoadProfile`, `ScenarioPhaseEnvelope`, `SLADefinition`.

**Configuration + env influence.** Test plan `executor`, `stages`, `duration`, `maxDuration`, `vus`,
`iterations`, `rate`, `preAllocatedVUs`, `maxVUs` → envelope; produces the env the k6-side lifecycle
consumes.

**Per-executor k6 field emission.** `EXECUTOR_FIELDS` ([WorkloadModels.ts](../../core_engine/src/scenario/WorkloadModels.ts))
is the single source of truth for which fields reach k6, because k6 decodes scenarios with
`DisallowUnknownFields` — any extra field fails the whole run. Fields absent from an executor's list
are dropped silently, so adding a plan field means adding it here too.

**`maxDuration` (iteration executors).** `shared-iterations` and `per-vu-iterations` are bounded by
BOTH the iteration count and k6's `maxDuration`; k6 defaults it to **10 minutes** and truncates the
pool there whether or not the plan mentions it. The framework therefore always resolves a
`maxDurationMs` into the envelope (`resolveMaxDurationMs`: plan value, else `DEFAULT_MAX_DURATION_MS`)
so the lifecycle can run `endPhase` before the cut, and `estimateTotalDurationSeconds` uses it as the
upper bound for sequential/hybrid `startTime` offsets instead of the generic 300s fallback.
`ExecutorFactory.validate` rejects `maxDuration` on non-iteration executors and values under k6's
1s `minDuration`.

**Duration parsing.** `parseK6DurationToSeconds` (WorkloadModels) mirrors k6's `ParseExtendedDuration`:
`ns/us/µs/ms/s/m/h`, the `d` days extension, compound forms, and a bare number meaning milliseconds.
Multi-character units are matched first — otherwise `500ms` parses as 500 minutes.

**Extension points.** New workload profile in `WorkloadModels.ts`; new executor in `computePhaseEnvelope`
+ `EXECUTOR_FIELDS` + `EXECUTOR_SPECS`.

**Known limitations.** `constant-vus` faked as ramping to gain an endPhase window; `unsupported` mode for
executors without a predictable curve. `ExecutorFactory` does not yet enforce k6's `iterations >= vus`
rule for `shared-iterations` (k6 catches it at startup). `externally-controlled` is missing from the
executor enum in `config/schemas/test_plan.schema.json` (present in the `SchemaValidator` inline
fallback, but the external file wins), so such plans fail schema validation.

**Risks.** RZ4 (envelope↔lifecycle format sync — `endMs` in ms), RZ5 (k6 flag vs JSON).

**Tests to run.** Manual: build each executor type; verify `K6_PERF_PHASES` JSON shape vs [EDD-lifecycle](../edd/EDD-lifecycle.md).

**Related.** [[EDD-lifecycle]], [[integration-contracts]], [[execution]].
