"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainFilter = void 0;
const logger_1 = require("../utils/logger");
class DomainFilter {
    /**
     * Filter HAR entries by allowed output domains. Supports substring matching.
     */
    static filter(entries, allowedDomains) {
        if (!allowedDomains || allowedDomains.length === 0)
            return entries;
        const removedStats = {};
        const filtered = entries.filter((req) => {
            const match = allowedDomains.some(domain => req.host.includes(domain));
            if (!match) {
                removedStats[req.host] = (removedStats[req.host] || 0) + 1;
            }
            return match;
        });
        for (const [host, count] of Object.entries(removedStats)) {
            logger_1.Logger.debug(`[DomainFilter] Removed ${count} requests for domain: ${host}`);
        }
        return filtered;
    }
}
exports.DomainFilter = DomainFilter;
//# sourceMappingURL=DomainFilter.backup.js.map