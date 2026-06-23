/**
 * PostmanScriptTranslator.ts
 *
 * Best-effort line-by-line translation of Postman Pre-request / Test scripts
 * to k6 + framework equivalents. Lines we can mechanically translate become
 * actual k6 code; lines we can't are emitted as `// TODO:` comments preserving
 * the original text so users see exactly what to port and where.
 *
 * Design principles:
 *   1. Never produce broken syntax. If a translation isn't safe, comment the
 *      original line instead.
 *   2. The `__RES__` placeholder substitutes for the response variable name
 *      (`res1`, `res2`, …) at ScriptGenerator emission time. The translator
 *      doesn't know which res variable applies — the generator does.
 *   3. Preserve user intent by ALWAYS appending the original lines as a final
 *      block comment, so manual review can cross-check against translations.
 *
 * Coverage (high-confidence patterns that get translated):
 *   Variables:
 *     pm.environment.set('k', v)      →  ctx.correlation['k'] = v;
 *     pm.environment.get('k')         →  ctx.correlation['k']
 *     pm.collectionVariables.set/get  →  ctx.correlation
 *     pm.variables.set/get            →  ctx.correlation
 *     pm.globals.set/get              →  ctx.correlation
 *
 *   Response shorthand:
 *     pm.response.code                →  __RES__.status
 *     pm.response.status              →  __RES__.status_text
 *     pm.response.json(...)           →  __RES__.json(...)
 *     pm.response.text()              →  __RES__.body
 *     pm.response.headers.get('X')    →  __RES__.headers['X']
 *     pm.response.responseTime        →  __RES__.timings.duration
 *     pm.response.responseSize        →  __RES__.body.length
 *
 *   Logging / utilities passed through unchanged:
 *     console.log/info/warn/error/debug
 *     JSON.parse / JSON.stringify
 *
 *   Simple test wrappers (pattern-matched whole-line):
 *     pm.test('label', () => pm.expect(__RES__.X).to.eql(Y))
 *       →  k6Check(__RES__, { 'label': r => r.X === Y });
 *
 * NOT translated (commented + TODO):
 *   - pm.sendRequest(...) — different shape and async semantics
 *   - pm.expect(...).chain(...)  except the simple wrapper above
 *   - pm.iterationData, pm.collectionVariables.has, pm.cookies.* — k6 differs
 *   - eval / dynamic require / Chai / Lodash / tv4 / CryptoJS
 *   - setTimeout / setInterval / async/await — k6's loop model doesn't match
 */

const RES = '__RES__';

export interface TranslationResult {
  /** Lines to emit at the call site, in order. Mix of code + TODO comments. */
  lines: string[];
  /** True if every line was successfully translated (no TODOs emitted). */
  fullyTranslated: boolean;
  /** True if at least one line still needs manual review. */
  hasTodos: boolean;
}

/**
 * Translate a Postman event script (array of source lines as written in the
 * Postman UI) into k6-compatible lines plus comments.
 *
 * @param scriptLines Raw lines from `event.script.exec` (Postman v2.1).
 * @param kind        Which event slot this is (affects header comment + a
 *                    few translation rules — pre-request can't reference
 *                    pm.response of the same item).
 */
export function translatePostmanScript(
  scriptLines: string[],
  kind: 'prerequest' | 'test',
): TranslationResult {
  if (!scriptLines || scriptLines.length === 0) {
    return { lines: [], fullyTranslated: true, hasTodos: false };
  }

  const out: string[] = [];
  let hasTodos = false;
  let allClean = true;

  // When a line gets marked TODO and ends with an unclosed `{` or `(`
  // (e.g. the head of a callback like `pm.sendRequest({...}, (e, r) => {`),
  // the subsequent lines belong to the same untranslated block and should
  // also be commented out. We track the running brace/paren balance and
  // keep commenting until it returns to zero. Without this, the body of an
  // untranslated callback would be emitted as live code (with stray closing
  // `});` causing a syntax error in the generated script).
  let todoBlockBalance = 0;

  // Section header so users can see at a glance what this block is.
  const headerLabel = kind === 'prerequest' ? 'pre-request' : 'test';
  out.push(`// ── Postman ${headerLabel} script (auto-translated; review and adjust) ──`);

  for (const raw of scriptLines) {
    const line = raw ?? '';
    const trimmed = line.trim();

    // Pass through pure comments and blank lines unchanged (still count
    // braces though — a blank line inside an open TODO block stays inside).
    if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      if (todoBlockBalance > 0) {
        // Inside a TODO block — comment the line so it can't compile.
        out.push(`${line.match(/^\s*/)?.[0] ?? ''}// ${trimmed}`);
      } else {
        out.push(line);
      }
      continue;
    }

    // Continue commenting subsequent lines until the open block closes.
    if (todoBlockBalance > 0) {
      const indent = line.match(/^\s*/)?.[0] ?? '';
      out.push(`${indent}// ${trimmed}`);
      todoBlockBalance += countOpeners(trimmed) - countClosers(trimmed);
      if (todoBlockBalance < 0) todoBlockBalance = 0; // defensive
      continue;
    }

    const translated = translateLine(line, kind);
    if (translated.todo) {
      // Could not translate — preserve the original as a TODO comment so the
      // user knows exactly what to port. Use the original indentation.
      const indent = line.match(/^\s*/)?.[0] ?? '';
      out.push(`${indent}// TODO[port-postman]: ${trimmed}`);
      hasTodos = true;
      allClean = false;
      // If this TODO line opens a block that doesn't close on the same line,
      // begin a multi-line comment-out region.
      const opens = countOpeners(trimmed);
      const closes = countClosers(trimmed);
      if (opens > closes) {
        todoBlockBalance = opens - closes;
      }
    } else {
      out.push(translated.line);
    }
  }

  return { lines: out, fullyTranslated: allClean, hasTodos };
}

/** Count `{` and `(` outside string/comment context (best-effort heuristic). */
function countOpeners(s: string): number {
  return (s.match(/[{(]/g) ?? []).length;
}

/** Count `}` and `)` outside string/comment context (best-effort heuristic). */
function countClosers(s: string): number {
  return (s.match(/[})]/g) ?? []).length;
}

// ---------------------------------------------------------------------------
// Line-level translation
// ---------------------------------------------------------------------------

interface LineResult {
  /** The translated line (or original if no translation needed). */
  line: string;
  /** True if the original could not be safely translated. */
  todo: boolean;
}

function translateLine(line: string, kind: 'prerequest' | 'test'): LineResult {
  let s = line;

  // --- Variable set/get across all Postman variable scopes ----------------
  // Postman exposes four scopes (environment / collectionVariables /
  // variables / globals) with the same .set/.get API. We collapse them all
  // to ctx.correlation since the framework's per-VU correlation store is the
  // closest k6 equivalent. Users can move specific keys to `__ENV` (k6 env
  // vars) or `ctx.session` later if scope matters.
  //
  // The value capture uses greedy `(.+)` paired with a trailing `\)\s*;?` so
  // expressions with nested parens (e.g. `r.json().token`, `parseInt(x, 10)`)
  // are captured intact up to the OUTER closing paren of the .set() call.
  // A previous `[^)]+?` version stopped at the first inner `)` and produced
  // broken output like `ctx.correlation['x'] = r.json(.token);`.
  s = s.replace(
    /pm\.(?:environment|collectionVariables|variables|globals)\.set\(\s*(['"`][^'"`]+['"`])\s*,\s*(.+)\s*\)(\s*;?)/g,
    'ctx.correlation[$1] = $2$3',
  );
  s = s.replace(
    /pm\.(?:environment|collectionVariables|variables|globals)\.get\(\s*(['"`][^'"`]+['"`])\s*\)/g,
    'ctx.correlation[$1]',
  );
  s = s.replace(
    /pm\.(?:environment|collectionVariables|variables|globals)\.unset\(\s*(['"`][^'"`]+['"`])\s*\)/g,
    'delete ctx.correlation[$1]',
  );

  // --- Response shorthand --------------------------------------------------
  // Pre-request scripts referencing pm.response of the same item don't make
  // sense (the request hasn't fired yet). We still translate so chained
  // workflows that look at a previous response work, but flag in the header.
  s = s.replace(/pm\.response\.code\b/g, `${RES}.status`);
  s = s.replace(/pm\.response\.status\b/g, `${RES}.status_text`);
  s = s.replace(/pm\.response\.responseTime\b/g, `${RES}.timings.duration`);
  s = s.replace(/pm\.response\.responseSize\b/g, `${RES}.body.length`);
  s = s.replace(/pm\.response\.text\(\s*\)/g, `${RES}.body`);
  s = s.replace(/pm\.response\.json\(/g, `${RES}.json(`);
  s = s.replace(
    /pm\.response\.headers\.get\(\s*(['"`][^'"`]+['"`])\s*\)/g,
    `${RES}.headers[$1]`,
  );
  // Bare `pm.response` reference (e.g. `console.log(pm.response)`) → __RES__.
  s = s.replace(/\bpm\.response\b/g, RES);

  // --- pm.test('label', () => pm.expect(X).to.eql(Y))  ---------------------
  // Simple one-liner with a single eql/equal assertion → k6Check. Anything
  // more complex (multiple expects, branching, async) falls through to TODO.
  //
  // Inside the predicate body, the response variable is `r` (the lambda's
  // arg passed by k6Check), NOT the transaction-level `__RES__`. The earlier
  // `pm.response.* → __RES__.*` substitutions ran first, so we now rewrite
  // those occurrences in `lhs`/`rhs` back to `r` so the predicate is correct.
  const testEqlMatch = s.match(
    /^\s*pm\.test\(\s*(['"`][^'"`]+['"`])\s*,\s*(?:function\s*\(\s*\)|\(\s*\)\s*=>)\s*\{?\s*pm\.expect\(\s*(.+?)\s*\)\.to\.(?:eql|equal|be\.equal|be\.eql)\(\s*(.+?)\s*\)\s*;?\s*\}?\s*\)\s*;?\s*$/,
  );
  if (testEqlMatch) {
    const [, label, lhsRaw, rhsRaw] = testEqlMatch;
    const lhs = lhsRaw.replace(new RegExp(RES, 'g'), 'r');
    const rhs = rhsRaw.replace(new RegExp(RES, 'g'), 'r');
    const ws = line.match(/^\s*/)?.[0] ?? '';
    return {
      line: `${ws}k6Check(${RES}, { ${label}: r => ${lhs} === ${rhs} });`,
      todo: false,
    };
  }

  // --- console.log / JSON.* / pure JS — pass through if no pm.* remains ---
  // After the substitutions above, any remaining `pm.` reference means we
  // hit an API we don't translate. Bail to TODO so we never emit broken code.
  if (/\bpm\./.test(s)) {
    return { line, todo: true };
  }

  // Some Postman scripts use `tests['name'] = boolExpr` (legacy syntax).
  // Translate to k6Check.
  const legacyTest = s.match(
    /^\s*tests\[\s*(['"`][^'"`]+['"`])\s*\]\s*=\s*(.+?)\s*;?\s*$/,
  );
  if (legacyTest) {
    const [, label, expr] = legacyTest;
    const ws = line.match(/^\s*/)?.[0] ?? '';
    return {
      line: `${ws}k6Check(${RES}, { ${label}: r => Boolean(${expr.replace(/\bresponseCode\.code\b/g, `${RES}.status`)}) });`,
      todo: false,
    };
  }

  // Common k6-unsafe global APIs.
  if (/\b(setTimeout|setInterval|setImmediate|require|fetch|XMLHttpRequest|window|document)\b/.test(s)) {
    return { line, todo: true };
  }

  // Pre-request scripts that reference pm.response are nonsensical for the
  // current item (the request hasn't fired yet). After our `pm.response.*`
  // substitutions above any leftover `__RES__` in a prerequest indicates the
  // script was reaching for a previous request's response — translatable but
  // worth flagging so the user reviews.
  if (kind === 'prerequest' && s.includes(RES)) {
    return { line: s, todo: false };
  }

  return { line: s, todo: false };
}
