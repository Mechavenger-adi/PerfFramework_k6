# AI Workflow

> How to work effectively with this repository as an AI agent.

## First Steps (Every Session)

1. Read `ai_context/overview.md` — understand scope and loading strategy
2. Read `ai_context/architecture-laws.md` — know the inviolable rules
3. Identify which subsystem your task touches → load only those context files
4. Check `ai_context/decisions.md` + `rejected-approaches.md` before proposing solutions
5. Read and update `ai_context/todos.md` to track task completion and maintain the backlog.

## File Reading Priority

```
High: overview.md → architecture-laws.md → module-map.md
Med:  execution-flow.md → change-impact-map.md → fragile-areas.md → todos.md
Low:  All other files (load on-demand per task)
```

## Common Task Patterns

### Adding a New Feature
1. `integration-checklist.md` — follow step by step
2. `extension-points.md` — find where to plug in
3. `dependency-rules.md` — verify import direction
4. `change-impact-map.md` — identify blast radius

### Fixing a Bug
1. `module-map.md` — find the right file
2. `fragile-areas.md` — check if this area has known gotchas
3. `decisions.md` — understand why the current approach was chosen
4. `rejected-approaches.md` — don't re-introduce a known-bad fix

### Refactoring
1. `subsystem-boundaries.md` — understand ownership
2. `dependency-hotspots.md` — know which modules are most coupled
3. `architecture-evolution.md` — understand trajectory
4. `risk-zones.md` — identify areas requiring extra caution

### Understanding the Codebase
1. `overview.md` → `framework-philosophy.md` → `execution-flow.md`
2. `orchestration-map.md` for CLI→engine→k6 flow
3. `runtime-contracts.md` for k6-side behavior
4. `reporting-contracts.md` for artifact pipeline

## After Making Changes

1. Run `npm exec tsc -- --noEmit` to verify TypeScript
2. Update `AGENT-CONTEXT.md` change log (mandatory)
3. Update affected `ai_context/` files if architecture changed
4. Test manually: existing CLI commands + new feature

## Token-Saving Tips

- Don't read AGENT-CONTEXT.md (1841 lines). Use ai_context/ files instead.
- Don't read graph.html. Use dependency-rules.md instead.
- Don't read all markdown files. Use module-map.md to find what you need.
- Load subsystem files only when working on that subsystem.
