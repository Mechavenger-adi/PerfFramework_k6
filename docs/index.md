# K6-PerfFramework Documentation

Published user documentation (Layer 3). For architecture/internals see `engineering_docs/` (L2);
for AI routing see `ai_context/` (L1) and [FrameworkAtlas.md](../FrameworkAtlas.md).

## Start here
- [Installation](installation.md) — prerequisites and first-time setup
- [Getting Started](getting-started.md) — from zero to your first run
- [CLI Reference](cli-reference.md) — every command and option *(generated from source)*
- [Configuration Guide](configuration.md) — how config resolves + [field reference](configuration-reference.md) *(generated)*

## Guides
- [Migration](migration.md) — bring an existing k6 script into the framework
- [Troubleshooting](troubleshooting.md) — common failures and fixes
- [FAQ](faq.md)
- [Examples](examples/) — runnable suites and templates
- [Release Notes](release-notes.md)

## Onboarding
- **New here? [Start with Onboarding](onboarding/)** — the [Day 1 path](onboarding/day-1.md) and
  [Mental Model](onboarding/mental-model.md).
- Legacy KT decks: [Guide](onboarding/KT_Guide.md) · [Deep Dive](onboarding/KT_Low_Level_Deep_Dive.md) · [Presentation](onboarding/KT_Presentation.md)

## Deeper reading (engineering docs)
- Lifecycle, correlation, replay, reporting, config: `engineering_docs/edd/`
- All features: `engineering_docs/features/`
- [Architecture deck](presentation/architecture-deck.md) — Marp slides *(generated from the code indexes)*

---
*L3 pages are derived from L2/code per the knowledge-architecture derivation rule. The CLI and
configuration references are generated (`npm run docs:index` / `npm run docs`); do not hand-edit them.*
