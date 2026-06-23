import { TimeSeriesFile, TimeSeriesPoint } from '../types/ReportingContracts';

export class TimeseriesRuntime {
  private readonly overview = new Map<string, TimeSeriesPoint>();
  private readonly transactions = new Map<string, Map<string, TimeSeriesPoint>>();
  private readonly requests = new Map<string, Map<string, TimeSeriesPoint>>();
  private readonly system = new Map<string, Map<string, TimeSeriesPoint>>();
  private readonly events: TimeSeriesFile['series']['events'] = [];

  constructor(
    private readonly bucketSizeSeconds: number,
    private readonly startTime: string,
  ) {}

  private bucketTs(ts: string): string {
    const ms = new Date(ts).getTime();
    const bucketMs = this.bucketSizeSeconds * 1000;
    return new Date(Math.floor(ms / bucketMs) * bucketMs).toISOString();
  }

  addOverviewPoint(ts: string, values: Record<string, number>): void {
    const bucket = this.bucketTs(ts);
    const existing = this.overview.get(bucket) ?? { ts: bucket };
    for (const [key, value] of Object.entries(values)) {
      existing[key] = ((existing[key] as number | undefined) ?? 0) + value;
    }
    this.overview.set(bucket, existing);
  }

  addTransactionPoint(transaction: string, ts: string, values: Record<string, number | number[]>): void {
    const bucket = this.bucketTs(ts);
    const bucketMap = this.transactions.get(transaction) ?? new Map<string, TimeSeriesPoint>();
    const existing = bucketMap.get(bucket) ?? { ts: bucket };
    for (const [key, value] of Object.entries(values)) {
      if (Array.isArray(value)) {
        // Raw sample arrays (e.g. durations) are concatenated, not summed, when
        // multiple source buckets fall into the same runtime bucket.
        const prev = (existing[key] as number[] | undefined) ?? [];
        existing[key] = prev.concat(value);
      } else {
        existing[key] = ((existing[key] as number | undefined) ?? 0) + value;
      }
    }
    bucketMap.set(bucket, existing);
    this.transactions.set(transaction, bucketMap);
  }

  /**
   * Per-request bucket point. Numeric values (count/failed/durations…) merge the
   * same way as transactions (sum numbers, concat sample arrays); string values
   * (method/transaction/url metadata) are constant per request name and simply
   * overwrite so they survive bucket merges without string concatenation.
   */
  addRequestPoint(request: string, ts: string, values: Record<string, number | number[] | string>): void {
    const bucket = this.bucketTs(ts);
    const bucketMap = this.requests.get(request) ?? new Map<string, TimeSeriesPoint>();
    const existing = bucketMap.get(bucket) ?? { ts: bucket };
    for (const [key, value] of Object.entries(values)) {
      if (Array.isArray(value)) {
        const prev = (existing[key] as number[] | undefined) ?? [];
        existing[key] = prev.concat(value);
      } else if (typeof value === 'string') {
        existing[key] = value;
      } else {
        existing[key] = ((existing[key] as number | undefined) ?? 0) + value;
      }
    }
    bucketMap.set(bucket, existing);
    this.requests.set(request, bucketMap);
  }

  addSystemPoint(agent: string, ts: string, values: Record<string, number>): void {
    const bucket = this.bucketTs(ts);
    const bucketMap = this.system.get(agent) ?? new Map<string, TimeSeriesPoint>();
    const existing = bucketMap.get(bucket) ?? { ts: bucket };
    for (const [key, value] of Object.entries(values)) {
      existing[key] = value;
    }
    bucketMap.set(bucket, existing);
    this.system.set(agent, bucketMap);
  }

  addEvent(ts: string, type: string, severity: 'error' | 'warning', transaction?: string): void {
    this.events.push({ ts, type, transaction, severity });
  }

  build(endTime: string): TimeSeriesFile {
    return {
      bucketSizeSeconds: this.bucketSizeSeconds,
      startTime: this.startTime,
      endTime,
      series: {
        overview: [...this.overview.values()].sort((a, b) => String(a.ts).localeCompare(String(b.ts))),
        transactions: Object.fromEntries(
          [...this.transactions.entries()].map(([transaction, bucketMap]) => [
            transaction,
            [...bucketMap.values()].sort((a, b) => String(a.ts).localeCompare(String(b.ts))),
          ]),
        ),
        requests: Object.fromEntries(
          [...this.requests.entries()].map(([request, bucketMap]) => [
            request,
            [...bucketMap.values()].sort((a, b) => String(a.ts).localeCompare(String(b.ts))),
          ]),
        ),
        system: Object.fromEntries(
          [...this.system.entries()].map(([agent, bucketMap]) => [
            agent,
            [...bucketMap.values()].sort((a, b) => String(a.ts).localeCompare(String(b.ts))),
          ]),
        ),
        events: [...this.events].sort((a, b) => a.ts.localeCompare(b.ts)),
      },
    };
  }
}
