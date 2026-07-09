---
title: Testing Strategy & Inventory
layer: L2
owns: testing
sources: [tools/*.test.ts]
related: [known-tech-debt]
updated: 2026-07-09
---

# Testing Strategy & Inventory

## Current state (audited 2026-07-09)
The repo has **no unit/integration test framework**. The only automated checks are two
standalone tsx scripts under `tools/`:

| Test | Run | Covers |
|------|-----|--------|
| `tools/merge-validation.test.ts` | `npm run test:merge` | ConfigurationManager deep-merge / array-replace (RZ3/F3) |
| `tools/validate-histogram.test.ts` | `npm run validate:histogram` | Histogram / timeseries validation |

## Gaps (Phase 2 EDDs must record per subsystem)
- No coverage for lifecycle VU-exit math (F5), correlation synthesis (F4), or replay diffing (F2).
- Each EDD's "Testing Strategy" section names the tests that *should* exist and the manual checks
  currently used (e.g. multi-iteration cookie flows F7, spike-profile ramp-down F5).
