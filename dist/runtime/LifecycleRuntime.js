"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifecycleRuntime = void 0;
class LifecycleRuntime {
    static createContext() {
        return {
            data: {},
            session: {},
            correlation: {},
            meta: {},
        };
    }
    static createState() {
        return {
            initialized: false,
            ended: false,
            terminated: false,
            currentWindow: -1,
        };
    }
    static decide(state, shouldEndNow) {
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
    static applyErrorBehavior(state, behavior) {
        if (behavior === 'stop_vu') {
            state.terminated = true;
        }
        return behavior;
    }
}
exports.LifecycleRuntime = LifecycleRuntime;
//# sourceMappingURL=LifecycleRuntime.js.map