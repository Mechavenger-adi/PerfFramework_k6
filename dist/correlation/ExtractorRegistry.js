"use strict";
/**
 * ExtractorRegistry.ts
 * Phase 3 – Pluggable extractors for correlation.
 *
 * NOTE: This module defines types compatible with k6's RefinedResponse at runtime.
 * Since the core engine compiles under Node (not k6), we use a generic response interface
 * that mirrors the k6 response shape. At runtime inside k6, the actual k6 response objects
 * are passed in and work transparently.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtractorRegistry = void 0;
class ExtractorRegistry {
    static register(type, fn) {
        this.extractors.set(type, fn);
    }
    static get(type) {
        return this.extractors.get(type);
    }
}
exports.ExtractorRegistry = ExtractorRegistry;
ExtractorRegistry.extractors = new Map();
// Built-in extractors
ExtractorRegistry.register('regex', (res, pattern) => {
    if (!res.body)
        return null;
    const match = String(res.body).match(new RegExp(pattern));
    return match ? (match[1] || match[0]) : null;
});
ExtractorRegistry.register('jsonpath', (res, pattern) => {
    try {
        const data = res.json();
        if (!data)
            return null;
        // Simplified JSONPath using dot notation e.g. "user.token"
        const keys = pattern.split('.');
        let val = data;
        for (const key of keys) {
            if (val === undefined || val === null)
                return null;
            val = val[key];
        }
        return val ? String(val) : null;
    }
    catch (e) {
        return null; // Not JSON or path error
    }
});
ExtractorRegistry.register('header', (res, pattern) => {
    return (res.headers && res.headers[pattern]) ? String(res.headers[pattern]) : null;
});
// LoadRunner-style left-boundary/right-boundary extraction. Pattern format:
//   "lb=<left>;;rb=<right>"  — the value is the text strictly between them.
// Uses ';;' as the lb/rb separator so a single ';' can appear inside a boundary.
ExtractorRegistry.register('boundary', (res, pattern) => {
    if (!res.body)
        return null;
    const lbMatch = /lb=([\s\S]*?);;rb=([\s\S]*)$/.exec(pattern);
    if (!lbMatch)
        return null;
    const [, left, right] = lbMatch;
    const body = String(res.body);
    const start = left ? body.indexOf(left) : 0;
    if (start === -1)
        return null;
    const valueStart = start + left.length;
    const end = right ? body.indexOf(right, valueStart) : body.length;
    if (end === -1)
        return null;
    return body.slice(valueStart, end);
});
// Cookie extraction from the response Set-Cookie header(s). Pattern = cookie name.
ExtractorRegistry.register('cookie', (res, pattern) => {
    if (!res.headers)
        return null;
    const wanted = pattern.toLowerCase();
    for (const key of Object.keys(res.headers)) {
        if (key.toLowerCase() !== 'set-cookie')
            continue;
        const firstPair = String(res.headers[key]).split(';')[0].trim();
        const eq = firstPair.indexOf('=');
        if (eq <= 0)
            continue;
        if (firstPair.slice(0, eq).toLowerCase() === wanted) {
            return firstPair.slice(eq + 1);
        }
    }
    return null;
});
