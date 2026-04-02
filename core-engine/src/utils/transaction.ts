// @ts-ignore
import { Trend } from 'k6/metrics';

const txnStarts: Record<string, number> = {};
const txnTrends: Record<string, Trend> = {};

/**
 * Initializes Trends for the specified transactions.
 * Automatically prefixes the trend name with `txn_`.
 * 
 * **CRITICAL**: This MUST be called in the script's init context (global scope),
 * not inside the default function or VU execution context.
 * 
 * @param names Array of transaction names
 */
export function initTransactions(names: string[]): void {
  names.forEach(name => {
    if (!txnTrends[name]) {
      txnTrends[name] = new Trend(`txn_${name}`);
    }
  });
}

/**
 * Start a transaction (LoadRunner equivalent)
 * 
 * @param name Transaction name
 */
export function startTransaction(name: string): void {
  txnStarts[name] = Date.now();
}

/**
 * End a transaction (LoadRunner equivalent)
 * Calculates the duration since startTransaction was called and records it.
 * 
 * @param name Transaction name
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
