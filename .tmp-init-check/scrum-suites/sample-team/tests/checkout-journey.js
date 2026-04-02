import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend } from 'k6/metrics';

// Transaction Trend metrics (LoadRunner-style per-transaction timing)
const txn_Login = new Trend('txn_Login');
const txn_AddToCart = new Trend('txn_AddToCart');
const txn_Checkout = new Trend('txn_Checkout');

export default function () {
  group('Login', function () {
    const start = Date.now();
    const res = http.post('https://your-dev-environment.com/auth/login', JSON.stringify({
      // TODO: parameterize with p_username and p_password from data file
      username: 'testuser001',
      password: 'P@ssw0rd1',
    }), { headers: { 'Content-Type': 'application/json' } });
    check(res, { 'Login: status 200': (r) => r.status === 200 });
    // TODO: Correlate auth token -> c_authToken
    txn_Login.add(Date.now() - start);
  });

  sleep(1);

  group('Add To Cart', function () {
    const start = Date.now();
    const res = http.post('https://your-dev-environment.com/cart/add', JSON.stringify({
      productId: 'PROD-001',
      quantity: 1,
    }), { headers: { 'Content-Type': 'application/json' } });
    check(res, { 'AddToCart: status 2xx': (r) => r.status >= 200 && r.status < 300 });
    txn_AddToCart.add(Date.now() - start);
  });

  sleep(1);

  group('Checkout', function () {
    const start = Date.now();
    const res = http.post('https://your-dev-environment.com/checkout', '{}', {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res, { 'Checkout: status 2xx': (r) => r.status >= 200 && r.status < 300 });
    txn_Checkout.add(Date.now() - start);
  });

  sleep(1);
}
