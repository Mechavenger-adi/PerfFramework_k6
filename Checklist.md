# k6 Performance Framework – Build Checklist

> **Last updated:** Phase 1 – Foundation complete (2026-03-21)

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Complete |
| 🔄 | In progress |
| ⬜ | Not started |
| 🔗 | Depends on another item |

---

## Phase 1 – Foundation ✅ COMPLETE

> Goal: Framework skeleton — manually authored scripts can be configured, validated, and executed through the CLI.

### Config Layer
| # | Component | File | Status | Notes |
|---|---|---|---|---|
| 1.1 | Environment Config Contract | `types/ConfigContracts.ts` | ✅ | `EnvironmentConfig`, `RuntimeSettings`, `ResolvedConfig` |
| 1.2 | Test Plan Schema Contract | `types/TestPlanSchema.ts` | ✅ | `TestPlan`, `UserJourney`, `GlobalLoadProfile`, `SLADefinition` |
| 1.3 | EnvResolver | `config/EnvResolver.ts` | ✅ | `.env` loading, typed accessors, CI env overlay |
| 1.4 | SchemaValidator | `config/SchemaValidator.ts` | ✅ | AJV-based, `allErrors` mode, runtime + test plan validation |
| 1.5 | ConfigurationManager | `config/ConfigurationManager.ts` | ✅ | 6-layer precedence merge, deep merge, debug redaction |
| 1.6 | RuntimeConfigManager | `config/RuntimeConfigManager.ts` | ✅ | Typed accessors for think time, pacing, HTTP, error behavior |
| 1.7 | GatekeeperValidator | `config/GatekeeperValidator.ts` | ✅ | Pre-flight checklist, all failures returned at once |

### Scenario Orchestration Layer
| # | Component | File | Status | Notes |
|---|---|---|---|---|
| 1.8 | WorkloadModels | `scenario/WorkloadModels.ts` | ✅ | Load, stress, soak, spike, iteration factory functions |
| 1.9 | ExecutorFactory | `scenario/ExecutorFactory.ts` | ✅ | Validates required fields per executor type |
| 1.10 | TestPlanLoader | `scenario/TestPlanLoader.ts` | ✅ | JSON → TestPlan with schema validation |
| 1.11 | ScenarioBuilder | `scenario/ScenarioBuilder.ts` | ✅ | Parallel / sequential / hybrid → `options.scenarios` |

### Parallel Execution Layer
| # | Component | File | Status | Notes |
|---|---|---|---|---|
| 1.12 | JourneyAllocator | `execution/JourneyAllocator.ts` | ✅ | Weight-based VU distribution, min 1 VU guaranteed |
| 1.13 | ParallelExecutionManager | `execution/ParallelExecutionManager.ts` | ✅ | Scales load profiles proportionally per journey weight |
| 1.14 | PipelineRunner | `execution/PipelineRunner.ts` | ✅ | Spawns k6 process, writes temp options, cleans up |

### Data Management Layer
| # | Component | File | Status | Notes |
|---|---|---|---|---|
| 1.15 | DataFactory | `data/DataFactory.ts` | ✅ | CSV (quoted fields) + JSON loading, type coercion |
| 1.16 | DataPoolManager | `data/DataPoolManager.ts` | ✅ | VU/iteration data assignment, overflow strategies |
| 1.17 | DataValidator | `data/DataValidator.ts` | ✅ | Pre-run CSV/JSON validation, blank rows, column checks |
| 1.18 | DynamicValueFactory | `data/DynamicValueFactory.ts` | ✅ | timestamp, uuid, randomInt, randomString, randomEmail, randomPhone |

### CLI Layer
| # | Component | File | Status | Notes |
|---|---|---|---|---|
| 1.19 | init | `cli/init.ts` | ✅ | Full project scaffolding with sample journeys + configs |
| 1.20 | validate | `cli/validate.ts` | ✅ | Runs config merge + Gatekeeper, returns pass/fail |
| 1.21 | run | `cli/run.ts` | ✅ | End-to-end: load → validate → build scenarios → k6 |

### Infrastructure
| # | Item | Status | Notes |
|---|---|---|---|
| 1.22 | Core barrel export (`index.ts`) | ✅ | All Phase 1 exports in one entry point |
| 1.23 | `tsconfig.json` | ✅ | Strict mode, CommonJS, Node 22 target |
| 1.24 | `package.json` | ✅ | `tsx` runner, `typecheck` script, CLI bin entry |
| 1.25 | `.env.template` | ✅ | Template for secrets |
| 1.26 | `.gitignore` | ✅ | Covers `.env`, `dist/`, `node_modules/`, `.k6-temp/` |
| 1.27 | `HowToUse.md` | ✅ | Phase 1 usage guide |

---

## Phase 2 – Productivity ⬜ NOT STARTED

> Goal: HAR → script generation, runtime controls, SLA governance. After this phase the full recording-to-execution workflow is operational.

### HAR Recording & Script Generation
| # | Component | File | Status | Notes |
|---|---|---|---|---|
| 2.1 | HARParser | `recording/HARParser.ts` | ✅ | HAR v1.2 parsing + 7-step refinement pipeline |
| 2.2 | DomainFilter | `recording/DomainFilter.ts` | ✅ | Whitelist-based domain filtering with count logging |
| 2.3 | TransactionGrouper | `recording/TransactionGrouper.ts` | ✅ | `pageref` grouping **+ LoadRunner-style `Trend` metric emission** |
| 2.4 | ScriptGenerator | `recording/ScriptGenerator.ts` | ✅ | Refined HAR entries → TypeScript k6 script |

#### HAR Refinement Steps (inside HARParser)
| # | Step | Status |
|---|---|---|
| 2.1a | Domain filtering | ✅ |
| 2.1b | Static asset removal (MIME/extension based) | ✅ |
| 2.1c | Unstable header stripping (x-request-id, traceparent, etc.) | ✅ |
| 2.1d | Cookie / auth token sanitization | ✅ |
| 2.1e | Duplicate / redirect collapsing | ✅ |
| 2.1f | Entry sorting by `startedDateTime` | ✅ |
| 2.1g | Post-refinement validation pass | ✅ |

### CLI Extension
| # | Component | File | Status | Notes |
|---|---|---|---|---|
| 2.5 | generate command | `cli/generate.ts` | ✅ | `k6-framework generate --har ./recordings/file.har` |
| 2.6 | generate-byos | `cli/generate-byos.ts` | ✅ | Template generator for pasting raw k6 scripts |
| 2.7 | PathResolver | `utils/PathResolver.ts` | ✅ | Dynamic script path resolving logic |
| 2.8 | convert command | `cli/convert.ts` + `recording/ScriptConverter.ts` | ✅ | Converts conventional k6 scripts to framework-compatible with logExchange, request defs, transaction wrappers |

### Runtime & SLA
| # | Component | File | Status | Notes |
|---|---|---|---|---|
| 2.6 | SLARegistry | `assertions/SLARegistry.ts` | ✅ | Fluent API to register SLAs per journey / transaction |
| 2.7 | ThresholdManager | `assertions/ThresholdManager.ts` | ✅ | SLA → k6 `thresholds` injection, includes `txn_*` Trend metrics |

---

## Phase 3 – Enterprise Control 🔄 IN PROGRESS

> Goal: Automated correlation, diff debugging, production reporting. Scripts self-correlate; replay failures are diagnosable; results flow to dashboards.

### Correlation Engine
| # | Component | File | Status | Notes |
|---|---|---|---|---|
| 3.1 | CorrelationEngine | `correlation/CorrelationEngine.ts` | ✅ | Response pipeline hook, VU-scoped store |
| 3.2 | RuleProcessor | `correlation/RuleProcessor.ts` | ✅ | Load + validate correlation rules at startup |
| 3.3 | ExtractorRegistry | `correlation/ExtractorRegistry.ts` | ✅ | Pluggable: regex, JSONPath, header extractors |
| 3.4 | FallbackHandler | `correlation/FallbackHandler.ts` | ✅ | default value / skip / fail strategies |

### Debug Diff Tool
| # | Component | File | Status | Notes |
|---|---|---|---|---|
| 3.5 | ReplayRunner | `debug/ReplayRunner.ts` | ✅ | Single-iteration debug execution |
| 3.6 | DiffChecker | `debug/DiffChecker.ts` | ✅ | HAR vs replay header/body/status comparison with match score |
| 3.7 | HTMLDiffReporter | `debug/HTMLDiffReporter.ts` | ✅ | Interactive HTML report, side-by-side, colour-coded |

### Reporting
| # | Component | File | Status | Notes |
|---|---|---|---|---|
| 3.8 | ResultTransformer | `reporters/ResultTransformer.ts` | ✅ | k6 raw output → `ResultContract` |
| 3.9 | GrafanaReporter | `reporters/GrafanaReporter.ts` | ✅ | Push to InfluxDB / Prometheus |
| 3.10 | AzureReporter | `reporters/AzureReporter.ts` | ✅ | Push to App Insights / Azure SQL |
| 3.11 | CustomUploader | `reporters/CustomUploader.ts` | ✅ | Generic HTTP poster (`upload-results.js` replacement) |

### SLA Governance
| # | Component | File | Status | Notes |
|---|---|---|---|---|
| 3.12 | JourneyAssertionResolver | `assertions/JourneyAssertionResolver.ts` | ✅ | Per-journey SLA pass/fail + `txn_*` Trend percentile report |

---

## Phase 4 – Advanced Capability ⬜ NOT STARTED

> Goal: AI-powered intelligence and historical analytics. Fully optional — framework operates without them.

### AI Integration
| # | Component | File | Status | Notes |
|---|---|---|---|---|
| 4.1 | AIFeatureToggle | `ai/AIFeatureToggle.ts` | ⬜ | Single on/off guard for all AI features |
| 4.2 | AIClient | `ai/AIClient.ts` | ⬜ | OpenAI / Azure OpenAI / MCP HTTP wrapper |
| 4.3 | PromptTemplates | `ai/PromptTemplates.ts` | ⬜ | File-based versioned prompt loader |
| 4.4 | AIProcessor | `correlation/AIProcessor.ts` | ⬜ | AI-assisted correlation candidate suggestion |

### Analytics
| # | Component | File | Status | Notes |
|---|---|---|---|---|
| 4.5 | AnomalyDetector | `ai/AnomalyDetector.ts` | ⬜ | Z-score / IQR statistical detection + optional AI |
| 4.6 | TrendAnalyzer | `ai/TrendAnalyzer.ts` | ⬜ | Historical baseline comparison, regression detection |

### Packaging
| # | Item | Status | Notes |
|---|---|---|---|
| 4.7 | Dual ESM + CJS npm package build | ⬜ | `tsup` or similar bundler |
| 4.8 | Published `@k6-perf/core-engine` package | ⬜ | Teams `npm install` the core engine |

---

## Cross-Cutting Items

| # | Item | Status | Notes |
|---|---|---|---|
| X.1 | `HttpClientWrapper.ts` (thin HTTP utility) | ⬜ | Optional thin wrapper in `api-clients/` |
| X.2 | Config precedence unit tests | ⬜ | Validate 6-layer merge order |
| X.3 | JourneyAllocator unit tests | ⬜ | Weight rounding edge cases |
| X.4 | DataValidator unit tests | ⬜ | Blank rows, missing columns, JSON array validation |
| X.5 | CI/CD pipeline (GitHub Actions) | ⬜ | `typecheck` + `build` on every PR |
| X.6 | Global Logger | ✅ | Standardized logging wrapper in `utils/logger.ts` |

---

## Summary Progress

| Phase | Items | Done | Remaining |
|---|---|---|---|
| Phase 1 – Foundation | 27 | **27** ✅ | 0 |
| Phase 2 – Productivity | 15 | **15** ✅ | 0 |
| Phase 3 – Enterprise Control | 13 | **13** ✅ | 0 |
| Phase 4 – Advanced | 8 | 0 | **8** |
| Cross-cutting | 5 | 0 | **5** |
| **Total** | **68** | **55** | **13** |

---

*This file is updated after each phase or major framework task completes.*
