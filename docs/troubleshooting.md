# Troubleshooting

> Derived from the root `README.md` troubleshooting section plus the "Known limitations" of the
> engineering docs ([risk-zones](../ai_context/risk-zones.md) / [fragile-areas](../ai_context/fragile-areas.md)).

## Setup & run

| Symptom | Cause / Fix |
|---------|-------------|
| `k6: command not found` | k6 not installed or not on `PATH`. See [Installation](installation.md). |
| Validation fails on environment | Test plan `environment` must match `config/environments/<name>.json`. |
| Journey script not found | Check `scriptPath` + team folder. Bare filenames resolve from `testSuites/<team>/tests/`. |
| Reports not where expected | `K6_RESULTS_BASE_DIR` in `.env` overrides `results/`. |
| **TypeScript changes not reflected** | Run `npm run build`. k6 loads `dist/`, not `.ts` — VU-side edits need a rebuild. |

## Behavior surprises (from the engineering docs)

| Symptom | Explanation | Reference |
|---------|-------------|-----------|
| `endPhase` (logout) didn't run for some VUs | Only affects steep ramps: VUs onboarded together share a rank and log out at the earliest cull (front-loaded, safe). | [EDD-lifecycle](../engineering_docs/edd/EDD-lifecycle.md) F5 |
| Script "passes" in debug but fails under load | Debug now mirrors load runtime (redirects/timeout/thinkTime). If you see divergence, confirm you're on a current build. | [EDD-debug-replay](../engineering_docs/edd/EDD-debug-replay.md) |
| Transaction shows 0 failures but requests errored | A transaction with no `k6Check` defaults `_checkrate` to all-pass; the unchecked-failing-response backstop flags it, but always assert status. | [EDD-reporting](../engineering_docs/edd/EDD-reporting.md) RZ8 |
| Raw `check()`/`group()` rejected pre-flight | Use `k6Check()` inside `transaction()` — only these yield exact pass/fail. | ScriptContractGuard |
| Cookies wiped between iterations (302 on iter 2+) | Framework default `noCookiesReset: true` persists cookies; verify it's not overridden. | [fragile-areas](../ai_context/fragile-areas.md) F7 |
| `summaryTrendStats` / a k6 option ignored | Some k6 options only work as CLI flags, not JSON config. | [risk-zones](../ai_context/risk-zones.md) RZ5 |
| Relative data path (`../Data/x.csv`) not found | Resolves against the generated entry script's location; keep journeys in one shared folder. | RZ2 / F8 |
| Missing recording log in debug | Pass `--recording-log` or set `recordingLogPath` in the plan. | [EDD-debug-replay](../engineering_docs/edd/EDD-debug-replay.md) |

## Getting more detail
- Add `--debug` to `run` to print the resolved config.
- Add `--http-debug=full` (passthrough) to `debug` for full request/response logging.
- Inspect merged config: `npm run cli -- config inspect --plan <plan>`.
