---
title: Engineering Docs (L2) — Index
layer: L2
owns: engineering-docs
sources: [core_engine/src/**]
related: [knowledge-architecture-proposal, FrameworkAtlas]
updated: 2026-07-09
---

# Engineering Documentation (Layer 2)

Canonical, handwritten source of truth. **Every document here is reverse-engineered from the
code** (see the proposal §4A) with verifiable `file.ts:line` citations — file names are hints,
never evidence. Contracts are *not* re-documented here; they live in `ai_context/*-contracts.md`
and are linked.

## Structure

| Folder | Contents | Tier |
|--------|----------|------|
| `edd/` | Full EDDs for the 5 highest-risk subsystems | Full (all sections) |
| `features/` | 1-page mini-EDDs for every other feature | Mini |
| `runtime/` | k6-side execution model deep-dive | Full-ish |
| `adr/` | Numbered architecture decision records (migrated proposals + new) | ADR |
| `testing/` | Test strategy + inventory | — |
| `templates/` | `full-edd.md`, `mini-edd.md`, `adr.md` | — |

## Full EDD roster (Phase 2, risk-ranked)

1. `edd/EDD-lifecycle.md` — lifecycle + phase envelope (RZ1, RZ4, F5)
2. `edd/EDD-auto-correlation.md` — correlation scanner + ScriptConverter (F4)
3. `edd/EDD-debug-replay.md` — replay + diff + HTML report (RZ6, F1, F2)
4. `edd/EDD-reporting.md` — transaction metrics + thresholds (RZ7, RZ8)
5. `edd/EDD-config.md` — 6-layer config merge (RZ3, RZ10, F3)

> Status: Phase 2 complete (2026-07-09) — all 5 full EDDs + 8 mini-EDDs written, each reverse-engineered
> from code with `file:line` citations. `feature_index.json` links every feature to its EDD.
