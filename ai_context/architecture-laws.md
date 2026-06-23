# Architecture Laws

> **Inviolable rules.** Any AI agent or contributor MUST obey these. Violations risk breaking the framework's core guarantees.

## L1 — Dependency Direction

Dependencies flow **downward only**:

```
CLI → Config, Scenario, Execution, Recording, Debug, Reporting
Config → Types, Utils
Scenario → Types, Config, Utils
Execution → Scenario, Config, Runtime, Assertions, Reporting, Reporters, Utils
Runtime → Types, Utils
Data → Types, Utils
Recording → Types, Correlation, Utils
Assertions → Types, Config
Correlation → Types
Debug → Recording, Runtime, Utils, Types
Reporters → Types
Reporting → Types, Runtime, Assertions, Utils
Utils → Types
```

**Violations:** Types and Utils MUST NOT import from any other layer. Recording MUST NOT import from Execution. Debug MUST NOT import from CLI.

## L2 — No Silent Coupling

Every dependency between layers MUST be visible through explicit imports. Do NOT:
- Share state through global variables
- Communicate between layers via filesystem side effects without documented contracts
- Use `process.env` as a hidden communication channel (except `K6_PERF_*` vars documented in runtime-contracts.md)

## L3 — Configuration Merge Precedence (Immutable)

```
FRAMEWORK_DEFAULTS → environment JSON → runtime JSON → suite config → CLI overrides → .env secrets
```

Later layers override earlier layers. Arrays are **replaced wholesale**, not merged.

## L4 — k6-Side vs Node-Side Boundary

Files in `core_engine/src/utils/` that run inside k6's goja runtime:
- `transaction.ts`, `replayLogger.ts`, `session.ts`, `lifecycle.ts`

These files MUST NOT import Node.js modules (`fs`, `path`, `child_process`, etc.). They compile to `dist/utils/*.js` and are loaded by k6 scripts via relative `import` from `dist/`.

All other files run in Node.js context (CLI, config, reporting, etc.).

## L5 — Replay Log Contract

Debug replay depends on `[k6-perf][replay-log]` JSON markers in k6 stdout. Any change to:
- `replayLogger.ts` output format
- `ReplayRunner.ts` extraction regex
- `ExchangeLog.ts` entry schema

MUST be synchronized across all three files.

## L6 — Artifact Schema Stability

Machine-readable artifacts (`ci-summary.json`, `transaction-metrics.json`, `errors.ndjson`, `warnings.ndjson`, `timeseries.json`, `run-manifest.json`) have implicit consumers (CI pipelines, dashboards). Schema changes MUST be backward-compatible or versioned.

## L7 — Transaction Metric Naming

Transaction names are used **directly** as k6 Trend metric names (e.g., `new Trend('Homepage')`). No `txn_` prefix. Changing this convention breaks ThresholdManager, TransactionMetricsBuilder, and all existing scripts.

## L8 — Cookie Persistence Default

`noCookiesReset: true` is the framework default (LoadRunner behavior). Changing this to `false` would break multi-iteration flows that depend on session continuity (e.g., login → browse → checkout).

## L9 — Phase-Based Script Contract

Generated/converted scripts export `initPhase(ctx)`, `actionPhase(ctx)`, `endPhase(ctx)`, and a compatibility `default` function. The `default` function delegates to `runJourneyLifecycle()`. This contract MUST be preserved for backward compatibility.

## L10 — Non-Regression Rule

Any change MUST preserve:
- Existing CLI commands working
- Existing non-lifecycle test execution working
- Existing debug replay working
- New lifecycle path working
- Reporting artifacts being generated correctly
