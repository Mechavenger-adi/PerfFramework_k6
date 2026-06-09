"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJourneyLifecycleStore = createJourneyLifecycleStore;
exports.thinktime = thinktime;
exports.getTransactionGate = getTransactionGate;
exports.isEnding = isEnding;
exports.runJourneyLifecycle = runJourneyLifecycle;
// @ts-ignore - K6 runtime module
const k6_1 = require("k6");
// @ts-ignore - K6 runtime module
const execution_1 = __importDefault(require("k6/execution"));
// @ts-ignore - K6 runtime module
const metrics_1 = require("k6/metrics");
const transaction_js_1 = require("./transaction.js");
const replayLogger_js_1 = require("./replayLogger.js");
// ── Implementation ────────────────────────────────────────────
const frameworkIterations = new metrics_1.Counter('framework_iterations');
/**
 * Wraps a context sub-object in a Proxy so that every scalar assignment
 * (`ctx.correlation["x"] = v`, `ctx.session.token = v`, etc.) is automatically
 * registered in the replay variable registry.  detectVariableEvents then finds
 * those values inside request URLs/bodies/headers and maps them back to their
 * variable names — no trackCorrelation / trackParameter calls needed in scripts.
 */
function createTrackedProxy(sourceName, type) {
    return new Proxy({}, {
        set(target, prop, value) {
            target[prop] = value;
            // Only register scalar values — objects/arrays can't appear verbatim in a URL
            if (value !== null && value !== undefined && typeof value !== 'object') {
                if (type === 'correlation') {
                    (0, replayLogger_js_1.trackCorrelation)(String(prop), value, sourceName);
                }
                else {
                    (0, replayLogger_js_1.trackParameter)(String(prop), value, sourceName);
                }
            }
            return true;
        },
    });
}
function createContext() {
    return {
        data: createTrackedProxy('data', 'parameter'),
        session: createTrackedProxy('session', 'parameter'),
        correlation: createTrackedProxy('correlation', 'correlation'),
        meta: createTrackedProxy('meta', 'parameter'),
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
    }
    catch {
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
 */
function getInstantaneousState(phases) {
    const elapsedMs = Date.now() - execution_1.default.scenario.startTime;
    let previousVUs = Number(phases.startVUs || 0);
    let previousEndMs = 0;
    const timeline = phases.timeline;
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
function getEndSignal(phases) {
    // --- Per-VU Iterations ---
    if (phases.mode === 'per-vu-iterations') {
        const totalIterations = Math.max(Number(phases.totalIterations || 1), 1);
        const completedIterations = execution_1.default.vu.iterationInScenario;
        const willCompleteAfterThisAction = completedIterations >= totalIterations - 1;
        return { beforeAction: false, afterAction: willCompleteAfterThisAction };
    }
    // --- Shared Iterations ---
    if (phases.mode === 'shared-iterations') {
        const totalIterations = Math.max(Number(phases.totalIterations || 1), 1);
        const vus = Math.max(Number(phases.vus || 1), 1);
        const iterationsAssignedToThisVu = Math.max(Math.ceil((totalIterations - (execution_1.default.vu.idInInstance - 1)) / vus), 0);
        if (iterationsAssignedToThisVu <= 0) {
            return {
                beforeAction: execution_1.default.vu.iterationInScenario === 0,
                afterAction: false,
            };
        }
        const completedIterations = execution_1.default.vu.iterationInScenario;
        const willCompleteAfterThisAction = completedIterations >= iterationsAssignedToThisVu - 1;
        return { beforeAction: false, afterAction: willCompleteAfterThisAction };
    }
    // --- Ramping VUs (handles load, spike, step, soak, stress, constant-vus) ---
    if (phases.mode === 'ramping-vus' && Array.isArray(phases.timeline)) {
        const { target, isDecreasing, isFinalRampDown } = getInstantaneousState(phases);
        const vuId = execution_1.default.vu.idInInstance;
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
    if ((phases.mode === 'constant-arrival-rate' || phases.mode === 'ramping-arrival-rate') &&
        Array.isArray(phases.timeline) &&
        phases.timeline.length > 0) {
        const totalDurationMs = phases.timeline[phases.timeline.length - 1].endMs;
        const elapsedMs = Date.now() - execution_1.default.scenario.startTime;
        const isDone = elapsedMs >= totalDurationMs;
        return { beforeAction: isDone, afterAction: isDone };
    }
    return { beforeAction: false, afterAction: false };
}
function handlePhaseError(store, error, phaseName, runtime) {
    const behavior = runtime.errorBehavior || 'continue';
    const message = error && typeof error === 'object' && 'message' in error
        ? error.message
        : String(error);
    console.error(`[k6-perf][${phaseName}] ${message}`);
    if (behavior === 'stop_vu') {
        store.state.terminated = true;
    }
    if (behavior === 'abort_test') {
        execution_1.default.test.abort(`[k6-perf][${phaseName}] Aborting test due to error: ${message}`);
    }
    return behavior;
}
// Which lifecycle phase this VU is currently executing. Read by the
// transaction gate so only ACTION-phase transactions are skippable when the
// VU is ending — init/end-phase transactions always run (design_proposal.md
// "Phase Scope Rules").
let _currentPhase = 'none';
function runSafely(store, phaseName, phaseFn, runtime) {
    if (!phaseFn) {
        return 'continue';
    }
    _currentPhase = (phaseName === 'init' || phaseName === 'action' || phaseName === 'end')
        ? phaseName
        : 'none';
    try {
        phaseFn(store.ctx);
        return 'continue';
    }
    catch (error) {
        return handlePhaseError(store, error, phaseName, runtime);
    }
    finally {
        _currentPhase = 'none';
    }
}
function createJourneyLifecycleStore() {
    return {
        ctx: createContext(),
        state: createState(),
    };
}
function thinktime(minOrFixed, max) {
    const runtime = getRuntimeMetadata();
    const thinkTime = runtime.thinkTime;
    if (thinkTime?.ignoreThinkTime) {
        return; // Skip think time completely
    }
    let durationToSleep = 1;
    if (minOrFixed !== undefined && max !== undefined) {
        // User provided a range in the script: thinktime(2, 5)
        durationToSleep = minOrFixed + Math.random() * (max - minOrFixed);
    }
    else if (minOrFixed !== undefined) {
        // User provided a fixed value in the script: thinktime(3)
        durationToSleep = minOrFixed;
    }
    if (!thinkTime || thinkTime.globalOverride !== false) {
        // Apply global framework think time
        if (thinkTime?.mode === 'random') {
            const min = Number(thinkTime.min ?? 0.5);
            const max = Number(thinkTime.max ?? 3);
            durationToSleep = min + Math.random() * (max - min);
        }
        else {
            // fixed mode
            durationToSleep = Number(thinkTime?.fixed ?? 1);
        }
    }
    if (durationToSleep > 0) {
        (0, k6_1.sleep)(durationToSleep);
    }
}
function getTransactionGate() {
    const runtime = getRuntimeMetadata();
    const onSkip = (name) => {
        console.log(`[k6-perf][lifecycle] Ending — skipping remaining action transaction '${name}'`);
    };
    // Per-transaction gating applies ONLY to action-phase transactions, and ONLY
    // under V2. V1 returns false so transaction() behaves exactly as before when
    // the flag is off (V1 end-detection still runs at the iteration level inside
    // runJourneyLifecycle).
    if (isLifecycleV2Enabled()) {
        return {
            shouldSkipBeforeStart: _currentPhase === 'action' && isEndDueBefore(),
            errorBehavior: runtime.errorBehavior || 'continue',
            onSkip,
        };
    }
    return {
        shouldSkipBeforeStart: false,
        errorBehavior: runtime.errorBehavior || 'continue',
        onSkip,
    };
}
// Publish the gate to globalThis so transaction.ts can consult it without a
// static import of lifecycle.ts (which would create a module cycle — lifecycle
// already imports isVuTerminated from transaction.ts). Same documented pattern
// as request.ts's __k6PerfCaptureSnapshotFromLastRequest snapshot hook.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
globalThis.__k6PerfTxnGate = getTransactionGate;
// ── Lifecycle V2 (design_proposal.md) ─────────────────────────
// Proactive, VU-driven end-detection. Gated behind K6_PERF_LIFECYCLE_V2 so the
// default (V1) path is byte-for-byte unchanged until validated. Enable with the
// environment variable K6_PERF_LIFECYCLE_V2=true (k6 inherits system env vars).
function isLifecycleV2Enabled() {
    const v = __ENV.K6_PERF_LIFECYCLE_V2;
    return v === 'true' || v === '1';
}
// Per-VU plan cache. k6 instantiates the script module fresh per VU, so module
// scope is per-VU state. isEnding() reads this for long in-action loops.
let activeEndPlan = null;
let arrivalNoticePrinted = false;
/** Build the piecewise-linear VU curve: (0, startVUs) followed by the timeline. */
function buildVuCurve(phases) {
    const points = [{ tMs: 0, vus: Number(phases.startVUs || 0) }];
    for (const stage of phases.timeline) {
        points.push({ tMs: Number(stage.endMs || 0), vus: Number(stage.vus || 0) });
    }
    return points;
}
/**
 * Terminal-crossing deadline for a VU of id `vuId`.
 *
 * Returns sup{ t : target(t) >= vuId - 0.5 } — the LAST time the curve is at or
 * above the (margin-shifted) threshold. After that instant the curve stays below
 * vuId forever, so the VU is never needed again and should log out. The -0.5
 * half-step makes the VU self-exit just BEFORE k6's integer removal, guaranteeing
 * the VU is still scheduled when endPhase runs.
 *
 * Because we have the whole curve up front, this is correct for every ramping
 * shape: load, soak, stress, step-down, spike, and multi-spike (a VU only ends at
 * the dip after which it is never exceeded again — no premature logout of VUs k6
 * will reuse). Survivors that never cross (curve ends above the VU) get the total
 * duration → they log out at scenario end under gracefulStop.
 */
function terminalDeadlineMs(curve, vuId) {
    const threshold = vuId - 0.5;
    const totalMs = curve[curve.length - 1].tMs;
    let sup = -1;
    for (let i = 1; i < curve.length; i += 1) {
        const a = curve[i - 1];
        const b = curve[i];
        if (b.vus >= threshold) {
            // Segment ends at/above threshold → the latest at-or-above time is its end.
            sup = Math.max(sup, b.tMs);
        }
        else if (a.vus >= threshold) {
            // Descending crossing within [a, b]: solve a.vus + p*(b.vus - a.vus) = threshold.
            const dv = b.vus - a.vus; // < 0 here
            const tCross = a.tMs + ((threshold - a.vus) / dv) * (b.tMs - a.tMs);
            sup = Math.max(sup, tCross);
        }
    }
    if (sup < 0) {
        // Curve never reaches this VU's id (phantom/over-provisioned) — be conservative
        // and never log out early; let scenario end + gracefulStop handle it.
        return totalMs;
    }
    return sup;
}
/** Compute the per-VU EndPlan once, from the injected phase envelope. */
function computeEndPlan(phases) {
    const mode = phases.mode;
    // Ramping family (also covers constant-vus, which the envelope encodes as a
    // synthetic ramping-vus timeline) — terminal-crossing deadline.
    if (mode === 'ramping-vus' && Array.isArray(phases.timeline) && phases.timeline.length > 0) {
        const curve = buildVuCurve(phases);
        const deadlineMs = execution_1.default.scenario.startTime + terminalDeadlineMs(curve, execution_1.default.vu.idInInstance);
        return { family: 'ramping', deadlineMs };
    }
    // Per-VU iterations — deterministic last-iteration exit.
    if (mode === 'per-vu-iterations') {
        const total = Math.max(Number(phases.totalIterations || 1), 1);
        return { family: 'count', lastIteration: total - 1 };
    }
    // Shared iterations — distribute the pool; zero-work VUs end before any action.
    if (mode === 'shared-iterations') {
        const total = Math.max(Number(phases.totalIterations || 1), 1);
        const vus = Math.max(Number(phases.vus || 1), 1);
        const assigned = Math.max(Math.ceil((total - (execution_1.default.vu.idInInstance - 1)) / vus), 0);
        if (assigned <= 0) {
            return { family: 'count', lastIteration: -1, endBeforeAction: true };
        }
        return { family: 'count', lastIteration: assigned - 1 };
    }
    // Arrival-rate — open model: action-only, init/end disabled.
    if (mode === 'constant-arrival-rate' || mode === 'ramping-arrival-rate') {
        return { family: 'arrival', endDisabled: true };
    }
    // externally-controlled / unsupported — best-effort (no predictable curve).
    return { family: 'external' };
}
// Fire the time-deadline this many ms EARLY, so the VU logs out while it's
// still scheduled rather than in the blind spot between iterations where k6
// would cull it with no further default() call. The transaction gate handles
// the case where the deadline passes mid-action; this margin handles the
// idle-between-iterations case. ~5s per design discussion.
const LIFECYCLE_END_SAFETY_MS = 5000;
/** Should this VU end BEFORE running another action? */
function isEndDueBefore() {
    if (!activeEndPlan)
        return false;
    if (activeEndPlan.endBeforeAction)
        return true;
    if (activeEndPlan.deadlineMs !== undefined) {
        return Date.now() + LIFECYCLE_END_SAFETY_MS >= activeEndPlan.deadlineMs;
    }
    return false;
}
/** Should this VU end AFTER the action it just ran? */
function isEndDueAfter() {
    if (!activeEndPlan)
        return false;
    if (activeEndPlan.deadlineMs !== undefined) {
        return Date.now() + LIFECYCLE_END_SAFETY_MS >= activeEndPlan.deadlineMs;
    }
    if (activeEndPlan.lastIteration !== undefined) {
        return execution_1.default.vu.iterationInScenario >= activeEndPlan.lastIteration;
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
 * Only meaningful for the ramping (time-deadline) family; returns false otherwise.
 */
function isEnding() {
    if (activeEndPlan === null || activeEndPlan.deadlineMs === undefined)
        return false;
    // Same early margin as the lifecycle checks, so a `while (!isEnding())` loop
    // bails out before k6 culls the VU.
    return Date.now() + LIFECYCLE_END_SAFETY_MS >= activeEndPlan.deadlineMs;
}
function runJourneyLifecycleV2(store, phaseFns) {
    const runtime = getRuntimeMetadata();
    const phases = getPhaseMetadata();
    const state = store.state;
    if (state.terminated || state.ended || (0, transaction_js_1.isVuTerminated)()) {
        (0, k6_1.sleep)(86400);
        return;
    }
    if (!state.initialized) {
        activeEndPlan = computeEndPlan(phases);
        if (activeEndPlan.endDisabled) {
            // Arrival-rate: init/end disabled. Announce once if the script defines them.
            if ((phaseFns.initPhase || phaseFns.endPhase) && !arrivalNoticePrinted) {
                console.log('[k6-perf][lifecycle] Arrival-rate executor — init/end phases are disabled; '
                    + 'all logic runs in actionPhase per iteration.');
                arrivalNoticePrinted = true;
            }
            state.initialized = true;
        }
        else {
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
        if (runtime.pacingEnabled && Number(runtime.pacingSeconds || 0) > 0) {
            (0, k6_1.sleep)(Number(runtime.pacingSeconds));
        }
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
    if (actionBehavior !== 'continue' || state.terminated || (0, transaction_js_1.isVuTerminated)()) {
        return;
    }
    if (runtime.pacingEnabled && Number(runtime.pacingSeconds || 0) > 0) {
        (0, k6_1.sleep)(Number(runtime.pacingSeconds));
    }
    // (2) Post-action check — catches VUs that crossed their deadline DURING the action.
    if (isEndDueAfter() && phaseFns.endPhase) {
        runSafely(store, 'end', phaseFns.endPhase, runtime);
        state.ended = true;
    }
}
function runJourneyLifecycle(store, phaseFns) {
    if (isLifecycleV2Enabled()) {
        runJourneyLifecycleV2(store, phaseFns);
        return;
    }
    const runtime = getRuntimeMetadata();
    const phases = getPhaseMetadata();
    const state = store.state;
    if (state.terminated || state.ended || (0, transaction_js_1.isVuTerminated)()) {
        // Park the VU for the rest of the scenario. Without this sleep, default()
        // returns instantly and k6 immediately starts another iteration, tight-looping
        // at ~300+ iter/s and inflating the iteration counter to hundreds of thousands.
        // k6 interrupts this sleep cleanly when the scenario ends.
        (0, k6_1.sleep)(86400);
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
    if (actionBehavior !== 'continue' || state.terminated || (0, transaction_js_1.isVuTerminated)()) {
        return;
    }
    if (runtime.pacingEnabled && Number(runtime.pacingSeconds || 0) > 0) {
        (0, k6_1.sleep)(Number(runtime.pacingSeconds));
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
