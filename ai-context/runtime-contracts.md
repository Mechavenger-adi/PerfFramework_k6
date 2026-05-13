# Runtime Contracts

> Contracts governing k6-side runtime behavior (code that runs inside k6's goja engine).

## k6-Side Files

| File | Purpose | Compiled To |
|------|---------|-------------|
| `core-engine/src/utils/transaction.ts` | Transaction Trend + Counter metrics | `dist/utils/transaction.js` |
| `core-engine/src/utils/replayLogger.ts` | Replay log emission + variable tracking | `dist/utils/replayLogger.js` |
| `core-engine/src/utils/session.ts` | Cookie jar management | `dist/utils/session.js` |
| `core-engine/src/utils/lifecycle.ts` | VU lifecycle orchestration | `dist/utils/lifecycle.js` |

## Transaction Metrics Contract

`initTransactions(names: string[])`: Creates a `Trend` and `Counter` for each name.
`startTransaction(name)`: Records start timestamp, increments `<name>_count` Counter.
`endTransaction(name)`: Calculates duration, adds to `<name>` Trend.

**Naming:** Transaction name used directly as metric name. No prefix.

## Lifecycle Store Contract

`createJourneyLifecycleStore()` returns:
```
{
  ctx: { data: {}, correlation: {}, ... },
  state: { initialized: false, terminated: false, iteration: 0 }
}
```

`runJourneyLifecycle(store, { initPhase, actionPhase, endPhase })`:
- First call → `initPhase(ctx)` once
- Every call → `actionPhase(ctx)` unless terminated
- End signal → `endPhase(ctx)` once

## Think Time Contract

`getFrameworkThinkTime()` reads from `K6_PERF_RUNTIME_METADATA` env:
- `mode: 'fixed'` → returns `fixed` value (default 1s)
- `mode: 'random'` → returns random in `[min, max]` (default 0.5–3s)

Called as `sleep(getFrameworkThinkTime())` between transaction groups.

## Phase Envelope Contract

`K6_PERF_PHASES` env var contains JSON:
```typescript
{
  mode: 'ramping-vus' | 'per-vu-iterations' | 'shared-iterations';
  stages?: Array<{ duration: number; target: number }>;   // seconds
  totalDuration?: number;
  iterations?: number;
  vus?: number;
}
```

## Error Behavior Contract

Read from `K6_PERF_RUNTIME_METADATA`:
- `continue` → log error, proceed with next iteration
- `stop_iteration` → skip remaining phases for current iteration
- `stop_vu` → set `state.terminated = true`, VU sleeps forever
- `abort_test` → re-throw error, k6 terminates on uncaught exception

## Replay Log Emission Contract

`logExchange(requestDef, response)`:
- Gated by `__ENV.K6_PERF_DEBUG === 'true'`
- Outputs JSON prefixed with `[k6-perf][replay-log]`
- Includes: harEntryId, transaction, iteration, VU, request/response, duration, variableEvents
- Binary bodies replaced with `[binary: content-type]` placeholder

## Session Contract

`registerBaseUrl(url)`: Adds URL to `_registeredUrls` Set.
`clearCookies(...urls)`: Clears cookie jar for given URLs or all registered URLs.
`deleteCookie(url, name)`: Removes specific named cookie.

Generated/converted scripts call `registerBaseUrl()` at module init and `clearCookies()` in `initPhase()`.
