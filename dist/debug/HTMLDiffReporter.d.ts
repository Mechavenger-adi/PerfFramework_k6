import { DiffResult } from './DiffChecker';
import { K6Metrics } from './ReplayRunner';
export interface ReportOptions {
    k6Errors?: string[];
    k6Metrics?: K6Metrics;
    consoleLogs?: string[];
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
