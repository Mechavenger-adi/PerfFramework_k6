/**
 * DataPoolManager.ts
 * Phase 1 – Manages the lifecycle of data pools at test runtime.
 * Handles VU data assignment and overflow strategies.
 *
 * In k6 context, this is used inside the default/action function.
 * Data is pre-loaded (via DataFactory or SharedArray) before this manager is constructed.
 */

import { DataOverflowStrategy } from '../types/TestPlanSchema';
import { DataRow as FactoryDataRow } from './DataFactory';

// Re-export for convenience
export { DataOverflowStrategy };

export interface PoolConfig {
  /** Name of this pool (for logging) */
  name: string;
  /** The data rows loaded by DataFactory */
  rows: FactoryDataRow[];
  /** Strategy when VU index exceeds available rows */
  overflowStrategy: DataOverflowStrategy;
}

export class DataPoolManager {
  private readonly pools: Map<string, PoolConfig> = new Map();

  /**
   * Register a data pool by name.
   */
  registerPool(config: PoolConfig): void {
    if (config.rows.length === 0) {
      throw new Error(`[DataPoolManager] Pool '${config.name}' has no rows. Load data before registering.`);
    }
    this.pools.set(config.name, config);
    console.log(`[DataPoolManager] Registered pool '${config.name}' with ${config.rows.length} rows (strategy: ${config.overflowStrategy}).`);
  }

  /**
   * Get a data row for a specific VU.
   * @param poolName  Name of the registered pool
   * @param vuIndex   0-based VU index (use __VU - 1 in k6 scripts)
   */
  getRowForVU(poolName: string, vuIndex: number): FactoryDataRow {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`[DataPoolManager] Pool '${poolName}' is not registered. Call registerPool() first.`);
    }

    const { rows, overflowStrategy } = pool;
    const rowCount = rows.length;

    if (vuIndex < rowCount) {
      return rows[vuIndex];
    }

    // VU index exceeds available rows -> apply overflow strategy
    switch (overflowStrategy) {
      case 'terminate':
        throw new Error(
          `[DataPoolManager] Pool '${poolName}': VU index ${vuIndex} exceeds row count ${rowCount}. Strategy=terminate. Stopping.`,
        );

      case 'cycle':
        return rows[vuIndex % rowCount];

      case 'continue_with_last':
        return rows[rowCount - 1];

      default:
        throw new Error(`[DataPoolManager] Unknown overflow strategy: '${overflowStrategy}'`);
    }
  }

  /**
   * Get an iteration-based row (use __ITER in k6 scripts).
   * Each iteration of a VU gets the next row in sequence.
   * @param poolName   Name of the registered pool
   * @param vuIndex    0-based VU index (__VU - 1)
   * @param iteration  0-based iteration index (__ITER)
   */
  getRowForIteration(poolName: string, vuIndex: number, iteration: number): FactoryDataRow {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`[DataPoolManager] Pool '${poolName}' is not registered.`);
    }

    const { rows, overflowStrategy } = pool;
    const rowCount = rows.length;
    const absoluteIndex = vuIndex * 1000 + iteration; // simple spread formula

    return this.resolveIndex(absoluteIndex, rowCount, pool.name, overflowStrategy, rows);
  }

  /**
   * Get pool statistics (for logging / validation).
   */
  getPoolStats(poolName: string): { name: string; rowCount: number; strategy: string } | undefined {
    const pool = this.pools.get(poolName);
    if (!pool) return undefined;
    return { name: pool.name, rowCount: pool.rows.length, strategy: pool.overflowStrategy };
  }

  /** List all registered pool names */
  listPools(): string[] {
    return Array.from(this.pools.keys());
  }

  // ---------------------------------------------
  private resolveIndex(
    index: number,
    rowCount: number,
    name: string,
    strategy: DataOverflowStrategy,
    rows: FactoryDataRow[],
  ): FactoryDataRow {
    if (index < rowCount) return rows[index];

    switch (strategy) {
      case 'terminate':
        throw new Error(`[DataPoolManager] Pool '${name}': index ${index} exceeds row count ${rowCount}. Strategy=terminate.`);
      case 'cycle':
        return rows[index % rowCount];
      case 'continue_with_last':
        return rows[rowCount - 1];
      default:
        throw new Error(`[DataPoolManager] Unknown overflow strategy: '${strategy}'`);
    }
  }
}
