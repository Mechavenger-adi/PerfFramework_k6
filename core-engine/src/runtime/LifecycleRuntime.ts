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

export class LifecycleRuntime {
  static createContext(): JourneyContext {
    return {
      data: {},
      session: {},
      correlation: {},
      meta: {},
    };
  }

  static createState(): LifecycleRunState {
    return {
      initialized: false,
      ended: false,
      terminated: false,
      currentWindow: -1,
    };
  }

  static decide(state: LifecycleRunState, shouldEndNow: boolean): LifecycleDecision {
    if (state.terminated) {
      return { runInit: false, runAction: false, runEnd: false, idle: true };
    }
    if (!state.initialized) {
      return { runInit: true, runAction: false, runEnd: false, idle: false };
    }
    if (!state.ended && shouldEndNow) {
      return { runInit: false, runAction: false, runEnd: true, idle: false };
    }
    if (state.ended) {
      return { runInit: false, runAction: false, runEnd: false, idle: true };
    }
    return { runInit: false, runAction: true, runEnd: false, idle: false };
  }

  static applyErrorBehavior(state: LifecycleRunState, behavior: ErrorBehavior): 'continue' | 'stop_iteration' | 'stop_vu' | 'abort_test' {
    if (behavior === 'stop_vu') {
      state.terminated = true;
    }
    return behavior;
  }
}
