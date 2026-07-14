# K6 Performance Framework: Low-Level Engineering Deep Dive

> **Refreshed 2026-07-13** to match the current code. This is the mechanism-level companion to the
> file-by-file [KT Guide](KT_Guide.md). For the definitive, `file:line`-cited version of any section here,
> read the matching EDD under [`engineering_docs/edd/`](../../engineering_docs/edd/) — each is
> reverse-engineered from current source. Where this deck and an EDD disagree, the EDD wins.

This document covers the mathematical, architectural, and code-level mechanisms: process orchestration,
proportional VU allocation, the per-VU lifecycle and end-detection math, data slicing, auto-correlation
scoring, debug replay, and end-of-test assertion mapping.

---

## 1. Engine Orchestration & Load Distribution

### The Orchestration Pipeline (`cli/run.ts` → execution)
When `npm run cli -- run --plan config/test_plans/load_test.json` is invoked, execution follows this
pipeline:

1.  **Load the plan:** `TestPlanLoader` parses JSON/JSONC and `SchemaValidator` (AJV) strictly validates
    it, suggesting the nearest valid key on a typo.
2.  **Resolve config:** `ConfigurationManager.resolve()` layers **framework defaults → environment JSON →
    runtime settings → CLI overrides → `.env` secrets** into one `ResolvedConfig`. `deepMerge`
    **replaces arrays wholesale** (never deep-merges them) — this is the RZ3/F3 invariant guarded by
    `npm run test:merge`.
3.  **Gatekeeper pre-flight:** `GatekeeperValidator` checks script paths (`fs.existsSync` via
    `PathResolver`), data reachability, and weights. It is **non-short-circuit** — it collects *all*
    failures before returning, so one pass fixes everything.
4.  **Assemble k6 options:** `ParallelExecutionManager` combines `JourneyAllocator` (integer VU split),
    `ThresholdManager` (SLAs → k6 thresholds), and `ScenarioBuilder` (profiles → k6 scenarios +
    `K6_PERF_PHASES` phase envelope) into the exact `k6Options` object k6 requires.
5.  **Spawn k6:** `PipelineRunner` writes a temp options file and spawns the native `k6` binary. Live
    output streams through `LiveConsoleLogStream`; **metrics are read from k6's summary-export JSON**, not
    scraped from stdout (this preserves k6's animated progress bar).

### Proportional VU Distribution Mathematics (`JourneyAllocator.ts`)
Load tests demand proportional scaling (e.g. 60% Browse, 40% Checkout at 2000 total VUs), but k6 executors
*require* exact integers.
*   **Algorithm:** multiply each journey weight by `totalVUs`; `Math.floor()` for safe integer baselines;
    track the rounding remainder; then hand out the leftover VUs one at a time to the highest-weighted
    scripts until the sum strictly equals `totalVUs`.
*   **Result:** no scenario ever crashes on a fractional or zero-VU allocation.

---

## 2. K6 Runtime Lifecycle & End-Detection (`lifecycle.ts`)

k6's native grain is the **independent, stateless iteration** — there is no built-in "first"/"last"
iteration hook per VU. The framework grafts an enterprise lifecycle on top via
`runJourneyLifecycle(store, { initPhase, actionPhase, endPhase })`. Full detail:
[EDD-lifecycle](../../engineering_docs/edd/EDD-lifecycle.md).

### Per-VU state via module scope
k6 gives each VU a **fresh module scope**, so module-level variables *are* per-VU state. The store is built
once with `createJourneyLifecycleStore()` and carries `state.{initialized, ended, terminated}`.

### The runtime flow (per iteration)
```text
(1) terminated/ended/isVuTerminated?  → sleep(86400) and return   // park the VU
(2) !initialized?                     → computeEndPlan; runSafely('init'); initialized=true
(3) arrival-rate/external family?     → action + pacing, return   // action-only by design
(4) isEndDueBefore()?                 → endPhase; ended=true; return
(5) runSafely('action')
(6) unless ending                     → applyPacing (think time / pacing)
(7) isEndDueAfter()?                  → endPhase; ended=true
```

### The hard problem: logout before k6 culls the VU
During `ramping-vus` ramp-down, k6 removes the highest-indexed VUs first, **mid-flight, with no further
`default()` call** — so a naive design loses `endPhase` (logout/cleanup) for every culled VU. The solution
is a **proactive, VU-driven deadline**:
*   At init, `computeEndPlan` reads the `K6_PERF_PHASES` envelope (injected by `ScenarioBuilder`) and picks
    a family: `ramping-vus` (+ synthetic `constant-vus`) → a **time deadline**; `per-vu-iterations` →
    `lastIteration = total - 1`; `shared-iterations` → a per-VU share; `arrival-rate` → end **disabled**
    (action-only); else `external`.
*   **Deadline math (`terminalDeadlineMs`):** each VU's *rank* is the interpolated load-curve value at its
    **onboarding offset** (`Date.now() - scenario.startTime`), **not** `idInInstance` (which k6 shuffles).
    The deadline is `sup{ t : target(t) ≥ rank }` — the last moment the curve is at/above that rank; k6
    culls just after. The VU runs `endPhase` a safety margin before that.
*   **Fallback:** if the curve never reaches the rank (`sup < 0`), return the full duration — the VU relies
    on scenario end + `gracefulStop` rather than logging out early.
*   **Cost:** the per-iteration check is a `Date.now()` compare + branch. `computeEndPlan` runs once per VU.

### Uniform error behavior
Phase and transaction bodies share four behaviors: `continue`, `stop_iteration`, `stop_vu`, `abort_test`.
**Exception:** a genuine JS runtime error (`ReferenceError`/`TypeError`/…) **always** calls
`exec.test.abort` regardless of `errorBehavior` — a broken script should stop the test, not silently
generate load.

---

## 3. The Data Slicing Formula (`DataPoolManager.ts`)

Reading large CSVs across many concurrent VUs risks collisions (two VUs on the same username).
*   **Iteration slice:** `getRowForIteration(pool, vuIndex, iteration)` uses
    `absoluteIndex = vuIndex * 1000 + iteration` — VU #0 walks rows 0–999, VU #1 rows 1000–1999, etc.
*   **Overflow strategy** when a VU runs past its data:
    *   `terminate` → throw / stop.
    *   `cycle` → `rows[index % rowCount]` (wrap to the start).
    *   `continue_with_last` → clamp at `rowCount - 1`.
*   **Note:** generated scripts frequently use k6's experimental CSV reader instead, keying rows by
    `execution.scenario.iterationInTest % rows.length`. Both are valid; `DataPoolManager` is the
    framework-managed path.

---

## 4. Smart Auto-Correlation (`correlation/`)

Dynamic server values (CSRF tokens, JWTs, session ids, ViewState) must be extracted and re-injected. The
framework **infers this automatically from a recording — you write no rules.** Pipeline (all pure,
Node-side): `CorrelationScanner.scan()` runs `ValueIndexer` → `LinkMatcher` → `CandidateScorer` →
`ExtractorSynthesizer`, producing a reviewable `CorrelationPlan` manifest; `ScriptCorrelationWriter.apply()`
then rewrites the script. Detail: [EDD-auto-correlation](../../engineering_docs/edd/EDD-auto-correlation.md).

### Linking producers to consumers (`LinkMatcher.ts`)
A consumed value is joined to the **nearest *preceding* producer** response — this is what makes token
rotation (the same logical token re-issued each step) correlate correctly.

### Confidence scoring (`CandidateScorer.ts`)
Each candidate accumulates a score, then maps to confidence: `≥ high(5)` → high, `≥ medium(3)` → medium,
`≥ low(1)` → low, below → dropped.
*   **Boosts:** JWT shape +4, name-match vocabulary +3, UUID +3, long-hex +2, opaque base64 +2,
    entropy ≥ 3.2 +2, length ≥ 20 +1, html-hidden field +1, single-use +0.5.
*   **Penalties / hard drops:** low-entropy −2, short-numeric −2; dropped outright if it's a deny-listed
    literal, a known data-file parameter value (that's parameterisation, `p_`, not correlation `c_`), a
    cookie round-trip k6's jar already replays (`handledByJar`), or a constant already sent at/before the
    producer.

### Synthesis & safe application
`ExtractorSynthesizer` picks `jsonpath` / `header` / `cookie` / `boundary` and is **uniqueness-checked** — a
locator matching more than one value is rejected. `ScriptCorrelationWriter` does a tentative substitution
and **commits only if at least one consumer site actually matched**. By default `--apply` commits **high
confidence only** — precision over recall, so it can't corrupt a working script. The manifest is
hand-editable before applying (toggle `apply`, rename a var, fix a boundary).

---

## 5. Reverse Engineering: Debug Replay (`debug/ReplayRunner.ts`)

`--debug` / `npm run debug` runs the generated script **once (1 VU, 1 iteration)** with the *same* runtime
settings as a load run, and diffs live traffic against the original recording. Detail:
[EDD-debug-replay](../../engineering_docs/edd/EDD-debug-replay.md).

1.  **Instrument a throwaway copy:** `VariableInstrumenter` wraps every `${...}` interpolation in a
    disposable `*.__debugtrack_*.js` beside your script — your file is never mutated. Script writes to
    `ctx.correlation/session/...` are additionally auto-registered via the lifecycle's tracked proxy, so
    `detectVariableEvents` can map recorded value → variable name with **no explicit `trackCorrelation`
    call needed**.
2.  **Run and capture:** `PipelineRunner.executeAsync` runs k6 (`per-vu-iterations`, 1×1). Each request
    emits a `[k6-perf][replay-log] { … }` console line via `replayLogger`.
3.  **Extract:** `extractReplayEntries` reads those lines from the log stream (streaming `readline`, O(1)
    memory) and remaps file paths from the throwaway copy back to the real script so clicking a k6 error
    jumps to the right file.
4.  **Diff & report:** `DiffChecker.compareTaggedLogs` pairs recording vs replay entries; headers compared
    as maps (`missing`/`extra`/`mismatch`), bodies compared for similarity. `HTMLDiffReporter` renders a
    self-contained interactive HTML diff.
5.  **Binary safety:** image/font/static bodies are replaced with a `[binary: content-type]` placeholder
    before the JSON is built, so a 4 MB binary response can't break `JSON.parse`.

---

## 6. End-Of-Test Assertion Mapping (`assertions/`)

k6 uses a strict `thresholds` block; human-friendly SLA JSON must be translated. Detail:
[EDD-reporting](../../engineering_docs/edd/EDD-reporting.md).

1.  **The configuration:**
    ```json
    "transaction_slas": { "t02_login": { "p95": 1000 } }
    ```
2.  **Translation (`ThresholdManager.apply`):** the percentile key regex `^p(\d+(?:\.\d+)?)$` becomes a k6
    stat:
    ```javascript
    export let options = { thresholds: { 't02_login': ['p(95)<1000'] } };
    ```
    SLAs resolve at four scopes: request-global, per-journey (`http_req_duration{scenario:j}`),
    transaction-level, and per-request (`http_req_duration{name:r}`). `collectPercentiles()` also gathers
    the percentiles k6 must compute, passed to k6 as the `--summary-trend-stats` **CLI flag** (JSON-config
    for it is silently ignored — F6).
3.  **Validation (`JourneyAssertionResolver`):** after the run it reads each threshold's `ok`. If any is
    `false`, the Node process exits **99**, giving Jenkins/ADO/GitHub an actionable red without parsing
    logs. Transaction pass/fail itself comes **exactly** from `<name>_checkrate` — no estimation; an
    uncontracted transaction renders "—" rather than a guessed number.

---

## 7. The Two-World Boundary (why the build step exists)

Everything above splits cleanly into two execution worlds:

| | Node.js orchestration | k6 runtime (goja) |
|---|---|---|
| Code | `cli/ config/ scenario/ execution/ assertions/ reporting/ debug/ data/ recording/ correlation/` | `utils/*` |
| Runs | before/after the test | inside k6, per VU, at load |
| Compiled to | run directly via ts-node/tsx | **`dist/` — k6 loads this, not `.ts`** |

**Consequence:** any change to a `utils/*` file (`lifecycle`, `transaction`, `session`, `request`,
`extract`, `replayLogger`, `autoHeaders`, `dataWriter`) needs `npm run build` before k6 sees it. A `utils/`
file may **never** import a Node built-in (`fs`/`path`) — it runs in goja, which has none. This is risk zone
RZ1, and the most common source of "my change did nothing".
