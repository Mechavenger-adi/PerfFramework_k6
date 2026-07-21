# K6 Performance Framework Technical Reference

Generated: 2026-07-21T09:31:59.329Z

## Document Purpose

This document is a professional SDET reference for the K6 Performance Framework. It combines the framework overview, execution contracts, configuration model, and a source-level catalog of files, classes, functions, methods, schemas, templates, data files, and sample journeys.

## Executive Summary

| Area | Count |
|---|---:|
| Documented files | 357 |
| Core engine source files | 116 |
| Test suite source files | 68 |
| Documented functions and methods | 1011 |

## Architecture Overview

The framework is an enterprise k6 performance testing engine with LoadRunner-style lifecycle phases: `initPhase`, `actionPhase`, and `endPhase`. It supports HAR-to-script generation, Bring Your Own Script conversion, debug replay diffing, schema-driven configuration, artifact-first reporting, and multi-team suite organization.

The major layers are CLI, Config, Schemas, Types, Scenario, Execution, Runtime, Data, Recording, Correlation, Assertions, Debug, Reporters, Reporting, and Utils. CLI code should orchestrate workflows; engine layers own validation, scenario construction, execution, artifacts, replay, and reusable runtime behavior.

## Normal Execution Flow

1. CLI parses command arguments.
2. The test plan is loaded and validated against schema.
3. Configuration layers are resolved into a single runtime contract.
4. Gatekeeper validation checks scripts, data, recording logs, weights, and hybrid settings.
5. Scenario metadata, runtime metadata, environment URLs, thresholds, and summary trend stats are assembled.
6. k6 is executed through the pipeline runner.
7. Runtime scripts execute lifecycle phases and emit transaction metrics, debug logs, errors, and warnings.
8. Artifacts are finalized: transaction metrics, CI summary, event streams, timeseries, system metrics, and HTML report.

## Debug Replay Flow

Debug mode resolves a recording log, forces a controlled replay profile, enables `K6_PERF_DEBUG`, extracts replay exchange logs, compares recording vs replay entries, and writes an interactive HTML diff report for request, response, timing, and variable substitution analysis.

## Configuration Chain

Configuration is resolved from framework defaults, environment config, runtime settings, suite overrides, CLI flags, and `.env` secrets. JSON Schemas under `config/schemas` are the source of truth for validation and editor assistance.

## Repository File Catalog

| File | Layer | Lines | Purpose |
|---|---|---:|---|
| `ai_context/ai-workflow.md` | AI context | 81 | AI Workflow - > How to work effectively with this repository as an AI agent. |
| `ai_context/architecture-evolution.md` | AI context | 56 | Architecture Evolution - > How the framework evolved over time. Use this to understand architectural trajectory. |
| `ai_context/architecture-laws.md` | AI context | 86 | Architecture Laws - > **Inviolable rules.** Any AI agent or contributor MUST obey these. Violations risk breaking the framework's core guarantees. |
| `ai_context/change-impact-map.md` | AI context | 58 | Change Impact Map - > When you change X, you must also check Y. |
| `ai_context/decisions.md` | AI context | 83 | Architectural Decisions - > Distilled decision records. Each captures what was decided, why, and what constraints it creates. |
| `ai_context/dependency-hotspots.md` | AI context | 49 | Dependency Hotspots - > Modules with highest coupling — changes here have the widest blast radius. |
| `ai_context/dependency-rules.md` | AI context | 64 | Dependency Rules - > Import direction and coupling constraints. |
| `ai_context/execution-flow.md` | AI context | 140 | Execution Flow - > How code runs, from CLI invocation to k6 process and artifacts. |
| `ai_context/extension-points.md` | AI context | 98 | Extension Points - > Where new features can plug into the framework without breaking existing code. |
| `ai_context/features.seed.json` | AI context | 227 | Framework file. Top-level keys: $schema-note, features. |
| `ai_context/fragile-areas.md` | AI context | 81 | Fragile Areas - > Code areas where bugs have historically occurred or where coupling makes changes risky. |
| `ai_context/framework-philosophy.md` | AI context | 64 | Framework Philosophy - > Design principles that explain WHY the architecture is shaped the way it is. |
| `ai_context/integration-checklist.md` | AI context | 61 | Integration Checklist - > Steps to follow when adding any new feature to the framework. |
| `ai_context/integration-contracts.md` | AI context | 91 | Integration Contracts - > Cross-layer API contracts that must be maintained. |
| `ai_context/knowledge-architecture-proposal.md` | AI context | 309 | Knowledge Architecture Proposal — K6-PerfFramework - > **Status:** DESIGN ONLY — approved 2026-07-09; Phase 1 not yet started. This document creates/moves/deletes nothing itself. |
| `ai_context/known-tech-debt.md` | AI context | 96 | Known Technical Debt - > Acknowledged shortcuts, gaps, and areas that need future work. |
| `ai_context/module-map.md` | AI context | 166 | Module Map - > File-level routing table. Find the right file to edit without scanning the whole repo. |
| `ai_context/orchestration-map.md` | AI context | 96 | Orchestration Map - > How CLI commands wire through the engine layers to k6 execution. |
| `ai_context/overview.md` | AI context | 84 | K6-PerfFramework — AI Context Overview - > **Purpose:** Entry point for AI agents. Read this first, then load only the subsystem files relevant to your task. |
| `ai_context/prompt-templates.md` | AI context | 84 | Prompt Templates - > Reusable prompt patterns for common tasks. |
| `ai_context/rejected-approaches.md` | AI context | 64 | Rejected Approaches - > Approaches that were tried or considered and abandoned. Do NOT re-attempt these without new justification. |
| `ai_context/replay-debug-contracts.md` | AI context | 102 | Replay & Debug Contracts - > How the debug replay system works, its contracts, and its failure modes. |
| `ai_context/reporting-contracts.md` | AI context | 141 | Reporting Contracts - > Artifact schemas, report pipeline, and CI/CD integration contracts. |
| `ai_context/risk-zones.md` | AI context | 75 | Risk Zones - > Areas with hidden complexity, undocumented assumptions, or elevated failure risk. |
| `ai_context/runtime-contracts.md` | AI context | 91 | Runtime Contracts - > Contracts governing k6-side runtime behavior (code that runs inside k6's goja engine). |
| `ai_context/subsystem-boundaries.md` | AI context | 66 | Subsystem Boundaries - > Layer ownership rules — which module owns which responsibility. |
| `ai_context/todos.md` | AI context | 107 | Framework To-Do List - > A shared task list for AI agents to maintain continuity across sessions. |
| `ai_context/token-optimization-guide.md` | AI context | 66 | Token Optimization Guide - > Strategies for minimizing AI context token usage. |
| `ai_generated/call_graph.json` | repository | 550 | Framework file. Top-level keys: edges, note. |
| `ai_generated/config_index.json` | repository | 716 | Framework file. Contains a JSON array value. |
| `ai_generated/dependency_graph.json` | repository | 1087 | Framework file. Top-level keys: edges, nodes. |
| `ai_generated/environment_index.json` | repository | 193 | Framework file. Contains a JSON array value. |
| `ai_generated/feature_index.json` | repository | 985 | Framework file. Contains a JSON array value. |
| `ai_generated/file_index.json` | repository | 2060 | Framework file. Contains a JSON array value. |
| `ai_generated/framework_map.json` | repository | 118 | Framework file. Top-level keys: layers. |
| `ai_generated/ownership.json` | repository | 172 | Framework file. Top-level keys: auto-correlation, cli, config, data, debug-replay, execution, legacy-correlation, lifecycle, recording, reporters, reporting, scenario, vu-runtime. |
| `ai_generated/README.md` | repository | 21 | ai_generated/ — Layer 4 (GENERATED — DO NOT EDIT) - Every file here is regenerated deterministically from the repo by committed `tools/` scripts. |
| `ai_generated/search_index.json` | repository | 951 | Framework file. Contains a JSON array value. |
| `ai_generated/symbol_index.json` | repository | 5987 | Framework file. Top-level keys: core_engine/src/assertions/JourneyAssertionResolver.ts#JourneyAssertionResolver, core_engine/src/assertions/SLARegistry.ts#SLARegistry, core_engine/src/assertions/ThresholdManager.ts#PERCENTILE_KEY_RE, core_engine/src/assertions/ThresholdManager.ts#ThresholdManager, core_engine/src/cli/LifecyclePrompt.ts#cq, core_engine/src/cli/LifecyclePrompt.ts#parseSelections, core_engine/src/cli/LifecyclePrompt.ts#promptForLifecycleSelection, core_engine/src/cli/config-inspect.ts#inspectConfig, core_engine/src/cli/convert.ts#runConvert, core_engine/src/cli/correlate.ts#CorrelateOptions, core_engine/src/cli/correlate.ts#defaultManifestPath, core_engine/src/cli/correlate.ts#loadRecordingLog, core_engine/src/cli/correlate.ts#printCandidateTable, core_engine/src/cli/correlate.ts#resolveApplyLevels, core_engine/src/cli/correlate.ts#resolveExchanges, core_engine/src/cli/correlate.ts#runCorrelate, core_engine/src/cli/correlate.ts#toRecordingExchanges, core_engine/src/cli/correlate.ts#truncate, core_engine/src/cli/docs.ts#generateDocs, core_engine/src/cli/features.ts#listFeatures, core_engine/src/cli/generate-byos.ts#runGenerateByos, core_engine/src/cli/generate.ts#cq, core_engine/src/cli/generate.ts#promptForDomains, core_engine/src/cli/generate.ts#promptForStaticAssetPreference, core_engine/src/cli/generate.ts#runGenerate, core_engine/src/cli/import.ts#ConflictPolicy, core_engine/src/cli/import.ts#EmitScriptExtras, core_engine/src/cli/import.ts#ImportCurlOptions, core_engine/src/cli/import.ts#ImportPostmanOptions, core_engine/src/cli/import.ts#buildSplitName, core_engine/src/cli/import.ts#emitScript, core_engine/src/cli/import.ts#emitScriptsPerRequest, core_engine/src/cli/import.ts#printCopiedFiles, core_engine/src/cli/import.ts#printNextSteps, core_engine/src/cli/import.ts#printWarnings, core_engine/src/cli/import.ts#readClipboard, core_engine/src/cli/import.ts#readFromFile, core_engine/src/cli/import.ts#readStdin, core_engine/src/cli/import.ts#runImportCurl, core_engine/src/cli/import.ts#runImportPostman, core_engine/src/cli/import.ts#sanitizeFileStem, core_engine/src/cli/import.ts#writeScriptFile, core_engine/src/cli/init.ts#runInit, core_engine/src/cli/init.ts#writeIfNotExists, core_engine/src/cli/interactive.ts#MENU_GROUPS, core_engine/src/cli/interactive.ts#MenuChoice, core_engine/src/cli/interactive.ts#MenuItem, core_engine/src/cli/interactive.ts#OptionChoice, core_engine/src/cli/interactive.ts#askInput, core_engine/src/cli/interactive.ts#askScriptName, core_engine/src/cli/interactive.ts#cleanPath, core_engine/src/cli/interactive.ts#confirm, core_engine/src/cli/interactive.ts#cq, core_engine/src/cli/interactive.ts#createProjectInteractive, core_engine/src/cli/interactive.ts#dispatch, core_engine/src/cli/interactive.ts#ensureProjectScaffold, core_engine/src/cli/interactive.ts#findFiles, core_engine/src/cli/interactive.ts#folderTreeLabel, core_engine/src/cli/interactive.ts#isFrameworkWorkspace, core_engine/src/cli/interactive.ts#isInsideWorkspace, core_engine/src/cli/interactive.ts#listExistingProjects, core_engine/src/cli/interactive.ts#maybeKeepReferenceCopy, core_engine/src/cli/interactive.ts#pickFile, core_engine/src/cli/interactive.ts#pickFromOptions, core_engine/src/cli/interactive.ts#pickOrCreateProject, core_engine/src/cli/interactive.ts#pickPlan, core_engine/src/cli/interactive.ts#printBanner, core_engine/src/cli/interactive.ts#readUntilBlankLine, core_engine/src/cli/interactive.ts#resolveScriptTarget, core_engine/src/cli/interactive.ts#resolveUserPath, core_engine/src/cli/interactive.ts#runInteractivePanel, core_engine/src/cli/interactive.ts#showMenuAndPick, core_engine/src/cli/interactive.ts#spawnSelf, core_engine/src/cli/interactive.ts#teamFromPath, core_engine/src/cli/interactive.ts#wizardByos, core_engine/src/cli/interactive.ts#wizardConvert, core_engine/src/cli/interactive.ts#wizardDebug, core_engine/src/cli/interactive.ts#wizardGenerate, core_engine/src/cli/interactive.ts#wizardImportCurl, core_engine/src/cli/interactive.ts#wizardImportPostman, core_engine/src/cli/interactive.ts#wizardInit, core_engine/src/cli/interactive.ts#wizardRun, core_engine/src/cli/interactive.ts#wizardValidate, core_engine/src/cli/new.ts#runNewWizard, core_engine/src/cli/run.ts#ERROR_EVENT_PREFIX, core_engine/src/cli/run.ts#FRAMEWORK_OWNED_FLAGS, core_engine/src/cli/run.ts#LIVE_TXN_INTERVAL_MS, core_engine/src/cli/run.ts#LiveTxnStats, core_engine/src/cli/run.ts#SNAPSHOT_EVENT_PREFIX, core_engine/src/cli/run.ts#WARNING_EVENT_PREFIX, core_engine/src/cli/run.ts#bridgeEnvFile, core_engine/src/cli/run.ts#buildLiveTableLines, core_engine/src/cli/run.ts#buildReportAgents, core_engine/src/cli/run.ts#buildRunEnvironment, core_engine/src/cli/run.ts#buildRuntimeMetadataBlock, core_engine/src/cli/run.ts#buildScenarioRuntimeMetadata, core_engine/src/cli/run.ts#collectUniqueTransactionNames, core_engine/src/cli/run.ts#computeTopRequestsByP90, core_engine/src/cli/run.ts#configCmd, core_engine/src/cli/run.ts#extractJourneyTransactionNames, core_engine/src/cli/run.ts#extractK6PerfEvents, core_engine/src/cli/run.ts#extractPayloadWithPrefix, core_engine/src/cli/run.ts#extractSnapshotPayload, core_engine/src/cli/run.ts#extractTransactionNamesFromSource, core_engine/src/cli/run.ts#filterPassthroughArgs, core_engine/src/cli/run.ts#finalizeRunArtifacts, core_engine/src/cli/run.ts#formatCell, core_engine/src/cli/run.ts#getEntryScriptDirectory, core_engine/src/cli/run.ts#importCmd, core_engine/src/cli/run.ts#parseAndFlushSnapshots, core_engine/src/cli/run.ts#pct, core_engine/src/cli/run.ts#percentilesFromStats, core_engine/src/cli/run.ts#prepareRunArtifacts, core_engine/src/cli/run.ts#printTransactionTable, core_engine/src/cli/run.ts#program, core_engine/src/cli/run.ts#renderFixedTable, core_engine/src/cli/run.ts#renderScrollbackTable, core_engine/src/cli/run.ts#resolveRecordingLogForStandaloneDebug, core_engine/src/cli/run.ts#resolveSharedRunIdFromEnv, core_engine/src/cli/run.ts#runJourneyDebug, core_engine/src/cli/run.ts#runPlanDebugMode, core_engine/src/cli/run.ts#startLiveTransactionDisplay, core_engine/src/cli/run.ts#templatesCmd, core_engine/src/cli/run.ts#toImportSpecifier, core_engine/src/cli/run.ts#writeRunManifest, core_engine/src/cli/templates.ts#listTemplates, core_engine/src/cli/templates.ts#showTemplate, core_engine/src/cli/validate.ts#ValidateOptions, core_engine/src/cli/validate.ts#runValidate, core_engine/src/config/ConfigurationManager.ts#ConfigurationManager, core_engine/src/config/EnvResolver.ts#EnvResolver, core_engine/src/config/GatekeeperValidator.ts#GatekeeperResult, core_engine/src/config/GatekeeperValidator.ts#GatekeeperValidator, core_engine/src/config/RuntimeConfigManager.ts#RuntimeConfigManager, core_engine/src/config/SchemaValidator.ts#RUNTIME_SETTINGS_SCHEMA_INLINE, core_engine/src/config/SchemaValidator.ts#SchemaValidator, core_engine/src/config/SchemaValidator.ts#TEST_PLAN_SCHEMA_INLINE, core_engine/src/config/SchemaValidator.ts#ValidationResult, core_engine/src/config/SchemaValidator.ts#levenshtein, core_engine/src/config/SchemaValidator.ts#loadExternalSchema, core_engine/src/config/ScriptContractGuard.ts#ApiViolation, core_engine/src/config/ScriptContractGuard.ts#CallHit, core_engine/src/config/ScriptContractGuard.ts#ContractRule, core_engine/src/config/ScriptContractGuard.ts#FileViolations, core_engine/src/config/ScriptContractGuard.ts#ScriptContractGuard, core_engine/src/correlation/CandidateScorer.ts#BASE64ISH_RE, core_engine/src/correlation/CandidateScorer.ts#CandidateScorer, core_engine/src/correlation/CandidateScorer.ts#DEFAULT_CONFIG, core_engine/src/correlation/CandidateScorer.ts#HEX_RE, core_engine/src/correlation/CandidateScorer.ts#JWT_RE, core_engine/src/correlation/CandidateScorer.ts#ScoreOptions, core_engine/src/correlation/CandidateScorer.ts#ScoredCandidate, core_engine/src/correlation/CandidateScorer.ts#ScorerConfig, core_engine/src/correlation/CandidateScorer.ts#UUID_RE, core_engine/src/correlation/CandidateScorer.ts#deriveNameHint, core_engine/src/correlation/CandidateScorer.ts#shannonBits, core_engine/src/correlation/CorrelationEngine.ts#CorrelationEngine, core_engine/src/correlation/CorrelationManifest.ts#ConsumerLocation, core_engine/src/correlation/CorrelationManifest.ts#CorrelationCandidate, core_engine/src/correlation/CorrelationManifest.ts#CorrelationConfidence, core_engine/src/correlation/CorrelationManifest.ts#CorrelationConsumer, core_engine/src/correlation/CorrelationManifest.ts#CorrelationManifest, core_engine/src/correlation/CorrelationManifest.ts#CorrelationPlan, core_engine/src/correlation/CorrelationManifest.ts#CorrelationProducer, core_engine/src/correlation/CorrelationManifest.ts#ExtractorKind, core_engine/src/correlation/CorrelationManifest.ts#ProducerSource, core_engine/src/correlation/CorrelationManifest.ts#RecordingCookie, core_engine/src/correlation/CorrelationManifest.ts#RecordingExchange, core_engine/src/correlation/CorrelationManifest.ts#RecordingHeader, core_engine/src/correlation/CorrelationManifest.ts#RecordingRequest, core_engine/src/correlation/CorrelationManifest.ts#RecordingResponse, core_engine/src/correlation/CorrelationScanner.ts#CorrelationScanner, core_engine/src/correlation/CorrelationScanner.ts#DEFAULT_CONFIG_PATH, core_engine/src/correlation/CorrelationScanner.ts#ScanOptions, core_engine/src/correlation/ExtractorRegistry.ts#ExtractorFn, core_engine/src/correlation/ExtractorRegistry.ts#ExtractorRegistry, core_engine/src/correlation/ExtractorRegistry.ts#K6ResponseLike, core_engine/src/correlation/ExtractorSynthesizer.ts#ExtractorSynthesizer, core_engine/src/correlation/ExtractorSynthesizer.ts#buildRegexFallback, core_engine/src/correlation/ExtractorSynthesizer.ts#escapeRegex, core_engine/src/correlation/ExtractorSynthesizer.ts#locateWithBoundary, core_engine/src/correlation/ExtractorSynthesizer.ts#sanitizeIdentifier, core_engine/src/correlation/ExtractorSynthesizer.ts#semanticHtmlBoundary, core_engine/src/correlation/ExtractorSynthesizer.ts#synthesizeBoundary, core_engine/src/correlation/FallbackHandler.ts#FallbackHandler, core_engine/src/correlation/LinkMatcher.ts#LinkMatcher, core_engine/src/correlation/LinkMatcher.ts#RawCandidate, core_engine/src/correlation/LinkMatcher.ts#SOURCE_PRIORITY, core_engine/src/correlation/RuleProcessor.ts#CorrelationRule, core_engine/src/correlation/RuleProcessor.ts#RuleProcessor, core_engine/src/correlation/ScriptCorrelationWriter.ts#ApplyOptions, core_engine/src/correlation/ScriptCorrelationWriter.ts#ApplyResult, core_engine/src/correlation/ScriptCorrelationWriter.ts#EXTRACT_FN, core_engine/src/correlation/ScriptCorrelationWriter.ts#RequestCall, core_engine/src/correlation/ScriptCorrelationWriter.ts#ScriptCorrelationWriter, core_engine/src/correlation/ScriptCorrelationWriter.ts#buildExtractCall, core_engine/src/correlation/ScriptCorrelationWriter.ts#insertAfterImports, core_engine/src/correlation/ScriptCorrelationWriter.ts#leadingIndent, core_engine/src/correlation/ScriptCorrelationWriter.ts#matchParen, core_engine/src/correlation/ScriptCorrelationWriter.ts#rewriteStringLiterals, core_engine/src/correlation/ValueIndexer.ts#ConsumerOccurrence, core_engine/src/correlation/ValueIndexer.ts#IndexedValues, core_engine/src/correlation/ValueIndexer.ts#MAX_VALUE_LEN, core_engine/src/correlation/ValueIndexer.ts#MIN_VALUE_LEN, core_engine/src/correlation/ValueIndexer.ts#ProducerOccurrence, core_engine/src/correlation/ValueIndexer.ts#STATIC_REQUEST_HEADERS, core_engine/src/correlation/ValueIndexer.ts#ValueIndexer, core_engine/src/correlation/ValueIndexer.ts#decodeSafe, core_engine/src/correlation/ValueIndexer.ts#extractHtmlTokens, core_engine/src/correlation/ValueIndexer.ts#isIndexableValue, core_engine/src/correlation/ValueIndexer.ts#looksLikeHtml, core_engine/src/correlation/ValueIndexer.ts#parseCookieHeader, core_engine/src/correlation/ValueIndexer.ts#parseQuery, core_engine/src/correlation/ValueIndexer.ts#subTokens, core_engine/src/correlation/ValueIndexer.ts#tryParseForm, core_engine/src/correlation/ValueIndexer.ts#tryParseJson, core_engine/src/correlation/ValueIndexer.ts#walkJson, core_engine/src/data/DataFactory.ts#DataFactory, core_engine/src/data/DataFactory.ts#DataRow, core_engine/src/data/DataFactory.ts#LoadedDataset, core_engine/src/data/DataPoolManager.ts#DataPoolManager, core_engine/src/data/DataPoolManager.ts#PoolConfig, core_engine/src/data/DataValidator.ts#DataValidationResult, core_engine/src/data/DataValidator.ts#DataValidator, core_engine/src/data/DynamicValueFactory.ts#DynamicValueFactory, core_engine/src/debug/DiffChecker.ts#BodyDiffResult, core_engine/src/debug/DiffChecker.ts#DiffChecker, core_engine/src/debug/DiffChecker.ts#DiffResult, core_engine/src/debug/DiffChecker.ts#HeaderDiffEntry, core_engine/src/debug/DiffChecker.ts#ReplayComparisonContext, core_engine/src/debug/DiffChecker.ts#ReplayProjection, core_engine/src/debug/DiffChecker.ts#SideSnapshot, core_engine/src/debug/ExchangeLog.ts#ExchangeLogBuilder, core_engine/src/debug/ExchangeLog.ts#ExchangeLogCookie, core_engine/src/debug/ExchangeLog.ts#ExchangeLogHeader, core_engine/src/debug/ExchangeLog.ts#ExchangeLogParams, core_engine/src/debug/ExchangeLog.ts#ExchangeLogRequest, core_engine/src/debug/ExchangeLog.ts#ExchangeLogResponse, core_engine/src/debug/ExchangeLog.ts#TaggedExchangeLogEntry, core_engine/src/debug/ExchangeLog.ts#VariableEvent, core_engine/src/debug/HTMLDiffReporter.ts#HTMLDiffReporter, core_engine/src/debug/HTMLDiffReporter.ts#ReportOptions, core_engine/src/debug/HTMLDiffReporter.ts#ReportPayload, core_engine/src/debug/RecordingLogResolver.ts#RecordingIndexEntry, core_engine/src/debug/RecordingLogResolver.ts#RecordingLogResolution, core_engine/src/debug/RecordingLogResolver.ts#RecordingLogResolver, core_engine/src/debug/ReplayRunner.ts#DebugReplayOptions, core_engine/src/debug/ReplayRunner.ts#DebugReplayResult, core_engine/src/debug/ReplayRunner.ts#K6MetricRow, core_engine/src/debug/ReplayRunner.ts#K6Metrics, core_engine/src/debug/ReplayRunner.ts#ReplayRunner, core_engine/src/debug/ReplayRunner.ts#extractTransactionNames, core_engine/src/debug/VariableInstrumenter.ts#Classified, core_engine/src/debug/VariableInstrumenter.ts#INTERP_RE, core_engine/src/debug/VariableInstrumenter.ts#InstrumentResult, core_engine/src/debug/VariableInstrumenter.ts#classify, core_engine/src/debug/VariableInstrumenter.ts#instrumentVariableTracking, core_engine/src/debug/VariableInstrumenter.ts#sanitize, core_engine/src/distributed/LiveStatusHeartbeat.ts#HeartbeatOptions, core_engine/src/distributed/LiveStatusHeartbeat.ts#LiveState, core_engine/src/distributed/LiveStatusHeartbeat.ts#LiveStatusHeartbeat, core_engine/src/distributed/LiveStatusHeartbeat.ts#LiveStatusSnapshot, core_engine/src/distributed/LiveStatusHeartbeat.ts#tailNdjson, core_engine/src/distributed/MergeEngine.ts#MachineArtifacts, core_engine/src/distributed/MergeEngine.ts#MergeEngine, core_engine/src/distributed/MergeEngine.ts#MergeOptions, core_engine/src/distributed/MergeEngine.ts#MergeResult, core_engine/src/distributed/MergeEngine.ts#TxnAccumulator, core_engine/src/distributed/MergeEngine.ts#statToFraction, core_engine/src/distributed/MergedReportBuilder.ts#MachineTimeseries, core_engine/src/distributed/MergedReportBuilder.ts#MergedReportBuilder, core_engine/src/distributed/MergedReportBuilder.ts#MergedReportInput, core_engine/src/distributed/MergedReportBuilder.ts#percentilesFrom, core_engine/src/distributed/agentServer.ts#AgentServerOptions, core_engine/src/distributed/agentServer.ts#FRAMEWORK_VERSION, core_engine/src/distributed/agentServer.ts#TOKEN_HEADER, core_engine/src/distributed/agentServer.ts#buildInfo, core_engine/src/distributed/agentServer.ts#detectK6Version, core_engine/src/distributed/agentServer.ts#freeDiskBytes, core_engine/src/distributed/agentServer.ts#runAgent, core_engine/src/distributed/agentServer.ts#runAgentCli, core_engine/src/distributed/agentServer.ts#tokenMatches, core_engine/src/distributed/collectRun.ts#DEFAULT_EXCLUDE, core_engine/src/distributed/collectRun.ts#collectRunDir, core_engine/src/distributed/collectRun.ts#copyDirInto, core_engine/src/distributed/collectRun.ts#liveRunDir, core_engine/src/distributed/collectRun.ts#readRunId, core_engine/src/distributed/collectRun.ts#runBaseDir, core_engine/src/distributed/collectRun.ts#runCollect, core_engine/src/distributed/collectRun.ts#sharedRunDir, core_engine/src/distributed/control.ts#ControlAction, core_engine/src/distributed/control.ts#ControlFile, core_engine/src/distributed/control.ts#ControlWatcher, core_engine/src/distributed/control.ts#ControlWatcherOptions, core_engine/src/distributed/control.ts#controlDirFor, core_engine/src/distributed/control.ts#fetchK6Vus, core_engine/src/distributed/control.ts#k6ApiStop, core_engine/src/distributed/control.ts#killProcessTree, core_engine/src/distributed/control.ts#readControl, core_engine/src/distributed/control.ts#writeControl, core_engine/src/distributed/liveAggregate.ts#DEFAULT_STATS, core_engine/src/distributed/liveAggregate.ts#LiveAggregate, core_engine/src/distributed/liveAggregate.ts#MergedTxn, core_engine/src/distributed/liveAggregate.ts#RunContext, core_engine/src/distributed/liveAggregate.ts#aggregate, core_engine/src/distributed/liveAggregate.ts#controllerHost, core_engine/src/distributed/liveAggregate.ts#ctrlHost, core_engine/src/distributed/liveAggregate.ts#ctrlTimer, core_engine/src/distributed/liveAggregate.ts#findLatestFinalReport, core_engine/src/distributed/liveAggregate.ts#mergeTransactions, core_engine/src/distributed/liveAggregate.ts#readSnapshots, core_engine/src/distributed/liveAggregate.ts#resolveLiveDir, core_engine/src/distributed/liveAggregate.ts#resolveRunContext, core_engine/src/distributed/liveAggregate.ts#startControllerHostSampling, core_engine/src/distributed/liveAggregate.ts#statToFraction, core_engine/src/distributed/liveAggregate.ts#statValue, core_engine/src/distributed/liveAggregate.ts#timingStats, core_engine/src/distributed/liveDashboard.ts#DashboardOptions, core_engine/src/distributed/liveDashboard.ts#page, core_engine/src/distributed/liveDashboard.ts#runDashboardCli, core_engine/src/distributed/liveDashboard.ts#startDashboardServer, core_engine/src/distributed/monitor.ts#MonitorOptions, core_engine/src/distributed/monitor.ts#padL, core_engine/src/distributed/monitor.ts#padR, core_engine/src/distributed/monitor.ts#render, core_engine/src/distributed/monitor.ts#runMonitor, core_engine/src/distributed/probe.ts#ProbeResult, core_engine/src/distributed/probe.ts#ProbeTarget, core_engine/src/distributed/probe.ts#TOKEN_HEADER, core_engine/src/distributed/probe.ts#diagnose, core_engine/src/distributed/probe.ts#parseTarget, core_engine/src/distributed/probe.ts#probeOne, core_engine/src/distributed/probe.ts#probeTcp, core_engine/src/distributed/probe.ts#runProbe, core_engine/src/distributed/runMerge.ts#FINAL_PREFIX, core_engine/src/distributed/runMerge.ts#MERGED_DIR, core_engine/src/distributed/runMerge.ts#MergeCliOptions, core_engine/src/distributed/runMerge.ts#finalTimestamp, core_engine/src/distributed/runMerge.ts#machineLanded, core_engine/src/distributed/runMerge.ts#readJson, core_engine/src/distributed/runMerge.ts#readNdjson, core_engine/src/distributed/runMerge.ts#runMerge, core_engine/src/distributed/runMerge.ts#sleep, core_engine/src/distributed/runMerge.ts#validateManifests, core_engine/src/distributed/runMerge.ts#waitForMachines, core_engine/src/distributed/runMerge.ts#writeMergedCsv, core_engine/src/distributed/shareSetup.ts#ShareSuggestionOptions, core_engine/src/distributed/shareSetup.ts#printControllerShareSuggestion, core_engine/src/distributed/shareSetup.ts#resolveResultsBaseDir, core_engine/src/distributed/startBarrier.ts#awaitScheduledStart, core_engine/src/distributed/startBarrier.ts#fmtRemaining, core_engine/src/distributed/transactionCsv.ts#CsvTransactionAggregate, core_engine/src/distributed/transactionCsv.ts#RequestTiming, core_engine/src/distributed/transactionCsv.ts#TransactionCsvStats, core_engine/src/distributed/transactionCsv.ts#buildTransactionRowsFromCsv, core_engine/src/distributed/transactionCsv.ts#findRequestCsv, core_engine/src/distributed/transactionCsv.ts#findTransactionCsv, core_engine/src/distributed/transactionCsv.ts#flatten, core_engine/src/distributed/transactionCsv.ts#leafFor, core_engine/src/distributed/transactionCsv.ts#parseCsvLine, core_engine/src/distributed/transactionCsv.ts#readRequestFailByBucket, core_engine/src/distributed/transactionCsv.ts#readRequestFailure, core_engine/src/distributed/transactionCsv.ts#readRequestTimings, core_engine/src/distributed/transactionCsv.ts#readTransactionCsvRaw, core_engine/src/distributed/transactionCsv.ts#readTransactionCsvStats, core_engine/src/execution/FileWriteSink.ts#FILE_TAG, core_engine/src/execution/FileWriteSink.ts#FilePayload, core_engine/src/execution/FileWriteSink.ts#FileWriteSink, core_engine/src/execution/HostMonitor.ts#HostMonitor, core_engine/src/execution/HostMonitor.ts#HostSnapshot, core_engine/src/execution/JourneyAllocator.ts#JourneyAllocation, core_engine/src/execution/JourneyAllocator.ts#JourneyAllocator, core_engine/src/execution/ParallelExecutionManager.ts#K6Options, core_engine/src/execution/ParallelExecutionManager.ts#ParallelExecutionManager, core_engine/src/execution/PipelineRunner.ts#PipelineRunResult, core_engine/src/execution/PipelineRunner.ts#PipelineRunner, core_engine/src/execution/PipelineRunner.ts#RunOptions, core_engine/src/recording/CurlAdapter.ts#CurlAdapter, core_engine/src/recording/CurlAdapter.ts#CurlParseResult, core_engine/src/recording/CurlAdapter.ts#ParsedCurlBlock, core_engine/src/recording/DomainFilter.ts#DomainFilter, core_engine/src/recording/DomainFilter.ts#DomainStat, core_engine/src/recording/HARParser.ts#HARParser, core_engine/src/recording/PostmanAdapter.ts#FileBinding, core_engine/src/recording/PostmanAdapter.ts#PostmanAdapter, core_engine/src/recording/PostmanAdapter.ts#PostmanAuth, core_engine/src/recording/PostmanAdapter.ts#PostmanAuthParam, core_engine/src/recording/PostmanAdapter.ts#PostmanBody, core_engine/src/recording/PostmanAdapter.ts#PostmanCollectionFile, core_engine/src/recording/PostmanAdapter.ts#PostmanEvent, core_engine/src/recording/PostmanAdapter.ts#PostmanFolderInfo, core_engine/src/recording/PostmanAdapter.ts#PostmanHeader, core_engine/src/recording/PostmanAdapter.ts#PostmanItem, core_engine/src/recording/PostmanAdapter.ts#PostmanParseOptions, core_engine/src/recording/PostmanAdapter.ts#PostmanParseResult, core_engine/src/recording/PostmanAdapter.ts#PostmanRequest, core_engine/src/recording/PostmanAdapter.ts#PostmanUrl, core_engine/src/recording/PostmanAdapter.ts#mimeFromExt, core_engine/src/recording/PostmanAdapter.ts#normalizeFolderFilter, core_engine/src/recording/PostmanAdapter.ts#pathHasPrefix, core_engine/src/recording/PostmanAdapter.ts#safeJsonParse, core_engine/src/recording/PostmanAdapter.ts#sanitizeName, core_engine/src/recording/PostmanScriptTranslator.ts#LineResult, core_engine/src/recording/PostmanScriptTranslator.ts#RES, core_engine/src/recording/PostmanScriptTranslator.ts#TranslationResult, core_engine/src/recording/PostmanScriptTranslator.ts#countClosers, core_engine/src/recording/PostmanScriptTranslator.ts#countOpeners, core_engine/src/recording/PostmanScriptTranslator.ts#translateLine, core_engine/src/recording/PostmanScriptTranslator.ts#translatePostmanScript, core_engine/src/recording/ScriptConverter.ts#ScriptConverter, core_engine/src/recording/ScriptGenerator.ts#GenerateOptions, core_engine/src/recording/ScriptGenerator.ts#LifecycleSelection, core_engine/src/recording/ScriptGenerator.ts#SCRIPT_API_MODULE, core_engine/src/recording/ScriptGenerator.ts#ScriptGenerator, core_engine/src/recording/TransactionGrouper.ts#TransactionGroup, core_engine/src/recording/TransactionGrouper.ts#TransactionGrouper, core_engine/src/reporters/AzureReporter.ts#AzureReporter, core_engine/src/reporters/CustomUploader.ts#CustomUploader, core_engine/src/reporters/GrafanaReporter.ts#GrafanaReporter, core_engine/src/reporters/ResultTransformer.ts#ResultContract, core_engine/src/reporters/ResultTransformer.ts#ResultTransformer, core_engine/src/reporting/ArtifactWriter.ts#ArtifactWriter, core_engine/src/reporting/EventArtifactBuilder.ts#BuildEventArtifactsOptions, core_engine/src/reporting/EventArtifactBuilder.ts#EventArtifactBuilder, core_engine/src/reporting/EventArtifactBuilder.ts#SummaryCheck, core_engine/src/reporting/EventArtifactBuilder.ts#SummaryGroup, core_engine/src/reporting/EventArtifactBuilder.ts#SummaryMetric, core_engine/src/reporting/Histogram.ts#HistogramJSON, core_engine/src/reporting/Histogram.ts#RelativeHistogram, core_engine/src/reporting/Histogram.ts#percentileR7, core_engine/src/reporting/HistogramArtifactBuilder.ts#BuildHistogramOptions, core_engine/src/reporting/HistogramArtifactBuilder.ts#HistogramArtifact, core_engine/src/reporting/HistogramArtifactBuilder.ts#HistogramArtifactBuilder, core_engine/src/reporting/HistogramArtifactBuilder.ts#OVERVIEW_KEY, core_engine/src/reporting/LiveEventLogWriter.ts#ERROR_EVENT_PREFIX, core_engine/src/reporting/LiveEventLogWriter.ts#LiveEventLogWriter, core_engine/src/reporting/LiveEventLogWriter.ts#WARNING_EVENT_PREFIX, core_engine/src/reporting/RequestMetricLogWriter.ts#COLUMNS, core_engine/src/reporting/RequestMetricLogWriter.ts#POLL_INTERVAL_MS, core_engine/src/reporting/RequestMetricLogWriter.ts#PROMOTED_TAGS, core_engine/src/reporting/RequestMetricLogWriter.ts#PendingRow, core_engine/src/reporting/RequestMetricLogWriter.ts#RawPoint, core_engine/src/reporting/RequestMetricLogWriter.ts#RequestMetricLogContext, core_engine/src/reporting/RequestMetricLogWriter.ts#RequestMetricLogWriter, core_engine/src/reporting/RequestMetricLogWriter.ts#csvField, core_engine/src/reporting/RunReportGenerator.ts#RunReportGenerator, core_engine/src/reporting/RunSummaryBuilder.ts#BuildRunSummaryOptions, core_engine/src/reporting/RunSummaryBuilder.ts#RunSummaryBuilder, core_engine/src/reporting/TimeseriesArtifactBuilder.ts#BuildTimeseriesArtifactOptions, core_engine/src/reporting/TimeseriesArtifactBuilder.ts#SummaryMetric, core_engine/src/reporting/TimeseriesArtifactBuilder.ts#TimeseriesArtifactBuilder, core_engine/src/reporting/TimeseriesArtifactBuilder.ts#metricVal, core_engine/src/reporting/TimeseriesStreamParser.ts#OverviewBucket, core_engine/src/reporting/TimeseriesStreamParser.ts#OverviewRaw, core_engine/src/reporting/TimeseriesStreamParser.ts#ParseOptions, core_engine/src/reporting/TimeseriesStreamParser.ts#ParsedTimeseries, core_engine/src/reporting/TimeseriesStreamParser.ts#ParsedTransactionSeries, core_engine/src/reporting/TimeseriesStreamParser.ts#PhaseTimings, core_engine/src/reporting/TimeseriesStreamParser.ts#RawPoint, core_engine/src/reporting/TimeseriesStreamParser.ts#RequestBucket, core_engine/src/reporting/TimeseriesStreamParser.ts#RequestRaw, core_engine/src/reporting/TimeseriesStreamParser.ts#TimeseriesStreamParser, core_engine/src/reporting/TimeseriesStreamParser.ts#TransactionBucket, core_engine/src/reporting/TimeseriesStreamParser.ts#TransactionRaw, core_engine/src/reporting/TimeseriesStreamParser.ts#TrendStats, core_engine/src/reporting/TimeseriesStreamParser.ts#computeTrendStats, core_engine/src/reporting/TimeseriesStreamParser.ts#emptyPhase, core_engine/src/reporting/TimeseriesStreamParser.ts#finalizeOverview, core_engine/src/reporting/TimeseriesStreamParser.ts#finalizeRequest, core_engine/src/reporting/TimeseriesStreamParser.ts#finalizeTransaction, core_engine/src/reporting/TimeseriesStreamParser.ts#getOverview, core_engine/src/reporting/TimeseriesStreamParser.ts#normalizePercentiles, core_engine/src/reporting/TimeseriesStreamParser.ts#percentile, core_engine/src/reporting/TimeseriesStreamParser.ts#phaseStats, core_engine/src/reporting/TransactionMetricLogWriter.ts#CHECKRATE_SUFFIX, core_engine/src/reporting/TransactionMetricLogWriter.ts#COLUMNS, core_engine/src/reporting/TransactionMetricLogWriter.ts#POLL_INTERVAL_MS, core_engine/src/reporting/TransactionMetricLogWriter.ts#PendingRow, core_engine/src/reporting/TransactionMetricLogWriter.ts#RawPoint, core_engine/src/reporting/TransactionMetricLogWriter.ts#TransactionMetricLogContext, core_engine/src/reporting/TransactionMetricLogWriter.ts#TransactionMetricLogWriter, core_engine/src/reporting/TransactionMetricLogWriter.ts#csvField, core_engine/src/reporting/TransactionMetricsBuilder.ts#BuildTransactionMetricsOptions, core_engine/src/reporting/TransactionMetricsBuilder.ts#GroupAggregate, core_engine/src/reporting/TransactionMetricsBuilder.ts#SummaryCheck, core_engine/src/reporting/TransactionMetricsBuilder.ts#SummaryGroup, core_engine/src/reporting/TransactionMetricsBuilder.ts#SummaryMetric, core_engine/src/reporting/TransactionMetricsBuilder.ts#TransactionMetricsBuilder, core_engine/src/runtime/ErrorRuntime.ts#ErrorRuntime, core_engine/src/runtime/ErrorRuntime.ts#ErrorRuntimeContext, core_engine/src/runtime/LifecycleRuntime.ts#JourneyContext, core_engine/src/runtime/LifecycleRuntime.ts#JourneyPhase, core_engine/src/runtime/LifecycleRuntime.ts#LifecycleDecision, core_engine/src/runtime/LifecycleRuntime.ts#LifecyclePhaseFns, core_engine/src/runtime/LifecycleRuntime.ts#LifecycleRunState, core_engine/src/runtime/LifecycleRuntime.ts#LifecycleRuntime, core_engine/src/runtime/MetricsRuntime.ts#MetricsRuntime, core_engine/src/runtime/MetricsRuntime.ts#TransactionAggregate, core_engine/src/runtime/SnapshotRuntime.ts#SnapshotRuntime, core_engine/src/runtime/TimeseriesRuntime.ts#TimeseriesRuntime, core_engine/src/scenario/ExecutorFactory.ts#EXECUTOR_SPECS, core_engine/src/scenario/ExecutorFactory.ts#ExecutorFactory, core_engine/src/scenario/ExecutorFactory.ts#ExecutorSpec, core_engine/src/scenario/ScenarioBuilder.ts#K6ScenarioDefinition, core_engine/src/scenario/ScenarioBuilder.ts#K6ScenariosMap, core_engine/src/scenario/ScenarioBuilder.ts#ScenarioBuilder, core_engine/src/scenario/ScenarioBuilder.ts#ScenarioPhaseEnvelope, core_engine/src/scenario/ScenarioBuilder.ts#ScenarioRuntimeMetadata, core_engine/src/scenario/TestPlanLoader.ts#TestPlanLoader, core_engine/src/scenario/WorkloadModels.ts#K6ExecutorConfig, core_engine/src/scenario/WorkloadModels.ts#buildConstantArrivalRateProfile, core_engine/src/scenario/WorkloadModels.ts#buildExternallyControlledProfile, core_engine/src/scenario/WorkloadModels.ts#buildIterationProfile, core_engine/src/scenario/WorkloadModels.ts#buildLoadProfile, core_engine/src/scenario/WorkloadModels.ts#buildRampingArrivalRateProfile, core_engine/src/scenario/WorkloadModels.ts#buildSoakProfile, core_engine/src/scenario/WorkloadModels.ts#buildSpikeProfile, core_engine/src/scenario/WorkloadModels.ts#buildStressProfile, core_engine/src/scenario/WorkloadModels.ts#toK6ExecutorConfig, core_engine/src/types/ConfigContracts.ts#EnvironmentConfig, core_engine/src/types/ConfigContracts.ts#EnvironmentCustomValue, core_engine/src/types/ConfigContracts.ts#ErrorBehavior, core_engine/src/types/ConfigContracts.ts#ErrorCaptureConfig, core_engine/src/types/ConfigContracts.ts#FRAMEWORK_DEFAULTS, core_engine/src/types/ConfigContracts.ts#HttpConfig, core_engine/src/types/ConfigContracts.ts#MonitoringConfig, core_engine/src/types/ConfigContracts.ts#PacingConfig, core_engine/src/types/ConfigContracts.ts#PacingMode, core_engine/src/types/ConfigContracts.ts#ReportingConfig, core_engine/src/types/ConfigContracts.ts#ResolvedConfig, core_engine/src/types/ConfigContracts.ts#RuntimeSettings, core_engine/src/types/ConfigContracts.ts#TeamEnvironmentOverride, core_engine/src/types/ConfigContracts.ts#ThinkTimeConfig, core_engine/src/types/ConfigContracts.ts#ThinkTimeMode, core_engine/src/types/ConfigContracts.ts#TimeSeriesReportingConfig, core_engine/src/types/EventContracts.ts#AgentContext, core_engine/src/types/EventContracts.ts#ErrorCause, core_engine/src/types/EventContracts.ts#ErrorEvent, core_engine/src/types/EventContracts.ts#EventLevel, core_engine/src/types/EventContracts.ts#SnapshotPayload, core_engine/src/types/EventContracts.ts#SnapshotReference, core_engine/src/types/EventContracts.ts#VariableUsage, core_engine/src/types/EventContracts.ts#WarningEvent, core_engine/src/types/EventContracts.ts#WarningMetric, core_engine/src/types/HARContracts.ts#HAREntry, core_engine/src/types/HARContracts.ts#HARRefinementOptions, core_engine/src/types/ReportingContracts.ts#CiSummary, core_engine/src/types/ReportingContracts.ts#CiTransactionSummary, core_engine/src/types/ReportingContracts.ts#ReportBundle, core_engine/src/types/ReportingContracts.ts#ReportBundleConfig, core_engine/src/types/ReportingContracts.ts#ReportBundleMeta, core_engine/src/types/ReportingContracts.ts#RunSummaryFile, core_engine/src/types/ReportingContracts.ts#TimeSeriesFile, core_engine/src/types/ReportingContracts.ts#TimeSeriesPoint, core_engine/src/types/ReportingContracts.ts#TransactionMetricRow, core_engine/src/types/ReportingContracts.ts#TransactionMetricsFile, core_engine/src/types/ReportingContracts.ts#TransactionSeries, core_engine/src/types/ReportingContracts.ts#normalizeTransactionSeries, core_engine/src/types/TestPlanSchema.ts#DataOverflowStrategy, core_engine/src/types/TestPlanSchema.ts#DebugSettings, core_engine/src/types/TestPlanSchema.ts#ExecutionMode, core_engine/src/types/TestPlanSchema.ts#ExecutorType, core_engine/src/types/TestPlanSchema.ts#GlobalLoadProfile, core_engine/src/types/TestPlanSchema.ts#GlobalSLADefinition, core_engine/src/types/TestPlanSchema.ts#HybridGroup, core_engine/src/types/TestPlanSchema.ts#LoadStage, core_engine/src/types/TestPlanSchema.ts#SLADefinition, core_engine/src/types/TestPlanSchema.ts#TestPlan, core_engine/src/types/TestPlanSchema.ts#UserJourney, core_engine/src/types/TestPlanSchema.ts#WorkloadModelType, core_engine/src/utils/LiveConsoleLogStream.ts#LIVE_CONSOLE_POLL_MS, core_engine/src/utils/LiveConsoleLogStream.ts#startLiveConsoleLogStream, core_engine/src/utils/PathResolver.ts#PathResolution, core_engine/src/utils/PathResolver.ts#PathResolver, core_engine/src/utils/ProgressBar.ts#ProgressBar, core_engine/src/utils/ProgressBar.ts#ansi, core_engine/src/utils/ProgressBar.ts#createSpinner, core_engine/src/utils/ProgressBar.ts#isColorEnabled, core_engine/src/utils/autoHeaders.ts#StoredHeader, core_engine/src/utils/autoHeaders.ts#_autoHeaders, core_engine/src/utils/autoHeaders.ts#_onceHeaders, core_engine/src/utils/autoHeaders.ts#addAutoHeader, core_engine/src/utils/autoHeaders.ts#addAutoHeaders, core_engine/src/utils/autoHeaders.ts#addHeaderOnce, core_engine/src/utils/autoHeaders.ts#clearAutoHeaders, core_engine/src/utils/autoHeaders.ts#getAutoHeaders, core_engine/src/utils/autoHeaders.ts#mergeRequestHeaders, core_engine/src/utils/autoHeaders.ts#removeAutoHeader, core_engine/src/utils/dataWriter.ts#FILE_TAG, core_engine/src/utils/dataWriter.ts#WriteDataOptions, core_engine/src/utils/dataWriter.ts#writeData, core_engine/src/utils/extract.ts#ExtractableResponse, core_engine/src/utils/extract.ts#asResultString, core_engine/src/utils/extract.ts#bodyString, core_engine/src/utils/extract.ts#extractBoundary, core_engine/src/utils/extract.ts#extractCookie, core_engine/src/utils/extract.ts#extractHeader, core_engine/src/utils/extract.ts#extractJson, core_engine/src/utils/extract.ts#extractRegex, core_engine/src/utils/extract.ts#navigate, core_engine/src/utils/extract.ts#queryParamFromUrl, core_engine/src/utils/lifecycle.ts#CurvePoint, core_engine/src/utils/lifecycle.ts#EndFamily, core_engine/src/utils/lifecycle.ts#EndPlan, core_engine/src/utils/lifecycle.ts#JourneyContext, core_engine/src/utils/lifecycle.ts#JourneyLifecycleStore, core_engine/src/utils/lifecycle.ts#JourneyState, core_engine/src/utils/lifecycle.ts#LIFECYCLE_END_SAFETY_MS, core_engine/src/utils/lifecycle.ts#PhaseFns, core_engine/src/utils/lifecycle.ts#PhaseMetadata, core_engine/src/utils/lifecycle.ts#RuntimeMetadata, core_engine/src/utils/lifecycle.ts#TimelineStage, core_engine/src/utils/lifecycle.ts#TransactionGate, core_engine/src/utils/lifecycle.ts#__ENV, core_engine/src/utils/lifecycle.ts#_currentPhase, core_engine/src/utils/lifecycle.ts#activeEndPlan, core_engine/src/utils/lifecycle.ts#applyPacing, core_engine/src/utils/lifecycle.ts#arrivalNoticePrinted, core_engine/src/utils/lifecycle.ts#buildVuCurve, core_engine/src/utils/lifecycle.ts#computeEndPlan, core_engine/src/utils/lifecycle.ts#createContext, core_engine/src/utils/lifecycle.ts#createJourneyLifecycleStore, core_engine/src/utils/lifecycle.ts#createState, core_engine/src/utils/lifecycle.ts#createTrackedProxy, core_engine/src/utils/lifecycle.ts#frameworkIterations, core_engine/src/utils/lifecycle.ts#getPhaseMetadata, core_engine/src/utils/lifecycle.ts#getRuntimeMetadata, core_engine/src/utils/lifecycle.ts#getTransactionGate, core_engine/src/utils/lifecycle.ts#handlePhaseError, core_engine/src/utils/lifecycle.ts#interpolateTarget, core_engine/src/utils/lifecycle.ts#isEndDueAfter, core_engine/src/utils/lifecycle.ts#isEndDueBefore, core_engine/src/utils/lifecycle.ts#isEnding, core_engine/src/utils/lifecycle.ts#parseJsonEnv, core_engine/src/utils/lifecycle.ts#runJourneyLifecycle, core_engine/src/utils/lifecycle.ts#runSafely, core_engine/src/utils/lifecycle.ts#terminalDeadlineMs, core_engine/src/utils/lifecycle.ts#thinktime, core_engine/src/utils/logger.ts#Logger, core_engine/src/utils/logger.ts#ansi, core_engine/src/utils/logger.ts#isColorEnabled, core_engine/src/utils/logger.ts#levelStyles, core_engine/src/utils/replayLogger.ts#BINARY_CONTENT_RE, core_engine/src/utils/replayLogger.ts#BINARY_MIME_TYPES, core_engine/src/utils/replayLogger.ts#Cookie, core_engine/src/utils/replayLogger.ts#ExchangeMeta, core_engine/src/utils/replayLogger.ts#K6Response, core_engine/src/utils/replayLogger.ts#NormalizedHeader, core_engine/src/utils/replayLogger.ts#RequestDefinition, core_engine/src/utils/replayLogger.ts#RequestInfo, core_engine/src/utils/replayLogger.ts#STATIC_EXT_RE, core_engine/src/utils/replayLogger.ts#VariableEvent, core_engine/src/utils/replayLogger.ts#VariableRegistryEntry, core_engine/src/utils/replayLogger.ts#_GENERIC_SOURCES, core_engine/src/utils/replayLogger.ts#__ENV, core_engine/src/utils/replayLogger.ts#_variableRegistry, core_engine/src/utils/replayLogger.ts#binaryBodyPlaceholder, core_engine/src/utils/replayLogger.ts#callerScriptLocation, core_engine/src/utils/replayLogger.ts#createVariableEvent, core_engine/src/utils/replayLogger.ts#currentIteration, core_engine/src/utils/replayLogger.ts#currentVu, core_engine/src/utils/replayLogger.ts#detectVariableEvents, core_engine/src/utils/replayLogger.ts#extractCookies, core_engine/src/utils/replayLogger.ts#extractJarCookies, core_engine/src/utils/replayLogger.ts#extractK6ResponseCookies, core_engine/src/utils/replayLogger.ts#extractQueryParams, core_engine/src/utils/replayLogger.ts#iterationState, core_engine/src/utils/replayLogger.ts#logExchange, core_engine/src/utils/replayLogger.ts#logReplayExchange, core_engine/src/utils/replayLogger.ts#nextRequestSequence, core_engine/src/utils/replayLogger.ts#normalizeHeaders, core_engine/src/utils/replayLogger.ts#resolveVariableSource, core_engine/src/utils/replayLogger.ts#trackAuto, core_engine/src/utils/replayLogger.ts#trackCorrelation, core_engine/src/utils/replayLogger.ts#trackDataRow, core_engine/src/utils/replayLogger.ts#trackParameter, core_engine/src/utils/request.ts#CookieValue, core_engine/src/utils/request.ts#HttpMethod, core_engine/src/utils/request.ts#HttpRuntimeConfig, core_engine/src/utils/request.ts#LastRequestContext, core_engine/src/utils/request.ts#RequestBody, core_engine/src/utils/request.ts#RequestOptions, core_engine/src/utils/request.ts#RequestReplayMeta, core_engine/src/utils/request.ts#STRIP_HEADERS, core_engine/src/utils/request.ts#SnapshotConfig, core_engine/src/utils/request.ts#__ENV, core_engine/src/utils/request.ts#_capHitWarned, core_engine/src/utils/request.ts#_httpConfigCache, core_engine/src/utils/request.ts#_iterationRequestCount, core_engine/src/utils/request.ts#_lastRequestContext, core_engine/src/utils/request.ts#_reqIdByResponse, core_engine/src/utils/request.ts#_snapshotConfigCache, core_engine/src/utils/request.ts#_snapshotCount, core_engine/src/utils/request.ts#_snapshottedResponses, core_engine/src/utils/request.ts#applyErrorBehaviorForStatus, core_engine/src/utils/request.ts#captureRequestSnapshot, core_engine/src/utils/request.ts#captureSnapshotFromLastRequest, core_engine/src/utils/request.ts#emitDeferredFailureSnapshot, core_engine/src/utils/request.ts#emitSnapshotEvent, core_engine/src/utils/request.ts#getHttpRuntimeConfig, core_engine/src/utils/request.ts#getRequestIdForResponse, core_engine/src/utils/request.ts#getRuntimeErrorBehavior, core_engine/src/utils/request.ts#getSnapshotConfig, core_engine/src/utils/request.ts#nextRequestId, core_engine/src/utils/request.ts#recordRequestContextForSnapshot, core_engine/src/utils/request.ts#request, core_engine/src/utils/request.ts#sanitizeHeaders, core_engine/src/utils/request.ts#serializeBodyForLog, core_engine/src/utils/session.ts#ResolveFrameworkUrlOptions, core_engine/src/utils/session.ts#TeamEnvironmentOverride, core_engine/src/utils/session.ts#__ENV, core_engine/src/utils/session.ts#_primaryBaseUrl, core_engine/src/utils/session.ts#_registeredUrls, core_engine/src/utils/session.ts#clearCookies, core_engine/src/utils/session.ts#deleteCookie, core_engine/src/utils/session.ts#getApiKey, core_engine/src/utils/session.ts#getEnvContext, core_engine/src/utils/session.ts#getFrameworkBaseUrl, core_engine/src/utils/session.ts#getFrameworkServiceUrls, core_engine/src/utils/session.ts#isAbsoluteUrl, core_engine/src/utils/session.ts#joinBaseAndPath, core_engine/src/utils/session.ts#normalizeBaseUrl, core_engine/src/utils/session.ts#parseJsonEnv, core_engine/src/utils/session.ts#registerBaseUrl, core_engine/src/utils/session.ts#registerFrameworkEnvironmentUrls, core_engine/src/utils/session.ts#resolveFrameworkUrl, core_engine/src/utils/session.ts#resolvePath, core_engine/src/utils/transaction.ts#__ENV, core_engine/src/utils/transaction.ts#_activeTransaction, core_engine/src/utils/transaction.ts#_currentIterationFailed, core_engine/src/utils/transaction.ts#_uncheckedFailingResponses, core_engine/src/utils/transaction.ts#_vuTerminated, core_engine/src/utils/transaction.ts#endTransaction, core_engine/src/utils/transaction.ts#extractScriptLocation, core_engine/src/utils/transaction.ts#formatStackSnippet, core_engine/src/utils/transaction.ts#getCurrentTransaction, core_engine/src/utils/transaction.ts#getRuntimeErrorBehavior, core_engine/src/utils/transaction.ts#initTransactions, core_engine/src/utils/transaction.ts#isJsRuntimeError, core_engine/src/utils/transaction.ts#isVuTerminated, core_engine/src/utils/transaction.ts#k6Check, core_engine/src/utils/transaction.ts#recordFailingResponse, core_engine/src/utils/transaction.ts#startTransaction, core_engine/src/utils/transaction.ts#transaction, core_engine/src/utils/transaction.ts#txnCounters, core_engine/src/utils/transaction.ts#txnResults, core_engine/src/utils/transaction.ts#txnStarts, core_engine/src/utils/transaction.ts#txnTrends. |
| `CLAUDE.md` | repository | 26 | CLAUDE.md - - Front door: [FrameworkAtlas.md](FrameworkAtlas.md) — routes to every feature's owning files. |
| `config/correlation-rules/auto-correlation.defaults.json` | configuration | 22 | Framework file. Top-level keys: version, _meta, minValueLength, vocabulary, denyValues, thresholds. |
| `config/environments/dev.json` | configuration | 18 | Framework file. Top-level keys: $schema, name, testSuites. |
| `config/runtime_settings/default.json` | configuration | 57 | Runtime behavior profile controlling execution, errors, reporting, and diagnostics. Top-level keys: $schema, thinkTime, pacing, http, errorBehavior, reporting, errors, monitoring, debugMode. |
| `config/schemas/environment.schema.json` | configuration | 53 | JSON Schema contract used for validation and IDE assistance. Top-level keys: $schema, $id, title, description, type, required, additionalProperties, properties. |
| `config/schemas/runtime_settings.schema.json` | configuration | 263 | JSON Schema contract used for validation and IDE assistance. Top-level keys: $schema, $id, title, description, type, required, additionalProperties, properties. |
| `config/schemas/test_plan.schema.json` | configuration | 300 | JSON Schema contract used for validation and IDE assistance. Top-level keys: $schema, $id, title, description, type, required, additionalProperties, definitions, properties. |
| `config/test_plans/debug_test.json` | configuration | 38 | Executable test plan or reusable workload template. Top-level keys: name, environment, execution_mode, global_load_profile, noCookiesReset, debug, user_journeys. |
| `config/test_plans/load_test copy.json` | configuration | 63 | Executable test plan or reusable workload template. Top-level keys: $schema, name, environment, execution_mode, global_load_profile, noCookiesReset, user_journeys, global_sla, journey_slas, transaction_slas. |
| `config/test_plans/load_test.json` | configuration | 44 | Executable test plan or reusable workload template. Top-level keys: $schema, name, environment, execution_mode, global_load_profile, noCookiesReset, user_journeys, global_sla, journey_slas. |
| `config/test_plans/templates/constant_arrival_rate.json` | configuration | 25 | Executable test plan or reusable workload template. Top-level keys: name, environment, execution_mode, global_load_profile, user_journeys, global_sla. |
| `config/test_plans/templates/constant_vus.json` | configuration | 22 | Executable test plan or reusable workload template. Top-level keys: name, environment, execution_mode, global_load_profile, user_journeys, global_sla. |
| `config/test_plans/templates/externally_controlled.json` | configuration | 23 | Executable test plan or reusable workload template. Top-level keys: name, environment, execution_mode, global_load_profile, user_journeys, global_sla. |
| `config/test_plans/templates/per_vu_iterations.json` | configuration | 22 | Executable test plan or reusable workload template. Top-level keys: name, environment, execution_mode, global_load_profile, user_journeys, global_sla. |
| `config/test_plans/templates/ramping_arrival_rate.json` | configuration | 28 | Executable test plan or reusable workload template. Top-level keys: name, environment, execution_mode, global_load_profile, user_journeys, global_sla. |
| `config/test_plans/templates/ramping_vus.json` | configuration | 26 | Executable test plan or reusable workload template. Top-level keys: name, environment, execution_mode, global_load_profile, user_journeys, global_sla. |
| `config/test_plans/templates/shared_iterations.json` | configuration | 22 | Executable test plan or reusable workload template. Top-level keys: name, environment, execution_mode, global_load_profile, user_journeys, global_sla. |
| `config/test_plans/webui_load_test.json` | configuration | 49 | Executable test plan or reusable workload template. Top-level keys: $schema, name, environment, execution_mode, global_load_profile, noCookiesReset, debug, user_journeys, global_sla. |
| `core_engine/DOCS_METHODS.md` | repository | 550 | Core Engine Method Documentation - --- |
| `core_engine/src/assertions/JourneyAssertionResolver.ts` | assertions | 44 | JourneyAssertionResolver implementation. |
| `core_engine/src/assertions/SLARegistry.ts` | assertions | 26 | SLARegistry implementation. |
| `core_engine/src/assertions/ThresholdManager.ts` | assertions | 173 | ThresholdManager implementation. |
| `core_engine/src/cli/config-inspect.ts` | cli | 51 | inspectConfig helpers or command handlers. |
| `core_engine/src/cli/convert.ts` | cli | 69 | runConvert helpers or command handlers. |
| `core_engine/src/cli/correlate.ts` | cli | 243 | runCorrelate, resolveExchanges, loadRecordingLog, toRecordingExchanges helpers or command handlers. |
| `core_engine/src/cli/docs.ts` | cli | 78 | generateDocs helpers or command handlers. |
| `core_engine/src/cli/features.ts` | cli | 44 | listFeatures helpers or command handlers. |
| `core_engine/src/cli/generate-byos.ts` | cli | 82 | runGenerateByos helpers or command handlers. |
| `core_engine/src/cli/generate.ts` | cli | 151 | cq, runGenerate, promptForDomains, promptForStaticAssetPreference helpers or command handlers. |
| `core_engine/src/cli/import.ts` | cli | 489 | runImportCurl, runImportPostman, writeScriptFile, emitScript helpers or command handlers. |
| `core_engine/src/cli/init.ts` | cli | 414 | runInit, writeIfNotExists helpers or command handlers. |
| `core_engine/src/cli/interactive.ts` | cli | 873 | runInteractivePanel, showMenuAndPick, dispatch, wizardGenerate helpers or command handlers. |
| `core_engine/src/cli/LifecyclePrompt.ts` | cli | 82 | cq, promptForLifecycleSelection, parseSelections helpers or command handlers. |
| `core_engine/src/cli/new.ts` | cli | 65 | runNewWizard helpers or command handlers. |
| `core_engine/src/cli/run.ts` | cli | 2617 | bridgeEnvFile, resolveSharedRunIdFromEnv, runPlanDebugMode, runJourneyDebug helpers or command handlers. |
| `core_engine/src/cli/templates.ts` | cli | 59 | listTemplates, showTemplate helpers or command handlers. |
| `core_engine/src/cli/validate.ts` | cli | 95 | runValidate helpers or command handlers. |
| `core_engine/src/config/ConfigurationManager.ts` | config | 161 | ConfigurationManager implementation. |
| `core_engine/src/config/EnvResolver.ts` | config | 78 | EnvResolver implementation. |
| `core_engine/src/config/GatekeeperValidator.ts` | config | 359 | GatekeeperValidator implementation. |
| `core_engine/src/config/RuntimeConfigManager.ts` | config | 233 | RuntimeConfigManager implementation. |
| `core_engine/src/config/SchemaValidator.ts` | config | 330 | SchemaValidator implementation. |
| `core_engine/src/config/ScriptContractGuard.ts` | config | 255 | ScriptContractGuard implementation. |
| `core_engine/src/correlation/CandidateScorer.ts` | correlation | 222 | CandidateScorer implementation. |
| `core_engine/src/correlation/CorrelationEngine.ts` | correlation | 58 | CorrelationEngine implementation. |
| `core_engine/src/correlation/CorrelationManifest.ts` | correlation | 133 | CorrelationManifest implementation. |
| `core_engine/src/correlation/CorrelationScanner.ts` | correlation | 57 | CorrelationScanner implementation. |
| `core_engine/src/correlation/ExtractorRegistry.ts` | correlation | 92 | ExtractorRegistry implementation. |
| `core_engine/src/correlation/ExtractorSynthesizer.ts` | correlation | 189 | ExtractorSynthesizer implementation. |
| `core_engine/src/correlation/FallbackHandler.ts` | correlation | 21 | FallbackHandler implementation. |
| `core_engine/src/correlation/LinkMatcher.ts` | correlation | 89 | LinkMatcher implementation. |
| `core_engine/src/correlation/RuleProcessor.ts` | correlation | 33 | RuleProcessor implementation. |
| `core_engine/src/correlation/ScriptCorrelationWriter.ts` | correlation | 335 | ScriptCorrelationWriter implementation. |
| `core_engine/src/correlation/ValueIndexer.ts` | correlation | 311 | ValueIndexer implementation. |
| `core_engine/src/data/DataFactory.ts` | data | 140 | DataFactory implementation. |
| `core_engine/src/data/DataPoolManager.ts` | data | 131 | DataPoolManager implementation. |
| `core_engine/src/data/DataValidator.ts` | data | 145 | DataValidator implementation. |
| `core_engine/src/data/DynamicValueFactory.ts` | data | 95 | DynamicValueFactory implementation. |
| `core_engine/src/debug/DiffChecker.ts` | debug | 643 | DiffChecker implementation. |
| `core_engine/src/debug/ExchangeLog.ts` | debug | 207 | ExchangeLogBuilder implementation. |
| `core_engine/src/debug/HTMLDiffReporter.ts` | debug | 1971 | HTMLDiffReporter implementation. |
| `core_engine/src/debug/RecordingLogResolver.ts` | debug | 189 | RecordingLogResolver implementation. |
| `core_engine/src/debug/ReplayRunner.ts` | debug | 943 | ReplayRunner implementation. |
| `core_engine/src/debug/VariableInstrumenter.ts` | debug | 127 | instrumentVariableTracking, classify, sanitize helpers or command handlers. |
| `core_engine/src/distributed/agentServer.ts` | distributed | 171 | detectK6Version, freeDiskBytes, tokenMatches, buildInfo helpers or command handlers. |
| `core_engine/src/distributed/collectRun.ts` | distributed | 80 | runBaseDir, sharedRunDir, liveRunDir, copyDirInto helpers or command handlers. |
| `core_engine/src/distributed/control.ts` | distributed | 141 | ControlWatcher implementation. |
| `core_engine/src/distributed/liveAggregate.ts` | distributed | 194 | startControllerHostSampling, controllerHost, resolveLiveDir, resolveRunContext helpers or command handlers. |
| `core_engine/src/distributed/liveDashboard.ts` | distributed | 337 | page, startDashboardServer, runDashboardCli helpers or command handlers. |
| `core_engine/src/distributed/LiveStatusHeartbeat.ts` | distributed | 190 | LiveStatusHeartbeat implementation. |
| `core_engine/src/distributed/MergedReportBuilder.ts` | distributed | 282 | MergedReportBuilder implementation. |
| `core_engine/src/distributed/MergeEngine.ts` | distributed | 336 | MergeEngine implementation. |
| `core_engine/src/distributed/monitor.ts` | distributed | 120 | padR, padL, render, runMonitor helpers or command handlers. |
| `core_engine/src/distributed/probe.ts` | distributed | 243 | parseTarget, diagnose, probeOne, probeTcp helpers or command handlers. |
| `core_engine/src/distributed/runMerge.ts` | distributed | 306 | finalTimestamp, writeMergedCsv, readJson, readNdjson helpers or command handlers. |
| `core_engine/src/distributed/shareSetup.ts` | distributed | 52 | resolveResultsBaseDir, printControllerShareSuggestion helpers or command handlers. |
| `core_engine/src/distributed/startBarrier.ts` | distributed | 84 | fmtRemaining, awaitScheduledStart helpers or command handlers. |
| `core_engine/src/distributed/transactionCsv.ts` | distributed | 306 | leafFor, flatten, parseCsvLine, readTransactionCsvRaw helpers or command handlers. |
| `core_engine/src/engine.ts` | engine.ts | 111 | Framework file. |
| `core_engine/src/execution/FileWriteSink.ts` | execution | 123 | FileWriteSink implementation. |
| `core_engine/src/execution/HostMonitor.ts` | execution | 129 | HostMonitor implementation. |
| `core_engine/src/execution/JourneyAllocator.ts` | execution | 93 | JourneyAllocator implementation. |
| `core_engine/src/execution/ParallelExecutionManager.ts` | execution | 134 | ParallelExecutionManager implementation. |
| `core_engine/src/execution/PipelineRunner.ts` | execution | 333 | PipelineRunner implementation. |
| `core_engine/src/index.ts` | index.ts | 98 | Framework file. |
| `core_engine/src/recording/CurlAdapter.ts` | recording | 463 | CurlAdapter implementation. |
| `core_engine/src/recording/DomainFilter.ts` | recording | 48 | DomainFilter implementation. |
| `core_engine/src/recording/HARParser.ts` | recording | 91 | HARParser implementation. |
| `core_engine/src/recording/PostmanAdapter.ts` | recording | 951 | PostmanAdapter implementation. |
| `core_engine/src/recording/PostmanScriptTranslator.ts` | recording | 269 | translatePostmanScript, countOpeners, countClosers, translateLine helpers or command handlers. |
| `core_engine/src/recording/ScriptConverter.ts` | recording | 1208 | ScriptConverter implementation. |
| `core_engine/src/recording/ScriptGenerator.ts` | recording | 435 | ScriptGenerator implementation. |
| `core_engine/src/recording/TransactionGrouper.ts` | recording | 34 | TransactionGrouper implementation. |
| `core_engine/src/reporters/AzureReporter.ts` | reporters | 14 | AzureReporter implementation. |
| `core_engine/src/reporters/CustomUploader.ts` | reporters | 14 | CustomUploader implementation. |
| `core_engine/src/reporters/GrafanaReporter.ts` | reporters | 14 | GrafanaReporter implementation. |
| `core_engine/src/reporters/ResultTransformer.ts` | reporters | 23 | ResultTransformer implementation. |
| `core_engine/src/reporting/ArtifactWriter.ts` | reporting | 20 | ArtifactWriter implementation. |
| `core_engine/src/reporting/EventArtifactBuilder.ts` | reporting | 188 | EventArtifactBuilder implementation. |
| `core_engine/src/reporting/Histogram.ts` | reporting | 201 | RelativeHistogram implementation. |
| `core_engine/src/reporting/HistogramArtifactBuilder.ts` | reporting | 190 | HistogramArtifactBuilder implementation. |
| `core_engine/src/reporting/LiveEventLogWriter.ts` | reporting | 76 | LiveEventLogWriter implementation. |
| `core_engine/src/reporting/RequestMetricLogWriter.ts` | reporting | 323 | RequestMetricLogWriter implementation. |
| `core_engine/src/reporting/RunReportGenerator.ts` | reporting | 2750 | RunReportGenerator implementation. |
| `core_engine/src/reporting/RunSummaryBuilder.ts` | reporting | 128 | RunSummaryBuilder implementation. |
| `core_engine/src/reporting/TimeseriesArtifactBuilder.ts` | reporting | 255 | TimeseriesArtifactBuilder implementation. |
| `core_engine/src/reporting/TimeseriesStreamParser.ts` | reporting | 692 | TimeseriesStreamParser implementation. |
| `core_engine/src/reporting/TransactionMetricLogWriter.ts` | reporting | 285 | TransactionMetricLogWriter implementation. |
| `core_engine/src/reporting/TransactionMetricsBuilder.ts` | reporting | 392 | TransactionMetricsBuilder implementation. |
| `core_engine/src/runtime/ErrorRuntime.ts` | runtime | 79 | ErrorRuntime implementation. |
| `core_engine/src/runtime/LifecycleRuntime.ts` | runtime | 74 | LifecycleRuntime implementation. |
| `core_engine/src/runtime/MetricsRuntime.ts` | runtime | 30 | MetricsRuntime implementation. |
| `core_engine/src/runtime/SnapshotRuntime.ts` | runtime | 47 | SnapshotRuntime implementation. |
| `core_engine/src/runtime/TimeseriesRuntime.ts` | runtime | 133 | TimeseriesRuntime implementation. |
| `core_engine/src/scenario/ExecutorFactory.ts` | scenario | 91 | ExecutorFactory implementation. |
| `core_engine/src/scenario/ScenarioBuilder.ts` | scenario | 459 | ScenarioBuilder implementation. |
| `core_engine/src/scenario/TestPlanLoader.ts` | scenario | 54 | TestPlanLoader implementation. |
| `core_engine/src/scenario/WorkloadModels.ts` | scenario | 178 | buildLoadProfile, buildStressProfile, buildSoakProfile, buildSpikeProfile helpers or command handlers. |
| `core_engine/src/types/ConfigContracts.ts` | types | 187 | Framework file. |
| `core_engine/src/types/EventContracts.ts` | types | 103 | Framework file. |
| `core_engine/src/types/HARContracts.ts` | types | 46 | Framework file. |
| `core_engine/src/types/ReportingContracts.ts` | types | 199 | normalizeTransactionSeries helpers or command handlers. |
| `core_engine/src/types/TestPlanSchema.ts` | types | 215 | Framework file. |
| `core_engine/src/utils/autoHeaders.ts` | utils | 100 | addAutoHeader, addAutoHeaders, removeAutoHeader, clearAutoHeaders helpers or command handlers. |
| `core_engine/src/utils/dataWriter.ts` | utils | 65 | writeData helpers or command handlers. |
| `core_engine/src/utils/extract.ts` | utils | 247 | bodyString, asResultString, navigate, extractJson helpers or command handlers. |
| `core_engine/src/utils/lifecycle.ts` | utils | 583 | createTrackedProxy, createContext, createState, parseJsonEnv helpers or command handlers. |
| `core_engine/src/utils/LiveConsoleLogStream.ts` | utils | 132 | startLiveConsoleLogStream helpers or command handlers. |
| `core_engine/src/utils/logger.ts` | utils | 110 | Logger implementation. |
| `core_engine/src/utils/PathResolver.ts` | utils | 89 | PathResolver implementation. |
| `core_engine/src/utils/ProgressBar.ts` | utils | 86 | ProgressBar implementation. |
| `core_engine/src/utils/replayLogger.ts` | utils | 578 | resolveVariableSource, callerScriptLocation, trackCorrelation, trackParameter helpers or command handlers. |
| `core_engine/src/utils/request.ts` | utils | 593 | getRuntimeErrorBehavior, applyErrorBehaviorForStatus, nextRequestId, getSnapshotConfig helpers or command handlers. |
| `core_engine/src/utils/session.ts` | utils | 290 | getEnvContext, normalizeBaseUrl, isAbsoluteUrl, parseJsonEnv helpers or command handlers. |
| `core_engine/src/utils/transaction.ts` | utils | 567 | getRuntimeErrorBehavior, recordFailingResponse, extractScriptLocation, formatStackSnippet helpers or command handlers. |
| `docs/cli-reference.md` | documentation | 310 | CLI Reference - <!-- GENERATED by tools/gen-cli-reference.js — DO NOT EDIT. Regenerate: npm run docs:index --> |
| `docs/CODE_LEVEL_ROADMAP.md` | documentation | 397 | ️ Code-Level Learning Roadmap: K6-PerfFramework - > A structured, file-by-file learning path. Follow the phases in order — each builds on the previous one. |
| `docs/configuration-reference.md` | documentation | 103 | K6-PerfFramework Configuration Reference - *(Auto-generated from JSON Schemas)* |
| `docs/configuration.md` | documentation | 55 | Configuration Guide - > Task-oriented guide. Distilled from [EDD-config](../engineering_docs/edd/EDD-config.md) and the root |
| `docs/distributed-loadtest-runbook.md` | documentation | 215 | Distributed Load Test — Operator Runbook - Run **one** load test across several machines and get **one merged report**, watch it **live**, and |
| `docs/examples/README.md` | documentation | 29 | Examples - > Pointer page. The runnable examples in this repo are the team suites and the built-in templates. |
| `docs/faq.md` | documentation | 42 | FAQ - > Distilled from the engineering docs (`engineering_docs/`) and the root `README.md`. |
| `docs/getting-started.md` | documentation | 101 | Getting Started - > Derived from the root `README.md`. Assumes you've finished [Installation](installation.md). |
| `docs/index.md` | documentation | 32 | K6-PerfFramework Documentation - Published user documentation (Layer 3). For architecture/internals see `engineering_docs/` (L2); |
| `docs/installation.md` | documentation | 66 | Installation - > Derived from the root `README.md` (Prerequisites + First-Time Setup). |
| `docs/K6_PerfFramework_Technical_Reference.md` | documentation | 4765 | K6 Performance Framework Technical Reference - Generated: 2026-06-01T15:48:10.902Z |
| `docs/migration.md` | documentation | 61 | Migration: Existing k6 → Framework - > Derived from the recording/convert feature ([features/recording](../engineering_docs/features/recording.md)) and |
| `docs/onboarding/day-1.md` | documentation | 84 | Day 1: Zero to First Passing Run - > A guided checklist for a new engineer. Everything here uses only published docs. Tick each box. |
| `docs/onboarding/KT_Guide.md` | documentation | 243 | K6 Performance Framework: Comprehensive Deep-Dive Guide - > **Refreshed 2026-07-13** to match the current code. This guide is a file-by-file tour for a new |
| `docs/onboarding/KT_Low_Level_Deep_Dive.md` | documentation | 201 | K6 Performance Framework: Low-Level Engineering Deep Dive - > **Refreshed 2026-07-13** to match the current code. This is the mechanism-level companion to the |
| `docs/onboarding/KT_Presentation.md` | documentation | 132 | Presentation Outline: K6 Performance Framework - > **Refreshed 2026-07-13** to match the current code. Use this to frame a talk; for the code-cited |
| `docs/onboarding/mental-model.md` | documentation | 91 | Mental Model - > The concepts that make the rest of the framework obvious. Distilled from the engineering docs |
| `docs/onboarding/README.md` | documentation | 27 | Onboarding - New to the framework? Follow this path. It gets a new engineer from a clean machine to a first passing |
| `docs/presentation/architecture-deck.md` | documentation | 128 | K6-PerfFramework - <!-- GENERATED by tools/gen-presentation.js — DO NOT EDIT. Regenerate: npm run docs:index --> |
| `docs/release-notes.md` | documentation | 79 | Release Notes - > Distilled from `ai_context/todos.md` (completed work) and the frozen `archive/Framework-Change-Log.md`. |
| `docs/troubleshooting.md` | documentation | 33 | Troubleshooting - > Derived from the root `README.md` troubleshooting section plus the "Known limitations" of the |
| `engineering_docs/adr/0001-dx-simplification-proposals.md` | repository | 1121 | Design Proposals - > Approved architectural proposals awaiting implementation. |
| `engineering_docs/adr/0002-lifecycle-redesign.md` | repository | 223 | Lifecycle Redesign — Design Proposal - > **AI fast-path:** metadata is lines 1–10; the proposal body starts at **line 11** (`## 1. Problem & Objective`). Jump straight there. |
| `engineering_docs/adr/README.md` | repository | 23 | Architecture Decision Records - --- |
| `engineering_docs/distributed-loadtest-progress.md` | repository | 127 | Distributed Load Test — Build Progress Tracker - Living status of every feature in the distributed load-test capability. |
| `engineering_docs/edd/EDD-auto-correlation.md` | repository | 127 | EDD: Smart Auto-Correlation - --- |
| `engineering_docs/edd/EDD-config.md` | repository | 124 | EDD: Configuration Resolution - --- |
| `engineering_docs/edd/EDD-debug-replay.md` | repository | 127 | EDD: Debug Replay & Diff - --- |
| `engineering_docs/edd/EDD-distributed-loadtest.md` | repository | 300 | EDD: Distributed Load Test (Manual / Shared-Location) - --- |
| `engineering_docs/edd/EDD-lifecycle.md` | repository | 193 | EDD: VU Lifecycle & Phase Envelope - --- |
| `engineering_docs/edd/EDD-reporting.md` | repository | 126 | EDD: Artifact-First Reporting & Thresholds - --- |
| `engineering_docs/edd/README.md` | repository | 20 | Full Engineering Design Documents - --- |
| `engineering_docs/features/cli.md` | repository | 40 | CLI Command Surface (Mini-EDD) - --- |
| `engineering_docs/features/data.md` | repository | 39 | Test Data Management (Mini-EDD) - --- |
| `engineering_docs/features/execution.md` | repository | 40 | k6 Process Execution (Mini-EDD) - --- |
| `engineering_docs/features/legacy-correlation.md` | repository | 38 | Legacy Runtime Rule Engine (Mini-EDD) - --- |
| `engineering_docs/features/README.md` | repository | 15 | Mini-EDDs - --- |
| `engineering_docs/features/recording.md` | repository | 42 | Recording → Script Generation (Mini-EDD) - --- |
| `engineering_docs/features/reporters.md` | repository | 37 | External Reporters (Mini-EDD) — STUBS - --- |
| `engineering_docs/features/scenario.md` | repository | 39 | Scenario & Workload Modeling (Mini-EDD) - --- |
| `engineering_docs/features/vu-runtime.md` | repository | 40 | k6-side VU Runtime Helpers (Mini-EDD) - --- |
| `engineering_docs/README.md` | repository | 38 | Engineering Documentation (Layer 2) - --- |
| `engineering_docs/runtime/README.md` | repository | 15 | k6-side Runtime Model - --- |
| `engineering_docs/templates/adr.md` | repository | 28 | ADR-NNNN: <decision> - --- |
| `engineering_docs/templates/full-edd.md` | repository | 86 | EDD: <Subsystem> - --- |
| `engineering_docs/templates/mini-edd.md` | repository | 36 | <Feature> (Mini-EDD) - --- |
| `engineering_docs/testing/README.md` | repository | 25 | Testing Strategy & Inventory - --- |
| `FrameworkAtlas.md` | repository | 88 | Framework Atlas - --- |
| `graph.html` | repository | 993 | Framework file. |
| `improved-doc-architecture-prompt.md` | repository | 91 | ROLE - You are the Documentation Architect for this repository (K6-PerfFramework). |
| `k6log.log` | repository | 10927 | Framework file. |
| `package-lock.json` | repository | 903 | Framework file. Top-level keys: name, version, lockfileVersion, requires, packages. |
| `package.json` | repository | 82 | Framework file. Top-level keys: name, version, description, keywords, homepage, bugs, repository, license, author, type, main, types, bin, scripts, dependencies, devDependencies. |
| `README.md` | repository | 432 | K6 Performance Framework - A TypeScript-powered performance testing framework on top of Grafana k6. The framework helps teams organize k6 scripts into scrum-suite folders, generate scripts from HAR recordings, validate configuration before execution, run load/debug test plans, and produce structured reports for humans and CI. |
| `templates/runtime_settings/ci-pipeline.jsonc` | templates | 21 | Runtime behavior profile controlling execution, errors, reporting, and diagnostics. Top-level keys: $schema, _meta, thinkTime, pacing, http, errorBehavior, reporting, errors, monitoring, debugMode. |
| `templates/runtime_settings/local-debug.jsonc` | templates | 28 | Runtime behavior profile controlling execution, errors, reporting, and diagnostics. Top-level keys: $schema, _meta, thinkTime, pacing, http, errorBehavior, reporting, errors, monitoring, debugMode. |
| `templates/runtime_settings/max-throughput.jsonc` | templates | 21 | Runtime behavior profile controlling execution, errors, reporting, and diagnostics. Top-level keys: $schema, _meta, thinkTime, pacing, http, errorBehavior, reporting, errors, monitoring, debugMode. |
| `templates/runtime_settings/strict-sla.jsonc` | templates | 21 | Runtime behavior profile controlling execution, errors, reporting, and diagnostics. Top-level keys: $schema, _meta, thinkTime, pacing, http, errorBehavior, reporting, errors, monitoring, debugMode. |
| `templates/test_plans/breakpoint.jsonc` | templates | 26 | Executable test plan or reusable workload template. Top-level keys: $schema, _meta, name, environment, execution_mode, global_load_profile, user_journeys. |
| `templates/test_plans/load.jsonc` | templates | 32 | Executable test plan or reusable workload template. Top-level keys: $schema, _meta, name, environment, execution_mode, global_load_profile, user_journeys, global_sla. |
| `templates/test_plans/multi-spike.jsonc` | templates | 47 | Executable test plan or reusable workload template. Top-level keys: $schema, _meta, name, environment, execution_mode, global_load_profile, user_journeys, global_sla. |
| `templates/test_plans/smoke.jsonc` | templates | 23 | Executable test plan or reusable workload template. Top-level keys: $schema, _meta, name, environment, execution_mode, global_load_profile, user_journeys. |
| `templates/test_plans/soak.jsonc` | templates | 28 | Executable test plan or reusable workload template. Top-level keys: $schema, _meta, name, environment, execution_mode, global_load_profile, user_journeys. |
| `templates/test_plans/spike.jsonc` | templates | 30 | Executable test plan or reusable workload template. Top-level keys: $schema, _meta, name, environment, execution_mode, global_load_profile, user_journeys. |
| `templates/test_plans/step-up.jsonc` | templates | 42 | Executable test plan or reusable workload template. Top-level keys: $schema, _meta, name, environment, execution_mode, global_load_profile, user_journeys, global_sla. |
| `templates/test_plans/stress.jsonc` | templates | 31 | Executable test plan or reusable workload template. Top-level keys: $schema, _meta, name, environment, execution_mode, global_load_profile, user_journeys. |
| `testSuites/b2b_new/recordings/.recording-index.json` | test suite | 8 | Framework file. Contains a JSON array value. |
| `testSuites/b2b_new/recordings/raw_buyanimal_07may.recording-log.json` | test suite | 3596 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/b2b_new/tests/.k6-perf-entry-Run_2026_07_14T10_18_51_542Z.js` | test suite | 12 | handleSummary helpers or command handlers. |
| `testSuites/b2b_new/tests/byosCheck.js` | test suite | 50 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/b2b_new/tests/raw_buyanimal_07may.js` | test suite | 846 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/check/tests/check_curl_paste.js` | test suite | 56 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/Jpet_new/data/pet.csv` | test suite | 5 | CSV data file with 3 data rows. Columns: p_pet. |
| `testSuites/Jpet_new/data/userdetails.csv` | test suite | 2 | CSV data file with 1 data rows. Columns: p_username,p_password. |
| `testSuites/Jpet_new/recordings/.recording-index.json` | test suite | 32 | Framework file. Contains a JSON array value. |
| `testSuites/Jpet_new/recordings/buy_animals.js` | test suite | 589 | getUniqueItem helpers or command handlers. |
| `testSuites/Jpet_new/recordings/buyanimal_raw_19thmay.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/Jpet_new/recordings/buyanimal_raw_20thmay.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/Jpet_new/recordings/buyanimal_raw_25thmay.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/Jpet_new/recordings/buyanimal_raw_28thmay.correlation.json` | test suite | 250 | Framework file. Top-level keys: version, generatedAt, source, candidates. |
| `testSuites/Jpet_new/recordings/buyanimal_raw_28thmay.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/Jpet_new/recordings/buydog_jpetstore.aspectran.com - 2026-06-08.har` | test suite | 11529 | Recorded HTTP archive used for script generation and replay comparison. Top-level keys: log. |
| `testSuites/Jpet_new/recordings/raw_buyanimal_07thMay.recording-log.json` | test suite | 3596 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/Jpet_new/tests/.7wcytf__tmp-k6studio__.js` | test suite | 548 | instrumentParams, isTestingLibrary, createSequence, trackLog helpers or command handlers. |
| `testSuites/Jpet_new/tests/.k6-perf-entry-Run_2026-05-19T17-53-34-465Z.js` | test suite | 2 | Framework file. |
| `testSuites/Jpet_new/tests/.k6-perf-entry-Run_2026-05-19T18-05-21-349Z.js` | test suite | 11 | handleSummary helpers or command handlers. |
| `testSuites/Jpet_new/tests/.k6-perf-entry-Run_2026-05-21T04-30-21-486Z.js` | test suite | 12 | handleSummary helpers or command handlers. |
| `testSuites/Jpet_new/tests/.k6-perf-entry-Run_20260702050900.js` | test suite | 12 | handleSummary helpers or command handlers. |
| `testSuites/Jpet_new/tests/buy_animal_1stJune_converted.js` | test suite | 588 | getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/Jpet_new/tests/buy_animal_autotrack_convert.js` | test suite | 582 | getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/Jpet_new/tests/buy_animals_working.js` | test suite | 601 | getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/Jpet_new/tests/buy_working_covert.js` | test suite | 585 | getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/Jpet_new/tests/buyanimal_converted_20thmay.js` | test suite | 569 | getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/Jpet_new/tests/buyanimal_converted_25thmay.js` | test suite | 572 | getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/Jpet_new/tests/buyanimal_converted_26thmay.js` | test suite | 566 | getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/Jpet_new/tests/buyanimal_correlated.js` | test suite | 866 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/Jpet_new/tests/buyanimal_raw_28thmay.js` | test suite | 855 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/Jpet_new/tests/curl.js` | test suite | 56 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/Jpet_new/tests/raw_buyanimal_07thMay.js` | test suite | 846 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/Jpet_new/tests/test_byos.js` | test suite | 50 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/jpet_team/data/pet.csv` | test suite | 5 | CSV data file with 3 data rows. Columns: p_pet. |
| `testSuites/jpet_team/data/userdetails.csv` | test suite | 2 | CSV data file with 1 data rows. Columns: p_username,p_password. |
| `testSuites/jpet_team/recordings/.recording-index.json` | test suite | 26 | Framework file. Contains a JSON array value. |
| `testSuites/jpet_team/recordings/buyanimal_raw.recording-log.json` | test suite | 4018 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/jpet_team/recordings/jpet-login-test.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/jpet_team/recordings/jpetstore.aspectran.com - login logout.har` | test suite | 7471 | Recorded HTTP archive used for script generation and replay comparison. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/jpet_team/recordings/jpetstore.aspectran.com_animals.har` | test suite | 11745 | Recorded HTTP archive used for script generation and replay comparison. Top-level keys: log. |
| `testSuites/jpet_team/recordings/jpetstore.aspectran.com_buydog_1.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/jpet_team/recordings/jpetstore.aspectran.com_buydog.har` | test suite | 11745 | Recorded HTTP archive used for script generation and replay comparison. Top-level keys: log. |
| `testSuites/jpet_team/recordings/jpetstore.aspectran.com_buydog.recording-log.correlation.json` | test suite | 250 | Framework file. Top-level keys: version, generatedAt, source, candidates. |
| `testSuites/jpet_team/recordings/jpetstore.aspectran.com_buydog.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/jpet_team/tests/buy_animals_working.js` | test suite | 586 | getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/jpet_team/tests/buyanimal_1_framework_lifecycle_copy.js` | test suite | 898 | getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/jpet_team/tests/buyanimal_1_framework_lifecycle.js` | test suite | 898 | getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/jpet_team/tests/buyanimal_1.js` | test suite | 872 | getUniqueItem helpers or command handlers. |
| `testSuites/jpet_team/tests/buyanimal_n.js` | test suite | 872 | getUniqueItem helpers or command handlers. |
| `testSuites/jpet_team/tests/buyanimal_new.js` | test suite | 853 | getUniqueItem helpers or command handlers. |
| `testSuites/jpet_team/tests/buyanimal_raw.js` | test suite | 1359 | Framework file. |
| `testSuites/jpet_team/tests/buyanimal.js` | test suite | 959 | getUniqueItem helpers or command handlers. |
| `testSuites/jpet_team/tests/jpet-login-test.js` | test suite | 1854 | Framework file. |
| `testSuites/jpet_team/tests/jpetstore.aspectran.com_buydog_1.js` | test suite | 1216 | Framework file. |
| `testSuites/jpet_team/tests/jpetstore.aspectran.com_buydog.js` | test suite | 1854 | Framework file. |
| `testSuites/my_team/tests/test-lifecycle-byos.js` | test suite | 42 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/data/p_users.csv` | test suite | 5 | CSV data file with 3 data rows. Columns: p_username,p_password,p_email. |
| `testSuites/sample_team/recordings/browse-journey.recording-log.json` | test suite | 26 | Framework file. Contains a JSON array value. |
| `testSuites/sample_team/recordings/dummy_postman.json` | test suite | 219 | Framework file. Top-level keys: info, item, variable. |
| `testSuites/sample_team/recordings/Enterprise Dummy APIs.postman_collection.json` | test suite | 366 | Framework file. Top-level keys: info, item, variable. |
| `testSuites/sample_team/tests/Auth_Login.js` | test suite | 62 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/browse-journey.js` | test suite | 42 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/checkorder_script.js` | test suite | 55 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/checkorder_script1.js` | test suite | 55 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/checkout-journey.js` | test suite | 58 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/my_journey.js` | test suite | 72 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/my_login_script.js` | test suite | 41 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/New_Folder_Login_Copy.js` | test suite | 62 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/new_postman_check.js` | test suite | 159 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/postman_journey.js` | test suite | 118 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/smart_postman.js` | test suite | 151 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/smoke_bash.js` | test suite | 56 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/smoke_cmd.js` | test suite | 42 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/smoke_convert.js` | test suite | 58 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/smoke_journey.js` | test suite | 72 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/smoke_login.js` | test suite | 43 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/smoke_postman_auth_only.js` | test suite | 54 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/smoke_postman.js` | test suite | 86 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/smoke_stdin.js` | test suite | 44 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/test_postman.js` | test suite | 156 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/testpro/recordings/.recording-index.json` | test suite | 44 | Framework file. Contains a JSON array value. |
| `testSuites/testpro/recordings/buy.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/testpro/recordings/checkhar.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/testpro/recordings/jpetstore.aspectran.com_animals.har` | test suite | 11745 | Recorded HTTP archive used for script generation and replay comparison. Top-level keys: log. |
| `testSuites/testpro/recordings/tes.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/testpro/recordings/testcheckhar.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/testpro/recordings/testhar_!.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/testpro/recordings/testharcheck_1.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/testpro/recordings/testt.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/testpro/tests/Auth_Login.js` | test suite | 62 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/testpro/tests/buy.js` | test suite | 855 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/testpro/tests/checkhar.js` | test suite | 855 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/testpro/tests/checkout_check.js` | test suite | 99 | Framework file. |
| `testSuites/testpro/tests/converted-checkout.js` | test suite | 120 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/testpro/tests/converter_check.js` | test suite | 155 | Framework file. |
| `testSuites/testpro/tests/New_Folder_Login_Copy.js` | test suite | 62 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/testpro/tests/tes.js` | test suite | 855 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/testpro/tests/testcheckhar.js` | test suite | 855 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/testpro/tests/testhar_!.js` | test suite | 855 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/testpro/tests/testharcheck_1.js` | test suite | 855 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/testpro/tests/testt.js` | test suite | 855 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/webui_team/HowTo-WebUI-Test.md` | test suite | 139 | How-To: Web UI Performance Test (Server-Side) - This guide walks you through the sample **Web UI performance test** included in the framework. It simulates real user behavior on a web application using **server-side HTTP requests only** (no browser rendering). |
| `testSuites/webui_team/tests/homepage-journey.js` | test suite | 69 | Framework file. |
| `testSuites/webui_team/tests/login-journey.js` | test suite | 84 | Framework file. |
| `tools/docs-index.js` | repository | 64 | run, loadJson, splice, spliceAtlas helpers or command handlers. |
| `tools/gen-cli-reference.js` | repository | 115 | findSubParents, parseOptions, generate helpers or command handlers. |
| `tools/gen-config-index.js` | repository | 82 | loadJson, flattenSchema, generate helpers or command handlers. |
| `tools/gen-feature-index.js` | repository | 70 | loadJson, generate helpers or command handlers. |
| `tools/gen-indexes.js` | repository | 78 | generate, layerOf, dedupeEdges helpers or command handlers. |
| `tools/gen-presentation.js` | repository | 131 | loadJson, layerOfPath, generate helpers or command handlers. |
| `tools/gen-search-index.js` | repository | 38 | frontMatter, generate helpers or command handlers. |
| `tools/generate-technical-reference.js` | repository | 628 | walk, rel, read, countLines helpers or command handlers. |
| `tools/lib/ast.js` | repository | 188 | norm, rel, read, walk helpers or command handlers. |
| `tools/merge-validation.test.ts` | repository | 164 | assert, within, genTxn, buildHistogram helpers or command handlers. |
| `tools/validate-histogram.test.ts` | repository | 110 | mostRecentRunDir, statFraction helpers or command handlers. |
| `tsconfig.json` | repository | 25 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |

## Detailed Source Reference

### core_engine/src/assertions/JourneyAssertionResolver.ts

Layer: assertions  
Lines: 44  
Purpose: JourneyAssertionResolver implementation.

Imports:
- `import { Logger } from '../utils/logger';`

Exports: `JourneyAssertionResolver`

#### Class: JourneyAssertionResolver

Line: 3  
Description: Evaluates the k6 end-of-test summary statistics and prints a human-readable pass/fail report based on journey-level SLAs.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `printReport` | `static printReport(k6Data: any): void` | k6Data: any | void | 8 | Evaluates the k6 end-of-test summary statistics and prints a human-readable pass/fail report based on journey-level SLAs. |


### core_engine/src/assertions/SLARegistry.ts

Layer: assertions  
Lines: 26  
Purpose: SLARegistry implementation.

Imports:
- `import { SLADefinition } from '../types/TestPlanSchema';`

Exports: `SLARegistry`

#### Class: SLARegistry

Line: 3  
Description: Register an SLA for a specific execution scenario or transaction. Use the transaction name directly (no prefix needed).

| Property | Type | Line | Description |
|---|---|---:|---|
| `registry` | Map<string, SLADefinition> | 4 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `register` | `static register(targetName: string, config: SLADefinition): void` | targetName: string, config: SLADefinition | void | 10 | Register an SLA for a specific execution scenario or transaction. Use the transaction name directly (no prefix needed). |
| `get` | `static get(targetName: string): SLADefinition \| undefined` | targetName: string | SLADefinition \| undefined | 14 | Implements the get  method. |
| `getAll` | `static getAll(): Record<string, SLADefinition>` | None | Record<string, SLADefinition> | 18 | Implements the get all method. |


### core_engine/src/assertions/ThresholdManager.ts

Layer: assertions  
Lines: 173  
Purpose: ThresholdManager implementation.

Imports:
- `import { GlobalSLADefinition, SLADefinition, TestPlan } from '../types/TestPlanSchema';`

Exports: `ThresholdManager`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `PERCENTILE_KEY_RE` | Inferred | 4 | Matches SLA keys like p90, p95, p99, p99.9, p50 etc. |

#### Class: ThresholdManager

Line: 6  
Description: Translates SLA definitions from the test plan into k6-native thresholds. Scope + precedence (most specific wins, per individual percentile/errorRate): • REQUEST-level journey_slas[j] > global_sla.request > legacy flat global_sla → http_req_duration[{scenario:j}] / http_req_failed[...] • TRANSACTION-level transaction_slas[t] > global_sla.transaction → <txn> Trend / <txn>_checkrate, applied to EVERY transaction. `journeyTransactionNames` (journey → transaction names, extracted from the scripts) is required for the global_sla.transaction default to reach every transaction; without it only explicitly-named transaction_slas get thresholds.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `apply` | `static apply( testPlan: TestPlan, journeyTransactionNames?: Record<string, string[]>, ): Record<string, string[]>` | testPlan: TestPlan, journeyTransactionNames?: Record<string, string[]> | Record<string, string[]> | 20 | Translates SLA definitions from the test plan into k6-native thresholds. Scope + precedence (most specific wins, per individual percentile/errorRate): • REQUEST-level journey_slas[j] > global_sla.request > legacy flat global_sla → http_req_duration[{scenario:j}] / http_req_failed[...] • TRANSACTION-level transaction_slas[t] > global_sla.transaction → <txn> Trend / <txn>_checkrate, applied to EVERY transaction. `journeyTransactionNames` (journey → transaction names, extracted from the scripts) is required for the global_sla.transaction default to reach every transaction; without it only explicitly-named transaction_slas get thresholds. |
| `flatGlobalKeys` | `private static flatGlobalKeys(global: GlobalSLADefinition): SLADefinition` | global: GlobalSLADefinition | SLADefinition | 98 | Flat (non-nested) keys of a global SLA — the legacy request-level shorthand. |
| `mergeSla` | `private static mergeSla(base?: SLADefinition, override?: SLADefinition): SLADefinition` | base?: SLADefinition, override?: SLADefinition | SLADefinition | 108 | Merge two SLA definitions; `override` keys win over `base` keys, per key. |
| `buildDurationRules` | `private static buildDurationRules(sla: SLADefinition): string[]` | sla: SLADefinition | string[] | 123 | Build k6 duration threshold rules from an SLA definition. Dynamically handles any percentile key (p50, p75, p90, p95, p99, p99.9, etc.). |
| `collectPercentiles` | `static collectPercentiles(testPlan: TestPlan): string[]` | testPlan: TestPlan | string[] | 145 | Collect all percentile values referenced across all SLA definitions in the plan. Returns k6-format percentile strings like 'p(90)', 'p(99)', 'p(99.9)'. |


### core_engine/src/cli/config-inspect.ts

Layer: cli  
Lines: 51  
Purpose: inspectConfig helpers or command handlers.

Imports:
- `import { ConfigurationManager } from '../config/ConfigurationManager';`
- `import { TestPlanLoader } from '../scenario/TestPlanLoader';`
- `import * as path from 'path';`

Exports: `inspectConfig`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `inspectConfig` | `export function inspectConfig(planPath: string, envConfigPath?: string, runtimeSettingsPath?: string, envFilePath?: string)` | planPath: string, envConfigPath?: string, runtimeSettingsPath?: string, envFilePath?: string | Inferred | 10 | Implements the inspect config function. It emits operator-facing output. |


### core_engine/src/cli/convert.ts

Layer: cli  
Lines: 69  
Purpose: runConvert helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { Interface, createInterface } from 'node:readline/promises';`
- `import { stdin as input, stdout as output } from 'node:process';`
- `import { ScriptConverter } from '../recording/ScriptConverter';`
- `import { LifecycleSelection } from '../recording/ScriptGenerator';`
- `import { Logger } from '../utils/logger';`
- `import { promptForLifecycleSelection } from './LifecyclePrompt';`

Exports: `runConvert`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `runConvert` | `export async function runConvert( inputPath: string, teamName: string, scriptName: string, options:` | inputPath: string, teamName: string, scriptName: string, options: { inPlace?: boolean; externalRl?: Interface } | Promise<void> | 15 | CLI handler for `convert` command. Converts a conventional k6 script into a framework-compatible script with logExchange calls, request definition objects, and transaction wrappers. |


### core_engine/src/cli/correlate.ts

Layer: cli  
Lines: 243  
Purpose: runCorrelate, resolveExchanges, loadRecordingLog, toRecordingExchanges helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { HARParser } from '../recording/HARParser';`
- `import { ExchangeLogBuilder } from '../debug/ExchangeLog';`
- `import { RecordingLogResolver } from '../debug/RecordingLogResolver';`
- `import { CorrelationScanner } from '../correlation/CorrelationScanner';`
- `import { ScriptCorrelationWriter } from '../correlation/ScriptCorrelationWriter';`
- `import {
 CorrelationManifest,
 CorrelationPlan,
 CorrelationCandidate,
 CorrelationConfidence,
 RecordingExchange,
} from '../correlation/CorrelationManifest';`
- `import { Logger, ansi } from '../utils/logger';`

Exports: `CorrelateOptions`, `runCorrelate`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `CorrelateOptions` | Interface | 17 | Defines the CorrelateOptions contract used by the framework. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `runCorrelate` | `export async function runCorrelate(options: CorrelateOptions): Promise<void>` | options: CorrelateOptions | Promise<void> | 38 | Standalone auto-correlation. Two modes: • list (default) — scan a recording, print suspected dynamic values, write a manifest • apply <level> — rewrite a generated script to capture-and-substitute the values Input source priority: --manifest (pre-scanned) > --log > --har > recording log auto-resolved from --script. The recording-log.json is recommended for --apply because its request IDs align with the generated script. |
| `resolveExchanges` | `function resolveExchanges( options: CorrelateOptions, ):` | options: CorrelateOptions | { exchanges: RecordingExchange[]; source: string } \| null | 125 | Implements the resolve exchanges function. It performs file-system work, emits operator-facing output. |
| `loadRecordingLog` | `function loadRecordingLog(logPath: string): RecordingExchange[]` | logPath: string | RecordingExchange[] | 173 | Implements the load recording log function. It performs file-system work, parses structured configuration or artifact data. |
| `toRecordingExchanges` | `function toRecordingExchanges(raw: unknown[]): RecordingExchange[]` | raw: unknown[] | RecordingExchange[] | 187 | Normalize raw recording entries (recording-log.json or ExchangeLogBuilder output) into RecordingExchange[]. The on-disk/builder shape names the request identifier `harEntryId`; the scanner and script writer key on `id` (mirroring the generator's `replay.id`), so map it across here. |
| `defaultManifestPath` | `function defaultManifestPath(options: CorrelateOptions, source: string): string` | options: CorrelateOptions, source: string | string | 199 | Implements the default manifest path function. |
| `resolveApplyLevels` | `function resolveApplyLevels(level?: string): Set<CorrelationConfidence>` | level?: string | Set<CorrelationConfidence> | 205 | Implements the resolve apply levels function. |
| `printCandidateTable` | `function printCandidateTable(plan: CorrelationPlan): void` | plan: CorrelationPlan | void | 220 | Implements the print candidate table function. It emits operator-facing output. |
| `truncate` | `function truncate(s: string, n: number): string` | s: string, n: number | string | 240 | Implements the truncate function. |


### core_engine/src/cli/docs.ts

Layer: cli  
Lines: 78  
Purpose: generateDocs helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`

Exports: `generateDocs`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `generateDocs` | `export function generateDocs()` | None | Inferred | 9 | Implements the generate docs function. It performs file-system work, parses structured configuration or artifact data, enforces validation rules, emits operator-facing output. |


### core_engine/src/cli/features.ts

Layer: cli  
Lines: 44  
Purpose: listFeatures helpers or command handlers.

Exports: `listFeatures`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `listFeatures` | `export function listFeatures()` | None | Inferred | 6 | features.ts Phase 5 – Framework Features Discovery |


### core_engine/src/cli/generate-byos.ts

Layer: cli  
Lines: 82  
Purpose: runGenerateByos helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { SCRIPT_API_MODULE } from '../recording/ScriptGenerator';`

Exports: `runGenerateByos`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `runGenerateByos` | `export function runGenerateByos( teamName: string, scriptName: string, opts:` | teamName: string, scriptName: string, opts: { overwrite?: boolean } = {} | void | 10 | Implements the run generate byos function. It performs file-system work, orchestrates process execution, emits operator-facing output. |


### core_engine/src/cli/generate.ts

Layer: cli  
Lines: 151  
Purpose: cq, runGenerate, promptForDomains, promptForStaticAssetPreference helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { Interface, createInterface } from 'node:readline/promises';`
- `import { stdin as input, stdout as output } from 'node:process';`
- `import { HARParser } from '../recording/HARParser';`
- `import { DomainFilter } from '../recording/DomainFilter';`
- `import { TransactionGrouper } from '../recording/TransactionGrouper';`
- `import { LifecycleSelection, ScriptGenerator } from '../recording/ScriptGenerator';`
- `import { ExchangeLogBuilder } from '../debug/ExchangeLog';`
- `import { RecordingLogResolver } from '../debug/RecordingLogResolver';`
- `import { promptForLifecycleSelection } from './LifecyclePrompt';`
- `import { ansi } from '../utils/logger';`

Exports: `runGenerate`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `cq` | `function cq(text: string): string` | text: string | string | 15 | Wrap a prompt string in the framework's prompt color (cyan). |
| `runGenerate` | `export async function runGenerate( harPath: string, teamName: string, outName: string, externalRl?: Interface, ): Promise<void>` | harPath: string, teamName: string, outName: string, externalRl?: Interface | Promise<void> | 19 | Implements the run generate function. It performs file-system work, orchestrates process execution, emits operator-facing output. |
| `promptForDomains` | `async function promptForDomains( rl: Interface, domainStats: Array<` | rl: Interface, domainStats: Array<{ host: string; count: number }> | Promise<string[]> | 89 | Implements the prompt for domains function. It emits operator-facing output. |
| `promptForStaticAssetPreference` | `async function promptForStaticAssetPreference(rl: Interface): Promise<boolean>` | rl: Interface | Promise<boolean> | 143 | Implements the prompt for static asset preference function. |


### core_engine/src/cli/import.ts

Layer: cli  
Lines: 489  
Purpose: runImportCurl, runImportPostman, writeScriptFile, emitScript helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { CurlAdapter, ParsedCurlBlock } from '../recording/CurlAdapter';`
- `import { PostmanAdapter } from '../recording/PostmanAdapter';`
- `import { ScriptGenerator } from '../recording/ScriptGenerator';`
- `import { TransactionGroup } from '../recording/TransactionGrouper';`

Exports: `ConflictPolicy`, `ImportCurlOptions`, `ImportPostmanOptions`, `runImportCurl`, `runImportPostman`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `ConflictPolicy` | TypeAlias | 26 | What to do when a target script file already exists: - 'error' : print an error and exit (default; CLI behavior). - 'overwrite' : replace the existing file. - 'skip' : leave the existing file untouched (used for per-request splits where only some names collide). |
| `ImportCurlOptions` | Interface | 28 | Inline curl string (shell-quoting required). Mutually exclusive with other sources. |
| `ImportPostmanOptions` | Interface | 43 | Path to a Postman v2.1 collection JSON file. Required. |
| `EmitScriptExtras` | Interface | 203 | Optional module-scope code (e.g. file `open()` bindings). |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `runImportCurl` | `export async function runImportCurl( team: string, scriptName: string, opts: ImportCurlOptions, ): Promise<void>` | team: string, scriptName: string, opts: ImportCurlOptions | Promise<void> | 62 | Implements the run import curl function. It emits operator-facing output. |
| `runImportPostman` | `export async function runImportPostman( team: string, scriptName: string, opts: ImportPostmanOptions, ): Promise<void>` | team: string, scriptName: string, opts: ImportPostmanOptions | Promise<void> | 153 | Implements the run import postman function. It performs file-system work, emits operator-facing output. |
| `writeScriptFile` | `function writeScriptFile( team: string, scriptName: string, groups: TransactionGroup[], extras: EmitScriptExtras =` | team: string, scriptName: string, groups: TransactionGroup[], extras: EmitScriptExtras = {} | string \| null | 227 | Generate the script content for `groups` and write it to testSuites/<team>/tests/<scriptName>.js. Returns the absolute path written, or null when the file already existed and the conflict policy is 'skip'. With the default 'error' policy an existing file prints an error and exits; 'overwrite' replaces it. Performs no success logging — callers own messaging. |
| `emitScript` | `function emitScript( team: string, scriptName: string, groups: TransactionGroup[], warnings: string[], requestCount: number, extras: EmitScriptExtras =` | team: string, scriptName: string, groups: TransactionGroup[], warnings: string[], requestCount: number, extras: EmitScriptExtras = {} | void | 263 | Implements the emit script function. It emits operator-facing output. |
| `emitScriptsPerRequest` | `function emitScriptsPerRequest( team: string, baseName: string, groups: TransactionGroup[], warnings: string[], extras: EmitScriptExtras =` | team: string, baseName: string, groups: TransactionGroup[], warnings: string[], extras: EmitScriptExtras = {} | void | 294 | Emit one script per individual request (API). Each script holds a single transaction with one request. Filenames are `<folder>_<request>`, using only as many trailing folder segments as needed to stay unique within this run (see {@link buildSplitName}). |
| `buildSplitName` | `function buildSplitName( folderSegs: string[], requestName: string, used: Set<string>, baseName: string, ): string` | folderSegs: string[], requestName: string, used: Set<string>, baseName: string | string | 367 | Build a collision-safe filename for a per-request split script. Starts from `<immediateParentFolder>_<request>` and walks up the folder path one segment at a time until the name is unique, falling back to a numeric suffix. |
| `sanitizeFileStem` | `function sanitizeFileStem(s: string): string` | s: string | string | 393 | Implements the sanitize file stem function. |
| `printCopiedFiles` | `function printCopiedFiles(copiedFiles: EmitScriptExtras['copiedFiles']): void` | copiedFiles: EmitScriptExtras['copiedFiles'] | void | 397 | Implements the print copied files function. It emits operator-facing output. |
| `printWarnings` | `function printWarnings(warnings: string[]): void` | warnings: string[] | void | 405 | Implements the print warnings function. It emits operator-facing output. |
| `printNextSteps` | `function printNextSteps(): void` | None | void | 413 | Implements the print next steps function. It orchestrates process execution, enforces validation rules, emits operator-facing output. |
| `readFromFile` | `function readFromFile(filePath: string): ParsedCurlBlock[]` | filePath: string | ParsedCurlBlock[] | 420 | Implements the read from file function. It performs file-system work, emits operator-facing output. |
| `readStdin` | `async function readStdin(): Promise<string>` | None | Promise<string> | 435 | Read all of stdin until EOF and return as UTF-8 string. Use with pipes or redirects (`cmd \| npm run import:curl … --stdin`, `npm run import:curl … --stdin < file.curl`). |
| `readClipboard` | `function readClipboard(): string` | None | string | 459 | Read text from the OS clipboard by shelling out to the platform-native command. No external npm dependency required. - Windows : `powershell -NoProfile -Command Get-Clipboard -Raw` - macOS : `pbpaste` - Linux : `xclip -selection clipboard -o`, falling back to `xsel` Returns empty string on failure (caller handles the empty-input case). |


### core_engine/src/cli/init.ts

Layer: cli  
Lines: 414  
Purpose: runInit, writeIfNotExists helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { SCRIPT_API_MODULE } from '../recording/ScriptGenerator';`

Exports: `runInit`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `runInit` | `export function runInit(projectDir: string = process.cwd()): void` | projectDir: string = process.cwd() | void | 11 | Implements the run init function. It performs file-system work, orchestrates process execution, enforces validation rules, emits operator-facing output. |
| `writeIfNotExists` | `function writeIfNotExists(filePath: string, content: string, label: string): void` | filePath: string, content: string, label: string | void | 406 | Implements the write if not exists function. It performs file-system work, emits operator-facing output. |


### core_engine/src/cli/interactive.ts

Layer: cli  
Lines: 873  
Purpose: runInteractivePanel, showMenuAndPick, dispatch, wizardGenerate helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { Interface, createInterface } from 'node:readline/promises';`
- `import { stdin as input, stdout as output } from 'node:process';`
- `import { Logger, ansi } from '../utils/logger';`
- `import { runInit } from './init';`
- `import { runGenerate } from './generate';`
- `import { runConvert } from './convert';`
- `import { runGenerateByos } from './generate-byos';`
- `import { runImportCurl, runImportPostman } from './import';`
- `import { runValidate } from './validate';`
- `import { PostmanAdapter } from '../recording/PostmanAdapter';`

Exports: `runInteractivePanel`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `MenuChoice` | TypeAlias | 112 | Defines the MenuChoice contract used by the framework. |
| `MenuItem` | Interface | 124 | Defines the MenuItem contract used by the framework. |
| `OptionChoice` | Interface | 827 | Defines the OptionChoice contract used by the framework. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `MENU_GROUPS` | Array<{ heading: string; items: MenuItem[] }> | 130 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `runInteractivePanel` | `export async function runInteractivePanel(): Promise<void>` | None | Promise<void> | 46 | Launch the interactive command panel. Returns when the user picks "Exit" or sends EOF (Ctrl+D). All input/output via process.stdin/stdout. Caller (in run.ts) should only invoke this when both stdin AND stdout are TTYs — non-TTY contexts (CI, piped invocations) should fall through to the existing help output so we never block scripted runs. |
| `showMenuAndPick` | `async function showMenuAndPick(rl: Interface): Promise<MenuChoice>` | rl: Interface | Promise<MenuChoice> | 157 | Implements the show menu and pick function. It orchestrates process execution, emits operator-facing output. |
| `dispatch` | `async function dispatch(choice: MenuChoice, rl: Interface): Promise<void>` | choice: MenuChoice, rl: Interface | Promise<void> | 183 | Implements the dispatch function. It enforces validation rules. |
| `wizardGenerate` | `async function wizardGenerate(rl: Interface): Promise<void>` | rl: Interface | Promise<void> | 203 | Implements the wizard generate function. It emits operator-facing output. |
| `wizardConvert` | `async function wizardConvert(rl: Interface): Promise<void>` | rl: Interface | Promise<void> | 217 | Implements the wizard convert function. It orchestrates process execution, emits operator-facing output. |
| `teamFromPath` | `function teamFromPath(filePath: string): string \| null` | filePath: string | string \| null | 274 | Derive the team name from a path under testSuites/<team>/… . Mirrors the regex ScriptConverter uses so an in-place conversion embeds the same team context the file already lives in. Returns null when the path isn't inside a testSuites/<team>/ folder (e.g. an external script). |
| `wizardByos` | `async function wizardByos(rl: Interface): Promise<void>` | rl: Interface | Promise<void> | 279 | Implements the wizard byos function. It emits operator-facing output. |
| `wizardImportCurl` | `async function wizardImportCurl(rl: Interface): Promise<void>` | rl: Interface | Promise<void> | 290 | Implements the wizard import curl function. It emits operator-facing output. |
| `wizardImportPostman` | `async function wizardImportPostman(rl: Interface): Promise<void>` | rl: Interface | Promise<void> | 344 | Implements the wizard import postman function. It emits operator-facing output. |
| `wizardRun` | `async function wizardRun(rl: Interface): Promise<void>` | rl: Interface | Promise<void> | 404 | Implements the wizard run function. It orchestrates process execution, emits operator-facing output. |
| `wizardDebug` | `async function wizardDebug(rl: Interface): Promise<void>` | rl: Interface | Promise<void> | 417 | Implements the wizard debug function. It orchestrates process execution, emits operator-facing output. |
| `wizardValidate` | `async function wizardValidate(rl: Interface): Promise<void>` | rl: Interface | Promise<void> | 426 | Implements the wizard validate function. It emits operator-facing output. |
| `wizardInit` | `async function wizardInit(rl: Interface): Promise<void>` | rl: Interface | Promise<void> | 433 | Implements the wizard init function. It emits operator-facing output. |
| `isInsideWorkspace` | `function isInsideWorkspace(absPath: string): boolean` | absPath: string | boolean | 448 | Is `absPath` located inside the current framework workspace (the cwd tree)? Used to decide whether a source file is "already in the framework folder". |
| `maybeKeepReferenceCopy` | `async function maybeKeepReferenceCopy( rl: Interface, sourcePath: string, team: string, kindLabel: string, ): Promise<void>` | rl: Interface, sourcePath: string, team: string, kindLabel: string | Promise<void> | 461 | After a generate/convert that consumed an external source file, offer to keep a copy of the original in the team's recordings/ folder for reference. Skips silently when the source already lives inside the framework folder (no point duplicating it) or when a copy with the same name is already present. Best-effort: a failed copy warns but never aborts the wizard. |
| `spawnSelf` | `async function spawnSelf(subArgs: string[]): Promise<void>` | subArgs: string[] | Promise<void> | 505 | Re-invoke this same CLI as a child process with `subArgs`, inheriting stdio. Used by the Run/Debug actions, which want the exact behavior (and live transaction table) of a direct invocation rather than running under the panel's readline loop. Must preserve the launching runtime: when the panel is started via tsx on the TypeScript source (e.g. `tsx core_engine/src/cli/run.ts`), the entry point is a `.ts` file that bare `node` cannot execute. Detect that and re-run through node's tsx loader (`node --import tsx <entry>`); for a compiled `.js` entry, spawn node directly. |
| `isFrameworkWorkspace` | `function isFrameworkWorkspace(): boolean` | None | boolean | 522 | Implements the is framework workspace function. It performs file-system work. |
| `listExistingProjects` | `function listExistingProjects(): string[]` | None | string[] | 530 | List existing project folders under testSuites/ (one folder per project). |
| `pickOrCreateProject` | `async function pickOrCreateProject(rl: Interface): Promise<string \| null>` | rl: Interface | Promise<string \| null> | 551 | Pick an existing project or create a new one. New projects get the standard `tests/`, `data/`, `recordings/` subfolders so subsequent actions (Generate / Import / Convert) drop files into the right place. |
| `createProjectInteractive` | `async function createProjectInteractive(rl: Interface): Promise<string \| null>` | rl: Interface | Promise<string \| null> | 580 | Implements the create project interactive function. It emits operator-facing output. |
| `ensureProjectScaffold` | `function ensureProjectScaffold(projectName: string): void` | projectName: string | void | 595 | Create the standard project folder layout if it doesn't exist. Idempotent — safe to call when the project already exists. |
| `pickFile` | `async function pickFile( rl: Interface, defaultExt: string, label: string, matcher?: RegExp, ): Promise<string \| null>` | rl: Interface, defaultExt: string, label: string, matcher?: RegExp | Promise<string \| null> | 620 | File picker — searches cwd + immediate subdirs for files matching the extension or regex, presents a numbered list, falls back to manual path entry. Returns the (possibly relative) path the user picked, or null if they bailed. |
| `cleanPath` | `function cleanPath(raw: string): string` | raw: string | string | 655 | Normalize a user-typed path string. Trims whitespace and strips a single layer of surrounding single/double quotes — Windows "Copy as path" and many shells wrap pasted paths in `"..."`, which otherwise defeats absolute-path detection (path.resolve would treat the quoted string as relative and join it onto the cwd). |
| `resolveUserPath` | `function resolveUserPath(raw: string, label: string): string \| null` | raw: string, label: string | string \| null | 673 | Resolve a user-supplied file path (absolute or relative to cwd) and verify it exists before handing it to a CLI handler. Returns null if the user entered nothing; warns and returns null if the path can't be found so the wizard can re-prompt rather than failing deep inside a handler. |
| `findFiles` | `function findFiles(root: string, re: RegExp, maxDepth: number): string[]` | root: string, re: RegExp, maxDepth: number | string[] | 687 | Search the given directory recursively (limited depth) for files matching the regex. Bounded to keep this from walking node_modules / .git / dist. |
| `pickPlan` | `async function pickPlan(rl: Interface): Promise<string \| null>` | rl: Interface | Promise<string \| null> | 716 | Pick a test plan from `config/test_plans/`. |
| `askScriptName` | `async function askScriptName(rl: Interface, suggestFromPath: string): Promise<string \| null>` | rl: Interface, suggestFromPath: string | Promise<string \| null> | 748 | Suggest a script name based on an input file path. |
| `resolveScriptTarget` | `async function resolveScriptTarget( rl: Interface, project: string, scriptName: string, ): Promise<` | rl: Interface, project: string, scriptName: string | Promise<{ name: string; overwrite: boolean } \| null> | 764 | Resolve a target script name against existing files in the project's `tests/` folder. If the file already exists, ask whether to overwrite it, save under a different name (re-checking that one too), or cancel. Returns the chosen `{ name, overwrite }`, or null if the user cancelled. Shared by every authoring wizard (Generate / Convert / BYOS / cURL / Postman) so the "already exists" experience is consistent across features. |
| `readUntilBlankLine` | `async function readUntilBlankLine(rl: Interface): Promise<string>` | rl: Interface | Promise<string> | 795 | Read lines from stdin until a blank line is entered. |
| `askInput` | `async function askInput(rl: Interface, label: string): Promise<string \| null>` | rl: Interface, label: string | Promise<string \| null> | 807 | Implements the ask input function. |
| `cq` | `function cq(text: string): string` | text: string | string | 813 | Wrap a question/prompt string in the panel's prompt color (cyan). |
| `confirm` | `async function confirm(rl: Interface, question: string, defaultYes: boolean): Promise<boolean>` | rl: Interface, question: string, defaultYes: boolean | Promise<boolean> | 817 | Implements the confirm function. |
| `pickFromOptions` | `async function pickFromOptions<T>( rl: Interface, prompt: string, options: OptionChoice<T>[], ): Promise<T \| null>` | rl: Interface, prompt: string, options: OptionChoice<T>[] | Promise<T \| null> | 833 | Implements the pick from options function. It emits operator-facing output. |
| `folderTreeLabel` | `function folderTreeLabel(f:` | f: { rawPath: string[]; depth: number } | string | 860 | Render a Postman folder as an indented tree row: top-level folders sit flush left, nested folders are indented per level and prefixed with a `└─` branch so the hierarchy is unmistakable in the numbered list. |
| `printBanner` | `function printBanner(): void` | None | void | 867 | Implements the print banner function. It orchestrates process execution, emits operator-facing output. |


### core_engine/src/cli/LifecyclePrompt.ts

Layer: cli  
Lines: 82  
Purpose: cq, promptForLifecycleSelection, parseSelections helpers or command handlers.

Imports:
- `import { Interface } from 'node:readline/promises';`
- `import { LifecycleSelection } from '../recording/ScriptGenerator';`
- `import { ansi } from '../utils/logger';`

Exports: `promptForLifecycleSelection`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `cq` | `function cq(text: string): string` | text: string | string | 6 | Wrap a prompt string in the framework's prompt color (cyan). |
| `promptForLifecycleSelection` | `export async function promptForLifecycleSelection( rl: Interface, groupNames: string[], ): Promise<LifecycleSelection>` | rl: Interface, groupNames: string[] | Promise<LifecycleSelection> | 10 | Implements the prompt for lifecycle selection function. It emits operator-facing output. |
| `parseSelections` | `function parseSelections(answer: string, groupNames: string[]): string[]` | answer: string, groupNames: string[] | string[] | 49 | Implements the parse selections function. |


### core_engine/src/cli/new.ts

Layer: cli  
Lines: 65  
Purpose: runNewWizard helpers or command handlers.

Imports:
- `import * as readline from 'readline';`
- `import * as fs from 'fs';`
- `import * as path from 'path';`

Exports: `runNewWizard`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `runNewWizard` | `export function runNewWizard()` | None | Inferred | 10 | Implements the run new wizard function. It performs file-system work, parses structured configuration or artifact data, emits operator-facing output. |


### core_engine/src/cli/run.ts

Layer: cli  
Lines: 2617  
Purpose: bridgeEnvFile, resolveSharedRunIdFromEnv, runPlanDebugMode, runJourneyDebug helpers or command handlers.

Imports:
- `import { Command } from 'commander';`
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import * as os from 'os';`
- `import * as readline from 'readline';`
- `import { ConfigurationManager } from '../config/ConfigurationManager';`
- `import { EnvResolver } from '../config/EnvResolver';`
- `import { GatekeeperValidator } from '../config/GatekeeperValidator';`
- `import { RuntimeConfigManager } from '../config/RuntimeConfigManager';`
- `import { RecordingLogResolver } from '../debug/RecordingLogResolver';`
- `import { ReplayRunner } from '../debug/ReplayRunner';`
- `import { HostMonitor, HostSnapshot } from '../execution/HostMonitor';`
- `import { ParallelExecutionManager } from '../execution/ParallelExecutionManager';`
- `import { FileWriteSink } from '../execution/FileWriteSink';`
- `import { PipelineRunner } from '../execution/PipelineRunner';`
- `import { ScenarioBuilder } from '../scenario/ScenarioBuilder';`
- `import { ArtifactWriter } from '../reporting/ArtifactWriter';`
- `import { EventArtifactBuilder } from '../reporting/EventArtifactBuilder';`
- `import { RunReportGenerator } from '../reporting/RunReportGenerator';`
- `import { RunSummaryBuilder } from '../reporting/RunSummaryBuilder';`
- `import { TimeseriesArtifactBuilder } from '../reporting/TimeseriesArtifactBuilder';`
- `import { TransactionMetricsBuilder } from '../reporting/TransactionMetricsBuilder';`
- `import { HistogramArtifactBuilder } from '../reporting/HistogramArtifactBuilder';`
- `import { RequestMetricLogWriter } from '../reporting/RequestMetricLogWriter';`
- `import { TransactionMetricLogWriter } from '../reporting/TransactionMetricLogWriter';`
- `import { LiveEventLogWriter } from '../reporting/LiveEventLogWriter';`
- `import { ScenarioRuntimeMetadata } from '../scenario/ScenarioBuilder';`
- `import { TestPlanLoader } from '../scenario/TestPlanLoader';`
- `import { ResolvedConfig } from '../types/ConfigContracts';`
- `import { ReportBundle } from '../types/ReportingContracts';`
- `import { TestPlan, UserJourney } from '../types/TestPlanSchema';`
- `import { Logger } from '../utils/logger';`
- `import { startLiveConsoleLogStream } from '../utils/LiveConsoleLogStream';`
- `import { ProgressBar } from '../utils/ProgressBar';`
- `import { runConvert } from './convert';`
- `import { runCorrelate } from './correlate';`
- `import { runGenerate } from './generate';`
- `import { runGenerateByos } from './generate-byos';`
- `import { runImportCurl, runImportPostman } from './import';`
- `import { runInit } from './init';`
- `import { runValidate } from './validate';`
- `import { runMerge } from '../distributed/runMerge';`
- `import { runCollect, collectRunDir } from '../distributed/collectRun';`
- `import { findRequestCsv, readRequestFailByBucket, findTransactionCsv, buildTransactionRowsFromCsv } from '../distributed/transactionCsv';`
- `import { awaitScheduledStart } from '../distributed/startBarrier';`
- `import { runAgentCli } from '../distributed/agentServer';`
- `import { runProbe } from '../distributed/probe';`
- `import { printControllerShareSuggestion } from '../distributed/shareSetup';`
- `import type { ChildProcess } from 'child_process';`
- `import { LiveStatusHeartbeat } from '../distributed/LiveStatusHeartbeat';`
- `import { runMonitor } from '../distributed/monitor';`
- `import { runDashboardCli } from '../distributed/liveDashboard';`
- `import { ControlWatcher, controlDirFor, killProcessTree, k6ApiStop, writeControl } from '../distributed/control';`
- `import { listTemplates, showTemplate } from './templates';`
- `import { listFeatures } from './features';`
- `import { inspectConfig } from './config-inspect';`
- `import { runNewWizard } from './new';`
- `import { generateDocs } from './docs';`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `LiveTxnStats` | Interface | 2110 | Defines the LiveTxnStats contract used by the framework. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `program` | Inferred | 66 | Module-level constant or configuration value. |
| `importCmd` | Inferred | 239 | Module-level constant or configuration value. |
| `templatesCmd` | Inferred | 483 | Module-level constant or configuration value. |
| `configCmd` | Inferred | 526 | Module-level constant or configuration value. |
| `FRAMEWORK_OWNED_FLAGS` | Inferred | 1109 | Module-level constant or configuration value. |
| `LIVE_TXN_INTERVAL_MS` | Inferred | 2108 | Module-level constant or configuration value. |
| `SNAPSHOT_EVENT_PREFIX` | Inferred | 2508 | Module-level constant or configuration value. |
| `ERROR_EVENT_PREFIX` | Inferred | 2509 | Module-level constant or configuration value. |
| `WARNING_EVENT_PREFIX` | Inferred | 2510 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `bridgeEnvFile` | `function bridgeEnvFile(envFilePath?: string): void` | envFilePath?: string | void | 76 | Bridge a .env file into process.env for the distributed subcommands (monitor / signal / collect). The `run` command does this via ConfigurationManager; these lighter commands don't load full config, so without this they'd never see K6_PERF_COLLECT_DIR / K6_PERF_START_AT / K6_PERF_RUN_ID / K6_PERF_DASHBOARD_* that the operator set only in .env. Real shell/CI env still wins (EnvResolver only fills unset keys). |
| `resolveSharedRunIdFromEnv` | `function resolveSharedRunIdFromEnv(): string \| undefined` | None | string \| undefined | 93 | Resolve the SHARED distributed runId from the environment, mirroring how the run command derives it (see resolveReportDir): explicit K6_PERF_RUN_ID wins, else derive it from the shared K6_PERF_START_AT so `monitor`/`signal` target the same run folder the LGs created — no need to repeat --run-id on the CLI. Unlike the run path there is no "future only" guard: monitor/signal usually run after the start instant has passed, and the folder still carries that id. |
| `runPlanDebugMode` | `async function runPlanDebugMode(plan: TestPlan, resolvedConfig: ResolvedConfig, passthroughArgs: string[] = []): Promise<void>` | plan: TestPlan, resolvedConfig: ResolvedConfig, passthroughArgs: string[] = [] | Promise<void> | 1031 | Implements the run plan debug mode function. It performs file-system work, enforces validation rules, emits operator-facing output. |
| `runJourneyDebug` | `function runJourneyDebug(plan: TestPlan, journey: UserJourney, runDir: string, resolvedConfig: ResolvedConfig, passthroughArgs: string[] = [])` | plan: TestPlan, journey: UserJourney, runDir: string, resolvedConfig: ResolvedConfig, passthroughArgs: string[] = [] | Inferred | 1079 | Implements the run journey debug function. |
| `filterPassthroughArgs` | `function filterPassthroughArgs(args: string[]): string[]` | args: string[] | string[] | 1111 | Implements the filter passthrough args function. It orchestrates process execution, emits operator-facing output. |
| `resolveRecordingLogForStandaloneDebug` | `function resolveRecordingLogForStandaloneDebug(scriptPath: string): string \| undefined` | scriptPath: string | string \| undefined | 1142 | Implements the resolve recording log for standalone debug function. |
| `getEntryScriptDirectory` | `function getEntryScriptDirectory(journeys: UserJourney[]): string` | journeys: UserJourney[] | string | 1154 | Implements the get entry script directory function. It orchestrates process execution. |
| `toImportSpecifier` | `function toImportSpecifier(fromDir: string, targetPath: string): string` | fromDir: string, targetPath: string | string | 1166 | Implements the to import specifier function. |
| `prepareRunArtifacts` | `function prepareRunArtifacts(plan: TestPlan, resolvedConfig: ResolvedConfig):` | plan: TestPlan, resolvedConfig: ResolvedConfig | {  reportDir: string;  safeReportDir: string;  runId: string;  runManifestPath: string; } | 1171 | Implements the prepare run artifacts function. It performs file-system work. |
| `buildRuntimeMetadataBlock` | `function buildRuntimeMetadataBlock(resolvedConfig: ResolvedConfig): ScenarioRuntimeMetadata['runtime']` | resolvedConfig: ResolvedConfig | ScenarioRuntimeMetadata['runtime'] | 1233 | Build the `runtime` block injected into K6_PERF_RUNTIME_METADATA — the single source of truth the in-script runtime (request.ts / lifecycle.ts / transaction.ts) reads for errorBehavior, thinkTime, pacing, http (timeout/redirects/throwOnError), reporting and snapshot config. Shared by the load path (buildScenarioRuntimeMetadata) AND the debug path (runJourneyDebug) so debug honors EXACTLY the same runtime settings as load. That parity is intentional: debug exists to validate script behavior and shake out load-test scenarios, so it must follow redirects, time out, pace and think-time identically to load — otherwise a script can pass in debug and fail under load purely because debug used different HTTP semantics. |
| `buildScenarioRuntimeMetadata` | `function buildScenarioRuntimeMetadata( plan: TestPlan, resolvedConfig: ResolvedConfig, runId: string, safeReportDir: string, ): ScenarioRuntimeMetadata` | plan: TestPlan, resolvedConfig: ResolvedConfig, runId: string, safeReportDir: string | ScenarioRuntimeMetadata | 1267 | Implements the build scenario runtime metadata function. It orchestrates process execution. |
| `buildRunEnvironment` | `function buildRunEnvironment( plan: TestPlan, resolvedConfig: ResolvedConfig, runId: string, safeReportDir: string, runManifestPath: string, ): Record<string, string>` | plan: TestPlan, resolvedConfig: ResolvedConfig, runId: string, safeReportDir: string, runManifestPath: string | Record<string, string> | 1287 | Implements the build run environment function. It orchestrates process execution. |
| `extractJourneyTransactionNames` | `function extractJourneyTransactionNames(plan: TestPlan): Record<string, string[]>` | plan: TestPlan | Record<string, string[]> | 1319 | Implements the extract journey transaction names function. It performs file-system work. |
| `collectUniqueTransactionNames` | `function collectUniqueTransactionNames(journeyTransactionNames: Record<string, string[]>): string[]` | journeyTransactionNames: Record<string, string[]> | string[] | 1341 | Implements the collect unique transaction names function. |
| `extractTransactionNamesFromSource` | `function extractTransactionNamesFromSource(source: string): string[]` | source: string | string[] | 1353 | Implements the extract transaction names from source function. It orchestrates process execution. |
| `writeRunManifest` | `function writeRunManifest( runManifestPath: string, plan: TestPlan, resolvedConfig: ResolvedConfig, scenarioMetadata: ScenarioRuntimeMetadata, dist?:` | runManifestPath: string, plan: TestPlan, resolvedConfig: ResolvedConfig, scenarioMetadata: ScenarioRuntimeMetadata, dist?: { distributed: boolean; role?: string; machine: string; testId: string } | void | 1373 | Implements the write run manifest function. It performs file-system work, orchestrates process execution, enforces validation rules. |
| `computeTopRequestsByP90` | `async function computeTopRequestsByP90( streamPath: string, topN = 5, ): Promise<Array<` | streamPath: string, topN = 5 | Promise<Array<{ name: string; method: string; transaction: string; url: string; count: number; p90: number; avg: number; min: number; max: number }>> | 1431 | Extract percentile numbers from a transactionStats list (e.g. ["avg","p(90)", "p(99)"] → [90, 99]). Used to tell the timeseries parser which percentile lines the report should plot. p90 is always added by the parser. |
| `percentilesFromStats` | `function percentilesFromStats(stats: string[]): number[]` | stats: string[] | number[] | 1496 | Implements the percentiles from stats function. It orchestrates process execution. |
| `finalizeRunArtifacts` | `async function finalizeRunArtifacts(options:` | options: { runId: string; reportDir: string; plan: TestPlan; resolvedConfig: ResolvedConfig; runStatus: number; /** Distributed mode: suppress the per-machine custom RunReport.html (the merge produces the single report). */ distributed?: boolean; hostSnapshots: HostSnapshot[]; k6StartTime?: string; k6EndTime?: string; /** * Transaction-name manifest (the same array fed to `K6_PERF_TRANSACTION_NAMES`). * Lets the post-run time-series parser distinguish per-transaction Trend/ * Counter/Rate metric points from unrelated user-defined metrics. */ transactionNames?: string[]; /** * Execution provenance (k6 command, generated entry script, resolved * options/scenarios) surfaced in the report so users can see how the test * plan was turned into a real k6 invocation. Optional — older callers omit it. */ execution?: { command: string; entryScript: string; options: unknown }; } | Promise<{  runReportHtml: string;  /** Consolidated CI gate + per-transaction table (replaces transaction-metrics + ci-summary). */  runSummaryJson: string;  errorsNdjson: string;  warningsNdjson: string;  timeseriesJson: string;  systemMetricsJson: string;  transactionMetrics?: import('../types/ReportingContracts').TransactionMetricsFile; }> | 1508 | Distributed mode: suppress the per-machine custom RunReport.html (the merge produces the single report). |
| `buildReportAgents` | `function buildReportAgents(eventArtifacts:` | eventArtifacts: { errors: Array<{ agent?: ReportBundle['system']['agents'][number] }>; warnings: Array<{ agent?: ReportBundle['system']['agents'][number] }>; } | ReportBundle['system']['agents'] | 1988 | Implements the build report agents function. It enforces validation rules. |
| `printTransactionTable` | `function printTransactionTable(metrics: import('../types/ReportingContracts').TransactionMetricsFile): void` | metrics: import('../types/ReportingContracts').TransactionMetricsFile | void | 1999 | Print a LoadRunner-style transaction metrics table to the console. |
| `formatCell` | `function formatCell(value: unknown, column: string): string` | value: unknown, column: string | string | 2093 | Implements the format cell function. |
| `pct` | `function pct(values: number[], p: number): string` | values: number[], p: number | string | 2131 | Implements the pct function. It orchestrates process execution. |
| `startLiveTransactionDisplay` | `function startLiveTransactionDisplay( metricsStreamPath: string, transactionNames: string[], transactionStats: string[], _logPath: string, ):` | metricsStreamPath: string, transactionNames: string[], transactionStats: string[], _logPath: string | { stop: () => void } | 2144 | Implements the start live transaction display function. It performs file-system work, orchestrates process execution, parses structured configuration or artifact data. |
| `buildLiveTableLines` | `function buildLiveTableLines( stats: Map<string, LiveTxnStats>, transactionStats: string[], useColor: boolean, ): string[]` | stats: Map<string, LiveTxnStats>, transactionStats: string[], useColor: boolean | string[] | 2358 | Build the rendered table as a list of strings (one per row). Pure helper shared by both fixed-position and scrollback renderers. |
| `renderFixedTable` | `function renderFixedTable( stats: Map<string, LiveTxnStats>, transactionStats: string[], useColor: boolean, tableTop: number, termRows: number, ): void` | stats: Map<string, LiveTxnStats>, transactionStats: string[], useColor: boolean, tableTop: number, termRows: number | void | 2453 | Fixed-position rendering: the table lives at rows `tableTop..termRows`, frozen below k6's scroll region. Save cursor → clear table area → draw table → restore cursor, so k6's progress bar continues animating above without ever touching our table area. |
| `renderScrollbackTable` | `function renderScrollbackTable( stats: Map<string, LiveTxnStats>, transactionStats: string[], useColor: boolean, ): void` | stats: Map<string, LiveTxnStats>, transactionStats: string[], useColor: boolean | void | 2494 | Fallback for non-TTY stdout or terminals too short for fixed positioning: just append the latest snapshot as scrollback. |
| `parseAndFlushSnapshots` | `function parseAndFlushSnapshots(runLogPath: string, reportDir: string): void` | runLogPath: string, reportDir: string | void | 2516 | Reads the mirrored k6 log file, extracts snapshot events emitted during the run, and writes a consolidated snapshots.json to the report directory. |
| `extractK6PerfEvents` | `function extractK6PerfEvents(runLogPath: string):` | runLogPath: string | {  errors: Array<Record<string, unknown>>;  warnings: Array<Record<string, unknown>>; } | 2548 | Wave 3: scan the mirrored run log for any `[k6-perf][*-event]` JSON payloads emitted by the k6 side (`transaction.ts` and `request.ts`) and return them as structured event lists. Used by `finalizeRunArtifacts` to merge per-iteration check failures, transaction exceptions, and snapshot- cap warnings into the same error/warning pipelines the rest of reporting consumes. Best-effort — malformed lines are skipped. |
| `extractPayloadWithPrefix` | `function extractPayloadWithPrefix(line: string, prefix: string): string \| null` | line: string, prefix: string | string \| null | 2573 | Same dequote logic as snapshot extraction, parameterized on the prefix. |
| `extractSnapshotPayload` | `function extractSnapshotPayload(line: string): string \| null` | line: string | string \| null | 2587 | Implements the extract snapshot payload function. It orchestrates process execution, parses structured configuration or artifact data. |


### core_engine/src/cli/templates.ts

Layer: cli  
Lines: 59  
Purpose: listTemplates, showTemplate helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { parse } from 'jsonc-parser';`

Exports: `listTemplates`, `showTemplate`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `listTemplates` | `export function listTemplates(type: 'test_plans' \| 'runtime_settings')` | type: 'test_plans' \| 'runtime_settings' | Inferred | 10 | Implements the list templates function. It performs file-system work, parses structured configuration or artifact data, emits operator-facing output. |
| `showTemplate` | `export function showTemplate(type: 'test_plans' \| 'runtime_settings', name: string)` | type: 'test_plans' \| 'runtime_settings', name: string | Inferred | 39 | Implements the show template function. It performs file-system work, parses structured configuration or artifact data, emits operator-facing output. |


### core_engine/src/cli/validate.ts

Layer: cli  
Lines: 95  
Purpose: runValidate helpers or command handlers.

Imports:
- `import * as path from 'path';`
- `import { ConfigurationManager } from '../config/ConfigurationManager';`
- `import { GatekeeperValidator } from '../config/GatekeeperValidator';`
- `import { TestPlanLoader } from '../scenario/TestPlanLoader';`

Exports: `ValidateOptions`, `runValidate`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `ValidateOptions` | Interface | 12 | Defines the ValidateOptions contract used by the framework. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `runValidate` | `export function runValidate(opts: ValidateOptions): boolean` | opts: ValidateOptions | boolean | 21 | Implements the run validate function. It performs file-system work, parses structured configuration or artifact data, enforces validation rules, emits operator-facing output. |


### core_engine/src/config/ConfigurationManager.ts

Layer: config  
Lines: 161  
Purpose: ConfigurationManager implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import {
 EnvironmentConfig,
 FRAMEWORK_DEFAULTS,
 ResolvedConfig,
 RuntimeSettings,
} from '../types/ConfigContracts';`
- `import { TestPlan } from '../types/TestPlanSchema';`
- `import { EnvResolver } from './EnvResolver';`
- `import { SchemaValidator } from './SchemaValidator';`
- `import { parse } from 'jsonc-parser';`

Exports: `ConfigurationManager`

#### Class: ConfigurationManager

Line: 20  
Description: Load and merge all config layers, returning a fully resolved config. Throws descriptively if any required piece is missing or schema-invalid.

| Property | Type | Line | Description |
|---|---|---:|---|
| `envResolver` | EnvResolver | 21 | Class state or configuration value used by the class methods. |
| `schemaValidator` | SchemaValidator | 22 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `constructor` | `constructor(envFilePath?: string)` | envFilePath?: string | Inferred | 24 | Implements the constructor method. It enforces validation rules. |
| `resolve` | `resolve(options:` | options: { environmentConfigPath: string; runtimeSettingsPath: string; cliOverrides?: Record<string, unknown>; } | ResolvedConfig | 33 | Load and merge all config layers, returning a fully resolved config. Throws descriptively if any required piece is missing or schema-invalid. |
| `loadTestPlan` | `loadTestPlan(planPath: string): TestPlan` | planPath: string | TestPlan | 70 | Implements the load test plan method. It enforces validation rules. |
| `loadEnvironmentConfig` | `private loadEnvironmentConfig(filePath: string): EnvironmentConfig` | filePath: string | EnvironmentConfig | 81 | Implements the load environment config method. |
| `loadRuntimeSettings` | `private loadRuntimeSettings(filePath: string): Partial<RuntimeSettings>` | filePath: string | Partial<RuntimeSettings> | 85 | Implements the load runtime settings method. It performs file-system work, enforces validation rules, emits operator-facing output. |
| `readJsonFile` | `private readJsonFile<T>(filePath: string, label: string): T` | filePath: string, label: string | T | 107 | Implements the read json file method. It performs file-system work. |
| `deepMerge` | `private deepMerge(target: unknown, source: unknown): unknown` | target: unknown, source: unknown | unknown | 127 | Recursive deep merge – source keys override target keys. |
| `printResolvedConfig` | `private printResolvedConfig(config: ResolvedConfig): void` | config: ResolvedConfig | void | 145 | Implements the print resolved config method. It emits operator-facing output. |


### core_engine/src/config/EnvResolver.ts

Layer: config  
Lines: 78  
Purpose: EnvResolver implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import * as dotenv from 'dotenv';`

Exports: `EnvResolver`

#### Class: EnvResolver

Line: 11  
Description: Load and parse a .env file from the given path. Falls back to process.env if the file does not exist.

| Property | Type | Line | Description |
|---|---|---:|---|
| `vars` | Record<string, string> | 12 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `constructor` | `constructor(envFilePath?: string)` | envFilePath?: string | Inferred | 18 | Load and parse a .env file from the given path. Falls back to process.env if the file does not exist. |
| `require` | `require(key: string): string` | key: string | string | 42 | Get a required string variable. Throws if missing. |
| `get` | `get(key: string, defaultValue = ''): string` | key: string, defaultValue = '' | string | 51 | Get an optional string variable with a fallback default. |
| `getBool` | `getBool(key: string, defaultValue = false): boolean` | key: string, defaultValue = false | boolean | 56 | Get an optional boolean variable ('true'/'false'/'1'/'0'). |
| `getNumber` | `getNumber(key: string, defaultValue = 0): number` | key: string, defaultValue = 0 | number | 63 | Get an optional numeric variable. |
| `getAll` | `getAll(): Record<string, string>` | None | Record<string, string> | 74 | Expose all resolved vars (for debug printing – caller should redact secrets). |


### core_engine/src/config/GatekeeperValidator.ts

Layer: config  
Lines: 359  
Purpose: GatekeeperValidator implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { ResolvedConfig } from '../types/ConfigContracts';`
- `import { TestPlan } from '../types/TestPlanSchema';`
- `import { DataValidator } from '../data/DataValidator';`
- `import { RecordingLogResolver } from '../debug/RecordingLogResolver';`
- `import { Logger } from '../utils/logger';`
- `import { PathResolver } from '../utils/PathResolver';`
- `import { ScriptContractGuard, FileViolations } from './ScriptContractGuard';`

Exports: `GatekeeperResult`, `GatekeeperValidator`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `GatekeeperResult` | Interface | 18 | Framework-rule violations: journey scripts that use native k6 APIs the framework forbids (check()/group()). Reported as a distinct, richly formatted block — see printResult — rather than a one-line failure. |

#### Class: GatekeeperValidator

Line: 30  
Description: Run the full pre-flight checklist. Returns a result object — never throws; caller decides how to handle failures.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `validate` | `validate(config: ResolvedConfig, plan: TestPlan, dataRoot: string): GatekeeperResult` | config: ResolvedConfig, plan: TestPlan, dataRoot: string | GatekeeperResult | 35 | Run the full pre-flight checklist. Returns a result object — never throws; caller decides how to handle failures. |
| `extractTransactionNames` | `private extractTransactionNames(source: string): string[]` | source: string | string[] | 264 | Transaction names declared in a script via transaction()/startTransaction(). |
| `printResult` | `printResult(result: GatekeeperResult): GatekeeperResult` | result: GatekeeperResult | GatekeeperResult | 284 | Print the result to console in a human-readable format. Returns the same result for chaining. |
| `extractDataReferences` | `private extractDataReferences( scriptContent: string, ): Array<` | scriptContent: string | Array<{ dataset: string; filePath: string; columns: string[] }> | 316 | Scan a k6 script for data file references and column usage. Detects: fs.open("path") → file mapping, FILES["name"]["col"] → column refs. |
| `estimateRequestedVUs` | `private estimateRequestedVUs(plan: TestPlan): number` | plan: TestPlan | number | 351 | Implements the estimate requested vus method. |


### core_engine/src/config/RuntimeConfigManager.ts

Layer: config  
Lines: 233  
Purpose: RuntimeConfigManager implementation.

Imports:
- `import { RuntimeSettings, ThinkTimeConfig, FRAMEWORK_DEFAULTS } from '../types/ConfigContracts';`

Exports: `RuntimeConfigManager`

#### Class: RuntimeConfigManager

Line: 9  
Description: Returns the think time in seconds to apply between transactions. When mode = 'random', returns a value in [min, max].

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `constructor` | `constructor(private readonly settings: RuntimeSettings)` | private readonly settings: RuntimeSettings | Inferred | 10 | Implements the constructor method. |
| `getThinkTimeSeconds` | `getThinkTimeSeconds(): number` | None | number | 36 | Returns the think time in seconds to apply between transactions. When mode = 'random', returns a value in [min, max]. |
| `isPacingEnabled` | `isPacingEnabled(): boolean` | None | boolean | 51 | Implements the is pacing enabled method. |
| `getPacingSeconds` | `getPacingSeconds(): number` | None | number | 55 | Implements the get pacing seconds method. |
| `getPacingIntervalMs` | `getPacingIntervalMs(): number` | None | number | 59 | Implements the get pacing interval ms method. |
| `getPacingRuntimeConfig` | `getPacingRuntimeConfig():` | None | {  enabled: boolean;  mode: 'fixed' \| 'random';  fixed?: number;  min?: number;  max?: number;  } | 69 | Normalized pacing config injected into the per-VU runtime metadata so each VU derives a fresh pace each iteration (important for 'random' mode, which must vary per iteration rather than being precomputed once). Falls back to the legacy `targetIntervalSeconds` for `fixed`. |
| `getTimeoutMs` | `getTimeoutMs(): number` | None | number | 90 | Implements the get timeout ms method. |
| `getMaxRedirects` | `getMaxRedirects(): number` | None | number | 94 | Implements the get max redirects method. |
| `shouldThrowOnError` | `shouldThrowOnError(): boolean` | None | boolean | 98 | Implements the should throw on error method. |
| `getErrorBehavior` | `getErrorBehavior(): RuntimeSettings['errorBehavior']` | None | RuntimeSettings['errorBehavior'] | 106 | Implements the get error behavior method. |
| `getTransactionStats` | `getTransactionStats(): string[]` | None | string[] | 114 | Implements the get transaction stats method. |
| `shouldIncludeTransactionTable` | `shouldIncludeTransactionTable(): boolean` | None | boolean | 121 | Implements the should include transaction table method. |
| `shouldIncludeErrorTable` | `shouldIncludeErrorTable(): boolean` | None | boolean | 125 | Implements the should include error table method. |
| `shouldOverrideExistingResults` | `shouldOverrideExistingResults(): boolean` | None | boolean | 134 | When true, reports overwrite a single stable `Run_latest` folder instead of creating a new timestamped folder per run. Defaults to false so run history is preserved. |
| `isTimeseriesEnabled` | `isTimeseriesEnabled(): boolean` | None | boolean | 140 | Implements the is timeseries enabled method. |
| `getTimeseriesBucketSizeSeconds` | `getTimeseriesBucketSizeSeconds(): number` | None | number | 144 | Implements the get timeseries bucket size seconds method. |
| `shouldKeepRawMetricsStream` | `shouldKeepRawMetricsStream(): boolean` | None | boolean | 161 | When false (the default), the raw k6 streaming-JSON file (`metrics-stream.json`) is deleted once the report is built. It is purely an INPUT — the timeseries artifact and the mergeable histogram are derived from it and every chart reads those — and it is the largest file a run produces (several MB per minute of high-RPS traffic). Resolution order (first match wins): 1. `K6_PERF_KEEP_RAW` env (1/true/yes to keep, 0/false/no to delete) — lets a one-off debug run retain the stream without editing runtime settings. 2. `reporting.timeseries.keepRawMetricsStream` in the runtime settings file. 3. The framework default (false). |
| `shouldCaptureSnapshotOnFailure` | `shouldCaptureSnapshotOnFailure(): boolean` | None | boolean | 176 | Implements the should capture snapshot on failure method. It enforces validation rules. |
| `getMaxSnapshotsPerRun` | `getMaxSnapshotsPerRun(): number` | None | number | 180 | Implements the get max snapshots per run method. It enforces validation rules. |
| `shouldIncludeRequestHeadersInSnapshots` | `shouldIncludeRequestHeadersInSnapshots(): boolean` | None | boolean | 184 | Implements the should include request headers in snapshots method. It enforces validation rules. |
| `shouldIncludeRequestBodyInSnapshots` | `shouldIncludeRequestBodyInSnapshots(): boolean` | None | boolean | 188 | Implements the should include request body in snapshots method. It enforces validation rules. |
| `shouldIncludeResponseHeadersInSnapshots` | `shouldIncludeResponseHeadersInSnapshots(): boolean` | None | boolean | 192 | Implements the should include response headers in snapshots method. It enforces validation rules. |
| `shouldIncludeResponseBodyInSnapshots` | `shouldIncludeResponseBodyInSnapshots(): boolean` | None | boolean | 196 | Implements the should include response body in snapshots method. It enforces validation rules. |
| `isMonitoringEnabled` | `isMonitoringEnabled(): boolean` | None | boolean | 204 | Implements the is monitoring enabled method. |
| `getCpuWarningPercent` | `getCpuWarningPercent(): number` | None | number | 208 | Implements the get cpu warning percent method. |
| `getMemoryWarningPercent` | `getMemoryWarningPercent(): number` | None | number | 212 | Implements the get memory warning percent method. |
| `getMonitoringSampleIntervalSeconds` | `getMonitoringSampleIntervalSeconds(): number` | None | number | 216 | Implements the get monitoring sample interval seconds method. |
| `isDebugMode` | `isDebugMode(): boolean` | None | boolean | 224 | Implements the is debug mode method. |
| `dump` | `dump(): RuntimeSettings` | None | RuntimeSettings | 229 | Return all settings (useful for logging) |


### core_engine/src/config/SchemaValidator.ts

Layer: config  
Lines: 330  
Purpose: SchemaValidator implementation.

Imports:
- `import Ajv, { ValidateFunction, ErrorObject } from 'ajv';`
- `import addFormats from 'ajv-formats';`
- `import * as fs from 'fs';`
- `import * as path from 'path';`

Exports: `ValidationResult`, `SchemaValidator`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `ValidationResult` | Interface | 17 | Defines the ValidationResult contract used by the framework. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `RUNTIME_SETTINGS_SCHEMA_INLINE` | Inferred | 51 | Module-level constant or configuration value. |
| `TEST_PLAN_SCHEMA_INLINE` | Inferred | 142 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `loadExternalSchema` | `function loadExternalSchema(schemaFileName: string): object \| undefined` | schemaFileName: string | object \| undefined | 30 | Attempt to load a JSON Schema from the config/schemas/ directory. Returns undefined if the file doesn't exist (caller falls back to inline). |
| `levenshtein` | `function levenshtein(a: string, b: string): number` | a: string, b: string | number | 310 | Implements the levenshtein function. |

#### Class: SchemaValidator

Line: 222  
Description: Implements the schema validator class. It enforces validation rules.

| Property | Type | Line | Description |
|---|---|---:|---|
| `ajv` | Ajv | 223 | Class state or configuration value used by the class methods. |
| `validateRuntimeSettings` | ValidateFunction | 224 | Class state or configuration value used by the class methods. |
| `validateTestPlan` | ValidateFunction | 225 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `constructor` | `constructor()` | None | Inferred | 227 | Implements the constructor method. It enforces validation rules. |
| `validateRuntime` | `validateRuntime(data: unknown): ValidationResult` | data: unknown | ValidationResult | 240 | Implements the validate runtime method. It enforces validation rules. |
| `validatePlan` | `validatePlan(data: unknown): ValidationResult` | data: unknown | ValidationResult | 244 | Implements the validate plan method. It enforces validation rules. |
| `runValidation` | `private runValidation( validate: ValidateFunction, data: unknown, label: string, ): ValidationResult` | validate: ValidateFunction, data: unknown, label: string | ValidationResult | 248 | Implements the run validation method. It enforces validation rules. |


### core_engine/src/config/ScriptContractGuard.ts

Layer: config  
Lines: 255  
Purpose: ScriptContractGuard implementation.

Imports:
- `import * as fs from 'fs';`

Exports: `CallHit`, `ApiViolation`, `FileViolations`, `ScriptContractGuard`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `CallHit` | Interface | 3 | 1-based line number of the offending call. |
| `ApiViolation` | Interface | 10 | The native k6 API used (e.g. 'check', 'group'). |
| `FileViolations` | Interface | 23 | Script path that violated the contract. |
| `ContractRule` | Interface | 29 | Defines the ContractRule contract used by the framework. |

#### Class: ScriptContractGuard

Line: 58  
Description: Pre-flight contract guard for journey scripts. The framework reports EXACT per-iteration transaction pass/fail from the `<name>_checkrate` Rate metric, which only exists when checks run via `k6Check()` INSIDE a `transaction()`. Two native k6 APIs silently break that guarantee, so a script using either is rejected before k6 launches — no fallback, no approximate results: • native `check()` → its pass/fail never reaches the checkrate metric. → k6Check() • native `group()` → it measures a unit with no checkrate metric. → transaction() A violation is flagged when EITHER the API is imported from 'k6' OR it is called directly in the script — so a bare `check(...)`/`group(...)` call is caught even without the import (in real k6 that's a runtime ReferenceError, which we'd rather stop at pre-flight than at runtime). The call matcher uses a `(?<![A-Za-z0-9_$.])` lookbehind so `k6Check(`, `obj.check(` and `recheck(` are never matched; a script that defines its own local `check`/`group` function is the only false-positive surface, which is acceptable since those names are reserved by the framework contract. (Namespace imports — `import * as k6 from 'k6'; k6.group()` — are an unsupported edge.)

| Property | Type | Line | Description |
|---|---|---:|---|
| `RULES` | ContractRule[] | 59 | Class state or configuration value used by the class methods. |
| `K6_IMPORT_RE` | Inferred | 74 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `k6Imports` | `private static k6Imports(source: string): Set<string>` | source: string | Set<string> | 77 | Names imported from the 'k6' module (aliases resolved to the original). |
| `importLineFor` | `private static importLineFor(source: string, apiName: string): string \| undefined` | source: string, apiName: string | string \| undefined | 89 | The `import { … } from 'k6'` line that names `apiName`, trimmed. |
| `findCalls` | `private static findCalls(source: string, callRe: RegExp): CallHit[]` | source: string, callRe: RegExp | CallHit[] | 107 | Find bare call sites for `callRe`, with line numbers. Runs against a comment- and string-blanked copy of the source so a call that's commented out — or text that merely LOOKS like a comment inside a string (e.g. the star-slash-star in an `accept: ...` header value, whose embedded slash-star / star-slash substrings would otherwise be read as block-comment markers) — never affects detection. |
| `blankCommentsAndStrings` | `private static blankCommentsAndStrings(source: string): string` | source: string | string | 123 | Return `source` with comment bodies and string contents replaced by spaces (newlines preserved, so line numbers are unchanged). A small char scanner tracks line/block comments and ', ", ` strings, so comment markers inside strings (and code inside comments) can't fool the call matcher. |
| `scan` | `static scan(source: string): ApiViolation[]` | source: string | ApiViolation[] | 162 | Detect every native k6 API used in `source` that the framework forbids. |
| `scanFile` | `static scanFile(scriptPath: string): FileViolations \| null` | scriptPath: string | FileViolations \| null | 183 | Scan a script file; returns its violations, or null when clean/unreadable. |
| `format` | `static format(files: FileViolations[]): string` | files: FileViolations[] | string | 198 | Render the "Framework Validation Failed" report for one or more offending scripts. Matches the operator-facing format used by the pre-flight. |
| `assertClean` | `static assertClean(label: string, source: string): void` | label: string, source: string | void | 249 | Throw a `Framework Validation Failed` Error if `source` (identified by `label`) uses any native k6 API the framework forbids. No-op when the script is clean. Used by the standalone debug path; the run path uses scanFile + format via the pre-flight gatekeeper. |


### core_engine/src/correlation/CandidateScorer.ts

Layer: correlation  
Lines: 222  
Purpose: CandidateScorer implementation.

Imports:
- `import * as fs from 'fs';`
- `import { RawCandidate } from './LinkMatcher';`
- `import { IndexedValues } from './ValueIndexer';`
- `import { CorrelationConfidence } from './CorrelationManifest';`

Exports: `ScorerConfig`, `ScoredCandidate`, `ScoreOptions`, `CandidateScorer`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `ScorerConfig` | Interface | 20 | Defines the ScorerConfig contract used by the framework. |
| `ScoredCandidate` | Interface | 27 | Best vocabulary/locator-derived name hint (no c_ prefix yet). |
| `ScoreOptions` | Interface | 36 | Values known to come from data files — treated as parameterisation, not correlation. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `DEFAULT_CONFIG` | ScorerConfig | 43 | Module-level constant or configuration value. |
| `UUID_RE` | Inferred | 57 | Module-level constant or configuration value. |
| `JWT_RE` | Inferred | 58 | Module-level constant or configuration value. |
| `HEX_RE` | Inferred | 59 | Module-level constant or configuration value. |
| `BASE64ISH_RE` | Inferred | 60 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `shannonBits` | `function shannonBits(s: string): number` | s: string | number | 195 | Implements the shannon bits function. |
| `deriveNameHint` | `function deriveNameHint(matchedWord: string \| undefined, cand: RawCandidate): string` | matchedWord: string \| undefined, cand: RawCandidate | string | 209 | Pick a readable base name from a vocab hit or the most descriptive locator. |

#### Class: CandidateScorer

Line: 62  
Description: Implements the candidate scorer class. It performs file-system work, parses structured configuration or artifact data.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `loadConfig` | `static loadConfig(configPath?: string): ScorerConfig` | configPath?: string | ScorerConfig | 63 | Implements the load config method. It performs file-system work, parses structured configuration or artifact data. |
| `score` | `static score( candidates: RawCandidate[], indexed: IndexedValues, options: ScoreOptions =` | candidates: RawCandidate[], indexed: IndexedValues, options: ScoreOptions = {} | ScoredCandidate[] | 78 | Implements the score method. |


### core_engine/src/correlation/CorrelationEngine.ts

Layer: correlation  
Lines: 58  
Purpose: CorrelationEngine implementation.

Imports:
- `import { K6ResponseLike } from './ExtractorRegistry';`
- `import { CorrelationRule } from './RuleProcessor';`
- `import { ExtractorRegistry } from './ExtractorRegistry';`
- `import { FallbackHandler } from './FallbackHandler';`
- `import { Logger } from '../utils/logger';`

Exports: `CorrelationEngine`

#### Class: CorrelationEngine

Line: 7  
Description: Process an HTTP response, attempting to extract metrics matching the rules.

| Property | Type | Line | Description |
|---|---|---:|---|
| `store` | Map<string, string> | 8 | Class state or configuration value used by the class methods. |
| `rules` | CorrelationRule[] | 9 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `constructor` | `constructor(rules: CorrelationRule[])` | rules: CorrelationRule[] | Inferred | 11 | Implements the constructor method. |
| `process` | `process(res: K6ResponseLike): void` | res: K6ResponseLike | void | 18 | Process an HTTP response, attempting to extract metrics matching the rules. |
| `get` | `get(name: string): string \| undefined` | name: string | string \| undefined | 43 | Safe retrieval of an extracted token. |
| `dump` | `dump(): Record<string, string>` | None | Record<string, string> | 50 | Dump all values (useful for debugging). |


### core_engine/src/correlation/CorrelationManifest.ts

Layer: correlation  
Lines: 133  
Purpose: CorrelationManifest implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`

Exports: `RecordingHeader`, `RecordingCookie`, `RecordingRequest`, `RecordingResponse`, `RecordingExchange`, `CorrelationConfidence`, `ProducerSource`, `ExtractorKind`, `ConsumerLocation`, `CorrelationProducer`, `CorrelationConsumer`, `CorrelationCandidate`, `CorrelationPlan`, `CorrelationManifest`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `RecordingHeader` | Interface | 17 | Defines the RecordingHeader contract used by the framework. |
| `RecordingCookie` | Interface | 22 | Defines the RecordingCookie contract used by the framework. |
| `RecordingRequest` | Interface | 27 | Defines the RecordingRequest contract used by the framework. |
| `RecordingResponse` | Interface | 36 | Defines the RecordingResponse contract used by the framework. |
| `RecordingExchange` | Interface | 48 | One recorded request/response exchange in recording order. `id` mirrors the generator's `replay.id` (`req_1`, `req_2`, …) so the script writer can anchor captures and substitutions to specific requests. |
| `CorrelationConfidence` | TypeAlias | 57 | Defines the CorrelationConfidence contract used by the framework. |
| `ProducerSource` | TypeAlias | 58 | Defines the ProducerSource contract used by the framework. |
| `ExtractorKind` | TypeAlias | 59 | Defines the ExtractorKind contract used by the framework. |
| `ConsumerLocation` | TypeAlias | 60 | Defines the ConsumerLocation contract used by the framework. |
| `CorrelationProducer` | Interface | 62 | Recording request whose RESPONSE produced the value (e.g. 'req_1'). |
| `CorrelationConsumer` | Interface | 74 | Recording request that SENT the value (e.g. 'req_2'). |
| `CorrelationCandidate` | Interface | 82 | Generated variable name, `c_`-prefixed and unique within the plan. |
| `CorrelationPlan` | Interface | 98 | Schema/version marker so future manifests can migrate. |

#### Class: CorrelationManifest

Line: 109  
Description: Default manifest path alongside a recording log: <dir>/<base>.correlation.json.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `save` | `static save(plan: CorrelationPlan, outPath: string): void` | plan: CorrelationPlan, outPath: string | void | 110 | Implements the save method. It performs file-system work. |
| `load` | `static load(manifestPath: string): CorrelationPlan` | manifestPath: string | CorrelationPlan | 118 | Implements the load  method. It performs file-system work, parses structured configuration or artifact data. |
| `defaultPathForScript` | `static defaultPathForScript(scriptPath: string, recordingsDir: string): string` | scriptPath: string, recordingsDir: string | string | 128 | Default manifest path alongside a recording log: <dir>/<base>.correlation.json. |


### core_engine/src/correlation/CorrelationScanner.ts

Layer: correlation  
Lines: 57  
Purpose: CorrelationScanner implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { RecordingExchange, CorrelationPlan } from './CorrelationManifest';`
- `import { ValueIndexer } from './ValueIndexer';`
- `import { LinkMatcher } from './LinkMatcher';`
- `import { CandidateScorer } from './CandidateScorer';`
- `import { ExtractorSynthesizer } from './ExtractorSynthesizer';`

Exports: `ScanOptions`, `CorrelationScanner`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `ScanOptions` | Interface | 19 | Provenance string stored in the manifest (har path / recording-log path). |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `DEFAULT_CONFIG_PATH` | Inferred | 28 | Module-level constant or configuration value. |

#### Class: CorrelationScanner

Line: 32  
Description: Implements the correlation scanner class. It performs file-system work.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `scan` | `static scan(exchanges: RecordingExchange[], options: ScanOptions =` | exchanges: RecordingExchange[], options: ScanOptions = {} | CorrelationPlan | 33 | Implements the scan method. |
| `resolveDefaultConfigPath` | `private static resolveDefaultConfigPath(): string \| undefined` | None | string \| undefined | 52 | Implements the resolve default config path method. It performs file-system work. |


### core_engine/src/correlation/ExtractorRegistry.ts

Layer: correlation  
Lines: 92  
Purpose: ExtractorRegistry implementation.

Exports: `K6ResponseLike`, `ExtractorFn`, `ExtractorRegistry`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `K6ResponseLike` | Interface | 11 | ExtractorRegistry.ts Phase 3 – Pluggable extractors for correlation. NOTE: This module defines types compatible with k6's RefinedResponse at runtime. Since the core engine compiles under Node (not k6), we use a generic response interface that mirrors the k6 response shape. At runtime inside k6, the actual k6 response objects are passed in and work transparently. |
| `ExtractorFn` | TypeAlias | 18 | Defines the ExtractorFn contract used by the framework. |

#### Class: ExtractorRegistry

Line: 20  
Description: Implements the extractor registry class.

| Property | Type | Line | Description |
|---|---|---:|---|
| `extractors` | Map<string, ExtractorFn> | 21 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `register` | `static register(type: string, fn: ExtractorFn): void` | type: string, fn: ExtractorFn | void | 23 | Implements the register method. |
| `get` | `static get(type: string): ExtractorFn \| undefined` | type: string | ExtractorFn \| undefined | 27 | Implements the get  method. |


### core_engine/src/correlation/ExtractorSynthesizer.ts

Layer: correlation  
Lines: 189  
Purpose: ExtractorSynthesizer implementation.

Imports:
- `import { ScoredCandidate } from './CandidateScorer';`
- `import {
 RecordingExchange,
 CorrelationCandidate,
 CorrelationConsumer,
 ExtractorKind,
} from './CorrelationManifest';`

Exports: `ExtractorSynthesizer`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `sanitizeIdentifier` | `function sanitizeIdentifier(raw: string): string` | raw: string | string | 98 | Implements the sanitize identifier function. |
| `escapeRegex` | `function escapeRegex(s: string): string` | s: string | string | 105 | Implements the escape regex function. |
| `semanticHtmlBoundary` | `function semanticHtmlBoundary(body: string, field: string, value: string):` | body: string, field: string, value: string | { left: string; right: string } \| null | 121 | Build a left/right boundary that locates `value` in `body`. Grows the left boundary until the (lb, rb) pair uniquely points at the value; falls back to the shortest boundary whose first match is the value. |
| `synthesizeBoundary` | `function synthesizeBoundary(body: string, value: string):` | body: string, value: string | { left: string; right: string } \| null | 136 | Implements the synthesize boundary function. |
| `locateWithBoundary` | `function locateWithBoundary( body: string, left: string, right: string, ):` | body: string, left: string, right: string | { count: number; firstValue: string \| null } | 159 | Implements the locate with boundary function. |
| `buildRegexFallback` | `function buildRegexFallback(body: string, value: string): string` | body: string, value: string | string | 182 | Implements the build regex fallback function. |

#### Class: ExtractorSynthesizer

Line: 21  
Description: Implements the extractor synthesizer class.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `synthesize` | `static synthesize(scored: ScoredCandidate[], exchanges: RecordingExchange[]): CorrelationCandidate[]` | scored: ScoredCandidate[], exchanges: RecordingExchange[] | CorrelationCandidate[] | 22 | Implements the synthesize method. |
| `chooseExtractor` | `private static chooseExtractor( cand: ScoredCandidate, exchanges: RecordingExchange[], ):` | cand: ScoredCandidate, exchanges: RecordingExchange[] | { extractor: ExtractorKind; locator: string } | 56 | Implements the choose extractor method. |
| `uniqueName` | `private static uniqueName(hint: string, used: Set<string>): string` | hint: string, used: Set<string> | string | 85 | Implements the unique name method. |


### core_engine/src/correlation/FallbackHandler.ts

Layer: correlation  
Lines: 21  
Purpose: FallbackHandler implementation.

Imports:
- `import { CorrelationRule } from './RuleProcessor';`
- `import { Logger } from '../utils/logger';`

Exports: `FallbackHandler`

#### Class: FallbackHandler

Line: 4  
Description: Executes the appropriate fallback strategy when correlation extraction fails.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `handle` | `static handle(rule: CorrelationRule): string` | rule: CorrelationRule | string | 8 | Executes the appropriate fallback strategy when correlation extraction fails. |


### core_engine/src/correlation/LinkMatcher.ts

Layer: correlation  
Lines: 89  
Purpose: LinkMatcher implementation.

Imports:
- `import { ProducerOccurrence, ConsumerOccurrence, IndexedValues } from './ValueIndexer';`
- `import { ProducerSource } from './CorrelationManifest';`

Exports: `RawCandidate`, `LinkMatcher`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `RawCandidate` | Interface | 15 | Defines the RawCandidate contract used by the framework. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `SOURCE_PRIORITY` | Record<ProducerSource, number> | 22 | Capture robustness order — lower is preferred when several producers tie. |

#### Class: LinkMatcher

Line: 29  
Description: Among producers of a value, return the one in the latest exchange strictly before `consumerIndex`. Ties at the same exchange break by source priority.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `match` | `static match(indexed: IndexedValues): RawCandidate[]` | indexed: IndexedValues | RawCandidate[] | 30 | Implements the match method. |
| `pickNearestPreceding` | `private static pickNearestPreceding( prods: ProducerOccurrence[], consumerIndex: number, ): ProducerOccurrence \| undefined` | prods: ProducerOccurrence[], consumerIndex: number | ProducerOccurrence \| undefined | 72 | Among producers of a value, return the one in the latest exchange strictly before `consumerIndex`. Ties at the same exchange break by source priority. |


### core_engine/src/correlation/RuleProcessor.ts

Layer: correlation  
Lines: 33  
Purpose: RuleProcessor implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`

Exports: `CorrelationRule`, `RuleProcessor`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `CorrelationRule` | Interface | 4 | Defines the CorrelationRule contract used by the framework. |

#### Class: RuleProcessor

Line: 14  
Description: Load JSON correlation rules from a specified file path.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `loadRules` | `static loadRules(filePath: string): CorrelationRule[]` | filePath: string | CorrelationRule[] | 18 | Load JSON correlation rules from a specified file path. |


### core_engine/src/correlation/ScriptCorrelationWriter.ts

Layer: correlation  
Lines: 335  
Purpose: ScriptCorrelationWriter implementation.

Imports:
- `import {
 CorrelationPlan,
 CorrelationCandidate,
 CorrelationConfidence,
 ExtractorKind,
} from './CorrelationManifest';`

Exports: `ApplyResult`, `ApplyOptions`, `ScriptCorrelationWriter`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `RequestCall` | Interface | 25 | Offset of the statement start (the `const`/resVar token). |
| `ApplyResult` | Interface | 37 | Defines the ApplyResult contract used by the framework. |
| `ApplyOptions` | Interface | 43 | Confidence bands to apply when a candidate's own `apply` flag is not already true. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `EXTRACT_FN` | Record<ExtractorKind, string> | 48 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `buildExtractCall` | `function buildExtractCall(resVar: string, extractor: ExtractorKind, locator: string): string` | resVar: string, extractor: ExtractorKind, locator: string | string | 245 | Implements the build extract call function. It orchestrates process execution. |
| `rewriteStringLiterals` | `function rewriteStringLiterals(block: string, value: string, cvar: string):` | block: string, value: string, cvar: string | { text: string; count: number } | 272 | Rewrite string literals in `block` that contain `value`, replacing the value with `${cvar}`. Double-quoted literals are converted to template literals; existing template literals get an in-place substitution. Returns the new text and the number of literals rewritten. |
| `matchParen` | `function matchParen(src: string, openIdx: number): number` | src: string, openIdx: number | number | 295 | Find the matching `)` for the `(` at openIdx, ignoring string contents. |
| `leadingIndent` | `function leadingIndent(source: string, offset: number): string` | source: string, offset: number | string | 317 | Implements the leading indent function. |
| `insertAfterImports` | `function insertAfterImports(source: string, insertion: string): string` | source: string, insertion: string | string | 325 | Implements the insert after imports function. |

#### Class: ScriptCorrelationWriter

Line: 56  
Description: Locate every `[const|let] resVar = request(...)` call and tag it by replay id.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `apply` | `static apply(source: string, plan: CorrelationPlan, options: ApplyOptions =` | source: string, plan: CorrelationPlan, options: ApplyOptions = {} | ApplyResult | 57 | Implements the apply method. |
| `shouldApply` | `private static shouldApply(cand: CorrelationCandidate, applyLevels: Set<CorrelationConfidence>): boolean` | cand: CorrelationCandidate, applyLevels: Set<CorrelationConfidence> | boolean | 156 | Implements the should apply method. |
| `indexRequestCalls` | `private static indexRequestCalls(source: string): RequestCall[]` | source: string | RequestCall[] | 161 | Locate every `[const\|let] resVar = request(...)` call and tag it by replay id. |
| `injectDeclarations` | `private static injectDeclarations(source: string, names: string[]): string` | source: string, names: string[] | string | 193 | Implements the inject declarations method. |
| `injectImports` | `private static injectImports(source: string, needed: Set<string>): string` | source: string, needed: Set<string> | string | 213 | Implements the inject imports method. It orchestrates process execution, emits operator-facing output. |


### core_engine/src/correlation/ValueIndexer.ts

Layer: correlation  
Lines: 311  
Purpose: ValueIndexer implementation.

Imports:
- `import {
 RecordingExchange,
 ProducerSource,
 ConsumerLocation,
} from './CorrelationManifest';`

Exports: `ProducerOccurrence`, `ConsumerOccurrence`, `IndexedValues`, `ValueIndexer`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `ProducerOccurrence` | Interface | 17 | json dot-path, header name, cookie name, or html field name. |
| `ConsumerOccurrence` | Interface | 26 | header name, query key, json path, or 'path'. |
| `IndexedValues` | Interface | 35 | Defines the IndexedValues contract used by the framework. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `MIN_VALUE_LEN` | Inferred | 41 | Min/max value length we bother indexing. Below 4 is noise; above 1024 is a blob. |
| `MAX_VALUE_LEN` | Inferred | 42 | Module-level constant or configuration value. |
| `STATIC_REQUEST_HEADERS` | Inferred | 45 | Request headers that are never correlation targets — skip to cut noise. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `isIndexableValue` | `function isIndexableValue(raw: unknown): raw is string \| number` | raw: unknown | raw is string \| number | 52 | Implements the is indexable value function. |
| `looksLikeHtml` | `function looksLikeHtml(body: string): boolean` | body: string | boolean | 59 | Implements the looks like html function. |
| `tryParseJson` | `function tryParseJson(body: string \| undefined): unknown` | body: string \| undefined | unknown | 64 | Implements the try parse json function. It parses structured configuration or artifact data. |
| `walkJson` | `function walkJson( value: unknown, basePath: string, emit: (path: string, value: string) => void, depth = 0, ): void` | value: unknown, basePath: string, emit: (path: string, value: string) => void, depth = 0 | void | 76 | Walk a parsed JSON value, emitting (dotPath, value) for every primitive leaf. |
| `tryParseForm` | `function tryParseForm(body: string \| undefined): Array<` | body: string \| undefined | Array<{ key: string; value: string }> \| null | 97 | Parse `a=1&b=2` form-encoded bodies into pairs. Returns null when not form-shaped. |
| `decodeSafe` | `function decodeSafe(s: string): string` | s: string | string | 113 | Implements the decode safe function. |
| `extractHtmlTokens` | `function extractHtmlTokens(body: string): Array<` | body: string | Array<{ field: string; value: string }> | 122 | Extract (name, value) pairs from HTML hidden inputs and CSRF meta tags. |
| `subTokens` | `function subTokens(value: string): string[]` | value: string | string[] | 155 | Split a composite header value into candidate sub-tokens so an embedded dynamic value is matchable on its own. Splits on whitespace/`;`/`,` and also takes the part after a `key=value` separator. e.g. `Bearer <jwt>` → ['<jwt>']. |
| `parseCookieHeader` | `function parseCookieHeader(value: string): Array<` | value: string | Array<{ name: string; value: string }> | 170 | Implements the parse cookie header function. |
| `parseQuery` | `function parseQuery(urlOrQuery: string): Array<` | urlOrQuery: string | Array<{ key: string; value: string }> | 300 | Implements the parse query function. |

#### Class: ValueIndexer

Line: 181  
Description: Implements the value indexer class.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `index` | `static index(exchanges: RecordingExchange[]): IndexedValues` | exchanges: RecordingExchange[] | IndexedValues | 182 | Implements the index method. |
| `indexProducers` | `private static indexProducers( ex: RecordingExchange, exchangeIndex: number, out: ProducerOccurrence[], ): void` | ex: RecordingExchange, exchangeIndex: number, out: ProducerOccurrence[] | void | 194 | Implements the index producers method. |
| `indexConsumers` | `private static indexConsumers( ex: RecordingExchange, exchangeIndex: number, out: ConsumerOccurrence[], ): void` | ex: RecordingExchange, exchangeIndex: number, out: ConsumerOccurrence[] | void | 243 | Implements the index consumers method. |


### core_engine/src/data/DataFactory.ts

Layer: data  
Lines: 140  
Purpose: DataFactory implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`

Exports: `DataRow`, `LoadedDataset`, `DataFactory`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `DataRow` | TypeAlias | 14 | Defines the DataRow contract used by the framework. |
| `LoadedDataset` | Interface | 16 | Defines the LoadedDataset contract used by the framework. |

#### Class: DataFactory

Line: 22  
Description: Load a CSV file into an array of row objects. First row is treated as header. Supports quoted fields and comma-separated values.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `loadCSV` | `static loadCSV(filePath: string, datasetName?: string): LoadedDataset` | filePath: string, datasetName?: string | LoadedDataset | 28 | Load a CSV file into an array of row objects. First row is treated as header. Supports quoted fields and comma-separated values. |
| `loadJSON` | `static loadJSON(filePath: string, datasetName?: string): LoadedDataset` | filePath: string, datasetName?: string | LoadedDataset | 62 | Load a JSON array file. |
| `load` | `static load(filePath: string, datasetName?: string): LoadedDataset` | filePath: string, datasetName?: string | LoadedDataset | 90 | Auto-detect file type and load accordingly. |
| `parseCSVRow` | `private static parseCSVRow(row: string): string[]` | row: string | string[] | 105 | Parse a single CSV row respecting quoted fields |
| `coerceValue` | `private static coerceValue(value: string): string \| number \| boolean \| null` | value: string | string \| number \| boolean \| null | 131 | Attempt to coerce a string cell value to a native type |


### core_engine/src/data/DataPoolManager.ts

Layer: data  
Lines: 131  
Purpose: DataPoolManager implementation.

Imports:
- `import { DataOverflowStrategy } from '../types/TestPlanSchema';`
- `import { DataRow as FactoryDataRow } from './DataFactory';`

Exports: `export { DataOverflowStrategy };`, `PoolConfig`, `DataPoolManager`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `PoolConfig` | Interface | 16 | Name of this pool (for logging) |

#### Class: DataPoolManager

Line: 25  
Description: Register a data pool by name.

| Property | Type | Line | Description |
|---|---|---:|---|
| `pools` | Map<string, PoolConfig> | 26 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `registerPool` | `registerPool(config: PoolConfig): void` | config: PoolConfig | void | 31 | Register a data pool by name. |
| `getRowForVU` | `getRowForVU(poolName: string, vuIndex: number): FactoryDataRow` | poolName: string, vuIndex: number | FactoryDataRow | 44 | Get a data row for a specific VU. |
| `getRowForIteration` | `getRowForIteration(poolName: string, vuIndex: number, iteration: number): FactoryDataRow` | poolName: string, vuIndex: number, iteration: number | FactoryDataRow | 82 | Get an iteration-based row (use __ITER in k6 scripts). Each iteration of a VU gets the next row in sequence. |
| `getPoolStats` | `getPoolStats(poolName: string):` | poolName: string | { name: string; rowCount: number; strategy: string } \| undefined | 98 | Get pool statistics (for logging / validation). |
| `listPools` | `listPools(): string[]` | None | string[] | 105 | List all registered pool names |
| `resolveIndex` | `private resolveIndex( index: number, rowCount: number, name: string, strategy: DataOverflowStrategy, rows: FactoryDataRow[], ): FactoryDataRow` | index: number, rowCount: number, name: string, strategy: DataOverflowStrategy, rows: FactoryDataRow[] | FactoryDataRow | 110 | Implements the resolve index method. |


### core_engine/src/data/DataValidator.ts

Layer: data  
Lines: 145  
Purpose: DataValidator implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`

Exports: `DataValidationResult`, `DataValidator`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `DataValidationResult` | Interface | 10 | Defines the DataValidationResult contract used by the framework. |

#### Class: DataValidator

Line: 18  
Description: Validate a CSV data file.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `validateCSV` | `static validateCSV( filePath: string, requiredColumns: string[] = [], expectedMinRows = 0, ): DataValidationResult` | filePath: string, requiredColumns: string[] = [], expectedMinRows = 0 | DataValidationResult | 25 | Validate a CSV data file. |
| `validateJSON` | `static validateJSON( filePath: string, requiredKeys: string[] = [], expectedMinRows = 0, ): DataValidationResult` | filePath: string, requiredKeys: string[] = [], expectedMinRows = 0 | DataValidationResult | 87 | Validate a JSON array data file. |
| `printResult` | `static printResult(result: DataValidationResult): void` | result: DataValidationResult | void | 134 | Print a validation result to console |


### core_engine/src/data/DynamicValueFactory.ts

Layer: data  
Lines: 95  
Purpose: DynamicValueFactory implementation.

Exports: `DynamicValueFactory`

#### Class: DynamicValueFactory

Line: 7  
Description: DynamicValueFactory.ts Phase 1 – Built-in helpers for common dynamic data needs. These are pure, stateless utility functions usable in any script.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `timestamp` | `static timestamp(format = 'YYYY-MM-DD HH:mm:ss'): string` | format = 'YYYY-MM-DD HH:mm:ss' | string | 13 | Generate a timestamp string in a specified format. Tokens: YYYY, MM, DD, HH, mm, ss, ms Example: timestamp('YYYY-MM-DD_HH-mm-ss') -> '2026-03-21_14-30-00' |
| `uuid` | `static uuid(): string` | None | string | 29 | Generate a UUID v4 (random). Does not require external libraries — uses crypto.randomUUID when available. |
| `randomInt` | `static randomInt(min: number, max: number): number` | min: number, max: number | number | 44 | Generate a random integer between min and max (inclusive). |
| `randomString` | `static randomString(length: number): string` | length: number | string | 51 | Generate a random alphanumeric string of a given length. |
| `randomEmail` | `static randomEmail(prefix = 'user', domain = 'perf-test.local'): string` | prefix = 'user', domain = 'perf-test.local' | string | 60 | Generate a random email address with a given prefix and domain. Example: randomEmail('testuser', 'example.com') -> 'testuser_a3k2@example.com' |
| `randomPhone` | `static randomPhone(pattern = '07########'): string` | pattern = '07########' | string | 69 | Generate a random phone number string matching a pattern. '#' characters are replaced with random digits. Example: randomPhone('+44 07### ######') -> '+44 07123 456789' |
| `pickRandom` | `static pickRandom<T>(items: T[]): T` | items: T[] | T | 76 | Pick a random element from an array. |
| `epochMs` | `static epochMs(): number` | None | number | 84 | Epoch timestamp in milliseconds. |
| `epochSecs` | `static epochSecs(): number` | None | number | 91 | Epoch timestamp in seconds. |


### core_engine/src/debug/DiffChecker.ts

Layer: debug  
Lines: 643  
Purpose: DiffChecker implementation.

Imports:
- `import { HAREntry } from '../types/HARContracts';`
- `import { TaggedExchangeLogEntry, VariableEvent } from './ExchangeLog';`

Exports: `HeaderDiffEntry`, `BodyDiffResult`, `SideSnapshot`, `DiffResult`, `DiffChecker`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `HeaderDiffEntry` | Interface | 4 | Defines the HeaderDiffEntry contract used by the framework. |
| `BodyDiffResult` | Interface | 11 | Defines the BodyDiffResult contract used by the framework. |
| `SideSnapshot` | Interface | 19 | k6 transport-error reason when status is 0 (timeout / reset / refused). |
| `DiffResult` | Interface | 35 | Defines the DiffResult contract used by the framework. |
| `ReplayComparisonContext` | Interface | 60 | Defines the ReplayComparisonContext contract used by the framework. |
| `ReplayProjection` | Interface | 72 | Defines the ReplayProjection contract used by the framework. |

#### Class: DiffChecker

Line: 77  
Description: Implements the diff checker class. It performs file-system work, orchestrates process execution.

| Property | Type | Line | Description |
|---|---|---:|---|
| `LARGE_BODY_THRESHOLD` | Inferred | 78 | Class state or configuration value used by the class methods. |
| `REDIRECT_STATUSES` | Inferred | 79 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `compare` | `static compare(original: HAREntry, replay: Partial<HAREntry>): DiffResult` | original: HAREntry, replay: Partial<HAREntry> | DiffResult | 81 | Implements the compare method. |
| `compareBatch` | `static compareBatch(originalEntries: HAREntry[], replayEntries: Partial<HAREntry>[]): DiffResult[]` | originalEntries: HAREntry[], replayEntries: Partial<HAREntry>[] | DiffResult[] | 85 | Implements the compare batch method. |
| `compareTaggedLogs` | `static compareTaggedLogs( recordedLogs: TaggedExchangeLogEntry[] \| null \| undefined, replayLogs: Partial<TaggedExchangeLogEntry>[], options?:` | recordedLogs: TaggedExchangeLogEntry[] \| null \| undefined, replayLogs: Partial<TaggedExchangeLogEntry>[], options?: { missingRecordingWarning?: string } | DiffResult[] | 108 | Implements the compare tagged logs method. |
| `compareWithContext` | `private static compareWithContext( original: HAREntry, replay: Partial<HAREntry>, context: ReplayComparisonContext, ): DiffResult` | original: HAREntry, replay: Partial<HAREntry>, context: ReplayComparisonContext | DiffResult | 182 | Implements the compare with context method. It orchestrates process execution. |
| `diffHeaders` | `private static diffHeaders( recordedHeaders:` | recordedHeaders: { name: string; value: string }[] = [], replayedHeaders: { name: string; value: string }[] = [] | HeaderDiffEntry[] | 278 | Implements the diff headers method. |
| `diffBodies` | `private static diffBodies(recordedBody?: string, replayedBody?: string): BodyDiffResult` | recordedBody?: string, replayedBody?: string | BodyDiffResult | 306 | Implements the diff bodies method. |
| `headersMatch` | `private static headersMatch(diffs: HeaderDiffEntry[]): boolean` | diffs: HeaderDiffEntry[] | boolean | 363 | Implements the headers match method. It performs file-system work. |
| `scorePercent` | `private static scorePercent(checks: boolean[]): number` | checks: boolean[] | number | 367 | Implements the score percent method. |
| `calculateStringSimilarity` | `private static calculateStringSimilarity(a: string, b: string): number` | a: string, b: string | number | 373 | Implements the calculate string similarity method. |
| `calculateLargeBodySimilarity` | `private static calculateLargeBodySimilarity(a: string, b: string): number` | a: string, b: string | number | 383 | Implements the calculate large body similarity method. |
| `sharedPrefixLength` | `private static sharedPrefixLength(a: string, b: string): number` | a: string, b: string | number | 400 | Implements the shared prefix length method. |
| `sharedSuffixLength` | `private static sharedSuffixLength(a: string, b: string, prefixLength: number): number` | a: string, b: string, prefixLength: number | number | 409 | Implements the shared suffix length method. |
| `sampledBodyMatchRatio` | `private static sampledBodyMatchRatio(a: string, b: string): number` | a: string, b: string | number | 423 | Implements the sampled body match ratio method. |
| `sampleWindow` | `private static sampleWindow(value: string, checkpoint: number, windowSize: number): string` | value: string, checkpoint: number, windowSize: number | string | 444 | Implements the sample window method. |
| `levenshteinDistance` | `private static levenshteinDistance(a: string, b: string): number` | a: string, b: string | number | 451 | Implements the levenshtein distance method. |
| `toHAREntry` | `private static toHAREntry(entry: TaggedExchangeLogEntry): HAREntry` | entry: TaggedExchangeLogEntry | HAREntry | 473 | Implements the to harentry method. |
| `toReplayProjection` | `private static toReplayProjection(entry: Partial<TaggedExchangeLogEntry>): ReplayProjection` | entry: Partial<TaggedExchangeLogEntry> | ReplayProjection | 503 | Implements the to replay projection method. |
| `extractHost` | `private static extractHost(url: string): string` | url: string | string | 548 | Implements the extract host method. |
| `findReplayFallback` | `private static findReplayFallback( original: HAREntry, candidates: ReplayProjection[], ): ReplayProjection \| undefined` | original: HAREntry, candidates: ReplayProjection[] | ReplayProjection \| undefined | 556 | Implements the find replay fallback method. |
| `compareReplayOnly` | `private static compareReplayOnly( replay: ReplayProjection, missingRecordingWarning?: string, iteration?: number, ): DiffResult` | replay: ReplayProjection, missingRecordingWarning?: string, iteration?: number | DiffResult | 565 | Implements the compare replay only method. |
| `groupReplayByIteration` | `private static groupReplayByIteration( replayLogs: Partial<TaggedExchangeLogEntry>[], ): Map<number, ReplayProjection[]>` | replayLogs: Partial<TaggedExchangeLogEntry>[] | Map<number, ReplayProjection[]> | 623 | Implements the group replay by iteration method. |


### core_engine/src/debug/ExchangeLog.ts

Layer: debug  
Lines: 207  
Purpose: ExchangeLogBuilder implementation.

Imports:
- `import { TransactionGroup } from '../recording/TransactionGrouper';`
- `import { HAREntry } from '../types/HARContracts';`

Exports: `ExchangeLogHeader`, `ExchangeLogCookie`, `ExchangeLogParams`, `ExchangeLogRequest`, `ExchangeLogResponse`, `VariableEvent`, `TaggedExchangeLogEntry`, `ExchangeLogBuilder`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `ExchangeLogHeader` | Interface | 4 | Defines the ExchangeLogHeader contract used by the framework. |
| `ExchangeLogCookie` | Interface | 9 | Defines the ExchangeLogCookie contract used by the framework. |
| `ExchangeLogParams` | Interface | 14 | Defines the ExchangeLogParams contract used by the framework. |
| `ExchangeLogRequest` | Interface | 18 | Defines the ExchangeLogRequest contract used by the framework. |
| `ExchangeLogResponse` | Interface | 27 | k6 transport-error reason when status is 0 (timeout / reset / refused). |
| `VariableEvent` | Interface | 38 | Defines the VariableEvent contract used by the framework. |
| `TaggedExchangeLogEntry` | Interface | 46 | Defines the TaggedExchangeLogEntry contract used by the framework. |

#### Class: ExchangeLogBuilder

Line: 64  
Description: Implements the exchange log builder class.

| Property | Type | Line | Description |
|---|---|---:|---|
| `BINARY_CONTENT_RE` | Inferred | 104 | Class state or configuration value used by the class methods. |
| `BINARY_MIME_TYPES` | Inferred | 105 | Class state or configuration value used by the class methods. |
| `STATIC_EXT_RE` | Inferred | 111 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `fromGroups` | `static fromGroups(groups: TransactionGroup[]): TaggedExchangeLogEntry[]` | groups: TransactionGroup[] | TaggedExchangeLogEntry[] | 65 | Implements the from groups method. |
| `fromEntries` | `static fromEntries(entries: HAREntry[]): TaggedExchangeLogEntry[]` | entries: HAREntry[] | TaggedExchangeLogEntry[] | 71 | Implements the from entries method. |
| `fromHAREntry` | `static fromHAREntry(entry: HAREntry, transactionName: string): TaggedExchangeLogEntry` | entry: HAREntry, transactionName: string | TaggedExchangeLogEntry | 75 | Implements the from harentry method. |
| `isBinaryContent` | `private static isBinaryContent(mimeType?: string, url?: string): string \| null` | mimeType?: string, url?: string | string \| null | 113 | Implements the is binary content method. |
| `normalizeBody` | `private static normalizeBody(body?: string, encoding?: string, mimeType?: string, url?: string): string \| undefined` | body?: string, encoding?: string, mimeType?: string, url?: string | string \| undefined | 126 | Implements the normalize body method. |
| `buildRequestBody` | `private static buildRequestBody(postData?: HAREntry['postData']): string \| undefined` | postData?: HAREntry['postData'] | string \| undefined | 147 | Implements the build request body method. |
| `looksReadable` | `private static looksReadable(value: string): boolean` | value: string | boolean | 161 | Implements the looks readable method. |
| `extractQueryParams` | `private static extractQueryParams(url: string): ExchangeLogParams` | url: string | ExchangeLogParams | 172 | Implements the extract query params method. |
| `extractCookies` | `private static extractCookies( headers: ExchangeLogHeader[], headerName: 'cookie' \| 'set-cookie', ): ExchangeLogCookie[]` | headers: ExchangeLogHeader[], headerName: 'cookie' \| 'set-cookie' | ExchangeLogCookie[] | 185 | Implements the extract cookies method. |


### core_engine/src/debug/HTMLDiffReporter.ts

Layer: debug  
Lines: 1971  
Purpose: HTMLDiffReporter implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { DiffResult } from './DiffChecker';`
- `import { K6Metrics } from './ReplayRunner';`

Exports: `ReportOptions`, `HTMLDiffReporter`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `ReportOptions` | Interface | 6 | Resolved runtime config block (http / thinkTime / pacing / reporting / errors) the framework injected for this debug run. Rendered in the "Advanced Settings & Configuration" panel so debug mirrors the run report. |
| `ReportPayload` | Interface | 29 | False when the replay had no recording log to diff against — scores are meaningless and suppressed. |

#### Class: HTMLDiffReporter

Line: 52  
Description: Implements the htmldiff reporter class. It performs file-system work, orchestrates process execution, parses structured configuration or artifact data, enforces validation rules, emits operator-facing output.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `generateReport` | `static generateReport(results: DiffResult[], outPath: string, options?: ReportOptions): void` | results: DiffResult[], outPath: string, options?: ReportOptions | void | 53 | Implements the generate report method. It performs file-system work, orchestrates process execution, parses structured configuration or artifact data, enforces validation rules, emits operator-facing output. |
| `buildPayload` | `private static buildPayload(results: DiffResult[], options?: ReportOptions): ReportPayload` | results: DiffResult[], options?: ReportOptions | ReportPayload | 1879 | Implements the build payload method. It orchestrates process execution. |
| `hasMismatch` | `private static hasMismatch(result: DiffResult): boolean` | result: DiffResult | boolean | 1917 | Implements the has mismatch method. It performs file-system work. |
| `resolveStatus` | `private static resolveStatus( overallScore: number, missingCount: number, replayOnlyCount: number, mismatchCount: number, errorCount: number, ): ReportPayload['summary']['status']` | overallScore: number, missingCount: number, replayOnlyCount: number, mismatchCount: number, errorCount: number | ReportPayload['summary']['status'] | 1929 | Implements the resolve status method. |
| `findWorstTransaction` | `private static findWorstTransaction(results: DiffResult[]): string` | results: DiffResult[] | string | 1941 | Implements the find worst transaction method. |
| `average` | `private static average(values: number[]): number` | values: number[] | number | 1962 | Implements the average method. |
| `countWarnings` | `private static countWarnings(results: DiffResult[]): number` | results: DiffResult[] | number | 1967 | Implements the count warnings method. |


### core_engine/src/debug/RecordingLogResolver.ts

Layer: debug  
Lines: 189  
Purpose: RecordingLogResolver implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`

Exports: `RecordingIndexEntry`, `RecordingLogResolution`, `RecordingLogResolver`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `RecordingIndexEntry` | Interface | 4 | Defines the RecordingIndexEntry contract used by the framework. |
| `RecordingLogResolution` | Interface | 11 | Defines the RecordingLogResolution contract used by the framework. |

#### Class: RecordingLogResolver

Line: 21  
Description: Implements the recording log resolver class. It performs file-system work, parses structured configuration or artifact data.

| Property | Type | Line | Description |
|---|---|---:|---|
| `REGISTRY_FILE` | Inferred | 22 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `resolve` | `static resolve(scriptPath: string, explicitRecordingLogPath?: string): RecordingLogResolution` | scriptPath: string, explicitRecordingLogPath?: string | RecordingLogResolution | 24 | Implements the resolve  method. It performs file-system work. |
| `upsertRegistryEntry` | `static upsertRegistryEntry(recordingsDir: string, entry: RecordingIndexEntry): void` | recordingsDir: string, entry: RecordingIndexEntry | void | 123 | Implements the upsert registry entry method. It performs file-system work. |
| `getSuiteRecordingContext` | `private static getSuiteRecordingContext(scriptPath: string)` | scriptPath: string | Inferred | 144 | Implements the get suite recording context method. |
| `readRegistry` | `private static readRegistry(registryPath: string): RecordingIndexEntry[]` | registryPath: string | RecordingIndexEntry[] | 172 | Implements the read registry method. It performs file-system work, parses structured configuration or artifact data. |
| `normalizePath` | `private static normalizePath(input: string): string` | input: string | string | 185 | Implements the normalize path method. |


### core_engine/src/debug/ReplayRunner.ts

Layer: debug  
Lines: 943  
Purpose: ReplayRunner implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import * as readline from 'readline';`
- `import { PipelineRunner } from '../execution/PipelineRunner';`
- `import { ScenarioBuilder } from '../scenario/ScenarioBuilder';`
- `import { Logger } from '../utils/logger';`
- `import { startLiveConsoleLogStream } from '../utils/LiveConsoleLogStream';`
- `import { FileWriteSink } from '../execution/FileWriteSink';`
- `import { createSpinner } from '../utils/ProgressBar';`
- `import { DiffChecker, DiffResult } from './DiffChecker';`
- `import { TaggedExchangeLogEntry } from './ExchangeLog';`
- `import { HTMLDiffReporter } from './HTMLDiffReporter';`
- `import { ScriptContractGuard } from '../config/ScriptContractGuard';`
- `import { instrumentVariableTracking } from './VariableInstrumenter';`

Exports: `DebugReplayOptions`, `DebugReplayResult`, `K6MetricRow`, `K6Metrics`, `ReplayRunner`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `DebugReplayOptions` | Interface | 33 | Team environment configs (testSuites from the loaded environment file). |
| `DebugReplayResult` | Interface | 63 | Defines the DebugReplayResult contract used by the framework. |
| `K6MetricRow` | Interface | 71 | One metric row with stat values keyed by stat id (e.g. 'avg', 'p(90)'). |
| `K6Metrics` | Interface | 78 | Per-check pass/fail counts (k6 native passes/fails), attributed to the k6 group (transaction). |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `extractTransactionNames` | `function extractTransactionNames(source: string): string[]` | source: string | string[] | 17 | Extract transaction names declared in a script source via transaction() or startTransaction(). |

#### Class: ReplayRunner

Line: 92  
Description: Run a k6 script in debug mode, capture replay logs, compare them to the recording log, and generate an HTML diff report automatically.

| Property | Type | Line | Description |
|---|---|---:|---|
| `REPLAY_PREFIX` | Inferred | 93 | Class state or configuration value used by the class methods. |
| `DEBUG_DEFAULT_STATS` | Inferred | 369 | Stats the debug timing tables always show, regardless of runtime config. |
| `STATIC_EXT_RE` | Inferred | 515 | Class state or configuration value used by the class methods. |
| `INSTRUMENTED_COPY_RE` | Inferred | 578 | Extract k6 runtime error messages from captured stdout/stderr. k6 errors appear as `level=error msg="..."` or `ERRO[xxxx] ...` lines. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `runDebug` | `static async runDebug(options: DebugReplayOptions): Promise<DebugReplayResult>` | options: DebugReplayOptions | Promise<DebugReplayResult> | 99 | Run a k6 script in debug mode, capture replay logs, compare them to the recording log, and generate an HTML diff report automatically. |
| `normalizeStat` | `private static normalizeStat(s: string): string` | s: string | string | 372 | Normalize a stat id, collapsing pN / p(N) percentile notation to `p(N)`. |
| `resolveDebugStats` | `private static resolveDebugStats(configured?: string[]): string[]` | configured?: string[] | string[] | 382 | Resolve the ordered stat columns for the debug report: the fixed defaults (min/avg/max/p90/p95) plus any extra stats the user configured in runtime `reporting.transactionStats`, in config order, de-duplicated. |
| `buildTrendStats` | `private static buildTrendStats(statsColumns: string[]): string[]` | statsColumns: string[] | string[] | 397 | Build the `summaryTrendStats` array k6 needs so the summary-export JSON actually contains every stat we plan to render. Only k6-computable trend stats are forwarded (avg/min/med/max/count and p(N)); pass/fail/std are derived elsewhere or unavailable. The k6 defaults are always included. |
| `extractReplayEntries` | `private static async extractReplayEntries( runResult:` | runResult: { stdout?: string; stderr?: string; stdoutPath?: string; stderrPath?: string }, logFilePath?: string | Promise<TaggedExchangeLogEntry[]> | 407 | Implements the extract replay entries method. It performs file-system work, orchestrates process execution. |
| `collectReplayEntriesFromFile` | `private static async collectReplayEntriesFromFile(filePath: string, entries: TaggedExchangeLogEntry[]): Promise<void>` | filePath: string, entries: TaggedExchangeLogEntry[] | Promise<void> | 438 | Implements the collect replay entries from file method. It performs file-system work. |
| `collectReplayEntriesFromText` | `private static collectReplayEntriesFromText(output: string \| undefined, entries: TaggedExchangeLogEntry[]): void` | output: string \| undefined, entries: TaggedExchangeLogEntry[] | void | 455 | Implements the collect replay entries from text method. |
| `collectReplayEntryFromLine` | `private static collectReplayEntryFromLine(line: string, entries: TaggedExchangeLogEntry[]): void` | line: string, entries: TaggedExchangeLogEntry[] | void | 464 | Implements the collect replay entry from line method. It emits operator-facing output. |
| `extractReplayPayload` | `private static extractReplayPayload(line: string): string \| null` | line: string | string \| null | 478 | Implements the extract replay payload method. It parses structured configuration or artifact data. |
| `parseReplayEntry` | `private static parseReplayEntry(jsonPayload: string): TaggedExchangeLogEntry` | jsonPayload: string | TaggedExchangeLogEntry | 502 | Implements the parse replay entry method. It parses structured configuration or artifact data. |
| `readRecordingLog` | `private static readRecordingLog(filePath: string): TaggedExchangeLogEntry[]` | filePath: string | TaggedExchangeLogEntry[] | 506 | Implements the read recording log method. It performs file-system work, parses structured configuration or artifact data. |
| `normalizeRecordingEntry` | `private static normalizeRecordingEntry(entry: TaggedExchangeLogEntry): TaggedExchangeLogEntry` | entry: TaggedExchangeLogEntry | TaggedExchangeLogEntry | 517 | Implements the normalize recording entry method. |
| `decodeBodyIfNeeded` | `private static decodeBodyIfNeeded(value?: string): string \| undefined` | value?: string | string \| undefined | 532 | Implements the decode body if needed method. |
| `looksLikeBase64` | `private static looksLikeBase64(value: string): boolean` | value: string | boolean | 548 | Implements the looks like base64 method. |
| `looksReadable` | `private static looksReadable(value: string): boolean` | value: string | boolean | 554 | Implements the looks readable method. |
| `writeJson` | `private static writeJson(filePath: string, data: unknown): void` | filePath: string, data: unknown | void | 565 | Implements the write json method. It performs file-system work. |
| `sweepStaleInstrumentedCopies` | `private static sweepStaleInstrumentedCopies(dir: string): void` | dir: string | void | 586 | Delete leftover instrumented debug copies sitting in `dir`. The active run removes its own copy in a `finally`, but a hard process kill (Ctrl+C) or a throw before that block can strand one. Sweeping at the start of every debug run guarantees these never accumulate, regardless of how a prior run ended. |
| `remapInstrumentedRefs` | `private static remapInstrumentedRefs(text: string, copyPath?: string, originalPath?: string): string` | text: string, copyPath?: string, originalPath?: string | string | 606 | Rewrite references to the throwaway instrumented copy back to the user's original script in any k6 output string. The instrumenter only rewrites `${...}` in place — it never adds or removes lines — so line numbers already match the original 1:1; only the FILE is wrong (it names the copy). We swap the unique copy basename for the original's, which covers every path form k6 emits (file:// URL, native path, bare filename) and leaves the `:line:col` suffix intact, so clicking the error jumps to the right line of the real script. No-op when no copy was made (nothing to remap). |
| `extractK6Errors` | `private static extractK6Errors( runResult:` | runResult: { stdout?: string; stderr?: string; stdoutPath?: string; stderrPath?: string }, copyPath?: string, originalPath?: string | string[] | 611 | Implements the extract k6errors method. It performs file-system work, orchestrates process execution, parses structured configuration or artifact data, enforces validation rules. |
| `extractK6Metrics` | `private static extractK6Metrics( summaryExportPath: string, transactionNames: string[] = [], statsColumns: string[] = this.DEBUG_DEFAULT_STATS, ): K6Metrics` | summaryExportPath: string, transactionNames: string[] = [], statsColumns: string[] = this.DEBUG_DEFAULT_STATS | K6Metrics | 685 | Build the diff report's performance-metrics view from k6's `--summary-export` JSON file. We read this file rather than scraping k6's stdout so stdout can stay fully inherited — that's what lets k6 render its animated, in-place progress bar instead of printing one fresh progress line per second. `transactionNames` are the custom transaction metrics declared in the script (via `transaction()` / `startTransaction()`); they let us pick the per-transaction timing Trends out of the otherwise-flat metrics map. |
| `fillStdDevs` | `private static async fillStdDevs(metrics: K6Metrics, streamPath: string): Promise<void>` | metrics: K6Metrics, streamPath: string | Promise<void> | 819 | Compute population std-dev (ms) per metric from the raw k6 `--out json` point stream — k6's summary export doesn't include std. Uses Welford's online algorithm (O(1) memory per metric), matching the live console table's `sqrt(M2/n)`. Fills the 'std' column on each transaction/http row; leaves '-' when a metric had no points. Best-effort — never throws. |
| `fmtDuration` | `private static fmtDuration(ms?: number): string` | ms?: number | string | 858 | Format a millisecond duration the way k6's text summary does (ms vs s). |
| `fmtBytes` | `private static fmtBytes(n?: number): string` | n?: number | string | 864 | Format a byte count into a compact string (B / kB / MB). |
| `defaultReplayLogPath` | `private static defaultReplayLogPath(htmlPath: string): string` | htmlPath: string | string | 871 | Implements the default replay log path method. |
| `extractConsoleLogs` | `private static extractConsoleLogs( runResult:` | runResult: { stdout?: string; stderr?: string; stdoutPath?: string; stderrPath?: string }, copyPath?: string, originalPath?: string | string[] | 881 | Extract user console.log / console.info / console.warn messages from k6 output. k6 emits these as logfmt lines: level=info msg="..." source=console Excludes internal framework prefixes like [k6-perf] and [replay-log]. |


### core_engine/src/debug/VariableInstrumenter.ts

Layer: debug  
Lines: 127  
Purpose: instrumentVariableTracking, classify, sanitize helpers or command handlers.

Exports: `InstrumentResult`, `instrumentVariableTracking`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `InstrumentResult` | Interface | 33 | The rewritten source. Equal to the input when nothing was wrapped. |
| `Classified` | Interface | 40 | Defines the Classified contract used by the framework. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `INTERP_RE` | Inferred | 31 | VariableInstrumenter Debug-time auto-tracking of EVERY interpolated variable (parameter or correlation) so the replay report's variable table shows the real per-iteration value of each `${...}` — without any track* call in the user's script. Why this exists: JavaScript resolves a template literal `${expr}` into a plain string BEFORE request() is ever called, so at runtime the framework only sees the final value (e.g. "fish") — never the expression or the variable name it came from. The only place the name is still known is the interpolation site in the source. So at debug time the runner rewrites each `${expr}` on a throwaway COPY of the script to: ${__k6PerfTrackVar("name", (expr), "source", "type")} `__k6PerfTrackVar` (installed on globalThis by replayLogger) registers the value at that exact spot every iteration and returns it unchanged. The user's file is never modified. Scope: only request-bearing interpolations matter, but wrapping every `${...}` is safe — the helper returns the value untouched, so even an interpolation in a console.log just gets harmlessly registered. We DO skip: - `env.*` (base URL / service URLs are constants, not variables) - already-wrapped expressions and explicit track*() calls (idempotent) - interpolations containing braces (object literals) — the regex can't bound them reliably, and they aren't simple variables anyway. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `instrumentVariableTracking` | `export function instrumentVariableTracking(source: string): InstrumentResult` | source: string | InstrumentResult | 50 | Rewrite every trackable `${expr}` in `source` to self-track via the global `__k6PerfTrackVar` helper. Pure string transform; never throws on valid JS. |
| `classify` | `function classify(expr: string): Classified \| null` | expr: string | Classified \| null | 80 | Decide whether an interpolation expression is a trackable variable, and if so its display name, source label, and type. Returns null to leave it untouched. |
| `sanitize` | `function sanitize(expr: string): string` | expr: string | string | 120 | Implements the sanitize function. |


### core_engine/src/distributed/agentServer.ts

Layer: distributed  
Lines: 171  
Purpose: detectK6Version, freeDiskBytes, tokenMatches, buildInfo helpers or command handlers.

Imports:
- `import * as http from 'http';`
- `import * as os from 'os';`
- `import * as crypto from 'crypto';`
- `import { spawnSync } from 'child_process';`
- `import * as fs from 'fs';`
- `import { Logger } from '../utils/logger';`

Exports: `AgentServerOptions`, `runAgent`, `runAgentCli`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `AgentServerOptions` | Interface | 35 | Port to listen on (default 7070, the design's agentPort). |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `FRAMEWORK_VERSION` | Inferred | 32 | Module-level constant or configuration value. |
| `TOKEN_HEADER` | Inferred | 33 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `detectK6Version` | `function detectK6Version(): string \| null` | None | string \| null | 47 | Best-effort `k6 version` (proves k6 is installed on the LG). Never throws. |
| `freeDiskBytes` | `function freeDiskBytes(): number \| null` | None | number \| null | 58 | Best-effort free bytes on the volume backing the process cwd. Null if unsupported. |
| `tokenMatches` | `function tokenMatches(expected: string, provided: string \| undefined): boolean` | expected: string, provided: string \| undefined | boolean | 68 | Constant-time token check that never short-circuits on length. |
| `buildInfo` | `function buildInfo(name: string, k6Version: string \| null)` | name: string, k6Version: string \| null | Inferred | 80 | Implements the build info function. It orchestrates process execution. |
| `runAgent` | `export function runAgent(options: AgentServerOptions): Promise<http.Server>` | options: AgentServerOptions | Promise<http.Server> | 97 | Start the agent HTTP server. Resolves once it is listening (server keeps the process alive). |
| `runAgentCli` | `export async function runAgentCli(opts:` | opts: { port: string; host: string; name?: string; token?: string } | Promise<void> | 148 | CLI handler for `k6-framework agent`. Keeps running until interrupted. |


### core_engine/src/distributed/collectRun.ts

Layer: distributed  
Lines: 80  
Purpose: runBaseDir, sharedRunDir, liveRunDir, copyDirInto helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { Logger } from '../utils/logger';`

Exports: `runBaseDir`, `sharedRunDir`, `liveRunDir`, `collectRunDir`, `runCollect`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `DEFAULT_EXCLUDE` | Inferred | 34 | k6's raw metrics firehose — kept LOCAL by default; the merge needs only the CSV + JSON artifacts. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `runBaseDir` | `export function runBaseDir(collectDir: string, runId: string): string` | collectDir: string, runId: string | string | 21 | Per-run base folder: <collectDir>/<runId>/ (holds live/, shared/, control/, Final_…). |
| `sharedRunDir` | `export function sharedRunDir(collectDir: string, runId: string): string` | collectDir: string, runId: string | string | 25 | Shared collect dir for a run: <collectDir>/<runId>/shared. |
| `liveRunDir` | `export function liveRunDir(collectDir: string, runId: string): string` | collectDir: string, runId: string | string | 29 | Live heartbeat dir for a run: <collectDir>/<runId>/live. |
| `copyDirInto` | `function copyDirInto(src: string, dest: string, exclude: Set<string>): void` | src: string, dest: string, exclude: Set<string> | void | 36 | Implements the copy dir into function. It performs file-system work. |
| `collectRunDir` | `export function collectRunDir(reportDir: string, runId: string, machineName: string, collectDir: string, includeRaw = false): string` | reportDir: string, runId: string, machineName: string, collectDir: string, includeRaw = false | string | 52 | Copy a finished local run folder into <collectDir>/<runId>/shared/<machineName>/. The raw metrics-stream.json is excluded by default (large, local-only); pass `includeRaw` to copy it too. Returns the destination path. |
| `readRunId` | `function readRunId(dir: string): string \| undefined` | dir: string | string \| undefined | 58 | Implements the read run id function. It performs file-system work, parses structured configuration or artifact data. |
| `runCollect` | `export function runCollect(opts:` | opts: { from: string; into: string; machine: string; runId?: string; includeRaw?: boolean } | boolean | 68 | CLI handler: `k6-framework collect --from <runDir> --into <collectDir> --machine <name>`. |


### core_engine/src/distributed/control.ts

Layer: distributed  
Lines: 141  
Purpose: ControlWatcher implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import * as http from 'http';`
- `import { spawn } from 'child_process';`
- `import { Logger } from '../utils/logger';`

Exports: `ControlAction`, `ControlFile`, `controlDirFor`, `writeControl`, `readControl`, `killProcessTree`, `fetchK6Vus`, `k6ApiStop`, `ControlWatcherOptions`, `ControlWatcher`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `ControlAction` | TypeAlias | 18 | Defines the ControlAction contract used by the framework. |
| `ControlFile` | Interface | 20 | ISO time to act (stop only, for coordinated drain). Absent/past → act now. |
| `ControlWatcherOptions` | Interface | 103 | Defines the ControlWatcherOptions contract used by the framework. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `controlDirFor` | `export function controlDirFor(collectDir: string, runId: string): string` | collectDir: string, runId: string | string | 29 | `<collectDir>/<runId>/control`. |
| `writeControl` | `export function writeControl(controlDir: string, file: ControlFile): string` | controlDir: string, file: ControlFile | string | 34 | Write the control marker atomically (tmp + rename). Returns the file path. |
| `readControl` | `export function readControl(controlDir: string): ControlFile \| null` | controlDir: string | ControlFile \| null | 43 | Implements the read control function. It performs file-system work, parses structured configuration or artifact data. |
| `killProcessTree` | `export function killProcessTree(pid: number): void` | pid: number | void | 54 | Kill a process (tree) — Windows: `taskkill /F /T`; POSIX: SIGKILL. Best-effort. |
| `fetchK6Vus` | `export function fetchK6Vus(address = process.env.K6_PERF_K6_API \|\| '127.0.0.1:6565'): Promise<number \| null>` | address = process.env.K6_PERF_K6_API \|\| '127.0.0.1:6565' | Promise<number \| null> | 64 | Read the CURRENT active VU count from k6's local REST API (/v1/status). Null if unreachable. |
| `k6ApiStop` | `export function k6ApiStop(address = process.env.K6_PERF_K6_API \|\| '127.0.0.1:6565'): Promise<boolean>` | address = process.env.K6_PERF_K6_API \|\| '127.0.0.1:6565' | Promise<boolean> | 87 | Graceful stop via k6's local REST API. Resolves true on 2xx/3xx. Never throws. |

#### Class: ControlWatcher

Line: 111  
Description: Polls the control dir; fires onAbort/onStop exactly once.

| Property | Type | Line | Description |
|---|---|---:|---|
| `timer` | NodeJS.Timeout \| null | 112 | Class state or configuration value used by the class methods. |
| `handled` | Inferred | 113 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `constructor` | `constructor(private readonly opts: ControlWatcherOptions)` | private readonly opts: ControlWatcherOptions | Inferred | 115 | Implements the constructor method. |
| `start` | `start(): void` | None | void | 117 | Implements the start method. |
| `stop` | `stop(): void` | None | void | 123 | Implements the stop method. |
| `poll` | `private poll(): void` | None | void | 127 | Implements the poll method. |


### core_engine/src/distributed/liveAggregate.ts

Layer: distributed  
Lines: 194  
Purpose: startControllerHostSampling, controllerHost, resolveLiveDir, resolveRunContext helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { RelativeHistogram } from '../reporting/Histogram';`
- `import { LiveStatusSnapshot } from './LiveStatusHeartbeat';`
- `import { HostMonitor } from '../execution/HostMonitor';`

Exports: `startControllerHostSampling`, `controllerHost`, `DEFAULT_STATS`, `LiveAggregate`, `resolveLiveDir`, `RunContext`, `resolveRunContext`, `findLatestFinalReport`, `readSnapshots`, `timingStats`, `aggregate`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `LiveAggregate` | Interface | 33 | Combined errors/warnings across machines: totals + recent messages (machine-tagged). |
| `RunContext` | Interface | 58 | Defines the RunContext contract used by the framework. |
| `MergedTxn` | Interface | 127 | Defines the MergedTxn contract used by the framework. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `ctrlHost` | Inferred | 18 | Module-level constant or configuration value. |
| `ctrlTimer` | NodeJS.Timeout \| null | 19 | Module-level constant or configuration value. |
| `DEFAULT_STATS` | Inferred | 31 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `startControllerHostSampling` | `export function startControllerHostSampling(intervalMs = 4000): void` | intervalMs = 4000 | void | 20 | Implements the start controller host sampling function. |
| `controllerHost` | `export function controllerHost():` | None | { cpu: number; mem: number } | 29 | Implements the controller host function. |
| `resolveLiveDir` | `export function resolveLiveDir(o:` | o: { liveDir?: string; collectDir?: string; runId?: string } | string \| null | 52 | Implements the resolve live dir function. |
| `resolveRunContext` | `export function resolveRunContext(o:` | o: { liveDir?: string; collectDir?: string; runId?: string } | RunContext \| null | 61 | Resolve the live/shared dirs (+ runId) under <collectDir>/<runId>/ for a monitor/auto-merge. |
| `findLatestFinalReport` | `export function findLatestFinalReport(sharedDir: string): string \| null` | sharedDir: string | string \| null | 76 | The newest Final_… report under a shared dir, or null. |
| `readSnapshots` | `export function readSnapshots(dir: string): LiveStatusSnapshot[]` | dir: string | LiveStatusSnapshot[] | 87 | Implements the read snapshots function. It performs file-system work, parses structured configuration or artifact data. |
| `statToFraction` | `function statToFraction(stat: string): number \| null` | stat: string | number \| null | 101 | Parse a stat label into a percentile fraction in [0,1], or null if not a percentile. |
| `statValue` | `function statValue(stat: string, hist: RelativeHistogram): number` | stat: string, hist: RelativeHistogram | number | 109 | Implements the stat value function. |
| `timingStats` | `export function timingStats(stats: string[]): string[]` | stats: string[] | string[] | 119 | Keep only stats a response-time histogram can produce (drop count/pass/fail/std/etc). |
| `mergeTransactions` | `function mergeTransactions(snaps: LiveStatusSnapshot[]): MergedTxn[]` | snaps: LiveStatusSnapshot[] | MergedTxn[] | 129 | Implements the merge transactions function. |
| `aggregate` | `export function aggregate(dir: string): LiveAggregate` | dir: string | LiveAggregate | 153 | Merge all heartbeats in `dir` into one combined live view. |


### core_engine/src/distributed/liveDashboard.ts

Layer: distributed  
Lines: 337  
Purpose: page, startDashboardServer, runDashboardCli helpers or command handlers.

Imports:
- `import * as http from 'http';`
- `import * as path from 'path';`
- `import { Logger } from '../utils/logger';`
- `import { aggregate, resolveRunContext, findLatestFinalReport, startControllerHostSampling, controllerHost } from './liveAggregate';`
- `import { writeControl, ControlAction } from './control';`
- `import { runMerge } from './runMerge';`

Exports: `DashboardOptions`, `startDashboardServer`, `runDashboardCli`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `DashboardOptions` | Interface | 20 | Auto-merge when all machines finish (default true). |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `page` | `function page(intervalMs: number): string` | intervalMs: number | string | 32 | Implements the page function. It orchestrates process execution, enforces validation rules. |
| `startDashboardServer` | `export function startDashboardServer( o:` | o: { dir: string; host: string; port: number; intervalMs: number; sharedDir?: string; runId?: string; autoMerge?: boolean; mergeTimeoutSec?: number } | Promise<http.Server> | 224 | Start the live dashboard HTTP server. Resolves once listening. |
| `runDashboardCli` | `export async function runDashboardCli(o: DashboardOptions): Promise<void>` | o: DashboardOptions | Promise<void> | 304 | CLI handler for `k6-framework monitor --serve`. Keeps running until interrupted. |


### core_engine/src/distributed/LiveStatusHeartbeat.ts

Layer: distributed  
Lines: 190  
Purpose: LiveStatusHeartbeat implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { Logger } from '../utils/logger';`
- `import { RelativeHistogram, HistogramJSON } from '../reporting/Histogram';`
- `import { readTransactionCsvStats, findRequestCsv, readRequestFailure } from './transactionCsv';`
- `import { fetchK6Vus } from './control';`
- `import { HostMonitor } from '../execution/HostMonitor';`

Exports: `LiveState`, `LiveStatusSnapshot`, `HeartbeatOptions`, `LiveStatusHeartbeat`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `LiveState` | TypeAlias | 21 | Defines the LiveState contract used by the framework. |
| `LiveStatusSnapshot` | Interface | 40 | Request-level totals (from the request CSV isError) — for the request-failure graph. |
| `HeartbeatOptions` | Interface | 73 | The transaction CSV being written live on this machine. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `tailNdjson` | `function tailNdjson(file: string, n: number):` | file: string, n: number | { count: number; recent: string[] } | 24 | Count lines in an ndjson file + the last `n` as short messages. Best-effort. |

#### Class: LiveStatusHeartbeat

Line: 86  
Description: Refresh active VUs (k6 API) + host CPU/mem (best-effort; keep last good values).

| Property | Type | Line | Description |
|---|---|---:|---|
| `timer` | NodeJS.Timeout \| null | 87 | Class state or configuration value used by the class methods. |
| `startMs` | Inferred | 88 | Class state or configuration value used by the class methods. |
| `prevCount` | Inferred | 89 | Class state or configuration value used by the class methods. |
| `prevMs` | Inferred | 90 | Class state or configuration value used by the class methods. |
| `state` | LiveState | 91 | Class state or configuration value used by the class methods. |
| `vusCache` | Inferred | 92 | Class state or configuration value used by the class methods. |
| `hostCache` | Inferred | 93 | Class state or configuration value used by the class methods. |
| `statusPath` | string | 94 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `constructor` | `constructor(private readonly opts: HeartbeatOptions)` | private readonly opts: HeartbeatOptions | Inferred | 96 | Implements the constructor method. |
| `start` | `start(): void` | None | void | 100 | Implements the start method. It performs file-system work. |
| `refresh` | `private async refresh(): Promise<void>` | None | Promise<void> | 112 | Refresh active VUs (k6 API) + host CPU/mem (best-effort; keep last good values). |
| `setState` | `setState(state: LiveState): void` | state: LiveState | void | 122 | Reflect a control transition (e.g. 'stopping'/'aborting') immediately. |
| `stop` | `stop(state?: LiveState): void` | state?: LiveState | void | 127 | Implements the stop method. |
| `write` | `private write(state: LiveState): void` | state: LiveState | void | 133 | Implements the write method. It performs file-system work, orchestrates process execution, enforces validation rules, emits operator-facing output. |


### core_engine/src/distributed/MergedReportBuilder.ts

Layer: distributed  
Lines: 282  
Purpose: MergedReportBuilder implementation.

Imports:
- `import { percentileR7, RelativeHistogram } from '../reporting/Histogram';`
- `import { HistogramArtifact } from '../reporting/HistogramArtifactBuilder';`
- `import {
 ReportBundle, TimeSeriesFile, TimeSeriesPoint, TransactionMetricsFile, CiSummary,
 TransactionSeries, normalizeTransactionSeries,
} from '../types/ReportingContracts';`
- `import { MergeResult } from './MergeEngine';`

Exports: `MachineTimeseries`, `MergedReportInput`, `MergedReportBuilder`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `MachineTimeseries` | Interface | 22 | Host CPU/mem snapshots from this machine's system-metrics.json (for the System tab). |
| `MergedReportInput` | Interface | 33 | Counter bucket seconds (default 2, from runtime settings). |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `percentilesFrom` | `function percentilesFrom(stats: string[]): number[]` | stats: string[] | number[] | 47 | Percentiles to emit per bucket: fixed p90 ∪ every percentile in the configured stats. |

#### Class: MergedReportBuilder

Line: 58  
Description: Group each machine's host snapshots into a per-agent system series (keyed by machine name).

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `build` | `static build(input: MergedReportInput):` | input: MergedReportInput | { bundle: ReportBundle; timeseries: TimeSeriesFile } | 59 | Implements the build  method. |
| `buildSystemSeries` | `private static buildSystemSeries(machines: MachineTimeseries[]): Record<string, TimeSeriesPoint[]>` | machines: MachineTimeseries[] | Record<string, TimeSeriesPoint[]> | 71 | Group each machine's host snapshots into a per-agent system series (keyed by machine name). |
| `mergeTimeseries` | `private static mergeTimeseries( files: TimeSeriesFile[], mergedHist: HistogramArtifact \| null, counterBucket: number, stats: string[], requestFailBuckets?: Map<number,` | files: TimeSeriesFile[], mergedHist: HistogramArtifact \| null, counterBucket: number, stats: string[], requestFailBuckets?: Map<number, { total: number; failed: number }> | TimeSeriesFile | 81 | Implements the merge timeseries method. It orchestrates process execution. |
| `histForTs` | `private static histForTs(histByIso: Record<string, RelativeHistogram>, ts: string, bucketSeconds: number): RelativeHistogram \| null` | histByIso: Record<string, RelativeHistogram>, ts: string, bucketSeconds: number | RelativeHistogram \| null | 225 | Find the merged-histogram bucket (10s) whose window contains `ts`. |
| `assembleBundle` | `private static assembleBundle(input: MergedReportInput, timeseries: TimeSeriesFile): ReportBundle` | input: MergedReportInput, timeseries: TimeSeriesFile | ReportBundle | 232 | Implements the assemble bundle method. It orchestrates process execution, enforces validation rules. |


### core_engine/src/distributed/MergeEngine.ts

Layer: distributed  
Lines: 336  
Purpose: MergeEngine implementation.

Imports:
- `import { CiSummary, CiTransactionSummary, TransactionMetricRow, TransactionMetricsFile } from '../types/ReportingContracts';`
- `import { HistogramArtifact } from '../reporting/HistogramArtifactBuilder';`
- `import { HistogramJSON, RelativeHistogram, percentileR7 } from '../reporting/Histogram';`

Exports: `MachineArtifacts`, `MergeOptions`, `MergeResult`, `MergeEngine`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `MachineArtifacts` | Interface | 26 | Raw per-transaction response times (ms) from this machine's transaction CSV. When present, merged percentiles are pooled + computed via R-7 (exact, histogram-parked phase). Falls back to the merged histogram when absent. |
| `MergeOptions` | Interface | 39 | Output runId for the merged result (defaults to the inputs' shared runId). |
| `MergeResult` | Interface | 46 | Merged per-(transaction\|overview, bucket) histograms (sum of all machines). |
| `TxnAccumulator` | Interface | 56 | Defines the TxnAccumulator contract used by the framework. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `statToFraction` | `function statToFraction(stat: string): number \| null` | stat: string | number \| null | 68 | Parse a stat label into a percentile fraction in [0,1], or null if not a percentile. |

#### Class: MergeEngine

Line: 79  
Description: Implements the merge engine class. It orchestrates process execution, enforces validation rules.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `merge` | `static merge(machines: MachineArtifacts[], options: MergeOptions =` | machines: MachineArtifacts[], options: MergeOptions = {} | MergeResult | 80 | Implements the merge method. |
| `mergeHistograms` | `private static mergeHistograms(arts: HistogramArtifact[], warnings: string[]):` | arts: HistogramArtifact[], warnings: string[] | {  relativeAccuracy: number;  bucketSeconds: number;  overview: RelativeHistogram;  overviewByBucket: Map<string, RelativeHistogram>;  transactions: Record<string, RelativeHistogram>;  transactionsByBucket: Record<string, Map<string, RelativeHistogram>>;  startTime: string;  endTime: string;  } | 193 | Implements the merge histograms method. |
| `serializeMergedHistogram` | `private static serializeMergedHistogram( merged: ReturnType<typeof MergeEngine.mergeHistograms>, machines: MachineArtifacts[], ): HistogramArtifact \| null` | merged: ReturnType<typeof MergeEngine.mergeHistograms>, machines: MachineArtifacts[] | HistogramArtifact \| null | 256 | Implements the serialize merged histogram method. It enforces validation rules. |
| `mergeCiSummary` | `private static mergeCiSummary( machines: MachineArtifacts[], runId: string, rows: TransactionMetricRow[], warnings: string[], ): CiSummary` | machines: MachineArtifacts[], runId: string, rows: TransactionMetricRow[], warnings: string[] | CiSummary | 282 | Implements the merge ci summary method. It orchestrates process execution. |


### core_engine/src/distributed/monitor.ts

Layer: distributed  
Lines: 120  
Purpose: padR, padL, render, runMonitor helpers or command handlers.

Imports:
- `import { Logger, ansi } from '../utils/logger';`
- `import { aggregate, resolveRunContext, LiveAggregate, startControllerHostSampling, controllerHost } from './liveAggregate';`
- `import { runMerge } from './runMerge';`

Exports: `MonitorOptions`, `runMonitor`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `MonitorOptions` | Interface | 13 | Auto-merge when all machines finish (default true). |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `padR` | `padR = (s: string, n: number): string` | s: string, n: number | string | 24 | Implements the pad r function. |
| `padL` | `padL = (s: string, n: number): string` | s: string, n: number | string | 25 | Implements the pad l function. |
| `render` | `function render(agg: LiveAggregate, dir: string): string` | agg: LiveAggregate, dir: string | string | 27 | Implements the render function. It orchestrates process execution. |
| `runMonitor` | `export async function runMonitor(o: MonitorOptions): Promise<boolean>` | o: MonitorOptions | Promise<boolean> | 81 | CLI handler for `k6-framework monitor` (console). Auto-merges when all machines finish. |


### core_engine/src/distributed/probe.ts

Layer: distributed  
Lines: 243  
Purpose: parseTarget, diagnose, probeOne, probeTcp helpers or command handlers.

Imports:
- `import * as http from 'http';`
- `import * as net from 'net';`
- `import { Logger } from '../utils/logger';`

Exports: `ProbeTarget`, `ProbeResult`, `parseTarget`, `probeOne`, `probeTcp`, `runProbe`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `ProbeTarget` | Interface | 31 | Defines the ProbeTarget contract used by the framework. |
| `ProbeResult` | Interface | 37 | Estimated (agentClock − controllerClock), ms; positive → agent ahead. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `TOKEN_HEADER` | Inferred | 29 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `parseTarget` | `export function parseTarget(raw: string, defaultPort: number): ProbeTarget \| null` | raw: string, defaultPort: number | ProbeTarget \| null | 54 | Parse "host:port" (port optional, defaults to 7070). |
| `diagnose` | `function diagnose(code: string \| undefined, timeoutMs: number): string` | code: string \| undefined, timeoutMs: number | string | 66 | Translate a socket errno into a firewall-relevant diagnosis. |
| `probeOne` | `export function probeOne(target: ProbeTarget, timeoutMs: number, token?: string): Promise<ProbeResult>` | target: ProbeTarget, timeoutMs: number, token?: string | Promise<ProbeResult> | 88 | Probe a single agent's /info endpoint. Never rejects — failures come back as reachable:false. |
| `probeTcp` | `export function probeTcp(target: ProbeTarget, timeoutMs: number): Promise<ProbeResult>` | target: ProbeTarget, timeoutMs: number | Promise<ProbeResult> | 142 | Raw TCP connect test — no HTTP, so it works on ANY port (RDP, an app port, etc.), not just agents. This is the firewall port-discovery tool: connecting proves the port is reachable; REFUSED proves the firewall LETS the packet through (host RST'd an empty port) so the port is safe to run the agent on; TIMED OUT proves the firewall drops that port. Never rejects. |
| `runProbe` | `export async function runProbe(opts:` | opts: { agents: string; port: string; timeout: string; token?: string; tcp?: boolean } | Promise<boolean> | 173 | CLI handler for `k6-framework probe`. Returns true iff every target was reachable. |


### core_engine/src/distributed/runMerge.ts

Layer: distributed  
Lines: 306  
Purpose: finalTimestamp, writeMergedCsv, readJson, readNdjson helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { Logger } from '../utils/logger';`
- `import { ArtifactWriter } from '../reporting/ArtifactWriter';`
- `import { RunReportGenerator } from '../reporting/RunReportGenerator';`
- `import { MergeEngine, MachineArtifacts } from './MergeEngine';`
- `import { MergedReportBuilder, MachineTimeseries } from './MergedReportBuilder';`
- `import { readTransactionCsvRaw, findTransactionCsv, findRequestCsv, readRequestFailByBucket, readRequestTimings, buildTransactionRowsFromCsv } from './transactionCsv';`
- `import { percentileR7 } from '../reporting/Histogram';`
- `import { CiSummary, TimeSeriesFile, TransactionMetricsFile, RunSummaryFile } from '../types/ReportingContracts';`
- `import { HistogramArtifact } from '../reporting/HistogramArtifactBuilder';`

Exports: `runMerge`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `MergeCliOptions` | Interface | 74 | Wait until every machine in `machines` has landed (run-manifest.json), then merge. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `MERGED_DIR` | Inferred | 23 | Module-level constant or configuration value. |
| `FINAL_PREFIX` | Inferred | 24 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `finalTimestamp` | `function finalTimestamp(d = new Date()): string` | d = new Date() | string | 27 | dd_MM_yyyyTHH_mm — Windows-path-safe merged-output folder timestamp. |
| `writeMergedCsv` | `function writeMergedCsv(machineDirs: string[], suffix: string, outPath: string): number` | machineDirs: string[], suffix: string, outPath: string | number | 37 | Concatenate the per-machine CSVs (whose names end with `suffix`, e.g. `_request_metric.csv`) into one merged CSV — header once, all data rows. The rows already carry a hostName column so each machine stays identifiable. Returns row count. |
| `readJson` | `function readJson<T>(file: string): T \| undefined` | file: string | T \| undefined | 54 | Implements the read json function. It performs file-system work, parses structured configuration or artifact data, emits operator-facing output. |
| `readNdjson` | `function readNdjson(file: string): Array<Record<string, unknown>>` | file: string | Array<Record<string, unknown>> | 64 | Implements the read ndjson function. It performs file-system work, parses structured configuration or artifact data. |
| `sleep` | `sleep = (ms: number): Promise<void>` | ms: number | Promise<void> | 84 | Implements the sleep function. |
| `machineLanded` | `function machineLanded(runDir: string, name: string): boolean` | runDir: string, name: string | boolean | 87 | A machine folder is "landed" once its run-manifest.json (written last) is present. |
| `waitForMachines` | `async function waitForMachines(runDir: string, machines: string[], pollSec: number, timeoutSec: number): Promise<boolean>` | runDir: string, machines: string[], pollSec: number, timeoutSec: number | Promise<boolean> | 91 | Implements the wait for machines function. It emits operator-facing output. |
| `runMerge` | `export async function runMerge(options: MergeCliOptions): Promise<boolean>` | options: MergeCliOptions | Promise<boolean> | 105 | Implements the run merge function. It performs file-system work, orchestrates process execution, enforces validation rules, emits operator-facing output. |
| `validateManifests` | `function validateManifests( manifests: Array<` | manifests: Array<{ machine: string; runId?: string; testId?: string; scriptHash?: string }> | string[] | 294 | Implements the validate manifests function. |


### core_engine/src/distributed/shareSetup.ts

Layer: distributed  
Lines: 52  
Purpose: resolveResultsBaseDir, printControllerShareSuggestion helpers or command handlers.

Imports:
- `import * as path from 'path';`
- `import * as os from 'os';`
- `import { Logger } from '../utils/logger';`

Exports: `ShareSuggestionOptions`, `resolveResultsBaseDir`, `printControllerShareSuggestion`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `ShareSuggestionOptions` | Interface | 17 | Results base dir to share; defaults to K6_RESULTS_BASE_DIR or 'results'. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `resolveResultsBaseDir` | `export function resolveResultsBaseDir(explicit?: string): string` | explicit?: string | string | 27 | Resolve the results base dir the same way the run pipeline does. |
| `printControllerShareSuggestion` | `export function printControllerShareSuggestion(options: ShareSuggestionOptions =` | options: ShareSuggestionOptions = {} | void | 33 | Print the (manual) steps to share the controller's results folder for collection. |


### core_engine/src/distributed/startBarrier.ts

Layer: distributed  
Lines: 84  
Purpose: fmtRemaining, awaitScheduledStart helpers or command handlers.

Imports:
- `import * as readline from 'readline';`
- `import { Logger, ansi } from '../utils/logger';`

Exports: `awaitScheduledStart`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `fmtRemaining` | `function fmtRemaining(totalSec: number): string` | totalSec: number | string | 16 | Human-friendly remaining time: "1h 02m 03s" / "2m 05s" / "9s". |
| `awaitScheduledStart` | `export async function awaitScheduledStart(): Promise<void>` | None | Promise<void> | 38 | Block until the K6_PERF_START_AT wall-clock time (ISO 8601), if set and future. On a TTY this renders a LIVE countdown that updates in place (same line) and ticks down to zero; when piped/redirected (no TTY) it prints one static line and waits silently so logs stay clean. Shared by the run path (LGs + local) and the controller's monitor so all roles show the same countdown. |


### core_engine/src/distributed/transactionCsv.ts

Layer: distributed  
Lines: 306  
Purpose: leafFor, flatten, parseCsvLine, readTransactionCsvRaw helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import { percentileR7 } from '../reporting/Histogram';`
- `import { TransactionMetricRow } from '../types/ReportingContracts';`

Exports: `CsvTransactionAggregate`, `readTransactionCsvRaw`, `TransactionCsvStats`, `readTransactionCsvStats`, `buildTransactionRowsFromCsv`, `findRequestCsv`, `readRequestFailure`, `readRequestFailByBucket`, `RequestTiming`, `readRequestTimings`, `findTransactionCsv`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `CsvTransactionAggregate` | Interface | 21 | A transaction is identified by its TAGS — (scenario, transaction). Grouping uses a private nested Map<scenario, Map<transaction, …>>; the tags are then returned as explicit fields. Nothing here encodes a composite key, so there is no delimiter to collide on and callers never decode anything. |
| `TransactionCsvStats` | Interface | 100 | One record per (scenario, transaction) — same-named transactions in different journeys stay separate, with both tags as explicit fields. |
| `RequestTiming` | Interface | 265 | Defines the RequestTiming contract used by the framework. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `leafFor` | `function leafFor( root: Map<string, Map<string, CsvTransactionAggregate>>, scenario: string, transaction: string, ): CsvTransactionAggregate` | root: Map<string, Map<string, CsvTransactionAggregate>>, scenario: string, transaction: string | CsvTransactionAggregate | 30 | Group into the private nested map, returning the leaf aggregate for a tag pair. |
| `flatten` | `function flatten(root: Map<string, Map<string, CsvTransactionAggregate>>): CsvTransactionAggregate[]` | root: Map<string, Map<string, CsvTransactionAggregate>> | CsvTransactionAggregate[] | 43 | Flatten the nested grouping map into records with the tags as explicit fields. |
| `parseCsvLine` | `function parseCsvLine(line: string): string[]` | line: string | string[] | 50 | Minimal RFC-4180-ish line parser (handles quoted fields + escaped quotes). |
| `readTransactionCsvRaw` | `export function readTransactionCsvRaw(file: string): Record<string, number[]>` | file: string | Record<string, number[]> | 78 | Read a transaction CSV into { transactionName: responseTimesMs[] }. Returns {} if the file is missing/empty or lacks the required columns. |
| `readTransactionCsvStats` | `export function readTransactionCsvStats(file: string): TransactionCsvStats` | file: string | TransactionCsvStats | 115 | Richer parse used by the live heartbeat: per-transaction count/fail/response times (ms) plus totals and the latest VU count. Reads the whole file each call (fine at heartbeat cadence; the file is small relative to the run). |
| `buildTransactionRowsFromCsv` | `export function buildTransactionRowsFromCsv(files: string[], stats: string[]): TransactionMetricRow[]` | files: string[], stats: string[] | TransactionMetricRow[] | 159 | Build merged transaction table rows straight from one or more transaction CSVs, keyed by (scenario, transaction) so same-named transactions in different journeys stay SEPARATE (k6's end-of-test summary collapses them — the CSV is the only source that preserves the scenario per row). Pools counts/pass/fail + response times across files, then computes the configured stats via exact R-7 percentiles. `journey` is set to the scenario so the report's SCENARIO column shows the real journey, not "all". |
| `findRequestCsv` | `export function findRequestCsv(dir: string): string \| null` | dir: string | string \| null | 205 | Find the request CSV inside a folder, if present. |
| `readRequestFailure` | `export function readRequestFailure(file: string):` | file: string | { total: number; failed: number } | 217 | Request-level failure from a request CSV: total requests and failed (isError, which is checks-first then status). This is the authoritative failure source for the failure graph — combined correctly as Σfailed/Σtotal, never averaged percentages. |
| `readRequestFailByBucket` | `export function readRequestFailByBucket(file: string, bucketSec: number, into?: Map<number,` | file: string, bucketSec: number, into?: Map<number, { total: number; failed: number }> | Map<number, { total: number; failed: number }> | 239 | Request failure bucketed by wall-clock time (checks-first isError). Key = bucket start in ms (floor(ts / bucketMs) * bucketMs). Pooled across machines then read as failed/total per bucket → the request-failure-over-time series. |
| `readRequestTimings` | `export function readRequestTimings(file: string, acc = new Map<string, RequestTiming>()): Map<string, RequestTiming>` | file: string, acc = new Map<string, RequestTiming>() | Map<string, RequestTiming> | 268 | Per-request-name response times (ms) + method/transaction, accumulated across files. |
| `findTransactionCsv` | `export function findTransactionCsv(dir: string): string \| null` | dir: string | string \| null | 298 | Find the transaction CSV inside a collected machine folder, if present. |


### core_engine/src/engine.ts

Layer: engine.ts  
Lines: 111  
Purpose: Framework file.

Exports: `export * from './types/ConfigContracts';`, `export * from './types/EventContracts';`, `export * from './types/ReportingContracts';`, `export * from './types/TestPlanSchema';`, `export { ConfigurationManager } from './config/ConfigurationManager';`, `export { EnvResolver } from './config/EnvResolver';`, `export { GatekeeperValidator } from './config/GatekeeperValidator';`, `export type { GatekeeperResult } from './config/GatekeeperValidator';`, `export { RuntimeConfigManager } from './config/RuntimeConfigManager';`, `export { SchemaValidator } from './config/SchemaValidator';`, `export { buildLoadProfile, buildStressProfile, buildSoakProfile, buildSpikeProfile, buildIterationProfile, buildConstantArrivalRateProfile, buildRampingArrivalRateProfile, buildExternallyControlledProfile, toK6ExecutorConfig } from './scenario/WorkloadModels';`, `export { ExecutorFactory } from './scenario/ExecutorFactory';`, `export { ScenarioBuilder } from './scenario/ScenarioBuilder';`, `export type { K6ScenarioDefinition, K6ScenariosMap } from './scenario/ScenarioBuilder';`, `export { TestPlanLoader } from './scenario/TestPlanLoader';`, `export { HostMonitor } from './execution/HostMonitor';`, `export { JourneyAllocator } from './execution/JourneyAllocator';`, `export type { JourneyAllocation } from './execution/JourneyAllocator';`, `export { ParallelExecutionManager } from './execution/ParallelExecutionManager';`, `export type { K6Options } from './execution/ParallelExecutionManager';`, `export { PipelineRunner } from './execution/PipelineRunner';`, `export { DataFactory } from './data/DataFactory';`, `export type { LoadedDataset } from './data/DataFactory';`, `export { DataPoolManager } from './data/DataPoolManager';`, `export { DataValidator } from './data/DataValidator';`, `export type { DataValidationResult } from './data/DataValidator';`, `export { DynamicValueFactory } from './data/DynamicValueFactory';`, `export { ErrorRuntime } from './runtime/ErrorRuntime';`, `export type { ErrorRuntimeContext } from './runtime/ErrorRuntime';`, `export { LifecycleRuntime } from './runtime/LifecycleRuntime';`, `export type { JourneyContext, JourneyPhase, LifecycleDecision, LifecyclePhaseFns, LifecycleRunState } from './runtime/LifecycleRuntime';`, `export { MetricsRuntime } from './runtime/MetricsRuntime';`, `export type { TransactionAggregate } from './runtime/MetricsRuntime';`, `export { SnapshotRuntime } from './runtime/SnapshotRuntime';`, `export { TimeseriesRuntime } from './runtime/TimeseriesRuntime';`, `export { Logger } from './utils/logger';`, `export { PathResolver } from './utils/PathResolver';`, `export { endTransaction, getCurrentTransaction, initTransactions, isVuTerminated, k6Check, startTransaction, transaction } from './utils/transaction';`, `export { request } from './utils/request';`, `export type { CookieValue, HttpMethod, RequestBody, RequestOptions } from './utils/request';`, `export { createJourneyLifecycleStore, getTransactionGate, isEnding, runJourneyLifecycle, thinktime } from './utils/lifecycle';`, `export type { JourneyLifecycleStore, PhaseFns, TransactionGate } from './utils/lifecycle';`, `export { logReplayExchange, logExchange, trackCorrelation, trackDataRow, trackParameter } from './utils/replayLogger';`, `export { clearCookies, deleteCookie, getEnvContext, registerBaseUrl, registerFrameworkEnvironmentUrls, resolveFrameworkUrl, resolvePath } from './utils/session';`, `export type { TeamEnvironmentOverride } from './utils/session';`, `export { DomainFilter } from './recording/DomainFilter';`, `export { HARParser } from './recording/HARParser';`, `export { ScriptGenerator } from './recording/ScriptGenerator';`, `export { TransactionGrouper } from './recording/TransactionGrouper';`, `export { JourneyAssertionResolver } from './assertions/JourneyAssertionResolver';`, `export { SLARegistry } from './assertions/SLARegistry';`, `export { ThresholdManager } from './assertions/ThresholdManager';`, `export { CorrelationEngine } from './correlation/CorrelationEngine';`, `export { ExtractorRegistry } from './correlation/ExtractorRegistry';`, `export { FallbackHandler } from './correlation/FallbackHandler';`, `export { RuleProcessor } from './correlation/RuleProcessor';`, `export { DiffChecker } from './debug/DiffChecker';`, `export { ExchangeLogBuilder } from './debug/ExchangeLog';`, `export type { TaggedExchangeLogEntry, VariableEvent } from './debug/ExchangeLog';`, `export { HTMLDiffReporter } from './debug/HTMLDiffReporter';`, `export { RecordingLogResolver } from './debug/RecordingLogResolver';`, `export { ReplayRunner } from './debug/ReplayRunner';`, `export { AzureReporter } from './reporters/AzureReporter';`, `export { CustomUploader } from './reporters/CustomUploader';`, `export { GrafanaReporter } from './reporters/GrafanaReporter';`, `export { ResultTransformer } from './reporters/ResultTransformer';`, `export { ArtifactWriter } from './reporting/ArtifactWriter';`, `export { EventArtifactBuilder } from './reporting/EventArtifactBuilder';`, `export { RunReportGenerator } from './reporting/RunReportGenerator';`, `export { RunSummaryBuilder } from './reporting/RunSummaryBuilder';`, `export { TimeseriesArtifactBuilder } from './reporting/TimeseriesArtifactBuilder';`, `export { TransactionMetricsBuilder } from './reporting/TransactionMetricsBuilder';`


### core_engine/src/execution/FileWriteSink.ts

Layer: execution  
Lines: 123  
Purpose: FileWriteSink implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`

Exports: `FileWriteSink`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `FilePayload` | Interface | 17 | Defines the FilePayload contract used by the framework. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `FILE_TAG` | Inferred | 15 | Keep in sync with utils/dataWriter.ts. |

#### Class: FileWriteSink

Line: 24  
Description: Consume one extracted console message. Returns true if it was a file-write line (so the caller can suppress it from the live display), false otherwise.

| Property | Type | Line | Description |
|---|---|---:|---|
| `seen` | Inferred | 27 | Class state or configuration value used by the class methods. |
| `writes` | Inferred | 28 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `constructor` | `constructor(private readonly outputDir: string)` | private readonly outputDir: string | Inferred | 30 | Implements the constructor method. |
| `consume` | `consume(msg: string): boolean` | msg: string | boolean | 36 | Consume one extracted console message. Returns true if it was a file-write line (so the caller can suppress it from the live display), false otherwise. |
| `write` | `private write(p: FilePayload): void` | p: FilePayload | void | 47 | Implements the write method. It performs file-system work. |
| `resolvePath` | `private resolvePath(file: string): string` | file: string | string | 76 | Resolve where to write: - ABSOLUTE path (e.g. 'D:/exports/ids.csv', '/var/data/ids.csv') → written verbatim, so scripts can target any location of their choice. - relative path → resolved under the run's output directory (the default home for run artifacts). Missing parent directories are created by write(). |
| `flushFromLog` | `flushFromLog(logPath: string): void` | logPath: string | void | 90 | Post-run reconciliation: re-read the COMPLETE k6 log file and apply any writeData lines the live tail did not process. The live tailer polls every ~250ms, so a very fast run can finish and flush its final lines after the tailer stops — this sweep guarantees completeness. Idempotent: file-write lines appear in a stable order, so we skip the first N already written live. |


### core_engine/src/execution/HostMonitor.ts

Layer: execution  
Lines: 129  
Purpose: HostMonitor implementation.

Imports:
- `import * as os from 'os';`
- `import { MonitoringConfig } from '../types/ConfigContracts';`
- `import { AgentContext, WarningEvent } from '../types/EventContracts';`
- `import { ErrorRuntime } from '../runtime/ErrorRuntime';`

Exports: `HostSnapshot`, `HostMonitor`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `HostSnapshot` | Interface | 6 | Defines the HostSnapshot contract used by the framework. |

#### Class: HostMonitor

Line: 13  
Description: Implements the host monitor class.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `captureSnapshot` | `static async captureSnapshot(): Promise<HostSnapshot>` | None | Promise<HostSnapshot> | 14 | Implements the capture snapshot method. |
| `buildWarnings` | `static buildWarnings(runId: string, config: MonitoringConfig, snapshots: HostSnapshot[]): WarningEvent[]` | runId: string, config: MonitoringConfig, snapshots: HostSnapshot[] | WarningEvent[] | 33 | Implements the build warnings method. |
| `startPeriodicSampling` | `static startPeriodicSampling( config: MonitoringConfig, snapshots: HostSnapshot[], ):` | config: MonitoringConfig, snapshots: HostSnapshot[] | { stop: () => Promise<void> } | 66 | Implements the start periodic sampling method. |
| `buildAgentContext` | `private static buildAgentContext(): AgentContext` | None | AgentContext | 105 | Implements the build agent context method. |
| `readCpuTimes` | `private static readCpuTimes():` | None | { idle: number; total: number } | 114 | Implements the read cpu times method. |
| `delay` | `private static delay(ms: number): Promise<void>` | ms: number | Promise<void> | 125 | Implements the delay method. |


### core_engine/src/execution/JourneyAllocator.ts

Layer: execution  
Lines: 93  
Purpose: JourneyAllocator implementation.

Imports:
- `import { UserJourney } from '../types/TestPlanSchema';`

Exports: `JourneyAllocation`, `JourneyAllocator`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `JourneyAllocation` | Interface | 9 | Defines the JourneyAllocation contract used by the framework. |

#### Class: JourneyAllocator

Line: 15  
Description: Distribute `totalVUs` across journeys based on their weight property. Falls back to equal distribution if no weights are defined. Rules: - Every journey gets at least 1 VU. - Rounding remainder goes to the highest-weight journey. - Explicit vus override on a journey takes priority over weight.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `allocate` | `static allocate(journeys: UserJourney[], totalVUs: number): JourneyAllocation[]` | journeys: UserJourney[], totalVUs: number | JourneyAllocation[] | 25 | Distribute `totalVUs` across journeys based on their weight property. Falls back to equal distribution if no weights are defined. Rules: - Every journey gets at least 1 VU. - Rounding remainder goes to the highest-weight journey. - Explicit vus override on a journey takes priority over weight. |
| `printTable` | `static printTable(allocations: JourneyAllocation[]): void` | allocations: JourneyAllocation[] | void | 77 | Print allocation table to console |


### core_engine/src/execution/ParallelExecutionManager.ts

Layer: execution  
Lines: 134  
Purpose: ParallelExecutionManager implementation.

Imports:
- `import { ThresholdManager } from '../assertions/ThresholdManager';`
- `import { K6ScenariosMap, ScenarioBuilder, ScenarioRuntimeMetadata } from '../scenario/ScenarioBuilder';`
- `import { TestPlan } from '../types/TestPlanSchema';`
- `import { JourneyAllocator } from './JourneyAllocator';`

Exports: `K6Options`, `ParallelExecutionManager`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `K6Options` | Interface | 12 | Defines the K6Options contract used by the framework. |

#### Class: ParallelExecutionManager

Line: 20  
Description: Resolve the full k6 options object from a test plan. Handles VU allocation for parallel weighted journeys.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `resolve` | `static resolve( plan: TestPlan, runtimeMetadata?: ScenarioRuntimeMetadata, ): K6Options` | plan: TestPlan, runtimeMetadata?: ScenarioRuntimeMetadata | K6Options | 25 | Resolve the full k6 options object from a test plan. Handles VU allocation for parallel weighted journeys. |
| `extractMaxVUs` | `private static extractMaxVUs(plan: TestPlan): number` | plan: TestPlan | number | 77 | Extract the peak VU count from the global load profile. Used for weight-based proportional distribution. |
| `scaleProfileToVUs` | `private static scaleProfileToVUs( profile: TestPlan['global_load_profile'], allocatedVUs: number, ): TestPlan['global_load_profile']` | profile: TestPlan['global_load_profile'], allocatedVUs: number | TestPlan['global_load_profile'] | 90 | Scale a load profile's VU count to the allocated amount. Preserves stage ratios for ramping profiles. |
| `buildSummaryTrendStats` | `private static buildSummaryTrendStats(runtimeMetadata?: ScenarioRuntimeMetadata): string[]` | runtimeMetadata?: ScenarioRuntimeMetadata | string[] | 118 | Build the summaryTrendStats array for k6 options. Merges the k6 defaults (avg, min, med, max, p(90), p(95)) with any additional percentiles configured in runtime reporting.transactionStats. Without this, k6 wouldn't compute custom percentiles like p(97) or p(99). |


### core_engine/src/execution/PipelineRunner.ts

Layer: execution  
Lines: 333  
Purpose: PipelineRunner implementation.

Imports:
- `import * as childProcess from 'child_process';`
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { Logger } from '../utils/logger';`
- `import { K6Options } from './ParallelExecutionManager';`

Exports: `RunOptions`, `PipelineRunResult`, `PipelineRunner`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `RunOptions` | Interface | 13 | Path to the k6 test script (entry point) |
| `PipelineRunResult` | Interface | 42 | The exact k6 command line the framework launched (for report/debug traceability). |

#### Class: PipelineRunner

Line: 56  
Description: Execute k6 with the given options. Writes options.scenarios to a temp config snippet and passes it via --config.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `run` | `static run(options: RunOptions): void` | options: RunOptions | void | 61 | Execute k6 with the given options. Writes options.scenarios to a temp config snippet and passes it via --config. |
| `execute` | `static execute(options: RunOptions): PipelineRunResult` | options: RunOptions | PipelineRunResult | 71 | Execute k6 and return the process result. Useful for debug flows that need captured logs. |
| `executeAsync` | `static executeAsync(options: RunOptions): Promise<PipelineRunResult>` | options: RunOptions | Promise<PipelineRunResult> | 177 | Implements the execute async method. It performs file-system work, orchestrates process execution, emits operator-facing output. |
| `printCapturedOutput` | `static printCapturedOutput(result: PipelineRunResult): void` | result: PipelineRunResult | void | 313 | Implements the print captured output method. It performs file-system work. |
| `ensureSuccess` | `static ensureSuccess(result: PipelineRunResult): void` | result: PipelineRunResult | void | 327 | Implements the ensure success method. |


### core_engine/src/index.ts

Layer: index.ts  
Lines: 98  
Purpose: Framework file.

Exports: `export { request } from './utils/request.js';`, `export type { CookieValue, HttpMethod, RequestBody, RequestOptions } from './utils/request.js';`, `export {
 transaction,
 k6Check,
 startTransaction,
 endTransaction,
 getCurrentTransaction,
 initTransactions,
 isVuTerminated,
} from './utils/transaction.js';`, `export {
 createJourneyLifecycleStore,
 runJourneyLifecycle,
 thinktime,
 isEnding,
 getTransactionGate,
} from './utils/lifecycle.js';`, `export type { JourneyLifecycleStore, PhaseFns, TransactionGate } from './utils/lifecycle.js';`, `export {
 clearCookies,
 deleteCookie,
 getEnvContext,
 registerBaseUrl,
 registerFrameworkEnvironmentUrls,
 resolveFrameworkUrl,
 resolvePath,
} from './utils/session.js';`, `export type { TeamEnvironmentOverride } from './utils/session.js';`, `export {
 trackCorrelation,
 trackParameter,
 trackDataRow,
 logExchange,
 logReplayExchange,
} from './utils/replayLogger.js';`, `export {
 extractJson,
 extractRegex,
 extractHeader,
 extractCookie,
 extractBoundary,
} from './utils/extract.js';`, `export type { ExtractableResponse } from './utils/extract.js';`, `export {
 addAutoHeader,
 addAutoHeaders,
 removeAutoHeader,
 clearAutoHeaders,
 getAutoHeaders,
 addHeaderOnce,
} from './utils/autoHeaders.js';`, `export { writeData } from './utils/dataWriter.js';`, `export type { WriteDataOptions } from './utils/dataWriter.js';`, `export { DynamicValueFactory as generate } from './data/DynamicValueFactory.js';`


### core_engine/src/recording/CurlAdapter.ts

Layer: recording  
Lines: 463  
Purpose: CurlAdapter implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { HAREntry } from '../types/HARContracts';`

Exports: `CurlParseResult`, `ParsedCurlBlock`, `CurlAdapter`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `CurlParseResult` | Interface | 22 | Defines the CurlParseResult contract used by the framework. |
| `ParsedCurlBlock` | Interface | 27 | Optional transaction name from a leading `# name` comment in multi-curl files. |

#### Class: CurlAdapter

Line: 34  
Description: Parse a single cURL string into a HAREntry. Defaults to process.cwd().

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `parse` | `static parse( curl: string, id: string, pageref: string, baseDir: string = process.cwd(), ): CurlParseResult` | curl: string, id: string, pageref: string, baseDir: string = process.cwd() | CurlParseResult | 44 | Parse a single cURL string into a HAREntry. Defaults to process.cwd(). |
| `splitMultiCurlFile` | `static splitMultiCurlFile(content: string): ParsedCurlBlock[]` | content: string | ParsedCurlBlock[] | 240 | Split a multi-curl file into individual blocks. Format: blank-line-separated blocks. A leading `# name` comment line on a block sets the transaction name for that block. |
| `normalizeContinuations` | `private static normalizeContinuations(s: string): string` | s: string | string | 292 | Join continuation lines into one logical line and normalize cmd.exe-style escape syntax produced by Chrome DevTools' "Copy as cURL (cmd)" option. Handles: - POSIX: `\` at end of line (bash, zsh, "Copy as cURL (bash)") - cmd.exe: `^` at end of line ("Copy as cURL (cmd)") - cmd.exe: `^"` → `"` (escaped double-quote inside `"..."`) - cmd.exe: `^X` for special X (defensive escapes Chrome emits around JSON braces, backslashes, %, &, etc. inside `"..."` arguments) Cmd-style is detected by the presence of at least one `^"` in the input; we only strip the broader `^X` escapes in that mode so legitimate `^` characters in bash-style curls are preserved. NOT handled: - PowerShell backtick escapes (`` `" ``, `` `n ``, etc.) — that format is more complex; users on PS should pick "Copy as cURL (bash)" or paste into a file and use `--file`. |
| `tokenize` | `private static tokenize(s: string): string[]` | s: string | string[] | 313 | Shell-like tokenizer that respects single/double quotes and backslash escapes within double quotes. Sufficient for the vast majority of real-world curls; documented limitations: no `$'...'` ANSI-C handling, no command substitution, no env expansion. |
| `resolveBody` | `private static resolveBody(raw: string, baseDir: string, warnings: string[]): string` | raw: string, baseDir: string, warnings: string[] | string | 403 | `-d @file` / `--data-binary @file` references — load the file contents. Anything else returns the raw string. |
| `isSilentlyIgnoredFlag` | `private static isSilentlyIgnoredFlag(tok: string): boolean` | tok: string | boolean | 417 | Implements the is silently ignored flag method. |
| `flagTakesArg` | `private static flagTakesArg(tok: string): boolean` | tok: string | boolean | 449 | Implements the flag takes arg method. |


### core_engine/src/recording/DomainFilter.ts

Layer: recording  
Lines: 48  
Purpose: DomainFilter implementation.

Imports:
- `import { HAREntry } from '../types/HARContracts';`
- `import { Logger } from '../utils/logger';`

Exports: `DomainStat`, `DomainFilter`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `DomainStat` | Interface | 4 | Defines the DomainStat contract used by the framework. |

#### Class: DomainFilter

Line: 9  
Description: Summarize domains present in the HAR so the CLI can present user choices.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `summarize` | `static summarize(entries: HAREntry[]): DomainStat[]` | entries: HAREntry[] | DomainStat[] | 13 | Summarize domains present in the HAR so the CLI can present user choices. |
| `filter` | `static filter(entries: HAREntry[], allowedDomains: string[]): HAREntry[]` | entries: HAREntry[], allowedDomains: string[] | HAREntry[] | 29 | Filter HAR entries by allowed output domains. Supports substring matching. |


### core_engine/src/recording/HARParser.ts

Layer: recording  
Lines: 91  
Purpose: HARParser implementation.

Imports:
- `import * as fs from 'fs';`
- `import { HAREntry, HARRefinementOptions } from '../types/HARContracts';`
- `import { Logger } from '../utils/logger';`
- `import { DomainFilter } from './DomainFilter';`

Exports: `HARParser`

#### Class: HARParser

Line: 6  
Description: Parse a HAR file, extract internal entry models, and perform the current refinement steps.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `parse` | `static parse(filePath: string, options: HARRefinementOptions =` | filePath: string, options: HARRefinementOptions = {} | HAREntry[] | 10 | Parse a HAR file, extract internal entry models, and perform the current refinement steps. |
| `readEntries` | `static readEntries(filePath: string): HAREntry[]` | filePath: string | HAREntry[] | 51 | Read entries from a HAR file without applying filters so the CLI can inspect domains first. |


### core_engine/src/recording/PostmanAdapter.ts

Layer: recording  
Lines: 951  
Purpose: PostmanAdapter implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { HAREntry } from '../types/HARContracts';`
- `import { TransactionGroup } from './TransactionGrouper';`
- `import { translatePostmanScript } from './PostmanScriptTranslator';`

Exports: `PostmanParseResult`, `PostmanFolderInfo`, `PostmanParseOptions`, `PostmanAdapter`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `PostmanParseResult` | Interface | 28 | Module-scope code (file `open()` bindings) that the generator should inject at init context, populated when the collection contains file uploads or multipart-with-files. Empty string when not needed. |
| `PostmanFolderInfo` | Interface | 74 | A folder node discovered in a Postman collection (for the interactive picker). |
| `PostmanParseOptions` | Interface | 83 | Only emit requests under this folder path. Accepts either: - a path string with `/` separators (e.g. `"API/Auth"`), or - an array of folder segments (e.g. `["API", "Auth"]`). A single segment matches a top-level folder (backward compatible). Matching is prefix-based: the folder AND all of its descendant subfolders are included. Segments are sanitized the same way folder names are, so the caller may pass raw or already-sanitized names. |
| `FileBinding` | Interface | 105 | Internal: a tracked file binding for k6 init-context code generation. |
| `PostmanCollectionFile` | Interface | 122 | Defines the PostmanCollectionFile contract used by the framework. |
| `PostmanItem` | Interface | 129 | Defines the PostmanItem contract used by the framework. |
| `PostmanRequest` | TypeAlias | 137 | Defines the PostmanRequest contract used by the framework. |
| `PostmanUrl` | TypeAlias | 148 | Defines the PostmanUrl contract used by the framework. |
| `PostmanHeader` | Interface | 160 | Defines the PostmanHeader contract used by the framework. |
| `PostmanBody` | Interface | 167 | Defines the PostmanBody contract used by the framework. |
| `PostmanAuth` | Interface | 183 | Defines the PostmanAuth contract used by the framework. |
| `PostmanAuthParam` | Interface | 201 | Defines the PostmanAuthParam contract used by the framework. |
| `PostmanEvent` | Interface | 207 | Defines the PostmanEvent contract used by the framework. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `sanitizeName` | `function sanitizeName(s: string): string` | s: string | string | 876 | Implements the sanitize name function. |
| `normalizeFolderFilter` | `function normalizeFolderFilter(filter: string \| string[] \| undefined): string[] \| undefined` | filter: string \| string[] \| undefined | string[] \| undefined | 885 | Normalize a folder filter (path string with `/` separators, or a segment array) into an array of sanitized segments. Returns undefined when no meaningful filter was supplied. |
| `pathHasPrefix` | `function pathHasPrefix(folderPath: string[], prefix: string[]): boolean` | folderPath: string[], prefix: string[] | boolean | 899 | True when `folderPath` begins with every segment of `prefix`, in order. |
| `safeJsonParse` | `function safeJsonParse(s: string): unknown` | s: string | unknown | 904 | Implements the safe json parse function. It parses structured configuration or artifact data. |
| `mimeFromExt` | `function mimeFromExt(filename: string): string` | filename: string | string | 917 | Guess a MIME type from a filename extension. Covers the formats users realistically upload via Postman; unknowns fall back to octet-stream so the generated script is always runnable. |

#### Class: PostmanAdapter

Line: 217  
Description: Read a Postman v2.1 collection JSON file and convert to TransactionGroup[].

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `parseFile` | `static parseFile(filePath: string, opts: PostmanParseOptions =` | filePath: string, opts: PostmanParseOptions = {} | PostmanParseResult | 221 | Read a Postman v2.1 collection JSON file and convert to TransactionGroup[]. |
| `parse` | `static parse( collection: PostmanCollectionFile, opts: PostmanParseOptions =` | collection: PostmanCollectionFile, opts: PostmanParseOptions = {} | PostmanParseResult | 237 | Convert a parsed Postman collection object to TransactionGroup[]. |
| `listFolderPaths` | `static listFolderPaths(collection: PostmanCollectionFile): PostmanFolderInfo[]` | collection: PostmanCollectionFile | PostmanFolderInfo[] | 387 | Enumerate every folder node in a collection (at every depth), in tree order, for the interactive folder picker. Each entry carries the raw path (for display) and the sanitized path (for use as a `folderFilter`). |
| `listFolderPathsFromFile` | `static listFolderPathsFromFile(filePath: string): PostmanFolderInfo[]` | filePath: string | PostmanFolderInfo[] | 404 | Like {@link listFolderPaths} but reads the collection from a JSON file. |
| `assertCollectionShape` | `private static assertCollectionShape( collection: PostmanCollectionFile, warnings: string[], ): void` | collection: PostmanCollectionFile, warnings: string[] | void | 417 | Implements the assert collection shape method. It enforces validation rules. |
| `requestToHAREntry` | `private static requestToHAREntry( item: PostmanItem, id: string, pageref: string, effectiveAuth: PostmanAuth \| undefined, warnings: string[], fileCtx:` | item: PostmanItem, id: string, pageref: string, effectiveAuth: PostmanAuth \| undefined, warnings: string[], fileCtx: { fileBindings: FileBinding[]; copiedFiles: PostmanParseResult['copiedFiles']; dataDir?: string; entryComments: PostmanParseResult['entryComments']; } | HAREntry | 429 | Implements the request to harentry method. |
| `makeEntry` | `private static makeEntry(args:` | args: { id: string; pageref: string; method: string; url: string; headers: { name: string; value: string }[]; body: string \| undefined; bodyMime: string \| undefined; /** Raw JS expression to emit as the request body — used for file uploads. */ expression?: string; } | HAREntry | 489 | Raw JS expression to emit as the request body — used for file uploads. |
| `resolveUrl` | `private static resolveUrl( url: PostmanUrl \| undefined, warnings: string[], where: string, ): string` | url: PostmanUrl \| undefined, warnings: string[], where: string | string | 537 | Implements the resolve url method. |
| `resolveHeaders` | `private static resolveHeaders( header: PostmanHeader[] \| string \| undefined, ):` | header: PostmanHeader[] \| string \| undefined | { name: string; value: string }[] | 564 | Implements the resolve headers method. |
| `resolveBody` | `private static resolveBody( body: PostmanBody \| undefined, where: string, fileCtx:` | body: PostmanBody \| undefined, where: string, fileCtx: { fileBindings: FileBinding[]; copiedFiles: PostmanParseResult['copiedFiles']; dataDir?: string; } | {  body: string \| undefined;  bodyMime: string \| undefined;  /** When set, a raw JS expression for the body — used for file uploads. */  expression?: string;  bodyWarnings: string[];  } | 584 | When set, a raw JS expression for the body — used for file uploads. |
| `registerFileBinding` | `private static registerFileBinding( src: string, ctx:` | src: string, ctx: { fileBindings: FileBinding[]; copiedFiles: PostmanParseResult['copiedFiles']; dataDir?: string; }, warnings: string[], where: string | FileBinding | 715 | Register a file referenced by a Postman item. De-duplicates by source path: the same file used twice in the collection produces one binding. If the file exists on the local filesystem AND a `dataDir` was supplied, copies the file into `dataDir/<basename>` so the generated script can reference it portably. If the file is missing, still emits the binding (with a TODO comment via `binding.copied=false`) so users can drop the file in later without re-running the import. |
| `authToHeaders` | `private static authToHeaders( auth: PostmanAuth \| undefined, warnings: string[], where: string, ):` | auth: PostmanAuth \| undefined, warnings: string[], where: string | { name: string; value: string }[] | 776 | Implements the auth to headers method. |
| `processEvents` | `private static processEvents( events: PostmanEvent[] \| undefined, warnings: string[], where: string, entryId: string, entryComments: PostmanParseResult['entryComments'], ): void` | events: PostmanEvent[] \| undefined, warnings: string[], where: string, entryId: string, entryComments: PostmanParseResult['entryComments'] | void | 830 | Process an item's `event[]` slots and stash translated/preserved script lines into the per-entry comments map keyed by HAREntry id. The ScriptGenerator emits the `before` lines above the `request(...)` call and the `after` lines below the default `k6Check(...)` at emission time. The translator (see PostmanScriptTranslator) handles the safe-rewrite subset (`pm.environment.set/get`, `pm.response.code/json/headers`, etc.) and emits `// TODO[port-postman]:` lines for everything else. We only warn at the CLI when nothing in the script could be translated — that's the case worth flagging because the user has the most manual work. |


### core_engine/src/recording/PostmanScriptTranslator.ts

Layer: recording  
Lines: 269  
Purpose: translatePostmanScript, countOpeners, countClosers, translateLine helpers or command handlers.

Exports: `TranslationResult`, `translatePostmanScript`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `TranslationResult` | Interface | 53 | Lines to emit at the call site, in order. Mix of code + TODO comments. |
| `LineResult` | Interface | 158 | The translated line (or original if no translation needed). |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `RES` | Inferred | 51 | PostmanScriptTranslator.ts Best-effort line-by-line translation of Postman Pre-request / Test scripts to k6 + framework equivalents. Lines we can mechanically translate become actual k6 code; lines we can't are emitted as `// TODO:` comments preserving the original text so users see exactly what to port and where. Design principles: 1. Never produce broken syntax. If a translation isn't safe, comment the original line instead. 2. The `__RES__` placeholder substitutes for the response variable name (`res1`, `res2`, …) at ScriptGenerator emission time. The translator doesn't know which res variable applies — the generator does. 3. Preserve user intent by ALWAYS appending the original lines as a final block comment, so manual review can cross-check against translations. Coverage (high-confidence patterns that get translated): Variables: pm.environment.set('k', v) → ctx.correlation['k'] = v; pm.environment.get('k') → ctx.correlation['k'] pm.collectionVariables.set/get → ctx.correlation pm.variables.set/get → ctx.correlation pm.globals.set/get → ctx.correlation Response shorthand: pm.response.code → __RES__.status pm.response.status → __RES__.status_text pm.response.json(...) → __RES__.json(...) pm.response.text() → __RES__.body pm.response.headers.get('X') → __RES__.headers['X'] pm.response.responseTime → __RES__.timings.duration pm.response.responseSize → __RES__.body.length Logging / utilities passed through unchanged: console.log/info/warn/error/debug JSON.parse / JSON.stringify Simple test wrappers (pattern-matched whole-line): pm.test('label', () => pm.expect(__RES__.X).to.eql(Y)) → k6Check(__RES__, { 'label': r => r.X === Y }); NOT translated (commented + TODO): - pm.sendRequest(...) — different shape and async semantics - pm.expect(...).chain(...) except the simple wrapper above - pm.iterationData, pm.collectionVariables.has, pm.cookies.* — k6 differs - eval / dynamic require / Chai / Lodash / tv4 / CryptoJS - setTimeout / setInterval / async/await — k6's loop model doesn't match |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `translatePostmanScript` | `export function translatePostmanScript( scriptLines: string[], kind: 'prerequest' \| 'test', ): TranslationResult` | scriptLines: string[], kind: 'prerequest' \| 'test' | TranslationResult | 71 | Translate a Postman event script (array of source lines as written in the Postman UI) into k6-compatible lines plus comments. few translation rules — pre-request can't reference pm.response of the same item). |
| `countOpeners` | `function countOpeners(s: string): number` | s: string | number | 145 | Count `{` and `(` outside string/comment context (best-effort heuristic). |
| `countClosers` | `function countClosers(s: string): number` | s: string | number | 150 | Count `}` and `)` outside string/comment context (best-effort heuristic). |
| `translateLine` | `function translateLine(line: string, kind: 'prerequest' \| 'test'): LineResult` | line: string, kind: 'prerequest' \| 'test' | LineResult | 165 | Implements the translate line function. It orchestrates process execution, emits operator-facing output. |


### core_engine/src/recording/ScriptConverter.ts

Layer: recording  
Lines: 1208  
Purpose: ScriptConverter implementation.

Imports:
- `import * as fs from 'fs';`
- `import { LifecycleSelection, ScriptGenerator, SCRIPT_API_MODULE } from './ScriptGenerator';`

Exports: `ScriptConverter`

#### Class: ScriptConverter

Line: 20  
Description: ScriptConverter Converts conventional k6 scripts (e.g. from Grafana k6 Studio, raw HAR exports, or hand-written scripts) into framework-compatible scripts that include: - `logExchange()` calls for debug replay - Request definition objects with `{id, transaction, method, url, body, params}` - `initTransactions / startTransaction / endTransaction` wrappers - Proper framework imports - Runtime variable tracking via `trackCorrelation` / `trackParameter` Handles two major input patterns: A) "Studio" scripts with `Trend`, `group()`, manual `Date.now()` timing B) "Semi-framework" scripts that already have transaction helpers but lack logExchange

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `convertFile` | `static convertFile(filePath: string, teamName?: string, lifecycle?: LifecycleSelection): string` | filePath: string, teamName?: string, lifecycle?: LifecycleSelection | string | 24 | Read a script file and return the converted source. |
| `convert` | `static convert(source: string, teamName: string, lifecycle?: LifecycleSelection): string` | source: string, teamName: string, lifecycle?: LifecycleSelection | string | 36 | Convert a raw k6 script string to a framework-compatible script. |
| `extractGroupNames` | `static extractGroupNames(source: string): string[]` | source: string | string[] | 465 | Implements the extract group names method. It orchestrates process execution. |
| `buildImportBlock` | `private static buildImportBlock( source: string, _hasTransactionImport: boolean, _hasLogReplayExchange: boolean, ): string` | source: string, _hasTransactionImport: boolean, _hasLogReplayExchange: boolean | string | 475 | Implements the build import block method. It orchestrates process execution. |
| `findImportBlockEnd` | `private static findImportBlockEnd(lines: string[]): number` | lines: string[] | number | 505 | Implements the find import block end method. |
| `matchHttpCall` | `private static matchHttpCall( line: string, ):` | line: string | { method: string; varPrefix: string } \| null | 531 | Implements the match http call method. |
| `parseHttpCall` | `private static parseHttpCall( lines: string[], startIdx: number, httpMatch:` | lines: string[], startIdx: number, httpMatch: { method: string; varPrefix: string } | {  method: string;  url: string;  body: string \| null;  params: string \| null;  varName: string;  fullCallLines: number;  } | 548 | Implements the parse http call method. |
| `splitTopLevelArgs` | `private static splitTopLevelArgs(str: string): string[]` | str: string | string[] | 618 | Split a string of function arguments at the top level (respecting nested braces, brackets, parens, and strings). |
| `buildRequestCallString` | `private static buildRequestCallString( method: string, url: string, body: string \| null, paramsStr: string \| null, entryId: string, resName: string, indent: string, primaryBaseU...` | method: string, url: string, body: string \| null, paramsStr: string \| null, entryId: string, resName: string, indent: string, primaryBaseUrl?: string, assignOnly = false, nameCounters?: Map<string, number> | string | 682 | Build a `request()` call string using the framework helper. Replaces the old request-def + http.* + logExchange pattern. When `assignOnly` is true, emits `resName = request(...)` (no `const`) so the caller can place it inside a try block with a preceding `let resName;`. Also auto-injects a `variables: { ... }` option from `${...}` template expressions found in url/body/headers, so every local-scope variable used in a request shows up in the debug report's Variables section with its resolved value at the moment of the call. Skips expressions that are already auto-tracked via Proxy/registry (env.*, ctx.*, correlation_vars[*], getUniqueItem(FILES[*])). |
| `extractRequestVars` | `private static extractRequestVars( ...exprs: (string \| null \| undefined)[] ):` | ...exprs: (string \| null \| undefined)[] | { name: string; access: string }[] | 754 | Scan url/body/headers expression strings for `${...}` template references and return the names/accessors of variables that aren't already tracked elsewhere by the framework. |
| `extractObjectProperty` | `private static extractObjectProperty(objStr: string, propName: string): string \| null` | objStr: string, propName: string | string \| null | 789 | Extract a property value from an object literal string. |
| `reindent` | `private static reindent(str: string, baseIndent: string): string` | str: string, baseIndent: string | string | 825 | Re-indent a multi-line string to align with the given base indent. |
| `isTrendAddLine` | `private static isTrendAddLine(line: string, trendVarNames: Set<string>): boolean` | line: string, trendVarNames: Set<string> | boolean | 833 | Implements the is trend add line method. |
| `getLeadingWhitespace` | `private static getLeadingWhitespace(line: string): string` | line: string | string | 841 | Implements the get leading whitespace method. |
| `sanitizeTransactionName` | `private static sanitizeTransactionName(name: string): string` | name: string | string | 851 | Sanitize a group name for use as a k6 metric name. k6 metrics must only include ASCII letters, numbers, or underscores and start with a letter or underscore (max 128 chars). |
| `applyPhaseContract` | `private static applyPhaseContract(source: string, teamName: string, lifecycle?: LifecycleSelection): string` | source: string, teamName: string, lifecycle?: LifecycleSelection | string | 860 | Implements the apply phase contract method. |
| `renderPhaseFunction` | `private static renderPhaseFunction(name: string, preludeLines: string[], groupStatements: string[]): string` | name: string, preludeLines: string[], groupStatements: string[] | string | 934 | Implements the render phase function method. |
| `partitionLifecycleStatements` | `private static partitionLifecycleStatements( statements: string[], lifecycle: LifecycleSelection, ):` | statements: string[], lifecycle: LifecycleSelection | {  moduleLevelDecls: string[];  initPrelude: string[];  actionPrelude: string[];  endPrelude: string[];  initGroups: string[];  actionGroups: string[];  endGroups: string[];  } | 953 | Implements the partition lifecycle statements method. It orchestrates process execution. |
| `splitTopLevelStatements` | `private static splitTopLevelStatements(body: string): string[]` | body: string | string[] | 1103 | Implements the split top level statements method. |
| `extractGroupName` | `private static extractGroupName(statement: string): string \| null` | statement: string | string \| null | 1129 | Implements the extract group name method. |
| `findMatchingBrace` | `private static findMatchingBrace(source: string, startIndex: number): number` | source: string, startIndex: number | number | 1134 | Implements the find matching brace method. |
| `indentBlock` | `private static indentBlock(block: string, spaces: number): string` | block: string, spaces: number | string | 1147 | Implements the indent block method. |
| `extractBaseUrlsFromSource` | `private static extractBaseUrlsFromSource(source: string): string[]` | source: string | string[] | 1156 | Extract unique base URLs (origin) from URL literals in source code. |
| `toRuntimeUrlExpression` | `private static toRuntimeUrlExpression(url: string, primaryBaseUrl?: string): string` | url: string, primaryBaseUrl?: string | string | 1169 | Implements the to runtime url expression method. |
| `extractStringLiteralValue` | `private static extractStringLiteralValue(value: string): string \| null` | value: string | string \| null | 1188 | Implements the extract string literal value method. |


### core_engine/src/recording/ScriptGenerator.ts

Layer: recording  
Lines: 435  
Purpose: ScriptGenerator implementation.

Imports:
- `import { TransactionGroup } from './TransactionGrouper';`

Exports: `SCRIPT_API_MODULE`, `LifecycleSelection`, `GenerateOptions`, `ScriptGenerator`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `LifecycleSelection` | Interface | 12 | Defines the LifecycleSelection contract used by the framework. |
| `GenerateOptions` | Interface | 17 | Raw JS code to inject at module scope, AFTER the env declaration and BEFORE the journey lifecycle store. Used by synthetic-source adapters (Postman) that need init-context bindings — e.g. `const photoBytes = await open('../data/photo.jpg', 'b');` for file uploads. The generator auto-adds the appropriate imports when file bindings are detected; callers supply additional imports via `extraImports`. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `SCRIPT_API_MODULE` | Inferred | 10 | Import specifier for the framework's VU-safe script API barrel (compiled `dist/index.js`), relative to a generated script at `testSuites/<suite>/tests/<name>.js`. Centralized here so the path — or a future bundled package name — changes in exactly one place. Older scripts that import the per-util `dist/utils/*.js` paths keep working unchanged. |

#### Class: ScriptGenerator

Line: 50  
Description: Generates formatted TypeScript/JavaScript source code based on Transaction Groups. Output uses the transaction() wrapper and request() helper from the framework utils.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `generate` | `static generate( groups: TransactionGroup[], lifecycle: LifecycleSelection \| undefined, teamName: string, options?: GenerateOptions, ): string` | groups: TransactionGroup[], lifecycle: LifecycleSelection \| undefined, teamName: string, options?: GenerateOptions | string | 55 | Generates formatted TypeScript/JavaScript source code based on Transaction Groups. Output uses the transaction() wrapper and request() helper from the framework utils. |
| `buildPhaseFunction` | `private static buildPhaseFunction( functionName: string, groups: TransactionGroup[], primaryBaseUrl?: string, startRequestId = 0, entryComments?: Map<string,` | functionName: string, groups: TransactionGroup[], primaryBaseUrl?: string, startRequestId = 0, entryComments?: Map<string, { before: string[]; after: string[] }>, entryNames?: Map<string, string>, nameCounters: Map<string, number> = new Map() | string | 117 | Implements the build phase function method. It orchestrates process execution. |
| `deriveRequestName` | `static deriveRequestName(method: string, url: string, counters: Map<string, number>): string` | method: string, url: string, counters: Map<string, number> | string | 252 | Derive a short, identifiable per-request metric name tag in the form `METHOD_lastSegment_n`: - `METHOD` → HTTP verb (GET, POST, …) - `lastSegment` → last non-empty URL path segment, query stripped, sanitized to [A-Za-z0-9_], capped at 25 chars (`/` → `root`) - `_n` → script-wide occurrence count of this exact METHOD_segment (1-based) across all phases and transactions, so repeats are disambiguated and the suffix never resets. Shared default for HAR / cURL / convert; Postman overrides with its item name. `counters` is script-wide and mutated in place. |
| `buildUrlExpression` | `private static buildUrlExpression(absoluteUrl: string, primaryBaseUrl?: string): string` | absoluteUrl: string, primaryBaseUrl?: string | string | 280 | Returns the URL expression to embed directly in the generated script (no extra quoting needed). Every URL is emitted as a backtick template literal for a uniform style (matching the k6 recorder). Same-origin URLs collapse to `${env.baseUrl}/path`; different-domain URLs stay absolute (still backticked). Base-origin substitution and escaping are shared with buildStringExpression. |
| `buildRequestBody` | `private static buildRequestBody( postData?: TransactionGroup['entries'][number]['postData'], ): string \| null` | postData?: TransactionGroup['entries'][number]['postData'] | string \| null | 297 | Implements the build request body method. |
| `buildFormUrlEncodedBodyObject` | `private static buildFormUrlEncodedBodyObject( postData: NonNullable<TransactionGroup['entries'][number]['postData']>, primaryBaseUrl?: string, ): string \| null` | postData: NonNullable<TransactionGroup['entries'][number]['postData']>, primaryBaseUrl?: string | string \| null | 332 | Build an `application/x-www-form-urlencoded` body as a JS OBJECT-literal expression so k6 URL-encodes each value itself, instead of a verbatim string. Why: k6's http request handler (k6 `js/modules/k6/http/request.go`) only encodes when the body is an object — it runs it through Go's `url.Values.Encode()` (space→`+`, `+`→`%2B`, `@`→`%40`, …). A STRING body is sent byte-for-byte with no encoding, so a value like `user+name@x.com` arrives with the `+` decoded to a space server-side (form rule: `+` == space). Emitting an object matches k6's documented behavior and the k6-Studio convert path. Recorded bodies store values already percent-encoded, so each value is URL-DECODED here before emitting — k6 re-encodes, avoiding double-encoding. Data-file params substituted in later (`getUniqueItem(...)`) return raw decoded values that k6 then encodes correctly. Returns null (→ caller keeps a string body) when the request isn't form-urlencoded, has no fields, or has duplicate field names (which a plain object literal can't represent without dropping values). |
| `formatInlineObject` | `private static formatInlineObject( obj: Record<string, string>, indent: number, primaryBaseUrl?: string, ): string` | obj: Record<string, string>, indent: number, primaryBaseUrl?: string | string | 374 | Inline-format a plain object as a JS object literal at the given indent level. Values are emitted via buildStringExpression — every value becomes a backtick template literal (uniform recorder-style output), with any occurrence of the primary base origin (e.g. in `referer` / `origin` headers) parametrised to `${env.baseUrl}` instead of hardcoding the recorded host. Keys keep their shape: bare identifiers stay unquoted, others are JSON-quoted. |
| `escapeForTemplate` | `private static escapeForTemplate(s: string): string` | s: string | string | 391 | Escape a raw string so it is safe to embed inside a `...` template literal. |
| `buildStringExpression` | `static buildStringExpression(value: string, primaryBaseUrl?: string): string` | value: string, primaryBaseUrl?: string | string | 408 | Emit a recorded string value (header value, body, URL) as a backtick template literal — uniform recorder-style output. When it contains the primary base origin, those occurrences are rewritten to `${env.baseUrl}` so the value tracks the parametrised base URL rather than pinning the recorded host (the same substitution buildUrlExpression applies to the request URL). Public so the convert path (ScriptConverter) emits metadata values in the same uniform backtick style. |
| `extractBaseUrls` | `private static extractBaseUrls(groups: TransactionGroup[]): string[]` | groups: TransactionGroup[] | string[] | 422 | Extract unique origin URLs (protocol+host) from all HAR entries in all groups. |


### core_engine/src/recording/TransactionGrouper.ts

Layer: recording  
Lines: 34  
Purpose: TransactionGrouper implementation.

Imports:
- `import { HAREntry } from '../types/HARContracts';`

Exports: `TransactionGroup`, `TransactionGrouper`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `TransactionGroup` | Interface | 3 | Defines the TransactionGroup contract used by the framework. |

#### Class: TransactionGrouper

Line: 8  
Description: Group HAR entries by 'pageref' to define transaction boundaries. If 'pageref' is missing, it creates fallback groups to ensure everything is captured.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `group` | `static group(entries: HAREntry[]): TransactionGroup[]` | entries: HAREntry[] | TransactionGroup[] | 13 | Group HAR entries by 'pageref' to define transaction boundaries. If 'pageref' is missing, it creates fallback groups to ensure everything is captured. |


### core_engine/src/reporters/AzureReporter.ts

Layer: reporters  
Lines: 14  
Purpose: AzureReporter implementation.

Imports:
- `import { ResultContract } from './ResultTransformer';`
- `import { Logger } from '../utils/logger';`

Exports: `AzureReporter`

#### Class: AzureReporter

Line: 4  
Description: Simulates pushing transformed results to Azure Application Insights.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `push` | `static push(result: ResultContract, connectionString: string): void` | result: ResultContract, connectionString: string | void | 8 | Simulates pushing transformed results to Azure Application Insights. |


### core_engine/src/reporters/CustomUploader.ts

Layer: reporters  
Lines: 14  
Purpose: CustomUploader implementation.

Imports:
- `import { ResultContract } from './ResultTransformer';`
- `import { Logger } from '../utils/logger';`

Exports: `CustomUploader`

#### Class: CustomUploader

Line: 4  
Description: Simulates a generic HTTP POST webhook uploader for custom analytic backends.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `push` | `static push(result: ResultContract, url: string): void` | result: ResultContract, url: string | void | 8 | Simulates a generic HTTP POST webhook uploader for custom analytic backends. |


### core_engine/src/reporters/GrafanaReporter.ts

Layer: reporters  
Lines: 14  
Purpose: GrafanaReporter implementation.

Imports:
- `import { ResultContract } from './ResultTransformer';`
- `import { Logger } from '../utils/logger';`

Exports: `GrafanaReporter`

#### Class: GrafanaReporter

Line: 4  
Description: Simulates pushing transformed results to an InfluxDB or Prometheus instance.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `push` | `static push(result: ResultContract, url: string): void` | result: ResultContract, url: string | void | 8 | Simulates pushing transformed results to an InfluxDB or Prometheus instance. |


### core_engine/src/reporters/ResultTransformer.ts

Layer: reporters  
Lines: 23  
Purpose: ResultTransformer implementation.

Exports: `ResultContract`, `ResultTransformer`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `ResultContract` | Interface | 1 | Defines the ResultContract contract used by the framework. |

#### Class: ResultTransformer

Line: 9  
Description: Transforms raw k6 summary JSON into a standardized ResultContract payload.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `transform` | `static transform(k6Data: any): ResultContract` | k6Data: any | ResultContract | 13 | Transforms raw k6 summary JSON into a standardized ResultContract payload. |


### core_engine/src/reporting/ArtifactWriter.ts

Layer: reporting  
Lines: 20  
Purpose: ArtifactWriter implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`

Exports: `ArtifactWriter`

#### Class: ArtifactWriter

Line: 4  
Description: Implements the artifact writer class. It performs file-system work.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `ensureDir` | `static ensureDir(dirPath: string): void` | dirPath: string | void | 5 | Implements the ensure dir method. It performs file-system work. |
| `writeJson` | `static writeJson(filePath: string, data: unknown): void` | filePath: string, data: unknown | void | 9 | Implements the write json method. It performs file-system work. |
| `writeNdjson` | `static writeNdjson(filePath: string, rows: Array<Record<string, unknown>>): void` | filePath: string, rows: Array<Record<string, unknown>> | void | 14 | Implements the write ndjson method. It performs file-system work. |


### core_engine/src/reporting/EventArtifactBuilder.ts

Layer: reporting  
Lines: 188  
Purpose: EventArtifactBuilder implementation.

Imports:
- `import * as os from 'os';`
- `import { ErrorRuntime } from '../runtime/ErrorRuntime';`
- `import { ErrorBehavior } from '../types/ConfigContracts';`
- `import { AgentContext, ErrorEvent, WarningEvent } from '../types/EventContracts';`

Exports: `EventArtifactBuilder`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `SummaryCheck` | Interface | 6 | Defines the SummaryCheck contract used by the framework. |
| `SummaryGroup` | Interface | 12 | Defines the SummaryGroup contract used by the framework. |
| `SummaryMetric` | Interface | 19 | Defines the SummaryMetric contract used by the framework. |
| `BuildEventArtifactsOptions` | Interface | 23 | Defines the BuildEventArtifactsOptions contract used by the framework. |

#### Class: EventArtifactBuilder

Line: 36  
Description: k6 --summary-export: true = breached. handleSummary: { ok: false } = breached.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `build` | `static build(options: BuildEventArtifactsOptions):` | options: BuildEventArtifactsOptions | {  errors: ErrorEvent[];  warnings: WarningEvent[];  } | 37 | Implements the build  method. It orchestrates process execution, enforces validation rules. |
| `collectCheckFailureEvents` | `private static collectCheckFailureEvents( options: BuildEventArtifactsOptions, agent: AgentContext, ): ErrorEvent[]` | options: BuildEventArtifactsOptions, agent: AgentContext | ErrorEvent[] | 78 | Implements the collect check failure events method. It orchestrates process execution. |
| `collectThresholdWarningEvents` | `private static collectThresholdWarningEvents( options: BuildEventArtifactsOptions, agent: AgentContext, ): WarningEvent[]` | options: BuildEventArtifactsOptions, agent: AgentContext | WarningEvent[] | 131 | Implements the collect threshold warning events method. |
| `buildAgentContext` | `private static buildAgentContext(): AgentContext` | None | AgentContext | 159 | Implements the build agent context method. |
| `isThresholdBreached` | `private static isThresholdBreached(value: boolean \|` | value: boolean \| { ok?: boolean } | boolean | 169 | k6 --summary-export: true = breached. handleSummary: { ok: false } = breached. |
| `toGroupArray` | `private static toGroupArray(groups?: Record<string, SummaryGroup> \| SummaryGroup[]): SummaryGroup[]` | groups?: Record<string, SummaryGroup> \| SummaryGroup[] | SummaryGroup[] | 175 | Normalize k6 summary groups (object-map or array) to array. |
| `toCheckArray` | `private static toCheckArray(checks?: Record<string, SummaryCheck> \| SummaryCheck[]): SummaryCheck[]` | checks?: Record<string, SummaryCheck> \| SummaryCheck[] | SummaryCheck[] | 182 | Normalize k6 summary checks (object-map or array) to array. |


### core_engine/src/reporting/Histogram.ts

Layer: reporting  
Lines: 201  
Purpose: RelativeHistogram implementation.

Exports: `percentileR7`, `HistogramJSON`, `RelativeHistogram`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `HistogramJSON` | Interface | 48 | Serialized form of a RelativeHistogram — compact and self-describing for merge. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `percentileR7` | `export function percentileR7(values: number[], pct: number, presorted = false): number` | values: number[], pct: number, presorted = false | number | 32 | Histogram.ts Accuracy core for distributed result aggregation (see .md/Distributed-Load-Test-Design-Approach.md §2). Two primitives: 1. percentileR7() — the EXACT percentile k6 itself computes (R-7 / Excel PERCENTILE.INC / NumPy default), replicated bit-for-bit from k6-master/metrics/sink.go:145-165. Used for the single-machine headline and the multi-machine `exact` mode (pool all raw values, then call this). 2. RelativeHistogram — a compact, MERGEABLE histogram with a bounded RELATIVE error (the "HDR-style" property): bucket counts add losslessly across machines and across time buckets, and a percentile read off the merged histogram is accurate to `relativeAccuracy` (default 0.1%). Used as the endurance-safe substrate and for any-duration zoom. The histogram uses logarithmic ("DDSketch-style") bucketing: a value v maps to key = ceil(ln(v) / ln(gamma)), with gamma chosen so consecutive bucket edges are a fixed RELATIVE distance apart. This guarantees the relative-error bound while keeping size bounded by duration/precision, not by request count — exactly what multi-hour endurance tests need. Merging is associative + commutative (bins add), so tree/incremental reduction needs no redesign. No external dependency. |

#### Class: RelativeHistogram

Line: 61  
Description: (default 0.001 = 0.1%, i.e. "3 significant figures").

| Property | Type | Line | Description |
|---|---|---:|---|
| `relativeAccuracy` | number | 62 | Class state or configuration value used by the class methods. |
| `gamma` | number | 63 | Class state or configuration value used by the class methods. |
| `logGamma` | number | 64 | Class state or configuration value used by the class methods. |
| `buckets` | Inferred | 65 | Class state or configuration value used by the class methods. |
| `zeroCount` | Inferred | 66 | Class state or configuration value used by the class methods. |
| `count` | Inferred | 67 | Class state or configuration value used by the class methods. |
| `sum` | Inferred | 68 | Class state or configuration value used by the class methods. |
| `min` | Inferred | 69 | Class state or configuration value used by the class methods. |
| `max` | Inferred | 70 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `constructor` | `constructor(relativeAccuracy = 0.001)` | relativeAccuracy = 0.001 | Inferred | 76 | (default 0.001 = 0.1%, i.e. "3 significant figures"). |
| `fromSignificantDigits` | `static fromSignificantDigits(digits: number): RelativeHistogram` | digits: number | RelativeHistogram | 88 | Map significant decimal digits (k6/HDR style) to a relative accuracy. |
| `keyOf` | `private keyOf(value: number): number` | value: number | number | 92 | Implements the key of method. |
| `valueOf` | `private valueOf(key: number): number` | key: number | number | 97 | Representative (midpoint) value for a bucket key. Within `a` of every member. |
| `record` | `record(value: number, n = 1): void` | value: number, n = 1 | void | 102 | Record `value` (`n` times, default 1). Negative values are clamped to 0. |
| `merge` | `merge(other: RelativeHistogram): void` | other: RelativeHistogram | void | 121 | Add another histogram into this one (lossless, associative). Both must share the same relativeAccuracy — otherwise the bucket keys are incomparable. |
| `valueAtPercentile` | `valueAtPercentile(pct: number): number` | pct: number | number | 152 | Value at percentile `pct` (a fraction in [0,1]). Uses the **R-7 rank interpolation** k6 uses (i = pct*(N-1); interpolate between the values at the two neighbouring ranks) so the result tracks k6's exact percentile closely — instead of nearest-rank, which diverges in sparse tails at small N. Each bucket's representative value is within `relativeAccuracy` of the true value, so the interpolated result stays within ~`relativeAccuracy` of k6's number. Clamped to [min, max] so it never falls outside observed data. |
| `valueAtRank` | `private valueAtRank(rank: number, sortedKeys: number[]): number` | rank: number, sortedKeys: number[] | number | 165 | Representative value at a 0-based rank (the `rank`-th smallest observation). |
| `toJSON` | `toJSON(): HistogramJSON` | None | HistogramJSON | 176 | Implements the to json method. |
| `fromJSON` | `static fromJSON(json: HistogramJSON): RelativeHistogram` | json: HistogramJSON | RelativeHistogram | 188 | Implements the from json method. |


### core_engine/src/reporting/HistogramArtifactBuilder.ts

Layer: reporting  
Lines: 190  
Purpose: HistogramArtifactBuilder implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as readline from 'readline';`
- `import { HistogramJSON, RelativeHistogram } from './Histogram';`

Exports: `OVERVIEW_KEY`, `HistogramArtifact`, `BuildHistogramOptions`, `HistogramArtifactBuilder`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `HistogramArtifact` | Interface | 29 | Histogram time-bucket size (seconds). A whole multiple of the counter bucket. |
| `BuildHistogramOptions` | Interface | 44 | Histogram time-bucket size in seconds (default 10). |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `OVERVIEW_KEY` | Inferred | 27 | Key for the overall (all-requests) http_req_duration histogram series. |

#### Class: HistogramArtifactBuilder

Line: 57  
Description: Resolve the histogram time-bucket (seconds), kept a whole multiple of the counter bucket so the two timelines align. Default is **adaptive**: sized from the planned test duration to target ~600 timeline points, clamped to [counterBucket, 60s]. This gives short/spike tests fine resolution (down to the counter bucket, e.g. 2s) and long soaks a bounded artifact (≈600 points). An explicit `override` (runtime setting / env) wins. Bucket size never affects the full-run / SLA percentile (lossless sum) — only zoom granularity.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `resolveBucketSeconds` | `static resolveBucketSeconds(counterBucketSeconds: number, plannedDurationSeconds: number, override?: number): number` | counterBucketSeconds: number, plannedDurationSeconds: number, override?: number | number | 67 | Resolve the histogram time-bucket (seconds), kept a whole multiple of the counter bucket so the two timelines align. Default is **adaptive**: sized from the planned test duration to target ~600 timeline points, clamped to [counterBucket, 60s]. This gives short/spike tests fine resolution (down to the counter bucket, e.g. 2s) and long soaks a bounded artifact (≈600 points). An explicit `override` (runtime setting / env) wins. Bucket size never affects the full-run / SLA percentile (lossless sum) — only zoom granularity. |
| `build` | `static async build( streamPath: string, options: BuildHistogramOptions =` | streamPath: string, options: BuildHistogramOptions = {} | Promise<HistogramArtifact \| null> | 79 | Build the artifact in memory. Returns null if the stream is missing/empty. |
| `writeArtifact` | `static async writeArtifact( streamPath: string, outPath: string, options: BuildHistogramOptions =` | streamPath: string, outPath: string, options: BuildHistogramOptions = {} | Promise<HistogramArtifact \| null> | 180 | Build and write `metrics-histogram.json`. Returns the artifact (or null). |


### core_engine/src/reporting/LiveEventLogWriter.ts

Layer: reporting  
Lines: 76  
Purpose: LiveEventLogWriter implementation.

Imports:
- `import * as fs from 'fs';`

Exports: `LiveEventLogWriter`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `ERROR_EVENT_PREFIX` | Inferred | 22 | Module-level constant or configuration value. |
| `WARNING_EVENT_PREFIX` | Inferred | 23 | Module-level constant or configuration value. |

#### Class: LiveEventLogWriter

Line: 25  
Description: Truncate both files so they fill fresh as events arrive this run.

| Property | Type | Line | Description |
|---|---|---:|---|
| `errorRows` | Inferred | 26 | Class state or configuration value used by the class methods. |
| `warningRows` | Inferred | 27 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `constructor` | `constructor( private readonly errorsPath: string, private readonly warningsPath: string, )` | private readonly errorsPath: string, private readonly warningsPath: string | Inferred | 29 | Implements the constructor method. |
| `start` | `start(): void` | None | void | 35 | Truncate both files so they fill fresh as events arrive this run. |
| `consume` | `consume(msg: string): void` | msg: string | void | 45 | Feed one already-dequoted console message. Appends a line to the matching ndjson file when the message is a framework error/warning event; ignores everything else. Safe to call for every console line. |
| `append` | `private append(file: string, payload: string, kind: 'error' \| 'warning'): void` | file: string, payload: string, kind: 'error' \| 'warning' | void | 57 | Implements the append method. It performs file-system work, parses structured configuration or artifact data. |


### core_engine/src/reporting/RequestMetricLogWriter.ts

Layer: reporting  
Lines: 323  
Purpose: RequestMetricLogWriter implementation.

Imports:
- `import * as fs from 'fs';`

Exports: `RequestMetricLogContext`, `RequestMetricLogWriter`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `RawPoint` | Interface | 50 | Defines the RawPoint contract used by the framework. |
| `RequestMetricLogContext` | Interface | 63 | `TID_<planName>` |
| `PendingRow` | Interface | 71 | A request row buffered until its checks are known. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `POLL_INTERVAL_MS` | Inferred | 27 | Module-level constant or configuration value. |
| `COLUMNS` | Inferred | 31 | Module-level constant or configuration value. |
| `PROMOTED_TAGS` | Inferred | 48 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `csvField` | `function csvField(value: string): string` | value: string | string | 90 | RFC-4180-style CSV field escaping. |

#### Class: RequestMetricLogWriter

Line: 97  
Description: Begin polling the stream file and appending rows.

| Property | Type | Line | Description |
|---|---|---:|---|
| `offset` | Inferred | 98 | Class state or configuration value used by the class methods. |
| `partial` | Inferred | 99 | Class state or configuration value used by the class methods. |
| `timer` | NodeJS.Timeout \| null | 100 | Class state or configuration value used by the class methods. |
| `rows` | Inferred | 101 | Class state or configuration value used by the class methods. |
| `pending` | Inferred | 106 | Class state or configuration value used by the class methods. |
| `curIterByVu` | Inferred | 108 | Class state or configuration value used by the class methods. |
| `seq` | Inferred | 109 | Class state or configuration value used by the class methods. |
| `outBuf` | Inferred | 110 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `constructor` | `constructor( private readonly streamPath: string, private readonly outPath: string, private readonly ctx: RequestMetricLogContext, )` | private readonly streamPath: string, private readonly outPath: string, private readonly ctx: RequestMetricLogContext | Inferred | 112 | Implements the constructor method. |
| `start` | `start(): void` | None | void | 119 | Begin polling the stream file and appending rows. |
| `stop` | `stop(): void` | None | void | 127 | Stop polling, flush any remaining buffered rows, and write them out. |
| `tick` | `private tick(): void` | None | void | 143 | Implements the tick method. It performs file-system work. |
| `writeOut` | `private writeOut(): void` | None | void | 172 | Implements the write out method. It performs file-system work. |
| `processLine` | `private processLine(line: string): void` | line: string | void | 180 | Parse one stream line; route http_req_duration + checks Points. |
| `handleRequest` | `private handleRequest( p: RawPoint, tags: Record<string, string>, vu: string, iterStr: string, iterNum: number, ): void` | p: RawPoint, tags: Record<string, string>, vu: string, iterStr: string, iterNum: number | void | 211 | Implements the handle request method. |
| `handleCheck` | `private handleCheck(p: RawPoint, tags: Record<string, string>, vu: string): void` | p: RawPoint, tags: Record<string, string>, vu: string | void | 252 | Implements the handle check method. It orchestrates process execution. |
| `maybeAdvanceIteration` | `private maybeAdvanceIteration(vu: string, iterNum: number): void` | vu: string, iterNum: number | void | 274 | Implements the maybe advance iteration method. |
| `flushAllPending` | `private flushAllPending(): void` | None | void | 288 | Implements the flush all pending method. |
| `emitRow` | `private emitRow(row: PendingRow): void` | row: PendingRow | void | 295 | Implements the emit row method. |


### core_engine/src/reporting/RunReportGenerator.ts

Layer: reporting  
Lines: 2750  
Purpose: RunReportGenerator implementation.

Imports:
- `import { ReportBundle } from '../types/ReportingContracts';`

Exports: `RunReportGenerator`

#### Class: RunReportGenerator

Line: 3  
Description: Implements the run report generator class. It orchestrates process execution, parses structured configuration or artifact data, enforces validation rules.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `generate` | `static generate(bundle: ReportBundle): string` | bundle: ReportBundle | string | 4 | Implements the generate method. It orchestrates process execution, parses structured configuration or artifact data, enforces validation rules. |
| `escapeHtml` | `private static escapeHtml(value: string): string` | value: string | string | 2741 | Implements the escape html method. |


### core_engine/src/reporting/RunSummaryBuilder.ts

Layer: reporting  
Lines: 128  
Purpose: RunSummaryBuilder implementation.

Imports:
- `import { CiSummary, TimeSeriesFile, TransactionMetricsFile } from '../types/ReportingContracts';`

Exports: `RunSummaryBuilder`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `BuildRunSummaryOptions` | Interface | 3 | Allowed transaction failure rate (percent 0–100), resolved from global_sla.transaction.errorRate (preferred) or the flat global_sla.errorRate. The run fails only when the observed transaction failure rate exceeds this. Defaults to 0 (any transaction failure fails the run) when not configured. |

#### Class: RunSummaryBuilder

Line: 21  
Description: k6 --summary-export: true = breached. handleSummary: { ok: false } = breached.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `buildCiSummary` | `static buildCiSummary(options: BuildRunSummaryOptions): CiSummary` | options: BuildRunSummaryOptions | CiSummary | 22 | Implements the build ci summary method. It orchestrates process execution. |
| `buildEmptyTimeseries` | `static buildEmptyTimeseries(startTime: string, bucketSizeSeconds: number): TimeSeriesFile` | startTime: string, bucketSizeSeconds: number | TimeSeriesFile | 78 | Implements the build empty timeseries method. |
| `countThresholdFailures` | `private static countThresholdFailures(metrics: Record<string,` | metrics: Record<string, { thresholds?: Record<string, boolean \| { ok?: boolean }> }> | number | 92 | Implements the count threshold failures method. |
| `collectFailedThresholdRules` | `private static collectFailedThresholdRules( metrics: Record<string,` | metrics: Record<string, { thresholds?: Record<string, boolean \| { ok?: boolean }> }> | string[] | 104 | Implements the collect failed threshold rules method. |
| `isThresholdBreached` | `private static isThresholdBreached(value: boolean \|` | value: boolean \| { ok?: boolean } | boolean | 119 | k6 --summary-export: true = breached. handleSummary: { ok: false } = breached. |
| `asNumber` | `private static asNumber(value: string \| number \| boolean \| undefined): number \| undefined` | value: string \| number \| boolean \| undefined | number \| undefined | 124 | Implements the as number method. |


### core_engine/src/reporting/TimeseriesArtifactBuilder.ts

Layer: reporting  
Lines: 255  
Purpose: TimeseriesArtifactBuilder implementation.

Imports:
- `import { HostSnapshot } from '../execution/HostMonitor';`
- `import { TimeseriesRuntime } from '../runtime/TimeseriesRuntime';`
- `import { AgentContext, ErrorEvent, WarningEvent } from '../types/EventContracts';`
- `import { TimeSeriesFile, TransactionMetricsFile } from '../types/ReportingContracts';`
- `import { TimeseriesStreamParser } from './TimeseriesStreamParser';`

Exports: `TimeseriesArtifactBuilder`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `SummaryMetric` | Interface | 7 | Defines the SummaryMetric contract used by the framework. |
| `BuildTimeseriesArtifactOptions` | Interface | 21 | Path to the k6 streaming JSON output (one Metric/Point per line). When provided AND parseable, the artifact carries per-bucket aggregates for the full run — req/s, response-time percentiles, VUs, iterations, data in/out, per-transaction duration & checkrate — turning the report's "trend over time" panels from one-bar bar charts into proper line charts (Proposal 5, Wave 1). When omitted or unreadable, falls back to the legacy single-point-at-endTime behavior so existing runs and tests keep working. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `metricVal` | `function metricVal(metric: SummaryMetric \| undefined, key: string): number` | metric: SummaryMetric \| undefined, key: string | number | 13 | Read a metric value handling both k6 handleSummary ({values:{…}}) and --summary-export (flat) formats. |

#### Class: TimeseriesArtifactBuilder

Line: 60  
Description: Implements the timeseries artifact builder class. It orchestrates process execution, enforces validation rules.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `build` | `static async build(options: BuildTimeseriesArtifactOptions): Promise<TimeSeriesFile>` | options: BuildTimeseriesArtifactOptions | Promise<TimeSeriesFile> | 61 | Implements the build  method. It orchestrates process execution, enforces validation rules. |
| `asNumber` | `private static asNumber(value: string \| number \| boolean \| undefined): number` | value: string \| number \| boolean \| undefined | number | 251 | Implements the as number method. |


### core_engine/src/reporting/TimeseriesStreamParser.ts

Layer: reporting  
Lines: 692  
Purpose: TimeseriesStreamParser implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as readline from 'readline';`

Exports: `PhaseTimings`, `OverviewBucket`, `TransactionBucket`, `RequestBucket`, `ParsedTransactionSeries`, `ParsedTimeseries`, `TimeseriesStreamParser`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `PhaseTimings` | Interface | 37 | Per-phase HTTP timing breakdown carries the same four percentile-ish aggregates as the overall `http_req_duration` for one of the six phases (waiting, tls handshaking, sending, connecting, receiving, blocked). Mirrors what k6's web-dashboard surfaces in its Timings tab. |
| `OverviewBucket` | Interface | 44 | Defines the OverviewBucket contract used by the framework. |
| `TransactionBucket` | Interface | 75 | Defines the TransactionBucket contract used by the framework. |
| `RequestBucket` | Interface | 102 | Per-bucket aggregate for a single named request (k6 `name` tag — the explicit request name, or the URL when none was supplied). Mirrors TransactionBucket but scoped to one HTTP request rather than a whole transaction. Carries the raw duration samples so the report can recompute exact stats for any time window, plus per-request metadata (method/transaction/url) needed by the Top Requests table. `failed` counts http_req_failed=1 samples in the bucket. |
| `ParsedTransactionSeries` | Interface | 122 | One parsed series per (scenario, transaction). The scenario comes from k6's `scenario` system tag on each sample, so same-named transactions in different journeys stay separate. Tags are explicit fields — never a composite key. |
| `ParsedTimeseries` | Interface | 128 | Earliest bucket ts observed across all metrics. |
| `OverviewRaw` | Interface | 156 | Defines the OverviewRaw contract used by the framework. |
| `TransactionRaw` | Interface | 178 | Defines the TransactionRaw contract used by the framework. |
| `RequestRaw` | Interface | 185 | Defines the RequestRaw contract used by the framework. |
| `ParseOptions` | Interface | 199 | Comprehensive transaction-name allowlist drawn from the run's manifest. |
| `RawPoint` | Interface | 221 | Defines the RawPoint contract used by the framework. |
| `TrendStats` | Interface | 642 | Percentile values keyed by number-as-string (e.g. { '90': 210, '95': 260 }). |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `normalizePercentiles` | `function normalizePercentiles(input?: number[]): number[]` | input?: number[] | number[] | 213 | Normalize a percentile list: ensure p90 is present, dedupe, sort ascending. |
| `getOverview` | `function getOverview(map: Map<number, OverviewRaw>, key: number): OverviewRaw` | map: Map<number, OverviewRaw>, key: number | OverviewRaw | 495 | Implements the get overview function. |
| `emptyPhase` | `function emptyPhase(): PhaseTimings` | None | PhaseTimings | 521 | Empty phase-timings struct for empty/missing buckets. |
| `phaseStats` | `function phaseStats(values: number[]): PhaseTimings` | values: number[] | PhaseTimings | 529 | Phase charts keep a fixed avg/p90/p95/p99 shape (k6 web-dashboard parity), independent of the configured percentile set. |
| `finalizeOverview` | `function finalizeOverview( raw: OverviewRaw \| undefined, bucketKey: number, bucketSeconds: number, pcts: number[], ): OverviewBucket` | raw: OverviewRaw \| undefined, bucketKey: number, bucketSeconds: number, pcts: number[] | OverviewBucket | 535 | Implements the finalize overview function. |
| `finalizeTransaction` | `function finalizeTransaction(raw: TransactionRaw \| undefined, bucketKey: number, pcts: number[]): TransactionBucket` | raw: TransactionRaw \| undefined, bucketKey: number, pcts: number[] | TransactionBucket | 587 | Implements the finalize transaction function. |
| `finalizeRequest` | `function finalizeRequest( raw: RequestRaw \| undefined, bucketKey: number, pcts: number[], meta:` | raw: RequestRaw \| undefined, bucketKey: number, pcts: number[], meta: { method: string; transaction: string; url: string } | RequestBucket | 611 | Implements the finalize request function. |
| `computeTrendStats` | `function computeTrendStats(values: number[], pcts: number[]): TrendStats` | values: number[], pcts: number[] | TrendStats | 659 | Compute Trend-metric stats from a per-bucket sample array. Sorts in place (caller's array is discarded after finalize so the mutation is safe and saves a copy). Percentiles use LINEAR INTERPOLATION between neighboring ranks — the exact algorithm k6 itself uses (TrendSink.P): the report's graph traces therefore match k6's reported numbers and, crucially, percentiles separate even for the small per-bucket sample counts produced by low-VU runs (nearest-rank used to collapse them all onto the bucket's max). |
| `percentile` | `function percentile(sorted: number[], p: number): number` | sorted: number[], p: number | number | 682 | Linear-interpolation percentile matching k6's TrendSink.P: index = p·(n−1), then interpolate between the floor/ceil samples. `sorted` must be ascending. `p` is a fraction in [0,1]. |

#### Class: TimeseriesStreamParser

Line: 226  
Description: Stream-parse the file. Returns `null` if the file doesn't exist or is empty.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `parseFile` | `static async parseFile( streamPath: string, options: ParseOptions, ): Promise<ParsedTimeseries \| null>` | streamPath: string, options: ParseOptions | Promise<ParsedTimeseries \| null> | 228 | Stream-parse the file. Returns `null` if the file doesn't exist or is empty. |


### core_engine/src/reporting/TransactionMetricLogWriter.ts

Layer: reporting  
Lines: 285  
Purpose: TransactionMetricLogWriter implementation.

Imports:
- `import * as fs from 'fs';`

Exports: `TransactionMetricLogContext`, `TransactionMetricLogWriter`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `RawPoint` | Interface | 47 | Defines the RawPoint contract used by the framework. |
| `TransactionMetricLogContext` | Interface | 58 | `TID_<planName>` |
| `PendingRow` | Interface | 66 | A transaction row anchored on its checkrate Point, awaiting its duration. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `POLL_INTERVAL_MS` | Inferred | 29 | Module-level constant or configuration value. |
| `CHECKRATE_SUFFIX` | Inferred | 31 | Module-level constant or configuration value. |
| `COLUMNS` | Inferred | 34 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `csvField` | `function csvField(value: string): string` | value: string | string | 78 | RFC-4180-style CSV field escaping. |

#### Class: TransactionMetricLogWriter

Line: 85  
Description: Begin polling the stream file and appending rows.

| Property | Type | Line | Description |
|---|---|---:|---|
| `offset` | Inferred | 86 | Class state or configuration value used by the class methods. |
| `partial` | Inferred | 87 | Class state or configuration value used by the class methods. |
| `timer` | NodeJS.Timeout \| null | 88 | Class state or configuration value used by the class methods. |
| `rows` | Inferred | 89 | Class state or configuration value used by the class methods. |
| `knownTxns` | Inferred | 93 | Class state or configuration value used by the class methods. |
| `pending` | Inferred | 96 | Class state or configuration value used by the class methods. |
| `outBuf` | Inferred | 97 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `constructor` | `constructor( private readonly streamPath: string, private readonly outPath: string, private readonly ctx: TransactionMetricLogContext, )` | private readonly streamPath: string, private readonly outPath: string, private readonly ctx: TransactionMetricLogContext | Inferred | 99 | Implements the constructor method. |
| `start` | `start(): void` | None | void | 106 | Begin polling the stream file and appending rows. |
| `stop` | `stop(): void` | None | void | 114 | Stop polling and flush any remaining samples. |
| `tick` | `private tick(): void` | None | void | 133 | Implements the tick method. It performs file-system work. |
| `writeOut` | `private writeOut(): void` | None | void | 162 | Implements the write out method. It performs file-system work. |
| `processLine` | `private processLine(line: string): void` | line: string | void | 173 | Parse one stream line; route `<txn>_checkrate` Rate Points (the row anchor) and their matching `<txn>` duration Trend Points. |
| `handleCheckrate` | `private handleCheckrate(p: RawPoint): void` | p: RawPoint | void | 193 | A `<txn>_checkrate` Point: create the row, emit if duration already seen. |
| `handleDuration` | `private handleDuration(p: RawPoint): void` | p: RawPoint | void | 227 | A `<txn>` duration Trend Point (ms): fill the row's responsetime, emit it. |
| `rowKey` | `private rowKey(vu: string, iter: string, transaction: string): string` | vu: string, iter: string, transaction: string | string | 254 | Implements the row key method. |
| `flushAllPending` | `private flushAllPending(): void` | None | void | 258 | Implements the flush all pending method. |
| `emitRow` | `private emitRow(row: PendingRow): void` | row: PendingRow | void | 267 | Implements the emit row method. |


### core_engine/src/reporting/TransactionMetricsBuilder.ts

Layer: reporting  
Lines: 392  
Purpose: TransactionMetricsBuilder implementation.

Imports:
- `import { TransactionMetricRow, TransactionMetricsFile } from '../types/ReportingContracts';`

Exports: `TransactionMetricsBuilder`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `SummaryMetric` | Interface | 9 | k6 --summary-export metric shape: Trend → { avg, min, max, med, "p(90)", "p(95)", thresholds? } Rate → { value, passes, fails, thresholds? } Counter→ { count, rate, thresholds? } |
| `SummaryCheck` | Interface | 14 | Defines the SummaryCheck contract used by the framework. |
| `SummaryGroup` | Interface | 20 | Defines the SummaryGroup contract used by the framework. |
| `BuildTransactionMetricsOptions` | Interface | 26 | Defines the BuildTransactionMetricsOptions contract used by the framework. |
| `GroupAggregate` | Interface | 36 | Last-resort iteration count, used only when the `<name>_count` Counter is absent. Pass/fail no longer come from here — they're always read from the `<name>_checkrate` Rate metric in `buildGroupRow`. |

#### Class: TransactionMetricsBuilder

Line: 46  
Description: Approximate standard deviation from percentile data when handleSummary stddev is absent. Uses normal-distribution relationship p90 = avg + 1.282*σ (or p95 = avg + 1.645*σ).

| Property | Type | Line | Description |
|---|---|---:|---|
| `BUILT_IN_METRICS` | Inferred | 47 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `build` | `static build(options: BuildTransactionMetricsOptions): TransactionMetricsFile` | options: BuildTransactionMetricsOptions | TransactionMetricsFile | 69 | Implements the build  method. |
| `buildGroupRow` | `private static buildGroupRow( group: GroupAggregate, trendMetrics: Array<` | group: GroupAggregate, trendMetrics: Array<{ metricName: string; metric: SummaryMetric }>, allMetrics: Record<string, SummaryMetric>, options: BuildTransactionMetricsOptions | TransactionMetricRow | 94 | Implements the build group row method. It orchestrates process execution. |
| `buildMetricOnlyRow` | `private static buildMetricOnlyRow( metricName: string, metric: SummaryMetric, options: BuildTransactionMetricsOptions, ): TransactionMetricRow` | metricName: string, metric: SummaryMetric, options: BuildTransactionMetricsOptions | TransactionMetricRow | 135 | Implements the build metric only row method. |
| `applyConfiguredStats` | `private static applyConfiguredStats( row: TransactionMetricRow, metric: SummaryMetric \| undefined, configuredStats: string[], ): TransactionMetricRow` | row: TransactionMetricRow, metric: SummaryMetric \| undefined, configuredStats: string[] | TransactionMetricRow | 153 | Implements the apply configured stats method. It orchestrates process execution. |
| `approximateStddev` | `private static approximateStddev(metric: SummaryMetric \| undefined): number \| undefined` | metric: SummaryMetric \| undefined | number \| undefined | 205 | Approximate standard deviation from percentile data when handleSummary stddev is absent. Uses normal-distribution relationship p90 = avg + 1.282*σ (or p95 = avg + 1.645*σ). |
| `collectGroups` | `private static collectGroups(rootGroup?: SummaryGroup): GroupAggregate[]` | rootGroup?: SummaryGroup | GroupAggregate[] | 225 | Implements the collect groups method. |
| `aggregateGroup` | `private static aggregateGroup(group: SummaryGroup): GroupAggregate` | group: SummaryGroup | GroupAggregate | 242 | Collect a group's name and a last-resort iteration count from a root_group node. The count (min of each check's total executions, plus nested groups) is used only when the `<name>_count` Counter is missing. Pass/fail are NOT derived here — they come exclusively from the `<name>_checkrate` Rate metric in `buildGroupRow`. (The native-check estimation that used to live here was removed: the pre-flight ScriptContractGuard rejects raw `check()`/`group()`, so every runnable transaction always has the Rate metric.) |
| `toGroupArray` | `private static toGroupArray(groups?: Record<string, SummaryGroup> \| SummaryGroup[]): SummaryGroup[]` | groups?: Record<string, SummaryGroup> \| SummaryGroup[] | SummaryGroup[] | 257 | Normalize k6 summary groups (object-map or array) to array. |
| `toCheckArray` | `private static toCheckArray(checks?: Record<string, SummaryCheck> \| SummaryCheck[]): SummaryCheck[]` | checks?: Record<string, SummaryCheck> \| SummaryCheck[] | SummaryCheck[] | 264 | Normalize k6 summary checks (object-map or array) to array. |
| `isTrend` | `private static isTrend(metric: SummaryMetric): boolean` | metric: SummaryMetric | boolean | 272 | Detect Trend metrics by presence of 'avg' (only Trend metrics have it). |
| `metricValue` | `private static metricValue(metric: SummaryMetric, key: string): number \| undefined` | metric: SummaryMetric, key: string | number \| undefined | 277 | Read a metric value from either handleSummary (values.key) or --summary-export (flat key). |
| `isTransactionMetric` | `private static isTransactionMetric( metricName: string, metric: SummaryMetric, groups: GroupAggregate[], ): boolean` | metricName: string, metric: SummaryMetric, groups: GroupAggregate[] | boolean | 284 | Implements the is transaction metric method. |
| `findMatchingMetric` | `private static findMatchingMetric( groupName: string, trendMetrics: Array<` | groupName: string, trendMetrics: Array<{ metricName: string; metric: SummaryMetric }> | SummaryMetric \| undefined | 305 | Implements the find matching metric method. |
| `findCounterValue` | `private static findCounterValue( groupName: string, allMetrics: Record<string, SummaryMetric>, ): number \| undefined` | groupName: string, allMetrics: Record<string, SummaryMetric> | number \| undefined | 320 | Find <name>_count Counter metric and return its count value. |
| `findResultMetric` | `private static findResultMetric( groupName: string, allMetrics: Record<string, SummaryMetric>, ): SummaryMetric \| undefined` | groupName: string, allMetrics: Record<string, SummaryMetric> | SummaryMetric \| undefined | 341 | Find the <name>_checkrate Rate metric for a transaction, if present. Emitted by transaction() (Proposal 3): one sample per iteration carrying whether that iteration observed any failure (failed k6Check or thrown error). Exact per-iteration counts — no approximation. |
| `displayName` | `private static displayName(metricName: string): string` | metricName: string | string | 356 | Implements the display name method. |
| `normalize` | `private static normalize(value: string): string` | value: string | string | 360 | Implements the normalize method. |
| `mapStatToMetricValueKey` | `private static mapStatToMetricValueKey(stat: string): string \| undefined` | stat: string | string \| undefined | 368 | Implements the map stat to metric value key method. |


### core_engine/src/runtime/ErrorRuntime.ts

Layer: runtime  
Lines: 79  
Purpose: ErrorRuntime implementation.

Imports:
- `import { ErrorBehavior } from '../types/ConfigContracts';`
- `import { AgentContext, ErrorCause, ErrorEvent, SnapshotReference, VariableUsage, WarningEvent } from '../types/EventContracts';`

Exports: `ErrorRuntimeContext`, `ErrorRuntime`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `ErrorRuntimeContext` | Interface | 4 | Defines the ErrorRuntimeContext contract used by the framework. |

#### Class: ErrorRuntime

Line: 23  
Description: Implements the error runtime class.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `buildErrorEvent` | `static buildErrorEvent( ctx: ErrorRuntimeContext, type: string, message: string, extras?:` | ctx: ErrorRuntimeContext, type: string, message: string, extras?: { cause?: ErrorCause; correlation?: VariableUsage; data?: VariableUsage; snapshot?: SnapshotReference; } | ErrorEvent | 24 | Implements the build error event method. |
| `buildWarningEvent` | `static buildWarningEvent( runId: string, type: string, message: string, extras?: Partial<WarningEvent>, ): WarningEvent` | runId: string, type: string, message: string, extras?: Partial<WarningEvent> | WarningEvent | 63 | Implements the build warning event method. |


### core_engine/src/runtime/LifecycleRuntime.ts

Layer: runtime  
Lines: 74  
Purpose: LifecycleRuntime implementation.

Imports:
- `import { ErrorBehavior } from '../types/ConfigContracts';`

Exports: `JourneyPhase`, `JourneyContext`, `LifecyclePhaseFns`, `LifecycleRunState`, `LifecycleDecision`, `LifecycleRuntime`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `JourneyPhase` | TypeAlias | 3 | Defines the JourneyPhase contract used by the framework. |
| `JourneyContext` | Interface | 5 | Defines the JourneyContext contract used by the framework. |
| `LifecyclePhaseFns` | Interface | 12 | Defines the LifecyclePhaseFns contract used by the framework. |
| `LifecycleRunState` | Interface | 18 | Defines the LifecycleRunState contract used by the framework. |
| `LifecycleDecision` | Interface | 25 | Defines the LifecycleDecision contract used by the framework. |

#### Class: LifecycleRuntime

Line: 32  
Description: Implements the lifecycle runtime class.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `createContext` | `static createContext(): JourneyContext` | None | JourneyContext | 33 | Implements the create context method. |
| `createState` | `static createState(): LifecycleRunState` | None | LifecycleRunState | 42 | Implements the create state method. |
| `decide` | `static decide(state: LifecycleRunState, shouldEndNow: boolean): LifecycleDecision` | state: LifecycleRunState, shouldEndNow: boolean | LifecycleDecision | 51 | Implements the decide method. |
| `applyErrorBehavior` | `static applyErrorBehavior(state: LifecycleRunState, behavior: ErrorBehavior): 'continue' \| 'stop_iteration' \| 'stop_vu' \| 'abort_test'` | state: LifecycleRunState, behavior: ErrorBehavior | 'continue' \| 'stop_iteration' \| 'stop_vu' \| 'abort_test' | 67 | Implements the apply error behavior method. |


### core_engine/src/runtime/MetricsRuntime.ts

Layer: runtime  
Lines: 30  
Purpose: MetricsRuntime implementation.

Exports: `TransactionAggregate`, `MetricsRuntime`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `TransactionAggregate` | Interface | 1 | Defines the TransactionAggregate contract used by the framework. |

#### Class: MetricsRuntime

Line: 8  
Description: Implements the metrics runtime class.

| Property | Type | Line | Description |
|---|---|---:|---|
| `transactionMetrics` | Inferred | 9 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `recordTransaction` | `recordTransaction(transaction: string, durationMs: number, passed: boolean): void` | transaction: string, durationMs: number, passed: boolean | void | 11 | Implements the record transaction method. |
| `getSnapshot` | `getSnapshot(): Record<string, TransactionAggregate>` | None | Record<string, TransactionAggregate> | 26 | Implements the get snapshot method. |


### core_engine/src/runtime/SnapshotRuntime.ts

Layer: runtime  
Lines: 47  
Purpose: SnapshotRuntime implementation.

Imports:
- `import { ErrorCaptureConfig } from '../types/ConfigContracts';`
- `import { SnapshotPayload, SnapshotReference } from '../types/EventContracts';`

Exports: `SnapshotRuntime`

#### Class: SnapshotRuntime

Line: 4  
Description: Implements the snapshot runtime class.

| Property | Type | Line | Description |
|---|---|---:|---|
| `snapshotCount` | Inferred | 5 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `constructor` | `constructor(private readonly config: ErrorCaptureConfig)` | private readonly config: ErrorCaptureConfig | Inferred | 7 | Implements the constructor method. |
| `shouldCapture` | `shouldCapture(type: string): boolean` | type: string | boolean | 9 | Implements the should capture method. |
| `register` | `register(path: string): SnapshotReference` | path: string | SnapshotReference | 22 | Implements the register method. |
| `buildPayload` | `buildPayload(payload: SnapshotPayload): SnapshotPayload` | payload: SnapshotPayload | SnapshotPayload | 30 | Implements the build payload method. |


### core_engine/src/runtime/TimeseriesRuntime.ts

Layer: runtime  
Lines: 133  
Purpose: TimeseriesRuntime implementation.

Imports:
- `import { TimeSeriesFile, TimeSeriesPoint } from '../types/ReportingContracts';`

Exports: `TimeseriesRuntime`

#### Class: TimeseriesRuntime

Line: 3  
Description: scenario → transaction → bucketTs → point. Nested rather than a composite string key: the tags stay separate, so there's nothing to encode or decode and no delimiter to collide. This nesting is private to the runtime — the built artifact emits scenario/transaction as explicit fields.

| Property | Type | Line | Description |
|---|---|---:|---|
| `overview` | Inferred | 4 | Class state or configuration value used by the class methods. |
| `transactions` | Inferred | 11 | scenario → transaction → bucketTs → point. Nested rather than a composite string key: the tags stay separate, so there's nothing to encode or decode and no delimiter to collide. This nesting is private to the runtime — the built artifact emits scenario/transaction as explicit fields. |
| `requests` | Inferred | 12 | Class state or configuration value used by the class methods. |
| `system` | Inferred | 13 | Class state or configuration value used by the class methods. |
| `events` | TimeSeriesFile['series']['events'] | 14 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `constructor` | `constructor( private readonly bucketSizeSeconds: number, private readonly startTime: string, )` | private readonly bucketSizeSeconds: number, private readonly startTime: string | Inferred | 16 | Implements the constructor method. |
| `bucketTs` | `private bucketTs(ts: string): string` | ts: string | string | 21 | Implements the bucket ts method. |
| `addOverviewPoint` | `addOverviewPoint(ts: string, values: Record<string, number>): void` | ts: string, values: Record<string, number> | void | 27 | Implements the add overview point method. |
| `addTransactionPoint` | `addTransactionPoint( scenario: string, transaction: string, ts: string, values: Record<string, number \| number[]>, ): void` | scenario: string, transaction: string, ts: string, values: Record<string, number \| number[]> | void | 36 | Implements the add transaction point method. |
| `addRequestPoint` | `addRequestPoint(request: string, ts: string, values: Record<string, number \| number[] \| string>): void` | request: string, ts: string, values: Record<string, number \| number[] \| string> | void | 67 | Per-request bucket point. Numeric values (count/failed/durations…) merge the same way as transactions (sum numbers, concat sample arrays); string values (method/transaction/url metadata) are constant per request name and simply overwrite so they survive bucket merges without string concatenation. |
| `addSystemPoint` | `addSystemPoint(agent: string, ts: string, values: Record<string, number>): void` | agent: string, ts: string, values: Record<string, number> | void | 85 | Implements the add system point method. |
| `addEvent` | `addEvent(ts: string, type: string, severity: 'error' \| 'warning', transaction?: string): void` | ts: string, type: string, severity: 'error' \| 'warning', transaction?: string | void | 96 | Implements the add event method. |
| `build` | `build(endTime: string): TimeSeriesFile` | endTime: string | TimeSeriesFile | 100 | Implements the build  method. |


### core_engine/src/scenario/ExecutorFactory.ts

Layer: scenario  
Lines: 91  
Purpose: ExecutorFactory implementation.

Imports:
- `import { GlobalLoadProfile, ExecutorType } from '../types/TestPlanSchema';`
- `import { K6ExecutorConfig, toK6ExecutorConfig } from './WorkloadModels';`

Exports: `ExecutorFactory`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `ExecutorSpec` | Interface | 10 | Defines the ExecutorSpec contract used by the framework. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `EXECUTOR_SPECS` | Record<ExecutorType, ExecutorSpec> | 15 | Module-level constant or configuration value. |

#### Class: ExecutorFactory

Line: 49  
Description: Validate that the profile has all required fields for its executor type. Returns an array of error strings (empty = valid).

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `validate` | `static validate(profile: GlobalLoadProfile): string[]` | profile: GlobalLoadProfile | string[] | 54 | Validate that the profile has all required fields for its executor type. Returns an array of error strings (empty = valid). |
| `build` | `static build(profile: GlobalLoadProfile): K6ExecutorConfig` | profile: GlobalLoadProfile | K6ExecutorConfig | 75 | Build a k6-compatible executor config from a GlobalLoadProfile. Validates required fields first and rejects arrival-rate executors that lack phase-envelope support in the framework lifecycle engine. |
| `listSupported` | `static listSupported(): void` | None | void | 84 | Return human-readable descriptions of all supported executors. |


### core_engine/src/scenario/ScenarioBuilder.ts

Layer: scenario  
Lines: 459  
Purpose: ScenarioBuilder implementation.

Imports:
- `import { GlobalLoadProfile, TestPlan, UserJourney } from '../types/TestPlanSchema';`
- `import { ExecutorFactory } from './ExecutorFactory';`

Exports: `K6ScenarioDefinition`, `K6ScenariosMap`, `ScenarioRuntimeMetadata`, `ScenarioBuilder`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `K6ScenarioDefinition` | Interface | 11 | k6-native scenario definition (what goes into options.scenarios) |
| `K6ScenariosMap` | TypeAlias | 30 | Defines the K6ScenariosMap contract used by the framework. |
| `ScenarioRuntimeMetadata` | Interface | 32 | Per-journey transaction names injected as K6_PERF_TRANSACTION_NAMES for auto-registration. |
| `ScenarioPhaseEnvelope` | Interface | 79 | Defines the ScenarioPhaseEnvelope contract used by the framework. |

#### Class: ScenarioBuilder

Line: 103  
Description: Build a k6 options.scenarios map from a test plan. Handles parallel, sequential, and hybrid execution modes.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `build` | `static build(plan: TestPlan, metadata?: ScenarioRuntimeMetadata): K6ScenariosMap` | plan: TestPlan, metadata?: ScenarioRuntimeMetadata | K6ScenariosMap | 108 | Build a k6 options.scenarios map from a test plan. Handles parallel, sequential, and hybrid execution modes. |
| `buildParallel` | `private static buildParallel( plan: TestPlan, metadata?: ScenarioRuntimeMetadata, ): K6ScenariosMap` | plan: TestPlan, metadata?: ScenarioRuntimeMetadata | K6ScenariosMap | 125 | Implements the build parallel method. It orchestrates process execution. |
| `buildSequential` | `private static buildSequential( plan: TestPlan, metadata?: ScenarioRuntimeMetadata, ): K6ScenariosMap` | plan: TestPlan, metadata?: ScenarioRuntimeMetadata | K6ScenariosMap | 154 | Implements the build sequential method. It orchestrates process execution. |
| `buildHybrid` | `private static buildHybrid( plan: TestPlan, metadata?: ScenarioRuntimeMetadata, ): K6ScenariosMap` | plan: TestPlan, metadata?: ScenarioRuntimeMetadata | K6ScenariosMap | 188 | Implements the build hybrid method. It orchestrates process execution. |
| `sanitizeExecName` | `private static sanitizeExecName(name: string): string` | name: string | string | 257 | Sanitize journey name to a valid k6 exec function name |
| `buildScenarioEnv` | `private static buildScenarioEnv( plan: TestPlan, journey: UserJourney, execName: string, metadata?: ScenarioRuntimeMetadata, existingEnv?: Record<string, string>, ): Record<stri...` | plan: TestPlan, journey: UserJourney, execName: string, metadata?: ScenarioRuntimeMetadata, existingEnv?: Record<string, string> | Record<string, string> \| undefined | 261 | Implements the build scenario env method. It orchestrates process execution. |
| `computePhaseEnvelope` | `private static computePhaseEnvelope( profile: GlobalLoadProfile, existingEnv?: Record<string, string>, ): ScenarioPhaseEnvelope` | profile: GlobalLoadProfile, existingEnv?: Record<string, string> | ScenarioPhaseEnvelope | 310 | Implements the compute phase envelope method. It orchestrates process execution, parses structured configuration or artifact data. |
| `computeDebugPhaseEnvelope` | `static computeDebugPhaseEnvelope(profile: GlobalLoadProfile): ScenarioPhaseEnvelope` | profile: GlobalLoadProfile | ScenarioPhaseEnvelope | 427 | Implements the compute debug phase envelope method. |
| `estimateTotalDurationSeconds` | `static estimateTotalDurationSeconds(profile: GlobalLoadProfile): number` | profile: GlobalLoadProfile | number | 432 | Estimate total duration of a load profile in seconds |
| `parseDurationToSeconds` | `private static parseDurationToSeconds(duration: string): number` | duration: string | number | 445 | Parse k6 duration strings: '2m', '30s', '1h30m' |


### core_engine/src/scenario/TestPlanLoader.ts

Layer: scenario  
Lines: 54  
Purpose: TestPlanLoader implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { TestPlan } from '../types/TestPlanSchema';`
- `import { SchemaValidator } from '../config/SchemaValidator';`
- `import { parse } from 'jsonc-parser';`

Exports: `TestPlanLoader`

#### Class: TestPlanLoader

Line: 13  
Description: Load and validate a test plan from a JSON file. Throws with a descriptive message on parse failure or schema violations.

| Property | Type | Line | Description |
|---|---|---:|---|
| `schemaValidator` | SchemaValidator | 14 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `constructor` | `constructor()` | None | Inferred | 16 | Implements the constructor method. It enforces validation rules. |
| `load` | `load(planFilePath: string): TestPlan` | planFilePath: string | TestPlan | 24 | Load and validate a test plan from a JSON file. Throws with a descriptive message on parse failure or schema violations. |


### core_engine/src/scenario/WorkloadModels.ts

Layer: scenario  
Lines: 178  
Purpose: buildLoadProfile, buildStressProfile, buildSoakProfile, buildSpikeProfile helpers or command handlers.

Imports:
- `import { GlobalLoadProfile, LoadStage } from '../types/TestPlanSchema';`

Exports: `K6ExecutorConfig`, `buildLoadProfile`, `buildStressProfile`, `buildSoakProfile`, `buildSpikeProfile`, `buildIterationProfile`, `buildConstantArrivalRateProfile`, `buildRampingArrivalRateProfile`, `buildExternallyControlledProfile`, `toK6ExecutorConfig`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `K6ExecutorConfig` | Interface | 12 | k6-native scenario executor config (partial, used for options.scenarios) |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `buildLoadProfile` | `export function buildLoadProfile(options:` | options: { rampUp: string; steady: string; rampDown: string; targetVUs: number; } | GlobalLoadProfile | 35 | Build a standard load test: ramp-up -> steady -> ramp-down |
| `buildStressProfile` | `export function buildStressProfile(options:` | options: { targetVUs: number; rampUp?: string; steady?: string; rampDown?: string; } | GlobalLoadProfile | 53 | Build a stress test: aggressive ramp-up, short steady, ramp-down |
| `buildSoakProfile` | `export function buildSoakProfile(options:` | options: { targetVUs: number; duration: string; rampUp?: string; rampDown?: string; } | GlobalLoadProfile | 68 | Build a soak test: low steady load for an extended duration |
| `buildSpikeProfile` | `export function buildSpikeProfile(options:` | options: { baselineVUs: number; spikeVUs: number; spikeDuration?: string; } | GlobalLoadProfile | 83 | Build a spike test: sudden surge then back to baseline |
| `buildIterationProfile` | `export function buildIterationProfile(options:` | options: { vus: number; iterations: number; } | GlobalLoadProfile | 102 | Build a fixed-iteration profile |
| `buildConstantArrivalRateProfile` | `export function buildConstantArrivalRateProfile(options:` | options: { rate: number; duration: string; preAllocatedVUs: number; timeUnit?: string; maxVUs?: number; } | GlobalLoadProfile | 114 | Build a constant arrival-rate profile |
| `buildRampingArrivalRateProfile` | `export function buildRampingArrivalRateProfile(options:` | options: { stages: LoadStage[]; preAllocatedVUs: number; timeUnit?: string; maxVUs?: number; } | GlobalLoadProfile | 132 | Build a ramping arrival-rate profile |
| `buildExternallyControlledProfile` | `export function buildExternallyControlledProfile(options:` | options: { maxVUs: number; vus?: number; duration?: string; } | GlobalLoadProfile | 148 | Build an externally-controlled profile |
| `toK6ExecutorConfig` | `export function toK6ExecutorConfig(profile: GlobalLoadProfile): K6ExecutorConfig` | profile: GlobalLoadProfile | K6ExecutorConfig | 162 | Translate a GlobalLoadProfile into a k6 executor config block |


### core_engine/src/types/ConfigContracts.ts

Layer: types  
Lines: 187  
Purpose: Framework file.

Imports:
- `import { DataOverflowStrategy } from './TestPlanSchema';`

Exports: `export { DataOverflowStrategy };`, `EnvironmentCustomValue`, `TeamEnvironmentOverride`, `EnvironmentConfig`, `ErrorBehavior`, `ThinkTimeMode`, `PacingMode`, `ThinkTimeConfig`, `PacingConfig`, `HttpConfig`, `TimeSeriesReportingConfig`, `ReportingConfig`, `ErrorCaptureConfig`, `MonitoringConfig`, `RuntimeSettings`, `FRAMEWORK_DEFAULTS`, `ResolvedConfig`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `EnvironmentCustomValue` | TypeAlias | 8 | Defines the EnvironmentCustomValue contract used by the framework. |
| `TeamEnvironmentOverride` | Interface | 10 | Optional per-team base URL override |
| `EnvironmentConfig` | Interface | 19 | Logical name of the environment: dev \| staging \| uat \| prod |
| `ErrorBehavior` | TypeAlias | 30 | Defines the ErrorBehavior contract used by the framework. |
| `ThinkTimeMode` | TypeAlias | 31 | Defines the ThinkTimeMode contract used by the framework. |
| `PacingMode` | TypeAlias | 32 | Defines the PacingMode contract used by the framework. |
| `ThinkTimeConfig` | Interface | 34 | Fixed think time in seconds (used when mode = 'fixed') |
| `PacingConfig` | Interface | 44 | Enable pacing (a sleep applied between action iterations). |
| `HttpConfig` | Interface | 59 | Global HTTP request timeout in seconds |
| `TimeSeriesReportingConfig` | Interface | 68 | Enable bucketed timeseries collection for interactive reports |
| `ReportingConfig` | Interface | 85 | Visible transaction stats/columns in reports |
| `ErrorCaptureConfig` | Interface | 102 | Capture snapshots for supported failures |
| `MonitoringConfig` | Interface | 113 | Enable runner-side host monitoring |
| `RuntimeSettings` | Interface | 124 | Debug mode – prints resolved config; enables verbose logging |
| `ResolvedConfig` | Interface | 179 | Merged CLI overrides (highest precedence after .env secrets) |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `FRAMEWORK_DEFAULTS` | RuntimeSettings | 140 | Module-level constant or configuration value. |


### core_engine/src/types/EventContracts.ts

Layer: types  
Lines: 103  
Purpose: Framework file.

Imports:
- `import { ErrorBehavior } from './ConfigContracts';`

Exports: `EventLevel`, `AgentContext`, `ErrorCause`, `VariableUsage`, `SnapshotReference`, `ErrorEvent`, `WarningMetric`, `WarningEvent`, `SnapshotPayload`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `EventLevel` | TypeAlias | 3 | Defines the EventLevel contract used by the framework. |
| `AgentContext` | Interface | 5 | Defines the AgentContext contract used by the framework. |
| `ErrorCause` | Interface | 12 | Defines the ErrorCause contract used by the framework. |
| `VariableUsage` | Interface | 18 | Defines the VariableUsage contract used by the framework. |
| `SnapshotReference` | Interface | 23 | Defines the SnapshotReference contract used by the framework. |
| `ErrorEvent` | Interface | 28 | Defines the ErrorEvent contract used by the framework. |
| `WarningMetric` | Interface | 55 | Defines the WarningMetric contract used by the framework. |
| `WarningEvent` | Interface | 61 | Defines the WarningEvent contract used by the framework. |
| `SnapshotPayload` | Interface | 80 | Defines the SnapshotPayload contract used by the framework. |


### core_engine/src/types/HARContracts.ts

Layer: types  
Lines: 46  
Purpose: Framework file.

Exports: `HAREntry`, `HARRefinementOptions`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `HAREntry` | Interface | 1 | When set, ScriptGenerator emits this string as a RAW JS expression for the request body — bypassing the default JSON.stringify of `text`. Use this when the body needs to reference module-scope bindings, e.g. file uploads (`expression: 'photoBytes'`) or multipart with file fields (`expression: "{ name: 'alice', photo: http.file(photoBytes, 'photo.jpg', 'image/jpeg') }"`). Synthetic HAR sources (Postman / cURL) can use this to wire up init-context code without changing the per-request emission shape. |
| `HARRefinementOptions` | Interface | 41 | Defines the HARRefinementOptions contract used by the framework. |


### core_engine/src/types/ReportingContracts.ts

Layer: types  
Lines: 199  
Purpose: normalizeTransactionSeries helpers or command handlers.

Imports:
- `import { AgentContext } from './EventContracts';`

Exports: `TransactionMetricRow`, `TransactionMetricsFile`, `CiTransactionSummary`, `CiSummary`, `TimeSeriesPoint`, `TimeSeriesFile`, `RunSummaryFile`, `TransactionSeries`, `normalizeTransactionSeries`, `ReportBundleMeta`, `ReportBundleConfig`, `ReportBundle`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `TransactionMetricRow` | Interface | 3 | Defines the TransactionMetricRow contract used by the framework. |
| `TransactionMetricsFile` | Interface | 21 | Defines the TransactionMetricsFile contract used by the framework. |
| `CiTransactionSummary` | Interface | 27 | Defines the CiTransactionSummary contract used by the framework. |
| `CiSummary` | Interface | 40 | Actual transaction failure rate (percent 0–100) — the run's pass/fail driver. |
| `TimeSeriesPoint` | Interface | 82 | A single time-series bucket point. Fields beyond `ts` are open-ended on purpose: the same shape is used for overview, per-transaction, and per- agent series, and the field set has expanded over time (Proposal 5 adds per-second `httpDurationP95`, `requestRate`, `httpFailedRate`, etc.; older runs may only carry the legacy `avg` / `p95` / `errorRate` keys). Renderers should treat any field as optional and fall back gracefully. Overview point keys (Wave 1): requests, requestRate, httpDurationAvg, httpDurationP90, httpDurationP95, httpDurationP99, httpDurationMin, httpDurationMax, httpFailedCount, httpFailedRate, vus, vusMax, iterations, iterationDurationAvg, iterationDurationP95, dataReceived, dataSent (plus legacy: errorRate, avgDuration, p95Duration) Per-transaction point keys: count, durationAvg, durationP90, durationP95, durationP99, durationMin, durationMax, pass, fail (plus legacy: avg, min, max, p90, p95, p99) Per-agent system point keys: cpuPercent, memoryPercent, activeAgents |
| `TimeSeriesFile` | Interface | 89 | Run-wide totals derived from the streaming JSON output. Present when the parser found a usable `metrics-stream.json` (Proposal 5, Wave 1); absent on legacy runs that only have summary aggregates. |
| `RunSummaryFile` | Interface | 141 | The single derived summary artifact (`run-summary.json`): the run-level CI gate PLUS the full per-transaction table. Replaces the old transaction-metrics.json + ci-summary.json pair, which each carried their own copy of the per-transaction array (ci-summary's was a subset — no scenario, no std/p90). Consumers that only need the gate read the top-level fields; the report/merge read `transactions`. |
| `TransactionSeries` | Interface | 149 | One per-(scenario, transaction) time series. Tags are explicit fields. |
| `ReportBundleMeta` | Interface | 169 | Defines the ReportBundleMeta contract used by the framework. |
| `ReportBundleConfig` | Interface | 179 | Defines the ReportBundleConfig contract used by the framework. |
| `ReportBundle` | Interface | 185 | Defines the ReportBundle contract used by the framework. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `normalizeTransactionSeries` | `export function normalizeTransactionSeries( input: TransactionSeries[] \| Record<string, TimeSeriesPoint[]> \| undefined \| null, ): TransactionSeries[]` | input: TransactionSeries[] \| Record<string, TimeSeriesPoint[]> \| undefined \| null | TransactionSeries[] | 161 | Accept both the current array-of-records shape and the legacy Record<transactionName, points[]> shape (artifacts written before transactions were scenario-aware), so previously-collected runs still merge and render. Legacy entries carry an empty scenario — they genuinely had none recorded. |


### core_engine/src/types/TestPlanSchema.ts

Layer: types  
Lines: 215  
Purpose: Framework file.

Exports: `ExecutionMode`, `ExecutorType`, `WorkloadModelType`, `DataOverflowStrategy`, `LoadStage`, `GlobalLoadProfile`, `UserJourney`, `HybridGroup`, `SLADefinition`, `GlobalSLADefinition`, `DebugSettings`, `TestPlan`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `ExecutionMode` | TypeAlias | 7 | TestPlanSchema.ts Phase 1 – Test plan JSON/YAML contract. This is the primary input that drives scenario orchestration. |
| `ExecutorType` | TypeAlias | 8 | Defines the ExecutorType contract used by the framework. |
| `WorkloadModelType` | TypeAlias | 17 | Defines the WorkloadModelType contract used by the framework. |
| `DataOverflowStrategy` | TypeAlias | 18 | Defines the DataOverflowStrategy contract used by the framework. |
| `LoadStage` | Interface | 24 | k6 duration string: '2m', '30s', '1h' |
| `GlobalLoadProfile` | Interface | 35 | Starting VU count (ramping executors) |
| `UserJourney` | Interface | 73 | Unique name – used as the k6 scenario key |
| `HybridGroup` | Interface | 102 | Defines the HybridGroup contract used by the framework. |
| `SLADefinition` | Interface | 111 | Max error rate percent (0–100) |
| `GlobalSLADefinition` | Interface | 144 | Global SLA defaults, scoped explicitly into request-level and transaction-level. Precedence is "most specific wins", per individual percentile / errorRate key: • REQUEST-level (HTTP `http_req_duration` / `http_req_failed`): journey_slas[journey].pN > global_sla.request.pN > legacy flat global_sla.pN (journey + global request thresholds are different k6 metric selectors, so both apply; "wins" only describes which limit is the more specific.) • TRANSACTION-level (per-transaction Trend `<txn>` / `<txn>_checkrate`): transaction_slas[txn].pN > global_sla.transaction.pN global_sla.transaction is a DEFAULT applied to every transaction of every journey; a deliberate transaction_slas entry overrides it for that transaction + percentile only (other percentiles still inherit the global). • PER-REQUEST (single HTTP request submetric `http_req_duration{name:<req>}`): request_slas[req].pN — scoped to one request name only, independent of the request-level and transaction-level scopes above. |
| `DebugSettings` | Interface | 161 | When true, journeys run in single-purpose debug replay mode instead of normal load mode |
| `TestPlan` | Interface | 182 | Human-readable test plan name |


### core_engine/src/utils/autoHeaders.ts

Layer: utils  
Lines: 100  
Purpose: addAutoHeader, addAutoHeaders, removeAutoHeader, clearAutoHeaders helpers or command handlers.

Exports: `addAutoHeader`, `addAutoHeaders`, `removeAutoHeader`, `clearAutoHeaders`, `getAutoHeaders`, `addHeaderOnce`, `mergeRequestHeaders`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `StoredHeader` | Interface | 14 | autoHeaders.ts VU-safe "auto header" store (LoadRunner web_add_auto_header parity). Headers registered with addAutoHeader/addAutoHeaders are applied to EVERY subsequent request() automatically, for the VU's entire lifetime (across all iterations and phases), until removed/cleared. addHeaderOnce applies to the next request() only. Module scope is per-VU in k6, so each VU has its own isolated header set. Header names are case-insensitive (re-adding the same name replaces it). |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `_autoHeaders` | Inferred | 21 | Module-level constant or configuration value. |
| `_onceHeaders` | Inferred | 22 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `addAutoHeader` | `export function addAutoHeader(name: string, value: string \| null \| undefined): void` | name: string, value: string \| null \| undefined | void | 28 | Add or replace an auto header applied to all subsequent requests. Passing a null/undefined value removes it (use removeAutoHeader for an explicit remove). |
| `addAutoHeaders` | `export function addAutoHeaders(headers: Record<string, string \| null \| undefined>): void` | headers: Record<string, string \| null \| undefined> | void | 38 | Bulk add/replace auto headers from an object. |
| `removeAutoHeader` | `export function removeAutoHeader(name: string): void` | name: string | void | 45 | Remove a single auto header (case-insensitive). |
| `clearAutoHeaders` | `export function clearAutoHeaders(): void` | None | void | 50 | Remove all auto headers (and any pending one-shot header). |
| `getAutoHeaders` | `export function getAutoHeaders(): Record<string, string>` | None | Record<string, string> | 56 | Snapshot of the current auto headers as a plain object (original casing). |
| `addHeaderOnce` | `export function addHeaderOnce(name: string, value: string): void` | name: string, value: string | void | 68 | Add a header applied to the NEXT request() only, then consumed (LoadRunner web_add_header parity). |
| `mergeRequestHeaders` | `export function mergeRequestHeaders(perCall?: Record<string, string>): Record<string, string>` | perCall?: Record<string, string> | Record<string, string> | 77 | INTERNAL (request.ts): merge auto headers + the one-shot header (consumed) + the per-call headers, case-insensitively. Per-call wins over one-shot, which wins over auto. Returns a plain headers object for k6. |


### core_engine/src/utils/dataWriter.ts

Layer: utils  
Lines: 65  
Purpose: writeData helpers or command handlers.

Imports:
- `import exec from 'k6/execution';`

Exports: `WriteDataOptions`, `writeData`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `WriteDataOptions` | Interface | 21 | 'append' (default) accumulates records; 'overwrite' replaces the file on each write. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `FILE_TAG` | Inferred | 19 | IPC tag prefix matched by the runner-side FileWriteSink in the k6 log stream. MUST stay in sync with execution/FileWriteSink.ts. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `writeData` | `export function writeData(file: string, data: string, opts?: WriteDataOptions): void` | file: string, data: string, opts?: WriteDataOptions | void | 44 | Write data to a file during the test. The file (and any missing parent folders) is created automatically on first write. Path: - relative → under the run's output directory (default home for artifacts) - absolute → written verbatim to any location of your choice writeData('created_ids.csv', `${id},${ts}\n`); // → run output dir writeData('D:/exports/ids.csv', `${id}\n`); // → your location writeData('snapshot.json', JSON.stringify(obj), { mode: 'overwrite' }); writeData('out.bin', bytesBase64, { encoding: 'base64' }); writeData('per_vu.log', line, { perVU: true }); // → per_vu.vu3.log, … |


### core_engine/src/utils/extract.ts

Layer: utils  
Lines: 247  
Purpose: bodyString, asResultString, navigate, extractJson helpers or command handlers.

Exports: `ExtractableResponse`, `extractJson`, `extractRegex`, `extractHeader`, `extractCookie`, `extractBoundary`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `ExtractableResponse` | Interface | 23 | extract.ts k6-native correlation extractors (VU-safe — no Node APIs). These are the RUNTIME counterpart to the design-time CorrelationScanner. Generated/correlated scripts call one of these to pull a dynamic value out of a response, then wrap it with `trackCorrelation()` so a miss degrades to a visible `{NOTFOUND:name}` placeholder instead of throwing: c_csrfToken = trackCorrelation('c_csrfToken', extractJson(res1, 'csrfToken'), 'res1.body:csrfToken'); Every extractor returns `string \| null` and NEVER throws — a malformed body, missing header, or non-matching pattern yields `null`, which trackCorrelation turns into the placeholder. This mirrors LoadRunner's continue-on-error semantics so one stale value can't abort the whole VU. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `bodyString` | `function bodyString(res: ExtractableResponse \| null \| undefined): string` | res: ExtractableResponse \| null \| undefined | string | 34 | Coerce a response body to a string, or '' when binary/absent. |
| `asResultString` | `function asResultString(value: unknown): string \| null` | value: unknown | string \| null | 41 | Implements the as result string function. |
| `navigate` | `function navigate(root: unknown, dotPath: string): unknown` | root: unknown, dotPath: string | unknown | 54 | Navigate a dot-notation path over a parsed JSON value. Supports numeric segments for array indexing, e.g. `data.items.0.id`. Returns the leaf value or null if any segment is missing. |
| `extractJson` | `export function extractJson(res: ExtractableResponse \| null \| undefined, dotPath: string): string \| null` | res: ExtractableResponse \| null \| undefined, dotPath: string | string \| null | 79 | Extract a value from a JSON response body by dot-notation path. `extractJson(res, 'data.user.token')` → the token string, or null. |
| `extractRegex` | `export function extractRegex( res: ExtractableResponse \| null \| undefined, pattern: string \| RegExp, group = 1, ): string \| null` | res: ExtractableResponse \| null \| undefined, pattern: string \| RegExp, group = 1 | string \| null | 108 | Extract a value from the response body by regular expression. Uses capture group `group` (default 1); falls back to the whole match when the pattern has no groups. Never throws on a bad pattern. |
| `extractHeader` | `export function extractHeader(res: ExtractableResponse \| null \| undefined, name: string): string \| null` | res: ExtractableResponse \| null \| undefined, name: string | string \| null | 135 | Extract a response header value by name (case-insensitive). Joins multi-value headers with ', ' (k6 usually pre-joins them). Supports a `Header?param` form: when `name` contains `?`, the part before it is the header name and the part after is a query parameter parsed out of the header's URL value — used for tokens carried in a redirect `Location` header, e.g. extractHeader(res, 'Location?orderId'). |
| `queryParamFromUrl` | `function queryParamFromUrl(url: string, param: string): string \| null` | url: string, param: string | string \| null | 155 | Pull a query parameter value out of a (possibly relative) URL string. |
| `extractCookie` | `export function extractCookie(res: ExtractableResponse \| null \| undefined, name: string): string \| null` | res: ExtractableResponse \| null \| undefined, name: string | string \| null | 177 | Extract a cookie value set by the response. Prefers k6's parsed res.cookies (`{ name: [{ value }] }`), then falls back to parsing the Set-Cookie header. |
| `extractBoundary` | `export function extractBoundary( res: ExtractableResponse \| null \| undefined, left: string, right: string, occurrence = 1, ): string \| null` | res: ExtractableResponse \| null \| undefined, left: string, right: string, occurrence = 1 | string \| null | 220 | LoadRunner-style left-boundary / right-boundary extraction. Returns the text strictly between `left` and the next `right` after it. extractBoundary(res, 'name="__VIEWSTATE" value="', '"') `occurrence` (1-based) selects which match to return when boundaries repeat. |


### core_engine/src/utils/lifecycle.ts

Layer: utils  
Lines: 583  
Purpose: createTrackedProxy, createContext, createState, parseJsonEnv helpers or command handlers.

Imports:
- `import { sleep } from 'k6';`
- `import exec from 'k6/execution';`
- `import { Counter } from 'k6/metrics';`
- `import { isVuTerminated, isJsRuntimeError } from './transaction.js';`
- `import { trackCorrelation, trackParameter } from './replayLogger.js';`

Exports: `JourneyLifecycleStore`, `PhaseFns`, `createJourneyLifecycleStore`, `thinktime`, `TransactionGate`, `getTransactionGate`, `isEnding`, `runJourneyLifecycle`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `JourneyContext` | Interface | 14 | Defines the JourneyContext contract used by the framework. |
| `JourneyState` | Interface | 21 | Defines the JourneyState contract used by the framework. |
| `JourneyLifecycleStore` | Interface | 27 | Defines the JourneyLifecycleStore contract used by the framework. |
| `PhaseFns` | Interface | 32 | Defines the PhaseFns contract used by the framework. |
| `RuntimeMetadata` | Interface | 38 | Defines the RuntimeMetadata contract used by the framework. |
| `PhaseMetadata` | Interface | 49 | Defines the PhaseMetadata contract used by the framework. |
| `TimelineStage` | Interface | 62 | Defines the TimelineStage contract used by the framework. |
| `TransactionGate` | Interface | 282 | Defines the TransactionGate contract used by the framework. |
| `EndFamily` | TypeAlias | 320 | Defines the EndFamily contract used by the framework. |
| `EndPlan` | Interface | 322 | Absolute wall-clock ms at/after which this VU logs out (ramping / time-based). |
| `CurvePoint` | Interface | 339 | Defines the CurvePoint contract used by the framework. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `__ENV` | Record<string, string \| undefined> | 10 | Module-level constant or configuration value. |
| `frameworkIterations` | Inferred | 69 | Module-level constant or configuration value. |
| `_currentPhase` | 'init' \| 'action' \| 'end' \| 'none' | 200 | Module-level constant or configuration value. |
| `activeEndPlan` | EndPlan \| null | 336 | Module-level constant or configuration value. |
| `arrivalNoticePrinted` | Inferred | 337 | Module-level constant or configuration value. |
| `LIFECYCLE_END_SAFETY_MS` | Inferred | 465 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `createTrackedProxy` | `function createTrackedProxy(sourceName: string, type: 'correlation' \| 'parameter'): Record<string, unknown>` | sourceName: string, type: 'correlation' \| 'parameter' | Record<string, unknown> | 78 | Wraps a context sub-object in a Proxy so that every scalar assignment (`ctx.correlation["x"] = v`, `ctx.session.token = v`, etc.) is automatically registered in the replay variable registry. detectVariableEvents then finds those values inside request URLs/bodies/headers and maps them back to their variable names — no trackCorrelation / trackParameter calls needed in scripts. |
| `createContext` | `function createContext(): JourneyContext` | None | JourneyContext | 95 | Implements the create context function. |
| `createState` | `function createState(): JourneyState` | None | JourneyState | 104 | Implements the create state function. |
| `parseJsonEnv` | `function parseJsonEnv<T>(name: string, fallback: T): T` | name: string, fallback: T | T | 112 | Implements the parse json env function. It parses structured configuration or artifact data. |
| `getRuntimeMetadata` | `function getRuntimeMetadata(): RuntimeMetadata` | None | RuntimeMetadata | 120 | Implements the get runtime metadata function. |
| `applyPacing` | `function applyPacing(runtime: RuntimeMetadata): void` | runtime: RuntimeMetadata | void | 134 | Pacing: a sleep applied at the END of the action phase — i.e. BETWEEN action iterations — to control how often each VU starts a new iteration. Mirrors think time's fixed/random modes, but where think time spaces transactions WITHIN an action, pacing spaces the iterations themselves. Computed fresh each call so 'random' varies per iteration. |
| `getPhaseMetadata` | `function getPhaseMetadata(): PhaseMetadata` | None | PhaseMetadata | 152 | Implements the get phase metadata function. |
| `handlePhaseError` | `function handlePhaseError( store: JourneyLifecycleStore, error: unknown, phaseName: string, runtime: RuntimeMetadata, ): string` | store: JourneyLifecycleStore, error: unknown, phaseName: string, runtime: RuntimeMetadata | string | 158 | Implements the handle phase error function. It orchestrates process execution, emits operator-facing output. |
| `runSafely` | `function runSafely( store: JourneyLifecycleStore, phaseName: string, phaseFn: ((ctx: JourneyContext) => void) \| undefined, runtime: RuntimeMetadata, ): string` | store: JourneyLifecycleStore, phaseName: string, phaseFn: ((ctx: JourneyContext) => void) \| undefined, runtime: RuntimeMetadata | string | 202 | Implements the run safely function. |
| `createJourneyLifecycleStore` | `export function createJourneyLifecycleStore(): JourneyLifecycleStore` | None | JourneyLifecycleStore | 225 | Implements the create journey lifecycle store function. |
| `thinktime` | `export function thinktime(minOrFixed?: number, max?: number): void` | minOrFixed?: number, max?: number | void | 232 | Implements the thinktime function. It orchestrates process execution. |
| `getTransactionGate` | `export function getTransactionGate(): TransactionGate` | None | TransactionGate | 288 | Implements the get transaction gate function. It orchestrates process execution, emits operator-facing output. |
| `buildVuCurve` | `function buildVuCurve(phases: PhaseMetadata): CurvePoint[]` | phases: PhaseMetadata | CurvePoint[] | 342 | Build the piecewise-linear VU curve: (0, startVUs) followed by the timeline. |
| `interpolateTarget` | `function interpolateTarget(curve: CurvePoint[], offsetMs: number): number` | curve: CurvePoint[], offsetMs: number | number | 351 | Linearly interpolate the planned VU count at a given time offset on the curve. |
| `terminalDeadlineMs` | `function terminalDeadlineMs(curve: CurvePoint[], rank: number): number` | curve: CurvePoint[], rank: number | number | 382 | Terminal-crossing deadline for a VU whose handle "rank" is `rank` (its VU-count level — see computeEndPlan, where rank is derived from the curve value at the VU's onboarding time, which mirrors k6's handle index). Returns sup{ t : target(t) >= rank } — the LAST time the curve is at or above that level. k6 culls the matching handle just after the curve drops below it, so this is the moment the VU is about to be removed; the lifecycle fires endPhase a safety margin BEFORE it (LIFECYCLE_END_SAFETY_MS) while the VU is still scheduled. Because we have the whole curve up front, this is correct for every ramping shape: load, soak, stress, step-down, spike, and multi-spike (a VU only ends at the dip after which it is never exceeded again — no premature logout of VUs k6 will reuse). Survivors that never cross (curve ends above the rank) get the total duration → they log out at scenario end under gracefulStop. |
| `computeEndPlan` | `function computeEndPlan(phases: PhaseMetadata): EndPlan` | phases: PhaseMetadata | EndPlan | 410 | Compute the per-VU EndPlan once, from the injected phase envelope. |
| `isEndDueBefore` | `function isEndDueBefore(): boolean` | None | boolean | 468 | Should this VU end BEFORE running another action? |
| `isEndDueAfter` | `function isEndDueAfter(): boolean` | None | boolean | 478 | Should this VU end AFTER the action it just ran? |
| `isEnding` | `export function isEnding(): boolean` | None | boolean | 498 | Script-facing: true once this VU has reached its logout deadline. Use it as the guard of a long action loop so the loop bails out near the deadline instead of overrunning it: while (!isEnding()) { transaction('search', () => {...}); thinktime(); } Only meaningful for the ramping (time-deadline) family; returns false otherwise. |
| `runJourneyLifecycle` | `export function runJourneyLifecycle(store: JourneyLifecycleStore, phaseFns: PhaseFns): void` | store: JourneyLifecycleStore, phaseFns: PhaseFns | void | 512 | Per-VU lifecycle shell. Runs initPhase once, then actionPhase per iteration, and proactively runs endPhase a margin BEFORE k6 culls the VU (deadline ranked by onboarding time so it matches k6's handle cull order). Covers every executor family via computeEndPlan: ramping (time deadline), count (per-vu/shared iterations), arrival (action-only), external (best-effort). |


### core_engine/src/utils/LiveConsoleLogStream.ts

Layer: utils  
Lines: 132  
Purpose: startLiveConsoleLogStream helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import { Logger } from './logger';`

Exports: `startLiveConsoleLogStream`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `LIVE_CONSOLE_POLL_MS` | Inferred | 28 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `startLiveConsoleLogStream` | `export function startLiveConsoleLogStream( runLogPath: string, onMessage?: (msg: string) => boolean, rewrite?: (msg: string) => string, ):` | runLogPath: string, onMessage?: (msg: string) => boolean, rewrite?: (msg: string) => string | { stop: () => void } | 40 | (before display). Return true to mark the message consumed — it will then be suppressed from the live display (used by FileWriteSink for writeData()). displayed. Debug mode uses it to swap references to the throwaway instrumented script copy back to the user's original file, so clicking a live error jumps to the real source instead of a temp (often already deleted) file. |


### core_engine/src/utils/logger.ts

Layer: utils  
Lines: 110  
Purpose: Logger implementation.

Exports: `Logger`, `export { ansi };`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `isColorEnabled` | Inferred | 7 | logger.ts Phase 2 - Global Logger Utility Provides a standardized, color-coded logging format across the framework. |
| `ansi` | Inferred | 9 | Module-level constant or configuration value. |
| `levelStyles` | Record<string, { color: string; badge: string }> | 28 | Module-level constant or configuration value. |

#### Class: Logger

Line: 35  
Description: Color-coded status line: [PASS] in green

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `info` | `static info(message: string, context?: any): void` | message: string, context?: any | void | 36 | Implements the info method. |
| `warn` | `static warn(message: string, context?: any): void` | message: string, context?: any | void | 40 | Implements the warn method. |
| `error` | `static error(message: string, context?: any): void` | message: string, context?: any | void | 44 | Implements the error method. |
| `debug` | `static debug(message: string, context?: any): void` | message: string, context?: any | void | 48 | Implements the debug method. |
| `pass` | `static pass(message: string): void` | message: string | void | 53 | Color-coded status line: [PASS] in green |
| `fail` | `static fail(message: string): void` | message: string | void | 58 | Color-coded status line: [FAIL] in red |
| `warning` | `static warning(message: string): void` | message: string | void | 63 | Color-coded status line: [WARN] in yellow |
| `detail` | `static detail(message: string): void` | message: string | void | 68 | Dim secondary info line with > prefix |
| `header` | `static header(title: string): void` | title: string | void | 73 | Bold section header with box lines |
| `bullet` | `static bullet(message: string, color: 'red' \| 'yellow' \| 'green' \| 'cyan' = 'cyan'): void` | message: string, color: 'red' \| 'yellow' \| 'green' \| 'cyan' = 'cyan' | void | 81 | Bullet point for lists (failures, warnings) |
| `print` | `private static print(level: string, message: string, context?: any): void` | level: string, message: string, context?: any | void | 86 | Implements the print method. It orchestrates process execution, emits operator-facing output. |


### core_engine/src/utils/PathResolver.ts

Layer: utils  
Lines: 89  
Purpose: PathResolver implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`

Exports: `PathResolution`, `PathResolver`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `PathResolution` | Interface | 10 | Outcome of resolving a journey scriptPath. |

#### Class: PathResolver

Line: 28  
Description: Resolve a script path, distinguishing "not found" from "ambiguous". Resolution order: 1. Treat `targetPath` as an explicit path (absolute, or relative to the current working directory). If it points at an existing file, use it — this is how users disambiguate duplicate filenames. 2. Otherwise treat it as a bare filename and deep-search `searchRoot`. Collect EVERY match: one → resolved, none → not_found, many → ambiguous.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `resolveDetailed` | `static resolveDetailed(targetPath: string, searchRoot: string = 'testSuites'): PathResolution` | targetPath: string, searchRoot: string = 'testSuites' | PathResolution | 42 | Resolve a script path, distinguishing "not found" from "ambiguous". Resolution order: 1. Treat `targetPath` as an explicit path (absolute, or relative to the current working directory). If it points at an existing file, use it — this is how users disambiguate duplicate filenames. 2. Otherwise treat it as a bare filename and deep-search `searchRoot`. Collect EVERY match: one → resolved, none → not_found, many → ambiguous. |
| `resolve` | `static resolve(targetPath: string, searchRoot: string = 'testSuites'): string \| null` | targetPath: string, searchRoot: string = 'testSuites' | string \| null | 66 | Back-compatible convenience wrapper. Returns the absolute path for a unique match, or `null` for both "not found" and "ambiguous" — it deliberately does NOT silently pick one of several matches. |
| `collectMatches` | `private static collectMatches(dir: string, targetFile: string): string[]` | dir: string, targetFile: string | string[] | 72 | Collect ALL files under `dir` (recursively) whose name equals `targetFile`. |


### core_engine/src/utils/ProgressBar.ts

Layer: utils  
Lines: 86  
Purpose: ProgressBar implementation.

Exports: `ProgressBar`, `createSpinner`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `isColorEnabled` | Inferred | 7 | ProgressBar.ts Phase-based terminal progress logger. Prints start/done lines with elapsed time — works with blocking spawnSync. |
| `ansi` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `createSpinner` | `export function createSpinner(label: string): ProgressBar` | label: string | ProgressBar | 83 | Create a phase spinner for a single blocking operation |

#### Class: ProgressBar

Line: 19  
Description: Print the "starting" line

| Property | Type | Line | Description |
|---|---|---:|---|
| `label` | string | 20 | Class state or configuration value used by the class methods. |
| `total` | number | 21 | Class state or configuration value used by the class methods. |
| `current` | Inferred | 22 | Class state or configuration value used by the class methods. |
| `startTime` | number | 23 | Class state or configuration value used by the class methods. |
| `phaseStart` | number | 24 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `constructor` | `constructor(label: string, total: number)` | label: string, total: number | Inferred | 26 | Implements the constructor method. |
| `start` | `start(): void` | None | void | 34 | Print the "starting" line |
| `update` | `update(current: number, label?: string): void` | current: number, label?: string | void | 40 | Update the label (prints a new phase start line) |
| `tick` | `tick(label?: string): void` | label?: string | void | 51 | Increment progress by 1 |
| `done` | `done(message?: string): void` | message?: string | void | 57 | Print the "done" line with elapsed time |
| `fail` | `fail(message?: string): void` | message?: string | void | 66 | Print a failure line |
| `formatElapsed` | `private formatElapsed(ms: number): string` | ms: number | string | 74 | Implements the format elapsed method. |


### core_engine/src/utils/replayLogger.ts

Layer: utils  
Lines: 578  
Purpose: resolveVariableSource, callerScriptLocation, trackCorrelation, trackParameter helpers or command handlers.

Imports:
- `import exec from 'k6/execution';`
- `import http from 'k6/http';`

Exports: `trackCorrelation`, `trackParameter`, `trackDataRow`, `trackAuto`, `createVariableEvent`, `logReplayExchange`, `logExchange`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `VariableRegistryEntry` | Interface | 10 | Defines the VariableRegistryEntry contract used by the framework. |
| `VariableEvent` | Interface | 17 | Defines the VariableEvent contract used by the framework. |
| `Cookie` | Interface | 25 | Defines the Cookie contract used by the framework. |
| `NormalizedHeader` | Interface | 30 | Defines the NormalizedHeader contract used by the framework. |
| `ExchangeMeta` | Interface | 35 | Defines the ExchangeMeta contract used by the framework. |
| `RequestInfo` | Interface | 44 | Per-request cookies passed to k6 (from options.cookies). |
| `K6Response` | Interface | 56 | k6 sets these on a transport failure (timeout / reset / refused) where status comes back as 0. Captured so the report can show WHY instead of a bare, easy-to-miss "0". |
| `RequestDefinition` | Interface | 70 | Defines the RequestDefinition contract used by the framework. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `__ENV` | Record<string, string \| undefined> | 6 | Module-level constant or configuration value. |
| `iterationState` | Record<string, number> | 87 | Module-level constant or configuration value. |
| `_variableRegistry` | Record<string, VariableRegistryEntry> | 93 | Module-level constant or configuration value. |
| `_GENERIC_SOURCES` | Inferred | 102 | Module-level constant or configuration value. |
| `BINARY_CONTENT_RE` | Inferred | 387 | Module-level constant or configuration value. |
| `BINARY_MIME_TYPES` | Inferred | 388 | Module-level constant or configuration value. |
| `STATIC_EXT_RE` | Inferred | 398 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `resolveVariableSource` | `function resolveVariableSource(name: string, incoming: string): string` | name: string, incoming: string | string | 112 | Resolve the source to store for a variable. A specific (non-generic) source always wins; a generic incoming source is kept only when nothing more specific was registered before. This keeps the report's Source column showing the real extraction source the script declared, not the internal placeholder. |
| `callerScriptLocation` | `function callerScriptLocation(): string` | None | string | 125 | Best-effort: pull the first user-script frame (path:line[:col]) out of a fresh stack trace, skipping framework internals (dist/utils) and k6 runtime frames. Used to point a failed-correlation log at the exact extraction site. |
| `trackCorrelation` | `export function trackCorrelation(name: string, value: unknown, source?: string): unknown` | name: string, value: unknown, source?: string | unknown | 146 | Register a correlation variable at the point of extraction. Call this right after a regex match or similar extraction. Returns the value for inline use: correlation_vars["x"] = trackCorrelation("x", match[1], "body"); |
| `trackParameter` | `export function trackParameter(name: string, value: unknown, source?: string): unknown` | name: string, value: unknown, source?: string | unknown | 195 | Register a parameterisation variable (e.g. from CSV data). Call once per parameter per iteration. Returns the value. |
| `trackDataRow` | `export function trackDataRow(sourceName: string, rowObject: Record<string, unknown> \| null): Record<string, unknown> \| null` | sourceName: string, rowObject: Record<string, unknown> \| null | Record<string, unknown> \| null | 212 | Auto-register all properties from a data row object. Call once per data file per iteration. Registers every key-value pair as a parameter. e.g. trackDataRow("userdetails", getUniqueItem(FILES["userdetails"])) will register p_username, p_password, etc. — whatever columns the CSV has. |
| `trackAuto` | `export function trackAuto( name: string, value: unknown, source?: string, type?: 'parameter' \| 'correlation', ): unknown` | name: string, value: unknown, source?: string, type?: 'parameter' \| 'correlation' | unknown | 241 | Debug-time auto-tracking hook for ANY interpolated variable — parameter OR correlation. JavaScript resolves a `${expr}` template into a plain string BEFORE request() ever sees it, so the framework can't recover which variable produced a value at runtime. To make the report's variable table reflect the real per-iteration value of every `${...}` without forcing track* calls into the user's script, the debug runner rewrites each interpolation on a throwaway COPY to `${__k6PerfTrackVar("name", (expr), "source", "type")}`. It registers the value at the exact interpolation site — fresh every iteration — and returns it UNCHANGED (registers directly, never runs the NOTFOUND/placeholder logic) so the surrounding template is byte-for-byte unaffected. Best-effort: tracking must never disturb the request being built. The user's script is never modified and needs no imports (the helper is installed on globalThis). |
| `detectVariableEvents` | `function detectVariableEvents( url: string \| object \| undefined, body: string \| object \| null \| undefined, headers: Record<string, string \| string[]>, actualHeaders?: Record<str...` | url: string \| object \| undefined, body: string \| object \| null \| undefined, headers: Record<string, string \| string[]>, actualHeaders?: Record<string, string \| string[]> | VariableEvent[] | 270 | Auto-detect which registered variables were used in this request. Scans url, body (stringified), and header values for exact matches of tracked variable values. Pass actualHeaders when available so auto-managed headers (Cookie from jar, etc.) are also scanned. |
| `extractQueryParams` | `function extractQueryParams(url: string): Record<string, string>` | url: string | Record<string, string> | 299 | Implements the extract query params function. |
| `extractCookies` | `function extractCookies(headers: Record<string, string \| string[]> =` | headers: Record<string, string \| string[]> = {} | Cookie[] | 312 | Implements the extract cookies function. |
| `extractK6ResponseCookies` | `function extractK6ResponseCookies(resCookies: Record<string, Array<` | resCookies: Record<string, Array<{ value: string }>> | Cookie[] | 340 | Extract cookies from k6's res.cookies object. k6 returns: { cookieName: [{ name, value, domain, path, ... }], ... } |
| `extractJarCookies` | `function extractJarCookies(url: string): Cookie[]` | url: string | Cookie[] | 359 | Extract request cookies from k6's cookie jar for a given URL. Uses http.cookieJar().cookiesForURL() which returns all cookies the VU's jar would send to that URL (including auto-managed ones). Returns: [{ name, value }, ...] |
| `normalizeHeaders` | `function normalizeHeaders(headers: Record<string, string \| string[]> =` | headers: Record<string, string \| string[]> = {} | NormalizedHeader[] | 380 | Implements the normalize headers function. |
| `binaryBodyPlaceholder` | `function binaryBodyPlaceholder(url: string, responseHeaders: Record<string, string \| string[]>): string \| null` | url: string, responseHeaders: Record<string, string \| string[]> | string \| null | 404 | Determine whether response body should be omitted from the replay log. Returns a placeholder string for binary/static content, or null when body is fine. |
| `currentIteration` | `function currentIteration(): number` | None | number | 421 | Implements the current iteration function. It orchestrates process execution. |
| `currentVu` | `function currentVu(): number` | None | number | 425 | Implements the current vu function. It orchestrates process execution. |
| `nextRequestSequence` | `function nextRequestSequence(iteration: number): number` | iteration: number | number | 429 | Implements the next request sequence function. |
| `createVariableEvent` | `export function createVariableEvent( name: string, type: string, action: string, value: unknown, source: string, ): VariableEvent` | name: string, type: string, action: string, value: unknown, source: string | VariableEvent | 435 | Implements the create variable event function. |
| `logReplayExchange` | `export function logReplayExchange( meta: ExchangeMeta, requestInfo: RequestInfo, response: K6Response \| null \| undefined, ): void` | meta: ExchangeMeta, requestInfo: RequestInfo, response: K6Response \| null \| undefined | void | 451 | Implements the log replay exchange function. It orchestrates process execution, emits operator-facing output. |
| `logExchange` | `export function logExchange(req: RequestDefinition, res: K6Response \| null \| undefined): void` | req: RequestDefinition, res: K6Response \| null \| undefined | void | 557 | Compact debug-only logger. Only logs when K6_PERF_DEBUG env var is set. Accepts the request definition object (as generated by ScriptGenerator/ScriptConverter) and the k6 response. Variable events are auto-detected from the registry. |


### core_engine/src/utils/request.ts

Layer: utils  
Lines: 593  
Purpose: getRuntimeErrorBehavior, applyErrorBehaviorForStatus, nextRequestId, getSnapshotConfig helpers or command handlers.

Imports:
- `import http from 'k6/http';`
- `import exec from 'k6/execution';`
- `import { resolvePath, registerBaseUrl } from './session.js';`
- `import { getCurrentTransaction, recordFailingResponse } from './transaction.js';`
- `import { logExchange } from './replayLogger.js';`
- `import { mergeRequestHeaders } from './autoHeaders.js';`

Exports: `CookieValue`, `RequestBody`, `HttpMethod`, `RequestOptions`, `getRequestIdForResponse`, `recordRequestContextForSnapshot`, `captureRequestSnapshot`, `captureSnapshotFromLastRequest`, `emitDeferredFailureSnapshot`, `request`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `RequestReplayMeta` | Interface | 14 | Stable request identifier used for debug diff matching (e.g. "req_1"). |
| `CookieValue` | Interface | 23 | Cookie value object — k6's per-request cookie format. |
| `RequestBody` | TypeAlias | 36 | All body types k6 accepts natively. string → sent as-is (set Content-Type header explicitly) ArrayBuffer / SharedArrayBuffer → binary payload Record<string, string\|number\|bool> → k6 form-encodes as application/x-www-form-urlencoded null → explicitly empty body |
| `HttpMethod` | TypeAlias | 47 | Common HTTP methods with IDE autocomplete. Any other string (e.g. 'CONNECT', 'TRACE', custom verbs) is also accepted and routed through http.request(). |
| `RequestOptions` | Interface | 57 | Metric name for this request (appears in k6 output and transaction grouping). |
| `SnapshotConfig` | Interface | 117 | Defines the SnapshotConfig contract used by the framework. |
| `HttpRuntimeConfig` | Interface | 227 | Defines the HttpRuntimeConfig contract used by the framework. |
| `LastRequestContext` | Interface | 287 | Last-request context, refreshed on every `request()` call so a downstream k6Check failure can produce a full request+response snapshot without the caller threading anything explicitly. Per-VU (k6 module scope). |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `__ENV` | Record<string, string \| undefined> | 10 | Module-level constant or configuration value. |
| `_iterationRequestCount` | Record<string, number> | 160 | Module-level constant or configuration value. |
| `_snapshotConfigCache` | SnapshotConfig \| null | 170 | Module-level constant or configuration value. |
| `_snapshotCount` | Inferred | 202 | Module-level constant or configuration value. |
| `_snapshottedResponses` | Inferred | 209 | Module-level constant or configuration value. |
| `_reqIdByResponse` | Inferred | 215 | Module-level constant or configuration value. |
| `_httpConfigCache` | HttpRuntimeConfig \| null \| undefined | 233 | Module-level constant or configuration value. |
| `STRIP_HEADERS` | Inferred | 251 | Module-level constant or configuration value. |
| `_lastRequestContext` | LastRequestContext \| null | 293 | Module-level constant or configuration value. |
| `_capHitWarned` | Inferred | 294 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getRuntimeErrorBehavior` | `function getRuntimeErrorBehavior(): string` | None | string | 128 | Implements the get runtime error behavior function. It parses structured configuration or artifact data. |
| `applyErrorBehaviorForStatus` | `function applyErrorBehaviorForStatus(method: string, url: string, status: number, error?: string): void` | method: string, url: string, status: number, error?: string | void | 139 | Implements the apply error behavior for status function. It orchestrates process execution. |
| `nextRequestId` | `function nextRequestId(): string` | None | string | 162 | Implements the next request id function. |
| `getSnapshotConfig` | `function getSnapshotConfig(): SnapshotConfig` | None | SnapshotConfig | 172 | Implements the get snapshot config function. It parses structured configuration or artifact data, enforces validation rules. |
| `getRequestIdForResponse` | `export function getRequestIdForResponse(res: any): string \| undefined` | res: any | string \| undefined | 218 | The framework request id (har_entry_id) for a given k6 Response, or undefined. |
| `getHttpRuntimeConfig` | `function getHttpRuntimeConfig(): HttpRuntimeConfig` | None | HttpRuntimeConfig | 235 | Implements the get http runtime config function. It parses structured configuration or artifact data. |
| `sanitizeHeaders` | `function sanitizeHeaders(headers?: Record<string, string>): Record<string, string> \| undefined` | headers?: Record<string, string> | Record<string, string> \| undefined | 253 | Implements the sanitize headers function. |
| `serializeBodyForLog` | `function serializeBodyForLog(body: RequestBody \| undefined): string \| undefined` | body: RequestBody \| undefined | string \| undefined | 266 | Implements the serialize body for log function. |
| `recordRequestContextForSnapshot` | `export function recordRequestContextForSnapshot( method: string, resolvedUrl: string, options: RequestOptions \| undefined, res: any, ): void` | method: string, resolvedUrl: string, options: RequestOptions \| undefined, res: any | void | 296 | Implements the record request context for snapshot function. |
| `captureRequestSnapshot` | `export function captureRequestSnapshot( type: string, context:` | type: string, context: { method: string; url: string; options: RequestOptions \| undefined; res: any; /** Optional human-readable note attached to the snapshot. */ message?: string; } | boolean | 313 | Emit a snapshot of the current request context. Returns true if a snapshot was emitted, false if it was suppressed (feature off, cap hit, no context). The `type` field distinguishes trigger sources for downstream consumers ("http_error", "check_failed", "transaction_error"). Note: "http_error" matches the error-event type so a request's Errors-table row and its snapshot share one type name. |
| `captureSnapshotFromLastRequest` | `export function captureSnapshotFromLastRequest(type: string, message?: string): boolean` | type: string, message?: string | boolean | 398 | Capture a snapshot using the most recent `request()` call's context. Used by k6Check failures and transaction() catch blocks so callers don't need to thread the request envelope through the assertion layer. |
| `emitSnapshotEvent` | `function emitSnapshotEvent( method: string, resolvedUrl: string, options: RequestOptions \| undefined, res: any, ): void` | method: string, resolvedUrl: string, options: RequestOptions \| undefined, res: any | void | 404 | Internal: legacy HTTP-status-failure trigger, kept for source compatibility. |
| `emitDeferredFailureSnapshot` | `export function emitDeferredFailureSnapshot( res: any, ctx:` | res: any, ctx: { method: string; url: string; options: RequestOptions \| undefined } | boolean | 420 | Emit the deferred request-failure snapshot for a specific response, called by transaction()'s finally for each failing response that no status check claimed (checks-first fallback). captureRequestSnapshot dedups on the response object, so a response already snapshotted by a failing check is skipped here. |
| `request` | `export function request( method: HttpMethod, pathOrUrl: string, options?: RequestOptions, ): any` | method: HttpMethod, pathOrUrl: string, options?: RequestOptions | any | 446 | Execute an HTTP request in a framework-aware way and return the native k6 Response. Accepts every body type, HTTP method, and param that k6 supports natively. See RequestOptions for the full set of supported options. |


### core_engine/src/utils/session.ts

Layer: utils  
Lines: 290  
Purpose: getEnvContext, normalizeBaseUrl, isAbsoluteUrl, parseJsonEnv helpers or command handlers.

Imports:
- `import http from 'k6/http';`

Exports: `TeamEnvironmentOverride`, `getEnvContext`, `registerBaseUrl`, `resolvePath`, `registerFrameworkEnvironmentUrls`, `resolveFrameworkUrl`, `getApiKey`, `clearCookies`, `deleteCookie`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `ResolveFrameworkUrlOptions` | Interface | 39 | Defines the ResolveFrameworkUrlOptions contract used by the framework. |
| `TeamEnvironmentOverride` | Interface | 44 | Defines the TeamEnvironmentOverride contract used by the framework. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `__ENV` | Record<string, string \| undefined> | 4 | Module-level constant or configuration value. |
| `_registeredUrls` | Inferred | 7 | Module-level constant or configuration value. |
| `_primaryBaseUrl` | string \| undefined | 10 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getEnvContext` | `export function getEnvContext(teamName: string, fallback?: TeamEnvironmentOverride): TeamEnvironmentOverride` | teamName: string, fallback?: TeamEnvironmentOverride | TeamEnvironmentOverride | 61 | Get the environment context for a specific team. (e.g., standalone k6 run). Explicitly typed as TeamEnvironmentOverride so it is clear which fields (baseUrl, serviceUrls, custom) are being overridden. Example: const env = getEnvContext('jpet_new', { baseUrl: 'https://jpetstore.aspectran.com' }); |
| `normalizeBaseUrl` | `function normalizeBaseUrl(url: string): string` | url: string | string | 89 | Implements the normalize base url function. |
| `isAbsoluteUrl` | `function isAbsoluteUrl(url: string): boolean` | url: string | boolean | 93 | Implements the is absolute url function. |
| `parseJsonEnv` | `function parseJsonEnv<T>(name: string, fallback: T): T` | name: string, fallback: T | T | 97 | Implements the parse json env function. It parses structured configuration or artifact data. |
| `joinBaseAndPath` | `function joinBaseAndPath(baseUrl: string, pathOrUrl: string): string` | baseUrl: string, pathOrUrl: string | string | 110 | Implements the join base and path function. |
| `getFrameworkBaseUrl` | `function getFrameworkBaseUrl(): string \| undefined` | None | string \| undefined | 128 | Implements the get framework base url function. |
| `getFrameworkServiceUrls` | `function getFrameworkServiceUrls(): Record<string, string>` | None | Record<string, string> | 133 | Implements the get framework service urls function. |
| `registerBaseUrl` | `export function registerBaseUrl(url: string): void` | url: string | void | 144 | Register a base URL so clearCookies() can clear it without manual arguments. Called automatically by the framework at script init; users can also call it for additional hosts. |
| `resolvePath` | `export function resolvePath(pathOrUrl: string, service?: string): string` | pathOrUrl: string, service?: string | string | 166 | Resolve a relative path or absolute URL to a full URL. Resolution priority: 1. Absolute URLs → returned unchanged 2. Named service → K6_PERF_SERVICE_URLS[service] 3. K6_PERF_BASE_URL env var (set by CLI) 4. First URL registered via registerBaseUrl() (standalone execution fallback) 5. Path returned as-is if no base is available This is the URL resolution contract used by request(). |
| `registerFrameworkEnvironmentUrls` | `export function registerFrameworkEnvironmentUrls(fallbackUrls: string[] = []): void` | fallbackUrls: string[] = [] | void | 195 | Register environment URLs from K6_PERF_* env vars, falling back to the provided recorded URLs when runtime env URLs are unavailable. |
| `resolveFrameworkUrl` | `export function resolveFrameworkUrl(pathOrUrl: string, options: ResolveFrameworkUrlOptions =` | pathOrUrl: string, options: ResolveFrameworkUrlOptions = {} | string | 219 | Resolve a relative request path against the framework-injected base URL. Falls back to a recorded base URL when env injection is not available. |
| `getApiKey` | `export function getApiKey(): string \| undefined` | None | string \| undefined | 253 | Get the API key injected from .env (K6_API_KEY → K6_PERF_API_KEY). Returns undefined when no key is configured, so callers can guard: import { getApiKey } from '../../../dist/utils/session.js'; const key = getApiKey(); const headers = key ? { Authorization: `Bearer ${key}` } : {}; |
| `clearCookies` | `export function clearCookies(...urls: string[]): void` | ...urls: string[] | void | 268 | Clear all cookies from the VU's cookie jar. - With no arguments: clears cookies for ALL registered base URLs. - With arguments: clears cookies for the given URLs only. Usage: import { clearCookies } from '../../../dist/utils/session.js'; clearCookies(); // clear all registered URLs clearCookies('https://myapp.example.com/'); // clear specific URL |
| `deleteCookie` | `export function deleteCookie(url: string, name: string): void` | url: string, name: string | void | 286 | Delete a specific named cookie for a URL from the VU's cookie jar. Usage: import { deleteCookie } from '../../../dist/utils/session.js'; deleteCookie('https://myapp.example.com/', 'JSESSIONID'); |


### core_engine/src/utils/transaction.ts

Layer: utils  
Lines: 567  
Purpose: getRuntimeErrorBehavior, recordFailingResponse, extractScriptLocation, formatStackSnippet helpers or command handlers.

Imports:
- `import { group, check as nativeCheck } from 'k6';`
- `import { Counter, Rate, Trend } from 'k6/metrics';`
- `import exec from 'k6/execution';`

Exports: `recordFailingResponse`, `isJsRuntimeError`, `isVuTerminated`, `initTransactions`, `getCurrentTransaction`, `startTransaction`, `endTransaction`, `transaction`, `k6Check`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `__ENV` | Record<string, string \| undefined> | 8 | Module-level constant or configuration value. |
| `txnStarts` | Record<string, number> | 24 | Module-level constant or configuration value. |
| `txnTrends` | Record<string, Trend> | 25 | Module-level constant or configuration value. |
| `txnCounters` | Record<string, Counter> | 26 | Module-level constant or configuration value. |
| `txnResults` | Record<string, Rate> | 31 | Module-level constant or configuration value. |
| `_currentIterationFailed` | Inferred | 36 | Module-level constant or configuration value. |
| `_uncheckedFailingResponses` | Inferred | 45 | Module-level constant or configuration value. |
| `_activeTransaction` | string | 140 | Module-level constant or configuration value. |
| `_vuTerminated` | Inferred | 144 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getRuntimeErrorBehavior` | `function getRuntimeErrorBehavior(): string` | None | string | 13 | Implements the get runtime error behavior function. It parses structured configuration or artifact data. |
| `recordFailingResponse` | `export function recordFailingResponse( res: object, info:` | res: object, info: { method: string; url: string; status: number; options?: unknown } | void | 54 | Record an HTTP response the framework considers failed (status 0 = transport error, or status >= 400). Called by request() for every failing response. No-op outside an active transaction so failures in init/end phases or between transactions can't leak into the next one. `options` is stashed so finally can build the deferred request-failure snapshot with full request context. |
| `extractScriptLocation` | `function extractScriptLocation(stack: string \| undefined): string` | stack: string \| undefined | string | 76 | Pull a user-script source location (path:line[:col]) out of an Error.stack string. k6 runs scripts under the Goja JS engine which produces stack frames in several shapes depending on the call form, e.g.: at file:///D:/.../script.js:258:5(15) at action_phase (file:///D:/.../script.js:258:5) at /abs/path/script.js:42:7 script.js:42 To stay robust against future format tweaks we look for any token that looks like `<something>:<digits>[:<digits>]` and pick the first one that doesn't belong to framework internals (`dist/utils/`). Returns the bare `path:line:col` (or `path:line`) substring, or `""` when nothing usable is present. |
| `formatStackSnippet` | `function formatStackSnippet(stack: string \| undefined, limit: number = 3): string` | stack: string \| undefined, limit: number = 3 | string | 106 | First N non-empty stack lines, joined — useful when `extractScriptLocation` couldn't find a clean frame but the raw stack still has useful info. |
| `isJsRuntimeError` | `export function isJsRuntimeError(error: unknown): boolean` | error: unknown | boolean | 124 | True when `error` is a JS-engine error type that signals a programming bug in the script — an undefined identifier, calling a non-function, a bad property access, etc. (ReferenceError / TypeError / RangeError / SyntaxError / URIError / EvalError). Failed checks and HTTP errors are raised by the framework as plain `Error` and are NOT matched here, so they still follow the configured errorBehavior; a runtime bug always aborts the test instead. |
| `isVuTerminated` | `export function isVuTerminated(): boolean` | None | boolean | 147 | Returns true if this VU was stopped via stop_vu errorBehavior. |
| `initTransactions` | `export function initTransactions(names: string[]): void` | names: string[] | void | 173 | Initializes Trends and Counters for the specified transactions. MUST be called in the script's init context (global scope), not inside VU functions. K6_PERF_TRANSACTION_NAMES. Keep calling this for legacy scripts and standalone execution. |
| `getCurrentTransaction` | `export function getCurrentTransaction(): string` | None | string | 195 | Returns the name of the currently active transaction for this VU, or '' if none. Used by request() to auto-attach transaction context to replay log entries. |
| `startTransaction` | `export function startTransaction(name: string): void` | name: string | void | 203 | Start a transaction (LoadRunner equivalent). |
| `endTransaction` | `export function endTransaction(name: string): void` | name: string | void | 217 | End a transaction (LoadRunner equivalent). Records elapsed duration since startTransaction; safe to call in finally blocks. |
| `transaction` | `export function transaction(name: string, fn: () => void): void` | name: string, fn: () => void | void | 250 | Execute a named transaction with group wrapping, metric recording, and lifecycle gating. Replaces the manual pattern: group('name', () => { startTransaction('name'); ...; endTransaction('name'); }); Behavior: - Checks lifecycle gate: if the VU is ramping down for the final time, skips the transaction. - Wraps the body in k6 group() for hierarchical result grouping. - Guarantees endTransaction() runs even if fn() throws (finally block). - Applies the configured errorBehavior (continue \| stop_iteration \| stop_vu \| abort_test). Nesting: nested transaction() calls are rejected with a descriptive error. |
| `k6Check` | `export function k6Check( val: any, sets: Record<string, (v: any) => boolean>, tags?: Record<string, string>, ): boolean` | val: any, sets: Record<string, (v: any) => boolean>, tags?: Record<string, string> | boolean | 458 | Framework-aware check() that wraps k6's native check() so metrics are always recorded, then applies errorBehavior when one or more checks fail. Drop-in replacement for k6's check() — same signature, same metric output. |


### testSuites/b2b_new/tests/.k6-perf-entry-Run_2026_07_14T10_18_51_542Z.js

Layer: test suite  
Lines: 12  
Purpose: handleSummary helpers or command handlers.

Imports:
- `import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";`
- `import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";`

Exports: `export { default as raw_buyanimal_07may } from './raw_buyanimal_07may.js';`, `handleSummary`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `handleSummary` | `export function handleSummary(data)` | data | Inferred | 5 | Implements the handle summary function. It orchestrates process execution. |


### testSuites/b2b_new/tests/byosCheck.js

Layer: test suite  
Lines: 50  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 8 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 15 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 44 | Implements the end phase function. |


### testSuites/b2b_new/tests/raw_buyanimal_07may.js

Layer: test suite  
Lines: 846  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check, request, createJourneyLifecycleStore, runJourneyLifecycle, thinktime, logReplayExchange, trackCorrelation, trackParameter, clearCookies, getEnvContext } from '../../../dist/index.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 3 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 5 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 7 | Implements the init phase function. It orchestrates process execution. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 264 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 758 | Implements the end phase function. It orchestrates process execution. |


### testSuites/check/tests/check_curl_paste.js

Layer: test suite  
Lines: 56  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 50 | Implements the end phase function. |


### testSuites/Jpet_new/recordings/buy_animals.js

Layer: test suite  
Lines: 589  
Purpose: getUniqueItem helpers or command handlers.

Imports:
- `import { group, sleep, check } from "k6";`
- `import http from "k6/http";`
- `import execution from "k6/execution";`
- `import csv from "k6/experimental/csv";`
- `import fs from "k6/experimental/fs";`

Exports: `options`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `options` | Inferred | 9 | Module-level constant or configuration value. |
| `FILES` | Inferred | 17 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getUniqueItem` | `function getUniqueItem(array)` | array | Inferred | 25 | Implements the get unique item function. It orchestrates process execution. |


### testSuites/Jpet_new/tests/.7wcytf__tmp-k6studio__.js

Layer: test suite  
Lines: 548  
Purpose: instrumentParams, isTestingLibrary, createSequence, trackLog helpers or command handlers.

Imports:
- `import http from 'k6/http';`
- `import execution from 'k6/execution';`
- `import {browser} from 'k6/browser';`
- `import * as userScript from "./buy_animal_1stJune_converted.js";`

Exports: `export {entrypoint as default, handleSummary, options};`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `originalRequest` | Inferred | 16 | Module-level constant or configuration value. |
| `originalAsyncRequest` | Inferred | 17 | Module-level constant or configuration value. |
| `TRACKING_SERVER_URL` | Inferred | 45 | Module-level constant or configuration value. |
| `nextId` | Inferred | 55 | Module-level constant or configuration value. |
| `shouldInstrument` | Inferred | 345 | Module-level constant or configuration value. |
| `SESSION_REPLAY_SCRIPT` | Inferred | 463 | Module-level constant or configuration value. |
| `isContextInitialized` | Inferred | 464 | Module-level constant or configuration value. |
| `nativeNewPage` | Inferred | 483 | Module-level constant or configuration value. |
| `nativeNewContext` | Inferred | 484 | Module-level constant or configuration value. |
| `nativeContext` | Inferred | 485 | Module-level constant or configuration value. |
| `DEFAULT_SCENARIOS` | Inferred | 522 | Module-level constant or configuration value. |
| `scenarios` | Inferred | 528 | Module-level constant or configuration value. |
| `options` | Inferred | 537 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `instrumentParams` | `function instrumentParams(params)` | params | Inferred | 5 | Implements the instrument params function. It orchestrates process execution. |
| `isTestingLibrary` | `function isTestingLibrary()` | None | Inferred | 46 | Implements the is testing library function. It orchestrates process execution. |
| `createSequence` | `function createSequence()` | None | Inferred | 49 | Implements the create sequence function. |
| `trackLog` | `function trackLog(entry)` | entry | Inferred | 56 | Implements the track log function. |
| `begin` | `function begin(action)` | action | Inferred | 67 | Implements the begin function. |
| `end` | `function end(event, result)` | event, result | Inferred | 94 | Implements the end function. |
| `getProxyMethod` | `function getProxyMethod(method, proxies)` | method, proxies | Inferred | 115 | Implements the get proxy method function. |
| `getTrackingMethod` | `function getTrackingMethod(method, tracking)` | method, tracking | Inferred | 118 | Implements the get tracking method function. |
| `createProxy` | `function createProxy(` | {target, tracking, proxies} | Inferred | 131 | Implements the create proxy function. |
| `createSingleEntryGuard` | `function createSingleEntryGuard()` | None | Inferred | 184 | Implements the create single entry guard function. |
| `isLocatorMethod` | `function isLocatorMethod(method)` | method | Inferred | 196 | Implements the is locator method function. |
| `locatorProxy` | `function locatorProxy(target, locator)` | target, locator | Inferred | 217 | Implements the locator proxy function. |
| `pageProxy` | `function pageProxy(target)` | target | Inferred | 346 | Implements the page proxy function. |
| `injectSessionReplayScript` | `async function injectSessionReplayScript(context)` | context | Inferred | 465 | Implements the inject session replay script function. |
| `browserContextProxy` | `function browserContextProxy(target)` | target | Inferred | 472 | Implements the browser context proxy function. |
| `handleSummary` | `function handleSummary(data)` | data | Inferred | 503 | Implements the handle summary function. |
| `entrypoint` | `async function entrypoint()` | None | Inferred | 540 | Implements the entrypoint function. It orchestrates process execution. |


### testSuites/Jpet_new/tests/.k6-perf-entry-Run_2026-05-19T17-53-34-465Z.js

Layer: test suite  
Lines: 2  
Purpose: Framework file.

Exports: `export { default as buyanimal_raw_19thmay } from './buyanimal_raw_19thmay.js';`


### testSuites/Jpet_new/tests/.k6-perf-entry-Run_2026-05-19T18-05-21-349Z.js

Layer: test suite  
Lines: 11  
Purpose: handleSummary helpers or command handlers.

Imports:
- `import { htmlReport, textSummary } from '../../../dist/utils/summaryReporter.js';`

Exports: `export { default as buyanimal_raw_19thmay } from './buyanimal_raw_19thmay.js';`, `handleSummary`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `handleSummary` | `export function handleSummary(data)` | data | Inferred | 4 | Implements the handle summary function. It orchestrates process execution. |


### testSuites/Jpet_new/tests/.k6-perf-entry-Run_2026-05-21T04-30-21-486Z.js

Layer: test suite  
Lines: 12  
Purpose: handleSummary helpers or command handlers.

Imports:
- `import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";`
- `import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";`

Exports: `export { default as buyanimal_raw_20thmay } from './buyanimal_raw_20thmay.js';`, `handleSummary`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `handleSummary` | `export function handleSummary(data)` | data | Inferred | 5 | Implements the handle summary function. It orchestrates process execution. |


### testSuites/Jpet_new/tests/.k6-perf-entry-Run_20260702050900.js

Layer: test suite  
Lines: 12  
Purpose: handleSummary helpers or command handlers.

Imports:
- `import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";`
- `import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";`

Exports: `export { default as buy_working_covert } from './buy_working_covert.js';`, `handleSummary`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `handleSummary` | `export function handleSummary(data)` | data | Inferred | 5 | Implements the handle summary function. It orchestrates process execution. |


### testSuites/Jpet_new/tests/buy_animal_1stJune_converted.js

Layer: test suite  
Lines: 588  
Purpose: getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { sleep } from 'k6';`
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { trackCorrelation, trackParameter, trackDataRow } from '../../../dist/utils/replayLogger.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`
- `import execution from "k6/execution";`
- `import csv from "k6/experimental/csv";`
- `import fs from "k6/experimental/fs";`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `FILES` | Inferred | 10 | Module-level constant or configuration value. |
| `env` | Inferred | 22 | Module-level constant or configuration value. |
| `match` | Inferred | 24 | Module-level constant or configuration value. |
| `regex` | Inferred | 25 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 27 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getUniqueItem` | `function getUniqueItem(array)` | array | Inferred | 18 | Implements the get unique item function. It orchestrates process execution. |
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 29 | Implements the init phase function. It orchestrates process execution, parses structured configuration or artifact data. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 170 | Implements the action phase function. It orchestrates process execution, parses structured configuration or artifact data. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 505 | Implements the end phase function. It orchestrates process execution. |


### testSuites/Jpet_new/tests/buy_animal_autotrack_convert.js

Layer: test suite  
Lines: 582  
Purpose: getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { sleep } from 'k6';`
- `import { transaction, k6Check, request, trackCorrelation, trackParameter, trackDataRow, createJourneyLifecycleStore, runJourneyLifecycle, thinktime, clearCookies, getEnvContext } from '../../../dist/index.js';`
- `import execution from "k6/execution";`
- `import csv from "k6/experimental/csv";`
- `import fs from "k6/experimental/fs";`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `FILES` | Inferred | 6 | Module-level constant or configuration value. |
| `env` | Inferred | 18 | Module-level constant or configuration value. |
| `match` | Inferred | 20 | Module-level constant or configuration value. |
| `regex` | Inferred | 21 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 23 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getUniqueItem` | `function getUniqueItem(array)` | array | Inferred | 14 | Implements the get unique item function. It orchestrates process execution. |
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 25 | Implements the init phase function. It orchestrates process execution, parses structured configuration or artifact data. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 164 | Implements the action phase function. It orchestrates process execution, parses structured configuration or artifact data. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 499 | Implements the end phase function. It orchestrates process execution. |


### testSuites/Jpet_new/tests/buy_animals_working.js

Layer: test suite  
Lines: 601  
Purpose: getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { sleep } from 'k6';`
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { trackCorrelation, trackParameter, trackDataRow } from '../../../dist/utils/replayLogger.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`
- `import execution from "k6/execution";`
- `import csv from "k6/experimental/csv";`
- `import fs from "k6/experimental/fs";`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `FILES` | Inferred | 10 | Module-level constant or configuration value. |
| `match` | Inferred | 21 | Module-level constant or configuration value. |
| `regex` | Inferred | 22 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 24 | Module-level constant or configuration value. |
| `env` | Inferred | 577 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 579 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getUniqueItem` | `function getUniqueItem(array)` | array | Inferred | 18 | Implements the get unique item function. It orchestrates process execution. |
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 26 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 34 | Implements the action phase function. It orchestrates process execution, parses structured configuration or artifact data. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 573 | Implements the end phase function. |
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 581 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 588 | Implements the action phase function. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 593 | Implements the end phase function. |


### testSuites/Jpet_new/tests/buy_working_covert.js

Layer: test suite  
Lines: 585  
Purpose: getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { sleep } from 'k6';`
- `import { transaction, k6Check, request, trackCorrelation, trackParameter, trackDataRow, createJourneyLifecycleStore, runJourneyLifecycle, thinktime, clearCookies, getEnvContext } from '../../../dist/index.js';`
- `import execution from "k6/execution";`
- `import csv from "k6/experimental/csv";`
- `import fs from "k6/experimental/fs";`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 5 | Module-level constant or configuration value. |
| `FILES` | Inferred | 8 | Module-level constant or configuration value. |
| `match` | Inferred | 19 | Module-level constant or configuration value. |
| `regex` | Inferred | 20 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 22 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getUniqueItem` | `function getUniqueItem(array)` | array | Inferred | 16 | Implements the get unique item function. It orchestrates process execution. |
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 24 | Implements the init phase function. It orchestrates process execution, parses structured configuration or artifact data. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 164 | Implements the action phase function. It orchestrates process execution, parses structured configuration or artifact data. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 499 | Implements the end phase function. It orchestrates process execution. |


### testSuites/Jpet_new/tests/buyanimal_converted_20thmay.js

Layer: test suite  
Lines: 569  
Purpose: getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { sleep } from 'k6';`
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { trackCorrelation, trackParameter, trackDataRow } from '../../../dist/utils/replayLogger.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`
- `import execution from "k6/execution";`
- `import csv from "k6/experimental/csv";`
- `import fs from "k6/experimental/fs";`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `FILES` | Inferred | 10 | Module-level constant or configuration value. |
| `env` | Inferred | 22 | Module-level constant or configuration value. |
| `match` | Inferred | 24 | Module-level constant or configuration value. |
| `regex` | Inferred | 25 | Module-level constant or configuration value. |
| `p_check` | Inferred | 26 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 28 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getUniqueItem` | `function getUniqueItem(array)` | array | Inferred | 18 | Implements the get unique item function. It orchestrates process execution. |
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 30 | Implements the init phase function. It orchestrates process execution, parses structured configuration or artifact data. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 164 | Implements the action phase function. It orchestrates process execution, parses structured configuration or artifact data. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 489 | Implements the end phase function. It orchestrates process execution. |


### testSuites/Jpet_new/tests/buyanimal_converted_25thmay.js

Layer: test suite  
Lines: 572  
Purpose: getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { sleep } from 'k6';`
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { trackCorrelation, trackParameter, trackDataRow } from '../../../dist/utils/replayLogger.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`
- `import execution from "k6/execution";`
- `import csv from "k6/experimental/csv";`
- `import fs from "k6/experimental/fs";`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `FILES` | Inferred | 10 | Module-level constant or configuration value. |
| `env` | Inferred | 22 | Module-level constant or configuration value. |
| `match` | Inferred | 24 | Module-level constant or configuration value. |
| `regex` | Inferred | 25 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 27 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getUniqueItem` | `function getUniqueItem(array)` | array | Inferred | 18 | Implements the get unique item function. It orchestrates process execution. |
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 29 | Implements the init phase function. It orchestrates process execution, parses structured configuration or artifact data, emits operator-facing output. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 165 | Implements the action phase function. It orchestrates process execution, parses structured configuration or artifact data, emits operator-facing output. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 492 | Implements the end phase function. It orchestrates process execution. |


### testSuites/Jpet_new/tests/buyanimal_converted_26thmay.js

Layer: test suite  
Lines: 566  
Purpose: getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { sleep } from 'k6';`
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { trackCorrelation, trackParameter, trackDataRow } from '../../../dist/utils/replayLogger.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`
- `import execution from "k6/execution";`
- `import csv from "k6/experimental/csv";`
- `import fs from "k6/experimental/fs";`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `FILES` | Inferred | 10 | Module-level constant or configuration value. |
| `env` | Inferred | 22 | Module-level constant or configuration value. |
| `match` | Inferred | 24 | Module-level constant or configuration value. |
| `regex` | Inferred | 25 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 27 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getUniqueItem` | `function getUniqueItem(array)` | array | Inferred | 18 | Implements the get unique item function. It orchestrates process execution. |
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 29 | Implements the init phase function. It orchestrates process execution, parses structured configuration or artifact data. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 163 | Implements the action phase function. It orchestrates process execution, parses structured configuration or artifact data. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 486 | Implements the end phase function. It orchestrates process execution. |


### testSuites/Jpet_new/tests/buyanimal_correlated.js

Layer: test suite  
Lines: 866  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`
- `import { extractBoundary, extractHeader } from '../../../dist/index.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 8 | Module-level constant or configuration value. |
| `c_state` | Inferred | 11 | Module-level constant or configuration value. |
| `c_location` | Inferred | 12 | Module-level constant or configuration value. |
| `c_billToFirstName` | Inferred | 13 | Module-level constant or configuration value. |
| `c_order` | Inferred | 14 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 16 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 18 | Implements the init phase function. It orchestrates process execution. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 248 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 750 | Implements the end phase function. It orchestrates process execution. |


### testSuites/Jpet_new/tests/buyanimal_raw_28thmay.js

Layer: test suite  
Lines: 855  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. It orchestrates process execution. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 241 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 739 | Implements the end phase function. It orchestrates process execution. |


### testSuites/Jpet_new/tests/curl.js

Layer: test suite  
Lines: 56  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 50 | Implements the end phase function. |


### testSuites/Jpet_new/tests/raw_buyanimal_07thMay.js

Layer: test suite  
Lines: 846  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check, request, createJourneyLifecycleStore, runJourneyLifecycle, thinktime, logReplayExchange, trackCorrelation, trackParameter, clearCookies, getEnvContext } from '../../../dist/index.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 3 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 5 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 7 | Implements the init phase function. It orchestrates process execution. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 264 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 758 | Implements the end phase function. It orchestrates process execution. |


### testSuites/Jpet_new/tests/test_byos.js

Layer: test suite  
Lines: 50  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 8 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 15 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 44 | Implements the end phase function. |


### testSuites/jpet_team/tests/buy_animals_working.js

Layer: test suite  
Lines: 586  
Purpose: getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { sleep } from 'k6';`
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { trackCorrelation, trackParameter, trackDataRow } from '../../../dist/utils/replayLogger.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`
- `import execution from "k6/execution";`
- `import csv from "k6/experimental/csv";`
- `import fs from "k6/experimental/fs";`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `FILES` | Inferred | 10 | Module-level constant or configuration value. |
| `env` | Inferred | 22 | Module-level constant or configuration value. |
| `match` | Inferred | 24 | Module-level constant or configuration value. |
| `regex` | Inferred | 25 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 27 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getUniqueItem` | `function getUniqueItem(array)` | array | Inferred | 18 | Implements the get unique item function. It orchestrates process execution. |
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 29 | Implements the init phase function. It orchestrates process execution, parses structured configuration or artifact data. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 168 | Implements the action phase function. It orchestrates process execution, parses structured configuration or artifact data. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 503 | Implements the end phase function. It orchestrates process execution. |


### testSuites/jpet_team/tests/buyanimal_1_framework_lifecycle_copy.js

Layer: test suite  
Lines: 898  
Purpose: getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { check, group } from 'k6';`
- `import execution from "k6/execution";`
- `import csv from "k6/experimental/csv";`
- `import fs from "k6/experimental/fs";`
- `import http from 'k6/http';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle } from '../../../dist/utils/lifecycle.js';`
- `import { logExchange, trackCorrelation, trackDataRow } from '../../../dist/utils/replayLogger.js';`
- `import { endTransaction, initTransactions, startTransaction } from '../../../dist/utils/transaction.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `FILES` | Inferred | 22 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 33 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getUniqueItem` | `function getUniqueItem(array)` | array | Inferred | 30 | Implements the get unique item function. It orchestrates process execution. |
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 35 | Implements the init phase function. It parses structured configuration or artifact data. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 251 | Implements the action phase function. It parses structured configuration or artifact data. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 768 | Implements the end phase function. |


### testSuites/jpet_team/tests/buyanimal_1_framework_lifecycle.js

Layer: test suite  
Lines: 898  
Purpose: getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { check, group, sleep } from 'k6';`
- `import execution from "k6/execution";`
- `import csv from "k6/experimental/csv";`
- `import fs from "k6/experimental/fs";`
- `import http from 'k6/http';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, getFrameworkThinkTime } from '../../../dist/utils/lifecycle.js';`
- `import { logExchange, trackCorrelation, trackDataRow } from '../../../dist/utils/replayLogger.js';`
- `import { endTransaction, initTransactions, startTransaction } from '../../../dist/utils/transaction.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `FILES` | Inferred | 22 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 33 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getUniqueItem` | `function getUniqueItem(array)` | array | Inferred | 30 | Implements the get unique item function. It orchestrates process execution. |
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 35 | Implements the init phase function. It parses structured configuration or artifact data. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 251 | Implements the action phase function. It parses structured configuration or artifact data. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 768 | Implements the end phase function. |


### testSuites/jpet_team/tests/buyanimal_1.js

Layer: test suite  
Lines: 872  
Purpose: getUniqueItem helpers or command handlers.

Imports:
- `import { check, group, sleep } from 'k6';`
- `import execution from "k6/execution";`
- `import csv from "k6/experimental/csv";`
- `import fs from "k6/experimental/fs";`
- `import http from 'k6/http';`
- `import { logExchange, trackCorrelation, trackDataRow } from '../../../core_engine/src/utils/replayLogger.js';`
- `import { endTransaction, initTransactions, startTransaction } from '../../../core_engine/src/utils/transaction.js';`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `FILES` | Inferred | 21 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getUniqueItem` | `function getUniqueItem(array)` | array | Inferred | 29 | Implements the get unique item function. It orchestrates process execution. |


### testSuites/jpet_team/tests/buyanimal_n.js

Layer: test suite  
Lines: 872  
Purpose: getUniqueItem helpers or command handlers.

Imports:
- `import { check, group, sleep } from 'k6';`
- `import execution from "k6/execution";`
- `import csv from "k6/experimental/csv";`
- `import fs from "k6/experimental/fs";`
- `import http from 'k6/http';`
- `import { logExchange, trackCorrelation, trackDataRow } from '../../../core_engine/src/utils/replayLogger.js';`
- `import { endTransaction, initTransactions, startTransaction } from '../../../core_engine/src/utils/transaction.js';`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `FILES` | Inferred | 21 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getUniqueItem` | `function getUniqueItem(array)` | array | Inferred | 29 | Implements the get unique item function. It orchestrates process execution. |


### testSuites/jpet_team/tests/buyanimal_new.js

Layer: test suite  
Lines: 853  
Purpose: getUniqueItem helpers or command handlers.

Imports:
- `import { check, group, sleep } from 'k6';`
- `import execution from "k6/execution";`
- `import csv from "k6/experimental/csv";`
- `import fs from "k6/experimental/fs";`
- `import http from 'k6/http';`
- `import { logExchange, trackCorrelation, trackParameter } from '../../../core_engine/src/utils/replayLogger.js';`
- `import { endTransaction, initTransactions, startTransaction } from '../../../core_engine/src/utils/transaction.js';`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `FILES` | Inferred | 21 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getUniqueItem` | `function getUniqueItem(array)` | array | Inferred | 29 | Implements the get unique item function. It orchestrates process execution. |


### testSuites/jpet_team/tests/buyanimal_raw.js

Layer: test suite  
Lines: 1359  
Purpose: Framework file.

Imports:
- `import http from 'k6/http';`
- `import { check, sleep, group } from 'k6';`
- `import { initTransactions, startTransaction, endTransaction } from '../../../core_engine/src/utils/transaction.js';`
- `import { logExchange, trackCorrelation, trackParameter } from '../../../core_engine/src/utils/replayLogger.js';`


### testSuites/jpet_team/tests/buyanimal.js

Layer: test suite  
Lines: 959  
Purpose: getUniqueItem helpers or command handlers.

Imports:
- `import http from 'k6/http';`
- `import { check, sleep, group } from 'k6';`
- `import { initTransactions, startTransaction, endTransaction } from '../../../core_engine/src/utils/transaction.js';`
- `import { logExchange } from '../../../core_engine/src/utils/replayLogger.js';`
- `import execution from "k6/execution";`
- `import csv from "k6/experimental/csv";`
- `import fs from "k6/experimental/fs";`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `FILES` | Inferred | 21 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getUniqueItem` | `function getUniqueItem(array)` | array | Inferred | 29 | Implements the get unique item function. It orchestrates process execution. |


### testSuites/jpet_team/tests/jpet-login-test.js

Layer: test suite  
Lines: 1854  
Purpose: Framework file.

Imports:
- `import http from 'k6/http';`
- `import { check, sleep, group } from 'k6';`
- `import { initTransactions, startTransaction, endTransaction } from '../../../core_engine/src/utils/transaction.js';`
- `import { logReplayExchange } from '../../../core_engine/src/utils/replayLogger.js';`


### testSuites/jpet_team/tests/jpetstore.aspectran.com_buydog_1.js

Layer: test suite  
Lines: 1216  
Purpose: Framework file.

Imports:
- `import http from 'k6/http';`
- `import { check, sleep, group } from 'k6';`
- `import { initTransactions, startTransaction, endTransaction } from '../../../core_engine/src/utils/transaction.js';`
- `import { logExchange } from '../../../core_engine/src/utils/replayLogger.js';`


### testSuites/jpet_team/tests/jpetstore.aspectran.com_buydog.js

Layer: test suite  
Lines: 1854  
Purpose: Framework file.

Imports:
- `import http from 'k6/http';`
- `import { check, sleep, group } from 'k6';`
- `import { initTransactions, startTransaction, endTransaction } from '../../../core_engine/src/utils/transaction.js';`
- `import { logReplayExchange } from '../../../core_engine/src/utils/replayLogger.js';`


### testSuites/my_team/tests/test-lifecycle-byos.js

Layer: test suite  
Lines: 42  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import http from 'k6/http';`
- `import { check, sleep, group } from 'k6';`
- `import { initTransactions, startTransaction, endTransaction } from '../../../core_engine/src/utils/transaction.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle } from '../../../core_engine/src/utils/lifecycle.js';`
- `import { logExchange } from '../../../core_engine/src/utils/replayLogger.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `lifecycleStore` | Inferred | 8 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 10 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 13 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 36 | Implements the end phase function. |


### testSuites/sample_team/tests/Auth_Login.js

Layer: test suite  
Lines: 62  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 56 | Implements the end phase function. |


### testSuites/sample_team/tests/browse-journey.js

Layer: test suite  
Lines: 42  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import http from 'k6/http';`
- `import { check, sleep, group } from 'k6';`
- `import { initTransactions, startTransaction, endTransaction } from '../../../dist/utils/transaction.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, getFrameworkThinkTime } from '../../../dist/utils/lifecycle.js';`
- `import { logExchange } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, registerFrameworkEnvironmentUrls, resolveFrameworkUrl } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `lifecycleStore` | Inferred | 10 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 12 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 36 | Implements the end phase function. |


### testSuites/sample_team/tests/checkorder_script.js

Layer: test suite  
Lines: 55  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 49 | Implements the end phase function. |


### testSuites/sample_team/tests/checkorder_script1.js

Layer: test suite  
Lines: 55  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 49 | Implements the end phase function. |


### testSuites/sample_team/tests/checkout-journey.js

Layer: test suite  
Lines: 58  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import http from 'k6/http';`
- `import { check, sleep, group } from 'k6';`
- `import { initTransactions, startTransaction, endTransaction } from '../../../dist/utils/transaction.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, getFrameworkThinkTime } from '../../../dist/utils/lifecycle.js';`
- `import { logExchange } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, registerFrameworkEnvironmentUrls, resolveFrameworkUrl } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `lifecycleStore` | Inferred | 10 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 12 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 27 | Implements the action phase function. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 52 | Implements the end phase function. |


### testSuites/sample_team/tests/my_journey.js

Layer: test suite  
Lines: 72  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 66 | Implements the end phase function. |


### testSuites/sample_team/tests/my_login_script.js

Layer: test suite  
Lines: 41  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 35 | Implements the end phase function. |


### testSuites/sample_team/tests/New_Folder_Login_Copy.js

Layer: test suite  
Lines: 62  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 56 | Implements the end phase function. |


### testSuites/sample_team/tests/new_postman_check.js

Layer: test suite  
Lines: 159  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 153 | Implements the end phase function. |


### testSuites/sample_team/tests/postman_journey.js

Layer: test suite  
Lines: 118  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 112 | Implements the end phase function. |


### testSuites/sample_team/tests/smart_postman.js

Layer: test suite  
Lines: 151  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 145 | Implements the end phase function. |


### testSuites/sample_team/tests/smoke_bash.js

Layer: test suite  
Lines: 56  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 50 | Implements the end phase function. |


### testSuites/sample_team/tests/smoke_cmd.js

Layer: test suite  
Lines: 42  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 36 | Implements the end phase function. |


### testSuites/sample_team/tests/smoke_convert.js

Layer: test suite  
Lines: 58  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { sleep } from 'k6';`
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { trackCorrelation, trackParameter, trackDataRow } from '../../../dist/utils/replayLogger.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 17 | Implements the action phase function. It orchestrates process execution, emits operator-facing output. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 50 | Implements the end phase function. |


### testSuites/sample_team/tests/smoke_journey.js

Layer: test suite  
Lines: 72  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 66 | Implements the end phase function. |


### testSuites/sample_team/tests/smoke_login.js

Layer: test suite  
Lines: 43  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 37 | Implements the end phase function. |


### testSuites/sample_team/tests/smoke_postman_auth_only.js

Layer: test suite  
Lines: 54  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 48 | Implements the end phase function. |


### testSuites/sample_team/tests/smoke_postman.js

Layer: test suite  
Lines: 86  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 80 | Implements the end phase function. |


### testSuites/sample_team/tests/smoke_stdin.js

Layer: test suite  
Lines: 44  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 38 | Implements the end phase function. |


### testSuites/sample_team/tests/test_postman.js

Layer: test suite  
Lines: 156  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 150 | Implements the end phase function. |


### testSuites/testpro/tests/Auth_Login.js

Layer: test suite  
Lines: 62  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 56 | Implements the end phase function. |


### testSuites/testpro/tests/buy.js

Layer: test suite  
Lines: 855  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. It orchestrates process execution. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 241 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 739 | Implements the end phase function. It orchestrates process execution. |


### testSuites/testpro/tests/checkhar.js

Layer: test suite  
Lines: 855  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. It orchestrates process execution. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 241 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 739 | Implements the end phase function. It orchestrates process execution. |


### testSuites/testpro/tests/checkout_check.js

Layer: test suite  
Lines: 99  
Purpose: Framework file.

Imports:
- `import http from 'k6/http';`
- `import { check, sleep, group } from 'k6';`
- `import { initTransactions, startTransaction, endTransaction } from '../../../dist/utils/transaction.js';`
- `import { logExchange } from '../../../core_engine/src/utils/replayLogger.js';`


### testSuites/testpro/tests/converted-checkout.js

Layer: test suite  
Lines: 120  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import http from 'k6/http';`
- `import { check, sleep, group } from 'k6';`
- `import { initTransactions, startTransaction, endTransaction } from '../../../dist/utils/transaction.js';`
- `import { logExchange } from '../../../core_engine/src/utils/replayLogger.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle } from '../../../core_engine/src/utils/lifecycle.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `__journeyLifecycleStore` | Inferred | 10 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 12 | Implements the init phase function. It orchestrates process execution, emits operator-facing output. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 19 | Implements the action phase function. It orchestrates process execution, enforces validation rules, emits operator-facing output. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 109 | Implements the end phase function. It orchestrates process execution, emits operator-facing output. |


### testSuites/testpro/tests/converter_check.js

Layer: test suite  
Lines: 155  
Purpose: Framework file.

Imports:
- `import http from 'k6/http';`
- `import { check, sleep, group } from 'k6';`
- `import { initTransactions, startTransaction, endTransaction } from '../../../core_engine/src/utils/transaction.js';`
- `import { logExchange } from '../../../core_engine/src/utils/replayLogger.js';`


### testSuites/testpro/tests/New_Folder_Login_Copy.js

Layer: test suite  
Lines: 62  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 16 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 56 | Implements the end phase function. |


### testSuites/testpro/tests/tes.js

Layer: test suite  
Lines: 855  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. It orchestrates process execution. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 241 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 739 | Implements the end phase function. It orchestrates process execution. |


### testSuites/testpro/tests/testcheckhar.js

Layer: test suite  
Lines: 855  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. It orchestrates process execution. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 241 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 739 | Implements the end phase function. It orchestrates process execution. |


### testSuites/testpro/tests/testhar_!.js

Layer: test suite  
Lines: 855  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. It orchestrates process execution. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 241 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 739 | Implements the end phase function. It orchestrates process execution. |


### testSuites/testpro/tests/testharcheck_1.js

Layer: test suite  
Lines: 855  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. It orchestrates process execution. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 241 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 739 | Implements the end phase function. It orchestrates process execution. |


### testSuites/testpro/tests/testt.js

Layer: test suite  
Lines: 855  
Purpose: initPhase, actionPhase, endPhase helpers or command handlers.

Imports:
- `import { transaction, k6Check } from '../../../dist/utils/transaction.js';`
- `import { request } from '../../../dist/utils/request.js';`
- `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';`
- `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';`
- `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';`

Exports: `initPhase`, `actionPhase`, `endPhase`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `env` | Inferred | 7 | Module-level constant or configuration value. |
| `__journeyLifecycleStore` | Inferred | 9 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `initPhase` | `export function initPhase(ctx)` | ctx | Inferred | 11 | Implements the init phase function. It orchestrates process execution. |
| `actionPhase` | `export function actionPhase(ctx)` | ctx | Inferred | 241 | Implements the action phase function. It orchestrates process execution. |
| `endPhase` | `export function endPhase(ctx)` | ctx | Inferred | 739 | Implements the end phase function. It orchestrates process execution. |


### testSuites/webui_team/tests/homepage-journey.js

Layer: test suite  
Lines: 69  
Purpose: Framework file.

Imports:
- `import http from 'k6/http';`
- `import { check, sleep, group } from 'k6';`
- `import { initTransactions, startTransaction, endTransaction } from '../../../dist/utils/transaction.js';`


### testSuites/webui_team/tests/login-journey.js

Layer: test suite  
Lines: 84  
Purpose: Framework file.

Imports:
- `import http from 'k6/http';`
- `import { check, sleep, group } from 'k6';`
- `import { initTransactions, startTransaction, endTransaction } from '../../../dist/utils/transaction.js';`


### tools/docs-index.js

Layer: repository  
Lines: 64  
Purpose: run, loadJson, splice, spliceAtlas helpers or command handlers.

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `fs` | Inferred | 3 | Module-level constant or configuration value. |
| `path` | Inferred | 4 | Module-level constant or configuration value. |
| `{ ROOT }` | Inferred | 5 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `run` | `function run()` | None | Inferred | 7 | Implements the run  function. It emits operator-facing output. |
| `loadJson` | `function loadJson(rel)` | rel | Inferred | 17 | Implements the load json function. It performs file-system work, parses structured configuration or artifact data. |
| `splice` | `function splice(text, key, body)` | text, key, body | Inferred | 21 | Implements the splice function. |
| `spliceAtlas` | `function spliceAtlas()` | None | Inferred | 26 | Implements the splice atlas function. It performs file-system work. |


### tools/gen-cli-reference.js

Layer: repository  
Lines: 115  
Purpose: findSubParents, parseOptions, generate helpers or command handlers.

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `fs` | Inferred | 3 | Module-level constant or configuration value. |
| `path` | Inferred | 4 | Module-level constant or configuration value. |
| `{ ROOT, read }` | Inferred | 5 | Module-level constant or configuration value. |
| `SRC` | Inferred | 7 | Module-level constant or configuration value. |
| `OUT` | Inferred | 8 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `findSubParents` | `function findSubParents(src)` | src | Inferred | 11 | Implements the find sub parents function. It orchestrates process execution. |
| `parseOptions` | `function parseOptions(block)` | block | Inferred | 19 | Implements the parse options function. It orchestrates process execution. |
| `generate` | `function generate()` | None | Inferred | 34 | Implements the generate function. It performs file-system work, orchestrates process execution. |


### tools/gen-config-index.js

Layer: repository  
Lines: 82  
Purpose: loadJson, flattenSchema, generate helpers or command handlers.

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `fs` | Inferred | 3 | Module-level constant or configuration value. |
| `path` | Inferred | 4 | Module-level constant or configuration value. |
| `{ ROOT, walk, rel, read, writeJson }` | Inferred | 5 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `loadJson` | `function loadJson(full)` | full | Inferred | 7 | Implements the load json function. It parses structured configuration or artifact data. |
| `flattenSchema` | `function flattenSchema(schema, source, prefix = "", required = new Set(), out = [])` | schema, source, prefix = "", required = new Set(), out = [] | Inferred | 12 | Implements the flatten schema function. It enforces validation rules. |
| `generate` | `function generate()` | None | Inferred | 32 | Implements the generate function. It performs file-system work, orchestrates process execution, enforces validation rules. |


### tools/gen-feature-index.js

Layer: repository  
Lines: 70  
Purpose: loadJson, generate helpers or command handlers.

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `fs` | Inferred | 3 | Module-level constant or configuration value. |
| `path` | Inferred | 4 | Module-level constant or configuration value. |
| `{ ROOT, writeJson }` | Inferred | 5 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `loadJson` | `function loadJson(rel)` | rel | Inferred | 7 | Implements the load json function. It performs file-system work, parses structured configuration or artifact data. |
| `generate` | `function generate()` | None | Inferred | 12 | Implements the generate function. It performs file-system work, emits operator-facing output. |


### tools/gen-indexes.js

Layer: repository  
Lines: 78  
Purpose: generate, layerOf, dedupeEdges helpers or command handlers.

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `path` | Inferred | 3 | Module-level constant or configuration value. |
| `{ tsFiles, analyzeFile, writeJson, rel }` | Inferred | 4 | Module-level constant or configuration value. |
| `NODE_BUILTINS` | Inferred | 7 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `generate` | `function generate()` | None | Inferred | 9 | Implements the generate function. |
| `layerOf` | `function layerOf(p)` | p | Inferred | 61 | Implements the layer of function. |
| `dedupeEdges` | `function dedupeEdges(edges)` | edges | Inferred | 66 | Implements the dedupe edges function. |


### tools/gen-presentation.js

Layer: repository  
Lines: 131  
Purpose: loadJson, layerOfPath, generate helpers or command handlers.

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `fs` | Inferred | 4 | Module-level constant or configuration value. |
| `path` | Inferred | 5 | Module-level constant or configuration value. |
| `{ ROOT }` | Inferred | 6 | Module-level constant or configuration value. |
| `OUT` | Inferred | 8 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `loadJson` | `function loadJson(rel)` | rel | Inferred | 10 | Implements the load json function. It performs file-system work, parses structured configuration or artifact data. |
| `layerOfPath` | `function layerOfPath(p)` | p | Inferred | 14 | Implements the layer of path function. |
| `generate` | `function generate()` | None | Inferred | 19 | Implements the generate function. It performs file-system work, orchestrates process execution. |


### tools/gen-search-index.js

Layer: repository  
Lines: 38  
Purpose: frontMatter, generate helpers or command handlers.

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `fs` | Inferred | 2 | Module-level constant or configuration value. |
| `path` | Inferred | 3 | Module-level constant or configuration value. |
| `{ ROOT, walk, rel, read, writeJson }` | Inferred | 4 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `frontMatter` | `function frontMatter(text)` | text | Inferred | 6 | Implements the front matter function. |
| `generate` | `function generate()` | None | Inferred | 16 | Implements the generate function. It performs file-system work. |


### tools/generate-technical-reference.js

Layer: repository  
Lines: 628  
Purpose: walk, rel, read, countLines helpers or command handlers.

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `fs` | Inferred | 1 | Module-level constant or configuration value. |
| `path` | Inferred | 2 | Module-level constant or configuration value. |
| `os` | Inferred | 3 | Module-level constant or configuration value. |
| `crypto` | Inferred | 4 | Module-level constant or configuration value. |
| `childProcess` | Inferred | 5 | Module-level constant or configuration value. |
| `ts` | Inferred | 6 | Module-level constant or configuration value. |
| `ROOT` | Inferred | 8 | Module-level constant or configuration value. |
| `OUT_DIR` | Inferred | 9 | Module-level constant or configuration value. |
| `MD_OUT` | Inferred | 10 | Module-level constant or configuration value. |
| `EXCLUDED_DIRS` | Inferred | 12 | Module-level constant or configuration value. |
| `SOURCE_EXTENSIONS` | Inferred | 25 | Module-level constant or configuration value. |
| `TEXT_EXTENSIONS` | Inferred | 26 | Module-level constant or configuration value. |
| `model` | Inferred | 622 | Module-level constant or configuration value. |
| `markdown` | Inferred | 623 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `walk` | `function walk(dir, files = [])` | dir, files = [] | Inferred | 28 | Implements the walk function. It performs file-system work. |
| `rel` | `function rel(file)` | file | Inferred | 42 | Implements the rel function. |
| `read` | `function read(file)` | file | Inferred | 46 | Implements the read function. It performs file-system work. |
| `countLines` | `function countLines(text)` | text | Inferred | 50 | Implements the count lines function. |
| `firstHeading` | `function firstHeading(text)` | text | Inferred | 54 | Implements the first heading function. |
| `cleanText` | `function cleanText(value)` | value | Inferred | 59 | Implements the clean text function. |
| `extractJSDoc` | `function extractJSDoc(source, node)` | source, node | Inferred | 67 | Implements the extract jsdoc function. |
| `lineOf` | `function lineOf(sourceFile, node)` | sourceFile, node | Inferred | 80 | Implements the line of function. |
| `signatureOf` | `function signatureOf(source, node)` | source, node | Inferred | 84 | Implements the signature of function. |
| `inferDescription` | `function inferDescription(name, kind, sourceText)` | name, kind, sourceText | Inferred | 90 | Implements the infer description function. It performs file-system work, orchestrates process execution, parses structured configuration or artifact data, enforces validation rules. |
| `paramsOf` | `function paramsOf(node)` | node | Inferred | 113 | Implements the params of function. |
| `returnTypeOf` | `function returnTypeOf(node)` | node | Inferred | 120 | Implements the return type of function. |
| `isExported` | `function isExported(node)` | node | Inferred | 124 | Implements the is exported function. |
| `analyzeSource` | `function analyzeSource(file)` | file | Inferred | 131 | Implements the analyze source function. |
| `summarizeJson` | `function summarizeJson(file)` | file | Inferred | 254 | Implements the summarize json function. It parses structured configuration or artifact data. |
| `summarizeCsv` | `function summarizeCsv(file)` | file | Inferred | 271 | Implements the summarize csv function. |
| `summarizeMarkdown` | `function summarizeMarkdown(file)` | file | Inferred | 280 | Implements the summarize markdown function. |
| `layerFor` | `function layerFor(filePath)` | filePath | Inferred | 292 | Implements the layer for function. |
| `filePurpose` | `function filePurpose(filePath, analysis)` | filePath, analysis | Inferred | 303 | Implements the file purpose function. It orchestrates process execution, enforces validation rules. |
| `buildModel` | `function buildModel()` | None | Inferred | 320 | Implements the build model function. It parses structured configuration or artifact data. |
| `mdEscape` | `function mdEscape(value)` | value | Inferred | 349 | Implements the md escape function. |
| `buildMarkdown` | `function buildMarkdown(model)` | model | Inferred | 353 | Implements the build markdown function. It orchestrates process execution, enforces validation rules. |
| `xmlEscape` | `function xmlEscape(value)` | value | Inferred | 500 | Implements the xml escape function. |
| `paragraph` | `function paragraph(text, style)` | text, style | Inferred | 508 | Implements the paragraph function. |
| `table` | `function table(rows)` | rows | Inferred | 514 | Implements the table function. |
| `markdownToDocXml` | `function markdownToDocXml(markdown)` | markdown | Inferred | 521 | Implements the markdown to doc xml function. It enforces validation rules. |
| `writeDocx` | `function writeDocx(markdown)` | markdown | Inferred | 570 | Implements the write docx function. It performs file-system work, orchestrates process execution, enforces validation rules. |


### tools/lib/ast.js

Layer: repository  
Lines: 188  
Purpose: norm, rel, read, walk helpers or command handlers.

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `fs` | Inferred | 5 | Module-level constant or configuration value. |
| `path` | Inferred | 6 | Module-level constant or configuration value. |
| `ts` | Inferred | 7 | Module-level constant or configuration value. |
| `ROOT` | Inferred | 9 | Module-level constant or configuration value. |
| `SRC_ROOT` | Inferred | 10 | Module-level constant or configuration value. |
| `EXCLUDED_DIRS` | Inferred | 13 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `norm` | `function norm(p)` | p | Inferred | 18 | Implements the norm function. |
| `rel` | `function rel(file)` | file | Inferred | 22 | Implements the rel function. |
| `read` | `function read(file)` | file | Inferred | 26 | Implements the read function. It performs file-system work. |
| `walk` | `function walk(dir, filter, files = [])` | dir, filter, files = [] | Inferred | 30 | Implements the walk function. It performs file-system work. |
| `tsFiles` | `function tsFiles(dir = SRC_ROOT)` | dir = SRC_ROOT | Inferred | 40 | Implements the ts files function. |
| `lineOf` | `function lineOf(sf, node)` | sf, node | Inferred | 44 | Implements the line of function. |
| `jsdocOf` | `function jsdocOf(source, node)` | source, node | Inferred | 48 | Implements the jsdoc of function. |
| `isExported` | `function isExported(node)` | node | Inferred | 61 | Implements the is exported function. |
| `resolveImport` | `function resolveImport(fromFile, spec)` | fromFile, spec | Inferred | 71 | Implements the resolve import function. It performs file-system work, orchestrates process execution. |
| `analyzeFile` | `function analyzeFile(file)` | file | Inferred | 86 | Implements the analyze file function. |
| `stableStringify` | `function stableStringify(value)` | value | Inferred | 163 | Implements the stable stringify function. |
| `writeJson` | `function writeJson(relPath, value)` | relPath, value | Inferred | 176 | Implements the write json function. It performs file-system work. |


### tools/merge-validation.test.ts

Layer: repository  
Lines: 164  
Purpose: assert, within, genTxn, buildHistogram helpers or command handlers.

Imports:
- `import { percentileR7, RelativeHistogram } from '../core_engine/src/reporting/Histogram';`
- `import { HistogramArtifact } from '../core_engine/src/reporting/HistogramArtifactBuilder';`
- `import { MergeEngine, MachineArtifacts } from '../core_engine/src/distributed/MergeEngine';`
- `import { TransactionMetricsFile, CiSummary } from '../core_engine/src/types/ReportingContracts';`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `TxnData` | TypeAlias | 33 | Defines the TxnData contract used by the framework. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `ALPHA` | Inferred | 20 | Module-level constant or configuration value. |
| `STATS` | Inferred | 21 | Module-level constant or configuration value. |
| `failures` | Inferred | 22 | Module-level constant or configuration value. |
| `txnNames` | Inferred | 46 | Module-level constant or configuration value. |
| `NMACHINES` | Inferred | 47 | Module-level constant or configuration value. |
| `PER` | Inferred | 48 | Module-level constant or configuration value. |
| `fullByTxn` | Record<string, TxnData> | 51 | Module-level constant or configuration value. |
| `machineData` | Array<Record<string, TxnData>> | 52 | Module-level constant or configuration value. |
| `ciTemplate` | CiSummary | 93 | Module-level constant or configuration value. |
| `machines` | MachineArtifacts[] | 99 | Module-level constant or configuration value. |
| `result` | Inferred | 107 | Module-level constant or configuration value. |
| `rawMachines` | MachineArtifacts[] | 135 | Module-level constant or configuration value. |
| `rawResult` | Inferred | 141 | Module-level constant or configuration value. |
| `totalFail` | Inferred | 156 | Module-level constant or configuration value. |
| `totalTxn` | Inferred | 157 | Module-level constant or configuration value. |
| `expectedRate` | Inferred | 158 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `assert` | `function assert(ok: boolean, msg: string): void` | ok: boolean, msg: string | void | 23 | Implements the assert function. It emits operator-facing output. |
| `within` | `function within(got: number, want: number, relTol: number): boolean` | got: number, want: number, relTol: number | boolean | 27 | Implements the within function. |
| `genTxn` | `function genTxn(seed: number, n: number, failEvery: number): TxnData` | seed: number, n: number, failEvery: number | TxnData | 34 | Implements the gen txn function. |
| `buildHistogram` | `function buildHistogram(md: Record<string, TxnData>): HistogramArtifact` | md: Record<string, TxnData> | HistogramArtifact | 65 | Implements the build histogram function. It enforces validation rules. |
| `buildTxnMetrics` | `function buildTxnMetrics(md: Record<string, TxnData>): TransactionMetricsFile` | md: Record<string, TxnData> | TransactionMetricsFile | 79 | Implements the build txn metrics function. |


### tools/validate-histogram.test.ts

Layer: repository  
Lines: 110  
Purpose: mostRecentRunDir, statFraction helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { RelativeHistogram } from '../core_engine/src/reporting/Histogram';`
- `import { HistogramArtifactBuilder } from '../core_engine/src/reporting/HistogramArtifactBuilder';`
- `import { TransactionMetricsFile } from '../core_engine/src/types/ReportingContracts';`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `mostRecentRunDir` | `function mostRecentRunDir(): string \| null` | None | string \| null | 21 | Implements the most recent run dir function. It performs file-system work. |
| `statFraction` | `function statFraction(stat: string): number \| null` | stat: string | number \| null | 43 | Implements the stat fraction function. |


## Non-Source Configuration, Template, Data, And Documentation Files

### ai_context/ai-workflow.md

Layer: AI context  
Lines: 81  
Purpose: AI Workflow - > How to work effectively with this repository as an AI agent.

### ai_context/architecture-evolution.md

Layer: AI context  
Lines: 56  
Purpose: Architecture Evolution - > How the framework evolved over time. Use this to understand architectural trajectory.

### ai_context/architecture-laws.md

Layer: AI context  
Lines: 86  
Purpose: Architecture Laws - > **Inviolable rules.** Any AI agent or contributor MUST obey these. Violations risk breaking the framework's core guarantees.

### ai_context/change-impact-map.md

Layer: AI context  
Lines: 58  
Purpose: Change Impact Map - > When you change X, you must also check Y.

### ai_context/decisions.md

Layer: AI context  
Lines: 83  
Purpose: Architectural Decisions - > Distilled decision records. Each captures what was decided, why, and what constraints it creates.

### ai_context/dependency-hotspots.md

Layer: AI context  
Lines: 49  
Purpose: Dependency Hotspots - > Modules with highest coupling — changes here have the widest blast radius.

### ai_context/dependency-rules.md

Layer: AI context  
Lines: 64  
Purpose: Dependency Rules - > Import direction and coupling constraints.

### ai_context/execution-flow.md

Layer: AI context  
Lines: 140  
Purpose: Execution Flow - > How code runs, from CLI invocation to k6 process and artifacts.

### ai_context/extension-points.md

Layer: AI context  
Lines: 98  
Purpose: Extension Points - > Where new features can plug into the framework without breaking existing code.

### ai_context/features.seed.json

Layer: AI context  
Lines: 227  
Purpose: Framework file. Top-level keys: $schema-note, features.
  
Top-level keys: `$schema-note`, `features`

### ai_context/fragile-areas.md

Layer: AI context  
Lines: 81  
Purpose: Fragile Areas - > Code areas where bugs have historically occurred or where coupling makes changes risky.

### ai_context/framework-philosophy.md

Layer: AI context  
Lines: 64  
Purpose: Framework Philosophy - > Design principles that explain WHY the architecture is shaped the way it is.

### ai_context/integration-checklist.md

Layer: AI context  
Lines: 61  
Purpose: Integration Checklist - > Steps to follow when adding any new feature to the framework.

### ai_context/integration-contracts.md

Layer: AI context  
Lines: 91  
Purpose: Integration Contracts - > Cross-layer API contracts that must be maintained.

### ai_context/knowledge-architecture-proposal.md

Layer: AI context  
Lines: 309  
Purpose: Knowledge Architecture Proposal — K6-PerfFramework - > **Status:** DESIGN ONLY — approved 2026-07-09; Phase 1 not yet started. This document creates/moves/deletes nothing itself.

### ai_context/known-tech-debt.md

Layer: AI context  
Lines: 96  
Purpose: Known Technical Debt - > Acknowledged shortcuts, gaps, and areas that need future work.

### ai_context/module-map.md

Layer: AI context  
Lines: 166  
Purpose: Module Map - > File-level routing table. Find the right file to edit without scanning the whole repo.

### ai_context/orchestration-map.md

Layer: AI context  
Lines: 96  
Purpose: Orchestration Map - > How CLI commands wire through the engine layers to k6 execution.

### ai_context/overview.md

Layer: AI context  
Lines: 84  
Purpose: K6-PerfFramework — AI Context Overview - > **Purpose:** Entry point for AI agents. Read this first, then load only the subsystem files relevant to your task.

### ai_context/prompt-templates.md

Layer: AI context  
Lines: 84  
Purpose: Prompt Templates - > Reusable prompt patterns for common tasks.

### ai_context/rejected-approaches.md

Layer: AI context  
Lines: 64  
Purpose: Rejected Approaches - > Approaches that were tried or considered and abandoned. Do NOT re-attempt these without new justification.

### ai_context/replay-debug-contracts.md

Layer: AI context  
Lines: 102  
Purpose: Replay & Debug Contracts - > How the debug replay system works, its contracts, and its failure modes.

### ai_context/reporting-contracts.md

Layer: AI context  
Lines: 141  
Purpose: Reporting Contracts - > Artifact schemas, report pipeline, and CI/CD integration contracts.

### ai_context/risk-zones.md

Layer: AI context  
Lines: 75  
Purpose: Risk Zones - > Areas with hidden complexity, undocumented assumptions, or elevated failure risk.

### ai_context/runtime-contracts.md

Layer: AI context  
Lines: 91  
Purpose: Runtime Contracts - > Contracts governing k6-side runtime behavior (code that runs inside k6's goja engine).

### ai_context/subsystem-boundaries.md

Layer: AI context  
Lines: 66  
Purpose: Subsystem Boundaries - > Layer ownership rules — which module owns which responsibility.

### ai_context/todos.md

Layer: AI context  
Lines: 107  
Purpose: Framework To-Do List - > A shared task list for AI agents to maintain continuity across sessions.

### ai_context/token-optimization-guide.md

Layer: AI context  
Lines: 66  
Purpose: Token Optimization Guide - > Strategies for minimizing AI context token usage.

### ai_generated/call_graph.json

Layer: repository  
Lines: 550  
Purpose: Framework file. Top-level keys: edges, note.
  
Top-level keys: `edges`, `note`

### ai_generated/config_index.json

Layer: repository  
Lines: 716  
Purpose: Framework file. Contains a JSON array value.

### ai_generated/dependency_graph.json

Layer: repository  
Lines: 1087  
Purpose: Framework file. Top-level keys: edges, nodes.
  
Top-level keys: `edges`, `nodes`

### ai_generated/environment_index.json

Layer: repository  
Lines: 193  
Purpose: Framework file. Contains a JSON array value.

### ai_generated/feature_index.json

Layer: repository  
Lines: 985  
Purpose: Framework file. Contains a JSON array value.

### ai_generated/file_index.json

Layer: repository  
Lines: 2060  
Purpose: Framework file. Contains a JSON array value.

### ai_generated/framework_map.json

Layer: repository  
Lines: 118  
Purpose: Framework file. Top-level keys: layers.
  
Top-level keys: `layers`

### ai_generated/ownership.json

Layer: repository  
Lines: 172  
Purpose: Framework file. Top-level keys: auto-correlation, cli, config, data, debug-replay, execution, legacy-correlation, lifecycle, recording, reporters, reporting, scenario, vu-runtime.
  
Top-level keys: `auto-correlation`, `cli`, `config`, `data`, `debug-replay`, `execution`, `legacy-correlation`, `lifecycle`, `recording`, `reporters`, `reporting`, `scenario`, `vu-runtime`

### ai_generated/README.md

Layer: repository  
Lines: 21  
Purpose: ai_generated/ — Layer 4 (GENERATED — DO NOT EDIT) - Every file here is regenerated deterministically from the repo by committed `tools/` scripts.

### ai_generated/search_index.json

Layer: repository  
Lines: 951  
Purpose: Framework file. Contains a JSON array value.

### ai_generated/symbol_index.json

Layer: repository  
Lines: 5987  
Purpose: Framework file. Top-level keys: core_engine/src/assertions/JourneyAssertionResolver.ts#JourneyAssertionResolver, core_engine/src/assertions/SLARegistry.ts#SLARegistry, core_engine/src/assertions/ThresholdManager.ts#PERCENTILE_KEY_RE, core_engine/src/assertions/ThresholdManager.ts#ThresholdManager, core_engine/src/cli/LifecyclePrompt.ts#cq, core_engine/src/cli/LifecyclePrompt.ts#parseSelections, core_engine/src/cli/LifecyclePrompt.ts#promptForLifecycleSelection, core_engine/src/cli/config-inspect.ts#inspectConfig, core_engine/src/cli/convert.ts#runConvert, core_engine/src/cli/correlate.ts#CorrelateOptions, core_engine/src/cli/correlate.ts#defaultManifestPath, core_engine/src/cli/correlate.ts#loadRecordingLog, core_engine/src/cli/correlate.ts#printCandidateTable, core_engine/src/cli/correlate.ts#resolveApplyLevels, core_engine/src/cli/correlate.ts#resolveExchanges, core_engine/src/cli/correlate.ts#runCorrelate, core_engine/src/cli/correlate.ts#toRecordingExchanges, core_engine/src/cli/correlate.ts#truncate, core_engine/src/cli/docs.ts#generateDocs, core_engine/src/cli/features.ts#listFeatures, core_engine/src/cli/generate-byos.ts#runGenerateByos, core_engine/src/cli/generate.ts#cq, core_engine/src/cli/generate.ts#promptForDomains, core_engine/src/cli/generate.ts#promptForStaticAssetPreference, core_engine/src/cli/generate.ts#runGenerate, core_engine/src/cli/import.ts#ConflictPolicy, core_engine/src/cli/import.ts#EmitScriptExtras, core_engine/src/cli/import.ts#ImportCurlOptions, core_engine/src/cli/import.ts#ImportPostmanOptions, core_engine/src/cli/import.ts#buildSplitName, core_engine/src/cli/import.ts#emitScript, core_engine/src/cli/import.ts#emitScriptsPerRequest, core_engine/src/cli/import.ts#printCopiedFiles, core_engine/src/cli/import.ts#printNextSteps, core_engine/src/cli/import.ts#printWarnings, core_engine/src/cli/import.ts#readClipboard, core_engine/src/cli/import.ts#readFromFile, core_engine/src/cli/import.ts#readStdin, core_engine/src/cli/import.ts#runImportCurl, core_engine/src/cli/import.ts#runImportPostman, core_engine/src/cli/import.ts#sanitizeFileStem, core_engine/src/cli/import.ts#writeScriptFile, core_engine/src/cli/init.ts#runInit, core_engine/src/cli/init.ts#writeIfNotExists, core_engine/src/cli/interactive.ts#MENU_GROUPS, core_engine/src/cli/interactive.ts#MenuChoice, core_engine/src/cli/interactive.ts#MenuItem, core_engine/src/cli/interactive.ts#OptionChoice, core_engine/src/cli/interactive.ts#askInput, core_engine/src/cli/interactive.ts#askScriptName, core_engine/src/cli/interactive.ts#cleanPath, core_engine/src/cli/interactive.ts#confirm, core_engine/src/cli/interactive.ts#cq, core_engine/src/cli/interactive.ts#createProjectInteractive, core_engine/src/cli/interactive.ts#dispatch, core_engine/src/cli/interactive.ts#ensureProjectScaffold, core_engine/src/cli/interactive.ts#findFiles, core_engine/src/cli/interactive.ts#folderTreeLabel, core_engine/src/cli/interactive.ts#isFrameworkWorkspace, core_engine/src/cli/interactive.ts#isInsideWorkspace, core_engine/src/cli/interactive.ts#listExistingProjects, core_engine/src/cli/interactive.ts#maybeKeepReferenceCopy, core_engine/src/cli/interactive.ts#pickFile, core_engine/src/cli/interactive.ts#pickFromOptions, core_engine/src/cli/interactive.ts#pickOrCreateProject, core_engine/src/cli/interactive.ts#pickPlan, core_engine/src/cli/interactive.ts#printBanner, core_engine/src/cli/interactive.ts#readUntilBlankLine, core_engine/src/cli/interactive.ts#resolveScriptTarget, core_engine/src/cli/interactive.ts#resolveUserPath, core_engine/src/cli/interactive.ts#runInteractivePanel, core_engine/src/cli/interactive.ts#showMenuAndPick, core_engine/src/cli/interactive.ts#spawnSelf, core_engine/src/cli/interactive.ts#teamFromPath, core_engine/src/cli/interactive.ts#wizardByos, core_engine/src/cli/interactive.ts#wizardConvert, core_engine/src/cli/interactive.ts#wizardDebug, core_engine/src/cli/interactive.ts#wizardGenerate, core_engine/src/cli/interactive.ts#wizardImportCurl, core_engine/src/cli/interactive.ts#wizardImportPostman, core_engine/src/cli/interactive.ts#wizardInit, core_engine/src/cli/interactive.ts#wizardRun, core_engine/src/cli/interactive.ts#wizardValidate, core_engine/src/cli/new.ts#runNewWizard, core_engine/src/cli/run.ts#ERROR_EVENT_PREFIX, core_engine/src/cli/run.ts#FRAMEWORK_OWNED_FLAGS, core_engine/src/cli/run.ts#LIVE_TXN_INTERVAL_MS, core_engine/src/cli/run.ts#LiveTxnStats, core_engine/src/cli/run.ts#SNAPSHOT_EVENT_PREFIX, core_engine/src/cli/run.ts#WARNING_EVENT_PREFIX, core_engine/src/cli/run.ts#bridgeEnvFile, core_engine/src/cli/run.ts#buildLiveTableLines, core_engine/src/cli/run.ts#buildReportAgents, core_engine/src/cli/run.ts#buildRunEnvironment, core_engine/src/cli/run.ts#buildRuntimeMetadataBlock, core_engine/src/cli/run.ts#buildScenarioRuntimeMetadata, core_engine/src/cli/run.ts#collectUniqueTransactionNames, core_engine/src/cli/run.ts#computeTopRequestsByP90, core_engine/src/cli/run.ts#configCmd, core_engine/src/cli/run.ts#extractJourneyTransactionNames, core_engine/src/cli/run.ts#extractK6PerfEvents, core_engine/src/cli/run.ts#extractPayloadWithPrefix, core_engine/src/cli/run.ts#extractSnapshotPayload, core_engine/src/cli/run.ts#extractTransactionNamesFromSource, core_engine/src/cli/run.ts#filterPassthroughArgs, core_engine/src/cli/run.ts#finalizeRunArtifacts, core_engine/src/cli/run.ts#formatCell, core_engine/src/cli/run.ts#getEntryScriptDirectory, core_engine/src/cli/run.ts#importCmd, core_engine/src/cli/run.ts#parseAndFlushSnapshots, core_engine/src/cli/run.ts#pct, core_engine/src/cli/run.ts#percentilesFromStats, core_engine/src/cli/run.ts#prepareRunArtifacts, core_engine/src/cli/run.ts#printTransactionTable, core_engine/src/cli/run.ts#program, core_engine/src/cli/run.ts#renderFixedTable, core_engine/src/cli/run.ts#renderScrollbackTable, core_engine/src/cli/run.ts#resolveRecordingLogForStandaloneDebug, core_engine/src/cli/run.ts#resolveSharedRunIdFromEnv, core_engine/src/cli/run.ts#runJourneyDebug, core_engine/src/cli/run.ts#runPlanDebugMode, core_engine/src/cli/run.ts#startLiveTransactionDisplay, core_engine/src/cli/run.ts#templatesCmd, core_engine/src/cli/run.ts#toImportSpecifier, core_engine/src/cli/run.ts#writeRunManifest, core_engine/src/cli/templates.ts#listTemplates, core_engine/src/cli/templates.ts#showTemplate, core_engine/src/cli/validate.ts#ValidateOptions, core_engine/src/cli/validate.ts#runValidate, core_engine/src/config/ConfigurationManager.ts#ConfigurationManager, core_engine/src/config/EnvResolver.ts#EnvResolver, core_engine/src/config/GatekeeperValidator.ts#GatekeeperResult, core_engine/src/config/GatekeeperValidator.ts#GatekeeperValidator, core_engine/src/config/RuntimeConfigManager.ts#RuntimeConfigManager, core_engine/src/config/SchemaValidator.ts#RUNTIME_SETTINGS_SCHEMA_INLINE, core_engine/src/config/SchemaValidator.ts#SchemaValidator, core_engine/src/config/SchemaValidator.ts#TEST_PLAN_SCHEMA_INLINE, core_engine/src/config/SchemaValidator.ts#ValidationResult, core_engine/src/config/SchemaValidator.ts#levenshtein, core_engine/src/config/SchemaValidator.ts#loadExternalSchema, core_engine/src/config/ScriptContractGuard.ts#ApiViolation, core_engine/src/config/ScriptContractGuard.ts#CallHit, core_engine/src/config/ScriptContractGuard.ts#ContractRule, core_engine/src/config/ScriptContractGuard.ts#FileViolations, core_engine/src/config/ScriptContractGuard.ts#ScriptContractGuard, core_engine/src/correlation/CandidateScorer.ts#BASE64ISH_RE, core_engine/src/correlation/CandidateScorer.ts#CandidateScorer, core_engine/src/correlation/CandidateScorer.ts#DEFAULT_CONFIG, core_engine/src/correlation/CandidateScorer.ts#HEX_RE, core_engine/src/correlation/CandidateScorer.ts#JWT_RE, core_engine/src/correlation/CandidateScorer.ts#ScoreOptions, core_engine/src/correlation/CandidateScorer.ts#ScoredCandidate, core_engine/src/correlation/CandidateScorer.ts#ScorerConfig, core_engine/src/correlation/CandidateScorer.ts#UUID_RE, core_engine/src/correlation/CandidateScorer.ts#deriveNameHint, core_engine/src/correlation/CandidateScorer.ts#shannonBits, core_engine/src/correlation/CorrelationEngine.ts#CorrelationEngine, core_engine/src/correlation/CorrelationManifest.ts#ConsumerLocation, core_engine/src/correlation/CorrelationManifest.ts#CorrelationCandidate, core_engine/src/correlation/CorrelationManifest.ts#CorrelationConfidence, core_engine/src/correlation/CorrelationManifest.ts#CorrelationConsumer, core_engine/src/correlation/CorrelationManifest.ts#CorrelationManifest, core_engine/src/correlation/CorrelationManifest.ts#CorrelationPlan, core_engine/src/correlation/CorrelationManifest.ts#CorrelationProducer, core_engine/src/correlation/CorrelationManifest.ts#ExtractorKind, core_engine/src/correlation/CorrelationManifest.ts#ProducerSource, core_engine/src/correlation/CorrelationManifest.ts#RecordingCookie, core_engine/src/correlation/CorrelationManifest.ts#RecordingExchange, core_engine/src/correlation/CorrelationManifest.ts#RecordingHeader, core_engine/src/correlation/CorrelationManifest.ts#RecordingRequest, core_engine/src/correlation/CorrelationManifest.ts#RecordingResponse, core_engine/src/correlation/CorrelationScanner.ts#CorrelationScanner, core_engine/src/correlation/CorrelationScanner.ts#DEFAULT_CONFIG_PATH, core_engine/src/correlation/CorrelationScanner.ts#ScanOptions, core_engine/src/correlation/ExtractorRegistry.ts#ExtractorFn, core_engine/src/correlation/ExtractorRegistry.ts#ExtractorRegistry, core_engine/src/correlation/ExtractorRegistry.ts#K6ResponseLike, core_engine/src/correlation/ExtractorSynthesizer.ts#ExtractorSynthesizer, core_engine/src/correlation/ExtractorSynthesizer.ts#buildRegexFallback, core_engine/src/correlation/ExtractorSynthesizer.ts#escapeRegex, core_engine/src/correlation/ExtractorSynthesizer.ts#locateWithBoundary, core_engine/src/correlation/ExtractorSynthesizer.ts#sanitizeIdentifier, core_engine/src/correlation/ExtractorSynthesizer.ts#semanticHtmlBoundary, core_engine/src/correlation/ExtractorSynthesizer.ts#synthesizeBoundary, core_engine/src/correlation/FallbackHandler.ts#FallbackHandler, core_engine/src/correlation/LinkMatcher.ts#LinkMatcher, core_engine/src/correlation/LinkMatcher.ts#RawCandidate, core_engine/src/correlation/LinkMatcher.ts#SOURCE_PRIORITY, core_engine/src/correlation/RuleProcessor.ts#CorrelationRule, core_engine/src/correlation/RuleProcessor.ts#RuleProcessor, core_engine/src/correlation/ScriptCorrelationWriter.ts#ApplyOptions, core_engine/src/correlation/ScriptCorrelationWriter.ts#ApplyResult, core_engine/src/correlation/ScriptCorrelationWriter.ts#EXTRACT_FN, core_engine/src/correlation/ScriptCorrelationWriter.ts#RequestCall, core_engine/src/correlation/ScriptCorrelationWriter.ts#ScriptCorrelationWriter, core_engine/src/correlation/ScriptCorrelationWriter.ts#buildExtractCall, core_engine/src/correlation/ScriptCorrelationWriter.ts#insertAfterImports, core_engine/src/correlation/ScriptCorrelationWriter.ts#leadingIndent, core_engine/src/correlation/ScriptCorrelationWriter.ts#matchParen, core_engine/src/correlation/ScriptCorrelationWriter.ts#rewriteStringLiterals, core_engine/src/correlation/ValueIndexer.ts#ConsumerOccurrence, core_engine/src/correlation/ValueIndexer.ts#IndexedValues, core_engine/src/correlation/ValueIndexer.ts#MAX_VALUE_LEN, core_engine/src/correlation/ValueIndexer.ts#MIN_VALUE_LEN, core_engine/src/correlation/ValueIndexer.ts#ProducerOccurrence, core_engine/src/correlation/ValueIndexer.ts#STATIC_REQUEST_HEADERS, core_engine/src/correlation/ValueIndexer.ts#ValueIndexer, core_engine/src/correlation/ValueIndexer.ts#decodeSafe, core_engine/src/correlation/ValueIndexer.ts#extractHtmlTokens, core_engine/src/correlation/ValueIndexer.ts#isIndexableValue, core_engine/src/correlation/ValueIndexer.ts#looksLikeHtml, core_engine/src/correlation/ValueIndexer.ts#parseCookieHeader, core_engine/src/correlation/ValueIndexer.ts#parseQuery, core_engine/src/correlation/ValueIndexer.ts#subTokens, core_engine/src/correlation/ValueIndexer.ts#tryParseForm, core_engine/src/correlation/ValueIndexer.ts#tryParseJson, core_engine/src/correlation/ValueIndexer.ts#walkJson, core_engine/src/data/DataFactory.ts#DataFactory, core_engine/src/data/DataFactory.ts#DataRow, core_engine/src/data/DataFactory.ts#LoadedDataset, core_engine/src/data/DataPoolManager.ts#DataPoolManager, core_engine/src/data/DataPoolManager.ts#PoolConfig, core_engine/src/data/DataValidator.ts#DataValidationResult, core_engine/src/data/DataValidator.ts#DataValidator, core_engine/src/data/DynamicValueFactory.ts#DynamicValueFactory, core_engine/src/debug/DiffChecker.ts#BodyDiffResult, core_engine/src/debug/DiffChecker.ts#DiffChecker, core_engine/src/debug/DiffChecker.ts#DiffResult, core_engine/src/debug/DiffChecker.ts#HeaderDiffEntry, core_engine/src/debug/DiffChecker.ts#ReplayComparisonContext, core_engine/src/debug/DiffChecker.ts#ReplayProjection, core_engine/src/debug/DiffChecker.ts#SideSnapshot, core_engine/src/debug/ExchangeLog.ts#ExchangeLogBuilder, core_engine/src/debug/ExchangeLog.ts#ExchangeLogCookie, core_engine/src/debug/ExchangeLog.ts#ExchangeLogHeader, core_engine/src/debug/ExchangeLog.ts#ExchangeLogParams, core_engine/src/debug/ExchangeLog.ts#ExchangeLogRequest, core_engine/src/debug/ExchangeLog.ts#ExchangeLogResponse, core_engine/src/debug/ExchangeLog.ts#TaggedExchangeLogEntry, core_engine/src/debug/ExchangeLog.ts#VariableEvent, core_engine/src/debug/HTMLDiffReporter.ts#HTMLDiffReporter, core_engine/src/debug/HTMLDiffReporter.ts#ReportOptions, core_engine/src/debug/HTMLDiffReporter.ts#ReportPayload, core_engine/src/debug/RecordingLogResolver.ts#RecordingIndexEntry, core_engine/src/debug/RecordingLogResolver.ts#RecordingLogResolution, core_engine/src/debug/RecordingLogResolver.ts#RecordingLogResolver, core_engine/src/debug/ReplayRunner.ts#DebugReplayOptions, core_engine/src/debug/ReplayRunner.ts#DebugReplayResult, core_engine/src/debug/ReplayRunner.ts#K6MetricRow, core_engine/src/debug/ReplayRunner.ts#K6Metrics, core_engine/src/debug/ReplayRunner.ts#ReplayRunner, core_engine/src/debug/ReplayRunner.ts#extractTransactionNames, core_engine/src/debug/VariableInstrumenter.ts#Classified, core_engine/src/debug/VariableInstrumenter.ts#INTERP_RE, core_engine/src/debug/VariableInstrumenter.ts#InstrumentResult, core_engine/src/debug/VariableInstrumenter.ts#classify, core_engine/src/debug/VariableInstrumenter.ts#instrumentVariableTracking, core_engine/src/debug/VariableInstrumenter.ts#sanitize, core_engine/src/distributed/LiveStatusHeartbeat.ts#HeartbeatOptions, core_engine/src/distributed/LiveStatusHeartbeat.ts#LiveState, core_engine/src/distributed/LiveStatusHeartbeat.ts#LiveStatusHeartbeat, core_engine/src/distributed/LiveStatusHeartbeat.ts#LiveStatusSnapshot, core_engine/src/distributed/LiveStatusHeartbeat.ts#tailNdjson, core_engine/src/distributed/MergeEngine.ts#MachineArtifacts, core_engine/src/distributed/MergeEngine.ts#MergeEngine, core_engine/src/distributed/MergeEngine.ts#MergeOptions, core_engine/src/distributed/MergeEngine.ts#MergeResult, core_engine/src/distributed/MergeEngine.ts#TxnAccumulator, core_engine/src/distributed/MergeEngine.ts#statToFraction, core_engine/src/distributed/MergedReportBuilder.ts#MachineTimeseries, core_engine/src/distributed/MergedReportBuilder.ts#MergedReportBuilder, core_engine/src/distributed/MergedReportBuilder.ts#MergedReportInput, core_engine/src/distributed/MergedReportBuilder.ts#percentilesFrom, core_engine/src/distributed/agentServer.ts#AgentServerOptions, core_engine/src/distributed/agentServer.ts#FRAMEWORK_VERSION, core_engine/src/distributed/agentServer.ts#TOKEN_HEADER, core_engine/src/distributed/agentServer.ts#buildInfo, core_engine/src/distributed/agentServer.ts#detectK6Version, core_engine/src/distributed/agentServer.ts#freeDiskBytes, core_engine/src/distributed/agentServer.ts#runAgent, core_engine/src/distributed/agentServer.ts#runAgentCli, core_engine/src/distributed/agentServer.ts#tokenMatches, core_engine/src/distributed/collectRun.ts#DEFAULT_EXCLUDE, core_engine/src/distributed/collectRun.ts#collectRunDir, core_engine/src/distributed/collectRun.ts#copyDirInto, core_engine/src/distributed/collectRun.ts#liveRunDir, core_engine/src/distributed/collectRun.ts#readRunId, core_engine/src/distributed/collectRun.ts#runBaseDir, core_engine/src/distributed/collectRun.ts#runCollect, core_engine/src/distributed/collectRun.ts#sharedRunDir, core_engine/src/distributed/control.ts#ControlAction, core_engine/src/distributed/control.ts#ControlFile, core_engine/src/distributed/control.ts#ControlWatcher, core_engine/src/distributed/control.ts#ControlWatcherOptions, core_engine/src/distributed/control.ts#controlDirFor, core_engine/src/distributed/control.ts#fetchK6Vus, core_engine/src/distributed/control.ts#k6ApiStop, core_engine/src/distributed/control.ts#killProcessTree, core_engine/src/distributed/control.ts#readControl, core_engine/src/distributed/control.ts#writeControl, core_engine/src/distributed/liveAggregate.ts#DEFAULT_STATS, core_engine/src/distributed/liveAggregate.ts#LiveAggregate, core_engine/src/distributed/liveAggregate.ts#MergedTxn, core_engine/src/distributed/liveAggregate.ts#RunContext, core_engine/src/distributed/liveAggregate.ts#aggregate, core_engine/src/distributed/liveAggregate.ts#controllerHost, core_engine/src/distributed/liveAggregate.ts#ctrlHost, core_engine/src/distributed/liveAggregate.ts#ctrlTimer, core_engine/src/distributed/liveAggregate.ts#findLatestFinalReport, core_engine/src/distributed/liveAggregate.ts#mergeTransactions, core_engine/src/distributed/liveAggregate.ts#readSnapshots, core_engine/src/distributed/liveAggregate.ts#resolveLiveDir, core_engine/src/distributed/liveAggregate.ts#resolveRunContext, core_engine/src/distributed/liveAggregate.ts#startControllerHostSampling, core_engine/src/distributed/liveAggregate.ts#statToFraction, core_engine/src/distributed/liveAggregate.ts#statValue, core_engine/src/distributed/liveAggregate.ts#timingStats, core_engine/src/distributed/liveDashboard.ts#DashboardOptions, core_engine/src/distributed/liveDashboard.ts#page, core_engine/src/distributed/liveDashboard.ts#runDashboardCli, core_engine/src/distributed/liveDashboard.ts#startDashboardServer, core_engine/src/distributed/monitor.ts#MonitorOptions, core_engine/src/distributed/monitor.ts#padL, core_engine/src/distributed/monitor.ts#padR, core_engine/src/distributed/monitor.ts#render, core_engine/src/distributed/monitor.ts#runMonitor, core_engine/src/distributed/probe.ts#ProbeResult, core_engine/src/distributed/probe.ts#ProbeTarget, core_engine/src/distributed/probe.ts#TOKEN_HEADER, core_engine/src/distributed/probe.ts#diagnose, core_engine/src/distributed/probe.ts#parseTarget, core_engine/src/distributed/probe.ts#probeOne, core_engine/src/distributed/probe.ts#probeTcp, core_engine/src/distributed/probe.ts#runProbe, core_engine/src/distributed/runMerge.ts#FINAL_PREFIX, core_engine/src/distributed/runMerge.ts#MERGED_DIR, core_engine/src/distributed/runMerge.ts#MergeCliOptions, core_engine/src/distributed/runMerge.ts#finalTimestamp, core_engine/src/distributed/runMerge.ts#machineLanded, core_engine/src/distributed/runMerge.ts#readJson, core_engine/src/distributed/runMerge.ts#readNdjson, core_engine/src/distributed/runMerge.ts#runMerge, core_engine/src/distributed/runMerge.ts#sleep, core_engine/src/distributed/runMerge.ts#validateManifests, core_engine/src/distributed/runMerge.ts#waitForMachines, core_engine/src/distributed/runMerge.ts#writeMergedCsv, core_engine/src/distributed/shareSetup.ts#ShareSuggestionOptions, core_engine/src/distributed/shareSetup.ts#printControllerShareSuggestion, core_engine/src/distributed/shareSetup.ts#resolveResultsBaseDir, core_engine/src/distributed/startBarrier.ts#awaitScheduledStart, core_engine/src/distributed/startBarrier.ts#fmtRemaining, core_engine/src/distributed/transactionCsv.ts#CsvTransactionAggregate, core_engine/src/distributed/transactionCsv.ts#RequestTiming, core_engine/src/distributed/transactionCsv.ts#TransactionCsvStats, core_engine/src/distributed/transactionCsv.ts#buildTransactionRowsFromCsv, core_engine/src/distributed/transactionCsv.ts#findRequestCsv, core_engine/src/distributed/transactionCsv.ts#findTransactionCsv, core_engine/src/distributed/transactionCsv.ts#flatten, core_engine/src/distributed/transactionCsv.ts#leafFor, core_engine/src/distributed/transactionCsv.ts#parseCsvLine, core_engine/src/distributed/transactionCsv.ts#readRequestFailByBucket, core_engine/src/distributed/transactionCsv.ts#readRequestFailure, core_engine/src/distributed/transactionCsv.ts#readRequestTimings, core_engine/src/distributed/transactionCsv.ts#readTransactionCsvRaw, core_engine/src/distributed/transactionCsv.ts#readTransactionCsvStats, core_engine/src/execution/FileWriteSink.ts#FILE_TAG, core_engine/src/execution/FileWriteSink.ts#FilePayload, core_engine/src/execution/FileWriteSink.ts#FileWriteSink, core_engine/src/execution/HostMonitor.ts#HostMonitor, core_engine/src/execution/HostMonitor.ts#HostSnapshot, core_engine/src/execution/JourneyAllocator.ts#JourneyAllocation, core_engine/src/execution/JourneyAllocator.ts#JourneyAllocator, core_engine/src/execution/ParallelExecutionManager.ts#K6Options, core_engine/src/execution/ParallelExecutionManager.ts#ParallelExecutionManager, core_engine/src/execution/PipelineRunner.ts#PipelineRunResult, core_engine/src/execution/PipelineRunner.ts#PipelineRunner, core_engine/src/execution/PipelineRunner.ts#RunOptions, core_engine/src/recording/CurlAdapter.ts#CurlAdapter, core_engine/src/recording/CurlAdapter.ts#CurlParseResult, core_engine/src/recording/CurlAdapter.ts#ParsedCurlBlock, core_engine/src/recording/DomainFilter.ts#DomainFilter, core_engine/src/recording/DomainFilter.ts#DomainStat, core_engine/src/recording/HARParser.ts#HARParser, core_engine/src/recording/PostmanAdapter.ts#FileBinding, core_engine/src/recording/PostmanAdapter.ts#PostmanAdapter, core_engine/src/recording/PostmanAdapter.ts#PostmanAuth, core_engine/src/recording/PostmanAdapter.ts#PostmanAuthParam, core_engine/src/recording/PostmanAdapter.ts#PostmanBody, core_engine/src/recording/PostmanAdapter.ts#PostmanCollectionFile, core_engine/src/recording/PostmanAdapter.ts#PostmanEvent, core_engine/src/recording/PostmanAdapter.ts#PostmanFolderInfo, core_engine/src/recording/PostmanAdapter.ts#PostmanHeader, core_engine/src/recording/PostmanAdapter.ts#PostmanItem, core_engine/src/recording/PostmanAdapter.ts#PostmanParseOptions, core_engine/src/recording/PostmanAdapter.ts#PostmanParseResult, core_engine/src/recording/PostmanAdapter.ts#PostmanRequest, core_engine/src/recording/PostmanAdapter.ts#PostmanUrl, core_engine/src/recording/PostmanAdapter.ts#mimeFromExt, core_engine/src/recording/PostmanAdapter.ts#normalizeFolderFilter, core_engine/src/recording/PostmanAdapter.ts#pathHasPrefix, core_engine/src/recording/PostmanAdapter.ts#safeJsonParse, core_engine/src/recording/PostmanAdapter.ts#sanitizeName, core_engine/src/recording/PostmanScriptTranslator.ts#LineResult, core_engine/src/recording/PostmanScriptTranslator.ts#RES, core_engine/src/recording/PostmanScriptTranslator.ts#TranslationResult, core_engine/src/recording/PostmanScriptTranslator.ts#countClosers, core_engine/src/recording/PostmanScriptTranslator.ts#countOpeners, core_engine/src/recording/PostmanScriptTranslator.ts#translateLine, core_engine/src/recording/PostmanScriptTranslator.ts#translatePostmanScript, core_engine/src/recording/ScriptConverter.ts#ScriptConverter, core_engine/src/recording/ScriptGenerator.ts#GenerateOptions, core_engine/src/recording/ScriptGenerator.ts#LifecycleSelection, core_engine/src/recording/ScriptGenerator.ts#SCRIPT_API_MODULE, core_engine/src/recording/ScriptGenerator.ts#ScriptGenerator, core_engine/src/recording/TransactionGrouper.ts#TransactionGroup, core_engine/src/recording/TransactionGrouper.ts#TransactionGrouper, core_engine/src/reporters/AzureReporter.ts#AzureReporter, core_engine/src/reporters/CustomUploader.ts#CustomUploader, core_engine/src/reporters/GrafanaReporter.ts#GrafanaReporter, core_engine/src/reporters/ResultTransformer.ts#ResultContract, core_engine/src/reporters/ResultTransformer.ts#ResultTransformer, core_engine/src/reporting/ArtifactWriter.ts#ArtifactWriter, core_engine/src/reporting/EventArtifactBuilder.ts#BuildEventArtifactsOptions, core_engine/src/reporting/EventArtifactBuilder.ts#EventArtifactBuilder, core_engine/src/reporting/EventArtifactBuilder.ts#SummaryCheck, core_engine/src/reporting/EventArtifactBuilder.ts#SummaryGroup, core_engine/src/reporting/EventArtifactBuilder.ts#SummaryMetric, core_engine/src/reporting/Histogram.ts#HistogramJSON, core_engine/src/reporting/Histogram.ts#RelativeHistogram, core_engine/src/reporting/Histogram.ts#percentileR7, core_engine/src/reporting/HistogramArtifactBuilder.ts#BuildHistogramOptions, core_engine/src/reporting/HistogramArtifactBuilder.ts#HistogramArtifact, core_engine/src/reporting/HistogramArtifactBuilder.ts#HistogramArtifactBuilder, core_engine/src/reporting/HistogramArtifactBuilder.ts#OVERVIEW_KEY, core_engine/src/reporting/LiveEventLogWriter.ts#ERROR_EVENT_PREFIX, core_engine/src/reporting/LiveEventLogWriter.ts#LiveEventLogWriter, core_engine/src/reporting/LiveEventLogWriter.ts#WARNING_EVENT_PREFIX, core_engine/src/reporting/RequestMetricLogWriter.ts#COLUMNS, core_engine/src/reporting/RequestMetricLogWriter.ts#POLL_INTERVAL_MS, core_engine/src/reporting/RequestMetricLogWriter.ts#PROMOTED_TAGS, core_engine/src/reporting/RequestMetricLogWriter.ts#PendingRow, core_engine/src/reporting/RequestMetricLogWriter.ts#RawPoint, core_engine/src/reporting/RequestMetricLogWriter.ts#RequestMetricLogContext, core_engine/src/reporting/RequestMetricLogWriter.ts#RequestMetricLogWriter, core_engine/src/reporting/RequestMetricLogWriter.ts#csvField, core_engine/src/reporting/RunReportGenerator.ts#RunReportGenerator, core_engine/src/reporting/RunSummaryBuilder.ts#BuildRunSummaryOptions, core_engine/src/reporting/RunSummaryBuilder.ts#RunSummaryBuilder, core_engine/src/reporting/TimeseriesArtifactBuilder.ts#BuildTimeseriesArtifactOptions, core_engine/src/reporting/TimeseriesArtifactBuilder.ts#SummaryMetric, core_engine/src/reporting/TimeseriesArtifactBuilder.ts#TimeseriesArtifactBuilder, core_engine/src/reporting/TimeseriesArtifactBuilder.ts#metricVal, core_engine/src/reporting/TimeseriesStreamParser.ts#OverviewBucket, core_engine/src/reporting/TimeseriesStreamParser.ts#OverviewRaw, core_engine/src/reporting/TimeseriesStreamParser.ts#ParseOptions, core_engine/src/reporting/TimeseriesStreamParser.ts#ParsedTimeseries, core_engine/src/reporting/TimeseriesStreamParser.ts#ParsedTransactionSeries, core_engine/src/reporting/TimeseriesStreamParser.ts#PhaseTimings, core_engine/src/reporting/TimeseriesStreamParser.ts#RawPoint, core_engine/src/reporting/TimeseriesStreamParser.ts#RequestBucket, core_engine/src/reporting/TimeseriesStreamParser.ts#RequestRaw, core_engine/src/reporting/TimeseriesStreamParser.ts#TimeseriesStreamParser, core_engine/src/reporting/TimeseriesStreamParser.ts#TransactionBucket, core_engine/src/reporting/TimeseriesStreamParser.ts#TransactionRaw, core_engine/src/reporting/TimeseriesStreamParser.ts#TrendStats, core_engine/src/reporting/TimeseriesStreamParser.ts#computeTrendStats, core_engine/src/reporting/TimeseriesStreamParser.ts#emptyPhase, core_engine/src/reporting/TimeseriesStreamParser.ts#finalizeOverview, core_engine/src/reporting/TimeseriesStreamParser.ts#finalizeRequest, core_engine/src/reporting/TimeseriesStreamParser.ts#finalizeTransaction, core_engine/src/reporting/TimeseriesStreamParser.ts#getOverview, core_engine/src/reporting/TimeseriesStreamParser.ts#normalizePercentiles, core_engine/src/reporting/TimeseriesStreamParser.ts#percentile, core_engine/src/reporting/TimeseriesStreamParser.ts#phaseStats, core_engine/src/reporting/TransactionMetricLogWriter.ts#CHECKRATE_SUFFIX, core_engine/src/reporting/TransactionMetricLogWriter.ts#COLUMNS, core_engine/src/reporting/TransactionMetricLogWriter.ts#POLL_INTERVAL_MS, core_engine/src/reporting/TransactionMetricLogWriter.ts#PendingRow, core_engine/src/reporting/TransactionMetricLogWriter.ts#RawPoint, core_engine/src/reporting/TransactionMetricLogWriter.ts#TransactionMetricLogContext, core_engine/src/reporting/TransactionMetricLogWriter.ts#TransactionMetricLogWriter, core_engine/src/reporting/TransactionMetricLogWriter.ts#csvField, core_engine/src/reporting/TransactionMetricsBuilder.ts#BuildTransactionMetricsOptions, core_engine/src/reporting/TransactionMetricsBuilder.ts#GroupAggregate, core_engine/src/reporting/TransactionMetricsBuilder.ts#SummaryCheck, core_engine/src/reporting/TransactionMetricsBuilder.ts#SummaryGroup, core_engine/src/reporting/TransactionMetricsBuilder.ts#SummaryMetric, core_engine/src/reporting/TransactionMetricsBuilder.ts#TransactionMetricsBuilder, core_engine/src/runtime/ErrorRuntime.ts#ErrorRuntime, core_engine/src/runtime/ErrorRuntime.ts#ErrorRuntimeContext, core_engine/src/runtime/LifecycleRuntime.ts#JourneyContext, core_engine/src/runtime/LifecycleRuntime.ts#JourneyPhase, core_engine/src/runtime/LifecycleRuntime.ts#LifecycleDecision, core_engine/src/runtime/LifecycleRuntime.ts#LifecyclePhaseFns, core_engine/src/runtime/LifecycleRuntime.ts#LifecycleRunState, core_engine/src/runtime/LifecycleRuntime.ts#LifecycleRuntime, core_engine/src/runtime/MetricsRuntime.ts#MetricsRuntime, core_engine/src/runtime/MetricsRuntime.ts#TransactionAggregate, core_engine/src/runtime/SnapshotRuntime.ts#SnapshotRuntime, core_engine/src/runtime/TimeseriesRuntime.ts#TimeseriesRuntime, core_engine/src/scenario/ExecutorFactory.ts#EXECUTOR_SPECS, core_engine/src/scenario/ExecutorFactory.ts#ExecutorFactory, core_engine/src/scenario/ExecutorFactory.ts#ExecutorSpec, core_engine/src/scenario/ScenarioBuilder.ts#K6ScenarioDefinition, core_engine/src/scenario/ScenarioBuilder.ts#K6ScenariosMap, core_engine/src/scenario/ScenarioBuilder.ts#ScenarioBuilder, core_engine/src/scenario/ScenarioBuilder.ts#ScenarioPhaseEnvelope, core_engine/src/scenario/ScenarioBuilder.ts#ScenarioRuntimeMetadata, core_engine/src/scenario/TestPlanLoader.ts#TestPlanLoader, core_engine/src/scenario/WorkloadModels.ts#K6ExecutorConfig, core_engine/src/scenario/WorkloadModels.ts#buildConstantArrivalRateProfile, core_engine/src/scenario/WorkloadModels.ts#buildExternallyControlledProfile, core_engine/src/scenario/WorkloadModels.ts#buildIterationProfile, core_engine/src/scenario/WorkloadModels.ts#buildLoadProfile, core_engine/src/scenario/WorkloadModels.ts#buildRampingArrivalRateProfile, core_engine/src/scenario/WorkloadModels.ts#buildSoakProfile, core_engine/src/scenario/WorkloadModels.ts#buildSpikeProfile, core_engine/src/scenario/WorkloadModels.ts#buildStressProfile, core_engine/src/scenario/WorkloadModels.ts#toK6ExecutorConfig, core_engine/src/types/ConfigContracts.ts#EnvironmentConfig, core_engine/src/types/ConfigContracts.ts#EnvironmentCustomValue, core_engine/src/types/ConfigContracts.ts#ErrorBehavior, core_engine/src/types/ConfigContracts.ts#ErrorCaptureConfig, core_engine/src/types/ConfigContracts.ts#FRAMEWORK_DEFAULTS, core_engine/src/types/ConfigContracts.ts#HttpConfig, core_engine/src/types/ConfigContracts.ts#MonitoringConfig, core_engine/src/types/ConfigContracts.ts#PacingConfig, core_engine/src/types/ConfigContracts.ts#PacingMode, core_engine/src/types/ConfigContracts.ts#ReportingConfig, core_engine/src/types/ConfigContracts.ts#ResolvedConfig, core_engine/src/types/ConfigContracts.ts#RuntimeSettings, core_engine/src/types/ConfigContracts.ts#TeamEnvironmentOverride, core_engine/src/types/ConfigContracts.ts#ThinkTimeConfig, core_engine/src/types/ConfigContracts.ts#ThinkTimeMode, core_engine/src/types/ConfigContracts.ts#TimeSeriesReportingConfig, core_engine/src/types/EventContracts.ts#AgentContext, core_engine/src/types/EventContracts.ts#ErrorCause, core_engine/src/types/EventContracts.ts#ErrorEvent, core_engine/src/types/EventContracts.ts#EventLevel, core_engine/src/types/EventContracts.ts#SnapshotPayload, core_engine/src/types/EventContracts.ts#SnapshotReference, core_engine/src/types/EventContracts.ts#VariableUsage, core_engine/src/types/EventContracts.ts#WarningEvent, core_engine/src/types/EventContracts.ts#WarningMetric, core_engine/src/types/HARContracts.ts#HAREntry, core_engine/src/types/HARContracts.ts#HARRefinementOptions, core_engine/src/types/ReportingContracts.ts#CiSummary, core_engine/src/types/ReportingContracts.ts#CiTransactionSummary, core_engine/src/types/ReportingContracts.ts#ReportBundle, core_engine/src/types/ReportingContracts.ts#ReportBundleConfig, core_engine/src/types/ReportingContracts.ts#ReportBundleMeta, core_engine/src/types/ReportingContracts.ts#RunSummaryFile, core_engine/src/types/ReportingContracts.ts#TimeSeriesFile, core_engine/src/types/ReportingContracts.ts#TimeSeriesPoint, core_engine/src/types/ReportingContracts.ts#TransactionMetricRow, core_engine/src/types/ReportingContracts.ts#TransactionMetricsFile, core_engine/src/types/ReportingContracts.ts#TransactionSeries, core_engine/src/types/ReportingContracts.ts#normalizeTransactionSeries, core_engine/src/types/TestPlanSchema.ts#DataOverflowStrategy, core_engine/src/types/TestPlanSchema.ts#DebugSettings, core_engine/src/types/TestPlanSchema.ts#ExecutionMode, core_engine/src/types/TestPlanSchema.ts#ExecutorType, core_engine/src/types/TestPlanSchema.ts#GlobalLoadProfile, core_engine/src/types/TestPlanSchema.ts#GlobalSLADefinition, core_engine/src/types/TestPlanSchema.ts#HybridGroup, core_engine/src/types/TestPlanSchema.ts#LoadStage, core_engine/src/types/TestPlanSchema.ts#SLADefinition, core_engine/src/types/TestPlanSchema.ts#TestPlan, core_engine/src/types/TestPlanSchema.ts#UserJourney, core_engine/src/types/TestPlanSchema.ts#WorkloadModelType, core_engine/src/utils/LiveConsoleLogStream.ts#LIVE_CONSOLE_POLL_MS, core_engine/src/utils/LiveConsoleLogStream.ts#startLiveConsoleLogStream, core_engine/src/utils/PathResolver.ts#PathResolution, core_engine/src/utils/PathResolver.ts#PathResolver, core_engine/src/utils/ProgressBar.ts#ProgressBar, core_engine/src/utils/ProgressBar.ts#ansi, core_engine/src/utils/ProgressBar.ts#createSpinner, core_engine/src/utils/ProgressBar.ts#isColorEnabled, core_engine/src/utils/autoHeaders.ts#StoredHeader, core_engine/src/utils/autoHeaders.ts#_autoHeaders, core_engine/src/utils/autoHeaders.ts#_onceHeaders, core_engine/src/utils/autoHeaders.ts#addAutoHeader, core_engine/src/utils/autoHeaders.ts#addAutoHeaders, core_engine/src/utils/autoHeaders.ts#addHeaderOnce, core_engine/src/utils/autoHeaders.ts#clearAutoHeaders, core_engine/src/utils/autoHeaders.ts#getAutoHeaders, core_engine/src/utils/autoHeaders.ts#mergeRequestHeaders, core_engine/src/utils/autoHeaders.ts#removeAutoHeader, core_engine/src/utils/dataWriter.ts#FILE_TAG, core_engine/src/utils/dataWriter.ts#WriteDataOptions, core_engine/src/utils/dataWriter.ts#writeData, core_engine/src/utils/extract.ts#ExtractableResponse, core_engine/src/utils/extract.ts#asResultString, core_engine/src/utils/extract.ts#bodyString, core_engine/src/utils/extract.ts#extractBoundary, core_engine/src/utils/extract.ts#extractCookie, core_engine/src/utils/extract.ts#extractHeader, core_engine/src/utils/extract.ts#extractJson, core_engine/src/utils/extract.ts#extractRegex, core_engine/src/utils/extract.ts#navigate, core_engine/src/utils/extract.ts#queryParamFromUrl, core_engine/src/utils/lifecycle.ts#CurvePoint, core_engine/src/utils/lifecycle.ts#EndFamily, core_engine/src/utils/lifecycle.ts#EndPlan, core_engine/src/utils/lifecycle.ts#JourneyContext, core_engine/src/utils/lifecycle.ts#JourneyLifecycleStore, core_engine/src/utils/lifecycle.ts#JourneyState, core_engine/src/utils/lifecycle.ts#LIFECYCLE_END_SAFETY_MS, core_engine/src/utils/lifecycle.ts#PhaseFns, core_engine/src/utils/lifecycle.ts#PhaseMetadata, core_engine/src/utils/lifecycle.ts#RuntimeMetadata, core_engine/src/utils/lifecycle.ts#TimelineStage, core_engine/src/utils/lifecycle.ts#TransactionGate, core_engine/src/utils/lifecycle.ts#__ENV, core_engine/src/utils/lifecycle.ts#_currentPhase, core_engine/src/utils/lifecycle.ts#activeEndPlan, core_engine/src/utils/lifecycle.ts#applyPacing, core_engine/src/utils/lifecycle.ts#arrivalNoticePrinted, core_engine/src/utils/lifecycle.ts#buildVuCurve, core_engine/src/utils/lifecycle.ts#computeEndPlan, core_engine/src/utils/lifecycle.ts#createContext, core_engine/src/utils/lifecycle.ts#createJourneyLifecycleStore, core_engine/src/utils/lifecycle.ts#createState, core_engine/src/utils/lifecycle.ts#createTrackedProxy, core_engine/src/utils/lifecycle.ts#frameworkIterations, core_engine/src/utils/lifecycle.ts#getPhaseMetadata, core_engine/src/utils/lifecycle.ts#getRuntimeMetadata, core_engine/src/utils/lifecycle.ts#getTransactionGate, core_engine/src/utils/lifecycle.ts#handlePhaseError, core_engine/src/utils/lifecycle.ts#interpolateTarget, core_engine/src/utils/lifecycle.ts#isEndDueAfter, core_engine/src/utils/lifecycle.ts#isEndDueBefore, core_engine/src/utils/lifecycle.ts#isEnding, core_engine/src/utils/lifecycle.ts#parseJsonEnv, core_engine/src/utils/lifecycle.ts#runJourneyLifecycle, core_engine/src/utils/lifecycle.ts#runSafely, core_engine/src/utils/lifecycle.ts#terminalDeadlineMs, core_engine/src/utils/lifecycle.ts#thinktime, core_engine/src/utils/logger.ts#Logger, core_engine/src/utils/logger.ts#ansi, core_engine/src/utils/logger.ts#isColorEnabled, core_engine/src/utils/logger.ts#levelStyles, core_engine/src/utils/replayLogger.ts#BINARY_CONTENT_RE, core_engine/src/utils/replayLogger.ts#BINARY_MIME_TYPES, core_engine/src/utils/replayLogger.ts#Cookie, core_engine/src/utils/replayLogger.ts#ExchangeMeta, core_engine/src/utils/replayLogger.ts#K6Response, core_engine/src/utils/replayLogger.ts#NormalizedHeader, core_engine/src/utils/replayLogger.ts#RequestDefinition, core_engine/src/utils/replayLogger.ts#RequestInfo, core_engine/src/utils/replayLogger.ts#STATIC_EXT_RE, core_engine/src/utils/replayLogger.ts#VariableEvent, core_engine/src/utils/replayLogger.ts#VariableRegistryEntry, core_engine/src/utils/replayLogger.ts#_GENERIC_SOURCES, core_engine/src/utils/replayLogger.ts#__ENV, core_engine/src/utils/replayLogger.ts#_variableRegistry, core_engine/src/utils/replayLogger.ts#binaryBodyPlaceholder, core_engine/src/utils/replayLogger.ts#callerScriptLocation, core_engine/src/utils/replayLogger.ts#createVariableEvent, core_engine/src/utils/replayLogger.ts#currentIteration, core_engine/src/utils/replayLogger.ts#currentVu, core_engine/src/utils/replayLogger.ts#detectVariableEvents, core_engine/src/utils/replayLogger.ts#extractCookies, core_engine/src/utils/replayLogger.ts#extractJarCookies, core_engine/src/utils/replayLogger.ts#extractK6ResponseCookies, core_engine/src/utils/replayLogger.ts#extractQueryParams, core_engine/src/utils/replayLogger.ts#iterationState, core_engine/src/utils/replayLogger.ts#logExchange, core_engine/src/utils/replayLogger.ts#logReplayExchange, core_engine/src/utils/replayLogger.ts#nextRequestSequence, core_engine/src/utils/replayLogger.ts#normalizeHeaders, core_engine/src/utils/replayLogger.ts#resolveVariableSource, core_engine/src/utils/replayLogger.ts#trackAuto, core_engine/src/utils/replayLogger.ts#trackCorrelation, core_engine/src/utils/replayLogger.ts#trackDataRow, core_engine/src/utils/replayLogger.ts#trackParameter, core_engine/src/utils/request.ts#CookieValue, core_engine/src/utils/request.ts#HttpMethod, core_engine/src/utils/request.ts#HttpRuntimeConfig, core_engine/src/utils/request.ts#LastRequestContext, core_engine/src/utils/request.ts#RequestBody, core_engine/src/utils/request.ts#RequestOptions, core_engine/src/utils/request.ts#RequestReplayMeta, core_engine/src/utils/request.ts#STRIP_HEADERS, core_engine/src/utils/request.ts#SnapshotConfig, core_engine/src/utils/request.ts#__ENV, core_engine/src/utils/request.ts#_capHitWarned, core_engine/src/utils/request.ts#_httpConfigCache, core_engine/src/utils/request.ts#_iterationRequestCount, core_engine/src/utils/request.ts#_lastRequestContext, core_engine/src/utils/request.ts#_reqIdByResponse, core_engine/src/utils/request.ts#_snapshotConfigCache, core_engine/src/utils/request.ts#_snapshotCount, core_engine/src/utils/request.ts#_snapshottedResponses, core_engine/src/utils/request.ts#applyErrorBehaviorForStatus, core_engine/src/utils/request.ts#captureRequestSnapshot, core_engine/src/utils/request.ts#captureSnapshotFromLastRequest, core_engine/src/utils/request.ts#emitDeferredFailureSnapshot, core_engine/src/utils/request.ts#emitSnapshotEvent, core_engine/src/utils/request.ts#getHttpRuntimeConfig, core_engine/src/utils/request.ts#getRequestIdForResponse, core_engine/src/utils/request.ts#getRuntimeErrorBehavior, core_engine/src/utils/request.ts#getSnapshotConfig, core_engine/src/utils/request.ts#nextRequestId, core_engine/src/utils/request.ts#recordRequestContextForSnapshot, core_engine/src/utils/request.ts#request, core_engine/src/utils/request.ts#sanitizeHeaders, core_engine/src/utils/request.ts#serializeBodyForLog, core_engine/src/utils/session.ts#ResolveFrameworkUrlOptions, core_engine/src/utils/session.ts#TeamEnvironmentOverride, core_engine/src/utils/session.ts#__ENV, core_engine/src/utils/session.ts#_primaryBaseUrl, core_engine/src/utils/session.ts#_registeredUrls, core_engine/src/utils/session.ts#clearCookies, core_engine/src/utils/session.ts#deleteCookie, core_engine/src/utils/session.ts#getApiKey, core_engine/src/utils/session.ts#getEnvContext, core_engine/src/utils/session.ts#getFrameworkBaseUrl, core_engine/src/utils/session.ts#getFrameworkServiceUrls, core_engine/src/utils/session.ts#isAbsoluteUrl, core_engine/src/utils/session.ts#joinBaseAndPath, core_engine/src/utils/session.ts#normalizeBaseUrl, core_engine/src/utils/session.ts#parseJsonEnv, core_engine/src/utils/session.ts#registerBaseUrl, core_engine/src/utils/session.ts#registerFrameworkEnvironmentUrls, core_engine/src/utils/session.ts#resolveFrameworkUrl, core_engine/src/utils/session.ts#resolvePath, core_engine/src/utils/transaction.ts#__ENV, core_engine/src/utils/transaction.ts#_activeTransaction, core_engine/src/utils/transaction.ts#_currentIterationFailed, core_engine/src/utils/transaction.ts#_uncheckedFailingResponses, core_engine/src/utils/transaction.ts#_vuTerminated, core_engine/src/utils/transaction.ts#endTransaction, core_engine/src/utils/transaction.ts#extractScriptLocation, core_engine/src/utils/transaction.ts#formatStackSnippet, core_engine/src/utils/transaction.ts#getCurrentTransaction, core_engine/src/utils/transaction.ts#getRuntimeErrorBehavior, core_engine/src/utils/transaction.ts#initTransactions, core_engine/src/utils/transaction.ts#isJsRuntimeError, core_engine/src/utils/transaction.ts#isVuTerminated, core_engine/src/utils/transaction.ts#k6Check, core_engine/src/utils/transaction.ts#recordFailingResponse, core_engine/src/utils/transaction.ts#startTransaction, core_engine/src/utils/transaction.ts#transaction, core_engine/src/utils/transaction.ts#txnCounters, core_engine/src/utils/transaction.ts#txnResults, core_engine/src/utils/transaction.ts#txnStarts, core_engine/src/utils/transaction.ts#txnTrends.
  
Top-level keys: `core_engine/src/assertions/JourneyAssertionResolver.ts#JourneyAssertionResolver`, `core_engine/src/assertions/SLARegistry.ts#SLARegistry`, `core_engine/src/assertions/ThresholdManager.ts#PERCENTILE_KEY_RE`, `core_engine/src/assertions/ThresholdManager.ts#ThresholdManager`, `core_engine/src/cli/LifecyclePrompt.ts#cq`, `core_engine/src/cli/LifecyclePrompt.ts#parseSelections`, `core_engine/src/cli/LifecyclePrompt.ts#promptForLifecycleSelection`, `core_engine/src/cli/config-inspect.ts#inspectConfig`, `core_engine/src/cli/convert.ts#runConvert`, `core_engine/src/cli/correlate.ts#CorrelateOptions`, `core_engine/src/cli/correlate.ts#defaultManifestPath`, `core_engine/src/cli/correlate.ts#loadRecordingLog`, `core_engine/src/cli/correlate.ts#printCandidateTable`, `core_engine/src/cli/correlate.ts#resolveApplyLevels`, `core_engine/src/cli/correlate.ts#resolveExchanges`, `core_engine/src/cli/correlate.ts#runCorrelate`, `core_engine/src/cli/correlate.ts#toRecordingExchanges`, `core_engine/src/cli/correlate.ts#truncate`, `core_engine/src/cli/docs.ts#generateDocs`, `core_engine/src/cli/features.ts#listFeatures`, `core_engine/src/cli/generate-byos.ts#runGenerateByos`, `core_engine/src/cli/generate.ts#cq`, `core_engine/src/cli/generate.ts#promptForDomains`, `core_engine/src/cli/generate.ts#promptForStaticAssetPreference`, `core_engine/src/cli/generate.ts#runGenerate`, `core_engine/src/cli/import.ts#ConflictPolicy`, `core_engine/src/cli/import.ts#EmitScriptExtras`, `core_engine/src/cli/import.ts#ImportCurlOptions`, `core_engine/src/cli/import.ts#ImportPostmanOptions`, `core_engine/src/cli/import.ts#buildSplitName`, `core_engine/src/cli/import.ts#emitScript`, `core_engine/src/cli/import.ts#emitScriptsPerRequest`, `core_engine/src/cli/import.ts#printCopiedFiles`, `core_engine/src/cli/import.ts#printNextSteps`, `core_engine/src/cli/import.ts#printWarnings`, `core_engine/src/cli/import.ts#readClipboard`, `core_engine/src/cli/import.ts#readFromFile`, `core_engine/src/cli/import.ts#readStdin`, `core_engine/src/cli/import.ts#runImportCurl`, `core_engine/src/cli/import.ts#runImportPostman`, `core_engine/src/cli/import.ts#sanitizeFileStem`, `core_engine/src/cli/import.ts#writeScriptFile`, `core_engine/src/cli/init.ts#runInit`, `core_engine/src/cli/init.ts#writeIfNotExists`, `core_engine/src/cli/interactive.ts#MENU_GROUPS`, `core_engine/src/cli/interactive.ts#MenuChoice`, `core_engine/src/cli/interactive.ts#MenuItem`, `core_engine/src/cli/interactive.ts#OptionChoice`, `core_engine/src/cli/interactive.ts#askInput`, `core_engine/src/cli/interactive.ts#askScriptName`, `core_engine/src/cli/interactive.ts#cleanPath`, `core_engine/src/cli/interactive.ts#confirm`, `core_engine/src/cli/interactive.ts#cq`, `core_engine/src/cli/interactive.ts#createProjectInteractive`, `core_engine/src/cli/interactive.ts#dispatch`, `core_engine/src/cli/interactive.ts#ensureProjectScaffold`, `core_engine/src/cli/interactive.ts#findFiles`, `core_engine/src/cli/interactive.ts#folderTreeLabel`, `core_engine/src/cli/interactive.ts#isFrameworkWorkspace`, `core_engine/src/cli/interactive.ts#isInsideWorkspace`, `core_engine/src/cli/interactive.ts#listExistingProjects`, `core_engine/src/cli/interactive.ts#maybeKeepReferenceCopy`, `core_engine/src/cli/interactive.ts#pickFile`, `core_engine/src/cli/interactive.ts#pickFromOptions`, `core_engine/src/cli/interactive.ts#pickOrCreateProject`, `core_engine/src/cli/interactive.ts#pickPlan`, `core_engine/src/cli/interactive.ts#printBanner`, `core_engine/src/cli/interactive.ts#readUntilBlankLine`, `core_engine/src/cli/interactive.ts#resolveScriptTarget`, `core_engine/src/cli/interactive.ts#resolveUserPath`, `core_engine/src/cli/interactive.ts#runInteractivePanel`, `core_engine/src/cli/interactive.ts#showMenuAndPick`, `core_engine/src/cli/interactive.ts#spawnSelf`, `core_engine/src/cli/interactive.ts#teamFromPath`, `core_engine/src/cli/interactive.ts#wizardByos`, `core_engine/src/cli/interactive.ts#wizardConvert`, `core_engine/src/cli/interactive.ts#wizardDebug`, `core_engine/src/cli/interactive.ts#wizardGenerate`, `core_engine/src/cli/interactive.ts#wizardImportCurl`, `core_engine/src/cli/interactive.ts#wizardImportPostman`, `core_engine/src/cli/interactive.ts#wizardInit`, `core_engine/src/cli/interactive.ts#wizardRun`, `core_engine/src/cli/interactive.ts#wizardValidate`, `core_engine/src/cli/new.ts#runNewWizard`, `core_engine/src/cli/run.ts#ERROR_EVENT_PREFIX`, `core_engine/src/cli/run.ts#FRAMEWORK_OWNED_FLAGS`, `core_engine/src/cli/run.ts#LIVE_TXN_INTERVAL_MS`, `core_engine/src/cli/run.ts#LiveTxnStats`, `core_engine/src/cli/run.ts#SNAPSHOT_EVENT_PREFIX`, `core_engine/src/cli/run.ts#WARNING_EVENT_PREFIX`, `core_engine/src/cli/run.ts#bridgeEnvFile`, `core_engine/src/cli/run.ts#buildLiveTableLines`, `core_engine/src/cli/run.ts#buildReportAgents`, `core_engine/src/cli/run.ts#buildRunEnvironment`, `core_engine/src/cli/run.ts#buildRuntimeMetadataBlock`, `core_engine/src/cli/run.ts#buildScenarioRuntimeMetadata`, `core_engine/src/cli/run.ts#collectUniqueTransactionNames`, `core_engine/src/cli/run.ts#computeTopRequestsByP90`, `core_engine/src/cli/run.ts#configCmd`, `core_engine/src/cli/run.ts#extractJourneyTransactionNames`, `core_engine/src/cli/run.ts#extractK6PerfEvents`, `core_engine/src/cli/run.ts#extractPayloadWithPrefix`, `core_engine/src/cli/run.ts#extractSnapshotPayload`, `core_engine/src/cli/run.ts#extractTransactionNamesFromSource`, `core_engine/src/cli/run.ts#filterPassthroughArgs`, `core_engine/src/cli/run.ts#finalizeRunArtifacts`, `core_engine/src/cli/run.ts#formatCell`, `core_engine/src/cli/run.ts#getEntryScriptDirectory`, `core_engine/src/cli/run.ts#importCmd`, `core_engine/src/cli/run.ts#parseAndFlushSnapshots`, `core_engine/src/cli/run.ts#pct`, `core_engine/src/cli/run.ts#percentilesFromStats`, `core_engine/src/cli/run.ts#prepareRunArtifacts`, `core_engine/src/cli/run.ts#printTransactionTable`, `core_engine/src/cli/run.ts#program`, `core_engine/src/cli/run.ts#renderFixedTable`, `core_engine/src/cli/run.ts#renderScrollbackTable`, `core_engine/src/cli/run.ts#resolveRecordingLogForStandaloneDebug`, `core_engine/src/cli/run.ts#resolveSharedRunIdFromEnv`, `core_engine/src/cli/run.ts#runJourneyDebug`, `core_engine/src/cli/run.ts#runPlanDebugMode`, `core_engine/src/cli/run.ts#startLiveTransactionDisplay`, `core_engine/src/cli/run.ts#templatesCmd`, `core_engine/src/cli/run.ts#toImportSpecifier`, `core_engine/src/cli/run.ts#writeRunManifest`, `core_engine/src/cli/templates.ts#listTemplates`, `core_engine/src/cli/templates.ts#showTemplate`, `core_engine/src/cli/validate.ts#ValidateOptions`, `core_engine/src/cli/validate.ts#runValidate`, `core_engine/src/config/ConfigurationManager.ts#ConfigurationManager`, `core_engine/src/config/EnvResolver.ts#EnvResolver`, `core_engine/src/config/GatekeeperValidator.ts#GatekeeperResult`, `core_engine/src/config/GatekeeperValidator.ts#GatekeeperValidator`, `core_engine/src/config/RuntimeConfigManager.ts#RuntimeConfigManager`, `core_engine/src/config/SchemaValidator.ts#RUNTIME_SETTINGS_SCHEMA_INLINE`, `core_engine/src/config/SchemaValidator.ts#SchemaValidator`, `core_engine/src/config/SchemaValidator.ts#TEST_PLAN_SCHEMA_INLINE`, `core_engine/src/config/SchemaValidator.ts#ValidationResult`, `core_engine/src/config/SchemaValidator.ts#levenshtein`, `core_engine/src/config/SchemaValidator.ts#loadExternalSchema`, `core_engine/src/config/ScriptContractGuard.ts#ApiViolation`, `core_engine/src/config/ScriptContractGuard.ts#CallHit`, `core_engine/src/config/ScriptContractGuard.ts#ContractRule`, `core_engine/src/config/ScriptContractGuard.ts#FileViolations`, `core_engine/src/config/ScriptContractGuard.ts#ScriptContractGuard`, `core_engine/src/correlation/CandidateScorer.ts#BASE64ISH_RE`, `core_engine/src/correlation/CandidateScorer.ts#CandidateScorer`, `core_engine/src/correlation/CandidateScorer.ts#DEFAULT_CONFIG`, `core_engine/src/correlation/CandidateScorer.ts#HEX_RE`, `core_engine/src/correlation/CandidateScorer.ts#JWT_RE`, `core_engine/src/correlation/CandidateScorer.ts#ScoreOptions`, `core_engine/src/correlation/CandidateScorer.ts#ScoredCandidate`, `core_engine/src/correlation/CandidateScorer.ts#ScorerConfig`, `core_engine/src/correlation/CandidateScorer.ts#UUID_RE`, `core_engine/src/correlation/CandidateScorer.ts#deriveNameHint`, `core_engine/src/correlation/CandidateScorer.ts#shannonBits`, `core_engine/src/correlation/CorrelationEngine.ts#CorrelationEngine`, `core_engine/src/correlation/CorrelationManifest.ts#ConsumerLocation`, `core_engine/src/correlation/CorrelationManifest.ts#CorrelationCandidate`, `core_engine/src/correlation/CorrelationManifest.ts#CorrelationConfidence`, `core_engine/src/correlation/CorrelationManifest.ts#CorrelationConsumer`, `core_engine/src/correlation/CorrelationManifest.ts#CorrelationManifest`, `core_engine/src/correlation/CorrelationManifest.ts#CorrelationPlan`, `core_engine/src/correlation/CorrelationManifest.ts#CorrelationProducer`, `core_engine/src/correlation/CorrelationManifest.ts#ExtractorKind`, `core_engine/src/correlation/CorrelationManifest.ts#ProducerSource`, `core_engine/src/correlation/CorrelationManifest.ts#RecordingCookie`, `core_engine/src/correlation/CorrelationManifest.ts#RecordingExchange`, `core_engine/src/correlation/CorrelationManifest.ts#RecordingHeader`, `core_engine/src/correlation/CorrelationManifest.ts#RecordingRequest`, `core_engine/src/correlation/CorrelationManifest.ts#RecordingResponse`, `core_engine/src/correlation/CorrelationScanner.ts#CorrelationScanner`, `core_engine/src/correlation/CorrelationScanner.ts#DEFAULT_CONFIG_PATH`, `core_engine/src/correlation/CorrelationScanner.ts#ScanOptions`, `core_engine/src/correlation/ExtractorRegistry.ts#ExtractorFn`, `core_engine/src/correlation/ExtractorRegistry.ts#ExtractorRegistry`, `core_engine/src/correlation/ExtractorRegistry.ts#K6ResponseLike`, `core_engine/src/correlation/ExtractorSynthesizer.ts#ExtractorSynthesizer`, `core_engine/src/correlation/ExtractorSynthesizer.ts#buildRegexFallback`, `core_engine/src/correlation/ExtractorSynthesizer.ts#escapeRegex`, `core_engine/src/correlation/ExtractorSynthesizer.ts#locateWithBoundary`, `core_engine/src/correlation/ExtractorSynthesizer.ts#sanitizeIdentifier`, `core_engine/src/correlation/ExtractorSynthesizer.ts#semanticHtmlBoundary`, `core_engine/src/correlation/ExtractorSynthesizer.ts#synthesizeBoundary`, `core_engine/src/correlation/FallbackHandler.ts#FallbackHandler`, `core_engine/src/correlation/LinkMatcher.ts#LinkMatcher`, `core_engine/src/correlation/LinkMatcher.ts#RawCandidate`, `core_engine/src/correlation/LinkMatcher.ts#SOURCE_PRIORITY`, `core_engine/src/correlation/RuleProcessor.ts#CorrelationRule`, `core_engine/src/correlation/RuleProcessor.ts#RuleProcessor`, `core_engine/src/correlation/ScriptCorrelationWriter.ts#ApplyOptions`, `core_engine/src/correlation/ScriptCorrelationWriter.ts#ApplyResult`, `core_engine/src/correlation/ScriptCorrelationWriter.ts#EXTRACT_FN`, `core_engine/src/correlation/ScriptCorrelationWriter.ts#RequestCall`, `core_engine/src/correlation/ScriptCorrelationWriter.ts#ScriptCorrelationWriter`, `core_engine/src/correlation/ScriptCorrelationWriter.ts#buildExtractCall`, `core_engine/src/correlation/ScriptCorrelationWriter.ts#insertAfterImports`, `core_engine/src/correlation/ScriptCorrelationWriter.ts#leadingIndent`, `core_engine/src/correlation/ScriptCorrelationWriter.ts#matchParen`, `core_engine/src/correlation/ScriptCorrelationWriter.ts#rewriteStringLiterals`, `core_engine/src/correlation/ValueIndexer.ts#ConsumerOccurrence`, `core_engine/src/correlation/ValueIndexer.ts#IndexedValues`, `core_engine/src/correlation/ValueIndexer.ts#MAX_VALUE_LEN`, `core_engine/src/correlation/ValueIndexer.ts#MIN_VALUE_LEN`, `core_engine/src/correlation/ValueIndexer.ts#ProducerOccurrence`, `core_engine/src/correlation/ValueIndexer.ts#STATIC_REQUEST_HEADERS`, `core_engine/src/correlation/ValueIndexer.ts#ValueIndexer`, `core_engine/src/correlation/ValueIndexer.ts#decodeSafe`, `core_engine/src/correlation/ValueIndexer.ts#extractHtmlTokens`, `core_engine/src/correlation/ValueIndexer.ts#isIndexableValue`, `core_engine/src/correlation/ValueIndexer.ts#looksLikeHtml`, `core_engine/src/correlation/ValueIndexer.ts#parseCookieHeader`, `core_engine/src/correlation/ValueIndexer.ts#parseQuery`, `core_engine/src/correlation/ValueIndexer.ts#subTokens`, `core_engine/src/correlation/ValueIndexer.ts#tryParseForm`, `core_engine/src/correlation/ValueIndexer.ts#tryParseJson`, `core_engine/src/correlation/ValueIndexer.ts#walkJson`, `core_engine/src/data/DataFactory.ts#DataFactory`, `core_engine/src/data/DataFactory.ts#DataRow`, `core_engine/src/data/DataFactory.ts#LoadedDataset`, `core_engine/src/data/DataPoolManager.ts#DataPoolManager`, `core_engine/src/data/DataPoolManager.ts#PoolConfig`, `core_engine/src/data/DataValidator.ts#DataValidationResult`, `core_engine/src/data/DataValidator.ts#DataValidator`, `core_engine/src/data/DynamicValueFactory.ts#DynamicValueFactory`, `core_engine/src/debug/DiffChecker.ts#BodyDiffResult`, `core_engine/src/debug/DiffChecker.ts#DiffChecker`, `core_engine/src/debug/DiffChecker.ts#DiffResult`, `core_engine/src/debug/DiffChecker.ts#HeaderDiffEntry`, `core_engine/src/debug/DiffChecker.ts#ReplayComparisonContext`, `core_engine/src/debug/DiffChecker.ts#ReplayProjection`, `core_engine/src/debug/DiffChecker.ts#SideSnapshot`, `core_engine/src/debug/ExchangeLog.ts#ExchangeLogBuilder`, `core_engine/src/debug/ExchangeLog.ts#ExchangeLogCookie`, `core_engine/src/debug/ExchangeLog.ts#ExchangeLogHeader`, `core_engine/src/debug/ExchangeLog.ts#ExchangeLogParams`, `core_engine/src/debug/ExchangeLog.ts#ExchangeLogRequest`, `core_engine/src/debug/ExchangeLog.ts#ExchangeLogResponse`, `core_engine/src/debug/ExchangeLog.ts#TaggedExchangeLogEntry`, `core_engine/src/debug/ExchangeLog.ts#VariableEvent`, `core_engine/src/debug/HTMLDiffReporter.ts#HTMLDiffReporter`, `core_engine/src/debug/HTMLDiffReporter.ts#ReportOptions`, `core_engine/src/debug/HTMLDiffReporter.ts#ReportPayload`, `core_engine/src/debug/RecordingLogResolver.ts#RecordingIndexEntry`, `core_engine/src/debug/RecordingLogResolver.ts#RecordingLogResolution`, `core_engine/src/debug/RecordingLogResolver.ts#RecordingLogResolver`, `core_engine/src/debug/ReplayRunner.ts#DebugReplayOptions`, `core_engine/src/debug/ReplayRunner.ts#DebugReplayResult`, `core_engine/src/debug/ReplayRunner.ts#K6MetricRow`, `core_engine/src/debug/ReplayRunner.ts#K6Metrics`, `core_engine/src/debug/ReplayRunner.ts#ReplayRunner`, `core_engine/src/debug/ReplayRunner.ts#extractTransactionNames`, `core_engine/src/debug/VariableInstrumenter.ts#Classified`, `core_engine/src/debug/VariableInstrumenter.ts#INTERP_RE`, `core_engine/src/debug/VariableInstrumenter.ts#InstrumentResult`, `core_engine/src/debug/VariableInstrumenter.ts#classify`, `core_engine/src/debug/VariableInstrumenter.ts#instrumentVariableTracking`, `core_engine/src/debug/VariableInstrumenter.ts#sanitize`, `core_engine/src/distributed/LiveStatusHeartbeat.ts#HeartbeatOptions`, `core_engine/src/distributed/LiveStatusHeartbeat.ts#LiveState`, `core_engine/src/distributed/LiveStatusHeartbeat.ts#LiveStatusHeartbeat`, `core_engine/src/distributed/LiveStatusHeartbeat.ts#LiveStatusSnapshot`, `core_engine/src/distributed/LiveStatusHeartbeat.ts#tailNdjson`, `core_engine/src/distributed/MergeEngine.ts#MachineArtifacts`, `core_engine/src/distributed/MergeEngine.ts#MergeEngine`, `core_engine/src/distributed/MergeEngine.ts#MergeOptions`, `core_engine/src/distributed/MergeEngine.ts#MergeResult`, `core_engine/src/distributed/MergeEngine.ts#TxnAccumulator`, `core_engine/src/distributed/MergeEngine.ts#statToFraction`, `core_engine/src/distributed/MergedReportBuilder.ts#MachineTimeseries`, `core_engine/src/distributed/MergedReportBuilder.ts#MergedReportBuilder`, `core_engine/src/distributed/MergedReportBuilder.ts#MergedReportInput`, `core_engine/src/distributed/MergedReportBuilder.ts#percentilesFrom`, `core_engine/src/distributed/agentServer.ts#AgentServerOptions`, `core_engine/src/distributed/agentServer.ts#FRAMEWORK_VERSION`, `core_engine/src/distributed/agentServer.ts#TOKEN_HEADER`, `core_engine/src/distributed/agentServer.ts#buildInfo`, `core_engine/src/distributed/agentServer.ts#detectK6Version`, `core_engine/src/distributed/agentServer.ts#freeDiskBytes`, `core_engine/src/distributed/agentServer.ts#runAgent`, `core_engine/src/distributed/agentServer.ts#runAgentCli`, `core_engine/src/distributed/agentServer.ts#tokenMatches`, `core_engine/src/distributed/collectRun.ts#DEFAULT_EXCLUDE`, `core_engine/src/distributed/collectRun.ts#collectRunDir`, `core_engine/src/distributed/collectRun.ts#copyDirInto`, `core_engine/src/distributed/collectRun.ts#liveRunDir`, `core_engine/src/distributed/collectRun.ts#readRunId`, `core_engine/src/distributed/collectRun.ts#runBaseDir`, `core_engine/src/distributed/collectRun.ts#runCollect`, `core_engine/src/distributed/collectRun.ts#sharedRunDir`, `core_engine/src/distributed/control.ts#ControlAction`, `core_engine/src/distributed/control.ts#ControlFile`, `core_engine/src/distributed/control.ts#ControlWatcher`, `core_engine/src/distributed/control.ts#ControlWatcherOptions`, `core_engine/src/distributed/control.ts#controlDirFor`, `core_engine/src/distributed/control.ts#fetchK6Vus`, `core_engine/src/distributed/control.ts#k6ApiStop`, `core_engine/src/distributed/control.ts#killProcessTree`, `core_engine/src/distributed/control.ts#readControl`, `core_engine/src/distributed/control.ts#writeControl`, `core_engine/src/distributed/liveAggregate.ts#DEFAULT_STATS`, `core_engine/src/distributed/liveAggregate.ts#LiveAggregate`, `core_engine/src/distributed/liveAggregate.ts#MergedTxn`, `core_engine/src/distributed/liveAggregate.ts#RunContext`, `core_engine/src/distributed/liveAggregate.ts#aggregate`, `core_engine/src/distributed/liveAggregate.ts#controllerHost`, `core_engine/src/distributed/liveAggregate.ts#ctrlHost`, `core_engine/src/distributed/liveAggregate.ts#ctrlTimer`, `core_engine/src/distributed/liveAggregate.ts#findLatestFinalReport`, `core_engine/src/distributed/liveAggregate.ts#mergeTransactions`, `core_engine/src/distributed/liveAggregate.ts#readSnapshots`, `core_engine/src/distributed/liveAggregate.ts#resolveLiveDir`, `core_engine/src/distributed/liveAggregate.ts#resolveRunContext`, `core_engine/src/distributed/liveAggregate.ts#startControllerHostSampling`, `core_engine/src/distributed/liveAggregate.ts#statToFraction`, `core_engine/src/distributed/liveAggregate.ts#statValue`, `core_engine/src/distributed/liveAggregate.ts#timingStats`, `core_engine/src/distributed/liveDashboard.ts#DashboardOptions`, `core_engine/src/distributed/liveDashboard.ts#page`, `core_engine/src/distributed/liveDashboard.ts#runDashboardCli`, `core_engine/src/distributed/liveDashboard.ts#startDashboardServer`, `core_engine/src/distributed/monitor.ts#MonitorOptions`, `core_engine/src/distributed/monitor.ts#padL`, `core_engine/src/distributed/monitor.ts#padR`, `core_engine/src/distributed/monitor.ts#render`, `core_engine/src/distributed/monitor.ts#runMonitor`, `core_engine/src/distributed/probe.ts#ProbeResult`, `core_engine/src/distributed/probe.ts#ProbeTarget`, `core_engine/src/distributed/probe.ts#TOKEN_HEADER`, `core_engine/src/distributed/probe.ts#diagnose`, `core_engine/src/distributed/probe.ts#parseTarget`, `core_engine/src/distributed/probe.ts#probeOne`, `core_engine/src/distributed/probe.ts#probeTcp`, `core_engine/src/distributed/probe.ts#runProbe`, `core_engine/src/distributed/runMerge.ts#FINAL_PREFIX`, `core_engine/src/distributed/runMerge.ts#MERGED_DIR`, `core_engine/src/distributed/runMerge.ts#MergeCliOptions`, `core_engine/src/distributed/runMerge.ts#finalTimestamp`, `core_engine/src/distributed/runMerge.ts#machineLanded`, `core_engine/src/distributed/runMerge.ts#readJson`, `core_engine/src/distributed/runMerge.ts#readNdjson`, `core_engine/src/distributed/runMerge.ts#runMerge`, `core_engine/src/distributed/runMerge.ts#sleep`, `core_engine/src/distributed/runMerge.ts#validateManifests`, `core_engine/src/distributed/runMerge.ts#waitForMachines`, `core_engine/src/distributed/runMerge.ts#writeMergedCsv`, `core_engine/src/distributed/shareSetup.ts#ShareSuggestionOptions`, `core_engine/src/distributed/shareSetup.ts#printControllerShareSuggestion`, `core_engine/src/distributed/shareSetup.ts#resolveResultsBaseDir`, `core_engine/src/distributed/startBarrier.ts#awaitScheduledStart`, `core_engine/src/distributed/startBarrier.ts#fmtRemaining`, `core_engine/src/distributed/transactionCsv.ts#CsvTransactionAggregate`, `core_engine/src/distributed/transactionCsv.ts#RequestTiming`, `core_engine/src/distributed/transactionCsv.ts#TransactionCsvStats`, `core_engine/src/distributed/transactionCsv.ts#buildTransactionRowsFromCsv`, `core_engine/src/distributed/transactionCsv.ts#findRequestCsv`, `core_engine/src/distributed/transactionCsv.ts#findTransactionCsv`, `core_engine/src/distributed/transactionCsv.ts#flatten`, `core_engine/src/distributed/transactionCsv.ts#leafFor`, `core_engine/src/distributed/transactionCsv.ts#parseCsvLine`, `core_engine/src/distributed/transactionCsv.ts#readRequestFailByBucket`, `core_engine/src/distributed/transactionCsv.ts#readRequestFailure`, `core_engine/src/distributed/transactionCsv.ts#readRequestTimings`, `core_engine/src/distributed/transactionCsv.ts#readTransactionCsvRaw`, `core_engine/src/distributed/transactionCsv.ts#readTransactionCsvStats`, `core_engine/src/execution/FileWriteSink.ts#FILE_TAG`, `core_engine/src/execution/FileWriteSink.ts#FilePayload`, `core_engine/src/execution/FileWriteSink.ts#FileWriteSink`, `core_engine/src/execution/HostMonitor.ts#HostMonitor`, `core_engine/src/execution/HostMonitor.ts#HostSnapshot`, `core_engine/src/execution/JourneyAllocator.ts#JourneyAllocation`, `core_engine/src/execution/JourneyAllocator.ts#JourneyAllocator`, `core_engine/src/execution/ParallelExecutionManager.ts#K6Options`, `core_engine/src/execution/ParallelExecutionManager.ts#ParallelExecutionManager`, `core_engine/src/execution/PipelineRunner.ts#PipelineRunResult`, `core_engine/src/execution/PipelineRunner.ts#PipelineRunner`, `core_engine/src/execution/PipelineRunner.ts#RunOptions`, `core_engine/src/recording/CurlAdapter.ts#CurlAdapter`, `core_engine/src/recording/CurlAdapter.ts#CurlParseResult`, `core_engine/src/recording/CurlAdapter.ts#ParsedCurlBlock`, `core_engine/src/recording/DomainFilter.ts#DomainFilter`, `core_engine/src/recording/DomainFilter.ts#DomainStat`, `core_engine/src/recording/HARParser.ts#HARParser`, `core_engine/src/recording/PostmanAdapter.ts#FileBinding`, `core_engine/src/recording/PostmanAdapter.ts#PostmanAdapter`, `core_engine/src/recording/PostmanAdapter.ts#PostmanAuth`, `core_engine/src/recording/PostmanAdapter.ts#PostmanAuthParam`, `core_engine/src/recording/PostmanAdapter.ts#PostmanBody`, `core_engine/src/recording/PostmanAdapter.ts#PostmanCollectionFile`, `core_engine/src/recording/PostmanAdapter.ts#PostmanEvent`, `core_engine/src/recording/PostmanAdapter.ts#PostmanFolderInfo`, `core_engine/src/recording/PostmanAdapter.ts#PostmanHeader`, `core_engine/src/recording/PostmanAdapter.ts#PostmanItem`, `core_engine/src/recording/PostmanAdapter.ts#PostmanParseOptions`, `core_engine/src/recording/PostmanAdapter.ts#PostmanParseResult`, `core_engine/src/recording/PostmanAdapter.ts#PostmanRequest`, `core_engine/src/recording/PostmanAdapter.ts#PostmanUrl`, `core_engine/src/recording/PostmanAdapter.ts#mimeFromExt`, `core_engine/src/recording/PostmanAdapter.ts#normalizeFolderFilter`, `core_engine/src/recording/PostmanAdapter.ts#pathHasPrefix`, `core_engine/src/recording/PostmanAdapter.ts#safeJsonParse`, `core_engine/src/recording/PostmanAdapter.ts#sanitizeName`, `core_engine/src/recording/PostmanScriptTranslator.ts#LineResult`, `core_engine/src/recording/PostmanScriptTranslator.ts#RES`, `core_engine/src/recording/PostmanScriptTranslator.ts#TranslationResult`, `core_engine/src/recording/PostmanScriptTranslator.ts#countClosers`, `core_engine/src/recording/PostmanScriptTranslator.ts#countOpeners`, `core_engine/src/recording/PostmanScriptTranslator.ts#translateLine`, `core_engine/src/recording/PostmanScriptTranslator.ts#translatePostmanScript`, `core_engine/src/recording/ScriptConverter.ts#ScriptConverter`, `core_engine/src/recording/ScriptGenerator.ts#GenerateOptions`, `core_engine/src/recording/ScriptGenerator.ts#LifecycleSelection`, `core_engine/src/recording/ScriptGenerator.ts#SCRIPT_API_MODULE`, `core_engine/src/recording/ScriptGenerator.ts#ScriptGenerator`, `core_engine/src/recording/TransactionGrouper.ts#TransactionGroup`, `core_engine/src/recording/TransactionGrouper.ts#TransactionGrouper`, `core_engine/src/reporters/AzureReporter.ts#AzureReporter`, `core_engine/src/reporters/CustomUploader.ts#CustomUploader`, `core_engine/src/reporters/GrafanaReporter.ts#GrafanaReporter`, `core_engine/src/reporters/ResultTransformer.ts#ResultContract`, `core_engine/src/reporters/ResultTransformer.ts#ResultTransformer`, `core_engine/src/reporting/ArtifactWriter.ts#ArtifactWriter`, `core_engine/src/reporting/EventArtifactBuilder.ts#BuildEventArtifactsOptions`, `core_engine/src/reporting/EventArtifactBuilder.ts#EventArtifactBuilder`, `core_engine/src/reporting/EventArtifactBuilder.ts#SummaryCheck`, `core_engine/src/reporting/EventArtifactBuilder.ts#SummaryGroup`, `core_engine/src/reporting/EventArtifactBuilder.ts#SummaryMetric`, `core_engine/src/reporting/Histogram.ts#HistogramJSON`, `core_engine/src/reporting/Histogram.ts#RelativeHistogram`, `core_engine/src/reporting/Histogram.ts#percentileR7`, `core_engine/src/reporting/HistogramArtifactBuilder.ts#BuildHistogramOptions`, `core_engine/src/reporting/HistogramArtifactBuilder.ts#HistogramArtifact`, `core_engine/src/reporting/HistogramArtifactBuilder.ts#HistogramArtifactBuilder`, `core_engine/src/reporting/HistogramArtifactBuilder.ts#OVERVIEW_KEY`, `core_engine/src/reporting/LiveEventLogWriter.ts#ERROR_EVENT_PREFIX`, `core_engine/src/reporting/LiveEventLogWriter.ts#LiveEventLogWriter`, `core_engine/src/reporting/LiveEventLogWriter.ts#WARNING_EVENT_PREFIX`, `core_engine/src/reporting/RequestMetricLogWriter.ts#COLUMNS`, `core_engine/src/reporting/RequestMetricLogWriter.ts#POLL_INTERVAL_MS`, `core_engine/src/reporting/RequestMetricLogWriter.ts#PROMOTED_TAGS`, `core_engine/src/reporting/RequestMetricLogWriter.ts#PendingRow`, `core_engine/src/reporting/RequestMetricLogWriter.ts#RawPoint`, `core_engine/src/reporting/RequestMetricLogWriter.ts#RequestMetricLogContext`, `core_engine/src/reporting/RequestMetricLogWriter.ts#RequestMetricLogWriter`, `core_engine/src/reporting/RequestMetricLogWriter.ts#csvField`, `core_engine/src/reporting/RunReportGenerator.ts#RunReportGenerator`, `core_engine/src/reporting/RunSummaryBuilder.ts#BuildRunSummaryOptions`, `core_engine/src/reporting/RunSummaryBuilder.ts#RunSummaryBuilder`, `core_engine/src/reporting/TimeseriesArtifactBuilder.ts#BuildTimeseriesArtifactOptions`, `core_engine/src/reporting/TimeseriesArtifactBuilder.ts#SummaryMetric`, `core_engine/src/reporting/TimeseriesArtifactBuilder.ts#TimeseriesArtifactBuilder`, `core_engine/src/reporting/TimeseriesArtifactBuilder.ts#metricVal`, `core_engine/src/reporting/TimeseriesStreamParser.ts#OverviewBucket`, `core_engine/src/reporting/TimeseriesStreamParser.ts#OverviewRaw`, `core_engine/src/reporting/TimeseriesStreamParser.ts#ParseOptions`, `core_engine/src/reporting/TimeseriesStreamParser.ts#ParsedTimeseries`, `core_engine/src/reporting/TimeseriesStreamParser.ts#ParsedTransactionSeries`, `core_engine/src/reporting/TimeseriesStreamParser.ts#PhaseTimings`, `core_engine/src/reporting/TimeseriesStreamParser.ts#RawPoint`, `core_engine/src/reporting/TimeseriesStreamParser.ts#RequestBucket`, `core_engine/src/reporting/TimeseriesStreamParser.ts#RequestRaw`, `core_engine/src/reporting/TimeseriesStreamParser.ts#TimeseriesStreamParser`, `core_engine/src/reporting/TimeseriesStreamParser.ts#TransactionBucket`, `core_engine/src/reporting/TimeseriesStreamParser.ts#TransactionRaw`, `core_engine/src/reporting/TimeseriesStreamParser.ts#TrendStats`, `core_engine/src/reporting/TimeseriesStreamParser.ts#computeTrendStats`, `core_engine/src/reporting/TimeseriesStreamParser.ts#emptyPhase`, `core_engine/src/reporting/TimeseriesStreamParser.ts#finalizeOverview`, `core_engine/src/reporting/TimeseriesStreamParser.ts#finalizeRequest`, `core_engine/src/reporting/TimeseriesStreamParser.ts#finalizeTransaction`, `core_engine/src/reporting/TimeseriesStreamParser.ts#getOverview`, `core_engine/src/reporting/TimeseriesStreamParser.ts#normalizePercentiles`, `core_engine/src/reporting/TimeseriesStreamParser.ts#percentile`, `core_engine/src/reporting/TimeseriesStreamParser.ts#phaseStats`, `core_engine/src/reporting/TransactionMetricLogWriter.ts#CHECKRATE_SUFFIX`, `core_engine/src/reporting/TransactionMetricLogWriter.ts#COLUMNS`, `core_engine/src/reporting/TransactionMetricLogWriter.ts#POLL_INTERVAL_MS`, `core_engine/src/reporting/TransactionMetricLogWriter.ts#PendingRow`, `core_engine/src/reporting/TransactionMetricLogWriter.ts#RawPoint`, `core_engine/src/reporting/TransactionMetricLogWriter.ts#TransactionMetricLogContext`, `core_engine/src/reporting/TransactionMetricLogWriter.ts#TransactionMetricLogWriter`, `core_engine/src/reporting/TransactionMetricLogWriter.ts#csvField`, `core_engine/src/reporting/TransactionMetricsBuilder.ts#BuildTransactionMetricsOptions`, `core_engine/src/reporting/TransactionMetricsBuilder.ts#GroupAggregate`, `core_engine/src/reporting/TransactionMetricsBuilder.ts#SummaryCheck`, `core_engine/src/reporting/TransactionMetricsBuilder.ts#SummaryGroup`, `core_engine/src/reporting/TransactionMetricsBuilder.ts#SummaryMetric`, `core_engine/src/reporting/TransactionMetricsBuilder.ts#TransactionMetricsBuilder`, `core_engine/src/runtime/ErrorRuntime.ts#ErrorRuntime`, `core_engine/src/runtime/ErrorRuntime.ts#ErrorRuntimeContext`, `core_engine/src/runtime/LifecycleRuntime.ts#JourneyContext`, `core_engine/src/runtime/LifecycleRuntime.ts#JourneyPhase`, `core_engine/src/runtime/LifecycleRuntime.ts#LifecycleDecision`, `core_engine/src/runtime/LifecycleRuntime.ts#LifecyclePhaseFns`, `core_engine/src/runtime/LifecycleRuntime.ts#LifecycleRunState`, `core_engine/src/runtime/LifecycleRuntime.ts#LifecycleRuntime`, `core_engine/src/runtime/MetricsRuntime.ts#MetricsRuntime`, `core_engine/src/runtime/MetricsRuntime.ts#TransactionAggregate`, `core_engine/src/runtime/SnapshotRuntime.ts#SnapshotRuntime`, `core_engine/src/runtime/TimeseriesRuntime.ts#TimeseriesRuntime`, `core_engine/src/scenario/ExecutorFactory.ts#EXECUTOR_SPECS`, `core_engine/src/scenario/ExecutorFactory.ts#ExecutorFactory`, `core_engine/src/scenario/ExecutorFactory.ts#ExecutorSpec`, `core_engine/src/scenario/ScenarioBuilder.ts#K6ScenarioDefinition`, `core_engine/src/scenario/ScenarioBuilder.ts#K6ScenariosMap`, `core_engine/src/scenario/ScenarioBuilder.ts#ScenarioBuilder`, `core_engine/src/scenario/ScenarioBuilder.ts#ScenarioPhaseEnvelope`, `core_engine/src/scenario/ScenarioBuilder.ts#ScenarioRuntimeMetadata`, `core_engine/src/scenario/TestPlanLoader.ts#TestPlanLoader`, `core_engine/src/scenario/WorkloadModels.ts#K6ExecutorConfig`, `core_engine/src/scenario/WorkloadModels.ts#buildConstantArrivalRateProfile`, `core_engine/src/scenario/WorkloadModels.ts#buildExternallyControlledProfile`, `core_engine/src/scenario/WorkloadModels.ts#buildIterationProfile`, `core_engine/src/scenario/WorkloadModels.ts#buildLoadProfile`, `core_engine/src/scenario/WorkloadModels.ts#buildRampingArrivalRateProfile`, `core_engine/src/scenario/WorkloadModels.ts#buildSoakProfile`, `core_engine/src/scenario/WorkloadModels.ts#buildSpikeProfile`, `core_engine/src/scenario/WorkloadModels.ts#buildStressProfile`, `core_engine/src/scenario/WorkloadModels.ts#toK6ExecutorConfig`, `core_engine/src/types/ConfigContracts.ts#EnvironmentConfig`, `core_engine/src/types/ConfigContracts.ts#EnvironmentCustomValue`, `core_engine/src/types/ConfigContracts.ts#ErrorBehavior`, `core_engine/src/types/ConfigContracts.ts#ErrorCaptureConfig`, `core_engine/src/types/ConfigContracts.ts#FRAMEWORK_DEFAULTS`, `core_engine/src/types/ConfigContracts.ts#HttpConfig`, `core_engine/src/types/ConfigContracts.ts#MonitoringConfig`, `core_engine/src/types/ConfigContracts.ts#PacingConfig`, `core_engine/src/types/ConfigContracts.ts#PacingMode`, `core_engine/src/types/ConfigContracts.ts#ReportingConfig`, `core_engine/src/types/ConfigContracts.ts#ResolvedConfig`, `core_engine/src/types/ConfigContracts.ts#RuntimeSettings`, `core_engine/src/types/ConfigContracts.ts#TeamEnvironmentOverride`, `core_engine/src/types/ConfigContracts.ts#ThinkTimeConfig`, `core_engine/src/types/ConfigContracts.ts#ThinkTimeMode`, `core_engine/src/types/ConfigContracts.ts#TimeSeriesReportingConfig`, `core_engine/src/types/EventContracts.ts#AgentContext`, `core_engine/src/types/EventContracts.ts#ErrorCause`, `core_engine/src/types/EventContracts.ts#ErrorEvent`, `core_engine/src/types/EventContracts.ts#EventLevel`, `core_engine/src/types/EventContracts.ts#SnapshotPayload`, `core_engine/src/types/EventContracts.ts#SnapshotReference`, `core_engine/src/types/EventContracts.ts#VariableUsage`, `core_engine/src/types/EventContracts.ts#WarningEvent`, `core_engine/src/types/EventContracts.ts#WarningMetric`, `core_engine/src/types/HARContracts.ts#HAREntry`, `core_engine/src/types/HARContracts.ts#HARRefinementOptions`, `core_engine/src/types/ReportingContracts.ts#CiSummary`, `core_engine/src/types/ReportingContracts.ts#CiTransactionSummary`, `core_engine/src/types/ReportingContracts.ts#ReportBundle`, `core_engine/src/types/ReportingContracts.ts#ReportBundleConfig`, `core_engine/src/types/ReportingContracts.ts#ReportBundleMeta`, `core_engine/src/types/ReportingContracts.ts#RunSummaryFile`, `core_engine/src/types/ReportingContracts.ts#TimeSeriesFile`, `core_engine/src/types/ReportingContracts.ts#TimeSeriesPoint`, `core_engine/src/types/ReportingContracts.ts#TransactionMetricRow`, `core_engine/src/types/ReportingContracts.ts#TransactionMetricsFile`, `core_engine/src/types/ReportingContracts.ts#TransactionSeries`, `core_engine/src/types/ReportingContracts.ts#normalizeTransactionSeries`, `core_engine/src/types/TestPlanSchema.ts#DataOverflowStrategy`, `core_engine/src/types/TestPlanSchema.ts#DebugSettings`, `core_engine/src/types/TestPlanSchema.ts#ExecutionMode`, `core_engine/src/types/TestPlanSchema.ts#ExecutorType`, `core_engine/src/types/TestPlanSchema.ts#GlobalLoadProfile`, `core_engine/src/types/TestPlanSchema.ts#GlobalSLADefinition`, `core_engine/src/types/TestPlanSchema.ts#HybridGroup`, `core_engine/src/types/TestPlanSchema.ts#LoadStage`, `core_engine/src/types/TestPlanSchema.ts#SLADefinition`, `core_engine/src/types/TestPlanSchema.ts#TestPlan`, `core_engine/src/types/TestPlanSchema.ts#UserJourney`, `core_engine/src/types/TestPlanSchema.ts#WorkloadModelType`, `core_engine/src/utils/LiveConsoleLogStream.ts#LIVE_CONSOLE_POLL_MS`, `core_engine/src/utils/LiveConsoleLogStream.ts#startLiveConsoleLogStream`, `core_engine/src/utils/PathResolver.ts#PathResolution`, `core_engine/src/utils/PathResolver.ts#PathResolver`, `core_engine/src/utils/ProgressBar.ts#ProgressBar`, `core_engine/src/utils/ProgressBar.ts#ansi`, `core_engine/src/utils/ProgressBar.ts#createSpinner`, `core_engine/src/utils/ProgressBar.ts#isColorEnabled`, `core_engine/src/utils/autoHeaders.ts#StoredHeader`, `core_engine/src/utils/autoHeaders.ts#_autoHeaders`, `core_engine/src/utils/autoHeaders.ts#_onceHeaders`, `core_engine/src/utils/autoHeaders.ts#addAutoHeader`, `core_engine/src/utils/autoHeaders.ts#addAutoHeaders`, `core_engine/src/utils/autoHeaders.ts#addHeaderOnce`, `core_engine/src/utils/autoHeaders.ts#clearAutoHeaders`, `core_engine/src/utils/autoHeaders.ts#getAutoHeaders`, `core_engine/src/utils/autoHeaders.ts#mergeRequestHeaders`, `core_engine/src/utils/autoHeaders.ts#removeAutoHeader`, `core_engine/src/utils/dataWriter.ts#FILE_TAG`, `core_engine/src/utils/dataWriter.ts#WriteDataOptions`, `core_engine/src/utils/dataWriter.ts#writeData`, `core_engine/src/utils/extract.ts#ExtractableResponse`, `core_engine/src/utils/extract.ts#asResultString`, `core_engine/src/utils/extract.ts#bodyString`, `core_engine/src/utils/extract.ts#extractBoundary`, `core_engine/src/utils/extract.ts#extractCookie`, `core_engine/src/utils/extract.ts#extractHeader`, `core_engine/src/utils/extract.ts#extractJson`, `core_engine/src/utils/extract.ts#extractRegex`, `core_engine/src/utils/extract.ts#navigate`, `core_engine/src/utils/extract.ts#queryParamFromUrl`, `core_engine/src/utils/lifecycle.ts#CurvePoint`, `core_engine/src/utils/lifecycle.ts#EndFamily`, `core_engine/src/utils/lifecycle.ts#EndPlan`, `core_engine/src/utils/lifecycle.ts#JourneyContext`, `core_engine/src/utils/lifecycle.ts#JourneyLifecycleStore`, `core_engine/src/utils/lifecycle.ts#JourneyState`, `core_engine/src/utils/lifecycle.ts#LIFECYCLE_END_SAFETY_MS`, `core_engine/src/utils/lifecycle.ts#PhaseFns`, `core_engine/src/utils/lifecycle.ts#PhaseMetadata`, `core_engine/src/utils/lifecycle.ts#RuntimeMetadata`, `core_engine/src/utils/lifecycle.ts#TimelineStage`, `core_engine/src/utils/lifecycle.ts#TransactionGate`, `core_engine/src/utils/lifecycle.ts#__ENV`, `core_engine/src/utils/lifecycle.ts#_currentPhase`, `core_engine/src/utils/lifecycle.ts#activeEndPlan`, `core_engine/src/utils/lifecycle.ts#applyPacing`, `core_engine/src/utils/lifecycle.ts#arrivalNoticePrinted`, `core_engine/src/utils/lifecycle.ts#buildVuCurve`, `core_engine/src/utils/lifecycle.ts#computeEndPlan`, `core_engine/src/utils/lifecycle.ts#createContext`, `core_engine/src/utils/lifecycle.ts#createJourneyLifecycleStore`, `core_engine/src/utils/lifecycle.ts#createState`, `core_engine/src/utils/lifecycle.ts#createTrackedProxy`, `core_engine/src/utils/lifecycle.ts#frameworkIterations`, `core_engine/src/utils/lifecycle.ts#getPhaseMetadata`, `core_engine/src/utils/lifecycle.ts#getRuntimeMetadata`, `core_engine/src/utils/lifecycle.ts#getTransactionGate`, `core_engine/src/utils/lifecycle.ts#handlePhaseError`, `core_engine/src/utils/lifecycle.ts#interpolateTarget`, `core_engine/src/utils/lifecycle.ts#isEndDueAfter`, `core_engine/src/utils/lifecycle.ts#isEndDueBefore`, `core_engine/src/utils/lifecycle.ts#isEnding`, `core_engine/src/utils/lifecycle.ts#parseJsonEnv`, `core_engine/src/utils/lifecycle.ts#runJourneyLifecycle`, `core_engine/src/utils/lifecycle.ts#runSafely`, `core_engine/src/utils/lifecycle.ts#terminalDeadlineMs`, `core_engine/src/utils/lifecycle.ts#thinktime`, `core_engine/src/utils/logger.ts#Logger`, `core_engine/src/utils/logger.ts#ansi`, `core_engine/src/utils/logger.ts#isColorEnabled`, `core_engine/src/utils/logger.ts#levelStyles`, `core_engine/src/utils/replayLogger.ts#BINARY_CONTENT_RE`, `core_engine/src/utils/replayLogger.ts#BINARY_MIME_TYPES`, `core_engine/src/utils/replayLogger.ts#Cookie`, `core_engine/src/utils/replayLogger.ts#ExchangeMeta`, `core_engine/src/utils/replayLogger.ts#K6Response`, `core_engine/src/utils/replayLogger.ts#NormalizedHeader`, `core_engine/src/utils/replayLogger.ts#RequestDefinition`, `core_engine/src/utils/replayLogger.ts#RequestInfo`, `core_engine/src/utils/replayLogger.ts#STATIC_EXT_RE`, `core_engine/src/utils/replayLogger.ts#VariableEvent`, `core_engine/src/utils/replayLogger.ts#VariableRegistryEntry`, `core_engine/src/utils/replayLogger.ts#_GENERIC_SOURCES`, `core_engine/src/utils/replayLogger.ts#__ENV`, `core_engine/src/utils/replayLogger.ts#_variableRegistry`, `core_engine/src/utils/replayLogger.ts#binaryBodyPlaceholder`, `core_engine/src/utils/replayLogger.ts#callerScriptLocation`, `core_engine/src/utils/replayLogger.ts#createVariableEvent`, `core_engine/src/utils/replayLogger.ts#currentIteration`, `core_engine/src/utils/replayLogger.ts#currentVu`, `core_engine/src/utils/replayLogger.ts#detectVariableEvents`, `core_engine/src/utils/replayLogger.ts#extractCookies`, `core_engine/src/utils/replayLogger.ts#extractJarCookies`, `core_engine/src/utils/replayLogger.ts#extractK6ResponseCookies`, `core_engine/src/utils/replayLogger.ts#extractQueryParams`, `core_engine/src/utils/replayLogger.ts#iterationState`, `core_engine/src/utils/replayLogger.ts#logExchange`, `core_engine/src/utils/replayLogger.ts#logReplayExchange`, `core_engine/src/utils/replayLogger.ts#nextRequestSequence`, `core_engine/src/utils/replayLogger.ts#normalizeHeaders`, `core_engine/src/utils/replayLogger.ts#resolveVariableSource`, `core_engine/src/utils/replayLogger.ts#trackAuto`, `core_engine/src/utils/replayLogger.ts#trackCorrelation`, `core_engine/src/utils/replayLogger.ts#trackDataRow`, `core_engine/src/utils/replayLogger.ts#trackParameter`, `core_engine/src/utils/request.ts#CookieValue`, `core_engine/src/utils/request.ts#HttpMethod`, `core_engine/src/utils/request.ts#HttpRuntimeConfig`, `core_engine/src/utils/request.ts#LastRequestContext`, `core_engine/src/utils/request.ts#RequestBody`, `core_engine/src/utils/request.ts#RequestOptions`, `core_engine/src/utils/request.ts#RequestReplayMeta`, `core_engine/src/utils/request.ts#STRIP_HEADERS`, `core_engine/src/utils/request.ts#SnapshotConfig`, `core_engine/src/utils/request.ts#__ENV`, `core_engine/src/utils/request.ts#_capHitWarned`, `core_engine/src/utils/request.ts#_httpConfigCache`, `core_engine/src/utils/request.ts#_iterationRequestCount`, `core_engine/src/utils/request.ts#_lastRequestContext`, `core_engine/src/utils/request.ts#_reqIdByResponse`, `core_engine/src/utils/request.ts#_snapshotConfigCache`, `core_engine/src/utils/request.ts#_snapshotCount`, `core_engine/src/utils/request.ts#_snapshottedResponses`, `core_engine/src/utils/request.ts#applyErrorBehaviorForStatus`, `core_engine/src/utils/request.ts#captureRequestSnapshot`, `core_engine/src/utils/request.ts#captureSnapshotFromLastRequest`, `core_engine/src/utils/request.ts#emitDeferredFailureSnapshot`, `core_engine/src/utils/request.ts#emitSnapshotEvent`, `core_engine/src/utils/request.ts#getHttpRuntimeConfig`, `core_engine/src/utils/request.ts#getRequestIdForResponse`, `core_engine/src/utils/request.ts#getRuntimeErrorBehavior`, `core_engine/src/utils/request.ts#getSnapshotConfig`, `core_engine/src/utils/request.ts#nextRequestId`, `core_engine/src/utils/request.ts#recordRequestContextForSnapshot`, `core_engine/src/utils/request.ts#request`, `core_engine/src/utils/request.ts#sanitizeHeaders`, `core_engine/src/utils/request.ts#serializeBodyForLog`, `core_engine/src/utils/session.ts#ResolveFrameworkUrlOptions`, `core_engine/src/utils/session.ts#TeamEnvironmentOverride`, `core_engine/src/utils/session.ts#__ENV`, `core_engine/src/utils/session.ts#_primaryBaseUrl`, `core_engine/src/utils/session.ts#_registeredUrls`, `core_engine/src/utils/session.ts#clearCookies`, `core_engine/src/utils/session.ts#deleteCookie`, `core_engine/src/utils/session.ts#getApiKey`, `core_engine/src/utils/session.ts#getEnvContext`, `core_engine/src/utils/session.ts#getFrameworkBaseUrl`, `core_engine/src/utils/session.ts#getFrameworkServiceUrls`, `core_engine/src/utils/session.ts#isAbsoluteUrl`, `core_engine/src/utils/session.ts#joinBaseAndPath`, `core_engine/src/utils/session.ts#normalizeBaseUrl`, `core_engine/src/utils/session.ts#parseJsonEnv`, `core_engine/src/utils/session.ts#registerBaseUrl`, `core_engine/src/utils/session.ts#registerFrameworkEnvironmentUrls`, `core_engine/src/utils/session.ts#resolveFrameworkUrl`, `core_engine/src/utils/session.ts#resolvePath`, `core_engine/src/utils/transaction.ts#__ENV`, `core_engine/src/utils/transaction.ts#_activeTransaction`, `core_engine/src/utils/transaction.ts#_currentIterationFailed`, `core_engine/src/utils/transaction.ts#_uncheckedFailingResponses`, `core_engine/src/utils/transaction.ts#_vuTerminated`, `core_engine/src/utils/transaction.ts#endTransaction`, `core_engine/src/utils/transaction.ts#extractScriptLocation`, `core_engine/src/utils/transaction.ts#formatStackSnippet`, `core_engine/src/utils/transaction.ts#getCurrentTransaction`, `core_engine/src/utils/transaction.ts#getRuntimeErrorBehavior`, `core_engine/src/utils/transaction.ts#initTransactions`, `core_engine/src/utils/transaction.ts#isJsRuntimeError`, `core_engine/src/utils/transaction.ts#isVuTerminated`, `core_engine/src/utils/transaction.ts#k6Check`, `core_engine/src/utils/transaction.ts#recordFailingResponse`, `core_engine/src/utils/transaction.ts#startTransaction`, `core_engine/src/utils/transaction.ts#transaction`, `core_engine/src/utils/transaction.ts#txnCounters`, `core_engine/src/utils/transaction.ts#txnResults`, `core_engine/src/utils/transaction.ts#txnStarts`, `core_engine/src/utils/transaction.ts#txnTrends`

### CLAUDE.md

Layer: repository  
Lines: 26  
Purpose: CLAUDE.md - - Front door: [FrameworkAtlas.md](FrameworkAtlas.md) — routes to every feature's owning files.

### config/correlation-rules/auto-correlation.defaults.json

Layer: configuration  
Lines: 22  
Purpose: Framework file. Top-level keys: version, _meta, minValueLength, vocabulary, denyValues, thresholds.
  
Top-level keys: `version`, `_meta`, `minValueLength`, `vocabulary`, `denyValues`, `thresholds`

### config/environments/dev.json

Layer: configuration  
Lines: 18  
Purpose: Framework file. Top-level keys: $schema, name, testSuites.
  
Top-level keys: `$schema`, `name`, `testSuites`

### config/runtime_settings/default.json

Layer: configuration  
Lines: 57  
Purpose: Runtime behavior profile controlling execution, errors, reporting, and diagnostics. Top-level keys: $schema, thinkTime, pacing, http, errorBehavior, reporting, errors, monitoring, debugMode.
  
Top-level keys: `$schema`, `thinkTime`, `pacing`, `http`, `errorBehavior`, `reporting`, `errors`, `monitoring`, `debugMode`

### config/schemas/environment.schema.json

Layer: configuration  
Lines: 53  
Purpose: JSON Schema contract used for validation and IDE assistance. Top-level keys: $schema, $id, title, description, type, required, additionalProperties, properties.
  
Top-level keys: `$schema`, `$id`, `title`, `description`, `type`, `required`, `additionalProperties`, `properties`

### config/schemas/runtime_settings.schema.json

Layer: configuration  
Lines: 263  
Purpose: JSON Schema contract used for validation and IDE assistance. Top-level keys: $schema, $id, title, description, type, required, additionalProperties, properties.
  
Top-level keys: `$schema`, `$id`, `title`, `description`, `type`, `required`, `additionalProperties`, `properties`

### config/schemas/test_plan.schema.json

Layer: configuration  
Lines: 300  
Purpose: JSON Schema contract used for validation and IDE assistance. Top-level keys: $schema, $id, title, description, type, required, additionalProperties, definitions, properties.
  
Top-level keys: `$schema`, `$id`, `title`, `description`, `type`, `required`, `additionalProperties`, `definitions`, `properties`

### config/test_plans/debug_test.json

Layer: configuration  
Lines: 38  
Purpose: Executable test plan or reusable workload template. Top-level keys: name, environment, execution_mode, global_load_profile, noCookiesReset, debug, user_journeys.
  
Top-level keys: `name`, `environment`, `execution_mode`, `global_load_profile`, `noCookiesReset`, `debug`, `user_journeys`

### config/test_plans/load_test copy.json

Layer: configuration  
Lines: 63  
Purpose: Executable test plan or reusable workload template. Top-level keys: $schema, name, environment, execution_mode, global_load_profile, noCookiesReset, user_journeys, global_sla, journey_slas, transaction_slas.
  
Top-level keys: `$schema`, `name`, `environment`, `execution_mode`, `global_load_profile`, `noCookiesReset`, `user_journeys`, `global_sla`, `journey_slas`, `transaction_slas`

### config/test_plans/load_test.json

Layer: configuration  
Lines: 44  
Purpose: Executable test plan or reusable workload template. Top-level keys: $schema, name, environment, execution_mode, global_load_profile, noCookiesReset, user_journeys, global_sla, journey_slas.
  
Top-level keys: `$schema`, `name`, `environment`, `execution_mode`, `global_load_profile`, `noCookiesReset`, `user_journeys`, `global_sla`, `journey_slas`

### config/test_plans/templates/constant_arrival_rate.json

Layer: configuration  
Lines: 25  
Purpose: Executable test plan or reusable workload template. Top-level keys: name, environment, execution_mode, global_load_profile, user_journeys, global_sla.
  
Top-level keys: `name`, `environment`, `execution_mode`, `global_load_profile`, `user_journeys`, `global_sla`

### config/test_plans/templates/constant_vus.json

Layer: configuration  
Lines: 22  
Purpose: Executable test plan or reusable workload template. Top-level keys: name, environment, execution_mode, global_load_profile, user_journeys, global_sla.
  
Top-level keys: `name`, `environment`, `execution_mode`, `global_load_profile`, `user_journeys`, `global_sla`

### config/test_plans/templates/externally_controlled.json

Layer: configuration  
Lines: 23  
Purpose: Executable test plan or reusable workload template. Top-level keys: name, environment, execution_mode, global_load_profile, user_journeys, global_sla.
  
Top-level keys: `name`, `environment`, `execution_mode`, `global_load_profile`, `user_journeys`, `global_sla`

### config/test_plans/templates/per_vu_iterations.json

Layer: configuration  
Lines: 22  
Purpose: Executable test plan or reusable workload template. Top-level keys: name, environment, execution_mode, global_load_profile, user_journeys, global_sla.
  
Top-level keys: `name`, `environment`, `execution_mode`, `global_load_profile`, `user_journeys`, `global_sla`

### config/test_plans/templates/ramping_arrival_rate.json

Layer: configuration  
Lines: 28  
Purpose: Executable test plan or reusable workload template. Top-level keys: name, environment, execution_mode, global_load_profile, user_journeys, global_sla.
  
Top-level keys: `name`, `environment`, `execution_mode`, `global_load_profile`, `user_journeys`, `global_sla`

### config/test_plans/templates/ramping_vus.json

Layer: configuration  
Lines: 26  
Purpose: Executable test plan or reusable workload template. Top-level keys: name, environment, execution_mode, global_load_profile, user_journeys, global_sla.
  
Top-level keys: `name`, `environment`, `execution_mode`, `global_load_profile`, `user_journeys`, `global_sla`

### config/test_plans/templates/shared_iterations.json

Layer: configuration  
Lines: 22  
Purpose: Executable test plan or reusable workload template. Top-level keys: name, environment, execution_mode, global_load_profile, user_journeys, global_sla.
  
Top-level keys: `name`, `environment`, `execution_mode`, `global_load_profile`, `user_journeys`, `global_sla`

### config/test_plans/webui_load_test.json

Layer: configuration  
Lines: 49  
Purpose: Executable test plan or reusable workload template. Top-level keys: $schema, name, environment, execution_mode, global_load_profile, noCookiesReset, debug, user_journeys, global_sla.
  
Top-level keys: `$schema`, `name`, `environment`, `execution_mode`, `global_load_profile`, `noCookiesReset`, `debug`, `user_journeys`, `global_sla`

### core_engine/DOCS_METHODS.md

Layer: repository  
Lines: 550  
Purpose: Core Engine Method Documentation - ---

### docs/cli-reference.md

Layer: documentation  
Lines: 310  
Purpose: CLI Reference - <!-- GENERATED by tools/gen-cli-reference.js — DO NOT EDIT. Regenerate: npm run docs:index -->

### docs/CODE_LEVEL_ROADMAP.md

Layer: documentation  
Lines: 397  
Purpose: ️ Code-Level Learning Roadmap: K6-PerfFramework - > A structured, file-by-file learning path. Follow the phases in order — each builds on the previous one.

### docs/configuration-reference.md

Layer: documentation  
Lines: 103  
Purpose: K6-PerfFramework Configuration Reference - *(Auto-generated from JSON Schemas)*

### docs/configuration.md

Layer: documentation  
Lines: 55  
Purpose: Configuration Guide - > Task-oriented guide. Distilled from [EDD-config](../engineering_docs/edd/EDD-config.md) and the root

### docs/distributed-loadtest-runbook.md

Layer: documentation  
Lines: 215  
Purpose: Distributed Load Test — Operator Runbook - Run **one** load test across several machines and get **one merged report**, watch it **live**, and

### docs/examples/README.md

Layer: documentation  
Lines: 29  
Purpose: Examples - > Pointer page. The runnable examples in this repo are the team suites and the built-in templates.

### docs/faq.md

Layer: documentation  
Lines: 42  
Purpose: FAQ - > Distilled from the engineering docs (`engineering_docs/`) and the root `README.md`.

### docs/getting-started.md

Layer: documentation  
Lines: 101  
Purpose: Getting Started - > Derived from the root `README.md`. Assumes you've finished [Installation](installation.md).

### docs/index.md

Layer: documentation  
Lines: 32  
Purpose: K6-PerfFramework Documentation - Published user documentation (Layer 3). For architecture/internals see `engineering_docs/` (L2);

### docs/installation.md

Layer: documentation  
Lines: 66  
Purpose: Installation - > Derived from the root `README.md` (Prerequisites + First-Time Setup).

### docs/K6_PerfFramework_Technical_Reference.md

Layer: documentation  
Lines: 4765  
Purpose: K6 Performance Framework Technical Reference - Generated: 2026-06-01T15:48:10.902Z

### docs/migration.md

Layer: documentation  
Lines: 61  
Purpose: Migration: Existing k6 → Framework - > Derived from the recording/convert feature ([features/recording](../engineering_docs/features/recording.md)) and

### docs/onboarding/day-1.md

Layer: documentation  
Lines: 84  
Purpose: Day 1: Zero to First Passing Run - > A guided checklist for a new engineer. Everything here uses only published docs. Tick each box.

### docs/onboarding/KT_Guide.md

Layer: documentation  
Lines: 243  
Purpose: K6 Performance Framework: Comprehensive Deep-Dive Guide - > **Refreshed 2026-07-13** to match the current code. This guide is a file-by-file tour for a new

### docs/onboarding/KT_Low_Level_Deep_Dive.md

Layer: documentation  
Lines: 201  
Purpose: K6 Performance Framework: Low-Level Engineering Deep Dive - > **Refreshed 2026-07-13** to match the current code. This is the mechanism-level companion to the

### docs/onboarding/KT_Presentation.md

Layer: documentation  
Lines: 132  
Purpose: Presentation Outline: K6 Performance Framework - > **Refreshed 2026-07-13** to match the current code. Use this to frame a talk; for the code-cited

### docs/onboarding/mental-model.md

Layer: documentation  
Lines: 91  
Purpose: Mental Model - > The concepts that make the rest of the framework obvious. Distilled from the engineering docs

### docs/onboarding/README.md

Layer: documentation  
Lines: 27  
Purpose: Onboarding - New to the framework? Follow this path. It gets a new engineer from a clean machine to a first passing

### docs/presentation/architecture-deck.md

Layer: documentation  
Lines: 128  
Purpose: K6-PerfFramework - <!-- GENERATED by tools/gen-presentation.js — DO NOT EDIT. Regenerate: npm run docs:index -->

### docs/release-notes.md

Layer: documentation  
Lines: 79  
Purpose: Release Notes - > Distilled from `ai_context/todos.md` (completed work) and the frozen `archive/Framework-Change-Log.md`.

### docs/troubleshooting.md

Layer: documentation  
Lines: 33  
Purpose: Troubleshooting - > Derived from the root `README.md` troubleshooting section plus the "Known limitations" of the

### engineering_docs/adr/0001-dx-simplification-proposals.md

Layer: repository  
Lines: 1121  
Purpose: Design Proposals - > Approved architectural proposals awaiting implementation.

### engineering_docs/adr/0002-lifecycle-redesign.md

Layer: repository  
Lines: 223  
Purpose: Lifecycle Redesign — Design Proposal - > **AI fast-path:** metadata is lines 1–10; the proposal body starts at **line 11** (`## 1. Problem & Objective`). Jump straight there.

### engineering_docs/adr/README.md

Layer: repository  
Lines: 23  
Purpose: Architecture Decision Records - ---

### engineering_docs/distributed-loadtest-progress.md

Layer: repository  
Lines: 127  
Purpose: Distributed Load Test — Build Progress Tracker - Living status of every feature in the distributed load-test capability.

### engineering_docs/edd/EDD-auto-correlation.md

Layer: repository  
Lines: 127  
Purpose: EDD: Smart Auto-Correlation - ---

### engineering_docs/edd/EDD-config.md

Layer: repository  
Lines: 124  
Purpose: EDD: Configuration Resolution - ---

### engineering_docs/edd/EDD-debug-replay.md

Layer: repository  
Lines: 127  
Purpose: EDD: Debug Replay & Diff - ---

### engineering_docs/edd/EDD-distributed-loadtest.md

Layer: repository  
Lines: 300  
Purpose: EDD: Distributed Load Test (Manual / Shared-Location) - ---

### engineering_docs/edd/EDD-lifecycle.md

Layer: repository  
Lines: 193  
Purpose: EDD: VU Lifecycle & Phase Envelope - ---

### engineering_docs/edd/EDD-reporting.md

Layer: repository  
Lines: 126  
Purpose: EDD: Artifact-First Reporting & Thresholds - ---

### engineering_docs/edd/README.md

Layer: repository  
Lines: 20  
Purpose: Full Engineering Design Documents - ---

### engineering_docs/features/cli.md

Layer: repository  
Lines: 40  
Purpose: CLI Command Surface (Mini-EDD) - ---

### engineering_docs/features/data.md

Layer: repository  
Lines: 39  
Purpose: Test Data Management (Mini-EDD) - ---

### engineering_docs/features/execution.md

Layer: repository  
Lines: 40  
Purpose: k6 Process Execution (Mini-EDD) - ---

### engineering_docs/features/legacy-correlation.md

Layer: repository  
Lines: 38  
Purpose: Legacy Runtime Rule Engine (Mini-EDD) - ---

### engineering_docs/features/README.md

Layer: repository  
Lines: 15  
Purpose: Mini-EDDs - ---

### engineering_docs/features/recording.md

Layer: repository  
Lines: 42  
Purpose: Recording → Script Generation (Mini-EDD) - ---

### engineering_docs/features/reporters.md

Layer: repository  
Lines: 37  
Purpose: External Reporters (Mini-EDD) — STUBS - ---

### engineering_docs/features/scenario.md

Layer: repository  
Lines: 39  
Purpose: Scenario & Workload Modeling (Mini-EDD) - ---

### engineering_docs/features/vu-runtime.md

Layer: repository  
Lines: 40  
Purpose: k6-side VU Runtime Helpers (Mini-EDD) - ---

### engineering_docs/README.md

Layer: repository  
Lines: 38  
Purpose: Engineering Documentation (Layer 2) - ---

### engineering_docs/runtime/README.md

Layer: repository  
Lines: 15  
Purpose: k6-side Runtime Model - ---

### engineering_docs/templates/adr.md

Layer: repository  
Lines: 28  
Purpose: ADR-NNNN: <decision> - ---

### engineering_docs/templates/full-edd.md

Layer: repository  
Lines: 86  
Purpose: EDD: <Subsystem> - ---

### engineering_docs/templates/mini-edd.md

Layer: repository  
Lines: 36  
Purpose: <Feature> (Mini-EDD) - ---

### engineering_docs/testing/README.md

Layer: repository  
Lines: 25  
Purpose: Testing Strategy & Inventory - ---

### FrameworkAtlas.md

Layer: repository  
Lines: 88  
Purpose: Framework Atlas - ---

### graph.html

Layer: repository  
Lines: 993  
Purpose: Framework file.

### improved-doc-architecture-prompt.md

Layer: repository  
Lines: 91  
Purpose: ROLE - You are the Documentation Architect for this repository (K6-PerfFramework).

### k6log.log

Layer: repository  
Lines: 10927  
Purpose: Framework file.

### package-lock.json

Layer: repository  
Lines: 903  
Purpose: Framework file. Top-level keys: name, version, lockfileVersion, requires, packages.
  
Top-level keys: `name`, `version`, `lockfileVersion`, `requires`, `packages`

### package.json

Layer: repository  
Lines: 82  
Purpose: Framework file. Top-level keys: name, version, description, keywords, homepage, bugs, repository, license, author, type, main, types, bin, scripts, dependencies, devDependencies.
  
Top-level keys: `name`, `version`, `description`, `keywords`, `homepage`, `bugs`, `repository`, `license`, `author`, `type`, `main`, `types`, `bin`, `scripts`, `dependencies`, `devDependencies`

### README.md

Layer: repository  
Lines: 432  
Purpose: K6 Performance Framework - A TypeScript-powered performance testing framework on top of Grafana k6. The framework helps teams organize k6 scripts into scrum-suite folders, generate scripts from HAR recordings, validate configuration before execution, run load/debug test plans, and produce structured reports for humans and CI.

### templates/runtime_settings/ci-pipeline.jsonc

Layer: templates  
Lines: 21  
Purpose: Runtime behavior profile controlling execution, errors, reporting, and diagnostics. Top-level keys: $schema, _meta, thinkTime, pacing, http, errorBehavior, reporting, errors, monitoring, debugMode.
  
Top-level keys: `$schema`, `_meta`, `thinkTime`, `pacing`, `http`, `errorBehavior`, `reporting`, `errors`, `monitoring`, `debugMode`

### templates/runtime_settings/local-debug.jsonc

Layer: templates  
Lines: 28  
Purpose: Runtime behavior profile controlling execution, errors, reporting, and diagnostics. Top-level keys: $schema, _meta, thinkTime, pacing, http, errorBehavior, reporting, errors, monitoring, debugMode.
  
Top-level keys: `$schema`, `_meta`, `thinkTime`, `pacing`, `http`, `errorBehavior`, `reporting`, `errors`, `monitoring`, `debugMode`

### templates/runtime_settings/max-throughput.jsonc

Layer: templates  
Lines: 21  
Purpose: Runtime behavior profile controlling execution, errors, reporting, and diagnostics. Top-level keys: $schema, _meta, thinkTime, pacing, http, errorBehavior, reporting, errors, monitoring, debugMode.
  
Top-level keys: `$schema`, `_meta`, `thinkTime`, `pacing`, `http`, `errorBehavior`, `reporting`, `errors`, `monitoring`, `debugMode`

### templates/runtime_settings/strict-sla.jsonc

Layer: templates  
Lines: 21  
Purpose: Runtime behavior profile controlling execution, errors, reporting, and diagnostics. Top-level keys: $schema, _meta, thinkTime, pacing, http, errorBehavior, reporting, errors, monitoring, debugMode.
  
Top-level keys: `$schema`, `_meta`, `thinkTime`, `pacing`, `http`, `errorBehavior`, `reporting`, `errors`, `monitoring`, `debugMode`

### templates/test_plans/breakpoint.jsonc

Layer: templates  
Lines: 26  
Purpose: Executable test plan or reusable workload template. Top-level keys: $schema, _meta, name, environment, execution_mode, global_load_profile, user_journeys.
  
Top-level keys: `$schema`, `_meta`, `name`, `environment`, `execution_mode`, `global_load_profile`, `user_journeys`

### templates/test_plans/load.jsonc

Layer: templates  
Lines: 32  
Purpose: Executable test plan or reusable workload template. Top-level keys: $schema, _meta, name, environment, execution_mode, global_load_profile, user_journeys, global_sla.
  
Top-level keys: `$schema`, `_meta`, `name`, `environment`, `execution_mode`, `global_load_profile`, `user_journeys`, `global_sla`

### templates/test_plans/multi-spike.jsonc

Layer: templates  
Lines: 47  
Purpose: Executable test plan or reusable workload template. Top-level keys: $schema, _meta, name, environment, execution_mode, global_load_profile, user_journeys, global_sla.
  
Top-level keys: `$schema`, `_meta`, `name`, `environment`, `execution_mode`, `global_load_profile`, `user_journeys`, `global_sla`

### templates/test_plans/smoke.jsonc

Layer: templates  
Lines: 23  
Purpose: Executable test plan or reusable workload template. Top-level keys: $schema, _meta, name, environment, execution_mode, global_load_profile, user_journeys.
  
Top-level keys: `$schema`, `_meta`, `name`, `environment`, `execution_mode`, `global_load_profile`, `user_journeys`

### templates/test_plans/soak.jsonc

Layer: templates  
Lines: 28  
Purpose: Executable test plan or reusable workload template. Top-level keys: $schema, _meta, name, environment, execution_mode, global_load_profile, user_journeys.
  
Top-level keys: `$schema`, `_meta`, `name`, `environment`, `execution_mode`, `global_load_profile`, `user_journeys`

### templates/test_plans/spike.jsonc

Layer: templates  
Lines: 30  
Purpose: Executable test plan or reusable workload template. Top-level keys: $schema, _meta, name, environment, execution_mode, global_load_profile, user_journeys.
  
Top-level keys: `$schema`, `_meta`, `name`, `environment`, `execution_mode`, `global_load_profile`, `user_journeys`

### templates/test_plans/step-up.jsonc

Layer: templates  
Lines: 42  
Purpose: Executable test plan or reusable workload template. Top-level keys: $schema, _meta, name, environment, execution_mode, global_load_profile, user_journeys, global_sla.
  
Top-level keys: `$schema`, `_meta`, `name`, `environment`, `execution_mode`, `global_load_profile`, `user_journeys`, `global_sla`

### templates/test_plans/stress.jsonc

Layer: templates  
Lines: 31  
Purpose: Executable test plan or reusable workload template. Top-level keys: $schema, _meta, name, environment, execution_mode, global_load_profile, user_journeys.
  
Top-level keys: `$schema`, `_meta`, `name`, `environment`, `execution_mode`, `global_load_profile`, `user_journeys`

### testSuites/b2b_new/recordings/.recording-index.json

Layer: test suite  
Lines: 8  
Purpose: Framework file. Contains a JSON array value.

### testSuites/b2b_new/recordings/raw_buyanimal_07may.recording-log.json

Layer: test suite  
Lines: 3596  
Purpose: Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content.

### testSuites/Jpet_new/data/pet.csv

Layer: test suite  
Lines: 5  
Purpose: CSV data file with 3 data rows. Columns: p_pet.

### testSuites/Jpet_new/data/userdetails.csv

Layer: test suite  
Lines: 2  
Purpose: CSV data file with 1 data rows. Columns: p_username,p_password.

### testSuites/Jpet_new/recordings/.recording-index.json

Layer: test suite  
Lines: 32  
Purpose: Framework file. Contains a JSON array value.

### testSuites/Jpet_new/recordings/buyanimal_raw_19thmay.recording-log.json

Layer: test suite  
Lines: 3635  
Purpose: Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content.

### testSuites/Jpet_new/recordings/buyanimal_raw_20thmay.recording-log.json

Layer: test suite  
Lines: 3635  
Purpose: Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content.

### testSuites/Jpet_new/recordings/buyanimal_raw_25thmay.recording-log.json

Layer: test suite  
Lines: 3635  
Purpose: Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content.

### testSuites/Jpet_new/recordings/buyanimal_raw_28thmay.correlation.json

Layer: test suite  
Lines: 250  
Purpose: Framework file. Top-level keys: version, generatedAt, source, candidates.
  
Top-level keys: `version`, `generatedAt`, `source`, `candidates`

### testSuites/Jpet_new/recordings/buyanimal_raw_28thmay.recording-log.json

Layer: test suite  
Lines: 3635  
Purpose: Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content.

### testSuites/Jpet_new/recordings/buydog_jpetstore.aspectran.com - 2026-06-08.har

Layer: test suite  
Lines: 11529  
Purpose: Recorded HTTP archive used for script generation and replay comparison. Top-level keys: log.
  
Top-level keys: `log`

### testSuites/Jpet_new/recordings/raw_buyanimal_07thMay.recording-log.json

Layer: test suite  
Lines: 3596  
Purpose: Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content.

### testSuites/jpet_team/data/pet.csv

Layer: test suite  
Lines: 5  
Purpose: CSV data file with 3 data rows. Columns: p_pet.

### testSuites/jpet_team/data/userdetails.csv

Layer: test suite  
Lines: 2  
Purpose: CSV data file with 1 data rows. Columns: p_username,p_password.

### testSuites/jpet_team/recordings/.recording-index.json

Layer: test suite  
Lines: 26  
Purpose: Framework file. Contains a JSON array value.

### testSuites/jpet_team/recordings/buyanimal_raw.recording-log.json

Layer: test suite  
Lines: 4018  
Purpose: Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content.

### testSuites/jpet_team/recordings/jpet-login-test.recording-log.json

Layer: test suite  
Lines: 3635  
Purpose: Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content.

### testSuites/jpet_team/recordings/jpetstore.aspectran.com - login logout.har

Layer: test suite  
Lines: 7471  
Purpose: Recorded HTTP archive used for script generation and replay comparison. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content.

### testSuites/jpet_team/recordings/jpetstore.aspectran.com_animals.har

Layer: test suite  
Lines: 11745  
Purpose: Recorded HTTP archive used for script generation and replay comparison. Top-level keys: log.
  
Top-level keys: `log`

### testSuites/jpet_team/recordings/jpetstore.aspectran.com_buydog_1.recording-log.json

Layer: test suite  
Lines: 3635  
Purpose: Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content.

### testSuites/jpet_team/recordings/jpetstore.aspectran.com_buydog.har

Layer: test suite  
Lines: 11745  
Purpose: Recorded HTTP archive used for script generation and replay comparison. Top-level keys: log.
  
Top-level keys: `log`

### testSuites/jpet_team/recordings/jpetstore.aspectran.com_buydog.recording-log.correlation.json

Layer: test suite  
Lines: 250  
Purpose: Framework file. Top-level keys: version, generatedAt, source, candidates.
  
Top-level keys: `version`, `generatedAt`, `source`, `candidates`

### testSuites/jpet_team/recordings/jpetstore.aspectran.com_buydog.recording-log.json

Layer: test suite  
Lines: 3635  
Purpose: Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content.

### testSuites/sample_team/data/p_users.csv

Layer: test suite  
Lines: 5  
Purpose: CSV data file with 3 data rows. Columns: p_username,p_password,p_email.

### testSuites/sample_team/recordings/browse-journey.recording-log.json

Layer: test suite  
Lines: 26  
Purpose: Framework file. Contains a JSON array value.

### testSuites/sample_team/recordings/dummy_postman.json

Layer: test suite  
Lines: 219  
Purpose: Framework file. Top-level keys: info, item, variable.
  
Top-level keys: `info`, `item`, `variable`

### testSuites/sample_team/recordings/Enterprise Dummy APIs.postman_collection.json

Layer: test suite  
Lines: 366  
Purpose: Framework file. Top-level keys: info, item, variable.
  
Top-level keys: `info`, `item`, `variable`

### testSuites/testpro/recordings/.recording-index.json

Layer: test suite  
Lines: 44  
Purpose: Framework file. Contains a JSON array value.

### testSuites/testpro/recordings/buy.recording-log.json

Layer: test suite  
Lines: 3635  
Purpose: Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content.

### testSuites/testpro/recordings/checkhar.recording-log.json

Layer: test suite  
Lines: 3635  
Purpose: Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content.

### testSuites/testpro/recordings/jpetstore.aspectran.com_animals.har

Layer: test suite  
Lines: 11745  
Purpose: Recorded HTTP archive used for script generation and replay comparison. Top-level keys: log.
  
Top-level keys: `log`

### testSuites/testpro/recordings/tes.recording-log.json

Layer: test suite  
Lines: 3635  
Purpose: Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content.

### testSuites/testpro/recordings/testcheckhar.recording-log.json

Layer: test suite  
Lines: 3635  
Purpose: Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content.

### testSuites/testpro/recordings/testhar_!.recording-log.json

Layer: test suite  
Lines: 3635  
Purpose: Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content.

### testSuites/testpro/recordings/testharcheck_1.recording-log.json

Layer: test suite  
Lines: 3635  
Purpose: Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content.

### testSuites/testpro/recordings/testt.recording-log.json

Layer: test suite  
Lines: 3635  
Purpose: Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content.

### testSuites/webui_team/HowTo-WebUI-Test.md

Layer: test suite  
Lines: 139  
Purpose: How-To: Web UI Performance Test (Server-Side) - This guide walks you through the sample **Web UI performance test** included in the framework. It simulates real user behavior on a web application using **server-side HTTP requests only** (no browser rendering).

### tsconfig.json

Layer: repository  
Lines: 25  
Purpose: Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content.

## SDET Operating Notes

- Treat `config/schemas` as the validation source of truth.
- Prefer adding framework behavior in engine layers instead of CLI handlers.
- Runtime utilities under `core_engine/src/utils` execute inside k6 and must remain compatible with k6's JavaScript runtime.
- Debug replay depends on generated or converted scripts calling `logExchange()` for every meaningful HTTP exchange.
- Reporting is artifact-first; CI should consume `run-summary.json` (gate + per-transaction table) and related JSON/NDJSON artifacts instead of console text.
- Existing `dist` files are generated build output and are intentionally not duplicated in the source-level reference.
