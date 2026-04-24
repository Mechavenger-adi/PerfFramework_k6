# K6 Performance Framework: Low-Level Engineering Deep Dive

This document is designed for engineers seeking to understand the exact mathematical, architectural, and code-level mechanisms powering the framework. It covers the inner workings of runtime lifecycle management, dynamic data slicing, correlation execution, and process orchestration.

---

## 1. Engine Orchestration & Load Distribution

### The Orchestration Pipeline (`cli/run.ts`)
When `npm run cli -- run --plan config/test-plans/load-test.json` is invoked, the execution strictly follows this synchronously awaited pipeline:

1.  **TestPlanLoader:** Validates the underlying JSON schema strictly using `ajv` (`SchemaValidator.ts`).
2.  **ConfigurationMerge:** `ConfigurationManager.replace()` deep-merges objects in this order (highest priority overwrites): `.env variables` -> `CLI Overrides` -> `Suite/Plan Config` -> `Runtime JSON (e.g. default.json)` -> `Environment JSON (dev.json)` -> `FRAMEWORK_DEFAULTS`. 
3.  **Gatekeeper Check:** Validates that target JS scripts actually physically exist on disk using Node's `fs.existsSync` against the `PathResolver`.
4.  **Parallel Execution Resolution:** Converts our percentage-based VU plans into integer-based k6 options using the `JourneyAllocator.ts` and `ParallelExecutionManager.ts`.
5.  **Spawn k6:** `PipelineRunner.ts` writes a temporary `resolved-options.json` file and executes the binary via `spawnSync('k6', ['run', scriptPath, '--config', tempFile])`.

### Proportional VU Distribution Mathematics (`JourneyAllocator.ts`)
Load tests often demand proportional scaling (e.g., 60% Browse, 40% Checkout running at 2000 total VUs). K6 native executors *require* exact integers for VUs per scenario. 
*   **The Algorithm:** `allocate(journeys, totalVUs)` multiplies the journey weight by the `totalVUs`. Because this results in decimals, it uses `Math.floor()` for safe baseline integers, tracks the total difference (rounding leftovers), and assigns the remainder 1 by 1 sequentially to the highest-weighted scripts until the total strictly equals `totalVUs`.
*   **Result:** Absolute guarantee that no K6 scenario crashes due to floating-point VU allocations or zero-VU assignment errors.

---

## 2. K6 Runtime Lifecycle & Pacing (`lifecycle.ts`)

K6's native loop inherently runs as fast as possible. Our framework enforces an enterprise loop through `runJourneyLifecycle(initPhase, actionPhase, endPhase)`.

### Memory Context Injection 
Inside k6, `lifecycle.ts` initializes a `JourneyLifecycleStore`. This accesses native k6 execution metadata (`exec.vu.idInTest` and `exec.vu.iterationInInstance`).
```typescript
const store = createJourneyLifecycleStore();
store.metrics.iterationStartMs = Date.now();
```

### Try/Catch Phase Execution
The `runJourneyLifecycle` function natively wraps the user scripts to handle errors gracefully based on the `errorBehavior` config.
```typescript
try {
    initPhase(ctx);   // Prepares user parameters / clears cookies.
    actionPhase(ctx); // Core timed transactions.
} catch (err) {
    // If errorBehavior === 'stop_iteration', the catch block returns early 
    // and continues to the endPhase.
    // If 'stop_test', it triggers `test.abort(err.message)`.
    handleError(ctx, err); 
} finally {
    endPhase(ctx); // Guarantees resources logout/cleanup is executed.
    enforcePacingInterval(ctx);
}
```

### Dynamic Pacing Calculation
If pacing is enabled (e.g., target 5000ms per iteration), `enforcePacingInterval` calculates the `actionPhase` execution time. If the action took 2000ms, it executes `sleep(3)` inside k6 to enforce pacing. If the action took 6000ms, it skips the sleep and logs a pacing violation warning.

---

## 3. The Data Slicing Formula (`DataPoolManager.ts`)

Reading massive CSV files dynamically across distributed parallel servers creates collision risks (two concurrent VUs using the exact same username). 

When a K6 script calls `getRowForIteration(pool, vuIndex, iteration)`:
*   **The Formula:** `rowIndex = (vuIndex * 1000) + iteration`
*   This specific offset guarantees that VU #1 parses rows 1000-1999, and VU #2 parses rows 2000-2999, preventing data collisions across the test.
*   **Overflow Handling:** If a VU exceeds its designated bounds or hits the bottom of the CSV, the manager consults `Strategy`. 
    *   `'terminate'` triggers `test.abort()`.
    *   `'cycle'` uses modulo math to seamlessly return back to the first allocated row (`rowIndex % dataSize`).
    *   `'continue_with_last'` caps the index at `dataSize - 1`.

---

## 4. The Correlation Engine (`CorrelationEngine.ts`)

In load testing, dynamic server values (like CSRF tokens) must be extracted and injected programmatically. 

### Extractor Registry Architecture
The engine receives the raw K6 HTTP Response (`K6ResponseLike { status, body, headers, json() }`). 
It passes the response into the `ExtractorRegistry`, which iterates over the defined rules from `correlation-rules.json`.
1.  **JSONPath Extractor:** Uses lodash-style dot notation targeting `response.json().property.deep`.
2.  **Header Extractor:** Safely accesses `response.headers["X-Correlation-ID"]`.
3.  **Regex Extractor:** Executes `new RegExp()`, running `match()[1]` against `response.body`.

### Safe Failover Mechanics (`FallbackHandler.ts`)
If a regex extraction fails:
*   **isCritical=true**: The framework throws a fatal error, which routes into the `Lifecycle` layer's Catch block (aborting the current iteration so downstream requests don't fail cascadingly).
*   **isCritical=false**: It injects the defined `defaultValue` (or an empty string) and securely warns the runtime to continue pushing load.

---

## 5. Reverse Engineering: Debug Replay (`ReplayRunner.ts`)

When execution runs in `--debug` mode (or via `run-debug.ts`), the framework compares live HTTP traffic against what was originally captured during script generation (the `.har` file equivalent: `recording-log.json`).

1.  **The Marker Injection:** K6 script generators wrap requests using `logExchange(req, res)` from `replayLogger.ts`.
2.  **Streaming the Buffer:** As k6 executes natively, `PipelineRunner.ts` buffers standard output (`stdout`) synchronously.
3.  **Identifying Signals:** Once execution completes, Node.js Regex parses the massive buffer searching for `[k6-perf][replay-log] { JSON Payload }`. It extracts these exact payloads out of the noise.
4.  **Mathematical Scoring (`DiffChecker.ts`):** 
    *   Headers are compared via exact string match maps (`missing`, `extra`, `mismatch`).
    *   Bodies are compared via heavily optimized **Levenshtein Distance Algorithms** to produce a literal percentage match (e.g. "Response shape is 98% similar to recording").
5.  **Binary Stripping:** If the engine spots image or font signatures via MIME types in `replayLogger.ts` (`isBinaryContent`), it aggressively transforms the body into `[binary: content-type]` immediately. This explicitly prevents Node.js `JSON.parse()` crashes when 4MB buffer overflows occur from massive binary data streams in debug arrays.

---

## 6. End-Of-Test Assertion Mapping (`ThresholdManager.ts` & `JourneyAssertionResolver.ts`)

K6 operates on strict thresholds block formatting. Human-friendly JSON configurations must be translated.

1.  **The Configuration Map:** 
    ```json
    "transaction_slas": { "tx02_login": { "p95": 1000 } }
    ```
2.  **Translation to K6 Defaults (`ThresholdManager.ts`):** 
    The engine converts the transaction name into a direct K6 Custom Trend reference map:
    ```javascript
    export let options = {
      thresholds: {
        'tx02_login': ['p(95)<1000']
      }
    };
    ```
3.  **Validation (`JourneyAssertionResolver.ts`):**
    After execution, K6 outputs a JSON summary file. The resolver reads `data.metrics['tx02_login'].thresholds['p(95)<1000'].ok`. If `ok === false`, the entire node process exists with status block `99`, forcing the pipeline build runner (Jenkins/GitHub Actions) into an actionable Red Failure state.

---

## 7. The Core Engine (`run.ts`) Line-by-Line Execution Flow

The absolute heartbeat of the orchestration is `core-engine/src/cli/run.ts`. Below is a reverse-engineered simplification of the main `run()` method, broken down line-by-line:

```typescript
// 1. Loading the Test Plan
const testPlan = TestPlanLoader.load(options.plan);
```
* **What happens:** The framework reads the `load-test.json`. It passes the JSON directly into `SchemaValidator.ts` which uses `ajv` to strictly evaluate data types (e.g. verifying `stages` is an array of objects containing `duration` and `target`). If validation fails, it throws a fatal error immediately.

```typescript
// 2. Merging Configuration
const config = ConfigurationManager.resolve(testPlan, cliOptions);
```
* **What happens:** The manager layers configs. It starts with `FRAMEWORK_DEFAULTS`, overlays `environments/dev.json` (or whatever env is set), overlays `testPlan` configs, overlays CLI flags (`--run --data-root`), and finally parses any `.env` secrets using `dotenv`. This yields a massive `ResolvedConfig` object passed everywhere else.

```typescript
// 3. Gatekeeper Pre-flight
const gatekeeperResult = GatekeeperValidator.validate(testPlan, config);
if (!gatekeeperResult.passed) { process.exit(1); }
```
* **What happens:** The Gatekeeper acts defensively. It loops through every script path in the `testPlan.user_journeys` array and checks `fs.existsSync()`. It verifies data directories are reachable, and checks weight distribution logic. Ensures failsafe exit before spinning up expensive VMs.

```typescript
// 4. Threshold & Scenario Resolution 
const k6Options = ParallelExecutionManager.resolve(testPlan);
```
* **What happens:** This is complex logic execution. 
  a) `JourneyAllocator` allocates VUs.
  b) `ThresholdManager` calculates the global/journey SLA metric block (e.g., `['p(95)<2000']`).
  c) `ScenarioBuilder` converts `ramping-vus` profiles into k6 Scenario JSON objects.
  The engine now holds the full JSON object exactly as k6 natively requires it.

```typescript
// 5. Host Monitoring Prep
const monitor = new HostMonitor();
monitor.start();
```
* **What happens:** Captures a system performance snapshot (CPU/memory usages of the load-machine) before massive load generation occurs.

```typescript
// 6. Pipeline Execution
const runResult = PipelineRunner.run({
    script: 'core-engine/src/index.ts', // or direct wrapper script
    options: k6Options,
});
```
* **What happens:** `PipelineRunner` creates a `.k6_options.json` temporary file containing the generated options. It then spawns the Go-based k6 binary mathematically: `spawnSync('k6', ['run', '--config', '.k6_options.json', ...])`. This blocks Node.js synchronously. Native k6 output flows to standard out.

```typescript
// 7. Metric Interception & Artifact Generation
monitor.stop();
const artifacts = ArtifactWriter.writeArtifacts(runResult);
RunReportGenerator.generate(artifacts);
```
* **What happens:** Once `spawnSync` unblocks, k6 drops a massive `summary.json` file. 
  a) The `ArtifactWriter` converts this into smaller files: `ci-summary.json`, `transaction-metrics.json`.
  b) `EventArtifactBuilder` parses standard error to generate `errors.ndjson`.
  c) The `RunReportGenerator` parses the transaction data to render `RunReport.html` locally using HTML grid styling.

```typescript
// 8. Assertions Lifecycle Check
JourneyAssertionResolver.printReport(runResult.metrics);
if (!runResult.assertions.passed) {
   process.exit(99);
}
```
* **What happens:** Finally, it reads the k6 metrics. If any `threshold` metric `ok === false`, it forces the Node process exit to `99`. This is how Jenkins/ADO natively knows the load test passed/failed without parsing logs.
