# Change Impact Map

> When you change X, you must also check Y.

## Config Changes

| If You Change... | Also Check/Update... |
|-----------------|---------------------|
| `ConfigContracts.ts` types | `SchemaValidator.ts`, `config/schemas/*.schema.json`, `RuntimeConfigManager.ts`, `FRAMEWORK_DEFAULTS` |
| `TestPlanSchema.ts` types | `SchemaValidator.ts`, `config/schemas/test-plan.schema.json`, `GatekeeperValidator.ts`, test plan JSONs |
| `config/schemas/*.schema.json` | `SchemaValidator.ts` inline fallback, `docs.ts` output, `init.ts` scaffolds |
| Config merge logic in `ConfigurationManager.ts` | All config consumers, `config-inspect.ts` |
| Runtime settings defaults | `init.ts` scaffold template, `config/runtime_settings/default.json` |

## Execution Changes

| If You Change... | Also Check/Update... |
|-----------------|---------------------|
| `ScenarioBuilder.ts` env var injection | `lifecycle.ts` (reads `K6_PERF_*`), `getFrameworkThinkTime()` |
| `PipelineRunner.ts` spawn args | `ReplayRunner.ts` (uses `execute()`), `run.ts` (uses `executeAsync()`) |
| `ParallelExecutionManager.ts` k6Options | `ThresholdManager.ts`, `run.ts` summaryTrendStats |
| `JourneyAllocator.ts` logic | `ParallelExecutionManager.ts`, weight validation in `GatekeeperValidator.ts` |

## k6-Side Runtime Changes

| If You Change... | Also Check/Update... |
|-----------------|---------------------|
| `transaction.ts` metric names | `ThresholdManager.ts`, `TransactionMetricsBuilder.ts`, all team scripts |
| `replayLogger.ts` output format | `ReplayRunner.ts` extraction, `DiffChecker.ts` comparison, `ExchangeLog.ts` |
| `session.ts` API | `ScriptGenerator.ts`, `ScriptConverter.ts`, all team scripts using cookies |
| `lifecycle.ts` phase logic | `ScenarioBuilder.ts` (phase envelope), `ScriptGenerator.ts`, `ScriptConverter.ts` |

## Reporting Changes

| If You Change... | Also Check/Update... |
|-----------------|---------------------|
| `TransactionMetricsBuilder.ts` | `RunSummaryBuilder.ts`, `RunReportGenerator.ts`, `run.ts` printTransactionTable |
| `EventArtifactBuilder.ts` | `RunSummaryBuilder.ts` (error/warning counts), `RunReportGenerator.ts` (tabs) |
| `TimeseriesArtifactBuilder.ts` | `RunReportGenerator.ts` (graphs tab) |
| Any artifact schema | CI pipeline consumers, `run-manifest.json` planned paths |

## Recording/Generation Changes

| If You Change... | Also Check/Update... |
|-----------------|---------------------|
| `ScriptGenerator.ts` output format | All generated scripts, `ScriptConverter.ts` (shared patterns) |
| `ScriptConverter.ts` patterns | Existing converted scripts, `init.ts`/`generate-byos.ts` scaffolds |
| `HARParser.ts` refinement | `ExchangeLog.ts` (recording log matches parse output) |
| `ExchangeLog.ts` schema | `DiffChecker.ts`, `HTMLDiffReporter.ts`, `RecordingLogResolver.ts` |

## Debug Changes

| If You Change... | Also Check/Update... |
|-----------------|---------------------|
| `DiffChecker.ts` comparison logic | `HTMLDiffReporter.ts` (renders DiffResult) |
| `HTMLDiffReporter.ts` rendering | CSS/JS embedded in the file (self-contained HTML) |
| `ReplayRunner.ts` replay extraction | `replayLogger.ts` output format, `DiffChecker.ts` input expectations |
