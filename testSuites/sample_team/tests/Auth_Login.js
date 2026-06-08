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
    // ── Postman pre-request script (auto-translated; review and adjust) ──
    // Generate random year between 1970 and 2005
    const year = Math.floor(Math.random() * (2005 - 1970 + 1)) + 1970;
    // Generate random month (01 to 12)
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    // Generate random day (01 to 28)
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const randomDOB = `${year}-${month}-${day}`;
    ctx.correlation["randomDOB"] = randomDOB;

    // Generate random username
    const randomUser = `user_${Math.floor(Math.random() * 10000)}`;
    ctx.correlation["randomUser"] = randomUser;
    const res1 = request('POST', `${env.baseUrl}/auth/login`, {
      name: "Login",
      headers: {
      "Content-Type": "application/json",
    },
      body: "{ \"username\": \"{{randomUser}}\", \"password\": \"P@ssw0rd\", \"dob\": \"{{randomDOB}}\" }",
      replay: {
        id: "req_1",
        recordingStartedAt: "converted",
      },
    });
    k6Check(res1, {
      "Auth - status is 200": (r) => r.status === 200,
    });
    // ── Postman test script (auto-translated; review and adjust) ──
    let jsonData = res1.json();
    ctx.correlation['accessToken'] = jsonData.accessToken;
    ctx.correlation['refreshToken'] = jsonData.refreshToken;
    // TODO[port-postman]: pm.test('Login successful', function () {
        // pm.expect(jsonData).to.have.property('accessToken');
    // });
  });

}

export function endPhase(ctx) {
}

export default function () {
  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });
}
