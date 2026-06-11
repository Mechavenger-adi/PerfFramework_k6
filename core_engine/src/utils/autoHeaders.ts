/**
 * autoHeaders.ts
 * VU-safe "auto header" store (LoadRunner web_add_auto_header parity).
 *
 * Headers registered with addAutoHeader/addAutoHeaders are applied to EVERY
 * subsequent request() automatically, for the VU's entire lifetime (across all
 * iterations and phases), until removed/cleared. addHeaderOnce applies to the
 * next request() only.
 *
 * Module scope is per-VU in k6, so each VU has its own isolated header set.
 * Header names are case-insensitive (re-adding the same name replaces it).
 */

interface StoredHeader {
  /** Original-cased name as it should be emitted on the wire. */
  name: string;
  value: string;
}

// Keyed by lower-cased header name for case-insensitive replace/dedup.
const _autoHeaders = new Map<string, StoredHeader>();
const _onceHeaders = new Map<string, StoredHeader>();

/**
 * Add or replace an auto header applied to all subsequent requests. Passing a
 * null/undefined value removes it (use removeAutoHeader for an explicit remove).
 */
export function addAutoHeader(name: string, value: string | null | undefined): void {
  const key = String(name).toLowerCase();
  if (value === null || value === undefined) {
    _autoHeaders.delete(key);
    return;
  }
  _autoHeaders.set(key, { name: String(name), value: String(value) });
}

/** Bulk add/replace auto headers from an object. */
export function addAutoHeaders(headers: Record<string, string | null | undefined>): void {
  for (const [n, v] of Object.entries(headers || {})) {
    addAutoHeader(n, v);
  }
}

/** Remove a single auto header (case-insensitive). */
export function removeAutoHeader(name: string): void {
  _autoHeaders.delete(String(name).toLowerCase());
}

/** Remove all auto headers (and any pending one-shot header). */
export function clearAutoHeaders(): void {
  _autoHeaders.clear();
  _onceHeaders.clear();
}

/** Snapshot of the current auto headers as a plain object (original casing). */
export function getAutoHeaders(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { name, value } of _autoHeaders.values()) {
    out[name] = value;
  }
  return out;
}

/**
 * Add a header applied to the NEXT request() only, then consumed
 * (LoadRunner web_add_header parity).
 */
export function addHeaderOnce(name: string, value: string): void {
  _onceHeaders.set(String(name).toLowerCase(), { name: String(name), value: String(value) });
}

/**
 * INTERNAL (request.ts): merge auto headers + the one-shot header (consumed) +
 * the per-call headers, case-insensitively. Per-call wins over one-shot, which
 * wins over auto. Returns a plain headers object for k6.
 */
export function mergeRequestHeaders(perCall?: Record<string, string>): Record<string, string> {
  const merged = new Map<string, StoredHeader>();

  for (const [k, h] of _autoHeaders) merged.set(k, h);

  if (_onceHeaders.size > 0) {
    for (const [k, h] of _onceHeaders) merged.set(k, h);
    _onceHeaders.clear(); // one-shot consumed on the request that reads it
  }

  if (perCall) {
    for (const [n, v] of Object.entries(perCall)) {
      if (v === null || v === undefined) continue;
      merged.set(String(n).toLowerCase(), { name: String(n), value: String(v) });
    }
  }

  const out: Record<string, string> = {};
  for (const { name, value } of merged.values()) {
    out[name] = value;
  }
  return out;
}
