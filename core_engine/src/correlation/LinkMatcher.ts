/**
 * LinkMatcher.ts
 * Phase 2 of the scan: join each consumer value to the NEAREST PRECEDING
 * producer of the same value, and group consumers that share one producer into
 * a single raw candidate (one capture → many substitutions).
 *
 * "Nearest preceding" (not "first") is deliberate: when a token is re-minted
 * mid-journey, each consumer must bind to the freshest value that came before
 * it, or the replay would send a stale token.
 */

import { ProducerOccurrence, ConsumerOccurrence, IndexedValues } from './ValueIndexer';
import { ProducerSource } from './CorrelationManifest';

export interface RawCandidate {
  value: string;
  producer: ProducerOccurrence;
  consumers: ConsumerOccurrence[];
}

/** Capture robustness order — lower is preferred when several producers tie. */
const SOURCE_PRIORITY: Record<ProducerSource, number> = {
  json: 0,
  header: 1,
  'set-cookie': 2,
  html: 3,
};

export class LinkMatcher {
  static match(indexed: IndexedValues): RawCandidate[] {
    const { producers, consumers } = indexed;

    // Group producers by exact value, sorted by recording order.
    const byValue = new Map<string, ProducerOccurrence[]>();
    for (const p of producers) {
      const arr = byValue.get(p.value);
      if (arr) arr.push(p);
      else byValue.set(p.value, [p]);
    }
    for (const arr of byValue.values()) {
      arr.sort((a, b) => a.exchangeIndex - b.exchangeIndex);
    }

    const groups = new Map<string, RawCandidate>();

    for (const consumer of consumers) {
      const prods = byValue.get(consumer.value);
      if (!prods) continue; // value never appeared in any response → not correlation

      const producer = this.pickNearestPreceding(prods, consumer.exchangeIndex);
      if (!producer) continue; // only produced AFTER this use → can't be the source

      const key = `${producer.exchangeIndex}|${producer.source}|${producer.locator}|${consumer.value}`;
      let candidate = groups.get(key);
      if (!candidate) {
        candidate = { value: consumer.value, producer, consumers: [] };
        groups.set(key, candidate);
      }
      const dup = candidate.consumers.some(
        (c) => c.requestId === consumer.requestId && c.in === consumer.in && c.locator === consumer.locator,
      );
      if (!dup) candidate.consumers.push(consumer);
    }

    return [...groups.values()];
  }

  /**
   * Among producers of a value, return the one in the latest exchange strictly
   * before `consumerIndex`. Ties at the same exchange break by source priority.
   */
  private static pickNearestPreceding(
    prods: ProducerOccurrence[],
    consumerIndex: number,
  ): ProducerOccurrence | undefined {
    let bestIndex = -1;
    for (const p of prods) {
      if (p.exchangeIndex < consumerIndex && p.exchangeIndex > bestIndex) {
        bestIndex = p.exchangeIndex;
      }
    }
    if (bestIndex === -1) return undefined;

    const atBest = prods.filter((p) => p.exchangeIndex === bestIndex);
    atBest.sort((a, b) => SOURCE_PRIORITY[a.source] - SOURCE_PRIORITY[b.source]);
    return atBest[0];
  }
}
