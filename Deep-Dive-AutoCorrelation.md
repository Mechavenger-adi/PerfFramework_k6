# 🔬 Deep-Dive: Anatomy of a Correlated Request

This document provides a line-by-line breakdown of how a static request recorded inside a HAR file transforms into a **dynamic, fully-correlated k6 request execution**.

We will use the specific example from `scrum-suites/sample-team/tests/correlation-journey.js`:
```javascript
const csrfToken = engine.get('csrfToken') || 'MISSING_CSRF';
```

---

## 🛰️ 1. The Raw Recording (Inside the `.har` file)

When you capture network traffic with Chrome DevTools, the server passes a token, and the browser sends it back on the next execution. Inside `sample-login-flow.har`, it looks like this:

### Step 1a: The server response
```json
"url": "https://api.example.com/auth/csrf-token",
"response": {
    "status": 200,
    "content": {
        "text": "{\"csrfToken\": \"csrf_abc123def456\"}"
    }
}
```

### Step 1b: The subsequent client POST (The follow-up)
```json
"url": "https://api.example.com/auth/login",
"method": "POST",
"request": {
    "headers": [
        { "name": "Content-Type", "value": "application/json" },
        { "name": "X-CSRF-Token", "value": "csrf_abc123def456" }  // <--- HARDCODED
    ]
}
```

---

## 📄 2. The Generated Script (Phase 2A Output)

When the framework CLI parses that HAR, it generates a **static reproduction skeleton**. It doesn't know what that token means yet, so it generates:

```javascript
group('T01_Login', function () {
    // 1. Fetch CSRF (Yields static structure)
    let csrfRes = http.get('.../auth/csrf-token');

    // 2. Submit Login (Uses hardcoded value from the HAR execution)
    let loginRes = http.post('.../auth/login', payload, {
        headers: {
            'X-CSRF-Token': 'csrf_abc123def456' // 🚨 DANGER: Expired string triggers iteration failures!
        }
    });
});
```

---

## 🧠 3. The Correlated Script (Phase 2B Manual Transformation)

To make it live, we connect the `CorrelationEngine` rule definitions backwards. Here is exactly what is happening in the final execution block:

| Step | Code execution | What is happening inside the RAM engine |
|:-----|:---------------|:---------------------------------------|
| **1. Fetch** | `const csrfRes = http.get('...')` | Executes the HTTP request normally. |
| **2. Extract** | `engine.process(csrfRes)` | Runs rule `"csrfToken"` against response. JSONPath `csrfToken` is extracted. Cache now holds: `{"csrfToken": "csrf_xyz_NEW_999"}` |
| **3. Retrieve** | `const csrfToken = engine.get('csrfToken')` | Fetches the latest live token out of the engine lookup dictionary. |
| **4. Inject** | `'X-CSRF-Token': csrfToken` | Passes the live string into the HTTP Header setup. |

---

## 🔍 Line Breakdown Comparison

### The specific comparison nodes:

#### ❌ Static Header (Old CLI output)
```javascript
headers: {
    'X-CSRF-Token': 'csrf_abc123def456'
}
```
*   **What it is**: A hardcoded string literal.
*   **Where it came from**: The historical record of when you clicked "Record" 3 weeks ago.
*   **Result**: 401 Unauthorized during next week's load test execution.

---

#### ✅ Dynamic Injection (Correlated script)
```javascript
headers: {
    'X-CSRF-Token': csrfToken // <-- Variable holds `csrf_xyz_NEW_999`
}
```
*   **What it is**: A pointer reference holding variables memory cache.
*   **Where it came from**: Extracts straight from the *very first* fetch response block preceding it natively.
*   **Result**: 200 OK because the token is fetched live for **every single Virtual User (VU) iteration** securely.

---

### ⚠️ The Fallback Trigger: `|| 'MISSING_CSRF'`

The full line has a saftey net included:
```javascript
const csrfToken = engine.get('csrfToken') || 'MISSING_CSRF';
```
If the extractor failed (e.g., the server was down and returned a blank response body), `engine.get()` returns `undefined`. 
The `||` operator ensures the script proceeds with `"MISSING_CSRF"` rather than passing an empty object into the header dictionary, making **debugging missing keys 10x easier inside execution logs**.
