import { HostSnapshot } from '../execution/HostMonitor';
import { AgentContext, ErrorEvent, WarningEvent } from '../types/EventContracts';
import { TimeSeriesFile, TransactionMetricsFile } from '../types/ReportingContracts';
interface SummaryMetric {
    values?: Record<string, number>;
    [key: string]: unknown;
}
interface BuildTimeseriesArtifactOptions {
    bucketSizeSeconds: number;
    startTime: string;
    endTime: string;
    summaryData: {
        metrics?: Record<string, SummaryMetric>;
    };
    transactions: TransactionMetricsFile;
    errors: ErrorEvent[];
    warnings: WarningEvent[];
    agents: AgentContext[];
    systemSnapshots: HostSnapshot[];
}
export declare class TimeseriesArtifactBuilder {
    static build(options: BuildTimeseriesArtifactOptions): TimeSeriesFile;
    private static asNumber;
}
export {};
//# sourceMappingURL=TimeseriesArtifactBuilder.d.ts.map