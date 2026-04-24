import { ErrorBehavior } from '../types/ConfigContracts';
export type JourneyPhase = 'init' | 'action' | 'end';
export interface JourneyContext {
    data: Record<string, unknown>;
    session: Record<string, unknown>;
    correlation: Record<string, unknown>;
    meta: Record<string, unknown>;
}
export interface LifecyclePhaseFns {
    initPhase?: (ctx: JourneyContext) => void;
    actionPhase: (ctx: JourneyContext) => void;
    endPhase?: (ctx: JourneyContext) => void;
}
export interface LifecycleRunState {
    initialized: boolean;
    ended: boolean;
    terminated: boolean;
    currentWindow: number;
}
export interface LifecycleDecision {
    runInit: boolean;
    runAction: boolean;
    runEnd: boolean;
    idle: boolean;
}
export declare class LifecycleRuntime {
    static createContext(): JourneyContext;
    static createState(): LifecycleRunState;
    static decide(state: LifecycleRunState, shouldEndNow: boolean): LifecycleDecision;
    static applyErrorBehavior(state: LifecycleRunState, behavior: ErrorBehavior): 'continue' | 'stop_iteration' | 'stop_vu' | 'abort_test';
}
//# sourceMappingURL=LifecycleRuntime.d.ts.map