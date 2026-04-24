import { ErrorBehavior } from '../types/ConfigContracts';
import { AgentContext, ErrorCause, ErrorEvent, SnapshotReference, VariableUsage, WarningEvent } from '../types/EventContracts';
export interface ErrorRuntimeContext {
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
    behavior: ErrorBehavior;
    agent?: AgentContext;
}
export declare class ErrorRuntime {
    static buildErrorEvent(ctx: ErrorRuntimeContext, type: string, message: string, extras?: {
        cause?: ErrorCause;
        correlation?: VariableUsage;
        data?: VariableUsage;
        snapshot?: SnapshotReference;
    }): ErrorEvent;
    static buildWarningEvent(runId: string, type: string, message: string, extras?: Partial<WarningEvent>): WarningEvent;
}
//# sourceMappingURL=ErrorRuntime.d.ts.map