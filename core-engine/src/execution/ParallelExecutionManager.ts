/**
 * ParallelExecutionManager.ts
 * Phase 1 – Orchestrates execution mode, wires up VU allocations,
 * and produces the final k6 options object ready for injection.
 */

import { ThresholdManager } from '../assertions/ThresholdManager';
import { K6ScenariosMap, ScenarioBuilder, ScenarioRuntimeMetadata } from '../scenario/ScenarioBuilder';
import { TestPlan } from '../types/TestPlanSchema';
import { JourneyAllocator } from './JourneyAllocator';

export interface K6Options {
  scenarios: K6ScenariosMap;
  thresholds?: Record<string, string[]>;
  summaryTrendStats?: string[];
  tags?: Record<string, string>;
  [key: string]: unknown;
}

export class ParallelExecutionManager {
  /**
   * Resolve the full k6 options object from a test plan.
   * Handles VU allocation for parallel weighted journeys.
   */
  static resolve(plan: TestPlan, runtimeMetadata?: ScenarioRuntimeMetadata): K6Options {
    const summaryTrendStats = this.buildSummaryTrendStats(runtimeMetadata);

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
          noCookiesReset: plan.noCookiesReset !== false,
          summaryTrendStats,
          scenarios: ScenarioBuilder.build(modifiedPlan, runtimeMetadata),
          thresholds: ThresholdManager.apply(modifiedPlan)
        };
      }
    }

    return { 
      noCookiesReset: plan.noCookiesReset !== false,
      summaryTrendStats,
      scenarios: ScenarioBuilder.build(plan, runtimeMetadata),
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

  /**
   * Build the summaryTrendStats array for k6 options.
   * Merges the k6 defaults (avg, min, med, max, p(90), p(95)) with any
   * additional percentiles configured in runtime reporting.transactionStats.
   * Without this, k6 wouldn't compute custom percentiles like p(97) or p(99).
   */
  private static buildSummaryTrendStats(runtimeMetadata?: ScenarioRuntimeMetadata): string[] {
    const k6Defaults = ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'];
    const configured = runtimeMetadata?.runtime?.reporting?.transactionStats ?? [];

    const extraPercentiles = configured
      .map((s) => {
        // Match p(N) or pN notation
        const match = s.trim().toLowerCase().match(/^p\(?(\d+(?:\.\d+)?)\)?$/);
        return match ? `p(${match[1]})` : null;
      })
      .filter((p): p is string => p !== null);

    const merged = new Set([...k6Defaults, ...extraPercentiles]);
    return [...merged];
  }
}
