# Distributed Load Test — Test Guide

> How to test the Phase-1 distributed capability yourself. Pairs with
> [Distributed-Load-Test-Design-Approach.md](Distributed-Load-Test-Design-Approach.md).
> Commands shown for **PowerShell** (Windows) with a bash alternative where it differs.

## Prerequisites
```powershell
npm install
npm run build          # required after any src change (VU-side too)
k6 version             # k6 must be on PATH
```
A runnable plan exists at `config/test_plans/load_test.json`. Pick a short profile so tests
finish quickly.

---

## A. Automated checks (run first — no k6 needed)

### TC1 — Merge math correctness (synthetic, vs single-machine baseline)
**Objective:** prove counts/avg are exact and merged-histogram percentiles match a single
machine within tolerance.
```powershell
npm run test:merge
```
**Expect:** `✅ ALL MERGE CHECKS PASSED` — counts/pass/fail/avg exact; percentiles within ~0.1%.

### TC2 — Histogram vs REAL recorded k6 numbers
**Objective:** prove the histogram substrate matches k6's own percentiles on a real run.
```powershell
# any existing run dir under results\ that has metrics-stream.json + transaction-metrics.json
npm run validate:histogram -- "results\WebUI_Load_Test___jpet\Run_2026_06_18T21_48_10_397Z"
# or auto-pick the most recent run:
npm run validate:histogram
```
**Expect:** `✅ HISTOGRAM MATCHES k6 RECORDED NUMBERS` — avg/min/max exact, percentiles max ~0.1%.

---

## B. Single-machine behavior (backward compatibility)

### TC3 — Normal run is unaffected (no distributed env)
**Objective:** confirm nothing changed for ordinary runs.
```powershell
npm run cli -- run --plan config/test_plans/load_test.json
```
**Expect:** runs exactly as before; results under `results\<plan>\Run_<timestamp>\`; **no**
`metrics-histogram.json` is written (the distributed layer is fully opt-in).

### TC4 — Histogram emission is opt-in
```powershell
$env:K6_PERF_EMIT_HISTOGRAM = "1"
npm run cli -- run --plan config/test_plans/load_test.json
Remove-Item Env:\K6_PERF_EMIT_HISTOGRAM
```
**Expect:** the new run dir now also contains `metrics-histogram.json`. Validate it:
```powershell
npm run validate:histogram
```

---

## C. Distributed end-to-end on ONE machine (simulating 2 LGs)

Run two "machines" on one box by giving each its **own local results dir**
(`K6_RESULTS_BASE_DIR`) but the **same** `K6_PERF_START_AT` (→ same derived `runId`) and the
**same** `K6_PERF_COLLECT_DIR`.

### TC5 — Two LGs → collect → merge → single report
Pick a start time a couple of minutes in the future (same value in both terminals).

**Terminal 1 (LG-A):**
```powershell
$env:K6_RESULTS_BASE_DIR = "results-lg-a"
$env:K6_PERF_MACHINE     = "lg-a"
$env:K6_PERF_START_AT    = "2026-06-26T10:30:00Z"   # <- a near-future UTC time
$env:K6_PERF_COLLECT_DIR = "collected"
npm run cli -- run --plan config/test_plans/load_test.json
```
**Terminal 2 (LG-B)** — same `START_AT`, different machine + results dir:
```powershell
$env:K6_RESULTS_BASE_DIR = "results-lg-b"
$env:K6_PERF_MACHINE     = "lg-b"
$env:K6_PERF_START_AT    = "2026-06-26T10:30:00Z"   # <- identical to LG-A
$env:K6_PERF_COLLECT_DIR = "collected"
npm run cli -- run --plan config/test_plans/load_test.json
```
**Expect during run:** both terminals log `[start] waiting until shared start ...` and then
launch k6 together at the start time. Each finishes with
`Collected results to shared location: ...\collected\shared_Run_20260626103000\<machine>`.

**Merge (merge node = this box):**
```powershell
npm run cli -- merge --run-dir collected\shared_Run_20260626103000
```
**Expect:** `[merge] merged 2 machine(s)` and a `Report:` path. Open it:
```powershell
start collected\shared_Run_20260626103000\_merged\RunReport.html
```

**Verify the merge is correct:**
- Combined **request/iteration totals ≈ sum** of the two machines (open each
  `results-lg-*/<plan>/<runId>/timeseries.json` `totals` and compare to the merged one).
- Per-transaction **counts ≈ sum** across machines (compare `transaction-metrics.json`).
- Cross-check a percentile: run `validate:histogram` on each collected machine folder and
  confirm the merged p95/p99 sits between/around the per-machine values (not an average).

---

## D. Targeted behavior checks

### TC6 — Shared runId derives from the shared start time
After TC5, confirm **both** machines collected into the **same** `shared_Run_<digits>` folder
(derived from `K6_PERF_START_AT`), with no manually-set runId.
```powershell
Get-ChildItem collected\shared_Run_20260626103000
```
**Expect:** two subfolders `lg-a` and `lg-b`. (Alternatively set the same
`$env:K6_PERF_RUN_ID="my_run"` on both and expect `shared_my_run`.)

### TC7 — Start barrier waits
Set `K6_PERF_START_AT` ~60s in the future and start one run.
**Expect:** it logs `[start] waiting until shared start ... (Ns)` and does **not** launch k6
until that time. Unset it → k6 starts immediately (no wait).

### TC8 — Manual `collect` (instead of auto-collect)
Run without `K6_PERF_COLLECT_DIR`, then collect by hand:
```powershell
npm run cli -- collect --from results-lg-a\<plan>\<runId> --into collected2 --machine lg-a
npm run cli -- collect --from results-lg-b\<plan>\<runId> --into collected2 --machine lg-b
npm run cli -- merge --run-dir collected2\shared_<runId>
```
**Expect:** identical merged result; folder is `shared_<runId>` (the `shared_` prefix prevents
cross-test overwrites).

### TC9 — `merge` exit code drives CI
```powershell
npm run cli -- merge --run-dir collected\shared_<runId>
echo $LASTEXITCODE
```
**Expect:** `0` when the merged transaction failure rate is within budget, non-zero when it
exceeds it (so a CI job fails the build).

### TC10 (negative) — Precision mismatch is caught
Give the two machines different histogram precision and confirm the merge warns / refuses to
mix incompatible histograms:
```powershell
# LG-A run with default precision; LG-B run with:
$env:K6_PERF_HISTOGRAM_ALPHA = "0.0001"
```
**Expect:** on merge, a `[merge] histogram relativeAccuracy mismatch ...` warning (that
machine's histogram is skipped rather than mixed into an incompatible grid).

---

## E. Real multi-VM run (production shape)

On **each** load-generator VM (same `START_AT` and, if not deriving from it, same `RUN_ID`;
unique `MACHINE`; a `COLLECT_DIR` reachable from the merge node, or collect manually after):
```powershell
$env:K6_PERF_MACHINE   = "lg-3"
$env:K6_PERF_START_AT  = "<shared UTC start>"
$env:K6_PERF_COLLECT_DIR = "<path the merge node can read>"   # or copy folders manually
npm run cli -- run --plan config/test_plans/load_test.json
```
On the **merge node**:
```powershell
npm run cli -- merge --run-dir <COLLECT_DIR>\shared_<runId>
```
**Expect:** one `_merged\RunReport.html` aggregating every VM; the System tab shows each
machine's achieved load (watch for a saturated agent that under-delivered).

> Air-gapped note: until the CDN imports are vendored (pending Phase-0 item), the k6 entry
> script's two remote imports must be reachable at run time. Test on a host with that access,
> or wait for the vendoring change.

---

## Bash equivalents (macOS/Linux)
Replace the PowerShell env lines with inline prefixes, e.g.:
```bash
K6_RESULTS_BASE_DIR=results-lg-a K6_PERF_MACHINE=lg-a \
K6_PERF_START_AT=2026-06-26T10:30:00Z K6_PERF_COLLECT_DIR=collected \
  npm run cli -- run --plan config/test_plans/load_test.json
```

## Pass criteria summary
| TC | Pass when |
|---|---|
| TC1 | `test:merge` green |
| TC2 | `validate:histogram` green |
| TC3 | normal run unchanged; no histogram file |
| TC4 | `metrics-histogram.json` appears with the flag |
| TC5 | single merged `RunReport.html`; totals/counts ≈ sum of machines |
| TC6 | both machines under one `shared_<runId>` |
| TC7 | run waits until `START_AT` |
| TC8 | manual collect → same merged result |
| TC9 | exit code reflects pass/fail vs budget |
| TC10 | precision mismatch warned/skipped |
| TC11 (E) | real multi-VM merged report with per-machine System tab |
