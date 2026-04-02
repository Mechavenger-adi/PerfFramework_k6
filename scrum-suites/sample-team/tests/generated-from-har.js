import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend } from 'k6/metrics';

const txn_T01_Login = new Trend('txn_T01_Login');
const txn_T02_Dashboard = new Trend('txn_T02_Dashboard');
const txn_T03_Checkout = new Trend('txn_T03_Checkout');

export default function () {
  group('T01_Login', function () {
    const start = Date.now();
    // har_entry: req_0
    let res = http.get('https://api.example.com/auth/csrf-token', { headers: {"Accept":"application/json"} });
    check(res, { 'T01_Login - status is 200': (r) => r.status === 200 });
    // har_entry: req_1
    let res = http.post('https://api.example.com/auth/login', "{\"username\": \"testuser\", \"password\": \"testpass123\"}", { headers: {"Content-Type":"application/json","Accept":"application/json","X-CSRF-Token":"csrf_abc123def456"} });
    check(res, { 'T01_Login - status is 200': (r) => r.status === 200 });
    txn_T01_Login.add(Date.now() - start);
  });

  sleep(1);

  group('T02_Dashboard', function () {
    const start = Date.now();
    // har_entry: req_3
    let res = http.get('https://api.example.com/user/profile', { headers: {"Accept":"application/json","X-Session-Id":"sess_xyz789abc"} });
    check(res, { 'T02_Dashboard - status is 200': (r) => r.status === 200 });
    // har_entry: req_4
    let res = http.get('https://api.example.com/products?category=electronics&limit=10', { headers: {"Accept":"application/json"} });
    check(res, { 'T02_Dashboard - status is 200': (r) => r.status === 200 });
    txn_T02_Dashboard.add(Date.now() - start);
  });

  sleep(1);

  group('T03_Checkout', function () {
    const start = Date.now();
    // har_entry: req_5
    let res = http.post('https://api.example.com/cart/add', "{\"productId\": \"prod_001\", \"qty\": 1}", { headers: {"Content-Type":"application/json","X-Session-Id":"sess_xyz789abc"} });
    check(res, { 'T03_Checkout - status is 201': (r) => r.status === 201 });
    // har_entry: req_6
    let res = http.post('https://api.example.com/checkout/confirm', "{\"orderId\": \"ORD-9982\", \"paymentMethod\": \"card\"}", { headers: {"Content-Type":"application/json","X-Session-Id":"sess_xyz789abc"} });
    check(res, { 'T03_Checkout - status is 200': (r) => r.status === 200 });
    txn_T03_Checkout.add(Date.now() - start);
  });

}
