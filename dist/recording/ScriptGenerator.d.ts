import { TransactionGroup } from './TransactionGrouper';
export interface LifecycleSelection {
    initGroups: string[];
    endGroups: string[];
}
export declare class ScriptGenerator {
    /**
     * Generates formatted TypeScript/JavaScript source code based on Transaction Groups.
     */
    static generate(groups: TransactionGroup[], lifecycle?: LifecycleSelection): string;
    private static buildPhaseFunction;
    private static buildRequestDefinition;
    private static buildRequestParams;
    private static buildRequestBody;
    private static formatArray;
    private static formatValue;
    /** Extract unique origin URLs (protocol+host) from all HAR entries in all groups. */
    private static extractBaseUrls;
}
//# sourceMappingURL=ScriptGenerator.d.ts.map