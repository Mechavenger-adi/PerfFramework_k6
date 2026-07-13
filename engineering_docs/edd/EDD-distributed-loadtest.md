---
title: Distributed Load Test (Manual / Shared-Location) — Engineering Design Document
layer: L2
owns: distributed-loadtest
status: Design approved — pre-development (2026-07-14). Forward-looking; §4A rows filled as code lands.
sources:
  - core_engine/src/distributed/MergeEngine.ts
  - core_engine/src/distributed/MergedReportBuilder.ts
  - core_engine/src/distributed/runMerge.ts
  - core_engine/src/distributed/collectRun.ts
  - core_engine/src/distributed/startBarrier.ts
  - core_engine/src/distributed/agentServer.ts
  - core_engine/src/distributed/probe.ts
  - core_engine/src/cli/run.ts
  - core_engine/src/reporting/TransactionMetricLogWriter.ts
  - core_engine/src/reporting/RunReportGenerator.ts
related: [orchestration-map, reporting-contracts, risk-zones, edd]
supersedes: archive/Distributed-Load-Test-Design-Approach.md (for the manual/Phase-1 scope)
updated: 2026-07-14
---

# EDD: Distributed Load Test (Manual / Shared-Location)

## Executive Summary
Generate load from multiple machines ("LGs"), **monitor the combined test live**, and produce a
**single merged Run Report** — without any machine opening an inbound network port. Synchronization is
a shared wall-clock **start time**; live telemetry and final results travel through a **shared folder**
(outbound writes only). One machine takes the **controller/aggregator** role: during the run it builds a
live combined view and serves a live Run Report locally; at the end it merges every LG's artifacts into
one `Final_<testname>_<timestamp>/RunReport.html`.

This is the manual, air-gap-capable, firewall-compatible phase. It reuses the existing `startBarrier`,
`collect`, and `merge` machinery and the `RunReportGenerator` unchanged. It is deliberately the
**stepping stone** to the fully controller-controlled (Phase-2) system: the same roles, tags, shared
substrate, and live dashboard become the automated controller's building blocks when a port is opened.

## Problem Statement & Constraints (discovered 2026-07-14)
- **Inbound ports are firewall-blocked** between the test servers. Verified with `probe`/`probe --tcp`:
  RDP/3389 is reachable server-to-server but arbitrary ports (7070, 27141, …) **TIME OUT** (silent DROP).
  A standing inbound service (the natural Phase-2 controller→agent daemon) is therefore **not viable now**.
  → Everything here uses **outbound-only** access to a **shared folder**. See [[distributed-firewall-validation]].
- **Endpoint app-control blocks unsigned binaries** (`esbuild.exe`), so `tsx`/`npm run cli` can be blocked
  on locked-down boxes. → Run the **compiled** build: `npm run build` then `node dist/cli/run.js …`.
  `node.exe` and `k6.exe` must also clear the allow-list.
- **Histograms are parked** for this phase (kept aside; the HDR substrate remains for a later phase).

## Goals / Non-Goals
- **Goals:** multi-machine load with a shared start time; **no inbound port**; live combined monitoring +
  a locally-served live Run Report; a single exact merged report at the end; local single-machine runs
  **unchanged**; forward-aligned so Phase-2 reuses it.
- **Non-Goals (this phase):** true VU-init start barrier; live mid-test abort/`test.abort()`; HDR
  histograms; controller→agent network command channel; auto-distribution of the test bundle.

## Roles (honest naming)
- **agent** — an LG. Runs its slice, writes locally, pushes a light live-status file + (at end) its full
  results to the shared folder. No listener.
- **controller** — the **aggregator + monitor + merge node**. It does **not** command the LGs over the
  network in this phase (the user still starts each LG manually); "controller" is the forward-looking name
  it keeps when Phase-2 gives it real command authority. May optionally also generate load, but
  **controller-only is preferred** to avoid contending with its aggregation/report work (a saturated
  controller under-delivers its share — the #1 validity trap).

## Mode Switch & Configuration
Distributed mode is opt-in and **must not change local runs**.
- **Now:** env var `K6_PERF_DISTRIBUTED=1` **or** CLI flag `run --distributed` (the flag just sets the env
  internally so downstream has one source of truth). Role via `K6_PERF_ROLE=controller|agent` / `--role`.
- **Future (Phase-2):** a declarative `distributed{}` block in the test plan (per the archived §4.2). 📝
  **Recorded intent** — do not build the plan-config path until the controller phase; keep env/flag now.

| Env var | Purpose |
|---|---|
| `K6_PERF_DISTRIBUTED` | Turn on distributed mode (or `--distributed`). |
| `K6_PERF_ROLE` | `controller` or `agent` (or `--role`). |
| `K6_PERF_RUN_ID` | Shared run id — same on every machine (else derived from `START_AT`). |
| `K6_PERF_START_AT` | Shared wall-clock start (ISO 8601); each LG waits then begins. Also derives runId. |
| `K6_PERF_MACHINE` | This machine's name (tags + folder). Defaults to hostname. |
| `K6_PERF_TEST_ID` | Shared test id (`TID_<plan>` default); stamped as a **tag** and into filenames. |
| `K6_PERF_COLLECT_DIR` | Shared base dir; after the run the LG copies its results into `shared_<runId>/<machine>/`. |

## Metric Identity Tags
Every metric point carries the identity needed to merge unambiguously — injected as global k6 tags
(extends the existing `machine`/`runId` at [run.ts:613-616](../../core_engine/src/cli/run.ts#L613)):
- `scenario` (k6-native) = journey · `group` (k6-native) = `::<transaction>`
- `machine` = LG name · `runId` = shared run id · **`testId`** = shared test id (**new as a tag**; today
  it is CSV-column/filename only — [TransactionMetricLogWriter.ts:36](../../core_engine/src/reporting/TransactionMetricLogWriter.ts#L36), [run.ts:683](../../core_engine/src/cli/run.ts#L683)).

## LG-side Behaviour in Distributed Mode
1. Inject `machine` / `runId` / `testId` global tags.
2. **Force the transaction CSV log ON** — it is the raw carrier for merged percentiles (§Accuracy); it may
   not be disabled in distributed mode.
3. **HTML policy** (three distinct outputs today):

   | Output | Source | LG (distributed) | After merge |
   |---|---|---|---|
   | `TestSummary.html` | k6 web-dashboard export ([run.ts:569](../../core_engine/src/cli/run.ts#L569)) — self-contained | **keep** | — |
   | `RunReport.html` (custom) | `RunReportGenerator` ([run.ts:1659](../../core_engine/src/cli/run.ts#L1659)) | **suppress** | **generated** |
   | `k6-reporter-summary.html` | `handleSummary`→`htmlReport()` **CDN** ([run.ts:522](../../core_engine/src/cli/run.ts#L522),[:531](../../core_engine/src/cli/run.ts#L531)) | **suppress** | — |

   Suppressing the CDN `htmlReport()` also **removes the `raw.githubusercontent.com` import** from the LG
   entry script → **air-gap safe**. `handleSummary.json` ([run.ts:532](../../core_engine/src/cli/run.ts#L532)) is **kept** (a data artifact the
   threshold/report logic depends on, [run.ts:1309](../../core_engine/src/cli/run.ts#L1309)).
4. Warn loudly on missing discipline (no `MACHINE` → hostname; no `START_AT` → unsynchronized ramps).
5. Write k6's raw stream **locally** (authoritative). Push only a **light status file** to the share live
   (§Live). At end, auto-collect the full local folder to the share (§End).

## Live Monitoring (hybrid — the reliability-safe path)
LGs never write the raw firehose to the share (it perturbs the test and couples run success to share
uptime). Instead:
- **Agent side:** a local tailer derives a small `<share>/live_<runId>/<machine>.status.json` every
  ~3–5 s (its **own** file — no shared-file concurrency, same safety as `collect`): throughput, error
  rate, VUs, iterations, count-weighted avg, its own p95, progress.
- **Controller side:** an aggregator polls all `*.status.json` and renders a **combined live console
  table**, and regenerates a **live Run Report** every ~5–10 s by feeding the live-aggregated (partial)
  `ReportBundle` to the existing `RunReportGenerator`.
- **Serving:** the controller hosts the live Run Report over a **local HTTP server** with a
  **configurable bind host/port**. **Today** it binds locally (viewed on the controller via RDP /
  localhost) because the port is firewall-blocked. **Future**, when a port is cleared, flipping the bind
  host exposes a **shareable URL across the network** — this is exactly the dashboard the Phase-2
  controller will serve, so it is built once. (A self-refreshing static copy on the share is an optional
  fallback for viewing from other machines before a port exists.)

**Exact vs approximate, live:** combined **throughput / error rate / VUs / iterations / avg** are
**exact** (additive across machines). A true **merged p95 is not computed live** (raw pooling is too heavy
every few seconds) — the live view shows **per-machine p95**, clearly labelled. The **exact merged
percentile appears only in the final report**.

## Accuracy Model (histogram-parked)
- **Additive quantities** (count, pass/fail, iterations, data, errors, VUs) → **summed**; rates recomputed
  from sums; avg **count-weighted**; min/max → min/max. All **exact**, including across machines.
- **Percentiles (p90/p95/med/p99):** the merge **pools the per-machine transaction CSV** raw response
  times per logical transaction and applies **k6's R-7** formula ([reporting/Histogram.ts](../../core_engine/src/reporting/Histogram.ts)) → **bit-identical**
  to one big machine. Ceiling: very long/high-volume runs make CSVs large (histogram substrate returns in a
  later phase for endurance).
- **Percentile-over-time graph:** bucket the pooled raw values by CSV timestamp per `(transaction, bucket)`
  and read per-bucket percentile → the merged report keeps the same graphs as a local run.
- **Unit note:** CSV `responsetime` is **seconds (4dp)**; metric tables are **ms**. The reader normalizes
  so percentiles align with avg/min/max.
- **Thresholds/SLA evaluated once, post-merge** on aggregated numbers (never per-LG).

## End-of-run Collection & Merge
1. **Auto-collect (existing):** on finish each LG copies its full local run folder to
   `<share>/shared_<runId>/<machine>/` via `K6_PERF_COLLECT_DIR` ([collectRun.ts](../../core_engine/src/distributed/collectRun.ts), [run.ts:729](../../core_engine/src/cli/run.ts#L729)). Outbound
   write; each LG owns its subfolder (no collision). **The raw `metrics-stream.json` is excluded** (kept
   local for debugging) — the merge needs only the transaction CSV + JSON artifacts.
2. **Auto-finalize:** the controller runs `merge --wait --machines lg1,lg2`, which polls
   `shared_<runId>/` until every expected `run-manifest.json` is present, then runs the merge
   ([runMerge.ts](../../core_engine/src/distributed/runMerge.ts)) with **zero manual steps**.
3. **Output folder:** the merged result is written to **`Final_<testname>_<dd_MM_yyyyTHH_mm>/`**
   (Windows-path-safe; e.g. `Final_checkout_14_07_2026T16_45`) instead of `_merged/`.

## Folder Layout (on the shared location)
```
<share>/
  live_<runId>/                         ← during run: light per-machine status (live view)
    lg1.status.json   lg2.status.json
  shared_<runId>/                       ← at end: full per-machine artifacts (auto-collected)
    lg1/  <testId>_<host>_transaction_metric.csv  transaction-metrics.json  ci-summary.json
          timeseries.json  summary.json  run-manifest.json  TestSummary.html …  (no raw stream)
    lg2/  …
    Final_<testname>_<ts>/              ← produced by merge: the single combined output
          transaction-metrics.json  timeseries.json  ci-summary.json  RunReport.html
```

## CLI Surface
- **Built:** `agent` (firewall probe target), `probe` / `probe --tcp` (reachability + port discovery).
- **This EDD adds:** `run --distributed --role agent|controller`; a controller live-monitor server
  (`monitor --serve --host --port`, or folded into the controller role); `merge --wait --machines`;
  `Final_<testname>_<ts>` output naming.

## Validation
- **Manifest agreement:** merge refuses/warns on mismatched `runId` / `scriptHash` / **`testId`**
  ([runMerge.ts validateManifests](../../core_engine/src/distributed/runMerge.ts)); warn per-machine if the transaction CSV is missing.
- **Split-CSV guardrail (CI):** take one real single-machine run, split its transaction CSV into N synthetic
  machines, merge, and assert the merged percentiles **equal** the single-machine baseline **exactly**
  (R-7 on identical pooled data). Extends `npm run test:merge`.

## Build Order (each independently committable; local runs untouched)
1. Mode switch + role + `testId` tag + HTML policy + forced CSV.
2. CSV reader → R-7 pooled percentiles in `MergeEngine`; `Final_<testname>_<ts>` output naming.
3. Agent live-status heartbeat + controller combined console aggregator.
4. Live Run Report regeneration + local HTTP server (configurable bind for future network sharing).
5. `merge --wait` auto-finalize + raw-stream exclusion from collect.
6. Bucketed p95-over-time in merged timeseries; manifest/`testId` validation + split-CSV guardrail; docs.

## Limitations
- **Best-effort start** (shared wall-clock, no VU-init barrier) — set `START_AT` far enough ahead.
- **No live merged percentile / no mid-test abort** this phase.
- **Shared-location dependency** (read/write from every machine); **manual discipline** (consistent
  `runId`/`START_AT`/`testId`, correct VU split).
- **Controller contention** if it also generates load; **tail-over-SMB latency** (seconds); **CSV-pool
  ceiling** for endurance (histograms return later).
- **Live dashboard is controller-local until a port is cleared** (view via RDP/localhost today).

## Phase-2 Alignment (why this is not throwaway)
Roles, identity tags, the shared substrate, the merge engine, and the locally-served live dashboard are all
the pieces the automated controller needs. When a port is opened, the controller gains a real command
channel (prepare/start-barrier/abort/results) and the **same** dashboard becomes network-shared — no
rebuild. See archived master/slave design (§4) for the target topology.
