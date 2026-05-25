# Fragile Areas

> Code areas where bugs have historically occurred or where coupling makes changes risky.

## F1 — HTMLDiffReporter.ts (87KB, largest file)

**Risk:** Self-contained HTML generation with embedded CSS, JS, and template strings. Changes are hard to test and easy to break.

**Past bugs:**
- `value.replace is not a function` — non-string values from JSON.parse flowing through without coercion
- Grid overflow from long URLs breaking CSS layout
- `overflow: hidden` breaking `position: sticky` — had to switch to `overflow: clip`
- Duplicate body display sections

**Mitigation:** Always coerce values with `String(value ?? '')` before `.replace()` calls. Test generated HTML in a browser.

## F2 — Replay Log Pipeline (3-file sync)

**Risk:** `replayLogger.ts` → `ReplayRunner.ts` → `DiffChecker.ts` must agree on JSON format.

**Past bugs:**
- Body objects not stringified → downstream `.trim()` crash
- Binary content causing JSON parse failures

**Mitigation:** Changes to any one of these three files should be validated against the other two.

## F3 — ConfigurationManager.deepMerge()

**Risk:** Array handling. JavaScript `typeof array === 'object'` caused arrays to be deep-merged as objects, losing Array prototype.

**Past bug:** `transactionStats` config array became `{0: 'count', 1: 'pass', ...}` instead of `['count', 'pass', ...]`.

**Mitigation:** Arrays are now replaced wholesale. Do not change this behavior.

## F4 — ScriptConverter.ts (39KB, dual-pattern)

**Risk:** Regex-based source code transformation. Handles two distinct input patterns (Studio/Trend-based and semi-framework).

**Past bugs:**
- ID sequencing reset at group boundaries (dual counter fix)
- `let match;`/`let regex;` stripped but still needed for correlation
- `export default function()` regex not handling optional spacing

**Mitigation:** Test idempotency (re-converting a converted script = no-op). Preserve `match`/`regex` declarations.

## F5 — lifecycle.ts VU Target Interpolation

**Risk:** Math-heavy VU exit detection. Gets called every iteration for every VU.

**Key invariant:** `exec.vu.idInInstance > Math.ceil(instantTarget)` — k6 removes highest-numbered VUs first.

**Past bugs:**
- False endPhase triggers during ramp-up (fixed with `isDecreasing` guard)
- endPhase never running for iteration-based executors

**Mitigation:** Test with spike profiles (multiple ramp-down segments) and step profiles (VU changes at multiple levels).

## F6 — k6 CLI Flag vs JSON Config Precedence

**Risk:** Some k6 options only work as CLI flags, not in the options JSON.

**Past bug:** `summaryTrendStats` in JSON config was silently ignored by k6. Had to switch to `--summary-trend-stats` CLI flag.

**Mitigation:** When adding new k6 options, verify they work via the JSON config method before assuming they do.

## F7 — Cookie Jar Clearing Between Iterations

**Risk:** k6 default is `noCookiesReset: false` (clears cookies). Framework default is `true` (persists cookies).

**Past bug:** HTTP 302 redirect errors on iterations 2+ because JSESSIONID was wiped.

**Mitigation:** Always test multi-iteration flows (≥3 iterations) when changing cookie/session behavior.

## F8 — Entry Script Path Resolution

**Risk:** Normal load runs generate a temporary entry script that imports journey scripts. Relative data file paths (`../Data/...`) resolve against the entry script's location.

**Past bug:** Entry script in `.k6-temp/` caused data file paths to fail because they were relative to the journey `tests/` folder.

**Mitigation:** Entry script is now placed in the shared journey directory when all journeys use the same folder. Test with scripts that use relative data paths.
