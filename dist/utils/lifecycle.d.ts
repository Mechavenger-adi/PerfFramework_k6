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
export declare function thinktime(minOrFixed?: number, max?: number): void;
export interface TransactionGate {
    shouldSkipBeforeStart: boolean;
    errorBehavior: string;
    onSkip: (name: string) => void;
}
export declare function getTransactionGate(): TransactionGate;
/**
 * Script-facing: true once this VU has reached its logout deadline. Use it as the
 * guard of a long action loop so the loop bails out near the deadline instead of
 * overrunning it:
 *
 *   while (!isEnding()) { transaction('search', () => {...}); thinktime(); }
 *
 * Only meaningful for the ramping (time-deadline) family; returns false otherwise.
 */
export declare function isEnding(): boolean;
/**
 * Per-VU lifecycle shell. Runs initPhase once, then actionPhase per iteration,
 * and proactively runs endPhase a margin BEFORE k6 culls the VU (deadline ranked
 * by onboarding time so it matches k6's handle cull order). Covers every
 * executor family via computeEndPlan: ramping (time deadline), count
 * (per-vu/shared iterations), arrival (action-only), external (best-effort).
 */
export declare function runJourneyLifecycle(store: JourneyLifecycleStore, phaseFns: PhaseFns): void;
export {};
