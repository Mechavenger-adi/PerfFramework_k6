# Onboarding

New to the framework? Follow this path. It gets a new engineer from a clean machine to a first passing
run and a debug diff report, then explains how the pieces fit.

## The path
1. **[Day 1](day-1.md)** — a guided, checklist-style walkthrough: install → author → validate → debug →
   run → read results. Uses only published docs. Start here.
2. **[Mental Model](mental-model.md)** — the conceptual overview: Node orchestration vs k6 runtime, the
   per-VU lifecycle, artifact-first reporting, and the four documentation layers. Read after your first run.
3. **Go deeper** — the code-cited engineering docs in `engineering_docs/edd/` (lifecycle, auto-correlation,
   debug-replay, reporting, config) and `engineering_docs/features/` for everything else.

## Reference while you work
- [CLI Reference](../cli-reference.md) *(generated)* · [Configuration Guide](../configuration.md)
- [Troubleshooting](../troubleshooting.md) · [FAQ](../faq.md)
- [Framework Atlas](../../FrameworkAtlas.md) — find which files own a feature

## Knowledge-transfer decks
The `KT_*` files below are longer-form knowledge-transfer material, refreshed 2026-07-13 to match the
current code. Use them for structural intuition and for running a session; for the definitive,
`file:line`-cited version of any detail, the [Mental Model](mental-model.md) and the
`engineering_docs/edd/` documents remain authoritative (each EDD is reverse-engineered from the code).
- [KT Guide](KT_Guide.md) — file-by-file deep dive
- [KT Low-Level Deep Dive](KT_Low_Level_Deep_Dive.md) — mechanisms & math
- [KT Presentation](KT_Presentation.md) — slide outline for a talk
