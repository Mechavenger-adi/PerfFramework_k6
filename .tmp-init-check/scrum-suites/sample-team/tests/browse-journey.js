import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend } from 'k6/metrics';

// Transaction Trend metrics (LoadRunner-style per-transaction timing)
const txn_Homepage = new Trend('txn_Homepage');
const txn_ProductList = new Trend('txn_ProductList');

export default function () {
  group('Homepage', function () {
    const start = Date.now();
    // TODO: Replace with your baseUrl from config
    const res = http.get('https://your-dev-environment.com/');
    check(res, { 'Homepage: status 2xx': (r) => r.status >= 200 && r.status < 300 });
    txn_Homepage.add(Date.now() - start);
  });

  sleep(1); // think time between transactions

  group('Product List', function () {
    const start = Date.now();
    const res = http.get('https://your-dev-environment.com/products');
    check(res, { 'ProductList: status 2xx': (r) => r.status >= 200 && r.status < 300 });
    txn_ProductList.add(Date.now() - start);
  });

  sleep(1);
}
