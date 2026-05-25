import { CiSummary, TimeSeriesFile, TransactionMetricsFile } from '../types/ReportingContracts';

interface BuildRunSummaryOptions {
  runId: string;
  planName: string;
  environment: string;
  executionStatus: number;
  summaryData: {
    metrics?: Record<string, { thresholds?: Record<string, { ok?: boolean }> }>;
  };
  transactions: TransactionMetricsFile;
}

export class RunSummaryBuilder {
  static buildCiSummary(options: BuildRunSummaryOptions): CiSummary {
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

  static buildEmptyTimeseries(startTime: string, bucketSizeSeconds: number): TimeSeriesFile {
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

  private static countThresholdFailures(metrics: Record<string, { thresholds?: Record<string, boolean | { ok?: boolean }> }>): number {
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

  private static collectFailedThresholdRules(
    metrics: Record<string, { thresholds?: Record<string, boolean | { ok?: boolean }> }>,
  ): string[] {
    const failed: string[] = [];
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
  private static isThresholdBreached(value: boolean | { ok?: boolean }): boolean {
    if (typeof value === 'boolean') return value;
    return value.ok === false;
  }

  private static asNumber(value: string | number | undefined): number | undefined {
    return typeof value === 'number' ? value : undefined;
  }
}
