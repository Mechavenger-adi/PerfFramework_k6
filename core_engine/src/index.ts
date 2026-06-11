/**
 * index.ts
 * Package entry — the VU-safe script API barrel that k6 journey scripts import.
 *
 * Everything re-exported here is safe to run inside a k6 VU: pure helpers and
 * the request/transaction/lifecycle/session runtime, with no Node APIs. The
 * Node-only engine/orchestration code (ScenarioBuilder, reporters, ReplayRunner,
 * Logger, data loaders, …) lives in engine.ts and is deliberately NOT re-exported
 * here, so a script can never pull that code into a VU bundle.
 *
 * Usage from a journey script (once packaged, this is `from 'perfx'`):
 *   import { transaction, request, thinktime, generate } from 'perfx';
 *   thinktime(1);
 *   const id = generate.uuid();
 */

// NOTE: relative specifiers MUST keep the explicit `.js` extension — k6 cannot
// resolve extensionless module paths at runtime (unlike Node). This matches the
// convention used throughout core_engine/src/utils.

// -- HTTP ---------------------------------------
export { request } from './utils/request.js';
export type { CookieValue, HttpMethod, RequestBody, RequestOptions } from './utils/request.js';

// -- Transactions -------------------------------
export {
  transaction,
  k6Check,
  startTransaction,
  endTransaction,
  getCurrentTransaction,
  initTransactions,
  isVuTerminated,
} from './utils/transaction.js';

// -- Lifecycle ----------------------------------
export {
  createJourneyLifecycleStore,
  runJourneyLifecycle,
  thinktime,
  isEnding,
  getTransactionGate,
} from './utils/lifecycle.js';
export type { JourneyLifecycleStore, PhaseFns, TransactionGate } from './utils/lifecycle.js';

// -- Session / environment ----------------------
export {
  clearCookies,
  deleteCookie,
  getEnvContext,
  registerBaseUrl,
  registerFrameworkEnvironmentUrls,
  resolveFrameworkUrl,
  resolvePath,
} from './utils/session.js';
export type { TeamEnvironmentOverride } from './utils/session.js';

// -- Replay / correlation tracking --------------
export {
  trackCorrelation,
  trackParameter,
  trackDataRow,
  logExchange,
  logReplayExchange,
} from './utils/replayLogger.js';

// -- Dynamic value generators -------------------
// Re-export DynamicValueFactory (data/) under the `generate` name so scripts
// call generate.uuid(), generate.randomEmail('qa'), … via its static methods.
// (Single source of truth — no separate utils/generate module.)
export { DynamicValueFactory as generate } from './data/DynamicValueFactory.js';
