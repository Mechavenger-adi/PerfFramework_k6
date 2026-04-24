import { DataOverflowStrategy } from './TestPlanSchema';
export { DataOverflowStrategy };
export interface EnvironmentConfig {
    /** Logical name of the environment: dev | staging | uat | prod */
    name: string;
    /** Base URL of the system under test */
    baseUrl: string;
    /** Optional secondary base URLs keyed by service name */
    serviceUrls?: Record<string, string>;
    /** Any additional environment-specific key-value pairs */
    custom?: Record<string, string | number | boolean>;
}
export type ErrorBehavior = 'continue' | 'stop_iteration' | 'stop_vu' | 'abort_test';
export type ThinkTimeMode = 'fixed' | 'random';
export interface ThinkTimeConfig {
    mode: ThinkTimeMode;
    /** Fixed think time in seconds (used when mode = 'fixed') */
    fixed?: number;
    /** Min seconds (used when mode = 'random') */
    min?: number;
    /** Max seconds (used when mode = 'random') */
    max?: number;
}
export interface PacingConfig {
    /** Enable pacing (iteration-based rate control) */
    enabled: boolean;
    /** Target duration between iteration starts in seconds */
    targetIntervalSeconds?: number;
}
export interface HttpConfig {
    /** Global HTTP request timeout in seconds */
    timeoutSeconds: number;
    /** Max redirects to follow */
    maxRedirects: number;
    /** Whether to throw on non-2xx by default */
    throwOnError: boolean;
}
export interface TimeSeriesReportingConfig {
    /** Enable bucketed timeseries collection for interactive reports */
    enabled: boolean;
    /** Bucket size in seconds for aggregated timeseries points */
    bucketSizeSeconds?: number;
}
export interface ReportingConfig {
    /** Visible transaction stats/columns in reports */
    transactionStats: string[];
    /** Include transaction table in generated reports */
    includeTransactionTable: boolean;
    /** Include error table in generated reports */
    includeErrorTable: boolean;
    /** Timeseries config for unified HTML graphs */
    timeseries: TimeSeriesReportingConfig;
}
export interface ErrorCaptureConfig {
    /** Capture snapshots for supported failures */
    captureSnapshotOnFailure: boolean;
    /** Limit snapshot volume per run */
    maxSnapshotsPerRun: number;
    includeRequestHeaders: boolean;
    includeRequestBody: boolean;
    includeResponseHeaders: boolean;
    includeResponseBody: boolean;
}
export interface MonitoringConfig {
    /** Enable runner-side host monitoring */
    enabled: boolean;
    /** CPU warning threshold in percent */
    cpuWarningPercent: number;
    /** Memory warning threshold in percent */
    memoryWarningPercent: number;
    /** Sampling interval in seconds */
    sampleIntervalSeconds: number;
}
export interface RuntimeSettings {
    thinkTime: ThinkTimeConfig;
    pacing: PacingConfig;
    http: HttpConfig;
    errorBehavior: ErrorBehavior;
    reporting: ReportingConfig;
    errors: ErrorCaptureConfig;
    monitoring: MonitoringConfig;
    /** Debug mode – prints resolved config; enables verbose logging */
    debugMode: boolean;
}
export declare const FRAMEWORK_DEFAULTS: RuntimeSettings;
export interface ResolvedConfig {
    environment: EnvironmentConfig;
    runtime: RuntimeSettings;
    /** Merged CLI overrides (highest precedence after .env secrets) */
    cliOverrides: Record<string, unknown>;
    /** Raw .env secrets (never logged) */
    secrets: Record<string, string>;
}
//# sourceMappingURL=ConfigContracts.d.ts.map