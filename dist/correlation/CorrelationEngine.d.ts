import { K6ResponseLike } from './ExtractorRegistry';
import { CorrelationRule } from './RuleProcessor';
export declare class CorrelationEngine {
    private store;
    private rules;
    constructor(rules: CorrelationRule[]);
    /**
     * Process an HTTP response, attempting to extract metrics matching the rules.
     */
    process(res: K6ResponseLike): void;
    /**
     * Safe retrieval of an extracted token.
     */
    get(name: string): string | undefined;
    /**
     * Dump all values (useful for debugging).
     */
    dump(): Record<string, string>;
}
//# sourceMappingURL=CorrelationEngine.d.ts.map