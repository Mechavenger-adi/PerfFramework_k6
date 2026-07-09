---
title: <Subsystem> — Engineering Design Document
layer: L2
owns: <feature-slug>            # must match ai_context/features.seed.yaml
sources: [core_engine/src/<paths>/**]   # code paths that make this doc stale
related: [<contract-slug>, <adr-slug>]
updated: YYYY-MM-DD
---

# EDD: <Subsystem>

> **How to use this template.** Delete this quote block. Fill every section. Every behavioral
> claim MUST cite `file.ts:line` (verified against current code). Do not restate contracts that
> already live in `ai_context/*-contracts.md` — link them. Sections marked **§4A** are the
> load-bearing reverse-engineering core; they are derived from the implementation, not file names.

## Executive Summary
<2–4 sentences: what this subsystem does and why it exists.>

## Problem Statement
## Goals
## Non-Goals
## Functional Requirements
## Non-Functional Requirements

## Architecture
<Component diagram (Mermaid). Which files/classes, how they connect.>

## Component Responsibilities
| File | Class/Fn | Responsibility | Evidence |
|------|----------|----------------|----------|
| `path.ts` | `Foo` | … | `path.ts:NN` |

## Runtime Flow + Implementation Reverse-Engineering (§4A)
*The core of this document. Reconstruct from the code, each row cited.*

| Facet | Finding | Evidence (`file:line`) |
|-------|---------|------------------------|
| Execution entry point | | |
| Complete runtime flow | *(numbered call chain, entry → exit)* | |
| Decision points & branch conditions | | |
| Validation logic | | |
| Fallback logic | | |
| Error paths (`continue`/`stop_iteration`/`stop_vu`/`abort_test`) | | |
| State changes | | |
| Object lifecycle (per-VU / per-iteration / per-run) | | |
| Configuration influence | *(config key → effect)* | |
| Environment-variable influence | *(env var → effect)* | |
| Interactions with other modules | *(link L1 contracts)* | |
| Extension points | *(link extension-points.md)* | |
| Known limitations | | |

## Sequence Diagram
```mermaid
sequenceDiagram
```

## State Diagram
<Only if the subsystem is a state machine. Otherwise: "N/A".>
```mermaid
stateDiagram-v2
```

## Design Patterns
## Interfaces
<Link to ai_context/*-contracts.md. Do not restate schemas.>

## Configuration
## Extension Points
## Error Handling
## Logging
## Metrics
## Performance Considerations
## Security Considerations
## Testing Strategy
<Which tests exist / should exist; how to run them.>

## Risks
<Link risk-zones.md / fragile-areas.md entries, don't restate.>

## Tradeoffs
## Future Improvements

## Related Files
## Related ADRs
