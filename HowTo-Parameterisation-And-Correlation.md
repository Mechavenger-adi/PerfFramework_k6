# Parameterisation & Correlation Guide

> Practical guide for data-driving tests and handling dynamic server values using the k6 Performance Framework.

---

## Part 1 — Parameterisation

Parameterisation replaces hardcoded values (usernames, product IDs, search terms) with external data so that each virtual user operates on unique inputs — just like real users.

### 1.1 Framework Components

| Component | File | Role |
|:----------|:-----|:-----|
| **DataFactory** | `core-engine/src/data/DataFactory.ts` | Loads CSV/JSON files into `DataRow[]` arrays |
| **DataPoolManager** | `core-engine/src/data/DataPoolManager.ts` | Assigns rows to VUs with overflow strategies |
| **DataValidator** | `core-engine/src/data/DataValidator.ts` | Pre-flight validation (missing columns, row count vs VU demand) |
| **DynamicValueFactory** | `core-engine/src/data/DynamicValueFactory.ts` | Random/generated values (UUID, timestamp, email, phone) |

### 1.2 Data File Conventions

| Convention | Rule | Example |
|:-----------|:-----|:--------|
| **Location** | `scrum-suites/<team>/data/` | `scrum-suites/jpet-team/data/` |
| **Prefix** | Parameterised columns use `p_` prefix | `p_username`, `p_password`, `p_email` |
| **Format** | CSV (first row = header) or JSON array of objects | See below |

**CSV example** (`scrum-suites/my-team/data/p_users.csv`):
```csv
p_username,p_password,p_email
testuser001,P@ssw0rd1,testuser001@perf-test.local
testuser002,P@ssw0rd2,testuser002@perf-test.local
testuser003,P@ssw0rd3,testuser003@perf-test.local
```

**JSON example** (`scrum-suites/my-team/data/p_products.json`):
```json
[
  { "p_productId": "PROD-001", "p_name": "Widget A", "p_price": 29.99 },
  { "p_productId": "PROD-002", "p_name": "Widget B", "p_price": 49.99 },
  { "p_productId": "PROD-003", "p_name": "Widget C", "p_price": 19.99 }
]
```

### 1.3 Using Data in k6 Scripts

k6 runs inside its own JavaScript runtime — not Node.js. Data must be loaded using k6's `SharedArray` (for memory efficiency) or `open()` (for raw file access) in **init context** (outside `export default function`).

#### Pattern A — SharedArray with CSV (recommended for large files)

```javascript
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

// Init context: loaded once, shared across all VUs
const users = new SharedArray('users', function () {
  return papaparse.parse(open('./data/p_users.csv'), { header: true }).data;
});

export default function () {
  // Each VU gets a unique row based on its index
  const row = users[(__VU - 1) % users.length];

  const loginRes = http.post('https://api.example.com/login', JSON.stringify({
    username: row.p_username,
    password: row.p_password,
  }), { headers: { 'Content-Type': 'application/json' } });
}
```

#### Pattern B — JSON file

```javascript
import { SharedArray } from 'k6/data';

const products = new SharedArray('products', function () {
  return JSON.parse(open('./data/p_products.json'));
});

export default function () {
  const product = products[__ITER % products.length];

  http.post('https://api.example.com/cart/add', JSON.stringify({
    productId: product.p_productId,
    qty: 1,
  }), { headers: { 'Content-Type': 'application/json' } });
}
```

#### Pattern C — Random dynamic values (no data file needed)

The `DynamicValueFactory` provides stateless generators. Since it's a Node-side module, use these patterns directly in k6:

```javascript
// k6-native equivalents of DynamicValueFactory methods:
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function randomEmail(prefix = 'user') {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}@perf-test.local`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function () {
  http.post('https://api.example.com/register', JSON.stringify({
    userId: uuid(),
    email: randomEmail('perftest'),
    age: randomInt(18, 65),
  }), { headers: { 'Content-Type': 'application/json' } });
}
```

### 1.4 Overflow Strategies

When VU count exceeds data rows, the `DataPoolManager` supports three strategies:

| Strategy | Behaviour | Use When |
|:---------|:----------|:---------|
| `cycle` | Wraps around: VU 4 with 3 rows → gets row 1 | Most common — reuse data is acceptable |
| `terminate` | Throws error, stops the VU | Unique data required per VU (e.g. one-time tokens) |
| `continue_with_last` | All overflow VUs get the last row | Edge case fallback |

In-script implementation (maps to `__VU` and `__ITER`):

```javascript
// Simple cycle approach (no DataPoolManager dependency needed in k6 runtime)
const row = users[(__VU - 1) % users.length];

// Iteration-based (each iteration gets next row)
const row = users[(__ITER) % users.length];

// VU + iteration spread (for unique data per VU per iteration)
const idx = ((__VU - 1) * 1000 + __ITER) % users.length;
const row = users[idx];
```

### 1.5 Pre-Flight Validation (CLI)

The `DataValidator` runs during `GatekeeperValidator.validate()` before test execution:

```bash
npm run cli -- validate --plan config/test-plans/my-plan.json
```

Checks performed:
- Data file exists at the expected path
- Required columns are present in the header
- No blank required-column cells
- Row count warning if rows < VU count

### 1.6 Framework-Compatible Parameterised Script (Full Example)

```javascript
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';
import { initTransactions, startTransaction, endTransaction } from '../../../core-engine/src/utils/transaction.js';
import { logExchange } from '../../../core-engine/src/utils/replayLogger.js';

const users = new SharedArray('users', function () {
  return JSON.parse(open('./data/p_users.json'));
});

initTransactions(['t01_login', 't02_browse']);

export default function () {
  const user = users[(__VU - 1) % users.length];

  group('t01_login', function () {
    startTransaction('t01_login');

    const request_1 = {
      id: "req_1",
      transaction: "t01_login",
      recordingStartedAt: new Date().toISOString(),
      method: "POST",
      url: "https://api.example.com/auth/login",
      body: JSON.stringify({
        username: user.p_username,
        password: user.p_password,
      }),
      variableEvents: [],
      params: {
        headers: { "Content-Type": "application/json" },
        tags: {
          transaction: "t01_login",
          har_entry_id: "req_1",
          recording_started_at: "converted"
        }
      }
    };
    const res_1 = http.post(request_1.url, request_1.body, request_1.params);
    logExchange(request_1, res_1);
    check(res_1, { 't01_login - status is 200': (r) => r.status === 200 });

    endTransaction('t01_login');
  });

  sleep(1);
}
```

---

## Part 2 — Correlation

Correlation captures dynamic server-generated values (CSRF tokens, session IDs, bearer JWTs, order IDs) from responses and injects them into subsequent requests — eliminating hardcoded values that would fail under load.

### 2.1 Framework Components

| Component | File | Role |
|:----------|:-----|:-----|
| **CorrelationEngine** | `core-engine/src/correlation/CorrelationEngine.ts` | Central store — calls extractors per rule, stores results |
| **ExtractorRegistry** | `core-engine/src/correlation/ExtractorRegistry.ts` | Pluggable extractors: `regex`, `jsonpath`, `header` |
| **RuleProcessor** | `core-engine/src/correlation/RuleProcessor.ts` | Loads rule JSON files into typed `CorrelationRule[]` |
| **FallbackHandler** | `core-engine/src/correlation/FallbackHandler.ts` | Handles extraction failures per rule's fallback strategy |

### 2.2 Correlation Rule Schema

Rules are defined per team in `scrum-suites/<team>/correlation-rules.json`:

```json
[
  {
    "name": "csrfToken",
    "source": "body",
    "extractor": "jsonpath",
    "pattern": "csrfToken",
    "fallback": "fail",
    "isCritical": true
  },
  {
    "name": "bearerToken",
    "source": "body",
    "extractor": "jsonpath",
    "pattern": "token",
    "fallback": "fail",
    "isCritical": true
  },
  {
    "name": "sessionId",
    "source": "header",
    "extractor": "header",
    "pattern": "X-Session-Id",
    "fallback": "skip"
  },
  {
    "name": "orderId",
    "source": "body",
    "extractor": "regex",
    "pattern": "\"orderId\":\\s*\"([^\"]+)\"",
    "fallback": "default",
    "defaultValue": "ORD-UNKNOWN"
  }
]
```

### 2.3 Rule Field Reference

| Field | Required | Values | Description |
|:------|:--------:|:-------|:------------|
| `name` | Yes | any string | Handle used in `engine.get('name')` — convention: use `c_` prefix (e.g. `c_csrfToken`) |
| `source` | Yes | `body` / `header` | Where to search in the HTTP response |
| `extractor` | Yes | `jsonpath` / `regex` / `header` | Extraction strategy |
| `pattern` | Yes | varies by extractor | The lookup query (see table below) |
| `fallback` | Yes | `fail` / `skip` / `default` | Failure handling strategy |
| `defaultValue` | No | string | Fallback value when `fallback = "default"` |
| `isCritical` | No | boolean | When `true`, always throws on failure regardless of `fallback` |

### 2.4 Extractor Types

| Extractor | Pattern Format | What It Does | Example Pattern | Matches |
|:----------|:---------------|:-------------|:----------------|:--------|
| `jsonpath` | Dot-notation path | Navigates parsed JSON body | `"data.auth.token"` | `res.json().data.auth.token` |
| `regex` | Regular expression | Runs `RegExp.match()` on body string — uses capture group 1 if present | `"csrf_token\"\\s*value=\"([^\"]+)\""` | HTML hidden field value |
| `header` | Exact header name | Reads response header (case-sensitive) | `"X-Session-Id"` | `res.headers['X-Session-Id']` |

### 2.5 Fallback Behaviour Matrix

| `fallback` | `isCritical` | Result |
|:-----------|:------------:|:-------|
| `fail` | any | **Throws** — test iteration fails immediately |
| `skip` | `false` | Logs warning, `engine.get()` returns `undefined` |
| `skip` | `true` | **Throws** — `isCritical` overrides `skip` |
| `default` | `false` | Uses `defaultValue` if set; otherwise returns empty string |
| `default` | `true` | **Throws** — `isCritical` overrides `default` |

### 2.6 Using Correlation in Scripts

#### Step 1 — Import and initialise

```javascript
import { CorrelationEngine, RuleProcessor } from '../../../dist/index.js';

const rules = RuleProcessor.loadRules('scrum-suites/my-team/correlation-rules.json');
const engine = new CorrelationEngine(rules);
```

#### Step 2 — Process responses to extract values

```javascript
const csrfRes = http.get('https://api.example.com/auth/csrf-token');
engine.process(csrfRes);  // Runs ALL rules against this response
```

#### Step 3 — Use extracted values in subsequent requests

```javascript
const csrfToken   = engine.get('csrfToken') || 'MISSING';
const bearerToken = engine.get('bearerToken') || 'MISSING';

const loginRes = http.post('https://api.example.com/login',
  JSON.stringify({ username: 'user', password: 'pass' }),
  {
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
      'Authorization': `Bearer ${bearerToken}`,
    }
  }
);
engine.process(loginRes);  // Extract new tokens from login response
```

#### Step 4 — Chain extracted values across transactions

```javascript
// In a later transaction:
const orderId = engine.get('orderId') || 'ORD-UNKNOWN';
http.post('https://api.example.com/checkout',
  JSON.stringify({ orderId, paymentMethod: 'card' }),
  { headers: { 'Authorization': `Bearer ${engine.get('bearerToken')}` } }
);
```

### 2.7 Full Correlated Script Example

See the reference implementation at `scrum-suites/sample-team/tests/correlation-journey.js` which demonstrates:

- CSRF token extraction via `jsonpath`
- Bearer JWT extraction via `jsonpath`
- Session ID extraction via `header` (with graceful `skip` fallback)
- Order ID extraction and chaining via `jsonpath`
- All three fallback modes (`fail`, `skip`, `default`)

### 2.8 Correlation + Parameterisation Together

The most realistic scripts combine both. Parameterised data feeds the request body while correlated values handle server-generated tokens:

```javascript
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';
import { CorrelationEngine, RuleProcessor } from '../../../dist/index.js';
import { initTransactions, startTransaction, endTransaction } from '../../../core-engine/src/utils/transaction.js';
import { logExchange } from '../../../core-engine/src/utils/replayLogger.js';

const users = new SharedArray('users', function () {
  return JSON.parse(open('./data/p_users.json'));
});

const rules = RuleProcessor.loadRules('scrum-suites/my-team/correlation-rules.json');
const engine = new CorrelationEngine(rules);

initTransactions(['t01_login', 't02_add_to_cart']);

export default function () {
  const user = users[(__VU - 1) % users.length];  // Parameterised

  group('t01_login', function () {
    startTransaction('t01_login');

    // Step 1: Get CSRF token
    const csrfRes = http.get('https://api.example.com/auth/csrf');
    engine.process(csrfRes);                       // Correlated

    // Step 2: Login with parameterised credentials + correlated CSRF
    const request_1 = {
      id: "req_1",
      transaction: "t01_login",
      recordingStartedAt: new Date().toISOString(),
      method: "POST",
      url: "https://api.example.com/auth/login",
      body: JSON.stringify({
        username: user.p_username,                 // ← Parameterised
        password: user.p_password,                 // ← Parameterised
      }),
      variableEvents: [],
      params: {
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": engine.get('csrfToken'), // ← Correlated
        },
        tags: { transaction: "t01_login", har_entry_id: "req_1", recording_started_at: "converted" }
      }
    };
    const res_1 = http.post(request_1.url, request_1.body, request_1.params);
    logExchange(request_1, res_1);
    engine.process(res_1);                         // Extract bearerToken
    check(res_1, { 't01_login - 200': (r) => r.status === 200 });

    endTransaction('t01_login');
  });

  sleep(1);

  group('t02_add_to_cart', function () {
    startTransaction('t02_add_to_cart');

    const request_2 = {
      id: "req_2",
      transaction: "t02_add_to_cart",
      recordingStartedAt: new Date().toISOString(),
      method: "POST",
      url: "https://api.example.com/cart/add",
      body: JSON.stringify({ productId: 'PROD-001', qty: 1 }),
      variableEvents: [],
      params: {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${engine.get('bearerToken')}`, // ← Correlated
        },
        tags: { transaction: "t02_add_to_cart", har_entry_id: "req_2", recording_started_at: "converted" }
      }
    };
    const res_2 = http.post(request_2.url, request_2.body, request_2.params);
    logExchange(request_2, res_2);
    engine.process(res_2);                         // Extract orderId
    check(res_2, { 't02_add_to_cart - 200': (r) => r.status === 200 });

    endTransaction('t02_add_to_cart');
  });
}
```

### 2.9 Variable Events (Debug Replay Tracking)

The `variableEvents` array in request definition objects tracks parameterised/correlated substitutions for the debug diff report. Use `createVariableEvent()` from `replayLogger.js`:

```javascript
import { logExchange, createVariableEvent } from '../../../core-engine/src/utils/replayLogger.js';

const csrfToken = engine.get('csrfToken');

const request_1 = {
  // ...
  variableEvents: [
    createVariableEvent('csrfToken', 'correlation', 'extract', csrfToken, 'jsonpath:csrfToken'),
    createVariableEvent('p_username', 'parameterisation', 'substitute', user.p_username, 'csv:p_users.csv'),
  ],
  // ...
};
```

This metadata appears in the HTML diff report under the "Variable Events" panel, making it easy to trace which dynamic values were used per request.

---

## Part 3 — Improvement Recommendations

### 3.1 Critical Gaps (High Priority)

| # | Gap | Current State | Recommendation |
|:--|:----|:--------------|:---------------|
| 1 | **No k6-runtime data integration** | `DataFactory` and `DataPoolManager` are Node-side only. No k6 scripts actually use them. | Create a `k6DataHelper.js` utility that wraps `SharedArray` + `open()` with the same overflow strategies. Scripts import this instead of raw k6 APIs. |
| 2 | **Correlation requires `dist/` build** | Scripts import from `../../../dist/index.js` — requires running `npm run build` first. The correlation engine uses Node `fs` in `RuleProcessor.loadRules()`. | Provide a k6-native `correlationHelper.js` that loads rules via `open()` + `JSON.parse()` and bundles a lightweight extractor engine that runs inside k6's JS runtime. |
| 3 | **No auto-correlation in generated scripts** | `ScriptGenerator` and `ScriptConverter` do not inject `engine.process()` calls. Users must add correlation manually. | Add a `--correlate` flag to `generate` and `convert` commands. When a `correlation-rules.json` exists for the team, auto-inject `engine.process(res_N)` after each HTTP call and replace hardcoded token values with `engine.get()` lookups. |
| 4 | **Parameterisation not wired into convert/generate** | Generated scripts have hardcoded body values from HAR recordings — no data file references. | Add `--parameterise` flag that accepts a mapping file (e.g. `{ "testuser": "p_username", "password123": "p_password" }`) to replace literal values with data-file lookups during generation. |

### 3.2 Functional Improvements (Medium Priority)

| # | Improvement | Detail |
|:--|:-----------|:-------|
| 5 | **Add `xpath` extractor** | For HTML/XML responses (e.g. SOAP APIs, CSRF tokens in `<meta>` or `<input type="hidden">`). Register as `ExtractorRegistry.register('xpath', ...)`. |
| 6 | **Add `boundary` extractor** | LoadRunner-style left-boundary/right-boundary extraction: `{ "extractor": "boundary", "pattern": "lb=csrf_token value=\",rb=\"" }`. Common in legacy app migrations. |
| 7 | **Response-scoped rule filtering** | Currently all rules run against every response. Add optional `applyTo` field to rules: `"applyTo": { "urlPattern": "/auth/*", "transaction": "T01_Login" }` — skip irrelevant rules for better performance and fewer false matches. |
| 8 | **Correlation chaining order** | Rules execute in array order but there's no explicit dependency model. Add optional `dependsOn` field so `orderId` extraction only runs after `bearerToken` is confirmed present. |
| 9 | **DataPoolManager k6 wrapper** | Create `k6DataPool.js` that mirrors `DataPoolManager`'s API but uses k6-native `SharedArray`. Support `registerPool()`, `getRowForVU()`, `getRowForIteration()` with the same three overflow strategies. |
| 10 | **CSV hot-reload for long soak tests** | For soak tests running hours, support re-reading the CSV at configurable intervals so updated data is picked up without restarting k6. |

### 3.3 Developer Experience Improvements (Lower Priority)

| # | Improvement | Detail |
|:--|:-----------|:-------|
| 11 | **`validate` command for correlation rules** | `npm run cli -- validate --rules scrum-suites/my-team/correlation-rules.json` — check schema, detect duplicate names, warn about missing `isCritical` on auth tokens. |
| 12 | **Correlation dry-run** | `npm run cli -- correlate --script <path> --rules <path> --dry-run` — run the script once and print a table showing which rules matched, what was extracted, and what failed. |
| 13 | **Data file scaffolding** | `npm run cli -- init-data <team> --columns p_username,p_password,p_email --rows 10` — generates a CSV with placeholder data using `DynamicValueFactory`. |
| 14 | **Converter auto-parameterisation detection** | When running `convert`, scan request bodies for patterns that look like credentials, emails, and IDs. Flag them in output with `// TODO: parameterise` comments pointing to recommended `p_` column names. |
| 15 | **Debug report variable event visualisation** | The `variableEvents` panel exists but scripts rarely populate it. Auto-populate events in generated/converted scripts when `--correlate` or `--parameterise` flags are used. |

### 3.4 Implementation Priority

```
Phase   What                                        Effort
─────   ──────────────────────────────────          ──────
  1     k6-native correlationHelper.js               Medium
  1     k6-native k6DataPool.js wrapper              Medium
  2     --correlate flag on generate/convert          Large
  2     --parameterise flag on generate/convert       Large
  2     validate command for correlation rules        Small
  3     xpath + boundary extractors                   Medium
  3     Response-scoped rule filtering (applyTo)      Medium
  3     Correlation dry-run CLI                       Medium
  4     Data scaffolding + auto-detection             Small
  4     CSV hot-reload for soak tests                 Large
```

---

## Quick Reference — Naming Conventions

| Prefix | Scope | Example |
|:-------|:------|:--------|
| `p_` | Parameterised data columns | `p_username`, `p_password`, `p_productId` |
| `c_` | Correlated dynamic values | `c_csrfToken`, `c_bearerToken`, `c_sessionId` |
| `txn_` | Transaction timing metrics | `txn_t01_login` (auto-created by `initTransactions`) |
| `req_` | Request entry IDs | `req_1`, `req_2` (auto-assigned by generator/converter) |

## Quick Reference — Data File Locations

```
scrum-suites/
  <team>/
    data/
      p_users.csv              # User credentials
      p_products.json          # Product catalogue
    correlation-rules.json     # Correlation rule definitions
    tests/
      my-journey.js            # Test script (imports data + engine)
    recordings/
      my-flow.har              # Source HAR recording
```
