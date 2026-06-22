# Extension Points

> Where new features can plug into the framework without breaking existing code.

## EP1 — New CLI Command

**Location:** `core_engine/src/cli/run.ts`
**Pattern:** Register a new Commander subcommand in the program setup section.
**Example:** See `templates.ts`, `features.ts`, `config-inspect.ts` for lightweight commands.

## EP2 — New Executor Type

**Location:** `core_engine/src/scenario/ExecutorFactory.ts`
**Pattern:** Add the executor name to the supported list, add validation rules, add build logic.
**Also update:** `ScenarioBuilder.ts` (`computePhaseEnvelope` if lifecycle phases needed).

## EP3 — New Extractor for Correlation

**Location (legacy runtime engine):** `core_engine/src/correlation/ExtractorRegistry.ts`
**Pattern:** `registry.register('newType', extractorFunction)`. Extractor receives response, returns extracted value.
**Built-in extractors:** regex, jsonpath (dot-notation), header, cookie, boundary.

**Location (auto-correlation runtime, k6-side):** `core_engine/src/utils/extract.ts` — add a new `extract*` helper (VU-safe, no fs) and export from `index.ts`. For the scanner to *emit* it, also teach `ExtractorSynthesizer.ts` to synthesize the new capture shape.

## EP4 — New Reporter/Sink

**Location:** `core_engine/src/reporters/`
**Pattern:** Create a new file implementing `push(result, config)`. Add export in `index.ts`.
**Current stubs:** GrafanaReporter, AzureReporter, CustomUploader.

## EP5 — New Artifact Type

**Location:** `core_engine/src/reporting/`
**Pattern:**
1. Create a new `*Builder.ts` that produces the artifact
2. Add writer call in `core_engine/src/cli/run.ts` → `finalizeRunArtifacts()`
3. Add artifact path to `run-manifest.json`
4. If HTML-rendered, add a tab in `RunReportGenerator.ts`

## EP6 — New Runtime Config Section

**Pattern:**
1. Add TypeScript interface in `ConfigContracts.ts`
2. Add to `FRAMEWORK_DEFAULTS`
3. Add JSON Schema in `config/schemas/runtime_settings.schema.json`
4. Add accessor in `RuntimeConfigManager.ts`
5. Add validation in `SchemaValidator.ts` inline fallback

## EP7 — New Test Plan Config Section

**Pattern:**
1. Add TypeScript interface in `TestPlanSchema.ts`
2. Add JSON Schema in `config/schemas/test-plan.schema.json`
3. Add validation in `SchemaValidator.ts` inline fallback
4. Consume in `run.ts` or relevant orchestration code

## EP8 — New Template

**Location:** `config/templates/test_plans/*.jsonc` or `config/templates/runtime_settings/*.jsonc`
**Pattern:** Create JSONC file with `_meta` block. Automatically discovered by `templates list` command.

## EP9 — New k6-Side Utility

**Location:** `core_engine/src/utils/`
**Constraints:**
- Must not import Node.js modules
- Must compile to `dist/utils/` via `tsc`
- Must be importable by k6 scripts
- Export from `core_engine/src/index.ts` if public API

## EP10 — New Team Suite

**Location:** `testSuites/<team-name>/`
**Structure:**
```
testSuites/<team>/
  tests/          — k6 journey scripts
  data/           — CSV/JSON data files
  recordings/     — HAR files + recording logs + .recording-index.json
  correlation-rules/ — correlation rule JSONs
  results/        — test outputs
```

## EP11 — New Data Overflow Strategy

**Location:** `core_engine/src/data/DataPoolManager.ts`
**Pattern:** Add new strategy to `getRowForIteration()` switch. Update `DataOverflowStrategy` type in `TestPlanSchema.ts`.

## EP12 — New Auto-Correlation Heuristic

**Location:** `core_engine/src/correlation/CandidateScorer.ts` + `config/correlation-rules/auto-correlation.defaults.json`
**Pattern:** Add token vocabulary / thresholds to the defaults JSON (data-driven), or extend the scorer for a new shape signal (e.g. a new value pattern). Keep the scanner pipeline order stable: ValueIndexer → LinkMatcher → CandidateScorer → ExtractorSynthesizer (orchestrated by `CorrelationScanner`).

## EP13 — New Script-Contract Rule

**Location:** `core_engine/src/config/ScriptContractGuard.ts`
**Pattern:** Add a `ContractRule { k6Import, callRe, replacement, reason }` to flag another native k6 API that breaks framework reporting and point authors at the framework equivalent.
