/**
 * RuntimeConfigManager.ts
 * Phase 1/2 – Typed accessors for runtime behavior the test scripts call at runtime.
 * Lives in Phase 1 because the Gatekeeper needs it for pre-flight; scripts use it at run-time.
 */
import { RuntimeSettings } from '../types/ConfigContracts';
export declare class RuntimeConfigManager {
    private readonly settings;
    constructor(settings: RuntimeSettings);
    private get reportingConfig();
    private get timeseriesConfig();
    private get errorCaptureConfig();
    private get monitoringConfig();
    /**
     * Returns the think time in seconds to apply between transactions.
     * When mode = 'random', returns a value in [min, max].
     */
    getThinkTimeSeconds(): number;
    isPacingEnabled(): boolean;
    getPacingSeconds(): number;
    getPacingIntervalMs(): number;
    getTimeoutMs(): number;
    getMaxRedirects(): number;
    shouldThrowOnError(): boolean;
    getErrorBehavior(): RuntimeSettings['errorBehavior'];
    getTransactionStats(): string[];
    shouldIncludeTransactionTable(): boolean;
    shouldIncludeErrorTable(): boolean;
    /**
     * When true, reports overwrite a single stable `Run_latest` folder instead
     * of creating a new timestamped folder per run. Defaults to false so run
     * history is preserved.
     */
    shouldOverrideExistingResults(): boolean;
    isTimeseriesEnabled(): boolean;
    getTimeseriesBucketSizeSeconds(): number;
    /**
     * When false, the raw k6 streaming-JSON file (`metrics-stream.json`) is
     * deleted after the unified report finishes generating. The file is the
     * source of truth for the per-second time-series charts and is several
     * MB per minute of high-RPS traffic — useful for re-analysis but heavy
     * for CI / storage-constrained environments.
     */
    shouldKeepRawMetricsStream(): boolean;
    shouldCaptureSnapshotOnFailure(): boolean;
    getMaxSnapshotsPerRun(): number;
    shouldIncludeRequestHeadersInSnapshots(): boolean;
    shouldIncludeRequestBodyInSnapshots(): boolean;
    shouldIncludeResponseHeadersInSnapshots(): boolean;
    shouldIncludeResponseBodyInSnapshots(): boolean;
    isMonitoringEnabled(): boolean;
    getCpuWarningPercent(): number;
    getMemoryWarningPercent(): number;
    getMonitoringSampleIntervalSeconds(): number;
    isDebugMode(): boolean;
    /** Return all settings (useful for logging) */
    dump(): RuntimeSettings;
}
