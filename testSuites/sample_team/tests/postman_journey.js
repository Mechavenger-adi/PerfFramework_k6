import { transaction, k6Check } from '../../../dist/utils/transaction.js';
import { request } from '../../../dist/utils/request.js';
import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';
import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';
import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';

const env = getEnvContext('sample_team', { baseUrl: 'https://dummyapi.com' });

const __journeyLifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
  clearCookies();

}

export function actionPhase(ctx) {
  transaction('Auth', function () {
    const res1 = request('POST', `${env.baseUrl}/auth/login`, {
      headers: {
      "Content-Type": "application/json",
    },
      body: "{ \"username\": \"testuser\", \"password\": \"P@ssw0rd\" }",
      replay: {
        id: "req_1",
        recordingStartedAt: "1970-01-01T00:00:00.000Z",
      },
    });
    k6Check(res1, {
      "Auth - status is 200": (r) => r.status === 200,
    });

    const res2 = request('POST', `${env.baseUrl}/auth/refresh`, {
      headers: {
      Authorization: "Bearer {{accessToken}}",
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

  thinktime();

  transaction('Users', function () {
    const res1 = request('GET', `${env.baseUrl}/users/%7B%7BuserId%7D%7D?include=posts,comments`, {
      headers: {
      Authorization: "Bearer {{accessToken}}",
    },
      replay: {
        id: "req_3",
        recordingStartedAt: "1970-01-01T00:00:00.000Z",
      },
    });
    k6Check(res1, {
      "Users - status is 200": (r) => r.status === 200,
    });

    const res2 = request('PUT', `${env.baseUrl}/users/%7B%7BuserId%7D%7D/settings`, {
      headers: {
      Authorization: "Bearer {{accessToken}}",
      "Content-Type": "application/json",
    },
      body: "{ \"notifications\": true, \"theme\": \"dark\" }",
      replay: {
        id: "req_4",
        recordingStartedAt: "1970-01-01T00:00:00.000Z",
      },
    });
    k6Check(res2, {
      "Users - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('Orders', function () {
    const res1 = request('POST', `${env.baseUrl}/orders`, {
      headers: {
      Authorization: "Bearer {{accessToken}}",
      "Content-Type": "application/json",
    },
      body: "{ \"items\": [{\"id\": \"123\", \"qty\": 2}], \"paymentMethod\": \"card\" }",
      replay: {
        id: "req_5",
        recordingStartedAt: "1970-01-01T00:00:00.000Z",
      },
    });
    k6Check(res1, {
      "Orders - status is 200": (r) => r.status === 200,
    });

    const res2 = request('GET', `${env.baseUrl}/orders/%7B%7BorderId%7D%7D/status`, {
      headers: {
      Authorization: "Bearer {{accessToken}}",
    },
      replay: {
        id: "req_6",
        recordingStartedAt: "1970-01-01T00:00:00.000Z",
      },
    });
    k6Check(res2, {
      "Orders - status is 200": (r) => r.status === 200,
    });
  });

}

export function endPhase(ctx) {
}

export default function () {
  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });
}
