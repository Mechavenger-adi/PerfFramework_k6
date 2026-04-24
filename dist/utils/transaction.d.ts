/**
 * Initializes Trends for the specified transactions.
 * Uses the transaction name directly as the k6 Trend metric name.
 *
 * **CRITICAL**: This MUST be called in the script's init context (global scope),
 * not inside the default function or VU execution context.
 *
 * @param names Array of transaction names
 */
export declare function initTransactions(names: string[]): void;
/**
 * Start a transaction (LoadRunner equivalent)
 *
 * @param name Transaction name
 */
export declare function startTransaction(name: string): void;
/**
 * End a transaction (LoadRunner equivalent)
 * Calculates the duration since startTransaction was called and records it.
 *
 * @param name Transaction name
 */
export declare function endTransaction(name: string): void;
//# sourceMappingURL=transaction.d.ts.map