// @ts-ignore - K6 runtime module
import exec from 'k6/execution';
// @ts-ignore - K6 runtime module
import http from 'k6/http';

declare const __ENV: Record<string, string | undefined>;

// ── Types ─────────────────────────────────────────────────────

interface VariableRegistryEntry {
  name: string;
  type: 'correlation' | 'parameter';
  value: string;
  source: string;
}

interface VariableEvent {
  name: string;
  type: string;
  action: string;
  value: string;
  source: string;
}

interface Cookie {
  name: string;
  value: string;
}

interface NormalizedHeader {
  name: string;
  value: string;
}

interface ExchangeMeta {
  harEntryId: string;
  transaction: string;
  recordingStartedAt: string;
  method: string;
  url: string | object;
  tags?: Record<string, string>;
}

interface RequestInfo {
  headers?: Record<string, string | string[]>;
  body?: string | object | null;
  variableEvents?: VariableEvent[];
  actualRequestHeaders?: Record<string, string | string[]>;
  k6ResponseCookies?: Record<string, Array<{ value: string }>>;
  /** Per-request cookies passed to k6 (from options.cookies). */
  requestCookiesOption?: Record<string, string | { value: string; replace?: boolean }>;
  /** Variable name→value pairs declared inline on the request() call. */
  variables?: Record<string, string | number | boolean>;
}

interface K6Response {
  status?: number;
  headers?: Record<string, string | string[]>;
  body?: string;
  timings?: { duration?: number };
  cookies?: Record<string, Array<{ value: string }>>;
  request?: { headers?: Record<string, string | string[]> };
  /** k6 sets these on a transport failure (timeout / reset / refused) where
   * status comes back as 0. Captured so the report can show WHY instead of a
   * bare, easy-to-miss "0". */
  error?: string;
  error_code?: number;
}

interface RequestDefinition {
  id: string;
  transaction: string;
  recordingStartedAt: string;
  method: string;
  url: string;
  body?: string | object | null;
  params?: {
    headers?: Record<string, string>;
    cookies?: Record<string, string | { value: string; replace?: boolean }>;
    tags?: Record<string, string>;
  };
  variables?: Record<string, string | number | boolean>;
}

// ── State ─────────────────────────────────────────────────────

const iterationState: Record<string, number> = {};

// ── Runtime variable registry ──
// Stores { name, value, type, source } for each tracked variable.
// logExchange auto-detects 'used' events by scanning request url/body/headers
// for any registered value, eliminating the need for static variableEvents arrays.
const _variableRegistry: Record<string, VariableRegistryEntry> = {};

// "Generic" sources are the non-descriptive placeholders the framework uses when
// no real source was given: the ctx sub-object name (correlation/data/session/
// meta) and the auto-track fallbacks (auto/expression/parameter). A generic
// source must NEVER overwrite a specific one a caller already recorded — e.g. an
// explicit trackCorrelation("tok", v, "body") must keep "body" even though the
// ctx.correlation Proxy and the debug auto-tracker both re-register "tok" with
// the generic "correlation" afterwards.
const _GENERIC_SOURCES = new Set([
  'correlation', 'data', 'session', 'meta', 'auto', 'expression', 'parameter',
]);

/**
 * Resolve the source to store for a variable. A specific (non-generic) source
 * always wins; a generic incoming source is kept only when nothing more specific
 * was registered before. This keeps the report's Source column showing the real
 * extraction source the script declared, not the internal placeholder.
 */
function resolveVariableSource(name: string, incoming: string): string {
  const existing = _variableRegistry[name];
  if (existing && _GENERIC_SOURCES.has(incoming) && !_GENERIC_SOURCES.has(existing.source)) {
    return existing.source;
  }
  return incoming;
}

/**
 * Best-effort: pull the first user-script frame (path:line[:col]) out of a fresh
 * stack trace, skipping framework internals (dist/utils) and k6 runtime frames.
 * Used to point a failed-correlation log at the exact extraction site.
 */
function callerScriptLocation(): string {
  try {
    const stack = new Error().stack;
    if (!stack) return '';
    for (const raw of stack.split(/\r?\n/)) {
      const m = raw.match(/((?:file:\/\/)?[^\s()<>"']+):(\d+)(?::(\d+))?/);
      if (!m) continue;
      const p = m[1];
      if (p.includes('/dist/utils/') || p.includes('\\dist\\utils\\')) continue;
      if (p.includes('replayLogger') || p.startsWith('k6/') || p.includes('go.k6.io')) continue;
      return m[3] ? `${p}:${m[2]}:${m[3]}` : `${p}:${m[2]}`;
    }
  } catch { /* ignore */ }
  return '';
}

/**
 * Register a correlation variable at the point of extraction.
 * Call this right after a regex match or similar extraction.
 * Returns the value for inline use: correlation_vars["x"] = trackCorrelation("x", match[1], "body");
 */
export function trackCorrelation(name: string, value: unknown, source?: string): unknown {
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
        const vu = exec?.vu?.idInInstance;
        const iter = exec?.vu?.iterationInScenario;
        if (vu !== undefined) where += ` (VU ${vu}, iter ${iter}`;
        const loc = callerScriptLocation();
        where += loc ? `${vu !== undefined ? ', ' : ' ('}at ${loc})` : (vu !== undefined ? ')' : '');
      } catch { /* context best-effort */ }
      console.error(`[k6-perf] correlation "${name}" not found — substituting ${resolved}${where}`);
      // Surface as a structured warning so it lands in the report's Warnings tab
      // (extractK6PerfEvents parses the [k6-perf][warning-event] marker).
      console.log('[k6-perf][warning-event] ' + JSON.stringify({
        ts: new Date().toISOString(),
        type: 'correlation_not_found',
        name: name,
        message: `Correlation "${name}" not found — substituted ${String(resolved)}${where}`,
      }));
    } catch { /* logging is best-effort */ }
  }
  _variableRegistry[name] = {
    name,
    type: 'correlation',
    value: String(resolved),
    source: resolveVariableSource(name, source || 'body'),
  };
  return resolved;
}

/**
 * Register a parameterisation variable (e.g. from CSV data).
 * Call once per parameter per iteration. Returns the value.
 */
export function trackParameter(name: string, value: unknown, source?: string): unknown {
  const v = value === undefined || value === null ? '' : String(value);
  _variableRegistry[name] = {
    name,
    type: 'parameter',
    value: v,
    source: resolveVariableSource(name, source || 'data'),
  };
  return value;
}

/**
 * Auto-register all properties from a data row object.
 * Call once per data file per iteration. Registers every key-value pair as a parameter.
 * e.g. trackDataRow("userdetails", getUniqueItem(FILES["userdetails"]))
 * will register p_username, p_password, etc. — whatever columns the CSV has.
 */
export function trackDataRow(sourceName: string, rowObject: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!rowObject || typeof rowObject !== 'object') return rowObject;
  for (const [key, val] of Object.entries(rowObject)) {
    const v = val === undefined || val === null ? '' : String(val);
    _variableRegistry[key] = {
      name: key,
      type: 'parameter',
      value: v,
      source: resolveVariableSource(key, sourceName || 'data'),
    };
  }
  return rowObject;
}

/**
 * Debug-time auto-tracking hook for ANY interpolated variable — parameter OR
 * correlation. JavaScript resolves a `${expr}` template into a plain string
 * BEFORE request() ever sees it, so the framework can't recover which variable
 * produced a value at runtime. To make the report's variable table reflect the
 * real per-iteration value of every `${...}` without forcing track* calls into
 * the user's script, the debug runner rewrites each interpolation on a throwaway
 * COPY to `${__k6PerfTrackVar("name", (expr), "source", "type")}`.
 *
 * It registers the value at the exact interpolation site — fresh every iteration —
 * and returns it UNCHANGED (registers directly, never runs the NOTFOUND/placeholder
 * logic) so the surrounding template is byte-for-byte unaffected. Best-effort:
 * tracking must never disturb the request being built. The user's script is never
 * modified and needs no imports (the helper is installed on globalThis).
 */
export function trackAuto(
  name: string,
  value: unknown,
  source?: string,
  type?: 'parameter' | 'correlation',
): unknown {
  try {
    const v = value === undefined || value === null ? '' : String(value);
    _variableRegistry[name] = {
      name,
      type: type === 'correlation' ? 'correlation' : 'parameter',
      value: v,
      source: resolveVariableSource(name, source || 'auto'),
    };
  } catch {
    /* tracking is best-effort — never break the running request */
  }
  return value;
}
// Install on globalThis so instrumented scripts call it without an import. This
// module is always loaded whenever a script makes a request() (request.ts → here).
(globalThis as unknown as { __k6PerfTrackVar?: typeof trackAuto }).__k6PerfTrackVar = trackAuto;

/**
 * Auto-detect which registered variables were used in this request.
 * Scans url, body (stringified), and header values for exact matches of
 * tracked variable values. Pass actualHeaders when available so auto-managed
 * headers (Cookie from jar, etc.) are also scanned.
 */
function detectVariableEvents(
  url: string | object | undefined,
  body: string | object | null | undefined,
  headers: Record<string, string | string[]>,
  actualHeaders?: Record<string, string | string[]>,
): VariableEvent[] {
  const events: VariableEvent[] = [];
  const searchTargets: string[] = [String(url || '')];
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
    if (!reg.value) continue;
    if (haystack.includes(reg.value)) {
      events.push({ name, type: reg.type, action: 'used', value: reg.value, source: reg.source });
    }
  }
  return events;
}

function extractQueryParams(url: string): Record<string, string> {
  try {
    const parsed = new URL(url);
    const params: Record<string, string> = {};
    for (const [key, value] of parsed.searchParams.entries()) {
      params[key] = value;
    }
    return params;
  } catch {
    return {};
  }
}

function extractCookies(headers: Record<string, string | string[]> = {}): Cookie[] {
  const cookies: Cookie[] = [];
  Object.entries(headers).forEach(([name, value]) => {
    const lower = String(name).toLowerCase();
    if (lower !== 'cookie' && lower !== 'set-cookie') return;

    const rawValue = Array.isArray(value) ? value.join('; ') : String(value);
    rawValue
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((token) => {
        const separatorIndex = token.indexOf('=');
        if (separatorIndex <= 0) return;
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
function extractK6ResponseCookies(resCookies: Record<string, Array<{ value: string }>>): Cookie[] {
  if (!resCookies || typeof resCookies !== 'object') return [];
  const cookies: Cookie[] = [];
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
function extractJarCookies(url: string): Cookie[] {
  try {
    const jar = http.cookieJar();
    const jarCookies = jar.cookiesForURL(url);
    if (!jarCookies || typeof jarCookies !== 'object') return [];
    const cookies: Cookie[] = [];
    for (const [name, values] of Object.entries(jarCookies)) {
      if (Array.isArray(values)) {
        for (const value of values) {
          cookies.push({ name, value: String(value) });
        }
      } else {
        cookies.push({ name, value: String(values) });
      }
    }
    return cookies;
  } catch {
    return [];
  }
}

function normalizeHeaders(headers: Record<string, string | string[]> = {}): NormalizedHeader[] {
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
function binaryBodyPlaceholder(url: string, responseHeaders: Record<string, string | string[]>): string | null {
  // Check content-type header
  const ct = (
    (responseHeaders['Content-Type'] as string) ||
    (responseHeaders['content-type'] as string) ||
    ''
  ).split(';')[0].trim().toLowerCase();
  if (ct && (BINARY_CONTENT_RE.test(ct) || BINARY_MIME_TYPES.has(ct))) {
    return `[binary: ${ct}]`;
  }
  // Fallback: check URL extension
  if (typeof url === 'string' && STATIC_EXT_RE.test(url)) {
    return '[binary: static asset]';
  }
  return null;
}

function currentIteration(): number {
  return (exec.scenario.iterationInTest || 0) + 1;
}

function currentVu(): number {
  return exec.vu.idInTest || 0;
}

function nextRequestSequence(iteration: number): number {
  const key = String(iteration);
  iterationState[key] = (iterationState[key] || 0) + 1;
  return iterationState[key];
}

export function createVariableEvent(
  name: string,
  type: string,
  action: string,
  value: unknown,
  source: string,
): VariableEvent {
  return {
    name,
    type,
    action,
    value: value === undefined || value === null ? '' : String(value),
    source,
  };
}

export function logReplayExchange(
  meta: ExchangeMeta,
  requestInfo: RequestInfo,
  response: K6Response | null | undefined,
): void {
  const requestHeaders = requestInfo?.headers || {};
  const actualRequestHeaders = requestInfo?.actualRequestHeaders || {};
  const responseHeaders = response?.headers || {};
  const iteration = currentIteration();
  const requestSequence = nextRequestSequence(iteration);

  // Build variable events from three sources (priority: auto-detected > variables option > explicit array):
  // 1. Auto-detected: scan URL/body/actual-headers against the registry (trackParameter/trackCorrelation values)
  const autoDetected = detectVariableEvents(meta.url, requestInfo?.body, requestHeaders as Record<string, string | string[]>, actualRequestHeaders as Record<string, string | string[]>);
  // 2. Explicit variables option: name→value pairs declared inline on request()
  const fromVariablesOption: VariableEvent[] = requestInfo?.variables
    ? Object.entries(requestInfo.variables).map(([name, value]) =>
        createVariableEvent(name, 'parameter', 'used', value, 'request'))
    : [];
  // 3. Legacy explicit events array (variableEvents field)
  const explicit: VariableEvent[] = Array.isArray(requestInfo?.variableEvents) ? requestInfo.variableEvents : [];

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
  const fromActualHeaders = extractCookies(actualRequestHeaders as Record<string, string | string[]>);
  const fromDeclaredHeaders = extractCookies(requestHeaders as Record<string, string | string[]>);
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
    : extractCookies(responseHeaders as Record<string, string | string[]>);

  // Determine if the response body is binary and should be replaced with a placeholder
  const binaryPlaceholder = binaryBodyPlaceholder(
    typeof meta.url === 'string' ? meta.url : String(meta.url ?? ''),
    responseHeaders as Record<string, string | string[]>,
  );

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
      headers: normalizeHeaders(
        (Object.keys(actualRequestHeaders).length > 0
          ? actualRequestHeaders
          : requestHeaders) as Record<string, string | string[]>,
      ),
      queryParams: extractQueryParams(typeof meta.url === 'string' ? meta.url : String(meta.url ?? '')),
      cookies: requestCookies,
      body: requestInfo?.body !== null && requestInfo?.body !== undefined
        ? (typeof requestInfo.body === 'object' ? JSON.stringify(requestInfo.body) : String(requestInfo.body))
        : undefined,
    },
    response: {
      status: response?.status,
      headers: normalizeHeaders(responseHeaders as Record<string, string | string[]>),
      cookies: responseCookies,
      // Guard against ArrayBuffer from responseType:'binary' — JSON.stringify would produce '{}'
      body: binaryPlaceholder
        ?? ((response?.body as unknown) instanceof ArrayBuffer || (typeof SharedArrayBuffer !== 'undefined' && (response?.body as unknown) instanceof SharedArrayBuffer)
          ? '[binary response]'
          : (response?.body ?? undefined)),
      // Carry k6's transport-error reason when the request never got a real HTTP
      // response (status 0 — timeout / connection reset / refused, common on the
      // last request as the test ramps down). Only set when meaningful so clean
      // responses stay untouched.
      ...(response?.error ? { error: response.error } : {}),
      ...(response?.error_code ? { errorCode: response.error_code } : {}),
    },
  };

  console.log('[k6-perf][replay-log] ' + JSON.stringify(entry));
}

/**
 * Compact debug-only logger. Only logs when K6_PERF_DEBUG env var is set.
 * Accepts the request definition object (as generated by ScriptGenerator/ScriptConverter)
 * and the k6 response. Variable events are auto-detected from the registry.
 */
export function logExchange(req: RequestDefinition, res: K6Response | null | undefined): void {
  if (!__ENV.K6_PERF_DEBUG) return;
  logReplayExchange(
    {
      harEntryId: req.id,
      transaction: req.transaction,
      recordingStartedAt: req.recordingStartedAt,
      method: req.method,
      url: req.url,
      tags: req.params?.tags,
    },
    {
      headers: req.params?.headers || {},
      body: req.body,
      actualRequestHeaders: res?.request?.headers || {},   // actual headers k6 sent (includes Cookie from jar)
      k6ResponseCookies: res?.cookies || {},                // k6's parsed response Set-Cookie data
      variables: req.variables,                             // inline variable name→value pairs
    },
    res,
  );
}
