import { SLADefinition } from '../types/TestPlanSchema';
export declare class SLARegistry {
    private static registry;
    /**
     * Register an SLA for a specific execution scenario or transaction.
     * Use the transaction name directly (no prefix needed).
     */
    static register(targetName: string, config: SLADefinition): void;
    static get(targetName: string): SLADefinition | undefined;
    static getAll(): Record<string, SLADefinition>;
}
//# sourceMappingURL=SLARegistry.d.ts.map