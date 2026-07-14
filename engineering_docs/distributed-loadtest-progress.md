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

## Live-monitoring enhancements (post-Phase-1)
| # | Feature | Status | Notes |
|---|---|---|---|
| VU-fix | Live VUs = real active count (k6 REST API) | ✅ | Was reading the CSV VU-id column (bounced 1→N); now `/v1/status` `vus`. Verified steady at 3. |
| L1 | Live VUs + failure-rate over-time graph (dashboard) | ✅ | Inline dual-axis SVG (no libs); client accumulates `/data.json` totals per poll. |
| L2 | Host resources: live per-machine CPU/mem (LGs + controller) + final-report resource graphs | ⬜ next | Heartbeat `host{cpu,mem}` via HostMonitor; controller self-samples; merge reads `system-metrics.json`. |
| L3 | Live errors/warnings to controller | ⬜ | Heartbeat error/warn counts + recent samples; dashboard panel. Final report already has them. |

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
