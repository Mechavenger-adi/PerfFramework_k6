# Known Technical Debt

> Acknowledged shortcuts, gaps, and areas that need future work.

## TD1 — No Tests

**Severity:** High
**Description:** Zero unit tests, integration tests, or end-to-end tests exist.
**Impact:** Changes are verified only by manual testing and `tsc --noEmit`.
**Mitigation needed:** Test framework setup + tests for config merge, scenario builder, journey allocator, data validator, diff checker.

## TD2 — Reporter Stubs

**Severity:** Medium
**Description:** GrafanaReporter, AzureReporter, CustomUploader are placeholder stubs that log actions but don't actually push data.
**Impact:** No real external reporting integration works.
**Files:** `core_engine/src/reporters/`.

## TD3 — Summary-Derived Observability Only

**Severity:** Medium
**Description:** Error/warning events are derived from end-of-run `summary.json`, not streamed per-request during execution.
**Impact:** No real-time error visibility during long tests. No request/response-level failure context.
**Pending:** Runtime event streaming from lifecycle wrapper.

## TD4 — No Snapshot-on-Failure

**Severity:** Medium
**Description:** `SnapshotRuntime.ts` is scaffolded but snapshot JSON files are not generated when assertions fail.
**Impact:** Debugging failed assertions requires manual investigation.

## TD5 — Simplified JSONPath Extractor

**Severity:** Low
**Description:** The `jsonpath` extractor in `ExtractorRegistry.ts` uses simple dot-notation, not full JSONPath spec.
**Impact:** Complex JSONPath expressions (arrays, filters, wildcards) won't work.

## TD6 — No npm Publish Workflow

**Severity:** Medium
**Description:** No dual ESM/CJS build, no npm publish pipeline, no versioning strategy.
**Impact:** Framework must be consumed as a monorepo, not as an installable package.

## TD7 — HTMLDiffReporter Size (87KB)

**Severity:** Low (code quality)
**Description:** Single file generates all CSS, JS, and HTML for the debug report. Hard to maintain and test.
**Impact:** Changes are risky (see fragile-areas.md F1).
**Potential improvement:** Extract CSS/JS into template files or use a lightweight template engine.

## TD8 — Secondary Service URL Auto-Mapping Missing

**Severity:** Low
**Description:** Generated and converted scripts now resolve primary-host requests through environment `baseUrl`, but captured multi-origin traffic is not automatically mapped to named `serviceUrls`.
**Impact:** Secondary domains may still remain as recorded absolute URLs unless the script explicitly uses `resolveFrameworkUrl(..., { service: 'name' })` or is manually refined.

## TD9 — `config/correlation-rules/` Directory ~~Empty~~ (RESOLVED 2026-06-15)

**Status:** Resolved. Now holds `auto-correlation.defaults.json` (token vocabulary + scoring thresholds for the auto-correlation scanner). Per-team rule files still live in `testSuites/{team}/`.

## TD10 — Dependent-Request Flow Control Missing

**Severity:** Low
**Description:** Correlation fallback `skip` returns empty string but doesn't actually skip dependent requests in the execution flow.
**Impact:** Requests using a skipped correlation value will fire with empty/default values.

## TD11 — ResultTransformer httpErrors Bug

**Severity:** Low
**Description:** `httpErrors` is taken from `http_req_failed.values.passes` instead of `fails`.
**Impact:** Error count may be incorrect in reporter output (but reporters are stubs, so limited real impact).

## TD12 — HAR Generation Missing Think-Time Prompt

**Severity:** Low
**Description:** Generator doesn't prompt user for default think time between transactions.
**Impact:** Generated scripts use `sleep(getFrameworkThinkTime())` which reads runtime config, but the user isn't prompted about this during generation.

## TD13 — Backup Files in Repository

**Severity:** Low (hygiene)
**Description:** Several `.bak-*` / `.backup.*` / `.bak.<date>` files exist in the repo root and `core_engine/src/`. These are NOT part of the build — ignore them.
**Files:** `FRAMEWORK-IMPLEMENTATION-TODO.md.bak-2026-04-06`, `core_engine/src/debug/HTMLDiffReporter.ts.bak.20260615`, `core_engine/src/reporting/RunReportGenerator.ts.bak.20260615`, various others.

## TD14 — Two Correlation Systems Not Yet Reconciled

**Severity:** Medium
**Description:** The correlation layer has two subsystems: (A) the new smart auto-correlation scanner (`CorrelationScanner` + `ScriptCorrelationWriter`, runtime via `utils/extract.ts` + `trackCorrelation`) and (B) the legacy hand-authored runtime rule engine (`CorrelationEngine`/`RuleProcessor`/`FallbackHandler`), which generated scripts never call.
**Impact:** Overlapping concepts, two mental models. Reconciling System A and System B is deferred to Phase 5 of the correlation roadmap (`archive/Correlation-Engine-Design.md`).

## TD15 — Auto-Correlation `generate`/`convert` Integration Pending

**Severity:** Low
**Description:** Auto-correlation ships as a standalone `correlate` CLI. The guarded post-`generate` prompt and `convert` parity are Phase 4 (after the standalone path is verified) per `archive/Correlation-Engine-Design.md`.
**Impact:** Users must run `correlate` as a separate step after `generate`.
