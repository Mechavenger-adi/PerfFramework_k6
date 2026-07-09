---
title: Recording → Script Generation — Mini EDD
layer: L2
owns: recording
sources: [core_engine/src/recording/**]
related: [integration-contracts, fragile-areas]
updated: 2026-07-09
---

# Recording → Script Generation (Mini-EDD)

**Purpose.** Turn a HAR (or cURL/Postman import) into a framework-shaped k6 script with lifecycle
phases, transaction groups, parametrised base URLs, and backtick-literal recorded values — the input
that auto-correlation later rewrites.

**Owning files.** `HARParser.ts` (parse + 4-step refinement), `DomainFilter.ts` (domain stats +
allowlist), `TransactionGrouper.ts` (`pageref` → groups), `ScriptGenerator.ts` (groups → script),
`ScriptConverter.ts` (native k6 → framework, Pattern A/B), `CurlAdapter.ts`, `PostmanAdapter.ts`,
`PostmanScriptTranslator.ts`.

**Entry point + condensed runtime flow (§4A).**
1. `HARParser.parse(filePath, options)` → `HAREntry[]` with refinement ([HARParser.ts:10](../../core_engine/src/recording/HARParser.ts#L10)); `readEntries` for raw [:51](../../core_engine/src/recording/HARParser.ts#L51).
2. `DomainFilter` + `TransactionGrouper` reduce to `TransactionGroup[]`.
3. `ScriptGenerator.generate(groups, …)` builds the script ([ScriptGenerator.ts:55](../../core_engine/src/recording/ScriptGenerator.ts#L55)); `buildPhaseFunction` emits `export function <phase>(ctx)` [:117-126](../../core_engine/src/recording/ScriptGenerator.ts#L117); `buildUrlExpression`/`buildStringExpression` parametrise base URLs [:270](../../core_engine/src/recording/ScriptGenerator.ts#L270)/[:344](../../core_engine/src/recording/ScriptGenerator.ts#L344); `extractBaseUrls` hoists env base URLs [:358](../../core_engine/src/recording/ScriptGenerator.ts#L358). API import via `SCRIPT_API_MODULE` [:10](../../core_engine/src/recording/ScriptGenerator.ts#L10).
4. Alternative inputs: `ScriptConverter` (existing k6 script), `CurlAdapter`/`PostmanAdapter` → synthetic `HAREntry[]` funneled through `ScriptGenerator`.

**Key types.** `HAREntry`, `HARRefinementOptions`, `TransactionGroup`.

**Configuration + env influence.** Domain allowlist; base-URL parametrisation into env vars.

**Extension points.** New importer adapter → synthetic `HAREntry[]` (no emitter change); refinement steps
in `HARParser`.

**Known limitations.** `ScriptConverter` is regex-based dual-pattern and fragile (F4) — must stay
idempotent (re-convert = no-op) and preserve `match`/`regex` declarations.

**Risks.** F4 (ScriptConverter regex transforms).

**Tests to run.** Manual: HAR → script; convert idempotency; cURL/Postman import smoke.

**Related.** [[EDD-auto-correlation]], [[integration-contracts]], [[cli]].
