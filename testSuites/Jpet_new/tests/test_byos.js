import { transaction, k6Check } from '../../../dist/utils/transaction.js';
import { request } from '../../../dist/utils/request.js';
import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';
import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';
// Optional explicit trackers (Proxy on ctx.* auto-registers in most cases):
// import { trackCorrelation, trackParameter, trackDataRow } from '../../../dist/utils/replayLogger.js';

const env = getEnvContext('Jpet_new', { baseUrl: 'https://your-dev-environment.com/' });
const __journeyLifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
  clearCookies();
}

export function actionPhase(ctx) {
  const correlation_vars = ctx.correlation;

  transaction('BYOS_Custom_Logic', () => {
    // ==========================================================
    //   PASTE YOUR GRAFANA STUDIO / CUSTOM K6 SCRIPT BELOW
    // ==========================================================
    //
    // FRAMEWORK RULES (do NOT use raw k6 APIs):
    //   • Use request() instead of http.get/post/etc. — auto-tags transaction,
    //     replay-logs in debug mode, snapshots failures.
    //   • Use k6Check() instead of native k6 check() — records the same metric
    //     PLUS applies the configured errorBehavior (continue / stop_iteration
    //     / stop_vu / abort_test) when a check fails.
    //   • Wrap each logical step in transaction('Name', () => { ... }) for
    //     hierarchical metrics and lifecycle gating.
    //   • Use thinktime() between transactions — honors runtime settings.
    //
    // Example:
    //   const res = request('GET', \`\${env.baseUrl}public/crocodiles/\`);
    //   k6Check(res, { 'status 200': (r) => r.status === 200 });
    //
    // For correlation, assign to ctx.correlation[...] (auto-tracked via Proxy):
    //   correlation_vars["authToken"] = res.json("token");
  });

  thinktime();
}

export function endPhase(ctx) {
}

export default function () {
  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });
}
