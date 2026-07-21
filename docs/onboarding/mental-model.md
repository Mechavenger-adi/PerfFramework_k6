# Mental Model

> The concepts that make the rest of the framework obvious. Distilled from the engineering docs
> (`engineering_docs/edd/`) and `ai_context/framework-philosophy.md` — and kept accurate to the current
> code. Where the legacy `KT_*` decks differ, this page wins.

## 1. Two sides: Node orchestration vs k6 runtime

The framework is split across two execution worlds:

| | Node.js orchestration | k6 runtime (goja) |
|---|---|---|
| **When** | before/after the test | during the test, per VU, thousands of times |
| **Where** | `cli/`, `config/`, `scenario/`, `execution/`, `reporting/`, `debug/` | `utils/` (+ `runtime/`) |
| **Imports** | anything (Node built-ins fine) | **VU-safe only, via `dist/index.js`** — no `fs`/`path` |
| **You edit** | rarely (framework internals) | your journey scripts import these helpers |

**The rebuild rule:** k6 loads compiled `dist/`, not `.ts`. Change VU-side code → `npm run build`.
This is the single most common gotcha. See [EDD-lifecycle](../../engineering_docs/edd/EDD-lifecycle.md) (RZ1: the Node↔k6 boundary).

## 2. The per-VU lifecycle

A journey script exports three phases; the framework drives them per virtual user:

```javascript
import { createJourneyLifecycleStore, runJourneyLifecycle, transaction, k6Check } from '../../../dist/index.js';
const store = createJourneyLifecycleStore();

export function initPhase(ctx)   { /* login/setup — runs ONCE per VU */ }
export function actionPhase(ctx) { /* business flow — runs each iteration */ }
export function endPhase(ctx)    { /* logout/cleanup — runs ONCE, before k6 culls the VU */ }

export default function () {
  runJourneyLifecycle(store, { initPhase, actionPhase, endPhase });
}
```

- `initPhase` runs **once** per VU (guarded), not every iteration.
- `actionPhase` runs **every iteration**.
- `endPhase` is the hard part: k6 removes VUs during ramp-down *without a final callback*, so each VU
  computes when it will be culled and runs `endPhase` a safety margin before. This works across every k6
  executor. Full mechanism (with `file:line`): [EDD-lifecycle](../../engineering_docs/edd/EDD-lifecycle.md).

## 3. Transactions, not raw requests

Wrap business steps in `transaction('name', fn)` and assert with `k6Check` (not k6's `group`/`check`):

```javascript
transaction('AddToCart', () => {
  const res = http.post(`${ctx.session.baseUrl}/cart/add`, payload);
  k6Check(res, { 'status 200': (r) => r.status === 200 });
});
```

A pre-flight guard **rejects** raw `group()`/`check()` because only `k6Check` inside `transaction`
produces `<name>_checkrate` — the metric that gives *exact* per-transaction pass/fail (invariant:
`passes + fails == count`). Error behavior (`continue`/`stop_iteration`/`stop_vu`/`abort_test`) is applied
here too. See [EDD-reporting](../../engineering_docs/edd/EDD-reporting.md) and [EDD-lifecycle](../../engineering_docs/edd/EDD-lifecycle.md).

## 4. Config resolves in layers

Framework defaults → environment → runtime settings → CLI → `.env` secrets, merged in that order.
Files are JSONC (comments), schema-validated up front (typos fail fast with suggestions). SLAs in the test
plan become k6 thresholds. One quirk: **arrays are replaced wholesale, not merged**. See
[EDD-config](../../engineering_docs/edd/EDD-config.md) and the [Configuration Guide](../configuration.md).

## 5. Reporting is artifact-first

k6's raw output is transformed into stable JSON/NDJSON artifacts *plus* an interactive `RunReport.html`.
**CI consumes `run-summary.json`**, never console text. Debug replay produces an HTML diff of live vs
recorded traffic. See [EDD-reporting](../../engineering_docs/edd/EDD-reporting.md) and [EDD-debug-replay](../../engineering_docs/edd/EDD-debug-replay.md).

## 6. The documentation is a system too

Four layers, each with a job — so you read the smallest thing that answers your question:

| Layer | Where | Use it to |
|-------|-------|-----------|
| L1 | `ai_context/` + [FrameworkAtlas.md](../../FrameworkAtlas.md) | route: which file owns a feature, the rules you must not break |
| L2 | `engineering_docs/` | understand a subsystem deeply (EDDs, reverse-engineered from code) |
| L3 | `docs/` (you are here) | use the framework as a user |
| L4 | `ai_generated/*.json` | machine indexes (feature/file/symbol/config) — generated, never hand-edited |

Outdated docs are treated as bugs; generators + a staleness gate (`npm run docs:check`) keep the generated
parts honest.

## Now what?
- Do the [Day 1 path](day-1.md) if you haven't.
- Read the EDD for whatever you're about to touch: `engineering_docs/edd/`.
- Find owners fast via the [Atlas](../../FrameworkAtlas.md) or `ai_generated/feature_index.json`.
