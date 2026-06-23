import { TimeSeriesFile } from '../types/ReportingContracts';
export declare class TimeseriesRuntime {
    private readonly bucketSizeSeconds;
    private readonly startTime;
    private readonly overview;
    private readonly transactions;
    private readonly requests;
    private readonly system;
    private readonly events;
    constructor(bucketSizeSeconds: number, startTime: string);
    private bucketTs;
    addOverviewPoint(ts: string, values: Record<string, number>): void;
    addTransactionPoint(transaction: string, ts: string, values: Record<string, number | number[]>): void;
    /**
     * Per-request bucket point. Numeric values (count/failed/durations…) merge the
     * same way as transactions (sum numbers, concat sample arrays); string values
     * (method/transaction/url metadata) are constant per request name and simply
     * overwrite so they survive bucket merges without string concatenation.
     */
    addRequestPoint(request: string, ts: string, values: Record<string, number | number[] | string>): void;
    addSystemPoint(agent: string, ts: string, values: Record<string, number>): void;
    addEvent(ts: string, type: string, severity: 'error' | 'warning', transaction?: string): void;
    build(endTime: string): TimeSeriesFile;
}
