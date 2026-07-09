# ai_generated/ — Layer 4 (GENERATED — DO NOT EDIT)

Every file here is regenerated deterministically from the repo by committed `tools/` scripts.
**Never hand-edit.** A non-empty `git diff` after regeneration means the indexes are stale.

Regenerate all: `npm run docs:index`
Check staleness (CI gate): `npm run docs:check`

| File | Generator | Source |
|------|-----------|--------|
| `file_index.json` | `tools/gen-indexes.js` | `core_engine/src/**/*.ts` |
| `symbol_index.json` | `tools/gen-indexes.js` | `core_engine/src/**/*.ts` |
| `dependency_graph.json` | `tools/gen-indexes.js` | `core_engine/src/**/*.ts` |
| `call_graph.json` | `tools/gen-indexes.js` | `core_engine/src/**/*.ts` (module-level, partial) |
| `feature_index.json` | `tools/gen-feature-index.js` | `ai_context/features.seed.yaml` + resolved code |
| `ownership.json` | `tools/gen-feature-index.js` | feature_index + layout |
| `framework_map.json` | `tools/gen-feature-index.js` | feature_index + module-map |
| `config_index.json` | `tools/gen-config-index.js` | `config/schemas/*.schema.json` |
| `environment_index.json` | `tools/gen-config-index.js` | `config/environments/*` + `.env*` + `process.env` refs (names only) |
| `search_index.json` | `tools/gen-search-index.js` | headings across L1/L2 docs |
