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
**Files:** `core-engine/src/reporters/`.

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

## TD9 — `config/correlation-rules/` Directory Empty

**Severity:** Low
**Description:** Global correlation rules directory exists but is empty. All rules live per-team in `scrum-suites/{team}/`.
**Impact:** No global correlation rule sharing across teams.

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
**Description:** Several `.bak-*` and `.backup.*` files exist in the repo root and `core-engine/src/`.
**Files:** `index.ts.bak-2026-04-06-reporting`, `FRAMEWORK-IMPLEMENTATION-TODO.md.bak-2026-04-06`, various others.
