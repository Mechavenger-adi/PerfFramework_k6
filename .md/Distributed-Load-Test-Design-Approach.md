# Distributed Load Test — Design Approach

> **Status:** Finalized design (pre-development). · **Last updated:** 2026-06-25
> **Scope:** Generate load from multiple load-generator VMs ("LGs"), collect every
> agent's results into one place, and produce a **single merged Run Report + metrics**
> — air-gapped today, with a togglable path to stream to InfluxDB/Grafana later.
> Production-scale and **endurance/soak**-capable. Must support CI/CD. Must **not**
> change current behavior, and **local execution must keep working exactly as it does
> today.**

This document is the agreed spec. It captures **two approaches**, built in phases:

- **Approach 2 — Manual time-synchronized run + shared-location merge** (Phase 1, built first).
- **Approach 1 — Master/Slave (controller + agent service)** (Phase 2, built after Approach 2).

Both reuse the **same merge engine** and the **same accuracy model** (§2). Approach 2
is built first because it is the lowest-clearance, fully air-gapped path and de-risks
the merge engine; Approach 1 then adds automation on top without reimplementing the core.

---

## 0. Goals & guiding constraints

1. **Accuracy first, efficient at scale.** Match k6's own numbers where feasible; stay
   bounded in memory/storage for multi-hour endurance tests.
2. **Non-invasive.** New code must not change existing features. Distributed hooks are
   **no-ops** when not in distributed mode (the model k6 itself uses — see
   `k6-master/docs/design/020-distributed-execution-and-test-suites.md`, line 127).
3. **Local execution unchanged.** `k6 run` on one machine behaves exactly as today.
   (k6 itself treats local as `--execution-segment=0:1`, the same code path as distributed.)
4. **Removable timer.** The Phase-1 timer-based start is an isolated, opt-in module that
   can be deleted in Phase 3 without touching anything else.
5. **One substrate, three modes.** The same metric substrate drives local,
   timer-distributed, and controller-distributed runs.
6. **CI/CD throughout.** Every phase must be drivable from CI with a global exit-code gate.

### Phase overview

| Phase | Deliverable |
|---|---|
| **0** | Prereqs: **tag dedup (DONE)** — drop redundant `journey`/`transaction` tags, consume native `scenario`/`group`; vendor CDN imports; add histogram emission + per-machine output as an isolated, opt-in layer. |
| **1** | **Approach 2** — timer-synced manual distributed run + shared-location **merge engine** + single HTML. |
| **2** | **Approach 1** — controller/agent automation; reuses the merge engine; adds incremental streaming + aggregated live view. |
| **3** | Retire the timer; keep controller-based distributed as the only distributed mode. |

Local execution stays as-is across all phases; distributed sits behind a toggle.

### Implementation status (updated 2026-06-26)

**Phase 1 is functionally complete** (env-driven manual distributed → single merged report).
Every increment builds clean and is committed; nothing changes existing/local runs.

| Capability | Status | Where |
|---|---|---|
| Tag dedup (native `scenario`/`group`) | ✅ done | `ScenarioBuilder`, `request.ts`, `TimeseriesStreamParser` |
| Accuracy core — exact R-7 + mergeable `RelativeHistogram` | ✅ done · validated | `reporting/Histogram.ts` |
| Per-machine histogram emission (opt-in) | ✅ done · validated | `reporting/HistogramArtifactBuilder.ts`, wired in `run.ts` |
| Merge engine (by logical name; histogram-derived percentiles) | ✅ done · validated | `distributed/MergeEngine.ts` |
| Merged timeseries + ReportBundle → single `RunReport.html` | ✅ done | `distributed/MergedReportBuilder.ts` |
| `merge` CLI | ✅ done | `distributed/runMerge.ts` |
| Env-driven run: shared `runId`, machine tags, `startAt` gate, auto-collect | ✅ done | `run.ts`, `distributed/startBarrier.ts`, `distributed/collectRun.ts` |
| `collect` CLI (`shared_<runId>` namespacing) | ✅ done | `distributed/collectRun.ts` |
| **Validation:** merge correctness + histogram-vs-k6 (automated) + manual e2e steps | ✅ | `npm run test:merge`, `npm run validate:histogram`, Test Guide |
| Vendor CDN imports (air-gapped) | ⏳ pending | `run.ts:445-446` |
| Phase 2 — controller/agent service | ⏳ not started | — |

See [Distributed-Load-Test-Test-Guide.md](Distributed-Load-Test-Test-Guide.md) for how to test.

---

## 1. Shared foundations (used by both approaches)

### 1.1 Prerequisite blocker — vendor the CDN imports
The generated k6 entry script imports the HTML reporter and summary lib from
`raw.githubusercontent.com` / `jslib.k6.io` at runtime
(`core_engine/src/cli/run.ts:445-446`). **Air-gapped LGs cannot fetch these — even a
single-agent run fails.** Vendor both files locally and rewrite the import specifiers.
This is **step zero** (Phase 0) and benefits single-machine air-gapped runs too.

### 1.2 Load partitioning
- **`segment` (recommended):** the plan defines the **total** load; each LG runs a slice
  via k6 `--execution-segment i/N` + `--execution-segment-sequence`. If the segments cover
  `0:1`, the distributed run behaves **exactly as if run on one big machine** (k6 design
  doc, line 38). `k6 run` is implicitly `0:1`, so this is the same code path as local.
- **`replicate`:** every LG runs the full plan; total = per-LG × N. **Warns loudly** to
  prevent accidental N× load against a shared target.
- **`user-split` (Approach 2 manual):** the user assigns VUs per machine. The merge sums
  them by logical name — see §1.5 and §3.3.

### 1.3 Metric identity tags (machine + run)
Every metric **point** carries the full identity needed to merge it unambiguously:
- **`scenario`** (k6-native) = journey name.
- **`group`** (k6-native) = `::<transaction>` (consumers strip the leading `::`).
- **`machine`** = the load-agent name (`machineName`).
- **`runId`** = the shared test/run id.

`machine` and `runId` are injected as **global k6 tags** (`--tag machine=lg2 --tag
runId=...`) so they apply to *every* point from that agent. There are **no redundant
`journey`/`transaction` tags** — those were removed in the tag-dedup prerequisite (Phase 0);
the framework now relies on the native `scenario`/`group` tags. This lets the merge attribute
each metric to its `(journey, transaction, machine, run)` and drives the per-machine System-tab
breakdown.

### 1.4 Storage layout — write local, then collect (no shared-mount writes)
**No machine ever writes to a shared/network location during the run.** Each LG writes its
artifacts to its **own local disk** (exactly as runs do today). A separate **collection**
step then copies each machine's local run folder into one place on the **merge node**, and
the merge reads that local layout. This avoids *both* the single-shared-file corruption trap
*and* the reliability risk of live writes over a network share.

- **Phase 1:** collection is a manual copy (`robocopy`/`scp`/`cp`) or a small `collect` helper.
- **Phase 2:** the controller **pulls** each agent's local results over its result channel.

Collected layout on the merge node (local dir):
```
<collectDir>/<runId>/
    lg-a/   metrics-histogram.json  transaction-metrics.json  ci-summary.json  timeseries.json  run-manifest.json  ...
    lg-b/   ...
    lg-c/   ...
    _merged/                              ← produced by `merge` (the single combined output)
        transaction-metrics.json  timeseries.json  ci-summary.json  metrics-histogram.json  RunReport.html
```
- Each LG's folder is written by **only that LG** (locally), then copied in whole — never a
  shared concurrent write.
- The **merge step** (`k6-framework merge --run-dir <collectDir>/<runId>`) reads every
  `<runId>/<machine>/` folder and writes the single `_merged/` output. It does **not** read
  or write any shared mount — it operates entirely on the merge node's local disk.

### 1.5 Merge engine — rules
Input: a **collected** folder of per-machine result sets for one `runId` on the merge node's
local disk (or CI artifacts — identical shape). Output: the single `_merged/` artifacts the existing report
already consumes, so `RunReportGenerator` is **unchanged**.

**Merge by logical name.** Transactions/journeys/requests merge by their **name**, not by
machine. The same script on LG-A and LG-B collapses into **one** logical row whose values
are the union across machines. Machine identity is kept only as a System-tab breakdown.

| Quantity | Merge rule | Exactness |
|---|---|---|
| Requests, iterations, data sent/received, pass/fail, errors | **Sum** | Exact |
| VUs for the same script across machines | **Sum** (3 + 2 = 5) | Exact |
| Rates (error rate, throughput) | **Recompute** from summed counts | Exact |
| avg | **Count-weighted** | Exact |
| min / max | min / max | Exact |
| **Trend percentiles (p90/p95/p99, med)** | **Per the accuracy model (§2)** | Exact or ≤0.1% |

**Clock alignment.** The timeseries merge keys on k6's absolute point timestamps. Each
machine's measured **clock offset** vs the reference is recorded and used to shift its
timestamps so buckets align. Reasonable NTP is assumed.

### 1.5.1 Merge algorithm (step by step)
The same engine runs in Phase 1 (reads files from the shared location) and Phase 2 (reads
files/streams the controller collected) — identical logic, different transport. It works
**per logical transaction name** (so the same script on LG-A + LG-B becomes one row).

**Precondition (critical):** all machines use the **same bucket boundaries**, aligned to
absolute wall-clock time (`bucketIndex = floor((ts − epoch) / bucketSize)`), for *both* the
counter bucket and the histogram bucket. The histogram bucket must be a whole multiple of
the counter bucket so the two overlay.

Because every flushed record is **keyed by its window (bucket id), not arrival order**, the
merge is **order-independent and idempotent** — late, out-of-order, or re-sent flushes (GC
stalls, retries) merge correctly by bucket id. The merge is also **associative/commutative**
(bins add, counters sum), so a future tree/incremental reduction needs no redesign (§6).

1. **Clock-align.** Shift each machine's bucket timestamps by its recorded offset onto a
   common timeline.
2. **Counters → merged counter series (exact).** For each `(transaction, counter-bucket)`,
   **sum** across machines: requests, errors, pass, fail, iterations, bytes,
   `sumDuration`/`count`. Recompute rates (`Σrequests / bucketSecs`) and per-bucket avg
   (`Σsum / Σcount`). VUs add (3 + 2 = 5). → drives throughput/error/avg/VU graphs.
3. **Histograms → merged percentile data (lossless).** For each `(transaction,
   histo-bucket)`, **add the HDR bin counts bin-by-bin** across machines. From each merged
   histo-bucket read the per-bucket p95 (percentile-over-time graph). For any window, sum
   that window's merged histo-buckets into one histogram and read the percentile. For the
   whole run, sum *all* merged histo-buckets.
4. **Full-run headline percentile (SLA number), by accuracy mode (§2.3-2.5):**
   - **Single machine** → that machine's `summary.json` directly (k6-exact).
   - **Multi, exact mode** (all raw shipped within cap) → pool all raw points per
     transaction into one sorted array → apply k6 R-7 (§2.1) → bit-identical to k6.
   - **Multi, histogram mode** (endurance / raw dropped) → sum all histo-buckets → read
     percentile (≤0.1%).
5. **Totals & rates (exact).** Requests, iterations, pass/fail, data = sum; global error
   rate = `Σfail / Σtotal`.
6. **Thresholds/SLA.** Evaluated **once**, on the merged full-run numbers (§1.6).
7. **Emit `_merged/` artifacts** the existing report consumes: `timeseries.json` (merged
   counter series + merged per-bucket percentiles + **embedded merged HDR histograms** for
   client-side any-window zoom), `transaction-metrics.json` (merged counts + headline
   percentiles), `ci-summary.json`, `RunReport.html`. Per-machine host/achieved-load kept
   **separate** for the System tab (not merged), so each LG's contribution/skew is visible.

Everything additive (counts, bins) is exact; the only ≤0.1% approximation is a
histogram-mode full-run percentile on endurance runs.

### 1.6 Thresholds evaluated only after the merge
Per-machine runs **do not** decide their own pass/fail; their individual percentiles are
**not authoritative**. The merge computes the global `ci-summary.json` and evaluates
thresholds/SLA against **aggregated** metrics (k6 design doc, task 5). `RunSummaryBuilder`
already does the additive part — the rule is: run it only post-merge.

### 1.7 Reporting — reuse the System tab
No new tab. Per-machine data lives in the **existing System tab**: per-machine host
CPU/mem + per-machine achieved throughput vs assigned share — to catch the #1 validity
trap, a **saturated machine that silently under-delivered load**. Plus a few cheap
distributed diagnostics: **per-agent clock skew, flush latency, and achieved-vs-assigned
load**. (Deliberately *not* GC/queue/backlog metrics — those measure streaming machinery
we are not building at this scale; see §6 non-goals.) The merged report is the existing
`RunReport.html`; the merge feeds it the artifacts it already consumes, plus the embedded
HDR histograms that power the interactive any-duration view (§2).

### 1.8 Togglable sink (offline ↔ DB) — and its scale ceiling
Orchestration (partition, start sync, collection, merge) is **independent of where results
go**:
- `offline` → per-machine files → merge → HTML (today, air-gapped).
- `influxdb` / `both` → LGs `--out influxdb=…` (existing hook, `run.ts:510`) → live
  Grafana; merge optional.

**Scale note:** k6's own guidance (design doc, line 181) is that for very high
cardinality/volume, results should stream to a real metrics DB rather than be crunched
centrally. So the **offline file-merge has a ceiling**; beyond it, the **DB sink is the
recommended path** for extreme-volume production endurance.

---

## 2. The accuracy model (core finalized substrate)

This is the heart of the design. It guarantees: **single-machine numbers identical to
k6**, **multi-machine numbers exact when feasible and within 0.1% otherwise**,
**correct percentiles for any sub-duration**, and **bounded cost for endurance.**

### 2.1 How k6 computes percentiles — and how we replicate it exactly
k6's `TrendSink` keeps **every raw value** in memory and computes percentiles with the
**R-7 method** (the Excel `PERCENTILE.INC` / NumPy / R default), i.e. fractional rank on
an `(N−1)` basis with linear interpolation (`k6-master/metrics/sink.go:145-165`):

```
sort values
i = pct * (count - 1)
j = values[floor(i)] ; k = values[ceil(i)] ; f = i - floor(i)
percentile = j + (k - j) * f
```

To reproduce a k6 number **bit-for-bit across machines**, the merge **pools all raw values
from every LG into one sorted array and applies this same formula.** Same inputs + same
formula = same result. (See worked example in Appendix A.)

### 2.2 HDR histograms — the endurance-safe substrate
A histogram tallies how many observations fall in each value bucket instead of storing
each value. **HDR (High Dynamic Range)** uses variable-width buckets sized to a fixed
**relative** precision (e.g. 3 significant figures = 0.1%), covering microseconds-to-hours
in a few KB **regardless of request count**.

- Memory/size grows with **duration × buckets × transactions**, **not** with request volume
  → an 8-hour soak stays small. This is the property endurance needs.
- **Merging is lossless:** summing bucket counts across machines == one histogram fed all
  samples. Distribution adds **zero** extra error; the only error is record-time
  quantization (≤0.1%), the same on 1 machine or 50.
- **Any-duration percentiles:** keep histograms **per time-bucket**; for any window, sum
  the buckets in that window and read the percentile off the merged histogram. (See
  Appendix B.)
- HDR is **not** bit-identical to k6's R-7 (it quantizes and has no two real neighbours to
  interpolate between) — it lands within ~0.1%, below real measurement noise.

### 2.3 The hybrid rule + the `accuracy` knob
**Always produce HDR per-bucket histograms** — they are required for the interactive
windowing *and* are the endurance-safe substrate. **Additionally keep raw only when it is
small enough to be worth it.** The headline percentile then comes from raw (exact) when
available, else from the merged histogram (≤0.1%). One knob:

`accuracy: auto | exact | efficient`
- **`exact`** — always retain + pool raw; headline = k6-identical (R-7). (Refused/warned on
  very large volumes — the OOM case k6's doc warns about.)
- **`efficient`** — histograms only; headline from merged histogram (≤0.1%).
- **`auto`** (default) — decided per run by data volume (§2.4).

### 2.4 The auto switch — two distinct caps, decided on *total* volume
There are **two separate caps**, which the original draft conflated:

- **Per-LG retention cap** (`rawRetentionCapMB`, default ≈ 200 MB): bounds how much raw a
  single LG keeps on disk. To avoid the write-then-discard waste, each LG decides **up
  front** from a cheap estimate (plan duration × expected rate) whether to retain raw *at
  all* — partial raw is useless for exact percentiles, so it's all-or-nothing per LG.
- **Global exact-eligibility cap** (`exactEligibilityCapMB`): the **sum** of all LGs'
  reported raw sizes. This is what actually gates exact mode — three LGs at 190 MB each
  (each under the per-LG cap) sum to 570 MB and must **not** trigger an exact pool that
  OOMs the coordinator.

Flow:
1. **Every LG always rolls its k6 raw stream into HDR per-bucket histograms** (shipped).
2. Each LG retains raw only if its up-front estimate is under the per-LG cap, and reports
   its actual raw byte/sample count in its manifest (§6).
3. **At merge:** exact mode only if *every* LG shipped complete raw **and** the **summed**
   reported size is within the global eligibility cap. Otherwise → **histogram merge** (≤0.1%).

The interactive windowing always uses HDR regardless — it never needs raw.

### 2.5 Behavior matrix (single/multi × normal/endurance)
Important nuance: **k6 itself never changes.** Each LG always keeps its own raw values and
computes its own exact R-7 percentiles for its slice (its summary + live dashboard). The
histogram-vs-raw choice is only about what *we extract and merge across LGs.*

| Case | k6 on each LG | Our full-run headline | Windowed / interactive |
|---|---|---|---|
| **Single machine** (local or single agent), normal **or endurance** | exact | **k6 exact** (reuse k6's own summary — no merge, no histogram) | HDR |
| **Multi-machine, short/normal** | each exact | **exact** (pool raw + R-7) | HDR |
| **Multi-machine, endurance / high-volume** | each exact | **HDR** (merged histograms, ≤0.1%) | HDR |

So a **single-machine endurance** headline stays **exact**; only the **multi-machine
endurance merged** headline moves to HDR (because pooling raw from several multi-hour soaks
centrally is exactly what k6 warns would OOM a coordinator).

### 2.6 Full-range special case (remove the visible seam)
When the report's time slider is at **full range**, show the **exact/k6 headline numbers**;
only **narrower** windows compute from HDR. This guarantees the headline and the "full
duration" view both read as k6-exact (single machine) or exact-merge (small multi), and HDR
only takes over when you zoom — which is fine, because k6 can't give a sub-window number anyway.

### 2.7 What is exact vs approximate
**The only value anywhere that is ever approximate is a Trend percentile in HDR mode
(≤0.1%).** Counts, iterations, throughput, error rates, data volume, pass/fail, avg,
min/max — all **exact**, including summed across machines and across time buckets
("aggregations of their aggregations are correct", k6 design doc line 173).

### 2.8 Bucketing model — two buckets, not one (and what drives graphs vs percentiles)
There are **two** timeline bucketings with different cost profiles. They are not the same
knob, and **not everything moves to histograms** — only the percentile views do:

| What | Substrate | Bucket / granularity |
|---|---|---|
| Throughput, error rate, data, VUs, **avg** graphs | existing **counter series** (`reporting.timeseries.bucketSizeSeconds`, default **2s**) — **unchanged** | 2s (fine) |
| **Percentile-over-time graphs** (p90/p95/p99) | **new HDR histograms** | histogram bucket (adaptive, see below) |
| **Percentile tables + any-duration zoom** | **new HDR histograms** | histogram bucket |
| **Full-run / SLA percentile** (headline) | k6 summary (single) / raw-pool (small multi) / merged histogram (endurance) | whole-run (exact or ≤0.1%) |

- **Counters are cheap** → keep the existing **2s** bucket for fine throughput/error/avg
  graphs. Non-invasive (this setting already exists).
- **HDR histograms are the heavy part** → attaching one to every 2s bucket explodes on
  endurance (8h × 10 txn @ 2s ≈ 144k histograms/machine). So histograms use a **separate,
  coarser/adaptive bucket**, a whole multiple of the 2s counter bucket, boundary-aligned.
- **The histogram bucket does NOT affect the SLA/full-run percentile** — summing buckets is
  lossless, so a 10s histogram bucket yields the same p95-vs-3s-SLA verdict as a 2s one. It
  only limits how finely you can **zoom the latency-percentile view**. SLA *value* accuracy
  comes from HDR precision (below), independent of either bucket.

### 2.9 Defaults (configurable)
- **Counter bucket** (`reporting.timeseries.bucketSizeSeconds`): **2s** — unchanged; drives
  throughput/error/avg/VU graphs.
- **Histogram bucket**: **adaptive (default)** — auto-sized from the **planned** test
  duration to target ~600 timeline points, clamped to **[counter bucket, 60s]** and aligned
  to a whole multiple of the counter bucket. So a short/spike test gets the finest bucket
  (= the counter bucket, e.g. **2s**), a 1h test ~6s, an 8h soak ~48s. Derived from *planned*
  (not actual) duration so every machine resolves the **same** bucket for merge. Override:
  `reporting.histogram.bucketSizeSeconds` or `K6_PERF_HISTOGRAM_BUCKET` (env). Bucket size
  never affects the full-run/SLA percentile (lossless sum) — only zoom granularity.
- **HDR precision** (`reporting.histogram.significantDigits`): 3 significant figures (0.1%)
  — *this* is the SLA-relevant knob; bump to 4 sig figs (0.01%) for very tight SLAs at little cost.
- **Raw-retention cap** (`reporting.histogram.rawRetentionCapMB`): customisable, default
  ~200 MB (≈ a few million samples per metric per machine). Above it, that machine drops raw
  and ships histograms only.
- **Table rounding:** whole milliseconds for latency columns.

All of the above are **runtime-settings values** (`config/runtime_settings/*.json`),
overridable per run — nothing is hard-coded. The counter bucket reuses the existing
`reporting.timeseries.bucketSizeSeconds` (currently `2`).

---

## 3. Approach 2 — Manual time-synchronized run + collect-then-merge (Phase 1)

The user runs the framework **manually on each LG**. **No controller, no service, no
inbound port, no network orchestration, and no shared-mount writes.** Synchronization is a
common **start time**; results are written **locally** on each LG and then **collected** to
the merge node. Lowest-clearance, fully air-gapped — an LG needs only its own local disk.

### 3.1 Flow
1. Vendor CDN imports (§1.1) on each LG.
2. User copies the test (plan + scripts + data) to each LG (ideally a single `k6 archive`
   bundle for uniformity) and decides the **per-machine VU split**. Each LG gets a unique
   `machineName` and the shared `runId`.
3. User sets a common **`startAt`** wall-clock timestamp on **every** machine.
4. User starts the framework on each LG; each **waits until `startAt`, then begins**.
5. Each LG runs its slice **writing to its own local disk**, tagging metrics with
   `machineName` + `runId`, rolling histograms (and retaining raw under the cap, §2.4).
6. **Collect:** copy each LG's local run folder into one place on the merge node:
   `<collectDir>/<runId>/<machineName>/` (manual `robocopy`/`scp`, or a `collect` helper).
7. On the merge node, run `merge` over `<collectDir>/<runId>/` → single `_merged/` output,
   thresholds evaluated post-merge.

### 3.2 Config — env-driven (no controller yet)
Until the Phase-2 controller exists, distributed Phase-1 runs are driven entirely by
environment variables (CLI/`.env`) — opt-in, and removable later without touching anything:

| Env var | Purpose |
|---|---|
| `K6_PERF_RUN_ID` | **Shared run id, set to the SAME value on every machine** (see runId resolution below). |
| `K6_PERF_START_AT` | Shared wall-clock start (ISO 8601); each LG waits until it, then begins. Also auto-derives the runId. |
| `K6_PERF_MACHINE` | This machine's name (tags + collect folder). Defaults to the OS hostname. |
| `K6_PERF_COLLECT_DIR` | If set, after the local run finishes the framework copies its result folder to `<COLLECT_DIR>/shared_<runId>/<machine>/`. |
| `K6_PERF_EMIT_HISTOGRAM` | Force histogram emission (auto-enabled whenever `K6_PERF_MACHINE` is set). |

**runId resolution (how all machines agree on one id):**
1. explicit `K6_PERF_RUN_ID` (set the same value on each machine), else
2. **derived from `K6_PERF_START_AT`** — since the start time is already identical on every
   machine, the runId (`Run_<digits-of-startAt>`) falls out identically with *no extra
   coordination*, else
3. a fresh timestamped id (single-machine / non-distributed).

Results are written to the normal **local** results dir (`K6_RESULTS_BASE_DIR`); there is no
shared-location *write* setting — only the post-run `K6_PERF_COLLECT_DIR` copy.

**Shared folder naming:** the collect target is `shared_<runId>` (not bare `<runId>`). The
`shared_` prefix namespaces the distributed aggregation folder so a different test/person
can't accidentally overwrite the same location, and marks it as a multi-machine collection.

### 3.2.1 Commands (end to end)
```bash
# On each LG (same RUN_ID + START_AT on all; unique MACHINE; shared COLLECT_DIR):
K6_PERF_RUN_ID=load_1430 K6_PERF_START_AT=2026-06-25T14:30:00Z \
K6_PERF_MACHINE=lg-a K6_PERF_COLLECT_DIR=//collect \
  k6-framework run --plan config/test_plans/load_test.json
#   → runs locally, emits histogram, tags metrics, waits for START_AT, then
#     copies results to //collect/shared_load_1430/lg-a/

# (or collect manually afterward instead of K6_PERF_COLLECT_DIR:)
k6-framework collect --from results/<plan>/load_1430 --into //collect --machine lg-a

# On the merge node:
k6-framework merge --run-dir //collect/shared_load_1430
#   → //collect/shared_load_1430/_merged/RunReport.html
```

### 3.3 The merge nuance (same script on multiple machines)
With `user-split`, the same script can run on multiple machines. The merge combines **by
logical name**, not by machine:

> A load test has a common script `buy_animal` on both LGs. LG-A runs **3 VUs**, LG-B runs
> **2 VUs**. The merged result is **one** `buy_animal` row with **5 VUs total**, requests /
> iterations / pass-fail **summed**, avg **count-weighted**, and percentiles from the
> **pooled observations of both machines** (exact via raw, or merged HDR — §2).

Distinct scripts that run on only one machine pass through unchanged (tagged by machine).

### 3.4 Start synchronization — best-effort (known limitation)
A common `startAt` is weaker than a true barrier. k6's design (task 3, line 51) stresses
that all instances must finish **VU initialization** *and then* start **simultaneously**,
or behavior gets "out of whack." A wall-clock timer does not guarantee slow machines
finished VU init before the instant. Mitigation: set `startAt` far enough ahead that all
machines initialize first. This best-effort nature is a key reason the timer is retired in
favor of the Phase-2 barrier.

### 3.5 CI/CD
Each LG is a CI job (or manual VM step) that runs its slice and uploads its per-machine
folder to the shared location / CI artifact store. A final job runs `merge`, publishes the
combined HTML + `ci-summary.json`, and the **global exit code drives the gate**. Same merge
engine as the interactive path.

### 3.6 Live monitoring (Phase 1)
Per-LG k6 web dashboards only (one per machine at `:5665`). The aggregated live view is
deferred to the Phase-2 controller (the natural aggregation point).

### 3.7 Limitations
- **Start sync is best-effort** (§3.4).
- **No mid-test control** — no `abortOnFail`, `test.abort()`, or coordinated abort; offline
  merge only yields end-of-test pass/fail (needs continuous central crunching, which Phase 1
  has not).
- **Manual discipline** — consistent `runId`/`startAt` and correct VU split per machine;
  mistakes silently corrupt the aggregate.
- **No auto distribution** — user copies the test (mitigation: single `k6 archive`).
- **Shared-location dependency** — every machine needs read/write to the share (the only
  infra requirement / clearance).

---

## 4. Approach 1 — Master/Slave (controller + agent service) (Phase 2)

Automates Approach 2. Reuses the §2 substrate and the §1.5 merge engine unchanged; adds
orchestration, a true start barrier, optional incremental streaming, and the aggregated
live view.

### 4.1 Topology & roles
- **LG1 = controller** (default **controller-only**, no load generation, so merge/percentile
  work runs uncontended; `controllerAlsoGenerates: true` opt-in for small setups).
- **LG2, LG3, … = agents.** Controller does only **distribute, synchronize, aggregate**;
  agents self-execute their segment (the "reverse the pattern" model, k6 design doc §"Reverse
  the pattern").

### 4.2 Config
```jsonc
"distributed": {
  "enabled": true,
  "mode": "master-slave",
  "role": "controller",            // controller | agent
  "agentPort": 7070,               // user-configurable
  "resultPort": 7071,              // user-configurable
  "auth": { "token": "<shared>" },
  "agents": [
    { "id": "lg2", "host": "10.0.0.2", "port": 7070 },
    { "id": "lg3", "host": "10.0.0.3", "port": 7070 }
  ],
  "partition": "segment",          // segment | replicate
  "controllerAlsoGenerates": false,
  "onAgentLoss": "abort",          // abort (default) | merge-partial (flagged INVALID)
  "aggregation": "offline",        // offline | influxdb | both
  "accuracy": "auto"
}
```

### 4.3 The agent service — how it is built
Not a separate program — a **long-lived mode of the existing CLI**:
`k6-framework agent --config <distributed.json>`. Same `dist/`, same binary.

- **Transport:** Node's built-in `http` (no new heavy deps) on `agentPort`.
- **Protocol (~5 endpoints):**

  | Endpoint | Purpose |
  |---|---|
  | `GET /info` | Pre-flight: k6 version, framework version, free disk, clock (skew offset) |
  | `POST /prepare` | Receive `k6 archive` + segment + `runId` + tags; verify token + **checksum**; stage; validate; reply `ready` |
  | `POST /start` | Barrier release → spawn k6 against the staged archive |
  | `GET /status` | Heartbeat / progress |
  | `POST /abort` | Kill the running k6 child |
  | `GET /results` | Stream back the gzipped artifact bundle (or agent pushes to `resultPort`) |

- **Constrained job runner, NOT arbitrary code execution.** On `/start` the daemon calls the
  **same** `PipelineRunner.executeAsync` local runs use, spawning the **pinned `k6` binary**
  against the **checksum-verified staged archive**. It never `eval`s a payload, never runs a
  caller-chosen path. *An agent run = a normal local run + a thin network wrapper.*

- **State machine (one job at a time):**
  ```
  IDLE ─/prepare─▶ PREPARED ─/start─▶ RUNNING ─k6 exits─▶ RETURNING ─▶ IDLE
                      │                  │
                      └─────/abort───────┘
  ```
- **Deployment:** Windows Service (`nssm`/`sc.exe`) or scheduled task keeping
  `node dist/cli/run.js agent` alive.

### 4.4 Lifecycle
1. **Archive** — controller runs `k6 archive` → one self-contained `.tar` (byte-identical
   code on every agent).
2. **Distribute** — `POST /prepare` with archive + per-agent `--execution-segment i/N` +
   sequence + `runId` + tags (token-authed).
3. **Pre-flight** — agents verify same k6 version, checksum, disk; report clock offset.
4. **PREPARE → START barrier** — agents load script, pre-allocate VUs, reply `ready`; once
   *all* ready, controller broadcasts `/start` ("START" = the go signal, not the Go
   language). This is a true rendezvous (k6's `SignalAndWait`), fixing Approach 2's
   best-effort start.
5. **Run** — each agent runs its segment via `PipelineRunner`, tags by `machine`, rolls
   histograms (+ raw under cap), and may **flush incrementally** to the controller.
6. **Return / stream** — artifacts streamed to the controller (incrementally or at end).
7. **Merge & report** — §1.5 + §2; thresholds post-merge → single `RunReport.html`.

### 4.5 Security
Token (constant-time compare) on every request; **bind to intranet NIC only**; **IP
allow-list** of controllers; **archive checksum** re-verified before staging; **only the
pinned k6 binary** invoked against the staged archive; **least-privilege service account**;
**audit log** per request; **fixed, declared ports** for a clean firewall request.

### 4.6 Transport alternatives (clearance trade-off)
A standing inbound service is the hardest thing to clear. Lower-clearance options, all
reusing the same merge engine:
- **Pull via shared location** — no inbound port on agents; agents poll the share for the
  job + a `START` marker and write results back. Lowest clearance; best-effort abort.
- **CI runners / SSH** — ride on already-approved infrastructure; no bespoke service.
- **Agent daemon (above)** — highest capability (live abort, streaming), highest clearance.

Recommendation: if the daemon's clearance is a blocker, ship Approach 1 over **pull-via-shared**
first and add the daemon only when synchronous control is required.

### 4.7 CI/CD
The standing agents (or pull-share) double as CI targets: the **CI job is the controller**,
collects, merges, publishes combined HTML + `ci-summary.json`; **global exit code drives the
gate**. One controller-assigned `runId` correlates everything.

### 4.8 Limitations
- **Security clearance** for a standing inbound service (mitigated by §4.6).
- **Controller is a single point of failure** (by design, matching k6).
- **Agent loss aborts by default** — correct for validity (a lost LG under-delivered load);
  `merge-partial` exists but is flagged INVALID.

---

## 5. Rollout plan

1. **Phase 0 — prereqs (non-invasive):** vendor CDN imports; add HDR histogram emission +
   per-machine output as an isolated opt-in layer; replicate k6's R-7 in a shared helper.
2. **Phase 1 — Approach 2:** `startAt` gate (CLI/env, isolated); per-machine shared-location
   write; **merge engine** (§1.5 + §2); single HTML. Validate accuracy (merged vs
   single-machine ground truth).
3. **Phase 2 — Approach 1:** controller/agent (or pull-via-shared) automation; true barrier;
   incremental streaming; aggregated live view. Reuses the Phase-1 merge engine unchanged.
4. **Phase 3 — retire the timer:** remove the `startAt` gate (clean deletion by design);
   controller-based becomes the only distributed mode.
- **Throughout:** local execution unchanged; distributed behind a toggle; CI-drivable.

---

## 6. Run manifest, merge validation & non-goals (review-driven)

An external architecture review surfaced ~20 points. Most were sized for a 50–100 agent
hyperscale deployment we don't have (a handful of VMs); those are listed as **non-goals**
below, kept cheap-to-add-later by the merge's associativity. The genuinely valuable, cheap,
in-scope items are folded in here.

### 6.1 Run manifest (extends the existing `run-manifest.json`)
Every run writes a manifest that the merge **validates before combining**:
```jsonc
{
  "runId": "load_2026_06_25_1430",      // unique; collision → merge refuses
  "schemaVersion": 1,                    // artifact/merge format version
  "frameworkVersion": "1.0.0",
  "k6Version": "0.5x.x",
  "scriptHash": "sha256:…",              // all agents must match
  "configHash": "sha256:…",              // plan + runtime settings
  "counterBucketSeconds": 2,
  "histogramBucketSeconds": 10,          // actual (resolved) value, even if adaptive
  "histogramRelativeAccuracy": 0.001,
  "partition": { "mode": "segment", "segments": ["0:1/3","1/3:2/3","2/3:1"] },
  "machine": "lg-a",
  "rawRetained": true, "rawBytes": 18234123, "rawSamples": 240112,
  "startTime": "…", "endTime": "…"
}
```

### 6.2 Pre-merge validation (subsumes review #6/#13/#14)
The merge **refuses** (or loudly flags) when per-machine manifests disagree:
- **runId** mismatch or **reuse** of an already-merged runId → refuse (prevents mixing runs).
- **scriptHash / configHash / k6Version / schemaVersion** mismatch → refuse (apples-to-apples).
- **bucket size / precision** mismatch → refuse (buckets must align to merge).
- **partition integrity** (`segment` mode): segments must cover `0:1` with **no overlap or
  gap** → refuse. (`user-split`: warn on suspicious VU totals.)

### 6.3 Merge-correctness test (review #19 — adopt into dev/CI)
A deterministic test: take one real single-machine run, **split** its raw stream into N
synthetic segments, run the merge, and **assert the merged result equals the single-machine
baseline** within tolerance (exact mode: 0; histogram mode: ≤ relative-accuracy). This is the
guardrail that proves the aggregation is correct and stays correct across changes.

### 6.4 Non-goals (explicitly deferred — associativity keeps them cheap later)
Rejected/deferred from the review, with rationale:
- **Tree-reduction, incremental merge, streaming merge, backpressure/queues** — YAGNI at a
  few agents. The merge is associative/commutative, so any of these is addable later with no
  redesign; not built now.
- **Mandatory lazy-loading report assets** — the single-file `RunReport.html` is a deliberate
  strength (portable, air-gapped, emailable). Only a **size-guard/histogram-downsample** is
  added for pathological cases; no mandatory split.
- **Per-metric / dynamic histogram precision** — a *relative*-error histogram is already
  scale-invariant (0.1% at 50 ms and at 30 s); per-metric tuning adds complexity for no gain.
- **Mid-test restart/resume of a failed agent** — structurally impossible in k6 (stateful
  VUs; k6's own design rejects hot-spares). Partial results from already-flushed buckets are
  surfaced (flagged INVALID) instead.
- **Continuous clock-offset interpolation** — Phase-2 (controller) refinement only; Phase 1
  relies on NTP + a single measured offset. Periodic re-measurement added when the controller
  exists.
- **Merge as a time-series database** — the merge only *combines immutable artifacts into
  aggregate metrics*. Arbitrary querying / historical comparison / live dashboards are the job
  of the future DB sink (§1.8), not the merge engine.

## 7. Consolidated limitations

**Accuracy / substrate**
- The **only** approximate value anywhere is a **Trend percentile in HDR mode (≤0.1%)**;
  everything else is exact (§2.7).
- **`exact` (raw pooling) must stay volume-capped** — unbounded raw pooling OOMs the
  aggregator (k6 design doc, line 173); `auto` enforces the cap.
- **Offline merge has a scale ceiling** — beyond it, the **DB sink** is the recommended path
  for extreme-volume endurance (§1.8).

**Distributed correctness**
- **No native k6 distributed primitives** (`k6 coordinator`/`k6 agent` are a design proposal,
  not in the OSS binary) — we build the controller/agent/barrier/merge layer.
- **Saturated machines silently under-deliver load** — surfaced in the System tab
  (detect-and-warn), not prevented; provision LGs adequately.
- **Clock skew** beyond offset correction degrades timeseries alignment; assumes NTP.

**Approach 2 (Phase 1) specific**
- **Best-effort start** (no VU-init barrier).
- **No mid-test / `abortOnFail` / `test.abort()`** — needs continuous central crunching.
- **Manual discipline** and **no auto distribution**; **shared-location dependency**.

**Approach 1 (Phase 2) specific**
- **Clearance** for a standing service (mitigated via pull-share / SSH / CI).
- **Controller SPOF**; **agent loss aborts** by default.

**General**
- **`replicate` foot-gun** — accidental N× load; mitigated by loud warnings.
- **Coupling to k6 output formats** — histogram emission + stream parsing depend on k6
  internals; a k6 upgrade may require merge-engine updates.
- **Operational step-up** vs today's single `k6 run`.

---

## Appendix A — k6 R-7 percentile (worked example)

Sorted response times (N=10): `[10,20,30,40,50,60,70,80,90,100]` ms.

- **p90:** `i = 0.90×(10−1) = 8.1` → `floor=8→90`, `ceil=9→100`, `f=0.1` →
  `90 + (100−90)×0.1 =` **91 ms**.
- **p95:** `i = 0.95×9 = 8.55` → `90 + 10×0.55 =` **95.5 ms**.
- **p50:** `i = 0.5×9 = 4.5` → `50 + 10×0.5 =` **55 ms**.

Multi-machine **exact** mode pools all LGs' raw values into one sorted array and applies the
same formula → bit-identical to k6 on one machine.

## Appendix B — Histogram merge (worked example)

`Login` latencies, 10 ms buckets (illustrative; real HDR buckets are ~0.1% wide):

```
            10–20ms   20–30ms   90–100ms
LG-A:          2         2          1
LG-B:          1         2          0
Merged:     2+1=3     2+2=4      1+0=1   (total 8)
```
p90 (nearest-rank, 90% of 8 → 8th obs): cumulative 10–20→3, 20–30→7, 90–100→8 → **8th obs in
90–100ms**. Exact answer = 90 ms; error ≤ bucket width. With HDR (0.1% buckets) the bucket
around 90 ms is ~0.09 ms wide → table shows **90.0 ms**, matching exact to one decimal.

For a sub-window, sum only the time-buckets in that window, then read the percentile off the
merged histogram — this is how "correct percentile for any duration" works.
