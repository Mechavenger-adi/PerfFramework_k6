# CLAUDE.md

## Start here
- Front door: [FrameworkAtlas.md](FrameworkAtlas.md) — routes to every feature's owning files.
- AI context: [ai_context/overview.md](ai_context/overview.md) → `architecture-laws.md` → `module-map.md`.
- L4 routing index: `ai_generated/feature_index.json` (feature → files/config/tests/EDD).

## Knowledge system (docs are source code — outdated docs are bugs)
| Layer | Path | Nature |
|-------|------|--------|
| L1 | `ai_context/` + `FrameworkAtlas.md` | Routing/rules/contracts (handwritten) |
| L2 | `engineering_docs/` | Canonical EDDs, reverse-engineered from code (§4A) |
| L3 | `docs/` | Published user docs (derived) |
| L4 | `ai_generated/*.json` | Generated indexes — **never hand-edit** |
| — | `archive/` | Frozen legacy (was `.md/`) — do not read or cite |

Design of the system: `ai_context/knowledge-architecture-proposal.md`.

## Mandatory after any code change
1. `npm exec tsc -- --noEmit`
2. `npm run docs:index` — regenerate L4 + Atlas
3. Update the touched feature's EDD/mini-EDD (see `ai_context/ai-workflow.md` mapping table)
4. `npm run docs:check` — must be clean (no stale indexes)

Build note: k6-side (`core_engine/src/utils/*`) changes require `npm run build` before k6 sees them.
