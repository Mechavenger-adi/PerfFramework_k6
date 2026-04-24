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
    isTimeseriesEnabled(): boolean;
    getTimeseriesBucketSizeSeconds(): number;
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
//# sourceMappingURL=RuntimeConfigManager.d.ts.map