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
| `pacing` | object | **Yes** | Inter-iteration pacing. When enabled, a sleep is applied at the END of each action phase (between iterations) to control how often a VU starts a new iteration. Mirrors think time's fixed/random modes — but think time spaces transactions within an action, whereas pacing spaces the iterations themselves. Skipped automatically when a VU is in its end window so it does not eat into gracefulRampDown. |
| `pacing.enabled` | boolean | **Yes** | Enable inter-iteration pacing. When false, VUs start the next iteration immediately after the previous one completes. |
| `pacing.mode` | enum (fixed \| random) | No | How the pace duration is derived. 'fixed' uses `fixed` seconds every iteration; 'random' picks a fresh value in [min, max] each iteration. |
| `pacing.fixed` | number | No | Pace in seconds applied between iterations when mode = 'fixed'. Example: 5 = sleep 5s after each iteration's action phase. |
| `pacing.min` | number | No | Minimum pace in seconds (mode = 'random'). |
| `pacing.max` | number | No | Maximum pace in seconds (mode = 'random'). |
| `pacing.targetIntervalSeconds` | number | No | DEPRECATED: legacy fixed pace in seconds. Use `fixed` instead. Still honored as a fallback when `fixed` is absent. |
| `http` | object | **Yes** | Global HTTP request defaults applied to all k6 HTTP calls. These can be overridden per-request in individual scripts. |
| `http.timeoutSeconds` | number | **Yes** | Global HTTP request timeout in seconds. Requests exceeding this duration are aborted. Tip: Set higher (120+) for API endpoints with heavy processing; lower (10–30) for fast UI pages. |
| `http.maxRedirects` | number | **Yes** | Maximum number of HTTP redirects to follow automatically. Set to 0 to disable redirect following (useful for testing redirect logic explicitly). |
| `http.throwOnError` | boolean | **Yes** | When true, non-2xx HTTP responses throw an exception that triggers the errorBehavior handler. When false, non-2xx responses are silently returned (check status in your script). Tip: Set true for strict testing; false when you need to assert specific error codes. |
| `errorBehavior` | enum (continue \| stop_iteration \| stop_vu \| abort_test) | **Yes** | What happens when an error occurs during script execution. • continue — Log the error and keep running (best for load tests where some errors are expected). • stop_iteration — Skip remaining actions in this iteration, start the next one (good for data-dependent flows). In initPhase this is escalated to stop_vu: init runs once per VU, outside the iteration loop, so there is no next init to resume into and the VU would otherwise run actionPhase forever without a completed login. • stop_vu — Terminate this virtual user permanently (strict mode). • abort_test — Halt the entire test immediately (use for critical-path validation). |
| `reporting` | object | No | Controls what appears in the generated RunReport.html and console transaction table. These settings do NOT affect k6's native summary output. |
| `reporting.transactionStats` | array | No | Which statistical columns to show in the transaction metrics table. Common values: count, pass, fail, avg, min, max, p(50), p(75), p(90), p(95), p(97), p(99). Example: ["count", "pass", "fail", "avg", "p(90)", "p(95)"]. |
| `reporting.includeTransactionTable` | boolean | No | Include the transaction metrics matrix in the generated HTML report and console output. |
| `reporting.includeErrorTable` | boolean | No | Include the error summary table in the generated HTML report. |
| `reporting.overrideExistingResults` | boolean | No | When true, debug and load-test reports overwrite a single stable 'Run_latest' output folder each run instead of creating a new timestamped folder. Off by default so run history is preserved. |
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
| `global_load_profile.executor` | enum (ramping-vus \| constant-vus \| ramping-arrival-rate \| constant-arrival-rate \| shared-iterations \| per-vu-iterations) | **Yes** | k6 executor type: • ramping-vus — Ramp VUs up/down through stages (most common for load tests). • constant-vus — Fixed VU count for a set duration. • ramping-arrival-rate — Control request rate, not VU count. • constant-arrival-rate — Fixed requests/second. • shared-iterations — Fixed total iterations across all VUs (good for data-driven tests). • per-vu-iterations — Each VU runs a fixed number of iterations. Note: 'externally-controlled' was removed in k6 v2.0.0 and is no longer accepted. |
| `global_load_profile.startVUs` | number | No | Starting VU count for the 'ramping-vus' executor — the level the ramp begins from. IMPORTANT: k6's default is 1, NOT 0. Omit this and the scenario starts with one VU already running; set it to 0 explicitly for a clean ramp from zero. |
| `global_load_profile.startRate` | number | No | Starting arrival rate for the 'ramping-arrival-rate' executor, in iterations per timeUnit, held before the first stage begins ramping. k6 defaults it to 0, so omitting it means the scenario always ramps up from nothing — set it to hold a floor, or to begin a stage-based rate change from an existing level. |
| `global_load_profile.stages` | array | No | Ramp stages for the 'ramping-vus' and 'ramping-arrival-rate' executors. Each stage defines a duration and a target. Classic load test pattern: ramp-up → steady state → ramp-down. Note what 'target' means differs by executor — VUs for ramping-vus, arrival rate for ramping-arrival-rate. |
| `global_load_profile.vus` | number | No | Fixed VU count for 'constant-vus', 'shared-iterations', or 'per-vu-iterations' executors. |
| `global_load_profile.duration` | string | No | Test duration for 'constant-vus' or arrival-rate executors. k6 duration string. Examples: '5m', '1h', '30s'. Ignored by the iteration executors — they use maxDuration. |
| `global_load_profile.maxDuration` | string | No | Wall-clock cap for 'shared-iterations' and 'per-vu-iterations'. k6 duration string, minimum '1s'. Examples: '30m', '2h'. IMPORTANT: omitting this does NOT mean 'run until all iterations finish' — k6 applies a 10m default and stops the scenario there with iterations unrun. Set it explicitly whenever the iteration pool may take longer than 10 minutes. |
| `global_load_profile.iterations` | number | No | Total iterations for 'shared-iterations' or per-VU iterations for 'per-vu-iterations'. For shared-iterations: all VUs share this pool (and must be >= vus, or some VUs get no work). For per-vu-iterations: each VU runs this many. |
| `global_load_profile.rate` | number | No | Arrival rate for the 'constant-arrival-rate' executor: iterations started per timeUnit, held for the whole duration. Required for that executor. Load is driven by this rate, not by VU count — VUs are just the pool used to service it. |
| `global_load_profile.timeUnit` | string | No | Period the arrival rate is measured over, for both arrival-rate executors. k6 duration string; defaults to '1s'. Example: rate 30 with timeUnit '1m' = 30 iterations per minute. |
| `global_load_profile.preAllocatedVUs` | number | No | VUs initialised up front for the arrival-rate executors, before the test starts. Required for both. Size it for the rate you expect: too few and k6 must allocate mid-test (which costs time and shows up as dropped iterations). |
| `global_load_profile.maxVUs` | number | No | Hard ceiling on VUs an arrival-rate executor may allocate when preAllocatedVUs is not enough to sustain the rate. Must be >= preAllocatedVUs. Defaults to preAllocatedVUs when omitted, meaning NO dynamic allocation — slow responses then surface as dropped iterations rather than extra VUs. |
| `global_load_profile.gracefulRampDown` | string | No | Time k6 waits for an in-flight iteration to finish before removing a VU during ramp-down (ramping-vus / ramping-arrival-rate). k6 duration string, e.g. '30s', '2m'. Defaults to k6's 30s when omitted. Gives endPhase (logout) room to complete before a VU is removed. |
| `global_load_profile.gracefulStop` | string | No | Time k6 waits for in-flight iterations to finish at scenario end before forcibly stopping. Valid on every executor. k6 duration string, e.g. '30s'. Defaults to k6's 30s when omitted. |
| `user_journeys` | array<object> | **Yes** | List of user journey scripts to include in this test. Each journey maps to a k6 scenario. At least one journey is required. |
| `hybrid_groups` | array<object> | No | Required when execution_mode='hybrid'. Defines groups of journeys that run in parallel or sequential sub-groups. Allows mixing execution patterns within a single test plan. |
| `global_sla` | object | No | Global SLA defaults. Use `request` for HTTP-request-level thresholds (http_req_duration / http_req_failed across all requests) and `transaction` for per-transaction defaults applied to EVERY transaction of every journey (overridable per transaction in transaction_slas). Flat percentile/errorRate keys at this level are treated as request-level (legacy shorthand). |
| `global_sla.errorRate` | number | No | Legacy request-level error rate budget in percent (0–100). Prefer global_sla.request.errorRate. |
| `global_sla.avgResponseTime` | number | No | Legacy request-level max average response time (ms). Prefer global_sla.request.avgResponseTime. |
| `global_sla.p50` | number | No | Legacy request-level P50 threshold (ms). |
| `global_sla.p75` | number | No | Legacy request-level P75 threshold (ms). |
| `global_sla.p90` | number | No | Legacy request-level P90 threshold (ms). |
| `global_sla.p95` | number | No | Legacy request-level P95 threshold (ms). |
| `global_sla.p99` | number | No | Legacy request-level P99 threshold (ms). |
| `global_sla.request` | any | No | Request-level SLAs → http_req_duration / http_req_failed (aggregate of all requests). |
| `global_sla.transaction` | any | No | Transaction-level SLA defaults applied to every transaction. Overridable per transaction (and per percentile) via transaction_slas. |
| `journey_slas` | object | No | Per-journey SLA overrides keyed by journey name. These apply to the journey's scenario-level http_req_duration / http_req_failed metric. |
| `transaction_slas` | object | No | Per-transaction SLA overrides keyed by transaction name (e.g., 't01_launch'). Applied directly to the transaction's Trend / checkrate metric, overriding global_sla.transaction per percentile. |
| `request_slas` | object | No | Per-request SLA overrides keyed by request name — the k6 `name` tag set via request(..., { name: 'GET_corre' }), or the request URL when no name was given. Applied to the request submetric http_req_duration{name:<request>} / http_req_failed{name:<request>}, letting you hold a single specific request to its own threshold. Scoped to that request only. |
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

