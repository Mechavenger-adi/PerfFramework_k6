# Design Proposals

> Approved architectural proposals awaiting implementation.
> AI agents MUST read this file before modifying related subsystems.

---

## Proposal 1: `transaction()` Wrapper — Group-Level Error Boundaries

**Status:** ✅ Approved — pending implementation
**Affects:** `transaction.ts`, `lifecycle.ts`, `ScriptGenerator.ts`, `ScriptConverter.ts`

### Problem
Error behavior (`continue`, `stop_iteration`, `stop_vu`, `abort_test`) currently only applies at the **phase level**. If the 3rd API inside a transaction fails, the entire remaining phase is skipped — even for `"continue"`. Transaction metrics are also lost because `endTransaction()` never fires.

### Solution
A single `transaction(name, fn)` function that wraps `group()` + `startTransaction()` + `endTransaction()` + error handling.

**Backend implementation:**
```typescript
export function transaction(name: string, fn: () => void): void {
  group(name, () => {
    startTransaction(name);
    try {
      fn();
    } catch (error) {
      applyErrorBehavior(error, name);
    } finally {
      endTransaction(name);  // ALWAYS runs — metrics never lost
    }
  });
}
```

**`applyErrorBehavior` logic:**

| Behavior | Action |
|---|---|
| `continue` | Log error → return (next transaction runs) |
| `stop_iteration` | Log error → re-throw (runSafely catches → skip iteration) |
| `stop_vu` | Log error → set terminated → re-throw |
| `abort_test` | `exec.test.abort()` immediately |

### Script pattern change

**Before (current — 3 calls per group):**
```javascript
group('search_animal', function () {
  startTransaction('search_animal');
  // requests...
  endTransaction('search_animal');
});
```

**After (1 call per group):**
```javascript
transaction('search_animal', function () {
  // requests...
});
```

### Backward Compatibility
- Old scripts using `group()` + `startTransaction()` + `endTransaction()` continue to work
- They just don't get per-group error handling (errors propagate to phase-level as before)

---

## Proposal 2: Unified `request()` Function — All-in-One HTTP Execution

**Status:** ✅ Approved — pending implementation  
**Affects:** New `request.ts` utility, `ScriptGenerator.ts`, `ScriptConverter.ts`

### Problem
Every single HTTP request in the script currently requires **4 separate steps**:

```javascript
// Step 1: Build request definition object (10+ lines)
const request_1 = {
  id: "req_1",
  transaction: "search_animal",
  recordingStartedAt: new Date().toISOString(),
  method: "GET",
  url: `${env.baseUrl}/action/Catalog.action`,
  body: null,
  params: {
    headers: { "accept": "text/html" },
    cookies: {},
    redirects: 0,
    tags: { transaction: "search_animal", har_entry_id: "req_1" }
  }
};

// Step 2: Execute HTTP call
const res_1 = http.get(request_1.url, request_1.params);

// Step 3: Log exchange for debug replay
logExchange(request_1, res_1);

// Step 4: Check response
check(res_1, { "status equals 200": (r) => r.status === 200 });
```

**Issues:**
- ~15 lines per request × 50 requests = 750 lines of boilerplate
- Low readability — hard to see what the test actually does
- `logExchange` must be manually called (easy to forget)
- No VU/iteration context in error messages
- Snapshot capture is separate from the request flow

### Solution
A unified `request()` function that handles everything in a single call.

**Proposed API:**
```javascript
// Simple GET — 1 line instead of 15
const res = request("GET", `${env.baseUrl}/action/Catalog.action`, {
  name: "req_1",
  check: { status: 200 }
});

// POST with body and headers
const res = request("POST", `${env.baseUrl}/auth/login`, {
  name: "req_2",
  body: JSON.stringify({ username: user.p_username, password: user.p_password }),
  headers: { "Content-Type": "application/json" },
  check: { status: 200 }
});

// Full options (when needed)
const res = request("GET", `${env.baseUrl}/products?q=${query}`, {
  name: "req_3",
  headers: { "Authorization": `Bearer ${token}` },
  cookies: { sessionId: sid },
  check: { status: 200 },
  redirects: 5
});
```

### What `request()` does internally (all auto-handled):

```
request("GET", url, options)
  │
  ├─ 1. Build request definition object (id, transaction, tags, etc.)
  │     → Transaction name auto-detected from active transaction()
  │
  ├─ 2. Execute HTTP call (http.get/post/put/patch/del)
  │
  ├─ 3. If debugMode=true → logExchange(reqDef, response) automatically
  │
  ├─ 4. If check option provided → run check() assertions
  │     → On failure: capture snapshot if configured
  │     → On failure: log VU ID + iteration + transaction + request name
  │
  ├─ 5. Return response object for correlation/further use
  │
  └─ Done
```

### Script comparison — Full transaction

**Before (current):**
```javascript
group('search_animal', function () {
  startTransaction('search_animal');

  const request_1 = {
    id: "req_1",
    transaction: "search_animal",
    recordingStartedAt: new Date().toISOString(),
    method: "GET",
    url: `${env.baseUrl}/action/Catalog.action?viewCategory=&categoryId=FISH`,
    body: null,
    params: {
      headers: { "accept": "text/html" },
      cookies: {},
      redirects: 0,
      tags: { transaction: "search_animal", har_entry_id: "req_1" }
    }
  };
  const res_1 = http.get(request_1.url, request_1.params);
  logExchange(request_1, res_1);
  check(res_1, { "search_animal - status is 200": (r) => r.status === 200 });

  const request_2 = {
    id: "req_2",
    transaction: "search_animal",
    recordingStartedAt: new Date().toISOString(),
    method: "GET",
    url: `${env.baseUrl}/action/Catalog.action?productId=FI-SW-01`,
    body: null,
    params: {
      headers: { "accept": "text/html" },
      cookies: {},
      redirects: 0,
      tags: { transaction: "search_animal", har_entry_id: "req_2" }
    }
  };
  const res_2 = http.get(request_2.url, request_2.params);
  logExchange(request_2, res_2);
  check(res_2, { "search_animal - status is 200": (r) => r.status === 200 });

  endTransaction('search_animal');
});
```

**After (proposed):**
```javascript
transaction('search_animal', function () {
  const res1 = request("GET", `${env.baseUrl}/action/Catalog.action?viewCategory=&categoryId=FISH`, {
    check: { status: 200 }
  });

  const res2 = request("GET", `${env.baseUrl}/action/Catalog.action?productId=FI-SW-01`, {
    check: { status: 200 }
  });
});
```

**~35 lines → 8 lines** (77% reduction) with zero loss of functionality.

### `request()` function signature:

```typescript
interface RequestOptions {
  name?: string;            // auto-generated if not provided (req_1, req_2...)
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: string | object;   // auto JSON.stringify if object
  check?: {
    status?: number;        // shorthand: check status code
    body?: string;          // shorthand: check body contains string
    custom?: Record<string, (r: Response) => boolean>;  // full check()
  };
  redirects?: number;       // default: 0
}

export function request(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  options?: RequestOptions
): Response;
```

### Auto-handled features:

| Feature | How |
|---|---|
| **Debug logging** | If `debugMode=true` in runtime → `logExchange()` called automatically |
| **Snapshot capture** | If check fails + `captureSnapshotOnFailure=true` → snapshot auto-captured |
| **VU/Iteration tracking** | Error messages include `VU #${exec.vu.idInInstance}, Iteration #${exec.vu.iterationInScenario}` |
| **Transaction tagging** | Tags auto-populated from the active `transaction()` wrapper |
| **Request numbering** | Sequential `req_N` IDs auto-generated per transaction |
| **Correlation** | Response returned for `response.body`, `response.headers` extraction |

### Impact on Generator/Converter
- `ScriptGenerator.ts`: Emit `request()` calls instead of request definition + http call + logExchange + check
- `ScriptConverter.ts`: Recognize the old pattern and collapse it into `request()` calls
- Import line changes: `import { request } from '../../../dist/utils/request.js';`

---

## Combined Effect: Complete Script Transformation

### Before (current framework output):
```javascript
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { initTransactions, startTransaction, endTransaction } from '../../../dist/utils/transaction.js';
import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';
import { logExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';
import { clearCookies, registerBaseUrl, getEnvContext } from '../../../dist/utils/session.js';

const env = getEnvContext('Jpet_new', 'https://jpetstore.aspectran.com');
registerBaseUrl(env.baseUrl);

initTransactions(["t01_launch", "t02_login", "search_animal"]);
const __journeyLifecycleStore = createJourneyLifecycleStore();

export function actionPhase(ctx) {
  group('t01_launch', function () {
    startTransaction('t01_launch');
    const request_1 = { id: "req_1", ... 12 more lines ... };
    const res_1 = http.get(request_1.url, request_1.params);
    logExchange(request_1, res_1);
    check(res_1, { "status 200": (r) => r.status === 200 });
    endTransaction('t01_launch');
  });

  thinktime();

  group('search_animal', function () {
    startTransaction('search_animal');
    const request_1 = { id: "req_2", ... 12 more lines ... };
    const res_1 = http.get(request_1.url, request_1.params);
    logExchange(request_1, res_1);
    check(res_1, { "status 200": (r) => r.status === 200 });
    const request_2 = { id: "req_3", ... 12 more lines ... };
    const res_2 = http.get(request_2.url, request_2.params);
    logExchange(request_2, res_2);
    check(res_2, { "status 200": (r) => r.status === 200 });
    endTransaction('search_animal');
  });
}
```

### After (both proposals implemented):
```javascript
import { transaction, thinktime, request } from '../../../dist/k6-perf.js';
import { getEnvContext } from '../../../dist/utils/session.js';

const env = getEnvContext('Jpet_new', 'https://jpetstore.aspectran.com');

export function actionPhase(ctx) {
  transaction('t01_launch', function () {
    request("GET", `${env.baseUrl}/`, { check: { status: 200 } });
  });

  thinktime();

  transaction('search_animal', function () {
    request("GET", `${env.baseUrl}/action/Catalog.action?categoryId=FISH`, { check: { status: 200 } });
    request("GET", `${env.baseUrl}/action/Catalog.action?productId=FI-SW-01`, { check: { status: 200 } });
  });
}
```

**~60+ lines → ~15 lines.** Clean, readable, and all error handling + debug logging + snapshot capture happens automatically at the backend.
