# VU Lifecycle Prototype Files

Original framework files were left untouched.

## Backups

- `core-engine/src/types/TestPlanSchema.ts.bak-2026-04-05`
- `core-engine/src/config/SchemaValidator.ts.bak-2026-04-05`
- `core-engine/src/config/GatekeeperValidator.ts.bak-2026-04-05`
- `core-engine/src/scenario/ScenarioBuilder.ts.bak-2026-04-05`
- `core-engine/src/recording/ScriptGenerator.ts.bak-2026-04-05`
- `core-engine/src/recording/ScriptConverter.ts.bak-2026-04-05`

## Working Copies

- `core-engine/src/types/TestPlanSchema.lifecycle-prototype.ts`
- `core-engine/src/config/SchemaValidator.lifecycle-prototype.ts`
- `core-engine/src/config/GatekeeperValidator.lifecycle-prototype.ts`
- `core-engine/src/scenario/ScenarioBuilder.lifecycle-prototype.ts`
- `core-engine/src/recording/ScriptGenerator.lifecycle-prototype.ts`
- `core-engine/src/recording/ScriptConverter.lifecycle-prototype.ts`

## What The Prototype Covers

- Adds `lifecycle.init` and `lifecycle.end` to the copied test-plan schema.
- Validates lifecycle config in the copied schema validator.
- Adds lifecycle guardrails in the copied gatekeeper validator.
- Computes and injects `K6_PERF_PHASES` in the copied scenario builder.
- Generates lifecycle-aware scripts with per-VU state in the copied script generator.
- Wraps converted scripts into `runInit`, `runAction`, and `runEnd` phases in the copied script converter.

## Validation

- Ran `cmd /c npm exec tsc -- --noEmit` successfully after creating the copied prototype files.
