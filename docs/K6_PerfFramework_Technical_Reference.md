# K6 Performance Framework Technical Reference

Generated: 2026-06-01T15:48:10.902Z

## Document Purpose

This document is a professional SDET reference for the K6 Performance Framework. It combines the framework overview, execution contracts, configuration model, and a source-level catalog of files, classes, functions, methods, schemas, templates, data files, and sample journeys.

## Executive Summary

| Area | Count |
|---|---:|
| Documented files | 238 |
| Core engine source files | 82 |
| Test suite source files | 43 |
| Documented functions and methods | 625 |

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
| `.md/AGENT-CONTEXT.md` | repository | 2087 | K6-PerfFramework — Agent Context & Memory File - > **IMPORTANT FOR ANY AGENT / AI TOOL READING THIS FILE:** |
| `.md/BaseArchitecture.md` | repository | 1020 | BaseArchitecture.md - This framework is designed as a **hybrid performance engineering platform** built on top of **k6 with TypeScript**, combining the scripting flexibility of k6 with the structure, standardization, and usability expected from enterprise tools. |
| `.md/Checklist.md` | repository | 201 | k6 Performance Framework – Build Checklist - > **Last updated:** Phase 1 – Foundation complete (2026-03-21) |
| `.md/Current-Framework-Flow.md` | repository | 240 | Current Framework Flow - Date: 2026-03-30 |
| `.md/Debug-Automation-Status.md` | repository | 50 | Debug Automation Status - This file tracks the agreed work for the debug automation and reporting enhancements. |
| `.md/Deep-Dive-AutoCorrelation.md` | repository | 110 | Deep-Dive: Anatomy of a Correlated Request - This document provides a line-by-line breakdown of how a static request recorded inside a HAR file transforms into a **dynamic, fully-correlated k6 request execution**. |
| `.md/flow diagram.md` | repository | 401 | Framework Flow Diagram - Date: 2026-04-13 |
| `.md/Framework-Audit-Checklist.md` | repository | 245 | K6 Perf Framework Audit Checklist - Date: 2026-03-26 |
| `.md/Framework-Change-Log.md` | repository | 272 | Framework Change Log - This file tracks the framework changes made during the current enhancement cycle, including the latest debug-mode updates and the earlier generator, diff, and documentation work. |
| `.md/FRAMEWORK-IMPLEMENTATION-TODO.md` | repository | 514 | Framework Implementation TODO - This checklist tracks the agreed lifecycle, reporting, observability, and CI/CD work. |
| `.md/framework-requirements.md` | repository | 121 | k6 Performance Testing Framework: Requirements & Design - To design and build a reusable, maintainable, and portable performance testing framework using k6. The framework aims to be easy to adopt across different projects with minimal rework, abstracting away complexities and promoting a convention-over-configuration approach. |
| `.md/Generated-HowTo-Guide.md` | repository | 375 | K6 Performance Framework: A Detailed Guide - This guide provides a comprehensive overview of the K6 Performance Framework, from initial setup to advanced features. It is based on the framework's documentation and source code analysis. |
| `.md/HOW_TO_USE_FRAMEWORK.md` | repository | 358 | K6 Performance Framework: Comprehensive Usage Guide - Welcome to the K6-PerfFramework! This enterprise-grade framework wraps **k6** and **TypeScript** to provide a scalable, maintainable, and robust performance testing architecture. It separates reusable capabilities (the "Core Engine") from the actual load tests maintained by individual application teams ("Scrum Suites"). |
| `.md/HowTo-AutoCorrelation.md` | repository | 344 | Auto-Correlation Setup and Workflow Guide - Dynamic correlation prevents load tests from failing due to expired tokens, single-use session counters, or CSRF guard values. The framework implements a **Rule-based Correlation Engine** that automatically extracts these values from HTTP responses and makes them available to subsequent requests – exactly like LoadRunner's correlation feature. |
| `.md/HowTo-Parameterisation-And-Correlation.md` | repository | 540 | Parameterisation & Correlation Guide - > Practical guide for data-driving tests and handling dynamic server values using the k6 Performance Framework. |
| `.md/IMPLEMENTATION_GUIDE.md` | repository | 131 | Implementation Guide: Achieving Framework Requirements - Based on the `framework-requirements.md`, this guide outlines the exact, step-by-step procedures to achieve every defined requirement using the existing `K6-PerfFramework` architecture and commands. |
| `.md/Prerequisites.md` | repository | 78 | Prerequisites & Setup Guide - This guide covers the necessary tools and environment setup required to use the k6 Performance Framework. |
| `.md/schema-driven-dx-strategy.md` | repository | 461 | K6-PerfFramework — Schema-Driven DX Strategy - > **Purpose:** Transform the framework from "powerful but opaque" to "powerful and self-discoverable" through schema-driven architecture, IDE integration, guided templates, and progressive disclosure. |
| `.md/schema-dx-tasks.md` | repository | 53 | Schema-Driven DX — Implementation Tasks - > **Strategy doc:** [schema-driven-dx-strategy.md](file:///C:/Users/aditk/.gemini/antigravity/brain/4d9823d2-5708-45e4-8439-1d1ee1a4af58/artifacts/schema-driven-dx-strategy.md) |
| `.md/VU-Lifecycle-Implementation-Plan.lifecycle-simple-plan.md` | repository | 1490 | VU Lifecycle Implementation Plan - Replicate LoadRunner-style `vuser_init` / `Action` / `vuser_end` behavior in k6 while keeping the **user-facing journey script as simple as possible**. |
| `.md/VU-Lifecycle-Implementation-Plan.md` | repository | 639 | VU Lifecycle Implementation Plan - Replicate LoadRunner's `vuser_init` / `Action` / `vuser_end` pattern in k6 scripts, giving each VU a **per-VU exit time** calculated from the test plan's stage schedule. |
| `.md/VU-Lifecycle-Prototype-Files.md` | repository | 35 | VU Lifecycle Prototype Files - Original framework files were left untouched. |
| `ai_context/ai-workflow.md` | AI context | 60 | AI Workflow - > How to work effectively with this repository as an AI agent. |
| `ai_context/architecture-evolution.md` | AI context | 56 | Architecture Evolution - > How the framework evolved over time. Use this to understand architectural trajectory. |
| `ai_context/architecture-laws.md` | AI context | 84 | Architecture Laws - > **Inviolable rules.** Any AI agent or contributor MUST obey these. Violations risk breaking the framework's core guarantees. |
| `ai_context/change-impact-map.md` | AI context | 58 | Change Impact Map - > When you change X, you must also check Y. |
| `ai_context/decisions.md` | AI context | 82 | Architectural Decisions - > Distilled decision records. Each captures what was decided, why, and what constraints it creates. |
| `ai_context/dependency-hotspots.md` | AI context | 49 | Dependency Hotspots - > Modules with highest coupling — changes here have the widest blast radius. |
| `ai_context/dependency-rules.md` | AI context | 64 | Dependency Rules - > Import direction and coupling constraints. |
| `ai_context/design-proposals_1.md` | AI context | 326 | Design Proposals - > Approved architectural proposals awaiting implementation. |
| `ai_context/design-proposals.md` | AI context | 998 | Design Proposals - > Approved architectural proposals awaiting implementation. |
| `ai_context/execution-flow.md` | AI context | 114 | Execution Flow - > How code runs, from CLI invocation to k6 process and artifacts. |
| `ai_context/extension-points.md` | AI context | 86 | Extension Points - > Where new features can plug into the framework without breaking existing code. |
| `ai_context/fragile-areas.md` | AI context | 81 | Fragile Areas - > Code areas where bugs have historically occurred or where coupling makes changes risky. |
| `ai_context/framework-philosophy.md` | AI context | 64 | Framework Philosophy - > Design principles that explain WHY the architecture is shaped the way it is. |
| `ai_context/integration-checklist.md` | AI context | 59 | Integration Checklist - > Steps to follow when adding any new feature to the framework. |
| `ai_context/integration-contracts.md` | AI context | 91 | Integration Contracts - > Cross-layer API contracts that must be maintained. |
| `ai_context/known-tech-debt.md` | AI context | 86 | Known Technical Debt - > Acknowledged shortcuts, gaps, and areas that need future work. |
| `ai_context/module-map.md` | AI context | 135 | Module Map - > File-level routing table. Find the right file to edit without scanning the whole repo. |
| `ai_context/orchestration-map.md` | AI context | 96 | Orchestration Map - > How CLI commands wire through the engine layers to k6 execution. |
| `ai_context/overview.md` | AI context | 73 | K6-PerfFramework — AI Context Overview - > **Purpose:** Entry point for AI agents. Read this first, then load only the subsystem files relevant to your task. |
| `ai_context/prompt-templates.md` | AI context | 84 | Prompt Templates - > Reusable prompt patterns for common tasks. |
| `ai_context/rejected-approaches.md` | AI context | 64 | Rejected Approaches - > Approaches that were tried or considered and abandoned. Do NOT re-attempt these without new justification. |
| `ai_context/replay-debug-contracts.md` | AI context | 102 | Replay & Debug Contracts - > How the debug replay system works, its contracts, and its failure modes. |
| `ai_context/reporting-contracts.md` | AI context | 120 | Reporting Contracts - > Artifact schemas, report pipeline, and CI/CD integration contracts. |
| `ai_context/risk-zones.md` | AI context | 75 | Risk Zones - > Areas with hidden complexity, undocumented assumptions, or elevated failure risk. |
| `ai_context/runtime-contracts.md` | AI context | 91 | Runtime Contracts - > Contracts governing k6-side runtime behavior (code that runs inside k6's goja engine). |
| `ai_context/subsystem-boundaries.md` | AI context | 66 | Subsystem Boundaries - > Layer ownership rules — which module owns which responsibility. |
| `ai_context/todos.md` | AI context | 89 | Framework To-Do List - > A shared task list for AI agents to maintain continuity across sessions. |
| `ai_context/token-optimization-guide.md` | AI context | 64 | Token Optimization Guide - > Strategies for minimizing AI context token usage. |
| `config/environments/dev.json` | configuration | 18 | Framework file. Top-level keys: $schema, name, testSuites. |
| `config/runtime_settings/default.json` | configuration | 52 | Runtime behavior profile controlling execution, errors, reporting, and diagnostics. Top-level keys: $schema, thinkTime, pacing, http, errorBehavior, reporting, errors, monitoring, debugMode. |
| `config/schemas/environment.schema.json` | configuration | 53 | JSON Schema contract used for validation and IDE assistance. Top-level keys: $schema, $id, title, description, type, required, additionalProperties, properties. |
| `config/schemas/runtime_settings.schema.json` | configuration | 238 | JSON Schema contract used for validation and IDE assistance. Top-level keys: $schema, $id, title, description, type, required, additionalProperties, properties. |
| `config/schemas/test_plan.schema.json` | configuration | 258 | JSON Schema contract used for validation and IDE assistance. Top-level keys: $schema, $id, title, description, type, required, additionalProperties, properties. |
| `config/test_plans/debug_test.json` | configuration | 38 | Executable test plan or reusable workload template. Top-level keys: name, environment, execution_mode, global_load_profile, noCookiesReset, debug, user_journeys. |
| `config/test_plans/load_test copy.json` | configuration | 44 | Executable test plan or reusable workload template. Top-level keys: $schema, name, environment, execution_mode, global_load_profile, noCookiesReset, user_journeys, global_sla, journey_slas, transaction_slas. |
| `config/test_plans/load_test.json` | configuration | 62 | Executable test plan or reusable workload template. Top-level keys: $schema, name, environment, execution_mode, global_load_profile, noCookiesReset, user_journeys, global_sla, journey_slas, transaction_slas. |
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
| `core_engine/src/assertions/ThresholdManager.ts` | assertions | 99 | ThresholdManager implementation. |
| `core_engine/src/cli/config-inspect.ts` | cli | 51 | inspectConfig helpers or command handlers. |
| `core_engine/src/cli/convert.ts` | cli | 66 | runConvert helpers or command handlers. |
| `core_engine/src/cli/docs.ts` | cli | 78 | generateDocs helpers or command handlers. |
| `core_engine/src/cli/features.ts` | cli | 44 | listFeatures helpers or command handlers. |
| `core_engine/src/cli/generate-byos.ts` | cli | 80 | runGenerateByos helpers or command handlers. |
| `core_engine/src/cli/generate.ts` | cli | 136 | runGenerate, promptForDomains, promptForStaticAssetPreference helpers or command handlers. |
| `core_engine/src/cli/import.ts` | cli | 311 | runImportCurl, runImportPostman, emitScript, readFromFile helpers or command handlers. |
| `core_engine/src/cli/init.ts` | cli | 381 | runInit, writeIfNotExists helpers or command handlers. |
| `core_engine/src/cli/interactive.ts` | cli | 655 | runInteractivePanel, showMenuAndPick, dispatch, wizardGenerate helpers or command handlers. |
| `core_engine/src/cli/LifecyclePrompt.ts` | cli | 76 | promptForLifecycleSelection, parseSelections helpers or command handlers. |
| `core_engine/src/cli/new.ts` | cli | 65 | runNewWizard helpers or command handlers. |
| `core_engine/src/cli/run.ts` | cli | 1667 | runPlanDebugMode, runJourneyDebug, filterPassthroughArgs, resolveRecordingLogForStandaloneDebug helpers or command handlers. |
| `core_engine/src/cli/templates.ts` | cli | 59 | listTemplates, showTemplate helpers or command handlers. |
| `core_engine/src/cli/validate.ts` | cli | 95 | runValidate helpers or command handlers. |
| `core_engine/src/config/ConfigurationManager.ts` | config | 161 | ConfigurationManager implementation. |
| `core_engine/src/config/EnvResolver.ts` | config | 69 | EnvResolver implementation. |
| `core_engine/src/config/GatekeeperValidator.ts` | config | 242 | GatekeeperValidator implementation. |
| `core_engine/src/config/RuntimeConfigManager.ts` | config | 188 | RuntimeConfigManager implementation. |
| `core_engine/src/config/SchemaValidator.ts` | config | 325 | SchemaValidator implementation. |
| `core_engine/src/correlation/CorrelationEngine.ts` | correlation | 58 | CorrelationEngine implementation. |
| `core_engine/src/correlation/ExtractorRegistry.ts` | correlation | 59 | ExtractorRegistry implementation. |
| `core_engine/src/correlation/FallbackHandler.ts` | correlation | 21 | FallbackHandler implementation. |
| `core_engine/src/correlation/RuleProcessor.ts` | correlation | 33 | RuleProcessor implementation. |
| `core_engine/src/data/DataFactory.ts` | data | 140 | DataFactory implementation. |
| `core_engine/src/data/DataPoolManager.ts` | data | 131 | DataPoolManager implementation. |
| `core_engine/src/data/DataValidator.ts` | data | 145 | DataValidator implementation. |
| `core_engine/src/data/DynamicValueFactory.ts` | data | 95 | DynamicValueFactory implementation. |
| `core_engine/src/debug/DiffChecker.ts` | debug | 633 | DiffChecker implementation. |
| `core_engine/src/debug/ExchangeLog.ts` | debug | 203 | ExchangeLogBuilder implementation. |
| `core_engine/src/debug/HTMLDiffReporter.ts` | debug | 2014 | HTMLDiffReporter implementation. |
| `core_engine/src/debug/RecordingLogResolver.ts` | debug | 189 | RecordingLogResolver implementation. |
| `core_engine/src/debug/ReplayRunner.ts` | debug | 591 | ReplayRunner implementation. |
| `core_engine/src/execution/HostMonitor.ts` | execution | 129 | HostMonitor implementation. |
| `core_engine/src/execution/JourneyAllocator.ts` | execution | 93 | JourneyAllocator implementation. |
| `core_engine/src/execution/ParallelExecutionManager.ts` | execution | 134 | ParallelExecutionManager implementation. |
| `core_engine/src/execution/PipelineRunner.ts` | execution | 326 | PipelineRunner implementation. |
| `core_engine/src/index.ts` | index.ts | 107 | Framework file. |
| `core_engine/src/recording/CurlAdapter.ts` | recording | 463 | CurlAdapter implementation. |
| `core_engine/src/recording/DomainFilter.ts` | recording | 48 | DomainFilter implementation. |
| `core_engine/src/recording/HARParser.ts` | recording | 91 | HARParser implementation. |
| `core_engine/src/recording/PostmanAdapter.ts` | recording | 862 | PostmanAdapter implementation. |
| `core_engine/src/recording/PostmanScriptTranslator.ts` | recording | 269 | translatePostmanScript, countOpeners, countClosers, translateLine helpers or command handlers. |
| `core_engine/src/recording/ScriptConverter.ts` | recording | 1190 | ScriptConverter implementation. |
| `core_engine/src/recording/ScriptGenerator.ts` | recording | 320 | ScriptGenerator implementation. |
| `core_engine/src/recording/TransactionGrouper.ts` | recording | 34 | TransactionGrouper implementation. |
| `core_engine/src/reporters/AzureReporter.ts` | reporters | 14 | AzureReporter implementation. |
| `core_engine/src/reporters/CustomUploader.ts` | reporters | 14 | CustomUploader implementation. |
| `core_engine/src/reporters/GrafanaReporter.ts` | reporters | 14 | GrafanaReporter implementation. |
| `core_engine/src/reporters/ResultTransformer.ts` | reporters | 23 | ResultTransformer implementation. |
| `core_engine/src/reporting/ArtifactWriter.ts` | reporting | 20 | ArtifactWriter implementation. |
| `core_engine/src/reporting/EventArtifactBuilder.ts` | reporting | 178 | EventArtifactBuilder implementation. |
| `core_engine/src/reporting/RunReportGenerator.ts` | reporting | 1108 | RunReportGenerator implementation. |
| `core_engine/src/reporting/RunSummaryBuilder.ts` | reporting | 101 | RunSummaryBuilder implementation. |
| `core_engine/src/reporting/TimeseriesArtifactBuilder.ts` | reporting | 181 | TimeseriesArtifactBuilder implementation. |
| `core_engine/src/reporting/TimeseriesStreamParser.ts` | reporting | 430 | TimeseriesStreamParser implementation. |
| `core_engine/src/reporting/TransactionMetricsBuilder.ts` | reporting | 484 | TransactionMetricsBuilder implementation. |
| `core_engine/src/runtime/ErrorRuntime.ts` | runtime | 79 | ErrorRuntime implementation. |
| `core_engine/src/runtime/LifecycleRuntime.ts` | runtime | 74 | LifecycleRuntime implementation. |
| `core_engine/src/runtime/MetricsRuntime.ts` | runtime | 30 | MetricsRuntime implementation. |
| `core_engine/src/runtime/SnapshotRuntime.ts` | runtime | 47 | SnapshotRuntime implementation. |
| `core_engine/src/runtime/TimeseriesRuntime.ts` | runtime | 79 | TimeseriesRuntime implementation. |
| `core_engine/src/scenario/ExecutorFactory.ts` | scenario | 91 | ExecutorFactory implementation. |
| `core_engine/src/scenario/ScenarioBuilder.ts` | scenario | 443 | ScenarioBuilder implementation. |
| `core_engine/src/scenario/TestPlanLoader.ts` | scenario | 54 | TestPlanLoader implementation. |
| `core_engine/src/scenario/WorkloadModels.ts` | scenario | 174 | buildLoadProfile, buildStressProfile, buildSoakProfile, buildSpikeProfile helpers or command handlers. |
| `core_engine/src/types/ConfigContracts.ts` | types | 170 | Framework file. |
| `core_engine/src/types/EventContracts.ts` | types | 103 | Framework file. |
| `core_engine/src/types/HARContracts.ts` | types | 42 | Framework file. |
| `core_engine/src/types/ReportingContracts.ts` | types | 140 | Framework file. |
| `core_engine/src/types/TestPlanSchema.ts` | types | 163 | Framework file. |
| `core_engine/src/utils/lifecycle.ts` | utils | 430 | createTrackedProxy, createContext, createState, parseJsonEnv helpers or command handlers. |
| `core_engine/src/utils/LiveConsoleLogStream.ts` | utils | 94 | startLiveConsoleLogStream helpers or command handlers. |
| `core_engine/src/utils/logger.ts` | utils | 110 | Logger implementation. |
| `core_engine/src/utils/PathResolver.ts` | utils | 53 | PathResolver implementation. |
| `core_engine/src/utils/ProgressBar.ts` | utils | 86 | ProgressBar implementation. |
| `core_engine/src/utils/replayLogger.ts` | utils | 434 | trackCorrelation, trackParameter, trackDataRow, detectVariableEvents helpers or command handlers. |
| `core_engine/src/utils/request.ts` | utils | 378 | getRuntimeErrorBehavior, applyErrorBehaviorForStatus, nextRequestId, getSnapshotConfig helpers or command handlers. |
| `core_engine/src/utils/session.ts` | utils | 277 | getEnvContext, normalizeBaseUrl, isAbsoluteUrl, parseJsonEnv helpers or command handlers. |
| `core_engine/src/utils/transaction.ts` | utils | 346 | getRuntimeErrorBehavior, extractScriptLocation, formatStackSnippet, isVuTerminated helpers or command handlers. |
| `docs/CODE_LEVEL_ROADMAP.md` | documentation | 397 | ️ Code-Level Learning Roadmap: K6-PerfFramework - > A structured, file-by-file learning path. Follow the phases in order — each builds on the previous one. |
| `docs/configuration-reference.md` | documentation | 93 | K6-PerfFramework Configuration Reference - *(Auto-generated from JSON Schemas)* |
| `docs/K6_PerfFramework_Technical_Reference.md` | documentation | 4759 | K6 Performance Framework Technical Reference - Generated: 2026-06-01T15:44:56.014Z |
| `docs/KT_Guide.md` | documentation | 135 | K6 Performance Framework: Comprehensive Deep-Dive Guide - Welcome to the detailed deep-dive of the K6 Performance Framework. This guide moves beyond high-level concepts and specifically breaks down the exact files, their core functions, and the code powering the framework. |
| `docs/KT_Low_Level_Deep_Dive.md` | documentation | 194 | K6 Performance Framework: Low-Level Engineering Deep Dive - This document is designed for engineers seeking to understand the exact mathematical, architectural, and code-level mechanisms powering the framework. It covers the inner workings of runtime lifecycle management, dynamic data slicing, correlation execution, and process orchestration. |
| `docs/KT_Presentation.md` | documentation | 88 | Presentation Outline: K6 Performance Framework - * **Title:** Beyond Basic Testing: The Enterprise K6 Performance Framework |
| `graph.html` | repository | 993 | Framework file. |
| `k6log.log` | repository | 10927 | Framework file. |
| `package-lock.json` | repository | 903 | Framework file. Top-level keys: name, version, lockfileVersion, requires, packages. |
| `package.json` | repository | 67 | Framework file. Top-level keys: name, version, description, keywords, homepage, bugs, repository, license, author, type, main, types, bin, scripts, dependencies, devDependencies. |
| `README.md` | repository | 431 | K6 Performance Framework - A TypeScript-powered performance testing framework on top of Grafana k6. The framework helps teams organize k6 scripts into scrum-suite folders, generate scripts from HAR recordings, validate configuration before execution, run load/debug test plans, and produce structured reports for humans and CI. |
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
| `testSuites/b2b_new/tests/byosCheck.js` | test suite | 50 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/Jpet_new/data/pet.csv` | test suite | 5 | CSV data file with 3 data rows. Columns: p_pet. |
| `testSuites/Jpet_new/data/userdetails.csv` | test suite | 2 | CSV data file with 1 data rows. Columns: p_username,p_password. |
| `testSuites/Jpet_new/recordings/.recording-index.json` | test suite | 26 | Framework file. Contains a JSON array value. |
| `testSuites/Jpet_new/recordings/buyanimal_raw_19thmay.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/Jpet_new/recordings/buyanimal_raw_20thmay.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/Jpet_new/recordings/buyanimal_raw_25thmay.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/Jpet_new/recordings/buyanimal_raw_28thmay.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/Jpet_new/tests/.k6-perf-entry-Run_2026-05-19T17-53-34-465Z.js` | test suite | 2 | Framework file. |
| `testSuites/Jpet_new/tests/.k6-perf-entry-Run_2026-05-19T18-05-21-349Z.js` | test suite | 11 | handleSummary helpers or command handlers. |
| `testSuites/Jpet_new/tests/.k6-perf-entry-Run_2026-05-21T04-30-21-486Z.js` | test suite | 12 | handleSummary helpers or command handlers. |
| `testSuites/Jpet_new/tests/buy_animal_1stJune_converted.js` | test suite | 588 | getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/Jpet_new/tests/buyanimal_converted_20thmay.js` | test suite | 569 | getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/Jpet_new/tests/buyanimal_converted_25thmay.js` | test suite | 572 | getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/Jpet_new/tests/buyanimal_converted_26thmay.js` | test suite | 566 | getUniqueItem, initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/Jpet_new/tests/buyanimal_raw_28thmay.js` | test suite | 855 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/jpet_team/data/pet.csv` | test suite | 5 | CSV data file with 3 data rows. Columns: p_pet. |
| `testSuites/jpet_team/data/userdetails.csv` | test suite | 2 | CSV data file with 1 data rows. Columns: p_username,p_password. |
| `testSuites/jpet_team/recordings/.recording-index.json` | test suite | 26 | Framework file. Contains a JSON array value. |
| `testSuites/jpet_team/recordings/buyanimal_raw.recording-log.json` | test suite | 4018 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/jpet_team/recordings/jpet-login-test.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/jpet_team/recordings/jpetstore.aspectran.com - login logout.har` | test suite | 7471 | Recorded HTTP archive used for script generation and replay comparison. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/jpet_team/recordings/jpetstore.aspectran.com_animals.har` | test suite | 11745 | Recorded HTTP archive used for script generation and replay comparison. Top-level keys: log. |
| `testSuites/jpet_team/recordings/jpetstore.aspectran.com_buydog_1.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/jpet_team/recordings/jpetstore.aspectran.com_buydog.har` | test suite | 11745 | Recorded HTTP archive used for script generation and replay comparison. Top-level keys: log. |
| `testSuites/jpet_team/recordings/jpetstore.aspectran.com_buydog.recording-log.json` | test suite | 3635 | Framework file. Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content. |
| `testSuites/jpet_team/tests/buy_animals.js` | test suite | 589 | getUniqueItem helpers or command handlers. |
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
| `testSuites/sample_team/tests/browse-journey.js` | test suite | 42 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/checkorder_script.js` | test suite | 55 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/checkorder_script1.js` | test suite | 55 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/checkout-journey.js` | test suite | 58 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/my_journey.js` | test suite | 72 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/my_login_script.js` | test suite | 41 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/new_postman_check.js` | test suite | 159 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/postman_journey.js` | test suite | 118 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/smart_postman.js` | test suite | 151 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/smoke_cmd.js` | test suite | 42 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/smoke_convert.js` | test suite | 58 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/smoke_journey.js` | test suite | 72 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/smoke_login.js` | test suite | 43 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/smoke_postman_auth_only.js` | test suite | 54 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/smoke_postman.js` | test suite | 86 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/smoke_stdin.js` | test suite | 44 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/sample_team/tests/test_postman.js` | test suite | 156 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/testpro/tests/checkout_check.js` | test suite | 99 | Framework file. |
| `testSuites/testpro/tests/converted-checkout.js` | test suite | 120 | initPhase, actionPhase, endPhase helpers or command handlers. |
| `testSuites/testpro/tests/converter_check.js` | test suite | 155 | Framework file. |
| `testSuites/webui_team/HowTo-WebUI-Test.md` | test suite | 139 | How-To: Web UI Performance Test (Server-Side) - This guide walks you through the sample **Web UI performance test** included in the framework. It simulates real user behavior on a web application using **server-side HTTP requests only** (no browser rendering). |
| `testSuites/webui_team/tests/homepage-journey.js` | test suite | 69 | Framework file. |
| `testSuites/webui_team/tests/login-journey.js` | test suite | 84 | Framework file. |
| `tools/generate-technical-reference.js` | repository | 626 | walk, rel, read, countLines helpers or command handlers. |
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
Lines: 99  
Purpose: ThresholdManager implementation.

Imports:
- `import { SLADefinition, TestPlan } from '../types/TestPlanSchema';`

Exports: `ThresholdManager`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `PERCENTILE_KEY_RE` | Inferred | 4 | Matches SLA keys like p90, p95, p99, p99.9, p50 etc. |

#### Class: ThresholdManager

Line: 6  
Description: Translates SLA definitions from the test plan into k6-native thresholds. Supports global, per-journey, and per-transaction SLAs. Percentile keys are dynamic — any key matching /^p\d+(\.\d+)?$/ is accepted.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `apply` | `static apply(testPlan: TestPlan): Record<string, string[]>` | testPlan: TestPlan | Record<string, string[]> | 12 | Translates SLA definitions from the test plan into k6-native thresholds. Supports global, per-journey, and per-transaction SLAs. Percentile keys are dynamic — any key matching /^p\d+(\.\d+)?$/ is accepted. |
| `buildDurationRules` | `private static buildDurationRules(sla: SLADefinition): string[]` | sla: SLADefinition | string[] | 56 | Build k6 duration threshold rules from an SLA definition. Dynamically handles any percentile key (p50, p75, p90, p95, p99, p99.9, etc.). |
| `collectPercentiles` | `static collectPercentiles(testPlan: TestPlan): string[]` | testPlan: TestPlan | string[] | 78 | Collect all percentile values referenced across all SLA definitions in the plan. Returns k6-format percentile strings like 'p(90)', 'p(99)', 'p(99.9)'. |


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
Lines: 66  
Purpose: runConvert helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { createInterface } from 'node:readline/promises';`
- `import { stdin as input, stdout as output } from 'node:process';`
- `import { ScriptConverter } from '../recording/ScriptConverter';`
- `import { LifecycleSelection } from '../recording/ScriptGenerator';`
- `import { Logger } from '../utils/logger';`
- `import { promptForLifecycleSelection } from './LifecyclePrompt';`

Exports: `runConvert`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `runConvert` | `export async function runConvert( inputPath: string, teamName: string, scriptName: string, options:` | inputPath: string, teamName: string, scriptName: string, options: { inPlace?: boolean } | Promise<void> | 15 | CLI handler for `convert` command. Converts a conventional k6 script into a framework-compatible script with logExchange calls, request definition objects, and transaction wrappers. |


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
Lines: 80  
Purpose: runGenerateByos helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`

Exports: `runGenerateByos`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `runGenerateByos` | `export function runGenerateByos(teamName: string, scriptName: string): void` | teamName: string, scriptName: string | void | 9 | Implements the run generate byos function. It performs file-system work, orchestrates process execution, emits operator-facing output. |


### core_engine/src/cli/generate.ts

Layer: cli  
Lines: 136  
Purpose: runGenerate, promptForDomains, promptForStaticAssetPreference helpers or command handlers.

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

Exports: `runGenerate`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `runGenerate` | `export async function runGenerate(harPath: string, teamName: string, outName: string): Promise<void>` | harPath: string, teamName: string, outName: string | Promise<void> | 13 | Implements the run generate function. It performs file-system work, orchestrates process execution, emits operator-facing output. |
| `promptForDomains` | `async function promptForDomains( rl: Interface, domainStats: Array<` | rl: Interface, domainStats: Array<{ host: string; count: number }> | Promise<string[]> | 74 | Implements the prompt for domains function. It emits operator-facing output. |
| `promptForStaticAssetPreference` | `async function promptForStaticAssetPreference(rl: Interface): Promise<boolean>` | rl: Interface | Promise<boolean> | 128 | Implements the prompt for static asset preference function. |


### core_engine/src/cli/import.ts

Layer: cli  
Lines: 311  
Purpose: runImportCurl, runImportPostman, emitScript, readFromFile helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { CurlAdapter, ParsedCurlBlock } from '../recording/CurlAdapter';`
- `import { PostmanAdapter } from '../recording/PostmanAdapter';`
- `import { ScriptGenerator } from '../recording/ScriptGenerator';`
- `import { TransactionGroup } from '../recording/TransactionGrouper';`

Exports: `ImportCurlOptions`, `ImportPostmanOptions`, `runImportCurl`, `runImportPostman`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `ImportCurlOptions` | Interface | 19 | Inline curl string (shell-quoting required). Mutually exclusive with other sources. |
| `ImportPostmanOptions` | Interface | 32 | Path to a Postman v2.1 collection JSON file. Required. |
| `EmitScriptExtras` | Interface | 171 | Optional module-scope code (e.g. file `open()` bindings). |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `runImportCurl` | `export async function runImportCurl( team: string, scriptName: string, opts: ImportCurlOptions, ): Promise<void>` | team: string, scriptName: string, opts: ImportCurlOptions | Promise<void> | 39 | Implements the run import curl function. It emits operator-facing output. |
| `runImportPostman` | `export async function runImportPostman( team: string, scriptName: string, opts: ImportPostmanOptions, ): Promise<void>` | team: string, scriptName: string, opts: ImportPostmanOptions | Promise<void> | 130 | Implements the run import postman function. It performs file-system work, emits operator-facing output. |
| `emitScript` | `function emitScript( team: string, scriptName: string, groups: TransactionGroup[], warnings: string[], requestCount: number, extras: EmitScriptExtras =` | team: string, scriptName: string, groups: TransactionGroup[], warnings: string[], requestCount: number, extras: EmitScriptExtras = {} | void | 184 | Implements the emit script function. It performs file-system work, orchestrates process execution, enforces validation rules, emits operator-facing output. |
| `readFromFile` | `function readFromFile(filePath: string): ParsedCurlBlock[]` | filePath: string | ParsedCurlBlock[] | 242 | Implements the read from file function. It performs file-system work, emits operator-facing output. |
| `readStdin` | `async function readStdin(): Promise<string>` | None | Promise<string> | 257 | Read all of stdin until EOF and return as UTF-8 string. Use with pipes or redirects (`cmd \| npm run import:curl … --stdin`, `npm run import:curl … --stdin < file.curl`). |
| `readClipboard` | `function readClipboard(): string` | None | string | 281 | Read text from the OS clipboard by shelling out to the platform-native command. No external npm dependency required. - Windows : `powershell -NoProfile -Command Get-Clipboard -Raw` - macOS : `pbpaste` - Linux : `xclip -selection clipboard -o`, falling back to `xsel` Returns empty string on failure (caller handles the empty-input case). |


### core_engine/src/cli/init.ts

Layer: cli  
Lines: 381  
Purpose: runInit, writeIfNotExists helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`

Exports: `runInit`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `runInit` | `export function runInit(projectDir: string = process.cwd()): void` | projectDir: string = process.cwd() | void | 10 | Implements the run init function. It performs file-system work, orchestrates process execution, enforces validation rules, emits operator-facing output. |
| `writeIfNotExists` | `function writeIfNotExists(filePath: string, content: string, label: string): void` | filePath: string, content: string, label: string | void | 373 | Implements the write if not exists function. It performs file-system work, emits operator-facing output. |


### core_engine/src/cli/interactive.ts

Layer: cli  
Lines: 655  
Purpose: runInteractivePanel, showMenuAndPick, dispatch, wizardGenerate helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { Interface, createInterface } from 'node:readline/promises';`
- `import { stdin as input, stdout as output } from 'node:process';`
- `import { Logger } from '../utils/logger';`
- `import { runInit } from './init';`
- `import { runGenerate } from './generate';`
- `import { runConvert } from './convert';`
- `import { runGenerateByos } from './generate-byos';`
- `import { runImportCurl, runImportPostman } from './import';`
- `import { runValidate } from './validate';`
- `import { listFeatures } from './features';`
- `import { listTemplates } from './templates';`
- `import { inspectConfig } from './config-inspect';`

Exports: `runInteractivePanel`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `MenuChoice` | TypeAlias | 114 | Defines the MenuChoice contract used by the framework. |
| `MenuItem` | Interface | 129 | Defines the MenuItem contract used by the framework. |
| `OptionChoice` | Interface | 624 | Defines the OptionChoice contract used by the framework. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `MENU_GROUPS` | Array<{ heading: string; items: MenuItem[] }> | 135 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `runInteractivePanel` | `export async function runInteractivePanel(): Promise<void>` | None | Promise<void> | 48 | Launch the interactive command panel. Returns when the user picks "Exit" or sends EOF (Ctrl+D). All input/output via process.stdin/stdout. Caller (in run.ts) should only invoke this when both stdin AND stdout are TTYs — non-TTY contexts (CI, piped invocations) should fall through to the existing help output so we never block scripted runs. |
| `showMenuAndPick` | `async function showMenuAndPick(rl: Interface): Promise<MenuChoice>` | rl: Interface | Promise<MenuChoice> | 165 | Implements the show menu and pick function. It orchestrates process execution, emits operator-facing output. |
| `dispatch` | `async function dispatch(choice: MenuChoice, rl: Interface): Promise<void>` | choice: MenuChoice, rl: Interface | Promise<void> | 191 | Implements the dispatch function. It enforces validation rules. |
| `wizardGenerate` | `async function wizardGenerate(rl: Interface): Promise<void>` | rl: Interface | Promise<void> | 214 | Implements the wizard generate function. It emits operator-facing output. |
| `wizardConvert` | `async function wizardConvert(rl: Interface): Promise<void>` | rl: Interface | Promise<void> | 225 | Implements the wizard convert function. It orchestrates process execution, emits operator-facing output. |
| `wizardByos` | `async function wizardByos(rl: Interface): Promise<void>` | rl: Interface | Promise<void> | 237 | Implements the wizard byos function. It emits operator-facing output. |
| `wizardImportCurl` | `async function wizardImportCurl(rl: Interface): Promise<void>` | rl: Interface | Promise<void> | 246 | Implements the wizard import curl function. It emits operator-facing output. |
| `wizardImportPostman` | `async function wizardImportPostman(rl: Interface): Promise<void>` | rl: Interface | Promise<void> | 287 | Implements the wizard import postman function. It emits operator-facing output. |
| `wizardRun` | `async function wizardRun(rl: Interface): Promise<void>` | rl: Interface | Promise<void> | 314 | Implements the wizard run function. It orchestrates process execution, emits operator-facing output. |
| `wizardDebug` | `async function wizardDebug(rl: Interface): Promise<void>` | rl: Interface | Promise<void> | 335 | Implements the wizard debug function. It orchestrates process execution, emits operator-facing output. |
| `wizardValidate` | `async function wizardValidate(rl: Interface): Promise<void>` | rl: Interface | Promise<void> | 352 | Implements the wizard validate function. It emits operator-facing output. |
| `wizardInit` | `async function wizardInit(rl: Interface): Promise<void>` | rl: Interface | Promise<void> | 359 | Implements the wizard init function. It emits operator-facing output. |
| `wizardTemplates` | `async function wizardTemplates(rl: Interface): Promise<void>` | rl: Interface | Promise<void> | 366 | Implements the wizard templates function. It emits operator-facing output. |
| `wizardConfigInspect` | `async function wizardConfigInspect(rl: Interface): Promise<void>` | rl: Interface | Promise<void> | 376 | Implements the wizard config inspect function. It emits operator-facing output. |
| `isFrameworkWorkspace` | `function isFrameworkWorkspace(): boolean` | None | boolean | 387 | Implements the is framework workspace function. It performs file-system work. |
| `listExistingTeams` | `function listExistingTeams(): string[]` | None | string[] | 395 | List existing team folders under testSuites/ (one folder per team). |
| `pickOrCreateTeam` | `async function pickOrCreateTeam(rl: Interface): Promise<string \| null>` | rl: Interface | Promise<string \| null> | 416 | Pick an existing team or create a new one. New teams get the standard `tests/`, `data/`, `recordings/` subfolders so subsequent actions (Generate / Import / Convert) drop files into the right place. |
| `createTeamInteractive` | `async function createTeamInteractive(rl: Interface): Promise<string \| null>` | rl: Interface | Promise<string \| null> | 445 | Implements the create team interactive function. It emits operator-facing output. |
| `ensureTeamScaffold` | `function ensureTeamScaffold(teamName: string): void` | teamName: string | void | 460 | Create the standard team folder layout if it doesn't exist. Idempotent — safe to call when the team already exists. |
| `pickFile` | `async function pickFile( rl: Interface, defaultExt: string, label: string, matcher?: RegExp, ): Promise<string \| null>` | rl: Interface, defaultExt: string, label: string, matcher?: RegExp | Promise<string \| null> | 485 | File picker — searches cwd + immediate subdirs for files matching the extension or regex, presents a numbered list, falls back to manual path entry. Returns the (possibly relative) path the user picked, or null if they bailed. |
| `findFiles` | `function findFiles(root: string, re: RegExp, maxDepth: number): string[]` | root: string, re: RegExp, maxDepth: number | string[] | 516 | Search the given directory recursively (limited depth) for files matching the regex. Bounded to keep this from walking node_modules / .git / dist. |
| `pickPlan` | `async function pickPlan(rl: Interface): Promise<string \| null>` | rl: Interface | Promise<string \| null> | 545 | Pick a test plan from `config/test_plans/`. |
| `askScriptName` | `async function askScriptName(rl: Interface, suggestFromPath: string): Promise<string \| null>` | rl: Interface, suggestFromPath: string | Promise<string \| null> | 577 | Suggest a script name based on an input file path. |
| `readTopLevelPostmanFolders` | `function readTopLevelPostmanFolders(filePath: string): string[]` | filePath: string | string[] | 585 | Read top-level folder names from a Postman v2.1 collection for a quick filter pick. |
| `readUntilBlankLine` | `async function readUntilBlankLine(rl: Interface): Promise<string>` | rl: Interface | Promise<string> | 600 | Read lines from stdin until a blank line is entered. |
| `askInput` | `async function askInput(rl: Interface, label: string): Promise<string \| null>` | rl: Interface, label: string | Promise<string \| null> | 612 | Implements the ask input function. |
| `confirm` | `async function confirm(rl: Interface, question: string, defaultYes: boolean): Promise<boolean>` | rl: Interface, question: string, defaultYes: boolean | Promise<boolean> | 617 | Implements the confirm function. |
| `pickFromOptions` | `async function pickFromOptions<T>( rl: Interface, prompt: string, options: OptionChoice<T>[], ): Promise<T \| null>` | rl: Interface, prompt: string, options: OptionChoice<T>[] | Promise<T \| null> | 630 | Implements the pick from options function. It emits operator-facing output. |
| `printBanner` | `function printBanner(): void` | None | void | 649 | Implements the print banner function. It orchestrates process execution, emits operator-facing output. |


### core_engine/src/cli/LifecyclePrompt.ts

Layer: cli  
Lines: 76  
Purpose: promptForLifecycleSelection, parseSelections helpers or command handlers.

Imports:
- `import { Interface } from 'node:readline/promises';`
- `import { LifecycleSelection } from '../recording/ScriptGenerator';`

Exports: `promptForLifecycleSelection`

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `promptForLifecycleSelection` | `export async function promptForLifecycleSelection( rl: Interface, groupNames: string[], ): Promise<LifecycleSelection>` | rl: Interface, groupNames: string[] | Promise<LifecycleSelection> | 4 | Implements the prompt for lifecycle selection function. It emits operator-facing output. |
| `parseSelections` | `function parseSelections(answer: string, groupNames: string[]): string[]` | answer: string, groupNames: string[] | string[] | 43 | Implements the parse selections function. |


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
Lines: 1667  
Purpose: runPlanDebugMode, runJourneyDebug, filterPassthroughArgs, resolveRecordingLogForStandaloneDebug helpers or command handlers.

Imports:
- `import { Command } from 'commander';`
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { ConfigurationManager } from '../config/ConfigurationManager';`
- `import { GatekeeperValidator } from '../config/GatekeeperValidator';`
- `import { RuntimeConfigManager } from '../config/RuntimeConfigManager';`
- `import { RecordingLogResolver } from '../debug/RecordingLogResolver';`
- `import { ReplayRunner } from '../debug/ReplayRunner';`
- `import { HostMonitor, HostSnapshot } from '../execution/HostMonitor';`
- `import { ParallelExecutionManager } from '../execution/ParallelExecutionManager';`
- `import { PipelineRunner } from '../execution/PipelineRunner';`
- `import { ScenarioBuilder } from '../scenario/ScenarioBuilder';`
- `import { ArtifactWriter } from '../reporting/ArtifactWriter';`
- `import { EventArtifactBuilder } from '../reporting/EventArtifactBuilder';`
- `import { ErrorRuntime } from '../runtime/ErrorRuntime';`
- `import { RunReportGenerator } from '../reporting/RunReportGenerator';`
- `import { RunSummaryBuilder } from '../reporting/RunSummaryBuilder';`
- `import { TimeseriesArtifactBuilder } from '../reporting/TimeseriesArtifactBuilder';`
- `import { TransactionMetricsBuilder } from '../reporting/TransactionMetricsBuilder';`
- `import { ScenarioRuntimeMetadata } from '../scenario/ScenarioBuilder';`
- `import { TestPlanLoader } from '../scenario/TestPlanLoader';`
- `import { ResolvedConfig } from '../types/ConfigContracts';`
- `import { ReportBundle } from '../types/ReportingContracts';`
- `import { TestPlan, UserJourney } from '../types/TestPlanSchema';`
- `import { Logger } from '../utils/logger';`
- `import { startLiveConsoleLogStream } from '../utils/LiveConsoleLogStream';`
- `import { ProgressBar } from '../utils/ProgressBar';`
- `import { runConvert } from './convert';`
- `import { runGenerate } from './generate';`
- `import { runGenerateByos } from './generate-byos';`
- `import { runImportCurl, runImportPostman } from './import';`
- `import { runInit } from './init';`
- `import { runValidate } from './validate';`
- `import { listTemplates, showTemplate } from './templates';`
- `import { listFeatures } from './features';`
- `import { inspectConfig } from './config-inspect';`
- `import { runNewWizard } from './new';`
- `import { generateDocs } from './docs';`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `LiveTxnStats` | Interface | 1234 | Defines the LiveTxnStats contract used by the framework. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `program` | Inferred | 46 | Module-level constant or configuration value. |
| `importCmd` | Inferred | 155 | Module-level constant or configuration value. |
| `templatesCmd` | Inferred | 220 | Module-level constant or configuration value. |
| `configCmd` | Inferred | 263 | Module-level constant or configuration value. |
| `FRAMEWORK_OWNED_FLAGS` | Inferred | 622 | Module-level constant or configuration value. |
| `LIVE_TXN_INTERVAL_MS` | Inferred | 1232 | Module-level constant or configuration value. |
| `SNAPSHOT_EVENT_PREFIX` | Inferred | 1607 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `runPlanDebugMode` | `async function runPlanDebugMode(plan: TestPlan, resolvedConfig: ResolvedConfig, passthroughArgs: string[] = []): Promise<void>` | plan: TestPlan, resolvedConfig: ResolvedConfig, passthroughArgs: string[] = [] | Promise<void> | 557 | Implements the run plan debug mode function. It performs file-system work, enforces validation rules, emits operator-facing output. |
| `runJourneyDebug` | `function runJourneyDebug(plan: TestPlan, journey: UserJourney, runDir: string, resolvedConfig: ResolvedConfig, passthroughArgs: string[] = [])` | plan: TestPlan, journey: UserJourney, runDir: string, resolvedConfig: ResolvedConfig, passthroughArgs: string[] = [] | Inferred | 598 | Implements the run journey debug function. |
| `filterPassthroughArgs` | `function filterPassthroughArgs(args: string[]): string[]` | args: string[] | string[] | 624 | Implements the filter passthrough args function. It orchestrates process execution, emits operator-facing output. |
| `resolveRecordingLogForStandaloneDebug` | `function resolveRecordingLogForStandaloneDebug(scriptPath: string): string \| undefined` | scriptPath: string | string \| undefined | 655 | Implements the resolve recording log for standalone debug function. |
| `getEntryScriptDirectory` | `function getEntryScriptDirectory(journeys: UserJourney[]): string` | journeys: UserJourney[] | string | 667 | Implements the get entry script directory function. It orchestrates process execution. |
| `toImportSpecifier` | `function toImportSpecifier(fromDir: string, targetPath: string): string` | fromDir: string, targetPath: string | string | 679 | Implements the to import specifier function. |
| `prepareRunArtifacts` | `function prepareRunArtifacts(plan: TestPlan, resolvedConfig: ResolvedConfig):` | plan: TestPlan, resolvedConfig: ResolvedConfig | {  reportDir: string;  safeReportDir: string;  runId: string;  runManifestPath: string; } | 684 | Implements the prepare run artifacts function. It performs file-system work. |
| `buildScenarioRuntimeMetadata` | `function buildScenarioRuntimeMetadata( plan: TestPlan, resolvedConfig: ResolvedConfig, runId: string, safeReportDir: string, ): ScenarioRuntimeMetadata` | plan: TestPlan, resolvedConfig: ResolvedConfig, runId: string, safeReportDir: string | ScenarioRuntimeMetadata | 706 | Implements the build scenario runtime metadata function. It orchestrates process execution, enforces validation rules. |
| `buildRunEnvironment` | `function buildRunEnvironment( plan: TestPlan, resolvedConfig: ResolvedConfig, runId: string, safeReportDir: string, runManifestPath: string, ): Record<string, string>` | plan: TestPlan, resolvedConfig: ResolvedConfig, runId: string, safeReportDir: string, runManifestPath: string | Record<string, string> | 752 | Implements the build run environment function. It orchestrates process execution. |
| `extractJourneyTransactionNames` | `function extractJourneyTransactionNames(plan: TestPlan): Record<string, string[]>` | plan: TestPlan | Record<string, string[]> | 775 | Implements the extract journey transaction names function. It performs file-system work. |
| `collectUniqueTransactionNames` | `function collectUniqueTransactionNames(journeyTransactionNames: Record<string, string[]>): string[]` | journeyTransactionNames: Record<string, string[]> | string[] | 797 | Implements the collect unique transaction names function. |
| `extractTransactionNamesFromSource` | `function extractTransactionNamesFromSource(source: string): string[]` | source: string | string[] | 809 | Implements the extract transaction names from source function. It orchestrates process execution. |
| `writeRunManifest` | `function writeRunManifest( runManifestPath: string, plan: TestPlan, resolvedConfig: ResolvedConfig, scenarioMetadata: ScenarioRuntimeMetadata, ): void` | runManifestPath: string, plan: TestPlan, resolvedConfig: ResolvedConfig, scenarioMetadata: ScenarioRuntimeMetadata | void | 829 | Implements the write run manifest function. It performs file-system work, orchestrates process execution, enforces validation rules. |
| `finalizeRunArtifacts` | `async function finalizeRunArtifacts(options:` | options: { runId: string; reportDir: string; plan: TestPlan; resolvedConfig: ResolvedConfig; runStatus: number; hostSnapshots: HostSnapshot[]; k6StartTime?: string; k6EndTime?: string; /** * Transaction-name manifest (the same array fed to `K6_PERF_TRANSACTION_NAMES`). * Lets the post-run time-series parser distinguish per-transaction Trend/ * Counter/Rate metric points from unrelated user-defined metrics. */ transactionNames?: string[]; } | Promise<{  runReportHtml: string;  transactionMetricsJson: string;  errorsNdjson: string;  warningsNdjson: string;  ciSummaryJson: string;  timeseriesJson: string;  systemMetricsJson: string;  transactionMetrics?: import('../types/ReportingContracts').TransactionMetricsFile; }> | 873 | Transaction-name manifest (the same array fed to `K6_PERF_TRANSACTION_NAMES`). Lets the post-run time-series parser distinguish per-transaction Trend/ Counter/Rate metric points from unrelated user-defined metrics. |
| `buildReportAgents` | `function buildReportAgents(eventArtifacts:` | eventArtifacts: { errors: Array<{ agent?: ReportBundle['system']['agents'][number] }>; warnings: Array<{ agent?: ReportBundle['system']['agents'][number] }>; } | ReportBundle['system']['agents'] | 1112 | Implements the build report agents function. It enforces validation rules. |
| `printTransactionTable` | `function printTransactionTable(metrics: import('../types/ReportingContracts').TransactionMetricsFile): void` | metrics: import('../types/ReportingContracts').TransactionMetricsFile | void | 1123 | Print a LoadRunner-style transaction metrics table to the console. |
| `formatCell` | `function formatCell(value: unknown, column: string): string` | value: unknown, column: string | string | 1217 | Implements the format cell function. |
| `pct` | `function pct(values: number[], p: number): string` | values: number[], p: number | string | 1255 | Implements the pct function. |
| `startLiveTransactionDisplay` | `function startLiveTransactionDisplay( metricsStreamPath: string, transactionNames: string[], transactionStats: string[], _logPath: string, ):` | metricsStreamPath: string, transactionNames: string[], transactionStats: string[], _logPath: string | { stop: () => void } | 1261 | Implements the start live transaction display function. It performs file-system work, orchestrates process execution, parses structured configuration or artifact data. |
| `buildLiveTableLines` | `function buildLiveTableLines( stats: Map<string, LiveTxnStats>, transactionStats: string[], useColor: boolean, ): string[]` | stats: Map<string, LiveTxnStats>, transactionStats: string[], useColor: boolean | string[] | 1457 | Build the rendered table as a list of strings (one per row). Pure helper shared by both fixed-position and scrollback renderers. |
| `renderFixedTable` | `function renderFixedTable( stats: Map<string, LiveTxnStats>, transactionStats: string[], useColor: boolean, tableTop: number, termRows: number, ): void` | stats: Map<string, LiveTxnStats>, transactionStats: string[], useColor: boolean, tableTop: number, termRows: number | void | 1552 | Fixed-position rendering: the table lives at rows `tableTop..termRows`, frozen below k6's scroll region. Save cursor → clear table area → draw table → restore cursor, so k6's progress bar continues animating above without ever touching our table area. |
| `renderScrollbackTable` | `function renderScrollbackTable( stats: Map<string, LiveTxnStats>, transactionStats: string[], useColor: boolean, ): void` | stats: Map<string, LiveTxnStats>, transactionStats: string[], useColor: boolean | void | 1593 | Fallback for non-TTY stdout or terminals too short for fixed positioning: just append the latest snapshot as scrollback. |
| `parseAndFlushSnapshots` | `function parseAndFlushSnapshots(runLogPath: string, reportDir: string): void` | runLogPath: string, reportDir: string | void | 1613 | Reads the mirrored k6 log file, extracts snapshot events emitted during the run, and writes a consolidated snapshots.json to the report directory. |
| `extractSnapshotPayload` | `function extractSnapshotPayload(line: string): string \| null` | line: string | string \| null | 1637 | Implements the extract snapshot payload function. It orchestrates process execution, parses structured configuration or artifact data. |


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
Lines: 69  
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
| `require` | `require(key: string): string` | key: string | string | 33 | Get a required string variable. Throws if missing. |
| `get` | `get(key: string, defaultValue = ''): string` | key: string, defaultValue = '' | string | 42 | Get an optional string variable with a fallback default. |
| `getBool` | `getBool(key: string, defaultValue = false): boolean` | key: string, defaultValue = false | boolean | 47 | Get an optional boolean variable ('true'/'false'/'1'/'0'). |
| `getNumber` | `getNumber(key: string, defaultValue = 0): number` | key: string, defaultValue = 0 | number | 54 | Get an optional numeric variable. |
| `getAll` | `getAll(): Record<string, string>` | None | Record<string, string> | 65 | Expose all resolved vars (for debug printing – caller should redact secrets). |


### core_engine/src/config/GatekeeperValidator.ts

Layer: config  
Lines: 242  
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

Exports: `GatekeeperResult`, `GatekeeperValidator`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `GatekeeperResult` | Interface | 17 | Defines the GatekeeperResult contract used by the framework. |

#### Class: GatekeeperValidator

Line: 23  
Description: Run the full pre-flight checklist. Returns a result object — never throws; caller decides how to handle failures.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `validate` | `validate(config: ResolvedConfig, plan: TestPlan, dataRoot: string): GatekeeperResult` | config: ResolvedConfig, plan: TestPlan, dataRoot: string | GatekeeperResult | 28 | Run the full pre-flight checklist. Returns a result object — never throws; caller decides how to handle failures. |
| `printResult` | `printResult(result: GatekeeperResult): GatekeeperResult` | result: GatekeeperResult | GatekeeperResult | 176 | Print the result to console in a human-readable format. Returns the same result for chaining. |
| `extractDataReferences` | `private extractDataReferences( scriptContent: string, ): Array<` | scriptContent: string | Array<{ dataset: string; filePath: string; columns: string[] }> | 199 | Scan a k6 script for data file references and column usage. Detects: fs.open("path") → file mapping, FILES["name"]["col"] → column refs. |
| `estimateRequestedVUs` | `private estimateRequestedVUs(plan: TestPlan): number` | plan: TestPlan | number | 234 | Implements the estimate requested vus method. |


### core_engine/src/config/RuntimeConfigManager.ts

Layer: config  
Lines: 188  
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
| `getTimeoutMs` | `getTimeoutMs(): number` | None | number | 67 | Implements the get timeout ms method. |
| `getMaxRedirects` | `getMaxRedirects(): number` | None | number | 71 | Implements the get max redirects method. |
| `shouldThrowOnError` | `shouldThrowOnError(): boolean` | None | boolean | 75 | Implements the should throw on error method. |
| `getErrorBehavior` | `getErrorBehavior(): RuntimeSettings['errorBehavior']` | None | RuntimeSettings['errorBehavior'] | 83 | Implements the get error behavior method. |
| `getTransactionStats` | `getTransactionStats(): string[]` | None | string[] | 91 | Implements the get transaction stats method. |
| `shouldIncludeTransactionTable` | `shouldIncludeTransactionTable(): boolean` | None | boolean | 98 | Implements the should include transaction table method. |
| `shouldIncludeErrorTable` | `shouldIncludeErrorTable(): boolean` | None | boolean | 102 | Implements the should include error table method. |
| `isTimeseriesEnabled` | `isTimeseriesEnabled(): boolean` | None | boolean | 106 | Implements the is timeseries enabled method. |
| `getTimeseriesBucketSizeSeconds` | `getTimeseriesBucketSizeSeconds(): number` | None | number | 110 | Implements the get timeseries bucket size seconds method. |
| `shouldKeepRawMetricsStream` | `shouldKeepRawMetricsStream(): boolean` | None | boolean | 121 | When false, the raw k6 streaming-JSON file (`metrics-stream.json`) is deleted after the unified report finishes generating. The file is the source of truth for the per-second time-series charts and is several MB per minute of high-RPS traffic — useful for re-analysis but heavy for CI / storage-constrained environments. |
| `shouldCaptureSnapshotOnFailure` | `shouldCaptureSnapshotOnFailure(): boolean` | None | boolean | 131 | Implements the should capture snapshot on failure method. It enforces validation rules. |
| `getMaxSnapshotsPerRun` | `getMaxSnapshotsPerRun(): number` | None | number | 135 | Implements the get max snapshots per run method. It enforces validation rules. |
| `shouldIncludeRequestHeadersInSnapshots` | `shouldIncludeRequestHeadersInSnapshots(): boolean` | None | boolean | 139 | Implements the should include request headers in snapshots method. It enforces validation rules. |
| `shouldIncludeRequestBodyInSnapshots` | `shouldIncludeRequestBodyInSnapshots(): boolean` | None | boolean | 143 | Implements the should include request body in snapshots method. It enforces validation rules. |
| `shouldIncludeResponseHeadersInSnapshots` | `shouldIncludeResponseHeadersInSnapshots(): boolean` | None | boolean | 147 | Implements the should include response headers in snapshots method. It enforces validation rules. |
| `shouldIncludeResponseBodyInSnapshots` | `shouldIncludeResponseBodyInSnapshots(): boolean` | None | boolean | 151 | Implements the should include response body in snapshots method. It enforces validation rules. |
| `isMonitoringEnabled` | `isMonitoringEnabled(): boolean` | None | boolean | 159 | Implements the is monitoring enabled method. |
| `getCpuWarningPercent` | `getCpuWarningPercent(): number` | None | number | 163 | Implements the get cpu warning percent method. |
| `getMemoryWarningPercent` | `getMemoryWarningPercent(): number` | None | number | 167 | Implements the get memory warning percent method. |
| `getMonitoringSampleIntervalSeconds` | `getMonitoringSampleIntervalSeconds(): number` | None | number | 171 | Implements the get monitoring sample interval seconds method. |
| `isDebugMode` | `isDebugMode(): boolean` | None | boolean | 179 | Implements the is debug mode method. |
| `dump` | `dump(): RuntimeSettings` | None | RuntimeSettings | 184 | Return all settings (useful for logging) |


### core_engine/src/config/SchemaValidator.ts

Layer: config  
Lines: 325  
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
| `TEST_PLAN_SCHEMA_INLINE` | Inferred | 137 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `loadExternalSchema` | `function loadExternalSchema(schemaFileName: string): object \| undefined` | schemaFileName: string | object \| undefined | 30 | Attempt to load a JSON Schema from the config/schemas/ directory. Returns undefined if the file doesn't exist (caller falls back to inline). |
| `levenshtein` | `function levenshtein(a: string, b: string): number` | a: string, b: string | number | 305 | Implements the levenshtein function. |

#### Class: SchemaValidator

Line: 217  
Description: Implements the schema validator class. It enforces validation rules.

| Property | Type | Line | Description |
|---|---|---:|---|
| `ajv` | Ajv | 218 | Class state or configuration value used by the class methods. |
| `validateRuntimeSettings` | ValidateFunction | 219 | Class state or configuration value used by the class methods. |
| `validateTestPlan` | ValidateFunction | 220 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `constructor` | `constructor()` | None | Inferred | 222 | Implements the constructor method. It enforces validation rules. |
| `validateRuntime` | `validateRuntime(data: unknown): ValidationResult` | data: unknown | ValidationResult | 235 | Implements the validate runtime method. It enforces validation rules. |
| `validatePlan` | `validatePlan(data: unknown): ValidationResult` | data: unknown | ValidationResult | 239 | Implements the validate plan method. It enforces validation rules. |
| `runValidation` | `private runValidation( validate: ValidateFunction, data: unknown, label: string, ): ValidationResult` | validate: ValidateFunction, data: unknown, label: string | ValidationResult | 243 | Implements the run validation method. It enforces validation rules. |


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


### core_engine/src/correlation/ExtractorRegistry.ts

Layer: correlation  
Lines: 59  
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
Lines: 633  
Purpose: DiffChecker implementation.

Imports:
- `import { HAREntry } from '../types/HARContracts';`
- `import { TaggedExchangeLogEntry, VariableEvent } from './ExchangeLog';`

Exports: `HeaderDiffEntry`, `BodyDiffResult`, `SideSnapshot`, `DiffResult`, `DiffChecker`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `HeaderDiffEntry` | Interface | 4 | Defines the HeaderDiffEntry contract used by the framework. |
| `BodyDiffResult` | Interface | 11 | Defines the BodyDiffResult contract used by the framework. |
| `SideSnapshot` | Interface | 19 | Defines the SideSnapshot contract used by the framework. |
| `DiffResult` | Interface | 31 | Defines the DiffResult contract used by the framework. |
| `ReplayComparisonContext` | Interface | 56 | Defines the ReplayComparisonContext contract used by the framework. |
| `ReplayProjection` | Interface | 68 | Defines the ReplayProjection contract used by the framework. |

#### Class: DiffChecker

Line: 73  
Description: Implements the diff checker class. It performs file-system work, orchestrates process execution.

| Property | Type | Line | Description |
|---|---|---:|---|
| `LARGE_BODY_THRESHOLD` | Inferred | 74 | Class state or configuration value used by the class methods. |
| `REDIRECT_STATUSES` | Inferred | 75 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `compare` | `static compare(original: HAREntry, replay: Partial<HAREntry>): DiffResult` | original: HAREntry, replay: Partial<HAREntry> | DiffResult | 77 | Implements the compare method. |
| `compareBatch` | `static compareBatch(originalEntries: HAREntry[], replayEntries: Partial<HAREntry>[]): DiffResult[]` | originalEntries: HAREntry[], replayEntries: Partial<HAREntry>[] | DiffResult[] | 81 | Implements the compare batch method. |
| `compareTaggedLogs` | `static compareTaggedLogs( recordedLogs: TaggedExchangeLogEntry[] \| null \| undefined, replayLogs: Partial<TaggedExchangeLogEntry>[], options?:` | recordedLogs: TaggedExchangeLogEntry[] \| null \| undefined, replayLogs: Partial<TaggedExchangeLogEntry>[], options?: { missingRecordingWarning?: string } | DiffResult[] | 104 | Implements the compare tagged logs method. |
| `compareWithContext` | `private static compareWithContext( original: HAREntry, replay: Partial<HAREntry>, context: ReplayComparisonContext, ): DiffResult` | original: HAREntry, replay: Partial<HAREntry>, context: ReplayComparisonContext | DiffResult | 178 | Implements the compare with context method. It orchestrates process execution. |
| `diffHeaders` | `private static diffHeaders( recordedHeaders:` | recordedHeaders: { name: string; value: string }[] = [], replayedHeaders: { name: string; value: string }[] = [] | HeaderDiffEntry[] | 272 | Implements the diff headers method. |
| `diffBodies` | `private static diffBodies(recordedBody?: string, replayedBody?: string): BodyDiffResult` | recordedBody?: string, replayedBody?: string | BodyDiffResult | 300 | Implements the diff bodies method. |
| `headersMatch` | `private static headersMatch(diffs: HeaderDiffEntry[]): boolean` | diffs: HeaderDiffEntry[] | boolean | 357 | Implements the headers match method. It performs file-system work. |
| `scorePercent` | `private static scorePercent(checks: boolean[]): number` | checks: boolean[] | number | 361 | Implements the score percent method. |
| `calculateStringSimilarity` | `private static calculateStringSimilarity(a: string, b: string): number` | a: string, b: string | number | 367 | Implements the calculate string similarity method. |
| `calculateLargeBodySimilarity` | `private static calculateLargeBodySimilarity(a: string, b: string): number` | a: string, b: string | number | 377 | Implements the calculate large body similarity method. |
| `sharedPrefixLength` | `private static sharedPrefixLength(a: string, b: string): number` | a: string, b: string | number | 394 | Implements the shared prefix length method. |
| `sharedSuffixLength` | `private static sharedSuffixLength(a: string, b: string, prefixLength: number): number` | a: string, b: string, prefixLength: number | number | 403 | Implements the shared suffix length method. |
| `sampledBodyMatchRatio` | `private static sampledBodyMatchRatio(a: string, b: string): number` | a: string, b: string | number | 417 | Implements the sampled body match ratio method. |
| `sampleWindow` | `private static sampleWindow(value: string, checkpoint: number, windowSize: number): string` | value: string, checkpoint: number, windowSize: number | string | 438 | Implements the sample window method. |
| `levenshteinDistance` | `private static levenshteinDistance(a: string, b: string): number` | a: string, b: string | number | 445 | Implements the levenshtein distance method. |
| `toHAREntry` | `private static toHAREntry(entry: TaggedExchangeLogEntry): HAREntry` | entry: TaggedExchangeLogEntry | HAREntry | 467 | Implements the to harentry method. |
| `toReplayProjection` | `private static toReplayProjection(entry: Partial<TaggedExchangeLogEntry>): ReplayProjection` | entry: Partial<TaggedExchangeLogEntry> | ReplayProjection | 497 | Implements the to replay projection method. |
| `extractHost` | `private static extractHost(url: string): string` | url: string | string | 540 | Implements the extract host method. |
| `findReplayFallback` | `private static findReplayFallback( original: HAREntry, candidates: ReplayProjection[], ): ReplayProjection \| undefined` | original: HAREntry, candidates: ReplayProjection[] | ReplayProjection \| undefined | 548 | Implements the find replay fallback method. |
| `compareReplayOnly` | `private static compareReplayOnly( replay: ReplayProjection, missingRecordingWarning?: string, iteration?: number, ): DiffResult` | replay: ReplayProjection, missingRecordingWarning?: string, iteration?: number | DiffResult | 557 | Implements the compare replay only method. |
| `groupReplayByIteration` | `private static groupReplayByIteration( replayLogs: Partial<TaggedExchangeLogEntry>[], ): Map<number, ReplayProjection[]>` | replayLogs: Partial<TaggedExchangeLogEntry>[] | Map<number, ReplayProjection[]> | 613 | Implements the group replay by iteration method. |


### core_engine/src/debug/ExchangeLog.ts

Layer: debug  
Lines: 203  
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
| `ExchangeLogResponse` | Interface | 27 | Defines the ExchangeLogResponse contract used by the framework. |
| `VariableEvent` | Interface | 34 | Defines the VariableEvent contract used by the framework. |
| `TaggedExchangeLogEntry` | Interface | 42 | Defines the TaggedExchangeLogEntry contract used by the framework. |

#### Class: ExchangeLogBuilder

Line: 60  
Description: Implements the exchange log builder class.

| Property | Type | Line | Description |
|---|---|---:|---|
| `BINARY_CONTENT_RE` | Inferred | 100 | Class state or configuration value used by the class methods. |
| `BINARY_MIME_TYPES` | Inferred | 101 | Class state or configuration value used by the class methods. |
| `STATIC_EXT_RE` | Inferred | 107 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `fromGroups` | `static fromGroups(groups: TransactionGroup[]): TaggedExchangeLogEntry[]` | groups: TransactionGroup[] | TaggedExchangeLogEntry[] | 61 | Implements the from groups method. |
| `fromEntries` | `static fromEntries(entries: HAREntry[]): TaggedExchangeLogEntry[]` | entries: HAREntry[] | TaggedExchangeLogEntry[] | 67 | Implements the from entries method. |
| `fromHAREntry` | `static fromHAREntry(entry: HAREntry, transactionName: string): TaggedExchangeLogEntry` | entry: HAREntry, transactionName: string | TaggedExchangeLogEntry | 71 | Implements the from harentry method. |
| `isBinaryContent` | `private static isBinaryContent(mimeType?: string, url?: string): string \| null` | mimeType?: string, url?: string | string \| null | 109 | Implements the is binary content method. |
| `normalizeBody` | `private static normalizeBody(body?: string, encoding?: string, mimeType?: string, url?: string): string \| undefined` | body?: string, encoding?: string, mimeType?: string, url?: string | string \| undefined | 122 | Implements the normalize body method. |
| `buildRequestBody` | `private static buildRequestBody(postData?: HAREntry['postData']): string \| undefined` | postData?: HAREntry['postData'] | string \| undefined | 143 | Implements the build request body method. |
| `looksReadable` | `private static looksReadable(value: string): boolean` | value: string | boolean | 157 | Implements the looks readable method. |
| `extractQueryParams` | `private static extractQueryParams(url: string): ExchangeLogParams` | url: string | ExchangeLogParams | 168 | Implements the extract query params method. |
| `extractCookies` | `private static extractCookies( headers: ExchangeLogHeader[], headerName: 'cookie' \| 'set-cookie', ): ExchangeLogCookie[]` | headers: ExchangeLogHeader[], headerName: 'cookie' \| 'set-cookie' | ExchangeLogCookie[] | 181 | Implements the extract cookies method. |


### core_engine/src/debug/HTMLDiffReporter.ts

Layer: debug  
Lines: 2014  
Purpose: HTMLDiffReporter implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { DiffResult, HeaderDiffEntry } from './DiffChecker';`
- `import { VariableEvent } from './ExchangeLog';`
- `import { K6Metrics } from './ReplayRunner';`

Exports: `ReportOptions`, `HTMLDiffReporter`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `IterationSummary` | Interface | 7 | Defines the IterationSummary contract used by the framework. |
| `ReportOptions` | Interface | 13 | Defines the ReportOptions contract used by the framework. |

#### Class: HTMLDiffReporter

Line: 19  
Description: Extract pure numeric value from metric strings like "147.69ms", "12.05s", "545" for sorting

| Property | Type | Line | Description |
|---|---|---:|---|
| `REDIRECT_STATUSES` | Inferred | 1985 | Class state or configuration value used by the class methods. |
| `BODY_PREVIEW_MAX` | Inferred | 1986 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `generateReport` | `static generateReport(results: DiffResult[], outPath: string, options?: ReportOptions): void` | results: DiffResult[], outPath: string, options?: ReportOptions | void | 20 | Implements the generate report method. It performs file-system work, orchestrates process execution. |
| `renderIterationSummaryRow` | `private static renderIterationSummaryRow(summary: IterationSummary): string` | summary: IterationSummary | string | 1277 | Implements the render iteration summary row method. |
| `renderIterationSection` | `private static renderIterationSection(summary: IterationSummary, active: boolean): string` | summary: IterationSummary, active: boolean | string | 1293 | Implements the render iteration section method. |
| `renderTransactions` | `private static renderTransactions(results: DiffResult[]): string` | results: DiffResult[] | string | 1350 | Implements the render transactions method. |
| `renderRequestCard` | `private static renderRequestCard(result: DiffResult): string` | result: DiffResult | string | 1384 | Implements the render request card method. |
| `renderTransactionSummaryTable` | `private static renderTransactionSummaryTable(results: DiffResult[]): string` | results: DiffResult[] | string | 1514 | Implements the render transaction summary table method. |
| `renderRequestSummaryTable` | `private static renderRequestSummaryTable(results: DiffResult[]): string` | results: DiffResult[] | string | 1548 | Implements the render request summary table method. |
| `renderGlobalVariables` | `private static renderGlobalVariables(results: DiffResult[]): string` | results: DiffResult[] | string | 1584 | Implements the render global variables method. |
| `renderRequestVariables` | `private static renderRequestVariables(variableEvents: VariableEvent[]): string` | variableEvents: VariableEvent[] | string | 1628 | Implements the render request variables method. |
| `renderSnapshot` | `private static renderSnapshot(snapshot: DiffResult['recorded'], noData: boolean): string` | snapshot: DiffResult['recorded'], noData: boolean | string | 1657 | Implements the render snapshot method. |
| `renderHeaderTable` | `private static renderHeaderTable(diffs: HeaderDiffEntry[]): string` | diffs: HeaderDiffEntry[] | string | 1675 | Implements the render header table method. It performs file-system work. |
| `renderHeaderList` | `private static renderHeaderList(headers:` | headers: { name: string; value: string }[] | string | 1700 | Implements the render header list method. |
| `renderCookieList` | `private static renderCookieList(cookies?:` | cookies?: { name: string; value: string }[] | string | 1714 | Implements the render cookie list method. |
| `renderCookieTable` | `private static renderCookieTable( replayedCookies?:` | replayedCookies?: { name: string; value: string }[], recordedCookies?: { name: string; value: string }[] | string | 1729 | Implements the render cookie table method. |
| `renderBodyComparison` | `private static renderBodyComparison( title: string, summary: string, recordedBody?: string, replayedBody?: string, recordedMissing?: boolean, autoExpand?: boolean, redirectWarni...` | title: string, summary: string, recordedBody?: string, replayedBody?: string, recordedMissing?: boolean, autoExpand?: boolean, redirectWarning?: string | string | 1767 | Implements the render body comparison method. |
| `renderUrl` | `private static renderUrl(url: string): string` | url: string | string | 1823 | Implements the render url method. |
| `decodeText` | `private static decodeText(value: string): string` | value: string | string | 1831 | Implements the decode text method. |
| `formatBody` | `private static formatBody(body: string): string` | body: string | string | 1836 | Implements the format body method. It parses structured configuration or artifact data. |
| `groupByIteration` | `private static groupByIteration(results: DiffResult[]): Map<number, IterationSummary>` | results: DiffResult[] | Map<number, IterationSummary> | 1853 | Implements the group by iteration method. |
| `headerSummary` | `private static headerSummary(diffs: HeaderDiffEntry[]):` | diffs: HeaderDiffEntry[] | { label: string; className: string } | 1874 | Implements the header summary method. It performs file-system work. |
| `formatDuration` | `private static formatDuration(durationMs?: number): string` | durationMs?: number | string | 1881 | Implements the format duration method. |
| `average` | `private static average(values: number[]): number` | values: number[] | number | 1886 | Implements the average method. |
| `countWarnings` | `private static countWarnings(results: DiffResult[]): number` | results: DiffResult[] | number | 1891 | Implements the count warnings method. |
| `scoreClass` | `private static scoreClass(score: number): string` | score: number | string | 1895 | Implements the score class method. |
| `statusCodeClass` | `private static statusCodeClass(status?: number): string` | status?: number | string | 1901 | Implements the status code class method. |
| `formatHeaders` | `private static formatHeaders(headers:` | headers: { name: string; value: string }[] | string | 1910 | Implements the format headers method. |
| `renderMetricsSection` | `private static renderMetricsSection(m: K6Metrics): string` | m: K6Metrics | string | 1915 | Implements the render metrics section method. It orchestrates process execution. |
| `escapeHtml` | `private static escapeHtml(value: string): string` | value: string | string | 1965 | Implements the escape html method. |
| `parseMetricNum` | `private static parseMetricNum(val: string): string` | val: string | string | 1976 | Extract pure numeric value from metric strings like "147.69ms", "12.05s", "545" for sorting |
| `sanitizeId` | `private static sanitizeId(value: string): string` | value: string | string | 1981 | Implements the sanitize id method. |
| `isBodyMethod` | `private static isBodyMethod(method?: string): boolean` | method?: string | boolean | 1988 | Implements the is body method method. |
| `bodyPreview` | `private static bodyPreview(body?: string, method?: string): string \| null` | body?: string, method?: string | string \| null | 1993 | Implements the body preview method. |
| `detectRedirect` | `private static detectRedirect(result: DiffResult): string \| undefined` | result: DiffResult | string \| undefined | 2000 | Implements the detect redirect method. It orchestrates process execution. |


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
Lines: 591  
Purpose: ReplayRunner implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import * as readline from 'readline';`
- `import { PipelineRunner } from '../execution/PipelineRunner';`
- `import { ScenarioBuilder } from '../scenario/ScenarioBuilder';`
- `import { Logger } from '../utils/logger';`
- `import { startLiveConsoleLogStream } from '../utils/LiveConsoleLogStream';`
- `import { createSpinner } from '../utils/ProgressBar';`
- `import { DiffChecker, DiffResult } from './DiffChecker';`
- `import { TaggedExchangeLogEntry } from './ExchangeLog';`
- `import { HTMLDiffReporter } from './HTMLDiffReporter';`

Exports: `DebugReplayOptions`, `DebugReplayResult`, `K6Metrics`, `ReplayRunner`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `DebugReplayOptions` | Interface | 30 | Team environment configs (testSuites from the loaded environment file). |
| `DebugReplayResult` | Interface | 46 | Defines the DebugReplayResult contract used by the framework. |
| `K6Metrics` | Interface | 53 | Defines the K6Metrics contract used by the framework. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `extractTransactionNames` | `function extractTransactionNames(source: string): string[]` | source: string | string[] | 14 | Extract transaction names declared in a script source via transaction() or startTransaction(). |

#### Class: ReplayRunner

Line: 62  
Description: Run a k6 script in debug mode, capture replay logs, compare them to the recording log, and generate an HTML diff report automatically.

| Property | Type | Line | Description |
|---|---|---:|---|
| `REPLAY_PREFIX` | Inferred | 63 | Class state or configuration value used by the class methods. |
| `STATIC_EXT_RE` | Inferred | 326 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `runDebug` | `static async runDebug(options: DebugReplayOptions): Promise<DebugReplayResult>` | options: DebugReplayOptions | Promise<DebugReplayResult> | 69 | Run a k6 script in debug mode, capture replay logs, compare them to the recording log, and generate an HTML diff report automatically. |
| `extractReplayEntries` | `private static async extractReplayEntries( runResult:` | runResult: { stdout?: string; stderr?: string; stdoutPath?: string; stderrPath?: string }, logFilePath?: string | Promise<TaggedExchangeLogEntry[]> | 218 | Implements the extract replay entries method. It performs file-system work, orchestrates process execution. |
| `collectReplayEntriesFromFile` | `private static async collectReplayEntriesFromFile(filePath: string, entries: TaggedExchangeLogEntry[]): Promise<void>` | filePath: string, entries: TaggedExchangeLogEntry[] | Promise<void> | 249 | Implements the collect replay entries from file method. It performs file-system work. |
| `collectReplayEntriesFromText` | `private static collectReplayEntriesFromText(output: string \| undefined, entries: TaggedExchangeLogEntry[]): void` | output: string \| undefined, entries: TaggedExchangeLogEntry[] | void | 266 | Implements the collect replay entries from text method. |
| `collectReplayEntryFromLine` | `private static collectReplayEntryFromLine(line: string, entries: TaggedExchangeLogEntry[]): void` | line: string, entries: TaggedExchangeLogEntry[] | void | 275 | Implements the collect replay entry from line method. It emits operator-facing output. |
| `extractReplayPayload` | `private static extractReplayPayload(line: string): string \| null` | line: string | string \| null | 289 | Implements the extract replay payload method. It parses structured configuration or artifact data. |
| `parseReplayEntry` | `private static parseReplayEntry(jsonPayload: string): TaggedExchangeLogEntry` | jsonPayload: string | TaggedExchangeLogEntry | 313 | Implements the parse replay entry method. It parses structured configuration or artifact data. |
| `readRecordingLog` | `private static readRecordingLog(filePath: string): TaggedExchangeLogEntry[]` | filePath: string | TaggedExchangeLogEntry[] | 317 | Implements the read recording log method. It performs file-system work, parses structured configuration or artifact data. |
| `normalizeRecordingEntry` | `private static normalizeRecordingEntry(entry: TaggedExchangeLogEntry): TaggedExchangeLogEntry` | entry: TaggedExchangeLogEntry | TaggedExchangeLogEntry | 328 | Implements the normalize recording entry method. |
| `decodeBodyIfNeeded` | `private static decodeBodyIfNeeded(value?: string): string \| undefined` | value?: string | string \| undefined | 343 | Implements the decode body if needed method. |
| `looksLikeBase64` | `private static looksLikeBase64(value: string): boolean` | value: string | boolean | 359 | Implements the looks like base64 method. |
| `looksReadable` | `private static looksReadable(value: string): boolean` | value: string | boolean | 365 | Implements the looks readable method. |
| `writeJson` | `private static writeJson(filePath: string, data: unknown): void` | filePath: string, data: unknown | void | 376 | Implements the write json method. It performs file-system work. |
| `extractK6Errors` | `private static extractK6Errors(runResult:` | runResult: { stdout?: string; stderr?: string; stdoutPath?: string; stderrPath?: string } | string[] | 388 | Extract k6 runtime error messages from captured stdout/stderr. k6 errors appear as `level=error msg="..."` or `ERRO[xxxx] ...` lines. |
| `extractK6Metrics` | `private static extractK6Metrics(runResult:` | runResult: { stdout?: string; stderr?: string; stdoutPath?: string; stderrPath?: string } | K6Metrics | 447 | Parse k6 performance metrics from the TOTAL RESULTS section of stdout. |
| `defaultReplayLogPath` | `private static defaultReplayLogPath(htmlPath: string): string` | htmlPath: string | string | 530 | Implements the default replay log path method. |
| `extractConsoleLogs` | `private static extractConsoleLogs(runResult:` | runResult: { stdout?: string; stderr?: string; stdoutPath?: string; stderrPath?: string } | string[] | 540 | Extract user console.log / console.info / console.warn messages from k6 output. k6 emits these as logfmt lines: level=info msg="..." source=console Excludes internal framework prefixes like [k6-perf] and [replay-log]. |


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
Lines: 326  
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
| `PipelineRunResult` | Interface | 40 | Defines the PipelineRunResult contract used by the framework. |

#### Class: PipelineRunner

Line: 52  
Description: Execute k6 with the given options. Writes options.scenarios to a temp config snippet and passes it via --config.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `run` | `static run(options: RunOptions): void` | options: RunOptions | void | 57 | Execute k6 with the given options. Writes options.scenarios to a temp config snippet and passes it via --config. |
| `execute` | `static execute(options: RunOptions): PipelineRunResult` | options: RunOptions | PipelineRunResult | 67 | Execute k6 and return the process result. Useful for debug flows that need captured logs. |
| `executeAsync` | `static executeAsync(options: RunOptions): Promise<PipelineRunResult>` | options: RunOptions | Promise<PipelineRunResult> | 173 | Implements the execute async method. It performs file-system work, orchestrates process execution, emits operator-facing output. |
| `printCapturedOutput` | `static printCapturedOutput(result: PipelineRunResult): void` | result: PipelineRunResult | void | 306 | Implements the print captured output method. It performs file-system work. |
| `ensureSuccess` | `static ensureSuccess(result: PipelineRunResult): void` | result: PipelineRunResult | void | 320 | Implements the ensure success method. |


### core_engine/src/index.ts

Layer: index.ts  
Lines: 107  
Purpose: Framework file.

Exports: `export * from './types/ConfigContracts';`, `export * from './types/EventContracts';`, `export * from './types/ReportingContracts';`, `export * from './types/TestPlanSchema';`, `export { ConfigurationManager } from './config/ConfigurationManager';`, `export { EnvResolver } from './config/EnvResolver';`, `export { GatekeeperValidator } from './config/GatekeeperValidator';`, `export type { GatekeeperResult } from './config/GatekeeperValidator';`, `export { RuntimeConfigManager } from './config/RuntimeConfigManager';`, `export { SchemaValidator } from './config/SchemaValidator';`, `export { buildLoadProfile, buildStressProfile, buildSoakProfile, buildSpikeProfile, buildIterationProfile, buildConstantArrivalRateProfile, buildRampingArrivalRateProfile, buildExternallyControlledProfile, toK6ExecutorConfig } from './scenario/WorkloadModels';`, `export { ExecutorFactory } from './scenario/ExecutorFactory';`, `export { ScenarioBuilder } from './scenario/ScenarioBuilder';`, `export type { K6ScenarioDefinition, K6ScenariosMap } from './scenario/ScenarioBuilder';`, `export { TestPlanLoader } from './scenario/TestPlanLoader';`, `export { HostMonitor } from './execution/HostMonitor';`, `export { JourneyAllocator } from './execution/JourneyAllocator';`, `export type { JourneyAllocation } from './execution/JourneyAllocator';`, `export { ParallelExecutionManager } from './execution/ParallelExecutionManager';`, `export type { K6Options } from './execution/ParallelExecutionManager';`, `export { PipelineRunner } from './execution/PipelineRunner';`, `export { DataFactory } from './data/DataFactory';`, `export type { LoadedDataset } from './data/DataFactory';`, `export { DataPoolManager } from './data/DataPoolManager';`, `export { DataValidator } from './data/DataValidator';`, `export type { DataValidationResult } from './data/DataValidator';`, `export { DynamicValueFactory } from './data/DynamicValueFactory';`, `export { ErrorRuntime } from './runtime/ErrorRuntime';`, `export type { ErrorRuntimeContext } from './runtime/ErrorRuntime';`, `export { LifecycleRuntime } from './runtime/LifecycleRuntime';`, `export type { JourneyContext, JourneyPhase, LifecycleDecision, LifecyclePhaseFns, LifecycleRunState } from './runtime/LifecycleRuntime';`, `export { MetricsRuntime } from './runtime/MetricsRuntime';`, `export type { TransactionAggregate } from './runtime/MetricsRuntime';`, `export { SnapshotRuntime } from './runtime/SnapshotRuntime';`, `export { TimeseriesRuntime } from './runtime/TimeseriesRuntime';`, `export { Logger } from './utils/logger';`, `export { PathResolver } from './utils/PathResolver';`, `export { endTransaction, getCurrentTransaction, initTransactions, isVuTerminated, k6Check, startTransaction, transaction } from './utils/transaction';`, `export { request } from './utils/request';`, `export type { CookieValue, HttpMethod, RequestBody, RequestOptions } from './utils/request';`, `export { createJourneyLifecycleStore, getTransactionGate, runJourneyLifecycle, thinktime } from './utils/lifecycle';`, `export type { JourneyLifecycleStore, PhaseFns, TransactionGate } from './utils/lifecycle';`, `export { logReplayExchange, logExchange, trackCorrelation, trackDataRow, trackParameter } from './utils/replayLogger';`, `export { clearCookies, deleteCookie, getEnvContext, registerBaseUrl, registerFrameworkEnvironmentUrls, resolveFrameworkUrl, resolvePath } from './utils/session';`, `export type { TeamEnvironmentOverride } from './utils/session';`, `export { DomainFilter } from './recording/DomainFilter';`, `export { HARParser } from './recording/HARParser';`, `export { ScriptGenerator } from './recording/ScriptGenerator';`, `export { TransactionGrouper } from './recording/TransactionGrouper';`, `export { JourneyAssertionResolver } from './assertions/JourneyAssertionResolver';`, `export { SLARegistry } from './assertions/SLARegistry';`, `export { ThresholdManager } from './assertions/ThresholdManager';`, `export { CorrelationEngine } from './correlation/CorrelationEngine';`, `export { ExtractorRegistry } from './correlation/ExtractorRegistry';`, `export { FallbackHandler } from './correlation/FallbackHandler';`, `export { RuleProcessor } from './correlation/RuleProcessor';`, `export { DiffChecker } from './debug/DiffChecker';`, `export { ExchangeLogBuilder } from './debug/ExchangeLog';`, `export type { TaggedExchangeLogEntry, VariableEvent } from './debug/ExchangeLog';`, `export { HTMLDiffReporter } from './debug/HTMLDiffReporter';`, `export { RecordingLogResolver } from './debug/RecordingLogResolver';`, `export { ReplayRunner } from './debug/ReplayRunner';`, `export { AzureReporter } from './reporters/AzureReporter';`, `export { CustomUploader } from './reporters/CustomUploader';`, `export { GrafanaReporter } from './reporters/GrafanaReporter';`, `export { ResultTransformer } from './reporters/ResultTransformer';`, `export { ArtifactWriter } from './reporting/ArtifactWriter';`, `export { EventArtifactBuilder } from './reporting/EventArtifactBuilder';`, `export { RunReportGenerator } from './reporting/RunReportGenerator';`, `export { RunSummaryBuilder } from './reporting/RunSummaryBuilder';`, `export { TimeseriesArtifactBuilder } from './reporting/TimeseriesArtifactBuilder';`, `export { TransactionMetricsBuilder } from './reporting/TransactionMetricsBuilder';`


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
Lines: 862  
Purpose: PostmanAdapter implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`
- `import { HAREntry } from '../types/HARContracts';`
- `import { TransactionGroup } from './TransactionGrouper';`
- `import { translatePostmanScript } from './PostmanScriptTranslator';`

Exports: `PostmanParseResult`, `PostmanParseOptions`, `PostmanAdapter`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `PostmanParseResult` | Interface | 28 | Module-scope code (file `open()` bindings) that the generator should inject at init context, populated when the collection contains file uploads or multipart-with-files. Empty string when not needed. |
| `PostmanParseOptions` | Interface | 66 | Only emit requests under this folder name (direct match only; no path nesting). |
| `FileBinding` | Interface | 80 | Internal: a tracked file binding for k6 init-context code generation. |
| `PostmanCollectionFile` | Interface | 97 | Defines the PostmanCollectionFile contract used by the framework. |
| `PostmanItem` | Interface | 104 | Defines the PostmanItem contract used by the framework. |
| `PostmanRequest` | TypeAlias | 112 | Defines the PostmanRequest contract used by the framework. |
| `PostmanUrl` | TypeAlias | 123 | Defines the PostmanUrl contract used by the framework. |
| `PostmanHeader` | Interface | 135 | Defines the PostmanHeader contract used by the framework. |
| `PostmanBody` | Interface | 142 | Defines the PostmanBody contract used by the framework. |
| `PostmanAuth` | Interface | 158 | Defines the PostmanAuth contract used by the framework. |
| `PostmanAuthParam` | Interface | 176 | Defines the PostmanAuthParam contract used by the framework. |
| `PostmanEvent` | Interface | 182 | Defines the PostmanEvent contract used by the framework. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `sanitizeName` | `function sanitizeName(s: string): string` | s: string | string | 811 | Implements the sanitize name function. |
| `safeJsonParse` | `function safeJsonParse(s: string): unknown` | s: string | unknown | 815 | Implements the safe json parse function. It parses structured configuration or artifact data. |
| `mimeFromExt` | `function mimeFromExt(filename: string): string` | filename: string | string | 828 | Guess a MIME type from a filename extension. Covers the formats users realistically upload via Postman; unknowns fall back to octet-stream so the generated script is always runnable. |

#### Class: PostmanAdapter

Line: 192  
Description: Read a Postman v2.1 collection JSON file and convert to TransactionGroup[].

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `parseFile` | `static parseFile(filePath: string, opts: PostmanParseOptions =` | filePath: string, opts: PostmanParseOptions = {} | PostmanParseResult | 196 | Read a Postman v2.1 collection JSON file and convert to TransactionGroup[]. |
| `parse` | `static parse( collection: PostmanCollectionFile, opts: PostmanParseOptions =` | collection: PostmanCollectionFile, opts: PostmanParseOptions = {} | PostmanParseResult | 212 | Convert a parsed Postman collection object to TransactionGroup[]. |
| `assertCollectionShape` | `private static assertCollectionShape( collection: PostmanCollectionFile, warnings: string[], ): void` | collection: PostmanCollectionFile, warnings: string[] | void | 352 | Implements the assert collection shape method. It enforces validation rules. |
| `requestToHAREntry` | `private static requestToHAREntry( item: PostmanItem, id: string, pageref: string, effectiveAuth: PostmanAuth \| undefined, warnings: string[], fileCtx:` | item: PostmanItem, id: string, pageref: string, effectiveAuth: PostmanAuth \| undefined, warnings: string[], fileCtx: { fileBindings: FileBinding[]; copiedFiles: PostmanParseResult['copiedFiles']; dataDir?: string; entryComments: PostmanParseResult['entryComments']; } | HAREntry | 364 | Implements the request to harentry method. |
| `makeEntry` | `private static makeEntry(args:` | args: { id: string; pageref: string; method: string; url: string; headers: { name: string; value: string }[]; body: string \| undefined; bodyMime: string \| undefined; /** Raw JS expression to emit as the request body — used for file uploads. */ expression?: string; } | HAREntry | 424 | Raw JS expression to emit as the request body — used for file uploads. |
| `resolveUrl` | `private static resolveUrl( url: PostmanUrl \| undefined, warnings: string[], where: string, ): string` | url: PostmanUrl \| undefined, warnings: string[], where: string | string | 472 | Implements the resolve url method. |
| `resolveHeaders` | `private static resolveHeaders( header: PostmanHeader[] \| string \| undefined, ):` | header: PostmanHeader[] \| string \| undefined | { name: string; value: string }[] | 499 | Implements the resolve headers method. |
| `resolveBody` | `private static resolveBody( body: PostmanBody \| undefined, where: string, fileCtx:` | body: PostmanBody \| undefined, where: string, fileCtx: { fileBindings: FileBinding[]; copiedFiles: PostmanParseResult['copiedFiles']; dataDir?: string; } | {  body: string \| undefined;  bodyMime: string \| undefined;  /** When set, a raw JS expression for the body — used for file uploads. */  expression?: string;  bodyWarnings: string[];  } | 519 | When set, a raw JS expression for the body — used for file uploads. |
| `registerFileBinding` | `private static registerFileBinding( src: string, ctx:` | src: string, ctx: { fileBindings: FileBinding[]; copiedFiles: PostmanParseResult['copiedFiles']; dataDir?: string; }, warnings: string[], where: string | FileBinding | 650 | Register a file referenced by a Postman item. De-duplicates by source path: the same file used twice in the collection produces one binding. If the file exists on the local filesystem AND a `dataDir` was supplied, copies the file into `dataDir/<basename>` so the generated script can reference it portably. If the file is missing, still emits the binding (with a TODO comment via `binding.copied=false`) so users can drop the file in later without re-running the import. |
| `authToHeaders` | `private static authToHeaders( auth: PostmanAuth \| undefined, warnings: string[], where: string, ):` | auth: PostmanAuth \| undefined, warnings: string[], where: string | { name: string; value: string }[] | 711 | Implements the auth to headers method. |
| `processEvents` | `private static processEvents( events: PostmanEvent[] \| undefined, warnings: string[], where: string, entryId: string, entryComments: PostmanParseResult['entryComments'], ): void` | events: PostmanEvent[] \| undefined, warnings: string[], where: string, entryId: string, entryComments: PostmanParseResult['entryComments'] | void | 765 | Process an item's `event[]` slots and stash translated/preserved script lines into the per-entry comments map keyed by HAREntry id. The ScriptGenerator emits the `before` lines above the `request(...)` call and the `after` lines below the default `k6Check(...)` at emission time. The translator (see PostmanScriptTranslator) handles the safe-rewrite subset (`pm.environment.set/get`, `pm.response.code/json/headers`, etc.) and emits `// TODO[port-postman]:` lines for everything else. We only warn at the CLI when nothing in the script could be translated — that's the case worth flagging because the user has the most manual work. |


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
Lines: 1190  
Purpose: ScriptConverter implementation.

Imports:
- `import * as fs from 'fs';`
- `import { LifecycleSelection, ScriptGenerator } from './ScriptGenerator';`

Exports: `ScriptConverter`

#### Class: ScriptConverter

Line: 20  
Description: ScriptConverter Converts conventional k6 scripts (e.g. from Grafana k6 Studio, raw HAR exports, or hand-written scripts) into framework-compatible scripts that include: - `logExchange()` calls for debug replay - Request definition objects with `{id, transaction, method, url, body, params}` - `initTransactions / startTransaction / endTransaction` wrappers - Proper framework imports - Runtime variable tracking via `trackCorrelation` / `trackParameter` Handles two major input patterns: A) "Studio" scripts with `Trend`, `group()`, manual `Date.now()` timing B) "Semi-framework" scripts that already have transaction helpers but lack logExchange

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `convertFile` | `static convertFile(filePath: string, teamName?: string, lifecycle?: LifecycleSelection): string` | filePath: string, teamName?: string, lifecycle?: LifecycleSelection | string | 24 | Read a script file and return the converted source. |
| `convert` | `static convert(source: string, teamName: string, lifecycle?: LifecycleSelection): string` | source: string, teamName: string, lifecycle?: LifecycleSelection | string | 36 | Convert a raw k6 script string to a framework-compatible script. |
| `extractGroupNames` | `static extractGroupNames(source: string): string[]` | source: string | string[] | 449 | Implements the extract group names method. It orchestrates process execution. |
| `buildImportBlock` | `private static buildImportBlock( source: string, _hasTransactionImport: boolean, _hasLogReplayExchange: boolean, ): string` | source: string, _hasTransactionImport: boolean, _hasLogReplayExchange: boolean | string | 459 | Implements the build import block method. It orchestrates process execution, emits operator-facing output. |
| `findImportBlockEnd` | `private static findImportBlockEnd(lines: string[]): number` | lines: string[] | number | 496 | Implements the find import block end method. |
| `matchHttpCall` | `private static matchHttpCall( line: string, ):` | line: string | { method: string; varPrefix: string } \| null | 522 | Implements the match http call method. |
| `parseHttpCall` | `private static parseHttpCall( lines: string[], startIdx: number, httpMatch:` | lines: string[], startIdx: number, httpMatch: { method: string; varPrefix: string } | {  method: string;  url: string;  body: string \| null;  params: string \| null;  varName: string;  fullCallLines: number;  } | 539 | Implements the parse http call method. |
| `splitTopLevelArgs` | `private static splitTopLevelArgs(str: string): string[]` | str: string | string[] | 609 | Split a string of function arguments at the top level (respecting nested braces, brackets, parens, and strings). |
| `buildRequestCallString` | `private static buildRequestCallString( method: string, url: string, body: string \| null, paramsStr: string \| null, entryId: string, resName: string, indent: string, primaryBaseU...` | method: string, url: string, body: string \| null, paramsStr: string \| null, entryId: string, resName: string, indent: string, primaryBaseUrl?: string, assignOnly = false, nameCounters?: Map<string, number> | string | 673 | Build a `request()` call string using the framework helper. Replaces the old request-def + http.* + logExchange pattern. When `assignOnly` is true, emits `resName = request(...)` (no `const`) so the caller can place it inside a try block with a preceding `let resName;`. Also auto-injects a `variables: { ... }` option from `${...}` template expressions found in url/body/headers, so every local-scope variable used in a request shows up in the debug report's Variables section with its resolved value at the moment of the call. Skips expressions that are already auto-tracked via Proxy/registry (env.*, ctx.*, correlation_vars[*], getUniqueItem(FILES[*])). |
| `extractRequestVars` | `private static extractRequestVars( ...exprs: (string \| null \| undefined)[] ):` | ...exprs: (string \| null \| undefined)[] | { name: string; access: string }[] | 745 | Scan url/body/headers expression strings for `${...}` template references and return the names/accessors of variables that aren't already tracked elsewhere by the framework. |
| `extractObjectProperty` | `private static extractObjectProperty(objStr: string, propName: string): string \| null` | objStr: string, propName: string | string \| null | 780 | Extract a property value from an object literal string. |
| `reindent` | `private static reindent(str: string, baseIndent: string): string` | str: string, baseIndent: string | string | 816 | Re-indent a multi-line string to align with the given base indent. |
| `isTrendAddLine` | `private static isTrendAddLine(line: string, trendVarNames: Set<string>): boolean` | line: string, trendVarNames: Set<string> | boolean | 824 | Implements the is trend add line method. |
| `getLeadingWhitespace` | `private static getLeadingWhitespace(line: string): string` | line: string | string | 832 | Implements the get leading whitespace method. |
| `sanitizeTransactionName` | `private static sanitizeTransactionName(name: string): string` | name: string | string | 842 | Sanitize a group name for use as a k6 metric name. k6 metrics must only include ASCII letters, numbers, or underscores and start with a letter or underscore (max 128 chars). |
| `applyPhaseContract` | `private static applyPhaseContract(source: string, teamName: string, lifecycle?: LifecycleSelection): string` | source: string, teamName: string, lifecycle?: LifecycleSelection | string | 851 | Implements the apply phase contract method. |
| `renderPhaseFunction` | `private static renderPhaseFunction(name: string, preludeLines: string[], groupStatements: string[]): string` | name: string, preludeLines: string[], groupStatements: string[] | string | 916 | Implements the render phase function method. |
| `partitionLifecycleStatements` | `private static partitionLifecycleStatements( statements: string[], lifecycle: LifecycleSelection, ):` | statements: string[], lifecycle: LifecycleSelection | {  moduleLevelDecls: string[];  initPrelude: string[];  actionPrelude: string[];  endPrelude: string[];  initGroups: string[];  actionGroups: string[];  endGroups: string[];  } | 935 | Implements the partition lifecycle statements method. It orchestrates process execution. |
| `splitTopLevelStatements` | `private static splitTopLevelStatements(body: string): string[]` | body: string | string[] | 1085 | Implements the split top level statements method. |
| `extractGroupName` | `private static extractGroupName(statement: string): string \| null` | statement: string | string \| null | 1111 | Implements the extract group name method. |
| `findMatchingBrace` | `private static findMatchingBrace(source: string, startIndex: number): number` | source: string, startIndex: number | number | 1116 | Implements the find matching brace method. |
| `indentBlock` | `private static indentBlock(block: string, spaces: number): string` | block: string, spaces: number | string | 1129 | Implements the indent block method. |
| `extractBaseUrlsFromSource` | `private static extractBaseUrlsFromSource(source: string): string[]` | source: string | string[] | 1138 | Extract unique base URLs (origin) from URL literals in source code. |
| `toRuntimeUrlExpression` | `private static toRuntimeUrlExpression(url: string, primaryBaseUrl?: string): string` | url: string, primaryBaseUrl?: string | string | 1151 | Implements the to runtime url expression method. |
| `extractStringLiteralValue` | `private static extractStringLiteralValue(value: string): string \| null` | value: string | string \| null | 1170 | Implements the extract string literal value method. |


### core_engine/src/recording/ScriptGenerator.ts

Layer: recording  
Lines: 320  
Purpose: ScriptGenerator implementation.

Imports:
- `import { TransactionGroup } from './TransactionGrouper';`

Exports: `LifecycleSelection`, `GenerateOptions`, `ScriptGenerator`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `LifecycleSelection` | Interface | 3 | Defines the LifecycleSelection contract used by the framework. |
| `GenerateOptions` | Interface | 8 | Raw JS code to inject at module scope, AFTER the env declaration and BEFORE the journey lifecycle store. Used by synthetic-source adapters (Postman) that need init-context bindings — e.g. `const photoBytes = await open('../data/photo.jpg', 'b');` for file uploads. The generator auto-adds the appropriate imports when file bindings are detected; callers supply additional imports via `extraImports`. |

#### Class: ScriptGenerator

Line: 41  
Description: Generates formatted TypeScript/JavaScript source code based on Transaction Groups. Output uses the transaction() wrapper and request() helper from the framework utils.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `generate` | `static generate( groups: TransactionGroup[], lifecycle: LifecycleSelection \| undefined, teamName: string, options?: GenerateOptions, ): string` | groups: TransactionGroup[], lifecycle: LifecycleSelection \| undefined, teamName: string, options?: GenerateOptions | string | 46 | Generates formatted TypeScript/JavaScript source code based on Transaction Groups. Output uses the transaction() wrapper and request() helper from the framework utils. |
| `buildPhaseFunction` | `private static buildPhaseFunction( functionName: string, groups: TransactionGroup[], primaryBaseUrl?: string, startRequestId = 0, entryComments?: Map<string,` | functionName: string, groups: TransactionGroup[], primaryBaseUrl?: string, startRequestId = 0, entryComments?: Map<string, { before: string[]; after: string[] }>, entryNames?: Map<string, string>, nameCounters: Map<string, number> = new Map() | string | 112 | Implements the build phase function method. It orchestrates process execution. |
| `deriveRequestName` | `static deriveRequestName(method: string, url: string, counters: Map<string, number>): string` | method: string, url: string, counters: Map<string, number> | string | 235 | Derive a short, identifiable per-request metric name tag in the form `METHOD_lastSegment_n`: - `METHOD` → HTTP verb (GET, POST, …) - `lastSegment` → last non-empty URL path segment, query stripped, sanitized to [A-Za-z0-9_], capped at 25 chars (`/` → `root`) - `_n` → script-wide occurrence count of this exact METHOD_segment (1-based) across all phases and transactions, so repeats are disambiguated and the suffix never resets. Shared default for HAR / cURL / convert; Postman overrides with its item name. `counters` is script-wide and mutated in place. |
| `buildUrlExpression` | `private static buildUrlExpression(absoluteUrl: string, primaryBaseUrl?: string): string` | absoluteUrl: string, primaryBaseUrl?: string | string | 261 | Returns the URL expression to embed directly in the generated script (no extra quoting needed). Same-domain paths become `${env.baseUrl}/path` template literals so request() receives an absolute URL; different-domain URLs are kept as JSON string literals. |
| `buildRequestBody` | `private static buildRequestBody( postData?: TransactionGroup['entries'][number]['postData'], ): string \| null` | postData?: TransactionGroup['entries'][number]['postData'] | string \| null | 278 | Implements the build request body method. |
| `formatInlineObject` | `private static formatInlineObject(obj: Record<string, string>, indent: number): string` | obj: Record<string, string>, indent: number | string | 294 | Inline-format a plain object as a JS object literal at the given indent level. |
| `extractBaseUrls` | `private static extractBaseUrls(groups: TransactionGroup[]): string[]` | groups: TransactionGroup[] | string[] | 307 | Extract unique origin URLs (protocol+host) from all HAR entries in all groups. |


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
Lines: 178  
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
| `collectCheckFailureEvents` | `private static collectCheckFailureEvents( options: BuildEventArtifactsOptions, agent: AgentContext, ): ErrorEvent[]` | options: BuildEventArtifactsOptions, agent: AgentContext | ErrorEvent[] | 70 | Implements the collect check failure events method. |
| `collectThresholdWarningEvents` | `private static collectThresholdWarningEvents( options: BuildEventArtifactsOptions, agent: AgentContext, ): WarningEvent[]` | options: BuildEventArtifactsOptions, agent: AgentContext | WarningEvent[] | 121 | Implements the collect threshold warning events method. |
| `buildAgentContext` | `private static buildAgentContext(): AgentContext` | None | AgentContext | 149 | Implements the build agent context method. |
| `isThresholdBreached` | `private static isThresholdBreached(value: boolean \|` | value: boolean \| { ok?: boolean } | boolean | 159 | k6 --summary-export: true = breached. handleSummary: { ok: false } = breached. |
| `toGroupArray` | `private static toGroupArray(groups?: Record<string, SummaryGroup> \| SummaryGroup[]): SummaryGroup[]` | groups?: Record<string, SummaryGroup> \| SummaryGroup[] | SummaryGroup[] | 165 | Normalize k6 summary groups (object-map or array) to array. |
| `toCheckArray` | `private static toCheckArray(checks?: Record<string, SummaryCheck> \| SummaryCheck[]): SummaryCheck[]` | checks?: Record<string, SummaryCheck> \| SummaryCheck[] | SummaryCheck[] | 172 | Normalize k6 summary checks (object-map or array) to array. |


### core_engine/src/reporting/RunReportGenerator.ts

Layer: reporting  
Lines: 1108  
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
| `escapeHtml` | `private static escapeHtml(value: string): string` | value: string | string | 1099 | Implements the escape html method. |


### core_engine/src/reporting/RunSummaryBuilder.ts

Layer: reporting  
Lines: 101  
Purpose: RunSummaryBuilder implementation.

Imports:
- `import { CiSummary, TimeSeriesFile, TransactionMetricsFile } from '../types/ReportingContracts';`

Exports: `RunSummaryBuilder`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `BuildRunSummaryOptions` | Interface | 3 | Defines the BuildRunSummaryOptions contract used by the framework. |

#### Class: RunSummaryBuilder

Line: 14  
Description: k6 --summary-export: true = breached. handleSummary: { ok: false } = breached.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `buildCiSummary` | `static buildCiSummary(options: BuildRunSummaryOptions): CiSummary` | options: BuildRunSummaryOptions | CiSummary | 15 | Implements the build ci summary method. It orchestrates process execution. |
| `buildEmptyTimeseries` | `static buildEmptyTimeseries(startTime: string, bucketSizeSeconds: number): TimeSeriesFile` | startTime: string, bucketSizeSeconds: number | TimeSeriesFile | 51 | Implements the build empty timeseries method. |
| `countThresholdFailures` | `private static countThresholdFailures(metrics: Record<string,` | metrics: Record<string, { thresholds?: Record<string, boolean \| { ok?: boolean }> }> | number | 65 | Implements the count threshold failures method. |
| `collectFailedThresholdRules` | `private static collectFailedThresholdRules( metrics: Record<string,` | metrics: Record<string, { thresholds?: Record<string, boolean \| { ok?: boolean }> }> | string[] | 77 | Implements the collect failed threshold rules method. |
| `isThresholdBreached` | `private static isThresholdBreached(value: boolean \|` | value: boolean \| { ok?: boolean } | boolean | 92 | k6 --summary-export: true = breached. handleSummary: { ok: false } = breached. |
| `asNumber` | `private static asNumber(value: string \| number \| boolean \| undefined): number \| undefined` | value: string \| number \| boolean \| undefined | number \| undefined | 97 | Implements the as number method. |


### core_engine/src/reporting/TimeseriesArtifactBuilder.ts

Layer: reporting  
Lines: 181  
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

Line: 53  
Description: Implements the timeseries artifact builder class. It orchestrates process execution, enforces validation rules.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `build` | `static async build(options: BuildTimeseriesArtifactOptions): Promise<TimeSeriesFile>` | options: BuildTimeseriesArtifactOptions | Promise<TimeSeriesFile> | 54 | Implements the build  method. It orchestrates process execution, enforces validation rules. |
| `asNumber` | `private static asNumber(value: string \| number \| boolean \| undefined): number` | value: string \| number \| boolean \| undefined | number | 177 | Implements the as number method. |


### core_engine/src/reporting/TimeseriesStreamParser.ts

Layer: reporting  
Lines: 430  
Purpose: TimeseriesStreamParser implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as readline from 'readline';`

Exports: `OverviewBucket`, `TransactionBucket`, `ParsedTimeseries`, `TimeseriesStreamParser`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `OverviewBucket` | Interface | 31 | Defines the OverviewBucket contract used by the framework. |
| `TransactionBucket` | Interface | 52 | Defines the TransactionBucket contract used by the framework. |
| `ParsedTimeseries` | Interface | 67 | Earliest bucket ts observed across all metrics. |
| `OverviewRaw` | Interface | 93 | Defines the OverviewRaw contract used by the framework. |
| `TransactionRaw` | Interface | 106 | Defines the TransactionRaw contract used by the framework. |
| `ParseOptions` | Interface | 117 | Comprehensive transaction-name allowlist drawn from the run's manifest. |
| `RawPoint` | Interface | 123 | Defines the RawPoint contract used by the framework. |
| `TrendStats` | Interface | 394 | Defines the TrendStats contract used by the framework. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getOverview` | `function getOverview(map: Map<number, OverviewRaw>, key: number): OverviewRaw` | map: Map<number, OverviewRaw>, key: number | OverviewRaw | 308 | Implements the get overview function. |
| `finalizeOverview` | `function finalizeOverview( raw: OverviewRaw \| undefined, bucketKey: number, bucketSeconds: number, ): OverviewBucket` | raw: OverviewRaw \| undefined, bucketKey: number, bucketSeconds: number | OverviewBucket | 327 | Implements the finalize overview function. |
| `finalizeTransaction` | `function finalizeTransaction(raw: TransactionRaw \| undefined, bucketKey: number): TransactionBucket` | raw: TransactionRaw \| undefined, bucketKey: number | TransactionBucket | 369 | Implements the finalize transaction function. |
| `computeTrendStats` | `function computeTrendStats(values: number[]): TrendStats` | values: number[] | TrendStats | 409 | Compute Trend-metric stats from a per-bucket sample array. Sorts in place (caller's array is discarded after finalize so the mutation is safe and saves a copy). Percentiles use "nearest-rank" — for k6's small per-bucket sample counts this matches what the dashboard typically shows. |
| `percentile` | `function percentile(sorted: number[], p: number): number` | sorted: number[], p: number | number | 425 | Implements the percentile function. |

#### Class: TimeseriesStreamParser

Line: 128  
Description: Stream-parse the file. Returns `null` if the file doesn't exist or is empty.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `parseFile` | `static async parseFile( streamPath: string, options: ParseOptions, ): Promise<ParsedTimeseries \| null>` | streamPath: string, options: ParseOptions | Promise<ParsedTimeseries \| null> | 130 | Stream-parse the file. Returns `null` if the file doesn't exist or is empty. |


### core_engine/src/reporting/TransactionMetricsBuilder.ts

Layer: reporting  
Lines: 484  
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
| `GroupAggregate` | Interface | 36 | Largest single check `fails` value within this group (and its descendants). Used by the legacy aggregation fallback to compute a strict lower bound on failed iterations (`fail = min(count, maxCheckFails)`). This can never falsely report zero failures and matches the per-iteration Rate metric in the common 1-check-per-iteration case. |

#### Class: TransactionMetricsBuilder

Line: 51  
Description: Approximate standard deviation from percentile data when handleSummary stddev is absent. Uses normal-distribution relationship p90 = avg + 1.282*σ (or p95 = avg + 1.645*σ).

| Property | Type | Line | Description |
|---|---|---:|---|
| `BUILT_IN_METRICS` | Inferred | 52 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `build` | `static build(options: BuildTransactionMetricsOptions): TransactionMetricsFile` | options: BuildTransactionMetricsOptions | TransactionMetricsFile | 74 | Implements the build  method. |
| `buildGroupRow` | `private static buildGroupRow( group: GroupAggregate, trendMetrics: Array<` | group: GroupAggregate, trendMetrics: Array<{ metricName: string; metric: SummaryMetric }>, allMetrics: Record<string, SummaryMetric>, options: BuildTransactionMetricsOptions | TransactionMetricRow | 104 | Implements the build group row method. It orchestrates process execution. |
| `buildMetricOnlyRow` | `private static buildMetricOnlyRow( metricName: string, metric: SummaryMetric, options: BuildTransactionMetricsOptions, ): TransactionMetricRow` | metricName: string, metric: SummaryMetric, options: BuildTransactionMetricsOptions | TransactionMetricRow | 177 | Implements the build metric only row method. |
| `applyConfiguredStats` | `private static applyConfiguredStats( row: TransactionMetricRow, metric: SummaryMetric \| undefined, configuredStats: string[], ): TransactionMetricRow` | row: TransactionMetricRow, metric: SummaryMetric \| undefined, configuredStats: string[] | TransactionMetricRow | 195 | Implements the apply configured stats method. It orchestrates process execution. |
| `approximateStddev` | `private static approximateStddev(metric: SummaryMetric \| undefined): number \| undefined` | metric: SummaryMetric \| undefined | number \| undefined | 247 | Approximate standard deviation from percentile data when handleSummary stddev is absent. Uses normal-distribution relationship p90 = avg + 1.282*σ (or p95 = avg + 1.645*σ). |
| `collectGroups` | `private static collectGroups(rootGroup?: SummaryGroup): GroupAggregate[]` | rootGroup?: SummaryGroup | GroupAggregate[] | 267 | Implements the collect groups method. |
| `aggregateGroup` | `private static aggregateGroup(group: SummaryGroup): GroupAggregate` | group: SummaryGroup | GroupAggregate | 308 | Aggregate native k6 `check()` totals for a single root_group node. IMPORTANT — what these numbers are: k6 records per-check `{ passes, fails }` aggregates under the group the check executed in. These are NATIVE k6 check counts, NOT per-iteration transaction outcomes. A single transaction iteration may evaluate the same check multiple times (multi-request transactions, retry loops), so summed `passes`/`fails` don't directly map to "iterations passed/failed". This function feeds the legacy aggregation fallback used by `buildGroupRow` when the per-iteration `<name>_checkrate` Rate metric is absent (older runs or scripts that don't use `transaction()`). In that fallback path: - `count` ← min(check.passes + check.fails) per check, summed across nested groups (rough lower bound on transaction iterations when no Counter exists) - `pass` ← min(check.passes), summed across nested groups (legacy "min of passes" semantic — kept only for diagnostic interest; superseded by maxCheckFails) - `maxCheckFails` ← max single check's `fails` value across this group and descendants. The fallback uses this as a best-effort estimate of failed iterations: `fail = min(count, maxCheckFails)`. NOT a tight bound — it under-counts when failures spread across multiple checks and can over-cap to `count` when a single check runs multiple times per iteration. Best we can do without the Rate metric; rows using this path are flagged. The exact, non-estimated values come from `<name>_checkrate` (a Rate metric pushed exactly once per transaction iteration by `transaction()`); see Proposal 3 in `ai_context/design-proposals.md`. |
| `toGroupArray` | `private static toGroupArray(groups?: Record<string, SummaryGroup> \| SummaryGroup[]): SummaryGroup[]` | groups?: Record<string, SummaryGroup> \| SummaryGroup[] | SummaryGroup[] | 349 | Normalize k6 summary groups (object-map or array) to array. |
| `toCheckArray` | `private static toCheckArray(checks?: Record<string, SummaryCheck> \| SummaryCheck[]): SummaryCheck[]` | checks?: Record<string, SummaryCheck> \| SummaryCheck[] | SummaryCheck[] | 356 | Normalize k6 summary checks (object-map or array) to array. |
| `isTrend` | `private static isTrend(metric: SummaryMetric): boolean` | metric: SummaryMetric | boolean | 364 | Detect Trend metrics by presence of 'avg' (only Trend metrics have it). |
| `metricValue` | `private static metricValue(metric: SummaryMetric, key: string): number \| undefined` | metric: SummaryMetric, key: string | number \| undefined | 369 | Read a metric value from either handleSummary (values.key) or --summary-export (flat key). |
| `isTransactionMetric` | `private static isTransactionMetric( metricName: string, metric: SummaryMetric, groups: GroupAggregate[], ): boolean` | metricName: string, metric: SummaryMetric, groups: GroupAggregate[] | boolean | 376 | Implements the is transaction metric method. |
| `findMatchingMetric` | `private static findMatchingMetric( groupName: string, trendMetrics: Array<` | groupName: string, trendMetrics: Array<{ metricName: string; metric: SummaryMetric }> | SummaryMetric \| undefined | 397 | Implements the find matching metric method. |
| `findCounterValue` | `private static findCounterValue( groupName: string, allMetrics: Record<string, SummaryMetric>, ): number \| undefined` | groupName: string, allMetrics: Record<string, SummaryMetric> | number \| undefined | 412 | Find <name>_count Counter metric and return its count value. |
| `findResultMetric` | `private static findResultMetric( groupName: string, allMetrics: Record<string, SummaryMetric>, ): SummaryMetric \| undefined` | groupName: string, allMetrics: Record<string, SummaryMetric> | SummaryMetric \| undefined | 433 | Find the <name>_checkrate Rate metric for a transaction, if present. Emitted by transaction() (Proposal 3): one sample per iteration carrying whether that iteration observed any failure (failed k6Check or thrown error). Exact per-iteration counts — no approximation. |
| `displayName` | `private static displayName(metricName: string): string` | metricName: string | string | 448 | Implements the display name method. |
| `normalize` | `private static normalize(value: string): string` | value: string | string | 452 | Implements the normalize method. |
| `mapStatToMetricValueKey` | `private static mapStatToMetricValueKey(stat: string): string \| undefined` | stat: string | string \| undefined | 460 | Implements the map stat to metric value key method. |


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
Lines: 79  
Purpose: TimeseriesRuntime implementation.

Imports:
- `import { TimeSeriesFile, TimeSeriesPoint } from '../types/ReportingContracts';`

Exports: `TimeseriesRuntime`

#### Class: TimeseriesRuntime

Line: 3  
Description: Implements the timeseries runtime class.

| Property | Type | Line | Description |
|---|---|---:|---|
| `overview` | Inferred | 4 | Class state or configuration value used by the class methods. |
| `transactions` | Inferred | 5 | Class state or configuration value used by the class methods. |
| `system` | Inferred | 6 | Class state or configuration value used by the class methods. |
| `events` | TimeSeriesFile['series']['events'] | 7 | Class state or configuration value used by the class methods. |

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `constructor` | `constructor( private readonly bucketSizeSeconds: number, private readonly startTime: string, )` | private readonly bucketSizeSeconds: number, private readonly startTime: string | Inferred | 9 | Implements the constructor method. |
| `bucketTs` | `private bucketTs(ts: string): string` | ts: string | string | 14 | Implements the bucket ts method. |
| `addOverviewPoint` | `addOverviewPoint(ts: string, values: Record<string, number>): void` | ts: string, values: Record<string, number> | void | 20 | Implements the add overview point method. |
| `addTransactionPoint` | `addTransactionPoint(transaction: string, ts: string, values: Record<string, number>): void` | transaction: string, ts: string, values: Record<string, number> | void | 29 | Implements the add transaction point method. |
| `addSystemPoint` | `addSystemPoint(agent: string, ts: string, values: Record<string, number>): void` | agent: string, ts: string, values: Record<string, number> | void | 40 | Implements the add system point method. |
| `addEvent` | `addEvent(ts: string, type: string, severity: 'error' \| 'warning', transaction?: string): void` | ts: string, type: string, severity: 'error' \| 'warning', transaction?: string | void | 51 | Implements the add event method. |
| `build` | `build(endTime: string): TimeSeriesFile` | endTime: string | TimeSeriesFile | 55 | Implements the build  method. |


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
Lines: 443  
Purpose: ScenarioBuilder implementation.

Imports:
- `import { GlobalLoadProfile, TestPlan, UserJourney } from '../types/TestPlanSchema';`
- `import { ExecutorFactory } from './ExecutorFactory';`

Exports: `K6ScenarioDefinition`, `K6ScenariosMap`, `ScenarioRuntimeMetadata`, `ScenarioBuilder`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `K6ScenarioDefinition` | Interface | 11 | k6-native scenario definition (what goes into options.scenarios) |
| `K6ScenariosMap` | TypeAlias | 28 | Defines the K6ScenariosMap contract used by the framework. |
| `ScenarioRuntimeMetadata` | Interface | 30 | Per-journey transaction names injected as K6_PERF_TRANSACTION_NAMES for auto-registration. |
| `ScenarioPhaseEnvelope` | Interface | 67 | Defines the ScenarioPhaseEnvelope contract used by the framework. |

#### Class: ScenarioBuilder

Line: 91  
Description: Build a k6 options.scenarios map from a test plan. Handles parallel, sequential, and hybrid execution modes.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `build` | `static build(plan: TestPlan, metadata?: ScenarioRuntimeMetadata): K6ScenariosMap` | plan: TestPlan, metadata?: ScenarioRuntimeMetadata | K6ScenariosMap | 96 | Build a k6 options.scenarios map from a test plan. Handles parallel, sequential, and hybrid execution modes. |
| `buildParallel` | `private static buildParallel( plan: TestPlan, metadata?: ScenarioRuntimeMetadata, ): K6ScenariosMap` | plan: TestPlan, metadata?: ScenarioRuntimeMetadata | K6ScenariosMap | 113 | Implements the build parallel method. It orchestrates process execution. |
| `buildSequential` | `private static buildSequential( plan: TestPlan, metadata?: ScenarioRuntimeMetadata, ): K6ScenariosMap` | plan: TestPlan, metadata?: ScenarioRuntimeMetadata | K6ScenariosMap | 140 | Implements the build sequential method. It orchestrates process execution. |
| `buildHybrid` | `private static buildHybrid( plan: TestPlan, metadata?: ScenarioRuntimeMetadata, ): K6ScenariosMap` | plan: TestPlan, metadata?: ScenarioRuntimeMetadata | K6ScenariosMap | 172 | Implements the build hybrid method. It orchestrates process execution. |
| `sanitizeExecName` | `private static sanitizeExecName(name: string): string` | name: string | string | 241 | Sanitize journey name to a valid k6 exec function name |
| `buildScenarioEnv` | `private static buildScenarioEnv( plan: TestPlan, journey: UserJourney, execName: string, metadata?: ScenarioRuntimeMetadata, existingEnv?: Record<string, string>, ): Record<stri...` | plan: TestPlan, journey: UserJourney, execName: string, metadata?: ScenarioRuntimeMetadata, existingEnv?: Record<string, string> | Record<string, string> \| undefined | 245 | Implements the build scenario env method. It orchestrates process execution. |
| `computePhaseEnvelope` | `private static computePhaseEnvelope( profile: GlobalLoadProfile, existingEnv?: Record<string, string>, ): ScenarioPhaseEnvelope` | profile: GlobalLoadProfile, existingEnv?: Record<string, string> | ScenarioPhaseEnvelope | 294 | Implements the compute phase envelope method. It orchestrates process execution, parses structured configuration or artifact data. |
| `computeDebugPhaseEnvelope` | `static computeDebugPhaseEnvelope(profile: GlobalLoadProfile): ScenarioPhaseEnvelope` | profile: GlobalLoadProfile | ScenarioPhaseEnvelope | 411 | Implements the compute debug phase envelope method. |
| `estimateTotalDurationSeconds` | `private static estimateTotalDurationSeconds(profile: GlobalLoadProfile): number` | profile: GlobalLoadProfile | number | 416 | Estimate total duration of a load profile in seconds |
| `parseDurationToSeconds` | `private static parseDurationToSeconds(duration: string): number` | duration: string | number | 429 | Parse k6 duration strings: '2m', '30s', '1h30m' |


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
Lines: 174  
Purpose: buildLoadProfile, buildStressProfile, buildSoakProfile, buildSpikeProfile helpers or command handlers.

Imports:
- `import { GlobalLoadProfile, LoadStage } from '../types/TestPlanSchema';`

Exports: `K6ExecutorConfig`, `buildLoadProfile`, `buildStressProfile`, `buildSoakProfile`, `buildSpikeProfile`, `buildIterationProfile`, `buildConstantArrivalRateProfile`, `buildRampingArrivalRateProfile`, `buildExternallyControlledProfile`, `toK6ExecutorConfig`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `K6ExecutorConfig` | Interface | 12 | k6-native scenario executor config (partial, used for options.scenarios) |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `buildLoadProfile` | `export function buildLoadProfile(options:` | options: { rampUp: string; steady: string; rampDown: string; targetVUs: number; } | GlobalLoadProfile | 33 | Build a standard load test: ramp-up -> steady -> ramp-down |
| `buildStressProfile` | `export function buildStressProfile(options:` | options: { targetVUs: number; rampUp?: string; steady?: string; rampDown?: string; } | GlobalLoadProfile | 51 | Build a stress test: aggressive ramp-up, short steady, ramp-down |
| `buildSoakProfile` | `export function buildSoakProfile(options:` | options: { targetVUs: number; duration: string; rampUp?: string; rampDown?: string; } | GlobalLoadProfile | 66 | Build a soak test: low steady load for an extended duration |
| `buildSpikeProfile` | `export function buildSpikeProfile(options:` | options: { baselineVUs: number; spikeVUs: number; spikeDuration?: string; } | GlobalLoadProfile | 81 | Build a spike test: sudden surge then back to baseline |
| `buildIterationProfile` | `export function buildIterationProfile(options:` | options: { vus: number; iterations: number; } | GlobalLoadProfile | 100 | Build a fixed-iteration profile |
| `buildConstantArrivalRateProfile` | `export function buildConstantArrivalRateProfile(options:` | options: { rate: number; duration: string; preAllocatedVUs: number; timeUnit?: string; maxVUs?: number; } | GlobalLoadProfile | 112 | Build a constant arrival-rate profile |
| `buildRampingArrivalRateProfile` | `export function buildRampingArrivalRateProfile(options:` | options: { stages: LoadStage[]; preAllocatedVUs: number; timeUnit?: string; maxVUs?: number; } | GlobalLoadProfile | 130 | Build a ramping arrival-rate profile |
| `buildExternallyControlledProfile` | `export function buildExternallyControlledProfile(options:` | options: { maxVUs: number; vus?: number; duration?: string; } | GlobalLoadProfile | 146 | Build an externally-controlled profile |
| `toK6ExecutorConfig` | `export function toK6ExecutorConfig(profile: GlobalLoadProfile): K6ExecutorConfig` | profile: GlobalLoadProfile | K6ExecutorConfig | 160 | Translate a GlobalLoadProfile into a k6 executor config block |


### core_engine/src/types/ConfigContracts.ts

Layer: types  
Lines: 170  
Purpose: Framework file.

Imports:
- `import { DataOverflowStrategy } from './TestPlanSchema';`

Exports: `export { DataOverflowStrategy };`, `EnvironmentCustomValue`, `TeamEnvironmentOverride`, `EnvironmentConfig`, `ErrorBehavior`, `ThinkTimeMode`, `ThinkTimeConfig`, `PacingConfig`, `HttpConfig`, `TimeSeriesReportingConfig`, `ReportingConfig`, `ErrorCaptureConfig`, `MonitoringConfig`, `RuntimeSettings`, `FRAMEWORK_DEFAULTS`, `ResolvedConfig`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `EnvironmentCustomValue` | TypeAlias | 8 | Defines the EnvironmentCustomValue contract used by the framework. |
| `TeamEnvironmentOverride` | Interface | 10 | Optional per-team base URL override |
| `EnvironmentConfig` | Interface | 19 | Logical name of the environment: dev \| staging \| uat \| prod |
| `ErrorBehavior` | TypeAlias | 30 | Defines the ErrorBehavior contract used by the framework. |
| `ThinkTimeMode` | TypeAlias | 31 | Defines the ThinkTimeMode contract used by the framework. |
| `ThinkTimeConfig` | Interface | 33 | Fixed think time in seconds (used when mode = 'fixed') |
| `PacingConfig` | Interface | 43 | Enable pacing (iteration-based rate control) |
| `HttpConfig` | Interface | 50 | Global HTTP request timeout in seconds |
| `TimeSeriesReportingConfig` | Interface | 59 | Enable bucketed timeseries collection for interactive reports |
| `ReportingConfig` | Interface | 75 | Visible transaction stats/columns in reports |
| `ErrorCaptureConfig` | Interface | 86 | Capture snapshots for supported failures |
| `MonitoringConfig` | Interface | 97 | Enable runner-side host monitoring |
| `RuntimeSettings` | Interface | 108 | Debug mode – prints resolved config; enables verbose logging |
| `ResolvedConfig` | Interface | 162 | Merged CLI overrides (highest precedence after .env secrets) |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `FRAMEWORK_DEFAULTS` | RuntimeSettings | 124 | Module-level constant or configuration value. |


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
Lines: 42  
Purpose: Framework file.

Exports: `HAREntry`, `HARRefinementOptions`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `HAREntry` | Interface | 1 | When set, ScriptGenerator emits this string as a RAW JS expression for the request body — bypassing the default JSON.stringify of `text`. Use this when the body needs to reference module-scope bindings, e.g. file uploads (`expression: 'photoBytes'`) or multipart with file fields (`expression: "{ name: 'alice', photo: http.file(photoBytes, 'photo.jpg', 'image/jpeg') }"`). Synthetic HAR sources (Postman / cURL) can use this to wire up init-context code without changing the per-request emission shape. |
| `HARRefinementOptions` | Interface | 37 | Defines the HARRefinementOptions contract used by the framework. |


### core_engine/src/types/ReportingContracts.ts

Layer: types  
Lines: 140  
Purpose: Framework file.

Imports:
- `import { AgentContext } from './EventContracts';`

Exports: `TransactionMetricRow`, `TransactionMetricsFile`, `CiTransactionSummary`, `CiSummary`, `TimeSeriesPoint`, `TimeSeriesFile`, `ReportBundleMeta`, `ReportBundleConfig`, `ReportBundle`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `TransactionMetricRow` | Interface | 3 | True when pass/fail were derived from raw k6 check aggregates (legacy fallback) instead of the per-iteration `<name>_checkrate` Rate metric. Estimates can both under-count (failures span multiple checks) and over-count (a single check runs more than once per iteration); they are shown only when no Rate metric is available. See Proposal 3 in `ai_context/design-proposals.md`. |
| `TransactionMetricsFile` | Interface | 25 | True when at least one row in `transactions` was produced via the legacy aggregation fallback (`estimated: true`). Lets downstream consumers emit a single run-level warning without iterating the row list. |
| `CiTransactionSummary` | Interface | 37 | Defines the CiTransactionSummary contract used by the framework. |
| `CiSummary` | Interface | 50 | Defines the CiSummary contract used by the framework. |
| `TimeSeriesPoint` | Interface | 88 | A single time-series bucket point. Fields beyond `ts` are open-ended on purpose: the same shape is used for overview, per-transaction, and per- agent series, and the field set has expanded over time (Proposal 5 adds per-second `httpDurationP95`, `requestRate`, `httpFailedRate`, etc.; older runs may only carry the legacy `avg` / `p95` / `errorRate` keys). Renderers should treat any field as optional and fall back gracefully. Overview point keys (Wave 1): requests, requestRate, httpDurationAvg, httpDurationP90, httpDurationP95, httpDurationP99, httpDurationMin, httpDurationMax, httpFailedCount, httpFailedRate, vus, vusMax, iterations, iterationDurationAvg, iterationDurationP95, dataReceived, dataSent (plus legacy: errorRate, avgDuration, p95Duration) Per-transaction point keys: count, durationAvg, durationP90, durationP95, durationP99, durationMin, durationMax, pass, fail (plus legacy: avg, min, max, p90, p95, p99) Per-agent system point keys: cpuPercent, memoryPercent, activeAgents |
| `TimeSeriesFile` | Interface | 93 | Defines the TimeSeriesFile contract used by the framework. |
| `ReportBundleMeta` | Interface | 110 | Defines the ReportBundleMeta contract used by the framework. |
| `ReportBundleConfig` | Interface | 120 | Defines the ReportBundleConfig contract used by the framework. |
| `ReportBundle` | Interface | 126 | Defines the ReportBundle contract used by the framework. |


### core_engine/src/types/TestPlanSchema.ts

Layer: types  
Lines: 163  
Purpose: Framework file.

Exports: `ExecutionMode`, `ExecutorType`, `WorkloadModelType`, `DataOverflowStrategy`, `LoadStage`, `GlobalLoadProfile`, `UserJourney`, `HybridGroup`, `SLADefinition`, `DebugSettings`, `TestPlan`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `ExecutionMode` | TypeAlias | 7 | TestPlanSchema.ts Phase 1 – Test plan JSON/YAML contract. This is the primary input that drives scenario orchestration. |
| `ExecutorType` | TypeAlias | 8 | Defines the ExecutorType contract used by the framework. |
| `WorkloadModelType` | TypeAlias | 17 | Defines the WorkloadModelType contract used by the framework. |
| `DataOverflowStrategy` | TypeAlias | 18 | Defines the DataOverflowStrategy contract used by the framework. |
| `LoadStage` | Interface | 24 | k6 duration string: '2m', '30s', '1h' |
| `GlobalLoadProfile` | Interface | 35 | Starting VU count (ramping executors) |
| `UserJourney` | Interface | 61 | Unique name – used as the k6 scenario key |
| `HybridGroup` | Interface | 90 | Defines the HybridGroup contract used by the framework. |
| `SLADefinition` | Interface | 99 | Max error rate percent (0–100) |
| `DebugSettings` | Interface | 116 | When true, journeys run in single-purpose debug replay mode instead of normal load mode |
| `TestPlan` | Interface | 137 | Human-readable test plan name |


### core_engine/src/utils/lifecycle.ts

Layer: utils  
Lines: 430  
Purpose: createTrackedProxy, createContext, createState, parseJsonEnv helpers or command handlers.

Imports:
- `import { sleep } from 'k6';`
- `import exec from 'k6/execution';`
- `import { Counter } from 'k6/metrics';`
- `import { isVuTerminated } from './transaction.js';`
- `import { trackCorrelation, trackParameter } from './replayLogger.js';`

Exports: `JourneyLifecycleStore`, `PhaseFns`, `createJourneyLifecycleStore`, `thinktime`, `TransactionGate`, `getTransactionGate`, `runJourneyLifecycle`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `JourneyContext` | Interface | 14 | Defines the JourneyContext contract used by the framework. |
| `JourneyState` | Interface | 21 | Defines the JourneyState contract used by the framework. |
| `JourneyLifecycleStore` | Interface | 27 | Defines the JourneyLifecycleStore contract used by the framework. |
| `PhaseFns` | Interface | 32 | Defines the PhaseFns contract used by the framework. |
| `RuntimeMetadata` | Interface | 38 | Defines the RuntimeMetadata contract used by the framework. |
| `PhaseMetadata` | Interface | 44 | Defines the PhaseMetadata contract used by the framework. |
| `TimelineStage` | Interface | 57 | Defines the TimelineStage contract used by the framework. |
| `InstantaneousState` | Interface | 62 | True only when we are in the LAST stage of the timeline and it is ramping down to 0 |
| `EndSignal` | Interface | 69 | Defines the EndSignal contract used by the framework. |
| `TransactionGate` | Interface | 359 | Defines the TransactionGate contract used by the framework. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `__ENV` | Record<string, string \| undefined> | 10 | Module-level constant or configuration value. |
| `frameworkIterations` | Inferred | 76 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `createTrackedProxy` | `function createTrackedProxy(sourceName: string, type: 'correlation' \| 'parameter'): Record<string, unknown>` | sourceName: string, type: 'correlation' \| 'parameter' | Record<string, unknown> | 85 | Wraps a context sub-object in a Proxy so that every scalar assignment (`ctx.correlation["x"] = v`, `ctx.session.token = v`, etc.) is automatically registered in the replay variable registry. detectVariableEvents then finds those values inside request URLs/bodies/headers and maps them back to their variable names — no trackCorrelation / trackParameter calls needed in scripts. |
| `createContext` | `function createContext(): JourneyContext` | None | JourneyContext | 102 | Implements the create context function. |
| `createState` | `function createState(): JourneyState` | None | JourneyState | 111 | Implements the create state function. |
| `parseJsonEnv` | `function parseJsonEnv<T>(name: string, fallback: T): T` | name: string, fallback: T | T | 119 | Implements the parse json env function. It parses structured configuration or artifact data. |
| `getRuntimeMetadata` | `function getRuntimeMetadata(): RuntimeMetadata` | None | RuntimeMetadata | 127 | Implements the get runtime metadata function. |
| `getPhaseMetadata` | `function getPhaseMetadata(): PhaseMetadata` | None | PhaseMetadata | 135 | Implements the get phase metadata function. |
| `getInstantaneousState` | `function getInstantaneousState(phases: PhaseMetadata): InstantaneousState` | phases: PhaseMetadata | InstantaneousState | 159 | Compute the instantaneous target VU count and whether we're in a decreasing stage. |
| `getEndSignal` | `function getEndSignal(phases: PhaseMetadata): EndSignal` | phases: PhaseMetadata | EndSignal | 207 | Determine whether this VU should transition to endPhase. Returns { beforeAction, afterAction } where: beforeAction: true → skip action, run endPhase immediately afterAction: true → after current action completes, run endPhase Key design choices: - Uses Math.floor(target) so the check fires as soon as k6 starts removing VUs, not 1.5s later (which Math.ceil would cause). - Only fires during DECREASING stages to prevent false triggers during ramp-up when a new VU's ID momentarily exceeds the target. - k6 removes highest-numbered VUs first, so vuId > floor(target) correctly identifies which VUs should run endPhase. |
| `handlePhaseError` | `function handlePhaseError( store: JourneyLifecycleStore, error: unknown, phaseName: string, runtime: RuntimeMetadata, ): string` | store: JourneyLifecycleStore, error: unknown, phaseName: string, runtime: RuntimeMetadata | string | 271 | Implements the handle phase error function. It orchestrates process execution, emits operator-facing output. |
| `runSafely` | `function runSafely( store: JourneyLifecycleStore, phaseName: string, phaseFn: ((ctx: JourneyContext) => void) \| undefined, runtime: RuntimeMetadata, ): string` | store: JourneyLifecycleStore, phaseName: string, phaseFn: ((ctx: JourneyContext) => void) \| undefined, runtime: RuntimeMetadata | string | 294 | Implements the run safely function. |
| `createJourneyLifecycleStore` | `export function createJourneyLifecycleStore(): JourneyLifecycleStore` | None | JourneyLifecycleStore | 312 | Implements the create journey lifecycle store function. |
| `thinktime` | `export function thinktime(minOrFixed?: number, max?: number): void` | minOrFixed?: number, max?: number | void | 319 | Implements the thinktime function. |
| `getTransactionGate` | `export function getTransactionGate(): TransactionGate` | None | TransactionGate | 365 | Implements the get transaction gate function. It orchestrates process execution, emits operator-facing output. |
| `runJourneyLifecycle` | `export function runJourneyLifecycle(store: JourneyLifecycleStore, phaseFns: PhaseFns): void` | store: JourneyLifecycleStore, phaseFns: PhaseFns | void | 378 | Implements the run journey lifecycle function. It orchestrates process execution. |


### core_engine/src/utils/LiveConsoleLogStream.ts

Layer: utils  
Lines: 94  
Purpose: startLiveConsoleLogStream helpers or command handlers.

Imports:
- `import * as fs from 'fs';`
- `import { Logger } from './logger';`

Exports: `startLiveConsoleLogStream`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `LIVE_CONSOLE_POLL_MS` | Inferred | 26 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `startLiveConsoleLogStream` | `export function startLiveConsoleLogStream(runLogPath: string):` | runLogPath: string | { stop: () => void } | 28 | Implements the start live console log stream function. It performs file-system work, orchestrates process execution, parses structured configuration or artifact data, enforces validation rules, emits operator-facing output. |


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
Lines: 53  
Purpose: PathResolver implementation.

Imports:
- `import * as fs from 'fs';`
- `import * as path from 'path';`

Exports: `PathResolver`

#### Class: PathResolver

Line: 9  
Description: Resolves a script path name. 1. If it's an exact file that exists, returns the absolute path. 2. If it's just a filename (e.g. `browse-journey.js`), deeply searches `testSuites` for a match.

| Method | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `resolve` | `static resolve(targetPath: string, searchRoot: string = 'testSuites'): string \| null` | targetPath: string, searchRoot: string = 'testSuites' | string \| null | 19 | Resolves a script path name. 1. If it's an exact file that exists, returns the absolute path. 2. If it's just a filename (e.g. `browse-journey.js`), deeply searches `testSuites` for a match. |
| `recursiveSearch` | `private static recursiveSearch(dir: string, targetFile: string): string \| null` | dir: string, targetFile: string | string \| null | 35 | Implements the recursive search method. It performs file-system work. |


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
Lines: 434  
Purpose: trackCorrelation, trackParameter, trackDataRow, detectVariableEvents helpers or command handlers.

Imports:
- `import exec from 'k6/execution';`
- `import http from 'k6/http';`

Exports: `trackCorrelation`, `trackParameter`, `trackDataRow`, `createVariableEvent`, `logReplayExchange`, `logExchange`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `VariableRegistryEntry` | Interface | 10 | Defines the VariableRegistryEntry contract used by the framework. |
| `VariableEvent` | Interface | 17 | Defines the VariableEvent contract used by the framework. |
| `Cookie` | Interface | 25 | Defines the Cookie contract used by the framework. |
| `NormalizedHeader` | Interface | 30 | Defines the NormalizedHeader contract used by the framework. |
| `ExchangeMeta` | Interface | 35 | Defines the ExchangeMeta contract used by the framework. |
| `RequestInfo` | Interface | 44 | Per-request cookies passed to k6 (from options.cookies). |
| `K6Response` | Interface | 56 | Defines the K6Response contract used by the framework. |
| `RequestDefinition` | Interface | 65 | Defines the RequestDefinition contract used by the framework. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `__ENV` | Record<string, string \| undefined> | 6 | Module-level constant or configuration value. |
| `iterationState` | Record<string, number> | 82 | Module-level constant or configuration value. |
| `_variableRegistry` | Record<string, VariableRegistryEntry> | 88 | Module-level constant or configuration value. |
| `BINARY_CONTENT_RE` | Inferred | 249 | Module-level constant or configuration value. |
| `BINARY_MIME_TYPES` | Inferred | 250 | Module-level constant or configuration value. |
| `STATIC_EXT_RE` | Inferred | 260 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `trackCorrelation` | `export function trackCorrelation(name: string, value: unknown, source?: string): unknown` | name: string, value: unknown, source?: string | unknown | 95 | Register a correlation variable at the point of extraction. Call this right after a regex match or similar extraction. Returns the value for inline use: correlation_vars["x"] = trackCorrelation("x", match[1], "body"); |
| `trackParameter` | `export function trackParameter(name: string, value: unknown, source?: string): unknown` | name: string, value: unknown, source?: string | unknown | 105 | Register a parameterisation variable (e.g. from CSV data). Call once per parameter per iteration. Returns the value. |
| `trackDataRow` | `export function trackDataRow(sourceName: string, rowObject: Record<string, unknown> \| null): Record<string, unknown> \| null` | sourceName: string, rowObject: Record<string, unknown> \| null | Record<string, unknown> \| null | 117 | Auto-register all properties from a data row object. Call once per data file per iteration. Registers every key-value pair as a parameter. e.g. trackDataRow("userdetails", getUniqueItem(FILES["userdetails"])) will register p_username, p_password, etc. — whatever columns the CSV has. |
| `detectVariableEvents` | `function detectVariableEvents( url: string \| object \| undefined, body: string \| object \| null \| undefined, headers: Record<string, string \| string[]>, actualHeaders?: Record<str...` | url: string \| object \| undefined, body: string \| object \| null \| undefined, headers: Record<string, string \| string[]>, actualHeaders?: Record<string, string \| string[]> | VariableEvent[] | 132 | Auto-detect which registered variables were used in this request. Scans url, body (stringified), and header values for exact matches of tracked variable values. Pass actualHeaders when available so auto-managed headers (Cookie from jar, etc.) are also scanned. |
| `extractQueryParams` | `function extractQueryParams(url: string): Record<string, string>` | url: string | Record<string, string> | 161 | Implements the extract query params function. |
| `extractCookies` | `function extractCookies(headers: Record<string, string \| string[]> =` | headers: Record<string, string \| string[]> = {} | Cookie[] | 174 | Implements the extract cookies function. |
| `extractK6ResponseCookies` | `function extractK6ResponseCookies(resCookies: Record<string, Array<` | resCookies: Record<string, Array<{ value: string }>> | Cookie[] | 202 | Extract cookies from k6's res.cookies object. k6 returns: { cookieName: [{ name, value, domain, path, ... }], ... } |
| `extractJarCookies` | `function extractJarCookies(url: string): Cookie[]` | url: string | Cookie[] | 221 | Extract request cookies from k6's cookie jar for a given URL. Uses http.cookieJar().cookiesForURL() which returns all cookies the VU's jar would send to that URL (including auto-managed ones). Returns: [{ name, value }, ...] |
| `normalizeHeaders` | `function normalizeHeaders(headers: Record<string, string \| string[]> =` | headers: Record<string, string \| string[]> = {} | NormalizedHeader[] | 242 | Implements the normalize headers function. |
| `binaryBodyPlaceholder` | `function binaryBodyPlaceholder(url: string, responseHeaders: Record<string, string \| string[]>): string \| null` | url: string, responseHeaders: Record<string, string \| string[]> | string \| null | 266 | Determine whether response body should be omitted from the replay log. Returns a placeholder string for binary/static content, or null when body is fine. |
| `currentIteration` | `function currentIteration(): number` | None | number | 283 | Implements the current iteration function. It orchestrates process execution. |
| `currentVu` | `function currentVu(): number` | None | number | 287 | Implements the current vu function. It orchestrates process execution. |
| `nextRequestSequence` | `function nextRequestSequence(iteration: number): number` | iteration: number | number | 291 | Implements the next request sequence function. |
| `createVariableEvent` | `export function createVariableEvent( name: string, type: string, action: string, value: unknown, source: string, ): VariableEvent` | name: string, type: string, action: string, value: unknown, source: string | VariableEvent | 297 | Implements the create variable event function. |
| `logReplayExchange` | `export function logReplayExchange( meta: ExchangeMeta, requestInfo: RequestInfo, response: K6Response \| null \| undefined, ): void` | meta: ExchangeMeta, requestInfo: RequestInfo, response: K6Response \| null \| undefined | void | 313 | Implements the log replay exchange function. It orchestrates process execution, emits operator-facing output. |
| `logExchange` | `export function logExchange(req: RequestDefinition, res: K6Response \| null \| undefined): void` | req: RequestDefinition, res: K6Response \| null \| undefined | void | 413 | Compact debug-only logger. Only logs when K6_PERF_DEBUG env var is set. Accepts the request definition object (as generated by ScriptGenerator/ScriptConverter) and the k6 response. Variable events are auto-detected from the registry. |


### core_engine/src/utils/request.ts

Layer: utils  
Lines: 378  
Purpose: getRuntimeErrorBehavior, applyErrorBehaviorForStatus, nextRequestId, getSnapshotConfig helpers or command handlers.

Imports:
- `import http from 'k6/http';`
- `import exec from 'k6/execution';`
- `import { resolvePath, registerBaseUrl } from './session.js';`
- `import { getCurrentTransaction } from './transaction.js';`
- `import { logExchange } from './replayLogger.js';`

Exports: `CookieValue`, `RequestBody`, `HttpMethod`, `RequestOptions`, `request`

| Type | Kind | Line | Description |
|---|---|---:|---|
| `RequestReplayMeta` | Interface | 13 | Stable request identifier used for debug diff matching (e.g. "req_1"). |
| `CookieValue` | Interface | 22 | Cookie value object — k6's per-request cookie format. |
| `RequestBody` | TypeAlias | 35 | All body types k6 accepts natively. string → sent as-is (set Content-Type header explicitly) ArrayBuffer / SharedArrayBuffer → binary payload Record<string, string\|number\|bool> → k6 form-encodes as application/x-www-form-urlencoded null → explicitly empty body |
| `HttpMethod` | TypeAlias | 46 | Common HTTP methods with IDE autocomplete. Any other string (e.g. 'CONNECT', 'TRACE', custom verbs) is also accepted and routed through http.request(). |
| `RequestOptions` | Interface | 56 | Metric name for this request (appears in k6 output and transaction grouping). |
| `SnapshotConfig` | Interface | 116 | Defines the SnapshotConfig contract used by the framework. |

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `__ENV` | Record<string, string \| undefined> | 9 | Module-level constant or configuration value. |
| `_iterationRequestCount` | Record<string, number> | 155 | Module-level constant or configuration value. |
| `_snapshotConfigCache` | SnapshotConfig \| null | 165 | Module-level constant or configuration value. |
| `_snapshotCount` | Inferred | 197 | Module-level constant or configuration value. |
| `STRIP_HEADERS` | Inferred | 201 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getRuntimeErrorBehavior` | `function getRuntimeErrorBehavior(): string` | None | string | 127 | Implements the get runtime error behavior function. It parses structured configuration or artifact data. |
| `applyErrorBehaviorForStatus` | `function applyErrorBehaviorForStatus(method: string, url: string, status: number): void` | method: string, url: string, status: number | void | 138 | Implements the apply error behavior for status function. It orchestrates process execution. |
| `nextRequestId` | `function nextRequestId(): string` | None | string | 157 | Implements the next request id function. |
| `getSnapshotConfig` | `function getSnapshotConfig(): SnapshotConfig` | None | SnapshotConfig | 167 | Implements the get snapshot config function. It parses structured configuration or artifact data, enforces validation rules. |
| `sanitizeHeaders` | `function sanitizeHeaders(headers?: Record<string, string>): Record<string, string> \| undefined` | headers?: Record<string, string> | Record<string, string> \| undefined | 203 | Implements the sanitize headers function. |
| `serializeBodyForLog` | `function serializeBodyForLog(body: RequestBody \| undefined): string \| undefined` | body: RequestBody \| undefined | string \| undefined | 216 | Implements the serialize body for log function. |
| `emitSnapshotEvent` | `function emitSnapshotEvent( method: string, resolvedUrl: string, options: RequestOptions \| undefined, res: any, ): void` | method: string, resolvedUrl: string, options: RequestOptions \| undefined, res: any | void | 225 | Implements the emit snapshot event function. It orchestrates process execution, emits operator-facing output. |
| `request` | `export function request( method: HttpMethod, pathOrUrl: string, options?: RequestOptions, ): any` | method: HttpMethod, pathOrUrl: string, options?: RequestOptions | any | 269 | Execute an HTTP request in a framework-aware way and return the native k6 Response. Accepts every body type, HTTP method, and param that k6 supports natively. See RequestOptions for the full set of supported options. |


### core_engine/src/utils/session.ts

Layer: utils  
Lines: 277  
Purpose: getEnvContext, normalizeBaseUrl, isAbsoluteUrl, parseJsonEnv helpers or command handlers.

Imports:
- `import http from 'k6/http';`

Exports: `TeamEnvironmentOverride`, `getEnvContext`, `registerBaseUrl`, `resolvePath`, `registerFrameworkEnvironmentUrls`, `resolveFrameworkUrl`, `clearCookies`, `deleteCookie`

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
| `clearCookies` | `export function clearCookies(...urls: string[]): void` | ...urls: string[] | void | 255 | Clear all cookies from the VU's cookie jar. - With no arguments: clears cookies for ALL registered base URLs. - With arguments: clears cookies for the given URLs only. Usage: import { clearCookies } from '../../../dist/utils/session.js'; clearCookies(); // clear all registered URLs clearCookies('https://myapp.example.com/'); // clear specific URL |
| `deleteCookie` | `export function deleteCookie(url: string, name: string): void` | url: string, name: string | void | 273 | Delete a specific named cookie for a URL from the VU's cookie jar. Usage: import { deleteCookie } from '../../../dist/utils/session.js'; deleteCookie('https://myapp.example.com/', 'JSESSIONID'); |


### core_engine/src/utils/transaction.ts

Layer: utils  
Lines: 346  
Purpose: getRuntimeErrorBehavior, extractScriptLocation, formatStackSnippet, isVuTerminated helpers or command handlers.

Imports:
- `import { group, check as nativeCheck } from 'k6';`
- `import { Counter, Rate, Trend } from 'k6/metrics';`
- `import exec from 'k6/execution';`

Exports: `isVuTerminated`, `initTransactions`, `getCurrentTransaction`, `startTransaction`, `endTransaction`, `transaction`, `k6Check`

| Variable / Constant | Type | Line | Description |
|---|---|---:|---|
| `__ENV` | Record<string, string \| undefined> | 8 | Module-level constant or configuration value. |
| `txnStarts` | Record<string, number> | 24 | Module-level constant or configuration value. |
| `txnTrends` | Record<string, Trend> | 25 | Module-level constant or configuration value. |
| `txnCounters` | Record<string, Counter> | 26 | Module-level constant or configuration value. |
| `txnResults` | Record<string, Rate> | 31 | Module-level constant or configuration value. |
| `_currentIterationFailed` | Inferred | 36 | Module-level constant or configuration value. |
| `_activeTransaction` | string | 93 | Module-level constant or configuration value. |
| `_vuTerminated` | Inferred | 97 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `getRuntimeErrorBehavior` | `function getRuntimeErrorBehavior(): string` | None | string | 13 | Implements the get runtime error behavior function. It parses structured configuration or artifact data. |
| `extractScriptLocation` | `function extractScriptLocation(stack: string \| undefined): string` | stack: string \| undefined | string | 52 | Pull a user-script source location (path:line[:col]) out of an Error.stack string. k6 runs scripts under the Goja JS engine which produces stack frames in several shapes depending on the call form, e.g.: at file:///D:/.../script.js:258:5(15) at action_phase (file:///D:/.../script.js:258:5) at /abs/path/script.js:42:7 script.js:42 To stay robust against future format tweaks we look for any token that looks like `<something>:<digits>[:<digits>]` and pick the first one that doesn't belong to framework internals (`dist/utils/`). Returns the bare `path:line:col` (or `path:line`) substring, or `""` when nothing usable is present. |
| `formatStackSnippet` | `function formatStackSnippet(stack: string \| undefined, limit: number = 3): string` | stack: string \| undefined, limit: number = 3 | string | 82 | First N non-empty stack lines, joined — useful when `extractScriptLocation` couldn't find a clean frame but the raw stack still has useful info. |
| `isVuTerminated` | `export function isVuTerminated(): boolean` | None | boolean | 100 | Returns true if this VU was stopped via stop_vu errorBehavior. |
| `initTransactions` | `export function initTransactions(names: string[]): void` | names: string[] | void | 126 | Initializes Trends and Counters for the specified transactions. MUST be called in the script's init context (global scope), not inside VU functions. K6_PERF_TRANSACTION_NAMES. Keep calling this for legacy scripts and standalone execution. |
| `getCurrentTransaction` | `export function getCurrentTransaction(): string` | None | string | 148 | Returns the name of the currently active transaction for this VU, or '' if none. Used by request() to auto-attach transaction context to replay log entries. |
| `startTransaction` | `export function startTransaction(name: string): void` | name: string | void | 156 | Start a transaction (LoadRunner equivalent). |
| `endTransaction` | `export function endTransaction(name: string): void` | name: string | void | 170 | End a transaction (LoadRunner equivalent). Records elapsed duration since startTransaction; safe to call in finally blocks. |
| `transaction` | `export function transaction(name: string, fn: () => void): void` | name: string, fn: () => void | void | 203 | Execute a named transaction with group wrapping, metric recording, and lifecycle gating. Replaces the manual pattern: group('name', () => { startTransaction('name'); ...; endTransaction('name'); }); Behavior: - Checks lifecycle gate: if the VU is ramping down for the final time, skips the transaction. - Wraps the body in k6 group() for hierarchical result grouping. - Guarantees endTransaction() runs even if fn() throws (finally block). - Applies the configured errorBehavior (continue \| stop_iteration \| stop_vu \| abort_test). Nesting: nested transaction() calls are rejected with a descriptive error. |
| `k6Check` | `export function k6Check( val: any, sets: Record<string, (v: any) => boolean>, ): boolean` | val: any, sets: Record<string, (v: any) => boolean> | boolean | 314 | Framework-aware check() that wraps k6's native check() so metrics are always recorded, then applies errorBehavior when one or more checks fail. Drop-in replacement for k6's check() — same signature, same metric output. |


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


### testSuites/jpet_team/tests/buy_animals.js

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


### tools/generate-technical-reference.js

Layer: repository  
Lines: 626  
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
| `SOURCE_EXTENSIONS` | Inferred | 23 | Module-level constant or configuration value. |
| `TEXT_EXTENSIONS` | Inferred | 24 | Module-level constant or configuration value. |
| `model` | Inferred | 620 | Module-level constant or configuration value. |
| `markdown` | Inferred | 621 | Module-level constant or configuration value. |

| Function | Signature | Parameters | Returns | Line | Description |
|---|---|---|---|---:|---|
| `walk` | `function walk(dir, files = [])` | dir, files = [] | Inferred | 26 | Implements the walk function. It performs file-system work. |
| `rel` | `function rel(file)` | file | Inferred | 40 | Implements the rel function. |
| `read` | `function read(file)` | file | Inferred | 44 | Implements the read function. It performs file-system work. |
| `countLines` | `function countLines(text)` | text | Inferred | 48 | Implements the count lines function. |
| `firstHeading` | `function firstHeading(text)` | text | Inferred | 52 | Implements the first heading function. |
| `cleanText` | `function cleanText(value)` | value | Inferred | 57 | Implements the clean text function. |
| `extractJSDoc` | `function extractJSDoc(source, node)` | source, node | Inferred | 65 | Implements the extract jsdoc function. |
| `lineOf` | `function lineOf(sourceFile, node)` | sourceFile, node | Inferred | 78 | Implements the line of function. |
| `signatureOf` | `function signatureOf(source, node)` | source, node | Inferred | 82 | Implements the signature of function. |
| `inferDescription` | `function inferDescription(name, kind, sourceText)` | name, kind, sourceText | Inferred | 88 | Implements the infer description function. It performs file-system work, orchestrates process execution, parses structured configuration or artifact data, enforces validation rules. |
| `paramsOf` | `function paramsOf(node)` | node | Inferred | 111 | Implements the params of function. |
| `returnTypeOf` | `function returnTypeOf(node)` | node | Inferred | 118 | Implements the return type of function. |
| `isExported` | `function isExported(node)` | node | Inferred | 122 | Implements the is exported function. |
| `analyzeSource` | `function analyzeSource(file)` | file | Inferred | 129 | Implements the analyze source function. |
| `summarizeJson` | `function summarizeJson(file)` | file | Inferred | 252 | Implements the summarize json function. It parses structured configuration or artifact data. |
| `summarizeCsv` | `function summarizeCsv(file)` | file | Inferred | 269 | Implements the summarize csv function. |
| `summarizeMarkdown` | `function summarizeMarkdown(file)` | file | Inferred | 278 | Implements the summarize markdown function. |
| `layerFor` | `function layerFor(filePath)` | filePath | Inferred | 290 | Implements the layer for function. |
| `filePurpose` | `function filePurpose(filePath, analysis)` | filePath, analysis | Inferred | 301 | Implements the file purpose function. It orchestrates process execution, enforces validation rules. |
| `buildModel` | `function buildModel()` | None | Inferred | 318 | Implements the build model function. It parses structured configuration or artifact data. |
| `mdEscape` | `function mdEscape(value)` | value | Inferred | 347 | Implements the md escape function. |
| `buildMarkdown` | `function buildMarkdown(model)` | model | Inferred | 351 | Implements the build markdown function. It orchestrates process execution, enforces validation rules. |
| `xmlEscape` | `function xmlEscape(value)` | value | Inferred | 498 | Implements the xml escape function. |
| `paragraph` | `function paragraph(text, style)` | text, style | Inferred | 506 | Implements the paragraph function. |
| `table` | `function table(rows)` | rows | Inferred | 512 | Implements the table function. |
| `markdownToDocXml` | `function markdownToDocXml(markdown)` | markdown | Inferred | 519 | Implements the markdown to doc xml function. It enforces validation rules. |
| `writeDocx` | `function writeDocx(markdown)` | markdown | Inferred | 568 | Implements the write docx function. It performs file-system work, orchestrates process execution, enforces validation rules. |


## Non-Source Configuration, Template, Data, And Documentation Files

### .md/AGENT-CONTEXT.md

Layer: repository  
Lines: 2087  
Purpose: K6-PerfFramework — Agent Context & Memory File - > **IMPORTANT FOR ANY AGENT / AI TOOL READING THIS FILE:**

### .md/BaseArchitecture.md

Layer: repository  
Lines: 1020  
Purpose: BaseArchitecture.md - This framework is designed as a **hybrid performance engineering platform** built on top of **k6 with TypeScript**, combining the scripting flexibility of k6 with the structure, standardization, and usability expected from enterprise tools.

### .md/Checklist.md

Layer: repository  
Lines: 201  
Purpose: k6 Performance Framework – Build Checklist - > **Last updated:** Phase 1 – Foundation complete (2026-03-21)

### .md/Current-Framework-Flow.md

Layer: repository  
Lines: 240  
Purpose: Current Framework Flow - Date: 2026-03-30

### .md/Debug-Automation-Status.md

Layer: repository  
Lines: 50  
Purpose: Debug Automation Status - This file tracks the agreed work for the debug automation and reporting enhancements.

### .md/Deep-Dive-AutoCorrelation.md

Layer: repository  
Lines: 110  
Purpose: Deep-Dive: Anatomy of a Correlated Request - This document provides a line-by-line breakdown of how a static request recorded inside a HAR file transforms into a **dynamic, fully-correlated k6 request execution**.

### .md/flow diagram.md

Layer: repository  
Lines: 401  
Purpose: Framework Flow Diagram - Date: 2026-04-13

### .md/Framework-Audit-Checklist.md

Layer: repository  
Lines: 245  
Purpose: K6 Perf Framework Audit Checklist - Date: 2026-03-26

### .md/Framework-Change-Log.md

Layer: repository  
Lines: 272  
Purpose: Framework Change Log - This file tracks the framework changes made during the current enhancement cycle, including the latest debug-mode updates and the earlier generator, diff, and documentation work.

### .md/FRAMEWORK-IMPLEMENTATION-TODO.md

Layer: repository  
Lines: 514  
Purpose: Framework Implementation TODO - This checklist tracks the agreed lifecycle, reporting, observability, and CI/CD work.

### .md/framework-requirements.md

Layer: repository  
Lines: 121  
Purpose: k6 Performance Testing Framework: Requirements & Design - To design and build a reusable, maintainable, and portable performance testing framework using k6. The framework aims to be easy to adopt across different projects with minimal rework, abstracting away complexities and promoting a convention-over-configuration approach.

### .md/Generated-HowTo-Guide.md

Layer: repository  
Lines: 375  
Purpose: K6 Performance Framework: A Detailed Guide - This guide provides a comprehensive overview of the K6 Performance Framework, from initial setup to advanced features. It is based on the framework's documentation and source code analysis.

### .md/HOW_TO_USE_FRAMEWORK.md

Layer: repository  
Lines: 358  
Purpose: K6 Performance Framework: Comprehensive Usage Guide - Welcome to the K6-PerfFramework! This enterprise-grade framework wraps **k6** and **TypeScript** to provide a scalable, maintainable, and robust performance testing architecture. It separates reusable capabilities (the "Core Engine") from the actual load tests maintained by individual application teams ("Scrum Suites").

### .md/HowTo-AutoCorrelation.md

Layer: repository  
Lines: 344  
Purpose: Auto-Correlation Setup and Workflow Guide - Dynamic correlation prevents load tests from failing due to expired tokens, single-use session counters, or CSRF guard values. The framework implements a **Rule-based Correlation Engine** that automatically extracts these values from HTTP responses and makes them available to subsequent requests – exactly like LoadRunner's correlation feature.

### .md/HowTo-Parameterisation-And-Correlation.md

Layer: repository  
Lines: 540  
Purpose: Parameterisation & Correlation Guide - > Practical guide for data-driving tests and handling dynamic server values using the k6 Performance Framework.

### .md/IMPLEMENTATION_GUIDE.md

Layer: repository  
Lines: 131  
Purpose: Implementation Guide: Achieving Framework Requirements - Based on the `framework-requirements.md`, this guide outlines the exact, step-by-step procedures to achieve every defined requirement using the existing `K6-PerfFramework` architecture and commands.

### .md/Prerequisites.md

Layer: repository  
Lines: 78  
Purpose: Prerequisites & Setup Guide - This guide covers the necessary tools and environment setup required to use the k6 Performance Framework.

### .md/schema-driven-dx-strategy.md

Layer: repository  
Lines: 461  
Purpose: K6-PerfFramework — Schema-Driven DX Strategy - > **Purpose:** Transform the framework from "powerful but opaque" to "powerful and self-discoverable" through schema-driven architecture, IDE integration, guided templates, and progressive disclosure.

### .md/schema-dx-tasks.md

Layer: repository  
Lines: 53  
Purpose: Schema-Driven DX — Implementation Tasks - > **Strategy doc:** [schema-driven-dx-strategy.md](file:///C:/Users/aditk/.gemini/antigravity/brain/4d9823d2-5708-45e4-8439-1d1ee1a4af58/artifacts/schema-driven-dx-strategy.md)

### .md/VU-Lifecycle-Implementation-Plan.lifecycle-simple-plan.md

Layer: repository  
Lines: 1490  
Purpose: VU Lifecycle Implementation Plan - Replicate LoadRunner-style `vuser_init` / `Action` / `vuser_end` behavior in k6 while keeping the **user-facing journey script as simple as possible**.

### .md/VU-Lifecycle-Implementation-Plan.md

Layer: repository  
Lines: 639  
Purpose: VU Lifecycle Implementation Plan - Replicate LoadRunner's `vuser_init` / `Action` / `vuser_end` pattern in k6 scripts, giving each VU a **per-VU exit time** calculated from the test plan's stage schedule.

### .md/VU-Lifecycle-Prototype-Files.md

Layer: repository  
Lines: 35  
Purpose: VU Lifecycle Prototype Files - Original framework files were left untouched.

### ai_context/ai-workflow.md

Layer: AI context  
Lines: 60  
Purpose: AI Workflow - > How to work effectively with this repository as an AI agent.

### ai_context/architecture-evolution.md

Layer: AI context  
Lines: 56  
Purpose: Architecture Evolution - > How the framework evolved over time. Use this to understand architectural trajectory.

### ai_context/architecture-laws.md

Layer: AI context  
Lines: 84  
Purpose: Architecture Laws - > **Inviolable rules.** Any AI agent or contributor MUST obey these. Violations risk breaking the framework's core guarantees.

### ai_context/change-impact-map.md

Layer: AI context  
Lines: 58  
Purpose: Change Impact Map - > When you change X, you must also check Y.

### ai_context/decisions.md

Layer: AI context  
Lines: 82  
Purpose: Architectural Decisions - > Distilled decision records. Each captures what was decided, why, and what constraints it creates.

### ai_context/dependency-hotspots.md

Layer: AI context  
Lines: 49  
Purpose: Dependency Hotspots - > Modules with highest coupling — changes here have the widest blast radius.

### ai_context/dependency-rules.md

Layer: AI context  
Lines: 64  
Purpose: Dependency Rules - > Import direction and coupling constraints.

### ai_context/design-proposals_1.md

Layer: AI context  
Lines: 326  
Purpose: Design Proposals - > Approved architectural proposals awaiting implementation.

### ai_context/design-proposals.md

Layer: AI context  
Lines: 998  
Purpose: Design Proposals - > Approved architectural proposals awaiting implementation.

### ai_context/execution-flow.md

Layer: AI context  
Lines: 114  
Purpose: Execution Flow - > How code runs, from CLI invocation to k6 process and artifacts.

### ai_context/extension-points.md

Layer: AI context  
Lines: 86  
Purpose: Extension Points - > Where new features can plug into the framework without breaking existing code.

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
Lines: 59  
Purpose: Integration Checklist - > Steps to follow when adding any new feature to the framework.

### ai_context/integration-contracts.md

Layer: AI context  
Lines: 91  
Purpose: Integration Contracts - > Cross-layer API contracts that must be maintained.

### ai_context/known-tech-debt.md

Layer: AI context  
Lines: 86  
Purpose: Known Technical Debt - > Acknowledged shortcuts, gaps, and areas that need future work.

### ai_context/module-map.md

Layer: AI context  
Lines: 135  
Purpose: Module Map - > File-level routing table. Find the right file to edit without scanning the whole repo.

### ai_context/orchestration-map.md

Layer: AI context  
Lines: 96  
Purpose: Orchestration Map - > How CLI commands wire through the engine layers to k6 execution.

### ai_context/overview.md

Layer: AI context  
Lines: 73  
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
Lines: 120  
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
Lines: 89  
Purpose: Framework To-Do List - > A shared task list for AI agents to maintain continuity across sessions.

### ai_context/token-optimization-guide.md

Layer: AI context  
Lines: 64  
Purpose: Token Optimization Guide - > Strategies for minimizing AI context token usage.

### config/environments/dev.json

Layer: configuration  
Lines: 18  
Purpose: Framework file. Top-level keys: $schema, name, testSuites.
  
Top-level keys: `$schema`, `name`, `testSuites`

### config/runtime_settings/default.json

Layer: configuration  
Lines: 52  
Purpose: Runtime behavior profile controlling execution, errors, reporting, and diagnostics. Top-level keys: $schema, thinkTime, pacing, http, errorBehavior, reporting, errors, monitoring, debugMode.
  
Top-level keys: `$schema`, `thinkTime`, `pacing`, `http`, `errorBehavior`, `reporting`, `errors`, `monitoring`, `debugMode`

### config/schemas/environment.schema.json

Layer: configuration  
Lines: 53  
Purpose: JSON Schema contract used for validation and IDE assistance. Top-level keys: $schema, $id, title, description, type, required, additionalProperties, properties.
  
Top-level keys: `$schema`, `$id`, `title`, `description`, `type`, `required`, `additionalProperties`, `properties`

### config/schemas/runtime_settings.schema.json

Layer: configuration  
Lines: 238  
Purpose: JSON Schema contract used for validation and IDE assistance. Top-level keys: $schema, $id, title, description, type, required, additionalProperties, properties.
  
Top-level keys: `$schema`, `$id`, `title`, `description`, `type`, `required`, `additionalProperties`, `properties`

### config/schemas/test_plan.schema.json

Layer: configuration  
Lines: 258  
Purpose: JSON Schema contract used for validation and IDE assistance. Top-level keys: $schema, $id, title, description, type, required, additionalProperties, properties.
  
Top-level keys: `$schema`, `$id`, `title`, `description`, `type`, `required`, `additionalProperties`, `properties`

### config/test_plans/debug_test.json

Layer: configuration  
Lines: 38  
Purpose: Executable test plan or reusable workload template. Top-level keys: name, environment, execution_mode, global_load_profile, noCookiesReset, debug, user_journeys.
  
Top-level keys: `name`, `environment`, `execution_mode`, `global_load_profile`, `noCookiesReset`, `debug`, `user_journeys`

### config/test_plans/load_test copy.json

Layer: configuration  
Lines: 44  
Purpose: Executable test plan or reusable workload template. Top-level keys: $schema, name, environment, execution_mode, global_load_profile, noCookiesReset, user_journeys, global_sla, journey_slas, transaction_slas.
  
Top-level keys: `$schema`, `name`, `environment`, `execution_mode`, `global_load_profile`, `noCookiesReset`, `user_journeys`, `global_sla`, `journey_slas`, `transaction_slas`

### config/test_plans/load_test.json

Layer: configuration  
Lines: 62  
Purpose: Executable test plan or reusable workload template. Top-level keys: $schema, name, environment, execution_mode, global_load_profile, noCookiesReset, user_journeys, global_sla, journey_slas, transaction_slas.
  
Top-level keys: `$schema`, `name`, `environment`, `execution_mode`, `global_load_profile`, `noCookiesReset`, `user_journeys`, `global_sla`, `journey_slas`, `transaction_slas`

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

### docs/CODE_LEVEL_ROADMAP.md

Layer: documentation  
Lines: 397  
Purpose: ️ Code-Level Learning Roadmap: K6-PerfFramework - > A structured, file-by-file learning path. Follow the phases in order — each builds on the previous one.

### docs/configuration-reference.md

Layer: documentation  
Lines: 93  
Purpose: K6-PerfFramework Configuration Reference - *(Auto-generated from JSON Schemas)*

### docs/K6_PerfFramework_Technical_Reference.md

Layer: documentation  
Lines: 4759  
Purpose: K6 Performance Framework Technical Reference - Generated: 2026-06-01T15:44:56.014Z

### docs/KT_Guide.md

Layer: documentation  
Lines: 135  
Purpose: K6 Performance Framework: Comprehensive Deep-Dive Guide - Welcome to the detailed deep-dive of the K6 Performance Framework. This guide moves beyond high-level concepts and specifically breaks down the exact files, their core functions, and the code powering the framework.

### docs/KT_Low_Level_Deep_Dive.md

Layer: documentation  
Lines: 194  
Purpose: K6 Performance Framework: Low-Level Engineering Deep Dive - This document is designed for engineers seeking to understand the exact mathematical, architectural, and code-level mechanisms powering the framework. It covers the inner workings of runtime lifecycle management, dynamic data slicing, correlation execution, and process orchestration.

### docs/KT_Presentation.md

Layer: documentation  
Lines: 88  
Purpose: Presentation Outline: K6 Performance Framework - * **Title:** Beyond Basic Testing: The Enterprise K6 Performance Framework

### graph.html

Layer: repository  
Lines: 993  
Purpose: Framework file.

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
Lines: 67  
Purpose: Framework file. Top-level keys: name, version, description, keywords, homepage, bugs, repository, license, author, type, main, types, bin, scripts, dependencies, devDependencies.
  
Top-level keys: `name`, `version`, `description`, `keywords`, `homepage`, `bugs`, `repository`, `license`, `author`, `type`, `main`, `types`, `bin`, `scripts`, `dependencies`, `devDependencies`

### README.md

Layer: repository  
Lines: 431  
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
Lines: 26  
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

### testSuites/Jpet_new/recordings/buyanimal_raw_28thmay.recording-log.json

Layer: test suite  
Lines: 3635  
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
- Reporting is artifact-first; CI should consume `ci-summary.json` and related JSON/NDJSON artifacts instead of console text.
- Existing `dist` files are generated build output and are intentionally not duplicated in the source-level reference.
