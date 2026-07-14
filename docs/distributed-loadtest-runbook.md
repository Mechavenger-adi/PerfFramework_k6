# Distributed Load Test — Operator Runbook

How to run one load test across several machines and get a **single merged report**, with a
**live dashboard** and **mid-test abort/stop** — without opening any inbound firewall port.

- **What it is / how it works:** [engineering_docs/edd/EDD-distributed-loadtest.md](../engineering_docs/edd/EDD-distributed-loadtest.md)
- **Roles:** one **controller** (watches + merges; doesn't have to generate load) and one or more **agents** (the load generators, "LGs").
- **Golden rule:** *live numbers are for watching (≤0.1% percentiles); the final `Final_…` report is exact.*

---

## 0. Prerequisites (once per machine)

1. **Build the framework** (compiled JS avoids the `tsx`/`esbuild` allow-list problem):
   ```
   npm run build
   ```
   Then run everything as `node dist\cli\run.js …`.
2. **`node.exe` and `k6.exe` must be allow-listed** and on PATH. Check:
   ```
   node -v ; k6 version
   ```
3. **A shared folder** every machine can read/write (SMB). Easiest: share the **controller's**
   results folder (below) so it reads/merges locally.
4. **Clocks in sync (NTP).** Start alignment and timeseries merging assume it.

---

## 1. Quick start (2 LGs + controller)

Pick three shared values up front, identical on **every** machine:

| Value | Example | Notes |
|---|---|---|
| Run ID | `run_1430` | same on all machines |
| Start time | `2026-07-20T14:30:00Z` | ISO 8601, a few minutes in the future |
| Share (UNC) | `\\CTRL01\k6results` | the collect/live location |

**On the controller** — get the share command + the line to give the LGs:
```
node dist\cli\run.js share-setup --host CTRL01
```
Share the folder it prints (admin PowerShell), then start the **live dashboard**:
```
node dist\cli\run.js monitor --serve --collect-dir \\CTRL01\k6results --run-id run_1430 --port 8787
```
Open **http://localhost:8787** on the controller (or `--host 0.0.0.0` + an open port to view from your desk).

**On each LG** (PowerShell) — unique `K6_PERF_MACHINE`, everything else shared:
```powershell
$env:K6_PERF_RUN_ID   = "run_1430"
$env:K6_PERF_START_AT = "2026-07-20T14:30:00Z"
$env:K6_PERF_MACHINE  = "lg-a"                 # lg-b on the second box
$env:K6_PERF_COLLECT_DIR = "\\CTRL01\k6results"
node dist\cli\run.js run --plan config\test_plans\load_test.json --distributed --role agent
```
Each LG waits until `START_AT`, runs its slice, streams a live heartbeat to the share, and — when it
finishes — copies its results into `\\CTRL01\k6results\shared_run_1430\<machine>\`.

**Back on the controller** — auto-finalize into one report (blocks until all LGs land):
```
node dist\cli\run.js merge --wait --machines lg-a,lg-b --run-dir \\CTRL01\k6results\shared_run_1430
```
Result: **`\\CTRL01\k6results\shared_run_1430\Final_<testname>_<ts>\RunReport.html`** — the exact, merged report.

---

## 2. During the test

- **Live dashboard** (`monitor --serve`) or **console** (`monitor` without `--serve`) shows:
  - **FLEET** — per-machine state / VUs / throughput / error % (spot a lagging or saturated LG).
  - **COMBINED TRANSACTIONS** — count · err% · avg · min · max · p90 · p95 · p99 merged across all machines.
- **Stop or Abort** from the dashboard buttons, or the CLI:
  ```
  node dist\cli\run.js signal --collect-dir \\CTRL01\k6results --run-id run_1430 --mode stop   # graceful (valid report)
  node dist\cli\run.js signal --collect-dir \\CTRL01\k6results --run-id run_1430 --mode abort  # immediate (partial/INVALID)
  ```
  - **stop** = each LG finishes in-flight iterations, writes a valid **STOPPED-EARLY** report, then flows to the end phase.
  - **abort** = k6 is killed now; artifacts are partial and flagged **INVALID**. Use for a runaway/wrong test.
  - The dashboard shows each LG acknowledging (`stopping`/`aborting` → `stopped`/`aborted`).

---

## 3. Environment variable reference

| Variable | Required | Purpose |
|---|---|---|
| `K6_PERF_DISTRIBUTED` | yes (or `--distributed`) | Turn on distributed mode |
| `K6_PERF_ROLE` | optional (or `--role`) | `agent` or `controller` |
| `K6_PERF_RUN_ID` | **same on all** | Groups the run; folder name |
| `K6_PERF_START_AT` | recommended | Shared wall-clock start (ISO). Also derives the runId if `RUN_ID` unset |
| `K6_PERF_MACHINE` | **unique per LG** | Machine name (tags + folder). Defaults to hostname |
| `K6_PERF_TEST_ID` | optional | Shared test id (default `TID_<plan>`); merge warns if they differ |
| `K6_PERF_COLLECT_DIR` | yes (for live + collect) | The shared folder (`\\host\share`) |
| `K6_PERF_K6_API` | optional | k6 REST API address for graceful stop (default `127.0.0.1:6565`) |

**Run ID agreement:** set `K6_PERF_RUN_ID` the same everywhere, **or** just set the same `K6_PERF_START_AT`
(the runId is derived from it identically on every machine).

---

## 4. Command reference

| Command | Where | Purpose |
|---|---|---|
| `run --plan … --distributed --role agent` | LG | Run this machine's slice |
| `share-setup --host <ctrl>` | controller | Print how to share the results folder + the `COLLECT_DIR` line |
| `monitor --collect-dir <share> --run-id <id>` | controller | Combined **console** live view |
| `monitor --serve --collect-dir <share> --run-id <id> --port 8787` | controller | Combined **browser** dashboard |
| `signal --collect-dir <share> --run-id <id> --mode abort\|stop` | controller | Mid-test control (CLI) |
| `merge --wait --machines lg-a,lg-b --run-dir <share>\shared_<id>` | controller | Auto-finalize → `Final_…` report |
| `collect --from <localRunDir> --into <share> --machine <name>` | LG | Manual collect (if not using `COLLECT_DIR`) |
| `probe --tcp <host>:<port>` | any | Firewall reachability check |

---

## 5. Firewall & connectivity

The controller→agent **inbound** path is usually blocked, which is why this design uses **outbound-only**
writes to a shared folder — no LG opens a port. What you *do* need:

- **SMB (445) to the share** reachable from every machine. Verify from an LG:
  ```
  node dist\cli\run.js probe --tcp CTRL01:445
  ```
- Windows Firewall on the machine hosting the share must allow **File and Printer Sharing** inbound.

If you later get a port opened controller→agents, the same tools support the automated controller path
(see the EDD's Phase-2 section).

---

## 6. Reading the results — exact vs live

| Metric | Live dashboard | Final report |
|---|---|---|
| count, throughput, errors, VUs, min, max, avg | exact | exact |
| p90 / p95 / p99 / median, std | ≤0.1% (histogram) | **exact** (pooled raw, R-7) |
| Over-time graphs (min/avg/max/std + every configured percentile) | combined | **exact**, driven by `reporting.transactionStats` |

**Make go/no-go decisions from the `Final_…` report**, not the live view.

---

## 7. Gotchas

- **Set `START_AT` far enough ahead** that every machine finishes VU init before it (start sync is a
  shared timer, not a hard barrier).
- **Unique `K6_PERF_MACHINE` per LG** — two machines with the same name collide in the collect folder.
- **Graceful stop needs the k6 REST API** — distributed runs enable it via `--address` automatically; if a
  box runs two k6 instances, set `K6_PERF_K6_API` to avoid a port clash.
- **`merge --wait` needs `--machines`** so it knows when the run is complete; it times out after
  `--wait-timeout` (default 600s).
- **VU split is manual** — decide per-machine VUs so the total is what you intend; the merge sums them.
- Raw `metrics-stream.json` stays **local** (excluded from collect). Use `collect --include-raw` if you
  need it centrally.

---

## 8. Known limitations (this phase)

- Best-effort start (shared timer, no VU-init barrier); no live *merged* percentile (per-transaction
  combined via histogram; exact at end); manual VU split & test distribution; shared-folder dependency;
  live dashboard is controller-local until a firewall port is opened. Full list + Phase-2 plan in the EDD.
