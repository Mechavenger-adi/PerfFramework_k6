"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordRequestContextForSnapshot = recordRequestContextForSnapshot;
exports.captureRequestSnapshot = captureRequestSnapshot;
exports.captureSnapshotFromLastRequest = captureSnapshotFromLastRequest;
exports.request = request;
// @ts-ignore - K6 runtime module
const http_1 = __importDefault(require("k6/http"));
// @ts-ignore - K6 runtime module
const execution_1 = __importDefault(require("k6/execution"));
const session_js_1 = require("./session.js");
const transaction_js_1 = require("./transaction.js");
const replayLogger_js_1 = require("./replayLogger.js");
const autoHeaders_js_1 = require("./autoHeaders.js");
// ── Error behavior ─────────────────────────────────────────────
function getRuntimeErrorBehavior() {
    try {
        const raw = typeof __ENV !== 'undefined' ? __ENV.K6_PERF_RUNTIME_METADATA : undefined;
        if (raw) {
            const parsed = JSON.parse(raw);
            return parsed.errorBehavior || 'continue';
        }
    }
    catch { /* silent */ }
    return 'continue';
}
function applyErrorBehaviorForStatus(method, url, status, error) {
    const behavior = getRuntimeErrorBehavior();
    if (behavior === 'continue')
        return;
    // status 0 = no HTTP response at all (timeout / reset / refused). Surface k6's
    // reason instead of a meaningless "HTTP 0" so stop_* modes report WHY.
    const msg = status === 0
        ? `Transport error on ${method} ${url}${error ? ` (${error})` : ' (no response)'}`
        : `HTTP ${status} on ${method} ${url}`;
    if (behavior === 'abort_test') {
        execution_1.default.test.abort(`[k6-perf] ${msg}`);
        return;
    }
    // stop_iteration / stop_vu — throw so transaction() and lifecycle handle the rest
    throw new Error(`[k6-perf] ${msg}`);
}
// ── Sequential request ID per VU iteration ────────────────────
const _iterationRequestCount = {};
function nextRequestId() {
    const key = 'current';
    _iterationRequestCount[key] = (_iterationRequestCount[key] || 0) + 1;
    return `req_auto_${_iterationRequestCount[key]}`;
}
// ── Snapshot config ───────────────────────────────────────────
let _snapshotConfigCache = null;
function getSnapshotConfig() {
    if (_snapshotConfigCache)
        return _snapshotConfigCache;
    try {
        const raw = typeof __ENV !== 'undefined' ? __ENV.K6_PERF_RUNTIME_METADATA : undefined;
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.errors) {
                _snapshotConfigCache = {
                    captureSnapshotOnFailure: parsed.errors.captureSnapshotOnFailure ?? true,
                    maxSnapshotsPerRun: parsed.errors.maxSnapshotsPerRun ?? 20,
                    includeRequestHeaders: parsed.errors.includeRequestHeaders ?? true,
                    includeRequestBody: parsed.errors.includeRequestBody ?? true,
                    includeResponseHeaders: parsed.errors.includeResponseHeaders ?? true,
                    includeResponseBody: parsed.errors.includeResponseBody ?? false,
                };
                return _snapshotConfigCache;
            }
        }
    }
    catch { /* silent */ }
    _snapshotConfigCache = {
        captureSnapshotOnFailure: true,
        maxSnapshotsPerRun: 20,
        includeRequestHeaders: true,
        includeRequestBody: true,
        includeResponseHeaders: true,
        includeResponseBody: false,
    };
    return _snapshotConfigCache;
}
let _snapshotCount = 0;
let _httpConfigCache;
function getHttpRuntimeConfig() {
    if (_httpConfigCache !== undefined)
        return _httpConfigCache ?? {};
    try {
        const raw = typeof __ENV !== 'undefined' ? __ENV.K6_PERF_RUNTIME_METADATA : undefined;
        if (raw) {
            const parsed = JSON.parse(raw);
            _httpConfigCache = parsed.http ?? null;
            return _httpConfigCache ?? {};
        }
    }
    catch { /* silent */ }
    _httpConfigCache = null;
    return {};
}
// ── Header sanitization ───────────────────────────────────────
const STRIP_HEADERS = new Set(['content-length', 'transfer-encoding', 'host']);
function sanitizeHeaders(headers) {
    if (!headers)
        return undefined;
    const result = {};
    for (const [key, value] of Object.entries(headers)) {
        if (!STRIP_HEADERS.has(key.toLowerCase())) {
            result[key] = value;
        }
    }
    return Object.keys(result).length > 0 ? result : undefined;
}
// ── Body serialization for logging ───────────────────────────
function serializeBodyForLog(body) {
    if (body === null || body === undefined)
        return undefined;
    if (typeof body === 'string')
        return body;
    if (body instanceof ArrayBuffer || (typeof SharedArrayBuffer !== 'undefined' && body instanceof SharedArrayBuffer))
        return '[binary data]';
    return JSON.stringify(body);
}
let _lastRequestContext = null;
let _capHitWarned = false;
function recordRequestContextForSnapshot(method, resolvedUrl, options, res) {
    _lastRequestContext = { method, url: resolvedUrl, options, res };
}
/**
 * Emit a snapshot of the current request context. Returns true if a snapshot
 * was emitted, false if it was suppressed (feature off, cap hit, no context).
 * The `type` field distinguishes trigger sources for downstream consumers
 * ("http_status_failed", "check_failed", "transaction_error").
 */
function captureRequestSnapshot(type, context) {
    const cfg = getSnapshotConfig();
    if (!cfg.captureSnapshotOnFailure)
        return false;
    if (_snapshotCount >= cfg.maxSnapshotsPerRun) {
        // Emit the cap-hit warning EXACTLY once per VU so the Warnings tab
        // surfaces it. Without this users had no way to tell that snapshots
        // were silently dropping past the configured ceiling.
        if (!_capHitWarned) {
            _capHitWarned = true;
            console.log('[k6-perf][warning-event] ' + JSON.stringify({
                ts: new Date().toISOString(),
                type: 'snapshot_cap_reached',
                message: `Snapshot cap (${cfg.maxSnapshotsPerRun}) reached; further failures will not be captured. Increase \`runtime.errors.maxSnapshotsPerRun\` to keep more.`,
                transaction: (0, transaction_js_1.getCurrentTransaction)(),
                vu: execution_1.default.vu.idInInstance,
            }));
        }
        return false;
    }
    if (!context.res)
        return false;
    _snapshotCount++;
    const payload = {
        ts: new Date().toISOString(),
        type,
        journey: typeof __ENV !== 'undefined' ? (__ENV.K6_PERF_JOURNEY_NAME || '') : '',
        transaction: (0, transaction_js_1.getCurrentTransaction)(),
        requestName: context.options?.name || context.url,
        vu: execution_1.default.vu.idInInstance,
        iteration: execution_1.default.vu.iterationInScenario,
        phase: 'action',
        message: context.message,
        request: {
            method: context.method,
            url: context.url,
            headers: cfg.includeRequestHeaders ? context.options?.headers : undefined,
            // Same normalization as the response body: when capture is on, emit a
            // string ('' for a bodyless request like GET) so the report can show an
            // explicit "(empty)" instead of hiding the section — which was
            // indistinguishable from capture being disabled.
            body: cfg.includeRequestBody ? (serializeBodyForLog(context.options?.body) ?? '') : undefined,
        },
        response: {
            status: context.res.status,
            headers: cfg.includeResponseHeaders ? (context.res.headers ?? undefined) : undefined,
            // When body capture is enabled, ALWAYS emit a string: k6 returns `null`
            // for a zero-length / non-text body, which previously dropped the field
            // entirely and made an empty server response indistinguishable from a
            // config-disabled one. Normalizing null → '' lets the report render an
            // explicit "(empty)" instead of silently hiding the section.
            body: cfg.includeResponseBody
                ? (typeof context.res.body === 'string' ? context.res.body : '')
                : undefined,
            // k6 surfaces transport-level failure detail here (timeout, reset,
            // refused, DNS) — the closest thing to a server "reason" for status-0
            // and other non-body errors. Omitted when empty so happy paths stay clean.
            error: context.res.error || undefined,
            errorCode: context.res.error_code || undefined,
        },
    };
    console.log('[k6-perf][snapshot-event] ' + JSON.stringify(payload));
    return true;
}
/**
 * Capture a snapshot using the most recent `request()` call's context.
 * Used by k6Check failures and transaction() catch blocks so callers don't
 * need to thread the request envelope through the assertion layer.
 */
function captureSnapshotFromLastRequest(type, message) {
    if (!_lastRequestContext)
        return false;
    return captureRequestSnapshot(type, { ..._lastRequestContext, message });
}
/** Internal: legacy HTTP-status-failure trigger, kept for source compatibility. */
function emitSnapshotEvent(method, resolvedUrl, options, res) {
    if (!res || res.status < 400)
        return;
    captureRequestSnapshot('http_status_failed', { method, url: resolvedUrl, options, res });
}
// Install a globalThis hook so `transaction.ts` (which can't import from
// `request.ts` without creating a cycle) can trigger a snapshot from
// k6Check failures and transaction() catch blocks without threading the
// request envelope through. Set once at module init.
globalThis.__k6PerfCaptureSnapshotFromLastRequest = captureSnapshotFromLastRequest;
// ── Main request helper ───────────────────────────────────────
/**
 * Execute an HTTP request in a framework-aware way and return the native k6 Response.
 *
 * Accepts every body type, HTTP method, and param that k6 supports natively.
 * See RequestOptions for the full set of supported options.
 */
function request(method, pathOrUrl, options) {
    const resolvedUrl = (0, session_js_1.resolvePath)(pathOrUrl, options?.service);
    if (resolvedUrl) {
        try {
            const origin = new URL(resolvedUrl).origin + '/';
            (0, session_js_1.registerBaseUrl)(origin);
        }
        catch { /* ignore non-parseable URLs */ }
    }
    const transaction = options?.tags?.transaction || (0, transaction_js_1.getCurrentTransaction)();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const harEntryId = options?.replay?.id || options?.replay?.harEntryId || nextRequestId();
    const recordingStartedAt = options?.replay?.recordingStartedAt || new Date().toISOString();
    // Merge persistent auto headers + one-shot header with the per-call headers
    // (per-call wins, case-insensitive) before sanitizing. See utils/autoHeaders.
    const cleanHeaders = sanitizeHeaders((0, autoHeaders_js_1.mergeRequestHeaders)(options?.headers));
    // Runtime-settings HTTP defaults (timeout / maxRedirects / throwOnError).
    // Per-call options always take precedence over these.
    const httpCfg = getHttpRuntimeConfig();
    const k6Params = {
        cookies: options?.cookies ?? {},
        redirects: options?.redirects ?? httpCfg.maxRedirects ?? 0,
        tags: {
            // The transaction a request belongs to is identified by k6's native
            // `group` tag (value "::<txn>"); no separate `transaction` tag is emitted
            // to avoid duplicate tags. Consumers strip the leading "::".
            har_entry_id: harEntryId,
            recording_started_at: recordingStartedAt,
            // When a request name is supplied, expose it as k6's standard `name`
            // tag so per-request metrics group under it (e.g. "Auth_Login")
            // instead of the raw URL. Caller-supplied tags still win via the spread.
            ...(options?.name ? { name: options.name } : {}),
            ...(options?.tags ?? {}),
        },
    };
    if (cleanHeaders && Object.keys(cleanHeaders).length > 0)
        k6Params.headers = cleanHeaders;
    // timeout: per-call wins, else runtime default (k6 takes ms as a number).
    if (options?.timeout !== undefined)
        k6Params.timeout = options.timeout;
    else if (httpCfg.timeoutMs !== undefined)
        k6Params.timeout = httpCfg.timeoutMs;
    if (options?.auth !== undefined)
        k6Params.auth = options.auth;
    if (options?.responseType !== undefined)
        k6Params.responseType = options.responseType;
    if (options?.jar !== undefined)
        k6Params.jar = options.jar;
    if (options?.compression !== undefined)
        k6Params.compression = options.compression;
    // throw: per-call wins, else runtime default (http.throwOnError).
    if (options?.throw !== undefined)
        k6Params.throw = options.throw;
    else if (httpCfg.throwOnError !== undefined)
        k6Params.throw = httpCfg.throwOnError;
    if (options?.http2 !== undefined)
        k6Params.http2 = options.http2;
    if (options?.responseCallback !== undefined)
        k6Params.responseCallback = options.responseCallback;
    // Newer @types/k6 narrows RequestBody to Record<string, FormValue> for objects,
    // which rejects Record<string, unknown>. Cast to any to satisfy both old and new
    // type definitions while preserving full runtime support for all body types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (options?.body ?? null);
    let res;
    switch (method) {
        case 'GET':
            res = http_1.default.get(resolvedUrl, k6Params);
            break;
        case 'POST':
            res = http_1.default.post(resolvedUrl, body, k6Params);
            break;
        case 'PUT':
            res = http_1.default.put(resolvedUrl, body, k6Params);
            break;
        case 'PATCH':
            res = http_1.default.patch(resolvedUrl, body, k6Params);
            break;
        case 'DELETE':
            res = http_1.default.del(resolvedUrl, body, k6Params);
            break;
        case 'HEAD':
            res = http_1.default.head(resolvedUrl, k6Params);
            break;
        case 'OPTIONS':
            res = http_1.default.options(resolvedUrl, body, k6Params);
            break;
        default:
            res = http_1.default.request(method, resolvedUrl, body, k6Params);
    }
    // Stash the request/response context BEFORE the legacy 4xx/5xx auto-
    // trigger so a k6Check() failure that follows this request can call
    // `captureSnapshotFromLastRequest()` and get a full envelope back.
    recordRequestContextForSnapshot(method, resolvedUrl, options, res);
    emitSnapshotEvent(method, resolvedUrl, options, res);
    // Treat a status-0 transport failure (timeout / reset / refused) as an error
    // too — previously only status >= 400 was gated, so a request that never got
    // a response slipped past error behavior entirely.
    if (res && (res.status === 0 || res.status >= 400)) {
        // Register this failing response so transaction() can backstop it if the
        // user never applies a status check. Done BEFORE applyErrorBehaviorForStatus,
        // which may throw under non-'continue' modes.
        (0, transaction_js_1.recordFailingResponse)(res, { method, url: resolvedUrl, status: res.status });
        applyErrorBehaviorForStatus(method, resolvedUrl, res.status, res.error);
    }
    if (__ENV.K6_PERF_DEBUG) {
        (0, replayLogger_js_1.logExchange)({
            id: harEntryId,
            transaction,
            recordingStartedAt,
            method,
            url: resolvedUrl,
            body: body instanceof ArrayBuffer || (typeof SharedArrayBuffer !== 'undefined' && body instanceof SharedArrayBuffer)
                ? '[binary data]'
                : body,
            params: {
                headers: options?.headers,
                cookies: options?.cookies,
                tags: k6Params.tags,
            },
            variables: options?.variables,
        }, res);
    }
    return res;
}
