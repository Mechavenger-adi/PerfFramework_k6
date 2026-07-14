"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptGenerator = exports.SCRIPT_API_MODULE = void 0;
/**
 * Import specifier for the framework's VU-safe script API barrel (compiled
 * `dist/index.js`), relative to a generated script at
 * `testSuites/<suite>/tests/<name>.js`. Centralized here so the path — or a
 * future bundled package name — changes in exactly one place. Older scripts
 * that import the per-util `dist/utils/*.js` paths keep working unchanged.
 */
exports.SCRIPT_API_MODULE = '../../../dist/index.js';
class ScriptGenerator {
    /**
     * Generates formatted TypeScript/JavaScript source code based on Transaction Groups.
     * Output uses the transaction() wrapper and request() helper from the framework utils.
     */
    static generate(groups, lifecycle, teamName, options) {
        let script = `import { transaction, k6Check, request, createJourneyLifecycleStore, runJourneyLifecycle, thinktime, logReplayExchange, trackCorrelation, trackParameter, clearCookies, getEnvContext } from '${exports.SCRIPT_API_MODULE}';\n`;
        if (options?.extraImports && options.extraImports.length > 0) {
            // De-dupe: skip any extraImport already present in the fixed imports above.
            const seen = new Set(script.split('\n'));
            for (const imp of options.extraImports) {
                if (!seen.has(imp)) {
                    script += `${imp}\n`;
                    seen.add(imp);
                }
            }
        }
        script += `\n`;
        const baseUrls = this.extractBaseUrls(groups);
        const primaryBaseUrl = baseUrls[0];
        const fallbackUrl = primaryBaseUrl ? primaryBaseUrl.replace(/\/+$/, '') : undefined;
        script += `const env = getEnvContext('${teamName}', ${fallbackUrl ? `{ baseUrl: '${fallbackUrl}' }` : 'undefined'});\n\n`;
        if (options?.extraInitCode && options.extraInitCode.trim().length > 0) {
            // Module-scope code injected here so it runs once per VU at k6 init context,
            // before the journey lifecycle store (and therefore before any actionPhase
            // request that references the bindings).
            script += `${options.extraInitCode.replace(/\n+$/, '')}\n\n`;
        }
        const initSet = new Set(lifecycle?.initGroups ?? []);
        const endSet = new Set(lifecycle?.endGroups ?? []);
        const initGroups = groups.filter((g) => initSet.has(g.name));
        const endGroups = groups.filter((g) => endSet.has(g.name));
        const actionGroups = groups.filter((g) => !initSet.has(g.name) && !endSet.has(g.name));
        script += `const __journeyLifecycleStore = createJourneyLifecycleStore();\n\n`;
        // Script-wide request counter so req_1…req_N is sequential across all phases.
        let scriptRequestId = 0;
        const entryComments = options?.entryComments;
        const entryNames = options?.entryNames;
        // Script-wide name-tag counter. Shared across every phase and transaction so
        // the `_n` suffix on `METHOD_segment_n` counts occurrences of each distinct
        // endpoint across the whole script and never resets.
        const nameCounters = new Map();
        script += this.buildPhaseFunction('initPhase', initGroups, primaryBaseUrl, scriptRequestId, entryComments, entryNames, nameCounters);
        scriptRequestId += initGroups.reduce((s, g) => s + g.entries.length, 0);
        script += `\n`;
        script += this.buildPhaseFunction('actionPhase', actionGroups, primaryBaseUrl, scriptRequestId, entryComments, entryNames, nameCounters);
        scriptRequestId += actionGroups.reduce((s, g) => s + g.entries.length, 0);
        script += `\n`;
        script += this.buildPhaseFunction('endPhase', endGroups, primaryBaseUrl, scriptRequestId, entryComments, entryNames, nameCounters);
        script += `\n`;
        script += `export default function () {\n`;
        script += `  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });\n`;
        script += `}\n`;
        return script;
    }
    static buildPhaseFunction(functionName, groups, primaryBaseUrl, startRequestId = 0, entryComments, entryNames, nameCounters = new Map()) {
        let script = `export function ${functionName}(ctx) {\n`;
        let globalRequestId = startRequestId;
        if (functionName === 'initPhase') {
            script += `  clearCookies();\n\n`;
        }
        if (groups.length === 0) {
            script += `}\n`;
            return script;
        }
        groups.forEach((groupItem, groupIndex) => {
            script += `  transaction('${groupItem.name}', function () {\n`;
            groupItem.entries.forEach((req, reqIndex) => {
                globalRequestId++;
                const method = req.method.toUpperCase();
                const responseName = `res${reqIndex + 1}`;
                const sequentialId = `req_${globalRequestId}`;
                const urlExpr = this.buildUrlExpression(req.url, primaryBaseUrl);
                const hasHeaders = req.headers && req.headers.length > 0;
                const hasBody = !!req.postData?.expression || !!this.buildRequestBody(req.postData);
                // Adapter-supplied notes (Postman pre-request scripts, after
                // translation) emit ABOVE the request call so the user sees them
                // exactly where they apply. `__RES__` placeholder → the response
                // variable name for THIS request.
                const notes = entryComments?.get(req.id);
                if (notes && notes.before.length > 0) {
                    for (const line of notes.before) {
                        const subbed = line.replace(/__RES__/g, responseName);
                        script += subbed.trim().length === 0 ? `\n` : `    ${subbed}\n`;
                    }
                }
                script += `    const ${responseName} = request('${method}', ${urlExpr}, {\n`;
                // Per-request metric `name` tag. Adapter override (Postman item name)
                // takes precedence; otherwise derive `METHOD_lastSegment_n` from the
                // request itself. request() surfaces this as k6's `name` tag so
                // per-request metrics group under it instead of the raw URL.
                const nameTag = entryNames?.get(req.id) ?? this.deriveRequestName(method, req.url, nameCounters);
                script += `      name: ${this.buildStringExpression(nameTag)},\n`;
                if (hasHeaders) {
                    const headersObj = {};
                    req.headers.forEach((h) => { headersObj[h.name] = h.value; });
                    script += `      headers: ${this.formatInlineObject(headersObj, 6, primaryBaseUrl)},\n`;
                }
                if (hasBody) {
                    // `postData.expression` (when set) means "emit raw — this references
                    // a module-scope binding like a file-upload var, not literal text".
                    // Used by Postman adapter for file/multipart-file uploads.
                    if (req.postData?.expression) {
                        script += `      body: ${req.postData.expression},\n`;
                    }
                    else {
                        // Form-urlencoded → emit an OBJECT so k6 URL-encodes each value (a
                        // string body would be sent verbatim, decoding `+` to a space). All
                        // other content types stay a verbatim backtick string body. Bodies can
                        // embed the recorded host too (form-posted return URLs, JSON
                        // callbacks) — parametrise the base origin the same way.
                        const formObj = req.postData
                            ? this.buildFormUrlEncodedBodyObject(req.postData, primaryBaseUrl)
                            : null;
                        if (formObj !== null) {
                            script += `      body: ${formObj},\n`;
                        }
                        else {
                            const body = this.buildRequestBody(req.postData);
                            script += `      body: ${body === null ? 'null' : this.buildStringExpression(body, primaryBaseUrl)},\n`;
                        }
                    }
                }
                script += `      replay: {\n`;
                script += `        id: ${this.buildStringExpression(sequentialId)},\n`;
                script += `        recordingStartedAt: ${this.buildStringExpression(req.startedDateTime)},\n`;
                script += `      },\n`;
                script += `    });\n`;
                script += `    k6Check(${responseName}, {\n`;
                script += `      ${JSON.stringify(`${groupItem.name} - status is ${req.status}`)}: (r) => r.status === ${req.status},\n`;
                script += `    });\n`;
                // Test-script notes (after translation) emit BELOW the default
                // k6Check. `__RES__` substituted with the response variable.
                if (notes && notes.after.length > 0) {
                    for (const line of notes.after) {
                        const subbed = line.replace(/__RES__/g, responseName);
                        script += subbed.trim().length === 0 ? `\n` : `    ${subbed}\n`;
                    }
                }
                if (reqIndex < groupItem.entries.length - 1) {
                    script += `\n`;
                }
            });
            script += `  });\n\n`;
            if (groupIndex < groups.length - 1) {
                script += `  thinktime();\n\n`;
            }
        });
        script += `}\n`;
        return script;
    }
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
    static deriveRequestName(method, url, counters) {
        let segment = 'root';
        try {
            const u = new URL(url);
            const parts = u.pathname.split('/').filter((p) => p.length > 0);
            if (parts.length > 0)
                segment = parts[parts.length - 1];
        }
        catch {
            // Relative or unparseable URL — take the last path-ish chunk before any query.
            const pathOnly = url.split('?')[0].replace(/\/+$/, '');
            const parts = pathOnly.split('/').filter((p) => p.length > 0);
            if (parts.length > 0)
                segment = parts[parts.length - 1];
        }
        segment = segment.replace(/[^A-Za-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'root';
        if (segment.length > 25)
            segment = segment.slice(0, 25);
        const base = `${method.toUpperCase()}_${segment}`;
        const n = (counters.get(base) ?? 0) + 1;
        counters.set(base, n);
        return `${base}_${n}`;
    }
    /**
     * Returns the URL expression to embed directly in the generated script (no extra quoting needed).
     * Every URL is emitted as a backtick template literal for a uniform style (matching the k6
     * recorder). Same-origin URLs collapse to `${env.baseUrl}/path`; different-domain URLs stay
     * absolute (still backticked). Base-origin substitution and escaping are shared with
     * buildStringExpression.
     */
    static buildUrlExpression(absoluteUrl, primaryBaseUrl) {
        if (primaryBaseUrl) {
            try {
                const parsed = new URL(absoluteUrl);
                // Exact-origin match → collapse to the parametrised base plus the path,
                // avoiding any substring false-positive on the raw origin.
                if (parsed.origin + '/' === primaryBaseUrl) {
                    const path = parsed.pathname + (parsed.search || '') + (parsed.hash || '');
                    return '`${env.baseUrl}' + this.escapeForTemplate(path) + '`';
                }
            }
            catch { /* fall through to the generic literal */ }
        }
        // Cross-domain or no base: uniform backtick literal (substitutes the base
        // origin too, though a different-origin URL won't contain it).
        return this.buildStringExpression(absoluteUrl, primaryBaseUrl);
    }
    static buildRequestBody(postData) {
        if (!postData)
            return null;
        if (postData.text !== undefined && postData.text !== '') {
            return postData.text;
        }
        if (!postData.params || postData.params.length === 0) {
            return null;
        }
        return postData.params
            .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value ?? '')}`)
            .join('&');
    }
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
    static buildFormUrlEncodedBodyObject(postData, primaryBaseUrl) {
        if (!/application\/x-www-form-urlencoded/i.test(postData.mimeType || ''))
            return null;
        const decode = (s) => {
            try {
                return decodeURIComponent(s.replace(/\+/g, ' '));
            }
            catch {
                return s;
            }
        };
        let pairs;
        if (postData.params && postData.params.length > 0) {
            // HAR `params` are already decoded — use as-is.
            pairs = postData.params.map((p) => ({ name: p.name, value: p.value ?? '' }));
        }
        else if (postData.text) {
            // Raw body text is percent-encoded — decode each half of every pair.
            pairs = postData.text.split('&').filter(Boolean).map((kv) => {
                const eq = kv.indexOf('=');
                const rawName = eq >= 0 ? kv.slice(0, eq) : kv;
                const rawVal = eq >= 0 ? kv.slice(eq + 1) : '';
                return { name: decode(rawName), value: decode(rawVal) };
            });
        }
        else {
            return null;
        }
        if (pairs.length === 0)
            return null;
        if (new Set(pairs.map((p) => p.name)).size !== pairs.length)
            return null; // dup keys → string body
        const obj = {};
        for (const { name, value } of pairs)
            obj[name] = value;
        return this.formatInlineObject(obj, 8, primaryBaseUrl);
    }
    /**
     * Inline-format a plain object as a JS object literal at the given indent level.
     * Values are emitted via buildStringExpression — every value becomes a backtick
     * template literal (uniform recorder-style output), with any occurrence of the
     * primary base origin (e.g. in `referer` / `origin` headers) parametrised to
     * `${env.baseUrl}` instead of hardcoding the recorded host. Keys keep their
     * shape: bare identifiers stay unquoted, others are JSON-quoted.
     */
    static formatInlineObject(obj, indent, primaryBaseUrl) {
        const pad = ' '.repeat(indent);
        const closePad = ' '.repeat(indent - 2);
        const entries = Object.entries(obj);
        if (entries.length === 0)
            return '{}';
        const lines = entries.map(([k, v]) => {
            const key = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
            return `${pad}${key}: ${this.buildStringExpression(v, primaryBaseUrl)}`;
        });
        return `{\n${lines.join(',\n')},\n${closePad}}`;
    }
    /** Escape a raw string so it is safe to embed inside a `...` template literal. */
    static escapeForTemplate(s) {
        return s
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')
            .replace(/\$\{/g, '\\${');
    }
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
    static buildStringExpression(value, primaryBaseUrl) {
        // Escape for a template literal FIRST, then substitute — the origin has no
        // backtick/`${`, so splitting the escaped string on it is still safe.
        let escaped = this.escapeForTemplate(value);
        if (primaryBaseUrl) {
            // env.baseUrl carries no trailing slash (see fallbackUrl in generate()),
            // so match the bare origin and let any retained path/query follow it.
            const origin = primaryBaseUrl.replace(/\/+$/, '');
            if (origin)
                escaped = escaped.split(origin).join('${env.baseUrl}');
        }
        return '`' + escaped + '`';
    }
    /** Extract unique origin URLs (protocol+host) from all HAR entries in all groups. */
    static extractBaseUrls(groups) {
        const origins = new Set();
        for (const group of groups) {
            for (const entry of group.entries) {
                try {
                    const u = new URL(entry.url);
                    origins.add(u.origin + '/');
                }
                catch { /* skip malformed */ }
            }
        }
        return [...origins];
    }
}
exports.ScriptGenerator = ScriptGenerator;
