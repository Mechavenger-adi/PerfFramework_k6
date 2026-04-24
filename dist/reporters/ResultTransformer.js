"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultTransformer = void 0;
class ResultTransformer {
    /**
     * Transforms raw k6 summary JSON into a standardized ResultContract payload.
     */
    static transform(k6Data) {
        return {
            timestamp: new Date().toISOString(),
            totalRequests: k6Data.metrics?.http_reqs?.values?.count || 0,
            httpErrors: k6Data.metrics?.http_req_failed?.values?.passes || 0,
            virtualUsers: k6Data.metrics?.vus?.values?.value || 0,
            data: k6Data.metrics || {}
        };
    }
}
exports.ResultTransformer = ResultTransformer;
//# sourceMappingURL=ResultTransformer.js.map