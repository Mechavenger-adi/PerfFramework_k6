# VU Lifecycle Implementation Plan

## Objective

Replicate LoadRunner's `vuser_init` / `Action` / `vuser_end` pattern in k6 scripts, giving each VU a **per-VU exit time** calculated from the test plan's stage schedule.

---

## Design Summary

### Problem

k6's `export default function()` repeats every iteration for every VU. There is no native per-VU init/end lifecycle. When `ramping-vus` ramps down, k6 silently stops calling `default()` for removed VUs — no cleanup hook.

### Solution

The framework:
1. Analyzes the `stages` array from the test plan
2. Builds a **timeline** of cumulative stage boundaries with VU counts
3. Injects this timeline into the k6 script via `K6_PERF_PHASES` env var
4. Each VU calculates its own exit time from the timeline using its `exec.vu.idInInstance`
5. k6 uses LIFO order for VU removal (highest ID removed first), making exit times deterministic

### Lifecycle Phases

| Phase | Trigger | Runs |
|-------|---------|------|
| `Action_Init` | `exec.vu.iterationInScenario === 0` | Once per VU on first iteration |
| `Action` | `elapsed < vuExitTime` | Every iteration during steady state |
| `Action_End` | `elapsed >= vuExitTime` | Once per VU, then VU idles until k6 removes it |

> **No buffer needed.** k6 always finishes the current `default()` call before removing a VU. If the VU's iteration is running when exit time arrives, the `elapsed` check at the top of that (or the next) call will trigger Action_End naturally.

### Per-VU Exit Time Calculation

k6 linearly interpolates VU count between stages. During any ramp-down segment:

```
activeVUs(t) = prevVUs - (prevVUs - targetVUs) × (t - segmentStart) / segmentDuration
```

A VU with ID `vuId` is removed when `activeVUs(t) < vuId`:

```
exitTime = segmentStart + segmentDuration × (1 - vuId / prevVUs)
```

**Example** — `stages: [2m→10, 5m→10, 2m→0]`:

| VU ID | Calculated Exit = Action_End Trigger |
|-------|--------------------------------------|
| 10 | 420s |
| 9 | 432s |
| 5 | 480s |
| 1 | 528s |

VU 10 (last spawned) logs out first. VU 1 (first spawned) logs out last.

---

## Test Plan Config Changes

### New `lifecycle` property on `UserJourney`

```json
{
  "user_journeys": [
    {
      "name": "buy_animal",
      "scriptPath": "buyanimal_raw.js",
      "lifecycle": {
        "init": ["t01_launch", "t02_login"],
        "end": ["logout"]
      }
    }
  ]
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `init` | `string[]` | `[]` | Transaction group names to run once on VU start |
| `end` | `string[]` | `[]` | Transaction group names to run once before VU exit |

Any transaction group **not** listed in `init` or `end` is automatically **Action** (repeats every iteration).

If `lifecycle` is omitted, all transactions run every iteration (current behavior — fully backward compatible).

---

## Injected `K6_PERF_PHASES` Env Var

Computed by `ScenarioBuilder` and injected into the k6 scenario's `env` block:

```json
{
  "timeline": [
    { "endMs": 120000, "vus": 10 },
    { "endMs": 420000, "vus": 10 },
    { "endMs": 540000, "vus": 0 }
  ],
  "peakVUs": 10,
  "totalIterations": 0
}
```

| Field | Description |
|-------|-------------|
| `timeline` | Array of cumulative stage endpoints with target VU count at each |
| `peakVUs` | Highest VU count across all stages |
| `totalIterations` | Non-zero for `per-vu-iterations` executor (enables exact last-iteration detection) |

---

## Generated Script Structure

### With lifecycle enabled

```javascript
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import exec from 'k6/execution';
import { initTransactions, startTransaction, endTransaction } from '../../../core-engine/src/utils/transaction.js';
import { logExchange } from '../../../core-engine/src/utils/replayLogger.js';

const __PHASES = JSON.parse(__ENV.K6_PERF_PHASES || '{}');
let _lastEndMs = 0;

initTransactions([
  "t01_launch", "t02_login",
  "search_animal", "select_product", "add_to_cart",
  "increase_quantity", "click_continue", "click_confirm",
  "logout"
]);

export default function () {
  const vuId = exec.vu.idInInstance;
  const elapsed = Date.now() - exec.scenario.startTime;

  // ── Action_Init: once per VU on first iteration ──
  if (exec.vu.iterationInScenario === 0) {
    group('t01_launch', function () {
      startTransaction('t01_launch');
      // ... requests ...
      endTransaction('t01_launch');
    });
    sleep(1);
    group('t02_login', function () {
      startTransaction('t02_login');
      // ... requests ...
      endTransaction('t02_login');
    });
    sleep(1);
    return;
  }

  // ── Action_End: once per VU when exit time is reached ──
  if (_lastEndMs === 0 && __shouldEnd(vuId, elapsed)) {
    group('logout', function () {
      startTransaction('logout');
      // ... requests ...
      endTransaction('logout');
    });
    _lastEndMs = elapsed;
    return;
  }

  // ── Already ended → idle until k6 removes this VU ──
  if (_lastEndMs > 0) return;

  // ── Action: repeating business flow ──
  group('search_animal', function () {
    startTransaction('search_animal');
    // ... requests ...
    endTransaction('search_animal');
  });
  sleep(1);
  group('select_product', function () { /* ... */ });
  sleep(1);
  group('add_to_cart', function () { /* ... */ });
  sleep(1);
  group('increase_quantity', function () { /* ... */ });
  sleep(1);
  group('click_continue', function () { /* ... */ });
  sleep(1);
  group('click_confirm', function () { /* ... */ });
  sleep(1);
}

// ── Lifecycle helpers (injected by framework) ──

function __shouldEnd(vuId, elapsedMs) {
  if (__PHASES.totalIterations > 0) {
    return exec.vu.iterationInScenario >= __PHASES.totalIterations - 1;
  }
  const timeline = __PHASES.timeline;
  if (!timeline || timeline.length === 0) return false;
  const exitMs = __calcVUExitTime(vuId, timeline);
  return elapsedMs >= exitMs;
}

function __calcVUExitTime(vuId, timeline) {
  let prevVUs = 0;
  let prevEndMs = 0;
  for (const stage of timeline) {
    if (stage.vus < prevVUs && vuId > stage.vus) {
      const segDur = stage.endMs - prevEndMs;
      const ratio = 1 - (vuId / prevVUs);
      return prevEndMs + (segDur * ratio);
    }
    prevVUs = stage.vus;
    prevEndMs = stage.endMs;
  }
  return timeline[timeline.length - 1].endMs;
}
```

### Without lifecycle (backward compatible — no changes)

```javascript
export default function () {
  group('t01_launch', function () { /* ... */ });
  sleep(1);
  group('t02_login', function () { /* ... */ });
  sleep(1);
  // ... all groups run every iteration ...
  group('logout', function () { /* ... */ });
}
```

---

## Executor Support Matrix

| Executor | Init | Action | End | How End is detected |
|----------|------|--------|-----|---------------------|
| `ramping-vus` | `iterationInScenario === 0` | Loop while `elapsed < exitTime` | `elapsed >= exitTime` | Per-VU exit time from timeline (deterministic) |
| `constant-vus` | Same | Loop until 95% of duration | `elapsed >= duration × 0.95` | Heuristic — no ramp-down segment exists |
| `per-vu-iterations` | Same | Iterations 1 to N-2 | `iterationInScenario === N - 1` | Exact — `totalIterations` injected |
| `shared-iterations` | Same | Loop while `progress < 0.95` | `exec.scenario.progress >= 0.95` | Heuristic — iteration distribution non-deterministic per VU |

---

## Spike Test Example

### Config

```json
{
  "global_load_profile": {
    "executor": "ramping-vus",
    "startVUs": 0,
    "stages": [
      { "duration": "30s",  "target": 10 },
      { "duration": "10s",  "target": 100 },
      { "duration": "1m",   "target": 100 },
      { "duration": "10s",  "target": 10 },
      { "duration": "1m",   "target": 10 },
      { "duration": "30s",  "target": 0 }
    ]
  },
  "user_journeys": [{
    "name": "buy_animal",
    "scriptPath": "buyanimal_raw.js",
    "lifecycle": {
      "init": ["t01_launch", "t02_login"],
      "end": ["logout"]
    }
  }]
}
```

### Injected timeline

```json
{
  "timeline": [
    { "endMs": 30000,  "vus": 10 },
    { "endMs": 40000,  "vus": 100 },
    { "endMs": 100000, "vus": 100 },
    { "endMs": 110000, "vus": 10 },
    { "endMs": 170000, "vus": 10 },
    { "endMs": 200000, "vus": 0 }
  ],
  "peakVUs": 100,
  "totalIterations": 0
}
```

### VU exit schedule

**Spike VUs (IDs 11-100) — exit during 100→110s segment:**

| VU ID | Calculated Exit = Action_End Trigger |
|-------|--------------------------------------|
| 100 | 100.0s |
| 75 | 102.5s |
| 50 | 105.0s |
| 25 | 107.5s |
| 11 | 108.9s |

**Baseline VUs (IDs 1-10) — exit during 170→200s segment:**

| VU ID | Calculated Exit = Action_End Trigger |
|-------|--------------------------------------|
| 10 | 170.0s |
| 5 | 185.0s |
| 1 | 197.0s |

### Visual timeline

```
VUs
100│          ┌──────────────┐
   │         ╱│              │╲
   │        ╱ │              │ ╲
   │       ╱  │  100 VUs     │  ╲
   │      ╱   │  Action      │   ╲
   │     ╱    │  loop        │    ╲
 10│────╱     │              │     ╲──────────────────╲
   │   ╱      │              │     │  10 VUs Action    ╲
   │  ╱ Init  │              │ End │  loop          End ╲
  0│─╱────────┴──────────────┴─────┴──────────────────────
   0   30  40              100 110                170  200s
       ↑                    ↑                      ↑
       All VUs run          VU 100 End at 100s     VU 10 End at 170s
       Action_Init          VU 11 End at 108.9s    VU 1 End at 197s
       on 1st iter
```

---

## Implementation Steps

### Step 1: TestPlanSchema.ts — Add lifecycle types

- Add `LifecycleConfig` interface: `{ init?: string[]; end?: string[] }`
- Add `lifecycle?: LifecycleConfig` to `UserJourney` interface

### Step 2: SchemaValidator.ts — Validate lifecycle config

- Validate `lifecycle.init` and `lifecycle.end` are arrays of strings
- (No bufferMs validation needed — removed from design)
- (Script-level validation that group names exist happens in GatekeeperValidator)

### Step 3: GatekeeperValidator.ts — Cross-validation

- If lifecycle defined with `per-vu-iterations` executor, validate iterations >= 3 (need at least: 1 init + 1 action + 1 end)
- Warn if `lifecycle.init` and `lifecycle.end` have overlapping group names

### Step 4: ScenarioBuilder.ts — Compute phases and inject env

- New static method: `computePhases(profile: GlobalLoadProfile, lifecycle: LifecycleConfig): PhasesConfig`
  - Parses stages into `timeline[]` array
  - Determines `peakVUs` from max stage target
  - Sets `totalIterations` from profile for iteration-based executors
- Inject `K6_PERF_PHASES` as JSON string in scenario's `env` block
- Handle `constant-vus`: synthesize a single-segment timeline `[{ endMs: durationMs, vus: 0 }]` with `prevVUs = vus`

### Step 5: ScriptGenerator.ts — Generate lifecycle-aware scripts

- When `lifecycle` is present on the journey config:
  - Add `import exec from 'k6/execution';` to imports
  - Add `const __PHASES = JSON.parse(__ENV.K6_PERF_PHASES || '{}');` at module scope
  - Add `let _lastEndMs = 0;` at module scope (tracks End execution per VU — supports multi-spike reactivation)
  - Wrap `init` groups in `if (exec.vu.iterationInScenario === 0) { ... return; }`
  - Wrap `end` groups in `if (_lastEndMs === 0 && __shouldEnd(...)) { ... _lastEndMs = elapsed; return; }`
  - Add idle guard: `if (_lastEndMs > 0) return;`
  - Append `__shouldEnd()` and `__calcVUExitTime()` helper functions
- When `lifecycle` is absent: generate current format (no changes)

### Step 6: ScriptConverter.ts — Same lifecycle wrapping for converted scripts

- Accept optional `lifecycle` config parameter
- Apply same wrapping logic as ScriptGenerator when lifecycle is provided
- This enables converting existing scripts to lifecycle-aware format

### Step 7: Debug mode — No lifecycle in debug

- `ReplayRunner` always uses 1 VU, 1 iteration — lifecycle splitting is meaningless
- If lifecycle is defined, debug mode ignores it and runs all groups sequentially (current behavior)
- No changes needed to ReplayRunner

### Step 8: Update sample test plans

- Add lifecycle example to `config/test-plans/load-test.json`
- Optionally create a `config/test-plans/spike-test.json` example

---

## Detailed Walkthrough — Spike Scenario

### Stages

```json
"stages": [
  { "duration": "10s",  "target": 10 },
  { "duration": "15s",  "target": 10 },
  { "duration": "10s",  "target": 100 },
  { "duration": "10s",  "target": 10 },
  { "duration": "10s",  "target": 10 },
  { "duration": "30s",  "target": 0 }
]
```

### Cumulative Timeline

```
0s──10s──25s──35s──45s──55s──85s
│    │    │     │    │    │    │
0→10 │10  │10→100│100→10│10 │10→0
     steady spike spike  steady final
            up   down          ramp-down
```

### Injected Timeline

```json
{
  "timeline": [
    { "endMs": 10000,  "vus": 10 },
    { "endMs": 25000,  "vus": 10 },
    { "endMs": 35000,  "vus": 100 },
    { "endMs": 45000,  "vus": 10 },
    { "endMs": 55000,  "vus": 10 },
    { "endMs": 85000,  "vus": 0 }
  ],
  "peakVUs": 100,
  "totalIterations": 0
}
```

### Exit Time Math

**Spike VUs (IDs 11-100) — ramp-down segment 35→45s (100→10):**

```
exitTime = 35000 + 10000 × (1 - vuId / 100)
```

| VU ID | Exit Time | Behavior |
|-------|-----------|----------|
| 100 | 35.0s | Exits first — barely 1 Action iteration after Init |
| 75 | 37.5s | |
| 50 | 40.0s | |
| 25 | 42.5s | |
| 11 | 43.9s | Last spike VU to exit |

**Baseline VUs (IDs 1-10) — ramp-down segment 55→85s (10→0):**

```
exitTime = 55000 + 30000 × (1 - vuId / 10)
```

| VU ID | Exit Time | Behavior |
|-------|-----------|----------|
| 10 | 55.0s | Exits first of baseline group |
| 5 | 70.0s | |
| 1 | 82.0s | Last VU in the entire test to logout |

### Per-VU Trace

```
VU 1 (baseline):
  ~0s    → Action_Init (login) — iterationInScenario === 0
  ~1s    → Action, Action, Action... (repeating for ~81s)
  82.0s  → elapsed >= 82000 → Action_End (logout) → idle
  85.0s  → k6 removes VU 1

VU 10 (baseline):
  ~9s    → Action_Init (login)
  ~10s   → Action, Action, Action... (repeating for ~45s)
  55.0s  → elapsed >= 55000 → Action_End (logout) → idle
  ~56s   → k6 removes VU 10

VU 100 (spike — last spawned, first removed):
  ~34s   → Action_Init (login)
  ~35s   → elapsed >= 35000 → Action_End (logout) → idle
  35.0s  → k6 removes VU 100

VU 50 (spike):
  ~30s   → Action_Init (login)
  ~31s   → Action, Action... (~9s of action)
  40.0s  → elapsed >= 40000 → Action_End (logout) → idle
  ~40s   → k6 removes VU 50

VU 11 (spike — first spawned of spike group, last removed):
  ~25s   → Action_Init (login)
  ~26s   → Action, Action... (~17s of action)
  43.9s  → elapsed >= 43900 → Action_End (logout) → idle
  ~44s   → k6 removes VU 11
```

### Visual

```
VUs
100│              ╱╲
   │             ╱  ╲
   │            ╱    ╲        Spike VUs 11-100:
   │           ╱      ╲       End at 35.0→43.9s
   │          ╱        ╲
 10│────╱────╱──────────╲────────────╲
   │   ╱    │            │            ╲    Baseline VUs 1-10:
   │  ╱Init │  Action     │ Action     ╲   End at 55.0→82.0s
  0│─╱──────┴────────────┴─────────────╲──
   0  10  25   35      45  55         85s
```

---

## Known Limitations (Cons)

### 1. VU Reuse in Multi-Spike Scenarios — CRITICAL

**Problem:** In a double-spike (ramp up → down → up → down), k6 can reactivate stopped VU instances with the same `idInInstance`. Module-scope variables (`_endDone`) persist — those VUs would skip everything on the second spike.

**Fix:** Replace boolean `_endDone` with `_lastEndMs` (timestamp of when End last ran). On each `default()` call, `__shouldEnd()` finds the NEXT ramp-down exit time from the current elapsed time. If the VU is in a new active window (reactivated), it runs Init again and resets the end tracking.

```javascript
let _lastEndMs = 0;  // replaces _endDone boolean

export default function () {
  const elapsed = Date.now() - exec.scenario.startTime;
  const vuId = exec.vu.idInInstance;
  const exitMs = __calcVUExitTime(vuId, __PHASES.timeline, elapsed);

  // Reactivated VU — run Init again
  if (_lastEndMs > 0 && elapsed > _lastEndMs && exitMs > elapsed) {
    _lastEndMs = 0;  // reset for new lifecycle
    // fall through to Init
  }

  // Init: first iteration OR reactivation
  if (exec.vu.iterationInScenario === 0 || _lastEndMs === 0 && ...) {
    // ... init groups ...
    return;
  }

  // End
  if (elapsed >= exitMs) {
    // ... end groups ...
    _lastEndMs = elapsed;
    return;
  }

  // Idle after end
  if (_lastEndMs > 0) return;

  // Action
  // ... action groups ...
}
```

`__calcVUExitTime()` is updated to accept `afterMs` parameter — finds the next ramp-down segment that removes this VU **after** the given timestamp, skipping segments already processed.

### 2. Long Action Iterations May Miss End — MODERATE

**Problem:** If an Action iteration takes longer than the ramp-down window (e.g., 30s of think times, but ramp-down is 10s), the VU is in the middle of `default()` when its exit time arrives. k6 waits for the current call to finish, then stops scheduling. The VU never gets another `default()` call to run the `_shouldEnd()` check.

**Impact:** Action_End never runs for that VU — same behavior as JMeter when a sampler blocks past the thread shutdown signal.

**Mitigation:**
- Not fixable in code — k6 architecture limitation
- Framework can warn at validation time if total `sleep()` in Action groups exceeds the shortest ramp-down segment duration
- Guideline: keep Action iteration duration shorter than the shortest ramp-down stage

### 3. `constant-vus` — No Ramp-Down Segment — MODERATE

**Problem:** `constant-vus` kills all VUs simultaneously when duration expires. No gradual removal → `__calcVUExitTime()` has no ramp-down segment to calculate from.

**Fix:** For `constant-vus`, use `exec.scenario.progress >= 0.95` as the End trigger. This is a heuristic (not per-VU deterministic), but it's the only option for this executor. Recommendation: use `ramping-vus` with an explicit final `{ duration: "30s", target: 0 }` stage if guaranteed per-VU End is needed.

### 4. k6 LIFO Order Not Contractually Guaranteed — LOW

**Problem:** k6 removes VUs in LIFO order (highest `idInInstance` first). This is consistent observable behavior but not a documented contract. A future k6 version could change it.

**Impact:** If k6 changes to FIFO or random removal, exit time calculations would be wrong. Some VUs would run End too early or miss it.

**Mitigation:** Accept the risk — behavior has been consistent across all k6 versions. Worst case: some VUs miss End (same reliability as JMeter/NeoLoad when shutdown is aggressive).

### 5. Idle VU Iterations Inflate Metrics — LOW

**Problem:** After Action_End, the VU returns immediately from every subsequent `default()` call. k6 still counts these as iterations, inflating `iterations` counter and skewing `iteration_duration` toward zero.

**Mitigation:** Negligible in practice — the idle window between Action_End and VU removal is typically a few seconds. For clean metrics, filter by transaction tags rather than raw iteration counts.

### 6. `startVUs > 0` — LOW

**Problem:** If `startVUs: 5` and first stage is `{ target: 10 }`, VUs 1-5 exist at t=0 before ramp-up begins. Exit time calculation is unaffected (only uses ramp-DOWN segments), but Init runs at different wall-clock times for different VUs.

**Impact:** None — Init always runs on `iterationInScenario === 0` regardless of spawn time. Just worth documenting.

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| `lifecycle` not defined | Backward compatible — all groups run every iteration |
| `lifecycle.init` empty, `lifecycle.end` defined | No init phase, just Action + End |
| `lifecycle.end` empty, `lifecycle.init` defined | Init on first iteration, then Action forever (no End) |
| Single-stage test (no ramp-down) | `__calcVUExitTime` returns test end time — End triggers near test completion |
| `per-vu-iterations` with iterations=1 | Only Init runs (no Action, no End) — GatekeeperValidator warns |
| VU spawned mid-stage (ramp-up in progress) | Init still runs on `iterationInScenario === 0`, exit time correctly calculated from VU ID |
| Multi-spike (ramp down → ramp up → ramp down) | `_lastEndMs` tracking + `__calcVUExitTime(vuId, timeline, afterMs)` finds next exit per VU |
| Debug mode with lifecycle | Ignored — all groups run sequentially |
| `constant-vus` executor | Uses `exec.scenario.progress >= 0.95` heuristic (no ramp-down segment to calculate from) |
| `shared-iterations` executor | Uses `exec.scenario.progress >= 0.95` fallback (iteration distribution non-deterministic per VU) |

---

## Files Modified (summary)

| File | Change Type | Scope |
|------|-------------|-------|
| `core-engine/src/types/TestPlanSchema.ts` | Add interface + property | `LifecycleConfig`, `UserJourney.lifecycle` |
| `core-engine/src/config/SchemaValidator.ts` | Add validation rules | `lifecycle` field schema |
| `core-engine/src/config/GatekeeperValidator.ts` | Add cross-validation | Iteration count, buffer vs ramp-down, overlap |
| `core-engine/src/scenario/ScenarioBuilder.ts` | New method + env injection | `computePhases()`, `K6_PERF_PHASES` env var |
| `core-engine/src/recording/ScriptGenerator.ts` | Lifecycle-aware code generation | Conditional wrapping of init/action/end groups |
| `core-engine/src/recording/ScriptConverter.ts` | Optional lifecycle parameter | Same wrapping for converted scripts |
| `config/test-plans/load-test.json` | Add lifecycle example | Sample config |

**No changes to:** `ReplayRunner.ts`, `HTMLDiffReporter.ts`, `PipelineRunner.ts`, `transaction.ts`, `ThresholdManager.ts`, `SLARegistry.ts`, `ExecutorFactory.ts`, `WorkloadModels.ts`, `JourneyAllocator.ts`, `ParallelExecutionManager.ts`
