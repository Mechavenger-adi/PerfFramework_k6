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
`startVUs`, `iterations`, `rate`, `startRate`, `timeUnit`, `preAllocatedVUs`, `maxVUs` → envelope;
produces the env the k6-side lifecycle consumes.

**Supported executors = exactly what k6 registers.** k6 v2.0.0 registers **six** executors
(`RegisterExecutorConfigType` in `lib/executor/*.go`). `externally-controlled` was REMOVED upstream —
k6 now fails at load with `unknown executor type`. It is therefore gone from `ExecutorType`,
`EXECUTOR_SPECS`, `EXECUTOR_FIELDS`, the envelope and both schemas; `REMOVED_EXECUTORS` in
`ExecutorFactory` keeps a targeted error so an older plan gets an explanation instead of a bare k6
failure.

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

**`startRate` / `startVUs` — the "starts from zero" assumption is wrong.** Both are the level an
executor holds *before* its first stage ramps, and both have non-obvious k6 defaults:
`startVUs` defaults to **1** (not 0 — `NewRampingVUsConfig`), and `startRate` defaults to 0 so a
ramping-arrival-rate scenario always climbs from nothing unless told otherwise. Omitting `startRate`
on a plan that meant to hold a floor halves the load over the first stage. The envelope mirrors k6's
defaults rather than assuming 0.

**Stage `target` is executor-dependent.** For `ramping-vus` it is a VU count; for
`ramping-arrival-rate` it is an arrival RATE. The envelope keeps them in separate timeline keys
(`vus` vs `rate`) so the two can never be read as each other.

**Duration parsing.** `parseK6DurationToSeconds` (WorkloadModels) mirrors k6's `ParseExtendedDuration`:
`ns/us/µs/ms/s/m/h`, the `d` days extension, compound forms, and a bare number meaning milliseconds.
Multi-character units are matched first — otherwise `500ms` parses as 500 minutes.

**Pre-flight validation.** `ExecutorFactory.validate` mirrors each k6 `Validate()` rule so a bad plan
fails before generation with the field named, rather than inside k6 after the script is built:
required fields per executor, `maxDuration` scope + 1s floor, `duration` 1s floor, stage
presence/shape/non-negativity, ramping-vus' "startVUs or a stage target must be > 0",
`maxVUs >= preAllocatedVUs`, positive `rate`/`timeUnit`/`vus`, non-negative `startRate` (and
`startRate` rejected outside ramping-arrival-rate), and shared-iterations' `iterations >= vus`.

**Extension points.** New workload profile in `WorkloadModels.ts`; new executor in `computePhaseEnvelope`
+ `EXECUTOR_FIELDS` + `EXECUTOR_SPECS` + both schemas.

**Known limitations.** `constant-vus` faked as ramping to gain an endPhase window; `unsupported` mode for
executors without a predictable curve. Sequential/hybrid offsets are an UPPER bound, so a journey that
finishes early leaves the gap idle rather than pulling the next one forward.

**Risks.** RZ4 (envelope↔lifecycle format sync — all times in ms; `vus` vs `rate` not interchangeable),
RZ5 (k6 flag vs JSON).

**Tests to run.** Manual: build each of the six executors with full option coverage, feed the emitted
scenarios to `k6 run` (k6 decodes with `DisallowUnknownFields`, so an unknown or misplaced field fails
the whole run), and verify `K6_PERF_PHASES` JSON shape vs [EDD-lifecycle](../edd/EDD-lifecycle.md).
Every template in `templates/test_plans/` should load, build, and pass k6's decoder.

**Related.** [[EDD-lifecycle]], [[integration-contracts]], [[execution]].
