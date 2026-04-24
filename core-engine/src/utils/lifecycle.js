import { sleep } from 'k6';
import exec from 'k6/execution';
import { Counter } from 'k6/metrics';

const frameworkIterations = new Counter('framework_iterations');

function createContext() {
  return {
    data: {},
    session: {},
    correlation: {},
    meta: {},
  };
}

function createState() {
  return {
    initialized: false,
    ended: false,
    terminated: false,
  };
}

function parseJsonEnv(name, fallback) {
  try {
    return __ENV[name] ? JSON.parse(__ENV[name]) : fallback;
  } catch {
    return fallback;
  }
}

function getRuntimeMetadata() {
  return parseJsonEnv('K6_PERF_RUNTIME_METADATA', {
    errorBehavior: 'continue',
    pacingEnabled: false,
    pacingSeconds: 0,
  });
}

function getPhaseMetadata() {
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
 *
 * @param {object} phases - The K6_PERF_PHASES envelope
 * @returns {{ target: number, isDecreasing: boolean }}
 */
function getInstantaneousState(phases) {
  const elapsedMs = Date.now() - exec.scenario.startTime;
  let previousVUs = Number(phases.startVUs || 0);
  let previousEndMs = 0;

  for (let i = 0; i < phases.timeline.length; i += 1) {
    const stage = phases.timeline[i];
    const stageEndMs = Number(stage.endMs || 0);
    const stageVUs = Number(stage.vus || 0);

    if (elapsedMs <= stageEndMs) {
      // We are inside this stage — interpolate
      const stageDuration = stageEndMs - previousEndMs;
      if (stageDuration <= 0) {
        return { target: stageVUs, isDecreasing: stageVUs < previousVUs };
      }
      const progress = (elapsedMs - previousEndMs) / stageDuration;
      const target = previousVUs + progress * (stageVUs - previousVUs);
      return { target, isDecreasing: stageVUs < previousVUs };
    }

    previousVUs = stageVUs;
    previousEndMs = stageEndMs;
  }

  // Past all stages — scenario ending
  return { target: previousVUs, isDecreasing: true };
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
function getEndSignal(phases) {
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
    const { target, isDecreasing } = getInstantaneousState(phases);
    const vuId = exec.vu.idInInstance;

    // Only trigger endPhase during decreasing stages.
    // During ramp-up, a newly spawned VU's ID may momentarily exceed
    // the interpolated target — that's expected and should NOT trigger end.
    //
    // Direct float comparison: vuId > target (no rounding).
    // This is the most precise check — VU 10 triggers as soon as target
    // drops below 10.0 (e.g., 9.99), VU 9 triggers when target drops
    // below 9.0, etc. This aligns exactly with k6's own VU removal:
    // k6 removes highest-numbered VUs first as the interpolated count
    // decreases, so our check fires at the same boundary.
    const shouldEnd = isDecreasing && vuId > target;
    return { beforeAction: shouldEnd, afterAction: shouldEnd };
  }

  return { beforeAction: false, afterAction: false };
}

function handlePhaseError(store, error, phaseName, runtime) {
  const behavior = runtime.errorBehavior || 'continue';
  console.error(`[k6-perf][${phaseName}] ${error && error.message ? error.message : String(error)}`);

  if (behavior === 'stop_vu') {
    store.state.terminated = true;
  }

  if (behavior === 'abort_test') {
    exec.test.abort(`[k6-perf][${phaseName}] Aborting test due to error: ${error && error.message ? error.message : String(error)}`);
  }

  return behavior;
}

function runSafely(store, phaseName, phaseFn, runtime) {
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

export function createJourneyLifecycleStore() {
  return {
    ctx: createContext(),
    state: createState(),
  };
}

export function runJourneyLifecycle(store, phaseFns) {
  const runtime = getRuntimeMetadata();
  const phases = getPhaseMetadata();
  const state = store.state;

  if (state.terminated || state.ended) {
    sleep(1);
    return;
  }

  if (!state.initialized) {
    const initBehavior = runSafely(store, 'init', phaseFns.initPhase, runtime);
    state.initialized = true;
    if (initBehavior === 'stop_iteration' || state.terminated) {
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
  if (actionBehavior === 'stop_iteration' || state.terminated) {
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
