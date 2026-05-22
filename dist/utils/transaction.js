"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVuTerminated = isVuTerminated;
exports.initTransactions = initTransactions;
exports.getCurrentTransaction = getCurrentTransaction;
exports.startTransaction = startTransaction;
exports.endTransaction = endTransaction;
exports.transaction = transaction;
exports.check = check;
// @ts-ignore
const k6_1 = require("k6");
// @ts-ignore - K6 runtime module
const metrics_1 = require("k6/metrics");
// @ts-ignore - K6 runtime module
const execution_1 = __importDefault(require("k6/execution"));
// Reads errorBehavior from the framework-injected runtime metadata env var.
// Avoids a local file import (require("./lifecycle")) which k6 cannot resolve
// for extension-less paths when the dist is compiled as CommonJS.
function getRuntimeErrorBehavior() {
    try {
        const raw = typeof __ENV !== 'undefined' ? __ENV.K6_PERF_RUNTIME_METADATA : undefined;
        if (raw) {
            const parsed = JSON.parse(raw);
            return parsed.errorBehavior || 'continue';
        }
    }
    catch { /* silent */ }
    return 'continue';
}
const txnStarts = {};
const txnTrends = {};
const txnCounters = {};
// Tracks the active transaction name within this VU's context (per-VU module scope in k6).
let _activeTransaction = '';
// Permanently stops this VU from running any more transactions.
// Set by stop_vu behavior — persists for the lifetime of the VU module instance.
let _vuTerminated = false;
/** Returns true if this VU was stopped via stop_vu errorBehavior. */
function isVuTerminated() {
    return _vuTerminated;
}
// ── Auto-register from framework-injected manifest ────────────
// Reads K6_PERF_TRANSACTION_NAMES (injected by ScenarioBuilder) and pre-registers
// all metrics during k6 init context so VU functions never create metrics at runtime.
(function autoInitTransactionsFromEnv() {
    try {
        const raw = typeof __ENV !== 'undefined' ? __ENV.K6_PERF_TRANSACTION_NAMES : undefined;
        if (raw) {
            const names = JSON.parse(raw);
            if (Array.isArray(names)) {
                initTransactions(names);
            }
        }
    }
    catch { /* silent — fallback: scripts may still call initTransactions([...]) explicitly */ }
})();
/**
 * Initializes Trends and Counters for the specified transactions.
 * MUST be called in the script's init context (global scope), not inside VU functions.
 *
 * @deprecated New generated scripts use framework-managed auto-registration via
 * K6_PERF_TRANSACTION_NAMES. Keep calling this for legacy scripts and standalone execution.
 */
function initTransactions(names) {
    names.forEach(name => {
        if (!txnTrends[name]) {
            txnTrends[name] = new metrics_1.Trend(`${name}`);
        }
        if (!txnCounters[name]) {
            txnCounters[name] = new metrics_1.Counter(`${name}_count`);
        }
    });
}
/**
 * Returns the name of the currently active transaction for this VU, or '' if none.
 * Used by request() to auto-attach transaction context to replay log entries.
 */
function getCurrentTransaction() {
    return _activeTransaction;
}
/**
 * Start a transaction (LoadRunner equivalent).
 * @param name Transaction name — must have been registered via initTransactions or auto-init.
 */
function startTransaction(name) {
    txnStarts[name] = Date.now();
    if (txnCounters[name]) {
        txnCounters[name].add(1);
    }
    else {
        console.error(`Transaction "${name}" counter was not initialized in init context`);
    }
}
/**
 * End a transaction (LoadRunner equivalent).
 * Records elapsed duration since startTransaction; safe to call in finally blocks.
 */
function endTransaction(name) {
    const startTime = txnStarts[name];
    if (!startTime) {
        console.error(`Transaction "${name}" was not started`);
        return;
    }
    const duration = Date.now() - startTime;
    if (txnTrends[name]) {
        txnTrends[name].add(duration);
    }
    else {
        console.error(`Transaction "${name}" trend was not initialized in init context`);
    }
    delete txnStarts[name];
}
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
function transaction(name, fn) {
    // VU was permanently stopped by a previous stop_vu — skip silently.
    if (_vuTerminated)
        return;
    if (_activeTransaction !== '') {
        throw new Error(`[k6-perf] Nested transaction detected: '${name}' called inside '${_activeTransaction}'. ` +
            `Nested transactions are not supported.`);
    }
    const errorBehavior = getRuntimeErrorBehavior();
    _activeTransaction = name;
    try {
        (0, k6_1.group)(name, () => {
            startTransaction(name);
            try {
                fn();
            }
            catch (error) {
                const behavior = errorBehavior;
                const message = error && typeof error === 'object' && 'message' in error
                    ? error.message
                    : String(error);
                if (behavior === 'abort_test') {
                    console.error(`[k6-perf][transaction:${name}] ERROR: ${message} → aborting test`);
                    execution_1.default.test.abort(`[k6-perf][transaction:${name}] ${message}`);
                    return;
                }
                if (behavior === 'stop_vu') {
                    console.error(`[k6-perf][transaction:${name}] ERROR: ${message} → stopping VU permanently`);
                    // Mark VU as permanently terminated — lifecycle will skip all future iterations.
                    // Do NOT re-throw: we want the action phase to return cleanly so k6 doesn't
                    // see an iteration error (which would schedule a new iteration for this VU).
                    _vuTerminated = true;
                    return;
                }
                if (behavior === 'stop_iteration') {
                    console.error(`[k6-perf][transaction:${name}] ERROR: ${message} → stopping iteration`);
                    // Re-throw so lifecycle stops the current iteration; VU resumes next iteration.
                    throw error;
                }
                // 'continue' — log with context and swallow, next transaction will run
                console.error(`[k6-perf][transaction:${name}] ERROR: ${message} → continuing to next transaction`);
            }
            finally {
                endTransaction(name);
            }
        });
    }
    finally {
        _activeTransaction = '';
    }
}
/**
 * Framework-aware check() that wraps k6's native check() so metrics are always recorded,
 * then applies errorBehavior when one or more checks fail.
 *
 * Drop-in replacement for k6's check() — same signature, same metric output.
 */
function check(val, sets) {
    const passed = (0, k6_1.check)(val, sets);
    if (!passed) {
        const behavior = getRuntimeErrorBehavior();
        const txn = getCurrentTransaction();
        const ctx = txn ? `[transaction:${txn}]` : '';
        if (behavior === 'abort_test') {
            console.error(`[k6-perf]${ctx} check() failed → aborting test`);
            execution_1.default.test.abort(`[k6-perf]${ctx} check() failed — aborting test`);
        }
        else if (behavior === 'stop_vu') {
            console.error(`[k6-perf]${ctx} check() failed → stopping VU permanently`);
            _vuTerminated = true;
            // Don't throw — let the transaction end cleanly; lifecycle will skip future iterations.
        }
        else if (behavior === 'stop_iteration') {
            console.error(`[k6-perf]${ctx} check() failed → stopping iteration`);
            throw new Error(`[k6-perf]${ctx} check() failed`);
        }
        // 'continue' — return false, let caller decide
    }
    return passed;
}
