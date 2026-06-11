"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = exports.writeData = exports.addHeaderOnce = exports.getAutoHeaders = exports.clearAutoHeaders = exports.removeAutoHeader = exports.addAutoHeaders = exports.addAutoHeader = exports.logReplayExchange = exports.logExchange = exports.trackDataRow = exports.trackParameter = exports.trackCorrelation = exports.resolvePath = exports.resolveFrameworkUrl = exports.registerFrameworkEnvironmentUrls = exports.registerBaseUrl = exports.getEnvContext = exports.deleteCookie = exports.clearCookies = exports.getTransactionGate = exports.isEnding = exports.thinktime = exports.runJourneyLifecycle = exports.createJourneyLifecycleStore = exports.isVuTerminated = exports.initTransactions = exports.getCurrentTransaction = exports.endTransaction = exports.startTransaction = exports.k6Check = exports.transaction = exports.request = void 0;
// NOTE: relative specifiers MUST keep the explicit `.js` extension — k6 cannot
// resolve extensionless module paths at runtime (unlike Node). This matches the
// convention used throughout core_engine/src/utils.
// -- HTTP ---------------------------------------
var request_js_1 = require("./utils/request.js");
Object.defineProperty(exports, "request", { enumerable: true, get: function () { return request_js_1.request; } });
// -- Transactions -------------------------------
var transaction_js_1 = require("./utils/transaction.js");
Object.defineProperty(exports, "transaction", { enumerable: true, get: function () { return transaction_js_1.transaction; } });
Object.defineProperty(exports, "k6Check", { enumerable: true, get: function () { return transaction_js_1.k6Check; } });
Object.defineProperty(exports, "startTransaction", { enumerable: true, get: function () { return transaction_js_1.startTransaction; } });
Object.defineProperty(exports, "endTransaction", { enumerable: true, get: function () { return transaction_js_1.endTransaction; } });
Object.defineProperty(exports, "getCurrentTransaction", { enumerable: true, get: function () { return transaction_js_1.getCurrentTransaction; } });
Object.defineProperty(exports, "initTransactions", { enumerable: true, get: function () { return transaction_js_1.initTransactions; } });
Object.defineProperty(exports, "isVuTerminated", { enumerable: true, get: function () { return transaction_js_1.isVuTerminated; } });
// -- Lifecycle ----------------------------------
var lifecycle_js_1 = require("./utils/lifecycle.js");
Object.defineProperty(exports, "createJourneyLifecycleStore", { enumerable: true, get: function () { return lifecycle_js_1.createJourneyLifecycleStore; } });
Object.defineProperty(exports, "runJourneyLifecycle", { enumerable: true, get: function () { return lifecycle_js_1.runJourneyLifecycle; } });
Object.defineProperty(exports, "thinktime", { enumerable: true, get: function () { return lifecycle_js_1.thinktime; } });
Object.defineProperty(exports, "isEnding", { enumerable: true, get: function () { return lifecycle_js_1.isEnding; } });
Object.defineProperty(exports, "getTransactionGate", { enumerable: true, get: function () { return lifecycle_js_1.getTransactionGate; } });
// -- Session / environment ----------------------
var session_js_1 = require("./utils/session.js");
Object.defineProperty(exports, "clearCookies", { enumerable: true, get: function () { return session_js_1.clearCookies; } });
Object.defineProperty(exports, "deleteCookie", { enumerable: true, get: function () { return session_js_1.deleteCookie; } });
Object.defineProperty(exports, "getEnvContext", { enumerable: true, get: function () { return session_js_1.getEnvContext; } });
Object.defineProperty(exports, "registerBaseUrl", { enumerable: true, get: function () { return session_js_1.registerBaseUrl; } });
Object.defineProperty(exports, "registerFrameworkEnvironmentUrls", { enumerable: true, get: function () { return session_js_1.registerFrameworkEnvironmentUrls; } });
Object.defineProperty(exports, "resolveFrameworkUrl", { enumerable: true, get: function () { return session_js_1.resolveFrameworkUrl; } });
Object.defineProperty(exports, "resolvePath", { enumerable: true, get: function () { return session_js_1.resolvePath; } });
// -- Replay / correlation tracking --------------
var replayLogger_js_1 = require("./utils/replayLogger.js");
Object.defineProperty(exports, "trackCorrelation", { enumerable: true, get: function () { return replayLogger_js_1.trackCorrelation; } });
Object.defineProperty(exports, "trackParameter", { enumerable: true, get: function () { return replayLogger_js_1.trackParameter; } });
Object.defineProperty(exports, "trackDataRow", { enumerable: true, get: function () { return replayLogger_js_1.trackDataRow; } });
Object.defineProperty(exports, "logExchange", { enumerable: true, get: function () { return replayLogger_js_1.logExchange; } });
Object.defineProperty(exports, "logReplayExchange", { enumerable: true, get: function () { return replayLogger_js_1.logReplayExchange; } });
// -- Auto headers (persist per-VU; applied to every subsequent request) ----
var autoHeaders_js_1 = require("./utils/autoHeaders.js");
Object.defineProperty(exports, "addAutoHeader", { enumerable: true, get: function () { return autoHeaders_js_1.addAutoHeader; } });
Object.defineProperty(exports, "addAutoHeaders", { enumerable: true, get: function () { return autoHeaders_js_1.addAutoHeaders; } });
Object.defineProperty(exports, "removeAutoHeader", { enumerable: true, get: function () { return autoHeaders_js_1.removeAutoHeader; } });
Object.defineProperty(exports, "clearAutoHeaders", { enumerable: true, get: function () { return autoHeaders_js_1.clearAutoHeaders; } });
Object.defineProperty(exports, "getAutoHeaders", { enumerable: true, get: function () { return autoHeaders_js_1.getAutoHeaders; } });
Object.defineProperty(exports, "addHeaderOnce", { enumerable: true, get: function () { return autoHeaders_js_1.addHeaderOnce; } });
// -- Runtime data writer (write files during the run; all VUs concurrently) -
var dataWriter_js_1 = require("./utils/dataWriter.js");
Object.defineProperty(exports, "writeData", { enumerable: true, get: function () { return dataWriter_js_1.writeData; } });
// -- Dynamic value generators -------------------
// Re-export DynamicValueFactory (data/) under the `generate` name so scripts
// call generate.uuid(), generate.randomEmail('qa'), … via its static methods.
// (Single source of truth — no separate utils/generate module.)
var DynamicValueFactory_js_1 = require("./data/DynamicValueFactory.js");
Object.defineProperty(exports, "generate", { enumerable: true, get: function () { return DynamicValueFactory_js_1.DynamicValueFactory; } });
