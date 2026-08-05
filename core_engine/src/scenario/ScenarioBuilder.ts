/**
 * ScenarioBuilder.ts
 * Phase 1 – Converts a TestPlan into k6-native options.scenarios object.
 * This is the bridge between the human-facing test plan and k6's execution model.
 */

import { GlobalLoadProfile, TestPlan, UserJourney } from '../types/TestPlanSchema';
import { ExecutorFactory } from './ExecutorFactory';
import {
  DEFAULT_MAX_DURATION_MS,
  ITERATION_EXECUTORS,
  parseK6DurationToSeconds,
} from './WorkloadModels';

/** k6-native scenario definition (what goes into options.scenarios) */
export interface K6ScenarioDefinition {
  executor: string;
  exec?: string;
  startVUs?: number;
  stages?: Array<{ duration: string; target: number }>;
  vus?: number;
  duration?: string;
  maxDuration?: string;
  iterations?: number;
  rate?: number;
  timeUnit?: string;
  preAllocatedVUs?: number;
  maxVUs?: number;
  gracefulRampDown?: string;
  gracefulStop?: string;
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
  /** Per-journey transaction names injected as K6_PERF_TRANSACTION_NAMES for auto-registration. */
  journeyTransactionNames?: Record<string, string[]>;
  runtime: {
    errorBehavior: string;
    thinkTime: {
      mode: string;
      fixed?: number;
      min?: number;
      max?: number;
    };
    pacing: {
      enabled: boolean;
      mode: string;
      fixed?: number;
      min?: number;
      max?: number;
    };
    http: {
      timeoutMs: number;
      maxRedirects: number;
      throwOnError: boolean;
    };
    reporting: {
      transactionStats: string[];
      includeTransactionTable: boolean;
      includeErrorTable: boolean;
      timeseriesEnabled: boolean;
      timeseriesBucketSizeSeconds: number;
    };
    errors: {
      captureSnapshotOnFailure: boolean;
      maxSnapshotsPerRun: number;
      includeRequestHeaders: boolean;
      includeRequestBody: boolean;
      includeResponseHeaders: boolean;
      includeResponseBody: boolean;
    };
  };
}

interface ScenarioPhaseEnvelope {
  mode:
    | 'ramping-vus'
    | 'per-vu-iterations'
    | 'shared-iterations'
    | 'constant-arrival-rate'
    | 'ramping-arrival-rate'
    | 'externally-controlled'
    | 'unsupported';
  startVUs?: number;
  totalIterations?: number;
  vus?: number;
  rate?: number;
  timeUnit?: string;
  preAllocatedVUs?: number;
  maxVUs?: number;
  /**
   * Iteration executors only: absolute wall-clock budget (ms) after which k6
   * stops the scenario regardless of how many iterations remain. Always set for
   * shared-iterations / per-vu-iterations — explicitly from the plan, or from
   * k6's own 10m default — so the VU lifecycle can run endPhase before the cut.
   */
  maxDurationMs?: number;
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

  private static buildParallel(
    plan: TestPlan,
    metadata?: ScenarioRuntimeMetadata,
  ): K6ScenariosMap {
    const scenarios: K6ScenariosMap = {};

    for (const journey of plan.user_journeys) {
      const profile = journey.loadProfile ?? plan.global_load_profile;
      const executorConfig = ExecutorFactory.build(profile);
      const execName = this.sanitizeExecName(journey.name);

      scenarios[journey.name] = {
        ...executorConfig,
        exec: execName,
        // Journey is identified by k6's native `scenario` tag (the scenario key
        // is the journey name); no separate `journey` tag is emitted.
        tags: { ...journey.tags },
        env: this.buildScenarioEnv(plan, journey, execName, metadata, executorConfig.env),
      };
    }

    return scenarios;
  }

  // ---------------------------------------------
  // Sequential Mode – journeys run one after another
  // Uses startTime offsets calculated from cumulative stage durations
  // ---------------------------------------------

  private static buildSequential(
    plan: TestPlan,
    metadata?: ScenarioRuntimeMetadata,
  ): K6ScenariosMap {
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
        // Journey is identified by k6's native `scenario` tag (the scenario key
        // is the journey name); no separate `journey` tag is emitted.
        tags: { ...journey.tags },
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

  private static buildHybrid(
    plan: TestPlan,
    metadata?: ScenarioRuntimeMetadata,
  ): K6ScenariosMap {
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
            tags: { ...journey.tags },
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
            tags: { ...journey.tags },
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

    const transactionNames = metadata?.journeyTransactionNames?.[journey.name];

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
          ...(transactionNames ? { K6_PERF_TRANSACTION_NAMES: JSON.stringify(transactionNames) } : {}),
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

    // --- ramping-vus: build timeline directly from stages ---
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

    // --- per-vu-iterations: iteration-count based exit, bounded by maxDuration ---
    if (profile.executor === 'per-vu-iterations') {
      return {
        mode: 'per-vu-iterations',
        totalIterations: profile.iterations ?? 1,
        maxDurationMs: this.resolveMaxDurationMs(profile),
      };
    }

    // --- constant-vus: auto-convert to ramping-vus with synthetic 1s ramp-down ---
    // This ensures endPhase runs before k6 terminates VUs at the end of the duration.
    // Timeline: [hold at vus for (duration - 5s)] → [ramp to 0 over 5s]
    // The ramp-down starts 5s before the scenario ends to give endPhase time
    // to run before k6 stops calling the VU function at the duration boundary.
    if (profile.executor === 'constant-vus' && profile.duration && profile.vus) {
      const totalMs = this.parseDurationToSeconds(profile.duration) * 1000;
      const endPhaseBufferMs = Math.min(5000, totalMs * 0.1); // 5s or 10% of duration
      const holdMs = totalMs - endPhaseBufferMs;
      return {
        mode: 'ramping-vus',
        startVUs: profile.vus,
        timeline: [
          { endMs: holdMs, vus: profile.vus },
          { endMs: totalMs, vus: 0 },
        ],
      };
    }

    // --- shared-iterations: explicit iteration metadata for per-VU lifecycle exit ---
    if (profile.executor === 'shared-iterations' && profile.vus) {
      return {
        mode: 'shared-iterations',
        vus: profile.vus,
        totalIterations: profile.iterations ?? 1,
        maxDurationMs: this.resolveMaxDurationMs(profile),
      };
    }

    // --- constant-arrival-rate: duration-based exit with rate metadata ---
    if (profile.executor === 'constant-arrival-rate' && profile.rate && profile.duration) {
      const totalMs = this.parseDurationToSeconds(profile.duration) * 1000;
      return {
        mode: 'constant-arrival-rate',
        rate: profile.rate,
        timeUnit: profile.timeUnit ?? '1s',
        preAllocatedVUs: profile.preAllocatedVUs,
        maxVUs: profile.maxVUs,
        timeline: [{ endMs: totalMs, vus: profile.preAllocatedVUs ?? 0 }],
      };
    }

    // --- ramping-arrival-rate: stage-based rate ramp with timeline ---
    if (
      profile.executor === 'ramping-arrival-rate' &&
      profile.stages &&
      profile.stages.length > 0
    ) {
      let cumulativeMs = 0;
      const timeline = profile.stages.map((stage) => {
        cumulativeMs += this.parseDurationToSeconds(stage.duration) * 1000;
        return {
          endMs: cumulativeMs,
          vus: stage.target,
        };
      });

      return {
        mode: 'ramping-arrival-rate',
        preAllocatedVUs: profile.preAllocatedVUs,
        maxVUs: profile.maxVUs,
        timeUnit: profile.timeUnit ?? '1s',
        timeline,
      };
    }

    // --- externally-controlled: open-ended, VU count managed via k6 REST API ---
    if (profile.executor === 'externally-controlled' && profile.maxVUs) {
      return {
        mode: 'externally-controlled',
        vus: profile.vus ?? 0,
        maxVUs: profile.maxVUs,
      };
    }

    return {
      mode: 'unsupported',
    };
  }

  static computeDebugPhaseEnvelope(profile: GlobalLoadProfile): ScenarioPhaseEnvelope {
    return this.computePhaseEnvelope(profile);
  }

  /**
   * Wall-clock budget (ms) for an iteration executor: the plan's `maxDuration`
   * when set, otherwise k6's own 10m default — because k6 applies that default
   * whether or not the plan mentions it, and truncates the iteration pool there.
   */
  private static resolveMaxDurationMs(profile: GlobalLoadProfile): number {
    if (profile.maxDuration) {
      const seconds = parseK6DurationToSeconds(profile.maxDuration);
      if (seconds > 0) return seconds * 1000;
    }
    return DEFAULT_MAX_DURATION_MS;
  }

  /**
   * Estimate total duration of a load profile in seconds.
   *
   * Used for sequential/hybrid `startTime` offsets and for histogram bucket
   * sizing, so it must be an UPPER bound: under-estimating makes a sequential
   * journey start while the previous one is still running. Iteration executors
   * have no `duration`, but `maxDuration` (explicit or k6's 10m default) is
   * exactly that upper bound, so it is used instead of the generic fallback.
   */
  static estimateTotalDurationSeconds(profile: GlobalLoadProfile): number {
    if (profile.stages && profile.stages.length > 0) {
      return profile.stages.reduce((total, stage) => {
        return total + this.parseDurationToSeconds(stage.duration);
      }, 0);
    }
    if (profile.duration) {
      return this.parseDurationToSeconds(profile.duration);
    }
    if (ITERATION_EXECUTORS.includes(profile.executor)) {
      return this.resolveMaxDurationMs(profile) / 1000;
    }
    return 300; // default fallback: 5 minutes
  }

  /** Parse k6 duration strings: '2m', '30s', '1h30m' */
  private static parseDurationToSeconds(duration: string): number {
    return parseK6DurationToSeconds(duration) || 60;
  }
}
