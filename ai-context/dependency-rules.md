# Dependency Rules

> Import direction and coupling constraints.

## Layer Dependency Matrix

| Layer | May Import From |
|-------|----------------|
| CLI | Config, Scenario, Execution, Recording, Debug, Reporting, Utils, Types |
| Config | Types, Utils |
| Scenario | Types, Config, Utils |
| Execution | Scenario, Config, Runtime, Assertions, Reporting, Reporters, Utils |
| Runtime | Types, Utils |
| Data | Types, Utils |
| Recording | Types, Correlation, Utils |
| Assertions | Types, Config |
| Correlation | Types |
| Debug | Recording, Runtime, Utils, Types |
| Reporters | Types |
| Reporting | Types, Runtime, Assertions, Utils |
| Utils | Types |
| Types | Nothing (leaf) |

## Prohibited Dependencies

- **Types** → must not import anything
- **Utils** → must not import from Config, Scenario, Execution, etc.
- **Recording** → must not import from Execution (no circular dependency)
- **Debug** → must not import from CLI (prevents circular CLI→Debug→CLI)
- **Reporting** → must not import from Execution or CLI

## k6-Side Import Rules

Files that run inside k6 (`transaction.ts`, `replayLogger.ts`, `session.ts`, `lifecycle.ts`):
- Import from each other via relative paths to `dist/utils/`
- MUST NOT import Node.js built-ins (`fs`, `path`, `child_process`, `os`)
- MUST NOT import from `core-engine/src/` directly (always `dist/`)
- CAN import k6 modules (`k6`, `k6/http`, `k6/metrics`, `k6/execution`)

## npm Dependencies

| Package | Used By | Purpose |
|---------|---------|---------|
| `commander` | CLI | Command parsing |
| `ajv` + `ajv-formats` | SchemaValidator | JSON Schema validation |
| `dotenv` | EnvResolver | `.env` file loading |
| `jsonc-parser` | ConfigurationManager, TestPlanLoader | JSONC parsing |
| `yargs` | (legacy, may be removable) | Arg parsing |

## Schema as Source of Truth

```
config/schemas/*.schema.json
  ↓ consumed by
SchemaValidator.ts (runtime validation)
  ↓ derived from
ConfigContracts.ts + TestPlanSchema.ts (TypeScript types)
  ↓ feeds
IDE IntelliSense (via $schema property in config files)
docs/configuration-reference.md (via docs CLI command)
```

If you change a TypeScript type, check if the JSON Schema needs updating, and vice versa.
