# Auto-Correlation Setup and Workflow Guide

Dynamic correlation prevents load tests from failing due to expired tokens, single-use session counters, or CSRF guard values. The framework implements a **Rule-based Correlation Engine** that automatically extracts these values from HTTP responses and makes them available to subsequent requests – exactly like LoadRunner's correlation feature.

---

## How Auto-Correlation Works

```
Browser/HAR Recording                  k6 Script Execution (at runtime)
─────────────────────                  ────────────────────────────────
  GET /auth/csrf-token                    engine.process(csrfRes)
  ← response body: { csrfToken: "abc" }  ← rule: jsonpath "csrfToken"
                                              stored as engine["csrfToken"] = "abc"

  POST /auth/login  { X-CSRF: "abc" }
  ← response: { token: "jwt_xyz" }       engine.process(loginRes)
              X-Session-Id: "sess_001"   ← rule: jsonpath "token"
                                              stored as engine["bearerToken"] = "jwt_xyz"
                                         ← rule: header "X-Session-Id"
                                              stored as engine["sessionId"] = "sess_001"

  GET /user/profile                       engine.get("bearerToken") → "jwt_xyz"
    Authorization: Bearer jwt_xyz         engine.get("sessionId")   → "sess_001"
```

There are three phases:
1. **Define rules** – tell the engine what to look for and where.
2. **Generate a script** – optionally from a HAR recording.
3. **Integrate** – wire `engine.process()` and `engine.get()` into the script.

---

## Phase 1 – Define Correlation Rules

Create or update `correlation-rules.json` in your team's suite folder:

```
scrum-suites/<your-team>/correlation-rules.json
```

### Rule structure

```json
[
  {
    "name":         "bearerToken",
    "source":       "body",
    "extractor":    "jsonpath",
    "pattern":      "token",
    "fallback":     "fail",
    "isCritical":   true
  },
  {
    "name":         "sessionId",
    "source":       "header",
    "extractor":    "header",
    "pattern":      "X-Session-Id",
    "fallback":     "skip"
  },
  {
    "name":         "csrfToken",
    "source":       "body",
    "extractor":    "jsonpath",
    "pattern":      "csrfToken",
    "fallback":     "fail",
    "isCritical":   true
  },
  {
    "name":         "orderId",
    "source":       "body",
    "extractor":    "regex",
    "pattern":      "\"orderId\":\\s*\"([^\"]+)\"",
    "fallback":     "default",
    "defaultValue": "ORD-UNKNOWN"
  }
]
```

### Field reference

| Field | Required | Values | Description |
|:------|:--------:|:-------|:------------|
| `name` | Yes | any string | Handle used in `engine.get('name')` |
| `source` | Yes | `body` / `header` | Where to look in the response |
| `extractor` | Yes | `jsonpath` / `regex` / `header` | Extraction strategy |
| `pattern` | Yes | dot path / regex / header name | The lookup query |
| `fallback` | Yes | `fail` / `skip` / `default` | What to do when extraction fails |
| `defaultValue` | No | any string | Used only when `fallback = "default"` |
| `isCritical` | No | `true` / `false` | When `true`, always throws on failure |

### Extractor types explained

| Extractor | Pattern format | Example |
|:----------|:--------------|:--------|
| `jsonpath` | Dot-notation key path | `"token"` → `res.body.token` |
| `regex` | RegExp with a capture group | `"token=\"([^\"]+)\""` |
| `header` | Exact header name (case-sensitive) | `"X-Session-Id"` |

### Fallback behaviour

| `fallback` | `isCritical` | Behaviour |
|:-----------|:------------:|:----------|
| `fail` | any | Throws immediately – test fails |
| `skip` | false | Logs a warning, continues with `undefined` |
| `default` | false | Uses `defaultValue` if set, else skips |

---

## Phase 2A – Convert a HAR Recording to a k6 Script (Auto-Generation)

### Step 1: Record the user journey

Use any tool that exports a HAR file. Common options:

| Tool | How to export HAR |
|:-----|:------------------|
| Chrome DevTools | F12 → Network → right-click → "Save all as HAR with content" |
| Firefox DevTools | F12 → Network → gear icon → "Save All As HAR" |
| Postman | Collection Runner → Export HAR |
| Fiddler / Charles | File → Export → HAR |

Save the file to your team's recordings folder:
```
scrum-suites/<your-team>/recordings/my-flow.har
```

### Step 2: Name your transactions in the HAR

The generator groups requests by their `pageref` field (set by the browser per navigation). **Before generating**, open the HAR and confirm the `pageref` values on each entry look like meaningful transaction names.

If they are auto-named (e.g. `page_1`, `page_2`), rename them inside the HAR JSON:

```json
"pageref": "T01_Login"
"pageref": "T02_Dashboard"
"pageref": "T03_Checkout"
```

> The generator sanitizes names automatically (spaces and special chars → underscores),
> but descriptive names produce cleaner scripts.

### Step 3: Run the CLI generator

```bash
npm run cli -- generate <team-name> <script-name> --har scrum-suites/<team>/recordings/my-flow.har
```

**Example:**
```bash
npm run cli -- generate sample-team login-flow --har scrum-suites/sample-team/recordings/sample-login-flow.har
```

The CLI will:
1. Parse and validate the HAR file.
2. **Automatically remove** static assets (images, fonts, CSS, JS bundles).
3. **Strip sensitive headers** (Authorization, Cookie, X-Correlation-Id, etc.).
4. Group remaining requests by `pageref` into transaction groups.
5. Generate a ready-to-run k6 script at:
   ```
   scrum-suites/<team>/tests/<script-name>.js
   ```

### Step 4: Review the generated script

The generated output will look like this:

```javascript
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
        let res = http.get('https://api.example.com/auth/csrf-token', { headers: {...} });
        check(res, { 'T01_Login - status is 200': (r) => r.status === 200 });
        // har_entry: req_1
        let res = http.post('https://api.example.com/auth/login', '{"username":"testuser"...}', { headers: {...} });
        check(res, { 'T01_Login - status is 200': (r) => r.status === 200 });
        txn_T01_Login.add(Date.now() - start);
    });

    sleep(1);
    // ... T02_Dashboard, T03_Checkout groups follow
}
```

> **The generated script is your starting point, not the finish line.**
> Dynamic values (tokens, session IDs) are still hardcoded at this stage—
> that's what Phase 2B fixes.

---

## Phase 2B – Add Correlation to the Generated Script

After generating the script, add correlation in three steps.

### Step 1: Add imports at the top

```javascript
import { CorrelationEngine, RuleProcessor } from '../../../dist/index.js';
import { initTransactions, startTransaction, endTransaction } from '../../../dist/utils/transaction.js';
```

### Step 2: Initialize the engine before `export default`

```javascript
const rules = RuleProcessor.loadRules('scrum-suites/<team>/correlation-rules.json');
const engine = new CorrelationEngine(rules);

initTransactions(['T01_Login', 'T02_Dashboard', 'T03_Checkout']);
```

### Step 3: Wire process() and get() around requests

**Before (generated – hardcoded token):**
```javascript
group('T01_Login', function () {
    let res = http.post('https://api.example.com/auth/login', body, { headers: { 'X-CSRF-Token': 'csrf_abc123def456' } });
    check(res, { ... });
});

group('T02_Dashboard', function () {
    let res = http.get('https://api.example.com/user/profile', {
        headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9...' }
    });
});
```

**After (correlated – fully dynamic):**
```javascript
group('T01_Login', function () {
    startTransaction('T01_Login');

    // 1. Fetch CSRF token
    const csrfRes = http.get('https://api.example.com/auth/csrf-token');
    engine.process(csrfRes);                           // extracts csrfToken

    const csrfToken = engine.get('csrfToken');

    // 2. Use correlated CSRF token in login POST
    const loginRes = http.post('https://api.example.com/auth/login', body, {
        headers: { 'X-CSRF-Token': csrfToken }         // no hardcoding!
    });
    engine.process(loginRes);                          // extracts bearerToken + sessionId

    endTransaction('T01_Login');
});

group('T02_Dashboard', function () {
    startTransaction('T02_Dashboard');

    const bearerToken = engine.get('bearerToken');     // retrieved from engine store
    const sessionId   = engine.get('sessionId');

    const res = http.get('https://api.example.com/user/profile', {
        headers: {
            'Authorization': `Bearer ${bearerToken}`,  // no hardcoding!
            'X-Session-Id':  sessionId
        }
    });

    endTransaction('T02_Dashboard');
});
```

---

## Phase 3 – Run the Test

```bash
# From the framework root directory
k6 run scrum-suites/<team>/tests/<script-name>.js
```

**With environment overrides:**
```bash
k6 run --env BASE_URL=https://staging.example.com \
        --vus 10 \
        --duration 5m \
        scrum-suites/sample-team/tests/correlation-journey.js
```

### What to look for in the output

```
[Correlation] Extracted csrfToken
[Correlation] Extracted bearerToken
[Correlation] Extraction failed for: sessionId, skipping gracefully.   ← "skip" fallback
[Correlation] Extracted orderId

checks.........................: 100.00% ✓ 6 ✗ 0
T01 – CSRF endpoint returned 200: 100%
T01 – Login POST returned 200:    100%
T02 – Profile GET returned 200:   100%
T03 – Checkout POST returned 200: 100%
```

A `[Correlation] Critical fallback triggered` log followed by a test error means a rule with `fallback: "fail"` or `isCritical: true` did not find its target. Check:
- The response body/header structure
- That the `pattern` in the rule matches the actual field name
- That `engine.process()` is called **before** `engine.get()`

---

## Complete Reference – The Sample Files

| File | Purpose |
|:-----|:--------|
| `scrum-suites/sample-team/recordings/sample-login-flow.har` | Realistic 3-transaction HAR with login, dashboard, checkout |
| `scrum-suites/sample-team/correlation-rules.json` | Rules for csrfToken, bearerToken, sessionId, orderId |
| `scrum-suites/sample-team/tests/correlation-journey.js` | Fully annotated test that demonstrates all 4 correlation patterns |

### Correlation patterns covered in the sample test

| Pattern | Rule Name | Extractor | Transaction |
|:--------|:----------|:----------|:------------|
| JSON body field | `csrfToken` | `jsonpath` | T01 step 1 |
| JSON body field (JWT) | `bearerToken` | `jsonpath` | T01 step 2 |
| Response header value | `sessionId` | `header` | T01 step 2 |
| Chained body value | `orderId` | `jsonpath` | T03 → T03 |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|:--------|:-------------|:----|
| `Critical correlation extraction failed for X` | Rule is `isCritical: true` and pattern didn't match | Check actual response against rule pattern |
| `engine.get('X')` returns `undefined` | `engine.process()` not called before `engine.get()` | Ensure process() runs on the response that contains the value |
| Wrong value extracted | Multiple matches for regex, or wrong jsonpath key | Make the regex more specific; use dot-notation for nested keys, e.g. `"data.user.token"` |
| Static assets still in generated script | HAR exported without page grouping | Re-export HAR with `excludeStaticAssets: true` (CLI default) or clean the HAR manually |
| Token missing from second VU iteration | Tokens were extracted only once at init | Call `engine.process()` inside `export default function()`, not at module level |


npm run cli -- generate sample-team login-flow \
    --har scrum-suites/sample-team/recordings/sample-login-flow.har
