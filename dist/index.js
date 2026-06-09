"use strict";
/**
 * index.ts
 * Phase 1 – Core Engine barrel export.
 * Teams import from this single entry point.
 *
 * Usage: import { ConfigurationManager, ScenarioBuilder, ... } from '@k6-perf/core_engine'
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
exports.trackParameter = exports.trackDataRow = exports.trackCorrelation = exports.logExchange = exports.logReplayExchange = exports.thinktime = exports.runJourneyLifecycle = exports.isEnding = exports.getTransactionGate = exports.createJourneyLifecycleStore = exports.request = exports.transaction = exports.startTransaction = exports.k6Check = exports.isVuTerminated = exports.initTransactions = exports.getCurrentTransaction = exports.endTransaction = exports.PathResolver = exports.Logger = exports.TimeseriesRuntime = exports.SnapshotRuntime = exports.MetricsRuntime = exports.LifecycleRuntime = exports.ErrorRuntime = exports.DynamicValueFactory = exports.DataValidator = exports.DataPoolManager = exports.DataFactory = exports.PipelineRunner = exports.ParallelExecutionManager = exports.JourneyAllocator = exports.HostMonitor = exports.TestPlanLoader = exports.ScenarioBuilder = exports.ExecutorFactory = exports.toK6ExecutorConfig = exports.buildExternallyControlledProfile = exports.buildRampingArrivalRateProfile = exports.buildConstantArrivalRateProfile = exports.buildIterationProfile = exports.buildSpikeProfile = exports.buildSoakProfile = exports.buildStressProfile = exports.buildLoadProfile = exports.SchemaValidator = exports.RuntimeConfigManager = exports.GatekeeperValidator = exports.EnvResolver = exports.ConfigurationManager = void 0;
exports.TransactionMetricsBuilder = exports.TimeseriesArtifactBuilder = exports.RunSummaryBuilder = exports.RunReportGenerator = exports.EventArtifactBuilder = exports.ArtifactWriter = exports.ResultTransformer = exports.GrafanaReporter = exports.CustomUploader = exports.AzureReporter = exports.ReplayRunner = exports.RecordingLogResolver = exports.HTMLDiffReporter = exports.ExchangeLogBuilder = exports.DiffChecker = exports.RuleProcessor = exports.FallbackHandler = exports.ExtractorRegistry = exports.CorrelationEngine = exports.ThresholdManager = exports.SLARegistry = exports.JourneyAssertionResolver = exports.TransactionGrouper = exports.ScriptGenerator = exports.HARParser = exports.DomainFilter = exports.resolvePath = exports.resolveFrameworkUrl = exports.registerFrameworkEnvironmentUrls = exports.registerBaseUrl = exports.getEnvContext = exports.deleteCookie = exports.clearCookies = void 0;
// -- Types / Contracts ------------------------
__exportStar(require("./types/ConfigContracts"), exports);
__exportStar(require("./types/EventContracts"), exports);
__exportStar(require("./types/ReportingContracts"), exports);
__exportStar(require("./types/TestPlanSchema"), exports);
// -- Config Layer -----------------------------
var ConfigurationManager_1 = require("./config/ConfigurationManager");
Object.defineProperty(exports, "ConfigurationManager", { enumerable: true, get: function () { return ConfigurationManager_1.ConfigurationManager; } });
var EnvResolver_1 = require("./config/EnvResolver");
Object.defineProperty(exports, "EnvResolver", { enumerable: true, get: function () { return EnvResolver_1.EnvResolver; } });
var GatekeeperValidator_1 = require("./config/GatekeeperValidator");
Object.defineProperty(exports, "GatekeeperValidator", { enumerable: true, get: function () { return GatekeeperValidator_1.GatekeeperValidator; } });
var RuntimeConfigManager_1 = require("./config/RuntimeConfigManager");
Object.defineProperty(exports, "RuntimeConfigManager", { enumerable: true, get: function () { return RuntimeConfigManager_1.RuntimeConfigManager; } });
var SchemaValidator_1 = require("./config/SchemaValidator");
Object.defineProperty(exports, "SchemaValidator", { enumerable: true, get: function () { return SchemaValidator_1.SchemaValidator; } });
// -- Scenario Layer ---------------------------
var WorkloadModels_1 = require("./scenario/WorkloadModels");
Object.defineProperty(exports, "buildLoadProfile", { enumerable: true, get: function () { return WorkloadModels_1.buildLoadProfile; } });
Object.defineProperty(exports, "buildStressProfile", { enumerable: true, get: function () { return WorkloadModels_1.buildStressProfile; } });
Object.defineProperty(exports, "buildSoakProfile", { enumerable: true, get: function () { return WorkloadModels_1.buildSoakProfile; } });
Object.defineProperty(exports, "buildSpikeProfile", { enumerable: true, get: function () { return WorkloadModels_1.buildSpikeProfile; } });
Object.defineProperty(exports, "buildIterationProfile", { enumerable: true, get: function () { return WorkloadModels_1.buildIterationProfile; } });
Object.defineProperty(exports, "buildConstantArrivalRateProfile", { enumerable: true, get: function () { return WorkloadModels_1.buildConstantArrivalRateProfile; } });
Object.defineProperty(exports, "buildRampingArrivalRateProfile", { enumerable: true, get: function () { return WorkloadModels_1.buildRampingArrivalRateProfile; } });
Object.defineProperty(exports, "buildExternallyControlledProfile", { enumerable: true, get: function () { return WorkloadModels_1.buildExternallyControlledProfile; } });
Object.defineProperty(exports, "toK6ExecutorConfig", { enumerable: true, get: function () { return WorkloadModels_1.toK6ExecutorConfig; } });
var ExecutorFactory_1 = require("./scenario/ExecutorFactory");
Object.defineProperty(exports, "ExecutorFactory", { enumerable: true, get: function () { return ExecutorFactory_1.ExecutorFactory; } });
var ScenarioBuilder_1 = require("./scenario/ScenarioBuilder");
Object.defineProperty(exports, "ScenarioBuilder", { enumerable: true, get: function () { return ScenarioBuilder_1.ScenarioBuilder; } });
var TestPlanLoader_1 = require("./scenario/TestPlanLoader");
Object.defineProperty(exports, "TestPlanLoader", { enumerable: true, get: function () { return TestPlanLoader_1.TestPlanLoader; } });
// -- Execution Layer --------------------------
var HostMonitor_1 = require("./execution/HostMonitor");
Object.defineProperty(exports, "HostMonitor", { enumerable: true, get: function () { return HostMonitor_1.HostMonitor; } });
var JourneyAllocator_1 = require("./execution/JourneyAllocator");
Object.defineProperty(exports, "JourneyAllocator", { enumerable: true, get: function () { return JourneyAllocator_1.JourneyAllocator; } });
var ParallelExecutionManager_1 = require("./execution/ParallelExecutionManager");
Object.defineProperty(exports, "ParallelExecutionManager", { enumerable: true, get: function () { return ParallelExecutionManager_1.ParallelExecutionManager; } });
var PipelineRunner_1 = require("./execution/PipelineRunner");
Object.defineProperty(exports, "PipelineRunner", { enumerable: true, get: function () { return PipelineRunner_1.PipelineRunner; } });
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
var ErrorRuntime_1 = require("./runtime/ErrorRuntime");
Object.defineProperty(exports, "ErrorRuntime", { enumerable: true, get: function () { return ErrorRuntime_1.ErrorRuntime; } });
var LifecycleRuntime_1 = require("./runtime/LifecycleRuntime");
Object.defineProperty(exports, "LifecycleRuntime", { enumerable: true, get: function () { return LifecycleRuntime_1.LifecycleRuntime; } });
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
Object.defineProperty(exports, "endTransaction", { enumerable: true, get: function () { return transaction_1.endTransaction; } });
Object.defineProperty(exports, "getCurrentTransaction", { enumerable: true, get: function () { return transaction_1.getCurrentTransaction; } });
Object.defineProperty(exports, "initTransactions", { enumerable: true, get: function () { return transaction_1.initTransactions; } });
Object.defineProperty(exports, "isVuTerminated", { enumerable: true, get: function () { return transaction_1.isVuTerminated; } });
Object.defineProperty(exports, "k6Check", { enumerable: true, get: function () { return transaction_1.k6Check; } });
Object.defineProperty(exports, "startTransaction", { enumerable: true, get: function () { return transaction_1.startTransaction; } });
Object.defineProperty(exports, "transaction", { enumerable: true, get: function () { return transaction_1.transaction; } });
var request_1 = require("./utils/request");
Object.defineProperty(exports, "request", { enumerable: true, get: function () { return request_1.request; } });
var lifecycle_1 = require("./utils/lifecycle");
Object.defineProperty(exports, "createJourneyLifecycleStore", { enumerable: true, get: function () { return lifecycle_1.createJourneyLifecycleStore; } });
Object.defineProperty(exports, "getTransactionGate", { enumerable: true, get: function () { return lifecycle_1.getTransactionGate; } });
Object.defineProperty(exports, "isEnding", { enumerable: true, get: function () { return lifecycle_1.isEnding; } });
Object.defineProperty(exports, "runJourneyLifecycle", { enumerable: true, get: function () { return lifecycle_1.runJourneyLifecycle; } });
Object.defineProperty(exports, "thinktime", { enumerable: true, get: function () { return lifecycle_1.thinktime; } });
var replayLogger_1 = require("./utils/replayLogger");
Object.defineProperty(exports, "logReplayExchange", { enumerable: true, get: function () { return replayLogger_1.logReplayExchange; } });
Object.defineProperty(exports, "logExchange", { enumerable: true, get: function () { return replayLogger_1.logExchange; } });
Object.defineProperty(exports, "trackCorrelation", { enumerable: true, get: function () { return replayLogger_1.trackCorrelation; } });
Object.defineProperty(exports, "trackDataRow", { enumerable: true, get: function () { return replayLogger_1.trackDataRow; } });
Object.defineProperty(exports, "trackParameter", { enumerable: true, get: function () { return replayLogger_1.trackParameter; } });
var session_1 = require("./utils/session");
Object.defineProperty(exports, "clearCookies", { enumerable: true, get: function () { return session_1.clearCookies; } });
Object.defineProperty(exports, "deleteCookie", { enumerable: true, get: function () { return session_1.deleteCookie; } });
Object.defineProperty(exports, "getEnvContext", { enumerable: true, get: function () { return session_1.getEnvContext; } });
Object.defineProperty(exports, "registerBaseUrl", { enumerable: true, get: function () { return session_1.registerBaseUrl; } });
Object.defineProperty(exports, "registerFrameworkEnvironmentUrls", { enumerable: true, get: function () { return session_1.registerFrameworkEnvironmentUrls; } });
Object.defineProperty(exports, "resolveFrameworkUrl", { enumerable: true, get: function () { return session_1.resolveFrameworkUrl; } });
Object.defineProperty(exports, "resolvePath", { enumerable: true, get: function () { return session_1.resolvePath; } });
// -- Recording Layer ----------------------------
var DomainFilter_1 = require("./recording/DomainFilter");
Object.defineProperty(exports, "DomainFilter", { enumerable: true, get: function () { return DomainFilter_1.DomainFilter; } });
var HARParser_1 = require("./recording/HARParser");
Object.defineProperty(exports, "HARParser", { enumerable: true, get: function () { return HARParser_1.HARParser; } });
var ScriptGenerator_1 = require("./recording/ScriptGenerator");
Object.defineProperty(exports, "ScriptGenerator", { enumerable: true, get: function () { return ScriptGenerator_1.ScriptGenerator; } });
var TransactionGrouper_1 = require("./recording/TransactionGrouper");
Object.defineProperty(exports, "TransactionGrouper", { enumerable: true, get: function () { return TransactionGrouper_1.TransactionGrouper; } });
// -- Assertions Layer ---------------------------
var JourneyAssertionResolver_1 = require("./assertions/JourneyAssertionResolver");
Object.defineProperty(exports, "JourneyAssertionResolver", { enumerable: true, get: function () { return JourneyAssertionResolver_1.JourneyAssertionResolver; } });
var SLARegistry_1 = require("./assertions/SLARegistry");
Object.defineProperty(exports, "SLARegistry", { enumerable: true, get: function () { return SLARegistry_1.SLARegistry; } });
var ThresholdManager_1 = require("./assertions/ThresholdManager");
Object.defineProperty(exports, "ThresholdManager", { enumerable: true, get: function () { return ThresholdManager_1.ThresholdManager; } });
// -- Correlation Layer --------------------------
var CorrelationEngine_1 = require("./correlation/CorrelationEngine");
Object.defineProperty(exports, "CorrelationEngine", { enumerable: true, get: function () { return CorrelationEngine_1.CorrelationEngine; } });
var ExtractorRegistry_1 = require("./correlation/ExtractorRegistry");
Object.defineProperty(exports, "ExtractorRegistry", { enumerable: true, get: function () { return ExtractorRegistry_1.ExtractorRegistry; } });
var FallbackHandler_1 = require("./correlation/FallbackHandler");
Object.defineProperty(exports, "FallbackHandler", { enumerable: true, get: function () { return FallbackHandler_1.FallbackHandler; } });
var RuleProcessor_1 = require("./correlation/RuleProcessor");
Object.defineProperty(exports, "RuleProcessor", { enumerable: true, get: function () { return RuleProcessor_1.RuleProcessor; } });
// -- Debug Layer --------------------------------
var DiffChecker_1 = require("./debug/DiffChecker");
Object.defineProperty(exports, "DiffChecker", { enumerable: true, get: function () { return DiffChecker_1.DiffChecker; } });
var ExchangeLog_1 = require("./debug/ExchangeLog");
Object.defineProperty(exports, "ExchangeLogBuilder", { enumerable: true, get: function () { return ExchangeLog_1.ExchangeLogBuilder; } });
var HTMLDiffReporter_1 = require("./debug/HTMLDiffReporter");
Object.defineProperty(exports, "HTMLDiffReporter", { enumerable: true, get: function () { return HTMLDiffReporter_1.HTMLDiffReporter; } });
var RecordingLogResolver_1 = require("./debug/RecordingLogResolver");
Object.defineProperty(exports, "RecordingLogResolver", { enumerable: true, get: function () { return RecordingLogResolver_1.RecordingLogResolver; } });
var ReplayRunner_1 = require("./debug/ReplayRunner");
Object.defineProperty(exports, "ReplayRunner", { enumerable: true, get: function () { return ReplayRunner_1.ReplayRunner; } });
// -- Reporters Layer ----------------------------
var AzureReporter_1 = require("./reporters/AzureReporter");
Object.defineProperty(exports, "AzureReporter", { enumerable: true, get: function () { return AzureReporter_1.AzureReporter; } });
var CustomUploader_1 = require("./reporters/CustomUploader");
Object.defineProperty(exports, "CustomUploader", { enumerable: true, get: function () { return CustomUploader_1.CustomUploader; } });
var GrafanaReporter_1 = require("./reporters/GrafanaReporter");
Object.defineProperty(exports, "GrafanaReporter", { enumerable: true, get: function () { return GrafanaReporter_1.GrafanaReporter; } });
var ResultTransformer_1 = require("./reporters/ResultTransformer");
Object.defineProperty(exports, "ResultTransformer", { enumerable: true, get: function () { return ResultTransformer_1.ResultTransformer; } });
// -- Reporting Layer ----------------------------
var ArtifactWriter_1 = require("./reporting/ArtifactWriter");
Object.defineProperty(exports, "ArtifactWriter", { enumerable: true, get: function () { return ArtifactWriter_1.ArtifactWriter; } });
var EventArtifactBuilder_1 = require("./reporting/EventArtifactBuilder");
Object.defineProperty(exports, "EventArtifactBuilder", { enumerable: true, get: function () { return EventArtifactBuilder_1.EventArtifactBuilder; } });
var RunReportGenerator_1 = require("./reporting/RunReportGenerator");
Object.defineProperty(exports, "RunReportGenerator", { enumerable: true, get: function () { return RunReportGenerator_1.RunReportGenerator; } });
var RunSummaryBuilder_1 = require("./reporting/RunSummaryBuilder");
Object.defineProperty(exports, "RunSummaryBuilder", { enumerable: true, get: function () { return RunSummaryBuilder_1.RunSummaryBuilder; } });
var TimeseriesArtifactBuilder_1 = require("./reporting/TimeseriesArtifactBuilder");
Object.defineProperty(exports, "TimeseriesArtifactBuilder", { enumerable: true, get: function () { return TimeseriesArtifactBuilder_1.TimeseriesArtifactBuilder; } });
var TransactionMetricsBuilder_1 = require("./reporting/TransactionMetricsBuilder");
Object.defineProperty(exports, "TransactionMetricsBuilder", { enumerable: true, get: function () { return TransactionMetricsBuilder_1.TransactionMetricsBuilder; } });
