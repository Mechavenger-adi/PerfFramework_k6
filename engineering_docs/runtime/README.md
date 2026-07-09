---
title: Runtime Model
layer: L2
owns: runtime
sources: [core_engine/src/utils/**, core_engine/src/runtime/**]
related: [runtime-contracts, execution-flow]
updated: 2026-07-09
---

# k6-side Runtime Model

Deep-dive on code that compiles to `dist/utils/` and runs inside k6's goja engine (NOT Node).
Complements `ai_context/runtime-contracts.md` (terse contract) and the lifecycle EDD.
Written in **Phase 2**.
