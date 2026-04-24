import { ErrorBehavior } from './ConfigContracts';
export type EventLevel = 'error' | 'warning';
export interface AgentContext {
    host?: string;
    pid?: number;
    jobId?: string;
    containerId?: string;
}
export interface ErrorCause {
    kind: string;
    code?: string;
    detail?: string;
}
export interface VariableUsage {
    missing?: string[];
    used?: Record<string, string | number | boolean | null>;
}
export interface SnapshotReference {
    captured: boolean;
    path?: string;
}
export interface ErrorEvent {
    ts: string;
    level: 'error';
    type: string;
    runId: string;
    plan?: string;
    environment?: string;
    journey: string;
    scenario?: string;
    transaction: string;
    requestName?: string;
    requestId?: string;
    method?: string;
    url?: string;
    status?: number;
    vu: number | null;
    iteration: number | null;
    phase: 'init' | 'action' | 'end' | 'unknown';
    agent?: AgentContext;
    behavior: ErrorBehavior;
    message: string;
    cause?: ErrorCause;
    correlation?: VariableUsage;
    data?: VariableUsage;
    snapshot?: SnapshotReference;
}
export interface WarningMetric {
    name: string;
    value: number;
    threshold?: number;
}
export interface WarningEvent {
    ts: string;
    level: 'warning';
    type: string;
    runId: string;
    plan?: string;
    environment?: string;
    journey?: string;
    scenario?: string;
    transaction?: string;
    requestName?: string;
    vu?: number;
    iteration?: number;
    phase?: 'init' | 'action' | 'end' | 'unknown';
    agent?: AgentContext;
    message: string;
    metric?: WarningMetric;
}
export interface SnapshotPayload {
    ts: string;
    type: string;
    journey: string;
    transaction: string;
    requestName?: string;
    vu: number;
    iteration: number;
    phase: 'init' | 'action' | 'end' | 'unknown';
    request?: {
        method?: string;
        url?: string;
        headers?: Record<string, string>;
        body?: string | null;
    };
    response?: {
        status?: number;
        headers?: Record<string, string>;
        body?: string | null;
    };
    correlation?: VariableUsage;
    data?: VariableUsage;
}
//# sourceMappingURL=EventContracts.d.ts.map