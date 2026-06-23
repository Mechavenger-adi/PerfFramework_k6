# k6 Performance Framework — Test Plan & Acceptance Criteria

**Purpose:** Validate the accuracy and reliability of the framework across every feature before it is shared / promoted to production use.

**How to use this document**
- Each test has an **ID**, a **priority**, a **scenario**, a **type** (✅ Positive / ❌ Negative), the **input/steps**, and the **expected outcome**.
- A test **passes** only if the actual outcome matches the expected outcome *exactly* (including error messages for negative cases — a feature that "fails wrong" is still a defect).
- Run the suite on **at least two OSes** (Windows + Linux) and on an **offline/air-gapped** host, since the framework is intended for CI/CD load agents.
- Track results in the **Sign-off matrix** at the end.

**Priority levels**
| Pri | Label | Meaning | Gate |
|-----|-------|---------|------|
| **P0** | Critical / Blocker | Core correctness, result accuracy, security (secret redaction), graceful failure of dangerous paths, offline/CI essentials. | Must be 100% before sharing |
| **P1** | High | Important features, common negatives, robustness that affects most users. | Should be 100%; document any waiver |
| **P2** | Medium | Edge cases, secondary options, cosmetic/nice-to-have. | Best effort; track known gaps |

**Invocation forms referenced below**
- From source: `npx tsx core_engine/src/cli/run.ts <cmd>` (or `npm run cli -- <cmd>`)
- Compiled: `node dist/cli/run.js <cmd>` (requires `npm run build` first)
- Interactive: `npm run menu`

**Prerequisites for the test environment**
- Node.js LTS (≥18), k6 (recent, with `experimental/csv` + `experimental/fs`), `npm ci`, `npm run build`.
- A reachable test target (e.g. a local mock server) and one deliberately unreachable/erroring target for negative cases.

---

## 1. Installation, Build & Environment

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-ENV-01 | P0 | Clean install | ✅ | `npm ci` on a fresh checkout | Installs all deps with no errors; lockfile respected |
| TC-ENV-02 | P0 | Build compiles | ✅ | `npm run build` | `tsc` exits 0; `dist/` populated incl. `dist/utils/*.js` |
| TC-ENV-03 | P1 | Typecheck clean | ✅ | `npm run typecheck` | No type errors |
| TC-ENV-04 | P0 | Run with missing `dist/utils` | ❌ | Delete `dist/`, run a plan | k6 init fails clearly ("module … couldn't be found on local disk"); not a silent hang |
| TC-ENV-05 | P0 | k6 not on PATH | ❌ | Remove k6 from PATH, run a plan | Clear error that `k6` could not be spawned; non-zero exit |
| TC-ENV-06 | P0 | Offline / air-gapped run | ✅ | Disconnect network (except target), run a plan | Completes with **no remote `https://` module fetches**; no timeouts to `jslib.k6.io`/`raw.githubusercontent.com` |
| TC-ENV-07 | P2 | Node version below minimum | ❌ | Use Node <18 | Fails fast with an understandable error |
| TC-ENV-08 | P1 | Cross-platform paths | ✅ | Run identical plan on Windows and Linux | Same scripts/reports; path separators handled |

---

## 2. Project Scaffolding (`init`, `new`, `templates`, `generate-byos`)

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-INIT-01 | P1 | Init new project | ✅ | `init` in empty dir | Creates `config/`, `testSuites/`, example configs, sample journey |
| TC-INIT-02 | P2 | Init in existing project | ✅/❌ | `init` where config exists | Does not destroy existing files; reports created/skipped |
| TC-NEW-01 | P1 | New test plan from template | ✅ | `new` (test plan) | Generates a plan that passes `validate` |
| TC-NEW-02 | P1 | New runtime settings | ✅ | `new` (runtime settings) | Valid runtime settings (passes schema) |
| TC-TMPL-01 | P2 | List templates | ✅ | `templates list --type test_plans`/`runtime_settings` | Lists available templates |
| TC-TMPL-02 | P2 | Show template | ✅ | `templates show <name>` | Prints template content |
| TC-TMPL-03 | P2 | Invalid template type | ❌ | `templates list --type foo` | Rejects "Must be test_plans or runtime_settings" |
| TC-BYOS-01 | P1 | BYOS scaffold | ✅ | `generate-byos <proj> myscript` | Creates framework-shaped template |
| TC-BYOS-02 | P1 | BYOS name collision (CLI) | ❌ | Re-run same name | Errors "already exists"; non-zero; no overwrite |
| TC-DOCS-01 | P2 | Docs generation | ✅ | `docs` | Generates Markdown reference from schemas |

---

## 3. HAR → Script Generation (`generate`)

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-GEN-01 | P0 | Basic HAR generation | ✅ | Valid `.har`, pick one domain | Script + recording-log + registry written |
| TC-GEN-02 | P1 | Multi-domain filter | ✅ | Multiple hosts; select subset/"all" | Only selected domains emitted |
| TC-GEN-03 | P1 | Static asset exclusion | ✅ | Choose to exclude | Static assets dropped |
| TC-GEN-04 | P2 | Static asset inclusion | ✅ | Choose to include | Static assets retained |
| TC-GEN-05 | P1 | Lifecycle split (init/end) | ✅ | "split", assign init+end groups | Matching `initPhase`/`actionPhase`/`endPhase` |
| TC-GEN-06 | P1 | Transaction grouping & names | ✅ | HAR with named pages | Sensible transaction + `name` tags |
| TC-GEN-07 | P1 | HAR not found | ❌ | Non-existent path | "HAR file not found: <abs>"; non-zero |
| TC-GEN-08 | P1 | Quoted/absolute path (interactive) | ✅ | Provide `"C:\…\x.har"` | Quotes stripped; resolved |
| TC-GEN-09 | P1 | Empty/malformed HAR | ❌ | No entries / invalid JSON | Clear error; no crash |
| TC-GEN-10 | P2 | Binary/large bodies | ✅ | Binary responses | Generation succeeds; binary handled |

---

## 4. Native k6 → Framework Conversion (`convert`)

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-CONV-01 | P0 | Convert raw k6 script | ✅ | `convert script.js <proj> name` | Emits `request()`, `k6Check()`, transactions, `getEnvContext` |
| TC-CONV-02 | P0 | `const env` always emitted | ✅ | Convert literal-URL script | Output has `const env = getEnvContext('<proj>', {baseUrl})` |
| TC-CONV-03 | P0 | Re-convert already-converted | ✅ | Convert the output again | `const env` still present; runnable |
| TC-CONV-04 | P1 | In-place conversion | ✅ | Interactive: input inside a project, overwrite-in-place | File overwritten; embedded team = its own project |
| TC-CONV-05 | P1 | External path → copy to project | ✅ | External path (e.g. Desktop) | No "in place" prompt; asks project+name; writes into `tests/` |
| TC-CONV-06 | P2 | Reference copy of original | ✅ | After external convert, accept "keep a copy" | Original copied into `recordings/` |
| TC-CONV-07 | P1 | Lifecycle split on convert | ✅ | Choose split | Phases partitioned correctly |
| TC-CONV-08 | P1 | Input not found | ❌ | Non-existent input | "Input script not found"; non-zero |
| TC-CONV-09 | P1 | Convert + debug round-trip | ✅ | Convert then debug replay | Replay emits `[k6-perf][replay-log]`; diff produced |
| TC-CONV-10 | P2 | Trend/manual-timing cleanup | ✅ | Input uses `new Trend()` + manual timing | Stripped/normalized; framework metrics used |

---

## 5. cURL Import (`import curl`)

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-CURL-01 | P1 | Single cURL from file | ✅ | `--file x.curl` | One transaction/request script |
| TC-CURL-02 | P1 | Multi-cURL `# Name` blocks | ✅ | Multiple `# Name` blocks | Each block → a named transaction |
| TC-CURL-03 | P2 | Clipboard import | ✅ | Interactive clipboard; confirm copied | Reads clipboard; creates script |
| TC-CURL-04 | P2 | Paste mode | ✅ | Paste, blank line to end | Parsed into script |
| TC-CURL-05 | P2 | stdin pipe | ✅ | `… --stdin < x.curl` | Parsed from stdin |
| TC-CURL-06 | P1 | Empty clipboard/input | ❌ | Clipboard empty | "clipboard is empty…"; no script |
| TC-CURL-07 | P1 | Malformed cURL | ❌ | Garbage input | Clear parse error; no broken script |
| TC-CURL-08 | P1 | Methods, headers, body | ✅ | POST + headers + JSON | Reproduced faithfully |
| TC-CURL-09 | P2 | Multiple input sources | ❌ | `--file` + `--clipboard` | "only one input source allowed" |

---

## 6. Postman Import (`import postman`)

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-PM-01 | P0 | Basic v2.1 collection | ✅ | `--file c.json` | Combined script; transactions per folder |
| TC-PM-02 | P2 | Non-v2.0/2.1 schema | ⚠️ | v1/unknown | Warning; best-effort parse |
| TC-PM-03 | P1 | Top-level folder filter | ✅ | `--folder API` | Only `API` subtree |
| TC-PM-04 | P0 | Nested folder filter (path) | ✅ | `--folder "API/Auth"` | `API/Auth` subtree only; **excludes** `Admin/Auth` |
| TC-PM-05 | P1 | Folder filter via tree (wizard) | ✅ | Pick nested folder | Same subtree |
| TC-PM-06 | P2 | Folder tree display | ✅ | Nested collection picker | `└─` indentation; aligned numbers |
| TC-PM-07 | P0 | Per-request split | ✅ | `--split-per-request` | One script per request; `<folder>_<request>.js` |
| TC-PM-08 | P1 | Split collision escalation | ✅ | Two `login` in different folders | `Auth_login.js` + `Admin_Auth_login.js` |
| TC-PM-09 | P1 | Split transaction naming | ✅ | Split nested request | Transaction `Parent_Child_apiName` |
| TC-PM-10 | P1 | Combined transaction naming | ✅ | Nested, combined | `Parent_Child` (underscore, not dot) |
| TC-PM-11 | P2 | Root-level request | ✅ | Request at root | Named by request only |
| TC-PM-12 | P1 | Bearer auth | ✅ | Bearer token | `Authorization: Bearer …` |
| TC-PM-13 | P1 | Basic auth | ✅ | Basic | Base64 `Authorization: Basic …` |
| TC-PM-14 | P1 | API key auth | ✅ | apikey header | Header emitted; non-header location warns |
| TC-PM-15 | P2 | Collection/folder auth | ⚠️ | Auth at collection/folder | Warning: cascade not applied v1 |
| TC-PM-16 | P1 | File upload (body=file) | ✅ | Binary upload + `--data-root` | File copied to `data/`; `open()` binding |
| TC-PM-17 | P1 | Multipart with file | ✅ | formdata file field | `http.file(...)`; Content-Type warning |
| TC-PM-18 | P2 | Missing upload file | ⚠️ | File absent | TODO binding + warning; no crash |
| TC-PM-19 | P2 | Pre-request/test scripts | ✅ | Item scripts | Translatable converted; rest `// TODO` |
| TC-PM-20 | P1 | Empty/no-request collection | ❌ | No requests after filter | "no requests found…"; non-zero |
| TC-PM-21 | P1 | Filter matches nothing | ❌ | `--folder DoesNotExist` | No requests; clear message |
| TC-PM-22 | P1 | Malformed JSON | ❌ | Corrupt file | "failed to parse collection JSON…" |
| TC-PM-23 | P1 | URL from parts | ✅ | URL object (host/path/query) | Correct URL rebuilt |

---

## 7. Interactive Dashboard (`menu`)

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-DASH-01 | P1 | Launch on TTY | ✅ | `npm run menu` | Panel renders; menu groups shown |
| TC-DASH-02 | P1 | Non-TTY invocation | ✅ | Pipe/no TTY | Falls through to help; no block |
| TC-DASH-03 | P2 | Project terminology | ✅ | Any project-selecting action | Prompts say "project", not "team" |
| TC-DASH-04 | P0 | Existing-file conflict prompt | ✅ | Author to an existing name | Asks Overwrite/Rename/Cancel; panel does not crash |
| TC-DASH-05 | P1 | Rename re-checks | ✅ | Rename to another existing name | Prompts again until free/overwrite/cancel |
| TC-DASH-06 | P1 | Cancel on conflict | ✅ | Choose Cancel | Aborts; returns to menu |
| TC-DASH-07 | P1 | Split import conflict policy | ✅ | Split import, some names exist | Overwrite/Skip/Cancel; `[SKIP]` lines |
| TC-DASH-08 | P1 | Path with quotes | ✅ | Paste `"C:\…\x.har"` | Quotes stripped; resolves |
| TC-DASH-09 | P1 | Relative + absolute paths | ✅ | Both forms | Both resolve |
| TC-DASH-10 | P1 | No double-echo input | ✅ | Type during prompts | Each char once (single readline) |
| TC-DASH-11 | P1 | Run/Debug spawn under tsx | ✅ | Run/Debug from panel (tsx) | Re-spawns with tsx loader; no import error |
| TC-DASH-12 | P1 | Ctrl+C handling | ✅ | Ctrl+C at a prompt | Clean exit; no unhandled rejection |
| TC-DASH-13 | P2 | Removed options absent | ✅ | View menu | Templates/Config-inspect/Features not shown |
| TC-DASH-14 | P2 | Colored prompts | ✅ | Any prompt | Color-coded (respects `NO_COLOR`) |

---

## 8. Validation, Config Inspection & Schema (`validate`, `config inspect`)

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-VAL-01 | P0 | Valid plan passes | ✅ | `validate --plan good.json` | Reports valid |
| TC-VAL-02 | P1 | Missing required field | ❌ | No `user_journeys` | Names missing field + available fields |
| TC-VAL-03 | P2 | "Did you mean" suggestion | ❌ | Misspell `executer` | Suggests `executor` |
| TC-VAL-04 | P1 | Bad enum | ❌ | `execution_mode:"parralel"` | Lists allowed values |
| TC-VAL-05 | P1 | Invalid executor | ❌ | `executor:"rampin-vus"` | Lists valid executors |
| TC-VAL-06 | P1 | Missing executor-required field | ❌ | `constant-vus` w/o `duration` | Error naming `duration` |
| TC-VAL-07 | P1 | JSONC comments | ✅ | `//` comments in plan | Parses fine |
| TC-VAL-08 | P1 | Runtime settings invalid | ❌ | `errorBehavior:"halt"` | Lists allowed values |
| TC-VAL-09 | P2 | Config inspect | ✅ | `config inspect --plan p.json` | Prints resolved layers |
| TC-VAL-10 | P2 | `$schema` tolerated | ✅ | Plan with `$schema` | Accepted |

---

## 9. Config Layering & Environment Resolution

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-CFG-01 | P0 | Precedence order | ✅ | defaults→env→runtime→CLI→`.env` | Higher layer overrides lower (verify via inspect) |
| TC-CFG-02 | P1 | Env auto-resolve | ✅ | `environment:dev`, no `--env-config` | Loads `config/environments/dev.json` |
| TC-CFG-03 | P1 | Missing env file | ❌ | `environment:ghost` | "Environment Config file not found" |
| TC-CFG-04 | P1 | Missing runtime file | ⚠️ | `--runtime` absent | Warns; uses framework defaults |
| TC-CFG-05 | P0 | `.env` secrets + redaction | ✅ | `.env` secret | Available at runtime; **redacted** in printed config |
| TC-CFG-06 | P2 | CLI `--debug` override | ✅ | `run … --debug` | `debugMode` true; config printed |
| TC-CFG-07 | P1 | Per-project baseUrl | ✅ | `getEnvContext` + `K6_PERF_TEAM_ENVIRONMENTS` | `env.baseUrl` resolves for right project |
| TC-CFG-08 | P1 | Deep merge nested | ✅ | Partial runtime override | Only specified keys overridden |

---

## 10. Executors & Load Profiles

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-EXE-01 | P0 | ramping-vus | ✅ | stages | Ramps as specified |
| TC-EXE-02 | P0 | constant-vus | ✅ | vus+duration | Holds VUs |
| TC-EXE-03 | P1 | shared-iterations | ✅ | vus+iterations | N shared across VUs |
| TC-EXE-04 | P1 | per-vu-iterations | ✅ | vus+iterations | Each VU runs N |
| TC-EXE-05 | P0 | constant-arrival-rate | ✅ | rate+duration+preAllocatedVUs | Arrival-rate scenario |
| TC-EXE-06 | P1 | ramping-arrival-rate | ✅ | stages+preAllocatedVUs | Rate ramps |
| TC-EXE-07 | P2 | externally-controlled | ✅ | maxVUs | Accepts external control |
| TC-EXE-08 | P1 | Missing required field | ❌ | arrival-rate w/o preAllocatedVUs | Error naming field |
| TC-EXE-09 | P1 | max_total_vus guard | ❌ | sum VUs > max | Gatekeeper blocks/warns |
| TC-EXE-10 | P0 | End-detection per executor | ✅ | Each type | `endPhase` fires at ramp-down/last iter |

---

## 11. Execution Modes

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-MODE-01 | P0 | Parallel | ✅ | `parallel`, 2+ journeys | Concurrent scenarios |
| TC-MODE-02 | P1 | Sequential | ✅ | `sequential` | One after another (startTime offsets) |
| TC-MODE-03 | P1 | Hybrid | ✅ | `hybrid_groups` mix | Groups honored |
| TC-MODE-04 | P1 | Hybrid without groups | ❌ | `hybrid`, no groups | Validation error |
| TC-MODE-05 | P1 | Journey weighting | ✅ | `weight` across journeys | VU allocation proportional |
| TC-MODE-06 | P1 | Explicit VU override | ✅ | `vus` on a journey | Overrides weight |

---

## 12. Lifecycle Phases (init / action / end)

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-LIFE-01 | P0 | init runs once per VU | ✅ | initPhase login | Login once; action repeats |
| TC-LIFE-02 | P0 | action repeats | ✅ | actionPhase | Every iteration |
| TC-LIFE-03 | P0 | end on ramp-down | ✅ | endPhase logout | Fires once on removal |
| TC-LIFE-04 | P1 | No tight-loop after end | ✅ | After end/terminated | VU parks; counter not inflated |
| TC-LIFE-05 | P1 | Init failure | ❌ | initPhase throws | errorBehavior applied; `[k6-perf][init]` logged |
| TC-LIFE-06 | P1 | Phase envelope in debug | ✅ | Debug replay | Phases run under per-vu-iterations |

---

## 13. Runtime Settings (thinkTime, pacing, http, errorBehavior)

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-RT-01 | P1 | Fixed think time | ✅ | `mode=fixed, fixed=2` | ~2s sleeps |
| TC-RT-02 | P1 | Random think time | ✅ | `mode=random, min, max` | Sleeps within range |
| TC-RT-03 | P1 | Pacing enabled | ✅ | `pacing.enabled` | Iteration pacing applied |
| TC-RT-04 | P1 | HTTP timeout | ✅ | low `timeoutSeconds` vs slow target | Times out per setting |
| TC-RT-05 | P2 | maxRedirects | ✅ | Redirecting endpoint | Honors limit |
| TC-RT-06 | P0 | errorBehavior=continue | ✅ | Failing check | VU continues; failure recorded |
| TC-RT-07 | P1 | errorBehavior=stop_iteration | ✅ | Failing check | Iteration stops |
| TC-RT-08 | P1 | errorBehavior=stop_vu | ✅ | Failing check | VU terminates (parks) |
| TC-RT-09 | P1 | errorBehavior=abort_test | ✅ | Failing check | `exec.test.abort` ends run |
| TC-RT-10 | P2 | Invalid numeric ranges | ❌ | negative timeout / min>max | Rejected or safe behavior |

---

## 14. Correlation & Parameterization

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-COR-01 | P0 | Explicit trackCorrelation | ✅ | Regex extract + track | Reused downstream; in replay log |
| TC-COR-02 | P0 | ctx.correlation Proxy | ✅ | `ctx.correlation["x"]=…` | Auto-registered + auto-detected |
| TC-COR-03 | P1 | trackParameter/trackDataRow | ✅ | CSV row tracked | All columns registered |
| TC-COR-04 | P1 | Auto variable-event detect | ✅ | Tracked value in URL/body/header | Marked `used` |
| TC-COR-05 | P0 | Extraction miss | ❌ | Regex misses (empty response) | Not silently stale — surfaced/guardable |
| TC-COR-06 | P1 | Correlation across phases | ✅ | Track in action, reuse | Works within iteration scope |

---

## 15. Data Pools / CSV / Overflow Strategies

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-DATA-01 | P0 | CSV load | ✅ | Journey opens CSV | Rows parsed as objects |
| TC-DATA-02 | P1 | getUniqueItem rotation | ✅ | Iterate beyond rows | Cycles `iterationInTest % len` |
| TC-DATA-03 | P1 | Overflow: terminate | ✅ | Exhausted, terminate | Terminates per strategy |
| TC-DATA-04 | P1 | Overflow: cycle | ✅ | cycle | Re-uses from start |
| TC-DATA-05 | P1 | Overflow: continue_with_last | ✅ | continue_with_last | Holds last value |
| TC-DATA-06 | P1 | Missing CSV | ❌ | Wrong path | Clear init failure |
| TC-DATA-07 | P2 | Empty/header-only CSV | ❌ | Header only | Safe handling; no crash |
| TC-DATA-08 | P2 | Data file copied on import | ✅ | Postman/data file | Lands in `data/` |

---

## 16. Transactions, Checks & Error Behavior

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-TXN-01 | P0 | transaction() metrics | ✅ | Wrapped step | Per-transaction Trend/Counter |
| TC-TXN-02 | P0 | k6Check pass | ✅ | Passing assertion | Counted pass; no error behavior |
| TC-TXN-03 | P0 | k6Check fail | ✅ | Failing assertion | Fail recorded; errorBehavior applied |
| TC-TXN-04 | P1 | Multiple transactions | ✅ | Several per phase | Tracked independently; stable names |
| TC-TXN-05 | P1 | Request name tags | ✅ | `name` option | Grouped by name, not URL |
| TC-TXN-06 | P1 | 4xx/5xx handling | ✅ | Error status | ≥400 triggers error behavior |

---

## 17. SLA / Thresholds / Assertions

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-SLA-01 | P0 | global_sla applied | ✅ | p95/errorRate | Thresholds on all journeys |
| TC-SLA-02 | P1 | journey_slas override | ✅ | Per-journey | On `http_req_duration{scenario:name}` |
| TC-SLA-03 | P1 | transaction_slas | ✅ | Per-transaction | On the transaction Trend |
| TC-SLA-04 | P0 | SLA breach detection | ✅ | Target slower than threshold | Breach reported; flagged result |
| TC-SLA-05 | P1 | Percentile keys (p50/p99.9) | ✅ | Mixed percentiles | Parsed and enforced |
| TC-SLA-06 | P1 | Error-rate SLA | ✅ | errorRate + failures | Breach when exceeded |
| TC-SLA-07 | P2 | Invalid SLA value | ❌ | Non-numeric/negative | Rejected or warned |

---

## 18. Debug Replay & Diff Report

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-DBG-01 | P1 | Standalone debug | ✅ | `debug --script x.js` | Single-iter; replay-log captured; HTML diff |
| TC-DBG-02 | P1 | Plan debug mode | ✅ | `debug.enabled=true` | Per-journey replay + diff |
| TC-DBG-03 | P1 | Replay log capture | ✅ | K6_PERF_DEBUG set | Entries extracted (>0) |
| TC-DBG-04 | P1 | No replay entries | ❌ | Non-framework script / env undefined | Clear "No replay-log entries" guidance |
| TC-DBG-05 | P1 | Recording-log comparison | ✅ | Provide recording log | Diff highlights deltas |
| TC-DBG-06 | P2 | Missing recording log | ⚠️ | None provided | Replay-only; warning |
| TC-DBG-07 | P2 | VUs>1 in debug | ✅ | vus>1 | Overridden to 1 with warning |

---

## 19. Reporting & Artifacts

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-REP-01 | P0 | RunReport generated | ✅ | Any run | `RunReport.html`/`TestDetails.html` written |
| TC-REP-02 | P0 | handleSummary.json present | ✅ | Any run | Written; consumed by report generator |
| TC-REP-03 | P1 | Summary fallback | ✅ | Without handleSummary.json | Falls back to `--summary-export` |
| TC-REP-04 | P0 | Transaction metrics accuracy | ✅ | Report vs k6 raw json | avg/p95/stddev/counts match within tolerance |
| TC-REP-05 | P1 | Timeseries artifacts | ✅ | `timeseries.enabled` | Bucketed at configured size |
| TC-REP-06 | P2 | Tables toggle | ✅ | toggle transaction/error tables | Appear/suppressed |
| TC-REP-07 | P2 | Run manifest | ✅ | Any run | Manifest with plan + resolved config |
| TC-REP-08 | P1 | Report on aborted run | ✅ | abort_test mid-run | Partial report intact |
| TC-REP-09 | P2 | Live transaction table | ✅ | TTY run | Live table matches final metrics |
| TC-REP-10 | P1 | k6-reporter HTML toggle | ✅ | With/without remote reporter | Removing it doesn't break handleSummary.json/RunReport |

---

## 20. Host Monitoring

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-MON-01 | P1 | Monitoring enabled | ✅ | `monitoring.enabled=true` | CPU/mem sampled at interval |
| TC-MON-02 | P2 | Warning thresholds | ✅ | low warn %, drive load | Warning events emitted |
| TC-MON-03 | P2 | Monitoring disabled | ✅ | `enabled=false` | No sampling |
| TC-MON-04 | P2 | jobId from CI env | ✅ | `BUILD_BUILDID`/`GITHUB_RUN_ID` | jobId captured |

---

## 21. Reporters / External Outputs

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-OUT-01 | P1 | k6 JSON output | ✅ | `--out json=results.json` | Metrics stream written |
| TC-OUT-02 | P1 | InfluxDB output | ✅ | `K6_INFLUXDB_URL` set | `--out influxdb=…`; data shipped |
| TC-OUT-03 | P1 | InfluxDB unreachable | ❌ | Bad URL | Clear failure; local result still captured |
| TC-OUT-04 | P2 | Custom `--out` passthrough | ✅ | `--out web-dashboard=…` | Forwarded verbatim |
| TC-OUT-05 | P2 | Azure/Grafana reporters | ✅/⚠️ | Configure + creds | Uploads ok; missing creds → clear error |
| TC-OUT-06 | P1 | Framework-owned flag guard | ✅ | Pass `--config`/`--summary-export` | Filtered out (no clobber) |

---

## 22. Offline / Air-Gapped Operation

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-OFF-01 | P0 | No remote module fetch | ✅ | Internet blocked, target reachable | No `https://` fetches; run completes |
| TC-OFF-02 | P1 | Remote import in a script | ❌ | Journey imports remote jslib | Fails with i/o timeout — flagged as script issue |
| TC-OFF-03 | P1 | Prebuilt artifact run | ✅ | Ship `dist`+`node_modules` (omit-dev) | Runs without registry access |
| TC-OFF-04 | P2 | Clipboard tool absent | ⚠️ | Linux w/o xclip/xsel, clipboard import | Clear guidance to use `--file`/`--stdin` |

---

## 23. CI/CD & Multi-Agent

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-CI-01 | P0 | Non-interactive run | ✅ | `run --plan …` in CI (no TTY) | Headless; no prompt block |
| TC-CI-02 | P0 | Exit codes | ✅ | pass vs SLA breach vs error | Distinct, correct codes for gating |
| TC-CI-03 | P1 | Artifacts published | ✅ | Collect report dir | Reports/JSON available |
| TC-CI-04 | P1 | Multi-VM independent runs | ✅ | Same plan on N agents | Each completes; aggregatable |
| TC-CI-05 | P1 | High-FD load | ✅ | High VU/conn on Linux | `ulimit -n` raised → no FD exhaustion |
| TC-CI-06 | P2 | Concurrency tuning | ✅ | High RPS | No ephemeral-port exhaustion with tuning |

---

## 24. Robustness, Concurrency & Edge Cases

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-EDGE-01 | P1 | Very large HAR/collection | ✅ | 10k+ entries | Completes; no OOM |
| TC-EDGE-02 | P1 | Unicode/special chars | ✅ | Names w/ spaces, emoji, slashes | Sanitized; no broken scripts |
| TC-EDGE-03 | P1 | Duplicate journey names | ❌ | Two journeys same name | Detected/handled; no scenario clobber |
| TC-EDGE-04 | P2 | Odd/relative paths | ✅ | Weird but valid paths | Resolved safely |
| TC-EDGE-05 | P1 | Concurrent runs on one host | ✅ | Two runs, different runIds | Unique entry/report; no cross-talk |
| TC-EDGE-06 | P1 | Interrupt mid-run | ✅ | Ctrl+C during run | Temp entry cleaned; graceful exit |
| TC-EDGE-07 | P2 | Read-only output dir | ❌ | Report dir not writable | Clear permission error |
| TC-EDGE-08 | P2 | Disk full during reporting | ❌ | Fill disk | Clear failure; no half-written "good" report |
| TC-EDGE-09 | P2 | Timestamp correctness | ✅ | Compare report timestamps | Consistent, monotonic, TZ-correct |
| TC-EDGE-10 | P1 | Idempotent re-runs | ✅ | Same plan twice | New runId/report; no accidental overwrite |

---

## 25. API Performance Test Scenarios (HTTP / REST)

> Scope: the framework's native, protocol-level strength via `request()` / `k6Check()`. Use a controllable mock/staging API with known latencies and an access log to cross-check counts.

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-API-01 | P0 | Single GET baseline | ✅ | GET, constant-vus | Steady load; Trend + request count |
| TC-API-02 | P0 | POST create (JSON) | ✅ | POST JSON + Content-Type | Body verbatim; 201/200 checked; tagged by `name` |
| TC-API-03 | P0 | CRUD chain w/ correlation | ✅ | Create→capture `id`→GET/PUT/DELETE | `id` reused; all 4 pass; ~100% chain success |
| TC-API-04 | P0 | Auth: login→token→calls | ✅ | POST /login→token→authed GET | Bearer sent later; 200s |
| TC-API-05 | P1 | Data-driven params (CSV) | ✅ | Params from CSV | Distinct row/iter; in replay log |
| TC-API-06 | P1 | Pagination loop | ✅ | Follow `next` cursor | Cursor advances; terminates |
| TC-API-07 | P0 | Throughput SLA (arrival-rate) | ✅ | constant-arrival-rate `rate=R` | Achieved RPS ≈ R; SLA verdict correct |
| TC-API-08 | P1 | Per-endpoint SLA | ✅ | `transaction_slas` | Threshold on right Trend; breach flagged |
| TC-API-09 | P2 | GraphQL POST | ✅ | GraphQL body | `query`+`variables` JSON; 200 |
| TC-API-10 | P2 | Multipart upload API | ✅ | `http.file()` POST | File opened at init; upload ok |
| TC-API-11 | P1 | Header/cookie propagation | ✅ | Custom headers + cookie | Sent; jar cookies in replay log |
| TC-API-12 | P1 | 4xx handling | ✅ | 400/404 | ≥400 triggers errorBehavior; failure recorded |
| TC-API-13 | P1 | 5xx + rate limit (429) | ❌ | 429/503 under load | Failures counted; error-rate breach; not corrupted |
| TC-API-14 | P1 | Token expiry mid-test | ❌ | TTL < run | Later 401; failures attributed (no silent pass) |
| TC-API-15 | P1 | Malformed JSON response | ❌ | Invalid JSON where parsed | Handled per errorBehavior; no crash loop |
| TC-API-16 | P1 | Timeout on slow endpoint | ✅ | `timeoutSeconds` < latency | Times out; counted as failure |
| TC-API-17 | P1 | Idempotent re-run | ✅ | Same plan twice | Comparable metrics within variance |
| TC-API-18 | P1 | Mixed-endpoint journey | ✅ | One journey, 5 endpoints | Each a distinct transaction; separate metrics |

### API Result Accuracy (all P0 — must-pass)

| ID | Pri | Check | Method | Expected |
|----|-----|-------|--------|----------|
| TC-API-ACC-01 | P0 | Request count per endpoint | Report vs access log / `http_reqs` by tag | Exact match (minus filtered) |
| TC-API-ACC-02 | P0 | Status-code distribution | Report 2xx/4xx/5xx vs server log | Identical counts |
| TC-API-ACC-03 | P0 | Error rate | Report vs `http_req_failed` + check failures | Match |
| TC-API-ACC-04 | P0 | Latency percentiles per endpoint | Report p50/p90/p95/p99 vs raw json by tag | Within ≤1–2%/rounding |
| TC-API-ACC-05 | P0 | Achieved throughput | RPS vs configured arrival-rate | Within variance; no systematic undershoot |
| TC-API-ACC-06 | P0 | Correlation success rate | % iters extraction succeeded | ~100% healthy; misses surfaced |
| TC-API-ACC-07 | P0 | SLA verdict correctness | Framework vs manual eval on raw data | Identical verdict |
| TC-API-ACC-08 | P1 | Payload integrity | Replay-log request vs intended | Byte/field-accurate (auth header, JSON body) |

---

## 26. UI / Browser-Flow Performance Scenarios (HAR-recorded, protocol-level)

> Scope: multi-step user journeys captured as **HAR** and replayed at the HTTP layer — navigations, static assets, sessions, form posts, SPA XHR/fetch. **Not** real DOM/browser automation (see gap note).

| ID | Pri | Scenario | Type | Input / Steps | Expected Outcome |
|----|-----|----------|------|---------------|------------------|
| TC-UI-01 | P0 | Multi-page journey | ✅ | home→search→product→cart→checkout | Each page → a transaction; ordered |
| TC-UI-02 | P0 | Login form submission | ✅ | GET form→POST creds→redirect | Creds POSTed; session cookie; landing 200 |
| TC-UI-03 | P0 | CSRF token correlation | ✅ | Hidden token reused on POST | Token correlated from page; POST accepted |
| TC-UI-04 | P1 | Session persistence | ✅ | `noCookiesReset=true` | Session reused; no re-login per iter |
| TC-UI-05 | P1 | Session reset per iteration | ✅ | `noCookiesReset=false`/`clearCookies()` | Fresh session each iter |
| TC-UI-06 | P1 | Static assets included | ✅ | Generate w/ assets ON | CSS/JS/img present; bandwidth reflects |
| TC-UI-07 | P1 | Static assets excluded | ✅ | Generate w/ assets OFF | Only doc/XHR; lower bandwidth |
| TC-UI-08 | P1 | SPA XHR/fetch | ✅ | Background API behind UI action | XHR endpoints replayed in page txn |
| TC-UI-09 | P1 | Redirect chains | ✅ | 302 login→landing | Followed within maxRedirects; final checked |
| TC-UI-10 | P2 | Think time between pages | ✅ | `thinkTime` set | Human-like pauses |
| TC-UI-11 | P1 | Data-driven login (CSV) | ✅ | Different user per iter | Distinct user login |
| TC-UI-12 | P1 | Dynamic URL correlation | ✅ | Product/cart IDs from search | Subsequent navs use correlated IDs |
| TC-UI-13 | P2 | Multi-domain page | ✅ | app+CDN+API hosts | Domain filter include/exclude per host |
| TC-UI-14 | P1 | Session expiry mid-journey | ❌ | TTL < run | Later pages redirect to login; failures attributed |
| TC-UI-15 | P1 | CSRF token missing/changed | ❌ | Token absent/rotated | Correlation miss surfaced; POST fails clearly |
| TC-UI-16 | P1 | Rate-limited UI target | ❌ | 429/503 under load | Failures counted; no silent cascade |
| TC-UI-17 | P2 | Binary/static response | ✅ | Images/fonts | Binary placeholdered; no `{}`/corruption |
| TC-UI-18 | P1 | Full funnel SLA | ✅ | `journey_slas` on checkout | End-to-end latency enforced |

### UI Result Accuracy (all P0 — must-pass)

| ID | Pri | Check | Method | Expected |
|----|-----|-------|--------|----------|
| TC-UI-ACC-01 | P0 | Page→transaction mapping | Report vs HAR page groups | 1:1; names match recorded pages |
| TC-UI-ACC-02 | P0 | Request count per page | Report vs HAR entries (post-filter) | Match (per include/exclude choice) |
| TC-UI-ACC-03 | P0 | Bandwidth (sent/received) | `data_received`/`data_sent` vs expected | Higher w/ assets; consistent w/ payloads |
| TC-UI-ACC-04 | P0 | Per-page timing | Page Trend vs segmentation of its requests | Consistent; realistic p95 |
| TC-UI-ACC-05 | P0 | Session continuity | % iters staying authenticated | ~100%; no spurious re-logins |
| TC-UI-ACC-06 | P0 | Correlation success (CSRF/IDs) | % iters tokens/IDs extracted | ~100% healthy; misses visible |
| TC-UI-ACC-07 | P1 | End-to-end journey time | Full funnel vs sum(page times)+think | Within tolerance |
| TC-UI-ACC-08 | P0 | Static-asset filtering fidelity | Excluded extensions absent from script | No `.css/.js/.png/...` when excluded |

> **Known gap (call out to stakeholders):** these UI scenarios validate **protocol-level** replay of recorded browser flows. They do **not** measure real browser rendering metrics (DOM load, FCP/LCP, JS execution) because `k6/browser`/chromium is not integrated. True browser-level UI performance is a separate capability (k6 browser module) and should be tracked as its own test area.

---

## Result Accuracy Spot-Checks (all P0 — must-pass for production)

Cross-cutting checks — the highest-signal items for **trusting the numbers**:

| ID | Pri | Check | Expected |
|----|-----|-------|----------|
| TC-ACC-01 | P0 | Request count | Framework count == k6 `http_reqs` (minus filtering) |
| TC-ACC-02 | P0 | Percentiles | Report p90/p95/p99 within tolerance of k6 summary |
| TC-ACC-03 | P0 | Error rate | Matches `http_req_failed` / check failures |
| TC-ACC-04 | P0 | Transaction timing | Per-transaction Trend matches underlying requests |
| TC-ACC-05 | P0 | SLA verdict | Matches manual threshold evaluation |
| TC-ACC-06 | P0 | VU/throughput | Achieved RPS/VUs align with executor within variance |

---

## Sign-off Matrix

| Area | P0 | P1 | P2 | Total | Pass | Fail | Blocked | Owner |
|------|----|----|----|-------|------|------|---------|-------|
| 1. Install/Build/Env | 4 | 2 | 2 | 8 | | | | |
| 2. Scaffolding | 0 | 4 | 6 | 10 | | | | |
| 3. HAR generate | 1 | 7 | 2 | 10 | | | | |
| 4. Convert | 3 | 5 | 2 | 10 | | | | |
| 5. cURL import | 0 | 5 | 4 | 9 | | | | |
| 6. Postman import | 3 | 14 | 6 | 23 | | | | |
| 7. Interactive dashboard | 1 | 9 | 4 | 14 | | | | |
| 8. Validate/Inspect | 1 | 6 | 3 | 10 | | | | |
| 9. Config layering | 2 | 5 | 1 | 8 | | | | |
| 10. Executors | 3 | 6 | 1 | 10 | | | | |
| 11. Execution modes | 1 | 5 | 0 | 6 | | | | |
| 12. Lifecycle | 3 | 3 | 0 | 6 | | | | |
| 13. Runtime settings | 1 | 7 | 2 | 10 | | | | |
| 14. Correlation | 3 | 3 | 0 | 6 | | | | |
| 15. Data/CSV | 1 | 5 | 2 | 8 | | | | |
| 16. Transactions/Checks | 3 | 3 | 0 | 6 | | | | |
| 17. SLA/Thresholds | 2 | 4 | 1 | 7 | | | | |
| 18. Debug replay | 0 | 5 | 2 | 7 | | | | |
| 19. Reporting | 3 | 4 | 3 | 10 | | | | |
| 20. Host monitoring | 0 | 1 | 3 | 4 | | | | |
| 21. Reporters/Outputs | 0 | 4 | 2 | 6 | | | | |
| 22. Offline | 1 | 2 | 1 | 4 | | | | |
| 23. CI/CD | 2 | 3 | 1 | 6 | | | | |
| 24. Edge cases | 0 | 6 | 4 | 10 | | | | |
| 25. API scenarios | 6 | 11 | 1 | 18 | | | | |
| 25. API accuracy | 7 | 1 | 0 | 8 | | | | |
| 26. UI scenarios | 3 | 11 | 4 | 18 | | | | |
| 26. UI accuracy | 7 | 1 | 0 | 8 | | | | |
| Accuracy spot-checks | 6 | 0 | 0 | 6 | | | | |

**Production-ready criteria (recommended gate):**
- **100% of P0 cases pass** — including all result-accuracy checks (TC-ACC-01…06, TC-API-ACC-01…08, TC-UI-ACC-01…08).
- **100% of ❌ negative cases fail *gracefully*** with the documented message and correct exit code.
- At least one end-to-end **API** scenario (Section 25) and one **UI** scenario (Section 26) pass against a real/staging target with accuracy verified.
- **P1 ≥ 95% pass**, with any waiver documented and owned; offline (Section 22) and CI/CD (Section 23) pass on the target agent OS.
- No open Sev-1/Sev-2 defects in correlation, data overflow, SLA verdicts, or metric accuracy.
- P2 failures tracked as known gaps; they do not block sharing but must be visible.

> Tip: automate the deterministic P0/P1 cases (generate/convert/import/validate, schema negatives, accuracy spot-checks) as a regression suite; keep load-execution, host-monitoring, and the API/UI end-to-end scenarios as a smaller, scheduled integration run against a mock target.
