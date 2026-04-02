/**
 * JourneyAllocator.ts
 * Phase 1 – Pure function: distributes total VUs across user journeys by weight.
 * Guarantees every journey gets at least 1 VU and total never exceeds limit.
 */

import { UserJourney } from '../types/TestPlanSchema';

export interface JourneyAllocation {
  journeyName: string;
  allocatedVUs: number;
  weight: number;
}

export class JourneyAllocator {
  /**
   * Distribute `totalVUs` across journeys based on their weight property.
   * Falls back to equal distribution if no weights are defined.
   *
   * Rules:
   * - Every journey gets at least 1 VU.
   * - Rounding remainder goes to the highest-weight journey.
   * - Explicit vus override on a journey takes priority over weight.
   */
  static allocate(journeys: UserJourney[], totalVUs: number): JourneyAllocation[] {
    if (journeys.length === 0) {
      throw new Error('[JourneyAllocator] No journeys to allocate VUs to.');
    }
    if (totalVUs < journeys.length) {
      throw new Error(
        `[JourneyAllocator] totalVUs (${totalVUs}) is less than number of journeys (${journeys.length}). Each journey needs at least 1 VU.`,
      );
    }

    // Separate explicit VU overrides from weight-based
    const explicitVUsTotal = journeys.reduce((sum, j) => sum + (j.vus ?? 0), 0);
    const weightBasedJourneys = journeys.filter((j) => j.vus === undefined);
    const remainingVUs = totalVUs - explicitVUsTotal;

    if (remainingVUs < weightBasedJourneys.length && weightBasedJourneys.length > 0) {
      throw new Error(
        `[JourneyAllocator] After explicit VU assignments (${explicitVUsTotal} VUs), only ${remainingVUs} VUs remain for ${weightBasedJourneys.length} weight-based journeys. Not enough for minimum 1 VU each.`,
      );
    }

    // Normalize weights
    const totalWeight = weightBasedJourneys.reduce((sum, j) => sum + (j.weight ?? 1), 0);

    const allocations: JourneyAllocation[] = journeys.map((journey) => {
      if (journey.vus !== undefined) {
        return { journeyName: journey.name, allocatedVUs: journey.vus, weight: 100 };
      }

      const w = journey.weight ?? 1;
      const rawVUs = (w / totalWeight) * remainingVUs;
      return {
        journeyName: journey.name,
        allocatedVUs: Math.max(1, Math.floor(rawVUs)),
        weight: w,
      };
    });

    // Distribute rounding remainder to highest-weight weight-based journey
    const allocated = allocations.reduce((s, a) => s + a.allocatedVUs, 0);
    const remainder = totalVUs - allocated;
    if (remainder > 0) {
      const sorted = [...allocations]
        .filter((a) => journeys.find((j) => j.name === a.journeyName)?.vus === undefined)
        .sort((a, b) => b.weight - a.weight);
      if (sorted.length > 0) sorted[0].allocatedVUs += remainder;
    }

    return allocations;
  }

  /** Print allocation table to console */
  static printTable(allocations: JourneyAllocation[]): void {
    const total = allocations.reduce((s, a) => s + a.allocatedVUs, 0);
    console.log('\n+-------------------------------------+------+--------+');
    console.log('| Journey                             | Wgt  | VUs    |');
    console.log('+-------------------------------------+------+--------+');
    for (const a of allocations) {
      const name = a.journeyName.slice(0, 35).padEnd(35);
      const w = `${a.weight}%`.padStart(4);
      const v = String(a.allocatedVUs).padStart(6);
      console.log(`| ${name} | ${w} | ${v} |`);
    }
    console.log('+-------------------------------------+------+--------+');
    console.log(`| ${'TOTAL'.padEnd(35)} |      | ${String(total).padStart(6)} |`);
    console.log('+-------------------------------------+------+--------+\n');
  }
}
