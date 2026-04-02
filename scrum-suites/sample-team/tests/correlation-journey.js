/**
 * correlation-journey.js
 *
 * SAMPLE TEST: Login → Dashboard → Checkout with Auto-Correlation
 *
 * This script demonstrates the full auto-correlation workflow:
 *   1. T01_Login    → Fetches a CSRF token and performs login.
 *                     The CorrelationEngine extracts `csrfToken`, `bearerToken`,
 *                     and `sessionId` from the responses automatically.
 *
 *   2. T02_Dashboard → Uses the extracted `bearerToken` and `sessionId` in
 *                      headers without any hardcoding.
 *
 *   3. T03_Checkout  → Uses correlated `bearerToken` + `sessionId`, then
 *                      extracts `orderId` from the cart response to feed
 *                      straight into the checkout confirmation request.
 *
 * HOW AUTO-CORRELATION WORKS (summary):
 *   - engine.process(res)  → scans the response body/headers against each rule
 *   - engine.get('name')   → returns the latest extracted value for that rule
 *   - If extraction fails  → FallbackHandler decides to: throw (isCritical),
 *                            use a defaultValue, or skip gracefully.
 *
 * PREREQUISITE:
 *   Build the framework first:  npm run build
 *   Then run this script with:  k6 run scrum-suites/sample-team/tests/correlation-journey.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { CorrelationEngine, RuleProcessor } from '../../../dist/index.js';
import { initTransactions, startTransaction, endTransaction } from '../../../dist/utils/transaction.js';

// ---------------------------------------------------------------------------
// SETUP: Load correlation rules from the team's rules file.
// Rules define WHAT to extract and HOW (regex / jsonpath / header).
// ---------------------------------------------------------------------------
const rules = RuleProcessor.loadRules('scrum-suites/sample-team/correlation-rules.json');
const engine = new CorrelationEngine(rules);

// Register named transactions for LoadRunner-style trend metrics.
initTransactions(['T01_Login', 'T02_Dashboard', 'T03_Checkout']);

// ---------------------------------------------------------------------------
// TEST OPTIONS
// Override with --env flags or a test-plan JSON at runtime.
// ---------------------------------------------------------------------------
export const options = {
    vus: 1,
    duration: '30s',
    thresholds: {
        http_req_failed: ['rate<0.05'],
        http_req_duration: ['p(95)<2000']
    }
};

export default function () {

    // ========================================================================
    // TRANSACTION 1 – Login
    // Goal: Obtain CSRF token, then authenticate to receive a bearer JWT
    //       and a session header. All three are correlated automatically.
    // ========================================================================
    group('T01_Login', function () {
        startTransaction('T01_Login');

        // Step 1a: Fetch CSRF token
        // httpbin mirrors the query-param as a response header, simulating
        // a server that returns a CSRF token on a pre-login endpoint.
        const csrfRes = http.get(
            'https://httpbin.org/response-headers?csrfToken=csrf_abc123def456',
            { headers: { 'Accept': 'application/json' } }
        );

        // engine.process() applies all defined rules to this response.
        // Rule "csrfToken" uses jsonpath extractor → body field "csrfToken".
        // Here the token is in the echoed header body returned by httpbin.
        engine.process(csrfRes);

        check(csrfRes, {
            'T01 – CSRF endpoint returned 200': (r) => r.status === 200
        });

        // Retrieve the correlated CSRF token for use in the login POST.
        const csrfToken = engine.get('csrfToken') || 'MISSING_CSRF';

        // Step 1b: POST login credentials with the correlated CSRF token.
        // httpbin /anything echoes back everything it received so we can check.
        const loginRes = http.post(
            'https://httpbin.org/anything',
            JSON.stringify({ username: 'perfuser', password: 'secret' }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept':        'application/json',
                    'X-CSRF-Token':  csrfToken
                }
            }
        );

        // Process the login response: engine extracts "bearerToken" via jsonpath
        // and "sessionId" via the X-Session-Id header (if present).
        // NOTE: httpbin /anything won't return X-Session-Id, so sessionId will
        // fall through to its "skip" fallback – this is intentional and shows
        // graceful fallback behaviour.
        engine.process(loginRes);

        check(loginRes, {
            'T01 – Login POST returned 200':         (r) => r.status === 200,
            'T01 – CSRF token was forwarded':        (r) => {
                const data = r.json();
                return data?.headers?.['X-Csrf-Token'] === csrfToken;
            }
        });

        endTransaction('T01_Login');
    });

    sleep(1);

    // ========================================================================
    // TRANSACTION 2 – Dashboard
    // Goal: Use the correlated bearerToken and sessionId in subsequent
    //       requests without hardcoding them.
    // ========================================================================
    group('T02_Dashboard', function () {
        startTransaction('T02_Dashboard');

        // Retrieve correlated values from the engine's in-memory store.
        const bearerToken = engine.get('bearerToken') || 'NO_TOKEN';
        const sessionId   = engine.get('sessionId')   || 'NO_SESSION';

        console.log(`[Correlation] Bearer: ${bearerToken}`);
        console.log(`[Correlation] Session: ${sessionId}`);

        // Step 2a: Fetch user profile – passes correlated auth headers.
        const profileRes = http.get(
            'https://httpbin.org/get',
            {
                headers: {
                    'Authorization': `Bearer ${bearerToken}`,
                    'X-Session-Id':  sessionId,
                    'Accept':        'application/json'
                }
            }
        );

        check(profileRes, {
            'T02 – Profile GET returned 200': (r) => r.status === 200,
            'T02 – Authorization header was sent': (r) => {
                const data = r.json();
                return data?.headers?.['Authorization']?.startsWith('Bearer');
            }
        });

        // Step 2b: Fetch product listing.
        const productsRes = http.get(
            'https://httpbin.org/get?category=electronics&limit=10',
            {
                headers: {
                    'Authorization': `Bearer ${bearerToken}`,
                    'Accept':        'application/json'
                }
            }
        );

        check(productsRes, {
            'T02 – Products GET returned 200': (r) => r.status === 200
        });

        endTransaction('T02_Dashboard');
    });

    sleep(1);

    // ========================================================================
    // TRANSACTION 3 – Checkout
    // Goal: Add an item to the cart, correlate the returned orderId,
    //       then pass it directly into the checkout confirmation request.
    //       This is the "chained-token" pattern – the most powerful use case.
    // ========================================================================
    group('T03_Checkout', function () {
        startTransaction('T03_Checkout');

        const bearerToken = engine.get('bearerToken') || 'NO_TOKEN';
        const sessionId   = engine.get('sessionId')   || 'NO_SESSION';

        // Step 3a: Add item to cart.
        // httpbin /anything echoes our body back so the orderId jsonpath rule
        // will find "orderId" in the echoed JSON response body automatically.
        const cartRes = http.post(
            'https://httpbin.org/anything',
            JSON.stringify({ orderId: 'ORD-9982', productId: 'prod_001', qty: 1 }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${bearerToken}`,
                    'X-Session-Id':  sessionId,
                    'Accept':        'application/json'
                }
            }
        );

        // engine.process() will now apply the "orderId" jsonpath rule.
        // It finds "json.orderId" in the httpbin echo response and stores it.
        engine.process(cartRes);

        check(cartRes, {
            'T03 – Cart POST returned 200': (r) => r.status === 200
        });

        // Retrieve the correlated orderId – no hardcoding!
        const orderId = engine.get('orderId') || 'ORD-UNKNOWN';
        console.log(`[Correlation] Extracted orderId: ${orderId}`);

        // Step 3b: Confirm checkout using the correlated orderId.
        const checkoutRes = http.post(
            'https://httpbin.org/anything',
            JSON.stringify({ orderId: orderId, paymentMethod: 'card' }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${bearerToken}`,
                    'X-Session-Id':  sessionId,
                    'Accept':        'application/json'
                }
            }
        );

        check(checkoutRes, {
            'T03 – Checkout POST returned 200': (r) => r.status === 200,
            'T03 – Correlated orderId was forwarded': (r) => {
                const data = r.json();
                return data?.json?.orderId === orderId;
            }
        });

        endTransaction('T03_Checkout');
    });

    sleep(1);
}
