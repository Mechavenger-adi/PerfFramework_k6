# How-To: Web UI Performance Test (Server-Side)

This guide walks you through the sample **Web UI performance test** included in the framework. It simulates real user behavior on a web application using **server-side HTTP requests only** (no browser rendering).

---

## Target Application

**Website:** [https://test.k6.io](https://test.k6.io)  
This is a free test application provided by k6, specifically designed for performance testing.

## What We're Testing

| Journey | Weight | User Flow |
|---------|--------|-----------|
| **Homepage Browsing** | 60% | Home -> News -> Contacts -> PI page |
| **Login Flow** | 40% | Login page -> Submit credentials -> View messages -> Submit form -> Logout |

## Load Profile

| Phase | Duration | VUs |
|-------|----------|-----|
| Ramp-up | 15 seconds | 0 -> 10 |
| Steady state | 1 minute | 10 |
| Ramp-down | 15 seconds | 10 -> 0 |

**Total test duration:** ~1 minute 30 seconds

## SLA Thresholds

| Metric | Target |
|--------|--------|
| P95 Response Time | < 2000ms |
| Error Rate | < 10% |

---

## Files Created

```
config/
  test-plans/
    webui-load-test.json          # Test plan (load profile, journeys, SLAs)
scrum-suites/
  webui-team/
    tests/
      homepage-journey.js          # Browsing journey script
      login-journey.js             # Login + form submission journey script
```

---

## How to Run

### Step 1: Validate the test plan
```bash
npx tsx core-engine/src/cli/run.ts validate --plan config/test-plans/webui-load-test.json
```

### Step 2: Execute the test
```bash
npx tsx core-engine/src/cli/run.ts run --plan config/test-plans/webui-load-test.json
```

---

## Understanding the Scripts

### Server-Side Only (No Browser)
These scripts use **`http.get()` and `http.post()`** directly — k6 sends raw HTTP requests to the server and validates the HTML responses. This is called **protocol-level testing**. It does NOT render CSS, JavaScript, or images in a browser.

**Why server-side?**
- **Faster**: Can simulate thousands of users on a single machine
- **Lower resource usage**: No browser instances needed
- **Sufficient for load testing**: Server performance is the bottleneck, not client rendering

### Transaction Metrics (LoadRunner-Style)
Each `group()` block wraps a business transaction with a LoadRunner-style timing helper:
```javascript
import { initTransactions, startTransaction, endTransaction } from '../../../dist/utils/transaction.js';

// Init context: Declare transactions upfront so k6 can aggregate them
initTransactions(['HomePage']);

export default function () {
  group('T01_HomePage', function () {
    startTransaction('HomePage'); // Starts the timer
    const res = http.get('https://test.k6.io/');
    // ... checks ...
    endTransaction('HomePage');   // Ends timer & calculates duration
  });
}
```
This gives you **per-transaction P90/P95/P99 timings** in the k6 output, similar to LoadRunner's Transaction Summary.

### Think Times
```javascript
sleep(Math.random() * 3 + 1); // 1–4 seconds random delay
```
Realistic think times simulate actual user reading/interaction pauses between pages.

### Content Assertions
```javascript
check(res, {
  'HomePage: status 200': (r) => r.status === 200,
  'HomePage: has title': (r) => r.body.includes('<title>'),
});
```
Beyond status codes, we validate the response body contains expected content — catching silent failures where the server returns 200 but with wrong content.

---

## Expected Output

After running, k6 will display a results summary showing:
- **HTTP request metrics** (duration, failed rate, throughput)
- **Transaction Trend metrics** (`txn_HomePage`, `txn_LoginSubmit`, etc.)
- **Check pass/fail rates**
- **Threshold pass/fail status**

Look for:
```
[PASS] All thresholds passed   -> SLAs met
[FAIL] Threshold crossed       -> SLA breach (investigate slow transactions)
```

---

## Customizing

| What | Where |
|------|-------|
| Change load profile | `config/test-plans/webui-load-test.json` -> `stages` |
| Adjust VU count | `config/test-plans/webui-load-test.json` -> `target` in stages |
| Change journey weight | `config/test-plans/webui-load-test.json` -> `weight` per journey |
| Add new transactions | Add sequence to `initTransactions` array and wrap a `group()` block with `startTransaction`/`endTransaction` |
| Change target website | Update URLs in the journey `.js` files |
| Add SLA per journey | Add `journey_slas` to the test plan JSON |
