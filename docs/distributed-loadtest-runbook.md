# Distributed Load Test — Operator Runbook

Run **one** load test across several machines and get **one merged report**, watch it **live**, and
**abort/stop** mid-test — with **no inbound firewall ports**.

Design/EDD: [engineering_docs/edd/EDD-distributed-loadtest.md](../engineering_docs/edd/EDD-distributed-loadtest.md)

---

## The model in 30 seconds

- **This is Phase 1 (manual).** *You* start each machine by hand. There is **no** central program
  orchestrating anything — the machines coordinate through a **shared folder** (they only ever write
  outward to it). Phase 2 (a controller that commands the agents over the network) is **not built**.
- **Two roles:**
  - **agent** = a load generator ("LG"). It **runs the test** (`run` command).
  - **controller** = one machine that **watches and merges** (`monitor` + `merge`). It does not have to
    generate load.
- **You run different commands on different machines** — see the table below. That's the part that's easy
  to mix up, so keep this open.

### Which command does what

| Command | Run it on | Purpose |
|---|---|---|
| **`run … --distributed --role agent`** | **each LG** | **Runs the load test** on that machine |
| `share-setup` | controller (setup) | Prints how to share the results folder + the line to give the LGs |
| `monitor --serve` | controller (during) | Serves the **combined live dashboard** in a browser |
| `signal --mode stop\|abort` | controller (during) | Stop/abort the test mid-run |
| `merge --wait` | controller (after) | Combines everything into the **final report** |

> **About the "dashboard on every machine":** each k6 process starts **k6's own** dashboard at
> `http://localhost:5665` — that shows **only that one machine** and is a built-in k6 feature. **Our**
> combined dashboard is served **only by the controller** via `monitor --serve`. So seeing `:5665` on every
> LG is normal and is **not** Phase 2.

---

## Setup (once per machine)

1. **Build** (so you can run the compiled JS — avoids the `tsx`/`esbuild` allow-list issue):
   ```
   npm run build
   ```
2. **Check `node` and `k6` are allowed & on PATH:**
   ```
   node -v
   k6 version
   ```
3. **Have a shared folder** every machine can read/write (SMB). Simplest: share the **controller's**
   results folder (Step 1 below).

---

## Running a test — step by step

### Step 1 — (controller) share the results folder
```
node dist\cli\run.js share-setup --host CTRL01
```
Run the `New-SmbShare`/`net share` line it prints (as **Administrator**). Note the UNC path it gives, e.g.
`\\CTRL01\k6results`, and the `K6_PERF_COLLECT_DIR=…` line for the LGs.

### Step 2 — (all machines) agree on the run, via `.env`
Copy `.env.template` to `.env` on **each** machine and set the distributed block. **Same** values on every
machine **except `K6_PERF_MACHINE`**, which is unique:
```
K6_PERF_DISTRIBUTED=1
K6_PERF_ROLE=agent
K6_PERF_MACHINE=lg-a                       # lg-b on the 2nd box, lg-c on the 3rd …
K6_PERF_RUN_ID=run_1430
K6_PERF_START_AT=2026-07-20T14:30:00Z      # a few minutes in the future, UTC
K6_PERF_COLLECT_DIR=\\CTRL01\k6results
```
(On the controller's own `.env`, set `K6_PERF_ROLE=controller` — only needed if it also generates load.)

### Step 3 — (controller) start the live dashboard
```
node dist\cli\run.js monitor --serve --collect-dir \\CTRL01\k6results --run-id run_1430 --port 8787
```
Open **http://localhost:8787** on the controller. (It says "waiting for machines" until the LGs start.)

### Step 4 — (each LG) run the test
With `.env` filled in, the command is small:
```
node dist\cli\run.js run --plan config\test_plans\load_test.json
```
Each LG waits until `START_AT`, runs, streams a live heartbeat to the share, and copies its results to
`\\CTRL01\k6results\shared_run_1430\<machine>\` when done.

### Step 5 — (controller) finalize into one report
```
node dist\cli\run.js merge --wait --machines lg-a,lg-b --run-dir \\CTRL01\k6results\shared_run_1430
```
`--wait` blocks until **every** machine in `--machines` has finished and collected in, then merges.

### Step 6 — open the report
```
\\CTRL01\k6results\shared_run_1430\Final_<testname>_<timestamp>\RunReport.html
```
This is the **exact**, merged report — the one you make decisions from.

---

## Copy-paste commands (small)

**LG** (after `.env` is filled):
```
node dist\cli\run.js run --plan config\test_plans\load_test.json
```

**Controller — share / monitor / stop / merge:**
```
node dist\cli\run.js share-setup --host CTRL01
node dist\cli\run.js monitor --serve --collect-dir \\CTRL01\k6results --run-id run_1430 --port 8787
node dist\cli\run.js signal --collect-dir \\CTRL01\k6results --run-id run_1430 --mode stop
node dist\cli\run.js merge  --wait --machines lg-a,lg-b --run-dir \\CTRL01\k6results\shared_run_1430
```

**Don't want to use `.env`?** Put the values on the command line instead (PowerShell):
```powershell
$env:K6_PERF_RUN_ID="run_1430"; $env:K6_PERF_START_AT="2026-07-20T14:30:00Z"
$env:K6_PERF_MACHINE="lg-a"; $env:K6_PERF_COLLECT_DIR="\\CTRL01\k6results"
node dist\cli\run.js run --plan config\test_plans\load_test.json --distributed --role agent
```

---

## Monitoring & control (during the run)

- **Combined dashboard:** `monitor --serve` (browser) — or drop `--serve` for the **console** view.
  - **FLEET** panel: per-machine state / VUs / throughput / error % (spot a lagging or saturated LG).
  - **COMBINED TRANSACTIONS**: count · err% · avg · min · max · p90 · p95 · p99 merged across all machines.
- **Stop vs Abort** (dashboard buttons, or the `signal` command):
  - **stop** = graceful — each LG finishes in-flight iterations and writes a **valid** report over the
    shorter window (STOPPED-EARLY). You then run `merge`.
  - **abort** = immediate — k6 is killed; artifacts are **partial and flagged INVALID**. Use for a runaway
    or misconfigured test.

---

## Exact vs live — where to read what

| Metric | Live dashboard | Final report |
|---|---|---|
| count, throughput, errors, VUs, min, max, avg | exact | exact |
| p90 / p95 / p99 / median, std | ≤0.1% (histogram) | **exact** (pooled raw) |
| over-time graphs (min/avg/max/std + every configured percentile) | combined | **exact**, driven by `reporting.transactionStats` |

**Make go/no-go calls from the `Final_…` report**, not the live view.

---

## Troubleshooting

- **Dashboard says "waiting for machines"** → no LG has started yet, or `--collect-dir`/`--run-id` don't
  match what the LGs use. They must point at the same share + runId.
- **LG can't reach the share** → verify SMB from that LG: `node dist\cli\run.js probe --tcp CTRL01:445`.
  On the share host, allow **File and Printer Sharing** inbound.
- **`merge` says "no per-machine artifact folders"** → the LGs haven't collected yet, or `--run-dir` is
  wrong. It should be `<share>\shared_<runId>`.
- **`merge --wait` never finishes** → an LG in `--machines` never landed (crashed / wrong `COLLECT_DIR`).
  It times out after `--wait-timeout` (default 600s).
- **Graceful stop didn't stop k6** → the k6 REST API wasn't reachable; distributed runs enable it via
  `--address` automatically. If a box runs two k6s, set `K6_PERF_K6_API` to distinct ports.
- **Two machines overwrote each other** → they shared a `K6_PERF_MACHINE`; it must be unique per LG.

---

## What's **not** built yet (Phase 2)

- A **controller that commands the agents over the network** (auto-distribute the test, a true start
  barrier, live abort push). Today you start each machine yourself; the shared folder is the only channel.
- **Automated share creation** (Step 1 is manual).
- A **network-reachable** dashboard (today it binds `127.0.0.1`; view on the controller, or bind
  `--host 0.0.0.0` once a firewall port is opened).

Full design + Phase-2 plan: the EDD linked at the top.
