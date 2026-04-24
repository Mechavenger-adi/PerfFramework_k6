"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorrelationEngine = void 0;
const ExtractorRegistry_1 = require("./ExtractorRegistry");
const FallbackHandler_1 = require("./FallbackHandler");
const logger_1 = require("../utils/logger");
class CorrelationEngine {
    constructor(rules) {
        this.store = new Map();
        this.rules = [];
        this.rules = rules;
    }
    /**
     * Process an HTTP response, attempting to extract metrics matching the rules.
     */
    process(res) {
        for (const rule of this.rules) {
            const extractor = ExtractorRegistry_1.ExtractorRegistry.get(rule.extractor);
            if (!extractor) {
                logger_1.Logger.warn(`[Correlation] Unknown extractor type: ${rule.extractor}`);
                continue;
            }
            const extractedValue = extractor(res, rule.pattern);
            if (extractedValue !== null) {
                this.store.set(rule.name, extractedValue);
                logger_1.Logger.debug(`[Correlation] Extracted ${rule.name}`);
            }
            else if (!this.store.has(rule.name)) {
                // Trigger fallback only if not seen previously
                const fallbackValue = FallbackHandler_1.FallbackHandler.handle(rule);
                if (fallbackValue !== '') {
                    this.store.set(rule.name, fallbackValue);
                }
            }
        }
    }
    /**
     * Safe retrieval of an extracted token.
     */
    get(name) {
        return this.store.get(name);
    }
    /**
     * Dump all values (useful for debugging).
     */
    dump() {
        const obj = {};
        for (const [key, val] of this.store.entries()) {
            obj[key] = val;
        }
        return obj;
    }
}
exports.CorrelationEngine = CorrelationEngine;
//# sourceMappingURL=CorrelationEngine.js.map