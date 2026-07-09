## docs-sync

Documentation is source code in this repo; outdated docs are bugs. The knowledge system has four
layers: L1 `ai_context/` (routing/rules), L2 `engineering_docs/` (canonical EDDs, reverse-engineered
from code), L3 `docs/` (published), L4 `ai_generated/` (JSON indexes — generated, never hand-edit).

Rules:
- After changing any code under `core_engine/src/`, `config/`, or docs, run `npm run docs:index`
  to regenerate `ai_generated/*.json` and the `FrameworkAtlas.md` tables.
- Before considering a change complete, run `npm run docs:check` — it regenerates and fails on any
  `git diff`, catching stale indexes.
- If the change touches a feature with an EDD/mini-EDD, update that doc (including §4A
  reverse-engineering rows with fresh `file:line` citations) in the same change.
- Adding a feature: add a row to `ai_context/features.seed.json`.
- Never edit files under `ai_generated/` or `archive/` by hand.
- Full mapping table + rationale: `ai_context/ai-workflow.md` and `ai_context/knowledge-architecture-proposal.md` §8.
