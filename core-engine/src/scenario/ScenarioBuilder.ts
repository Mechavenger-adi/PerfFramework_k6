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

export interface ScenarioRuntimeMetadata {
  runId: string;
  planName: string;
  environment: string;
  executionMode: TestPlan['execution_mode'];
  reportDir: string;
  generatedAt: string;
  runtime: {
    errorBehavior: string;
    thinkTimeMode: string;
    pacingEnabled: boolean;
    pacingSeconds: number;
    reporting: {
      transactionStats: string[];
      includeTransactionTable: boolean;
      includeErrorTable: boolean;
      timeseriesEnabled: boolean;
      timeseriesBucketSizeSeconds: number;
    };
  };
}

interface ScenarioPhaseEnvelope {
  mode: 'ramping-vus' | 'per-vu-iterations' | 'unsupported';
  startVUs?: number;
  totalIterations?: number;
  timeline?: Array<{
    endMs: number;
    vus: number;
  }>;
}

export class ScenarioBuilder {
  /**
   * Build a k6 options.scenarios map from a test plan.
   * Handles parallel, sequential, and hybrid execution modes.
   */
  static build(plan: TestPlan, metadata?: ScenarioRuntimeMetadata): K6ScenariosMap {
    switch (plan.execution_mode) {
      case 'parallel':
        return this.buildParallel(plan, metadata);
      case 'sequential':
        return this.buildSequential(plan, metadata);
      case 'hybrid':
        return this.buildHybrid(plan, metadata);
      default:
        throw new Error(`[ScenarioBuilder] Unknown execution_mode: '${plan.execution_mode}'`);
    }
  }

  // ---------------------------------------------
  // Parallel Mode – all journeys run concurrently
  // ---------------------------------------------

  private static buildParallel(plan: TestPlan, metadata?: ScenarioRuntimeMetadata): K6ScenariosMap {
    const scenarios: K6ScenariosMap = {};

    for (const journey of plan.user_journeys) {
      const profile = journey.loadProfile ?? plan.global_load_profile;
      const executorConfig = ExecutorFactory.build(profile);
      const execName = this.sanitizeExecName(journey.name);

      scenarios[journey.name] = {
        ...executorConfig,
        exec: execName,
        tags: { journey: journey.name, ...journey.tags },
        env: this.buildScenarioEnv(plan, journey, execName, metadata, executorConfig.env),
      };
    }

    return scenarios;
  }

  // ---------------------------------------------
  // Sequential Mode – journeys run one after another
  // Uses startTime offsets calculated from cumulative stage durations
  // ---------------------------------------------

  private static buildSequential(plan: TestPlan, metadata?: ScenarioRuntimeMetadata): K6ScenariosMap {
    const scenarios: K6ScenariosMap = {};
    let offsetSeconds = 0;

    for (const journey of plan.user_journeys) {
      const profile = journey.loadProfile ?? plan.global_load_profile;
      const executorConfig = ExecutorFactory.build(profile);
      const durationSecs = this.estimateTotalDurationSeconds(profile);
      const execName = this.sanitizeExecName(journey.name);

      scenarios[journey.name] = {
        ...executorConfig,
        exec: execName,
        tags: { journey: journey.name, ...journey.tags },
        env: this.buildScenarioEnv(plan, journey, execName, metadata, executorConfig.env),
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

  private static buildHybrid(plan: TestPlan, metadata?: ScenarioRuntimeMetadata): K6ScenariosMap {
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
          const execName = this.sanitizeExecName(name);

          scenarios[name] = {
            ...executorConfig,
            exec: execName,
            tags: { journey: name, ...journey.tags },
            env: this.buildScenarioEnv(plan, journey, execName, metadata, executorConfig.env),
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
          const execName = this.sanitizeExecName(name);

          scenarios[name] = {
            ...executorConfig,
            exec: execName,
            tags: { journey: name, ...journey.tags },
            env: this.buildScenarioEnv(plan, journey, execName, metadata, executorConfig.env),
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

  private static buildScenarioEnv(
    plan: TestPlan,
    journey: UserJourney,
    execName: string,
    metadata?: ScenarioRuntimeMetadata,
    existingEnv?: Record<string, string>,
  ): Record<string, string> | undefined {
    if (!metadata && !existingEnv) {
      return undefined;
    }

    const scenarioMetadata = metadata
      ? JSON.stringify({
          runId: metadata.runId,
          planName: metadata.planName,
          environment: metadata.environment,
          executionMode: metadata.executionMode,
          reportDir: metadata.reportDir,
          generatedAt: metadata.generatedAt,
          journeyName: journey.name,
          execName,
        })
      : undefined;

    const runtimeMetadata = metadata ? JSON.stringify(metadata.runtime) : undefined;
    const phaseMetadata = this.computePhaseEnvelope(journey.loadProfile ?? plan.global_load_profile, existingEnv);

    return {
      ...existingEnv,
      ...(metadata
        ? {
            K6_PERF_RUN_ID: metadata.runId,
            K6_PERF_PLAN_NAME: metadata.planName,
            K6_PERF_ENVIRONMENT: metadata.environment,
            K6_PERF_EXECUTION_MODE: plan.execution_mode,
            K6_PERF_REPORT_DIR: metadata.reportDir,
            K6_PERF_JOURNEY_NAME: journey.name,
            K6_PERF_EXEC_NAME: execName,
            K6_PERF_SCENARIO_METADATA: scenarioMetadata ?? '',
            K6_PERF_RUNTIME_METADATA: runtimeMetadata ?? '',
            K6_PERF_PHASES: JSON.stringify(phaseMetadata),
          }
        : {}),
    };
  }

  private static computePhaseEnvelope(
    profile: GlobalLoadProfile,
    existingEnv?: Record<string, string>,
  ): ScenarioPhaseEnvelope {
    if (existingEnv?.K6_PERF_PHASES) {
      try {
        return JSON.parse(existingEnv.K6_PERF_PHASES) as ScenarioPhaseEnvelope;
      } catch {
        // fall through to recompute
      }
    }

    if (profile.executor === 'ramping-vus' && profile.stages && profile.stages.length > 0) {
      let cumulativeMs = 0;
      const timeline = profile.stages.map((stage) => {
        cumulativeMs += this.parseDurationToSeconds(stage.duration) * 1000;
        return {
          endMs: cumulativeMs,
          vus: stage.target,
        };
      });

      return {
        mode: 'ramping-vus',
        startVUs: profile.startVUs ?? 0,
        timeline,
      };
    }

    if (profile.executor === 'per-vu-iterations') {
      return {
        mode: 'per-vu-iterations',
        totalIterations: profile.iterations ?? 1,
      };
    }

    return {
      mode: 'unsupported',
    };
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
