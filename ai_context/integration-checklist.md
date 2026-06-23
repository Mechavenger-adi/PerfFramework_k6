# Integration Checklist

> Steps to follow when adding any new feature to the framework.

## Before Writing Code

- [ ] Read `architecture-laws.md` — confirm your change doesn't violate any law
- [ ] Read `module-map.md` — identify which files you need to touch
- [ ] Read `change-impact-map.md` — understand blast radius
- [ ] Check `known-tech-debt.md` — is this area already flagged?
- [ ] Check `decisions.md` — has this approach been discussed/rejected before?

## Implementation Steps

### 1. Type Contracts First
- [ ] Define TypeScript interfaces in `core_engine/src/types/`
- [ ] If config-facing, update the JSON Schema in `config/schemas/`
- [ ] If config-facing, update `SchemaValidator.ts` inline fallback schema

### 2. Config Integration
- [ ] Add defaults to `FRAMEWORK_DEFAULTS` in `ConfigContracts.ts`
- [ ] Add typed accessors to `RuntimeConfigManager.ts` if needed
- [ ] Ensure backward compatibility — old configs must still validate

### 3. Core Implementation
- [ ] Place code in the correct layer (see `subsystem-boundaries.md`)
- [ ] Respect dependency direction (see `dependency-rules.md`)
- [ ] Export from `core_engine/src/index.ts` if it's part of the public API

### 4. CLI Wiring
- [ ] Register command/option in `core_engine/src/cli/run.ts`
- [ ] Add to CLI help text
- [ ] Wire into the execution pipeline

### 5. Reporting Integration
- [ ] If the feature produces metrics → update `TransactionMetricsBuilder`
- [ ] If the feature produces events → update `EventArtifactBuilder`
- [ ] If the feature affects CI gating → update `RunSummaryBuilder`
- [ ] If the feature needs HTML rendering → update `RunReportGenerator`

### 6. k6-Side Changes
- [ ] If touching `utils/*.ts` k6-side files → rebuild `dist/` via `tsc`
- [ ] Test that k6 can load the compiled JS (no Node.js imports)
- [ ] Verify `K6_PERF_*` env vars are documented in `runtime-contracts.md`

### 7. Documentation Sync
- [ ] Update `AGENT-CONTEXT.md` change log
- [ ] Update `ai_context/` affected files
- [ ] Update `HOW_TO_USE_FRAMEWORK.md` if user-facing
- [ ] Update `FRAMEWORK-IMPLEMENTATION-TODO.md` if task-tracked

## Verification

- [ ] `npm exec tsc -- --noEmit` passes
- [ ] Existing CLI commands still work
- [ ] Existing debug replay still works
- [ ] New feature works as expected
- [ ] Artifacts are generated correctly
