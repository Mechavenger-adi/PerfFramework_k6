/**
 * engine.ts
 * Full engine / programmatic API barrel — NOT VU-safe.
 *
 * For the CLI, tooling, and programmatic embedding of the engine. This pulls in
 * Node-only code (fs, process, reporters, ReplayRunner, data loaders, …), so k6
 * journey scripts must NOT import from here. Scripts use the VU-safe API barrel
 * in index.ts (request, transaction, lifecycle, session, generate).
 *
 * Usage (Node/CLI/tooling): import { ScenarioBuilder, ParallelExecutionManager, ... } from './engine';
 */

// -- Types / Contracts ------------------------
export * from './types/ConfigContracts';
export * from './types/EventContracts';
export * from './types/ReportingContracts';
export * from './types/TestPlanSchema';

// -- Config Layer -----------------------------
export { ConfigurationManager } from './config/ConfigurationManager';
export { EnvResolver } from './config/EnvResolver';
export { GatekeeperValidator } from './config/GatekeeperValidator';
export type { GatekeeperResult } from './config/GatekeeperValidator';
export { RuntimeConfigManager } from './config/RuntimeConfigManager';
export { SchemaValidator } from './config/SchemaValidator';

// -- Scenario Layer ---------------------------
export { buildLoadProfile, buildStressProfile, buildSoakProfile, buildSpikeProfile, buildIterationProfile, buildConstantArrivalRateProfile, buildRampingArrivalRateProfile, buildExternallyControlledProfile, toK6ExecutorConfig } from './scenario/WorkloadModels';
export { ExecutorFactory } from './scenario/ExecutorFactory';
export { ScenarioBuilder } from './scenario/ScenarioBuilder';
export type { K6ScenarioDefinition, K6ScenariosMap } from './scenario/ScenarioBuilder';
export { TestPlanLoader } from './scenario/TestPlanLoader';

// -- Execution Layer --------------------------
export { HostMonitor } from './execution/HostMonitor';
export { JourneyAllocator } from './execution/JourneyAllocator';
export type { JourneyAllocation } from './execution/JourneyAllocator';
export { ParallelExecutionManager } from './execution/ParallelExecutionManager';
export type { K6Options } from './execution/ParallelExecutionManager';
export { PipelineRunner } from './execution/PipelineRunner';

// -- Data Layer -------------------------------
export { DataFactory } from './data/DataFactory';
export type { LoadedDataset } from './data/DataFactory';
export { DataPoolManager } from './data/DataPoolManager';
export { DataValidator } from './data/DataValidator';
export type { DataValidationResult } from './data/DataValidator';
export { DynamicValueFactory } from './data/DynamicValueFactory';

// -- Runtime Layer ----------------------------
export { ErrorRuntime } from './runtime/ErrorRuntime';
export type { ErrorRuntimeContext } from './runtime/ErrorRuntime';
export { LifecycleRuntime } from './runtime/LifecycleRuntime';
export type { JourneyContext, JourneyPhase, LifecycleDecision, LifecyclePhaseFns, LifecycleRunState } from './runtime/LifecycleRuntime';
export { MetricsRuntime } from './runtime/MetricsRuntime';
export type { TransactionAggregate } from './runtime/MetricsRuntime';
export { SnapshotRuntime } from './runtime/SnapshotRuntime';
export { TimeseriesRuntime } from './runtime/TimeseriesRuntime';

// -- Utils Layer --------------------------------
export { Logger } from './utils/logger';
export { PathResolver } from './utils/PathResolver';
export { endTransaction, getCurrentTransaction, initTransactions, isVuTerminated, k6Check, startTransaction, transaction } from './utils/transaction';
export { request } from './utils/request';
export type { CookieValue, HttpMethod, RequestBody, RequestOptions } from './utils/request';
export { createJourneyLifecycleStore, getTransactionGate, isEnding, runJourneyLifecycle, thinktime } from './utils/lifecycle';
export type { JourneyLifecycleStore, PhaseFns, TransactionGate } from './utils/lifecycle';
export { logReplayExchange, logExchange, trackCorrelation, trackDataRow, trackParameter } from './utils/replayLogger';
export { clearCookies, deleteCookie, getEnvContext, registerBaseUrl, registerFrameworkEnvironmentUrls, resolveFrameworkUrl, resolvePath } from './utils/session';
export type { TeamEnvironmentOverride } from './utils/session';

// -- Recording Layer ----------------------------
export { DomainFilter } from './recording/DomainFilter';
export { HARParser } from './recording/HARParser';
export { ScriptGenerator } from './recording/ScriptGenerator';
export { TransactionGrouper } from './recording/TransactionGrouper';

// -- Assertions Layer ---------------------------
export { JourneyAssertionResolver } from './assertions/JourneyAssertionResolver';
export { SLARegistry } from './assertions/SLARegistry';
export { ThresholdManager } from './assertions/ThresholdManager';



// -- Debug Layer --------------------------------
export { DiffChecker } from './debug/DiffChecker';
export { ExchangeLogBuilder } from './debug/ExchangeLog';
export type { TaggedExchangeLogEntry, VariableEvent } from './debug/ExchangeLog';
export { HTMLDiffReporter } from './debug/HTMLDiffReporter';
export { RecordingLogResolver } from './debug/RecordingLogResolver';
export { ReplayRunner } from './debug/ReplayRunner';



// -- Reporting Layer ----------------------------
export { ArtifactWriter } from './reporting/ArtifactWriter';
export { EventArtifactBuilder } from './reporting/EventArtifactBuilder';
export { RunReportGenerator } from './reporting/RunReportGenerator';
export { RunSummaryBuilder } from './reporting/RunSummaryBuilder';
export { TimeseriesArtifactBuilder } from './reporting/TimeseriesArtifactBuilder';
export { TransactionMetricsBuilder } from './reporting/TransactionMetricsBuilder';

