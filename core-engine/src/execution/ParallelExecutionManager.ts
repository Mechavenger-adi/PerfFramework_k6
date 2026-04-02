/**
 * ParallelExecutionManager.ts
 * Phase 1 – Orchestrates execution mode, wires up VU allocations,
 * and produces the final k6 options object ready for injection.
 */

import { TestPlan } from '../types/TestPlanSchema';
import { ScenarioBuilder, K6ScenariosMap } from '../scenario/ScenarioBuilder';
import { JourneyAllocator } from './JourneyAllocator';
import { ThresholdManager } from '../assertions/ThresholdManager';

export interface K6Options {
  scenarios: K6ScenariosMap;
  thresholds?: Record<string, string[]>;
  tags?: Record<string, string>;
  [key: string]: unknown;
}

export class ParallelExecutionManager {
  /**
   * Resolve the full k6 options object from a test plan.
   * Handles VU allocation for parallel weighted journeys.
   */
  static resolve(plan: TestPlan): K6Options {
    // For parallel execution with weights, we recalculate per-journey VUs
    if (plan.execution_mode === 'parallel') {
      const maxVUs = this.extractMaxVUs(plan);

      // If journeys have weights, distribute VUs proportionally
      const hasWeights = plan.user_journeys.some((j) => j.weight !== undefined);
      if (hasWeights && maxVUs > 0) {
        const allocations = JourneyAllocator.allocate(plan.user_journeys, maxVUs);
        JourneyAllocator.printTable(allocations);

        // Build a modified plan with explicit per-journey VU counts applied to their profile
        const modifiedPlan: TestPlan = {
          ...plan,
          user_journeys: plan.user_journeys.map((journey) => {
            const allocation = allocations.find((a) => a.journeyName === journey.name);
            if (!allocation) return journey;

            const profile = journey.loadProfile ?? plan.global_load_profile;
            return {
              ...journey,
              loadProfile: this.scaleProfileToVUs(profile, allocation.allocatedVUs),
            };
          }),
        };

        return { 
          scenarios: ScenarioBuilder.build(modifiedPlan),
          thresholds: ThresholdManager.apply(modifiedPlan)
        };
      }
    }

    return { 
      scenarios: ScenarioBuilder.build(plan),
      thresholds: ThresholdManager.apply(plan)
    };
  }

  /**
   * Extract the peak VU count from the global load profile.
   * Used for weight-based proportional distribution.
   */
  private static extractMaxVUs(plan: TestPlan): number {
    const profile = plan.global_load_profile;

    if (profile.stages && profile.stages.length > 0) {
      return Math.max(...profile.stages.map((s) => s.target));
    }
    return profile.vus ?? 0;
  }

  /**
   * Scale a load profile's VU count to the allocated amount.
   * Preserves stage ratios for ramping profiles.
   */
  private static scaleProfileToVUs(
    profile: TestPlan['global_load_profile'],
    allocatedVUs: number,
  ): TestPlan['global_load_profile'] {
    if (profile.stages && profile.stages.length > 0) {
      const peak = Math.max(...profile.stages.map((s) => s.target));
      if (peak === 0) return profile;

      const ratio = allocatedVUs / peak;
      return {
        ...profile,
        startVUs: Math.max(0, Math.round((profile.startVUs ?? 0) * ratio)),
        stages: profile.stages.map((stage) => ({
          ...stage,
          target: Math.max(stage.target === 0 ? 0 : 1, Math.round(stage.target * ratio)),
        })),
      };
    }

    return { ...profile, vus: allocatedVUs };
  }
}
