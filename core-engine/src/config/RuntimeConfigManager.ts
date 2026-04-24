/**
 * RuntimeConfigManager.ts
 * Phase 1/2 – Typed accessors for runtime behavior the test scripts call at runtime.
 * Lives in Phase 1 because the Gatekeeper needs it for pre-flight; scripts use it at run-time.
 */

import { RuntimeSettings, ThinkTimeConfig, FRAMEWORK_DEFAULTS } from '../types/ConfigContracts';

export class RuntimeConfigManager {
  constructor(private readonly settings: RuntimeSettings) {}

  private get reportingConfig() {
    return this.settings.reporting ?? FRAMEWORK_DEFAULTS.reporting;
  }

  private get timeseriesConfig() {
    return this.reportingConfig.timeseries ?? FRAMEWORK_DEFAULTS.reporting.timeseries;
  }

  private get errorCaptureConfig() {
    return this.settings.errors ?? FRAMEWORK_DEFAULTS.errors;
  }

  private get monitoringConfig() {
    return this.settings.monitoring ?? FRAMEWORK_DEFAULTS.monitoring;
  }

  // ---------------------------------------------
  // Think Time
  // ---------------------------------------------

  /**
   * Returns the think time in seconds to apply between transactions.
   * When mode = 'random', returns a value in [min, max].
   */
  getThinkTimeSeconds(): number {
    const cfg: ThinkTimeConfig = this.settings.thinkTime;
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

  isPacingEnabled(): boolean {
    return this.settings.pacing.enabled;
  }

  getPacingSeconds(): number {
    return this.settings.pacing.targetIntervalSeconds ?? 0;
  }

  getPacingIntervalMs(): number {
    return (this.settings.pacing.targetIntervalSeconds ?? 0) * 1000;
  }

  // ---------------------------------------------
  // HTTP
  // ---------------------------------------------

  getTimeoutMs(): number {
    return this.settings.http.timeoutSeconds * 1000;
  }

  getMaxRedirects(): number {
    return this.settings.http.maxRedirects;
  }

  shouldThrowOnError(): boolean {
    return this.settings.http.throwOnError;
  }

  // ---------------------------------------------
  // Error Behavior
  // ---------------------------------------------

  getErrorBehavior(): RuntimeSettings['errorBehavior'] {
    return this.settings.errorBehavior;
  }

  // ---------------------------------------------
  // Reporting
  // ---------------------------------------------

  getTransactionStats(): string[] {
    const stats = this.reportingConfig.transactionStats;
    return Array.isArray(stats) && stats.length > 0
      ? [...stats]
      : [...FRAMEWORK_DEFAULTS.reporting.transactionStats];
  }

  shouldIncludeTransactionTable(): boolean {
    return this.reportingConfig.includeTransactionTable ?? FRAMEWORK_DEFAULTS.reporting.includeTransactionTable;
  }

  shouldIncludeErrorTable(): boolean {
    return this.reportingConfig.includeErrorTable ?? FRAMEWORK_DEFAULTS.reporting.includeErrorTable;
  }

  isTimeseriesEnabled(): boolean {
    return this.timeseriesConfig.enabled ?? FRAMEWORK_DEFAULTS.reporting.timeseries.enabled;
  }

  getTimeseriesBucketSizeSeconds(): number {
    return this.timeseriesConfig.bucketSizeSeconds ?? FRAMEWORK_DEFAULTS.reporting.timeseries.bucketSizeSeconds ?? 10;
  }

  // ---------------------------------------------
  // Error Capture
  // ---------------------------------------------

  shouldCaptureSnapshotOnFailure(): boolean {
    return this.errorCaptureConfig.captureSnapshotOnFailure ?? FRAMEWORK_DEFAULTS.errors.captureSnapshotOnFailure;
  }

  getMaxSnapshotsPerRun(): number {
    return this.errorCaptureConfig.maxSnapshotsPerRun ?? FRAMEWORK_DEFAULTS.errors.maxSnapshotsPerRun;
  }

  shouldIncludeRequestHeadersInSnapshots(): boolean {
    return this.errorCaptureConfig.includeRequestHeaders ?? FRAMEWORK_DEFAULTS.errors.includeRequestHeaders;
  }

  shouldIncludeRequestBodyInSnapshots(): boolean {
    return this.errorCaptureConfig.includeRequestBody ?? FRAMEWORK_DEFAULTS.errors.includeRequestBody;
  }

  shouldIncludeResponseHeadersInSnapshots(): boolean {
    return this.errorCaptureConfig.includeResponseHeaders ?? FRAMEWORK_DEFAULTS.errors.includeResponseHeaders;
  }

  shouldIncludeResponseBodyInSnapshots(): boolean {
    return this.errorCaptureConfig.includeResponseBody ?? FRAMEWORK_DEFAULTS.errors.includeResponseBody;
  }

  // ---------------------------------------------
  // Monitoring
  // ---------------------------------------------

  isMonitoringEnabled(): boolean {
    return this.monitoringConfig.enabled ?? FRAMEWORK_DEFAULTS.monitoring.enabled;
  }

  getCpuWarningPercent(): number {
    return this.monitoringConfig.cpuWarningPercent ?? FRAMEWORK_DEFAULTS.monitoring.cpuWarningPercent;
  }

  getMemoryWarningPercent(): number {
    return this.monitoringConfig.memoryWarningPercent ?? FRAMEWORK_DEFAULTS.monitoring.memoryWarningPercent;
  }

  getMonitoringSampleIntervalSeconds(): number {
    return this.monitoringConfig.sampleIntervalSeconds ?? FRAMEWORK_DEFAULTS.monitoring.sampleIntervalSeconds;
  }

  // ---------------------------------------------
  // Debug
  // ---------------------------------------------

  isDebugMode(): boolean {
    return this.settings.debugMode;
  }

  /** Return all settings (useful for logging) */
  dump(): RuntimeSettings {
    return { ...this.settings };
  }
}
