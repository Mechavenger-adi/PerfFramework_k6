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
//# sourceMappingURL=ExtractorRegistry.js.map