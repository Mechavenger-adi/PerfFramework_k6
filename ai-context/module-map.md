# Module Map

> File-level routing table. Find the right file to edit without scanning the whole repo.

## Layer → File → Responsibility

### CLI (`core-engine/src/cli/`)
| File | Responsibility | Key Exports |
|------|---------------|-------------|
| `run.ts` | Main entry — registers all commands, orchestrates `run` command | Commander program |
| `init.ts` | Project scaffolding wizard | Scaffold function |
| `generate.ts` | HAR → k6 script generation command | Generate handler |
| `generate-byos.ts` | BYOS template generation | BYOS handler |
| `convert.ts` | Conventional k6 → framework conversion | Convert handler |
| `validate.ts` | Pre-flight config validation | Validate handler |
| `templates.ts` | Template library discovery/viewing | `list`, `show` |
| `features.ts` | Framework capabilities summary | Features handler |
| `config-inspect.ts` | Config resolution chain inspector | Inspect handler |
| `docs.ts` | Schema → markdown doc generator | Docs handler |
| `new.ts` | Interactive config creation wizard | New handler |
| `LifecyclePrompt.ts` | Interactive init/end group prompts | `promptLifecycleGroups()` |

### Config (`core-engine/src/config/`)
| File | Responsibility |
|------|---------------|
| `ConfigurationManager.ts` | 6-layer config merge, JSONC parsing |
| `EnvResolver.ts` | `.env` loading via dotenv |
| `GatekeeperValidator.ts` | Pre-flight checklist (non-short-circuit) |
| `RuntimeConfigManager.ts` | Typed runtime setting accessors |
| `SchemaValidator.ts` | AJV validation with Levenshtein suggestions |

### Scenario (`core-engine/src/scenario/`)
| File | Responsibility |
|------|---------------|
| `ScenarioBuilder.ts` | Test plan → k6 scenarios + phase metadata injection |
| `WorkloadModels.ts` | Load/stress/soak/spike/iteration profile builders |
| `ExecutorFactory.ts` | k6 executor config validation + construction |
| `TestPlanLoader.ts` | JSON/JSONC → validated TestPlan |

### Execution (`core-engine/src/execution/`)
| File | Responsibility |
|------|---------------|
| `PipelineRunner.ts` | k6 process spawn (sync `execute()` + async `executeAsync()`) |
| `ParallelExecutionManager.ts` | k6Options assembly (scenarios + thresholds + summaryTrendStats) |
| `JourneyAllocator.ts` | Weight-based VU distribution |
| `HostMonitor.ts` | CPU/memory sampling during runs |

### Runtime (`core-engine/src/runtime/`)
| File | Responsibility |
|------|---------------|
| `LifecycleRuntime.ts` | TypeScript-side lifecycle contracts |
| `ErrorRuntime.ts` | Structured error event creation |
| `MetricsRuntime.ts` | Transaction metric aggregation helpers |
| `SnapshotRuntime.ts` | Failure snapshot helpers |
| `TimeseriesRuntime.ts` | Bucketed timeseries helpers |

### Data (`core-engine/src/data/`)
| File | Responsibility |
|------|---------------|
| `DataFactory.ts` | CSV/JSON loading with type coercion |
| `DataPoolManager.ts` | VU/iteration data assignment + overflow |
| `DataValidator.ts` | Pre-run data file validation |
| `DynamicValueFactory.ts` | uuid, timestamp, random generators |

### Recording (`core-engine/src/recording/`)
| File | Responsibility |
|------|---------------|
| `HARParser.ts` | HAR parsing + 4-step refinement |
| `DomainFilter.ts` | Domain stats + allowlist filtering |
| `TransactionGrouper.ts` | `pageref` → transaction groups |
| `ScriptGenerator.ts` | Groups → full k6 script with lifecycle phases |
| `ScriptConverter.ts` | Conventional k6 → framework format (Pattern A/B) |

### Correlation (`core-engine/src/correlation/`)
| File | Responsibility |
|------|---------------|
| `CorrelationEngine.ts` | Token extraction + storage |
| `ExtractorRegistry.ts` | regex/jsonpath/header extractors |
| `RuleProcessor.ts` | Rule file loading |
| `FallbackHandler.ts` | Extraction failure strategies |

### Debug (`core-engine/src/debug/`)
| File | Responsibility |
|------|---------------|
| `ReplayRunner.ts` | Full debug workflow orchestrator |
| `DiffChecker.ts` | Recording vs replay comparison |
| `HTMLDiffReporter.ts` | Interactive HTML diff report (87KB, largest file) |
| `ExchangeLog.ts` | Exchange log entry builder |
| `RecordingLogResolver.ts` | Multi-strategy recording log finder |

### Assertions (`core-engine/src/assertions/`)
| File | Responsibility |
|------|---------------|
| `ThresholdManager.ts` | SLA → k6 thresholds (dynamic percentile keys) |
| `SLARegistry.ts` | Per-journey/transaction SLA store |
| `JourneyAssertionResolver.ts` | Post-run SLA pass/fail evaluation |

### Reporting (`core-engine/src/reporting/`)
| File | Responsibility |
|------|---------------|
| `RunReportGenerator.ts` | Unified `RunReport.html` with tabs |
| `TransactionMetricsBuilder.ts` | Transaction metrics from k6 summary |
| `EventArtifactBuilder.ts` | errors.ndjson + warnings.ndjson builder |
| `RunSummaryBuilder.ts` | ci-summary.json builder |
| `TimeseriesArtifactBuilder.ts` | timeseries.json builder |
| `ArtifactWriter.ts` | JSON/NDJSON file writer |

### Reporters (`core-engine/src/reporters/`) — All stubs
| File | Responsibility |
|------|---------------|
| `ResultTransformer.ts` | k6 summary → `ResultContract` |
| `GrafanaReporter.ts` | Grafana push stub |
| `AzureReporter.ts` | Azure push stub |
| `CustomUploader.ts` | Webhook stub |

### Utils (`core-engine/src/utils/`)
| File | Runs In | Responsibility |
|------|---------|---------------|
| `transaction.ts` | **k6** | `initTransactions`/`startTransaction`/`endTransaction` + Counter metrics |
| `replayLogger.ts` | **k6** | Replay log emission + variable tracking |
| `session.ts` | **k6** | Cookie jar management + URL registry |
| `lifecycle.ts` | **k6** | VU lifecycle orchestration + think time |
| `logger.ts` | Node | ANSI color-coded logger |
| `ProgressBar.ts` | Node | Phase-based terminal progress |
| `PathResolver.ts` | Node | Recursive script path resolution |

### Types (`core-engine/src/types/`)
| File | Key Types |
|------|-----------|
| `ConfigContracts.ts` | `EnvironmentConfig`, `RuntimeSettings`, `ResolvedConfig`, `FRAMEWORK_DEFAULTS` |
| `TestPlanSchema.ts` | `TestPlan`, `UserJourney`, `GlobalLoadProfile`, `SLADefinition` |
| `EventContracts.ts` | `ErrorEvent`, `WarningEvent` |
| `ReportingContracts.ts` | Report output structures |
| `HARContracts.ts` | `HAREntry`, `HARRefinementOptions` |
