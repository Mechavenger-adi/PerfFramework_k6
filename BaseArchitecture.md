# BaseArchitecture.md

# k6 Performance Framework – Final Enterprise Base Architecture

## 1. Purpose

This framework is designed as a **hybrid performance engineering platform** built on top of **k6 with TypeScript**, combining the scripting flexibility of k6 with the structure, standardization, and usability expected from enterprise tools.

The goal is to provide a reusable, maintainable, and portable framework that multiple teams can adopt with minimal rework while preserving governance, debuggability, and execution consistency.

---

## 2. Design Philosophy

### 2.1 Decoupled Architecture
The framework separates:
- **Core Engine**: shared SDK, orchestration, governance, utilities
- **Scrum Suites / Project Suites**: team-owned test implementations

This separation ensures:
- independent team ownership
- centralized standards
- reusable platform capabilities
- easier long-term maintenance

### 2.2 Contract-Based Development
The framework uses **strict TypeScript contracts** to define:
- configuration structures
- test plan schema
- runtime settings
- data handling rules
- correlation rules
- reporting contracts

This prevents each team from inventing its own conventions.

### 2.3 Configuration-Driven Execution
Framework behavior should be controlled through:
- `.env`
- environment configs
- runtime settings JSON
- test plan JSON/YAML
- CLI overrides

The framework should avoid hardcoded execution logic inside test scripts wherever possible.

### 2.4 Convention Over Configuration
The framework should provide sensible defaults for:
- status code validation
- data handling
- pacing
- think time
- reporting
- folder layout
- reusable transaction structure

### 2.5 Thin Abstraction Rule
The framework should reduce boilerplate without hiding request intent. HTTP calls, checks, and transaction boundaries must remain easy to debug.

---

## 3. High-Level Architecture

```text
/k6-perf-framework
│
├── /core-engine
│   ├── /src
│   │   ├── /api-clients
│   │   ├── /config
│   │   ├── /types
│   │   ├── /utils
│   │   ├── /scenario
│   │   ├── /execution
│   │   ├── /data
│   │   ├── /correlation
│   │   ├── /assertions
│   │   ├── /reporters
│   │   ├── /recording
│   │   ├── /debug
│   │   ├── /ai
│   │   └── /cli
│   │
│   ├── index.ts
│   └── tsconfig.json
│
├── /scrum-suites
│   ├── /scrum-team-payments
│   │   ├── /tests
│   │   ├── /data
│   │   ├── /recordings
│   │   ├── /config
│   │   └── /results
│   │
│   └── /scrum-team-inventory
│       └── ...
│
├── /config
│   ├── environments
│   ├── test-plans
│   ├── runtime-settings
│   └── correlation-rules
│
├── .env
├── package.json
└── README.md
```

---

## 4. Core Modules

## 4.1 Config Layer

### Folder
```text
/core-engine/src/config
```

### Components
- `ConfigurationManager.ts`
- `RuntimeConfigManager.ts`
- `GatekeeperValidator.ts`
- `EnvResolver.ts`
- `SchemaValidator.ts`

### Responsibilities
- load `.env`, environment config, runtime settings, and CLI overrides
- merge configs in correct order
- validate required fields before test execution
- fail fast if critical settings are missing or invalid
- validate test plan and runtime settings schema

### Recommended precedence
1. framework defaults
2. environment config
3. runtime settings
4. suite-level overrides
5. CLI arguments
6. `.env` secrets

---

## 4.2 Scenario Orchestration Layer

### Folder
```text
/core-engine/src/scenario
```

### Components
- `ScenarioBuilder.ts`
- `WorkloadModels.ts`
- `ExecutorFactory.ts`
- `TestPlanLoader.ts`

### Responsibilities
- translate test plan into k6 scenarios
- standardize stress, load, soak, spike, and iteration models
- support global profiles and per-journey overrides
- simplify multi-journey execution

### Example capability
```ts
ScenarioBuilder.stressTest({
  vus: 500,
  rampUp: '2m',
  steady: '10m',
  rampDown: '2m'
});
```

---

## 4.3 Parallel Execution Layer

### Folder
```text
/core-engine/src/execution
```

### Components
- `ParallelExecutionManager.ts`
- `PipelineRunner.ts`
- `JourneyAllocator.ts`

### Why this module is required
Parallel execution existed conceptually through k6 scenarios, but it was not previously treated as a controlled architectural feature. That creates governance and scaling risks. This module makes concurrency explicit.

### Responsibilities
- run multiple user journeys in parallel
- dynamically construct `options.scenarios`
- distribute load across journeys by:
  - explicit VUs
  - weights
  - global load profile
- support execution modes:
  - `parallel`
  - `sequential`
  - `hybrid`
- validate total allocated VUs and execution safety limits
- prevent accidental over-allocation of load

### Example test plan
```json
{
  "execution_mode": "parallel",
  "global_load_profile": {
    "executor": "ramping-vus",
    "startVUs": 0,
    "stages": [
      { "duration": "2m", "target": 500 },
      { "duration": "10m", "target": 500 },
      { "duration": "2m", "target": 0 }
    ]
  },
  "user_journeys": [
    {
      "name": "browse",
      "weight": 60
    },
    {
      "name": "search",
      "weight": 25
    },
    {
      "name": "checkout",
      "weight": 15
    }
  ]
}
```

### Example hybrid execution concept
```json
{
  "execution_mode": "hybrid",
  "groups": [
    {
      "mode": "parallel",
      "journeys": ["login", "browse", "search"]
    },
    {
      "mode": "sequential",
      "journeys": ["checkout"]
    }
  ]
}
```

---

## 4.4 Data Management Layer

### Folder
```text
/core-engine/src/data
```

### Components
- `DataFactory.ts`
- `DataPoolManager.ts`
- `DataValidator.ts`
- `DynamicValueFactory.ts`

### Responsibilities
- support CSV, JSON, and inline arrays
- load static data through `SharedArray`
- validate data before test start
- detect blank rows, missing values, and malformed input
- allocate data uniquely when needed
- support configured unique-data behavior when VUs exceed available rows:
  - `terminate`
  - `cycle`
  - `continue_with_last`

### Naming conventions
- parameterized variables should use prefix `p_`

### Built-in utilities
- timestamp generator with custom format support
- UUID helpers
- random range utilities
- reusable inline faker-style generators where appropriate

---

## 4.5 Correlation Layer

### Folder
```text
/core-engine/src/correlation
```

### Components
- `CorrelationEngine.ts`
- `RuleProcessor.ts`
- `ExtractorRegistry.ts`
- `FallbackHandler.ts`
- `AIProcessor.ts` (optional)

### Responsibilities
- extract dynamic values from prior responses
- support:
  - regex extraction
  - JSONPath extraction
  - header extraction
- apply correlation rules from config
- manage fallback behavior on extraction failure

### Naming conventions
- correlated variables should use prefix `c_`

### Correlation fallback options
- use a default value
- skip dependent request and log warning
- fail test when configured as critical

---

## 4.6 Recording and Script Generation Layer

### Folder
```text
/core-engine/src/recording
```

### Components
- `HARParser.ts`
- `TransactionGrouper.ts`
- `DomainFilter.ts`
- `ScriptGenerator.ts`
- `ScriptConverter.ts`

### CLI companions
```text
/core-engine/src/cli/generate.ts
/core-engine/src/cli/convert.ts
```

### Responsibilities
- parse HAR from browser DevTools or k6 Studio
- filter third-party domains
- group requests into transactions using `pageref`
- inject default think time between transactions
- generate scripts using:
  - `init`
  - `action`
  - `teardown`

### Additional generation rules
- annotate generated requests with source HAR identifiers
- apply default 2xx status validation
- allow hook points for parameterization and correlation insertion

### Script Conversion (ScriptConverter)
- converts conventional k6 scripts (Studio, HAR exports, hand-written) to framework-compatible format
- adds `logExchange()` debug replay support, request definition objects, transaction wrappers
- handles two input patterns: Pattern A (Studio/Trend-based) and Pattern B (semi-framework)
- uses dual counters: per-group `requestCounter` (variable names) + global `globalRequestId` (sequential `id`/`har_entry_id`)
- preserves original `// har_entry: req_N` IDs when present in input
- idempotent — re-converting a framework script produces identical output
- CLI: `npm run cli -- convert <input-script> <team> <script-name> [--in-place]`

---

## 4.7 Debugging and Diff Analysis Layer

### Folder
```text
/core-engine/src/debug
```

### Components
- `ReplayRunner.ts`
- `DiffChecker.ts`
- `HTMLDiffReporter.ts`

### Responsibilities
- replay generated scripts in controlled debug mode
- compare replayed requests and responses against original HAR
- create HTML comparison report
- group diffs by transaction
- provide side-by-side comparison with match score

### Output
```text
/results/debug-report.html
```

This module is one of the strongest differentiators of the framework.

---

## 4.8 Assertion and SLA Layer

### Folder
```text
/core-engine/src/assertions
```

### Components
- `SLARegistry.ts`
- `ThresholdManager.ts`
- `JourneyAssertionResolver.ts`

### Responsibilities
- centralize SLA definitions per journey, endpoint, or transaction
- inject thresholds into k6 options
- avoid hardcoded assertions scattered in test scripts
- support journey-specific SLAs in parallel runs

### Example
```ts
SLARegistry.register("checkout", {
  p95: 500,
  errorRate: 1
});
```

---

## 4.9 Reporting and Observability Layer

### Folder
```text
/core-engine/src/reporters
```

### Components
- `GrafanaReporter.ts`
- `AzureReporter.ts`
- `CustomUploader.ts`
- `ResultTransformer.ts`

### Responsibilities
- export raw and processed results
- push results to dashboard or database systems
- support post-run transformation
- enable Power BI or custom analytics ingestion
- keep reporting toggleable through config

### Notes
A Node-based uploader such as `upload-results.js` can remain part of the project, but framework ownership of transformation contracts should stay centralized.

---

## 4.10 AI / MCP Integration Layer

### Folder
```text
/core-engine/src/ai
```

### Components
- `AIClient.ts`
- `AIFeatureToggle.ts`
- `PromptTemplates.ts`

### Responsibilities
- support optional OpenAI, Azure OpenAI, or MCP-backed integrations
- allow AI-assisted correlation
- support future anomaly detection and result summarization
- provide hard off-switch through config

### Important rule
AI features must remain optional. The framework must still function fully without them.

---

## 4.11 CLI Layer

### Folder
```text
/core-engine/src/cli
```

### Components
- `init.ts`
- `run.ts`
- `generate.ts`
- `validate.ts`

### Responsibilities
- scaffold new projects
- run tests using standard commands
- validate configs before execution
- generate scripts from recordings
- improve framework adoption and usability

### Example commands
```bash
k6-framework init
k6-framework validate
k6-framework generate-byos my-team script-name
k6-framework generate --har ./recordings/checkout.har
k6-framework run --plan ./config/test-plans/load-test.json
```

### Bring Your Own Scripts (BYOS)
To support users migrating from standalone k6 or Grafana Studio, the CLI allows templating custom scripts:
- Users run `k6-framework generate-byos <team> <script-name>`
- A template is generated inside `scrum-suites/<team>/tests/` with the required framework skeleton
- Users paste their raw k6 code into the template, enabling them to bypass standard HAR generation while still using framework global settings, assertions, and logging.

Without this CLI layer, adoption cost rises and the framework becomes harder to standardize.

---

## 5. Runtime Behavior

## 5.1 Runtime Settings
A `runtime-settings.json` should define:
- global think time
- random think time range
- pacing
- iteration behavior
- HTTP timeouts
- error behavior
- common k6 options like redirects

### Example controls
- `continue`
- `stop_iteration`
- `stop_test`

---

## 5.2 Automatic Validations
All generated and framework-managed flows should support:
- automatic 2xx response validation by default
- configurable validation overrides
- pre-run data validation
- correlation rule validation
- scenario schema validation

---

## 5.3 Record-to-Replay Traceability
Every generated request should carry metadata linking it back to the original HAR entry. This allows:
- easier replay debugging
- faster script verification
- traceable diff reporting

---

## 6. End-to-End Execution Flow

1. User runs framework through CLI.
2. Framework loads environment config, runtime settings, and test plan.
3. Gatekeeper validates required configs and schemas.
4. Data layer loads and validates datasets.
5. ParallelExecutionManager resolves execution strategy.
6. ScenarioBuilder converts journeys into k6 scenarios.
7. Correlation rules and runtime behaviors are injected.
8. k6 executes the plan.
9. Assertion layer validates performance SLAs.
10. Reporting layer exports and uploads results.
11. Optional debug or diff replay can run for analysis.

---

## 7. Packaging and Portability

### Packaging strategy
- package core engine as an npm package
- keep team-specific suites outside core engine
- separate framework logic from project-owned data and configs

### Project bootstrap
`k6-framework init` should scaffold:
- config folders
- example test plan
- runtime settings
- sample suite structure
- reporting hooks
- sample journey file

This makes the framework portable across teams and projects.

---

## 8. Framework Vulnerabilities and Architectural Risks

These are the main weaknesses and risks that were identified and should be treated as design constraints.

### 8.1 Parallel Execution Was Previously Implicit
**Risk:** Parallel run support existed only as an indirect outcome of k6 scenarios, not as a governed framework capability.

**Impact:**
- unclear load distribution
- no guardrails for VU allocation
- inconsistent concurrency behavior across teams

**Mitigation:**
- add `ParallelExecutionManager`
- validate total VUs and scenario composition
- support explicit execution modes and weight-based allocation

---

### 8.2 Missing Correlation Module in Base Architecture
**Risk:** Correlation was present in requirements but not formally represented in architecture.

**Impact:**
- dynamic-value handling becomes ad hoc
- team scripts drift into custom extraction logic
- maintainability drops

**Mitigation:**
- add dedicated `/correlation` module
- centralize extraction, fallback logic, and rule loading

---

### 8.3 No CLI Adoption Layer
**Risk:** Without CLI commands for init, validate, generate, and run, framework onboarding becomes manual and error-prone.

**Impact:**
- weak portability
- high setup friction
- inconsistent project structure

**Mitigation:**
- add `/cli`
- expose standard commands
- provide project scaffolding and validation

---

### 8.4 Configuration Fragmentation
**Risk:** Multiple config sources can lead to confusion and conflicting runtime values.

**Impact:**
- unpredictable behavior
- hard-to-debug environment issues
- hidden overrides

**Mitigation:**
- define strict precedence order
- print resolved runtime config in debug mode
- validate schema and disallow unknown keys where practical

---

### 8.5 Over-Abstraction in API Clients
**Risk:** Heavy wrappers can hide the actual request behavior and make debugging difficult.

**Impact:**
- poor transparency
- harder troubleshooting
- less trust from teams

**Mitigation:**
- keep wrappers thin
- expose raw request and response details when needed
- never hide transaction boundaries

---

### 8.6 Data Exhaustion and Data Collision
**Risk:** High-concurrency execution may exhaust unique datasets or accidentally reuse user identities.

**Impact:**
- false failures
- unrealistic behavior
- polluted test results

**Mitigation:**
- add `DataPoolManager`
- support explicit overflow strategies
- validate row counts against VU demand before run

---

### 8.7 HAR Generation Quality Risk
**Risk:** Raw HAR-based generation may produce noisy or brittle scripts if third-party calls, transient headers, or unstable tokens are not handled well.

**Impact:**
- scripts fail quickly
- high maintenance cost
- poor replay fidelity

**Mitigation:**
- include domain filtering
- strip unstable headers through generation rules
- insert correlation markers and parameterization hooks

---

### 8.8 Debug and Replay Drift
**Risk:** Replayed flows may differ from recorded traffic in expected ways, creating false-positive diffs.

**Impact:**
- noisy debug reports
- wasted investigation effort

**Mitigation:**
- allow ignore rules for expected dynamic fields
- compare with scoped diff rules
- classify differences as critical vs informational

---

### 8.9 AI Dependency Creep
**Risk:** If AI-assisted features are tightly coupled, the framework may become dependent on external AI services.

**Impact:**
- reduced reliability
- higher cost
- blocked execution in restricted environments

**Mitigation:**
- keep AI optional
- provide deterministic non-AI fallback
- isolate AI into dedicated module and toggle

---

### 8.10 Result Reporting Lock-In
**Risk:** Custom reporting integrations can become tightly coupled to one dashboard or database format.

**Impact:**
- reduced portability
- difficult migration later

**Mitigation:**
- define internal result contract
- keep transformers and uploaders modular
- separate raw capture from destination-specific upload

---

### 8.11 Missing Governance Around Per-Journey SLAs
**Risk:** In multi-journey runs, teams may apply generic thresholds instead of journey-specific SLAs.

**Impact:**
- misleading pass/fail results
- hidden bottlenecks in critical journeys

**Mitigation:**
- register SLAs by journey
- resolve thresholds per generated scenario
- report SLA breaches separately per journey

---

## 9. Implementation Phases

---

### Phase 1 – Foundation

> **Goal:** Stand up the skeleton of the framework so that a single user journey can be authored by hand, configured through JSON/YAML, and executed through a basic CLI command. This phase produces no scripts from recordings — it establishes the runtime that all later phases depend on.

#### Config Layer (`ConfigurationManager`, `EnvResolver`, `SchemaValidator`)

**Approach:**
- Start by defining the TypeScript interfaces/contracts for every configuration shape — environment config, runtime settings, test plan, and `.env` secrets.
- Implement `EnvResolver` first to load `.env` using a library like `dotenv` and expose typed accessors.
- Build `ConfigurationManager` to merge configs in the documented precedence order (framework defaults → environment → runtime → suite → CLI → `.env`). Each layer **overrides** only the keys it explicitly sets.
- Implement `SchemaValidator` using a JSON Schema validation library (e.g., `ajv`) to validate test plans and runtime settings against their contracts at startup.
- Write deterministic unit-level checks (schema pass/fail, merge order correctness).

#### ScenarioBuilder (`ScenarioBuilder`, `WorkloadModels`, `ExecutorFactory`, `TestPlanLoader`)

**Approach:**
- Define the test plan JSON/YAML schema first — this is the **input contract** for the entire orchestration layer.
- Implement `TestPlanLoader` to parse and validate the plan file.
- Build `WorkloadModels` as a set of pure functions that translate high-level profiles (stress, load, soak, spike, iteration) into k6-native `stages` and executor configs.
- Implement `ScenarioBuilder` to consume a loaded test plan and produce a complete `options.scenarios` object that k6 can accept.
- `ExecutorFactory` maps model names (e.g., `"ramping-vus"`, `"constant-arrival-rate"`) to their k6 executor configurations.

#### ParallelExecutionManager (`ParallelExecutionManager`, `JourneyAllocator`)

**Approach:**
- Build `JourneyAllocator` first — a pure function that takes a list of journeys with weights and a total-VU count, and returns per-journey VU allocations. Include guard checks to ensure allocations never exceed the total.
- Build `ParallelExecutionManager` to wire up the allocations into `options.scenarios`. It consults `execution_mode` (`parallel`, `sequential`, `hybrid`) and delegates to `ScenarioBuilder`.
- Add safety validations: total VUs must not exceed a configurable ceiling, and every journey must receive at least 1 VU.

#### DataFactory and DataPoolManager

**Approach:**
- Implement `DataFactory` to load CSV (via `papaparse` or similar) and JSON files into k6-compatible `SharedArray` structures.
- Build `DataPoolManager` to own the lifecycle of loaded data — assigning rows to VUs, tracking consumption, and enforcing the configured overflow strategy (`terminate`, `cycle`, `continue_with_last`).
- Add `DataValidator` as a pre-run check that scans data files for blank rows, missing required columns, and row-count vs VU-count mismatches.
- Expose `DynamicValueFactory` with built-in helpers: `timestamp(format)`, `uuid()`, `randomInt(min, max)`, `randomString(length)`.

#### CLI init and run (`cli/init.ts`, `cli/run.ts`)

**Approach:**
- Package the CLI using a lightweight command framework (e.g., `yargs` or `commander`).
- `init` subcommand scaffolds the project folder structure: `/config`, `/tests`, `/data`, `/recordings`, `/results`, and drops in sample files (example test plan, runtime settings, sample journey).
- `run` subcommand accepts `--plan`, `--env`, and optional override flags. Internally it invokes `ConfigurationManager` → `Gatekeeper` → `ScenarioBuilder` → spawns the k6 process with the resolved options.

#### Gatekeeper Validation (`GatekeeperValidator`)

**Approach:**
- Implement as a **pre-flight checklist** that runs after config merge but before k6 is invoked.
- Checks include: required environment variables present, test plan schema valid, data files exist and pass validation, scenario VU totals within limits, at least one journey defined.
- On failure, produce a structured error report listing every failed check — not just the first one — so the user can fix all issues in one pass.

---

### Phase 2 – Productivity

> **Goal:** Enable script generation from recordings, apply runtime behavior controls, and introduce SLA governance. After this phase the framework can ingest a HAR file and produce an executable test script, run it with configurable runtime behavior, and validate results against SLAs.

#### HAR Parser (`HARParser`)

**Approach:**
- Parse HAR JSON (spec v1.2) and extract the `log.entries` array.
- Normalize each entry into an internal `HAREntry` type containing: URL, method, headers, body, response status, response body, `pageref`, timestamp, and MIME type.
- **HAR File Refinement Workflow:**
  1. **Domain Filtering** — Prompt (or accept via CLI flag) the list of target domains. Strip all entries whose host does not match. This removes CDN calls, analytics beacons, third-party scripts, and other noise.
  2. **Static Asset Removal** — Optionally exclude requests for images, fonts, CSS, JS, and other static resources by MIME type or file extension, controlled by a CLI flag (`--include-static=false` by default).
  3. **Unstable Header Stripping** — Remove headers that change every replay and add no test value (e.g., `x-request-id`, `x-correlation-id`, `traceparent`, cache-control timestamps). Allow users to extend the strip list via config.
  4. **Cookie / Token Sanitization** — Mask or remove sensitive cookie values and auth tokens from the raw HAR before they are baked into scripts. Insert correlation placeholders instead.
  5. **Duplicate / Redirect Collapsing** — Detect and remove duplicate sequential requests and collapse redirect chains (301/302) into single logical requests.
  6. **Entry Sorting** — Ensure entries are sorted by `startedDateTime` to guarantee correct sequential replay.
  7. **Validation Pass** — After refinement, validate that the remaining entries form a coherent flow (at least one entry per `pageref`, no orphaned correlations).

#### Script Generator (`ScriptGenerator`)

**Approach:**
- Consume refined `HAREntry[]` and produce a TypeScript k6 test file.
- Map each unique `pageref` to a `group()` block (transaction).
- Within each group, emit `http.request()` calls with method, URL, headers, and body.
- Apply default 2xx status checks to every request via `check()`.
- Insert `sleep()` calls between transaction groups using the configured default think time.
- Annotate every request with its source HAR entry ID (`// har_entry: "log_R01"`) for traceability.
- Insert `// TODO: PARAMETERIZE` and `// TODO: CORRELATE` markers at points where dynamic values are detected (e.g., tokens in headers, session IDs in URLs).
- Structure the output using the `init` → `action` → `teardown` lifecycle.

#### Domain Filtering (`DomainFilter`)

**Approach:**
- Accept a whitelist of domain patterns (glob or regex).
- Filter `HAREntry[]` in-place, returning only entries whose request URL host matches at least one pattern.
- Log filtered-out domains with counts so the user can verify nothing important was removed.

#### Transaction Grouping and Trend Tracking (`TransactionGrouper`)

**Approach:**
- Group entries by `pageref` value from the HAR.
- Each group becomes a named transaction (k6 `group()`).
- If `pageref` values are missing or identical, fall back to grouping by navigation-level entries detected by `Referer` header changes or content-type heuristics.
- **Transaction Trend Tracking (LoadRunner-style):**
  - For every transaction group, automatically create a **k6 `Trend` metric** named `txn_<transaction_name>` that records the end-to-end duration of the entire transaction (all requests within the group), not just individual request times.
  - This mirrors LoadRunner's behavior where each transaction has its own response-time trend visible in Analysis, enabling:
    - per-transaction P90/P95/P99 percentiles
    - per-transaction min/max/avg/median
    - per-transaction charting in Grafana or any downstream dashboard
  - Wrap each `group()` block with timing instrumentation:
    ```ts
    const txnTrend = new Trend('txn_Login');
    group('Login', function () {
      const start = Date.now();
      // ... requests ...
      txnTrend.add(Date.now() - start);
    });
    ```
  - The `ScriptGenerator` will emit these `Trend` declarations automatically for every transaction group.
  - This data feeds into the reporting layer (Phase 3) and enables LoadRunner-style transaction analysis dashboards.

#### RuntimeConfigManager

**Approach:**
- Load `runtime-settings.json` and expose typed accessors for think time, pacing, iteration behavior, HTTP timeouts, error behavior, and k6 options.
- Merge runtime settings into the resolved config via `ConfigurationManager`.
- Expose helpers that test scripts call at runtime: `applyThinkTime()`, `applyPacing()`, `getTimeout()`.

#### SLARegistry and ThresholdManager

**Approach:**
- `SLARegistry` provides a fluent API to register SLA definitions per journey, transaction, or endpoint: `SLARegistry.register("checkout", { p95: 500, errorRate: 1 })`.
- `ThresholdManager` reads the registry and translates registered SLAs into k6-native `thresholds` entries inside `options`.
- Support both global thresholds and per-scenario thresholds using k6's `{ thresholds: { 'http_req_duration{scenario:checkout}': ['p(95)<500'] } }` syntax.
- Include automatic transaction-level thresholds using the `Trend` metrics created by `TransactionGrouper` (e.g., `txn_Login: ['p(95)<3000']`).

---

### Phase 3 – Enterprise Control

> **Goal:** Add automated correlation, debugging/diff analysis, and production-grade reporting integrations. After this phase, scripts can self-correlate dynamic values, incorrect replays can be diagnosed through diff reports, and test results flow into dashboards and databases.

#### CorrelationEngine (`CorrelationEngine`, `RuleProcessor`, `ExtractorRegistry`, `FallbackHandler`)

**Approach:**
- Define correlation rules in a JSON/YAML config file. Each rule specifies: variable name (`c_` prefix), extraction type (`regex` | `jsonpath` | `header`), extraction pattern, source scope (body/header), and fallback behavior.
- `RuleProcessor` loads and validates all rules at startup.
- `ExtractorRegistry` provides a pluggable set of extractors. Start with regex, JSONPath, and header extractors. New types can be registered without modifying the engine.
- `CorrelationEngine` hooks into the HTTP response pipeline (via k6's `handleSummary` or response interceptors) and applies matching rules to extract values into a shared correlation store.
- `FallbackHandler` executes the configured behavior when extraction fails: use default value, skip dependent request with logged warning, or fail the test if the rule is marked `critical`.
- The correlation store is VU-scoped to avoid cross-VU contamination.

#### Debug Diff Tool (`ReplayRunner`, `DiffChecker`, `HTMLDiffReporter`)

**Approach:**
- `ReplayRunner` executes a generated script in single-iteration debug mode, capturing full request/response payloads for every step.
- `DiffChecker` aligns replayed requests against original HAR entries using the `har_entry` annotation. For each pair, it computes:
  - Header diff (added/removed/changed headers)
  - Body diff (structural and value differences)
  - Status code comparison
  - Match score percentage
- `HTMLDiffReporter` renders the diff results into an interactive HTML report:
  - Grouped by transaction
  - Color-coded (green = match, yellow = informational diff, red = critical diff)
  - Expandable side-by-side panels
  - Summary table with pass/fail per transaction
- Support ignore rules for expected dynamic fields (timestamps, request IDs) to reduce noise.

#### Reporting Hooks (`GrafanaReporter`, `AzureReporter`, `CustomUploader`, `ResultTransformer`)

**Approach:**
- Define an internal `ResultContract` TypeScript interface that all reporters consume. This decouples the framework from any specific dashboard or database.
- `ResultTransformer` converts k6's raw output (JSON or CSV summary) into the `ResultContract` shape.
- `GrafanaReporter` pushes metrics to InfluxDB or Prometheus via their respective write APIs.
- `AzureReporter` pushes to Azure Application Insights or Azure SQL.
- `CustomUploader` is a generic HTTP poster — users configure the endpoint and auth, and it sends the `ResultContract` payload.
- All reporters are toggled on/off via config. Multiple reporters can run simultaneously.

#### Journey-Level SLA Reporting

**Approach:**
- Extend the `ThresholdManager` to capture per-journey SLA pass/fail results after test completion.
- Generate a structured SLA report (JSON + optional HTML) showing:
  - Each journey's registered SLAs
  - Actual metric values vs thresholds
  - Pass/fail verdict per journey
  - Transaction-level `Trend` metric results (P90, P95, P99, avg)
- This report is consumed by the reporters for dashboard display.

---

### Phase 4 – Advanced Capability

> **Goal:** Layer in AI-powered intelligence and advanced analytics. These are optional, toggleable features that enhance the framework but are never required for core operation.

#### AI Integration (`AIClient`, `AIFeatureToggle`, `PromptTemplates`)

**Approach:**
- `AIFeatureToggle` reads a single config flag (`ai.enabled: true/false`) and provides a guard that short-circuits all AI calls when disabled.
- `AIClient` is a thin HTTP wrapper supporting OpenAI, Azure OpenAI, and custom MCP server backends. Connection details come from config/`.env`.
- `PromptTemplates` stores versioned prompt templates for each AI use case. Templates are stored as files, not hardcoded strings, so they can be tuned without code changes.
- First use case: **AI-assisted correlation** — after script generation, feed the HAR entries and generated script to the AI to suggest additional correlation candidates.
- Non-AI fallback always remains available via the rule-based `CorrelationEngine`.

#### Anomaly Detection

**Approach:**
- Post-test, feed the `ResultContract` data (including transaction `Trend` metrics) into an anomaly detection pipeline.
- Start with statistical methods (Z-score, IQR-based outlier detection) that require no AI backend.
- Optionally enhance with AI-based pattern recognition if the AI toggle is enabled.
- Output: annotated results highlighting anomalous transactions with severity (info/warning/critical).

#### Trend Analysis

**Approach:**
- Compare current test run results against historical baselines stored from previous runs.
- Track per-transaction trend metrics over time: P95 response time, error rate, throughput.
- Detect performance regressions or improvements across builds/releases.
- Output: trend report showing metric deltas and directional indicators (↑ degradation / ↓ improvement / → stable).
- Storage: historical data can be persisted in a local JSON store or pushed to the configured reporting backend.

#### Expanded Replay Intelligence

**Approach:**
- Enhance the `DiffChecker` with AI-powered diff classification — instead of just structural comparison, use AI to explain *why* a diff occurred (e.g., "session expired", "data mismatch", "server-side change").
- Auto-suggest fixes for common replay failures (e.g., "add correlation for `c_sessionId` extracted from response header `Set-Cookie`").
- Provide confidence scores for each suggestion.
- This is strictly additive — the base diff tool from Phase 3 remains fully functional without AI.

---

### 9.5 Minimum Phase Required to Start Executions

> [!IMPORTANT]
> **Phase 1 (Foundation) must be fully complete** to start executing any manually authored test scripts against the framework. Phase 1 gives you:
> - Configuration loading and validation
> - Scenario orchestration (load profiles, workload models)
> - Parallel/sequential/hybrid execution
> - Data management (parameterization, data pools)
> - CLI to initialize projects and trigger runs
> - Gatekeeper pre-flight checks
>
> **Phase 2 (Productivity) is needed for HAR-based workflow** — i.e., generating scripts from recordings, applying runtime controls (think time, pacing), and validating against SLAs. However, within Phase 2, the **HARParser, ScriptGenerator, DomainFilter, and TransactionGrouper** are only needed if you want to generate scripts from recordings. You can start running manually written scripts after Phase 1 alone.
>
> **Practical recommendation:** Complete **Phase 1 fully** and at minimum the **RuntimeConfigManager + SLARegistry/ThresholdManager** from Phase 2 before the first real execution. This ensures you have runtime behavior controls and SLA validation from day one. The recording/generation components from Phase 2 can follow immediately after.

---

## 10. Final Summary

This framework should evolve k6 from a collection of scripts into a structured performance engineering platform.

### What it now explicitly includes
- decoupled architecture
- contract-based development
- hierarchical configuration
- controlled parallel execution
- scenario orchestration
- data lifecycle management
- centralized correlation
- HAR-based generation
- replay debugging
- SLA governance
- reporting hooks
- optional AI integration
- CLI-based portability

### Final design intent
The framework must be:
- reusable
- portable
- governed
- scalable
- debuggable
- enterprise-ready
