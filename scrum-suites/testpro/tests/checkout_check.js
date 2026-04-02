import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { initTransactions, startTransaction, endTransaction } from '../../../dist/utils/transaction.js';
import { logExchange } from '../../../core-engine/src/utils/replayLogger.js';

initTransactions(['ListCrocodiles', 'CreateCrocodile', 'ViewCrocodile']);

export default function () {
  console.log('[k6-perf] [INFO] Starting Checkout Journey (Crocodiles API)');

  // -- Transaction: List public crocodiles ------------------
  group('List Crocodiles', function () {
    startTransaction('ListCrocodiles');
    const request_1 = {
      id: "req_1",
      transaction: "List Crocodiles",
      recordingStartedAt: new Date().toISOString(),
      method: "GET",
      url: 'https://test-api.k6.io/public/crocodiles/',
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "List Crocodiles",
          har_entry_id: "req_1",
          recording_started_at: "converted"
        }
      }
    };
    const res_1 = http.get(request_1.url, request_1.params);
    logExchange(request_1, res_1);
    check(res_1, { 'List Crocodiles: status 200': (r) => r.status === 200 });
    endTransaction('ListCrocodiles');
  });

  sleep(1);

  // -- Transaction: Create a crocodile (requires auth, will fail gracefully) --
  group('Create Crocodile', function () {
    startTransaction('CreateCrocodile');
    const payload = JSON.stringify({
      name: 'Perf Test Croc',
      sex: 'M',
      date_of_birth: '2020-01-01',
    });
    const request_1 = {
      id: "req_2",
      transaction: "Create Crocodile",
      recordingStartedAt: new Date().toISOString(),
      method: "POST",
      url: 'https://test-api.k6.io/my/crocodiles/',
      body: payload,
      variableEvents: [],
      params: {
        headers: { 'Content-Type': 'application/json' },
        tags: {
          transaction: "Create Crocodile",
          har_entry_id: "req_2",
          recording_started_at: "converted"
        }
      }
    };
    const res_1 = http.post(request_1.url, request_1.body, request_1.params);
    logExchange(request_1, res_1);
    // Expect 401 since we aren't authenticated — validates the framework handles non-200 gracefully
    check(res_1, { 'Create Crocodile: status 401 (expected, no auth)': (r) => r.status === 401 });
    endTransaction('CreateCrocodile');
  });

  sleep(1);

  // -- Transaction: View a single crocodile -----------------
  group('View Crocodile', function () {
    startTransaction('ViewCrocodile');
    const request_1 = {
      id: "req_3",
      transaction: "View Crocodile",
      recordingStartedAt: new Date().toISOString(),
      method: "GET",
      url: 'https://test-api.k6.io/public/crocodiles/2/',
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "View Crocodile",
          har_entry_id: "req_3",
          recording_started_at: "converted"
        }
      }
    };
    const res_1 = http.get(request_1.url, request_1.params);
    logExchange(request_1, res_1);
    check(res_1, { 'View Crocodile: status 200': (r) => r.status === 200 });
    endTransaction('ViewCrocodile');
  });

  sleep(1);
}
