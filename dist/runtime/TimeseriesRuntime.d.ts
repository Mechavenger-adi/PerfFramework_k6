import { TimeSeriesFile } from '../types/ReportingContracts';
export declare class TimeseriesRuntime {
    private readonly bucketSizeSeconds;
    private readonly startTime;
    private readonly overview;
    private readonly transactions;
    private readonly system;
    private readonly events;
    constructor(bucketSizeSeconds: number, startTime: string);
    private bucketTs;
    addOverviewPoint(ts: string, values: Record<string, number>): void;
    addTransactionPoint(transaction: string, ts: string, values: Record<string, number>): void;
    addSystemPoint(agent: string, ts: string, values: Record<string, number>): void;
    addEvent(ts: string, type: string, severity: 'error' | 'warning', transaction?: string): void;
    build(endTime: string): TimeSeriesFile;
}
//# sourceMappingURL=TimeseriesRuntime.d.ts.map