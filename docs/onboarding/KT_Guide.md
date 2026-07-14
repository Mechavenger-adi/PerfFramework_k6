# K6 Performance Framework: Comprehensive Deep-Dive Guide

> **Refreshed 2026-07-13** to match the current code. This guide is a file-by-file tour for a new
> developer or mentor. For the authoritative, `file:line`-cited internals of any subsystem, read its EDD
> under [`engineering_docs/edd/`](../../engineering_docs/edd/); for the concepts first, read the
> [Mental Model](mental-model.md). Where a detail here and an EDD disagree, the EDD wins.

The framework is split across **two execution worlds**, and almost every "why is it built this way"
question resolves to which world a file lives in:

| | Node.js orchestration | k6 runtime (goja) |
|---|---|---|
| **When** | before/after the test | during the test, per VU, thousands of times |
| **Where** | `cli/`, `config/`, `scenario/`, `execution/`, `assertions/`, `reporting/`, `debug/`, `data/`, `recording/`, `correlation/` | `utils/` (`transaction`, `lifecycle`, `session`, `request`, `extract`, `replayLogger`, `autoHeaders`, `dataWriter`) |
| **Imports** | anything (Node built-ins fine) | **VU-safe only, via `dist/index.js`** — no `fs`/`path` |
| **You edit** | rarely (framework internals) | your journey scripts import these helpers |

**The rebuild rule:** k6 executes compiled `dist/`, not `.ts`. Change VU-side code (`core_engine/src/utils/*`)
→ `npm run build`. This is the single most common "my change did nothing" gotcha.

---

## 1. The Config Layer (Node.js Orchestration)

**Location:** `core_engine/src/config/`
**Purpose:** Collect every configuration source, merge them with a strict precedence, and fail fast on typos.
Full detail: [EDD-config](../../engineering_docs/edd/EDD-config.md).

### `ConfigurationManager.ts`
*   **Purpose:** The central nervous system for settings. `resolve()` layers config in a fixed order
    (highest priority last): **framework defaults → environment JSON → runtime settings → CLI overrides →
    `.env` secrets** into one `ResolvedConfig`.
*   **Key Function:** `resolve({ environmentConfigPath, runtimeSettingsPath, cliOverrides })`
*   **The invariant that matters:** `deepMerge` **replaces arrays wholesale, it does not deep-merge them**.
    A naive "fix" here silently corrupts array settings like `reporting.transactionStats`. Guarded by
    `npm run test:merge`.
*   **JSONC:** files loaded through this class (and `TestPlanLoader`) may contain comments. Plain
    `JSON.parse` elsewhere cannot.

### `SchemaValidator.ts`
*   **Purpose:** AJV-validates test plans and runtime settings at load. On a typo it suggests the nearest
    valid key via Levenshtein distance ("did you mean `duration`?").

### `GatekeeperValidator.ts`
*   **Purpose:** The pre-flight checklist. Before launching, it checks target scripts exist on disk, data
    folders are reachable, and weights are sane. It is **non-short-circuit** — it reports *all* problems at
    once rather than dying on the first, so you fix everything in one pass.
*   **Why it matters:** It fails in seconds instead of after k6 spins up.

### `ScriptContractGuard.ts`
*   **Purpose:** Rejects journey scripts that call raw k6 `check()`/`group()`. Only `k6Check` inside
    `transaction()` produces the exact per-transaction pass/fail metric, so the framework enforces it
    pre-flight rather than letting you silently lose pass/fail data.

### `EnvResolver.ts` / `RuntimeConfigManager.ts`
*   `EnvResolver` loads `.env` secrets via dotenv (redacted as `***REDACTED***` in debug output).
    `RuntimeConfigManager` gives typed accessors over runtime settings.

---

## 2. The Scenario & Execution Layer (Node.js Orchestration)

**Location:** `core_engine/src/scenario/` & `core_engine/src/execution/`
**Purpose:** Compile human-readable test plans into raw k6 options and launch the process.

### `ScenarioBuilder.ts` & `WorkloadModels.ts`
*   **Purpose:** Turn profile definitions (load / stress / soak / spike / iteration) into strictly
    formatted k6 `executor` blocks. `WorkloadModels.ts` holds the per-profile builders.
*   **Also owns the phase envelope:** `computePhaseEnvelope()` computes a `K6_PERF_PHASES` descriptor and
    injects it as an env var so the VU-side lifecycle knows *when each VU will be culled* (see §3). This is
    the producer half of the framework's end-detection.

### `ExecutorFactory.ts` & `TestPlanLoader.ts`
*   `ExecutorFactory` validates and constructs k6 executor configs. `TestPlanLoader` parses JSON/JSONC test
    plans into a validated `TestPlan`.

### `JourneyAllocator.ts` & `ParallelExecutionManager.ts`
*   **Purpose:** If a plan runs 3 scripts (Homepage 50%, Login 30%, Checkout 20%) at 100 VUs,
    `JourneyAllocator` does the integer math to assign exactly 50 / 30 / 20 (see the algorithm in
    [KT Low-Level Deep Dive](KT_Low_Level_Deep_Dive.md) §1). `ParallelExecutionManager` assembles the full
    `k6Options` object (scenarios + thresholds + `summaryTrendStats`).

### `PipelineRunner.ts`
*   **Purpose:** The actual trigger. Writes resolved options to a temp file and spawns the native `k6`
    binary. Exposes a synchronous `execute()` and an async `executeAsync()` (used by debug).
*   **Note:** k6's live output is streamed via `LiveConsoleLogStream`/`FileWriteSink`; metrics are read
    from k6's **summary-export JSON**, not scraped from stdout — this keeps k6's animated progress bar
    intact.

### `HostMonitor.ts`
*   Samples CPU/memory of the load machine during the run so you can tell "the target was slow" from "my
    load generator was saturated".

---

## 3. The Runtime Utilities (k6 Runtime Code)

**Location:** `core_engine/src/utils/`
**Purpose:** VU-safe helpers imported *directly into your journey scripts*. They run inside k6's goja
engine, thousands of times per second — **no Node built-ins allowed here**. Import them from the barrel:
`dist/index.js`.

### `lifecycle.ts`
*   **Purpose:** Grafts a LoadRunner-style per-VU lifecycle onto k6, whose native grain is the independent,
    stateless iteration.
*   **Key Function:** `runJourneyLifecycle(store, { initPhase, actionPhase, endPhase })`
*   **The three phases:**
    *   `initPhase` runs **once per VU** (guarded), e.g. login / clear cookies / pick a data row.
    *   `actionPhase` runs **every iteration** — the timed business flow.
    *   `endPhase` runs **once per VU, before k6 culls it** — logout / cleanup.
*   **The hard part (end-detection):** during ramp-down k6 removes VUs mid-flight *without a final
    callback*. So at init each VU computes when it will be culled (`computeEndPlan`, from the injected
    `K6_PERF_PHASES` envelope) and runs `endPhase` a safety margin before that deadline while it is still
    scheduled. Full mechanism: [EDD-lifecycle](../../engineering_docs/edd/EDD-lifecycle.md).
*   **Code Example (inside your test script):**
    ```javascript
    import { createJourneyLifecycleStore, runJourneyLifecycle } from "../../../dist/index.js";
    const store = createJourneyLifecycleStore();

    export function initPhase(ctx)   { /* runs ONCE per VU — setup/login */ }
    export function actionPhase(ctx) { /* runs each iteration — timed business logic */ }
    export function endPhase(ctx)    { /* runs ONCE before k6 culls the VU — logout */ }

    export default function () {
      runJourneyLifecycle(store, { initPhase, actionPhase, endPhase });
    }
    ```
*   Also exports `thinktime(min, max)` (config-aware sleep) and `isEnding()` (so long action loops can bail
    out cleanly once the VU is winding down).

### `transaction.ts`
*   **Purpose:** k6 tracks every HTTP request, but businesses track *transactions* (clicking "Add to Cart"
    might fire 5 background requests). `transaction()` bundles requests into one timed unit and emits the
    metrics the report reads.
*   **Key Functions:** `transaction(name, fn)` and `k6Check(res, checks)` — use these, **not**
    `startTransaction`/`endTransaction` (still exported for compatibility) and **not** raw `group()`/`check()`.
*   **Metrics emitted per transaction:** `<name>` (Trend), `<name>_count` (Counter), `<name>_checkrate`
    (Rate). **Invariant:** `<name>_checkrate.passes + .fails === <name>_count`. That exactness is why the
    report can show *real* per-transaction pass/fail instead of estimates.
*   **Code Example:**
    ```javascript
    import { transaction, k6Check } from "../../../dist/index.js";
    import { request } from "../../../dist/index.js";

    transaction('t01_AddToCart', function () {
      const res = request('POST', `${env.baseUrl}/cart/add`, { body: payload });
      k6Check(res, { 'status 200': (r) => r.status === 200 });
    });
    // The report shows "t01_AddToCart" as one metric with exact pass/fail.
    ```
*   Error behavior (`continue` / `stop_iteration` / `stop_vu` / `abort_test`) is applied here and in the
    lifecycle shell, uniformly across every executor.

### `request.ts`
*   The framework's HTTP wrapper (`request(method, url, opts)`). Prefer it over raw `http.*` — it feeds the
    replay logger, applies per-VU auto-headers, and carries the `replay: { id }` marker used by debug.

### `session.ts`
*   **Purpose:** k6 persists cookies across iterations (one VU behaves like one eternal user).
    `clearCookies()` (call it in `initPhase`) simulates a fresh user. Also exposes `getEnvContext()` and
    URL-registry helpers so scripts never hardcode base URLs.

### `extract.ts` / `replayLogger.ts` / `autoHeaders.ts` / `dataWriter.ts`
*   `extract.ts` — correlation extractors (`extractJson/Regex/Header/Cookie/Boundary`) emitted by
    auto-correlation. `replayLogger.ts` — emits the replay-log lines debug consumes and tracks
    correlation/parameter variables. `autoHeaders.ts` — per-VU headers applied to every request.
    `dataWriter.ts` — `writeData()` writes files during the run via the runner-side `FileWriteSink`.

---

## 4. The Data & Correlation Layer (Node.js & k6 Runtime)

**Location:** `core_engine/src/data/` & `core_engine/src/correlation/`

### `DataPoolManager.ts` (data)
*   **Purpose:** Ensures different VUs don't grab the same CSV row simultaneously. `getRowForIteration`
    slices with `absoluteIndex = vuIndex * 1000 + iteration`, and applies an **overflow strategy**
    (`terminate` / `cycle` / `continue_with_last`) when a VU runs off the end of the data. (Generated
    scripts often instead use k6's experimental CSV with `iterationInTest % rows` — both are valid paths.)
*   `DataFactory` loads CSV/JSON with type coercion; `DynamicValueFactory` (imported as `generate` in
    scripts) provides `uuid()`, `timestamp()`, `randomEmail()`, etc.

### Smart Auto-Correlation (correlation — the current path)
*   **Purpose:** Solves the classic problem where request A returns a dynamic token (CSRF / JWT / session /
    ViewState) that request B must send back. **You do not hand-write rules.** The `correlate` CLI *scans a
    recording*, infers producer→consumer links, scores them `high/medium/low`, and **rewrites the generated
    script** to capture at the producer and substitute `${c_var}` at each consumer.
*   **Key files:** `CorrelationScanner` (orchestrator) → `ValueIndexer` → `LinkMatcher` (nearest preceding
    producer, handles token rotation) → `CandidateScorer` → `ExtractorSynthesizer` → a reviewable
    `CorrelationPlan` manifest → `ScriptCorrelationWriter` applies it. Detail:
    [EDD-auto-correlation](../../engineering_docs/edd/EDD-auto-correlation.md).
*   **What a rewritten capture looks like:**
    ```javascript
    // Inserted by `npm run correlate -- --script ... --apply high`:
    c_csrfToken = trackCorrelation('c_csrfToken', extractJson(res_1, 'token'), 'body');
    // ...later request uses ${c_csrfToken}
    ```
*   **Legacy note:** `CorrelationEngine`/`ExtractorRegistry`/`RuleProcessor`/`FallbackHandler` are the old
    hand-authored runtime rule engine. Generated scripts **do not** call it; new work uses the scanner above.

---

## 5. The Assertions, Debug & Reporting Layers (Node.js Orchestration)

**Location:** `core_engine/src/assertions/`, `core_engine/src/debug/`, `core_engine/src/reporting/`

### Assertions (`assertions/`)
*   **`ThresholdManager.ts`** — translates SLAs from the test plan (`global_sla`, `journey_slas`,
    `transaction_slas`, `request_slas`) into k6-native thresholds, e.g. `{ "p95": 800 }` →
    `'t01_launch': ['p(95)<800']`. It also `collectPercentiles()` for `summaryTrendStats`.
*   **`JourneyAssertionResolver.ts`** — after the run, reads the threshold results. If any SLA `ok === false`,
    the Node process exits with code **99**, natively failing your CI/CD pipeline. `SLARegistry` stores the
    per-journey/transaction SLAs.

### Debug Replay (`debug/`)
*   **`ReplayRunner.ts`** — the `--debug` / `debug` workflow. Runs the script once (**1 VU, 1 iteration**)
    with the *same runtime settings as a load run*, captures live traffic via the replay log, and diffs it
    against the original recording.
*   **`DiffChecker.ts` + `HTMLDiffReporter.ts`** — compare recording vs replay entry-by-entry and render a
    self-contained interactive HTML diff ("did my script send what the recording did, with the right
    dynamic values?"). `VariableInstrumenter` auto-tracks every `${var}` in a throwaway copy of your script
    so interpolations show in the diff. Detail: [EDD-debug-replay](../../engineering_docs/edd/EDD-debug-replay.md).

### Reporting (`reporting/`) — artifact-first
*   **Everything is JSON/NDJSON first, HTML second.** CI consumes `ci-summary.json`, never console text.
*   **`RunReportGenerator.ts`** — renders the unified `RunReport.html` (Summary / Transactions / Graphs /
    Errors tabs).
*   **`TransactionMetricsBuilder.ts`** — builds per-transaction rows; pass/fail comes **solely** from
    `<name>_checkrate` (no estimation — an uncontracted transaction renders "—").
*   **`RunSummaryBuilder` / `EventArtifactBuilder` / `TimeseriesStreamParser` / `ArtifactWriter`** — build
    `ci-summary.json`, `errors.ndjson` / `warnings.ndjson`, per-bucket `timeseries.json`, and write them.
*   Detail: [EDD-reporting](../../engineering_docs/edd/EDD-reporting.md).

---

## Summary for the Team
By separating the heavy orchestration (TypeScript, Node) from the load generation (JavaScript, k6),
developers only ever write clean HTTP requests wrapped in `transaction()` inside `actionPhase()`. The
framework handles the per-VU lifecycle (including the tricky logout-before-cull), data collision, automatic
correlation, SLA-to-CI enforcement (exit 99), and artifact-first reporting. Two rules keep you out of
trouble: **rebuild `dist/` after touching `utils/*`**, and **use `transaction()` + `k6Check()`**, never raw
`group()`/`check()`.
