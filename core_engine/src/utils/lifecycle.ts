// @ts-ignore - K6 runtime module
import { sleep } from 'k6';
// @ts-ignore - K6 runtime module
import exec from 'k6/execution';
// @ts-ignore - K6 runtime module
import { Counter } from 'k6/metrics';
import { isVuTerminated, isJsRuntimeError } from './transaction.js';
import { trackCorrelation, trackParameter } from './replayLogger.js';

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
  pacing?: {
    enabled?: boolean;
    mode?: string;
    fixed?: number;
    min?: number;
    max?: number;
  };
}

interface PhaseMetadata {
  mode: string;
  timeline?: TimelineStage[];
  startVUs?: number;
  totalIterations?: number;
  vus?: number;
  /** Iteration executors: wall-clock budget (ms) k6 enforces via maxDuration. */
  maxDurationMs?: number;
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

// ── Implementation ────────────────────────────────────────────

const frameworkIterations = new Counter('framework_iterations');

/**
 * Wraps a context sub-object in a Proxy so that every scalar assignment
 * (`ctx.correlation["x"] = v`, `ctx.session.token = v`, etc.) is automatically
 * registered in the replay variable registry.  detectVariableEvents then finds
 * those values inside request URLs/bodies/headers and maps them back to their
 * variable names — no trackCorrelation / trackParameter calls needed in scripts.
 */
function createTrackedProxy(sourceName: string, type: 'correlation' | 'parameter'): Record<string, unknown> {
  return new Proxy({} as Record<string, unknown>, {
    set(target, prop, value) {
      target[prop as string] = value;
      // Only register scalar values — objects/arrays can't appear verbatim in a URL
      if (value !== null && value !== undefined && typeof value !== 'object') {
        if (type === 'correlation') {
          trackCorrelation(String(prop), value, sourceName);
        } else {
          trackParameter(String(prop), value, sourceName);
        }
      }
      return true;
    },
  });
}

function createContext(): JourneyContext {
  return {
    data: createTrackedProxy('data', 'parameter'),
    session: createTrackedProxy('session', 'parameter'),
    correlation: createTrackedProxy('correlation', 'correlation'),
    meta: createTrackedProxy('meta', 'parameter'),
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
    pacing: { enabled: false },
  });
}

/**
 * Pacing: a sleep applied at the END of the action phase — i.e. BETWEEN action
 * iterations — to control how often each VU starts a new iteration. Mirrors
 * think time's fixed/random modes, but where think time spaces transactions
 * WITHIN an action, pacing spaces the iterations themselves. Computed fresh each
 * call so 'random' varies per iteration.
 */
function applyPacing(runtime: RuntimeMetadata): void {
  const pacing = runtime.pacing;
  if (!pacing || !pacing.enabled) return;

  let seconds: number;
  if (pacing.mode === 'random') {
    const min = Number(pacing.min ?? 0);
    const max = Number(pacing.max ?? 0);
    seconds = max > min ? min + Math.random() * (max - min) : min;
  } else {
    seconds = Number(pacing.fixed ?? 0);
  }

  if (seconds > 0) {
    sleep(seconds);
  }
}

function getPhaseMetadata(): PhaseMetadata {
  return parseJsonEnv('K6_PERF_PHASES', {
    mode: 'unsupported',
  });
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

  // A genuine JavaScript runtime error (ReferenceError, TypeError, …) raised
  // OUTSIDE a transaction() (e.g. directly in init/end phase code) is a script
  // bug that recurs every iteration — abort the test regardless of errorBehavior
  // (continue included), same as inside transaction().
  if (isJsRuntimeError(error)) {
    const errName = (error as Error).name;
    console.error(
      `[k6-perf][${phaseName}] FATAL ${errName}: ${message}\n` +
      `  → aborting test: a JavaScript runtime error is a script bug, not subject to errorBehavior (was '${behavior}')`,
    );
    exec.test.abort(`[k6-perf][${phaseName}] ${errName}: ${message}`);
    return 'abort_test';
  }

  console.error(`[k6-perf][${phaseName}] ${message}`);

  // FR6 — `stop_iteration` is an ACTION-phase policy: end this iteration, resume
  // with the next. initPhase runs ONCE per VU, OUTSIDE the iteration loop, so
  // there is no "next init" to resume into. Left as-is, the VU skipped the rest
  // of its login and then ran actionPhase on every later iteration against a
  // session that was never established — a permanent stream of 401/403s that
  // describes the framework, not the system under test. LoadRunner (whose
  // vuser_init/Action model this mirrors) puts the Vuser in Error state when an
  // error escapes vuser_init with continue-on-error off, and never reaches
  // Action. Escalate to the same outcome. See EDD-lifecycle "Init-failure
  // semantics". Deliberately scoped to init: action/end keep stock behavior.
  const effective = (phaseName === 'init' && behavior === 'stop_iteration')
    ? 'stop_vu'
    : behavior;

  if (effective !== behavior) {
    console.error(
      `[k6-perf][${phaseName}] errorBehavior 'stop_iteration' does not apply to the init phase `
      + '(it runs once per VU, outside the iteration loop)\n'
      + '  → stopping this VU instead, so it cannot run actionPhase without a completed init',
    );
  }

  if (effective === 'stop_vu') {
    store.state.terminated = true;
  }

  if (effective === 'abort_test') {
    exec.test.abort(`[k6-perf][${phaseName}] Aborting test due to error: ${message}`);
  }

  return effective;
}

// Which lifecycle phase this VU is currently executing. Read by the
// transaction gate so only ACTION-phase transactions are skippable when the
// VU is ending — init/end-phase transactions always run (design_proposal.md
// "Phase Scope Rules").
let _currentPhase: 'init' | 'action' | 'end' | 'none' = 'none';

function runSafely(
  store: JourneyLifecycleStore,
  phaseName: string,
  phaseFn: ((ctx: JourneyContext) => void) | undefined,
  runtime: RuntimeMetadata,
): string {
  if (!phaseFn) {
    return 'continue';
  }

  _currentPhase = (phaseName === 'init' || phaseName === 'action' || phaseName === 'end')
    ? phaseName
    : 'none';
  try {
    phaseFn(store.ctx);
    return 'continue';
  } catch (error) {
    return handlePhaseError(store, error, phaseName, runtime);
  } finally {
    _currentPhase = 'none';
  }
}

export function createJourneyLifecycleStore(): JourneyLifecycleStore {
  return {
    ctx: createContext(),
    state: createState(),
  };
}

export function thinktime(minOrFixed?: number, max?: number): void {
  // If this VU has entered its end window during the action phase, skip the
  // sleep — think time is action work, and continuing to sleep here would eat
  // into the gracefulRampDown budget the VU needs to reach endPhase() before k6
  // force-kills it. Mirrors the transaction gate (which skips the transactions);
  // without this, a long final transaction + leftover think times can overrun
  // grace and drop the logout.
  if (_currentPhase === 'action' && isEndDueBefore()) {
    return;
  }

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
  const runtime = getRuntimeMetadata();
  const onSkip = (name: string) => {
    console.log(
      `[k6-perf][lifecycle] (VU ${exec.vu.idInInstance}, iter ${exec.vu.iterationInScenario}) `
      + `Ending — skipping remaining action transaction '${name}'`,
    );
  };

  // Per-transaction gating applies ONLY to action-phase transactions: once this
  // VU has entered its end window mid-action, skip starting any further action
  // transactions so it reaches endPhase() promptly. init/end-phase transactions
  // are never gated (the `_currentPhase === 'action'` guard).
  return {
    shouldSkipBeforeStart: _currentPhase === 'action' && isEndDueBefore(),
    errorBehavior: runtime.errorBehavior || 'continue',
    onSkip,
  };
}

// Publish the gate to globalThis so transaction.ts can consult it without a
// static import of lifecycle.ts (which would create a module cycle — lifecycle
// already imports isVuTerminated from transaction.ts). Same documented pattern
// as request.ts's __k6PerfCaptureSnapshotFromLastRequest snapshot hook.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__k6PerfTxnGate = getTransactionGate;

// ── Per-VU lifecycle engine (design_proposal.md) ──────────────
// Proactive, VU-driven end-detection: each VU computes a logout deadline ranked
// by its onboarding time (which mirrors k6's handle cull order) and runs endPhase
// a safety margin before k6 removes it.

type EndFamily = 'ramping' | 'count' | 'arrival' | 'external';

interface EndPlan {
  family: EndFamily;
  /**
   * Absolute wall-clock ms at/after which this VU logs out (ramping, and the
   * maxDuration bound of the count family). May coexist with `lastIteration` —
   * whichever fires first ends the VU.
   */
  deadlineMs?: number;
  /** 0-based index of the last action iteration to run (count-based). */
  lastIteration?: number;
  /** Arrival-rate: init/end disabled, action-only. */
  endDisabled?: boolean;
  /** shared-iterations VUs that drew zero work — end before any action. */
  endBeforeAction?: boolean;
}

// Per-VU plan cache. k6 instantiates the script module fresh per VU, so module
// scope is per-VU state. isEnding() reads this for long in-action loops.
let activeEndPlan: EndPlan | null = null;
let arrivalNoticePrinted = false;

interface CurvePoint { tMs: number; vus: number; }

/** Build the piecewise-linear VU curve: (0, startVUs) followed by the timeline. */
function buildVuCurve(phases: PhaseMetadata): CurvePoint[] {
  const points: CurvePoint[] = [{ tMs: 0, vus: Number(phases.startVUs || 0) }];
  for (const stage of phases.timeline!) {
    points.push({ tMs: Number(stage.endMs || 0), vus: Number(stage.vus || 0) });
  }
  return points;
}

/** Linearly interpolate the planned VU count at a given time offset on the curve. */
function interpolateTarget(curve: CurvePoint[], offsetMs: number): number {
  if (offsetMs <= curve[0].tMs) return curve[0].vus;
  for (let i = 1; i < curve.length; i += 1) {
    const a = curve[i - 1];
    const b = curve[i];
    if (offsetMs <= b.tMs) {
      const span = b.tMs - a.tMs;
      if (span <= 0) return b.vus;
      const p = (offsetMs - a.tMs) / span;
      return a.vus + p * (b.vus - a.vus);
    }
  }
  return curve[curve.length - 1].vus;
}

/**
 * Terminal-crossing deadline for a VU whose handle "rank" is `rank` (its VU-count
 * level — see computeEndPlan, where rank is derived from the curve value at the
 * VU's onboarding time, which mirrors k6's handle index).
 *
 * Returns sup{ t : target(t) >= rank } — the LAST time the curve is at or above
 * that level. k6 culls the matching handle just after the curve drops below it, so
 * this is the moment the VU is about to be removed; the lifecycle fires endPhase a
 * safety margin BEFORE it (LIFECYCLE_END_SAFETY_MS) while the VU is still scheduled.
 *
 * Because we have the whole curve up front, this is correct for every ramping
 * shape: load, soak, stress, step-down, spike, and multi-spike (a VU only ends at
 * the dip after which it is never exceeded again — no premature logout of VUs k6
 * will reuse). Survivors that never cross (curve ends above the rank) get the total
 * duration → they log out at scenario end under gracefulStop.
 */
function terminalDeadlineMs(curve: CurvePoint[], rank: number): number {
  const threshold = rank;
  const totalMs = curve[curve.length - 1].tMs;
  let sup = -1;

  for (let i = 1; i < curve.length; i += 1) {
    const a = curve[i - 1];
    const b = curve[i];
    if (b.vus >= threshold) {
      // Segment ends at/above threshold → the latest at-or-above time is its end.
      sup = Math.max(sup, b.tMs);
    } else if (a.vus >= threshold) {
      // Descending crossing within [a, b]: solve a.vus + p*(b.vus - a.vus) = threshold.
      const dv = b.vus - a.vus; // < 0 here
      const tCross = a.tMs + ((threshold - a.vus) / dv) * (b.tMs - a.tMs);
      sup = Math.max(sup, tCross);
    }
  }

  if (sup < 0) {
    // Curve never reaches this rank (phantom/over-provisioned) — be conservative
    // and never log out early; let scenario end + gracefulStop handle it.
    return totalMs;
  }
  return sup;
}

/** Compute the per-VU EndPlan once, from the injected phase envelope. */
function computeEndPlan(phases: PhaseMetadata): EndPlan {
  const mode = phases.mode;

  // Ramping family (also covers constant-vus, which the envelope encodes as a
  // synthetic ramping-vus timeline) — terminal-crossing deadline.
  if (mode === 'ramping-vus' && Array.isArray(phases.timeline) && phases.timeline.length > 0) {
    const curve = buildVuCurve(phases);
    // RANK BY ONBOARDING TIME, NOT idInInstance. k6 culls VUs by internal handle
    // index (highest first), and handle index == onboarding order — but k6 does
    // NOT expose it, and idInInstance is assigned from a shuffled VU pool so it
    // does not match the cull order. The curve value at THIS VU's onboarding
    // instant equals its handle index + 1, which we can observe. So we use that
    // as the rank. (computeEndPlan runs on the VU's first iteration, so
    // Date.now() here is effectively the onboarding time.)
    //   - Distinct onboardings (startVUs:0 gradual ramp) → unique ranks → exact.
    //   - Simultaneous onboardings (startVUs>0 / very steep ramp) → same rank →
    //     that whole block logs out at its earliest cull (front-loaded), which is
    //     safe (all log out before any of them is culled), just not gradual.
    const onboardOffsetMs = Date.now() - exec.scenario.startTime;
    const rank = Math.max(1, Math.round(interpolateTarget(curve, onboardOffsetMs)));
    const deadlineMs = exec.scenario.startTime + terminalDeadlineMs(curve, rank);
    return { family: 'ramping', deadlineMs };
  }

  // Iteration executors are DOUBLY bounded: by the iteration count AND by k6's
  // maxDuration (10m unless the plan overrides it). Whichever comes first ends
  // the scenario, so the plan carries both and the VU ends on the earlier one —
  // otherwise a pool that outruns maxDuration is culled mid-flight with endPhase
  // (logout/teardown) never having run for any VU.
  const iterationDeadlineMs = phases.maxDurationMs
    ? exec.scenario.startTime + Number(phases.maxDurationMs)
    : undefined;

  // Per-VU iterations — deterministic last-iteration exit.
  if (mode === 'per-vu-iterations') {
    const total = Math.max(Number(phases.totalIterations || 1), 1);
    return { family: 'count', lastIteration: total - 1, deadlineMs: iterationDeadlineMs };
  }

  // Shared iterations — distribute the pool; zero-work VUs end before any action.
  if (mode === 'shared-iterations') {
    const total = Math.max(Number(phases.totalIterations || 1), 1);
    const vus = Math.max(Number(phases.vus || 1), 1);
    const assigned = Math.max(Math.ceil((total - (exec.vu.idInInstance - 1)) / vus), 0);
    if (assigned <= 0) {
      return { family: 'count', lastIteration: -1, endBeforeAction: true };
    }
    return { family: 'count', lastIteration: assigned - 1, deadlineMs: iterationDeadlineMs };
  }

  // Arrival-rate — open model: action-only, init/end disabled.
  if (mode === 'constant-arrival-rate' || mode === 'ramping-arrival-rate') {
    return { family: 'arrival', endDisabled: true };
  }

  // 'unsupported' — no predictable curve to derive a deadline from, so this VU
  // runs action-only and relies on gracefulStop. Reached when the envelope could
  // not be computed (e.g. a profile missing the fields its executor needs).
  return { family: 'external' };
}

// Fire the time-deadline this many ms EARLY, so the VU logs out while it's
// still scheduled rather than in the blind spot between iterations where k6
// would cull it with no further default() call. The transaction gate handles
// the case where the deadline passes mid-action; this margin handles the
// idle-between-iterations case. ~5s per design discussion.
const LIFECYCLE_END_SAFETY_MS = 5000;

/** Should this VU end BEFORE running another action? */
function isEndDueBefore(): boolean {
  if (!activeEndPlan) return false;
  if (activeEndPlan.endBeforeAction) return true;
  if (activeEndPlan.deadlineMs !== undefined) {
    return Date.now() + LIFECYCLE_END_SAFETY_MS >= activeEndPlan.deadlineMs;
  }
  return false;
}

/**
 * Should this VU end AFTER the action it just ran?
 * The two bounds are OR'd, not prioritised: an iteration executor carries both a
 * `lastIteration` and a maxDuration `deadlineMs`, and k6 stops the scenario at
 * whichever it hits first.
 */
function isEndDueAfter(): boolean {
  if (!activeEndPlan) return false;
  if (
    activeEndPlan.deadlineMs !== undefined
    && Date.now() + LIFECYCLE_END_SAFETY_MS >= activeEndPlan.deadlineMs
  ) {
    return true;
  }
  if (activeEndPlan.lastIteration !== undefined) {
    return exec.vu.iterationInScenario >= activeEndPlan.lastIteration;
  }
  return false;
}

/**
 * Script-facing: true once this VU has reached its logout deadline. Use it as the
 * guard of a long action loop so the loop bails out near the deadline instead of
 * overrunning it:
 *
 *   while (!isEnding()) { transaction('search', () => {...}); thinktime(); }
 *
 * Meaningful for any family with a time deadline: the ramping family (cull
 * deadline) and the iteration executors (maxDuration). Returns false for the
 * arrival-rate and best-effort families, which have neither.
 */
export function isEnding(): boolean {
  if (activeEndPlan === null || activeEndPlan.deadlineMs === undefined) return false;
  // Same early margin as the lifecycle checks, so a `while (!isEnding())` loop
  // bails out before k6 culls the VU.
  return Date.now() + LIFECYCLE_END_SAFETY_MS >= activeEndPlan.deadlineMs;
}

/**
 * Per-VU lifecycle shell. Runs initPhase once, then actionPhase per iteration,
 * and proactively runs endPhase a margin BEFORE k6 culls the VU (deadline ranked
 * by onboarding time so it matches k6's handle cull order). Covers every
 * executor family via computeEndPlan: ramping (time deadline), count
 * (per-vu/shared iterations), arrival (action-only), external (best-effort).
 */
export function runJourneyLifecycle(store: JourneyLifecycleStore, phaseFns: PhaseFns): void {
  const runtime = getRuntimeMetadata();
  const phases = getPhaseMetadata();
  const state = store.state;

  if (state.terminated || state.ended || isVuTerminated()) {
    // Park the VU for the rest of the scenario. Without this sleep, default()
    // returns instantly and k6 immediately starts another iteration, tight-looping
    // and inflating the iteration counter. k6 interrupts this sleep cleanly when
    // the scenario ends.
    sleep(86400);
    return;
  }

  if (!state.initialized) {
    activeEndPlan = computeEndPlan(phases);

    if (activeEndPlan.endDisabled) {
      // Arrival-rate: init/end disabled. Announce once if the script defines them.
      if ((phaseFns.initPhase || phaseFns.endPhase) && !arrivalNoticePrinted) {
        console.log(
          '[k6-perf][lifecycle] Arrival-rate executor — init/end phases are disabled; '
          + 'all logic runs in actionPhase per iteration.',
        );
        arrivalNoticePrinted = true;
      }
      state.initialized = true;
    } else {
      const initBehavior = runSafely(store, 'init', phaseFns.initPhase, runtime);
      state.initialized = true;
      if (initBehavior !== 'continue' || state.terminated) {
        return;
      }
    }
  }

  // Arrival-rate / external best-effort families: action-only, no proactive end.
  if (activeEndPlan && activeEndPlan.endDisabled) {
    frameworkIterations.add(1);
    runSafely(store, 'action', phaseFns.actionPhase, runtime);
    applyPacing(runtime);
    return;
  }

  // (1) Boundary check — catches VUs whose deadline passed between iterations.
  if (isEndDueBefore() && phaseFns.endPhase) {
    runSafely(store, 'end', phaseFns.endPhase, runtime);
    state.ended = true;
    return;
  }

  frameworkIterations.add(1);
  const actionBehavior = runSafely(store, 'action', phaseFns.actionPhase, runtime);
  if (actionBehavior !== 'continue' || state.terminated || isVuTerminated()) {
    return;
  }

  // Pace between iterations — but skip it when this VU is about to end, so the
  // pacing sleep doesn't eat into the gracefulRampDown budget the VU needs to
  // reach endPhase() in time (same rationale as thinktime()'s end-window skip).
  const endingAfter = isEndDueAfter();
  if (!endingAfter) {
    applyPacing(runtime);
  }

  // (2) Post-action check — catches VUs that crossed their deadline DURING the action.
  if (endingAfter && phaseFns.endPhase) {
    runSafely(store, 'end', phaseFns.endPhase, runtime);
    state.ended = true;
  }
}
