interface JourneyContext {
    data: Record<string, unknown>;
    session: Record<string, unknown>;
    correlation: Record<string, unknown>;
    meta: Record<string, unknown>;
}
interface JourneyState {
    initialized: boolean;
    ended: boolean;
    terminated: boolean;
}
export interface JourneyLifecycleStore {
    ctx: JourneyContext;
    state: JourneyState;
}
export interface PhaseFns {
    initPhase?: (ctx: JourneyContext) => void;
    actionPhase?: (ctx: JourneyContext) => void;
    endPhase?: (ctx: JourneyContext) => void;
}
export declare function createJourneyLifecycleStore(): JourneyLifecycleStore;
export declare function runJourneyLifecycle(store: JourneyLifecycleStore, phaseFns: PhaseFns): void;
export {};
//# sourceMappingURL=lifecycle.d.ts.map