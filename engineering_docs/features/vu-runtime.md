---
title: k6-side VU Runtime Helpers — Mini EDD
layer: L2
owns: vu-runtime
sources: [core_engine/src/utils/**, core_engine/src/runtime/**]
related: [runtime-contracts, risk-zones, fragile-areas]
updated: 2026-07-09
---

# k6-side VU Runtime Helpers (Mini-EDD)

**Purpose.** The VU-safe API a journey script imports (via `index.ts`): session/URL resolution, cookie
jar control, correlation extractors, per-VU auto headers, and runtime data writing. **All compile to
`dist/utils/` and run inside k6's goja engine — no Node built-ins (RZ1).**

**Owning files.** `session.ts`, `extract.ts`, `autoHeaders.ts`, `dataWriter.ts` (+ `transaction.ts`,
`replayLogger.ts` covered in [EDD-lifecycle](../edd/EDD-lifecycle.md)/[EDD-debug-replay](../edd/EDD-debug-replay.md)); `runtime/MetricsRuntime.ts`, `runtime/ErrorRuntime.ts`.

**Entry point + condensed runtime flow (§4A).**
- Session: `getEnvContext` [session.ts:61](../../core_engine/src/utils/session.ts#L61), `registerBaseUrl` [:144](../../core_engine/src/utils/session.ts#L144), `resolveFrameworkUrl` [:219](../../core_engine/src/utils/session.ts#L219), `clearCookies`/`deleteCookie` [:268-286](../../core_engine/src/utils/session.ts#L268).
- Extractors (emitted by auto-correlation): `extractJson` [extract.ts:79](../../core_engine/src/utils/extract.ts#L79), `extractRegex` [:108](../../core_engine/src/utils/extract.ts#L108), `extractHeader` [:135](../../core_engine/src/utils/extract.ts#L135), `extractCookie` [:177](../../core_engine/src/utils/extract.ts#L177), `extractBoundary` [:220](../../core_engine/src/utils/extract.ts#L220). All null-safe (return `null` on miss).
- Auto headers: `addAutoHeader`/`addHeaderOnce`/`mergeRequestHeaders` applied per request ([autoHeaders.ts:28-77](../../core_engine/src/utils/autoHeaders.ts#L28)).
- Data writer: `writeData(file, data, opts)` emits a tagged line for runner-side `FileWriteSink` ([dataWriter.ts:44](../../core_engine/src/utils/dataWriter.ts#L44)).

**Key types.** `ExtractableResponse`, `TeamEnvironmentOverride`, `WriteDataOptions`.

**Configuration + env influence.** `K6_PERF_ENVIRONMENT`, `K6_PERF_TEAM_ENVIRONMENTS` (session/env
resolution); cookie behavior via `noCookiesReset` (framework default true, F7).

**Extension points.** New extractor in `extract.ts` (auto-correlation emits it); new auto-header helper.

**Known limitations.** Extractors return `null` (not throw) on miss — dependent checks must handle it.
Cookie persistence default differs from k6's (F7).

**Risks.** RZ1 (k6/Node boundary — rebuild `dist/` after edits), RZ8 (checkless transactions), F7 (cookie jar).

**Tests to run.** Manual: multi-iteration flow (≥3) for cookies; correlated script replay.

**Related.** [[runtime-contracts]], [[EDD-lifecycle]], [[EDD-auto-correlation]].
