# ROLE
You are the Documentation Architect for this repository (K6-PerfFramework).
Documentation here is treated as source code: outdated docs are bugs.

# TASK — DESIGN ONLY
Produce ONE design document: `ai_context/knowledge-architecture-proposal.md` (max ~600 lines).
Do NOT create any other files, do NOT generate documentation, indexes, or diagrams,
and do NOT modify existing files in this task. Implementation happens in later,
separately approved phases.

# STEP 0 — AUDIT BEFORE DESIGNING (mandatory)
Before proposing anything, inventory what already exists and report findings:
- `ai_context/` — 28 files (~3,600 lines). Assess: overlap, staleness, gaps,
  which files are actually load-bearing vs dead weight.
- `docs/` — technical reference, KT guides, configuration reference.
- `AGENT-CONTEXT.md` (~1,841 lines) — legacy monolith; propose its fate.
- `.agent/rules`, `.claude/`, `tools/generate-technical-reference.js`.
- Source of truth for code: `core_engine/src/` (~95 TS files, 15 layers),
  `config/`, `templates/`, `testSuites/`, `tools/`.
- EXCLUDE from all analysis and indexing: `node_modules/`, `dist/`, `k6-master/`
  (vendored upstream), `results/`, `.tmp-*`.
Your proposal must state, per existing file: keep / merge / split / delete / move.
Do not propose a parallel structure that duplicates what exists.

# TARGET AUDIENCES (in priority order)
1. AI agents (token-optimized routing)
2. Framework developers
3. New engineers onboarding
4. Framework users (published docs)

# QUESTIONS THE SYSTEM MUST ANSWER
Which file owns a feature; where execution begins; which files/config/classes
relate to a feature; extension points; blast radius of a change; which tests to
run; why the architecture was chosen; where to make a modification.

# DESIGN CONSTRAINTS
1. Four layers, but YOU decide the exact file set — justify every file:
   - L1 AI Context (`ai_context/`): small routing/rules files. Hard budget:
     no file over 150 lines; total layer under 4,000 lines. Handwritten.
   - L2 Engineering docs (`engineering_docs/` or a reorganized `docs/` — you
     decide and justify): canonical source of truth. EDDs are TIERED:
     full EDD (all sections) only for the 3–5 highest-risk subsystems
     (use `risk-zones.md` / `fragile-areas.md` to pick); a 1-page mini-EDD
     template for everything else. Propose both templates.
   - L3 Published docs: generated/derived from L2, never hand-duplicated.
     Define the derivation rule, not the content.
   - L4 Generated indexes (`ai_generated/`, JSON): feature_index, file_index,
     dependency_graph, config_index, etc. — but ONLY indexes that a committed
     script in `tools/` can regenerate deterministically from the repo.
     If it can't be script-generated, it doesn't belong in L4. For each index:
     name, schema sketch, generator approach, regeneration trigger.
2. Progressive loading strategy (extend the existing one in `overview.md` and
   `token-optimization-guide.md`, don't reinvent it):
   L0 always-load set (state exact files + token estimate) → L1 feature routing
   → L2 detailed doc → L3 ADR/history only on demand.
3. Framework Atlas: one navigation document (`FrameworkAtlas.md`). Specify its
   sections and which parts are generated vs handwritten. It routes; it does
   not explain.
4. Synchronization must be MECHANICAL, not aspirational. Propose:
   - A change-to-docs mapping table (source path pattern → docs/indexes to touch).
   - A checklist encoded in `ai_context/ai-workflow.md` (and/or CLAUDE.md /
     `.agent/rules`) so any future agent session inherits the obligation.
   - Which steps are automatable (script/CI/git hook) vs manual, and the
     staleness detection method (e.g., index regeneration diff check).
   Do not claim ongoing personal responsibility — persist the rules in files.

# DELIVERABLE — SECTIONS OF THE PROPOSAL DOC
1. Audit findings (current-state map + per-file disposition of ai_context/, docs/, AGENT-CONTEXT.md)
2. Target folder structure, with ownership per folder (handwritten vs generated, who updates, when)
3. Naming conventions and doc standards (front-matter, size budgets, cross-reference style)
4. Layer design (L1–L4 as constrained above)
5. Loading strategy with token estimates per level
6. Index catalog (schema + generator + trigger per index)
7. Framework Atlas outline
8. Synchronization mechanism (mapping table + checklist + automation plan)
9. Phased roadmap: Phase 1 restructure ai_context + templates + generator scripts;
   Phase 2 tiered EDDs (highest-risk first); Phase 3 published docs; Phase 4 onboarding;
   Phase 5 presentation assets. Each phase: outputs, effort estimate, done-criteria.
10. Risks, open questions, and decisions you need from me before Phase 1

# SUCCESS CRITERIA
- Every proposed file has a stated purpose no other file serves (zero duplication).
- An agent can route from L0 to the right source file in ≤2 doc reads.
- Every L4 index has a named generator script; nothing generated is hand-edited.
- Existing ai_context content is accounted for — nothing silently orphaned.
- The whole proposal fits in one file I can review in one sitting.

# PROCESS
Audit → ask me your open questions (batched, once) → write the proposal →
STOP and wait for my approval before any Phase 1 work.
