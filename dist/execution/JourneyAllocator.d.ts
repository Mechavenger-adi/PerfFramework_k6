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
export declare class JourneyAllocator {
    /**
     * Distribute `totalVUs` across journeys based on their weight property.
     * Falls back to equal distribution if no weights are defined.
     *
     * Rules:
     * - Every journey gets at least 1 VU.
     * - Rounding remainder goes to the highest-weight journey.
     * - Explicit vus override on a journey takes priority over weight.
     */
    static allocate(journeys: UserJourney[], totalVUs: number): JourneyAllocation[];
    /** Print allocation table to console */
    static printTable(allocations: JourneyAllocation[]): void;
}
//# sourceMappingURL=JourneyAllocator.d.ts.map