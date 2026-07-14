# Distributed Load Test — Build Progress Tracker

Living status of every feature in the distributed load-test capability.
Design: [EDD-distributed-loadtest.md](edd/EDD-distributed-loadtest.md). Status legend:
⬜ not started · 🟡 in progress · ✅ done · 🔬 needs verification · ⏸️ blocked/deferred.

_Last updated: 2026-07-14 (steps 1–4 done + verified)_

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
| 5 | Live Run Report regeneration + local HTTP server (configurable bind) | ⬜ | Local now; network-shareable when a port opens. |
| 6 | Mid-test control: `control_<runId>` file + agent poll/executor + dashboard buttons + ack | ⬜ | Unblocked: abort=kill; stop=k6 REST API `PATCH /v1/status` (verified). Map exit 103→STOPPED-EARLY. |
| 7 | `merge --wait` auto-finalize + raw-stream exclusion from collect | ⬜ | |
| 8 | Bucketed p95-over-time in merged timeseries; manifest/`testId` validation + split-CSV guardrail; docs | ⬜ | |

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
