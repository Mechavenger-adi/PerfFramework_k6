"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FRAMEWORK_DEFAULTS = void 0;
// ---------------------------------------------
// Framework Defaults
// ---------------------------------------------
exports.FRAMEWORK_DEFAULTS = {
    thinkTime: { mode: 'fixed', fixed: 1 },
    pacing: { enabled: false },
    http: { timeoutSeconds: 60, maxRedirects: 10, throwOnError: false },
    errorBehavior: 'continue',
    reporting: {
        transactionStats: ['count', 'pass', 'fail', 'avg', 'min', 'max', 'p(90)', 'p(95)'],
        includeTransactionTable: true,
        includeErrorTable: true,
        overrideExistingResults: false,
        timeseries: {
            enabled: true,
            // Default 1-second granularity per Proposal 5. Users can raise this
            // for long-running tests where HTML size or memory matter.
            bucketSizeSeconds: 1,
            keepRawMetricsStream: true,
        },
    },
    errors: {
        captureSnapshotOnFailure: true,
        maxSnapshotsPerRun: 20,
        includeRequestHeaders: true,
        includeRequestBody: true,
        includeResponseHeaders: true,
        includeResponseBody: false,
    },
    monitoring: {
        enabled: false,
        cpuWarningPercent: 80,
        memoryWarningPercent: 80,
        sampleIntervalSeconds: 10,
    },
    debugMode: false,
};
