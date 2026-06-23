# K6-PerfFramework — AI Context Overview

> **Purpose:** Entry point for AI agents. Read this first, then load only the subsystem files relevant to your task.

## What This Is

Enterprise k6 performance testing framework with LoadRunner-style lifecycle (`initPhase`/`actionPhase`/`endPhase`), HAR-to-script generation, debug replay diffing, configuration-driven execution, artifact-first reporting, and multi-team suite support.

## Quick Stats

| Metric | Value |
|--------|-------|
| Package | `@k6-perf/core_engine` v1.0.0 |
| Runtime | Node 22+, k6 (latest), TypeScript → CommonJS |
| Layers | 15 (CLI, Config, Schemas, Types, Scenario, Execution, Runtime, Data, Recording, Correlation, Assertions, Debug, Reporters, Reporting, Utils) |
| Source files | ~75 TypeScript files across `core_engine/src/` |
| Phase completion | Phase 1-3 complete, Phase 4 (AI/Analytics) not started |
| Test coverage | No unit/integration tests exist |

## AI Loading Strategy

```
overview.md          → Always read first
module-map.md        → File-level routing table
execution-flow.md    → How code runs
architecture-laws.md → What you MUST NOT violate
```

Then load subsystem-specific files only when needed:
- Editing config? → `dependency-rules.md`
- Touching reporting? → `reporting-contracts.md`
- Working on debug? → `replay-debug-contracts.md`
- Adding features? → `extension-points.md` + `integration-checklist.md`

## Primary Entry Points

| Path | Purpose |
|------|---------|
| `core_engine/src/cli/run.ts` | Main CLI — all commands registered here |
| `core_engine/src/index.ts` | Barrel export — public API surface |
| `config/test_plans/*.json` | Test execution shape |
| `config/runtime_settings/default.json` | Runtime behavior defaults |
| `config/schemas/*.schema.json` | JSON Schema (SSoT for validation + IDE) |

## File Index

| AI Context File | When To Load |
|-----------------|-------------|
| [architecture-laws.md](architecture-laws.md) | Before ANY code change |
| [framework-philosophy.md](framework-philosophy.md) | Understanding design rationale |
| [dependency-rules.md](dependency-rules.md) | Adding/changing imports |
| [integration-checklist.md](integration-checklist.md) | Adding new features |
| [execution-flow.md](execution-flow.md) | Understanding runtime behavior |
| [module-map.md](module-map.md) | Finding the right file to edit |
| [change-impact-map.md](change-impact-map.md) | Assessing change blast radius |
| [fragile-areas.md](fragile-areas.md) | Areas requiring extra care |
| [decisions.md](decisions.md) | Understanding past architectural choices |
| [rejected-approaches.md](rejected-approaches.md) | Approaches already tried and abandoned |
| [ai-workflow.md](ai-workflow.md) | How to work with this repo as an AI |
| [prompt-templates.md](prompt-templates.md) | Reusable prompt patterns |
| [token-optimization-guide.md](token-optimization-guide.md) | Minimizing context usage |
| [architecture-evolution.md](architecture-evolution.md) | Historical progression |
| [integration-contracts.md](integration-contracts.md) | Cross-layer API contracts |
| [extension-points.md](extension-points.md) | Where new features plug in |
| [known-tech-debt.md](known-tech-debt.md) | Known shortcuts and gaps |
| [dependency-hotspots.md](dependency-hotspots.md) | High-coupling modules |
| [orchestration-map.md](orchestration-map.md) | CLI → engine → k6 wiring |
| [runtime-contracts.md](runtime-contracts.md) | k6-side runtime behavior |
| [reporting-contracts.md](reporting-contracts.md) | Artifact schemas and report pipeline |
| [replay-debug-contracts.md](replay-debug-contracts.md) | Debug replay system |
| [subsystem-boundaries.md](subsystem-boundaries.md) | Layer ownership rules |
| [risk-zones.md](risk-zones.md) | Areas with hidden complexity |
