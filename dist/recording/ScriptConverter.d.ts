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
    static convertFile(filePath: string, teamName?: string, lifecycle?: LifecycleSelection): string;
    /**
     * Convert a raw k6 script string to a framework-compatible script.
     */
    static convert(source: string, teamName: string, lifecycle?: LifecycleSelection): string;
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
    /**
     * Build a `request()` call string using the framework helper.
     * Replaces the old request-def + http.* + logExchange pattern.
     *
     * When `assignOnly` is true, emits `resName = request(...)` (no `const`) so
     * the caller can place it inside a try block with a preceding `let resName;`.
     *
     * Also auto-injects a `variables: { ... }` option from `${...}` template
     * expressions found in url/body/headers, so every local-scope variable used
     * in a request shows up in the debug report's Variables section with its
     * resolved value at the moment of the call. Skips expressions that are
     * already auto-tracked via Proxy/registry (env.*, ctx.*, correlation_vars[*],
     * getUniqueItem(FILES[*])).
     */
    private static buildRequestCallString;
    /**
     * Scan url/body/headers expression strings for `${...}` template references
     * and return the names/accessors of variables that aren't already tracked
     * elsewhere by the framework.
     */
    private static extractRequestVars;
    /**
     * Extract a property value from an object literal string.
     */
    private static extractObjectProperty;
    /**
     * Re-indent a multi-line string to align with the given base indent.
     */
    private static reindent;
    private static isTrendAddLine;
    private static getLeadingWhitespace;
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
    private static toRuntimeUrlExpression;
    private static extractStringLiteralValue;
}
