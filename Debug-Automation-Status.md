# Debug Automation Status

This file tracks the agreed work for the debug automation and reporting enhancements.

## Overall Status

- Status: In Progress
- Last updated: 2026-03-31

## Task Checklist

- [completed] Add suite-local recording-log registry and auto-resolution flow
- [completed] Keep manual `recordingLogPath` override as highest priority
- [completed] Restrict auto-resolution to the journey's own `scrum-suites/<team>/recordings` folder
- [completed] Handle ambiguity as a hard error requiring explicit `recordingLogPath`
- [completed] Handle missing recording log by generating replay-only HTML with warning banner
- [completed] Extend debug config with `autoResolveRecordingLog`
- [completed] Add iteration-aware replay logging and comparison
- [completed] Add request sequence, VU, and iteration metadata to replay artifacts
- [completed] Add request timing capture to replay artifacts using k6 response timings
- [completed] Add request-level variable event logging support
- [completed] Add global variables section per iteration in HTML report
- [completed] Add collapsible request variable sections in HTML report
- [completed] Add transaction-wise and request-wise replay timing summaries
- [completed] Add iteration selector and all-iterations summary in HTML report
- [completed] Update usage docs and framework change log
- [completed] Validate with `typecheck` and `build`

## Notes

- Manual `recordingLogPath` remains supported.
- Automatic recording-log resolution should only inspect the journey's own suite recordings folder.
- If the recording log is missing, replay should still run and report should still be generated.
- If multiple candidate recording logs are found, the framework should fail and ask for explicit configuration.
- Request-level variable reporting is now supported through the replay logging payload. Existing scripts can populate `requestInfo.variableEvents`, and the helper also exposes `createVariableEvent(...)` for convenience.
- HAR-generated request blocks were refactored for readability so request identity, tags, params, and body live under a single `request_n` object instead of being split into multiple repetitive variables.
- The readable formatter now only unquotes safe JavaScript identifier keys, so headers like `sec-ch-ua` remain quoted and generated scripts stay valid for k6.
- Debug replay now uses valid `shared-iterations` k6 options and surfaces real k6 startup/config failures directly instead of masking them as missing replay logs.
- Debug replay now captures k6 stdout and stderr into temp files for parsing instead of holding the full console output in memory.
- Replay-log extraction now stream-parses captured output files, which avoids memory spikes on larger debug runs.
- Large request and response body comparisons now use a lightweight similarity strategy instead of full Levenshtein distance, so HTML/API payloads can be compared without exhausting Node heap memory.
- Verified end-to-end debug execution with a real k6 run from `config/test-plans/debug-test.json`, producing both replay-log JSON and HTML diff output successfully.
- HTML diff report now supports collapsed-by-default request timing summary, collapsible transaction blocks, and collapsible request/response body sections for each request.
- Request/response header status chips now use readable dark text on light backgrounds so match and diff counts stay visible.
- Recording-log bodies are now normalized on read so base64 HAR payloads render as decoded text in the HTML diff report when they are human-readable.
- Transaction summary headers were polished so the expand/collapse affordance is clearer in the report.
- Request and response body panels now use clearer empty-state labels such as `No request body` and `No response body` instead of generic `(empty)`.
- The replay debug run at `Run_2026-03-31T04-59-16-628Z` verified the updated empty-state labels in a fresh HTML report.
- POST form bodies from HAR `postData.params` are now preserved into both generated scripts and generated recording logs. A fresh JPet debug run at `Run_2026-03-31T05-35-57-980Z` verified that `/account/signon` shows `referer=&username=j2ee&password=j2ee` on both the recorded and replayed request-body panels in the HTML diff report.
