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
    /**
     * Returns the URL expression to embed directly in the generated script (no extra quoting needed).
     * Same-domain paths become `${env.baseUrl}/path` template literals so request() receives an
     * absolute URL; different-domain URLs are kept as JSON string literals.
     */
    private static buildUrlExpression;
    private static buildRequestBody;
    /** Inline-format a plain object as a JS object literal at the given indent level. */
    private static formatInlineObject;
    /** Extract unique origin URLs (protocol+host) from all HAR entries in all groups. */
    private static extractBaseUrls;
}
