import { TransactionGroup } from './TransactionGrouper';
interface LifecycleConfig {
    init?: string[];
    end?: string[];
}
interface GenerateOptions {
    lifecycle?: LifecycleConfig;
}
export declare class ScriptGenerator {
    /**
     * Prototype generator with optional LoadRunner-style Init / Action / End support.
     * Original generator remains untouched; this file is for lifecycle design review.
     */
    static generate(groups: TransactionGroup[], options?: GenerateOptions): string;
    private static renderLegacyDefault;
    private static renderPhaseFunction;
    private static renderGroups;
    private static renderLifecycleHelpers;
    private static partitionGroups;
    private static buildHttpCall;
    private static buildRequestDefinition;
    private static buildRequestParams;
    private static buildRequestBody;
    private static formatArray;
    private static formatValue;
}
export {};
//# sourceMappingURL=ScriptGenerator.lifecycle-prototype.d.ts.map