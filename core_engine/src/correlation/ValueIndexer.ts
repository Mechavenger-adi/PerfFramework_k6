/**
 * ValueIndexer.ts
 * Phase 1 of the scan: turn recorded exchanges into two flat lists —
 *   • producers — values that APPEAR IN a response (could be captured)
 *   • consumers — values that are SENT IN a request  (could be substituted)
 *
 * The LinkMatcher then joins a consumer value to the nearest preceding producer
 * of the same value. Everything here is pure string/JSON extraction — no scoring.
 */

import {
  RecordingExchange,
  ProducerSource,
  ConsumerLocation,
} from './CorrelationManifest';

export interface ProducerOccurrence {
  exchangeIndex: number;
  requestId: string;
  value: string;
  source: ProducerSource;
  /** json dot-path, header name, cookie name, or html field name. */
  locator: string;
}

export interface ConsumerOccurrence {
  exchangeIndex: number;
  requestId: string;
  value: string;
  in: ConsumerLocation;
  /** header name, query key, json path, or 'path'. */
  locator: string;
}

export interface IndexedValues {
  producers: ProducerOccurrence[];
  consumers: ConsumerOccurrence[];
}

/** Min/max value length we bother indexing. Below 4 is noise; above 1024 is a blob. */
const MIN_VALUE_LEN = 4;
const MAX_VALUE_LEN = 1024;

/** Request headers that are never correlation targets — skip to cut noise. */
const STATIC_REQUEST_HEADERS = new Set([
  'host', 'user-agent', 'accept', 'accept-encoding', 'accept-language',
  'accept-charset', 'content-length', 'content-type', 'connection',
  'cache-control', 'pragma', 'origin', 'referer', 'upgrade-insecure-requests',
  'dnt', 'te', 'priority',
]);

function isIndexableValue(raw: unknown): raw is string | number {
  if (typeof raw === 'number') return Number.isFinite(raw) && String(raw).length >= MIN_VALUE_LEN;
  if (typeof raw !== 'string') return false;
  const len = raw.length;
  return len >= MIN_VALUE_LEN && len <= MAX_VALUE_LEN;
}

function looksLikeHtml(body: string): boolean {
  const head = body.slice(0, 200).toLowerCase();
  return head.includes('<!doctype html') || head.includes('<html') || /<(input|form|meta)\b/i.test(body.slice(0, 4000));
}

function tryParseJson(body: string | undefined): unknown {
  if (!body) return undefined;
  const trimmed = body.trim();
  if (!trimmed || (trimmed[0] !== '{' && trimmed[0] !== '[')) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

/** Walk a parsed JSON value, emitting (dotPath, value) for every primitive leaf. */
function walkJson(
  value: unknown,
  basePath: string,
  emit: (path: string, value: string) => void,
  depth = 0,
): void {
  if (depth > 12 || value === null || value === undefined) return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => walkJson(v, basePath ? `${basePath}.${i}` : String(i), emit, depth + 1));
    return;
  }
  if (typeof value === 'object') {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      walkJson((value as Record<string, unknown>)[key], basePath ? `${basePath}.${key}` : key, emit, depth + 1);
    }
    return;
  }
  if (isIndexableValue(value)) emit(basePath, String(value));
}

/** Parse `a=1&b=2` form-encoded bodies into pairs. Returns null when not form-shaped. */
function tryParseForm(body: string | undefined): Array<{ key: string; value: string }> | null {
  if (!body) return null;
  const trimmed = body.trim();
  if (!trimmed || trimmed.includes('{') || trimmed.includes('\n')) return null;
  if (!/^[^=&\s]+=[^=&]*(?:&[^=&\s]+=[^=&]*)*$/.test(trimmed)) return null;
  const pairs: Array<{ key: string; value: string }> = [];
  for (const part of trimmed.split('&')) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    const key = decodeSafe(part.slice(0, eq));
    const value = decodeSafe(part.slice(eq + 1));
    pairs.push({ key, value });
  }
  return pairs;
}

function decodeSafe(s: string): string {
  try {
    return decodeURIComponent(s.replace(/\+/g, ' '));
  } catch {
    return s;
  }
}

/** Extract (name, value) pairs from HTML hidden inputs and CSRF meta tags. */
function extractHtmlTokens(body: string): Array<{ field: string; value: string }> {
  const out: Array<{ field: string; value: string }> = [];
  const attr = (tag: string, name: string): string | null => {
    const m = new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(tag);
    return m ? (m[2] ?? m[3] ?? '') : null;
  };

  const inputRe = /<input\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = inputRe.exec(body)) !== null) {
    const tag = m[0];
    const name = attr(tag, 'name') ?? attr(tag, 'id');
    const value = attr(tag, 'value');
    if (name && value) out.push({ field: name, value });
  }

  const metaRe = /<meta\b[^>]*>/gi;
  while ((m = metaRe.exec(body)) !== null) {
    const tag = m[0];
    const name = attr(tag, 'name') ?? attr(tag, 'property');
    const content = attr(tag, 'content');
    if (name && content && /csrf|token|forgery|state/i.test(name)) {
      out.push({ field: name, value: content });
    }
  }
  return out;
}

/**
 * Split a composite header value into candidate sub-tokens so an embedded
 * dynamic value is matchable on its own. Splits on whitespace/`;`/`,` and also
 * takes the part after a `key=value` separator. e.g. `Bearer <jwt>` → ['<jwt>'].
 */
function subTokens(value: string): string[] {
  const out = new Set<string>();
  for (const part of value.split(/[\s;,]+/)) {
    const token = part.trim();
    if (!token || token === value) continue;
    if (token.length >= MIN_VALUE_LEN) out.add(token);
    const eq = token.indexOf('=');
    if (eq > 0) {
      const after = token.slice(eq + 1);
      if (after.length >= MIN_VALUE_LEN && after !== value) out.add(after);
    }
  }
  return [...out];
}

function parseCookieHeader(value: string): Array<{ name: string; value: string }> {
  const out: Array<{ name: string; value: string }> = [];
  for (const part of value.split(';')) {
    const token = part.trim();
    const eq = token.indexOf('=');
    if (eq <= 0) continue;
    out.push({ name: token.slice(0, eq), value: token.slice(eq + 1) });
  }
  return out;
}

export class ValueIndexer {
  static index(exchanges: RecordingExchange[]): IndexedValues {
    const producers: ProducerOccurrence[] = [];
    const consumers: ConsumerOccurrence[] = [];

    exchanges.forEach((ex, exchangeIndex) => {
      this.indexProducers(ex, exchangeIndex, producers);
      this.indexConsumers(ex, exchangeIndex, consumers);
    });

    return { producers, consumers };
  }

  private static indexProducers(
    ex: RecordingExchange,
    exchangeIndex: number,
    out: ProducerOccurrence[],
  ): void {
    const { response } = ex;
    const push = (value: string, source: ProducerSource, locator: string) => {
      if (!isIndexableValue(value)) return;
      out.push({ exchangeIndex, requestId: ex.id, value: String(value), source, locator });
    };

    // 1. JSON body leaves
    const json = tryParseJson(response.body);
    if (json !== undefined) {
      walkJson(json, '', (path, value) => push(value, 'json', path));
    }

    // 2. Response headers (and query params carried in a redirect Location)
    for (const h of response.headers ?? []) {
      const lname = h.name.toLowerCase();
      if (lname === 'set-cookie') continue; // handled below
      push(h.value, 'header', h.name);
      if (lname === 'location' && h.value.includes('?')) {
        for (const { key, value } of parseQuery(h.value)) {
          push(value, 'header', `Location?${key}`);
        }
      }
    }

    // 3. Set-Cookie values
    for (const c of response.cookies ?? []) {
      push(c.value, 'set-cookie', c.name);
    }
    // Also parse raw Set-Cookie headers in case cookies[] wasn't populated.
    for (const h of response.headers ?? []) {
      if (h.name.toLowerCase() !== 'set-cookie') continue;
      const firstPair = h.value.split(';')[0].trim();
      const eq = firstPair.indexOf('=');
      if (eq > 0) push(firstPair.slice(eq + 1), 'set-cookie', firstPair.slice(0, eq));
    }

    // 4. HTML hidden inputs / CSRF meta tags
    if (response.body && looksLikeHtml(response.body)) {
      for (const { field, value } of extractHtmlTokens(response.body)) {
        push(value, 'html', field);
      }
    }
  }

  private static indexConsumers(
    ex: RecordingExchange,
    exchangeIndex: number,
    out: ConsumerOccurrence[],
  ): void {
    const { request } = ex;
    const push = (value: string, where: ConsumerLocation, locator: string) => {
      if (!isIndexableValue(value)) return;
      out.push({ exchangeIndex, requestId: ex.id, value: String(value), in: where, locator });
    };

    // 1. URL path segments + query
    try {
      const u = new URL(request.url);
      for (const seg of u.pathname.split('/')) {
        if (seg) push(decodeSafe(seg), 'url', 'path');
      }
      u.searchParams.forEach((value, key) => push(value, 'query', key));
    } catch {
      // Relative/!parseable URL — fall back to recorded queryParams below.
    }
    for (const [key, value] of Object.entries(request.queryParams ?? {})) {
      push(value, 'query', key);
    }

    // 2. Headers (skip static noise; Cookie handled separately)
    for (const h of request.headers ?? []) {
      const lname = h.name.toLowerCase();
      if (STATIC_REQUEST_HEADERS.has(lname)) continue;
      if (lname === 'cookie') {
        for (const c of parseCookieHeader(h.value)) push(c.value, 'cookie', c.name);
        continue;
      }
      push(h.value, 'header', h.name);
      // Also index embedded sub-tokens so a value carried inside a larger header
      // is still matched — e.g. the JWT inside `Authorization: Bearer <jwt>`.
      for (const sub of subTokens(h.value)) push(sub, 'header', h.name);
    }

    // 3. Explicit request cookies
    for (const c of request.cookies ?? []) {
      push(c.value, 'cookie', c.name);
    }

    // 4. Body — JSON leaves or form pairs
    const json = tryParseJson(request.body);
    if (json !== undefined) {
      walkJson(json, '', (path, value) => push(value, 'body', path));
    } else {
      const form = tryParseForm(request.body);
      if (form) {
        for (const { key, value } of form) push(value, 'body', key);
      }
    }
  }
}

function parseQuery(urlOrQuery: string): Array<{ key: string; value: string }> {
  const out: Array<{ key: string; value: string }> = [];
  const qIndex = urlOrQuery.indexOf('?');
  const query = qIndex >= 0 ? urlOrQuery.slice(qIndex + 1) : urlOrQuery;
  for (const part of query.split('&')) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    out.push({ key: part.slice(0, eq), value: decodeSafe(part.slice(eq + 1)) });
  }
  return out;
}
