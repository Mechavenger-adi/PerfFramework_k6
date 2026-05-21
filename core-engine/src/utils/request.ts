// @ts-ignore - K6 runtime module
import http from 'k6/http';
// @ts-ignore - K6 runtime module
import exec from 'k6/execution';
import { resolvePath, registerBaseUrl } from './session.js';
import { getCurrentTransaction } from './transaction.js';
import { logExchange } from './replayLogger.js';

declare const __ENV: Record<string, string | undefined>;

// ── Types ─────────────────────────────────────────────────────

interface RequestReplayMeta {
  /** Stable request identifier used for debug diff matching (e.g. "req_1"). */
  id?: string;
  /** @deprecated Use `id` instead. */
  harEntryId?: string;
  recordingStartedAt?: string;
}

export interface RequestOptions {
  name?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: string | Record<string, unknown>;
  redirects?: number;
  service?: string;
  tags?: Record<string, string>;
  replay?: RequestReplayMeta;
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
// Read once per request (module-level cache would be stale across scenario reloads).
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

function applyErrorBehaviorForStatus(method: string, url: string, status: number): void {
  const behavior = getRuntimeErrorBehavior();
  if (behavior === 'continue') return;

  const msg = `HTTP ${status} on ${method} ${url}`;

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
// Cached per-VU module init to avoid repeated JSON.parse on every request.

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

// Per-VU snapshot counter. k6 module scope is per-VU, so this approximates
// maxSnapshotsPerRun across a VU's lifetime during the run.
let _snapshotCount = 0;

// ── Header sanitization ───────────────────────────────────────
// k6 automatically computes Content-Length and manages Transfer-Encoding/Host.
// Passing these from HAR recordings causes "Content-Length doesn't match body"
// warnings when the body is re-serialised (e.g. form data recorded as a JS object).

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

// ── Snapshot emission ─────────────────────────────────────────
// Emits a [k6-perf][snapshot-event] JSON line to stdout for any 4xx/5xx response
// when captureSnapshotOnFailure is enabled. The Node.js reporting pipeline reads
// these events to write per-request failure snapshots to the results directory.

function emitSnapshotEvent(
  method: string,
  resolvedUrl: string,
  options: RequestOptions | undefined,
  res: any,
): void {
  const cfg = getSnapshotConfig();
  if (!cfg.captureSnapshotOnFailure) return;
  if (!res || res.status < 400) return;
  if (_snapshotCount >= cfg.maxSnapshotsPerRun) return;
  _snapshotCount++;

  const payload = {
    ts: new Date().toISOString(),
    type: 'http_request_failed',
    journey: typeof __ENV !== 'undefined' ? (__ENV.K6_PERF_JOURNEY_NAME || '') : '',
    transaction: getCurrentTransaction(),
    requestName: options?.name || resolvedUrl,
    vu: exec.vu.idInInstance,
    iteration: exec.vu.iterationInScenario,
    phase: 'action',
    request: {
      method,
      url: resolvedUrl,
      headers: cfg.includeRequestHeaders ? options?.headers : undefined,
      body: cfg.includeRequestBody && options?.body != null ? String(options.body) : undefined,
    },
    response: {
      status: res.status,
      headers: cfg.includeResponseHeaders ? (res.headers ?? undefined) : undefined,
      body: cfg.includeResponseBody && typeof res.body === 'string' ? res.body : undefined,
    },
  };
  console.log('[k6-perf][snapshot-event] ' + JSON.stringify(payload));
}

// ── Main request helper ───────────────────────────────────────

/**
 * Execute an HTTP request in a framework-aware way and return the native k6 Response.
 *
 * 1. Resolves relative paths against the effective base URL.
 * 2. Strips auto-computed headers (Content-Length, Transfer-Encoding, Host).
 * 3. Builds k6 params (headers, cookies, tags, redirects) from options.
 * 4. Executes the appropriate http.* call.
 * 5. Emits [k6-perf][snapshot-event] for 4xx/5xx when captureSnapshotOnFailure is enabled.
 * 6. When K6_PERF_DEBUG is set, calls logExchange() for replay logging.
 * 7. Returns the native k6 Response for use with check() and correlation extraction.
 */
export function request(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  pathOrUrl: string,
  options?: RequestOptions,
): any {
  const resolvedUrl = resolvePath(pathOrUrl, options?.service);

  // Auto-register the URL origin so clearCookies() can clear cookies for it
  // without requiring an explicit registerBaseUrl() call in the script.
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

  const cleanHeaders = sanitizeHeaders(options?.headers);

  const k6Params: Record<string, unknown> = {
    cookies: options?.cookies ?? {},
    redirects: options?.redirects ?? 0,
    tags: {
      transaction,
      har_entry_id: harEntryId,
      recording_started_at: recordingStartedAt,
      ...(options?.tags ?? {}),
    },
  };

  if (cleanHeaders && Object.keys(cleanHeaders).length > 0) {
    k6Params.headers = cleanHeaders;
  }

  const body = options?.body ?? null;
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
      res = http.del(resolvedUrl, null, k6Params);
      break;
    default:
      res = http.request(method, resolvedUrl, body, k6Params);
  }

  // Snapshot fires regardless of debug mode — it's a failure capture, not a debug trace.
  emitSnapshotEvent(method, resolvedUrl, options, res);

  // Apply error behavior for 4xx/5xx responses. Snapshot is already emitted above so
  // the failure is always recorded before we potentially throw or abort.
  if (res && res.status >= 400) {
    applyErrorBehaviorForStatus(method, resolvedUrl, res.status);
  }

  if (__ENV.K6_PERF_DEBUG) {
    logExchange(
      {
        id: harEntryId,
        transaction,
        recordingStartedAt,
        method,
        url: resolvedUrl,
        body: body as string | null,
        params: {
          headers: options?.headers, // original headers for replay fidelity
          tags: k6Params.tags as Record<string, string>,
        },
      },
      res,
    );
  }

  return res;
}
