import { TransactionGroup } from './TransactionGrouper';
export interface LifecycleSelection {
    initGroups: string[];
    endGroups: string[];
}
export interface GenerateOptions {
    /**
     * Raw JS code to inject at module scope, AFTER the env declaration and BEFORE
     * the journey lifecycle store. Used by synthetic-source adapters (Postman)
     * that need init-context bindings — e.g. `const photoBytes = await open('../data/photo.jpg', 'b');`
     * for file uploads. The generator auto-adds the appropriate imports when
     * file bindings are detected; callers supply additional imports via
     * `extraImports`.
     */
    extraInitCode?: string;
    /**
     * Additional import statements to add at the top of the file (one per line).
     * Example: `[\"import { open } from 'k6/experimental/fs';\"]`.
     * De-duplicated by string equality with existing imports.
     */
    extraImports?: string[];
}
export declare class ScriptGenerator {
    /**
     * Generates formatted TypeScript/JavaScript source code based on Transaction Groups.
     * Output uses the transaction() wrapper and request() helper from the framework utils.
     */
    static generate(groups: TransactionGroup[], lifecycle: LifecycleSelection | undefined, teamName: string, options?: GenerateOptions): string;
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
