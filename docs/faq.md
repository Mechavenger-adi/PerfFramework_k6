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
`ci-summary.json` (and the other JSON/NDJSON artifacts) — not console text. Reporting is artifact-first.

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
