import { HAREntry } from '../types/HARContracts';
import { Logger } from '../utils/logger';

export interface DomainStat {
  host: string;
  count: number;
}

export class DomainFilter {
  /**
   * Summarize domains present in the HAR so the CLI can present user choices.
   */
  static summarize(entries: HAREntry[]): DomainStat[] {
    const counts = new Map<string, number>();

    for (const entry of entries) {
      const host = entry.host || 'unknown-host';
      counts.set(host, (counts.get(host) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([host, count]) => ({ host, count }))
      .sort((a, b) => b.count - a.count || a.host.localeCompare(b.host));
  }

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
