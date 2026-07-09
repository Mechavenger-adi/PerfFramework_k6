---
title: Legacy Runtime Rule Engine — Mini EDD
layer: L2
owns: legacy-correlation
sources: [core_engine/src/correlation/CorrelationEngine.ts, core_engine/src/correlation/ExtractorRegistry.ts, core_engine/src/correlation/RuleProcessor.ts, core_engine/src/correlation/FallbackHandler.ts]
related: [known-tech-debt]
updated: 2026-07-09
---

# Legacy Runtime Rule Engine (Mini-EDD)

**Purpose.** The **older**, hand-authored-rule correlation path: load rule files, register regex/
jsonpath/header/cookie/boundary extractors, extract + store tokens at runtime, with failure strategies.
Superseded by smart auto-correlation ([EDD-auto-correlation](../edd/EDD-auto-correlation.md)); **generated scripts do not call this** (System B).

**Owning files.** `CorrelationEngine.ts` (extract + store), `ExtractorRegistry.ts` (extractor registry),
`RuleProcessor.ts` (rule-file loading), `FallbackHandler.ts` (extraction-failure strategies).

**Entry point + condensed runtime flow (§4A).**
1. `CorrelationEngine` ([CorrelationEngine.ts:7](../../core_engine/src/correlation/CorrelationEngine.ts#L7)) drives token extraction + storage from configured rules.
2. `ExtractorRegistry.register(type, fn)` / `.get(type)` provide pluggable extractors ([ExtractorRegistry.ts:23-27](../../core_engine/src/correlation/ExtractorRegistry.ts#L23)).
3. `RuleProcessor` loads rule files; `FallbackHandler` decides behavior on extraction miss.

**Key types.** `ExtractorFn`, rule definitions.

**Configuration + env influence.** `config/correlation-rules/*` rule files.

**Extension points.** `ExtractorRegistry.register` for a new extractor type.

**Known limitations.** Two mental models coexist (System A auto vs System B legacy) — reconciliation is
deferred (see [known-tech-debt.md](../../ai_context/known-tech-debt.md) TD14). Not wired into generated scripts.

**Risks.** Divergence/confusion with the auto-correlation path (TD14).

**Tests to run.** Manual: rule-file load; extractor registration.

**Related.** [[EDD-auto-correlation]], [[known-tech-debt]].
