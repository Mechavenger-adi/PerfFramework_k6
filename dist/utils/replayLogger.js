"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackCorrelation = trackCorrelation;
exports.trackParameter = trackParameter;
exports.trackDataRow = trackDataRow;
exports.createVariableEvent = createVariableEvent;
exports.logReplayExchange = logReplayExchange;
exports.logExchange = logExchange;
// @ts-ignore - K6 runtime module
const execution_1 = __importDefault(require("k6/execution"));
// @ts-ignore - K6 runtime module
const http_1 = __importDefault(require("k6/http"));
// ── State ─────────────────────────────────────────────────────
const iterationState = {};
// ── Runtime variable registry ──
// Stores { name, value, type, source } for each tracked variable.
// logExchange auto-detects 'used' events by scanning request url/body/headers
// for any registered value, eliminating the need for static variableEvents arrays.
const _variableRegistry = {};
/**
 * Best-effort: pull the first user-script frame (path:line[:col]) out of a fresh
 * stack trace, skipping framework internals (dist/utils) and k6 runtime frames.
 * Used to point a failed-correlation log at the exact extraction site.
 */
function callerScriptLocation() {
    try {
        const stack = new Error().stack;
        if (!stack)
            return '';
        for (const raw of stack.split(/\r?\n/)) {
            const m = raw.match(/((?:file:\/\/)?[^\s()<>"']+):(\d+)(?::(\d+))?/);
            if (!m)
                continue;
            const p = m[1];
            if (p.includes('/dist/utils/') || p.includes('\\dist\\utils\\'))
                continue;
            if (p.includes('replayLogger') || p.startsWith('k6/') || p.includes('go.k6.io'))
                continue;
            return m[3] ? `${p}:${m[2]}:${m[3]}` : `${p}:${m[2]}`;
        }
    }
    catch { /* ignore */ }
    return '';
}
/**
 * Register a correlation variable at the point of extraction.
 * Call this right after a regex match or similar extraction.
 * Returns the value for inline use: correlation_vars["x"] = trackCorrelation("x", match[1], "body");
 */
function trackCorrelation(name, value, source) {
    // LoadRunner-style continue-on-error: when an extraction produced no value
    // (no regex match, or a missing body/header), substitute a visible
    // placeholder instead of "" / undefined. The next request then runs with the
    // placeholder (rather than crashing on a null match), the dependent check
    // fails normally, and the VU keeps going. The placeholder is also what gets
    // registered, so the replay log can locate it in the outgoing request.
    const isEmpty = value === undefined || value === null || value === '';
    const resolved = isEmpty ? `{NOTFOUND:${name}}` : value;
    if (isEmpty) {
        // Loud but non-fatal: make the failed extraction obvious in the console/run
        // log, with VU / iteration / script location so it's actionable. We
        // deliberately do NOT throw — throwing here would also fire on the
        // auto-tracking Proxy path and duplicate the stop/continue decision the
        // dependent k6Check already makes. In stop_* modes the failing check that
        // consumes this placeholder still stops the run.
        try {
            let where = '';
            try {
                const vu = execution_1.default?.vu?.idInInstance;
                const iter = execution_1.default?.vu?.iterationInScenario;
                if (vu !== undefined)
                    where += ` (VU ${vu}, iter ${iter}`;
                const loc = callerScriptLocation();
                where += loc ? `${vu !== undefined ? ', ' : ' ('}at ${loc})` : (vu !== undefined ? ')' : '');
            }
            catch { /* context best-effort */ }
            console.error(`[k6-perf] correlation "${name}" not found — substituting ${resolved}${where}`);
        }
        catch { /* logging is best-effort */ }
    }
    _variableRegistry[name] = { name, type: 'correlation', value: String(resolved), source: source || 'body' };
    return resolved;
}
/**
 * Register a parameterisation variable (e.g. from CSV data).
 * Call once per parameter per iteration. Returns the value.
 */
function trackParameter(name, value, source) {
    const v = value === undefined || value === null ? '' : String(value);
    _variableRegistry[name] = { name, type: 'parameter', value: v, source: source || 'data' };
    return value;
}
/**
 * Auto-register all properties from a data row object.
 * Call once per data file per iteration. Registers every key-value pair as a parameter.
 * e.g. trackDataRow("userdetails", getUniqueItem(FILES["userdetails"]))
 * will register p_username, p_password, etc. — whatever columns the CSV has.
 */
function trackDataRow(sourceName, rowObject) {
    if (!rowObject || typeof rowObject !== 'object')
        return rowObject;
    for (const [key, val] of Object.entries(rowObject)) {
        const v = val === undefined || val === null ? '' : String(val);
        _variableRegistry[key] = { name: key, type: 'parameter', value: v, source: sourceName || 'data' };
    }
    return rowObject;
}
/**
 * Auto-detect which registered variables were used in this request.
 * Scans url, body (stringified), and header values for exact matches of
 * tracked variable values. Pass actualHeaders when available so auto-managed
 * headers (Cookie from jar, etc.) are also scanned.
 */
function detectVariableEvents(url, body, headers, actualHeaders) {
    const events = [];
    const searchTargets = [String(url || '')];
    if (body !== null && body !== undefined) {
        searchTargets.push(typeof body === 'object' ? JSON.stringify(body) : String(body));
    }
    // Scan actual sent headers first (richer: includes Cookie from jar, etc.), then declared
    const headersToScan = (actualHeaders && Object.keys(actualHeaders).length > 0) ? actualHeaders : headers;
    if (headersToScan && typeof headersToScan === 'object') {
        for (const val of Object.values(headersToScan)) {
            searchTargets.push(String(val));
        }
    }
    const haystack = searchTargets.join('\n');
    for (const [name, reg] of Object.entries(_variableRegistry)) {
        if (!reg.value)
            continue;
        if (haystack.includes(reg.value)) {
            events.push({ name, type: reg.type, action: 'used', value: reg.value, source: reg.source });
        }
    }
    return events;
}
function extractQueryParams(url) {
    try {
        const parsed = new URL(url);
        const params = {};
        for (const [key, value] of parsed.searchParams.entries()) {
            params[key] = value;
        }
        return params;
    }
    catch {
        return {};
    }
}
function extractCookies(headers = {}) {
    const cookies = [];
    Object.entries(headers).forEach(([name, value]) => {
        const lower = String(name).toLowerCase();
        if (lower !== 'cookie' && lower !== 'set-cookie')
            return;
        const rawValue = Array.isArray(value) ? value.join('; ') : String(value);
        rawValue
            .split(';')
            .map((part) => part.trim())
            .filter(Boolean)
            .forEach((token) => {
            const separatorIndex = token.indexOf('=');
            if (separatorIndex <= 0)
                return;
            cookies.push({
                name: token.slice(0, separatorIndex),
                value: token.slice(separatorIndex + 1),
            });
        });
    });
    return cookies;
}
/**
 * Extract cookies from k6's res.cookies object.
 * k6 returns: { cookieName: [{ name, value, domain, path, ... }], ... }
 */
function extractK6ResponseCookies(resCookies) {
    if (!resCookies || typeof resCookies !== 'object')
        return [];
    const cookies = [];
    for (const [cookieName, entries] of Object.entries(resCookies)) {
        if (Array.isArray(entries)) {
            for (const entry of entries) {
                cookies.push({ name: cookieName, value: entry.value || '' });
            }
        }
    }
    return cookies;
}
/**
 * Extract request cookies from k6's cookie jar for a given URL.
 * Uses http.cookieJar().cookiesForURL() which returns all cookies
 * the VU's jar would send to that URL (including auto-managed ones).
 * Returns: [{ name, value }, ...]
 */
function extractJarCookies(url) {
    try {
        const jar = http_1.default.cookieJar();
        const jarCookies = jar.cookiesForURL(url);
        if (!jarCookies || typeof jarCookies !== 'object')
            return [];
        const cookies = [];
        for (const [name, values] of Object.entries(jarCookies)) {
            if (Array.isArray(values)) {
                for (const value of values) {
                    cookies.push({ name, value: String(value) });
                }
            }
            else {
                cookies.push({ name, value: String(values) });
            }
        }
        return cookies;
    }
    catch {
        return [];
    }
}
function normalizeHeaders(headers = {}) {
    return Object.entries(headers).map(([name, value]) => ({
        name,
        value: Array.isArray(value) ? value.join(', ') : String(value),
    }));
}
const BINARY_CONTENT_RE = /^(?:image|audio|video|font)\//i;
const BINARY_MIME_TYPES = new Set([
    'application/octet-stream',
    'application/zip',
    'application/pdf',
    'application/x-font-ttf',
    'application/x-font-woff',
    'application/font-woff',
    'application/font-woff2',
    'application/vnd.ms-fontobject',
]);
const STATIC_EXT_RE = /\.(?:png|jpe?g|gif|svg|ico|webp|avif|bmp|tiff?|woff2?|ttf|otf|eot|mp[34]|webm|ogg|flac|wav|zip|gz|br|pdf)(?:[?#]|$)/i;
/**
 * Determine whether response body should be omitted from the replay log.
 * Returns a placeholder string for binary/static content, or null when body is fine.
 */
function binaryBodyPlaceholder(url, responseHeaders) {
    // Check content-type header
    const ct = (responseHeaders['Content-Type'] ||
        responseHeaders['content-type'] ||
        '').split(';')[0].trim().toLowerCase();
    if (ct && (BINARY_CONTENT_RE.test(ct) || BINARY_MIME_TYPES.has(ct))) {
        return `[binary: ${ct}]`;
    }
    // Fallback: check URL extension
    if (typeof url === 'string' && STATIC_EXT_RE.test(url)) {
        return '[binary: static asset]';
    }
    return null;
}
function currentIteration() {
    return (execution_1.default.scenario.iterationInTest || 0) + 1;
}
function currentVu() {
    return execution_1.default.vu.idInTest || 0;
}
function nextRequestSequence(iteration) {
    const key = String(iteration);
    iterationState[key] = (iterationState[key] || 0) + 1;
    return iterationState[key];
}
function createVariableEvent(name, type, action, value, source) {
    return {
        name,
        type,
        action,
        value: value === undefined || value === null ? '' : String(value),
        source,
    };
}
function logReplayExchange(meta, requestInfo, response) {
    const requestHeaders = requestInfo?.headers || {};
    const actualRequestHeaders = requestInfo?.actualRequestHeaders || {};
    const responseHeaders = response?.headers || {};
    const iteration = currentIteration();
    const requestSequence = nextRequestSequence(iteration);
    // Build variable events from three sources (priority: auto-detected > variables option > explicit array):
    // 1. Auto-detected: scan URL/body/actual-headers against the registry (trackParameter/trackCorrelation values)
    const autoDetected = detectVariableEvents(meta.url, requestInfo?.body, requestHeaders, actualRequestHeaders);
    // 2. Explicit variables option: name→value pairs declared inline on request()
    const fromVariablesOption = requestInfo?.variables
        ? Object.entries(requestInfo.variables).map(([name, value]) => createVariableEvent(name, 'parameter', 'used', value, 'request'))
        : [];
    // 3. Legacy explicit events array (variableEvents field)
    const explicit = Array.isArray(requestInfo?.variableEvents) ? requestInfo.variableEvents : [];
    const seenAuto = new Set(autoDetected.map((e) => e.name));
    const seenAll = new Set([...autoDetected, ...fromVariablesOption.filter((e) => !seenAuto.has(e.name))].map((e) => e.name));
    const merged = [
        ...autoDetected,
        ...fromVariablesOption.filter((e) => !seenAuto.has(e.name)),
        ...explicit.filter((e) => !seenAll.has(e.name)),
    ];
    // Extract cookies from the ACTUAL headers k6 sent (includes auto-managed jar cookies)
    // res.request.headers contains the real Cookie header; fall back to declared headers;
    // final fallback: query the VU's cookie jar for cookies it would send to this URL
    const fromActualHeaders = extractCookies(actualRequestHeaders);
    const fromDeclaredHeaders = extractCookies(requestHeaders);
    const requestUrl = typeof meta.url === 'string' ? meta.url : String(meta.url ?? '');
    const fromJar = requestUrl ? extractJarCookies(requestUrl) : [];
    const requestCookies = fromActualHeaders.length > 0
        ? fromActualHeaders
        : fromDeclaredHeaders.length > 0
            ? fromDeclaredHeaders
            : fromJar;
    // Use k6's parsed res.cookies (structured data) if available, else parse Set-Cookie header
    const responseCookies = (requestInfo?.k6ResponseCookies && Object.keys(requestInfo.k6ResponseCookies).length > 0)
        ? extractK6ResponseCookies(requestInfo.k6ResponseCookies)
        : extractCookies(responseHeaders);
    // Determine if the response body is binary and should be replaced with a placeholder
    const binaryPlaceholder = binaryBodyPlaceholder(typeof meta.url === 'string' ? meta.url : String(meta.url ?? ''), responseHeaders);
    const entry = {
        harEntryId: meta.harEntryId,
        transaction: meta.transaction,
        recordingStartedAt: meta.recordingStartedAt,
        iteration,
        vu: currentVu(),
        requestSequence,
        durationMs: response?.timings?.duration ?? null,
        tags: meta.tags || {},
        variableEvents: merged,
        request: {
            method: meta.method,
            url: typeof meta.url === 'string' ? meta.url : String(meta.url ?? ''),
            // Prefer actual sent headers (res.request.headers) which include the full Cookie header,
            // auto-added Content-Type, etc. Fall back to user-declared headers.
            headers: normalizeHeaders((Object.keys(actualRequestHeaders).length > 0
                ? actualRequestHeaders
                : requestHeaders)),
            queryParams: extractQueryParams(typeof meta.url === 'string' ? meta.url : String(meta.url ?? '')),
            cookies: requestCookies,
            body: requestInfo?.body !== null && requestInfo?.body !== undefined
                ? (typeof requestInfo.body === 'object' ? JSON.stringify(requestInfo.body) : String(requestInfo.body))
                : undefined,
        },
        response: {
            status: response?.status,
            headers: normalizeHeaders(responseHeaders),
            cookies: responseCookies,
            // Guard against ArrayBuffer from responseType:'binary' — JSON.stringify would produce '{}'
            body: binaryPlaceholder
                ?? (response?.body instanceof ArrayBuffer || (typeof SharedArrayBuffer !== 'undefined' && response?.body instanceof SharedArrayBuffer)
                    ? '[binary response]'
                    : (response?.body ?? undefined)),
        },
    };
    console.log('[k6-perf][replay-log] ' + JSON.stringify(entry));
}
/**
 * Compact debug-only logger. Only logs when K6_PERF_DEBUG env var is set.
 * Accepts the request definition object (as generated by ScriptGenerator/ScriptConverter)
 * and the k6 response. Variable events are auto-detected from the registry.
 */
function logExchange(req, res) {
    if (!__ENV.K6_PERF_DEBUG)
        return;
    logReplayExchange({
        harEntryId: req.id,
        transaction: req.transaction,
        recordingStartedAt: req.recordingStartedAt,
        method: req.method,
        url: req.url,
        tags: req.params?.tags,
    }, {
        headers: req.params?.headers || {},
        body: req.body,
        actualRequestHeaders: res?.request?.headers || {}, // actual headers k6 sent (includes Cookie from jar)
        k6ResponseCookies: res?.cookies || {}, // k6's parsed response Set-Cookie data
        variables: req.variables, // inline variable name→value pairs
    }, res);
}
