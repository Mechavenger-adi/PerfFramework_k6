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
function applyPacing(runtime) {
    const pacing = runtime.pacing;
    if (!pacing || !pacing.enabled)
        return;
    let seconds;
    if (pacing.mode === 'random') {
        const min = Number(pacing.min ?? 0);
        const max = Number(pacing.max ?? 0);
        seconds = max > min ? min + Math.random() * (max - min) : min;
    }
    else {
        seconds = Number(pacing.fixed ?? 0);
    }
    if (seconds > 0) {
        (0, k6_1.sleep)(seconds);
    }
}
function getPhaseMetadata() {
    return parseJsonEnv('K6_PERF_PHASES', {
        mode: 'unsupported',
    });
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
        console.log(`[k6-perf][lifecycle] (VU ${execution_1.default.vu.idInInstance}, iter ${execution_1.default.vu.iterationInScenario}) `
            + `Ending — skipping remaining action transaction '${name}'`);
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
globalThis.__k6PerfTxnGate = getTransactionGate;
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
/** Linearly interpolate the planned VU count at a given time offset on the curve. */
function interpolateTarget(curve, offsetMs) {
    if (offsetMs <= curve[0].tMs)
        return curve[0].vus;
    for (let i = 1; i < curve.length; i += 1) {
        const a = curve[i - 1];
        const b = curve[i];
        if (offsetMs <= b.tMs) {
            const span = b.tMs - a.tMs;
            if (span <= 0)
                return b.vus;
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
function terminalDeadlineMs(curve, rank) {
    const threshold = rank;
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
        // Curve never reaches this rank (phantom/over-provisioned) — be conservative
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
        const onboardOffsetMs = Date.now() - execution_1.default.scenario.startTime;
        const rank = Math.max(1, Math.round(interpolateTarget(curve, onboardOffsetMs)));
        const deadlineMs = execution_1.default.scenario.startTime + terminalDeadlineMs(curve, rank);
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
/**
 * Per-VU lifecycle shell. Runs initPhase once, then actionPhase per iteration,
 * and proactively runs endPhase a margin BEFORE k6 culls the VU (deadline ranked
 * by onboarding time so it matches k6's handle cull order). Covers every
 * executor family via computeEndPlan: ramping (time deadline), count
 * (per-vu/shared iterations), arrival (action-only), external (best-effort).
 */
function runJourneyLifecycle(store, phaseFns) {
    const runtime = getRuntimeMetadata();
    const phases = getPhaseMetadata();
    const state = store.state;
    if (state.terminated || state.ended || (0, transaction_js_1.isVuTerminated)()) {
        // Park the VU for the rest of the scenario. Without this sleep, default()
        // returns instantly and k6 immediately starts another iteration, tight-looping
        // and inflating the iteration counter. k6 interrupts this sleep cleanly when
        // the scenario ends.
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
    if (actionBehavior !== 'continue' || state.terminated || (0, transaction_js_1.isVuTerminated)()) {
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
