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
  transaction('Login', function () {
    const res1 = request('POST', `${env.baseUrl}/post`, {
      headers: {
      "Content-Type": "application/json",
    },
      body: "{\"user\":\"alice\",\"password\":\"secret\"}",
      replay: {
        id: "req_1",
        recordingStartedAt: "1970-01-01T00:00:00.000Z",
      },
    });
    k6Check(res1, {
      "Login - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('Fetch_profile', function () {
    const res1 = request('GET', `${env.baseUrl}/get?id=42`, {
      headers: {
      Authorization: "Bearer xyz",
    },
      replay: {
        id: "req_2",
        recordingStartedAt: "1970-01-01T00:00:00.000Z",
      },
    });
    k6Check(res1, {
      "Fetch_profile - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('Logout', function () {
    const res1 = request('POST', `${env.baseUrl}/post`, {
      replay: {
        id: "req_3",
        recordingStartedAt: "1970-01-01T00:00:00.000Z",
      },
    });
    k6Check(res1, {
      "Logout - status is 200": (r) => r.status === 200,
    });
  });

}

export function endPhase(ctx) {
}

export default function () {
  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });
}
