/**
 * ScenarioBuilder.ts
 * Phase 1 – Converts a TestPlan into k6-native options.scenarios object.
 * This is the bridge between the human-facing test plan and k6's execution model.
 */

import { TestPlan, UserJourney, GlobalLoadProfile } from '../types/TestPlanSchema';
import { ExecutorFactory } from './ExecutorFactory';

/** k6-native scenario definition (what goes into options.scenarios) */
export interface K6ScenarioDefinition {
  executor: string;
  exec?: string;
  startVUs?: number;
  stages?: Array<{ duration: string; target: number }>;
  vus?: number;
  duration?: string;
  iterations?: number;
  startTime?: string;
  tags?: Record<string, string>;
  env?: Record<string, string>;
}

export type K6ScenariosMap = Record<string, K6ScenarioDefinition>;

export class ScenarioBuilder {
  /**
   * Build a k6 options.scenarios map from a test plan.
   * Handles parallel, sequential, and hybrid execution modes.
   */
  static build(plan: TestPlan): K6ScenariosMap {
    switch (plan.execution_mode) {
      case 'parallel':
        return this.buildParallel(plan);
      case 'sequential':
        return this.buildSequential(plan);
      case 'hybrid':
        return this.buildHybrid(plan);
      default:
        throw new Error(`[ScenarioBuilder] Unknown execution_mode: '${plan.execution_mode}'`);
    }
  }

  // ---------------------------------------------
  // Parallel Mode – all journeys run concurrently
  // ---------------------------------------------

  private static buildParallel(plan: TestPlan): K6ScenariosMap {
    const scenarios: K6ScenariosMap = {};

    for (const journey of plan.user_journeys) {
      const profile = journey.loadProfile ?? plan.global_load_profile;
      const executorConfig = ExecutorFactory.build(profile);

      scenarios[journey.name] = {
        ...executorConfig,
        exec: this.sanitizeExecName(journey.name),
        tags: { journey: journey.name, ...journey.tags },
      };
    }

    return scenarios;
  }

  // ---------------------------------------------
  // Sequential Mode – journeys run one after another
  // Uses startTime offsets calculated from cumulative stage durations
  // ---------------------------------------------

  private static buildSequential(plan: TestPlan): K6ScenariosMap {
    const scenarios: K6ScenariosMap = {};
    let offsetSeconds = 0;

    for (const journey of plan.user_journeys) {
      const profile = journey.loadProfile ?? plan.global_load_profile;
      const executorConfig = ExecutorFactory.build(profile);
      const durationSecs = this.estimateTotalDurationSeconds(profile);

      scenarios[journey.name] = {
        ...executorConfig,
        exec: this.sanitizeExecName(journey.name),
        tags: { journey: journey.name, ...journey.tags },
        // k6 uses string startTime in sequential scenarios
        ...(offsetSeconds > 0 && { startTime: `${offsetSeconds}s` }),
      };

      offsetSeconds += durationSecs;
    }

    return scenarios;
  }

  // ---------------------------------------------
  // Hybrid Mode – groups of journeys with mixed modes
  // ---------------------------------------------

  private static buildHybrid(plan: TestPlan): K6ScenariosMap {
    if (!plan.hybrid_groups || plan.hybrid_groups.length === 0) {
      throw new Error('[ScenarioBuilder] Hybrid mode requires hybrid_groups to be defined.');
    }

    const journeyMap = new Map<string, UserJourney>(plan.user_journeys.map((j) => [j.name, j]));
    const scenarios: K6ScenariosMap = {};
    let groupOffset = 0;

    for (const group of plan.hybrid_groups) {
      if (group.mode === 'parallel') {
        for (const name of group.journeys) {
          const journey = journeyMap.get(name);
          if (!journey) throw new Error(`[ScenarioBuilder] Journey '${name}' not found in hybrid group.`);
          const profile = journey.loadProfile ?? plan.global_load_profile;
          const executorConfig = ExecutorFactory.build(profile);

          scenarios[name] = {
            ...executorConfig,
            exec: this.sanitizeExecName(name),
            tags: { journey: name, ...journey.tags },
            ...(groupOffset > 0 && { startTime: `${groupOffset}s` }),
          };
        }

        // Advance offset by the longest journey in this parallel group
        const maxDuration = Math.max(
          ...group.journeys.map((name) => {
            const journey = journeyMap.get(name);
            const profile = journey?.loadProfile ?? plan.global_load_profile;
            return this.estimateTotalDurationSeconds(profile);
          }),
        );
        groupOffset += maxDuration;
      } else {
        // sequential sub-group
        for (const name of group.journeys) {
          const journey = journeyMap.get(name);
          if (!journey) throw new Error(`[ScenarioBuilder] Journey '${name}' not found in hybrid group.`);
          const profile = journey.loadProfile ?? plan.global_load_profile;
          const executorConfig = ExecutorFactory.build(profile);
          const durationSecs = this.estimateTotalDurationSeconds(profile);

          scenarios[name] = {
            ...executorConfig,
            exec: this.sanitizeExecName(name),
            tags: { journey: name, ...journey.tags },
            startTime: `${groupOffset}s`,
          };
          groupOffset += durationSecs;
        }
      }
    }

    return scenarios;
  }

  // ---------------------------------------------
  // Utilities
  // ---------------------------------------------

  /** Sanitize journey name to a valid k6 exec function name */
  private static sanitizeExecName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  /** Estimate total duration of a load profile in seconds */
  private static estimateTotalDurationSeconds(profile: GlobalLoadProfile): number {
    if (profile.stages && profile.stages.length > 0) {
      return profile.stages.reduce((total, stage) => {
        return total + this.parseDurationToSeconds(stage.duration);
      }, 0);
    }
    if (profile.duration) {
      return this.parseDurationToSeconds(profile.duration);
    }
    return 300; // default fallback: 5 minutes
  }

  /** Parse k6 duration strings: '2m', '30s', '1h30m' */
  private static parseDurationToSeconds(duration: string): number {
    let total = 0;
    const matches = duration.matchAll(/(\d+(?:\.\d+)?)(h|m|s)/g);
    for (const match of matches) {
      const value = parseFloat(match[1]);
      switch (match[2]) {
        case 'h': total += value * 3600; break;
        case 'm': total += value * 60; break;
        case 's': total += value; break;
      }
    }
    return total || 60;
  }
}
