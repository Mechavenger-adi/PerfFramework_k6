# Replay & Debug Contracts

> How the debug replay system works, its contracts, and its failure modes.

## Debug Replay Pipeline

```
Journey script (with logExchange calls)
  → k6 runs with K6_PERF_DEBUG=true, VUs=1
  → stdout contains [k6-perf][replay-log] JSON lines
  → ReplayRunner extracts entries + k6 errors + k6 metrics
  → DiffChecker compares recording log vs replay entries
  → HTMLDiffReporter generates interactive HTML report
```

## Recording Log Format

Created by `ExchangeLogBuilder.fromGroups()` during HAR generation. Stored at `scrum-suites/<team>/recordings/<script>.recording-log.json`.

```json
[
  {
    "harEntryId": "req_0",
    "transaction": "t01_launch",
    "tags": { "transaction": "t01_launch", "har_entry": "req_0" },
    "request": {
      "method": "GET",
      "url": "https://example.com/",
      "headers": { ... },
      "body": null,
      "cookies": [],
      "queryParams": []
    },
    "response": {
      "status": 200,
      "headers": { ... },
      "body": "<html>...",
      "cookies": []
    },
    "variableEvents": []
  }
]
```

## Recording Log Resolution Strategy

`RecordingLogResolver.resolve(scriptPath, explicit?)`:

1. **Explicit path** — user-provided `recordingLogPath`
2. **Registry** — `.recording-index.json` in team recordings folder
3. **Expected path** — `<script-name>.recording-log.json` in same recordings folder
4. **Fuzzy match** — filename similarity search

Returns `RecordingLogResolution { status, paths, candidates, warnings }`.

## Replay Entry Matching

`DiffChecker.compareTaggedLogs()`:

1. Group entries by iteration
2. Match by `harEntryId` (strict)
3. Fallback match by `method + URL` (loose)
4. Classify: `matched` | `missing_in_replay` | `extra_in_replay`

## Diff Scoring

- **Headers:** Match/mismatch/missing/extra classification
- **Bodies:** Levenshtein similarity percentage (lightweight for large bodies)
- **Status:** Exact match vs mismatch
- **Redirect awareness:** Recording 302 + replay 200 → redirect warning, score adjustment

## HTML Report Features

- **Report title:** "Replay Insights"
- **Iteration selector** with summary stats per iteration
- **Per-section search** with scope (All/URL/Request Body/Response Body/Headers)
- **Scroll sync** toggle between Recorded/Replayed panes
- **Decoded/Raw toggle** for percent-encoded values
- **Performance Metrics section** with k6 checks, HTTP metrics, transaction timings (sortable)
- **Variable events table** showing correlation/parameterization usage
- **Color-coded match scores** (good/warn/bad)
- **Sticky request title** bar

## Binary Content Handling

Three-layer detection:
1. **replayLogger.ts** — checks Content-Type + URL extension before JSON.stringify
2. **ExchangeLog.ts** — checks mimeType + URL during recording log creation
3. **ReplayRunner.ts** — checks URL extension when loading recording log from disk

Binary bodies replaced with `[binary: content-type]` or `[binary: static asset]` placeholder.

## Known Failure Modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Empty replay entries | Script missing `logExchange()` calls | Convert script or add calls manually |
| `K6_PERF_DEBUG` not set | `ReplayRunner` not injecting env var | Check `runDebug()` env injection |
| JSON parse errors | Binary content in body field | Check binary detection in replayLogger |
| 302 status mismatches | k6 follows redirects, recording captured 302 | DiffChecker adds redirect warning |
| Missing recording log | Script not generated via `generate` command | Use `--recordingLogPath` or create manually |
