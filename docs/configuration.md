# Configuration Guide

> Task-oriented guide. Distilled from [EDD-config](../engineering_docs/edd/EDD-config.md) and the root
> `README.md`. For the exhaustive **field reference** (every key, type, default), see the generated
> [configuration-reference.md](configuration-reference.md) *(`npm run docs`)*.

## The three config files

| File | Location | Controls |
|------|----------|----------|
| Environment | `config/environments/<name>.json` | base URLs, per-team overrides. Filename must match the test plan's `environment`. |
| Runtime settings | `config/runtime_settings/default.json` | think time, pacing, HTTP defaults, error behavior, reporting, snapshots, monitoring. |
| Test plan | `config/test_plans/*.json` | journeys, load profile/executor, SLAs, execution mode. |

All three are **JSONC** (comments allowed) and validated against `config/schemas/*.schema.json` before a
run — typos fail fast with a "did you mean" suggestion.

## How resolution works

Layers merge in precedence order: **framework defaults → environment → runtime settings → CLI → `.env`
secrets**. One rule to remember: **arrays are replaced wholesale, never merged** — so setting
`reporting.transactionStats` in your runtime file replaces the default list entirely (it is not appended).

Inspect the fully merged result for a plan:

```bash
npm run cli -- config inspect --plan config/test_plans/load_test.json
```

## Common tasks

**Point a team at a base URL** (`config/environments/dev.json`):
```json
{ "$schema": "../schemas/environment.schema.json", "name": "dev",
  "testSuites": { "Jpet_new": { "baseUrl": "https://jpetstore.aspectran.com" } } }
```
Keys under `testSuites` must match folder names under `testSuites/`.

**Choose a load shape** (test plan `global_load_profile`): pick an `executor`
(`ramping-vus`, `constant-vus`, `shared-iterations`, `per-vu-iterations`, `constant-arrival-rate`,
`ramping-arrival-rate`) — see [EDD-lifecycle](../engineering_docs/edd/EDD-lifecycle.md) for how each maps to VU end-detection.

**Set SLAs** (become k6 thresholds): `global_sla` (request-level), `journey_slas`, `transaction_slas`,
`request_slas`. Percentile keys are dynamic (`p90`, `p95`, `p99`, `p99.9`, …). `errorRate` is a percent.
See [EDD-reporting](../engineering_docs/edd/EDD-reporting.md) for the precedence rules.

**Set error behavior** (`runtime.errorBehavior`): `continue` | `stop_iteration` | `stop_vu` | `abort_test`.
Note: a genuine JS runtime error (ReferenceError/TypeError) always aborts regardless of this setting.

**Secrets** go in `.env` (never in the JSON config), surfaced redacted in debug output. Variable names:
[environment_index.json](../ai_generated/environment_index.json).

## Full field reference
→ [configuration-reference.md](configuration-reference.md) (generated from the JSON schemas).
