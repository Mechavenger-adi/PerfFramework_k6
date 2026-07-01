/**
 * Record an HTTP response the framework considers failed (status 0 = transport
 * error, or status >= 400). Called by request() for every failing response.
 * No-op outside an active transaction so failures in init/end phases or between
 * transactions can't leak into the next one. `options` is stashed so finally can
 * build the deferred request-failure snapshot with full request context.
 */
export declare function recordFailingResponse(res: object, info: {
    method: string;
    url: string;
    status: number;
    options?: unknown;
}): void;
/**
 * True when `error` is a JS-engine error type that signals a programming bug in
 * the script — an undefined identifier, calling a non-function, a bad property
 * access, etc. (ReferenceError / TypeError / RangeError / SyntaxError /
 * URIError / EvalError). Failed checks and HTTP errors are raised by the
 * framework as plain `Error` and are NOT matched here, so they still follow the
 * configured errorBehavior; a runtime bug always aborts the test instead.
 */
export declare function isJsRuntimeError(error: unknown): boolean;
/** Returns true if this VU was stopped via stop_vu errorBehavior. */
export declare function isVuTerminated(): boolean;
/**
 * Initializes Trends and Counters for the specified transactions.
 * MUST be called in the script's init context (global scope), not inside VU functions.
 *
 * @deprecated New generated scripts use framework-managed auto-registration via
 * K6_PERF_TRANSACTION_NAMES. Keep calling this for legacy scripts and standalone execution.
 */
export declare function initTransactions(names: string[]): void;
/**
 * Returns the name of the currently active transaction for this VU, or '' if none.
 * Used by request() to auto-attach transaction context to replay log entries.
 */
export declare function getCurrentTransaction(): string;
/**
 * Start a transaction (LoadRunner equivalent).
 * @param name Transaction name — must have been registered via initTransactions or auto-init.
 */
export declare function startTransaction(name: string): void;
/**
 * End a transaction (LoadRunner equivalent).
 * Records elapsed duration since startTransaction; safe to call in finally blocks.
 */
export declare function endTransaction(name: string): void;
/**
 * Execute a named transaction with group wrapping, metric recording, and lifecycle gating.
 *
 * Replaces the manual pattern:
 *   group('name', () => { startTransaction('name'); ...; endTransaction('name'); });
 *
 * Behavior:
 * - Checks lifecycle gate: if the VU is ramping down for the final time, skips the transaction.
 * - Wraps the body in k6 group() for hierarchical result grouping.
 * - Guarantees endTransaction() runs even if fn() throws (finally block).
 * - Applies the configured errorBehavior (continue | stop_iteration | stop_vu | abort_test).
 *
 * Nesting: nested transaction() calls are rejected with a descriptive error.
 */
export declare function transaction(name: string, fn: () => void): void;
/**
 * Framework-aware check() that wraps k6's native check() so metrics are always recorded,
 * then applies errorBehavior when one or more checks fail.
 *
 * Drop-in replacement for k6's check() — same signature, same metric output.
 */
export declare function k6Check(val: any, sets: Record<string, (v: any) => boolean>, tags?: Record<string, string>): boolean;
