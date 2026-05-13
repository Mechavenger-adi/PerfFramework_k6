# Framework Philosophy

> Design principles that explain WHY the architecture is shaped the way it is.

## P1 — Configuration Over Code

Framework behavior is controlled through JSON configs, not hardcoded script logic. Teams should be able to change load profiles, SLAs, think time, error behavior, and reporting without touching code.

**Implication:** New features should be config-driven. If a behavior can be expressed as a config field, it should be.

## P2 — Thin Abstraction

HTTP calls, checks, and transaction boundaries remain visible in scripts. The framework reduces boilerplate without hiding request intent.

**Implication:** Never create opaque wrappers that hide what HTTP calls are being made. `logExchange()` is a single line, not a middleware.

## P3 — Contract-Based Development

TypeScript interfaces define the shape of all data flowing between layers. This prevents teams from inventing ad-hoc conventions.

**Implication:** New data structures must be typed in `core-engine/src/types/` and validated via JSON Schema where applicable.

## P4 — Convention Over Configuration

Sensible defaults for everything: think time, pacing, status validation, folder layout, transaction naming. Teams opt-in to customization only when needed.

**Implication:** `FRAMEWORK_DEFAULTS` in `ConfigContracts.ts` is the canonical set of defaults. New settings must have defaults.

## P5 — Decoupled Core + Suite Architecture

Core engine (`core-engine/`) is shared platform code. Team tests live in `scrum-suites/{team}/`. These must remain independent — no team folder should import from another team's folder.

**Implication:** The core engine is designed to be publishable as an npm package. Team suites are consumers, not contributors to core.

## P6 — Artifact-First Reporting

CI pipelines consume machine-readable artifacts (`ci-summary.json`, `transaction-metrics.json`), not console log scraping. HTML reports are for humans.

**Implication:** Every new metric or event must flow into structured artifacts first, then optionally into HTML.

## P7 — Progressive Disclosure

Show 5 options to beginners, 30 to experts. Config schemas have descriptions that become IDE tooltips. Templates teach by example.

**Implication:** JSON Schema files in `config/schemas/` are the single source of truth for validation, IDE integration, and documentation.

## P8 — Debug Replay as First-Class Feature

The ability to replay a recorded flow and diff it against the original recording is a core differentiator, not an afterthought.

**Implication:** Generated scripts carry replay metadata (`harEntryId`, `transaction`, request/response logging). Recording logs are first-class artifacts.

## P9 — LoadRunner-Style Lifecycle

Virtual user lifecycle follows `init → action (loop) → end`, matching LoadRunner mental models for enterprise performance engineers.

**Implication:** `initPhase` runs once per VU, `actionPhase` loops, `endPhase` runs once before VU exit. This maps to login/flow/logout patterns.

## P10 — AI Features Are Optional

The framework must function fully without AI capabilities. AI features are behind feature toggles and have deterministic non-AI fallbacks.

**Implication:** Phase 4 (AI) must not create dependencies that break Phases 1-3 when disabled.
