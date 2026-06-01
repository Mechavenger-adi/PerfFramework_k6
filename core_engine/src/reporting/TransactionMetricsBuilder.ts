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
  /**
   * Largest single check `fails` value within this group (and its descendants).
   * Used by the legacy aggregation fallback to compute a strict lower bound on
   * failed iterations (`fail = min(count, maxCheckFails)`). This can never
   * falsely report zero failures and matches the per-iteration Rate metric in
   * the common 1-check-per-iteration case.
   */
  maxCheckFails: number;
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

    const allRows = [...groupRows, ...metricOnlyRows].sort((left, right) =>
      left.transaction.localeCompare(right.transaction),
    );
    // Run-level flag: at least one row's pass/fail came from the native-check
    // fallback (no <name>_checkrate Rate metric available). Lets run.ts emit
    // a single console + warnings.ndjson notice without re-scanning the rows.
    const hasEstimatedRows = allRows.some((row) => row.estimated === true);

    return {
      runId: options.runId,
      stats: [...options.stats],
      transactions: allRows,
      ...(hasEstimatedRows ? { hasEstimatedRows: true } : {}),
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

    // ── Pass / fail resolution ───────────────────────────────────────────
    // Two paths, in priority order:
    //
    //  1. PREFERRED — per-iteration Rate metric `<name>_checkrate`.
    //     `transaction()` pushes exactly one `Rate.add(...)` per iteration:
    //     `true` if every k6Check inside passed AND no error was raised,
    //     `false` otherwise. So `passes`/`fails` here ARE the count of
    //     passed/failed transaction iterations — exact, not aggregated from
    //     individual k6 check totals.
    //
    //  2. FALLBACK — derived from native k6 `check()` aggregates (the
    //     summary's `root_group.checks` per-check `passes/fails`). This path
    //     fires when `<name>_checkrate` is missing (older runs, or scripts
    //     that don't go through `transaction()`/`k6Check()`).
    //     Using native check counts here is an ESTIMATE — not a tight bound
    //     in either direction:
    //       - If every check runs exactly once per iteration, max(check.fails)
    //         equals the number of failed iterations (exact).
    //       - If failures spread across MULTIPLE checks in different
    //         iterations, max(check.fails) UNDER-counts (each check captures
    //         only its own failures, not the union across checks).
    //       - If a single check is evaluated MULTIPLE times per iteration
    //         (e.g. a request fires twice in the same transaction body), then
    //         its `fails` count can exceed `count`, and capping at `count`
    //         collapses to "every iteration failed" even when many iterations
    //         were actually clean. (Real-run example: a transaction whose
    //         200-status check ran 3×/iter and failed 221/411 times — capped
    //         to count=137, the formula reports 0 passes; the Rate metric
    //         shows 22 passes.)
    //     We still use `fail = min(count, max(check.fails))` as the best
    //     available estimate when the Rate metric is missing. Rows on this
    //     path are stamped `estimated: true` and a run-level warning fires
    //     so the report and CI never confuse an estimate with ground truth.
    const resultMetric = this.findResultMetric(group.name, allMetrics);
    let pass: number;
    let fail: number;
    let estimated = false;
    if (resultMetric) {
      // Exact per-iteration counts from the framework-pushed Rate metric.
      pass = this.metricValue(resultMetric, 'passes') ?? 0;
      fail = this.metricValue(resultMetric, 'fails') ?? 0;
    } else {
      // Fallback: derive from native k6 check aggregates. Approximate; flagged.
      fail = Math.min(count, group.maxCheckFails);
      pass = Math.max(count - fail, 0);
      estimated = true;
    }
    const row: TransactionMetricRow = {
      journey: options.journeyName,
      transaction: group.name,
      count,
      pass,
      fail,
      errorPct: count > 0 ? Number(((fail / count) * 100).toFixed(2)) : 0,
    };
    // Only stamp the flag when true so JSON output stays minimal for the
    // common case (transactions instrumented with the Rate metric).
    if (estimated) row.estimated = true;

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

  /**
   * Approximate standard deviation from percentile data when handleSummary stddev is absent.
   * Uses normal-distribution relationship p90 = avg + 1.282*σ (or p95 = avg + 1.645*σ).
   */
  private static approximateStddev(metric: SummaryMetric | undefined): number | undefined {
    if (!metric) return undefined;
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

  private static collectGroups(rootGroup?: SummaryGroup): GroupAggregate[] {
    if (!rootGroup?.groups) {
      return [];
    }

    return this.toGroupArray(rootGroup.groups).map((group) => this.aggregateGroup(group)).filter((group) => Boolean(group.name));
  }

  /**
   * Aggregate native k6 `check()` totals for a single root_group node.
   *
   * IMPORTANT — what these numbers are:
   *   k6 records per-check `{ passes, fails }` aggregates under the group the
   *   check executed in. These are NATIVE k6 check counts, NOT per-iteration
   *   transaction outcomes. A single transaction iteration may evaluate the
   *   same check multiple times (multi-request transactions, retry loops), so
   *   summed `passes`/`fails` don't directly map to "iterations passed/failed".
   *
   * This function feeds the legacy aggregation fallback used by `buildGroupRow`
   * when the per-iteration `<name>_checkrate` Rate metric is absent (older
   * runs or scripts that don't use `transaction()`). In that fallback path:
   *   - `count`            ← min(check.passes + check.fails) per check, summed
   *                          across nested groups (rough lower bound on
   *                          transaction iterations when no Counter exists)
   *   - `pass`             ← min(check.passes), summed across nested groups
   *                          (legacy "min of passes" semantic — kept only for
   *                          diagnostic interest; superseded by maxCheckFails)
   *   - `maxCheckFails`    ← max single check's `fails` value across this group
   *                          and descendants. The fallback uses this as a
   *                          best-effort estimate of failed iterations:
   *                          `fail = min(count, maxCheckFails)`. NOT a tight
   *                          bound — it under-counts when failures spread
   *                          across multiple checks and can over-cap to
   *                          `count` when a single check runs multiple times
   *                          per iteration. Best we can do without the Rate
   *                          metric; rows using this path are flagged.
   *
   * The exact, non-estimated values come from `<name>_checkrate` (a Rate
   * metric pushed exactly once per transaction iteration by `transaction()`);
   * see Proposal 3 in `ai_context/design-proposals.md`.
   */
  private static aggregateGroup(group: SummaryGroup): GroupAggregate {
    const checks = this.toCheckArray(group.checks);
    const nested = this.toGroupArray(group.groups).map((child) => this.aggregateGroup(child));

    // count fallback: min(passes + fails) per check. Only used when the
    // <name>_count Counter is also missing (very old runs).
    const checkTotals = checks.map((check) => (check.passes ?? 0) + (check.fails ?? 0));
    const ownCount = checkTotals.length > 0 ? Math.min(...checkTotals) : 0;

    // Legacy pass aggregate: min(check.passes). Buggy when a check runs more
    // than once per iteration — it can exceed `count` and silently mask
    // failures. Retained only to keep historical behavior available if needed.
    const passValues = checks.map((check) => check.passes ?? 0);
    const ownPass = passValues.length > 0 ? Math.min(...passValues) : 0;

    // Fail estimate: the LARGEST single-check `fails` value in this group.
    // NOT a tight mathematical bound — it under-counts when failures spread
    // across multiple checks (the union of failing iterations exceeds any one
    // check's count) and over-counts when a check runs multiple times per
    // iteration (its `fails` can exceed iterationCount, then capping forces
    // "all failed"). Better than the prior `min(check.passes)` formula —
    // which silently reported zero failures whenever a clean check had
    // `passes ≥ count` — but still only an estimate. Exact iteration outcomes
    // require the `<name>_checkrate` Rate metric.
    const failValues = checks.map((check) => check.fails ?? 0);
    const ownMaxFails = failValues.length > 0 ? Math.max(...failValues) : 0;

    const nestedCount = nested.reduce((sum, child) => sum + child.count, 0);
    const nestedPass = nested.reduce((sum, child) => sum + child.pass, 0);
    const nestedMaxFails = nested.reduce((max, child) => Math.max(max, child.maxCheckFails), 0);

    return {
      name: group.name ?? 'Unnamed_Transaction',
      count: ownCount + nestedCount,
      pass: ownPass + nestedPass,
      fail: 0, // placeholder; actual fail computed in buildGroupRow
      maxCheckFails: Math.max(ownMaxFails, nestedMaxFails),
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

  /**
   * Find the <name>_checkrate Rate metric for a transaction, if present.
   * Emitted by transaction() (Proposal 3): one sample per iteration carrying
   * whether that iteration observed any failure (failed k6Check or thrown
   * error). Exact per-iteration counts — no approximation.
   */
  private static findResultMetric(
    groupName: string,
    allMetrics: Record<string, SummaryMetric>,
  ): SummaryMetric | undefined {
    const normalizedGroup = this.normalize(groupName);
    for (const [metricName, metric] of Object.entries(allMetrics)) {
      if (!metricName.endsWith('_checkrate')) continue;
      const baseName = metricName.slice(0, -'_checkrate'.length);
      if (this.normalize(baseName) === normalizedGroup) {
        return metric;
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
    if (normalized === 'stddev' || normalized === 'std dev' || normalized === 'std_dev' || normalized === 'std') return 'stddev';

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
