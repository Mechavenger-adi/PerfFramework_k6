# Token Optimization Guide

> Strategies for minimizing AI context token usage.

## Problem

The old monolith `AGENT-CONTEXT.md` (now frozen at `archive/AGENT-CONTEXT.md`, 2,258 lines) cost ~35K tokens to read fully — wasteful when you only need one file. It is superseded by this layer.

## Strategy 0: Route via L4 indexes first

`ai_generated/feature_index.json` maps a feature → its owning files, config, tests, and EDD. One read pins the exact files, replacing several prose reads. Regenerate indexes with `npm run docs:index`.

## Strategy 1: Modular Loading

Use `ai_context/` files instead of the frozen monolith:

| Task | Load These (~tokens) | vs AGENT-CONTEXT.md |
|------|---------------------|---------------------|
| Quick edit | overview.md + module-map.md (~3K) | 35K |
| Feature addition | overview + laws + checklist + extension (~5K) | 35K |
| Bug fix | overview + module-map + fragile + impact (~4K) | 35K |
| Architecture review | overview + laws + philosophy + boundaries (~5K) | 35K |

**Savings: 80-90% token reduction per session.**

## Strategy 2: Targeted File Reading

1. Use `module-map.md` to identify the exact file you need
2. Read only that source file (most are < 200 lines)
3. Use `change-impact-map.md` to find related files
4. Read only the relevant related files

## Strategy 3: Incremental Context

For multi-turn conversations:
1. First turn: Load `overview.md` + task-specific context files
2. Subsequent turns: Reference already-loaded context, add only new files
3. Don't re-read files you've already processed

## Strategy 4: Context File Design

Each ai_context file is designed to be:
- **Self-contained** — works without reading other files
- **Concise** — bullet points, tables, minimal prose
- **Scannable** — headers allow skipping irrelevant sections
- **Actionable** — tells you what to do, not just what exists

## What NOT to Read

| File | Lines | Why Skip |
|------|-------|----------|
| `archive/**` (whole folder) | ~11,500 | Frozen legacy (AGENT-CONTEXT, BaseArchitecture, VU-Lifecycle plans, schema-dx). Superseded — do not read |
| `graph.html` | 993 | Use `dependency-rules.md` or `ai_generated/dependency_graph.json` |
| `docs/K6_PerfFramework_Technical_Reference.md` | ~4,764 | Generated. Query `ai_generated/symbol_index.json` instead |
| `HTMLDiffReporter.ts` | ~2000+ | Only read if editing the HTML report |

## Estimated Token Budget Per Task

| Task Complexity | Token Budget | Files to Load |
|----------------|-------------|---------------|
| Simple edit | 3-5K | overview + module-map |
| Feature addition | 5-8K | + laws + checklist + extension |
| Bug investigation | 4-7K | + fragile + impact + relevant source |
| Architecture change | 8-12K | + philosophy + boundaries + decisions |
| Full repo orientation | 12-15K | All ai_context files |
