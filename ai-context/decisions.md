# Architectural Decisions

> Distilled decision records. Each captures what was decided, why, and what constraints it creates.

## D1 — CommonJS Module System

**Decision:** Use CommonJS (`"type": "commonjs"` in package.json) instead of ESM.
**Reasoning:** k6's goja runtime uses CommonJS-like module loading. Aligning the build output simplifies imports between Node-side and k6-side code.
**Constraint:** No `import.meta`, no top-level `await`. Use `require()` semantics in compiled output.

## D2 — Phase-Based Blocking Progress (Not Animated Spinner)

**Decision:** Use phase-based logging (`▸ start...` → `✔ done (elapsed)`) instead of animated spinner/progress bar.
**Reasoning:** `PipelineRunner.execute()` uses `spawnSync` which blocks the Node.js event loop. `setInterval`-based animation never fires during sync execution.
**Constraint:** Any new progress indication must work with blocking execution.

## D3 — LoadRunner Lifecycle Model

**Decision:** `initPhase` → `actionPhase` (loop) → `endPhase` per VU, matching LoadRunner's init/action/end.
**Reasoning:** Enterprise performance engineers familiar with LoadRunner expect this pattern. Login in init, business flow in action, logout in end.
**Constraint:** Scripts must export three named functions. The `default` export delegates to the lifecycle helper.

## D4 — VU Target Interpolation for End Detection

**Decision:** Use instantaneous linear interpolation between stage boundaries to determine when VUs should exit.
**Reasoning:** Previous approaches (single ramp-down detection) failed for spike, step, and staircase profiles. Interpolation handles all profile types with one algorithm.
**Constraint:** Requires `K6_PERF_PHASES` env var with stage data. k6 removes highest-numbered VUs first.

## D5 — Dynamic SLA System (Index Signature)

**Decision:** `SLADefinition` uses `[key: string]: number | undefined` with regex-matched percentile keys instead of hardcoded `p90`/`p95`/`p99` fields.
**Reasoning:** Adding new percentiles (p75, p99.9) required code changes in three files. Dynamic keys allow config-only changes.
**Constraint:** ThresholdManager iterates SLA keys matching `/^p(\d+(?:\.\d+)?)$/` pattern.

## D6 — Cookie Persistence Default (true)

**Decision:** `noCookiesReset: true` by default (cookies persist across iterations).
**Reasoning:** LoadRunner preserves cookies by default. Most performance tests (login → browse → checkout) rely on session continuity.
**Constraint:** Scripts that need isolated sessions must explicitly call `clearCookies()`.

## D7 — Debug Replay Gated by Environment Variable

**Decision:** `logExchange()` checks `__ENV.K6_PERF_DEBUG` and returns immediately if not set.
**Reasoning:** Replay logging has I/O overhead that is unnecessary during load tests. Only debug runs need it.
**Constraint:** `ReplayRunner` must inject `K6_PERF_DEBUG: 'true'` into the k6 environment.

## D8 — JSON Schema as Single Source of Truth

**Decision:** External JSON Schema files (`config/schemas/`) are the SSoT for validation, IDE integration, and documentation.
**Reasoning:** Schemas were trapped inside `SchemaValidator.ts` code and never reached users' editors. Externalizing enables `$schema` property in config files for editor-agnostic IntelliSense.
**Constraint:** TypeScript types, AJV validation, and docs must all stay synchronized with the schema files.

## D9 — JSONC Config Support

**Decision:** Config files support JSON with Comments via `jsonc-parser` library.
**Reasoning:** Users wanted to document their configs inline. JSONC keeps JSON tooling compatibility while adding comments. Better than switching to YAML (whitespace bugs, new parser).
**Constraint:** `JSON.parse()` cannot be used for config files — must use `jsonc-parser.parse()`.

## D10 — Transaction Names Without Prefix

**Decision:** Transaction names used directly as k6 Trend metric names (e.g., `Homepage`) — no `txn_` prefix.
**Reasoning:** Simpler, cleaner metric names in k6 output and HTML reports. The old prefix was unnecessary indirection.
**Constraint:** ThresholdManager detects transaction metrics by `!includes(':') && !includes('{')` pattern.

## D11 — Artifact-First CI/CD Model

**Decision:** CI pipelines consume `ci-summary.json` for gating, not console log scraping.
**Reasoning:** Console output is noisy, format-unstable, and hard to parse reliably. Structured JSON is deterministic.
**Constraint:** `ci-summary.json` schema is a de facto API contract with CI pipelines. Changes must be backward-compatible.

## D12 — Transaction Counter Metrics

**Decision:** Each transaction gets a k6 Counter metric (`<name>_count`) alongside its Trend.
**Reasoning:** k6 doesn't natively track transaction execution count. The Counter provides authoritative count for `TransactionMetricsBuilder`. `pass` = min successful check count, `fail` = count - pass.
**Constraint:** Counter increment happens in `startTransaction()`, not `endTransaction()`, ensuring count even if transaction fails.

## D13 â€” Team-Aware Environment Overrides via Scenario Env Vars

**Decision:** Keep `config/environments/<env>.json` as the environment entry point, but allow optional `teamOverrides` keyed by `scrum-suites/<team>` folder name. Inject the resolved per-journey environment into k6 using explicit `K6_PERF_*` env vars.
**Reasoning:** Supports multiple teams sharing logical environment names like `dev` or `uat` without hardcoding URLs in scripts or duplicating plans. Keeps the cross-layer contract explicit and compatible with the existing k6-side/runtime boundary.
**Constraint:** Generated and converted scripts should resolve primary-host requests through runtime helpers (`resolveFrameworkUrl()`), while debug and legacy flows must preserve recorded-origin fallback behavior.
