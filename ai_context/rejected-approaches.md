# Rejected Approaches

> Approaches that were tried or considered and abandoned. Do NOT re-attempt these without new justification.

## R1 — Animated Spinner for Debug Progress

**Proposed:** Use `setInterval`-based spinner animation during debug replay.
**Why rejected:** `PipelineRunner.execute()` uses `spawnSync` which blocks the event loop. Animation callbacks never fire.
**Alternative adopted:** Phase-based logger (`▸ start...` → `✔ done`).

## R2 — `txn_` Prefix for Transaction Metrics

**Proposed:** Prefix all transaction Trend metrics with `txn_` (e.g., `txn_Homepage`).
**Why rejected:** Unnecessary indirection. Cleaner metrics without prefix. ThresholdManager was updated to detect transactions by pattern instead of prefix.
**Alternative adopted:** Direct transaction name as metric name.

## R3 — Single ramp-down Detection for endPhase

**Proposed:** Scan for a ramp-down stage (target lower than previous) to detect when VUs should run endPhase.
**Why rejected:** Failed for spike profiles (multiple ramp-down segments), step profiles, and constant-vus.
**Alternative adopted:** Instantaneous VU target interpolation algorithm.

## R4 — `summaryTrendStats` in k6 JSON Config

**Proposed:** Set `summaryTrendStats` in the k6 options JSON file passed via `--config`.
**Why rejected:** k6 silently ignored it. The CLI flag `--summary-trend-stats` has higher precedence.
**Alternative adopted:** Pass `--summary-trend-stats` as k6 CLI argument.

## R5 — Deep Merge for Arrays

**Proposed:** Deep merge arrays the same way as objects during config merge.
**Why rejected:** Arrays spread by index (`{0: 'count', 1: 'pass', ...}`) lost their Array prototype, breaking `Array.isArray()` checks downstream.
**Alternative adopted:** Arrays replaced wholesale during merge.

## R6 — YAML Config Files

**Proposed:** Switch to YAML for config files to allow comments.
**Why rejected:** Introduces whitespace sensitivity bugs and a new parser dependency. JSONC provides comments while keeping JSON tooling compatibility.
**Alternative adopted:** JSONC support via `jsonc-parser`.

## R7 — Auto-Generate JSON Schema from TypeScript Types

**Proposed:** Use `ts-json-schema-generator` to auto-generate schemas.
**Why rejected:** Generated schemas have technically correct but terrible descriptions. Hand-written schemas with rich descriptions are where the UX lives.
**Alternative adopted:** Hand-crafted JSON Schema files with rich `description` fields.

## R8 — `.vscode/settings.json` for Schema Mapping

**Proposed:** Map schemas to config files via VS Code workspace settings.
**Why rejected:** Editor-specific. `$schema` property in each file is editor-agnostic and works in VS Code, JetBrains, Sublime, Neovim, etc.
**Alternative adopted:** `$schema` property in each config JSON file.

## R9 — Stripping `let match;` / `let regex;` in Converter

**Proposed:** Strip all `let` declarations for params/url/resp/match/regex.
**Why rejected:** `match` and `regex` are used for correlation extraction. k6 ES modules run in strict mode — assigning to undeclared variables throws `ReferenceError`.
**Alternative adopted:** Only strip `let params;`/`let url;`/`let resp;` (inlined by converter). Preserve `let match;`/`let regex;`.

## R10 — Body Preview in Snapshot Table

**Proposed:** Add request/response body preview rows inside the snapshot summary table.
**Why rejected:** Caused bodies to appear twice — once in snapshot table, once in collapsible section below.
**Alternative adopted:** Bodies appear only in collapsible `<details>` sections (auto-expanded for POST/PUT/PATCH/DELETE).
