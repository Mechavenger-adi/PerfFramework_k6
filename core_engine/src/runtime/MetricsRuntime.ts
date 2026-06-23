export interface TransactionAggregate {
  count: number;
  pass: number;
  fail: number;
  durations: number[];
}

export class MetricsRuntime {
  private readonly transactionMetrics = new Map<string, TransactionAggregate>();

  recordTransaction(transaction: string, durationMs: number, passed: boolean): void {
    const current = this.transactionMetrics.get(transaction) ?? {
      count: 0,
      pass: 0,
      fail: 0,
      durations: [],
    };

    current.count += 1;
    current.pass += passed ? 1 : 0;
    current.fail += passed ? 0 : 1;
    current.durations.push(durationMs);
    this.transactionMetrics.set(transaction, current);
  }

  getSnapshot(): Record<string, TransactionAggregate> {
    return Object.fromEntries(this.transactionMetrics.entries());
  }
}
