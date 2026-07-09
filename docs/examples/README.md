# Examples

> Pointer page. The runnable examples in this repo are the team suites and the built-in templates.

## Runnable test plans
`config/test_plans/` — e.g. `load_test.json`, `debug_test.json`, `webui_load_test.json`.

```bash
npm run cli -- run --plan config/test_plans/load_test.json
npm run loadtest      # shortcut for the default load plan
npm run debug         # shortcut for the default debug plan
```

## Team suites
`testSuites/<team>/` — each has `tests/` (journey scripts), `recordings/` (HAR + recording logs),
`data/` (CSV/JSON). Browse an existing team (e.g. `testSuites/Jpet_new/`) for a worked example of a
generated + correlated journey.

## Built-in templates
```bash
npm run cli -- templates list --type test_plans
npm run cli -- templates show smoke --type test_plans
npm run cli -- templates list --type runtime_settings
```
Or scaffold from a template with the wizard: `npm run cli -- new`.

## A minimal journey
See the phase-based script skeleton in [Getting Started](../getting-started.md#2-author-a-journey-script).
