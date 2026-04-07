import exec from 'k6/execution';
import { sleep } from 'k6';
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

function getEndSignal(phases) {
  if (phases.mode === 'per-vu-iterations') {
    const totalIterations = Math.max(Number(phases.totalIterations || 1), 1);
    return {
      beforeAction: false,
      afterAction: exec.vu.iterationInScenario >= totalIterations - 1,
    };
  }

  if (phases.mode === 'ramping-vus' && Array.isArray(phases.timeline)) {
    const elapsedMs = Date.now() - exec.scenario.startTime;
    const vuId = exec.vu.idInInstance;
    let previousVUs = Number(phases.startVUs || 0);
    let previousEndMs = 0;

    for (let i = 0; i < phases.timeline.length; i += 1) {
      const stage = phases.timeline[i];
      const currentVUs = Number(stage.vus || 0);
      if (currentVUs < previousVUs && vuId > currentVUs && vuId <= previousVUs) {
        const removedCount = previousVUs - currentVUs;
        const offset = previousVUs - vuId;
        const segmentDuration = Number(stage.endMs || 0) - previousEndMs;
        const exitMs = previousEndMs + (segmentDuration * (offset / Math.max(removedCount, 1)));
        const shouldEnd = elapsedMs >= exitMs;
        return {
          beforeAction: shouldEnd,
          afterAction: shouldEnd,
        };
      }
      previousVUs = currentVUs;
      previousEndMs = Number(stage.endMs || 0);
    }
  }

  return {
    beforeAction: false,
    afterAction: false,
  };
}

function handlePhaseError(store, error, phaseName, runtime) {
  const behavior = runtime.errorBehavior || 'continue';
  console.error(`[k6-perf][${phaseName}] ${error && error.message ? error.message : String(error)}`);

  if (behavior === 'stop_vu') {
    store.state.terminated = true;
  }

  if (behavior === 'abort_test') {
    throw error;
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

  // Re-check end signal after action — VU's exit time may have arrived during action
  const postActionSignal = getEndSignal(phases);
  if ((endSignal.afterAction || postActionSignal.afterAction) && phaseFns.endPhase) {
    runSafely(store, 'end', phaseFns.endPhase, runtime);
    state.ended = true;
  }
}
