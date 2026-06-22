"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunSummaryBuilder = void 0;
class RunSummaryBuilder {
    static buildCiSummary(options) {
        // Thresholds are still surfaced (table + breach events) but no longer drive
        // the headline pass/fail — that is now governed purely by the transaction
        // failure rate against the configured budget.
        const thresholdFailures = this.countThresholdFailures(options.summaryData.metrics ?? {});
        const failedRules = this.collectFailedThresholdRules(options.summaryData.metrics ?? {});
        // Observed transaction failure rate = Σfail / Σ(pass+fail) across transactions.
        let txnTotal = 0;
        let txnFail = 0;
        for (const row of options.transactions.transactions) {
            txnTotal += (row.pass ?? 0) + (row.fail ?? 0);
            txnFail += row.fail ?? 0;
        }
        const transactionFailureRate = txnTotal > 0 ? (txnFail / txnTotal) * 100 : 0;
        const transactionErrorBudget = options.transactionErrorBudget ?? 0;
        // A genuine execution crash (k6 exit code other than 0 / 99) means the run
        // itself did not complete and the data is unreliable — still a hard fail,
        // independent of the SLA. Exit 99 (thresholds-only) is NOT a fail here.
        const executionCrashed = options.executionStatus !== 0 && options.executionStatus !== 99;
        const status = executionCrashed || transactionFailureRate > transactionErrorBudget
            ? 'failed'
            : 'passed';
        return {
            status,
            runId: options.runId,
            plan: options.planName,
            environment: options.environment,
            thresholdFailures,
            transactionFailureRate,
            transactionErrorBudget,
            errorCount: 0,
            warningCount: 0,
            aborted: false,
            transactions: options.transactions.transactions.map((row) => ({
                name: row.transaction,
                count: row.count,
                // pass/fail are always present for real runs (checkrate-backed); coerce
                // the unreachable off-contract `undefined` to 0 for the CI contract.
                pass: row.pass ?? 0,
                fail: row.fail ?? 0,
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
