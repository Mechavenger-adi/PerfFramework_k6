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
export { DataOverflowStrategy };
export interface PoolConfig {
    /** Name of this pool (for logging) */
    name: string;
    /** The data rows loaded by DataFactory */
    rows: FactoryDataRow[];
    /** Strategy when VU index exceeds available rows */
    overflowStrategy: DataOverflowStrategy;
}
export declare class DataPoolManager {
    private readonly pools;
    /**
     * Register a data pool by name.
     */
    registerPool(config: PoolConfig): void;
    /**
     * Get a data row for a specific VU.
     * @param poolName  Name of the registered pool
     * @param vuIndex   0-based VU index (use __VU - 1 in k6 scripts)
     */
    getRowForVU(poolName: string, vuIndex: number): FactoryDataRow;
    /**
     * Get an iteration-based row (use __ITER in k6 scripts).
     * Each iteration of a VU gets the next row in sequence.
     * @param poolName   Name of the registered pool
     * @param vuIndex    0-based VU index (__VU - 1)
     * @param iteration  0-based iteration index (__ITER)
     */
    getRowForIteration(poolName: string, vuIndex: number, iteration: number): FactoryDataRow;
    /**
     * Get pool statistics (for logging / validation).
     */
    getPoolStats(poolName: string): {
        name: string;
        rowCount: number;
        strategy: string;
    } | undefined;
    /** List all registered pool names */
    listPools(): string[];
    private resolveIndex;
}
//# sourceMappingURL=DataPoolManager.d.ts.map