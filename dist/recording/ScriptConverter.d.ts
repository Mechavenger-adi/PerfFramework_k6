import { LifecycleSelection } from './ScriptGenerator';
/**
 * ScriptConverter
 *
 * Converts conventional k6 scripts (e.g. from Grafana k6 Studio, raw HAR
 * exports, or hand-written scripts) into framework-compatible scripts that
 * include:
 *   - `logExchange()` calls for debug replay
 *   - Request definition objects with `{id, transaction, method, url, body, params}`
 *   - `initTransactions / startTransaction / endTransaction` wrappers
 *   - Proper framework imports
 *   - Runtime variable tracking via `trackCorrelation` / `trackParameter`
 *
 * Handles two major input patterns:
 *   A) "Studio" scripts with `Trend`, `group()`, manual `Date.now()` timing
 *   B) "Semi-framework" scripts that already have transaction helpers but lack logExchange
 */
export declare class ScriptConverter {
    /**
     * Read a script file and return the converted source.
     */
    static convertFile(filePath: string, lifecycle?: LifecycleSelection): string;
    /**
     * Convert a raw k6 script string to a framework-compatible script.
     */
    static convert(source: string, lifecycle?: LifecycleSelection): string;
    static extractGroupNames(source: string): string[];
    private static buildImportBlock;
    private static findImportBlockEnd;
    private static matchHttpCall;
    private static parseHttpCall;
    /**
     * Split a string of function arguments at the top level (respecting nested
     * braces, brackets, parens, and strings).
     */
    private static splitTopLevelArgs;
    private static buildRequestDefString;
    /**
     * Extract a property value from an object literal string.
     */
    private static extractObjectProperty;
    /**
     * Re-indent a multi-line string to align with the given base indent.
     */
    private static reindent;
    private static buildHttpCallString;
    private static isTrendAddLine;
    private static getLeadingWhitespace;
    private static formatTransactionArray;
    /**
     * Sanitize a group name for use as a k6 metric name.
     * k6 metrics must only include ASCII letters, numbers, or underscores
     * and start with a letter or underscore (max 128 chars).
     */
    private static sanitizeTransactionName;
    private static applyPhaseContract;
    private static renderPhaseFunction;
    private static partitionLifecycleStatements;
    private static splitTopLevelStatements;
    private static extractGroupName;
    private static findMatchingBrace;
    private static indentBlock;
    /** Extract unique base URLs (origin) from URL literals in source code. */
    private static extractBaseUrlsFromSource;
}
//# sourceMappingURL=ScriptConverter.d.ts.map