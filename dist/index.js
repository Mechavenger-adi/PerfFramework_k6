"use strict";
/**
 * index.ts
 * Phase 1 – Core Engine barrel export.
 * Teams import from this single entry point.
 *
 * Usage: import { ConfigurationManager, ScenarioBuilder, ... } from '@k6-perf/core-engine'
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrafanaReporter = exports.ResultTransformer = exports.RecordingLogResolver = exports.ExchangeLogBuilder = exports.HTMLDiffReporter = exports.DiffChecker = exports.ReplayRunner = exports.FallbackHandler = exports.ExtractorRegistry = exports.RuleProcessor = exports.CorrelationEngine = exports.JourneyAssertionResolver = exports.ThresholdManager = exports.SLARegistry = exports.TransactionGrouper = exports.ScriptGenerator = exports.DomainFilter = exports.HARParser = exports.endTransaction = exports.startTransaction = exports.initTransactions = exports.PathResolver = exports.Logger = exports.TimeseriesRuntime = exports.SnapshotRuntime = exports.MetricsRuntime = exports.ErrorRuntime = exports.LifecycleRuntime = exports.DynamicValueFactory = exports.DataValidator = exports.DataPoolManager = exports.DataFactory = exports.HostMonitor = exports.PipelineRunner = exports.ParallelExecutionManager = exports.JourneyAllocator = exports.ScenarioBuilder = exports.TestPlanLoader = exports.ExecutorFactory = exports.toK6ExecutorConfig = exports.buildIterationProfile = exports.buildSpikeProfile = exports.buildSoakProfile = exports.buildStressProfile = exports.buildLoadProfile = exports.GatekeeperValidator = exports.RuntimeConfigManager = exports.ConfigurationManager = exports.SchemaValidator = exports.EnvResolver = void 0;
exports.TimeseriesArtifactBuilder = exports.RunReportGenerator = exports.RunSummaryBuilder = exports.TransactionMetricsBuilder = exports.EventArtifactBuilder = exports.ArtifactWriter = exports.CustomUploader = exports.AzureReporter = void 0;
// -- Types / Contracts ------------------------
__exportStar(require("./types/ConfigContracts"), exports);
__exportStar(require("./types/EventContracts"), exports);
__exportStar(require("./types/ReportingContracts"), exports);
__exportStar(require("./types/TestPlanSchema"), exports);
// -- Config Layer -----------------------------
var EnvResolver_1 = require("./config/EnvResolver");
Object.defineProperty(exports, "EnvResolver", { enumerable: true, get: function () { return EnvResolver_1.EnvResolver; } });
var SchemaValidator_1 = require("./config/SchemaValidator");
Object.defineProperty(exports, "SchemaValidator", { enumerable: true, get: function () { return SchemaValidator_1.SchemaValidator; } });
var ConfigurationManager_1 = require("./config/ConfigurationManager");
Object.defineProperty(exports, "ConfigurationManager", { enumerable: true, get: function () { return ConfigurationManager_1.ConfigurationManager; } });
var RuntimeConfigManager_1 = require("./config/RuntimeConfigManager");
Object.defineProperty(exports, "RuntimeConfigManager", { enumerable: true, get: function () { return RuntimeConfigManager_1.RuntimeConfigManager; } });
var GatekeeperValidator_1 = require("./config/GatekeeperValidator");
Object.defineProperty(exports, "GatekeeperValidator", { enumerable: true, get: function () { return GatekeeperValidator_1.GatekeeperValidator; } });
// -- Scenario Layer ---------------------------
var WorkloadModels_1 = require("./scenario/WorkloadModels");
Object.defineProperty(exports, "buildLoadProfile", { enumerable: true, get: function () { return WorkloadModels_1.buildLoadProfile; } });
Object.defineProperty(exports, "buildStressProfile", { enumerable: true, get: function () { return WorkloadModels_1.buildStressProfile; } });
Object.defineProperty(exports, "buildSoakProfile", { enumerable: true, get: function () { return WorkloadModels_1.buildSoakProfile; } });
Object.defineProperty(exports, "buildSpikeProfile", { enumerable: true, get: function () { return WorkloadModels_1.buildSpikeProfile; } });
Object.defineProperty(exports, "buildIterationProfile", { enumerable: true, get: function () { return WorkloadModels_1.buildIterationProfile; } });
Object.defineProperty(exports, "toK6ExecutorConfig", { enumerable: true, get: function () { return WorkloadModels_1.toK6ExecutorConfig; } });
var ExecutorFactory_1 = require("./scenario/ExecutorFactory");
Object.defineProperty(exports, "ExecutorFactory", { enumerable: true, get: function () { return ExecutorFactory_1.ExecutorFactory; } });
var TestPlanLoader_1 = require("./scenario/TestPlanLoader");
Object.defineProperty(exports, "TestPlanLoader", { enumerable: true, get: function () { return TestPlanLoader_1.TestPlanLoader; } });
var ScenarioBuilder_1 = require("./scenario/ScenarioBuilder");
Object.defineProperty(exports, "ScenarioBuilder", { enumerable: true, get: function () { return ScenarioBuilder_1.ScenarioBuilder; } });
// -- Execution Layer --------------------------
var JourneyAllocator_1 = require("./execution/JourneyAllocator");
Object.defineProperty(exports, "JourneyAllocator", { enumerable: true, get: function () { return JourneyAllocator_1.JourneyAllocator; } });
var ParallelExecutionManager_1 = require("./execution/ParallelExecutionManager");
Object.defineProperty(exports, "ParallelExecutionManager", { enumerable: true, get: function () { return ParallelExecutionManager_1.ParallelExecutionManager; } });
var PipelineRunner_1 = require("./execution/PipelineRunner");
Object.defineProperty(exports, "PipelineRunner", { enumerable: true, get: function () { return PipelineRunner_1.PipelineRunner; } });
var HostMonitor_1 = require("./execution/HostMonitor");
Object.defineProperty(exports, "HostMonitor", { enumerable: true, get: function () { return HostMonitor_1.HostMonitor; } });
// -- Data Layer -------------------------------
var DataFactory_1 = require("./data/DataFactory");
Object.defineProperty(exports, "DataFactory", { enumerable: true, get: function () { return DataFactory_1.DataFactory; } });
var DataPoolManager_1 = require("./data/DataPoolManager");
Object.defineProperty(exports, "DataPoolManager", { enumerable: true, get: function () { return DataPoolManager_1.DataPoolManager; } });
var DataValidator_1 = require("./data/DataValidator");
Object.defineProperty(exports, "DataValidator", { enumerable: true, get: function () { return DataValidator_1.DataValidator; } });
var DynamicValueFactory_1 = require("./data/DynamicValueFactory");
Object.defineProperty(exports, "DynamicValueFactory", { enumerable: true, get: function () { return DynamicValueFactory_1.DynamicValueFactory; } });
// -- Runtime Layer ----------------------------
var LifecycleRuntime_1 = require("./runtime/LifecycleRuntime");
Object.defineProperty(exports, "LifecycleRuntime", { enumerable: true, get: function () { return LifecycleRuntime_1.LifecycleRuntime; } });
var ErrorRuntime_1 = require("./runtime/ErrorRuntime");
Object.defineProperty(exports, "ErrorRuntime", { enumerable: true, get: function () { return ErrorRuntime_1.ErrorRuntime; } });
var MetricsRuntime_1 = require("./runtime/MetricsRuntime");
Object.defineProperty(exports, "MetricsRuntime", { enumerable: true, get: function () { return MetricsRuntime_1.MetricsRuntime; } });
var SnapshotRuntime_1 = require("./runtime/SnapshotRuntime");
Object.defineProperty(exports, "SnapshotRuntime", { enumerable: true, get: function () { return SnapshotRuntime_1.SnapshotRuntime; } });
var TimeseriesRuntime_1 = require("./runtime/TimeseriesRuntime");
Object.defineProperty(exports, "TimeseriesRuntime", { enumerable: true, get: function () { return TimeseriesRuntime_1.TimeseriesRuntime; } });
// -- Utils Layer --------------------------------
var logger_1 = require("./utils/logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return logger_1.Logger; } });
var PathResolver_1 = require("./utils/PathResolver");
Object.defineProperty(exports, "PathResolver", { enumerable: true, get: function () { return PathResolver_1.PathResolver; } });
var transaction_1 = require("./utils/transaction");
Object.defineProperty(exports, "initTransactions", { enumerable: true, get: function () { return transaction_1.initTransactions; } });
Object.defineProperty(exports, "startTransaction", { enumerable: true, get: function () { return transaction_1.startTransaction; } });
Object.defineProperty(exports, "endTransaction", { enumerable: true, get: function () { return transaction_1.endTransaction; } });
// -- Recording Layer ----------------------------
var HARParser_1 = require("./recording/HARParser");
Object.defineProperty(exports, "HARParser", { enumerable: true, get: function () { return HARParser_1.HARParser; } });
var DomainFilter_1 = require("./recording/DomainFilter");
Object.defineProperty(exports, "DomainFilter", { enumerable: true, get: function () { return DomainFilter_1.DomainFilter; } });
var ScriptGenerator_1 = require("./recording/ScriptGenerator");
Object.defineProperty(exports, "ScriptGenerator", { enumerable: true, get: function () { return ScriptGenerator_1.ScriptGenerator; } });
var TransactionGrouper_1 = require("./recording/TransactionGrouper");
Object.defineProperty(exports, "TransactionGrouper", { enumerable: true, get: function () { return TransactionGrouper_1.TransactionGrouper; } });
// -- Assertions Layer ---------------------------
var SLARegistry_1 = require("./assertions/SLARegistry");
Object.defineProperty(exports, "SLARegistry", { enumerable: true, get: function () { return SLARegistry_1.SLARegistry; } });
var ThresholdManager_1 = require("./assertions/ThresholdManager");
Object.defineProperty(exports, "ThresholdManager", { enumerable: true, get: function () { return ThresholdManager_1.ThresholdManager; } });
var JourneyAssertionResolver_1 = require("./assertions/JourneyAssertionResolver");
Object.defineProperty(exports, "JourneyAssertionResolver", { enumerable: true, get: function () { return JourneyAssertionResolver_1.JourneyAssertionResolver; } });
// -- Correlation Layer --------------------------
var CorrelationEngine_1 = require("./correlation/CorrelationEngine");
Object.defineProperty(exports, "CorrelationEngine", { enumerable: true, get: function () { return CorrelationEngine_1.CorrelationEngine; } });
var RuleProcessor_1 = require("./correlation/RuleProcessor");
Object.defineProperty(exports, "RuleProcessor", { enumerable: true, get: function () { return RuleProcessor_1.RuleProcessor; } });
var ExtractorRegistry_1 = require("./correlation/ExtractorRegistry");
Object.defineProperty(exports, "ExtractorRegistry", { enumerable: true, get: function () { return ExtractorRegistry_1.ExtractorRegistry; } });
var FallbackHandler_1 = require("./correlation/FallbackHandler");
Object.defineProperty(exports, "FallbackHandler", { enumerable: true, get: function () { return FallbackHandler_1.FallbackHandler; } });
// -- Debug Layer --------------------------------
var ReplayRunner_1 = require("./debug/ReplayRunner");
Object.defineProperty(exports, "ReplayRunner", { enumerable: true, get: function () { return ReplayRunner_1.ReplayRunner; } });
var DiffChecker_1 = require("./debug/DiffChecker");
Object.defineProperty(exports, "DiffChecker", { enumerable: true, get: function () { return DiffChecker_1.DiffChecker; } });
var HTMLDiffReporter_1 = require("./debug/HTMLDiffReporter");
Object.defineProperty(exports, "HTMLDiffReporter", { enumerable: true, get: function () { return HTMLDiffReporter_1.HTMLDiffReporter; } });
var ExchangeLog_1 = require("./debug/ExchangeLog");
Object.defineProperty(exports, "ExchangeLogBuilder", { enumerable: true, get: function () { return ExchangeLog_1.ExchangeLogBuilder; } });
var RecordingLogResolver_1 = require("./debug/RecordingLogResolver");
Object.defineProperty(exports, "RecordingLogResolver", { enumerable: true, get: function () { return RecordingLogResolver_1.RecordingLogResolver; } });
// -- Reporters Layer ----------------------------
var ResultTransformer_1 = require("./reporters/ResultTransformer");
Object.defineProperty(exports, "ResultTransformer", { enumerable: true, get: function () { return ResultTransformer_1.ResultTransformer; } });
var GrafanaReporter_1 = require("./reporters/GrafanaReporter");
Object.defineProperty(exports, "GrafanaReporter", { enumerable: true, get: function () { return GrafanaReporter_1.GrafanaReporter; } });
var AzureReporter_1 = require("./reporters/AzureReporter");
Object.defineProperty(exports, "AzureReporter", { enumerable: true, get: function () { return AzureReporter_1.AzureReporter; } });
var CustomUploader_1 = require("./reporters/CustomUploader");
Object.defineProperty(exports, "CustomUploader", { enumerable: true, get: function () { return CustomUploader_1.CustomUploader; } });
// -- Reporting Layer ----------------------------
var ArtifactWriter_1 = require("./reporting/ArtifactWriter");
Object.defineProperty(exports, "ArtifactWriter", { enumerable: true, get: function () { return ArtifactWriter_1.ArtifactWriter; } });
var EventArtifactBuilder_1 = require("./reporting/EventArtifactBuilder");
Object.defineProperty(exports, "EventArtifactBuilder", { enumerable: true, get: function () { return EventArtifactBuilder_1.EventArtifactBuilder; } });
var TransactionMetricsBuilder_1 = require("./reporting/TransactionMetricsBuilder");
Object.defineProperty(exports, "TransactionMetricsBuilder", { enumerable: true, get: function () { return TransactionMetricsBuilder_1.TransactionMetricsBuilder; } });
var RunSummaryBuilder_1 = require("./reporting/RunSummaryBuilder");
Object.defineProperty(exports, "RunSummaryBuilder", { enumerable: true, get: function () { return RunSummaryBuilder_1.RunSummaryBuilder; } });
var RunReportGenerator_1 = require("./reporting/RunReportGenerator");
Object.defineProperty(exports, "RunReportGenerator", { enumerable: true, get: function () { return RunReportGenerator_1.RunReportGenerator; } });
var TimeseriesArtifactBuilder_1 = require("./reporting/TimeseriesArtifactBuilder");
Object.defineProperty(exports, "TimeseriesArtifactBuilder", { enumerable: true, get: function () { return TimeseriesArtifactBuilder_1.TimeseriesArtifactBuilder; } });
//# sourceMappingURL=index.js.map