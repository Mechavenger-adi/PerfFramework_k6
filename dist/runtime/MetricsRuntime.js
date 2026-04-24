"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsRuntime = void 0;
class MetricsRuntime {
    constructor() {
        this.transactionMetrics = new Map();
    }
    recordTransaction(transaction, durationMs, passed) {
        const current = this.transactionMetrics.get(transaction) ?? {
            count: 0,
            pass: 0,
            fail: 0,
            durations: [],
        };
        current.count += 1;
        current.pass += passed ? 1 : 0;
        current.fail += passed ? 0 : 1;
        current.durations.push(durationMs);
        this.transactionMetrics.set(transaction, current);
    }
    getSnapshot() {
        return Object.fromEntries(this.transactionMetrics.entries());
    }
}
exports.MetricsRuntime = MetricsRuntime;
//# sourceMappingURL=MetricsRuntime.js.map