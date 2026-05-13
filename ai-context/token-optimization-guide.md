# Token Optimization Guide

> Strategies for minimizing AI context token usage.

## Problem

AGENT-CONTEXT.md is 1,841 lines / 140KB. Reading it fully consumes ~35K tokens — wasteful when you only need to edit one file.

## Strategy 1: Modular Loading

Use `ai-context/` files instead of AGENT-CONTEXT.md:

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

Each ai-context file is designed to be:
- **Self-contained** — works without reading other files
- **Concise** — bullet points, tables, minimal prose
- **Scannable** — headers allow skipping irrelevant sections
- **Actionable** — tells you what to do, not just what exists

## What NOT to Read

| File | Lines | Why Skip |
|------|-------|----------|
| `AGENT-CONTEXT.md` | 1,841 | Use ai-context/ files instead |
| `graph.html` | 993 | Use dependency-rules.md instead |
| `BaseArchitecture.md` | 1,020 | Historical design doc, superseded by implementation |
| `VU-Lifecycle-Implementation-Plan.md` | 595 | Planning doc, decisions already extracted |
| `schema-driven-dx-strategy.md` | 461 | Strategy doc, already implemented |
| `HTMLDiffReporter.ts` | ~2000+ | Only read if editing the HTML report |

## Estimated Token Budget Per Task

| Task Complexity | Token Budget | Files to Load |
|----------------|-------------|---------------|
| Simple edit | 3-5K | overview + module-map |
| Feature addition | 5-8K | + laws + checklist + extension |
| Bug investigation | 4-7K | + fragile + impact + relevant source |
| Architecture change | 8-12K | + philosophy + boundaries + decisions |
| Full repo orientation | 12-15K | All ai-context files |
