"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HARParser = void 0;
const fs = __importStar(require("fs"));
const logger_1 = require("../utils/logger");
const DomainFilter_1 = require("./DomainFilter");
class HARParser {
    /**
     * Parse a HAR file, extract internal entry models, and perform the current refinement steps.
     */
    static parse(filePath, options = {}) {
        let entries = this.readEntries(filePath);
        // 1. Sort by DateTime
        entries.sort((a, b) => new Date(a.startedDateTime).getTime() - new Date(b.startedDateTime).getTime());
        // 2. Domain filtering
        if (options.allowedDomains && options.allowedDomains.length > 0) {
            entries = DomainFilter_1.DomainFilter.filter(entries, options.allowedDomains);
        }
        // 3. Static asset removal
        if (options.excludeStaticAssets) {
            const staticExts = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.ico'];
            entries = entries.filter((req) => {
                const urlLower = req.url.toLowerCase();
                // Check extension or mimeType
                const isMimeStatic = req.mimeType.includes('image/') || req.mimeType.includes('font/') || req.mimeType.includes('text/css');
                const isExtStatic = staticExts.some(ext => urlLower.includes(ext));
                return !(isExtStatic || isMimeStatic);
            });
            logger_1.Logger.debug(`[HARParser] Filtered static assets, ${entries.length} requests remaining.`);
        }
        // 4. Header stripping
        const stripHeaders = (options.stripHeaders || ['x-request-id', 'traceparent', 'x-correlation-id', 'cookie', 'authorization']).map(h => h.toLowerCase());
        entries.forEach(req => {
            req.headers = req.headers.filter(h => !stripHeaders.includes(h.name.toLowerCase()));
        });
        // 5. Re-sequence IDs after filtering (1-based)
        entries.forEach((req, idx) => {
            req.id = `req_${idx + 1}`;
        });
        return entries;
    }
    /**
     * Read entries from a HAR file without applying filters so the CLI can inspect domains first.
     */
    static readEntries(filePath) {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const har = JSON.parse(rawData);
        if (!har.log || !har.log.entries) {
            throw new Error(`Invalid HAR file at ${filePath}`);
        }
        return har.log.entries.filter((e) => e.request && e.response).map((e, index) => {
            let host = '';
            try {
                host = new URL(e.request.url).hostname;
            }
            catch (err) {
                host = e.request.url;
            }
            return {
                id: `req_${index}`,
                method: e.request.method,
                url: e.request.url,
                headers: e.request.headers,
                postData: e.request.postData,
                status: e.response.status,
                responseHeaders: e.response.headers,
                responseBody: e.response.content,
                requestCookies: Array.isArray(e.request.cookies)
                    ? e.request.cookies.map((c) => ({ name: c.name, value: c.value }))
                    : [],
                responseCookies: Array.isArray(e.response.cookies)
                    ? e.response.cookies.map((c) => ({ name: c.name, value: c.value }))
                    : [],
                pageref: e.pageref,
                startedDateTime: e.startedDateTime,
                time: e.time,
                mimeType: e.response.content?.mimeType || '',
                host
            };
        });
    }
}
exports.HARParser = HARParser;
//# sourceMappingURL=HARParser.js.map