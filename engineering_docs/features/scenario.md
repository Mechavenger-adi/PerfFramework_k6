---
title: Scenario & Workload Modeling — Mini EDD
layer: L2
owns: scenario
sources: [core_engine/src/scenario/**]
related: [integration-contracts, risk-zones]
updated: 2026-07-09
---

# Scenario & Workload Modeling (Mini-EDD)

**Purpose.** Turn a validated test plan into k6 scenarios + phase metadata, build load/stress/soak/
spike/iteration profiles, validate executor config, and inject the per-VU phase envelope.

**Owning files.** `ScenarioBuilder.ts` (plan → scenarios + `K6_PERF_PHASES`), `WorkloadModels.ts`
(profile builders), `ExecutorFactory.ts` (executor validation/construction), `TestPlanLoader.ts`
(JSON/JSONC → validated `TestPlan`).

**Entry point + condensed runtime flow (§4A).**
1. `ScenarioBuilder.build(...)` composes per-journey scenarios and injects env: `K6_PERF_RUNTIME_METADATA`, `K6_PERF_PHASES`, `K6_PERF_TRANSACTION_NAMES` ([ScenarioBuilder.ts:302-304](../../core_engine/src/scenario/ScenarioBuilder.ts#L302)).
2. `computePhaseEnvelope(profile)` maps each executor to `{mode, startVUs, timeline[]|totalIterations|rate}` — ramping-vus [:323], per-vu-iterations [:341], constant-vus→synthetic ramp-down [:353], shared-iterations [:368], arrival-rate [:377/:389], external [:414] ([ScenarioBuilder.ts:310](../../core_engine/src/scenario/ScenarioBuilder.ts#L310)).
3. Reuses `existingEnv.K6_PERF_PHASES` verbatim if present [:314].

**Key types.** `TestPlan`, `UserJourney`, `GlobalLoadProfile`, `ScenarioPhaseEnvelope`, `SLADefinition`.

**Configuration + env influence.** Test plan `executor`, `stages`, `duration`, `vus`, `iterations`,
`rate`, `preAllocatedVUs`, `maxVUs` → envelope; produces the env the k6-side lifecycle consumes.

**Extension points.** New workload profile in `WorkloadModels.ts`; new executor in `computePhaseEnvelope`.

**Known limitations.** `constant-vus` faked as ramping to gain an endPhase window; `unsupported` mode for
executors without a predictable curve.

**Risks.** RZ4 (envelope↔lifecycle format sync — `endMs` in ms), RZ5 (k6 flag vs JSON).

**Tests to run.** Manual: build each executor type; verify `K6_PERF_PHASES` JSON shape vs [EDD-lifecycle](../edd/EDD-lifecycle.md).

**Related.** [[EDD-lifecycle]], [[integration-contracts]], [[execution]].
