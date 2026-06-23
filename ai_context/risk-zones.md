# Risk Zones

> Areas with hidden complexity, undocumented assumptions, or elevated failure risk.

## RZ1 — Node-Side ↔ k6-Side Boundary

**Risk:** Code in `core_engine/src/utils/` compiles to `dist/utils/` and runs inside k6's goja engine, which is NOT Node.js. Accidentally importing `fs`, `path`, or any Node built-in causes k6 runtime failure.

**Hidden assumption:** `tsc` must be run after every change to k6-side files. Source `.ts` files are never directly loaded by k6.

**Files affected:** `transaction.ts`, `replayLogger.ts`, `session.ts`, `lifecycle.ts`

## RZ2 — Entry Script Generation in run.ts

**Risk:** Normal load runs generate a temporary entry script that imports all journey scripts. This script's filesystem location determines relative path resolution for data files.

**Hidden assumption:** When all journeys share a directory, the entry script goes there. Otherwise it goes to `.k6-temp/`. Scripts using `../Data/file.csv` will fail if the entry script is in the wrong directory.

**Coupling:** `PipelineRunner` → entry script path → k6 working directory → relative imports in journey scripts.

## RZ3 — ConfigurationManager.deepMerge() Array Handling

**Risk:** Arrays must be replaced wholesale, not deep-merged. Reverting this fix would cause `transactionStats` (and any future array config) to silently corrupt.

**Hidden assumption:** `Array.isArray()` check must run before `typeof === 'object'` check in `deepMerge()`.

## RZ4 — ScenarioBuilder Phase Envelope ↔ lifecycle.ts Synchronization

**Risk:** `computePhaseEnvelope()` produces `K6_PERF_PHASES` JSON that `lifecycle.ts` consumes. Format mismatch causes VU lifecycle failures (endPhase not running, or running at wrong time).

**Hidden assumption:** Durations in `K6_PERF_PHASES.stages` are in seconds (not milliseconds). `lifecycle.ts` multiplies by 1000 for k6's `exec.test.elapsed`.

## RZ5 — k6 Flag vs JSON Config Behavior

**Risk:** Not all k6 options work the same way when passed via JSON config vs CLI flags. `summaryTrendStats` only works as CLI flag.

**Hidden assumption:** `PipelineRunner` constructs k6 CLI args. Adding new k6 options requires testing whether they work in JSON config.

## RZ6 — HTMLDiffReporter Self-Contained HTML

**Risk:** 87KB TypeScript file generates all CSS, JS, and HTML inline. Any change can break:
- CSS grid layouts
- Sticky positioning
- Search functionality
- Sortable table headers
- Scroll sync between panes
- Iteration selector state
- Chart.js rendering

**Hidden assumption:** HTML is self-contained — no external CSS/JS files. CDN-loaded Chart.js 4.4.7 is the only external dependency.

## RZ7 — ThresholdManager Dynamic Percentile Detection

**Risk:** Threshold keys are detected by regex `/^p(\d+(?:\.\d+)?)$/`. Custom SLA keys that match this pattern but aren't valid k6 stats will silently generate broken thresholds.

**Hidden assumption:** k6 only accepts percentile stats in `p(N)` format, not `pN`. ThresholdManager converts.

## RZ8 — Transaction Counter vs Check-Based Pass/Fail

**Risk:** `TransactionMetricsBuilder` computes `fail = count - pass` where `count` comes from `<name>_count` Counter and `pass` comes from k6 check results. If a transaction has no checks, `pass` defaults to `count` and `fail` = 0, which may not reflect actual failures.

**Hidden assumption:** Every transaction should have at least one `check()` call for pass/fail to be meaningful.

## RZ9 — Multi-Team Suite Isolation

**Risk:** Team folders in `testSuites/` are logically isolated but not enforced. Nothing prevents one team's script from importing another team's data files.

**Hidden assumption:** `PathResolver` searches all of `testSuites/` recursively, so a filename collision across teams could resolve to the wrong file.

## RZ10 — JSONC Parsing in Config Pipeline

**Risk:** `jsonc-parser` is used for config files but standard `JSON.parse()` may still be used in other code paths (test plan templates, recording logs, etc.).

**Hidden assumption:** Only files loaded through `ConfigurationManager.ts` and `TestPlanLoader.ts` support comments. Other JSON files use standard parsing.
