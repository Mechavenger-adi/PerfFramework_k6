import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { initTransactions, startTransaction, endTransaction } from '../../../dist/utils/transaction.js';

/**
 * Web UI Journey: Login -> My Messages -> Submit Contact Form -> Logout
 * Target: https://test.k6.io (k6's free testing website)
 *
 * This script simulates authenticated user actions on the website.
 * The login form is a real HTML form that returns cookies on success.
 */

initTransactions(['LoginPage', 'LoginSubmit', 'MyMessages', 'FormSubmit', 'Logout']);

export default function () {
  // -- Transaction 1: Load Login Page ----------------
  group('T01_LoginPage', function () {
    startTransaction('LoginPage');
    const res = http.get('https://test.k6.io/my_messages.php');
    check(res, {
      'LoginPage: status 200': (r) => r.status === 200,
      'LoginPage: has login form': (r) => r.body.includes('login'),
    });
    endTransaction('LoginPage');
  });

  sleep(Math.random() * 2 + 1);

  // -- Transaction 2: Submit Login Credentials -------
  group('T02_LoginSubmit', function () {
    startTransaction('LoginSubmit');
    const res = http.post('https://test.k6.io/my_messages.php', {
      login: 'admin',
      password: '123',
    });
    check(res, {
      'LoginSubmit: status 200': (r) => r.status === 200,
      'LoginSubmit: login successful': (r) => r.body.includes('Welcome') || r.body.includes('my_messages'),
    });
    endTransaction('LoginSubmit');
  });

  sleep(Math.random() * 3 + 2); // 2–5s think time (user reading messages)

  // -- Transaction 3: View My Messages ---------------
  group('T03_MyMessages', function () {
    startTransaction('MyMessages');
    const res = http.get('https://test.k6.io/my_messages.php');
    check(res, {
      'MyMessages: status 200': (r) => r.status === 200,
    });
    endTransaction('MyMessages');
  });

  sleep(Math.random() * 2 + 1);

  // -- Transaction 4: Submit Contact Form ------------
  group('T04_FormSubmit', function () {
    startTransaction('FormSubmit');
    const res = http.post('https://test.k6.io/contacts.php', {
      email: 'perftest@k6.io',
      message: 'Performance test submission - automated by k6-perf framework',
    });
    check(res, {
      'FormSubmit: status 200': (r) => r.status === 200,
    });
    endTransaction('FormSubmit');
  });

  sleep(Math.random() * 2 + 1);

  // -- Transaction 5: Logout -------------------------
  group('T05_Logout', function () {
    startTransaction('Logout');
    const res = http.get('https://test.k6.io/');
    check(res, {
      'Logout: status 200': (r) => r.status === 200,
    });
    endTransaction('Logout');
  });

  sleep(1);
}
