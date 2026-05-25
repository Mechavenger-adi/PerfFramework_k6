# Schema-Driven DX — Implementation Tasks

> **Strategy doc:** [schema-driven-dx-strategy.md](file:///C:/Users/aditk/.gemini/antigravity/brain/4d9823d2-5708-45e4-8439-1d1ee1a4af58/artifacts/schema-driven-dx-strategy.md)

---

## Phase 1: JSON Schema Files (P0 — Editor-Agnostic IntelliSense)

> Uses `$schema` property in each JSON file — works in **any** JSON Schema-aware editor (VS Code, JetBrains, Sublime LSP, Neovim LSP, Eclipse, etc.)

- [x] **1.1** Create `config/schemas/runtime_settings.schema.json` — full schema with descriptions, defaults, enums
- [x] **1.2** Create `config/schemas/test-plan.schema.json` — covers all plan fields including SLAs, debug, hybrid
- [x] **1.3** Create `config/schemas/environment.schema.json` — environment config schema
- [x] **1.4** Add `$schema` to `config/runtime_settings/default.json`
- [x] **1.5** Add `$schema` to `config/test_plans/load_test.json`
- [x] **1.6** Add `$schema` to `config/test_plans/webui-load_test.json`
- [x] **1.7** Add `$schema` to `config/environments/dev.json`
- [x] **1.8** Update `SchemaValidator.ts` to load schemas from `.schema.json` files instead of inline objects
- [x] **1.9** Update `init.ts` scaffold to include `$schema` in generated configs
- [x] **1.10** Verify: open configs in editor → confirm autocomplete, hover, validation all work

## Phase 2: Validation UX (P1 — Actionable Errors)

- [ ] **2.1** Enhance `SchemaValidator.runValidation()` with human-readable enum error messages
- [ ] **2.2** Add "did you mean?" suggestions for misspelled field names
- [ ] **2.3** Print available fields when a required field is missing
- [ ] **2.4** Add `validate --verbose` flag for config completeness score

## Phase 3: Template Library (P2)

- [ ] **3.1** Create `config/templates/test_plans/` with 6–8 starter templates
- [ ] **3.2** Create `config/templates/runtime_settings/` with 4 presets
- [ ] **3.3** Add `_meta` block to templates for discoverability
- [ ] **3.4** Add CLI `templates list` and `templates show <name>` commands
- [ ] **3.5** Strip `_meta` and `$schema` during config load (so they don't break validation)

## Phase 4: JSONC Support (P1)

- [ ] **4.1** Add `jsonc-parser` dependency
- [ ] **4.2** Update `ConfigurationManager` and `TestPlanLoader` to parse JSONC
- [ ] **4.3** Add inline comments to template configs

## Phase 5: CLI Enhancements (P3)

- [ ] **5.1** Add `features` discovery command
- [ ] **5.2** Add `config inspect` command for resolution chain visualization
- [ ] **5.3** Basic interactive wizard for `new` command

## Phase 6: Documentation Automation (P3)

- [ ] **6.1** Schema → Markdown reference doc generator script
- [ ] **6.2** Integrate with existing `AGENT-CONTEXT.md` update workflow
