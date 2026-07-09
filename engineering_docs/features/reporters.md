---
title: External Reporters (stubs) — Mini EDD
layer: L2
owns: reporters
sources: [core_engine/src/reporters/**]
related: [reporting-contracts, known-tech-debt]
updated: 2026-07-09
---

# External Reporters (Mini-EDD) — STUBS

**Purpose.** Transform k6 results into a `ResultContract` and push to external sinks (Grafana / Azure /
generic webhook). **Currently stubs** — the transform exists; the push targets are placeholders.

**Owning files.** `ResultTransformer.ts` (k6 summary → `ResultContract`), `GrafanaReporter.ts`,
`AzureReporter.ts`, `CustomUploader.ts` (all push stubs).

**Entry point + condensed runtime flow (§4A).**
1. `ResultTransformer.transform(k6Data)` → `ResultContract` ([ResultTransformer.ts:13](../../core_engine/src/reporters/ResultTransformer.ts#L13)).
2. `GrafanaReporter.push(result, url)` and siblings are stubs ([GrafanaReporter.ts:8](../../core_engine/src/reporters/GrafanaReporter.ts#L8)) — no live network push implemented yet.

**Key types.** `ResultContract`.

**Configuration + env influence.** Intended: sink URLs/tokens via env; not yet wired.

**Extension points.** Implement a `push()` body per sink; add a sink class following the same shape.
This is the primary external-integration extension surface.

**Known limitations.** Push methods are not implemented — artifact-first reporting ([EDD-reporting](../edd/EDD-reporting.md)) is
the supported path today (CI consumes `ci-summary.json`).

**Risks.** None active (unwired). Contract drift with `reporting-contracts.md` if implemented later.

**Tests to run.** Manual: `ResultTransformer.transform` over a sample k6 summary.

**Related.** [[EDD-reporting]], [[reporting-contracts]], [[known-tech-debt]].
