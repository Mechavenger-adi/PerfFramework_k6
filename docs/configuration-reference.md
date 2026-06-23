# K6-PerfFramework Configuration Reference

*(Auto-generated from JSON Schemas)*

## K6-PerfFramework Environment Configuration

Defines target environment settings: base URL, optional service URLs, optional per-team overrides, and custom key-value pairs. The environment name must match the 'environment' field in your test plan. Secrets (API keys, passwords) should go in .env, not here.

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | **Yes** | Logical environment name. Must match the filename (e.g., 'dev' for dev.json). Referenced by the test plan's 'environment' field. Common values: dev, staging, uat, preprod, prod. |
| `testSuites` | object | No | Team-specific environments keyed by the testSuites/<team> folder name. Example: { "retail-ui": { "baseUrl": "https://retail-dev.example.com" } }. |

## K6-PerfFramework Runtime Settings

Controls think time, pacing, HTTP behavior, error handling, reporting, error capture, host monitoring, and debug mode for all test executions. Most fields are optional — sensible defaults are applied by the framework (see FRAMEWORK_DEFAULTS in ConfigContracts.ts).

| Field | Type | Required | Description |
|---|---|---|---|
| `thinkTime` | object | **Yes** | Simulates user think time (pause) between transaction groups. Applied automatically in generated/converted scripts via sleep(getFrameworkThinkTime()). Realistic think times improve load accuracy by mimicking real user behavior. |
| `thinkTime.ignoreThinkTime` | boolean | No | If true, skips think time (sleep) entirely regardless of other settings. |
| `thinkTime.globalOverride` | boolean | No | If true, forces the global think time settings (fixed or random) to override any specific think time values provided in the script. |
| `thinkTime.mode` | enum (fixed \| random) | **Yes** | fixed — constant delay of 'fixed' seconds between every transaction group. random — uniform random delay between 'min' and 'max' seconds. Tip: Use 'random' for realistic production simulations; 'fixed' for deterministic debugging. |
| `thinkTime.fixed` | number | No | Think time in seconds when mode='fixed'. Ignored when mode='random'. Example: 1 = one-second pause between transactions. |
| `thinkTime.min` | number | No | Minimum think time in seconds when mode='random'. Must be less than 'max'. Example: 0.5 = half-second minimum pause. |
| `thinkTime.max` | number | No | Maximum think time in seconds when mode='random'. Must be greater than 'min'. Example: 3 = up to three seconds pause. |
| `pacing` | object | **Yes** | Iteration-level rate control. When enabled, the framework ensures each iteration takes at least 'targetIntervalSeconds' — adding sleep at the end if the iteration finishes early. This prevents VU 'bunching' under light load. Similar to LoadRunner Pacing. |
| `pacing.enabled` | boolean | **Yes** | Enable iteration pacing. When false, VUs start the next iteration immediately after the previous one completes. |
| `pacing.targetIntervalSeconds` | number | No | Target duration in seconds for one complete iteration (init → action → end). If the iteration finishes faster, the remaining time is added as a sleep. Example: 30 = each iteration takes at least 30 seconds. |
| `http` | object | **Yes** | Global HTTP request defaults applied to all k6 HTTP calls. These can be overridden per-request in individual scripts. |
| `http.timeoutSeconds` | number | **Yes** | Global HTTP request timeout in seconds. Requests exceeding this duration are aborted. Tip: Set higher (120+) for API endpoints with heavy processing; lower (10–30) for fast UI pages. |
| `http.maxRedirects` | number | **Yes** | Maximum number of HTTP redirects to follow automatically. Set to 0 to disable redirect following (useful for testing redirect logic explicitly). |
| `http.throwOnError` | boolean | **Yes** | When true, non-2xx HTTP responses throw an exception that triggers the errorBehavior handler. When false, non-2xx responses are silently returned (check status in your script). Tip: Set true for strict testing; false when you need to assert specific error codes. |
| `errorBehavior` | enum (continue \| stop_iteration \| stop_vu \| abort_test) | **Yes** | What happens when an error occurs during script execution. • continue — Log the error and keep running (best for load tests where some errors are expected). • stop_iteration — Skip remaining actions in this iteration, start the next one (good for data-dependent flows). • stop_vu — Terminate this virtual user permanently (strict mode). • abort_test — Halt the entire test immediately (use for critical-path validation). |
| `reporting` | object | No | Controls what appears in the generated RunReport.html and console transaction table. These settings do NOT affect k6's native summary output. |
| `reporting.transactionStats` | array | No | Which statistical columns to show in the transaction metrics table. Common values: count, pass, fail, avg, min, max, p(50), p(75), p(90), p(95), p(97), p(99). Example: ["count", "pass", "fail", "avg", "p(90)", "p(95)"]. |
| `reporting.includeTransactionTable` | boolean | No | Include the transaction metrics matrix in the generated HTML report and console output. |
| `reporting.includeErrorTable` | boolean | No | Include the error summary table in the generated HTML report. |
| `reporting.timeseries` | object | No | Bucketed timeseries data collection for interactive Chart.js graphs in RunReport.html. Produces time-bucketed response time trends, throughput, and error rate charts. |
| `errors` | object | No | Error capture and request/response snapshot settings. When a check() assertion fails, the framework can capture a full snapshot of the HTTP exchange for post-run debugging. |
| `errors.captureSnapshotOnFailure` | boolean | No | When true, failed check() assertions trigger a full request/response snapshot capture. Snapshots are included in the RunReport.html for post-run debugging. |
| `errors.maxSnapshotsPerRun` | number | No | Maximum number of snapshots to capture per test run. Prevents excessive memory/disk usage during high-error-rate tests. Set to 0 to disable snapshot capture entirely. |
| `errors.includeRequestHeaders` | boolean | No | Include HTTP request headers in captured snapshots. |
| `errors.includeRequestBody` | boolean | No | Include HTTP request body in captured snapshots. Disable for privacy-sensitive payloads. |
| `errors.includeResponseHeaders` | boolean | No | Include HTTP response headers in captured snapshots. |
| `errors.includeResponseBody` | boolean | No | Include HTTP response body in captured snapshots. Warning: Can produce large snapshots for HTML/JSON-heavy responses. Enable selectively. |
| `monitoring` | object | No | Runner-side host monitoring. Captures CPU and memory usage of the machine running k6 during the test. Produces warnings if resource usage exceeds thresholds — helps detect when the load generator itself is the bottleneck. |
| `monitoring.enabled` | boolean | No | Enable host resource monitoring during test execution. Adds system metrics to RunReport.html. |
| `monitoring.cpuWarningPercent` | number | No | CPU usage warning threshold (%). If the load generator exceeds this, a warning is generated. Rule of thumb: Keep below 80% to avoid k6 itself becoming the bottleneck. |
| `monitoring.memoryWarningPercent` | number | No | Memory usage warning threshold (%). High memory usage may indicate VU data leaks or excessive snapshot capture. |
| `monitoring.sampleIntervalSeconds` | number | No | How often to sample CPU/memory metrics in seconds. Lower = more data points but slightly more overhead. |
| `debugMode` | boolean | No | Enable debug mode. When true: prints the fully resolved configuration at startup, enables verbose lifecycle logging, and adds extra diagnostic output. Useful for troubleshooting config resolution issues. Should be false in CI/CD pipelines. |

## K6-PerfFramework Test Plan

Defines a complete performance test: which journeys to run, how many VUs, what load profile, SLA thresholds, and execution mode. This is the primary input that drives scenario orchestration.

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | **Yes** | Human-readable name for this test plan. Used in report titles, result folder names, and CI summary output. Example: 'Checkout Flow - Peak Load Test'. |
| `environment` | string | **Yes** | Target environment name. Must match a config file in config/environments/<name>.json. The framework auto-resolves the environment config and injects baseUrl, serviceUrls, and secrets. Examples: dev, staging, uat, prod. |
| `execution_mode` | enum (parallel \| sequential \| hybrid) | **Yes** | How user journeys are orchestrated: • parallel — All journeys run concurrently, VUs distributed by weight. • sequential — Journeys run one after another using startTime offsets. • hybrid — Mix parallel and sequential groups (requires hybrid_groups). Most common: 'parallel' for load tests, 'sequential' for workflow chains. |
| `global_load_profile` | object | **Yes** | Default load profile applied to all journeys unless overridden per-journey. Defines the k6 executor type, VU count, stages, and duration. |
| `global_load_profile.executor` | enum (ramping-vus \| constant-vus \| ramping-arrival-rate \| constant-arrival-rate \| shared-iterations \| per-vu-iterations) | **Yes** | k6 executor type: • ramping-vus — Ramp VUs up/down through stages (most common for load tests). • constant-vus — Fixed VU count for a set duration. • ramping-arrival-rate — Control request rate, not VU count. • constant-arrival-rate — Fixed requests/second. • shared-iterations — Fixed total iterations across all VUs (good for data-driven tests). • per-vu-iterations — Each VU runs a fixed number of iterations. |
| `global_load_profile.startVUs` | number | No | Starting VU count for ramping executors. Usually 0 for a clean ramp-up. Only used with 'ramping-vus' executor. |
| `global_load_profile.stages` | array | No | Ramp stages for 'ramping-vus' executor. Each stage defines a duration and a target VU count. Classic load test pattern: ramp-up → steady state → ramp-down. |
| `global_load_profile.vus` | number | No | Fixed VU count for 'constant-vus', 'shared-iterations', or 'per-vu-iterations' executors. |
| `global_load_profile.duration` | string | No | Test duration for 'constant-vus' or arrival-rate executors. k6 duration string. Examples: '5m', '1h', '30s'. |
| `global_load_profile.iterations` | number | No | Total iterations for 'shared-iterations' or per-VU iterations for 'per-vu-iterations'. For shared-iterations: all VUs share this pool. For per-vu-iterations: each VU runs this many. |
| `user_journeys` | array<object> | **Yes** | List of user journey scripts to include in this test. Each journey maps to a k6 scenario. At least one journey is required. |
| `hybrid_groups` | array<object> | No | Required when execution_mode='hybrid'. Defines groups of journeys that run in parallel or sequential sub-groups. Allows mixing execution patterns within a single test plan. |
| `global_sla` | object | No | Global SLA (Service Level Agreement) thresholds applied to all journeys. These become k6 thresholds on http_req_duration. If any SLA is breached, the test reports a threshold failure. |
| `global_sla.errorRate` | number | No | Maximum allowed error rate in percent (0–100). Example: 5 = test fails if more than 5% of requests error. |
| `global_sla.avgResponseTime` | number | No | Maximum allowed average response time in milliseconds. |
| `global_sla.p50` | number | No | P50 (median) response time threshold in milliseconds. |
| `global_sla.p75` | number | No | P75 response time threshold in milliseconds. |
| `global_sla.p90` | number | No | P90 response time threshold in milliseconds. |
| `global_sla.p95` | number | No | P95 response time threshold in milliseconds. Industry standard for SLAs. |
| `global_sla.p99` | number | No | P99 response time threshold in milliseconds. Captures tail latency. |
| `journey_slas` | object | No | Per-journey SLA overrides keyed by journey name. These apply to the journey's scenario-level http_req_duration metric. Override global_sla for specific journeys that have different performance requirements. |
| `transaction_slas` | object | No | Per-transaction SLA overrides keyed by transaction name (e.g., 'tx01_launch'). These apply directly to the transaction's Trend metric. Use for critical transactions that need tighter thresholds than the journey average. |
| `max_total_vus` | number | No | Safety ceiling for total VU count across all journeys. The gatekeeper pre-flight check blocks execution if the calculated VUs exceed this limit. Use as a guardrail to prevent accidental overload. |
| `debug` | object | No | Debug replay execution settings. When enabled, journeys run in single-VU mode and produce HTML diff reports comparing recorded vs. live HTTP exchanges. Use for validating script correctness before running full load. |
| `debug.enabled` | boolean | No | When true, switches from normal load execution to debug replay mode. Journeys run with minimal VUs/iterations and produce diff reports. |
| `debug.mode` | enum (diff) | No | Debug mode type. Currently only 'diff' (HAR recording vs. live replay comparison) is supported. |
| `debug.autoResolveRecordingLog` | boolean | No | Automatically find the recording log from the journey's suite recordings/ folder. Set false to require explicit recordingLogPath per journey. |
| `debug.vus` | number | No | VU count for debug replay. Usually 1. |
| `debug.iterations` | number | No | Iteration count for debug replay. Usually 1–2. |
| `debug.reportDir` | string | No | Directory for debug replay output (HTML diff reports, replay logs). Defaults to results/debug/. |
| `debug.failOnMissingRecordingLog` | boolean | No | When true, validation fails if any journey lacks a recordingLogPath. When false (default), a warning is issued and the journey runs without diff comparison. |
| `noCookiesReset` | boolean | No | Global cookie persistence setting. • true (default) — Cookies persist across VU iterations (browser-like behavior). • false — Cookie jar is cleared after each iteration. Can be overridden per-journey via journey.noCookiesReset. |

