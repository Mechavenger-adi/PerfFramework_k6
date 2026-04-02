# K6 Perf Framework Audit Checklist

Date: 2026-03-26

## Scope

This audit reviews the implementation in `K6-PerfFramework` against:

- `framework-requirements.md`
- `Checklist.md`
- runnable verification from the compiled framework modules

Legend:

- `[x]` Implemented and verified working
- `[~]` Implemented partially, or present in code but not fully meeting the requirement
- `[ ]` Missing / not implemented

## Verification Evidence

- `[x]` `npm run typecheck` passed
- `[x]` `npm run build` passed
- `[x]` Pre-flight validation works through `dist/cli/validate.js`
- `[x]` HAR generation works through `dist/cli/generate.js`
- `[x]` HAR generator now prompts for domain selection and static-asset inclusion/exclusion
- `[x]` HAR generation now writes a normalized recording-log JSON artifact for later replay matching
- `[x]` Project scaffolding works through `dist/cli/init.js`
- `[x]` Data loading, validation, pool handling, and dynamic value helpers passed smoke checks
- `[x]` Scenario resolution and threshold generation work
- `[x]` Diff comparison and HTML report generation passed a grouped side-by-side smoke test
- `[x]` `k6` is installed locally
- `[~]` Main compiled CLI `run` path fails at runtime due to module resolution issue in `PipelineRunner`

## Detailed Checklist

### 1. Framework Foundation

- `[x]` Configuration-driven architecture is implemented
  Evidence: `core-engine/src/config/ConfigurationManager.ts`, `core-engine/src/config/SchemaValidator.ts`
- `[x]` Convention-based project structure is implemented
  Evidence: `core-engine/src/cli/init.ts`
- `[x]` CLI scaffolding for new projects is implemented and working
  Evidence: `core-engine/src/cli/init.ts`
- `[~]` Packaging as a portable npm package is partial
  Notes: package metadata and build output exist, but the built CLI is not fully runnable because of alias resolution in `PipelineRunner`
- `[ ]` CI/CD-ready `npm test` style integration is not fully implemented
  Notes: no pipeline config found; package scripts do not expose a full end-to-end `test` command

### 2. Test Authoring and Script Generation

- `[x]` HAR file parsing is implemented
  Evidence: `core-engine/src/recording/HARParser.ts`
- `[x]` Transaction grouping by `pageref` is implemented
  Evidence: `core-engine/src/recording/TransactionGrouper.ts`
- `[x]` Generated scripts use framework transaction helpers instead of manual Trend timing
  Evidence: `core-engine/src/recording/ScriptGenerator.ts`, `core-engine/src/utils/transaction.ts`
- `[x]` Generated scripts include HAR entry comments for traceability
  Evidence: `core-engine/src/recording/ScriptGenerator.ts`
- `[x]` Generated scripts now include structured replay metadata logs and request tags
  Evidence: `core-engine/src/recording/ScriptGenerator.ts`
- `[x]` HAR generation now emits a normalized recording log file keyed by `harEntryId`
  Evidence: `core-engine/src/cli/generate.ts`, `core-engine/src/debug/ExchangeLog.ts`
- `[~]` HAR-based script generation is working but not fully as required
  Notes: generation is now interactive for domains and static assets, but still does not prompt for think time
- `[x]` Interactive CLI prompts for HAR generation are implemented
- `[x]` User prompt to choose target domains is implemented
- `[x]` Domain filtering is implemented as an interactive flow
  Evidence: `core-engine/src/recording/DomainFilter.ts`, `core-engine/src/recording/HARParser.ts`, `core-engine/src/cli/generate.ts`
- `[x]` User prompt to include or exclude static assets is implemented
- `[ ]` User prompt for default think time is missing
- `[~]` Generated script structure does not follow `init`, `action`, `teardown`
  Notes: generator outputs a single `export default function()`
- `[~]` Automatic status validation is partial
  Notes: generated checks assert exact recorded status, not generic 2xx validation

### 3. HAR Refinement

- `[x]` Sort by `startedDateTime` is implemented
- `[x]` Static asset filtering is implemented
- `[x]` Header stripping for unstable headers is implemented
- `[x]` Cookie and authorization stripping are implemented through header stripping
- `[x]` Domain filtering is implemented and supported through interactive CLI selection
- `[ ]` Duplicate collapsing is not implemented
- `[ ]` Redirect collapsing is not implemented
- `[ ]` Post-refinement validation pass is not implemented as described

### 4. Parameterization and Data

- `[x]` CSV data support is implemented and working
  Evidence: `core-engine/src/data/DataFactory.ts`
- `[x]` JSON data support is implemented and working
  Evidence: `core-engine/src/data/DataFactory.ts`
- `[ ]` Inline data array support is not implemented
- `[x]` `p_` naming convention is reflected in samples and documentation
- `[x]` Overflow strategy `terminate` is implemented
- `[x]` Overflow strategy `cycle` is implemented
- `[x]` Overflow strategy `continue_with_last` is implemented
- `[x]` Pre-run CSV validation is implemented
- `[x]` Pre-run JSON validation is implemented
- `[x]` Blank row / missing value checks are implemented
- `[x]` Built-in dynamic timestamp function is implemented
- `[x]` Additional dynamic helpers are implemented
  Notes: `uuid`, `randomInt`, `randomString`, `randomEmail`, `randomPhone`, `pickRandom`, epoch helpers

### 5. Correlation

- `[x]` Rule-based correlation engine exists
  Evidence: `core-engine/src/correlation/CorrelationEngine.ts`
- `[x]` Correlation rule loading from JSON exists
  Evidence: `core-engine/src/correlation/RuleProcessor.ts`
- `[x]` Regex extractor exists
- `[x]` Header extractor exists
- `[~]` `jsonpath` extractor is only a simplified dot-notation implementation
  Evidence: `core-engine/src/correlation/ExtractorRegistry.ts`
- `[~]` Correlation `source/scope` is only partially respected
  Notes: extractor choice matters, but full body/header scope behavior is not robustly modeled
- `[x]` Fallback default value strategy exists
- `[x]` Fallback fail strategy exists
- `[x]` Fallback graceful skip signal exists
- `[~]` Skip dependent request behavior is not actually orchestrated end-to-end
  Notes: fallback returns empty string / logs warning, but there is no dependent-request flow control
- `[ ]` AI-assisted auto-correlation is not implemented
- `[ ]` OpenAI/Azure OpenAI/custom MCP backend integration is not implemented
- `[ ]` Global AI feature toggle is not implemented

### 6. Reusable Modules

- `[ ]` Header manager utility is missing
- `[ ]` Cookie manager utility is missing
- `[~]` Reusable logging wrapper exists
  Evidence: `core-engine/src/utils/logger.ts`
- `[~]` Automatic default 2xx validation is only partially satisfied
  Notes: sample/manual scripts use 2xx checks, generated HAR scripts use exact-status checks

### 7. Test Execution and Orchestration

- `[x]` Central test plan model is implemented
  Evidence: `core-engine/src/types/TestPlanSchema.ts`
- `[x]` Parallel scenario construction is implemented
  Evidence: `core-engine/src/scenario/ScenarioBuilder.ts`
- `[x]` Sequential scenario construction is implemented
- `[x]` Hybrid scenario construction is implemented
- `[x]` Global load profile support is implemented
- `[x]` Per-journey load profile override support is implemented
- `[x]` Weighted VU allocation is implemented
  Evidence: `core-engine/src/execution/JourneyAllocator.ts`
- `[x]` Threshold injection from SLAs is implemented
  Evidence: `core-engine/src/assertions/ThresholdManager.ts`
- `[~]` End-to-end run execution is blocked in the built CLI
  Notes: `dist/cli/run.js` imports `PipelineRunner`, which imports `@core/utils/logger` and fails under Node module resolution

### 8. Runtime Settings

- `[x]` Runtime settings schema/model exists
  Evidence: `core-engine/src/types/ConfigContracts.ts`
- `[x]` Think time config model exists
- `[x]` Pacing config model exists
- `[x]` HTTP timeout/maxRedirects config model exists
- `[x]` Error behavior config model exists
- `[x]` Typed runtime accessor class exists
  Evidence: `core-engine/src/config/RuntimeConfigManager.ts`
- `[~]` Think time is not wired into generated or framework-run execution consistently
- `[~]` Pacing is modeled but not enforced in the runner/scripts
- `[~]` Iteration logic modes are not fully implemented as described in requirements
- `[~]` Error behavior is modeled but not fully enforced end-to-end
- `[~]` Common k6 options are only partially exposed
  Notes: some output/reporting options are added in `run.ts`, but runtime-driven option wiring is incomplete

### 9. Debugging and Analysis

- `[x]` Record and replay linkage is materially improved
  Notes: generated scripts now include `har_entry` comments, structured replay logs, request tags, and generated recording-log artifacts for cross-reference
- `[x]` Replay runner class exists
  Evidence: `core-engine/src/debug/ReplayRunner.ts`
- `[x]` Diff comparison utility exists
  Evidence: `core-engine/src/debug/DiffChecker.ts`
- `[x]` HTML diff report generator exists
  Evidence: `core-engine/src/debug/HTMLDiffReporter.ts`
- `[~]` Replay debug utility is not working end-to-end
  Notes: it depends on `PipelineRunner`, which currently fails in built runtime
- `[x]` HTML report now groups requests by transaction
- `[x]` HTML report now highlights differences with percentage scores
- `[x]` HTML report now provides side-by-side expandable recorded vs replayed request/response details
- `[~]` End-to-end automatic replay capture and mapping are still incomplete
  Notes: compare/report layers are stronger, but the replay execution pipeline still needs completion

### 10. Reporting and Trend Analysis

- `[x]` Result transformation utility exists
  Evidence: `core-engine/src/reporters/ResultTransformer.ts`
- `[x]` Grafana reporter stub exists
- `[x]` Azure reporter stub exists
- `[x]` Custom uploader stub exists
- `[~]` Reporting hooks are placeholder-level only
  Notes: current implementations log messages and do not perform real uploads
- `[~]` `ResultTransformer` appears to map HTTP errors incorrectly
  Notes: `httpErrors` is taken from `http_req_failed.values.passes` instead of `fails`
- `[ ]` Full post-test upload pipeline is not wired end-to-end

### 11. AI / Advanced Capability

- `[ ]` `AIFeatureToggle` is missing
- `[ ]` `AIClient` is missing
- `[ ]` `PromptTemplates` is missing
- `[ ]` AI correlation processor is missing
- `[ ]` Anomaly detection is missing
- `[ ]` Trend analyzer is missing
- `[ ]` Dual ESM/CJS package build is missing
- `[ ]` Published reusable package workflow is missing

## Key Working Areas

These parts are present and behaved as expected during verification:

- configuration loading and validation
- scenario building and weighted journey allocation
- HAR parsing/grouping/generation
- interactive HAR domain/static filtering
- normalized recording-log generation
- init scaffolding
- validate flow
- data load/validate/pool handling
- dynamic value helpers
- SLA threshold construction
- standalone diff compare/report generation with grouped HTML output

## Key Gaps and Defects

- Main packaged CLI run flow is broken by unresolved import alias in `core-engine/src/execution/PipelineRunner.ts`
- HAR generation still does not satisfy the full workflow because think-time prompting and `init/action/teardown` structure are not yet implemented
- Runtime settings are modeled more than they are actually enforced
- Correlation is only partially aligned with the requirement, especially JSONPath and skip behavior
- Reporting integrations are placeholders rather than production-ready hooks
- AI feature layer is entirely missing
- Header and cookie manager utilities are missing

## Overall Assessment

The framework is strong in foundational architecture and developer productivity basics, and many Phase 1/2 building blocks are genuinely implemented. However, several items currently marked complete in the internal checklist are only partially aligned with the original requirement document when judged by actual behavior. The repo is best described as:

- strong foundation: yes
- partially operational framework: yes
- fully requirement-complete framework: no
- fully packaged and runnable end-to-end: no
