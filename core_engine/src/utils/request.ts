// @ts-ignore - K6 runtime module
import http from 'k6/http';
// @ts-ignore - K6 runtime module
import exec from 'k6/execution';
import { resolvePath, registerBaseUrl } from './session.js';
import { getCurrentTransaction, recordFailingResponse } from './transaction.js';
import { logExchange } from './replayLogger.js';
import { mergeRequestHeaders } from './autoHeaders.js';

declare const __ENV: Record<string, string | undefined>;

// ── Types ─────────────────────────────────────────────────────

interface RequestReplayMeta {
  /** Stable request identifier used for debug diff matching (e.g. "req_1"). */
  id?: string;
  /** @deprecated Use `id` instead. */
  harEntryId?: string;
  recordingStartedAt?: string;
}

/** Cookie value object — k6's per-request cookie format. */
export interface CookieValue {
  value: string;
  /** When true, replaces any existing cookie with this name in the jar. */
  replace?: boolean;
}

/**
 * All body types k6 accepts natively.
 *   string                              → sent as-is (set Content-Type header explicitly)
 *   ArrayBuffer / SharedArrayBuffer     → binary payload
 *   Record<string, string|number|bool>  → k6 form-encodes as application/x-www-form-urlencoded
 *   null                                → explicitly empty body
 */
export type RequestBody =
  | string
  | ArrayBuffer
  | SharedArrayBuffer
  | Record<string, string | number | boolean>
  | null;

/**
 * Common HTTP methods with IDE autocomplete. Any other string (e.g. 'CONNECT', 'TRACE',
 * custom verbs) is also accepted and routed through http.request().
 */
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | (string & {});

export interface RequestOptions {
  /** Metric name for this request (appears in k6 output and transaction grouping). */
  name?: string;
  /** Request headers. Content-Length, Transfer-Encoding, and Host are stripped automatically. */
  headers?: Record<string, string>;
  /**
   * Per-request cookies. Values can be a plain string or a k6 CookieValue
   * object { value, replace } to control jar replacement behavior.
   */
  cookies?: Record<string, string | CookieValue>;
  /**
   * Request body. All types k6 supports are accepted:
   *   string         → sent as-is; set Content-Type header explicitly
   *   ArrayBuffer    → binary payload
   *   SharedArrayBuffer → binary payload
   *   object         → form-encoded as application/x-www-form-urlencoded
   *   null           → empty body
   */
  body?: RequestBody;
  /** Maximum number of redirects to follow (default: 0). */
  redirects?: number;
  /** Named service key for base URL resolution. */
  service?: string;
  /** Extra metric tags merged with the auto-generated transaction tag. */
  tags?: Record<string, string>;
  /** Replay metadata (used only when K6_PERF_DEBUG is set). */
  replay?: RequestReplayMeta;
  /**
   * Variable name→value pairs to record in the debug replay report.
   * Use to capture the resolved values of template literals / CSV parameters
   * without needing trackParameter() / trackDataRow().
   * e.g. variables: { p_username: p_username, p_password: p_password }
   */
  variables?: Record<string, string | number | boolean>;
  /** Request timeout in milliseconds or k6 duration string (e.g. '30s', '1m'). */
  timeout?: number | string;
  /** HTTP auth scheme: 'basic', 'digest', 'negotiate', or 'ntlm'. */
  auth?: string;
  /**
   * How k6 reads the response body:
   *   'text'   → string (default)
   *   'binary' → ArrayBuffer (use for file downloads, images, etc.)
   *   'none'   → body is discarded (use when you don't need the response body)
   */
  responseType?: 'text' | 'binary' | 'none';
  /** Custom k6 CookieJar instance. Overrides the VU's default jar for this request. */
  jar?: unknown;
  /** Compress the request body: 'gzip', 'deflate', 'br', or 'zstd'. */
  compression?: string;
  /** When true, k6 throws a JS error on non-2xx instead of returning the response object. */
  throw?: boolean;
  /** Force HTTP/2 for this request (k6 auto-negotiates h2 when server supports it by default). */
  http2?: boolean;
  /**
   * Override which status codes k6 counts as "expected" (i.e. not http_req_failed).
   * Build with http.expectedStatuses() — e.g. http.expectedStatuses(200, 201, {min:400,max:499}).
   */
  responseCallback?: unknown;
}

interface SnapshotConfig {
  captureSnapshotOnFailure: boolean;
  maxSnapshotsPerRun: number;
  includeRequestHeaders: boolean;
  includeRequestBody: boolean;
  includeResponseHeaders: boolean;
  includeResponseBody: boolean;
}

// ── Error behavior ─────────────────────────────────────────────

function getRuntimeErrorBehavior(): string {
  try {
    const raw = typeof __ENV !== 'undefined' ? __ENV.K6_PERF_RUNTIME_METADATA : undefined;
    if (raw) {
      const parsed = JSON.parse(raw) as { errorBehavior?: string };
      return parsed.errorBehavior || 'continue';
    }
  } catch { /* silent */ }
  return 'continue';
}

function applyErrorBehaviorForStatus(method: string, url: string, status: number, error?: string): void {
  const behavior = getRuntimeErrorBehavior();
  if (behavior === 'continue') return;

  // status 0 = no HTTP response at all (timeout / reset / refused). Surface k6's
  // reason instead of a meaningless "HTTP 0" so stop_* modes report WHY.
  const msg = status === 0
    ? `Transport error on ${method} ${url}${error ? ` (${error})` : ' (no response)'}`
    : `HTTP ${status} on ${method} ${url}`;

  if (behavior === 'abort_test') {
    exec.test.abort(`[k6-perf] ${msg}`);
    return;
  }

  // stop_iteration / stop_vu — throw so transaction() and lifecycle handle the rest
  throw new Error(`[k6-perf] ${msg}`);
}

// ── Sequential request ID per VU iteration ────────────────────

const _iterationRequestCount: Record<string, number> = {};

function nextRequestId(): string {
  const key = 'current';
  _iterationRequestCount[key] = (_iterationRequestCount[key] || 0) + 1;
  return `req_auto_${_iterationRequestCount[key]}`;
}

// ── Snapshot config ───────────────────────────────────────────

let _snapshotConfigCache: SnapshotConfig | null = null;

function getSnapshotConfig(): SnapshotConfig {
  if (_snapshotConfigCache) return _snapshotConfigCache;
  try {
    const raw = typeof __ENV !== 'undefined' ? __ENV.K6_PERF_RUNTIME_METADATA : undefined;
    if (raw) {
      const parsed = JSON.parse(raw) as { errors?: Partial<SnapshotConfig> };
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
  } catch { /* silent */ }
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

// ── HTTP defaults from runtime settings ────────────────────────
// timeout / maxRedirects / throwOnError configured in runtime_settings are
// injected into K6_PERF_RUNTIME_METADATA.http and applied as DEFAULTS here.
// Per-call RequestOptions always win over these.

interface HttpRuntimeConfig {
  timeoutMs?: number;
  maxRedirects?: number;
  throwOnError?: boolean;
}

let _httpConfigCache: HttpRuntimeConfig | null | undefined;

function getHttpRuntimeConfig(): HttpRuntimeConfig {
  if (_httpConfigCache !== undefined) return _httpConfigCache ?? {};
  try {
    const raw = typeof __ENV !== 'undefined' ? __ENV.K6_PERF_RUNTIME_METADATA : undefined;
    if (raw) {
      const parsed = JSON.parse(raw) as { http?: HttpRuntimeConfig };
      _httpConfigCache = parsed.http ?? null;
      return _httpConfigCache ?? {};
    }
  } catch { /* silent */ }
  _httpConfigCache = null;
  return {};
}

// ── Header sanitization ───────────────────────────────────────

const STRIP_HEADERS = new Set(['content-length', 'transfer-encoding', 'host']);

function sanitizeHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
  if (!headers) return undefined;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!STRIP_HEADERS.has(key.toLowerCase())) {
      result[key] = value;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

// ── Body serialization for logging ───────────────────────────

function serializeBodyForLog(body: RequestBody | undefined): string | undefined {
  if (body === null || body === undefined) return undefined;
  if (typeof body === 'string') return body;
  if (body instanceof ArrayBuffer || (typeof SharedArrayBuffer !== 'undefined' && body instanceof SharedArrayBuffer)) return '[binary data]';
  return JSON.stringify(body);
}

// ── Snapshot emission ─────────────────────────────────────────
// Wave 3 (Proposal 5):
//   • Snapshots can now be triggered by k6Check failures and caught
//     transaction() exceptions, not just HTTP `status >= 400`. The legacy
//     auto-trigger from `request()` is preserved; the new entry points are
//     `captureRequestSnapshot()` (manual) and `recordRequestContextForSnapshot()`
//     (called on every request so k6Check can attach to the most recent res).
//   • A cap-hit warning event is emitted exactly once per run when
//     `maxSnapshotsPerRun` is first reached — surfaces in the report's
//     Warnings tab so users know to raise the cap.

/** Last-request context, refreshed on every `request()` call so a downstream
 * k6Check failure can produce a full request+response snapshot without the
 * caller threading anything explicitly. Per-VU (k6 module scope). */
interface LastRequestContext {
  method: string;
  url: string;
  options: RequestOptions | undefined;
  res: any;
}
let _lastRequestContext: LastRequestContext | null = null;
let _capHitWarned = false;

export function recordRequestContextForSnapshot(
  method: string,
  resolvedUrl: string,
  options: RequestOptions | undefined,
  res: any,
): void {
  _lastRequestContext = { method, url: resolvedUrl, options, res };
}

/**
 * Emit a snapshot of the current request context. Returns true if a snapshot
 * was emitted, false if it was suppressed (feature off, cap hit, no context).
 * The `type` field distinguishes trigger sources for downstream consumers
 * ("http_status_failed", "check_failed", "transaction_error").
 */
export function captureRequestSnapshot(
  type: string,
  context: {
    method: string;
    url: string;
    options: RequestOptions | undefined;
    res: any;
    /** Optional human-readable note attached to the snapshot. */
    message?: string;
  },
): boolean {
  const cfg = getSnapshotConfig();
  if (!cfg.captureSnapshotOnFailure) return false;
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
        transaction: getCurrentTransaction(),
        vu: exec.vu.idInInstance,
      }));
    }
    return false;
  }
  if (!context.res) return false;
  _snapshotCount++;

  const payload = {
    ts: new Date().toISOString(),
    type,
    journey: typeof __ENV !== 'undefined' ? (__ENV.K6_PERF_JOURNEY_NAME || '') : '',
    transaction: getCurrentTransaction(),
    requestName: context.options?.name || context.url,
    vu: exec.vu.idInInstance,
    iteration: exec.vu.iterationInScenario,
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
export function captureSnapshotFromLastRequest(type: string, message?: string): boolean {
  if (!_lastRequestContext) return false;
  return captureRequestSnapshot(type, { ..._lastRequestContext, message });
}

/** Internal: legacy HTTP-status-failure trigger, kept for source compatibility. */
function emitSnapshotEvent(
  method: string,
  resolvedUrl: string,
  options: RequestOptions | undefined,
  res: any,
): void {
  if (!res || res.status < 400) return;
  captureRequestSnapshot('http_status_failed', { method, url: resolvedUrl, options, res });
}

// Install a globalThis hook so `transaction.ts` (which can't import from
// `request.ts` without creating a cycle) can trigger a snapshot from
// k6Check failures and transaction() catch blocks without threading the
// request envelope through. Set once at module init.
(globalThis as any).__k6PerfCaptureSnapshotFromLastRequest = captureSnapshotFromLastRequest;

// ── Main request helper ───────────────────────────────────────

/**
 * Execute an HTTP request in a framework-aware way and return the native k6 Response.
 *
 * Accepts every body type, HTTP method, and param that k6 supports natively.
 * See RequestOptions for the full set of supported options.
 */
export function request(
  method: HttpMethod,
  pathOrUrl: string,
  options?: RequestOptions,
): any {
  const resolvedUrl = resolvePath(pathOrUrl, options?.service);

  if (resolvedUrl) {
    try {
      const origin = new URL(resolvedUrl).origin + '/';
      registerBaseUrl(origin);
    } catch { /* ignore non-parseable URLs */ }
  }

  const transaction = options?.tags?.transaction || getCurrentTransaction();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const harEntryId = options?.replay?.id || (options?.replay as any)?.harEntryId || nextRequestId();
  const recordingStartedAt = options?.replay?.recordingStartedAt || new Date().toISOString();

  // Merge persistent auto headers + one-shot header with the per-call headers
  // (per-call wins, case-insensitive) before sanitizing. See utils/autoHeaders.
  const cleanHeaders = sanitizeHeaders(mergeRequestHeaders(options?.headers));

  // Runtime-settings HTTP defaults (timeout / maxRedirects / throwOnError).
  // Per-call options always take precedence over these.
  const httpCfg = getHttpRuntimeConfig();

  const k6Params: Record<string, unknown> = {
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

  if (cleanHeaders && Object.keys(cleanHeaders).length > 0) k6Params.headers = cleanHeaders;
  // timeout: per-call wins, else runtime default (k6 takes ms as a number).
  if (options?.timeout !== undefined) k6Params.timeout = options.timeout;
  else if (httpCfg.timeoutMs !== undefined) k6Params.timeout = httpCfg.timeoutMs;
  if (options?.auth !== undefined) k6Params.auth = options.auth;
  if (options?.responseType !== undefined) k6Params.responseType = options.responseType;
  if (options?.jar !== undefined) k6Params.jar = options.jar;
  if (options?.compression !== undefined) k6Params.compression = options.compression;
  // throw: per-call wins, else runtime default (http.throwOnError).
  if (options?.throw !== undefined) k6Params.throw = options.throw;
  else if (httpCfg.throwOnError !== undefined) k6Params.throw = httpCfg.throwOnError;
  if (options?.http2 !== undefined) k6Params.http2 = options.http2;
  if (options?.responseCallback !== undefined) k6Params.responseCallback = options.responseCallback;

  // Newer @types/k6 narrows RequestBody to Record<string, FormValue> for objects,
  // which rejects Record<string, unknown>. Cast to any to satisfy both old and new
  // type definitions while preserving full runtime support for all body types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = (options?.body ?? null) as any;
  let res: any;

  switch (method) {
    case 'GET':
      res = http.get(resolvedUrl, k6Params);
      break;
    case 'POST':
      res = http.post(resolvedUrl, body, k6Params);
      break;
    case 'PUT':
      res = http.put(resolvedUrl, body, k6Params);
      break;
    case 'PATCH':
      res = http.patch(resolvedUrl, body, k6Params);
      break;
    case 'DELETE':
      res = http.del(resolvedUrl, body, k6Params);
      break;
    case 'HEAD':
      res = http.head(resolvedUrl, k6Params);
      break;
    case 'OPTIONS':
      res = http.options(resolvedUrl, body, k6Params);
      break;
    default:
      res = http.request(method, resolvedUrl, body, k6Params);
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
    recordFailingResponse(res, { method, url: resolvedUrl, status: res.status });
    applyErrorBehaviorForStatus(method, resolvedUrl, res.status, res.error);
  }

  if (__ENV.K6_PERF_DEBUG) {
    logExchange(
      {
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
          tags: k6Params.tags as Record<string, string>,
        },
        variables: options?.variables,
      },
      res,
    );
  }

  return res;
}
