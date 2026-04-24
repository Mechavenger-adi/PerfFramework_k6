"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunSummaryBuilder = void 0;
class RunSummaryBuilder {
    static buildCiSummary(options) {
        const thresholdFailures = this.countThresholdFailures(options.summaryData.metrics ?? {});
        const failedRules = this.collectFailedThresholdRules(options.summaryData.metrics ?? {});
        const status = options.executionStatus !== 0
            ? 'failed'
            : thresholdFailures > 0
                ? 'failed'
                : 'passed';
        return {
            status,
            runId: options.runId,
            plan: options.planName,
            environment: options.environment,
            thresholdFailures,
            errorCount: 0,
            warningCount: 0,
            aborted: false,
            transactions: options.transactions.transactions.map((row) => ({
                name: row.transaction,
                count: row.count,
                pass: row.pass,
                fail: row.fail,
                errorPct: row.errorPct,
                avg: row.avg,
                min: row.min,
                max: row.max,
                p95: this.asNumber(row['p(95)'] ?? row['p95']),
                p99: this.asNumber(row['p(99)'] ?? row['p99']),
            })),
            gate: {
                failedRules,
            },
        };
    }
    static buildEmptyTimeseries(startTime, bucketSizeSeconds) {
        return {
            bucketSizeSeconds,
            startTime,
            endTime: new Date().toISOString(),
            series: {
                overview: [],
                transactions: {},
                system: {},
                events: [],
            },
        };
    }
    static countThresholdFailures(metrics) {
        let failures = 0;
        for (const metric of Object.values(metrics)) {
            for (const threshold of Object.values(metric.thresholds ?? {})) {
                if (this.isThresholdBreached(threshold)) {
                    failures += 1;
                }
            }
        }
        return failures;
    }
    static collectFailedThresholdRules(metrics) {
        const failed = [];
        for (const [metricName, metric] of Object.entries(metrics)) {
            for (const [rule, result] of Object.entries(metric.thresholds ?? {})) {
                if (this.isThresholdBreached(result)) {
                    failed.push(`${metricName}:${rule}`);
                }
            }
        }
        return failed;
    }
    /** k6 --summary-export: true = breached. handleSummary: { ok: false } = breached. */
    static isThresholdBreached(value) {
        if (typeof value === 'boolean')
            return value;
        return value.ok === false;
    }
    static asNumber(value) {
        return typeof value === 'number' ? value : undefined;
    }
}
exports.RunSummaryBuilder = RunSummaryBuilder;
//# sourceMappingURL=RunSummaryBuilder.js.map