"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTransactions = initTransactions;
exports.startTransaction = startTransaction;
exports.endTransaction = endTransaction;
// @ts-ignore
const metrics_1 = require("k6/metrics");
const txnStarts = {};
const txnTrends = {};
/**
 * Initializes Trends for the specified transactions.
 * Uses the transaction name directly as the k6 Trend metric name.
 *
 * **CRITICAL**: This MUST be called in the script's init context (global scope),
 * not inside the default function or VU execution context.
 *
 * @param names Array of transaction names
 */
function initTransactions(names) {
    names.forEach(name => {
        if (!txnTrends[name]) {
            txnTrends[name] = new metrics_1.Trend(`${name}`);
        }
    });
}
/**
 * Start a transaction (LoadRunner equivalent)
 *
 * @param name Transaction name
 */
function startTransaction(name) {
    txnStarts[name] = Date.now();
}
/**
 * End a transaction (LoadRunner equivalent)
 * Calculates the duration since startTransaction was called and records it.
 *
 * @param name Transaction name
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
//# sourceMappingURL=transaction.js.map