import { AgentContext } from './EventContracts';

export interface TransactionMetricRow {
  journey: string;
  transaction: string;
  count: number;
  pass: number;
  fail: number;
  errorPct?: number;
  avg?: number;
  min?: number;
  max?: number;
  [stat: string]: string | number | undefined;
}

export interface TransactionMetricsFile {
  runId: string;
  stats: string[];
  transactions: TransactionMetricRow[];
}

export interface CiTransactionSummary {
  name: string;
  count: number;
  pass: number;
  fail: number;
  errorPct?: number;
  avg?: number;
  min?: number;
  max?: number;
  p95?: number;
  p99?: number;
}

export interface CiSummary {
  status: 'passed' | 'failed' | 'aborted';
  runId: string;
  plan: string;
  environment: string;
  thresholdFailures: number;
  errorCount: number;
  warningCount: number;
  aborted: boolean;
  transactions: CiTransactionSummary[];
  gate: {
    failedRules: string[];
  };
}

export interface TimeSeriesPoint {
  ts: string;
  [key: string]: string | number | undefined;
}

export interface TimeSeriesFile {
  bucketSizeSeconds: number;
  startTime: string;
  endTime: string;
  series: {
    overview: TimeSeriesPoint[];
    transactions: Record<string, TimeSeriesPoint[]>;
    system: Record<string, TimeSeriesPoint[]>;
    events: Array<{
      ts: string;
      type: string;
      transaction?: string;
      severity: 'error' | 'warning';
    }>;
  };
}

export interface ReportBundleMeta {
  runId: string;
  plan: string;
  environment: string;
  startTime: string;
  endTime: string;
  status: 'passed' | 'failed' | 'aborted';
  bucketSizeSeconds: number;
}

export interface ReportBundleConfig {
  transactionStats: string[];
  defaultTopTransactions: number;
  timeseriesEnabled: boolean;
}

export interface ReportBundle {
  meta: ReportBundleMeta;
  config: ReportBundleConfig;
  summary: Record<string, unknown>;
  transactions: TransactionMetricsFile;
  timeseries: TimeSeriesFile;
  errors: Array<Record<string, unknown>>;
  warnings: Array<Record<string, unknown>>;
  snapshots: Array<Record<string, unknown>>;
  system: {
    agents: AgentContext[];
    [key: string]: unknown;
  };
}
