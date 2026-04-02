import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { initTransactions, startTransaction, endTransaction } from '../../../dist/utils/transaction.js';

initTransactions(['ListCrocodiles', 'CreateCrocodile', 'ViewCrocodile']);

export default function () {
  console.log('[k6-perf] [INFO] Starting Checkout Journey (Crocodiles API)');

  // -- Transaction: List public crocodiles ------------------
  group('List Crocodiles', function () {
    startTransaction('ListCrocodiles');
    const res = http.get('https://test-api.k6.io/public/crocodiles/');
    check(res, { 'List Crocodiles: status 200': (r) => r.status === 200 });
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
    const res = http.post('https://test-api.k6.io/my/crocodiles/', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    // Expect 401 since we aren't authenticated — validates the framework handles non-200 gracefully
    check(res, { 'Create Crocodile: status 401 (expected, no auth)': (r) => r.status === 401 });
    endTransaction('CreateCrocodile');
  });

  sleep(1);

  // -- Transaction: View a single crocodile -----------------
  group('View Crocodile', function () {
    startTransaction('ViewCrocodile');
    const res = http.get('https://test-api.k6.io/public/crocodiles/2/');
    check(res, { 'View Crocodile: status 200': (r) => r.status === 200 });
    endTransaction('ViewCrocodile');
  });

  sleep(1);
}
