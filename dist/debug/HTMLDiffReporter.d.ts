import { DiffResult } from './DiffChecker';
import { K6Metrics } from './ReplayRunner';
export interface ReportOptions {
    k6Errors?: string[];
    k6Metrics?: K6Metrics;
    consoleLogs?: string[];
    /**
     * Resolved runtime config block (http / thinkTime / pacing / reporting /
     * errors) the framework injected for this debug run. Rendered in the
     * "Advanced Settings & Configuration" panel so debug mirrors the run report.
     */
    runtimeConfig?: Record<string, unknown>;
    /**
     * How the framework invoked k6 for this debug run: the exact command, the
     * resolved k6 options/scenarios (--config), and the injected K6_PERF_* env.
     * Rendered as a collapsible block under Advanced Settings, mirroring the run
     * report's "How this test was invoked by the framework".
     */
    execution?: {
        command?: string;
        options?: unknown;
        env?: Record<string, string>;
    };
}
export declare class HTMLDiffReporter {
    static generateReport(results: DiffResult[], outPath: string, options?: ReportOptions): void;
    private static buildPayload;
    private static hasMismatch;
    private static resolveStatus;
    private static findWorstTransaction;
    private static average;
    private static countWarnings;
}
