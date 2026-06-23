# Module Map

> File-level routing table. Find the right file to edit without scanning the whole repo.

## Layer → File → Responsibility

### CLI (`core_engine/src/cli/`)
| File | Responsibility | Key Exports |
|------|---------------|-------------|
| `run.ts` | Main entry — registers all commands, orchestrates `run` command | Commander program |
| `init.ts` | Project scaffolding wizard | Scaffold function |
| `generate.ts` | HAR → k6 script generation command | Generate handler |
| `generate-byos.ts` | BYOS template generation | BYOS handler |
| `convert.ts` | Conventional k6 → framework conversion | Convert handler |
| `correlate.ts` | Smart auto-correlation: scan recording → manifest → rewrite script | Correlate handler (`--list`/`--dry-run`/`--apply`) |
| `import.ts` | cURL / Postman collection → framework script | `import curl`, `import postman` |
| `interactive.ts` | Menu-driven command panel (`npm start`) | Interactive panel |
| `validate.ts` | Pre-flight config validation | Validate handler |
| `templates.ts` | Template library discovery/viewing | `list`, `show` |
| `features.ts` | Framework capabilities summary | Features handler |
| `config-inspect.ts` | Config resolution chain inspector | Inspect handler |
| `docs.ts` | Schema → markdown doc generator | Docs handler |
| `new.ts` | Interactive config creation wizard | New handler |
| `LifecyclePrompt.ts` | Interactive init/end group prompts | `promptLifecycleGroups()` |

### Config (`core_engine/src/config/`)
| File | Responsibility |
|------|---------------|
| `ConfigurationManager.ts` | 6-layer config merge, JSONC parsing |
| `EnvResolver.ts` | `.env` loading via dotenv |
| `GatekeeperValidator.ts` | Pre-flight checklist (non-short-circuit) |
| `RuntimeConfigManager.ts` | Typed runtime setting accessors |
| `SchemaValidator.ts` | AJV validation with Levenshtein suggestions |
| `ScriptContractGuard.ts` | Pre-flight guard rejecting native k6 `check()`/`group()` (use `k6Check`/`transaction`) |

### Scenario (`core_engine/src/scenario/`)
| File | Responsibility |
|------|---------------|
| `ScenarioBuilder.ts` | Test plan → k6 scenarios + phase metadata injection |
| `WorkloadModels.ts` | Load/stress/soak/spike/iteration profile builders |
| `ExecutorFactory.ts` | k6 executor config validation + construction |
| `TestPlanLoader.ts` | JSON/JSONC → validated TestPlan |

### Execution (`core_engine/src/execution/`)
| File | Responsibility |
|------|---------------|
| `PipelineRunner.ts` | k6 process spawn (sync `execute()` + async `executeAsync()`) |
| `ParallelExecutionManager.ts` | k6Options assembly (scenarios + thresholds + summaryTrendStats) |
| `JourneyAllocator.ts` | Weight-based VU distribution |
| `HostMonitor.ts` | CPU/memory sampling during runs |
| `FileWriteSink.ts` | Runner-side consumer for `writeData()` — tails the k6 log stream, writes files under the run dir |

### Runtime (`core_engine/src/runtime/`)
| File | Responsibility |
|------|---------------|
| `LifecycleRuntime.ts` | TypeScript-side lifecycle contracts |
| `ErrorRuntime.ts` | Structured error event creation |
| `MetricsRuntime.ts` | Transaction metric aggregation helpers |
| `SnapshotRuntime.ts` | Failure snapshot helpers |
| `TimeseriesRuntime.ts` | Bucketed timeseries helpers |

### Data (`core_engine/src/data/`)
| File | Responsibility |
|------|---------------|
| `DataFactory.ts` | CSV/JSON loading with type coercion |
| `DataPoolManager.ts` | VU/iteration data assignment + overflow |
| `DataValidator.ts` | Pre-run data file validation |
| `DynamicValueFactory.ts` | uuid, timestamp, random generators |

### Recording (`core_engine/src/recording/`)
| File | Responsibility |
|------|---------------|
| `HARParser.ts` | HAR parsing + 4-step refinement |
| `DomainFilter.ts` | Domain stats + allowlist filtering |
| `TransactionGrouper.ts` | `pageref` → transaction groups |
| `ScriptGenerator.ts` | Groups → full k6 script with lifecycle phases |
| `ScriptConverter.ts` | Conventional k6 → framework format (Pattern A/B) |
| `CurlAdapter.ts` | cURL string(s) → intermediate request model |
| `PostmanAdapter.ts` | Postman v2.1 collection → intermediate request model (nested folders) |
| `PostmanScriptTranslator.ts` | Postman pre-request/test scripts → framework equivalents |

### Correlation (`core_engine/src/correlation/`)
**(A) Smart auto-correlation scanner** (no hand-written rules; driven by `correlate` CLI — see `.md/Correlation-Engine-Design.md`)
| File | Responsibility |
|------|---------------|
| `CorrelationScanner.ts` | Orchestrator: `RecordingExchange[]` → `CorrelationPlan` |
| `ValueIndexer.ts` | Producer (response) / consumer (request) occurrence extraction |
| `LinkMatcher.ts` | Nearest-preceding producer→consumer linking (handles token rotation) |
| `CandidateScorer.ts` | Heuristics → `high/medium/low`; `handledByJar` filter; `p_` vs `c_` |
| `ExtractorSynthesizer.ts` | jsonpath/header/cookie/boundary capture synthesis (uniqueness-checked) |
| `ScriptCorrelationWriter.ts` | Post-processor: capture + substitute into a generated script |
| `CorrelationManifest.ts` | `RecordingExchange`/`CorrelationCandidate`/`CorrelationPlan` types + load/save |

**(B) Legacy runtime rule engine** (hand-authored rules; not called by generated scripts)
| File | Responsibility |
|------|---------------|
| `CorrelationEngine.ts` | Token extraction + storage |
| `ExtractorRegistry.ts` | regex/jsonpath/header (+ cookie/boundary) extractors |
| `RuleProcessor.ts` | Rule file loading |
| `FallbackHandler.ts` | Extraction failure strategies |

### Debug (`core_engine/src/debug/`)
| File | Responsibility |
|------|---------------|
| `ReplayRunner.ts` | Full debug workflow orchestrator |
| `DiffChecker.ts` | Recording vs replay comparison |
| `HTMLDiffReporter.ts` | Interactive HTML diff report (87KB, largest file) |
| `ExchangeLog.ts` | Exchange log entry builder |
| `RecordingLogResolver.ts` | Multi-strategy recording log finder |

### Assertions (`core_engine/src/assertions/`)
| File | Responsibility |
|------|---------------|
| `ThresholdManager.ts` | SLA → k6 thresholds (dynamic percentile keys) |
| `SLARegistry.ts` | Per-journey/transaction SLA store |
| `JourneyAssertionResolver.ts` | Post-run SLA pass/fail evaluation |

### Reporting (`core_engine/src/reporting/`)
| File | Responsibility |
|------|---------------|
| `RunReportGenerator.ts` | Unified `RunReport.html` with tabs (time-range-responsive transactions) |
| `TransactionMetricsBuilder.ts` | Transaction metrics — pass/fail solely from `<name>_checkrate` (estimation fallback removed) |
| `TimeseriesStreamParser.ts` | Streaming parser over k6 `--out json=` → per-bucket aggregates |
| `EventArtifactBuilder.ts` | errors.ndjson + warnings.ndjson builder |
| `RunSummaryBuilder.ts` | ci-summary.json builder |
| `TimeseriesArtifactBuilder.ts` | timeseries.json builder (delegates to TimeseriesStreamParser) |
| `ArtifactWriter.ts` | JSON/NDJSON file writer |

### Reporters (`core_engine/src/reporters/`) — All stubs
| File | Responsibility |
|------|---------------|
| `ResultTransformer.ts` | k6 summary → `ResultContract` |
| `GrafanaReporter.ts` | Grafana push stub |
| `AzureReporter.ts` | Azure push stub |
| `CustomUploader.ts` | Webhook stub |

### Utils (`core_engine/src/utils/`)
| File | Runs In | Responsibility |
|------|---------|---------------|
| `transaction.ts` | **k6** | `initTransactions`/`startTransaction`/`endTransaction` + Counter metrics |
| `replayLogger.ts` | **k6** | Replay log emission + variable tracking |
| `session.ts` | **k6** | Cookie jar management + URL registry |
| `lifecycle.ts` | **k6** | VU lifecycle orchestration + think time |
| `extract.ts` | **k6** | Correlation extractors: `extractJson/Regex/Header/Cookie/Boundary` (emitted by auto-correlation) |
| `autoHeaders.ts` | **k6** | Per-VU auto headers applied to every request (`addAutoHeader`, `addHeaderOnce`, …) |
| `dataWriter.ts` | **k6** | `writeData()` — emit tagged lines for runner-side `FileWriteSink` to persist |
| `logger.ts` | Node | ANSI color-coded logger |
| `ProgressBar.ts` | Node | Phase-based terminal progress |
| `PathResolver.ts` | Node | Script path resolution — relative + full/absolute paths, recursive testSuites search |
| `LiveConsoleLogStream.ts` | Node | Tails live k6 console output, fans out to sinks (FileWriteSink, live view) |

### Types (`core_engine/src/types/`)
| File | Key Types |
|------|-----------|
| `ConfigContracts.ts` | `EnvironmentConfig`, `RuntimeSettings`, `ResolvedConfig`, `FRAMEWORK_DEFAULTS` |
| `TestPlanSchema.ts` | `TestPlan`, `UserJourney`, `GlobalLoadProfile`, `SLADefinition`, `GlobalSLADefinition` (request/transaction scoping); plus `journey_slas`/`transaction_slas`/`request_slas` |
| `EventContracts.ts` | `ErrorEvent`, `WarningEvent` |
| `ReportingContracts.ts` | Report output structures |
| `HARContracts.ts` | `HAREntry`, `HARRefinementOptions` |

### Package roots (`core_engine/src/`)
| File | Responsibility |
|------|---------------|
| `index.ts` | **VU-safe** barrel — the only API a journey script imports (request/transaction/lifecycle/session/extract/autoHeaders/dataWriter/generate). No Node APIs. |
| `engine.ts` | **Node-only** barrel — orchestration/engine code (ScenarioBuilder, reporters, ReplayRunner, loaders). Deliberately NOT re-exported by `index.ts` so it can't leak into a VU bundle. |
