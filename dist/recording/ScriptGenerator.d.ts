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
     * Every URL is emitted as a backtick template literal for a uniform style (matching the k6
     * recorder). Same-origin URLs collapse to `${env.baseUrl}/path`; different-domain URLs stay
     * absolute (still backticked). Base-origin substitution and escaping are shared with
     * buildStringExpression.
     */
    private static buildUrlExpression;
    private static buildRequestBody;
    /**
     * Build an `application/x-www-form-urlencoded` body as a JS OBJECT-literal
     * expression so k6 URL-encodes each value itself, instead of a verbatim string.
     *
     * Why: k6's http request handler (k6 `js/modules/k6/http/request.go`) only
     * encodes when the body is an object — it runs it through Go's
     * `url.Values.Encode()` (space→`+`, `+`→`%2B`, `@`→`%40`, …). A STRING body is
     * sent byte-for-byte with no encoding, so a value like `user+name@x.com` arrives
     * with the `+` decoded to a space server-side (form rule: `+` == space). Emitting
     * an object matches k6's documented behavior and the k6-Studio convert path.
     *
     * Recorded bodies store values already percent-encoded, so each value is
     * URL-DECODED here before emitting — k6 re-encodes, avoiding double-encoding.
     * Data-file params substituted in later (`getUniqueItem(...)`) return raw
     * decoded values that k6 then encodes correctly.
     *
     * Returns null (→ caller keeps a string body) when the request isn't
     * form-urlencoded, has no fields, or has duplicate field names (which a plain
     * object literal can't represent without dropping values).
     */
    private static buildFormUrlEncodedBodyObject;
    /**
     * Inline-format a plain object as a JS object literal at the given indent level.
     * Values are emitted via buildStringExpression — every value becomes a backtick
     * template literal (uniform recorder-style output), with any occurrence of the
     * primary base origin (e.g. in `referer` / `origin` headers) parametrised to
     * `${env.baseUrl}` instead of hardcoding the recorded host. Keys keep their
     * shape: bare identifiers stay unquoted, others are JSON-quoted.
     */
    private static formatInlineObject;
    /** Escape a raw string so it is safe to embed inside a `...` template literal. */
    private static escapeForTemplate;
    /**
     * Emit a recorded string value (header value, body, URL) as a backtick
     * template literal — uniform recorder-style output. When it contains the
     * primary base origin, those occurrences are rewritten to `${env.baseUrl}` so
     * the value tracks the parametrised base URL rather than pinning the recorded
     * host (the same substitution buildUrlExpression applies to the request URL).
     *
     * Public so the convert path (ScriptConverter) emits metadata values in the
     * same uniform backtick style.
     */
    static buildStringExpression(value: string, primaryBaseUrl?: string): string;
    /** Extract unique origin URLs (protocol+host) from all HAR entries in all groups. */
    private static extractBaseUrls;
}
