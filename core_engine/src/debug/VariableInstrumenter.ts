/**
 * VariableInstrumenter
 *
 * Debug-time auto-tracking of EVERY interpolated variable (parameter or
 * correlation) so the replay report's variable table shows the real per-iteration
 * value of each `${...}` — without any track* call in the user's script.
 *
 * Why this exists: JavaScript resolves a template literal `${expr}` into a plain
 * string BEFORE request() is ever called, so at runtime the framework only sees
 * the final value (e.g. "fish") — never the expression or the variable name it
 * came from. The only place the name is still known is the interpolation site in
 * the source. So at debug time the runner rewrites each `${expr}` on a throwaway
 * COPY of the script to:
 *
 *     ${__k6PerfTrackVar("name", (expr), "source", "type")}
 *
 * `__k6PerfTrackVar` (installed on globalThis by replayLogger) registers the value
 * at that exact spot every iteration and returns it unchanged. The user's file is
 * never modified.
 *
 * Scope: only request-bearing interpolations matter, but wrapping every `${...}`
 * is safe — the helper returns the value untouched, so even an interpolation in a
 * console.log just gets harmlessly registered. We DO skip:
 *   - `env.*` (base URL / service URLs are constants, not variables)
 *   - already-wrapped expressions and explicit track*() calls (idempotent)
 *   - interpolations containing braces (object literals) — the regex can't bound
 *     them reliably, and they aren't simple variables anyway.
 */

/** Matches `${ ... }` where the inner expression has no nested braces. */
const INTERP_RE = /\$\{([^{}]+)\}/g;

export interface InstrumentResult {
  /** The rewritten source. Equal to the input when nothing was wrapped. */
  source: string;
  /** How many interpolations were wrapped (0 → caller can skip the temp copy). */
  wrapped: number;
}

interface Classified {
  name: string;
  source: string;
  type: 'parameter' | 'correlation';
}

/**
 * Rewrite every trackable `${expr}` in `source` to self-track via the global
 * `__k6PerfTrackVar` helper. Pure string transform; never throws on valid JS.
 */
export function instrumentVariableTracking(source: string): InstrumentResult {
  let wrapped = 0;
  const out = source.replace(INTERP_RE, (full: string, rawExpr: string): string => {
    const expr = String(rawExpr).trim();
    const cls = classify(expr);
    if (!cls) return full;
    wrapped++;
    // Ternary-guarded so it's crash-proof and side-effect-safe:
    //  - if the global helper is present → track + return the value unchanged;
    //  - if not (script never loaded the framework) → fall back to the bare
    //    expression. Only ONE branch ever runs, so `expr` is evaluated exactly
    //    once either way (no double-eval of generators like generate.uuid()).
    // Parens preserve operator precedence around the original expression.
    const g = 'globalThis.__k6PerfTrackVar';
    return (
      '${' + g + ' ? ' + g + '('
      + JSON.stringify(cls.name) + ', ('
      + expr + '), '
      + JSON.stringify(cls.source) + ', '
      + JSON.stringify(cls.type) + ') : ('
      + expr + ')}'
    );
  });
  return { source: out, wrapped };
}

/**
 * Decide whether an interpolation expression is a trackable variable, and if so
 * its display name, source label, and type. Returns null to leave it untouched.
 */
function classify(expr: string): Classified | null {
  if (!expr) return null;

  // Idempotent: don't re-wrap our own helper or explicit track* calls.
  if (/^__k6PerfTrackVar\s*\(/.test(expr)) return null;
  if (/^track(Parameter|Correlation|DataRow|Auto)\s*\(/.test(expr)) return null;

  // Environment URLs / service hosts are constants, not tracked variables.
  if (/^env\b/.test(expr)) return null;

  // ── Correlation ──────────────────────────────────────────────────────────
  // `correlation_vars["token"]`, `ctx.correlation.token`, or auto-correlation
  // module vars (`c_csrfToken`). These are dynamic, runtime-extracted values.
  const corrBracket = expr.match(/correlation(?:_vars)?\s*[.[]\s*["']?(\w+)["']?\]?\s*$/);
  if (corrBracket) {
    return { name: corrBracket[1], source: 'correlation', type: 'correlation' };
  }
  if (/^c_[A-Za-z0-9_]+$/.test(expr)) {
    return { name: expr, source: 'correlation', type: 'correlation' };
  }

  // ── Parameterization ─────────────────────────────────────────────────────
  // Data-file lookups: getUniqueItem(FILES["pet"])["p_pet"], row["p_user"], etc.
  const filesMatch = expr.match(/FILES\s*\[\s*["'](\w+)["']\s*\]/);
  const propMatch =
    expr.match(/\[\s*["'](\w+)["']\s*\]\s*$/) || expr.match(/\.([A-Za-z_]\w*)\s*$/);

  if (filesMatch || propMatch) {
    const name = propMatch ? propMatch[1] : (filesMatch as RegExpMatchArray)[1];
    const src = filesMatch ? filesMatch[1] : 'data';
    return { name, source: src, type: 'parameter' };
  }

  // Anything else (bare function calls, generators, computed values) — track as a
  // parameter under a sanitized name so it still appears in the table.
  const name = sanitize(expr);
  if (!name) return null;
  return { name, source: 'expression', type: 'parameter' };
}

function sanitize(expr: string): string {
  return expr
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
}
