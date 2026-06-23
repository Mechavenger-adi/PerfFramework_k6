# Subsystem Boundaries

> Layer ownership rules — which module owns which responsibility.

## Boundary Map

### CLI Layer — Orchestration Only
**Owns:** Command registration, argument parsing, workflow orchestration, user interaction (prompts).
**Does NOT own:** Business logic, data structures, validation rules, report rendering.
**Rule:** CLI commands should be thin orchestrators that delegate to engine layers.

### Config Layer — Configuration Loading & Validation
**Owns:** Config file reading, merge precedence, schema validation, runtime config access, pre-flight checks.
**Does NOT own:** Scenario construction, execution, reporting.
**Rule:** Config layer produces a `ResolvedConfig` — consumers should not re-read config files.

### Scenario Layer — Test Plan → k6 Scenarios
**Owns:** Test plan parsing, workload model construction, executor factory, scenario building, phase envelope computation.
**Does NOT own:** k6 execution, VU allocation (delegated to Execution), threshold injection (delegated to Assertions).

### Execution Layer — k6 Process Management
**Owns:** k6 process spawning (sync + async), VU allocation, host monitoring, run directory management.
**Does NOT own:** Scenario construction, reporting artifact generation.

### Runtime Layer — TypeScript-Side Runtime Contracts
**Owns:** Lifecycle contracts, structured error/warning creation, metric aggregation helpers, snapshot helpers, timeseries helpers.
**Does NOT own:** k6-side runtime execution (that's in Utils).
**Note:** Currently scaffolded — not yet deeply wired into execution.

### Data Layer — Data File Management
**Owns:** CSV/JSON loading, data validation, pool management, overflow strategies, dynamic value generation.
**Does NOT own:** How data is used in scripts (that's script-side).

### Recording Layer — Script Generation & Conversion
**Owns:** HAR parsing, domain filtering, transaction grouping, script generation, script conversion.
**Does NOT own:** Debug replay execution (that's Debug layer).

### Correlation Layer — Dynamic Value Extraction
**Owns:** Rule processing, extractor registry, correlation engine, fallback handling.
**Does NOT own:** How correlation values are used in scripts.

### Assertions Layer — SLA & Threshold Management
**Owns:** SLA registration, k6 threshold generation, post-run SLA evaluation.
**Does NOT own:** Metric collection (that's k6-side transaction.ts).

### Debug Layer — Replay & Diff
**Owns:** Replay execution, diff comparison, HTML report generation, exchange log building, recording log resolution.
**Does NOT own:** Normal load execution, reporting artifacts.

### Reporting Layer — Artifact Generation
**Owns:** Transaction metrics, error/warning events, CI summary, timeseries, unified HTML report, artifact writing.
**Does NOT own:** k6 execution, data collection during run.

### Reporters Layer — External Sinks
**Owns:** Result transformation, external push integrations.
**Status:** Stub implementations only.

### Utils Layer — Shared Utilities
**Owns (Node-side):** Logging, progress bar, path resolution.
**Owns (k6-side):** Transaction metrics, replay logging, session management, lifecycle orchestration.
**Rule:** Utils must not import from any engine layer except Types.

### Types Layer — Contracts
**Owns:** All TypeScript interfaces and type definitions.
**Rule:** Types must not import from any other layer. It's the leaf dependency.
