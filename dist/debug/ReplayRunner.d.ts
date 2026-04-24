import { DiffResult } from './DiffChecker';
export interface DebugReplayOptions {
    scriptPath: string;
    recordingLogPath?: string;
    outHtmlPath: string;
    replayLogPath?: string;
    vus?: number;
    iterations?: number;
    noCookiesReset?: boolean;
}
export interface DebugReplayResult {
    htmlReportPath: string;
    replayLogPath: string;
    results: DiffResult[];
    recordingLogPath?: string;
}
export interface K6Metrics {
    checks: {
        name: string;
        passed: boolean;
    }[];
    transactions: {
        name: string;
        avg: string;
        min: string;
        max: string;
        med: string;
        p90: string;
        p95: string;
    }[];
    http: {
        name: string;
        avg: string;
        min: string;
        max: string;
        med: string;
        p90: string;
        p95: string;
    }[];
    httpSummary: {
        reqs: string;
        failedPct: string;
    };
    execution: {
        duration: string;
        iterations: string;
        vus: string;
    };
    network: {
        received: string;
        sent: string;
    };
}
export declare class ReplayRunner {
    private static readonly REPLAY_PREFIX;
    /**
     * Run a k6 script in debug mode, capture replay logs, compare them to the recording log,
     * and generate an HTML diff report automatically.
     */
    static runDebug(options: DebugReplayOptions): Promise<DebugReplayResult>;
    private static extractReplayEntries;
    private static collectReplayEntriesFromFile;
    private static collectReplayEntriesFromText;
    private static collectReplayEntryFromLine;
    private static extractReplayPayload;
    private static parseReplayEntry;
    private static readRecordingLog;
    private static readonly STATIC_EXT_RE;
    private static normalizeRecordingEntry;
    private static decodeBodyIfNeeded;
    private static looksLikeBase64;
    private static looksReadable;
    private static writeJson;
    /**
     * Extract k6 runtime error messages from captured stdout/stderr.
     * k6 errors appear as `level=error msg="..."` or `ERRO[xxxx] ...` lines.
     */
    private static extractK6Errors;
    /**
     * Parse k6 performance metrics from the TOTAL RESULTS section of stdout.
     */
    private static extractK6Metrics;
    private static defaultReplayLogPath;
}
//# sourceMappingURL=ReplayRunner.d.ts.map