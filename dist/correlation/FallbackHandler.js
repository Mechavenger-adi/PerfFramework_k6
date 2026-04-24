"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FallbackHandler = void 0;
const logger_1 = require("../utils/logger");
class FallbackHandler {
    /**
     * Executes the appropriate fallback strategy when correlation extraction fails.
     */
    static handle(rule) {
        if (rule.fallback === 'fail' || rule.isCritical) {
            logger_1.Logger.error(`[Correlation] Critical fallback triggered for: ${rule.name}`);
            throw new Error(`Critical correlation extraction failed for ${rule.name}`);
        }
        else if (rule.fallback === 'default' && rule.defaultValue !== undefined) {
            logger_1.Logger.warn(`[Correlation] Using default value for: ${rule.name}`);
            return rule.defaultValue;
        }
        else {
            logger_1.Logger.warn(`[Correlation] Extraction failed for: ${rule.name}, skipping gracefully.`);
            return '';
        }
    }
}
exports.FallbackHandler = FallbackHandler;
//# sourceMappingURL=FallbackHandler.js.map