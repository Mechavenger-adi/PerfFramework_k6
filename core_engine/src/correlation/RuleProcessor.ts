import * as fs from 'fs';
import * as path from 'path';

export interface CorrelationRule {
  name: string;
  source: 'body' | 'header';
  extractor: 'regex' | 'jsonpath' | 'header';
  pattern: string;
  fallback: 'default' | 'skip' | 'fail';
  defaultValue?: string;
  isCritical?: boolean;
}

export class RuleProcessor {
  /**
   * Load JSON correlation rules from a specified file path.
   */
  static loadRules(filePath: string): CorrelationRule[] {
    const absPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absPath)) {
      return [];
    }
    
    const content = fs.readFileSync(absPath, 'utf8');
    try {
      return JSON.parse(content) as CorrelationRule[];
    } catch (err) {
      console.warn(`[RuleProcessor] Failed to parse correlation rules at ${absPath}`);
      return [];
    }
  }
}
