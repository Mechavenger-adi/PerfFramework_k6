import { K6ResponseLike } from './ExtractorRegistry';
import { CorrelationRule } from './RuleProcessor';
import { ExtractorRegistry } from './ExtractorRegistry';
import { FallbackHandler } from './FallbackHandler';
import { Logger } from '../utils/logger';

export class CorrelationEngine {
  private store: Map<string, string> = new Map();
  private rules: CorrelationRule[] = [];

  constructor(rules: CorrelationRule[]) {
    this.rules = rules;
  }

  /**
   * Process an HTTP response, attempting to extract metrics matching the rules.
   */
  process(res: K6ResponseLike): void {
    for (const rule of this.rules) {
      const extractor = ExtractorRegistry.get(rule.extractor);
      if (!extractor) {
        Logger.warn(`[Correlation] Unknown extractor type: ${rule.extractor}`);
        continue;
      }

      const extractedValue = extractor(res, rule.pattern);
      if (extractedValue !== null) {
        this.store.set(rule.name, extractedValue);
        Logger.debug(`[Correlation] Extracted ${rule.name}`);
      } else if (!this.store.has(rule.name)) {
        // Trigger fallback only if not seen previously
        const fallbackValue = FallbackHandler.handle(rule);
        if (fallbackValue !== '') {
           this.store.set(rule.name, fallbackValue);
        }
      }
    }
  }

  /**
   * Safe retrieval of an extracted token.
   */
  get(name: string): string | undefined {
    return this.store.get(name);
  }

  /**
   * Dump all values (useful for debugging).
   */
  dump(): Record<string, string> {
    const obj: Record<string, string> = {};
    for (const [key, val] of this.store.entries()) {
      obj[key] = val;
    }
    return obj;
  }
}
