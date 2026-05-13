# Extension Points

> Where new features can plug into the framework without breaking existing code.

## EP1 — New CLI Command

**Location:** `core-engine/src/cli/run.ts`
**Pattern:** Register a new Commander subcommand in the program setup section.
**Example:** See `templates.ts`, `features.ts`, `config-inspect.ts` for lightweight commands.

## EP2 — New Executor Type

**Location:** `core-engine/src/scenario/ExecutorFactory.ts`
**Pattern:** Add the executor name to the supported list, add validation rules, add build logic.
**Also update:** `ScenarioBuilder.ts` (`computePhaseEnvelope` if lifecycle phases needed).

## EP3 — New Extractor for Correlation

**Location:** `core-engine/src/correlation/ExtractorRegistry.ts`
**Pattern:** `registry.register('newType', extractorFunction)`. Extractor receives response, returns extracted value.
**Built-in extractors:** regex, jsonpath (dot-notation), header.

## EP4 — New Reporter/Sink

**Location:** `core-engine/src/reporters/`
**Pattern:** Create a new file implementing `push(result, config)`. Add export in `index.ts`.
**Current stubs:** GrafanaReporter, AzureReporter, CustomUploader.

## EP5 — New Artifact Type

**Location:** `core-engine/src/reporting/`
**Pattern:**
1. Create a new `*Builder.ts` that produces the artifact
2. Add writer call in `core-engine/src/cli/run.ts` → `finalizeRunArtifacts()`
3. Add artifact path to `run-manifest.json`
4. If HTML-rendered, add a tab in `RunReportGenerator.ts`

## EP6 — New Runtime Config Section

**Pattern:**
1. Add TypeScript interface in `ConfigContracts.ts`
2. Add to `FRAMEWORK_DEFAULTS`
3. Add JSON Schema in `config/schemas/runtime-settings.schema.json`
4. Add accessor in `RuntimeConfigManager.ts`
5. Add validation in `SchemaValidator.ts` inline fallback

## EP7 — New Test Plan Config Section

**Pattern:**
1. Add TypeScript interface in `TestPlanSchema.ts`
2. Add JSON Schema in `config/schemas/test-plan.schema.json`
3. Add validation in `SchemaValidator.ts` inline fallback
4. Consume in `run.ts` or relevant orchestration code

## EP8 — New Template

**Location:** `config/templates/test-plans/*.jsonc` or `config/templates/runtime-settings/*.jsonc`
**Pattern:** Create JSONC file with `_meta` block. Automatically discovered by `templates list` command.

## EP9 — New k6-Side Utility

**Location:** `core-engine/src/utils/`
**Constraints:**
- Must not import Node.js modules
- Must compile to `dist/utils/` via `tsc`
- Must be importable by k6 scripts
- Export from `core-engine/src/index.ts` if public API

## EP10 — New Team Suite

**Location:** `scrum-suites/<team-name>/`
**Structure:**
```
scrum-suites/<team>/
  tests/          — k6 journey scripts
  data/           — CSV/JSON data files
  recordings/     — HAR files + recording logs + .recording-index.json
  correlation-rules/ — correlation rule JSONs
  results/        — test outputs
```

## EP11 — New Data Overflow Strategy

**Location:** `core-engine/src/data/DataPoolManager.ts`
**Pattern:** Add new strategy to `getRowForIteration()` switch. Update `DataOverflowStrategy` type in `TestPlanSchema.ts`.
