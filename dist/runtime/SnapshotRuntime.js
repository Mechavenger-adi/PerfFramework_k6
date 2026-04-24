"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnapshotRuntime = void 0;
class SnapshotRuntime {
    constructor(config) {
        this.config = config;
        this.snapshotCount = 0;
    }
    shouldCapture(type) {
        if (!this.config.captureSnapshotOnFailure)
            return false;
        if (this.snapshotCount >= this.config.maxSnapshotsPerRun)
            return false;
        return new Set([
            'http_request_failed',
            'timeout',
            'connection_error',
            'correlation_missing',
            'runtime_exception',
        ]).has(type);
    }
    register(path) {
        this.snapshotCount += 1;
        return {
            captured: true,
            path,
        };
    }
    buildPayload(payload) {
        return {
            ...payload,
            request: {
                method: payload.request?.method,
                url: payload.request?.url,
                headers: this.config.includeRequestHeaders ? payload.request?.headers : undefined,
                body: this.config.includeRequestBody ? payload.request?.body : undefined,
            },
            response: {
                status: payload.response?.status,
                headers: this.config.includeResponseHeaders ? payload.response?.headers : undefined,
                body: this.config.includeResponseBody ? payload.response?.body : undefined,
            },
        };
    }
}
exports.SnapshotRuntime = SnapshotRuntime;
//# sourceMappingURL=SnapshotRuntime.js.map