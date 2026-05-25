# Reporting Contracts

> Artifact schemas, report pipeline, and CI/CD integration contracts.

## Run Artifact Directory Layout

```
results/<PlanName>/Run_<timestamp>/
  ├── summary.json              — k6 native summary
  ├── transaction-metrics.json  — per-transaction performance matrix
  ├── ci-summary.json           — CI gate artifact
  ├── errors.ndjson             — structured error events
  ├── warnings.ndjson           — structured warning events
  ├── timeseries.json           — bucketed time-series data
  ├── system-metrics.json       — host CPU/memory snapshots
  ├── run-manifest.json         — run metadata + artifact paths
  ├── RunReport.html            — unified HTML report (7 tabs)
  ├── TestDetails.html          — legacy HTML (preserved for compat)
  └── TestSummary.html          — legacy HTML (preserved for compat)
```

## transaction-metrics.json Schema

```json
{
  "transactions": [
    {
      "name": "Homepage",
      "count": 100,
      "pass": 98,
      "fail": 2,
      "avg": 245.3,
      "min": 120.0,
      "max": 890.5,
      "p(90)": 450.0,
      "p(95)": 600.0,
      "p(99)": 850.0
    }
  ],
  "columns": ["count", "pass", "fail", "avg", "min", "max", "p(90)", "p(95)", "p(99)"]
}
```

Columns configurable via `runtime.reporting.transactionStats`.

## ci-summary.json Schema

```json
{
  "status": "passed" | "failed",
  "runId": "string",
  "planName": "string",
  "environment": "string",
  "timestamp": "ISO-8601",
  "transactionCount": 0,
  "errorCount": 0,
  "warningCount": 0,
  "thresholdFailures": [...],
  "transactions": [...]
}
```

## errors.ndjson Schema (one JSON per line)

```json
{
  "timestamp": "ISO-8601",
  "type": "check_failure" | "execution_failure",
  "journey": "string",
  "transaction": "string",
  "message": "string",
  "agent": { "hostname": "string", "pid": 0 }
}
```

## warnings.ndjson Schema (one JSON per line)

```json
{
  "timestamp": "ISO-8601",
  "type": "threshold_breach" | "high_cpu" | "high_memory",
  "message": "string",
  "metric": "string",
  "agent": { ... }
}
```

## timeseries.json Schema

```json
{
  "overview": [{ "timestamp": "ISO-8601", "requests": 0, "iterations": 0, "errorRate": 0, "avgDuration": 0, "p95Duration": 0, "vus": 0 }],
  "transactions": { "Homepage": [{ "timestamp": "...", "count": 0, "avg": 0, "p90": 0, ... }] },
  "events": [{ "timestamp": "...", "type": "error|warning", "message": "..." }],
  "system": [{ "timestamp": "...", "cpuPercent": 0, "memoryPercent": 0 }]
}
```

## RunReport.html Tabs

| Tab | Data Source |
|-----|------------|
| Summary | ci-summary.json + transaction-metrics.json |
| Graphs | timeseries.json (Chart.js bar + doughnut) |
| Transactions | transaction-metrics.json |
| Errors | errors.ndjson |
| Warnings | warnings.ndjson |
| Snapshots | (reserved, not yet implemented) |
| System | system-metrics.json |

## CI/CD Integration Pattern

```yaml
# Pipeline reads ci-summary.json, not console output
- run: npm run cli -- run --plan config/test_plans/load_test.json
- run: |
    status=$(jq -r '.status' results/*/Run_*/ci-summary.json)
    if [ "$status" != "passed" ]; then exit 1; fi
```
