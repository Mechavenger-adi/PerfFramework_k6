# Distributed Load Test — Build Progress Tracker

Living status of every feature in the distributed load-test capability.
Design: [EDD-distributed-loadtest.md](edd/EDD-distributed-loadtest.md). Status legend:
⬜ not started · 🟡 in progress · ✅ done · 🔬 needs verification · ⏸️ blocked/deferred.

_Last updated: 2026-07-14 (ALL STEPS DONE + verified — Phase-1 manual distributed complete)_

## Pre-work / spikes
| Item | Status | Notes |
|---|---|---|
| Firewall validation (`agent`/`probe`/`probe --tcp`) | ✅ | Committed. Finding: port-filtering (3389 open, 7070 blocked). |
| k6 REST-API graceful-stop spike | ✅ | VERIFIED on k6 v2.0.0: `PATCH /v1/status {stopped:true}` stops early + runs handleSummary. Graceful stop = one API call; map exit 103 → STOPPED-EARLY; keep REST API enabled. |
| SMB/445 controller-inbound reachability check | ⬜ | `probe --tcp <controller>:445` — precondition for controller-hosted share. |

## Build steps (from EDD)
| # | Feature | Status | Notes |
|---|---|---|---|
| 1 | Mode switch (`K6_PERF_DISTRIBUTED`/`--distributed`) + `--role` + `testId` tag + HTML policy + forced CSV | ✅ | Verified: distributed run tags machine/runId/testId, CSV forced, RunReport+CDN HTML suppressed, TestSummary+handleSummary kept; local run unchanged (both HTMLs, no tags). |
| 2 | Controller share **suggestion** (print UNC + `COLLECT_DIR` line; 445 hint) | ✅ | `share-setup` command + auto-print on `run --role controller`. Verified. `shareSetup.ts`. |
| 3 | CSV reader → R-7 pooled percentiles in `MergeEngine`; `Final_<testname>_<ts>` naming | ✅ | Verified: single-machine merged percentiles == source exactly (p90 to the decimal); 2-machine pooling additive; `Final_WebUI_Load_Test___jpet_14_07_2026T10_19`. New: `transactionCsv.ts`. |
| 4 | Agent live-status heartbeat + controller combined console aggregator | ✅ | Verified: agent writes `<share>/live_<runId>/<machine>.status.json` (running→done) from the txn CSV; `monitor` renders combined table, exact multi-machine sums, auto-exits when done. New: `LiveStatusHeartbeat.ts`, `monitor.ts`. |
| 4b | Combined live percentiles via mergeable histogram in the heartbeat | ✅ | Verified: heartbeat carries per-txn `RelativeHistogram` (~1.7KB for 9 txns, bounded); monitor merges → combined avg/min/max/p90/p99 (honors plan stats, timing-only filter). 2-machine: counts additive, percentiles from merged histogram. CSV not shipped live; final stays EXACT. |
| 5 | Live browser dashboard over local HTTP server (configurable bind) | ✅ | Verified: `monitor --serve` serves self-contained page polling `/data.json` (shared `aggregate()`); FLEET + combined-txn tables; `--host`/`--port` (local now, 0.0.0.0 to share). Console+browser unified via `liveAggregate.ts`. New: `liveAggregate.ts`, `liveDashboard.ts`. Full graph report stays the FINAL artifact. |
| 6 | Mid-test control: `control_<runId>` file + agent poll/executor + dashboard buttons + ack | ✅ | Verified: `signal`/dashboard POST /control write marker; agent aborts (kill→state aborted, INVALID) or stops (k6 REST `PATCH /v1/status`→handleSummary/valid artifacts→state stopped, exit 103). Needed `--address` on k6 (this build hides the API by default). New: `control.ts`; `PipelineRunner.onChild`. |
| 7 | `merge --wait` auto-finalize + raw-stream exclusion from collect | ✅ | Verified: collect drops `metrics-stream.json` (—`--include-raw` keeps it); `merge --wait --machines` polls `run-manifest.json` until all land then finalizes to `Final_…`. Merge succeeds on raw-excluded folders (CSV→R-7). |
| 7b | Controller **auto-merge** (no `merge` command) | ✅ | `monitor` (console + `--serve`) auto-fires the merge when all machines finish → `Final_…` + dashboard "Final report ready" banner. `--no-auto-merge` opts out; standalone `merge` kept. Verified: report produced with no merge command. |
| 8 | Config-driven per-bucket over-time stats; manifest/`testId` validation + split-CSV guardrail; docs | ✅ | Verified: merged timeseries emits `durationP<k>` for every configured percentile + `durationStd` (no hardcoded p95, exact from pooled durations); `testId` in manifest + merge validation; `npm run test:merge` CSV-pooled R-7 EXACT + histogram ≤alpha. |

## Fixes batch (2026-07-17)
| # | Fix | Status |
|---|---|---|
| 1 | Live VU/failure chart freezes when all machines finish | ✅ |
| 2 | Active VUs forced to 0 in terminal states (no lingering VUs) | ✅ |
| 3 | merged_request_metric.csv + merged_transaction_metric.csv in Final folder | ✅ |
| 4 | Collect layout under `<collectDir>/<runId>/{live,shared,control,Final_}` | ✅ |
| 5 | Failure graph = request-failure % (checks-first isError, Σfailed/Σtotal); live + merged report. Local single-machine is already combined-correct; checks-first switch for local = follow-up | ✅ |
| 6 | Errors: vu·iter live + Machine column in report error table | ✅ |
| 7 | Merged report System tab: per-LG CPU/mem series (verified lg-a/lg-b, 28 pts). Controller-in-report = follow-up (shown live) | ✅ |
| 8 | Top-5 slowest requests in merged report | ✅ |
| 9 | "VUs" → "Active VUs" | ✅ |
| 10 | Combined-transactions table sortable + filterable | ✅ |

## Fixes batch (2026-07-20f) — transaction identity = (scenario, transaction)
Same-named transactions from different journeys were collapsing into one row (k6's
end-of-test summary merges same-named `group()`s across scenarios; the CSV keeps the
per-row Scenario). Now transaction identity is **(scenario, transaction)** everywhere,
sourced from the CSV, with a Scenario column shown when present. Also fixes the "all"
scenario label for multi-journey runs.
| # | Area | Status |
|---|---|---|
| 1 | `transactionCsv.ts`: `readTransactionCsvStats` groups via a private nested `Map<scenario, Map<transaction, …>>` and returns records with both tags as explicit fields; new `buildTransactionRowsFromCsv(files, stats)` pools by (scenario, transaction) → exact R-7 rows. | ✅ |
| 2 | Live: heartbeat carries `scenario` per txn; `liveAggregate` merges by (scenario, name); dashboard + console monitor show a Scenario column (only when present). | ✅ |
| 3 | Merged report: `runMerge` rebuilds the transaction table from the pooled machine CSVs (overrides the summary-based rows + the written artifact). | ✅ |
| 4 | Local report: `run.ts` rebuilds the transaction table from the local CSV when present (else falls back to the summary rows). | ✅ |
| 5 | Timeseries is scenario-aware too, with the TAGS as explicit fields (no composite key): `series.transactions` is now `[{ scenario, transaction, points[] }]`. Grouping is a private nested `Map<scenario, Map<transaction, …>>` in the stream parser / runtime / CSV reader / live aggregate; nothing encodes or decodes a key and nothing serializes one. `RunReportGenerator` reads `s.scenario` / `s.transaction` directly for the windowed table + per-transaction graphs. Verified: a render harness with `login` in two scenarios keeps them separate and the embedded JS parses. | ✅ |

## Artifact consolidation (2026-07-21) — fewer files per run
Four overlapping summary artifacts reduced to two, plus the raw stream made transient.

| Change | Rationale |
|---|---|
| **`summary.json` removed** (`--summary-export` flag dropped) | Verified byte-for-byte against `handleSummary.json`: identical 48 metrics + root_group (metric-name diff empty both ways, incl. the `{scenario:…}` tagged sub-metrics). summary.json additionally LACKS metric `type`/`contains`, `options` and `state`, and is the larger file (18 KB vs 11 KB) — a strict subset. `handleSummary.json` is now the single k6 summary artifact; a legacy `summary.json` is still read as a fallback. |
| **`transaction-metrics.json` + `ci-summary.json` → `run-summary.json`** | Both carried their own copy of the per-transaction array (ci-summary's was a subset — no scenario, no std/p90). One file now holds the run-level gate + the FULL per-transaction table. No legacy fallback — distributed has not gone live, so the merge reads `run-summary.json` only. |
| **`keepRawMetricsStream` default `true` → `false`** | `metrics-stream.json` is purely an INPUT: the timeseries artifact and the mergeable histogram are derived from it and every chart reads those. It is also the largest file a run produces. Deleted after the report is built; set `true` to retain for ad-hoc re-analysis. |

Verified by merging a synthetic 2-machine layout: the Final folder contained
`run-summary.json` (no `transaction-metrics.json` / `ci-summary.json` / `summary.json`),
and all 9 transaction rows carried their real scenario.

## Fixes batch (2026-07-20e) — failure-rate, per-machine health, live x-axis
| # | Fix | Status |
|---|---|---|
| 1 | Live chart failure line now plots the PER-INTERVAL rate (Δfailed/Δtotal per poll) instead of the cumulative reqFailRate (which only climbed and flattened, hiding when failures happened). KPI card still shows the overall %. Legend relabeled "(per interval)". | ✅ |
| 2 | Final report System tab "Load Generator Health" is now PER-MACHINE in distributed runs (a card per LG with CPU + Memory min/avg/max) so one hot LG isn't hidden by the fleet average. Single-machine/local keeps the combined cards. | ✅ |
| 3 | Live dashboard chart X axis now has 5 scalable time ticks (gridline + "Xs"/"M:SS" labels) instead of just start/end seconds. | ✅ |

## Fixes batch (2026-07-20d) — live dashboard: auto-merge banner + chart lead-in
| # | Fix | Status |
|---|---|---|
| 1 | Auto-merge no longer mislabeled "failed" when the TEST fails its CI gate. `runMerge`'s boolean is the pass/fail gate, not whether a report was produced — dashboard now judges success by whether a NEW Final report appeared (and catches genuine merge errors separately). | ✅ |
| 2 | Live VUs/failure chart trims the leading idle period (VUs=0 & no failures) so a controller started before `START_AT` doesn't render a long flat lead-in that squashes the real ramp into the right edge. Pairs with the countdown fix (controller now waits for `START_AT`). | ✅ |

## Fixes batch (2026-07-20c) — live start-time countdown
| # | Fix | Status |
|---|---|---|
| 1 | `awaitScheduledStart` (startBarrier) now renders a LIVE in-place countdown on a TTY (updates same line, ticks to zero) instead of a single static "Xs left" that froze. Piped/CI keeps one static line (no CR spam). Applies to LGs + local `run`. | ✅ |
| 2 | Controller `monitor`/`monitor --serve` also runs the same countdown (already-passed START_AT → no wait), so all roles show the shared countdown. | ✅ |

## Fixes batch (2026-07-20b) — .env-driven controller commands
| # | Fix | Status |
|---|---|---|
| 1 | `monitor`/`signal`/`collect` now load `.env` (via `bridgeEnvFile`) and fall back to `K6_PERF_COLLECT_DIR` + runId (`K6_PERF_RUN_ID`, else derived from `K6_PERF_START_AT` — no future guard) instead of demanding `--collect-dir`/`--run-id` flags. | ✅ |
| 2 | Dashboard host/port read from `K6_PERF_DASHBOARD_HOST`/`K6_PERF_DASHBOARD_PORT` (flags still override). Removed commander defaults so env can fill them. | ✅ |
| 3 | `npm run controller` (= `monitor --serve`) + `npm run monitor` shortcuts; `.env.template` documents the new vars. Friendly guard when no target resolves. | ✅ |

## Fixes batch (2026-07-20) — merged-report snapshots & host metrics
| # | Fix | Status |
|---|---|---|
| 1 | Merge no longer conflates the two snapshot streams: `reportData.snapshots` = **failure** snapshots (request/response, read per-machine from `snapshots.json`); `system.snapshots` = **host** CPU/mem samples. Fixes empty REQUEST/RESPONSE in the Snapshots panel after merge. | ✅ |
| 2 | Host snapshots tagged with originating machine (`host` field); Raw Host Snapshots table shows a **host** column (only when tagged, so local runs stay clean). | ✅ |
| 3 | Failure snapshots tagged with `machine`; per-machine CPU/mem chart already draws one line pair per LG (dynamic). | ✅ |

## Live-monitoring enhancements (post-Phase-1)
| # | Feature | Status | Notes |
|---|---|---|---|
| VU-fix | Live VUs = real active count (k6 REST API) | ✅ | Was reading the CSV VU-id column (bounced 1→N); now `/v1/status` `vus`. Verified steady at 3. |
| L1 | Live VUs + failure-rate over-time graph (dashboard) | ✅ | Inline dual-axis SVG (no libs); client accumulates `/data.json` totals per poll. |
| L2 | Host resources: live per-machine CPU/mem (LGs + controller) + final-report resource graphs | ✅ | Verified: heartbeat `host{cpu,mem}`; dashboard Resources panel + `controller` row (self-sampled); console FLEET CPU%/MEM% cols; merge reads `system-metrics.json` → report embeds snapshots (56 cpuPercent). |
| L3 | Live errors/warnings to controller | ✅ | Verified: heartbeat carries error/warn counts + last-3 messages (tailed from ndjson); aggregate sums across machines (machine-tagged); dashboard Errors/Warnings KPIs + panel; console monitor. |
| L4 | Live dashboard URL clickable from console (OSC 8 hyperlink) | ✅ | `monitor --serve` prints an OSC-8 hyperlink (clickable in VS Code / Windows Terminal / iTerm). |

## Sub-tasks — Step 1 (done)
| Task | Status |
|---|---|
| `--distributed` flag + `K6_PERF_DISTRIBUTED` env → single resolved `distributed` boolean | ✅ |
| `--role controller\|agent` + `K6_PERF_ROLE` | ✅ |
| `testId` promoted to a global k6 tag (was CSV/filename only) | ✅ |
| HTML policy: suppress custom `RunReport.html` on LG in distributed mode | ✅ |
| HTML policy: suppress CDN `htmlReport()` + `textSummary` imports + `k6-reporter-summary.html` (keep `handleSummary.json`) | ✅ |
| HTML policy: keep `TestSummary.html` (k6 web-dashboard) | ✅ |
| Force transaction CSV log ON in distributed mode | ✅ |
| Missing `MACHINE`/`START_AT` warnings in distributed mode | ✅ |
| `distributed`/`role`/`testId` recorded in `run-manifest.json` | ⬜ deferred → step 8 (validation) |
| Verify: local run unchanged; distributed run emits expected tags + artifacts | ✅ |
