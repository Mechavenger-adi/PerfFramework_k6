import { CorrelationRule } from './RuleProcessor';
import { Logger } from '../utils/logger';

export class FallbackHandler {
  /**
   * Executes the appropriate fallback strategy when correlation extraction fails.
   */
  static handle(rule: CorrelationRule): string {
    if (rule.fallback === 'fail' || rule.isCritical) {
      Logger.error(`[Correlation] Critical fallback triggered for: ${rule.name}`);
      throw new Error(`Critical correlation extraction failed for ${rule.name}`);
    } else if (rule.fallback === 'default' && rule.defaultValue !== undefined) {
      Logger.warn(`[Correlation] Using default value for: ${rule.name}`);
      return rule.defaultValue;
    } else {
      Logger.warn(`[Correlation] Extraction failed for: ${rule.name}, skipping gracefully.`);
      return '';
    }
  }
}
