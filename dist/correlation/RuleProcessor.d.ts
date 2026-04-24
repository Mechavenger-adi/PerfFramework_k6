export interface CorrelationRule {
    name: string;
    source: 'body' | 'header';
    extractor: 'regex' | 'jsonpath' | 'header';
    pattern: string;
    fallback: 'default' | 'skip' | 'fail';
    defaultValue?: string;
    isCritical?: boolean;
}
export declare class RuleProcessor {
    /**
     * Load JSON correlation rules from a specified file path.
     */
    static loadRules(filePath: string): CorrelationRule[];
}
//# sourceMappingURL=RuleProcessor.d.ts.map