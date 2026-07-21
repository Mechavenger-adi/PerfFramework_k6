# Presentation Outline: K6 Performance Framework

> **Refreshed 2026-07-13** to match the current code. Use this to frame a talk; for the code-cited
> specifics behind any slide, see the [Mental Model](mental-model.md) and the EDDs under
> [`engineering_docs/edd/`](../../engineering_docs/edd/), which are kept current with the code.

## Slide 1: Welcome & Intro
*   **Title:** Beyond Basic Testing: The Enterprise K6 Performance Framework
*   **Talking Points:**
    *   What is k6? (Open-source, developer-friendly load testing tool.)
    *   Why a framework? Native k6 lacks a per-VU login/logout lifecycle, artifact-first reporting,
        automatic correlation, data handling, and SLA-to-CI enforcement out of the box. We built this to
        scale testing seamlessly.
    *   **Goal of session:** learn where your scripts go, how to run them, and how to read the results.

## Slide 2: The Core Concept — Two Worlds
*   **Visual idea:** two boxes with an arrow — "Node orchestration" (before/after) and "k6 runtime" (during).
*   **Talking Points:**
    *   **Node.js orchestration (TypeScript):** loads config, validates, allocates VUs, sets SLAs, spawns
        k6, and builds the report. Runs before and after the test.
    *   **k6 runtime (JavaScript in goja):** your journey script + the VU-safe helpers. Runs *during* the
        test, per VU, thousands of times.
    *   **The one rule that follows from this:** k6 executes compiled `dist/`, not your `.ts`. Change
        VU-side code → **`npm run build`**. It's the #1 gotcha.

## Slide 3: Folder Structure (Where you live)
*   **Visual idea:** callouts pointing to `testSuites/` and `config/`.
*   **Talking Points:**
    *   **`core_engine/`:** engine internals — you rarely touch these.
    *   **`testSuites/your-team/`:** your home base.
        *   `tests/` → your `.js` journey scripts.
        *   `Data/` → your `.csv` test data.
        *   `recordings/` → captured HAR / recording logs.
    *   **`config/`:** change behavior without changing code.
        *   `test_plans/*.json` → load profiles, script mix, SLAs.
        *   `environments/*.json`, `runtime_settings/*.json` → URLs, timeouts, pacing, think time.

## Slide 4: Writing a Script (The Three Phases)
*   **Visual:** code snippet with `initPhase`, `actionPhase`, `endPhase` and `runJourneyLifecycle`.
*   **Talking Points:**
    *   Native k6: one stateless loop, no per-user setup/teardown.
    *   This framework: three phases driven by `runJourneyLifecycle(store, { initPhase, actionPhase, endPhase })`.
    *   **Init:** runs **once per VU** — login, clear cookies, pick a data row.
    *   **Action:** runs **every iteration** — the timed business transactions.
    *   **End:** runs **once, before k6 culls the VU** — logout / cleanup. (The framework computes each VU's
        cull deadline so logout still happens during ramp-down — this is the hard problem it solves for you.)
    *   Wrap each business step in `transaction('name', () => { ... k6Check(res, {...}) })`.

## Slide 5: Transactions, not raw requests
*   **Visual:** "Add to Cart" → 5 hidden HTTP requests → one `transaction()` metric.
*   **Talking Points:**
    *   Use `transaction()` + `k6Check()` — **not** raw k6 `group()`/`check()` (a pre-flight guard rejects
        them).
    *   Why: only `k6Check` inside `transaction()` emits `<name>_checkrate`, the metric that gives *exact*
        per-transaction pass/fail. Everything downstream (report, CI gate) depends on it.

## Slide 6: The Command Line (Running tests)
*   **Visual idea:** terminal screenshot.
*   **Talking Points:**
    *   Validate first: `npm run validate -- --plan config/test_plans/load_test.json`
    *   Run: `npm run cli -- run --plan config/test_plans/load_test.json` (or `npm run loadtest`).
    *   **What happens?** Gatekeeper pre-flight → k6 executes with a live console table → artifact-first
        report is built.

## Slide 7: Reading the Report
*   **Visual:** screenshot of `RunReport.html`.
*   **Talking Points:**
    *   Stop guessing whether a test "felt" slow.
    *   **Artifact-first:** every number in the HTML also exists as JSON/NDJSON — **CI consumes
        `run-summary.json`, never console text.**
    *   Tabs: **Summary** (did it pass?), **Transactions** (exact pass/fail + p95 timings), **Graphs**,
        **Errors**.
    *   SLA breach → k6 threshold fails → the run exits **99**, failing the pipeline natively.

## Slide 8: The extras that make it enterprise
*   **Auto-correlation:** `npm run correlate` scans a recording and rewrites your script to capture dynamic
    tokens (CSRF/JWT/session) — no hand-written rules.
*   **Debug replay:** `npm run debug` runs your script once (1 VU) and produces an HTML diff of live traffic
    vs the recording — catch a stale token before a load run.
*   **Generate from a recording:** `npm run generate -- MyTeam my-flow --har path/to.har` scaffolds a
    journey straight from a HAR.

---

## Interactive Demo (Live Walkthrough)

*Tell the audience you'll scaffold and run a script to show how simple it is.*

**Step 1 — Scaffold a new project/script**
```bash
npm run cli -- init
```
"This creates the team folder structure and a journey template with the three phases already wired up."

**Step 2 — Peek at a generated script**
Open a script under `testSuites/<team>/tests/`.
"Notice `initPhase` / `actionPhase` / `endPhase`, and each business step wrapped in `transaction()` with a
`k6Check()`. That's the whole contract."

**Step 3 — Show the test plan**
Open `config/test_plans/debug_test.json`.
"A pre-configured debug plan — 1 VU, a few iterations. Perfect for proving the script runs."

**Step 4 — Validate, then run**
```bash
npm run validate -- --plan config/test_plans/debug_test.json
npm run cli -- run --plan config/test_plans/debug_test.json
```
"Validate catches path/weight/SLA problems in seconds. Then the engine hands off to k6 and builds the
report."

**Step 5 — View the report**
Open the path shown in the terminal: `results/<Plan>/Run_.../RunReport.html`.
"No Grafana, no JSON wrangling — a complete per-transaction breakdown. And `run-summary.json` next to it is
what a pipeline would gate on."

**Step 6 (optional) — Debug diff**
```bash
npm run cli -- debug --script testSuites/<team>/tests/<your>.js
```
"One VU, same settings as load, and an HTML diff of live traffic vs the recording."

---
## Must-Know Points for your Team (Takeaways)
1. **Run `npm run build`** whenever you touch VU-side code in `core_engine/src/utils/*` — k6 runs `dist/`,
   not `.ts`.
2. **Use `transaction()` + `k6Check()`**, never raw `group()`/`check()` — only they produce exact pass/fail.
3. **Never hardcode URLs** — use the environment config (`config/environments/*.json`) via `getEnvContext()`.
4. **Point CI at `run-summary.json`.** If a run exits **99**, an SLA failed — the site was too slow, the test
   didn't crash.
5. **Stale token on iteration 2+?** Run `npm run correlate` before reaching for manual fixes.
