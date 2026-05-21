// @ts-ignore - K6 runtime module
import { sleep } from 'k6';
// @ts-ignore - K6 runtime module
import exec from 'k6/execution';
// @ts-ignore - K6 runtime module
import { Counter } from 'k6/metrics';
import { isVuTerminated } from './transaction.js';

declare const __ENV: Record<string, string | undefined>;

// ── Types ─────────────────────────────────────────────────────

interface JourneyContext {
  data: Record<string, unknown>;
  session: Record<string, unknown>;
  correlation: Record<string, unknown>;
  meta: Record<string, unknown>;
}

interface JourneyState {
  initialized: boolean;
  ended: boolean;
  terminated: boolean;
}

export interface JourneyLifecycleStore {
  ctx: JourneyContext;
  state: JourneyState;
}

export interface PhaseFns {
  initPhase?: (ctx: JourneyContext) => void;
  actionPhase?: (ctx: JourneyContext) => void;
  endPhase?: (ctx: JourneyContext) => void;
}

interface RuntimeMetadata {
  errorBehavior: string;
  pacingEnabled: boolean;
  pacingSeconds: number;
}

interface PhaseMetadata {
  mode: string;
  timeline?: TimelineStage[];
  startVUs?: number;
  totalIterations?: number;
  vus?: number;
  // arrival-rate executor fields
  rate?: number;
  timeUnit?: string;
  preAllocatedVUs?: number;
  maxVUs?: number;
}

interface TimelineStage {
  endMs: number;
  vus: number;
}

interface InstantaneousState {
  target: number;
  isDecreasing: boolean;
  /** True only when we are in the LAST stage of the timeline and it is ramping down to 0 */
  isFinalRampDown: boolean;
}

interface EndSignal {
  beforeAction: boolean;
  afterAction: boolean;
}

// ── Implementation ────────────────────────────────────────────

const frameworkIterations = new Counter('framework_iterations');

function createContext(): JourneyContext {
  return {
    data: {},
    session: {},
    correlation: {},
    meta: {},
  };
}

function createState(): JourneyState {
  return {
    initialized: false,
    ended: false,
    terminated: false,
  };
}

function parseJsonEnv<T>(name: string, fallback: T): T {
  try {
    return __ENV[name] ? JSON.parse(__ENV[name]!) : fallback;
  } catch {
    return fallback;
  }
}

function getRuntimeMetadata(): RuntimeMetadata {
  return parseJsonEnv('K6_PERF_RUNTIME_METADATA', {
    errorBehavior: 'continue',
    pacingEnabled: false,
    pacingSeconds: 0,
  });
}

function getPhaseMetadata(): PhaseMetadata {
  return parseJsonEnv('K6_PERF_PHASES', {
    mode: 'unsupported',
  });
}

// ------------------------------------------------------------------
// Instantaneous VU Target Interpolation
// ------------------------------------------------------------------
// Computes the exact target VU count RIGHT NOW by linearly interpolating
// across all stages. Also tracks whether the current stage is ramping
// DOWN (decreasing) so we only trigger endPhase during ramp-down, never
// during ramp-up where a VU's ID might temporarily exceed the target.
//
// Uses Math.floor() instead of Math.ceil() because k6 starts removing
// excess VUs as soon as the integer target drops. With ceil, our check
// lags behind k6's removal by up to 1.5s — enough for k6 to kill VUs
// before they get a chance to run endPhase.
// ------------------------------------------------------------------

/**
 * Compute the instantaneous target VU count and whether we're in a
 * decreasing stage.
 */
function getInstantaneousState(phases: PhaseMetadata): InstantaneousState {
  const elapsedMs = Date.now() - exec.scenario.startTime;
  let previousVUs = Number(phases.startVUs || 0);
  let previousEndMs = 0;
  const timeline = phases.timeline!;
  const lastStageIdx = timeline.length - 1;

  for (let i = 0; i < timeline.length; i += 1) {
    const stage = timeline[i];
    const stageEndMs = Number(stage.endMs || 0);
    const stageVUs = Number(stage.vus || 0);

    if (elapsedMs <= stageEndMs) {
      // We are inside this stage — interpolate
      const stageDuration = stageEndMs - previousEndMs;
      const isDecreasing = stageVUs < previousVUs;
      const isFinalRampDown = i === lastStageIdx && isDecreasing;
      if (stageDuration <= 0) {
        return { target: stageVUs, isDecreasing, isFinalRampDown };
      }
      const progress = (elapsedMs - previousEndMs) / stageDuration;
      const target = previousVUs + progress * (stageVUs - previousVUs);
      return { target, isDecreasing, isFinalRampDown };
    }

    previousVUs = stageVUs;
    previousEndMs = stageEndMs;
  }

  // Past all stages — scenario ending
  return { target: previousVUs, isDecreasing: true, isFinalRampDown: true };
}

/**
 * Determine whether this VU should transition to endPhase.
 *
 * Returns { beforeAction, afterAction } where:
 *   beforeAction: true → skip action, run endPhase immediately
 *   afterAction:  true → after current action completes, run endPhase
 *
 * Key design choices:
 *   - Uses Math.floor(target) so the check fires as soon as k6 starts
 *     removing VUs, not 1.5s later (which Math.ceil would cause).
 *   - Only fires during DECREASING stages to prevent false triggers
 *     during ramp-up when a new VU's ID momentarily exceeds the target.
 *   - k6 removes highest-numbered VUs first, so vuId > floor(target)
 *     correctly identifies which VUs should run endPhase.
 */
function getEndSignal(phases: PhaseMetadata): EndSignal {
  // --- Per-VU Iterations ---
  if (phases.mode === 'per-vu-iterations') {
    const totalIterations = Math.max(Number(phases.totalIterations || 1), 1);
    const completedIterations = exec.vu.iterationInScenario;
    const willCompleteAfterThisAction = completedIterations >= totalIterations - 1;
    return { beforeAction: false, afterAction: willCompleteAfterThisAction };
  }

  // --- Shared Iterations ---
  if (phases.mode === 'shared-iterations') {
    const totalIterations = Math.max(Number(phases.totalIterations || 1), 1);
    const vus = Math.max(Number(phases.vus || 1), 1);
    const iterationsAssignedToThisVu = Math.max(
      Math.ceil((totalIterations - (exec.vu.idInInstance - 1)) / vus),
      0,
    );

    if (iterationsAssignedToThisVu <= 0) {
      return {
        beforeAction: exec.vu.iterationInScenario === 0,
        afterAction: false,
      };
    }

    const completedIterations = exec.vu.iterationInScenario;
    const willCompleteAfterThisAction = completedIterations >= iterationsAssignedToThisVu - 1;
    return { beforeAction: false, afterAction: willCompleteAfterThisAction };
  }

  // --- Ramping VUs (handles load, spike, step, soak, stress, constant-vus) ---
  if (phases.mode === 'ramping-vus' && Array.isArray(phases.timeline)) {
    const { target, isDecreasing, isFinalRampDown } = getInstantaneousState(phases);
    const vuId = exec.vu.idInInstance;

    // Only trigger endPhase during DECREASING stages to prevent false triggers
    // during ramp-up. Additionally, only mark the VU as permanently ended if
    // this is the FINAL ramp-down — intermediate decreases in step-up or
    // multi-spike tests must NOT permanently end the VU (it will ramp back up).
    const shouldRunEndPhase = isDecreasing && vuId > target;
    const shouldPermanentlyEnd = shouldRunEndPhase && isFinalRampDown;

    return { beforeAction: shouldPermanentlyEnd, afterAction: shouldPermanentlyEnd };
  }

  // --- Arrival-Rate executors (constant-arrival-rate / ramping-arrival-rate) ---
  // k6 controls the VU pool size for these executors — end detection is purely
  // time-based.  Once elapsed time reaches the total scenario duration, any VU
  // that is about to start a new action (beforeAction) or has just finished one
  // (afterAction) will run endPhase instead.
  if (
    (phases.mode === 'constant-arrival-rate' || phases.mode === 'ramping-arrival-rate') &&
    Array.isArray(phases.timeline) &&
    phases.timeline.length > 0
  ) {
    const totalDurationMs = phases.timeline[phases.timeline.length - 1].endMs;
    const elapsedMs = Date.now() - exec.scenario.startTime;
    const isDone = elapsedMs >= totalDurationMs;
    return { beforeAction: isDone, afterAction: isDone };
  }

  return { beforeAction: false, afterAction: false };
}

function handlePhaseError(
  store: JourneyLifecycleStore,
  error: unknown,
  phaseName: string,
  runtime: RuntimeMetadata,
): string {
  const behavior = runtime.errorBehavior || 'continue';
  const message = error && typeof error === 'object' && 'message' in error
    ? (error as Error).message
    : String(error);
  console.error(`[k6-perf][${phaseName}] ${message}`);

  if (behavior === 'stop_vu') {
    store.state.terminated = true;
  }

  if (behavior === 'abort_test') {
    exec.test.abort(`[k6-perf][${phaseName}] Aborting test due to error: ${message}`);
  }

  return behavior;
}

function runSafely(
  store: JourneyLifecycleStore,
  phaseName: string,
  phaseFn: ((ctx: JourneyContext) => void) | undefined,
  runtime: RuntimeMetadata,
): string {
  if (!phaseFn) {
    return 'continue';
  }

  try {
    phaseFn(store.ctx);
    return 'continue';
  } catch (error) {
    return handlePhaseError(store, error, phaseName, runtime);
  }
}

export function createJourneyLifecycleStore(): JourneyLifecycleStore {
  return {
    ctx: createContext(),
    state: createState(),
  };
}

export function thinktime(minOrFixed?: number, max?: number): void {
  const runtime = getRuntimeMetadata();
  const thinkTime = (runtime as any).thinkTime;

  if (thinkTime?.ignoreThinkTime) {
    return; // Skip think time completely
  }

  let durationToSleep = 1;

  if (minOrFixed !== undefined && max !== undefined) {
    // User provided a range in the script: thinktime(2, 5)
    durationToSleep = minOrFixed + Math.random() * (max - minOrFixed);
  } else if (minOrFixed !== undefined) {
    // User provided a fixed value in the script: thinktime(3)
    durationToSleep = minOrFixed;
  }

  if (!thinkTime || thinkTime.globalOverride !== false) {
    // Apply global framework think time
    if (thinkTime?.mode === 'random') {
      const min = Number(thinkTime.min ?? 0.5);
      const max = Number(thinkTime.max ?? 3);
      durationToSleep = min + Math.random() * (max - min);
    } else {
      // fixed mode
      durationToSleep = Number(thinkTime?.fixed ?? 1);
    }
  }

  if (durationToSleep > 0) {
    sleep(durationToSleep);
  }
}

// ── Transaction Gate ──────────────────────────────────────────
// Provides executor-aware lifecycle state to the transaction() wrapper.
// C1: lifecycle.ts is the only owner of ramp-down / end-detection logic.
// C2: transaction.ts must obtain this state through this explicit contract.

export interface TransactionGate {
  shouldSkipBeforeStart: boolean;
  errorBehavior: string;
  onSkip: (name: string) => void;
}

export function getTransactionGate(): TransactionGate {
  const phases = getPhaseMetadata();
  const runtime = getRuntimeMetadata();
  const endSignal = getEndSignal(phases);
  return {
    shouldSkipBeforeStart: endSignal.beforeAction,
    errorBehavior: runtime.errorBehavior || 'continue',
    onSkip: (name: string) => {
      console.log(`[k6-perf][lifecycle] Skipping action transaction '${name}' — VU lifecycle ending`);
    },
  };
}

export function runJourneyLifecycle(store: JourneyLifecycleStore, phaseFns: PhaseFns): void {
  const runtime = getRuntimeMetadata();
  const phases = getPhaseMetadata();
  const state = store.state;

  if (state.terminated || state.ended || isVuTerminated()) {
    // Park the VU for the rest of the scenario. Without this sleep, default()
    // returns instantly and k6 immediately starts another iteration, tight-looping
    // at ~300+ iter/s and inflating the iteration counter to hundreds of thousands.
    // k6 interrupts this sleep cleanly when the scenario ends.
    sleep(86400);
    return;
  }

  if (!state.initialized) {
    const initBehavior = runSafely(store, 'init', phaseFns.initPhase, runtime);
    state.initialized = true;
    if (initBehavior !== 'continue' || state.terminated) {
      return;
    }
  }

  // Check if this VU should transition to endPhase BEFORE running another
  // action iteration. For ramping-vus this fires as soon as the interpolated
  // target VU count drops below this VU's ID (during a decreasing stage).
  const endSignal = getEndSignal(phases);
  if (endSignal.beforeAction && phaseFns.endPhase) {
    runSafely(store, 'end', phaseFns.endPhase, runtime);
    state.ended = true;
    return;
  }

  frameworkIterations.add(1);
  const actionBehavior = runSafely(store, 'action', phaseFns.actionPhase, runtime);
  if (actionBehavior !== 'continue' || state.terminated || isVuTerminated()) {
    return;
  }

  if (runtime.pacingEnabled && Number(runtime.pacingSeconds || 0) > 0) {
    sleep(Number(runtime.pacingSeconds));
  }

  // Re-check end signal after action — the ramp-down may have started
  // while the action phase was executing. This is critical: k6 will NOT
  // call runJourneyLifecycle again for this VU if k6 has marked it for
  // removal. So this is the last chance to run endPhase.
  const postActionSignal = getEndSignal(phases);
  if ((endSignal.afterAction || postActionSignal.afterAction) && phaseFns.endPhase) {
    runSafely(store, 'end', phaseFns.endPhase, runtime);
    state.ended = true;
  }
}
