# Release Notes

> Distilled from `ai_context/todos.md` (completed work) and the frozen `archive/Framework-Change-Log.md`.
> This is a user-facing summary; the authoritative change log lives with the code/history.

## Unreleased — artifact consolidation (2026-07-21) ⚠️ breaking

Fewer files per run (~15 → ~10), and the two heaviest are gone by default.

| Before | Now |
|---|---|
| `ci-summary.json` + `transaction-metrics.json` | **`run-summary.json`** — CI gate *and* the full per-transaction table |
| `summary.json` (k6 `--summary-export`) | **removed** — `handleSummary.json` holds the same metrics plus metric `type`/`contains`, `options` and `state`, in a *smaller* file |
| `metrics-stream.json` retained | **deleted after the report is built** — it is only an input (timeseries + histogram derive from it). Keep it with `K6_PERF_KEEP_RAW=1` or `reporting.timeseries.keepRawMetricsStream: true` |

**Migration for pipelines.** The gate fields kept their names *and* their position at the
top level, so only the filename changes:

```diff
- status=$(jq -r '.status' results/*/Run_*/ci-summary.json)
+ status=$(jq -r '.status' results/*/Run_*/run-summary.json)
```

`transactions[]` is now *richer* than the old ci-summary subset — each row carries
`journey` (the scenario) and the full stat set (`std`, `p(90)`, …).

This is a deliberate break of the artifact-stability law (`ai_context/architecture-laws.md`
L6): the two files each carried their own copy of the per-transaction array, so keeping
both compatible meant keeping the duplication. Distributed load testing has not gone live
yet, so no legacy-artifact fallback is carried — the merge reads `run-summary.json` only.

**Also:** transactions are now identified by **(scenario, transaction)** — same-named
transactions in different journeys are no longer merged into one row, and the `SCENARIO`
column shows the real journey instead of `all`. `handleSummary.json` is pretty-printed.

## Current — v1.0.0 (`@k6-perf/core_engine`)

Phases 1–3 complete (foundation, generation/correlation/debug, reporting). Highlights:

**Authoring & import**
- HAR → framework k6 script generation with transaction grouping + replay metadata.
- `convert` for conventional k6 scripts (idempotent, dual-pattern).
- Request import: cURL (clipboard / file / stdin / inline) and Postman v2.1 collections (folder scoping,
  split-per-request).
- BYOS scaffold for pasting raw k6 scripts into the framework lifecycle.

**Correlation**
- Smart auto-correlation: scan a recording, score dynamic values (high/medium/low), and rewrite the
  script with capture + substitution — no hand-written rules. Reviewable manifest before apply.

**Execution & lifecycle**
- Per-VU lifecycle (`initPhase`/`actionPhase`/`endPhase`) with proactive end-detection across every k6
  executor, so logout runs before ramp-down culls a VU.
- `transaction()` + `k6Check()` with four error behaviors (`continue` / `stop_iteration` / `stop_vu` /
  `abort_test`); JS runtime errors always abort.
- Configurable think time (`thinktime(min,max)`) and iteration pacing.
- Distributed runs: `collect` per machine + `merge` into one report.

**Reporting (artifact-first)**
- Unified interactive `RunReport.html` with time-range-responsive transactions, Chart.js graphs
  (per-second buckets), summary, and errors tabs.
- Exact per-transaction pass/fail from `<name>_checkrate` (no estimation).
- CI artifacts: `ci-summary.json`, `transaction-metrics.json`, `timeseries.json`,
  `errors.ndjson`/`warnings.ndjson`, `run-manifest.json`.
- Per-request and per-transaction CSV logs (toggle via `K6_PERF_REQUEST_LOG` / `K6_PERF_TRANSACTION_LOG`).

**Debug**
- Single-VU replay with an interactive HTML diff report; debug now honors the same runtime settings as a
  load run (redirects/timeout/thinkTime/pacing parity).

**Interactive**
- Menu-driven command panel (bare `npm run cli` on a TTY, or `menu`).

## Not yet started
- Phase 4: AI/analytics.
- External reporter push targets (Grafana/Azure/webhook) are stubs — artifact-first is the supported path.

_For the full CLI surface see [cli-reference.md](cli-reference.md); for config see [configuration.md](configuration.md)._
