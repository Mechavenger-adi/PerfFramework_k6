import { transaction, k6Check } from '../../../dist/utils/transaction.js';
import { request } from '../../../dist/utils/request.js';
import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';
import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';
import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';

const env = getEnvContext('sample_team', { baseUrl: 'https://httpbin.org' });

const __journeyLifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
  clearCookies();

}

export function actionPhase(ctx) {
  transaction('Auth', function () {
    const res1 = request('POST', `${env.baseUrl}/post`, {
      headers: {
      "Content-Type": "application/json",
    },
      body: "{\"user\":\"alice\",\"pass\":\"secret\"}",
      replay: {
        id: "req_1",
        recordingStartedAt: "1970-01-01T00:00:00.000Z",
      },
    });
    k6Check(res1, {
      "Auth - status is 200": (r) => r.status === 200,
    });

    const res2 = request('GET', `${env.baseUrl}/bearer`, {
      headers: {
      Authorization: "Bearer tok-123",
    },
      replay: {
        id: "req_2",
        recordingStartedAt: "1970-01-01T00:00:00.000Z",
      },
    });
    k6Check(res2, {
      "Auth - status is 200": (r) => r.status === 200,
    });
  });

}

export function endPhase(ctx) {
}

export default function () {
  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });
}
