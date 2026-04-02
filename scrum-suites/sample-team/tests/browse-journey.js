import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { initTransactions, startTransaction, endTransaction } from '../../../dist/utils/transaction.js';

initTransactions(['PublicCrocodiles', 'SingleCrocodile']);

export default function () {
  console.log('[k6-perf] [INFO] Starting Public Crocodiles scenario');

  group('Public Crocodiles', function () {
    startTransaction('PublicCrocodiles');
    const res = http.get('https://test-api.k6.io/public/crocodiles/');
    check(res, { 'Public Crocodiles: status 200': (r) => r.status === 200 });
    endTransaction('PublicCrocodiles');
  });

  sleep(1); // think time between transactions

  group('Single Crocodile', function () {
    startTransaction('SingleCrocodile');
    const res = http.get('https://test-api.k6.io/public/crocodiles/1/');
    check(res, { 'Single Crocodile: status 200': (r) => r.status === 200 });
    endTransaction('SingleCrocodile');
  });

  sleep(1);
}
