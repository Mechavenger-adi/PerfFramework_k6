# FAQ

> Distilled from the engineering docs (`engineering_docs/`) and the root `README.md`.

**Why not just use plain k6?**
The framework adds a LoadRunner-style per-VU lifecycle (login once / actions repeat / logout once),
HAR→script generation, smart auto-correlation, artifact-first reporting for CI, and debug replay
diffing — on top of k6, not replacing it. See [FrameworkAtlas](../FrameworkAtlas.md).

**Why must I use `transaction()` and `k6Check()` instead of `group()`/`check()`?**
Only `k6Check` inside `transaction` produces the `<name>_checkrate` metric that gives *exact*
per-transaction pass/fail. A pre-flight guard rejects raw calls. See [EDD-reporting](../engineering_docs/edd/EDD-reporting.md).

**My VU-side change isn't taking effect.**
Run `npm run build`. k6 loads compiled `dist/`, not `.ts` source.

**Which executors are supported and how does logout still run during ramp-down?**
All k6 executors. Each VU computes when k6 will cull it and runs `endPhase` a margin before. Full detail:
[EDD-lifecycle](../engineering_docs/edd/EDD-lifecycle.md).

**What should CI consume?**
`run-summary.json` (and the other JSON/NDJSON artifacts) — not console text. Reporting is artifact-first.
It holds the gate fields at the top level plus the full per-transaction table, so `jq -r '.status'`
gates the pipeline and `.transactions[]` gives the detail.

**How do I keep replayed sessions valid across iterations?**
Auto-correlate dynamic values: [migration guide](migration.md) → correlate. Cookies persist by default
(`noCookiesReset: true`).

**Can I run distributed across machines?**
Yes — `collect` per machine then `merge` (see [CLI Reference](cli-reference.md)). Opt-in via
`K6_PERF_MACHINE` / `K6_PERF_RUN_ID` / `K6_PERF_START_AT`.

**Where do results go?**
`results/<plan-name>/Run_<timestamp>/` (or `K6_RESULTS_BASE_DIR`). Debug: `results/debug/…`.

**Is there an interactive mode?**
Yes — run `npm run cli` on a TTY with no subcommand, or `npm run cli -- menu`.

**Where's the field-level config reference?**
[configuration-reference.md](configuration-reference.md) (generated from JSON schemas).

**k6 crashes at startup with `fatal error: concurrent map read and map write`**
This is a **bug in k6 itself**, not the framework, and it only bites when **more than one
scenario** loads CSV test data via the experimental CSV module. The stack trace names
`experimental/csv` → `NewSharedArrayFrom` → `sobek`:

```
fatal error: concurrent map read and map write
  .../k6/experimental/csv/module.go   (*ModuleInstance).Parse.func1
  .../k6/data/share.go                sharedArray.wrap
```

`csv.parse()` does its work in a **background goroutine** that reaches into the shared JS
runtime ([`module.go`](https://github.com/grafana/k6) — k6's own comment notes the module
instance is shared in the RootModule). With two scenarios initialising at the same time,
two goroutines touch that shared state and Go aborts the process. Nothing in your test plan
causes it, and it is intermittent — it depends on init timing.

**Fix: load the data with `open()` + `SharedArray` instead of `csv.parse()`.** This is the
long-standing, non-experimental k6 pattern; `SharedArray` construction is serialised by k6,
parses once, and is shared across all VUs and scenarios:

```js
import { SharedArray } from 'k6/data';

// Parsed ONCE at init, shared by every VU in every scenario.
const members = new SharedArray('members', () => {
  const text = open('./data/members.csv');           // relative to the script
  const [header, ...rows] = text.trim().split('\n');
  const cols = header.split(',');
  return rows.map((line) => {
    const cells = line.split(',');
    return Object.fromEntries(cols.map((c, i) => [c.trim(), (cells[i] ?? '').trim()]));
  });
});

export default function () {
  const row = members[(__VU + __ITER) % members.length];
  // …
}
```

Keep the `SharedArray` **name** constant — that is what lets k6 store one copy. If your CSV
has quoted fields containing commas, parse accordingly inside the callback (the callback runs
once, so cost is irrelevant).
