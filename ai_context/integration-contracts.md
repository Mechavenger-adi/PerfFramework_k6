# Integration Contracts

> Cross-layer API contracts that must be maintained.

## Config → Scenario

`ParallelExecutionManager.resolve(plan, runtimeMetadata?)` returns `K6Options`:
```typescript
{
  scenarios: Record<string, K6ScenarioDefinition>;
  thresholds: Record<string, string[]>;
  noCookiesReset: boolean;
  summaryTrendStats: string[];
}
```

`ScenarioRuntimeMetadata`:
```typescript
{
  runtime: {
    thinkTime: { mode: 'fixed'|'random', fixed?: number, min?: number, max?: number };
    errorBehavior: string;
    pacing: { enabled: boolean, targetIntervalMs?: number };
  };
  reporting: { transactionStats: string[] };
}
```

## Scenario → k6 (via env vars)

| Env Var | Type | Consumer |
|---------|------|----------|
| `K6_PERF_RUN_ID` | string | Reporting artifact naming |
| `K6_PERF_PLAN_NAME` | string | Report titles |
| `K6_PERF_ENVIRONMENT` | string | Report metadata |
| `K6_PERF_EXECUTION_MODE` | string | Lifecycle routing |
| `K6_PERF_REPORT_DIR` | string | Artifact output path |
| `K6_PERF_JOURNEY_NAME` | string | Per-journey identification |
| `K6_PERF_EXEC_NAME` | string | k6 exec function name |
| `K6_PERF_SCENARIO_METADATA` | JSON | Scenario-specific config |
| `K6_PERF_RUNTIME_METADATA` | JSON | Runtime config for lifecycle.ts |
| `K6_PERF_PHASES` | JSON | Phase envelope for VU lifecycle |
| `K6_PERF_DEBUG` | 'true' | Enables replay logging |

## Reporting Pipeline Contract

```
k6 handleSummary.json
  ↓
TransactionMetricsBuilder ─┐
RunSummaryBuilder          ─┴→ run-summary.json (CI gate + per-transaction table)
EventArtifactBuilder       → errors.ndjson, warnings.ndjson
TimeseriesArtifactBuilder  → timeseries.json
RunReportGenerator         → RunReport.html
```

Each builder receives:
- `summaryPath: string` — path to k6 summary.json
- `runDir: string` — output directory
- `plan: TestPlan` — original test plan
- `manifest: RunManifest` — run metadata

## Replay Log Entry Contract

`replayLogger.ts` outputs lines matching `[k6-perf][replay-log]` prefix with JSON:
```typescript
{
  harEntryId: string;
  transaction: string;
  iteration: number;
  vu: number;
  sequence: number;
  request: { method, url, headers, body, cookies, queryParams };
  response: { status, headers, body, cookies };
  duration: number;
  variableEvents: Array<{ name, type, action, value, source }>;
}
```

## SLA Threshold Contract

`ThresholdManager.apply(plan)` produces `Record<string, string[]>`:

| SLA Tier | k6 Threshold Key Pattern |
|----------|-------------------------|
| `global_sla` | `http_req_duration` |
| `journey_slas[name]` | `http_req_duration{scenario:name}`, `http_req_failed{scenario:name}` |
| `transaction_slas[name]` | Transaction Trend metric name |

Percentile keys match `/^p(\d+(?:\.\d+)?)$/` — any `pNN` or `pNN.N` pattern.
