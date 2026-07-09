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

## After Making Changes — Documentation Sync (MANDATORY)

Docs are source code; outdated docs are bugs. Every code change must sync the knowledge system
in the **same** change:

1. `npm exec tsc -- --noEmit` — TypeScript passes
2. `npm run docs:index` — regenerate L4 indexes (`ai_generated/*.json`) + `FrameworkAtlas.md` tables
3. If the touched files map to an EDD/mini-EDD (see table below), update it — including the §4A
   reverse-engineering rows with fresh `file:line` citations
4. `npm run docs:check` — must exit clean (regenerate + `git diff --exit-code`); a non-empty diff
   means the committed indexes are stale
5. Bump `updated:` front-matter on any hand-edited L1/L2 doc
6. Test manually: existing CLI commands + new feature

### Change → docs mapping

| You changed | You must touch |
|-------------|----------------|
| `core_engine/src/**/*.ts` | `npm run docs:index`; if a full-EDD subsystem → its EDD §4A; else the feature's mini-EDD |
| `core_engine/src/cli/**` (new command) | `module-map.md`; `docs/cli-reference.md` regenerates via `npm run docs:index` (gated by `docs:check`) |
| `config/schemas/**` | `npm run docs:index` (config_index) + `docs/configuration-reference.md` via `npm run docs` (gated by `docs:check`) + EDD config tables |
| `config/environments/**`, `.env*` | `npm run docs:index` (environment_index) |
| new feature added | add a row to `ai_context/features.seed.json` → mini-EDD → `integration-checklist.md` |
| `ai_context/*-contracts.md` | EDDs whose front-matter `related:` names that slug |
| any L1/L2 doc | `npm run docs:index` (search_index) |

Full rules: `ai_context/knowledge-architecture-proposal.md` §8. Never hand-edit `ai_generated/`.

## Token-Saving Tips

- Don't read `archive/` (frozen legacy, incl. the old AGENT-CONTEXT.md). Use `ai_context/` files instead.
- Don't read graph.html. Use `dependency-rules.md` or `ai_generated/dependency_graph.json` instead.
- Don't read all markdown files. Use module-map.md to find what you need.
- Load subsystem files only when working on that subsystem.
