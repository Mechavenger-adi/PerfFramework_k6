# Day 1: Zero to First Passing Run

> A guided checklist for a new engineer. Everything here uses only published docs. Tick each box.
> Derived from [Installation](../installation.md), [Getting Started](../getting-started.md), and the
> engineering docs (`engineering_docs/edd/`).

**Goal:** by the end you will have run a load test, read its report, and produced a debug diff — and you
will understand why each step exists.

---

## Step 0 — Install the toolchain (~10 min)
- [ ] Node.js 22+, npm 11+, Git, and **Grafana k6 on your `PATH`** (`k6 version` works).
- [ ] From the repo root: `npm install` then `npm run build`.

> **Why `npm run build`?** k6 executes the compiled `dist/` output, not the TypeScript source. Any time
> you change VU-side framework code (`core_engine/src/utils/*`), rebuild. This is the #1 "my change did
> nothing" gotcha. Full detail: [installation](../installation.md).

## Step 1 — Orient yourself (~10 min)
- [ ] Open the [Framework Atlas](../../FrameworkAtlas.md). Skim "Feature → owner".
- [ ] Read [Mental Model](mental-model.md) up to "The per-VU lifecycle".

> You don't need to read source yet. The Atlas + feature index tell you which files own what.

## Step 2 — Run the example (~5 min)
- [ ] `npm run validate -- --plan config/test_plans/load_test.json --verbose`
- [ ] `npm run loadtest` (shortcut for the default load plan)
- [ ] Watch the live console table update while k6 runs.

> **Why validate first?** The Gatekeeper pre-flight checks that scripts/data exist and weights are sane —
> it fails in seconds instead of after k6 spins up. See [EDD-config](../../engineering_docs/edd/EDD-config.md).

## Step 3 — Read the report (~10 min)
- [ ] Open `results/WebUI_Load_Test*/Run_*/RunReport.html`.
- [ ] Tabs to look at: **Summary**, **Transactions** (pass/fail + timings), **Graphs**, **Errors**.
- [ ] Open `run-summary.json` — this is what a pipeline consumes, not console text.

> **Why "artifact-first"?** Every number in the HTML also exists as JSON/NDJSON so CI can gate on it.
> Pass/fail comes exactly from each transaction's `_checkrate` metric. See
> [EDD-reporting](../../engineering_docs/edd/EDD-reporting.md).

## Step 4 — Author your own journey (~20 min)
- [ ] Pick a target and generate a starting script:
  - From a HAR: `npm run generate -- MyTeam my-flow --har path/to.har`
  - Or blank: `npm run cli -- generate-byos MyTeam my-flow`
- [ ] Open the generated script under `testSuites/MyTeam/tests/`. Note the phase shape:
  `initPhase` (login, once) → `actionPhase` (business flow, repeats) → `endPhase` (logout, once).
- [ ] Wrap each business step in `transaction('name', () => { ... k6Check(res, {...}) })`.

> **Why `transaction()`/`k6Check()` and not `group()`/`check()`?** Only these produce the exact pass/fail
> metric; a pre-flight guard rejects the raw k6 calls. See [EDD-lifecycle](../../engineering_docs/edd/EDD-lifecycle.md).

## Step 5 — Handle dynamic tokens (~15 min)
- [ ] If replaying fails on iteration 2+ (stale CSRF/session/JWT), auto-correlate:
  - `npm run correlate -- --log testSuites/MyTeam/recordings/my-flow.recording-log.json` (review)
  - `npm run correlate -- --script testSuites/MyTeam/tests/my-flow.js --apply high` (rewrite)

> **Why?** Recorded tokens are stale on replay. Auto-correlation infers producer→consumer links and
> rewrites the script. See [EDD-auto-correlation](../../engineering_docs/edd/EDD-auto-correlation.md).

## Step 6 — Debug with a diff (~10 min)
- [ ] `npm run cli -- debug --script testSuites/MyTeam/tests/my-flow.js`
- [ ] Open the generated `*.diff.html` — it compares your live replay against the recording.

> Debug runs 1 VU with the *same* runtime settings as load, so a script that passes debug behaves under
> load. See [EDD-debug-replay](../../engineering_docs/edd/EDD-debug-replay.md).

## Step 7 — Run your journey under load
- [ ] Add your journey to a test plan (`config/test_plans/*.json`) — see [Configuration](../configuration.md).
- [ ] `npm run cli -- run --plan config/test_plans/<your-plan>.json`

---

## You're onboarded when you can
- [ ] Explain the Node-orchestration vs k6-runtime split and why you rebuild `dist/`.
- [ ] Describe what `initPhase`/`actionPhase`/`endPhase` each do and how often.
- [ ] Find which file owns a feature using the [Atlas](../../FrameworkAtlas.md) / `feature_index.json`.
- [ ] Point CI at `run-summary.json`.

## Where to go next
- [Mental Model](mental-model.md) (the rest of it) → then the [EDDs](../../engineering_docs/edd/).
- Stuck? [Troubleshooting](../troubleshooting.md) · [FAQ](../faq.md).
