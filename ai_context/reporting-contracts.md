# Reporting Contracts

> Artifact schemas, report pipeline, and CI/CD integration contracts.

## Run Artifact Directory Layout

```
results/<PlanName>/Run_<timestamp>/
  ├── handleSummary.json        — k6 native summary (the ONLY k6 summary artifact)
  ├── run-summary.json          — CI gate + per-transaction performance matrix
  ├── errors.ndjson             — structured error events
  ├── warnings.ndjson           — structured warning events
  ├── timeseries.json           — bucketed time-series data
  ├── system-metrics.json       — host CPU/memory snapshots
  ├── snapshots.json            — request/response captured at failure
  ├── run-manifest.json         — run metadata + artifact paths
  ├── <testId>_<host>_request_metric.csv     — one row per HTTP request
  ├── <testId>_<host>_transaction_metric.csv — one row per transaction iteration
  ├── RunReport.html            — unified HTML report
  └── TestSummary.html          — k6 web-dashboard export
```

**Not retained by default:** `metrics-stream.json` (the raw k6 `--out json=` firehose) is
an INPUT only — `timeseries.json` and the mergeable histogram are derived from it — and
is the largest file a run produces, so it is deleted once the report is built. Set
`K6_PERF_KEEP_RAW=1` or `reporting.timeseries.keepRawMetricsStream: true` to keep it.

**Consolidated 2026-07-21:** `transaction-metrics.json` + `ci-summary.json` → `run-summary.json`
(each previously carried its own copy of the per-transaction array), and `summary.json`
(k6 `--summary-export`) was dropped — it held the same metrics as `handleSummary.json` but
without the metric `type`/`contains` metadata, `options` and `state`, in a larger file.

## run-summary.json Schema

Run-level CI gate at the top level, plus the full per-transaction table.

```json
{
  "status": "passed" | "failed",
  "runId": "string",
  "plan": "string",
  "environment": "string",
  "thresholdFailures": 0,
  "transactionFailureRate": 0.0,
  "transactionErrorBudget": 1,
  "errorCount": 0,
  "warningCount": 0,
  "aborted": false,
  "stats": ["count", "pass", "fail", "avg", "min", "max", "std", "p(90)", "p(99)"],
  "transactions": [
    {
      "journey": "buy_working_covert",
      "transaction": "add_to_cart",
      "count": 100,
      "pass": 98,
      "fail": 2,
      "errorPct": 2.0,
      "avg": 245.3,
      "min": 120.0,
      "max": 890.5,
      "std": 42.1,
      "p(90)": 450.0,
      "p(99)": 850.0
    }
  ]
}
```

`stats` lists the columns present on each row, configurable via
`runtime.reporting.transactionStats`.

**Transaction identity is (journey/scenario, transaction).** Same-named transactions in
different journeys are SEPARATE rows — k6's end-of-test summary collapses same-named
`group()`s across scenarios, so the table is rebuilt from the transaction CSV, which keeps
k6's per-sample `scenario` tag.

**Pass/fail source (since 2026-06-15):** `pass`/`fail` come solely from the exact per-iteration `<name>_checkrate` Rate metric (`pass + fail === count` by construction). The old native-`check()`-aggregate estimation path — and the `estimated` per-row flag + file-level `hasEstimatedRows` + warning banner — was removed; `ScriptContractGuard` now rejects scripts using raw k6 `check()`/`group()`, so a checkrate always exists. A transaction lacking a checkrate renders blank rather than guessing.

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
| Summary | run-summary.json |
| Graphs | timeseries.json (Chart.js bar + doughnut) |
| Transactions | run-summary.json (`transactions[]`) |
| Errors | errors.ndjson |
| Warnings | warnings.ndjson |
| Snapshots | snapshots.json |
| System | system-metrics.json |

### Error ↔ snapshot identity

Every `errors.ndjson` row and every `snapshots.json` entry carries the same
occurrence identity, and the Errors tab joins them on it:

`machine` + `vu` + `iteration` + `requestId` → `machine` + `vu` + `iteration` + `transaction` → `transaction`

`requestId` is the `har_entry_id` also tagged onto that request's metrics. It is
**not globally unique** — `nextRequestId()` counts per VU and converted scripts
hard-code `replay.id` values that repeat for every VU — so it is only ever
compared within a machine+VU+iteration scope. `machine` is stamped by
`MergedReportBuilder` on distributed runs and absent (empty) on local ones, which
compares equal on both sides.

A row that carries its own `vu`/`iteration` but matches no snapshot gets **no**
View button; only aggregate rows (null `vu`/`iteration`) fall back to the
transaction-wide snapshot. Status shown in the Errors table always comes from the
**event**, never from the joined snapshot.

## CI/CD Integration Pattern

```yaml
# Pipeline reads run-summary.json, not console output
- run: npm run cli -- run --plan config/test_plans/load_test.json
- run: |
    status=$(jq -r '.status' results/*/Run_*/run-summary.json)
    if [ "$status" != "passed" ]; then exit 1; fi
```

> **Migrating from `ci-summary.json`:** the gate fields kept their names and their
> position at the top level, so only the filename changes — `jq -r '.status'` is
> unchanged. Rows in `transactions[]` now also carry `journey` (the scenario) and the
> full stat set (`std`, `p(90)`, …), which the old ci-summary subset lacked.
