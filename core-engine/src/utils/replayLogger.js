import exec from 'k6/execution';

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
export function trackCorrelation(name, value, source) {
  const v = value === undefined || value === null ? '' : String(value);
  _variableRegistry[name] = { name, type: 'correlation', value: v, source: source || 'body' };
  return value;
}

/**
 * Register a parameterisation variable (e.g. from CSV data).
 * Call once per parameter per iteration. Returns the value.
 */
export function trackParameter(name, value, source) {
  const v = value === undefined || value === null ? '' : String(value);
  _variableRegistry[name] = { name, type: 'parameter', value: v, source: source || 'data' };
  return value;
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
    if (!reg.value) continue;
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
  } catch {
    return {};
  }
}

function extractCookies(headers = {}) {
  const cookies = [];
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

function normalizeHeaders(headers = {}) {
  return Object.entries(headers).map(([name, value]) => ({
    name,
    value: Array.isArray(value) ? value.join(', ') : String(value),
  }));
}

function currentIteration() {
  return (exec.scenario.iterationInTest || 0) + 1;
}

function currentVu() {
  return exec.vu.idInTest || 0;
}

function nextRequestSequence(iteration) {
  const key = String(iteration);
  iterationState[key] = (iterationState[key] || 0) + 1;
  return iterationState[key];
}

export function createVariableEvent(name, type, action, value, source) {
  return {
    name,
    type,
    action,
    value: value === undefined || value === null ? '' : String(value),
    source,
  };
}

export function logReplayExchange(meta, requestInfo, response) {
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
      cookies: extractCookies(requestHeaders),
      body: requestInfo?.body !== null && requestInfo?.body !== undefined
        ? (typeof requestInfo.body === 'object' ? JSON.stringify(requestInfo.body) : String(requestInfo.body))
        : undefined,
    },
    response: {
      status: response?.status,
      headers: normalizeHeaders(responseHeaders),
      cookies: extractCookies(responseHeaders),
      body: response?.body ?? undefined,
    },
  };

  console.log('[k6-perf][replay-log] ' + JSON.stringify(entry));
}

/**
 * Compact debug-only logger. Only logs when K6_PERF_DEBUG env var is set.
 * Accepts the request definition object (as generated by ScriptGenerator/ScriptConverter)
 * and the k6 response. Variable events are auto-detected from the registry.
 */
export function logExchange(req, res) {
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
    },
    res,
  );
}
