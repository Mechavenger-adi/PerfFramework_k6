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

> **Operator runbook** (how to actually run one): [docs/distributed-loadtest-runbook.md](../../docs/distributed-loadtest-runbook.md)

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
- **Non-Goals (this phase):** true VU-init start barrier; HDR histograms; controller→agent network
  command channel; auto-distribution of the test bundle; automated share creation. (User-initiated
  abort/stop via a shared control file **is** in scope — see Mid-test Control.)

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
- **Agent side:** every ~4 s the LG writes a small `<share>/live_<runId>/<machine>.status.json` (its
  **own** file — no shared-file concurrency, same safety as `collect`) carrying machine health (state,
  VUs, throughput, error rate) **plus a compact, mergeable per-transaction histogram** (`RelativeHistogram`
  — a few KB, size independent of request volume) built from its **LOCAL** transaction CSV.
  **The transaction CSV itself is NEVER shipped live** — only this small derived snapshot is. The raw CSV
  travels to the controller once, at the end, via `collect` (for the exact final merge).
- **Controller side:** a shared aggregator (`liveAggregate.aggregate()`) polls all `*.status.json`,
  **merges the per-transaction histograms** (sum bucket counts) into a **combined live transaction table**
  — count · err% · avg · min · max · p90 · p95 · p99 (configurable, honors the plan's `transactionStats`)
  — plus a per-machine **FLEET** health panel to catch a lagging/saturated LG. Two front-ends share the
  aggregate: the **console `monitor`** and the **browser dashboard** (`monitor --serve`).
- **Serving (`monitor --serve`):** a tiny **local HTTP server** (`liveDashboard.ts`, Node built-ins) serves
  a **self-contained page** (no external resources — air-gap/CSP safe) that polls `/data.json` (the same
  `aggregate()`) every few seconds and re-renders the FLEET + combined-transaction tables. **Configurable
  bind** (`--host`/`--port`): **today** it binds `127.0.0.1` (view on the controller / via RDP) because the
  port is firewall-blocked; **when a port is cleared**, `--host 0.0.0.0` exposes a **shareable URL** — the
  same dashboard the Phase-2 controller will serve, built once. **Note:** the live view is a purpose-built
  dashboard (fleet + combined metrics); the **graph-laden full `RunReport` is the FINAL artifact** — the
  heartbeats intentionally carry no timeseries, so a live full-report would have empty graphs. A live
  throughput/percentile-over-time graph (controller samples heartbeats over time) is a possible later add.

**Exact vs approximate, live:** combined **count / throughput / errors / VUs / min / max / avg** are
**exact** (additive / count-weighted). Combined **percentiles** (p90/p95/p99/med) are read off the
**merged histogram** → **≤0.1%** (below measurement noise), computed cheaply each tick — not by the
(wrong) averaging of per-machine percentiles. **Why histogram, not raw, live:** raw pooling grows without
bound with request volume; the histogram is a few KB regardless. **The bit-exact percentiles are the FINAL
report's** (CSV→R-7, next section), never the live view's.

## Mid-test Control (Abort / Stop) — control surface via the live report
Turns the live report from a monitor into a control surface, reusing the same outbound-only shared
folder — no inbound port on the LGs.

**Signal path.** Dashboard `[Abort]`/`[Stop]` button → controller's local HTTP server `POST /control` →
controller writes `<share>/control_<runId>/control.json` `{action, effectiveAt, by, token?}` → each LG
polls `control_<runId>/` every heartbeat cycle → acts → writes its state back into its status file
(`running`/`stopping`/`aborting`/`stopped`/`aborted`) → dashboard renders per-LG **acknowledgement** and
flags any LG that did not ack (e.g. lost share access → kill it manually). CLI fallback:
`signal --run <share> --mode abort|stop`. Control is **namespaced by `runId`** so a stale marker can never
leak into another run.

**Two modes (the LG framework process owns the k6 child and drives the stop):**

| Mode | Mechanism | k6 end-of-test | Merged report |
|---|---|---|---|
| **abort** | kill the k6 child (`taskkill /F /T` / `SIGKILL`) — immediate, cross-platform | `handleSummary`/`teardown` do **not** run | best-effort partial, flagged **ABORTED / INVALID** (built from CSV + json up to the kill) |
| **stop** | graceful early end (stop scheduling, drain in-flight, run teardown + `handleSummary`) | runs normally | **valid**, flagged **STOPPED-EARLY** (metrics over the actual shorter window) |

**Why stop → "go to end phase":** collect+merge needs each LG's artifacts **complete and consistent**;
only a graceful stop produces that (it runs the normal end-of-test path), so every LG lands exactly where
the merge expects. Abort truncates artifacts → its merged report is best-effort/invalid, not a clean early
result. So *stop = valid partial run that flows into the end phase; abort = kill the load, salvage what
exists.*

**Graceful-stop mechanism — VERIFIED (spike 2026-07-14).** Node cannot cleanly deliver `SIGINT` to a child
on Windows, so graceful stop uses k6's **local REST API** (`127.0.0.1:6565` on the LG — localhost, no
firewall). Confirmed on the installed `v2.0.0` build: `PATCH /v1/status {"stopped":true}` stops the run
**early and runs `handleSummary`/`teardown`** (spike observed the summary file written with `iterations:30`
and the run ending well before its 40s duration). So **graceful stop = one local API call**; the
cooperative-drain fallback is **not** needed.
- **Exit code:** an API-stopped k6 exits **non-zero (observed 103)** → the framework must map that exit to
  **STOPPED-EARLY**, not a crash/failed run.
- **Precondition (implemented):** this k6 build does **not** expose the REST API by default, so a
  distributed run now passes `--address 127.0.0.1:6565` (override `K6_PERF_K6_API`); `k6ApiStop` targets the
  same address. Without it, graceful stop falls back to a kill.
- **abort** stays a hard child-kill (`taskkill /F /T`), unconditionally reliable, no summary.

**Coordination.** `stop` carries `effectiveAt` (e.g. now + 10 s) so all LGs drain at the same wall-clock
instant (tight merged window); `abort` is immediate (next poll). The merged report records each LG's actual
stop time and the spread. `abort` supersedes a pending `stop`.

**Minor.** Anyone with share-write could drop a marker (mitigate: runId namespace now, optional `token` in
`control.json` later). An LG that already finished naturally ignores the marker.

## Shared-Location Provisioning
The shared folder is where live status + collected results land (§Live, §End). It is an SMB location every
machine can read/write.

- **This phase (manual):** when a machine starts as `role=controller`, the framework **suggests** the user
  share the controller's own results directory (`K6_RESULTS_BASE_DIR`) via normal Windows folder sharing,
  then use that shared path as `K6_PERF_COLLECT_DIR` on the LGs. Hosting the share **on the controller**
  means the controller reads/merges **locally** (no copy-back). The framework prints the resulting UNC path
  + the ready-to-paste `K6_PERF_COLLECT_DIR=\\<controller>\<share>` line for the LGs. It does **not** create
  the share itself. (A neutral corporate file share both machines are clients of is an equally valid
  alternative and avoids inbound SMB on the controller.)
- **Dependency:** a controller-hosted share makes the controller an SMB server → **inbound 445 must be
  reachable from the LGs.** Verify with the existing tool: `probe --tcp <controller>:445` from an LG.
- **Phase-2 (deferred):** automate share creation on the controller (`New-SmbShare` + `icacls` grants, or
  printed elevated commands when policy/UAC blocks it). 📝 **Not built now** — manual suggestion only.

## Accuracy Model (live = histogram ≤0.1%, final = EXACT)
**The final `Final_<testname>_<ts>` report is EXACT.** Live monitoring is histogram-based (≤0.1%
percentiles) for speed and bounded transport; the final report re-derives every headline from the raw
CSVs, so the numbers you sign off on are **bit-identical to a single big machine**. Live is for watching;
final is for deciding.

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
2. **Auto-finalize (zero commands):** the controller's `monitor` (console or `--serve`) watches the
   heartbeats; when **all** machines report finished it **automatically** runs the merge — polling
   `shared_<runId>/` until every `run-manifest.json` lands, then merging ([runMerge.ts](../../core_engine/src/distributed/runMerge.ts)). The
   dashboard shows a "Final report ready" banner. `--no-auto-merge` disables it; the standalone
   `merge --wait --machines lg1,lg2` remains for manual use.
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
  (`monitor --serve --host --port`, or folded into the controller role) with `POST /control`;
  `signal --run <share> --mode abort|stop [--effective-at]`; `merge --wait --machines`;
  `Final_<testname>_<ts>` output naming. Controller role **suggests** (does not create) the results-dir
  share and prints the UNC + `K6_PERF_COLLECT_DIR` line.

## Validation
- **Manifest agreement:** merge refuses/warns on mismatched `runId` / `scriptHash` / **`testId`**
  ([runMerge.ts validateManifests](../../core_engine/src/distributed/runMerge.ts)); warn per-machine if the transaction CSV is missing.
- **Split-CSV guardrail (CI):** take one real single-machine run, split its transaction CSV into N synthetic
  machines, merge, and assert the merged percentiles **equal** the single-machine baseline **exactly**
  (R-7 on identical pooled data). Extends `npm run test:merge`.

## Build Order (each independently committable; local runs untouched)
1. Mode switch + role + `testId` tag + HTML policy + forced CSV.
2. Controller share **suggestion**: print the results-dir UNC + `K6_PERF_COLLECT_DIR` line for LGs
   (manual sharing this phase); `probe --tcp <controller>:445` reachability hint.
3. CSV reader → R-7 pooled percentiles in `MergeEngine`; `Final_<testname>_<ts>` output naming.
4. Agent live-status heartbeat + controller combined console aggregator.
5. Live Run Report regeneration + local HTTP server (configurable bind for future network sharing).
6. Mid-test control: `control_<runId>` file + agent poll/executor (abort = kill; stop = graceful) +
   dashboard buttons/`POST /control` + per-LG ack. **Gated by the k6-REST-API graceful-stop spike.**
7. `merge --wait` auto-finalize + raw-stream exclusion from collect.
8. Config-driven per-bucket over-time stats in the merged timeseries (min/avg/max/std + **every**
   configured percentile, not just p95 — exact from pooled `durations`); manifest/`testId` validation +
   split-CSV guardrail; docs.

## Limitations
- **Best-effort start** (shared wall-clock, no VU-init barrier) — set `START_AT` far enough ahead.
- **Live merged percentiles are histogram-based (≤0.1%)**; the bit-exact percentiles are the final
  report's (CSV→R-7). Live histogram is rebuilt from the local CSV each tick — O(N), fine for normal runs;
  extreme-volume endurance needs incremental histogram updates or the DB sink (deferred).
- **Mid-test control:** `abort` (kill) is reliable but yields partial artifacts flagged INVALID; graceful
  `stop` uses the k6 REST API `PATCH /v1/status` (**verified** — runs handleSummary; maps exit 103 →
  STOPPED-EARLY).
- **Shared-location dependency** (read/write from every machine); **manual share setup** this phase
  (controller-hosted share needs inbound SMB/445 from LGs; neutral share avoids it); **manual discipline**
  (consistent `runId`/`START_AT`/`testId`, correct VU split).
- **Controller contention** if it also generates load; **tail-over-SMB latency** (seconds); **CSV-pool
  ceiling** for endurance (histograms return later).
- **Live dashboard is controller-local until a port is cleared** (view via RDP/localhost today).

## Phase-2 Alignment (why this is not throwaway)
Roles, identity tags, the shared substrate, the merge engine, and the locally-served live dashboard are all
the pieces the automated controller needs. When a port is opened, the controller gains a real command
channel (prepare/start-barrier/abort/results) and the **same** dashboard becomes network-shared — no
rebuild. See archived master/slave design (§4) for the target topology.
