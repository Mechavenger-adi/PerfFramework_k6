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
 * Register a correlation variable at the point of extraction.
 * Call this right after a regex match or similar extraction.
 * Returns the value for inline use: correlation_vars["x"] = trackCorrelation("x", match[1], "body");
 */
function trackCorrelation(name, value, source) {
    const v = value === undefined || value === null ? '' : String(value);
    _variableRegistry[name] = { name, type: 'correlation', value: v, source: source || 'body' };
    return value;
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
 * tracked variable values.
 */
function detectVariableEvents(url, body, headers) {
    const events = [];
    const searchTargets = [String(url || '')];
    if (body !== null && body !== undefined) {
        searchTargets.push(typeof body === 'object' ? JSON.stringify(body) : String(body));
    }
    if (headers && typeof headers === 'object') {
        for (const val of Object.values(headers)) {
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
    const responseHeaders = response?.headers || {};
    const iteration = currentIteration();
    const requestSequence = nextRequestSequence(iteration);
    // Auto-detect variable usage from the registry
    const autoDetected = detectVariableEvents(meta.url, requestInfo?.body, requestHeaders);
    // Merge with any explicitly declared events (dedup by name)
    const explicit = Array.isArray(requestInfo?.variableEvents) ? requestInfo.variableEvents : [];
    const seen = new Set(autoDetected.map((e) => e.name));
    const merged = [...autoDetected, ...explicit.filter((e) => !seen.has(e.name))];
    // Extract cookies from the ACTUAL headers k6 sent (includes auto-managed jar cookies)
    // res.request.headers contains the real Cookie header; fall back to declared headers;
    // final fallback: query the VU's cookie jar for cookies it would send to this URL
    const actualRequestHeaders = requestInfo?.actualRequestHeaders || {};
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
            headers: normalizeHeaders(requestHeaders),
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
            body: binaryPlaceholder ?? (response?.body ?? undefined),
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
    }, res);
}
//# sourceMappingURL=replayLogger.js.map