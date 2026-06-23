interface LifecycleConfig {
    init?: string[];
    end?: string[];
}
interface ConvertOptions {
    lifecycle?: LifecycleConfig;
}
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
    static convertFile(filePath: string, options?: ConvertOptions): string;
    /**
     * Convert a raw k6 script string to a framework-compatible script.
     */
    static convert(source: string, options?: ConvertOptions): string;
    private static extractGroupNames;
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
    private static applyLifecycleToConvertedSource;
    private static renderLifecycleHeader;
    private static renderLifecycleDefault;
    private static renderConvertedPhaseFunction;
    private static partitionLifecycleStatements;
    private static replaceStateDataRefs;
    private static splitTopLevelStatements;
    private static extractGroupName;
    private static findMatchingBrace;
    private static indentBlock;
    private static renderLifecycleHelpers;
    private static isTrendAddLine;
    private static getLeadingWhitespace;
    private static formatTransactionArray;
    /**
     * Sanitize a group name for use as a k6 metric name.
     * k6 metrics must only include ASCII letters, numbers, or underscores
     * and start with a letter or underscore (max 128 chars).
     */
    private static sanitizeTransactionName;
}
export {};
//# sourceMappingURL=ScriptConverter.lifecycle-prototype.d.ts.map