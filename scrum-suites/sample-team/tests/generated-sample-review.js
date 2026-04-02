import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { initTransactions, startTransaction, endTransaction } from '../../../core-engine/src/utils/transaction.js';
import { logReplayExchange } from '../../../core-engine/src/utils/replayLogger.js';

initTransactions([
  "T01_Login",
  "T02_Dashboard",
  "T03_Checkout"
]);

export default function () {
  group('T01_Login', function () {
    startTransaction('T01_Login');
    // har_entry: req_0
    const replayMeta_req_0 = {
      "harEntryId": "req_0",
      "transaction": "T01_Login",
      "recordingStartedAt": "2026-03-24T01:00:00.100Z",
      "tags": {
        "transaction": "T01_Login",
        "har_entry_id": "req_0",
        "recording_started_at": "2026-03-24T01:00:00.100Z"
      },
      "method": "GET",
      "url": "https://api.example.com/auth/csrf-token"
    };
    const req_req_0_params = {
      "tags": {
        "transaction": "T01_Login",
        "har_entry_id": "req_0",
        "recording_started_at": "2026-03-24T01:00:00.100Z"
      },
      "headers": {
        "Accept": "application/json"
      }
    };
    console.log('[k6-perf][replay] ' + JSON.stringify(replayMeta_req_0));
    const req_req_0_info = {
      headers: req_req_0_params.headers || {},
      body: undefined,
    };
    const res_1 = http.get("https://api.example.com/auth/csrf-token", req_req_0_params);
    logReplayExchange(replayMeta_req_0, req_req_0_info, res_1);
    check(res_1, {
      "T01_Login - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_1
    const replayMeta_req_1 = {
      "harEntryId": "req_1",
      "transaction": "T01_Login",
      "recordingStartedAt": "2026-03-24T01:00:00.350Z",
      "tags": {
        "transaction": "T01_Login",
        "har_entry_id": "req_1",
        "recording_started_at": "2026-03-24T01:00:00.350Z"
      },
      "method": "POST",
      "url": "https://api.example.com/auth/login"
    };
    const req_req_1_params = {
      "tags": {
        "transaction": "T01_Login",
        "har_entry_id": "req_1",
        "recording_started_at": "2026-03-24T01:00:00.350Z"
      },
      "headers": {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-CSRF-Token": "csrf_abc123def456"
      }
    };
    console.log('[k6-perf][replay] ' + JSON.stringify(replayMeta_req_1));
    const req_req_1_body = "{\"username\": \"testuser\", \"password\": \"testpass123\"}";
    const req_req_1_info = {
      headers: req_req_1_params.headers || {},
      body: req_req_1_body,
    };
    const res_2 = http.post("https://api.example.com/auth/login", req_req_1_body, req_req_1_params);
    logReplayExchange(replayMeta_req_1, req_req_1_info, res_2);
    check(res_2, {
      "T01_Login - status is 200": (r) => r.status === 200,
    });
    endTransaction('T01_Login');
  });

  sleep(1);

  group('T02_Dashboard', function () {
    startTransaction('T02_Dashboard');
    // har_entry: req_3
    const replayMeta_req_3 = {
      "harEntryId": "req_3",
      "transaction": "T02_Dashboard",
      "recordingStartedAt": "2026-03-24T01:00:02.100Z",
      "tags": {
        "transaction": "T02_Dashboard",
        "har_entry_id": "req_3",
        "recording_started_at": "2026-03-24T01:00:02.100Z"
      },
      "method": "GET",
      "url": "https://api.example.com/user/profile"
    };
    const req_req_3_params = {
      "tags": {
        "transaction": "T02_Dashboard",
        "har_entry_id": "req_3",
        "recording_started_at": "2026-03-24T01:00:02.100Z"
      },
      "headers": {
        "Accept": "application/json",
        "X-Session-Id": "sess_xyz789abc"
      }
    };
    console.log('[k6-perf][replay] ' + JSON.stringify(replayMeta_req_3));
    const req_req_3_info = {
      headers: req_req_3_params.headers || {},
      body: undefined,
    };
    const res_1 = http.get("https://api.example.com/user/profile", req_req_3_params);
    logReplayExchange(replayMeta_req_3, req_req_3_info, res_1);
    check(res_1, {
      "T02_Dashboard - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_4
    const replayMeta_req_4 = {
      "harEntryId": "req_4",
      "transaction": "T02_Dashboard",
      "recordingStartedAt": "2026-03-24T01:00:02.450Z",
      "tags": {
        "transaction": "T02_Dashboard",
        "har_entry_id": "req_4",
        "recording_started_at": "2026-03-24T01:00:02.450Z"
      },
      "method": "GET",
      "url": "https://api.example.com/products?category=electronics&limit=10"
    };
    const req_req_4_params = {
      "tags": {
        "transaction": "T02_Dashboard",
        "har_entry_id": "req_4",
        "recording_started_at": "2026-03-24T01:00:02.450Z"
      },
      "headers": {
        "Accept": "application/json"
      }
    };
    console.log('[k6-perf][replay] ' + JSON.stringify(replayMeta_req_4));
    const req_req_4_info = {
      headers: req_req_4_params.headers || {},
      body: undefined,
    };
    const res_2 = http.get("https://api.example.com/products?category=electronics&limit=10", req_req_4_params);
    logReplayExchange(replayMeta_req_4, req_req_4_info, res_2);
    check(res_2, {
      "T02_Dashboard - status is 200": (r) => r.status === 200,
    });
    endTransaction('T02_Dashboard');
  });

  sleep(1);

  group('T03_Checkout', function () {
    startTransaction('T03_Checkout');
    // har_entry: req_5
    const replayMeta_req_5 = {
      "harEntryId": "req_5",
      "transaction": "T03_Checkout",
      "recordingStartedAt": "2026-03-24T01:00:04.100Z",
      "tags": {
        "transaction": "T03_Checkout",
        "har_entry_id": "req_5",
        "recording_started_at": "2026-03-24T01:00:04.100Z"
      },
      "method": "POST",
      "url": "https://api.example.com/cart/add"
    };
    const req_req_5_params = {
      "tags": {
        "transaction": "T03_Checkout",
        "har_entry_id": "req_5",
        "recording_started_at": "2026-03-24T01:00:04.100Z"
      },
      "headers": {
        "Content-Type": "application/json",
        "X-Session-Id": "sess_xyz789abc"
      }
    };
    console.log('[k6-perf][replay] ' + JSON.stringify(replayMeta_req_5));
    const req_req_5_body = "{\"productId\": \"prod_001\", \"qty\": 1}";
    const req_req_5_info = {
      headers: req_req_5_params.headers || {},
      body: req_req_5_body,
    };
    const res_1 = http.post("https://api.example.com/cart/add", req_req_5_body, req_req_5_params);
    logReplayExchange(replayMeta_req_5, req_req_5_info, res_1);
    check(res_1, {
      "T03_Checkout - status is 201": (r) => r.status === 201,
    });

    // har_entry: req_6
    const replayMeta_req_6 = {
      "harEntryId": "req_6",
      "transaction": "T03_Checkout",
      "recordingStartedAt": "2026-03-24T01:00:04.520Z",
      "tags": {
        "transaction": "T03_Checkout",
        "har_entry_id": "req_6",
        "recording_started_at": "2026-03-24T01:00:04.520Z"
      },
      "method": "POST",
      "url": "https://api.example.com/checkout/confirm"
    };
    const req_req_6_params = {
      "tags": {
        "transaction": "T03_Checkout",
        "har_entry_id": "req_6",
        "recording_started_at": "2026-03-24T01:00:04.520Z"
      },
      "headers": {
        "Content-Type": "application/json",
        "X-Session-Id": "sess_xyz789abc"
      }
    };
    console.log('[k6-perf][replay] ' + JSON.stringify(replayMeta_req_6));
    const req_req_6_body = "{\"orderId\": \"ORD-9982\", \"paymentMethod\": \"card\"}";
    const req_req_6_info = {
      headers: req_req_6_params.headers || {},
      body: req_req_6_body,
    };
    const res_2 = http.post("https://api.example.com/checkout/confirm", req_req_6_body, req_req_6_params);
    logReplayExchange(replayMeta_req_6, req_req_6_info, res_2);
    check(res_2, {
      "T03_Checkout - status is 200": (r) => r.status === 200,
    });
    endTransaction('T03_Checkout');
  });

}
