import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { initTransactions, startTransaction, endTransaction } from '../../../dist/utils/transaction.js';

/**
 * Web UI Journey: Homepage -> News -> Contacts -> PI page
 * Target: https://test.k6.io (k6's free testing website)
 *
 * This script simulates a user browsing a website server-side.
 * It follows real user navigation patterns with think-times between pages.
 */

initTransactions(['HomePage', 'NewsPage', 'ContactsPage', 'PiPage']);

export default function () {
  // -- Transaction 1: Visit Homepage -----------------
  group('T01_HomePage', function () {
    startTransaction('HomePage');
    const res = http.get('https://test.k6.io/');
    check(res, {
      'HomePage: status 200': (r) => r.status === 200,
      'HomePage: has title': (r) => r.body.includes('<title>'),
      'HomePage: body size > 0': (r) => r.body.length > 0,
    });
    endTransaction('HomePage');
  });

  sleep(Math.random() * 3 + 1); // 1–4s think time (simulates real user reading)

  // -- Transaction 2: Navigate to News ---------------
  group('T02_NewsPage', function () {
    startTransaction('NewsPage');
    const res = http.get('https://test.k6.io/news.php');
    check(res, {
      'NewsPage: status 200': (r) => r.status === 200,
      'NewsPage: contains news content': (r) => r.body.includes('In the news'),
    });
    endTransaction('NewsPage');
  });

  sleep(Math.random() * 2 + 1); // 1–3s think time

  // -- Transaction 3: Navigate to Contacts -----------
  group('T03_ContactsPage', function () {
    startTransaction('ContactsPage');
    const res = http.get('https://test.k6.io/contacts.php');
    check(res, {
      'ContactsPage: status 200': (r) => r.status === 200,
      'ContactsPage: has form': (r) => r.body.includes('contact'),
    });
    endTransaction('ContactsPage');
  });

  sleep(Math.random() * 2 + 1);

  // -- Transaction 4: Navigate to PI calculation page -
  group('T04_PiPage', function () {
    startTransaction('PiPage');
    const res = http.get('https://test.k6.io/pi.php?decimals=3');
    check(res, {
      'PiPage: status 200': (r) => r.status === 200,
      'PiPage: returns PI value': (r) => r.body.includes('3.14'),
    });
    endTransaction('PiPage');
  });

  sleep(1);
}
