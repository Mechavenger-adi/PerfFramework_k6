"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionMetricsBuilder = void 0;
class TransactionMetricsBuilder {
    static build(options) {
        const metrics = options.summaryData.metrics ?? {};
        const groups = this.collectGroups(options.summaryData.root_group);
        const trendMetrics = Object.entries(metrics)
            .filter(([metricName, metric]) => this.isTransactionMetric(metricName, metric, groups))
            .map(([metricName, metric]) => ({ metricName, metric }));
        const groupRows = groups.map((group) => this.buildGroupRow(group, trendMetrics, metrics, options));
        const knownNormalizedNames = new Set(groupRows.map((row) => this.normalize(row.transaction)));
        const metricOnlyRows = trendMetrics
            .filter(({ metricName }) => !knownNormalizedNames.has(this.normalize(this.displayName(metricName))))
            .map(({ metricName, metric }) => this.buildMetricOnlyRow(metricName, metric, options));
        const allRows = [...groupRows, ...metricOnlyRows].sort((left, right) => left.transaction.localeCompare(right.transaction));
        return {
            runId: options.runId,
            stats: [...options.stats],
            transactions: allRows,
        };
    }
    static buildGroupRow(group, trendMetrics, allMetrics, options) {
        const metric = this.findMatchingMetric(group.name, trendMetrics);
        // Prefer Counter metric (<name>_count) for actual startTransaction() call count
        const counterCount = this.findCounterValue(group.name, allMetrics);
        const count = counterCount ?? group.count;
        // ── Pass / fail resolution ───────────────────────────────────────────
        // EXACT per-iteration counts from the `<name>_checkrate` Rate metric, which
        // `transaction()` pushes once per iteration: `true` when every k6Check
        // inside passed AND no error was raised, `false` otherwise. So `passes`/
        // `fails` ARE the count of passed/failed transaction iterations.
        //
        // There is no estimation fallback: the pre-flight ScriptContractGuard
        // rejects scripts that use raw k6 `check()` or `group()`, so every
        // transaction in a runnable script always has this metric. In the
        // off-contract case where it's somehow absent, pass/fail are left undefined
        // and the report shows "—" rather than fabricating a 0-fail row.
        const resultMetric = this.findResultMetric(group.name, allMetrics);
        let pass;
        let fail;
        if (resultMetric) {
            pass = this.metricValue(resultMetric, 'passes') ?? 0;
            fail = this.metricValue(resultMetric, 'fails') ?? 0;
        }
        const row = {
            journey: options.journeyName,
            transaction: group.name,
            count,
            pass,
            fail,
            errorPct: fail !== undefined && count > 0 ? Number(((fail / count) * 100).toFixed(2)) : undefined,
        };
        return this.applyConfiguredStats(row, metric, options.stats);
    }
    static buildMetricOnlyRow(metricName, metric, options) {
        const count = this.metricValue(metric, 'count') ?? 0;
        const row = {
            journey: options.journeyName,
            transaction: this.displayName(metricName),
            count,
            pass: count,
            fail: 0,
            errorPct: 0,
        };
        return this.applyConfiguredStats(row, metric, options.stats);
    }
    static applyConfiguredStats(row, metric, configuredStats) {
        for (const stat of configuredStats) {
            const targetKey = this.mapStatToMetricValueKey(stat);
            if (!targetKey) {
                continue;
            }
            if (targetKey === 'stddev') {
                // handleSummary.json includes values.stddev (exact population std dev from k6).
                // Fall back to percentile approximation only when the real value is absent.
                const realStddev = metric ? this.metricValue(metric, 'stddev') : undefined;
                const stddev = realStddev !== undefined ? Math.round(realStddev) : this.approximateStddev(metric);
                if (stddev !== undefined) {
                    row[stat] = stddev;
                    row.stddev = stddev;
                }
                continue;
            }
            if (targetKey === 'count')
                row.count = row.count ?? 0;
            // pass/fail/errorPct are intentionally NOT coerced to 0 — an off-contract
            // transaction with no checkrate keeps them undefined so the column renders
            // "—" instead of a fabricated 0-fail (see TransactionMetricRow).
            const metricVal = metric ? this.metricValue(metric, targetKey) : undefined;
            if (metricVal !== undefined) {
                row[stat] = metricVal;
                if (targetKey === 'avg')
                    row.avg = metricVal;
                if (targetKey === 'min')
                    row.min = metricVal;
                if (targetKey === 'max')
                    row.max = metricVal;
            }
            else if (targetKey === 'count') {
                row[stat] = row.count;
            }
            else if (targetKey === 'pass') {
                row[stat] = row.pass;
            }
            else if (targetKey === 'fail') {
                row[stat] = row.fail;
            }
            else if (targetKey === 'errorPct') {
                row[stat] = row.errorPct;
            }
        }
        return row;
    }
    /**
     * Approximate standard deviation from percentile data when handleSummary stddev is absent.
     * Uses normal-distribution relationship p90 = avg + 1.282*σ (or p95 = avg + 1.645*σ).
     */
    static approximateStddev(metric) {
        if (!metric)
            return undefined;
        const avg = this.metricValue(metric, 'avg');
        const p90 = this.metricValue(metric, 'p(90)');
        const p95 = this.metricValue(metric, 'p(95)');
        const minVal = this.metricValue(metric, 'min');
        const maxVal = this.metricValue(metric, 'max');
        if (avg !== undefined && p90 !== undefined && p90 >= avg) {
            return Math.round((p90 - avg) / 1.282);
        }
        if (avg !== undefined && p95 !== undefined && p95 >= avg) {
            return Math.round((p95 - avg) / 1.645);
        }
        if (minVal !== undefined && maxVal !== undefined && maxVal > minVal) {
            return Math.round((maxVal - minVal) / 4);
        }
        return undefined;
    }
    static collectGroups(rootGroup) {
        if (!rootGroup?.groups) {
            return [];
        }
        return this.toGroupArray(rootGroup.groups).map((group) => this.aggregateGroup(group)).filter((group) => Boolean(group.name));
    }
    /**
     * Collect a group's name and a last-resort iteration count from a root_group
     * node. The count (min of each check's total executions, plus nested groups)
     * is used only when the `<name>_count` Counter is missing. Pass/fail are NOT
     * derived here — they come exclusively from the `<name>_checkrate` Rate metric
     * in `buildGroupRow`. (The native-check estimation that used to live here was
     * removed: the pre-flight ScriptContractGuard rejects raw `check()`/`group()`,
     * so every runnable transaction always has the Rate metric.)
     */
    static aggregateGroup(group) {
        const checks = this.toCheckArray(group.checks);
        const nested = this.toGroupArray(group.groups).map((child) => this.aggregateGroup(child));
        const checkTotals = checks.map((check) => (check.passes ?? 0) + (check.fails ?? 0));
        const ownCount = checkTotals.length > 0 ? Math.min(...checkTotals) : 0;
        const nestedCount = nested.reduce((sum, child) => sum + child.count, 0);
        return {
            name: group.name ?? 'Unnamed_Transaction',
            count: ownCount + nestedCount,
        };
    }
    /** Normalize k6 summary groups (object-map or array) to array. */
    static toGroupArray(groups) {
        if (!groups)
            return [];
        if (Array.isArray(groups))
            return groups;
        return Object.values(groups);
    }
    /** Normalize k6 summary checks (object-map or array) to array. */
    static toCheckArray(checks) {
        if (!checks)
            return [];
        if (Array.isArray(checks))
            return checks;
        return Object.values(checks);
    }
    /** Detect Trend metrics by presence of 'avg' (only Trend metrics have it). */
    /** Detect Trend metrics: handleSummary has type:'trend', --summary-export has flat avg. */
    static isTrend(metric) {
        return metric.type === 'trend' || typeof metric.avg === 'number' || typeof metric.values?.avg === 'number';
    }
    /** Read a metric value from either handleSummary (values.key) or --summary-export (flat key). */
    static metricValue(metric, key) {
        const nested = metric.values?.[key];
        if (typeof nested === 'number')
            return nested;
        const flat = metric[key];
        return typeof flat === 'number' ? flat : undefined;
    }
    static isTransactionMetric(metricName, metric, groups) {
        if (!this.isTrend(metric)) {
            return false;
        }
        if (this.BUILT_IN_METRICS.has(metricName)) {
            return false;
        }
        if (metricName.startsWith('txn_')) {
            return true;
        }
        const normalizedMetric = this.normalize(this.displayName(metricName));
        return groups.some((group) => this.normalize(group.name) === normalizedMetric);
    }
    static findMatchingMetric(groupName, trendMetrics) {
        const normalizedGroup = this.normalize(groupName);
        const exact = trendMetrics.find(({ metricName }) => this.normalize(this.displayName(metricName)) === normalizedGroup);
        if (exact) {
            return exact.metric;
        }
        const suffix = trendMetrics.find(({ metricName }) => normalizedGroup.endsWith(this.normalize(this.displayName(metricName))));
        return suffix?.metric;
    }
    /** Find <name>_count Counter metric and return its count value. */
    static findCounterValue(groupName, allMetrics) {
        const normalizedGroup = this.normalize(groupName);
        for (const [metricName, metric] of Object.entries(allMetrics)) {
            if (!metricName.endsWith('_count'))
                continue;
            const baseName = metricName.slice(0, -6);
            if (this.normalize(baseName) === normalizedGroup) {
                return this.metricValue(metric, 'count');
            }
        }
        return undefined;
    }
    /**
     * Find the <name>_checkrate Rate metric for a transaction, if present.
     * Emitted by transaction() (Proposal 3): one sample per iteration carrying
     * whether that iteration observed any failure (failed k6Check or thrown
     * error). Exact per-iteration counts — no approximation.
     */
    static findResultMetric(groupName, allMetrics) {
        const normalizedGroup = this.normalize(groupName);
        for (const [metricName, metric] of Object.entries(allMetrics)) {
            if (!metricName.endsWith('_checkrate'))
                continue;
            const baseName = metricName.slice(0, -'_checkrate'.length);
            if (this.normalize(baseName) === normalizedGroup) {
                return metric;
            }
        }
        return undefined;
    }
    static displayName(metricName) {
        return metricName.startsWith('txn_') ? metricName.slice(4) : metricName;
    }
    static normalize(value) {
        return value
            .replace(/^txn_/i, '')
            .replace(/^t\d+_/i, '')
            .replace(/[^a-zA-Z0-9]/g, '')
            .toLowerCase();
    }
    static mapStatToMetricValueKey(stat) {
        const normalized = stat.trim().toLowerCase();
        if (normalized === 'count')
            return 'count';
        if (normalized === 'pass')
            return 'pass';
        if (normalized === 'fail')
            return 'fail';
        if (normalized === 'error %' || normalized === 'error%' || normalized === 'errorpct')
            return 'errorPct';
        if (normalized === 'avg')
            return 'avg';
        if (normalized === 'min')
            return 'min';
        if (normalized === 'max')
            return 'max';
        if (normalized === 'stddev' || normalized === 'std dev' || normalized === 'std_dev' || normalized === 'std')
            return 'stddev';
        const percentileMatch = normalized.match(/^p\((\d+(?:\.\d+)?)\)$/);
        if (percentileMatch) {
            return `p(${percentileMatch[1]})`;
        }
        const shorthandMatch = normalized.match(/^p(\d+(?:\.\d+)?)$/);
        if (shorthandMatch) {
            return `p(${shorthandMatch[1]})`;
        }
        return undefined;
    }
}
exports.TransactionMetricsBuilder = TransactionMetricsBuilder;
TransactionMetricsBuilder.BUILT_IN_METRICS = new Set([
    'checks',
    'data_received',
    'data_sent',
    'dropped_iterations',
    'group_duration',
    'http_req_blocked',
    'http_req_connecting',
    'http_req_duration',
    'http_req_duration{expected_response:true}',
    'http_req_failed',
    'http_req_receiving',
    'http_req_sending',
    'http_req_tls_handshaking',
    'http_req_waiting',
    'http_reqs',
    'iteration_duration',
    'iterations',
    'vus',
    'vus_max',
]);
