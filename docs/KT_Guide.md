# K6 Performance Framework: Comprehensive Deep-Dive Guide

Welcome to the detailed deep-dive of the K6 Performance Framework. This guide moves beyond high-level concepts and specifically breaks down the exact files, their core functions, and the code powering the framework. 

As a mentor or a new developer, you should understand that this framework is split into **Node.js Orchestration Code** (which runs strictly before and after the test to manage everything) and **k6 Runtime Code** (which executes inside the k6 engine during the test).

---

## 1. The Config Layer (Node.js Orchestration)

**Location:** `core-engine/src/config/`
**Purpose:** Collects all configurations, merges them, and validates that everything is safe to run.

### `ConfigurationManager.ts`
*   **Purpose:** The central nervous system for settings. It merges framework defaults, specific environment settings (e.g., `dev.json`), runtime settings (like timeouts), and `.env` secrets into one massive `ResolvedConfig` object.
*   **Key Function:** `resolve(testPlan)`
*   **Code Example:**
    ```typescript
    // Under the hood, the engine calls this before starting k6:
    const resolvedConfig = ConfigurationManager.resolve(plan);
    console.log(resolvedConfig.environment.baseUrl); // e.g., "https://test-api.k6.io"
    ```

### `GatekeeperValidator.ts`
*   **Purpose:** The "Pre-flight Checklist". Before launching a massive load test, this file checks if the target scripts actually exist, if the data folders are present, and if the suite weights equal 100%.
*   **Key Function:** `validate(plan, resolvedConfig)`
*   **Why it matters:** It prevents you from waiting 5 minutes for a CI runner to spin up only to find out a typo broke the script path.

---

## 2. The Scenario & Execution Layer (Node.js Orchestration)

**Location:** `core-engine/src/scenario/` & `core-engine/src/execution/`
**Purpose:** Maps human-readable test plans into raw k6 commands and launches the process.

### `ScenarioBuilder.ts` & `WorkloadModels.ts`
*   **Purpose:** Takes our custom JSON profile definitions (like "ramp up to 50 VUs over 10 minutes") and compiles them into strictly formatted k6 `executor` blocks.
*   **Key Function:** `build(plan)` and `toK6ExecutorConfig()`

### `ParallelExecutionManager.ts` & `JourneyAllocator.ts`
*   **Purpose:** If you have a test plan running 3 different scripts (e.g., Homepage 50%, Login 30%, Checkout 20%) with 100 VUs, the `JourneyAllocator` does the math to assign exactly 50 VUs to Homepage, 30 to Login, and 20 to Checkout.

### `PipelineRunner.ts`
*   **Purpose:** The actual trigger. It writes all the resolved configurations to a temporary JSON file and executes Node's `spawnSync` to launch the native `k6 run` binary using that JSON file.
*   **Key Function:** `run(options)`

---

## 3. The Runtime Utilities (k6 Runtime Code)

**Location:** `core-engine/src/utils/`
**Purpose:** These are the TypeScript files imported *directly into your test scripts*. They run thousands of times per second inside the k6 executing engine.

### `lifecycle.ts`
*   **Purpose:** Forces the execution of scripts into three distinct, manageable phases per virtual user iteration: Setup, Action, and Teardown.
*   **Key Function:** `runJourneyLifecycle(initPhase, actionPhase, endPhase)`
*   **Code Example (Inside your Test Script):**
    ```javascript
    import { runJourneyLifecycle } from "../../../dist/utils/lifecycle.js";

    function initPhase(ctx) {
        // Runs once at the start of the VU iteration. Setup user data here.
        ctx.user = { id: 123 }; 
    }
    function actionPhase(ctx) {
        // The timed business logic.
        http.get(`https://api.com/user/${ctx.user.id}`);
    }
    function endPhase(ctx) {
        // Always executes, even if actionPhase crashed. Good for logging out.
    }
    export default function () {
        runJourneyLifecycle(initPhase, actionPhase, endPhase);
    }
    ```

### `transaction.ts`
*   **Purpose:** K6 tracks every single HTTP request by default, but businesses want to track *transactions* (e.g., clicking "Add to Cart" might trigger 5 hidden background HTTP requests). This file bundles requests into a single timed "Trend".
*   **Key Functions:** `startTransaction(name)` and `endTransaction(name)`
*   **Code Example:**
    ```javascript
    import { startTransaction, endTransaction } from "../../../dist/utils/transaction.js";

    startTransaction('tx01_AddToCart');
    http.post('/cart/add', payload);
    http.get('/cart/summary');
    endTransaction('tx01_AddToCart'); 
    // ^ The report will show "tx01_AddToCart" as a single metric combining both requests.
    ```

### `session.ts`
*   **Purpose:** K6 naturally persists cookies across loop iterations (acting like the same user forever). `session.ts` lets us simulate *new* users by wiping the cookie jar programmatically during the `initPhase`.
*   **Key Function:** `clearCookies()` 

---

## 4. The Data & Correlation Layer (Node.js & k6 Runtime)

**Location:** `core-engine/src/data/` & `core-engine/src/correlation/`

### `DataPoolManager.ts`
*   **Purpose:** Ensures different Virtual Users (VUs) don't grab the exact same username/password from your `userdetails.csv` file at the exact same time. It slices the data based on a formula using `__VU` and `__ITER`.
*   **Key Function:** `getRowForIteration(pool, vuIndex, iteration)`

### `CorrelationEngine.ts` & `ExtractorRegistry.ts`
*   **Purpose:** Solves the classic performance testing issue where a server returns a dynamic token (like a CSRF token or Session ID) in Request A, and you must extract it and send it back in Request B.
*   **Code Example:**
    ```javascript
    // The engine automatically extracts values based on Regex/JSONPath rules
    // configured in `correlation-rules.json` and exposes them via trackCorrelation:
    correlation_vars["csrfToken"] = trackCorrelation("csrfToken", res.json().token, "body");
    ```

---

## 5. The Debug & Reporting Layer (Node.js Orchestration)

**Location:** `core-engine/src/debug/` & `core-engine/src/reporting/`
**Purpose:** What happens after k6 finishes executing. This layer aggregates data into human UI dashboards and Jenkins-friendly outputs.

### `ReplayRunner.ts` & `DiffChecker.ts` (Debug Layer)
*   **Purpose:** If a script is failing, you run the framework in `--debug` mode. `ReplayRunner` runs exactly 1 VU. It captures the actual traffic from the server and passes it to `DiffChecker`, which compares the live traffic against the originally recorded `.har` traffic using Levenshtein distance matching.

### `RunReportGenerator.ts`
*   **Purpose:** Computes the massive k6 end-of-test output JSON into the interactive `RunReport.html` using Chart.js.
*   **Key Function:** `generateReport()`

### `ThresholdManager.ts` & `JourneyAssertionResolver.ts`
*   **Purpose:** You define SLAs in your test plan (e.g., `"p95": 800`). `ThresholdManager` converts this to `k6` thresholds (`"tx01_launch": ["p(95)<800"]`). If the test breaches 800ms, the `JourneyAssertionResolver` catches the failed threshold and forces the Node process to `process.exit(99)`, natively failing your CI/CD pipeline.

---

## Summary for the Team
By separating the heavy orchestration (TypeScript) from the load generation (JavaScript/k6), developers only ever need to worry about writing clean HTTP requests in `actionPhase()`. The underlying framework automatically handles data collision, SLA pipeline enforcement, and graphical report generation.
