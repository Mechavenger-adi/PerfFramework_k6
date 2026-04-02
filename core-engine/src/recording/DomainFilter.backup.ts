import { HAREntry } from '../types/HARContracts';
import { Logger } from '../utils/logger';

export class DomainFilter {
  /**
   * Filter HAR entries by allowed output domains. Supports substring matching.
   */
  static filter(entries: HAREntry[], allowedDomains: string[]): HAREntry[] {
    if (!allowedDomains || allowedDomains.length === 0) return entries;
    const removedStats: Record<string, number> = {};
    
    const filtered = entries.filter((req) => {
      const match = allowedDomains.some(domain => req.host.includes(domain));
      if (!match) {
        removedStats[req.host] = (removedStats[req.host] || 0) + 1;
      }
      return match;
    });

    for (const [host, count] of Object.entries(removedStats)) {
      Logger.debug(`[DomainFilter] Removed ${count} requests for domain: ${host}`);
    }
    
    return filtered;
  }
}
