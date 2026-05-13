# Dependency Hotspots

> Modules with highest coupling — changes here have the widest blast radius.

## Hotspot Ranking (by edge count in/out)

| Module | In-Edges | Out-Edges | Total | Risk Level |
|--------|----------|-----------|-------|------------|
| **CLI (run.ts)** | 0 | 7 | 7 | 🔴 Orchestrator — touches every layer |
| **Utils** | 9 | 1 | 10 | 🔴 Universal dependency — breaking changes cascade everywhere |
| **Types** | 10 | 0 | 10 | 🔴 Leaf node but consumed by all — interface changes break everything |
| **Config** | 4 | 2 | 6 | 🟡 Central config — schema changes propagate widely |
| **Execution** | 1 | 7 | 8 | 🟡 High outgoing — depends on many layers |
| **Scenario** | 2 | 3 | 5 | 🟡 |
| **Reporting** | 2 | 4 | 6 | 🟡 |
| **Debug** | 1 | 4 | 5 | 🟢 |
| **Recording** | 2 | 3 | 5 | 🟢 |
| **Runtime** | 3 | 2 | 5 | 🟢 |
| **Assertions** | 3 | 2 | 5 | 🟢 |
| **Correlation** | 2 | 1 | 3 | 🟢 Relatively isolated |
| **Data** | 0 | 2 | 2 | 🟢 Most isolated layer |
| **Reporters** | 1 | 1 | 2 | 🟢 Stub layer |

## Critical Paths

### Config → Everything
`ConfigContracts.ts` and `TestPlanSchema.ts` are imported by virtually every layer. A type change here requires a full audit.

### Utils → k6-Side Chain
`transaction.ts` → `replayLogger.ts` → `session.ts` → `lifecycle.ts` form a chain of k6-side dependencies. Breaking one file's export signature breaks downstream scripts.

### run.ts → Full Pipeline
`run.ts` is the main orchestrator. It imports from Config, Scenario, Execution, Recording, Debug, Reporting, and Utils. It's the single largest file outside HTMLDiffReporter.

## Files by Size (complexity indicator)

| File | Size | Notes |
|------|------|-------|
| `HTMLDiffReporter.ts` | 87KB | Largest — self-contained HTML/CSS/JS |
| `ScriptConverter.ts` | 39KB | Complex regex-based transformation |
| `run.ts` | 35KB | Main orchestrator |
| `DiffChecker.ts` | 21KB | Comparison algorithms |
| `RunReportGenerator.ts` | 21KB | Unified HTML report |
| `ReplayRunner.ts` | 16KB | Debug workflow |
| `replayLogger.ts` | 14KB | k6-side logging |
| `test-plan.schema.json` | 13KB | Schema complexity |
| `ScenarioBuilder.ts` | 12KB | Scenario construction |
| `lifecycle.ts` | 11KB | k6-side lifecycle orchestration |
