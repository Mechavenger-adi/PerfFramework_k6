import { TransactionGroup } from './TransactionGrouper';
/**
 * Import specifier for the framework's VU-safe script API barrel (compiled
 * `dist/index.js`), relative to a generated script at
 * `testSuites/<suite>/tests/<name>.js`. Centralized here so the path — or a
 * future bundled package name — changes in exactly one place. Older scripts
 * that import the per-util `dist/utils/*.js` paths keep working unchanged.
 */
export declare const SCRIPT_API_MODULE = "../../../dist/index.js";
export interface LifecycleSelection {
    initGroups: string[];
    endGroups: string[];
}
export interface GenerateOptions {
    /**
     * Raw JS code to inject at module scope, AFTER the env declaration and BEFORE
     * the journey lifecycle store. Used by synthetic-source adapters (Postman)
     * that need init-context bindings — e.g. `const photoBytes = await open('../data/photo.jpg', 'b');`
     * for file uploads. The generator auto-adds the appropriate imports when
     * file bindings are detected; callers supply additional imports via
     * `extraImports`.
     */
    extraInitCode?: string;
    /**
     * Additional import statements to add at the top of the file (one per line).
     * Example: `[\"import { open } from 'k6/experimental/fs';\"]`.
     * De-duplicated by string equality with existing imports.
     */
    extraImports?: string[];
    /**
     * Per-entry comment blocks keyed by HAREntry.id (`req_1`, …). Values are
     * line arrays the generator emits verbatim:
     *   - `before` → above the `request(...)` call inside the transaction
     *   - `after`  → after the default `k6Check(...)` for that request
     * Lines may include the `__RES__` placeholder; we substitute the actual
     * response variable name (`res1`, `res2`, …) at emit time.
     */
    entryComments?: Map<string, {
        before: string[];
        after: string[];
    }>;
    /**
     * Per-entry metric name tags keyed by HAREntry.id. When present, emitted as
     * the request's `name` option (`name: 'Transaction_request'`) so per-request
     * k6 metrics group under it instead of the raw URL.
     */
    entryNames?: Map<string, string>;
}
export declare class ScriptGenerator {
    /**
     * Generates formatted TypeScript/JavaScript source code based on Transaction Groups.
     * Output uses the transaction() wrapper and request() helper from the framework utils.
     */
    static generate(groups: TransactionGroup[], lifecycle: LifecycleSelection | undefined, teamName: string, options?: GenerateOptions): string;
    private static buildPhaseFunction;
    /**
     * Derive a short, identifiable per-request metric name tag in the form
     * `METHOD_lastSegment_n`:
     *   - `METHOD`      → HTTP verb (GET, POST, …)
     *   - `lastSegment` → last non-empty URL path segment, query stripped,
     *                     sanitized to [A-Za-z0-9_], capped at 25 chars
     *                     (`/` → `root`)
     *   - `_n`          → script-wide occurrence count of this exact
     *                     METHOD_segment (1-based) across all phases and
     *                     transactions, so repeats are disambiguated and the
     *                     suffix never resets.
     *
     * Shared default for HAR / cURL / convert; Postman overrides with its item
     * name. `counters` is script-wide and mutated in place.
     */
    static deriveRequestName(method: string, url: string, counters: Map<string, number>): string;
    /**
     * Returns the URL expression to embed directly in the generated script (no extra quoting needed).
     * Same-domain paths become `${env.baseUrl}/path` template literals so request() receives an
     * absolute URL; different-domain URLs are kept as JSON string literals.
     */
    private static buildUrlExpression;
    private static buildRequestBody;
    /** Inline-format a plain object as a JS object literal at the given indent level. */
    private static formatInlineObject;
    /** Extract unique origin URLs (protocol+host) from all HAR entries in all groups. */
    private static extractBaseUrls;
}
