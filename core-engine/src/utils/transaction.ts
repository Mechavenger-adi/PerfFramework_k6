// @ts-ignore
import { group } from 'k6';
// @ts-ignore - K6 runtime module
import { Counter, Trend } from 'k6/metrics';
// @ts-ignore - K6 runtime module
import exec from 'k6/execution';

declare const __ENV: Record<string, string | undefined>;

// Reads errorBehavior from the framework-injected runtime metadata env var.
// Avoids a local file import (require("./lifecycle")) which k6 cannot resolve
// for extension-less paths when the dist is compiled as CommonJS.
function getRuntimeErrorBehavior(): string {
  try {
    const raw = typeof __ENV !== 'undefined' ? __ENV.K6_PERF_RUNTIME_METADATA : undefined;
    if (raw) {
      const parsed = JSON.parse(raw) as { errorBehavior?: string };
      return parsed.errorBehavior || 'continue';
    }
  } catch { /* silent */ }
  return 'continue';
}

const txnStarts: Record<string, number> = {};
const txnTrends: Record<string, Trend> = {};
const txnCounters: Record<string, Counter> = {};

// Tracks the active transaction name within this VU's context (per-VU module scope in k6).
let _activeTransaction: string = '';

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
  } catch { /* silent — fallback: scripts may still call initTransactions([...]) explicitly */ }
})();

/**
 * Initializes Trends and Counters for the specified transactions.
 * MUST be called in the script's init context (global scope), not inside VU functions.
 *
 * @deprecated New generated scripts use framework-managed auto-registration via
 * K6_PERF_TRANSACTION_NAMES. Keep calling this for legacy scripts and standalone execution.
 */
export function initTransactions(names: string[]): void {
  names.forEach(name => {
    if (!txnTrends[name]) {
      txnTrends[name] = new Trend(`${name}`);
    }
    if (!txnCounters[name]) {
      txnCounters[name] = new Counter(`${name}_count`);
    }
  });
}

/**
 * Returns the name of the currently active transaction for this VU, or '' if none.
 * Used by request() to auto-attach transaction context to replay log entries.
 */
export function getCurrentTransaction(): string {
  return _activeTransaction;
}

/**
 * Start a transaction (LoadRunner equivalent).
 * @param name Transaction name — must have been registered via initTransactions or auto-init.
 */
export function startTransaction(name: string): void {
  txnStarts[name] = Date.now();

  if (txnCounters[name]) {
    txnCounters[name].add(1);
  } else {
    console.error(`Transaction "${name}" counter was not initialized in init context`);
  }
}

/**
 * End a transaction (LoadRunner equivalent).
 * Records elapsed duration since startTransaction; safe to call in finally blocks.
 */
export function endTransaction(name: string): void {
  const startTime = txnStarts[name];

  if (!startTime) {
    console.error(`Transaction "${name}" was not started`);
    return;
  }

  const duration = Date.now() - startTime;

  if (txnTrends[name]) {
    txnTrends[name].add(duration);
  } else {
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
export function transaction(name: string, fn: () => void): void {
  if (_activeTransaction !== '') {
    throw new Error(
      `[k6-perf] Nested transaction detected: '${name}' called inside '${_activeTransaction}'. ` +
      `Nested transactions are not supported.`,
    );
  }

  const errorBehavior = getRuntimeErrorBehavior();

  _activeTransaction = name;
  try {
    group(name, () => {
      startTransaction(name);
      try {
        fn();
      } catch (error) {
        const behavior = errorBehavior;
        const message =
          error && typeof error === 'object' && 'message' in error
            ? (error as Error).message
            : String(error);

        console.error(`[k6-perf][transaction:${name}] ${message}`);

        if (behavior === 'abort_test') {
          exec.test.abort(`[k6-perf][transaction:${name}] Aborting test: ${message}`);
          return;
        }

        if (behavior === 'stop_iteration' || behavior === 'stop_vu') {
          throw error;
        }
        // 'continue' — swallow and continue to next transaction
      } finally {
        endTransaction(name);
      }
    });
  } finally {
    _activeTransaction = '';
  }
}
