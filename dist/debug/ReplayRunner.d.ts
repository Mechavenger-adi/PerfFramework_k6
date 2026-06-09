import { DiffResult } from './DiffChecker';
export interface DebugReplayOptions {
    scriptPath: string;
    recordingLogPath?: string;
    outHtmlPath: string;
    replayLogPath?: string;
    vus?: number;
    iterations?: number;
    noCookiesReset?: boolean;
    /** Team environment configs (testSuites from the loaded environment file). */
    teamEnvironments?: Record<string, unknown>;
    /** Error behavior for the debug run (continue | stop_iteration | stop_vu | abort_test). Defaults to 'continue'. */
    errorBehavior?: string;
    /** Extra CLI flags forwarded verbatim to k6 (e.g. ['--http-debug=full', '--verbose']). */
    extraK6Args?: string[];
    /**
     * Stat columns from runtime `reporting.transactionStats`. The debug report's
     * default columns (min/avg/max/p90/p95) are always shown; any extra stats
     * here are appended. Omitted for the standalone `debug` command, which has no
     * resolved runtime config.
     */
    transactionStats?: string[];
}
export interface DebugReplayResult {
    htmlReportPath: string;
    replayLogPath: string;
    results: DiffResult[];
    recordingLogPath?: string;
}
/** One metric row with stat values keyed by stat id (e.g. 'avg', 'p(90)'). */
export interface K6MetricRow {
    name: string;
    values: Record<string, string>;
}
export interface K6Metrics {
    checks: {
        name: string;
        passed: boolean;
    }[];
    transactions: K6MetricRow[];
    http: K6MetricRow[];
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
    /** Ordered stat-column ids the report should render for transaction/http tables. */
    statsColumns: string[];
}
export declare class ReplayRunner {
    private static readonly REPLAY_PREFIX;
    /**
     * Run a k6 script in debug mode, capture replay logs, compare them to the recording log,
     * and generate an HTML diff report automatically.
     */
    static runDebug(options: DebugReplayOptions): Promise<DebugReplayResult>;
    /** Stats the debug timing tables always show, regardless of runtime config. */
    private static readonly DEBUG_DEFAULT_STATS;
    /** Normalize a stat id, collapsing pN / p(N) percentile notation to `p(N)`. */
    private static normalizeStat;
    /**
     * Resolve the ordered stat columns for the debug report: the fixed defaults
     * (min/avg/max/p90/p95) plus any extra stats the user configured in runtime
     * `reporting.transactionStats`, in config order, de-duplicated.
     */
    private static resolveDebugStats;
    /**
     * Build the `summaryTrendStats` array k6 needs so the summary-export JSON
     * actually contains every stat we plan to render. Only k6-computable trend
     * stats are forwarded (avg/min/med/max/count and p(N)); pass/fail/std are
     * derived elsewhere or unavailable. The k6 defaults are always included.
     */
    private static buildTrendStats;
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
     * Build the diff report's performance-metrics view from k6's `--summary-export`
     * JSON file. We read this file rather than scraping k6's stdout so stdout can
     * stay fully inherited — that's what lets k6 render its animated, in-place
     * progress bar instead of printing one fresh progress line per second.
     *
     * `transactionNames` are the custom transaction metrics declared in the
     * script (via `transaction()` / `startTransaction()`); they let us pick the
     * per-transaction timing Trends out of the otherwise-flat metrics map.
     */
    private static extractK6Metrics;
    /**
     * Compute population std-dev (ms) per metric from the raw k6 `--out json`
     * point stream — k6's summary export doesn't include std. Uses Welford's
     * online algorithm (O(1) memory per metric), matching the live console
     * table's `sqrt(M2/n)`. Fills the 'std' column on each transaction/http row;
     * leaves '-' when a metric had no points. Best-effort — never throws.
     */
    private static fillStdDevs;
    /** Format a millisecond duration the way k6's text summary does (ms vs s). */
    private static fmtDuration;
    /** Format a byte count into a compact string (B / kB / MB). */
    private static fmtBytes;
    private static defaultReplayLogPath;
    /**
     * Extract user console.log / console.info / console.warn messages from k6 output.
     * k6 emits these as logfmt lines: level=info msg="..." source=console
     * Excludes internal framework prefixes like [k6-perf] and [replay-log].
     */
    private static extractConsoleLogs;
}
