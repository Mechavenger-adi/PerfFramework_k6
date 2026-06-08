# Lifecycle Redesign — Design Proposal

> **AI fast-path:** metadata is lines 1–10; the proposal body starts at **line 11** (`## 1. Problem & Objective`). Jump straight there.

**Status:** Proposal (not yet implemented) — except §9 graceful passthrough, which is **implemented**. · **Date:** 2026-06-05
**Scope:** Per-VU lifecycle end-detection (`initPhase` / `actionPhase` / `endPhase`) across every k6 executor.
**Primary files:** `core_engine/src/utils/lifecycle.ts`, `core_engine/src/scenario/ScenarioBuilder.ts`, `core_engine/src/scenario/WorkloadModels.ts`, `core_engine/src/types/TestPlanSchema.ts`, `config/schemas/test_plan.schema.json`

---

## 1. Problem & Objective

The framework grafts a LoadRunner-style per-VU lifecycle (`initPhase`/`actionPhase`/`endPhase`) onto k6, whose native grain is the *independent iteration*. Today:

- **Login (`initPhase`) works** — the `state.initialized` guard (`lifecycle.ts:392`) runs it once per VU.
- **Logout (`endPhase`) is unreliable** — it depends on detecting k6's ramp-down via a *reactive* check, `isDecreasing && vuId > target` (`lifecycle.ts:246`), which fires **at or after** k6 has already decided to remove the VU. k6 then simply stops calling `default()`, so the logout iteration never arrives. The post-action re-check (`lifecycle.ts:424-428`) is a timing race that usually loses.

**Root cause:** k6 exposes **no per-VU teardown hook**. VU removal is silent — no event, no callback, no flag. Therefore end-of-life cannot be *reactive*; it must be *VU-driven and proactive*.

**Objective:** A single lifecycle that reliably runs `initPhase` once and `endPhase` once per VU, produces gradual ramp behavior matching k6's configured curve, and does so **without replacing k6's native scheduling** — so no executor that k6 handles well is broken.

## 2. The Governing Insight — two control planes

| Plane | Question it answers | Mechanism |
|---|---|---|
| **Deadline plane** | *When* does this VU begin `endPhase`? | A per-VU end time computed up front, fired a **margin before** k6's removal, so the VU is still scheduled when logout runs. |
| **Graceful plane** | Does the logout have room to *finish*? | `gracefulRampDown` (mid-test ramp-down) + `gracefulStop` (test end), wired through to k6 (§9). |

Today's code has neither: trigger is reactive, and `gracefulRampDown`/`gracefulStop` were never forwarded. The redesign supplies both.

**Why proactive works:** if a VU runs `endPhase` *before* k6 flags it for removal, the VU is still active, so k6 still calls `default()` for it → `endPhase` executes → the VU then parks (`sleep(long)`) → k6 later reclaims the idle VU harmlessly. The graceful plane is the safety net for the rare case where the logout iteration overlaps k6's removal window.

## 3. Architecture — thin shell + per-family strategy

```
runJourneyLifecycle(store, phaseFns)        // executor-agnostic shell
   └─ delegates to a LifecycleStrategy       // chosen by executor family
```

The **shell** owns (identical for all executors): the init-once guard, end-once guard, error-behavior enforcement (`continue`/`stop_iteration`/`stop_vu`/`abort_test`), and parking. The **strategy** owns two decisions: the *iteration model* and the *end condition*.

```ts
interface VuIdentity { idInInstance: number; iterationInScenario: number; }

interface EndPlan {
  deadlineMs?: number;        // absolute wall-clock; undefined = not time-driven
  lastIteration?: number;     // count-based exit
  endDisabled?: boolean;      // arrival-rate: no per-VU end
}

interface LifecycleStrategy {
  /** Called once per VU on its first iteration. Precomputes the end plan. */
  plan(phases: PhaseMetadata, vu: VuIdentity, scenarioStartMs: number): EndPlan;
  /** Cheap, called at iteration boundaries AND inside long actions via isEnding(). */
  isEndDue(plan: EndPlan, now: number, vu: VuIdentity): boolean;
}
```

## 4. Strategy A — `RampingDeadlineStrategy` (the ramping-VUs family)

Covers **load, soak/endurance, stress, step-up, step-down, spike, multi-spike** — every shape that reduces to a piecewise-linear VU curve.

### 4.1 The terminal-crossing deadline (fully general)

The whole VU curve is known at script init (from `K6_PERF_PHASES`: `startVUs` + `timeline[{endMs, vus}]`). For a VU of id `v`:

> **`deadline(v)` = the last instant the curve is at/above the threshold `(v − 0.5)`** — i.e. `sup{ t : target(t) ≥ v − 0.5 }`. After that moment the curve stays strictly below `v` for the rest of the test, so the VU is never needed again and logs out.

- The `−0.5` half-step makes it fire **just before** k6's integer removal → the VU is still scheduled when `endPhase` runs.
- `deadline` is **absolute wall-clock** (`scenarioStartMs + tMs`), so VUs that start late during ramp-up are handled automatically — no per-VU start-time bookkeeping needed.

**Why "last permanent crossing" beats today's single `isFinalRampDown`:** because we have the entire curve up front, we can look ahead and rescue intermediate descents correctly:

| Shape | Behavior |
|---|---|
| Load / soak / stress (→0) | Every VU logs out gradually across the final descent. ✅ |
| Step-down (100→50→0) | VUs 51–100 log out on the 100→50 slope; 1–50 on the 50→0 slope. *All* log out. ✅ |
| Spike (10→50→10) | A VU id 30 logs out on the spike's down-slope (curve stays <30 after) — reliable, correctly timed. ✅ |
| Multi-spike | A VU only ends at the dip after which it is **never** exceeded again; look-ahead prevents premature logout of VUs k6 will reuse. ✅ |
| Ends above 0 (no →0 stage) | Low-id survivors have no terminal crossing → `deadline = scenario end` → logout under `gracefulStop`. ✅ |

### 4.2 Iteration model & long actions

Keep k6-native short iterations. Expose `isEnding()` to scripts so **long action loops bail out near the deadline** (critical for sessions whose action is itself a long loop, e.g. a ~40s search):

```js
group("search members", () => {
  while (!isEnding()) {                 // framework: true once this VU's deadline passes
    transaction("search", () => { ... });
    thinktime();
  }
});
// shell runs endPhase automatically after the action returns
```

`isEnding()` is a zero-cost timestamp compare against the precomputed `EndPlan`. Without it, a VU that starts a 40s action 5s before its deadline would overrun and miss removal.

## 5. Strategy B — `IterationCountStrategy` (`per-vu-iterations`, `shared-iterations`)

No ramp-down curve; **already reliable — keep it.** The VU knows its assigned iteration budget and runs `endPhase` deterministically on its last iteration — no scheduler race, because the VU's own loop completes (k6 isn't yanking it). Formalize today's logic (`lifecycle.ts:208-235`). For `shared-iterations`, a VU that draws zero work ends **before** its first action.

## 6. Strategy C — `ArrivalRateStrategy` (`constant-arrival-rate`, `ramping-arrival-rate`)

**Open model — `actionPhase` only. `initPhase` and `endPhase` are disabled.**

### 6.1 Why per-VU end cannot work here (the deciding reason: VU dormancy)

In arrival-rate, k6 starts iterations *at a rate* and pulls VUs from a pool. A VU is a **pooled worker, not a user**; an idle pooled VU **executes no code** — no loop, no timer — so it can never observe a time condition. At end-of-test (especially with a ramped-down rate) most of the pool is dormant.

*Worked example* (`config/test_plans/templates/ramping_arrival_rate.json` style): `preAllocatedVUs: 50`, final stage ramps to `60/min = 1 iter/s`, each iteration ~0.2s ⇒ **~1 VU busy, ~49 dormant** in the final window. A time-based `endPhase` would fire for ~1 of 50 VUs — and not a predictable one. Secondary blockers: a VU can't know which iteration is its last (no budget), and ending early to be safe makes VUs peel off → the arrival rate sags, corrupting the measured throughput.

### 6.2 Decision

- **`actionPhase`** runs per iteration (= native k6 open-model behavior).
- **`initPhase` / `endPhase` disabled.** True once-only setup/cleanup belongs in k6's global `setup()` / `teardown()` (exposing these to journey scripts is a separate, worthwhile gap).
- **UX:** at script generation/conversion (`generate`, `convert`, `LifecyclePrompt`), when the executor is arrival-rate, prompt the author to place all logic in `actionPhase` and scaffold action-only.
- **Runtime notice:** on the first iteration, if `phases.mode` is `constant-arrival-rate`/`ramping-arrival-rate` and an `initPhase` or `endPhase` is defined, print once:
  `[k6-perf][lifecycle] Arrival-rate executor — init/end phases are disabled; all logic runs in actionPhase per iteration.`
- **Guidance:** journeys needing real per-VU login→…→logout sessions should use a VU-based executor (`ramping-vus`), which models a closed user population. Arrival-rate models open-world throughput.

## 7. Strategy D — `BestEffortHeartbeatStrategy` (`externally-controlled`)

VU count changes via runtime REST API — **no precomputable curve.** Top-of-iteration check: "is the current active target below my id?" → end. Inherently best-effort (the one genuinely unsolvable case), with `gracefulStop` as the net. Documented as such; not in the JSON-schema executor enum today.

## 8. constant-vus — drop the synthetic ramp-down

**Accuracy note:** today's constant-vus trick (`ScenarioBuilder.ts:337-349`) does **not** change the k6 executor — k6 still runs `constant-vus` natively (hold → hard stop + `gracefulStop`). It only rewrites the **internal `K6_PERF_PHASES` envelope** to a synthetic `[hold, →0 over 5s]` so the *VU-side* detector has a descent to anchor on. Because k6 keeps all VUs alive in constant-vus, every VU does get a `default()` call in that last 5s, so it partly works — but it has three downsides: (1) VUs stop doing actions ~5s early (load shave), (2) all VUs log out in the same 5s (stampede), (3) 5s may be too short for slow logouts.

**Redesign:** keep constant-vus native and use a **time deadline**, not a fake curve:
- `deadline = durationMs − margin`, with `gracefulStop` sized above logout duration.
- Optional **logout stagger that does not touch load**: `deadline(v) = durationMs − margin − (v / totalVUs) · spreadWindow`. VUs deliver full load to the end, then log out spread across a few seconds.

**Principle:** *time-based* executors (`constant-vus`, and the time-end of arrival-rate) end via a **time deadline + `gracefulStop`**; only genuine *ramping* shapes use the curve-crossing deadline (§4). **No synthetic ramp-downs anywhere** — they misrepresent intent and conflate *logout pacing* with *load profile*, which must stay decoupled.

## 9. Graceful plane — `gracefulRampDown` / `gracefulStop` passthrough (IMPLEMENTED)

These are **scenario-object options**, not k6 CLI flags, so they can only reach k6 via the `--config` options object built by `toK6ExecutorConfig`. They were previously dropped by that allow-list. Now wired through:

- `core_engine/src/types/TestPlanSchema.ts` — added `gracefulRampDown?`, `gracefulStop?` to `GlobalLoadProfile`.
- `core_engine/src/scenario/WorkloadModels.ts` — added to `K6ExecutorConfig` and copied in `toK6ExecutorConfig`.
- `core_engine/src/scenario/ScenarioBuilder.ts` — added to `K6ScenarioDefinition` (flows in via `...executorConfig`).
- `config/schemas/test_plan.schema.json` — added both to `global_load_profile.properties` so AJV validation accepts them.

Usage in a test plan:
```jsonc
"global_load_profile": {
  "executor": "ramping-vus",
  "stages": [ { "duration": "1m", "target": 100 }, { "duration": "5m", "target": 100 }, { "duration": "2m", "target": 0 } ],
  "gracefulRampDown": "1m",   // room for in-flight logout during ramp-down
  "gracefulStop": "45s"        // room for in-flight logout at test end
}
```
Unset fields stay `undefined` and are omitted by `JSON.stringify`, so k6 keeps its 30s defaults — zero behavior change unless set.

**Future escape hatch (not in this change):** a generic `rawExecutorOptions?: Record<string, unknown>` spread last in `toK6ExecutorConfig` would forward *any* scenario-level k6 option verbatim, closing the options-object gap permanently.

## 10. Unified shell control flow (pseudocode)

```
runJourneyLifecycle(store, phaseFns):
  strategy = selectStrategy(phases.mode)

  if parked/ended/terminated → sleep(long); return        // reclaimed VUs cost nothing

  if !initialized:
     if !strategy.initDisabled: runSafely(initPhase)
     else if initPhase defined: printArrivalRateNoticeOnce()
     initialized = true
     store.plan = strategy.plan(phases, vu, scenarioStart)  // precompute EndPlan once

  // (1) boundary check — catches VUs whose deadline passed between iterations
  if !strategy.endDisabled and strategy.isEndDue(plan, now(), vu):
     runSafely(endPhase); ended = true; return

  runSafely(actionPhase)      // long loops bail via isEnding(); transactions emit per action
  apply pacing if configured

  // (2) post-action check — catches VUs that crossed DURING the action
  if !strategy.endDisabled and strategy.isEndDue(plan, now(), vu):
     runSafely(endPhase); ended = true
```

Because the deadline fires a margin **before** k6's removal, at least one of checks (1)/(2) runs while the VU is still scheduled → `endPhase` always executes → VU parks → k6 reclaims it later. The graceful plane guarantees that final `endPhase` iteration finishes.

## 11. Strategy selection

| Executor | Strategy | End trigger | Reliability |
|---|---|---|---|
| ramping-vus, load/soak/stress/step/spike | A · Ramping deadline | terminal-crossing time − margin | ✅ reliable + gradual |
| constant-vus | A (time variant) | `duration − margin` (+ optional stagger) | ✅ reliable; no synthetic ramp |
| per-vu-iterations, shared-iterations | B · Count | last assigned iteration | ✅ deterministic |
| constant/ramping-arrival-rate | C · Arrival-rate | none (action-only) | ✅ correct by model; init/end disabled |
| externally-controlled | D · Heartbeat | reactive target check | ⚠️ best-effort (k6-structural) |

## 12. Metrics & semantics preservation

k6's native iteration model is untouched (no single-giant-iteration), so `iteration_duration`, `http_req_*`, VU recycling, progress/ETA, thresholds, and distributed execution all behave normally. `framework_iterations` (`lifecycle.ts:76`) and transaction metrics are unaffected — still emitted per action inside the loop. This is the central anti-risk property: **the redesign changes only the end *trigger*, not k6's execution.**

## 13. Honest residual limits (k6-structural, not solvable by design)

- **externally-controlled**: curve unknown → best-effort only.
- **arrival-rate**: no per-VU session/logout by design (dormancy, §6.1).
- **Curve-crossing margin**: assumes our interpolation matches k6's internal VU rounding closely; "reliable with a safety margin," **not provably perfect** in every rounding corner — `gracefulRampDown` is the net.
- **Clock/identity**: use `Date.now() − exec.scenario.startTime`; key identity off `exec.vu.idInInstance`; document the distributed/cloud case (`idInTest`).
- **Complexity cost**: four strategies add maintenance surface vs. today's single (broken) detector — accepted because the families are genuinely different load models.

## 14. Implementation plan / rollout

1. **Done now:** §9 graceful passthrough (type + mapper + scenario def + schema).
2. Enrich the phase envelope only if needed (the inverse deadline is computable from existing `startVUs`+`timeline`; optionally precompute derived fields in `ScenarioBuilder.computePhaseEnvelope`).
3. Introduce `LifecycleStrategy` + `selectStrategy` in `lifecycle.ts`; refactor `runJourneyLifecycle` into the shell (§10). Keep `getTransactionGate` fed from the strategy.
4. Implement Strategy A (terminal-crossing deadline + `isEnding()`), then constant-vus time variant, then B, C (with prompt + runtime notice), D.
5. Gate behind a runtime flag (e.g. `K6_PERF_LIFECYCLE_V2`) for A/B comparison against current behavior; flip default once validated on load/soak/spike/step plans.
6. Expose k6 `setup()`/`teardown()` to journey scripts (separate enhancement) so arrival-rate has a home for once-only logic.

## 15. Change log vs. current framework

- End trigger: reactive `vuId > target` (at/after removal) → proactive terminal-crossing deadline (before removal).
- Ramp-down logout: best-effort race → reliable + gradual across the curve.
- constant-vus: synthetic 5s ramp-down envelope → native + time deadline + `gracefulStop`.
- Arrival-rate: ambiguous per-VU phases → action-only, init/end disabled, prompted + announced.
- Graceful windows: silently dropped → forwarded to k6 (§9).
