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
/**
 * Returns the framework-configured think time in seconds.
 *
 * Reads the thinkTime block from K6_PERF_RUNTIME_METADATA:
 *   - mode 'fixed' → returns `fixed` value (default 1s)
 *   - mode 'random' → returns random value in [min, max] (defaults 0.5–3s)
 *
 * Falls back to 1 second when no runtime metadata is available.
 */
export declare function getFrameworkThinkTime(): number;
export declare function runJourneyLifecycle(store: JourneyLifecycleStore, phaseFns: PhaseFns): void;
export {};
//# sourceMappingURL=lifecycle.d.ts.map