"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeLogBuilder = void 0;
class ExchangeLogBuilder {
    static fromGroups(groups) {
        return groups.flatMap((group) => group.entries.map((entry) => this.fromHAREntry(entry, group.name)));
    }
    static fromEntries(entries) {
        return entries.map((entry) => this.fromHAREntry(entry, entry.pageref || 'Ungrouped'));
    }
    static fromHAREntry(entry, transactionName) {
        const tags = {
            transaction: transactionName,
            har_entry_id: entry.id,
            recording_started_at: entry.startedDateTime,
        };
        return {
            harEntryId: entry.id,
            transaction: transactionName,
            recordingStartedAt: entry.startedDateTime,
            tags,
            request: {
                method: entry.method,
                url: entry.url,
                headers: entry.headers ?? [],
                queryParams: this.extractQueryParams(entry.url),
                cookies: this.extractCookies(entry.headers ?? [], 'cookie'),
                body: this.buildRequestBody(entry.postData),
            },
            response: {
                status: entry.status,
                headers: entry.responseHeaders ?? [],
                cookies: this.extractCookies(entry.responseHeaders ?? [], 'set-cookie'),
                body: this.normalizeBody(entry.responseBody?.text, entry.responseBody?.encoding, entry.mimeType, entry.url),
            },
        };
    }
    static isBinaryContent(mimeType, url) {
        if (mimeType) {
            const ct = mimeType.split(';')[0].trim().toLowerCase();
            if (this.BINARY_CONTENT_RE.test(ct) || this.BINARY_MIME_TYPES.has(ct)) {
                return `[binary: ${ct}]`;
            }
        }
        if (url && this.STATIC_EXT_RE.test(url)) {
            return '[binary: static asset]';
        }
        return null;
    }
    static normalizeBody(body, encoding, mimeType, url) {
        const binaryTag = this.isBinaryContent(mimeType, url);
        if (binaryTag)
            return binaryTag;
        if (!body)
            return body;
        if ((encoding || '').toLowerCase() !== 'base64') {
            return body;
        }
        try {
            const decoded = Buffer.from(body, 'base64').toString('utf-8');
            if (this.looksReadable(decoded)) {
                return decoded;
            }
        }
        catch {
            // preserve original body when decode fails
        }
        return body;
    }
    static buildRequestBody(postData) {
        if (!postData)
            return undefined;
        if (postData.text !== undefined && postData.text !== '') {
            return postData.text;
        }
        if (!postData.params || postData.params.length === 0) {
            return undefined;
        }
        return postData.params
            .map((param) => `${encodeURIComponent(param.name)}=${encodeURIComponent(param.value ?? '')}`)
            .join('&');
    }
    static looksReadable(value) {
        const trimmed = value.trim();
        return (trimmed.startsWith('<') ||
            trimmed.startsWith('{') ||
            trimmed.startsWith('[') ||
            /[\r\n\t ]/.test(value) ||
            /<!DOCTYPE html>/i.test(value));
    }
    static extractQueryParams(url) {
        try {
            const parsed = new URL(url);
            const params = {};
            parsed.searchParams.forEach((value, key) => {
                params[key] = value;
            });
            return params;
        }
        catch {
            return {};
        }
    }
    static extractCookies(headers, headerName) {
        const matchingHeaders = headers.filter((header) => header.name.toLowerCase() === headerName);
        const cookies = [];
        for (const header of matchingHeaders) {
            const parts = header.value.split(';').map((part) => part.trim()).filter(Boolean);
            const firstToken = parts[0];
            const separatorIndex = firstToken.indexOf('=');
            if (separatorIndex <= 0)
                continue;
            cookies.push({
                name: firstToken.slice(0, separatorIndex),
                value: firstToken.slice(separatorIndex + 1),
            });
        }
        return cookies;
    }
}
exports.ExchangeLogBuilder = ExchangeLogBuilder;
ExchangeLogBuilder.BINARY_CONTENT_RE = /^(?:image|audio|video|font)\//i;
ExchangeLogBuilder.BINARY_MIME_TYPES = new Set([
    'application/octet-stream', 'application/zip', 'application/pdf',
    'application/x-font-ttf', 'application/x-font-woff',
    'application/font-woff', 'application/font-woff2',
    'application/vnd.ms-fontobject',
]);
ExchangeLogBuilder.STATIC_EXT_RE = /\.(?:png|jpe?g|gif|svg|ico|webp|avif|bmp|tiff?|woff2?|ttf|otf|eot|mp[34]|webm|ogg|flac|wav|zip|gz|br|pdf)(?:[?#]|$)/i;
//# sourceMappingURL=ExchangeLog.js.map