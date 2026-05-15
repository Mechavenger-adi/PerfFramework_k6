# Framework To-Do List

> A shared task list for AI agents to maintain continuity across sessions.
> **All AI agents MUST update this file when completing tasks or discovering new work.**

## Completed Tasks

- **Environment Architecture:** Completed migration to `scrum_suites`-based environment configuration per team.
- **Dynamic Session Handling:** Refactored URL resolution and `getEnvContext` to avoid URL encoding issues with template literals.
- **Session Debugging:** Improved `session.ts` missing config error message to include the active environment file name (dynamic via `K6_PERF_ENVIRONMENT`).
- **Think Time Refactoring:** Replaced raw `sleep()` and `getFrameworkThinkTime()` with a robust `thinktime(minOrFixed?, max?)` utility.
  - Supports `ignoreThinkTime` and `globalOverride` in runtime settings.
  - Supports inline random range: `thinktime(2, 5)` for 2–5s random delay.
  - Script Generator and Converter preserve think times properly between groups (not at phase start).
- **Error Behavior Audit:** Validated and fixed all four error behaviors (`continue`, `stop_iteration`, `stop_vu`, `abort_test`).
  - Fixed `stop_vu`: terminated VUs no longer sleep in an infinite loop — they return immediately.
  - Fixed init/action phase guards: changed from checking `=== 'stop_iteration'` to `!== 'continue'` so all non-continue behaviors (including `stop_vu`) are handled explicitly.
- **Step-up / Multi-spike Support:** Fixed `getEndSignal` to distinguish intermediate ramp-downs from the final ramp-down using `isFinalRampDown`. VUs no longer get permanently `state.ended` during intermediate dips in spike/step scenarios.
- **Templates Folder Moved:** Relocated `config/templates/` → root-level `templates/`. Updated CLI references in `templates.ts` and `new.ts`.
- **Folder Structure Decision:** Schemas remain in `config/schemas/` (required for `$schema` relative paths in JSON files). Templates moved to root since they are scaffolding, not runtime config.

## Current / In-Progress Tasks

*(Currently no active tasks)*

## Future Tasks / Backlog

- Evaluate and tune SLAs (e.g. `p95` and `errorRate`) for complex scenarios after gathering baseline results.
- Implement comprehensive unit tests for `ScriptConverter` to validate group statement and think time ordering.
- Bulk check other teams/scripts to confirm removal of legacy `registerFrameworkEnvironmentUrls` implementations.
- Update `init.ts` scaffolding templates to use `getEnvContext` and `thinktime()` instead of legacy `registerFrameworkEnvironmentUrls` and `resolveFrameworkUrl` patterns.
- Add step-up and multi-spike test plan templates to `templates/test-plans/`.
- Validate `init.ts` scaffold output after recent edits — the checkout-journey template may have lost a `check()` line during an edit inaccuracy.
