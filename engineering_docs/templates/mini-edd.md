---
title: <Feature> — Mini EDD
layer: L2
owns: <feature-slug>            # must match ai_context/features.seed.yaml
sources: [core_engine/src/<paths>/**]
related: [<contract-slug>]
updated: YYYY-MM-DD
---

# <Feature> (Mini-EDD)

> ≤1 page. Route to code + L1; do not re-explain contracts. Every behavioral claim cites `file.ts:line`.

**Purpose.** <2–3 lines.>

**Owning files.** `path.ts`, `path2.ts`

**Entry point + condensed runtime flow (§4A).**
1. `entry.ts:NN` — <entry>
2. → <step> (`file.ts:NN`) — decision: `<condition>` → <branch>
3. → error/fallback: <what happens on failure> (`file.ts:NN`)

**Key types.** `TypeName` (`types/File.ts`)

**Configuration + env influence.** `configKey` → effect; `ENV_VAR` → effect.

**Extension points.** <link extension-points.md if any>

**Known limitations.** <real edges from the code>

**Risks.** <link risk-zones.md / fragile-areas.md ids>

**Tests to run.** `npm run <script>` / <manual check>

**Related.** [[contract-slug]], [[edd-slug]]
