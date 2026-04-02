import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { initTransactions, startTransaction, endTransaction } from '../../../core-engine/src/utils/transaction.js';
import { logExchange } from '../../../core-engine/src/utils/replayLogger.js';

initTransactions(["T01_Login", "T02_Dashboard", "T03_Checkout"]);

export default function () {
  group('T01_Login', function () {
    startTransaction('T01_Login');
    // har_entry: req_0
    const request_1 = {
      id: "req_0",
      transaction: "T01_Login",
      recordingStartedAt: new Date().toISOString(),
      method: "GET",
      url: 'https://api.example.com/auth/csrf-token',
      body: null,
      variableEvents: [],
      params: {
        headers: {"Accept":"application/json"},
        tags: {
          transaction: "T01_Login",
          har_entry_id: "req_0",
          recording_started_at: "converted"
        }
      }
    };
    const res_1 = http.get(request_1.url, request_1.params);
    logExchange(request_1, res_1);
    check(res_1, { 'T01_Login - status is 200': (r) => r.status === 200 });
    // har_entry: req_1
    const request_2 = {
      id: "req_1",
      transaction: "T01_Login",
      recordingStartedAt: new Date().toISOString(),
      method: "POST",
      url: 'https://api.example.com/auth/login',
      body: "{\"username\": \"testuser\", \"password\": \"testpass123\"}",
      variableEvents: [],
      params: {
        headers: {"Content-Type":"application/json","Accept":"application/json","X-CSRF-Token":"csrf_abc123def456"},
        tags: {
          transaction: "T01_Login",
          har_entry_id: "req_1",
          recording_started_at: "converted"
        }
      }
    };
    const res_2 = http.post(request_2.url, request_2.body, request_2.params);
    logExchange(request_2, res_2);
    check(res_2, { 'T01_Login - status is 200': (r) => r.status === 200 });
    endTransaction('T01_Login');
  });

  sleep(1);

  group('T02_Dashboard', function () {
    startTransaction('T02_Dashboard');
    // har_entry: req_3
    const request_1 = {
      id: "req_3",
      transaction: "T02_Dashboard",
      recordingStartedAt: new Date().toISOString(),
      method: "GET",
      url: 'https://api.example.com/user/profile',
      body: null,
      variableEvents: [],
      params: {
        headers: {"Accept":"application/json","X-Session-Id":"sess_xyz789abc"},
        tags: {
          transaction: "T02_Dashboard",
          har_entry_id: "req_3",
          recording_started_at: "converted"
        }
      }
    };
    const res_1 = http.get(request_1.url, request_1.params);
    logExchange(request_1, res_1);
    check(res_1, { 'T02_Dashboard - status is 200': (r) => r.status === 200 });
    // har_entry: req_4
    const request_2 = {
      id: "req_4",
      transaction: "T02_Dashboard",
      recordingStartedAt: new Date().toISOString(),
      method: "GET",
      url: 'https://api.example.com/products?category=electronics&limit=10',
      body: null,
      variableEvents: [],
      params: {
        headers: {"Accept":"application/json"},
        tags: {
          transaction: "T02_Dashboard",
          har_entry_id: "req_4",
          recording_started_at: "converted"
        }
      }
    };
    const res_2 = http.get(request_2.url, request_2.params);
    logExchange(request_2, res_2);
    check(res_2, { 'T02_Dashboard - status is 200': (r) => r.status === 200 });
    endTransaction('T02_Dashboard');
  });

  sleep(1);

  group('T03_Checkout', function () {
    startTransaction('T03_Checkout');
    // har_entry: req_5
    const request_1 = {
      id: "req_5",
      transaction: "T03_Checkout",
      recordingStartedAt: new Date().toISOString(),
      method: "POST",
      url: 'https://api.example.com/cart/add',
      body: "{\"productId\": \"prod_001\", \"qty\": 1}",
      variableEvents: [],
      params: {
        headers: {"Content-Type":"application/json","X-Session-Id":"sess_xyz789abc"},
        tags: {
          transaction: "T03_Checkout",
          har_entry_id: "req_5",
          recording_started_at: "converted"
        }
      }
    };
    const res_1 = http.post(request_1.url, request_1.body, request_1.params);
    logExchange(request_1, res_1);
    check(res_1, { 'T03_Checkout - status is 201': (r) => r.status === 201 });
    // har_entry: req_6
    const request_2 = {
      id: "req_6",
      transaction: "T03_Checkout",
      recordingStartedAt: new Date().toISOString(),
      method: "POST",
      url: 'https://api.example.com/checkout/confirm',
      body: "{\"orderId\": \"ORD-9982\", \"paymentMethod\": \"card\"}",
      variableEvents: [],
      params: {
        headers: {"Content-Type":"application/json","X-Session-Id":"sess_xyz789abc"},
        tags: {
          transaction: "T03_Checkout",
          har_entry_id: "req_6",
          recording_started_at: "converted"
        }
      }
    };
    const res_2 = http.post(request_2.url, request_2.body, request_2.params);
    logExchange(request_2, res_2);
    check(res_2, { 'T03_Checkout - status is 200': (r) => r.status === 200 });
    endTransaction('T03_Checkout');
  });

}
