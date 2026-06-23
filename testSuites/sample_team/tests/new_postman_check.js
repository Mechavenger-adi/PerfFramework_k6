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
    // TODO[port-postman]: pm.test("Status code is 302", function () {
        // pm.response.to.have.status(302);
    // });
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

  thinktime();

  transaction('Users', function () {
    const res1 = request('POST', `${env.baseUrl}/users`, {
      name: "Create_User",
      headers: {
      Authorization: "Bearer {{accessToken}}",
      "Content-Type": "application/json",
    },
      body: "{ \"username\": \"{{randomUser}}\", \"dob\": \"{{randomDOB}}\", \"email\": \"{{randomUser}}@test.com\" }",
      replay: {
        id: "req_2",
        recordingStartedAt: "converted",
      },
    });
    k6Check(res1, {
      "Users - status is 200": (r) => r.status === 200,
    });
    // ── Postman test script (auto-translated; review and adjust) ──
    let jsonData = res1.json();
    ctx.correlation['userId'] = jsonData.id;
    // TODO[port-postman]: pm.test('User created successfully', function () {
        // pm.expect(jsonData).to.have.property('id');
    // });
  });

  thinktime();

  transaction('Orders', function () {
    // ── Postman pre-request script (auto-translated; review and adjust) ──
    // Generate random order ID
    const randomOrderId = `ORD-${Math.floor(Math.random() * 100000)}`;
    ctx.correlation["randomOrderId"] = randomOrderId;
    const res1 = request('POST', `${env.baseUrl}/orders`, {
      name: "Create_Order",
      headers: {
      Authorization: "Bearer {{accessToken}}",
      "Content-Type": "application/json",
    },
      body: "{ \"items\": [{\"id\": \"123\", \"qty\": 2}], \"paymentMethod\": \"card\", \"orderRef\": \"{{randomOrderId}}\" }",
      replay: {
        id: "req_3",
        recordingStartedAt: "converted",
      },
    });
    k6Check(res1, {
      "Orders - status is 200": (r) => r.status === 200,
    });
    // ── Postman test script (auto-translated; review and adjust) ──
    let jsonData = res1.json();
    ctx.correlation['orderId'] = jsonData.orderId;
    // TODO[port-postman]: pm.test('Order created successfully', function () {
        // pm.expect(jsonData).to.have.property('orderId');
    // });
  });

  thinktime();

  transaction('Payments', function () {
    const res1 = request('POST', `${env.baseUrl}/payments`, {
      name: "Process_Payment",
      headers: {
      Authorization: "Bearer {{accessToken}}",
      "Content-Type": "application/json",
    },
      body: "{ \"orderId\": \"{{orderId}}\", \"amount\": 2500, \"currency\": \"INR\" }",
      replay: {
        id: "req_4",
        recordingStartedAt: "converted",
      },
    });
    k6Check(res1, {
      "Payments - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('Analytics', function () {
    const res1 = request('GET', `${env.baseUrl}/analytics/users/%7B%7BuserId%7D%7D/activity`, {
      name: "Get_User_Activity",
      headers: {
      Authorization: "Bearer {{accessToken}}",
    },
      replay: {
        id: "req_5",
        recordingStartedAt: "converted",
      },
    });
    k6Check(res1, {
      "Analytics - status is 200": (r) => r.status === 200,
    });
  });

}

export function endPhase(ctx) {
}

export default function () {
  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });
}
