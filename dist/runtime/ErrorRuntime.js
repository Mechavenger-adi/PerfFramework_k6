"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorRuntime = void 0;
class ErrorRuntime {
    static buildErrorEvent(ctx, type, message, extras) {
        return {
            ts: new Date().toISOString(),
            level: 'error',
            type,
            runId: ctx.runId,
            plan: ctx.plan,
            environment: ctx.environment,
            journey: ctx.journey,
            scenario: ctx.scenario,
            transaction: ctx.transaction,
            requestName: ctx.requestName,
            requestId: ctx.requestId,
            method: ctx.method,
            url: ctx.url,
            status: ctx.status,
            vu: ctx.vu,
            iteration: ctx.iteration,
            phase: ctx.phase,
            behavior: ctx.behavior,
            agent: ctx.agent,
            message,
            cause: extras?.cause,
            correlation: extras?.correlation,
            data: extras?.data,
            snapshot: extras?.snapshot,
        };
    }
    static buildWarningEvent(runId, type, message, extras) {
        return {
            ts: new Date().toISOString(),
            level: 'warning',
            type,
            runId,
            message,
            ...extras,
        };
    }
}
exports.ErrorRuntime = ErrorRuntime;
//# sourceMappingURL=ErrorRuntime.js.map