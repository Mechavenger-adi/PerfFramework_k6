import { DiffResult } from './DiffChecker';
import { K6Metrics } from './ReplayRunner';
export interface ReportOptions {
    k6Errors?: string[];
    k6Metrics?: K6Metrics;
}
export declare class HTMLDiffReporter {
    static generateReport(results: DiffResult[], outPath: string, options?: ReportOptions): void;
    private static renderIterationSummaryRow;
    private static renderIterationSection;
    private static renderTransactions;
    private static renderRequestCard;
    private static renderTransactionSummaryTable;
    private static renderRequestSummaryTable;
    private static renderGlobalVariables;
    private static renderRequestVariables;
    private static renderSnapshot;
    private static renderHeaderTable;
    private static renderHeaderList;
    private static renderCookieList;
    private static renderCookieTable;
    private static renderBodyComparison;
    private static renderUrl;
    private static decodeText;
    private static formatBody;
    private static groupByIteration;
    private static headerSummary;
    private static formatDuration;
    private static average;
    private static countWarnings;
    private static scoreClass;
    private static statusCodeClass;
    private static formatHeaders;
    private static renderMetricsSection;
    private static escapeHtml;
    /** Extract pure numeric value from metric strings like "147.69ms", "12.05s", "545" for sorting */
    private static parseMetricNum;
    private static sanitizeId;
    private static readonly REDIRECT_STATUSES;
    private static readonly BODY_PREVIEW_MAX;
    private static isBodyMethod;
    private static bodyPreview;
    private static detectRedirect;
}
//# sourceMappingURL=HTMLDiffReporter.d.ts.map