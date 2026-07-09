# Knowledge Architecture Proposal — K6-PerfFramework

> **Status:** DESIGN ONLY — approved 2026-07-09; Phase 1 not yet started. This document creates/moves/deletes nothing itself.
> **Owner:** Documentation Architect role. **Date:** 2026-07-09.
> **Rule this system enforces:** documentation is source code; outdated docs are bugs.
> **Approved decisions folded in:** L2=`engineering_docs/`, L3=`docs/`; freeze `.md/` as archive; home-grown TS-compiler generators; full EDDs for all 5 top-risk subsystems; **plus mandatory Implementation Reverse-Engineering (§4A) — every EDD is derived from the code, not inferred from file names.**

---

## 0. Scope, method, exclusions

**Audited (source of truth for code):** `core_engine/src/` (~95 TS, 15 layers), `config/`, `templates/`, `testSuites/`, `tools/`, plus every doc surface: `ai_context/` (28 files), `docs/` (6), `.md/` (25), `core_engine/DOCS_METHODS.md`, root `README.md` / `design_proposal.md` / `graph.html`, `.agent/`, `.claude/`.

**Permanently excluded** from indexing, loading, and analysis: `node_modules/`, `dist/`, `k6-master/` (vendored upstream), `results/`, `.k6-temp/`, `.tmp-*`, `.git/`. This set already matches `tools/generate-technical-reference.js` `EXCLUDED_DIRS`; generators reuse it.

---

## 1. Audit findings

### 1a. `ai_context/` — 28 files, ~3,608 lines. Verdict: **strong, keep the bulk; fix 3 problems.**

The layer is well-formed: 26 of 28 files are under the 150-line budget, self-contained, scannable, actionable. The routing spine (`overview` → `module-map` → `execution-flow` → `architecture-laws`) already implements progressive loading. **Do not rebuild this.** Three issues only:

| Problem | Files | Disposition |
|---|---|---|
| **Budget breach** | `design-proposals.md` (1120), `design-proposals_1.md` (325) | These are *approved-but-pending implementation contracts* — accepted ADRs, not routing. **MOVE** to `engineering_docs/adr/`, split per-proposal; `_1` is an earlier subset → **MERGE** into the same ADR set then **DELETE**. Leave a 1-line pointer in `todos.md`. |
| **Mild staleness** | `overview.md` ("No tests exist" — now 2 test files in `tools/`), `token-optimization-guide.md`/`ai-workflow.md` (cite `AGENT-CONTEXT.md` at 1,841 lines; it is `.md/AGENT-CONTEXT.md` at 2,258 and being frozen) | **KEEP + edit** in Phase 1. |
| **History vs routing mix** | `architecture-evolution.md` (55) | Historical, not routing. **KEEP** but reclassify as load-on-demand (L3-history); it stays put, just drops out of the always-load set. |

Per-file disposition for the remaining 25 (all **KEEP**, remain L1):

`overview` (L0), `architecture-laws` (L0), `module-map` (L0), `execution-flow` (L1), `ai-workflow` (L1 + **extend** with sync checklist), `token-optimization-guide` (**edit**), `framework-philosophy`, `subsystem-boundaries`, `dependency-rules`, `dependency-hotspots`, `change-impact-map`, `orchestration-map`, `integration-checklist` (**extend** with doc-sync step), `integration-contracts`, `runtime-contracts`, `reporting-contracts`, `replay-debug-contracts`, `extension-points`, `risk-zones`, `fragile-areas`, `decisions`, `rejected-approaches`, `known-tech-debt`, `prompt-templates`, `todos`.

**Load-bearing vs dead weight:** all 25 are load-bearing — each answers a distinct routing/rule/contract question. The `*-contracts.md` files are the *authoritative terse contracts*; L2 EDDs will **link** to them, never re-document them. No merges recommended beyond the ADR move.

### 1b. `docs/` — 6 files, ~5,666 lines. Verdict: **repurpose as L3; one file is generated.**

| File | Lines | Disposition |
|---|---|---|
| `K6_PerfFramework_Technical_Reference.md` | 4,764 | **GENERATED** by `tools/generate-technical-reference.js`. **KEEP**, mark generated (banner + `.gitattributes linguist-generated`), never hand-edit. |
| `configuration-reference.md` | 92 | **KEEP** → becomes L3 `docs/configuration.md`, later derived from schemas. |
| `KT_Guide` / `KT_Low_Level_Deep_Dive` / `KT_Presentation` | 134/193/87 | Onboarding + presentation. **MOVE** to `docs/onboarding/` (L3, Phase 4/5). |
| `CODE_LEVEL_ROADMAP.md` | 396 | Planning artifact, not user doc. **MOVE** to `engineering_docs/` (or fold into `todos.md`). |

### 1c. `.md/AGENT-CONTEXT.md` and the `.md/` archive — 25 files, ~11,553 lines. Verdict: **FREEZE (approved).**

Per decision: rename `.md/` → **`archive/`**, mark read-only, **exclude from all indexing and the loading strategy**, migrate nothing proactively. `AGENT-CONTEXT.md` (2,258) is officially superseded by `ai_context/` — its still-true facts already live there; the monolith is frozen, not deleted (history preserved). Only pull a file out of `archive/` if something *actively links to it*; the live HowTos (`HowTo-AutoCorrelation`, `HOW_TO_USE_FRAMEWORK`, `Correlation-Engine-Design`) are the likely candidates when Phase 3 needs source material. Add `archive/README.md`: "Frozen. Superseded by ai_context/ + engineering_docs/. Do not edit or cite as current."

### 1d. Tooling / rules

| Item | Finding | Disposition |
|---|---|---|
| `tools/generate-technical-reference.js` | Uses `typescript` compiler API to walk source, extract classes/methods/JSDoc; emits MD + DOCX; already excludes the right dirs. | **KEEP** as the L4 generator backbone; refactor its AST walk into a shared module reused by index generators. |
| `tools/*.test.ts` (merge-validation, validate-histogram) | The only tests in the repo. | Record in `engineering_docs/testing/`. |
| `core_engine/DOCS_METHODS.md` (549) | Per-class method tables; overlaps the technical reference. | **DELETE** (redundant with generated reference) — or regenerate as part of L4 if still wanted. |
| `graph.html` (root, 993) | Static dependency graph. | Supersede with generated `dependency_graph.json`; **KEEP** file but stop citing it (already flagged "don't read"). |
| `.agent/rules/graphify.md` + `graphify-out/` | Rule references a knowledge graph that **does not exist**. | **PARK** the rule (mark optional) per decision to go home-grown; do not wire graphify. |
| root `design_proposal.md` (Lifecycle Redesign) | Active proposal, partly implemented. | **MOVE** to `engineering_docs/adr/` alongside the migrated `design-proposals`. |
| root `README.md` | Public front page. | **KEEP**; becomes the L3 landing page, links to `FrameworkAtlas.md`. |
| `improved-doc-architecture-prompt.md` | This task's brief. | Ignore/remove; not a framework artifact. |

---

## 2. Target folder structure & ownership

```
K6-PerfFramework/
├── core_engine/src/         CODE — source of truth for behavior
├── config/ templates/ testSuites/   CODE — source of truth for config/data
├── tools/                   GENERATORS (committed scripts) + tests
│   ├── lib/ast.js           shared TS-compiler walk (extracted from generate-technical-reference.js)
│   ├── gen-indexes.js       -> file/symbol/dependency/call graph
│   ├── gen-feature-index.js -> feature_index, ownership, framework_map (reads ai_context/features.seed.yaml)
│   ├── gen-config-index.js  -> config_index, environment_index
│   ├── gen-search-index.js  -> search_index
│   └── generate-technical-reference.js   (existing)
├── FrameworkAtlas.md        L1 NAV — handwritten shell + generated tables (front door)
├── ai_context/              L1 — routing/rules/contracts (handwritten, <150 lines/file)
│   └── features.seed.yaml   handwritten feature map (seed for L4 feature_index)
├── ai_generated/            L4 — JSON indexes (GENERATED ONLY, never hand-edited)
├── engineering_docs/        L2 — canonical SSoT (handwritten, reverse-engineered from code)
│   ├── README.md            index of EDDs/ADRs
│   ├── edd/                 5 full EDDs (highest-risk subsystems)
│   ├── features/            1-page mini-EDDs (everything else)
│   ├── runtime/             k6-side execution model deep-dive
│   ├── adr/                 numbered ADRs (migrated design-proposals + decisions history)
│   ├── testing/             test strategy + inventory
│   └── templates/           full-EDD / mini-EDD / ADR templates
├── docs/                    L3 — published/derived (users)
│   ├── getting-started.md installation.md cli-reference.md configuration.md
│   ├── examples/ tutorials/ onboarding/ (KT_*)   faq.md troubleshooting.md migration.md release-notes.md
│   └── K6_PerfFramework_Technical_Reference.md   (GENERATED)
└── archive/                 FROZEN (was .md/) — not indexed, not loaded
```

**Ownership matrix**

| Folder | Handwritten / Generated | Who updates | When |
|---|---|---|---|
| `ai_context/` + `FrameworkAtlas.md` shell | Handwritten | Author of the code change | Same PR as the code change |
| `ai_context/features.seed.yaml` | Handwritten | Author adding/removing a feature | On feature add/remove |
| `ai_generated/`, generated `docs/` reference, Atlas tables | **Generated** | `tools/` scripts (`npm run docs:index`) | Pre-commit hook + CI; never by hand |
| `engineering_docs/` | Handwritten (code-derived, §4A) | Author of the code change | Same PR (EDD/mini-EDD for touched feature) |
| `docs/` (non-generated) | Handwritten, derived from L2 | Docs maintainer | Phase 3+ / on release |
| `archive/` | Frozen | Nobody | Never |

---

## 3. Naming conventions & doc standards

- **Files:** `ai_context/` = kebab-case topic (`reporting-contracts.md`). `engineering_docs/edd/` = `EDD-<subsystem>.md`. Mini-EDDs = `features/<feature>.md`. ADRs = `adr/NNNN-<slug>.md` (zero-padded, monotonic). Generated JSON = `snake_case.json`.
- **Front-matter (required on every L1/L2 doc):**
  ```yaml
  ---
  title: Reporting Contracts
  layer: L1            # L1|L2|L3
  owns: reporting      # feature/subsystem slug (matches features.seed.yaml)
  sources: [core_engine/src/reporting/**]   # code paths that make this doc stale
  related: [reporting-contracts, EDD-reporting]   # slugs, not paths
  updated: 2026-07-09
  ---
  ```
  `sources:` is the machine hook for staleness detection (§8). `related:` uses slug names so cross-refs survive moves.
- **Size budgets (hard):** L1 ≤150 lines/file, whole layer <4,000 lines. Mini-EDD ≤1 page (~120 lines). Full EDD: no cap but must use the section template. Generated files: no cap.
- **Cross-reference style:** always link by slug via markdown relative links; never paste content across files. A fact lives in exactly one layer; other layers link to it. **Contracts live in L1; EDDs link them.**
- **Evidence style (§4A):** every EDD claim about behavior cites `file.ts:line` anchors so a reviewer can verify it against the code.
- **Generated-file banner (first line):** `<!-- GENERATED by tools/<script>.js — DO NOT EDIT. Regenerate: npm run docs:index -->`.

---

## 4. Layer design

### L1 — AI Context (`ai_context/` + `FrameworkAtlas.md`) — handwritten, routing/rules/contracts

Keep all 25 core files. Add exactly two: `features.seed.yaml` (feature map seed) and the `FrameworkAtlas.md` shell (§7). Move the two `design-proposals*` out to L2. Loading strategy is **not** a new file — it stays owned by `overview.md` (§5), avoiding a `loading-strategy.md` that would duplicate it.

### L2 — Engineering docs (`engineering_docs/`) — handwritten, canonical SSoT, reverse-engineered from code (§4A)

**Tiered EDDs.** Full EDD (all sections) for the **5 approved subsystems**; mini-EDD for all other features.

**Full-EDD template** (`templates/full-edd.md`) sections: Executive Summary · Problem · Goals · Non-Goals · Functional Reqs · Non-Functional Reqs · Architecture · Component Responsibilities · **Runtime Flow + Implementation Reverse-Engineering (§4A — the load-bearing core)** · Sequence Diagram · State Diagram (if applicable) · Design Patterns · Interfaces (→ link L1 contracts) · Configuration · Extension Points · Error Handling · Logging · Metrics · Performance · Security · Testing Strategy · Risks (→ link `risk-zones`/`fragile-areas`) · Tradeoffs · Future Work · Related Files · Related ADRs.

**Mini-EDD template** (`templates/mini-edd.md`, ≤1 page): Purpose · Owning files · **Entry point + condensed runtime flow (§4A: entry → decision points → error/fallback paths, code-cited)** · Key types · Configuration + env influence · Extension points · Known limitations · Risks (link) · Tests to run · Related (links). Even the mini tier carries the reverse-engineering spine, just compressed.

**The 5 full EDDs (risk-ranked):**
1. `EDD-lifecycle.md` — lifecycle.ts + ScenarioBuilder phase envelope + WorkloadModels (RZ1, RZ4, F5).
2. `EDD-auto-correlation.md` — CorrelationScanner→LinkMatcher→ExtractorSynthesizer→ScriptCorrelationWriter + ScriptConverter (F4).
3. `EDD-debug-replay.md` — replayLogger→ReplayRunner→DiffChecker→HTMLDiffReporter (RZ6, F1, F2).
4. `EDD-reporting.md` — TransactionMetricsBuilder + ThresholdManager + timeseries (RZ7, RZ8).
5. `EDD-config.md` — ConfigurationManager 6-layer merge (RZ3, RZ10, F3).

`adr/` receives migrated `design-proposals.md` (split), `design-proposals_1.md` (merged), root `design_proposal.md`, and net-new ADRs. `decisions.md` stays L1 (terse index) and links to full ADRs.

### L3 — Published docs (`docs/`) — derived, never hand-duplicated

**Derivation rule:** every L3 page is either (a) **generated** from code (technical reference from AST; `cli-reference.md` from Commander command registrations in `core_engine/src/cli/run.ts`; `configuration.md` from `config/schemas/*.schema.json`), or (b) **distilled** from exactly one L2 EDD/mini-EDD by summarizing for a user audience — never by copying engineering prose. If an L3 page has no L2/code source, it doesn't belong in L3. Onboarding (`onboarding/`, ex-KT) and release-notes are the only human-first L3 docs.

### L4 — Generated indexes (`ai_generated/`, JSON) — generated only

Only indexes a committed `tools/` script can regenerate deterministically from the repo. Catalog in §6. Rule: if it can't be script-generated, it isn't L4.

---

## 4A. Implementation Reverse-Engineering (MANDATORY)

The purpose of L2 is not to *describe* architecture — it is to **reverse-engineer the implementation from the code itself.** File names and folder layout are hints, never evidence. Every full EDD (and, compressed, every mini-EDD) must reconstruct, for each major feature, the following — each backed by `file.ts:line` citations verified against source:

| Facet | What the doc must extract from the code |
|---|---|
| **Execution entry point** | The exact function/CLI command/exported symbol where the feature begins (e.g. `cli/run.ts` handler, `lifecycle.ts` guard). |
| **Complete runtime flow** | Step-by-step call chain from entry to exit — the real sequence, not a tidy summary. |
| **Decision points & branch conditions** | Every `if`/`switch`/guard that changes behavior, with the condition and both outcomes. |
| **Validation logic** | What is checked, where, and what a failed check does (reject / warn / coerce). |
| **Fallback logic** | The path taken when the primary strategy fails (e.g. `RecordingLogResolver` multi-strategy, `FallbackHandler`). |
| **Error paths** | Thrown vs caught vs swallowed; `continue`/`stop_iteration`/`stop_vu`/`abort_test` semantics; what surfaces to the user. |
| **State changes** | Mutations to shared/VU/module state and their ordering constraints (e.g. `state.initialized`, cookie jar). |
| **Object lifecycle** | When key objects are constructed, reused, and disposed (per-VU vs per-iteration vs per-run). |
| **Configuration influence** | Which config keys alter the path, and the concrete effect of each. |
| **Environment-variable influence** | Which env vars (incl. `K6_PERF_PHASES` and friends) change behavior, and how. |
| **Interactions with other modules** | Cross-module contracts consumed/produced (link the L1 `*-contracts.md`, don't restate). |
| **Extension points** | Where new behavior plugs in without editing the core (link `extension-points.md`). |
| **Known limitations** | Real edges from the code (e.g. `summaryTrendStats` CLI-only, recursive `testSuites/` filename collisions). |

**Verification rule:** a reviewer must be able to open each cited `file:line` and confirm the claim. Reverse-engineering findings that would be tedious to keep in sync (call chains, entry points, config keys touched) are **cross-checked against L4 indexes** (`call_graph`, `file_index`, `config_index`) so drift is mechanically detectable (§8). Prose that cannot be tied to code is a bug.

---

## 5. Loading strategy (extends `overview.md` / `token-optimization-guide.md`)

| Level | Load | Est. tokens | Purpose |
|---|---|---|---|
| **L0 always** | `FrameworkAtlas.md` **or** `overview.md` + `architecture-laws.md` + `module-map.md` | ~4–5K | Orient + inviolable rules + file routing |
| **L1 feature routing** | `ai_generated/feature_index.json` → the one matching feature's row (owning files, config, tests, EDD link) | ~1–2K | Pin the exact feature/files in one read |
| **L1 rules/contracts** | Only the task-specific `*-contracts.md` / `risk-zones` / `fragile-areas` rows | ~1–3K | Load only the subsystem touched |
| **L2 detail** | The one EDD or mini-EDD for the feature (reverse-engineered, §4A) | ~2–4K (mini) / ~6–10K (full) | Design + implementation understanding, on demand |
| **L3 history/ADR** | `adr/NNNN-*` or `architecture-evolution.md` | on demand | Only when "why" matters |

**Success target met:** L0 (Atlas) → feature_index row → source file = **≤2 doc reads** to the right file. Full-repo orientation still ~12–15K as today. The JSON `feature_index` is the key token win: a machine-readable feature row replaces reading several prose files.

---

## 6. Index catalog (L4)

All under `ai_generated/`. Common trigger: **`npm run docs:index`** (runs all generators), enforced by pre-commit hook + CI staleness check (§8). All generators share `tools/lib/ast.js`.

| Index | Schema sketch | Generator approach | Regen trigger |
|---|---|---|---|
| `file_index.json` | `[{path, layer, loc, exports[], imports[], vuSafe:bool}]` | AST walk of `core_engine/src`; `vuSafe` = reachable only from `index.ts` barrel, no Node built-ins | any `src/**/*.ts` change |
| `symbol_index.json` | `{symbol: {kind, file, line, jsdoc}}` | Reuse existing JSDoc/class/method extraction in the technical-reference generator | any `src/**/*.ts` change |
| `dependency_graph.json` | `{nodes:[file], edges:[{from,to}]}` | Resolve `import` specifiers via TS compiler; supersedes `graph.html` | any `src/**/*.ts` change |
| `call_graph.json` | `{caller: [callees]}` (module-level; function-level best-effort) | AST call-expression resolution; **Phase 1.5** (lower precision, mark partial). Also backs §4A runtime-flow drift checks | any `src/**/*.ts` change |
| `feature_index.json` | `[{feature, entry, files[], config[], tests[], edd, risks[]}]` | Enrich handwritten `ai_context/features.seed.yaml` with resolved files/exports | seed edit or `src` change |
| `ownership.json` | `{feature: {files[], dirs[]}}` | Derived from feature_index + directory layout | with feature_index |
| `config_index.json` | `[{key, type, default, schema, enum, source}]` | Parse `config/schemas/*.schema.json` + defaults; backs §4A config-influence checks | `config/schemas/**` change |
| `environment_index.json` | `[{var, usedIn[], required, template}]` | Scan `config/environments/*` + `.env` templates + `process.env` refs in src | `config/environments/**` or env refs |
| `search_index.json` | `[{title, layer, path, headings[]}]` | Collect front-matter + headings across L1/L2 | any L1/L2 doc change |
| `framework_map.json` | Atlas data: layers→features→entry files | Compose feature_index + module-map | with feature_index |

`feature_index` deliberately depends on a **handwritten seed** because "feature" is a human grouping the compiler can't infer; the seed is small (L1) and the generator does the heavy resolution.

---

## 7. Framework Atlas (`FrameworkAtlas.md`)

Front door for humans **and** agents. **It routes; it does not explain.** Placed at repo root (discoverable), thin shell with generated tables spliced in via marker comments (`<!-- gen:features -->…<!-- /gen -->`).

| Section | Generated? | Content |
|---|---|---|
| Start here | Handwritten | 3 links: this Atlas, `overview.md`, `getting-started.md` |
| Where execution begins | Handwritten | `cli/run.ts` → engine → k6 one-liner + link to `execution-flow.md` |
| Feature → owner table | **Generated** (from `feature_index.json`) | feature · entry file · owning dir · config · EDD link |
| Which files belong together | **Generated** (from `ownership.json`) | feature → file cluster |
| Which config affects what | **Generated** (from `config_index.json`) | config key → consuming feature |
| Risky modules | Handwritten pointer | link to `risk-zones.md` / `fragile-areas.md` |
| Extension points | Handwritten pointer | link to `extension-points.md` |
| Deep dives | Handwritten | links to the 5 EDDs |

Regenerated tables come from L4; the prose shell is hand-maintained and tiny.

---

## 8. Synchronization mechanism (mechanical, not aspirational)

### 8a. Change → docs mapping table (encoded in `ai-workflow.md`)

| Source path pattern | Must touch |
|---|---|
| `core_engine/src/**/*.ts` | `npm run docs:index` (file/symbol/dependency/call, feature_index); if a full-EDD subsystem changed → update that EDD's §4A reverse-engineering; if a feature's behavior changed → its mini-EDD |
| `core_engine/src/cli/**` (command reg) | regen `cli-reference.md`; update `module-map.md` if a command added |
| `config/schemas/**` | `config_index.json` + `docs/configuration.md`; recheck EDD config-influence tables |
| `config/environments/**`, `.env` templates | `environment_index.json`; recheck EDD env-influence tables |
| new feature added | add `features.seed.yaml` row → mini-EDD (with §4A spine) → Atlas regen; follow `integration-checklist.md` |
| `ai_context/*-contracts.md` changed | flag EDDs whose front-matter `related:` includes that slug |
| any L1/L2 doc | `search_index.json` |

### 8b. Checklist persisted in files (so every session inherits it)

Append to `ai_context/ai-workflow.md` "After Making Changes" and mirror a one-liner in `CLAUDE.md` + `.agent/rules/docs-sync.md`:
1. `npm exec tsc -- --noEmit`
2. `npm run docs:index` — regenerate L4 + Atlas tables + technical reference
3. If touched files map to an EDD/mini-EDD (per §8a), update it — including §4A entry/flow/config/env facets with fresh `file:line` citations — in the **same** PR
4. `git diff --exit-code ai_generated/ docs/K6_PerfFramework_Technical_Reference.md` — **must be clean** (else indexes are stale)
5. Bump `updated:` front-matter on any hand-edited L1/L2 doc

### 8c. Automatable vs manual + staleness detection

| Automatable (script/CI/hook) | Manual (human/agent judgment) |
|---|---|
| All L4 index regeneration, technical reference, Atlas tables, `cli-reference`, `configuration.md` | EDD/mini-EDD prose incl. §4A reverse-engineering narrative, ADRs, philosophy, tradeoffs |
| Staleness check: CI job + pre-commit hook run `npm run docs:index` then `git diff --exit-code` — **non-empty diff fails the build** | Deciding *whether behavior changed enough* to rewrite an EDD |
| Front-matter `sources:` lint: warn if a `src` path in a doc's `sources:` no longer exists | Writing the new EDD section |
| §4A drift lint: warn when an EDD cites a `file:line`/config key/entry symbol that `file_index`/`config_index`/`symbol_index` no longer contains | Re-tracing the runtime flow when the code moved |

Staleness is thus **detectable mechanically** for everything generated *and* for §4A code citations; only the reverse-engineering narrative itself needs a human/agent to re-trace when the drift lint fires.

---

## 9. Phased roadmap

| Phase | Outputs | Effort | Done when |
|---|---|---|---|
| **1 — Restructure + generators** | Create `engineering_docs/` + `ai_generated/` + `docs/` reshape; freeze `.md/`→`archive/`; move `design-proposals*`→`adr/`; add `features.seed.yaml`, full-EDD/mini-EDD/ADR templates (with §4A spine), `FrameworkAtlas.md` shell; build `tools/lib/ast.js` + `gen-indexes.js` + `gen-feature-index.js` + `gen-config-index.js` + `gen-search-index.js`; wire `npm run docs:index` + pre-commit hook + CI staleness + §4A drift lint; edit stale L1 files | ~2–3 days | `npm run docs:index` produces all L4 JSON deterministically; CI staleness green; Atlas routes L0→file in ≤2 reads; no `ai_context/` file >150 lines |
| **2 — Tiered EDDs** | 5 full EDDs (risk order: lifecycle → auto-correlation → debug-replay → reporting → config), each reverse-engineered per §4A with `file:line` evidence; mini-EDDs for remaining features | ~4–6 days | Every feature in `feature_index` has an EDD/mini-EDD; each links L1 contracts + risks; every §4A claim passes the drift lint |
| **3 — Published docs** | `getting-started`, `installation`, generated `cli-reference` + `configuration`, examples, FAQ, troubleshooting, migration, release-notes — all derived per §4 rule | ~3–4 days | No L3 page duplicates L2; each has a code/L2 source |
| **4 — Onboarding** | `docs/onboarding/` from KT_* + a guided path; "day-1 engineer" walkthrough | ~2 days | New engineer reaches first passing run using only L3 |
| **5 — Presentation** | Architecture deck / diagrams generated from `framework_map.json` + `dependency_graph.json` | ~1–2 days | Deck regenerates from indexes |

---

## 10. Risks, open questions, decisions needed before Phase 1

**Risks**
- **§4A maintenance cost:** deep reverse-engineering is the most valuable *and* most drift-prone content. Mitigation: the §4A drift lint (8c) ties every claim to a citation that indexes can verify; narrative re-tracing is required only when a citation breaks, not on every commit.
- **Generator determinism on Windows:** path separators, CRLF, `readdir` ordering can make JSON diffs noisy → false staleness failures. Mitigation: normalize `\`→`/`, sort all arrays, LF-only output, `.gitattributes`.
- **`call_graph.json` precision:** dynamic dispatch/barrels make module-level the honest ceiling. Mitigation: ship module-level in Phase 1.5, label `partial`.
- **Feature-seed drift:** authors forgetting a `features.seed.yaml` row makes a feature invisible to routing. Mitigation: CI lint — every `src/` top-level feature dir must map to ≥1 seed entry.
- **Two-write burden:** contracts in L1 + EDDs in L2 risks re-explaining. Mitigation enforced by standard: contracts live only in L1; EDDs link.

**Open questions (need your call before Phase 1)**
1. **Pre-commit hook vs CI-only** for the staleness/drift checks — hook = faster feedback but local friction (needs Node + `tsc`). Default: **both**, hook warns, CI gates. OK?
2. **`core_engine/DOCS_METHODS.md` and root `graph.html`:** delete now, or keep until `symbol_index`/`dependency_graph` are proven in Phase 1? Default: **keep one phase, delete in Phase 2.**
3. **`.env` / secrets in `environment_index`:** confirm indexing only **names + templates**, never values. Default: names only.
4. **Diagram tooling for EDD sequence/state diagrams:** Mermaid (renders in GitHub, diff-able) vs committed images. Default: **Mermaid**.
5. **npm script namespace:** `docs:index`, `docs:check`, `docs:reference` vs a single `docs:build`? Default: separate scripts.

---

**STOP — awaiting approval.** On approval I begin Phase 1 only, in the order above. No files outside this proposal have been touched.
