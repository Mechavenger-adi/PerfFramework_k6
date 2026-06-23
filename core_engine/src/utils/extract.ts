/**
 * extract.ts
 * k6-native correlation extractors (VU-safe — no Node APIs).
 *
 * These are the RUNTIME counterpart to the design-time CorrelationScanner.
 * Generated/correlated scripts call one of these to pull a dynamic value out of
 * a response, then wrap it with `trackCorrelation()` so a miss degrades to a
 * visible `{NOTFOUND:name}` placeholder instead of throwing:
 *
 *   c_csrfToken = trackCorrelation('c_csrfToken', extractJson(res1, 'csrfToken'), 'res1.body:csrfToken');
 *
 * Every extractor returns `string | null` and NEVER throws — a malformed body,
 * missing header, or non-matching pattern yields `null`, which trackCorrelation
 * turns into the placeholder. This mirrors LoadRunner's continue-on-error
 * semantics so one stale value can't abort the whole VU.
 */

/**
 * Minimal structural view of a k6 RefinedResponse. The real k6 response object
 * is passed at runtime; we only touch the fields we need so this stays
 * decoupled from @types/k6 versions.
 */
export interface ExtractableResponse {
  status?: number;
  body?: string | null | ArrayBuffer;
  headers?: Record<string, string | string[]> | null;
  /** k6's parsed Set-Cookie data: { cookieName: [{ value, ... }], ... }. */
  cookies?: Record<string, Array<{ value?: string }>> | null;
  /** k6 helper — may throw on non-JSON bodies, so callers guard with try/catch. */
  json?: (selector?: string) => unknown;
}

/** Coerce a response body to a string, or '' when binary/absent. */
function bodyString(res: ExtractableResponse | null | undefined): string {
  if (!res) return '';
  const b = res.body;
  if (typeof b === 'string') return b;
  return '';
}

function asResultString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  // Objects/arrays are not useful as a substituted token value.
  return null;
}

/**
 * Navigate a dot-notation path over a parsed JSON value. Supports numeric
 * segments for array indexing, e.g. `data.items.0.id`. Returns the leaf value
 * or null if any segment is missing.
 */
function navigate(root: unknown, dotPath: string): unknown {
  if (!dotPath) return root;
  let current: unknown = root;
  const segments = dotPath.split('.');
  for (const rawSeg of segments) {
    const seg = rawSeg.trim();
    if (seg === '') continue;
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      const idx = Number(seg);
      if (!Number.isInteger(idx)) return undefined;
      current = current[idx];
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[seg];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Extract a value from a JSON response body by dot-notation path.
 * `extractJson(res, 'data.user.token')` → the token string, or null.
 */
export function extractJson(res: ExtractableResponse | null | undefined, dotPath: string): string | null {
  if (!res) return null;
  let parsed: unknown;
  // Prefer parsing the raw body ourselves (deterministic); fall back to k6's
  // res.json() only if body parsing isn't possible.
  const raw = bodyString(res);
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = undefined;
    }
  }
  if (parsed === undefined && typeof res.json === 'function') {
    try {
      parsed = res.json();
    } catch {
      parsed = undefined;
    }
  }
  if (parsed === undefined) return null;
  return asResultString(navigate(parsed, dotPath));
}

/**
 * Extract a value from the response body by regular expression.
 * Uses capture group `group` (default 1); falls back to the whole match when
 * the pattern has no groups. Never throws on a bad pattern.
 */
export function extractRegex(
  res: ExtractableResponse | null | undefined,
  pattern: string | RegExp,
  group = 1,
): string | null {
  const body = bodyString(res);
  if (!body) return null;
  let re: RegExp;
  try {
    re = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  } catch {
    return null;
  }
  const m = body.match(re);
  if (!m) return null;
  return asResultString(m[group] !== undefined ? m[group] : m[0]);
}

/**
 * Extract a response header value by name (case-insensitive).
 * Joins multi-value headers with ', ' (k6 usually pre-joins them).
 *
 * Supports a `Header?param` form: when `name` contains `?`, the part before it
 * is the header name and the part after is a query parameter parsed out of the
 * header's URL value — used for tokens carried in a redirect `Location` header,
 * e.g. extractHeader(res, 'Location?orderId').
 */
export function extractHeader(res: ExtractableResponse | null | undefined, name: string): string | null {
  if (!res || !res.headers || !name) return null;

  const q = name.indexOf('?');
  if (q > 0) {
    const headerValue = extractHeader(res, name.slice(0, q));
    return headerValue ? queryParamFromUrl(headerValue, name.slice(q + 1)) : null;
  }

  const wanted = name.toLowerCase();
  for (const key of Object.keys(res.headers)) {
    if (key.toLowerCase() === wanted) {
      const v = res.headers[key];
      return asResultString(Array.isArray(v) ? v.join(', ') : v);
    }
  }
  return null;
}

/** Pull a query parameter value out of a (possibly relative) URL string. */
function queryParamFromUrl(url: string, param: string): string | null {
  const qIndex = url.indexOf('?');
  if (qIndex === -1) return null;
  const query = url.slice(qIndex + 1).split('#')[0];
  for (const pair of query.split('&')) {
    const eq = pair.indexOf('=');
    if (eq <= 0) continue;
    if (pair.slice(0, eq) === param) {
      try {
        return decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, ' '));
      } catch {
        return pair.slice(eq + 1);
      }
    }
  }
  return null;
}

/**
 * Extract a cookie value set by the response. Prefers k6's parsed res.cookies
 * (`{ name: [{ value }] }`), then falls back to parsing the Set-Cookie header.
 */
export function extractCookie(res: ExtractableResponse | null | undefined, name: string): string | null {
  if (!res || !name) return null;

  // 1. k6 parsed cookies
  const jar = res.cookies;
  if (jar && typeof jar === 'object') {
    for (const key of Object.keys(jar)) {
      if (key.toLowerCase() === name.toLowerCase()) {
        const entries = jar[key];
        if (Array.isArray(entries) && entries.length > 0) {
          return asResultString(entries[0]?.value);
        }
      }
    }
  }

  // 2. Set-Cookie header fallback
  if (res.headers && typeof res.headers === 'object') {
    for (const key of Object.keys(res.headers)) {
      if (key.toLowerCase() !== 'set-cookie') continue;
      const headerVal = res.headers[key];
      const rawValues = Array.isArray(headerVal) ? headerVal : [String(headerVal)];
      for (const raw of rawValues) {
        const firstPair = String(raw).split(';')[0].trim();
        const eq = firstPair.indexOf('=');
        if (eq <= 0) continue;
        const cookieName = firstPair.slice(0, eq);
        if (cookieName.toLowerCase() === name.toLowerCase()) {
          return asResultString(firstPair.slice(eq + 1));
        }
      }
    }
  }

  return null;
}

/**
 * LoadRunner-style left-boundary / right-boundary extraction.
 * Returns the text strictly between `left` and the next `right` after it.
 *   extractBoundary(res, 'name="__VIEWSTATE" value="', '"')
 * `occurrence` (1-based) selects which match to return when boundaries repeat.
 */
export function extractBoundary(
  res: ExtractableResponse | null | undefined,
  left: string,
  right: string,
  occurrence = 1,
): string | null {
  const body = bodyString(res);
  if (!body) return null;

  let fromIndex = 0;
  let found = 0;
  // Empty left boundary → search from the start of the body.
  while (true) {
    const start = left ? body.indexOf(left, fromIndex) : fromIndex;
    if (start === -1) return null;
    const valueStart = start + left.length;
    // Empty right boundary → take the rest of the body.
    const end = right ? body.indexOf(right, valueStart) : body.length;
    if (end === -1) return null;
    found++;
    if (found >= occurrence) {
      return body.slice(valueStart, end);
    }
    fromIndex = right ? end + right.length : valueStart + 1;
    if (fromIndex >= body.length) return null;
  }
}
