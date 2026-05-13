# Architecture Evolution

> How the framework evolved over time. Use this to understand architectural trajectory.

## Timeline

### Phase 1 — Foundation (2026-03-21)
Core skeleton: config management, scenario builder, parallel execution, data layer, CLI init/validate/run. 27 items complete.

### Phase 2 — Productivity (2026-03-26 → 2026-04-02)
HAR generation, recording layer, script converter, debug replay, diff reporting. Interactive domain selection, replay metadata, binary content detection.

### Phase 3 — Enterprise Control (2026-03-26 → 2026-04-06)
Correlation engine, SLA assertions, reporter stubs, gatekeeper validation. Transaction naming standardized (removed `txn_` prefix).

### Lifecycle/Reporting Architecture (2026-04-06)
Major architecture expansion: 12 tasks planned and baselined.
- Runtime contracts extended (errorBehavior → 4 modes)
- 5 runtime helpers created (Lifecycle, Error, Metrics, Snapshot, Timeseries)
- Scenario metadata injection (K6_PERF_* env vars)
- Reporting pipeline (6 new artifact types)
- Phase-based script contract (initPhase/actionPhase/endPhase)
- Lifecycle helper bridge for k6-side execution
- Host monitoring with periodic sampling

### Lifecycle Overhaul (2026-04-09)
VU target interpolation replaced single ramp-down detection. All executor types now support lifecycle correctly.

### Cookie Persistence Fix (2026-04-08)
Root cause of 302 errors found: k6 default clears cookies between iterations. Framework switched to `noCookiesReset: true` default.

### Schema-Driven DX (2026-05-07)
6-phase DX improvement: JSON Schemas, `$schema` wiring, Levenshtein validation, templates, JSONC support, CLI enhancements (features, config inspect, new, docs).

### Transaction Counter Metrics (2026-05-13)
Added k6 Counter metrics per transaction for authoritative execution counts.

## Architectural Trajectory

```
Simple k6 wrapper → HAR generation → Debug replay → Enterprise SLA
  → Phase-based lifecycle → Artifact-first reporting → Schema-driven DX
    → [Future: AI integration, runtime streaming, full packaging]
```

## What's Next (Planned but Not Implemented)

1. **Phase 4: AI integration** — auto-correlation, anomaly detection, trend analysis
2. **Request-level runtime streaming** — errors/warnings per request, not just end-of-run summary
3. **Snapshot-on-failure** — JSON request/response capture for failed assertions
4. **Full npm packaging** — dual ESM/CJS build, published `@k6-perf/core-engine`
5. **Unit/integration tests** — none exist currently
6. **Multi-point timeseries** — runtime bucket streaming during execution
7. **Cross-tab synchronized filtering** — global time filter across report tabs
8. **Richer chart library** — beyond baseline HTML/CSS charts
