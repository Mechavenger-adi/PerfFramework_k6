"use strict";
/**
 * RuntimeConfigManager.ts
 * Phase 1/2 – Typed accessors for runtime behavior the test scripts call at runtime.
 * Lives in Phase 1 because the Gatekeeper needs it for pre-flight; scripts use it at run-time.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeConfigManager = void 0;
const ConfigContracts_1 = require("../types/ConfigContracts");
class RuntimeConfigManager {
    constructor(settings) {
        this.settings = settings;
    }
    get reportingConfig() {
        return this.settings.reporting ?? ConfigContracts_1.FRAMEWORK_DEFAULTS.reporting;
    }
    get timeseriesConfig() {
        return this.reportingConfig.timeseries ?? ConfigContracts_1.FRAMEWORK_DEFAULTS.reporting.timeseries;
    }
    get errorCaptureConfig() {
        return this.settings.errors ?? ConfigContracts_1.FRAMEWORK_DEFAULTS.errors;
    }
    get monitoringConfig() {
        return this.settings.monitoring ?? ConfigContracts_1.FRAMEWORK_DEFAULTS.monitoring;
    }
    // ---------------------------------------------
    // Think Time
    // ---------------------------------------------
    /**
     * Returns the think time in seconds to apply between transactions.
     * When mode = 'random', returns a value in [min, max].
     */
    getThinkTimeSeconds() {
        const cfg = this.settings.thinkTime;
        if (cfg.mode === 'fixed') {
            return cfg.fixed ?? 1;
        }
        // random mode
        const min = cfg.min ?? 0.5;
        const max = cfg.max ?? 3;
        return min + Math.random() * (max - min);
    }
    // ---------------------------------------------
    // Pacing
    // ---------------------------------------------
    isPacingEnabled() {
        return this.settings.pacing.enabled;
    }
    getPacingSeconds() {
        return this.settings.pacing.targetIntervalSeconds ?? 0;
    }
    getPacingIntervalMs() {
        return (this.settings.pacing.targetIntervalSeconds ?? 0) * 1000;
    }
    // ---------------------------------------------
    // HTTP
    // ---------------------------------------------
    getTimeoutMs() {
        return this.settings.http.timeoutSeconds * 1000;
    }
    getMaxRedirects() {
        return this.settings.http.maxRedirects;
    }
    shouldThrowOnError() {
        return this.settings.http.throwOnError;
    }
    // ---------------------------------------------
    // Error Behavior
    // ---------------------------------------------
    getErrorBehavior() {
        return this.settings.errorBehavior;
    }
    // ---------------------------------------------
    // Reporting
    // ---------------------------------------------
    getTransactionStats() {
        const stats = this.reportingConfig.transactionStats;
        return Array.isArray(stats) && stats.length > 0
            ? [...stats]
            : [...ConfigContracts_1.FRAMEWORK_DEFAULTS.reporting.transactionStats];
    }
    shouldIncludeTransactionTable() {
        return this.reportingConfig.includeTransactionTable ?? ConfigContracts_1.FRAMEWORK_DEFAULTS.reporting.includeTransactionTable;
    }
    shouldIncludeErrorTable() {
        return this.reportingConfig.includeErrorTable ?? ConfigContracts_1.FRAMEWORK_DEFAULTS.reporting.includeErrorTable;
    }
    isTimeseriesEnabled() {
        return this.timeseriesConfig.enabled ?? ConfigContracts_1.FRAMEWORK_DEFAULTS.reporting.timeseries.enabled;
    }
    getTimeseriesBucketSizeSeconds() {
        return this.timeseriesConfig.bucketSizeSeconds ?? ConfigContracts_1.FRAMEWORK_DEFAULTS.reporting.timeseries.bucketSizeSeconds ?? 10;
    }
    // ---------------------------------------------
    // Error Capture
    // ---------------------------------------------
    shouldCaptureSnapshotOnFailure() {
        return this.errorCaptureConfig.captureSnapshotOnFailure ?? ConfigContracts_1.FRAMEWORK_DEFAULTS.errors.captureSnapshotOnFailure;
    }
    getMaxSnapshotsPerRun() {
        return this.errorCaptureConfig.maxSnapshotsPerRun ?? ConfigContracts_1.FRAMEWORK_DEFAULTS.errors.maxSnapshotsPerRun;
    }
    shouldIncludeRequestHeadersInSnapshots() {
        return this.errorCaptureConfig.includeRequestHeaders ?? ConfigContracts_1.FRAMEWORK_DEFAULTS.errors.includeRequestHeaders;
    }
    shouldIncludeRequestBodyInSnapshots() {
        return this.errorCaptureConfig.includeRequestBody ?? ConfigContracts_1.FRAMEWORK_DEFAULTS.errors.includeRequestBody;
    }
    shouldIncludeResponseHeadersInSnapshots() {
        return this.errorCaptureConfig.includeResponseHeaders ?? ConfigContracts_1.FRAMEWORK_DEFAULTS.errors.includeResponseHeaders;
    }
    shouldIncludeResponseBodyInSnapshots() {
        return this.errorCaptureConfig.includeResponseBody ?? ConfigContracts_1.FRAMEWORK_DEFAULTS.errors.includeResponseBody;
    }
    // ---------------------------------------------
    // Monitoring
    // ---------------------------------------------
    isMonitoringEnabled() {
        return this.monitoringConfig.enabled ?? ConfigContracts_1.FRAMEWORK_DEFAULTS.monitoring.enabled;
    }
    getCpuWarningPercent() {
        return this.monitoringConfig.cpuWarningPercent ?? ConfigContracts_1.FRAMEWORK_DEFAULTS.monitoring.cpuWarningPercent;
    }
    getMemoryWarningPercent() {
        return this.monitoringConfig.memoryWarningPercent ?? ConfigContracts_1.FRAMEWORK_DEFAULTS.monitoring.memoryWarningPercent;
    }
    getMonitoringSampleIntervalSeconds() {
        return this.monitoringConfig.sampleIntervalSeconds ?? ConfigContracts_1.FRAMEWORK_DEFAULTS.monitoring.sampleIntervalSeconds;
    }
    // ---------------------------------------------
    // Debug
    // ---------------------------------------------
    isDebugMode() {
        return this.settings.debugMode;
    }
    /** Return all settings (useful for logging) */
    dump() {
        return { ...this.settings };
    }
}
exports.RuntimeConfigManager = RuntimeConfigManager;
//# sourceMappingURL=RuntimeConfigManager.js.map