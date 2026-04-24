export interface TransactionAggregate {
    count: number;
    pass: number;
    fail: number;
    durations: number[];
}
export declare class MetricsRuntime {
    private readonly transactionMetrics;
    recordTransaction(transaction: string, durationMs: number, passed: boolean): void;
    getSnapshot(): Record<string, TransactionAggregate>;
}
//# sourceMappingURL=MetricsRuntime.d.ts.map