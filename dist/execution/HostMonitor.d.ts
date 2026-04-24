import { MonitoringConfig } from '../types/ConfigContracts';
import { AgentContext, WarningEvent } from '../types/EventContracts';
export interface HostSnapshot {
    ts: string;
    cpuPercent: number;
    memoryPercent: number;
    agent: AgentContext;
}
export declare class HostMonitor {
    static captureSnapshot(): Promise<HostSnapshot>;
    static buildWarnings(runId: string, config: MonitoringConfig, snapshots: HostSnapshot[]): WarningEvent[];
    static startPeriodicSampling(config: MonitoringConfig, snapshots: HostSnapshot[]): {
        stop: () => Promise<void>;
    };
    private static buildAgentContext;
    private static readCpuTimes;
    private static delay;
}
//# sourceMappingURL=HostMonitor.d.ts.map