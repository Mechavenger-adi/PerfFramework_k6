import { sleep } from 'k6';
import { transaction, k6Check } from '../../../dist/utils/transaction.js';
import { request } from '../../../dist/utils/request.js';
import { trackCorrelation, trackParameter, trackDataRow } from '../../../dist/utils/replayLogger.js';
import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';
import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';
const env = getEnvContext('sample_team', { baseUrl: 'https://example.com/' });

const __journeyLifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
  clearCookies();

  const correlation_vars = ctx.correlation;
}

export function actionPhase(ctx) {
  const correlation_vars = ctx.correlation;

  transaction('login', function() {
      const res_1 = request('POST', `${env.baseUrl}/login`, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ u: 'a' }),
        replay: { id: "req_1", recordingStartedAt: 'converted' },
      });
      k6Check(res_1, { 'status 200': (r) => r.status === 200 });
  
      // Old commented-out probe — must remain a comment in the output
      // const old = http.get('https://example.com/old-endpoint');
      // check(old, { 'status 200': (r) => r.status === 200 });
  
      const ok = k6Check(res_1, { 'has token': (r) => !!r.json('token') });
      if (!ok) {
        console.error('login check failed');
      }
      sleep(1);
    });

  transaction('profile', function() {
      const res_1 = request('GET', `${env.baseUrl}/me`, {
        replay: { id: "req_2", recordingStartedAt: 'converted' },
      });
      const headers = res_1.headers;
      // intentionally not adjacent to http call
      const profileOk = k6Check(res_1, { 'has email': (r) => !!r.json('email') });
    });

}

export function endPhase(ctx) {
  const correlation_vars = ctx.correlation;
}

export default function () {
  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });
}

