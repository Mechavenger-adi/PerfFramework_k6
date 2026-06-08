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
exports.k6Check = k6Check;
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
// Per-transaction pass/fail Rate. One sample is pushed per transaction iteration
// (in transaction()'s finally block); `true` = all checks passed and no error
// was raised, `false` = any check failed or the body threw. See Proposal 3 in
// ai_context/design-proposals.md.
const txnResults = {};
// True iff the currently-active transaction has observed at least one failure
// (failed k6Check or thrown error) during this iteration. Reset at the start of
// every transaction(), read once in finally, then reset by the next transaction.
let _currentIterationFailed = false;
/**
 * Pull a user-script source location (path:line[:col]) out of an Error.stack
 * string. k6 runs scripts under the Goja JS engine which produces stack
 * frames in several shapes depending on the call form, e.g.:
 *   at file:///D:/.../script.js:258:5(15)
 *   at action_phase (file:///D:/.../script.js:258:5)
 *   at /abs/path/script.js:42:7
 *   script.js:42
 * To stay robust against future format tweaks we look for any token that
 * looks like `<something>:<digits>[:<digits>]` and pick the first one that
 * doesn't belong to framework internals (`dist/utils/`). Returns the bare
 * `path:line:col` (or `path:line`) substring, or `""` when nothing usable is
 * present.
 */
function extractScriptLocation(stack) {
    if (!stack || typeof stack !== 'string')
        return '';
    const lines = stack.split(/\r?\n/);
    for (const raw of lines) {
        const line = raw.trim();
        // Match a path-ish token followed by :line or :line:col. The path may be
        // a `file://` URL, an absolute filesystem path, or a bare filename. We
        // exclude whitespace, parentheses, and angle brackets from the path token.
        // The optional `(\\d+)` suffix is Goja's bytecode position — we drop it.
        const matches = [...line.matchAll(/((?:file:\/\/)?[^\s()<>"']+):(\d+)(?::(\d+))?(?:\(\d+\))?/g)];
        for (const m of matches) {
            const path = m[1];
            // Skip framework internals — surface the user's call site instead.
            if (path.includes('/dist/utils/') || path.includes('\\dist\\utils\\'))
                continue;
            // Reject obviously bogus tokens (e.g. `https:` alone, k6 internal markers).
            if (path === 'https' || path === 'http' || path === 'native')
                continue;
            // Skip frames inside k6's own runtime modules.
            if (path.startsWith('k6/') || path.includes('go.k6.io'))
                continue;
            const lineNo = m[2];
            const col = m[3];
            return col ? `${path}:${lineNo}:${col}` : `${path}:${lineNo}`;
        }
    }
    return '';
}
/**
 * First N non-empty stack lines, joined — useful when `extractScriptLocation`
 * couldn't find a clean frame but the raw stack still has useful info.
 */
function formatStackSnippet(stack, limit = 3) {
    if (!stack || typeof stack !== 'string')
        return '';
    const lines = stack
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.includes('/dist/utils/') && !l.includes('\\dist\\utils\\'));
    if (lines.length === 0)
        return '';
    return lines.slice(0, limit).map((l) => `    ${l}`).join('\n');
}
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
        if (!txnResults[name]) {
            // One sample per transaction iteration (see Proposal 3). passes + fails
            // equals <name>_count by construction. Metric name is <name>_checkrate
            // — a Rate whose passes/fails reflect whether every k6Check inside the
            // transaction passed (and no error was raised) for that iteration.
            txnResults[name] = new metrics_1.Rate(`${name}_checkrate`);
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
            // Reset the per-iteration failure flag at the iteration boundary.
            // k6Check (on failure) and the catch below flip it to true; the finally
            // block reads it once to push a single sample to <name>_checkrate.
            _currentIterationFailed = false;
            try {
                fn();
            }
            catch (error) {
                // Any thrown error inside the body counts as a failed iteration —
                // transport errors from request(), correlation failures, user-thrown
                // exceptions. The flag stays set through every errorBehavior branch
                // (continue / stop_iteration / stop_vu / abort_test), so the finally
                // pushes Rate.add(false) regardless of how this iteration ends.
                _currentIterationFailed = true;
                const behavior = errorBehavior;
                const message = error && typeof error === 'object' && 'message' in error
                    ? error.message
                    : String(error);
                // Wave 3: surface caught exceptions as structured error events AND
                // attach a snapshot of the most recent request envelope (helps
                // diagnose throws that occurred AFTER an HTTP call inside the
                // transaction body, e.g. JSON parse failures, missing correlation
                // tokens). Best-effort — never let event emission shadow the
                // original error.
                try {
                    console.log('[k6-perf][error-event] ' + JSON.stringify({
                        ts: new Date().toISOString(),
                        type: 'transaction_error',
                        transaction: name,
                        message,
                        errorBehavior: behavior,
                        vu: typeof execution_1.default !== 'undefined' && execution_1.default.vu ? execution_1.default.vu.idInInstance : undefined,
                        iteration: typeof execution_1.default !== 'undefined' && execution_1.default.vu ? execution_1.default.vu.iterationInScenario : undefined,
                    }));
                }
                catch { /* defensive */ }
                try {
                    const hook = globalThis.__k6PerfCaptureSnapshotFromLastRequest;
                    if (typeof hook === 'function')
                        hook('transaction_error', message);
                }
                catch { /* defensive */ }
                // Extract the user-script location from the stack so failures point at
                // an actual file:line:col instead of just the error message. The
                // extractor handles several Goja stack formats; if it still can't
                // pull a clean frame (e.g. minified or unusual format), fall back to
                // the first few raw stack lines so the user is never stranded with
                // just a message and no file/line info.
                const rawStack = error?.stack;
                const location = extractScriptLocation(rawStack);
                const locSuffix = location
                    ? `\n    at ${location}`
                    : (formatStackSnippet(rawStack) ? `\n${formatStackSnippet(rawStack)}` : '');
                // All error-behavior paths share one truth: the *current transaction
                // body* is aborted at the point the error was thrown — anything after
                // it inside this transaction (including subsequent request() calls)
                // does NOT run. Previously the log only said "→ continuing to next
                // transaction" which made it look like the framework was simply
                // moving on, hiding the fact that 1+ requests were silently skipped.
                // Now every branch is explicit: "skipped remaining work in this
                // transaction; <what happens next>".
                if (behavior === 'abort_test') {
                    console.error(`[k6-perf][transaction:${name}] ERROR: ${message}${locSuffix}\n` +
                        `  → skipped remaining work in this transaction; aborting entire test (errorBehavior=abort_test)`);
                    execution_1.default.test.abort(`[k6-perf][transaction:${name}] ${message}${location ? ` (${location})` : ''}`);
                    return;
                }
                if (behavior === 'stop_vu') {
                    console.error(`[k6-perf][transaction:${name}] ERROR: ${message}${locSuffix}\n` +
                        `  → skipped remaining work in this transaction; this VU will not run any more iterations (errorBehavior=stop_vu)`);
                    // Mark VU as permanently terminated — lifecycle will skip all future iterations.
                    // Do NOT re-throw: we want the action phase to return cleanly so k6 doesn't
                    // see an iteration error (which would schedule a new iteration for this VU).
                    _vuTerminated = true;
                    return;
                }
                if (behavior === 'stop_iteration') {
                    console.error(`[k6-perf][transaction:${name}] ERROR: ${message}${locSuffix}\n` +
                        `  → skipped remaining work in this transaction; ending current iteration (errorBehavior=stop_iteration)`);
                    // Re-throw so lifecycle stops the current iteration; VU resumes next iteration.
                    throw error;
                }
                // 'continue' — log with context and swallow, next transaction will run
                console.error(`[k6-perf][transaction:${name}] ERROR: ${message}${locSuffix}\n` +
                    `  → skipped remaining work in this transaction; continuing to next transaction (errorBehavior=continue)`);
            }
            finally {
                // Exactly one sample per transaction iteration, before endTransaction
                // so it can never be skipped. By construction:
                //   <name>_checkrate.passes + <name>_checkrate.fails === <name>_count
                if (txnResults[name]) {
                    txnResults[name].add(!_currentIterationFailed);
                }
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
function k6Check(val, sets) {
    const passed = (0, k6_1.check)(val, sets);
    if (!passed) {
        // Mark the current iteration as failed so transaction()'s finally block
        // pushes Rate.add(false) for the active transaction. Guarded on
        // _activeTransaction so a check called outside any transaction can't leak
        // a stale "failed" state into the next transaction.
        if (_activeTransaction !== '') {
            _currentIterationFailed = true;
        }
        const behavior = getRuntimeErrorBehavior();
        const txn = getCurrentTransaction();
        const ctx = txn ? `[transaction:${txn}]` : '';
        // Wave 3: surface the failing check as a structured error event AND
        // trigger a request-context snapshot (using the most recent request()
        // call's envelope) so the report's Errors tab gets a per-occurrence
        // entry and the Snapshots tab a full request/response to diagnose.
        // Compute the list of failing keys so the event payload is useful.
        const failingKeys = [];
        try {
            for (const key of Object.keys(sets)) {
                try {
                    if (!sets[key](val))
                        failingKeys.push(key);
                }
                catch {
                    failingKeys.push(key);
                }
            }
        }
        catch { /* defensive: never let event emission throw */ }
        const failMsg = `check() failed: ${failingKeys.length > 0 ? failingKeys.join(', ') : 'unknown assertion'}`;
        try {
            console.log('[k6-perf][error-event] ' + JSON.stringify({
                ts: new Date().toISOString(),
                type: 'check_failed',
                transaction: txn || undefined,
                message: failMsg,
                failingChecks: failingKeys,
                vu: typeof execution_1.default !== 'undefined' && execution_1.default.vu ? execution_1.default.vu.idInInstance : undefined,
                iteration: typeof execution_1.default !== 'undefined' && execution_1.default.vu ? execution_1.default.vu.iterationInScenario : undefined,
            }));
        }
        catch { /* never let logging throw */ }
        try {
            const hook = globalThis.__k6PerfCaptureSnapshotFromLastRequest;
            if (typeof hook === 'function')
                hook('check_failed', failMsg);
        }
        catch { /* defensive: snapshot best-effort */ }
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
