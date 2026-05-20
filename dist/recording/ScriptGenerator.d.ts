import { TransactionGroup } from './TransactionGrouper';
export interface LifecycleSelection {
    initGroups: string[];
    endGroups: string[];
}
export declare class ScriptGenerator {
    /**
     * Generates formatted TypeScript/JavaScript source code based on Transaction Groups.
     * Output uses the transaction() wrapper and request() helper from the framework utils.
     */
    static generate(groups: TransactionGroup[], lifecycle: LifecycleSelection | undefined, teamName: string): string;
    private static buildPhaseFunction;
    /** Build a relative path from an absolute URL, falling back to the absolute URL if origin differs. */
    private static buildRelativePath;
    private static buildRequestBody;
    /** Inline-format a plain object as a JS object literal at the given indent level. */
    private static formatInlineObject;
    /** Extract unique origin URLs (protocol+host) from all HAR entries in all groups. */
    private static extractBaseUrls;
}
