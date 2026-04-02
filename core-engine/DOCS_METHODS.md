# Core Engine Method Documentation

## 📄 assertions\JourneyAssertionResolver.ts

### 🏷️ Class: `JourneyAssertionResolver`
| Method / Property | Description |
| :--- | :--- |
| `printReport()` | Evaluates the k6 end-of-test summary statistics and prints a human-readable pass/fail report based on journey-level SLAs. |


---

## 📄 assertions\SLARegistry.ts

### 🏷️ Class: `SLARegistry`
| Method / Property | Description |
| :--- | :--- |
| `register()` | Register an SLA for a specific execution scenario or transaction. Prefix transaction target names with 'txn_'. |
| `get()` | *No description provided* |
| `getAll()` | *No description provided* |


---

## 📄 assertions\ThresholdManager.ts

### 🏷️ Class: `ThresholdManager`
| Method / Property | Description |
| :--- | :--- |
| `apply()` | Applies SLA configuration from the TestPlan globally and from the SLARegistry per journey/transaction. Translates SLA targets into k6-native thresholds. |


---

## 📄 cli\convert.ts

| Function | Description |
| :--- | :--- |
| `runConvert()` | CLI handler for the `convert` command. Converts a conventional k6 script into a framework-compatible script with `logExchange()` calls, request definition objects, and transaction wrappers. Writes output to `scrum-suites/<team>/tests/<name>.js` or overwrites input with `--in-place` flag. |

---

## 📄 cli\generate-byos.ts

| Function | Description |
| :--- | :--- |
| `runGenerateByos()` | *No description provided* |

---

## 📄 cli\generate.ts

| Function | Description |
| :--- | :--- |
| `runGenerate()` | *No description provided* |

---

## 📄 cli\init.ts

| Function | Description |
| :--- | :--- |
| `runInit()` | *No description provided* |
| `writeIfNotExists()` | *No description provided* |

---

## 📄 cli\run.ts

Main CLI entry point using `commander`. Registers all commands: `init`, `generate-byos`, `convert`, `generate`, `validate`, `debug`, `run`. Orchestrates test plan loading, config resolution, gatekeeper validation, scenario building, and k6 execution. Debug mode runs `ReplayRunner.runDebug()` per journey with `K6_PERF_DEBUG=true` env var.

---

## 📄 cli\validate.ts

| Function | Description |
| :--- | :--- |
| `runValidate()` | *No description provided* |

---

## 📄 config\ConfigurationManager.ts

### 🏷️ Class: `ConfigurationManager`
| Method / Property | Description |
| :--- | :--- |
| `resolve()` | Load and merge all config layers, returning a fully resolved config. Throws descriptively if any required piece is missing or schema-invalid. |
| `loadTestPlan()` | *No description provided* |
| `loadEnvironmentConfig()` | *No description provided* |
| `loadRuntimeSettings()` | *No description provided* |
| `readJsonFile()` | *No description provided* |
| `deepMerge()` | Recursive deep merge – source keys override target keys. |
| `printResolvedConfig()` | *No description provided* |


---

## 📄 config\EnvResolver.ts

### 🏷️ Class: `EnvResolver`
| Method / Property | Description |
| :--- | :--- |
| `require()` | Get a required string variable. Throws if missing. |
| `get()` | Get an optional string variable with a fallback default. |
| `getBool()` | Get an optional boolean variable ('true'/'false'/'1'/'0'). |
| `getNumber()` | Get an optional numeric variable. |
| `getAll()` | Expose all resolved vars (for debug printing – caller should redact secrets). |


---

## 📄 config\GatekeeperValidator.ts

### 🏷️ Class: `GatekeeperValidator`
| Method / Property | Description |
| :--- | :--- |
| `validate()` | Run the full pre-flight checklist. Returns a `GatekeeperResult { passed, failures[], warnings[] }` — never throws; caller decides how to handle failures. Checks: env config exists, scripts exist via PathResolver, weights sum to ≤100, recording logs exist (enforces `failOnMissingRecordingLog` — when `true` and missing, adds failure; when `false`, adds warning), data dirs present, hybrid config valid. |
| `printResult()` | Print the result to console using color-coded `Logger.header()`, `Logger.pass()`, `Logger.fail()`, `Logger.warning()`, `Logger.bullet()`. Returns the same result for chaining. |
| `estimateRequestedVUs()` | Estimates total requested VUs from the test plan for data validation row-count checks. |


---

## 📄 config\RuntimeConfigManager.ts

### 🏷️ Class: `RuntimeConfigManager`
| Method / Property | Description |
| :--- | :--- |
| `getThinkTimeSeconds()` | Returns the think time in seconds to apply between transactions. When mode = 'random', returns a value in [min, max]. |
| `isPacingEnabled()` | *No description provided* |
| `getPacingIntervalMs()` | *No description provided* |
| `getTimeoutMs()` | *No description provided* |
| `getMaxRedirects()` | *No description provided* |
| `shouldThrowOnError()` | *No description provided* |
| `getErrorBehavior()` | *No description provided* |
| `isDebugMode()` | *No description provided* |
| `dump()` | Return all settings (useful for logging) |


---

## 📄 config\SchemaValidator.ts

### 🏷️ Class: `SchemaValidator`
| Method / Property | Description |
| :--- | :--- |
| `validateRuntime()` | *No description provided* |
| `validatePlan()` | *No description provided* |
| `runValidation()` | *No description provided* |


---

## 📄 correlation\CorrelationEngine.ts

### 🏷️ Class: `CorrelationEngine`
| Method / Property | Description |
| :--- | :--- |
| `process()` | Process an HTTP response, attempting to extract metrics matching the rules. |
| `get()` | Safe retrieval of an extracted token. |
| `dump()` | Dump all values (useful for debugging). |


---

## 📄 correlation\ExtractorRegistry.ts

### 🏷️ Class: `ExtractorRegistry`
| Method / Property | Description |
| :--- | :--- |
| `register()` | *No description provided* |
| `get()` | *No description provided* |


---

## 📄 correlation\FallbackHandler.ts

### 🏷️ Class: `FallbackHandler`
| Method / Property | Description |
| :--- | :--- |
| `handle()` | Executes the appropriate fallback strategy when correlation extraction fails. |


---

## 📄 correlation\RuleProcessor.ts

### 🏷️ Class: `RuleProcessor`
| Method / Property | Description |
| :--- | :--- |
| `loadRules()` | Load JSON correlation rules from a specified file path. |


---

## 📄 data\DataFactory.ts

### 🏷️ Class: `DataFactory`
| Method / Property | Description |
| :--- | :--- |
| `loadCSV()` | Load a CSV file into an array of row objects. First row is treated as header. Supports quoted fields and comma-separated values. |
| `loadJSON()` | Load a JSON array file. |
| `load()` | Auto-detect file type and load accordingly. |
| `parseCSVRow()` | Parse a single CSV row respecting quoted fields |
| `coerceValue()` | Attempt to coerce a string cell value to a native type |


---

## 📄 data\DataPoolManager.ts

### 🏷️ Class: `DataPoolManager`
| Method / Property | Description |
| :--- | :--- |
| `registerPool()` | Register a data pool by name. |
| `getRowForVU()` | Get a data row for a specific VU. @param poolName  Name of the registered pool @param vuIndex   0-based VU index (use __VU - 1 in k6 scripts) |
| `getRowForIteration()` | Get an iteration-based row (use __ITER in k6 scripts). Each iteration of a VU gets the next row in sequence. @param poolName   Name of the registered pool @param vuIndex    0-based VU index (__VU - 1) @param iteration  0-based iteration index (__ITER) |
| `getPoolStats()` | Get pool statistics (for logging / validation). |
| `listPools()` | List all registered pool names |
| `resolveIndex()` | *No description provided* |


---

## 📄 data\DataValidator.ts

### 🏷️ Class: `DataValidator`
| Method / Property | Description |
| :--- | :--- |
| `validateCSV()` | Validate a CSV data file. @param filePath  Path to the CSV file @param requiredColumns  Column names that must be present and non-empty in every row @param expectedMinRows  Minimum row count required (e.g. VU count) |
| `validateJSON()` | Validate a JSON array data file. |
| `printResult()` | Print a validation result to console |


---

## 📄 data\DynamicValueFactory.ts

### 🏷️ Class: `DynamicValueFactory`
DynamicValueFactory.ts Phase 1 – Built-in helpers for common dynamic data needs. These are pure, stateless utility functions usable in any script.

| Method / Property | Description |
| :--- | :--- |
| `timestamp()` | Generate a timestamp string in a specified format. Tokens: YYYY, MM, DD, HH, mm, ss, ms Example: timestamp('YYYY-MM-DD_HH-mm-ss') -> '2026-03-21_14-30-00' |
| `uuid()` | Generate a UUID v4 (random). Does not require external libraries — uses crypto.randomUUID when available. |
| `randomInt()` | Generate a random integer between min and max (inclusive). |
| `randomString()` | Generate a random alphanumeric string of a given length. |
| `randomEmail()` | Generate a random email address with a given prefix and domain. Example: randomEmail('testuser', 'example.com') -> 'testuser_a3k2@example.com' |
| `randomPhone()` | Generate a random phone number string matching a pattern. '#' characters are replaced with random digits. Example: randomPhone('+44 07### ######') -> '+44 07123 456789' |
| `pickRandom()` | Pick a random element from an array. |
| `epochMs()` | Epoch timestamp in milliseconds. |
| `epochSecs()` | Epoch timestamp in seconds. |


---

## 📄 debug\DiffChecker.ts

### 🏷️ Class: `DiffChecker`
| Method / Property | Description |
| :--- | :--- |
| `compare()` | Compares a single replayed request against the original HAR entry. Returns a `DiffResult` with method/URL/status match flags, header diffs, body similarity (Levenshtein), and composite match scores. |
| `compareBatch()` | Compares arrays of original and replay entries with fallback matching. Tries ID-based match first, then URL-based, then positional index. |
| `compareTaggedLogs()` | Iteration-grouped comparison of recording logs vs replay logs. Groups replay entries by iteration, matches against recorded entries by ID with positional fallback, handles missing recordings (replay-only mode). Detects redirect mismatches (recording 302 vs replay 200) and adjusts scoring to avoid penalizing k6's redirect-following behaviour. |


---

## 📄 debug\HTMLDiffReporter.ts

### 🏷️ Class: `HTMLDiffReporter`
| Method / Property | Description |
| :--- | :--- |
| `generateReport()` | Generates a self-contained interactive HTML report from DiffChecker results. Features: modern UI with Tailwind-inspired color palette, dark hero section with stat cards, frosted glass sticky navigation bar with score badge, iteration selector, color-coded request cards (green/amber/red by score), expandable accordions for headers and body comparison, redirect warning banners for 302→200 mismatches, search system with scope filtering (All/URL/Request Body/Response Body/Headers) + next/prev navigation + keyboard shortcuts (Ctrl+F, Enter, Escape), clickable Transaction Timing and Request Timing summary tables that scroll to detail sections via `scrollToElement()`, variable events panel, responsive mobile layout. |


---

## 📄 debug\ReplayRunner.ts

### 🏷️ Class: `ReplayRunner`
| Method / Property | Description |
| :--- | :--- |
| `runDebug()` | Full debug replay workflow: resolves recording log (explicit → `.recording-index.json` registry → expected path → fuzzy name match) → executes k6 via PipelineRunner with 1 VU, 1 iteration, `K6_PERF_DEBUG=true` env var, captureOutput=true → extracts `[k6-perf][replay-log]` JSON entries from stdout/stderr/file outputs → DiffChecker.compareTaggedLogs() compares recording vs replay → HTMLDiffReporter generates interactive report. Handles base64 body decoding, replay-only mode (missing recording log produces report with "No data" on recorded side). |


---

## 📄 execution\JourneyAllocator.ts

### 🏷️ Class: `JourneyAllocator`
| Method / Property | Description |
| :--- | :--- |
| `allocate()` | Distribute `totalVUs` across journeys based on their weight property. Falls back to equal distribution if no weights are defined. Rules: - Every journey gets at least 1 VU. - Rounding remainder goes to the highest-weight journey. - Explicit vus override on a journey takes priority over weight. |
| `printTable()` | Print allocation table to console |


---

## 📄 execution\ParallelExecutionManager.ts

### 🏷️ Class: `ParallelExecutionManager`
| Method / Property | Description |
| :--- | :--- |
| `resolve()` | Resolve the full k6 options object from a test plan. Handles VU allocation for parallel weighted journeys. |
| `extractMaxVUs()` | Extract the peak VU count from the global load profile. Used for weight-based proportional distribution. |
| `scaleProfileToVUs()` | Scale a load profile's VU count to the allocated amount. Preserves stage ratios for ramping profiles. |


---

## 📄 execution\PipelineRunner.ts

### 🏷️ Class: `PipelineRunner`
| Method / Property | Description |
| :--- | :--- |
| `run()` | Execute k6 with the given options. Writes options.scenarios to a temp config snippet and passes it via --config. |


---

## 📄 index.ts

*No classes or methods detected or file mostly contains types/interfaces.*

---

## 📄 recording\DomainFilter.ts

### 🏷️ Class: `DomainFilter`
| Method / Property | Description |
| :--- | :--- |
| `filter()` | Filter HAR entries by allowed output domains. Supports substring matching. |


---

## 📄 recording\HARParser.ts

### 🏷️ Class: `HARParser`
| Method / Property | Description |
| :--- | :--- |
| `parse()` | Parse a HAR file, extract internal entry models, and perform the 7-step refinement. |


---

## 📄 recording\ScriptGenerator.ts

### 🏷️ Class: `ScriptGenerator`
| Method / Property | Description |
| :--- | :--- |
| `generate()` | Generates formatted TypeScript/JavaScript source code based on Transaction Groups. |


---

## 📄 recording\TransactionGrouper.ts

### 🏷️ Class: `TransactionGrouper`
| Method / Property | Description |
| :--- | :--- |
| `group()` | Group HAR entries by 'pageref' to define transaction boundaries. If 'pageref' is missing, it creates fallback groups to ensure everything is captured. |


---

## 📄 recording\ScriptConverter.ts

### 🏷️ Class: `ScriptConverter`
Converts conventional k6 scripts (Grafana k6 Studio, raw HAR exports, hand-written) into framework-compatible scripts with `logExchange()`, request definition objects, and `initTransactions/startTransaction/endTransaction` wrappers.

| Method / Property | Description |
| :--- | :--- |
| `convertFile()` | Read a script file from disk and return the converted source string. |
| `convert()` | Convert a raw k6 script string to a framework-compatible script. Handles two input patterns: **Pattern A** (Studio scripts with `Trend`, `group()`, manual `Date.now()` timing — strips Trend boilerplate, adds transaction wrappers) and **Pattern B** (semi-framework scripts with transaction helpers but no `logExchange`). Uses dual counters: `requestCounter` (per-group, for `request_N`/`res_N` variable names) and `globalRequestId` (globally sequential across all groups, for `id`/`har_entry_id`). Preserves original `// har_entry: req_N` IDs when present. Idempotent — re-converting a framework script returns it unchanged. |


---

## 📄 reporters\AzureReporter.ts

### 🏷️ Class: `AzureReporter`
| Method / Property | Description |
| :--- | :--- |
| `push()` | Simulates pushing transformed results to Azure Application Insights. |


---

## 📄 reporters\CustomUploader.ts

### 🏷️ Class: `CustomUploader`
| Method / Property | Description |
| :--- | :--- |
| `push()` | Simulates a generic HTTP POST webhook uploader for custom analytic backends. |


---

## 📄 reporters\GrafanaReporter.ts

### 🏷️ Class: `GrafanaReporter`
| Method / Property | Description |
| :--- | :--- |
| `push()` | Simulates pushing transformed results to an InfluxDB or Prometheus instance. |


---

## 📄 reporters\ResultTransformer.ts

### 🏷️ Class: `ResultTransformer`
| Method / Property | Description |
| :--- | :--- |
| `transform()` | Transforms raw k6 summary JSON into a standardized ResultContract payload. |


---

## 📄 scenario\ExecutorFactory.ts

### 🏷️ Class: `ExecutorFactory`
| Method / Property | Description |
| :--- | :--- |
| `validate()` | Validate that the profile has all required fields for its executor type. Returns an array of error strings (empty = valid). |
| `build()` | Build a k6-compatible executor config from a GlobalLoadProfile. Validates required fields first. |
| `listSupported()` | Return human-readable descriptions of all supported executors. |


---

## 📄 scenario\ScenarioBuilder.ts

### 🏷️ Class: `ScenarioBuilder`
| Method / Property | Description |
| :--- | :--- |
| `build()` | Build a k6 options.scenarios map from a test plan. Handles parallel, sequential, and hybrid execution modes. |
| `buildParallel()` | *No description provided* |
| `buildSequential()` | *No description provided* |
| `buildHybrid()` | *No description provided* |
| `sanitizeExecName()` | Sanitize journey name to a valid k6 exec function name |
| `estimateTotalDurationSeconds()` | Estimate total duration of a load profile in seconds |
| `parseDurationToSeconds()` | Parse k6 duration strings: '2m', '30s', '1h30m' |


---

## 📄 scenario\TestPlanLoader.ts

### 🏷️ Class: `TestPlanLoader`
| Method / Property | Description |
| :--- | :--- |
| `load()` | Load and validate a test plan from a JSON file. Throws with a descriptive message on parse failure or schema violations. |


---

## 📄 scenario\WorkloadModels.ts

| Function | Description |
| :--- | :--- |
| `buildLoadProfile()` | Build a standard load test: ramp-up -> steady -> ramp-down |
| `buildStressProfile()` | Build a stress test: aggressive ramp-up, short steady, ramp-down |
| `buildSoakProfile()` | Build a soak test: low steady load for an extended duration |
| `buildSpikeProfile()` | Build a spike test: sudden surge then back to baseline |
| `buildIterationProfile()` | Build a fixed-iteration profile |
| `toK6ExecutorConfig()` | Translate a GlobalLoadProfile into a k6 executor config block |

---

## 📄 types\ConfigContracts.ts

*No classes or methods detected or file mostly contains types/interfaces.*

---

## 📄 types\HARContracts.ts

*No classes or methods detected or file mostly contains types/interfaces.*

---

## 📄 types\TestPlanSchema.ts

*No classes or methods detected or file mostly contains types/interfaces.*

---

## 📄 utils\logger.ts

### 🏷️ Class: `Logger`
Color-coded terminal logger with ANSI support. Respects `NO_COLOR` env var and non-TTY environments.

| Method / Property | Description |
| :--- | :--- |
| `info()` | Logs an informational message (cyan). @param message The message to log. @param context Optional context or metadata to include. |
| `warn()` | Logs a warning message (yellow) to `console.warn`. @param message The message to log. @param context Optional context or metadata to include. |
| `error()` | Logs an error message (red) to `console.error`. @param message The message to log. @param context Optional context or metadata to include. |
| `debug()` | Logs a debug message (magenta). @param message The message to log. @param context Optional context or metadata to include. |
| `pass()` | Color-coded status line: `[PASS]` in bold green. Used for successful operation confirmations. |
| `fail()` | Color-coded status line: `[FAIL]` in bold red to `console.error`. Used for operation failures. |
| `warning()` | Color-coded status line: `[WARN]` in bold yellow to `console.warn`. |
| `detail()` | Dim secondary info line with `>` prefix. Used for supplementary details under pass/fail messages. |
| `header()` | Bold cyan section header with box lines (`====`). Used for CLI command banners. |
| `bullet()` | Colored bullet point (`•`) for list items. Accepts color param: `red`, `yellow`, `green`, `cyan`. |

### Export: `ansi`
| Export | Description |
| :--- | :--- |
| `ansi` | Object with ANSI escape code properties (`reset`, `bold`, `dim`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray`, `bgRed`, `bgGreen`, `bgYellow`). Empty strings when `NO_COLOR` is set or stdout is non-TTY. |


---

## 📄 utils\PathResolver.ts

### 🏷️ Class: `PathResolver`
| Method / Property | Description |
| :--- | :--- |
| `resolve()` | Resolves a script path name. 1. If it's an exact file that exists, returns the absolute path. 2. If it's just a filename (e.g. `browse-journey.js`), deeply searches `scrum-suites` for a match. @param targetPath The path or filename to resolve. @param searchRoot The root directory to search in, defaults to 'scrum-suites'. @returns The resolved absolute path, or null if not found. |
| `recursiveSearch()` | *No description provided* |


---

## 📄 utils\transaction.ts

| Function | Description |
| :--- | :--- |
| `initTransactions()` | Initializes Trends for the specified transactions. Automatically prefixes the trend name with `txn_`. CRITICAL: This MUST be called in the script's init context (global scope), not inside the default function or VU execution context. @param names Array of transaction names |
| `startTransaction()` | Start a transaction (LoadRunner equivalent) @param name Transaction name |
| `endTransaction()` | End a transaction (LoadRunner equivalent) Calculates the duration since startTransaction was called and records it. @param name Transaction name |

---

## 📄 utils\replayLogger.js

k6-side logging module for the debug replay pipeline. Runs inside k6's JavaScript runtime (not Node.js).

| Function | Description |
| :--- | :--- |
| `logExchange()` | Compact debug-only logger. Checks `__ENV.K6_PERF_DEBUG` env var — returns immediately (zero overhead) when not set. Accepts a request definition object `(req)` and k6 response `(res)`, extracts metadata, delegates to `logReplayExchange()`. This is the standard call used in generated/converted scripts. |
| `logReplayExchange()` | Verbose original logger — always outputs `[k6-perf][replay-log]` JSON to console with: `harEntryId`, `transaction`, `iteration`, `vu`, `requestSequence`, `durationMs`, `tags`, `variableEvents`, and full `request`/`response` objects (method, url, headers, queryParams, cookies, body). Used for backward compatibility; `logExchange()` is preferred for new scripts. |
| `createVariableEvent()` | Creates a variable event tracking record: `{ name, type, action, value, source }`. Used to populate the `variableEvents` array in request definition objects for debug diff report tracking (shows which parameterised/correlated values were substituted per request). |

---

