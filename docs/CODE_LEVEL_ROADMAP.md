# 🗺️ Code-Level Learning Roadmap: K6-PerfFramework

> A structured, file-by-file learning path. Follow the phases in order — each builds on the previous one.

---

## Phase 0: Prerequisites & Mental Model (30 min)

Before touching code, understand what this framework **is**:

| Concept | Analogy | What It Means |
|---|---|---|
| **Test Plan** (JSON) | A shift schedule | Declares *what* runs, *how many* VUs, *which* scripts |
| **Core Engine** (TypeScript) | The kitchen expediter | Loads configs, builds scenarios, orchestrates k6, generates reports |
| **k6 Binary** | The line cook | Only executes HTTP requests — knows nothing about the framework |
| **Your Script** (`.js`) | The recipe | Contains the actual business flow (login, browse, checkout) |

**Read first:**
- [HOW_TO_USE_FRAMEWORK.md](file:///d:/repos/K6-PerfFramework/HOW_TO_USE_FRAMEWORK.md) — sections 1-3 only
- [KT_Presentation.md](file:///d:/repos/K6-PerfFramework/docs/KT_Presentation.md) — the restaurant analogy (Slide 2)

**Key directories to memorize:**

```
K6-PerfFramework/
├── core-engine/src/     ← Framework internals (DO NOT EDIT as a test author)
│   ├── cli/             ← CLI commands (init, run, generate, validate, debug)
│   ├── config/          ← Configuration merging & validation
│   ├── scenario/        ← Test Plan → k6 scenarios translation
│   ├── execution/       ← Spawns the k6 binary
│   ├── runtime/         ← In-VU lifecycle helpers (runs INSIDE k6)
│   ├── utils/           ← Transaction timers, lifecycle bridge, logging
│   ├── data/            ← CSV/JSON data loading
│   ├── assertions/      ← SLA thresholds
│   ├── correlation/     ← Dynamic value extraction (CSRF, tokens)
│   ├── recording/       ← HAR → k6 script generation
│   ├── debug/           ← Replay-vs-recording diff engine
│   ├── reporting/       ← Post-run artifact & HTML report generation
│   ├── reporters/       ← External reporters (Grafana, Azure, etc.)
│   └── types/           ← TypeScript interfaces & contracts
├── config/              ← User-facing configs
│   ├── environments/    ← dev.json, staging.json (base URLs)
│   ├── test-plans/      ← load-test.json, debug-test.json
│   ├── runtime-settings/← default.json (think time, pacing, error behavior)
│   └── correlation-rules/← Token extraction rules
├── scrum-suites/        ← Team-owned test scripts
│   └── <team>/
│       ├── tests/       ← .js journey scripts
│       ├── data/        ← .csv test data files
│       └── recordings/  ← .har browser recordings
└── results/             ← Generated reports after each run
```

---

## Phase 1: The Type System — Contracts First (1 hour)

> **Goal:** Understand the *data shapes* before reading any logic.

### 1A. Test Plan Schema
📄 [TestPlanSchema.ts](file:///d:/repos/K6-PerfFramework/core-engine/src/types/TestPlanSchema.ts)

This is the **single most important type file**. Every JSON test plan maps to the `TestPlan` interface.

| Interface | Purpose | Key Fields |
|---|---|---|
| `TestPlan` | Root input contract | `name`, `environment`, `execution_mode`, `global_load_profile`, `user_journeys`, `global_sla`, `debug` |
| `UserJourney` | One script in the plan | `name`, `scriptPath`, `weight`, `loadProfile` |
| `GlobalLoadProfile` | How VUs ramp | `executor`, `startVUs`, `stages`, `vus`, `duration`, `iterations` |
| `SLADefinition` | Pass/fail thresholds | `p95`, `p99`, `errorRate`, `avgResponseTime` |
| `DebugSettings` | Debug replay config | `enabled`, `mode`, `iterations`, `autoResolveRecordingLog` |

### 1B. Config Contracts
📄 [ConfigContracts.ts](file:///d:/repos/K6-PerfFramework/core-engine/src/types/ConfigContracts.ts)

| Interface | Purpose |
|---|---|
| `EnvironmentConfig` | `baseUrl`, `name`, `serviceUrls` |
| `RuntimeSettings` | `thinkTime`, `pacing`, `http`, `errorBehavior`, `reporting`, `errors`, `monitoring` |
| `ResolvedConfig` | The merged output: `environment` + `runtime` + `cliOverrides` + `secrets` |
| `FRAMEWORK_DEFAULTS` | Hardcoded fallback values when no config file is provided |

### 1C. Reporting Contracts
📄 `core-engine/src/types/ReportingContracts.ts`

Defines `ReportBundle`, `TransactionMetricsFile`, `CISummary` — the shapes of every output artifact.

---

## Phase 2: The CLI — Where Everything Starts (1.5 hours)

> **Goal:** Trace a `npm run cli -- run --plan ...` command from entry to k6 launch.

### 2A. Entry Point
📄 [run.ts](file:///d:/repos/K6-PerfFramework/core-engine/src/cli/run.ts) (838 lines — the main orchestrator)

This file registers all CLI commands using [Commander.js](https://github.com/tj/commander.js).

**Commands defined (lines 39–150):**

| Command | Handler | What It Does |
|---|---|---|
| `init` | `runInit()` | Scaffolds a new team suite |
| `generate <team> <name> --har <path>` | `runGenerate()` | HAR → k6 script |
| `generate-byos <team> <name>` | `runGenerateByos()` | Empty phase-based template |
| `convert <script> <team> <name>` | `runConvert()` | Converts raw k6 → framework format |
| `validate --plan <path>` | `runValidate()` | Pre-flight checks only |
| `debug --script <path>` | `ReplayRunner.runDebug()` | Single-journey debug diff |
| `run --plan <path>` | *(inline action)* | **The main pipeline** |

### 2B. The `run` Command Pipeline (lines 156–353)

This is the **critical path**. Read these steps in order:

```
Step 1: TestPlanLoader.load()          → Parse test-plan JSON
Step 2: ConfigurationManager.resolve() → Merge all config layers
Step 3: GatekeeperValidator.validate() → Pre-flight checks
Step 4: prepareRunArtifacts()          → Create results/ folder, generate runId
Step 5: ParallelExecutionManager.resolve() → Build k6 options.scenarios
Step 6: Generate temp entry script     → Combine multiple journey imports
Step 7: PipelineRunner.executeAsync()  → Spawn k6 binary
Step 8: finalizeRunArtifacts()         → Parse k6 output → HTML report
```

**Key helper functions in run.ts (lines 441–715):**
- `prepareRunArtifacts()` — Creates the `results/<PlanName>/Run_<timestamp>/` folder
- `buildScenarioRuntimeMetadata()` — Packs runtime config into env vars for k6
- `buildRunEnvironment()` — Sets `K6_PERF_*` environment variables
- `writeRunManifest()` — Writes `run-manifest.json` with all artifact paths
- `finalizeRunArtifacts()` — Post-run: parses `summary.json` → builds report bundle → writes `RunReport.html`

---

## Phase 3: Configuration Merging (45 min)

> **Goal:** Understand the config precedence chain.

### 3A. ConfigurationManager
📄 [ConfigurationManager.ts](file:///d:/repos/K6-PerfFramework/core-engine/src/config/ConfigurationManager.ts) (155 lines)

Merge order (lowest → highest precedence):
```
FRAMEWORK_DEFAULTS → environment JSON → runtime-settings JSON → CLI overrides → .env secrets
```

Key method: `resolve()` at line 32. It:
1. Starts with `structuredClone(FRAMEWORK_DEFAULTS)`
2. Loads environment config (`config/environments/dev.json`)
3. Deep-merges runtime settings (`config/runtime-settings/default.json`)
4. Applies CLI overrides (`--debug` flag, etc.)
5. Loads `.env` secrets via `EnvResolver`

### 3B. GatekeeperValidator
📄 [GatekeeperValidator.ts](file:///d:/repos/K6-PerfFramework/core-engine/src/config/GatekeeperValidator.ts) (242 lines)

Pre-flight checks run **before k6 is invoked**. It validates:
1. Environment has `baseUrl` and `name`
2. At least one `user_journey` exists
3. All `scriptPath` files exist on disk
4. Journey weights sum to ~100%
5. VU count doesn't exceed `max_total_vus`
6. Data files referenced in scripts exist and have the expected CSV columns
7. Debug recording logs can be resolved (if debug mode is on)

---

## Phase 4: Scenario Building — Test Plan → k6 Options (1 hour)

> **Goal:** Understand how a JSON test plan becomes k6-native scenarios.

### 4A. WorkloadModels
📄 [WorkloadModels.ts](file:///d:/repos/K6-PerfFramework/core-engine/src/scenario/WorkloadModels.ts) (118 lines)

Pure factory functions that create `GlobalLoadProfile` objects:

| Function | Profile Type | Output |
|---|---|---|
| `buildLoadProfile()` | Standard load | ramp-up → steady → ramp-down |
| `buildStressProfile()` | Stress | Aggressive ramp-up, short steady |
| `buildSoakProfile()` | Soak | Low VUs for extended duration |
| `buildSpikeProfile()` | Spike | Baseline → sudden surge → baseline |
| `buildIterationProfile()` | Fixed | N VUs × M iterations |

### 4B. ScenarioBuilder
📄 [ScenarioBuilder.ts](file:///d:/repos/K6-PerfFramework/core-engine/src/scenario/ScenarioBuilder.ts) (353 lines)

The `build()` method dispatches to:
- `buildParallel()` — All journeys run concurrently (most common)
- `buildSequential()` — Journeys run one after another using `startTime` offsets
- `buildHybrid()` — Groups of parallel/sequential journeys

**Critical method: `computePhaseEnvelope()` (line 250)**
This creates the `K6_PERF_PHASES` environment variable that tells the lifecycle runtime **when to trigger endPhase**. It converts load profiles into a timeline of `{ endMs, vus }` waypoints.

---

## Phase 5: Execution — Spawning k6 (30 min)

> **Goal:** Understand how the framework launches the k6 binary.

📄 [PipelineRunner.ts](file:///d:/repos/K6-PerfFramework/core-engine/src/execution/PipelineRunner.ts) (259 lines)

| Method | When Used |
|---|---|
| `run()` | Synchronous fire-and-forget (exits process on failure) |
| `execute()` | Synchronous with result capture |
| `executeAsync()` | Async with streaming stdout/stderr |

What happens inside `execute()`:
1. Resolves the script path to absolute
2. Writes `k6Options` to `.k6-temp/resolved-options.json`
3. Spawns: `k6 run <script> --config resolved-options.json [extra args]`
4. Returns `{ status, stdout, stderr, optionsPath, reportDir }`

---

## Phase 6: The VU Lifecycle — The Heart of the Framework (2 hours)

> **Goal:** This is the most complex and most important piece. Understand how `initPhase → actionPhase → endPhase` actually works inside a running k6 VU.

### 6A. Transaction Helpers
📄 [transaction.ts](file:///d:/repos/K6-PerfFramework/core-engine/src/utils/transaction.ts) (57 lines)

Three functions — the LoadRunner equivalent:

```
initTransactions(['Login', 'Browse'])  ← MUST be called in init context (global scope)
startTransaction('Login')              ← Records Date.now() start time
endTransaction('Login')                ← Calculates duration, adds to k6 Trend metric
```

### 6B. Lifecycle Bridge
📄 [lifecycle.ts](file:///d:/repos/K6-PerfFramework/core-engine/src/utils/lifecycle.ts) (318 lines)

**This is the most intellectually dense file in the framework.** Read it carefully.

The `runJourneyLifecycle()` function (line 270) is called on **every k6 iteration** for every VU. It decides which phase to run:

```
Iteration 1:  → initPhase()  (once per VU)
              → actionPhase() (the business flow)
Iteration 2+: → actionPhase() (repeated)
...
Last iteration or ramp-down detected: → endPhase() (once per VU)
```

**How endPhase timing works (`getEndSignal()` at line 170):**

| Executor Mode | End Signal Logic |
|---|---|
| `per-vu-iterations` | Fires after the last assigned iteration |
| `shared-iterations` | Fires after the VU's proportional share is done |
| `ramping-vus` | Uses `getInstantaneousState()` to interpolate the current target VU count. When `vuId > target` during a **decreasing** stage, that VU runs endPhase |

**Key design decision (lines 108–120):**
Uses `Math.floor()` instead of `Math.ceil()` because k6 removes VUs slightly before our check runs. Floor ensures endPhase fires in time.

### 6C. How a Journey Script Uses the Lifecycle
📄 [buyanimal_1_framework_lifecycle.js](file:///d:/repos/K6-PerfFramework/scrum-suites/jpet-team/tests/buyanimal_1_framework_lifecycle.js) (real example)

Pattern every script follows:
```javascript
// 1. Init context (global scope) — register transactions
initTransactions(['tx01_launch', 'tx02_login', ...]);
const __store = createJourneyLifecycleStore();

// 2. Define phases
export function initPhase(ctx)   { /* login, setup */ }
export function actionPhase(ctx) { /* the repeating business flow */ }
export function endPhase(ctx)    { /* logout, cleanup */ }

// 3. Wire the bridge
export default function() {
  runJourneyLifecycle(__store, { initPhase, actionPhase, endPhase });
}
```

---

## Phase 7: Data, Assertions & Correlation (1 hour)

### 7A. Data Layer
📄 [DataFactory.ts](file:///d:/repos/K6-PerfFramework/core-engine/src/data/DataFactory.ts) — Loads CSV/JSON on the Node.js side
📄 `DataPoolManager.ts` — Manages row allocation across VUs
📄 `DataValidator.ts` — Validates CSV columns exist before k6 runs

### 7B. Assertions / SLA
📄 [ThresholdManager.ts](file:///d:/repos/K6-PerfFramework/core-engine/src/assertions/ThresholdManager.ts) (99 lines)

Converts test plan SLAs into k6-native `thresholds`:
```
global_sla: { p95: 3000 }  →  thresholds: { 'http_req_duration': ['p(95)<3000'] }
journey_slas.login: { p90: 2000 }  →  thresholds: { 'http_req_duration{scenario:login}': ['p(90)<2000'] }
```

### 7C. Correlation Engine
📄 [CorrelationEngine.ts](file:///d:/repos/K6-PerfFramework/core-engine/src/correlation/CorrelationEngine.ts) (58 lines)

Simple store-based engine:
1. `process(response)` — Runs all rules against the response, extracts values via `ExtractorRegistry`
2. `get('csrf_token')` — Retrieves the extracted value
3. If extraction fails and the value was never seen, `FallbackHandler` kicks in

---

## Phase 8: Recording & Script Generation (45 min)

> **Goal:** Understand the HAR → script pipeline.

📄 [HARParser.ts](file:///d:/repos/K6-PerfFramework/core-engine/src/recording/HARParser.ts) — Reads `.har`, sorts by time, filters domains, strips headers
📄 `TransactionGrouper.ts` — Groups requests by `pageref` into logical transactions
📄 `ScriptGenerator.ts` — Outputs the final `.js` file with `initTransactions()`, `startTransaction()`, `logExchange()`, etc.

Pipeline: `HAR file → HARParser.parse() → TransactionGrouper.group() → ScriptGenerator.generate() → .js file`

---

## Phase 9: Debug & Diff Engine (45 min)

> **Goal:** Understand how the framework compares recorded vs replayed traffic.

📄 [ReplayRunner.ts](file:///d:/repos/K6-PerfFramework/core-engine/src/debug/ReplayRunner.ts) (452 lines)

The `runDebug()` method:
1. Spawns k6 with `captureOutput: true` and `per-vu-iterations` executor
2. Scans stdout for `[k6-perf][replay-log]` prefixed JSON lines
3. Loads the original recording log
4. Passes both to `DiffChecker.compareTaggedLogs()`
5. Generates an HTML diff report via `HTMLDiffReporter`

📄 `DiffChecker.ts` — Compares request/response pairs, scores similarity
📄 `HTMLDiffReporter.ts` — Side-by-side HTML report with match scores per request
📄 `RecordingLogResolver.ts` — Auto-finds the correct recording log for a script

---

## Phase 10: Reporting — Post-Run Artifact Generation (1 hour)

> **Goal:** Understand how k6 output becomes the HTML dashboard.

### The artifact chain (in `finalizeRunArtifacts()`, run.ts lines 554–715):

```
summary.json (k6 output)
    ↓
TransactionMetricsBuilder.build()  → transaction-metrics.json
EventArtifactBuilder.build()       → errors.ndjson, warnings.ndjson
RunSummaryBuilder.buildCiSummary() → ci-summary.json
TimeseriesArtifactBuilder.build()  → timeseries.json
    ↓
All combined into ReportBundle
    ↓
RunReportGenerator.generate()      → RunReport.html (single-file dashboard with Chart.js)
```

📄 [RunReportGenerator.ts](file:///d:/repos/K6-PerfFramework/core-engine/src/reporting/RunReportGenerator.ts) — Generates a self-contained HTML file with embedded CSS, JS, and Chart.js. The report has tabs: Summary, Graphs, Transactions, Errors, Warnings, Snapshots, System.

---

## Phase 11: The Barrel Export (15 min)

📄 [index.ts](file:///d:/repos/K6-PerfFramework/core-engine/src/index.ts)

This is the public API surface. Every class/type the framework exposes is re-exported here. Teams import from `@k6-perf/core-engine`. Read this file to see what's "public" vs "internal."

---

## 🎯 Quick Troubleshooting Reference

| Problem | Files to Check |
|---|---|
| Wrong environment URLs | `config/EnvResolver.ts`, `config/environments/*.json` |
| VUs not ramping correctly | `scenario/ScenarioBuilder.ts`, `scenario/WorkloadModels.ts` |
| endPhase never runs | `utils/lifecycle.ts` → `getEndSignal()`, `getInstantaneousState()` |
| Transactions missing from report | `utils/transaction.ts` (is `initTransactions()` in global scope?) |
| Correlation extraction fails | `correlation/RuleProcessor.ts`, `correlation/ExtractorRegistry.ts` |
| Pre-flight validation failing | `config/GatekeeperValidator.ts` |
| Generated script looks wrong | `recording/ScriptGenerator.ts` |
| HTML report missing data | `reporting/TransactionMetricsBuilder.ts`, `reporting/RunReportGenerator.ts` |
| k6 exits code 99 | SLA threshold failed — check `assertions/ThresholdManager.ts` |

---

## 📅 Suggested Learning Schedule

| Day | Phase | Time |
|---|---|---|
| Day 1 | Phase 0 (Mental Model) + Phase 1 (Types) | 1.5 hr |
| Day 2 | Phase 2 (CLI) + Phase 3 (Config) | 2.25 hr |
| Day 3 | Phase 4 (Scenarios) + Phase 5 (Execution) | 1.5 hr |
| Day 4 | Phase 6 (Lifecycle) — **take your time here** | 2 hr |
| Day 5 | Phase 7 (Data/SLA/Correlation) + Phase 8 (Recording) | 1.75 hr |
| Day 6 | Phase 9 (Debug) + Phase 10 (Reporting) + Phase 11 (Barrel) | 2 hr |

**Total: ~11 hours across 6 days**
