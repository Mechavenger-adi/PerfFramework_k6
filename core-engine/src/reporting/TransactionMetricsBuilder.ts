import { TransactionMetricRow, TransactionMetricsFile } from '../types/ReportingContracts';

/**
 * k6 --summary-export metric shape:
 * Trend  → { avg, min, max, med, "p(90)", "p(95)", thresholds? }
 * Rate   → { value, passes, fails, thresholds? }
 * Counter→ { count, rate, thresholds? }
 */
interface SummaryMetric {
  [key: string]: unknown;
  thresholds?: Record<string, { ok?: boolean }>;
}

interface SummaryCheck {
  name?: string;
  passes?: number;
  fails?: number;
}

interface SummaryGroup {
  name?: string;
  groups?: Record<string, SummaryGroup> | SummaryGroup[];
  checks?: Record<string, SummaryCheck> | SummaryCheck[];
}

interface BuildTransactionMetricsOptions {
  runId: string;
  stats: string[];
  journeyName: string;
  summaryData: {
    metrics?: Record<string, SummaryMetric>;
    root_group?: SummaryGroup;
  };
}

interface GroupAggregate {
  name: string;
  count: number;
  pass: number;
  fail: number;
}

export class TransactionMetricsBuilder {
  private static readonly BUILT_IN_METRICS = new Set([
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

  static build(options: BuildTransactionMetricsOptions): TransactionMetricsFile {
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

    return {
      runId: options.runId,
      stats: [...options.stats],
      transactions: [...groupRows, ...metricOnlyRows].sort((left, right) => left.transaction.localeCompare(right.transaction)),
    };
  }

  private static buildGroupRow(
    group: GroupAggregate,
    trendMetrics: Array<{ metricName: string; metric: SummaryMetric }>,
    allMetrics: Record<string, SummaryMetric>,
    options: BuildTransactionMetricsOptions,
  ): TransactionMetricRow {
    const metric = this.findMatchingMetric(group.name, trendMetrics);
    // Prefer Counter metric (<name>_count) for actual startTransaction() call count
    const counterCount = this.findCounterValue(group.name, allMetrics);
    const count = counterCount ?? group.count;
    // pass = min(check.passes) across all checks (times ALL requests succeeded)
    // fail = count - pass (times the transaction was called but not all requests passed)
    const pass = Math.min(group.pass, count);
    const fail = Math.max(count - pass, 0);
    const row: TransactionMetricRow = {
      journey: options.journeyName,
      transaction: group.name,
      count,
      pass,
      fail,
      errorPct: count > 0 ? Number(((fail / count) * 100).toFixed(2)) : 0,
    };

    return this.applyConfiguredStats(row, metric, options.stats);
  }

  private static buildMetricOnlyRow(
    metricName: string,
    metric: SummaryMetric,
    options: BuildTransactionMetricsOptions,
  ): TransactionMetricRow {
    const count = this.metricValue(metric, 'count') ?? 0;
    const row: TransactionMetricRow = {
      journey: options.journeyName,
      transaction: this.displayName(metricName),
      count,
      pass: count,
      fail: 0,
      errorPct: 0,
    };

    return this.applyConfiguredStats(row, metric, options.stats);
  }

  private static applyConfiguredStats(
    row: TransactionMetricRow,
    metric: SummaryMetric | undefined,
    configuredStats: string[],
  ): TransactionMetricRow {
    for (const stat of configuredStats) {
      const targetKey = this.mapStatToMetricValueKey(stat);
      if (!targetKey) {
        continue;
      }

      if (targetKey === 'count') row.count = row.count ?? 0;
      if (targetKey === 'pass') row.pass = row.pass ?? 0;
      if (targetKey === 'fail') row.fail = row.fail ?? 0;
      if (targetKey === 'errorPct') row.errorPct = row.errorPct ?? 0;

      const metricVal = metric ? this.metricValue(metric, targetKey) : undefined;
      if (metricVal !== undefined) {
        row[stat] = metricVal;
        if (targetKey === 'avg') row.avg = metricVal;
        if (targetKey === 'min') row.min = metricVal;
        if (targetKey === 'max') row.max = metricVal;
      } else if (targetKey === 'count') {
        row[stat] = row.count;
      } else if (targetKey === 'pass') {
        row[stat] = row.pass;
      } else if (targetKey === 'fail') {
        row[stat] = row.fail;
      } else if (targetKey === 'errorPct') {
        row[stat] = row.errorPct;
      }
    }

    return row;
  }

  private static collectGroups(rootGroup?: SummaryGroup): GroupAggregate[] {
    if (!rootGroup?.groups) {
      return [];
    }

    return this.toGroupArray(rootGroup.groups).map((group) => this.aggregateGroup(group)).filter((group) => Boolean(group.name));
  }

  private static aggregateGroup(group: SummaryGroup): GroupAggregate {
    const checks = this.toCheckArray(group.checks);
    const nested = this.toGroupArray(group.groups).map((child) => this.aggregateGroup(child));

    // count = min(passes + fails) per check as fallback when Counter metric unavailable
    const checkTotals = checks.map((check) => (check.passes ?? 0) + (check.fails ?? 0));
    const ownCount = checkTotals.length > 0 ? Math.min(...checkTotals) : 0;
    // pass = min(check.passes) = minimum times ALL requests in the transaction passed
    const passValues = checks.map((check) => check.passes ?? 0);
    const ownPass = passValues.length > 0 ? Math.min(...passValues) : 0;
    const nestedCount = nested.reduce((sum, child) => sum + child.count, 0);
    const nestedPass = nested.reduce((sum, child) => sum + child.pass, 0);

    return {
      name: group.name ?? 'Unnamed_Transaction',
      count: ownCount + nestedCount,
      pass: ownPass + nestedPass,
      fail: 0, // placeholder; actual fail = count - pass, computed in buildGroupRow
    };
  }

  /** Normalize k6 summary groups (object-map or array) to array. */
  private static toGroupArray(groups?: Record<string, SummaryGroup> | SummaryGroup[]): SummaryGroup[] {
    if (!groups) return [];
    if (Array.isArray(groups)) return groups;
    return Object.values(groups);
  }

  /** Normalize k6 summary checks (object-map or array) to array. */
  private static toCheckArray(checks?: Record<string, SummaryCheck> | SummaryCheck[]): SummaryCheck[] {
    if (!checks) return [];
    if (Array.isArray(checks)) return checks;
    return Object.values(checks);
  }

  /** Detect Trend metrics by presence of 'avg' (only Trend metrics have it). */
  /** Detect Trend metrics: handleSummary has type:'trend', --summary-export has flat avg. */
  private static isTrend(metric: SummaryMetric): boolean {
    return (metric as any).type === 'trend' || typeof metric.avg === 'number' || typeof (metric as any).values?.avg === 'number';
  }

  /** Read a metric value from either handleSummary (values.key) or --summary-export (flat key). */
  private static metricValue(metric: SummaryMetric, key: string): number | undefined {
    const nested = (metric as any).values?.[key];
    if (typeof nested === 'number') return nested;
    const flat = metric[key];
    return typeof flat === 'number' ? flat : undefined;
  }

  private static isTransactionMetric(
    metricName: string,
    metric: SummaryMetric,
    groups: GroupAggregate[],
  ): boolean {
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

  private static findMatchingMetric(
    groupName: string,
    trendMetrics: Array<{ metricName: string; metric: SummaryMetric }>,
  ): SummaryMetric | undefined {
    const normalizedGroup = this.normalize(groupName);
    const exact = trendMetrics.find(({ metricName }) => this.normalize(this.displayName(metricName)) === normalizedGroup);
    if (exact) {
      return exact.metric;
    }

    const suffix = trendMetrics.find(({ metricName }) => normalizedGroup.endsWith(this.normalize(this.displayName(metricName))));
    return suffix?.metric;
  }

  /** Find <name>_count Counter metric and return its count value. */
  private static findCounterValue(
    groupName: string,
    allMetrics: Record<string, SummaryMetric>,
  ): number | undefined {
    const normalizedGroup = this.normalize(groupName);
    for (const [metricName, metric] of Object.entries(allMetrics)) {
      if (!metricName.endsWith('_count')) continue;
      const baseName = metricName.slice(0, -6);
      if (this.normalize(baseName) === normalizedGroup) {
        return this.metricValue(metric, 'count');
      }
    }
    return undefined;
  }

  private static displayName(metricName: string): string {
    return metricName.startsWith('txn_') ? metricName.slice(4) : metricName;
  }

  private static normalize(value: string): string {
    return value
      .replace(/^txn_/i, '')
      .replace(/^t\d+_/i, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }

  private static mapStatToMetricValueKey(stat: string): string | undefined {
    const normalized = stat.trim().toLowerCase();
    if (normalized === 'count') return 'count';
    if (normalized === 'pass') return 'pass';
    if (normalized === 'fail') return 'fail';
    if (normalized === 'error %' || normalized === 'error%' || normalized === 'errorpct') return 'errorPct';
    if (normalized === 'avg') return 'avg';
    if (normalized === 'min') return 'min';
    if (normalized === 'max') return 'max';

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
