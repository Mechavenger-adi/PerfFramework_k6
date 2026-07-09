# Correlation Engine Design — Smart Auto-Correlation (LoadRunner-style)

> Status: **Design + Phase-1 build in progress**
> Goal: detect dynamic values from a recording automatically ("Scan for Correlations"), then capture-and-substitute them into the generated k6 script — so a recorded journey replays under load without hand-editing expired tokens.

---

## 1. Why

Today the framework has **two disconnected correlation systems and zero auto-detection**:

- **System A — runtime rule engine** (`core_engine/src/correlation/CorrelationEngine.ts`, `ExtractorRegistry.ts`, `RuleProcessor.ts`). Applies **hand-authored** rules from a JSON file using Node `fs`. Generated scripts **never call it**. The documented workflow (`.md/HowTo-AutoCorrelation.md`) is a manual 3-phase process.
- **System B — runtime tracking** (`core_engine/src/utils/replayLogger.ts`). `trackCorrelation()/trackParameter()` register values; `logExchange` auto-detects which registered values are **reused** in later requests. k6-native, no fs, already wired into `request()`. But `ScriptGenerator` imports `trackCorrelation` and **never emits a call to it** (dead import).

The missing piece is the **scanner** that *discovers* which values are dynamic with no human-written rules. The lucky part: `cli generate` already writes `recordings/<name>.recording-log.json` (a `TaggedExchangeLogEntry[]` with **both** request and response bodies/headers/cookies) — the exact producer→consumer dataset a scanner needs.

---

## 2. Design stance (decisions)

| # | Decision | Choice | Rationale |
|---|---|---|---|
| 1 | Detection input | **Single-recording heuristic** (default); two-recording diff deferred to a later phase | Works with the recording-log we already emit; diff-mode is a precision booster, not a prerequisite |
| 2 | Runtime mechanism | **System B** (`trackCorrelation` + inline `extract*` helpers) | Already VU-safe, fs-free, and consumer "used" tracking is automatic |
| 3 | Apply policy | **Auto-apply `high` confidence only**; `medium`/`low` listed for review | LoadRunner-style human-in-the-loop without spamming false positives |
| 4 | Integration safety | **Standalone-first, additive.** Build the whole feature as new files + a new CLI command. Existing `generate`/`convert`/`ScriptGenerator` stay unchanged until a final, guarded prompt is wired in | "Nothing affected" |

The rules file becomes a **design-time, reviewable artifact** (the *manifest*), not a runtime input. Runtime stays self-contained.

---

## 3. Architecture & data flow

```
HAR  ──HARParser.readEntries (UNSTRIPPED)──┐
                                           ├──► RecordingExchange[]  ──► CorrelationScanner ──► CorrelationPlan
recording-log.json  ──(already normalized)─┘                                │
                                                                            │ (manifest JSON, reviewable)
                                                                            ▼
                              generated k6 script  ──► ScriptCorrelationWriter ──► correlated script
                                                                            │
                                                              run ──► utils/extract.ts (k6-native)
                                                                       extractJson/Regex/Header/Cookie/Boundary
                                                                       + trackCorrelation
```

### Scanner pipeline (the "smart" core)
1. **ValueIndexer** — for each response build *producer* occurrences (JSON leaves, headers, set-cookie, HTML hidden/meta tokens, with left/right context). For each request build *consumer* occurrences (url path, query, body, headers, cookies).
2. **LinkMatcher** — link each consumer value to the **nearest preceding** producer (responseIndex < requestIndex). Group consumers that share `(value, producer)` into one candidate.
3. **CandidateScorer** — drop noise, rank `high|medium|low`:
   - reject too-short / low-entropy unless the key name hits the dynamic vocab
   - reject values seen in a request **before any response produced them** (input/constant)
   - flag cookie→cookie-only matches as `handledByJar` (k6 jar replays them) → not correlated
   - boost vocab hits (`csrf, token, jwt, session, viewstate, nonce, state, …`), JWT/UUID/hex shapes, single-use
4. **ExtractorSynthesizer** — pick the most robust capture: `jsonpath` (JSON body), `header`, `cookie`, or `boundary`/`regex` (HTML, left+right boundary widened until the value is uniquely located). Name the variable `c_<derived>` (deduped).

### Output: `CorrelationPlan` / manifest
```jsonc
{
  "candidates": [
    {
      "name": "c_csrfToken",
      "value": "csrf_abc123def456",      // recorded sample (review only)
      "confidence": "high",
      "apply": true,
      "producer": { "requestId": "req_1", "source": "json",
                    "extractor": "jsonpath", "locator": "csrfToken" },
      "consumers": [ { "requestId": "req_2", "in": "header", "locator": "X-CSRF-Token" } ],
      "reason": ["name-match:csrf", "single-use"],
      "handledByJar": false
    }
  ]
}
```

---

## 4. Script emission (before → after)

`ScriptCorrelationWriter` is a **post-processor** on the already-generated script (so `ScriptGenerator` is never touched). It anchors on the stable `replay: { id: "req_N" }` markers and `const resK = request(` naming the generator already emits.

**Before:**
```js
const res2 = request('POST', `${env.baseUrl}/auth/login`, {
  name: "POST_login_1",
  headers: { "X-CSRF-Token": "csrf_abc123def456", "Content-Type": "application/json" },
  body: "{\"username\":\"alice\"}",
  replay: { id: "req_2", recordingStartedAt: "..." },
});
```

**After:**
```js
// module scope: let c_csrfToken;
const res1 = request('GET', `${env.baseUrl}/auth/csrf-token`, { /* … */ });
c_csrfToken = trackCorrelation('c_csrfToken', extractJson(res1, 'csrfToken'), 'res1.body:csrfToken');

const res2 = request('POST', `${env.baseUrl}/auth/login`, {
  name: "POST_login_1",
  headers: { "X-CSRF-Token": `${c_csrfToken}`, "Content-Type": "application/json" },
  body: `{"username":"alice"}`,
  replay: { id: "req_2", recordingStartedAt: "..." },
});
```

- Capture emitted right after the producing request; variable hoisted to module scope (visible across phases/transactions, same pattern `ScriptConverter` uses for `match`/`regex`).
- Substitution converts the matched string literal into a template literal referencing `c_*`.
- `trackCorrelation` already substitutes a loud `{NOTFOUND:c_*}` placeholder + Warnings event on a miss (continue-on-error), so stale recordings degrade gracefully. Consumer "used" events appear automatically in the debug/replay report.

---

## 5. CLI / UX

**Standalone (built first):**
```
cli correlate --script <path> [--har <path> | --log <recording-log.json>]
              [--list | --apply high|medium|all] [--out <path>] [--dry-run]
```
- `--list` / `--dry-run`: print the candidate table + write the manifest; **do not** modify the script.
- `--apply <level>`: rewrite the script (default target `testSuites/<team>/tests`, or `--out`).
- Recording log auto-resolved from `--script` via `RecordingLogResolver` when `--har`/`--log` omitted.

**Integrated (final, guarded step):** after `generate` writes the script, prompt:
`Auto-correlate now? [a]pply / [l]ist suspected values / [s]kip`. `apply` → run writer; `list` → print table + manifest. Skips entirely on non-TTY so scripting is unchanged.

---

## 6. Files

**New**
| File | Side | Responsibility |
|---|---|---|
| `core_engine/src/utils/extract.ts` | k6 | `extractJson/extractRegex/extractHeader/extractCookie/extractBoundary` (VU-safe, no fs) |
| `core_engine/src/correlation/CorrelationManifest.ts` | Node | Types: `RecordingExchange`, `CorrelationCandidate`, `CorrelationPlan` + load/save |
| `core_engine/src/correlation/ValueIndexer.ts` | Node | Producer/consumer occurrence extraction |
| `core_engine/src/correlation/LinkMatcher.ts` | Node | Nearest-preceding producer→consumer linking |
| `core_engine/src/correlation/CandidateScorer.ts` | Node | Heuristics → confidence |
| `core_engine/src/correlation/ExtractorSynthesizer.ts` | Node | Extractor + boundary synthesis (uniqueness-checked) |
| `core_engine/src/correlation/CorrelationScanner.ts` | Node | Orchestrator: exchanges → `CorrelationPlan` |
| `core_engine/src/correlation/ScriptCorrelationWriter.ts` | Node | Apply plan to a generated script (capture + substitute) |
| `core_engine/src/cli/correlate.ts` | Node | Standalone command |
| `config/correlation-rules/auto-correlation.defaults.json` | config | Token vocabulary + thresholds (fills empty dir, TD9) |

**Extended (additive only)**
- `core_engine/src/index.ts` — export the runtime extractors.
- `core_engine/src/correlation/ExtractorRegistry.ts` — add `boundary` + `cookie` extractors (new `register()` calls only).
- `core_engine/src/cli/run.ts` — register the `correlate` subcommand.
- (Final step) `core_engine/src/cli/generate.ts` — optional post-generate prompt.

---

## 7. Correctness traps (must handle)

1. **`HARParser.parse` strips `cookie` + `authorization` request headers** (HARParser.ts:35) → deletes consumer evidence. The scanner runs on **`HARParser.readEntries` (unstripped)** or the raw recording-log; never on the stripped `parse()` output.
2. **Cookie jar double-handling** — k6 auto-replays cookies; correlating a pure session cookie is redundant/harmful. `handledByJar` filter prevents it.
3. **Parameterization vs correlation** — a user-typed value (username) is `p_`, not `c_`. Cross-check against first-request inputs / `data/`.
4. **Token rotation** — bind each consumer to its **nearest preceding** producer, not the first, so re-minted tokens don't replay stale.
5. **Phase scoping** — captures hoist to module scope so an init-phase capture is visible in action/end phases.

---

## 8. Phased roadmap

| Phase | Deliverable | Status |
|---|---|---|
| 1 | Runtime extractors + registry extractors | building |
| 2 | Scanner core (indexer/matcher/scorer/synth/orchestrator) + manifest | building |
| 3 | `ScriptCorrelationWriter` + standalone `correlate` CLI | building |
| 4 | `generate` post-generate prompt (guarded), `convert` parity | after standalone verified |
| 5 | Two-recording diff mode, `validate --rules`, docs rewrite, reconcile System A | later |

## 9. Testing

Pure-function unit targets (no k6 needed): ValueIndexer, LinkMatcher, CandidateScorer, ExtractorSynthesizer boundary uniqueness, ScriptCorrelationWriter golden output. E2E: a recording with a rotating CSRF token — static script fails, correlated script passes.
