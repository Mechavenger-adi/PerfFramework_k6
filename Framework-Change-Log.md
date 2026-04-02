# Framework Change Log

This file tracks the framework changes made during the current enhancement cycle, including the latest debug-mode updates and the earlier generator, diff, and documentation work.

## Summary

The framework has been extended in four main areas:

1. HAR-to-script generation and script structure
2. Recording-log and replay-log based diff reporting
3. Debug execution orchestration
4. Audit, usage, and architecture documentation

## Change Set 1: Framework Audit And Documentation

Updated and added repo-level documentation so the framework status and usage are easier to review.

- Updated [Framework-Audit-Checklist.md](d:/repos/K6-PerfFramework/Framework-Audit-Checklist.md)
- Updated [HOW_TO_USE_FRAMEWORK.md](d:/repos/K6-PerfFramework/HOW_TO_USE_FRAMEWORK.md)
- Updated [Generated-HowTo-Guide.md](d:/repos/K6-PerfFramework/Generated-HowTo-Guide.md)
- Updated [IMPLEMENTATION_GUIDE.md](d:/repos/K6-PerfFramework/IMPLEMENTATION_GUIDE.md)
- Added [Current-Framework-Flow.md](d:/repos/K6-PerfFramework/Current-Framework-Flow.md)

Key outcomes:

- Documented implemented vs partial vs missing requirement coverage
- Added Mermaid-based current framework flow diagrams
- Updated usage guidance to reflect HAR generation prompts, replay metadata, and debug diff reporting

## Change Set 2: HAR Generator Improvements

The HAR generation flow was improved so it is closer to real framework usage and produces scripts that are easier to debug and compare.

Updated source files:

- [core-engine/src/cli/generate.ts](d:/repos/K6-PerfFramework/core-engine/src/cli/generate.ts)
- [core-engine/src/recording/HARParser.ts](d:/repos/K6-PerfFramework/core-engine/src/recording/HARParser.ts)
- [core-engine/src/recording/DomainFilter.ts](d:/repos/K6-PerfFramework/core-engine/src/recording/DomainFilter.ts)
- [core-engine/src/recording/ScriptGenerator.ts](d:/repos/K6-PerfFramework/core-engine/src/recording/ScriptGenerator.ts)
- [core-engine/src/debug/ExchangeLog.ts](d:/repos/K6-PerfFramework/core-engine/src/debug/ExchangeLog.ts)

Backups created before changing the generator flow:

- [core-engine/src/cli/generate.backup.ts](d:/repos/K6-PerfFramework/core-engine/src/cli/generate.backup.ts)
- [core-engine/src/recording/HARParser.backup.ts](d:/repos/K6-PerfFramework/core-engine/src/recording/HARParser.backup.ts)
- [core-engine/src/recording/DomainFilter.backup.ts](d:/repos/K6-PerfFramework/core-engine/src/recording/DomainFilter.backup.ts)
- [core-engine/src/recording/ScriptGenerator.backup.ts](d:/repos/K6-PerfFramework/core-engine/src/recording/ScriptGenerator.backup.ts)
- [core-engine/src/types/HARContracts.backup.ts](d:/repos/K6-PerfFramework/core-engine/src/types/HARContracts.backup.ts)

Key outcomes:

- HAR generation now discovers unique domains from the HAR and prompts the user to choose which ones to include
- HAR generation now asks whether static assets like CSS, JS, images, and fonts should be included
- Static asset inclusion remains optional, with best-practice exclusion as the default
- Generated scripts now use framework transaction helpers instead of raw per-transaction `Trend` declarations
- Generated scripts now keep both request tags and structured replay logging
- Generated scripts continue to include readable `har_entry` comments
- A normalized recording log JSON is generated alongside the script output
- Generated request blocks are now more readable by centralizing request identity, tags, params, and body into a single `request_n` object
- The generated-script formatter now preserves quotes for non-identifier keys so request headers with hyphens remain valid JavaScript
- Debug replay scenario config now uses valid `shared-iterations` options and reports k6 startup/config failures more clearly when replay logs cannot be captured
- Debug replay capture now writes k6 stdout and stderr to temp files for parsing instead of buffering the entire console output in memory
- Replay-log extraction now stream-parses captured output files, which stabilizes debug runs with larger payloads
- Large body diff scoring now uses a lightweight similarity algorithm for big request and response payloads instead of heap-heavy Levenshtein comparison
- The HTML diff report now keeps transaction timing summary expanded while making request timing summary, transaction blocks, and request/response body sections collapsible for easier scanning
- Request and response header summary chips now use readable text colors so match and diff labels remain visible
- Recording-log request and response bodies are normalized on load so base64 HAR payloads can render as decoded text in the diff report when they are readable
- Transaction headers in the diff report were refined to make the expand/collapse interaction clearer
- Body panels in the HTML diff report now show explicit empty-state labels like `No request body` and `No response body`
- HAR form submissions that store request fields in `postData.params` are now carried through into generated scripts and normalized recording logs, so form posts like `/account/signon` render the full request body in the HTML diff report instead of appearing empty

## Change Set 3: Runtime JS Helpers For Generated Scripts

Generated scripts need runtime-safe JavaScript helpers that k6 can load directly.

Added helper files:

- [core-engine/src/utils/transaction.js](d:/repos/K6-PerfFramework/core-engine/src/utils/transaction.js)
- [core-engine/src/utils/replayLogger.js](d:/repos/K6-PerfFramework/core-engine/src/utils/replayLogger.js)

Related exported module update:

- [core-engine/src/index.ts](d:/repos/K6-PerfFramework/core-engine/src/index.ts)

Key outcomes:

- Generated scripts can use `initTransactions`, `startTransaction`, and `endTransaction`
- Generated scripts can emit normalized replay-log entries after each request
- Replay metadata and full replay exchange information now follow a consistent schema

## Change Set 4: Diff Checker And HTML Diff Report Improvements

The diff flow was strengthened so the report is more useful for both machine comparison and manual review.

Updated source files:

- [core-engine/src/debug/DiffChecker.ts](d:/repos/K6-PerfFramework/core-engine/src/debug/DiffChecker.ts)
- [core-engine/src/debug/HTMLDiffReporter.ts](d:/repos/K6-PerfFramework/core-engine/src/debug/HTMLDiffReporter.ts)

Key outcomes:

- The diff checker now supports matching normalized recording and replay logs by `harEntryId`
- Fallback matching uses method and URL when a strict tag match is not available
- Replay-only requests appear as `extra_in_replay`
- Recorded requests missing from replay appear as `missing_in_replay`
- HTML diff output is grouped by transaction
- Request and response bodies are displayed side by side for manual inspection
- Headers and status details are included in the report output

Sample artifacts generated during validation:

- [results/sample-diff-report.html](d:/repos/K6-PerfFramework/results/sample-diff-report.html)
- [results/sample-tagged-diff-report.html](d:/repos/K6-PerfFramework/results/sample-tagged-diff-report.html)
- [results/manual-body-compare-report.html](d:/repos/K6-PerfFramework/results/manual-body-compare-report.html)

## Change Set 5: Standalone Debug CLI And Replay Capture

The framework now has a first-class CLI debug command instead of relying only on the sample wrapper script.

Updated source files:

- [core-engine/src/cli/run.ts](d:/repos/K6-PerfFramework/core-engine/src/cli/run.ts)
- [core-engine/src/debug/ReplayRunner.ts](d:/repos/K6-PerfFramework/core-engine/src/debug/ReplayRunner.ts)
- [core-engine/src/execution/PipelineRunner.ts](d:/repos/K6-PerfFramework/core-engine/src/execution/PipelineRunner.ts)
- [scrum-suites/sample-team/run-debug.ts](d:/repos/K6-PerfFramework/scrum-suites/sample-team/run-debug.ts)

Key outcomes:

- Added CLI `debug` command
- `ReplayRunner` now captures replay-log lines from k6 output and writes a normalized replay-log JSON file
- The replay log is compared against the recording log automatically
- The HTML diff report is generated automatically after replay
- `PipelineRunner` can now capture stdout and stderr for debug replay parsing
- Fixed the `PipelineRunner` logger import path so built runtime resolution is consistent

## Change Set 6: Test Plan Driven Debug Mode

The framework now supports debug execution settings in the test plan itself.

Updated source files:

- [core-engine/src/types/TestPlanSchema.ts](d:/repos/K6-PerfFramework/core-engine/src/types/TestPlanSchema.ts)
- [core-engine/src/config/SchemaValidator.ts](d:/repos/K6-PerfFramework/core-engine/src/config/SchemaValidator.ts)
- [core-engine/src/config/GatekeeperValidator.ts](d:/repos/K6-PerfFramework/core-engine/src/config/GatekeeperValidator.ts)
- [core-engine/src/cli/run.ts](d:/repos/K6-PerfFramework/core-engine/src/cli/run.ts)
- [core-engine/src/debug/ReplayRunner.ts](d:/repos/K6-PerfFramework/core-engine/src/debug/ReplayRunner.ts)

Key outcomes:

- Added optional `debug` settings block to the test plan schema
- Added optional `recordingLogPath` to each journey
- `recordingLogPath` is only compulsory when `debug.enabled` is `true`
- Normal load plans can continue to run without recording logs
- When plan debug mode is enabled, the `run` command now:
  - runs each journey in debug replay mode
  - compares the replay log against that journey’s recording log
  - generates a per-journey HTML diff report automatically
- Debug replay VUs and iterations can now be controlled from the test plan

## Change Set 7: Init Template Updates

The project scaffold now includes a debug-aware template in addition to the normal load-test template.

Updated source file:

- [core-engine/src/cli/init.ts](d:/repos/K6-PerfFramework/core-engine/src/cli/init.ts)

Key outcomes:

- `init` still creates the standard `config/test-plans/load-test.json`
- `init` now also creates `config/test-plans/debug-test.json`
- `init` now creates a sample recording log at `scrum-suites/sample-team/recordings/browse-journey.recording-log.json`
- The scaffolded next steps now mention the debug test plan as the starting point for replay-diff execution

## Change Set 8: Recording Log Auto-Resolution And Iteration-Aware Debug Report

The debug replay flow has been strengthened so it can automatically resolve recording logs, continue in replay-only mode when needed, and generate richer iteration-aware HTML reports.

Updated source files:

- [core-engine/src/debug/RecordingLogResolver.ts](d:/repos/K6-PerfFramework/core-engine/src/debug/RecordingLogResolver.ts)
- [core-engine/src/cli/generate.ts](d:/repos/K6-PerfFramework/core-engine/src/cli/generate.ts)
- [core-engine/src/config/GatekeeperValidator.ts](d:/repos/K6-PerfFramework/core-engine/src/config/GatekeeperValidator.ts)
- [core-engine/src/config/SchemaValidator.ts](d:/repos/K6-PerfFramework/core-engine/src/config/SchemaValidator.ts)
- [core-engine/src/types/TestPlanSchema.ts](d:/repos/K6-PerfFramework/core-engine/src/types/TestPlanSchema.ts)
- [core-engine/src/debug/ReplayRunner.ts](d:/repos/K6-PerfFramework/core-engine/src/debug/ReplayRunner.ts)
- [core-engine/src/debug/DiffChecker.ts](d:/repos/K6-PerfFramework/core-engine/src/debug/DiffChecker.ts)
- [core-engine/src/debug/HTMLDiffReporter.ts](d:/repos/K6-PerfFramework/core-engine/src/debug/HTMLDiffReporter.ts)
- [core-engine/src/utils/replayLogger.js](d:/repos/K6-PerfFramework/core-engine/src/utils/replayLogger.js)
- [core-engine/src/recording/ScriptGenerator.ts](d:/repos/K6-PerfFramework/core-engine/src/recording/ScriptGenerator.ts)
- [core-engine/src/index.ts](d:/repos/K6-PerfFramework/core-engine/src/index.ts)
- [core-engine/src/cli/run.ts](d:/repos/K6-PerfFramework/core-engine/src/cli/run.ts)
- [Debug-Automation-Status.md](d:/repos/K6-PerfFramework/Debug-Automation-Status.md)

Key outcomes:

- HAR generation now maintains a suite-local recording registry at `scrum-suites/<team>/recordings/.recording-index.json`
- Debug mode can auto-resolve recording logs using:
  - explicit `recordingLogPath`
  - suite-local registry entry
  - deterministic same-name fallback in the same suite recordings folder
- Auto-resolution is limited to the journey's own suite recordings folder
- Ambiguous recording log matches now fail with a clear message asking for explicit `recordingLogPath`
- Missing recording logs no longer block debug execution; the framework now generates replay-only HTML diff output with a warning banner and `No data` on the recorded side
- Replay logs now include iteration, VU, request sequence, and request duration metadata
- Request durations are captured automatically from `response.timings.duration`
- Replay logs now support request-level variable events for parameterization and correlation debugging
- HTML diff reports now support:
  - iteration selector
  - all-iterations summary table
  - global variables section per iteration
  - collapsible request variables section
  - transaction-wise timing summary
  - request-wise timing summary
  - replay-only reporting when no recording log is available

Recommended test plan shape:

```json
{
  "name": "Sample Debug Plan",
  "environment": "dev",
  "execution_mode": "parallel",
  "global_load_profile": {
    "executor": "shared-iterations",
    "vus": 1,
    "iterations": 1
  },
  "debug": {
    "enabled": true,
    "mode": "diff",
    "vus": 1,
    "iterations": 1,
    "reportDir": "results/debug",
    "failOnMissingRecordingLog": true
  },
  "user_journeys": [
    {
      "name": "login",
      "scriptPath": "scrum-suites/sample-team/tests/generated-sample-review.js",
      "recordingLogPath": "scrum-suites/sample-team/recordings/generated-sample-review.recording-log.json"
    }
  ]
}
```

## Validation And Build Notes

Build and typecheck were used repeatedly during this change cycle:

- `cmd /c npm.cmd run typecheck`
- `cmd /c npm.cmd run build`

Manual and sample validation artifacts created during the process include:

- [scrum-suites/sample-team/tests/generated-sample-review.js](d:/repos/K6-PerfFramework/scrum-suites/sample-team/tests/generated-sample-review.js)
- [scrum-suites/sample-team/recordings/generated-sample-review.recording-log.json](d:/repos/K6-PerfFramework/scrum-suites/sample-team/recordings/generated-sample-review.recording-log.json)
- [browse.replay-log.json](d:/repos/K6-PerfFramework/results/debug/Sample_Debug_Test/Run_2026-03-31T04-06-37-056Z/browse.replay-log.json)
- [browse.diff.html](d:/repos/K6-PerfFramework/results/debug/Sample_Debug_Test/Run_2026-03-31T04-06-37-056Z/browse.diff.html)
- [browse.diff.html](d:/repos/K6-PerfFramework/results/debug/Sample_Debug_Test/Run_2026-03-31T04-53-50-700Z/browse.diff.html)
- [browse.diff.html](d:/repos/K6-PerfFramework/results/debug/Sample_Debug_Test/Run_2026-03-31T04-59-16-628Z/browse.diff.html)
- [browse.diff.html](d:/repos/K6-PerfFramework/results/debug/Sample_Debug_Test/Run_2026-03-31T05-35-57-980Z/browse.diff.html)

## Known Remaining Gaps

These changes improve the framework substantially, but a few areas still need more work.

- Full test-plan-driven debug mode should be documented in the main usage guides
- End-to-end debug execution with a real k6 run is still dependent on local k6 availability and environment permissions
- A combined debug index page across multiple journeys could be added later
- More granular parsed diffs for query params, cookies, and JSON field-level deltas can still be added later
