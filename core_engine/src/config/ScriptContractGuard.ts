import * as fs from 'fs';

export interface CallHit {
  /** 1-based line number of the offending call. */
  line: number;
  /** Trimmed source of that line, for the error message. */
  text: string;
}

export interface ApiViolation {
  /** The native k6 API used (e.g. 'check', 'group'). */
  api: string;
  /** The framework API the author should use instead. */
  replacement: string;
  /** One-line reason the native k6 API breaks accurate reporting. */
  reason: string;
  /** The `import { … } from 'k6'` line that pulled the API in, if present. */
  importLine?: string;
  /** Every located call site (comment-stripped). */
  usages: CallHit[];
}

export interface FileViolations {
  /** Script path that violated the contract. */
  file: string;
  violations: ApiViolation[];
}

interface ContractRule {
  k6Import: string;
  callRe: RegExp;
  replacement: string;
  reason: string;
}

/**
 * Pre-flight contract guard for journey scripts.
 *
 * The framework reports EXACT per-iteration transaction pass/fail from the
 * `<name>_checkrate` Rate metric, which only exists when checks run via
 * `k6Check()` INSIDE a `transaction()`. Two native k6 APIs silently break that
 * guarantee, so a script using either is rejected before k6 launches — no
 * fallback, no approximate results:
 *
 *   • native `check()`  → its pass/fail never reaches the checkrate metric.  → k6Check()
 *   • native `group()`  → it measures a unit with no checkrate metric.       → transaction()
 *
 * A violation is flagged when EITHER the API is imported from 'k6' OR it is
 * called directly in the script — so a bare `check(...)`/`group(...)` call is
 * caught even without the import (in real k6 that's a runtime ReferenceError,
 * which we'd rather stop at pre-flight than at runtime). The call matcher uses a
 * `(?<![A-Za-z0-9_$.])` lookbehind so `k6Check(`, `obj.check(` and `recheck(`
 * are never matched; a script that defines its own local `check`/`group`
 * function is the only false-positive surface, which is acceptable since those
 * names are reserved by the framework contract. (Namespace imports —
 * `import * as k6 from 'k6'; k6.group()` — are an unsupported edge.)
 */
export class ScriptContractGuard {
  private static readonly RULES: ContractRule[] = [
    {
      k6Import: 'check',
      callRe: /(?<![A-Za-z0-9_$.])check\s*\(/,
      replacement: 'k6Check()',
      reason: 'Failures from check() are not included in transaction-level pass/fail metrics.',
    },
    {
      k6Import: 'group',
      callRe: /(?<![A-Za-z0-9_$.])group\s*\(/,
      replacement: 'transaction()',
      reason: 'group() does not generate transaction pass/fail metrics.',
    },
  ];

  private static readonly K6_IMPORT_RE = /import\s*\{([^}]*)\}\s*from\s*['"]k6['"]/;

  /** Names imported from the 'k6' module (aliases resolved to the original). */
  private static k6Imports(source: string): Set<string> {
    const names = new Set<string>();
    for (const m of source.matchAll(new RegExp(this.K6_IMPORT_RE, 'g'))) {
      for (const raw of m[1].split(',')) {
        const original = raw.trim().split(/\s+as\s+/)[0].trim();
        if (original) names.add(original);
      }
    }
    return names;
  }

  /** The `import { … } from 'k6'` line that names `apiName`, trimmed. */
  private static importLineFor(source: string, apiName: string): string | undefined {
    for (const raw of source.split(/\r?\n/)) {
      const m = raw.match(this.K6_IMPORT_RE);
      if (!m) continue;
      const names = m[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0].trim());
      if (names.includes(apiName)) return raw.trim();
    }
    return undefined;
  }

  /**
   * Find bare call sites for `callRe`, with line numbers. Runs against a
   * comment- and string-blanked copy of the source so a call that's commented
   * out — or text that merely LOOKS like a comment inside a string (e.g. the
   * star-slash-star in an `accept: ...` header value, whose embedded
   * slash-star / star-slash substrings would otherwise be read as block-comment
   * markers) — never affects detection.
   */
  private static findCalls(source: string, callRe: RegExp): CallHit[] {
    const hits: CallHit[] = [];
    const cleaned = this.blankCommentsAndStrings(source).split(/\r?\n/);
    const original = source.split(/\r?\n/);
    cleaned.forEach((line, i) => {
      if (callRe.test(line)) hits.push({ line: i + 1, text: (original[i] ?? '').trim() });
    });
    return hits;
  }

  /**
   * Return `source` with comment bodies and string contents replaced by spaces
   * (newlines preserved, so line numbers are unchanged). A small char scanner
   * tracks line/block comments and ', ", ` strings, so comment markers inside
   * strings (and code inside comments) can't fool the call matcher.
   */
  private static blankCommentsAndStrings(source: string): string {
    let out = '';
    let state: 'code' | 'line' | 'block' | 'sq' | 'dq' | 'tpl' = 'code';
    for (let i = 0; i < source.length; i += 1) {
      const c = source[i];
      const c2 = i + 1 < source.length ? source[i + 1] : '';
      const nl = c === '\n';
      switch (state) {
        case 'code':
          if (c === '/' && c2 === '/') { state = 'line'; out += '  '; i += 1; }
          else if (c === '/' && c2 === '*') { state = 'block'; out += '  '; i += 1; }
          else if (c === "'") { state = 'sq'; out += ' '; }
          else if (c === '"') { state = 'dq'; out += ' '; }
          else if (c === '`') { state = 'tpl'; out += ' '; }
          else out += c;
          break;
        case 'line':
          if (nl) { state = 'code'; out += '\n'; } else out += ' ';
          break;
        case 'block':
          if (c === '*' && c2 === '/') { state = 'code'; out += '  '; i += 1; }
          else out += nl ? '\n' : ' ';
          break;
        case 'sq':
        case 'dq':
        case 'tpl': {
          const quote = state === 'sq' ? "'" : state === 'dq' ? '"' : '`';
          if (c === '\\') { out += '  '; i += 1; } // skip escaped char
          else if (c === quote) { state = 'code'; out += ' '; }
          else if (nl && state !== 'tpl') { state = 'code'; out += '\n'; } // unterminated ' or "
          else out += nl ? '\n' : ' ';
          break;
        }
      }
    }
    return out;
  }

  /** Detect every native k6 API used in `source` that the framework forbids. */
  static scan(source: string): ApiViolation[] {
    const imports = this.k6Imports(source);
    const out: ApiViolation[] = [];
    for (const rule of this.RULES) {
      const imported = imports.has(rule.k6Import);
      const usages = this.findCalls(source, rule.callRe);
      // Flag on EITHER an import or a direct call — a bare check()/group() call
      // is a violation even when the import is missing.
      if (!imported && usages.length === 0) continue;
      out.push({
        api: rule.k6Import,
        replacement: rule.replacement,
        reason: rule.reason,
        importLine: imported ? this.importLineFor(source, rule.k6Import) : undefined,
        usages,
      });
    }
    return out;
  }

  /** Scan a script file; returns its violations, or null when clean/unreadable. */
  static scanFile(scriptPath: string): FileViolations | null {
    let source: string;
    try {
      source = fs.readFileSync(scriptPath, 'utf-8');
    } catch {
      return null; // unreadable path is surfaced by the executor; don't block here
    }
    const violations = this.scan(source);
    return violations.length > 0 ? { file: scriptPath, violations } : null;
  }

  /**
   * Render the "Framework Validation Failed" report for one or more offending
   * scripts. Matches the operator-facing format used by the pre-flight.
   */
  static format(files: FileViolations[]): string {
    const lines: string[] = [];
    lines.push('Framework Validation Failed');
    lines.push('');
    lines.push('Unsupported native k6 APIs were detected in:');
    lines.push('');
    for (const f of files) lines.push(`  ${f.file}`);
    lines.push('');
    lines.push('This framework requires transaction() and k6Check() to generate accurate');
    lines.push("per-iteration pass/fail reporting. Native k6 APIs bypass the framework's");
    lines.push('tracking layer and can produce incomplete or incorrect results.');
    lines.push('');
    lines.push('Required fixes:');

    const multi = files.length > 1;
    for (const f of files) {
      if (multi) {
        lines.push('');
        lines.push(`  ${f.file}`);
      }
      for (const v of f.violations) {
        lines.push('');
        lines.push(`  ❌ Detected native k6 ${v.api}(), kindly replace with: ${v.replacement}`);
        lines.push(`     Reason: ${v.reason}`);
        if (v.importLine) {
          lines.push('');
          lines.push('     Detected import:');
          lines.push(`       ${v.importLine}`);
        }
        if (v.usages.length > 0) {
          lines.push('');
          lines.push(`     Detected usage (${v.usages.length}):`);
          const MAX = 10;
          for (const u of v.usages.slice(0, MAX)) {
            lines.push(`       Line ${u.line}:  ${u.text}`);
          }
          if (v.usages.length > MAX) {
            lines.push(`       … and ${v.usages.length - MAX} more`);
          }
        }
      }
    }
    return lines.join('\n');
  }

  /**
   * Throw a `Framework Validation Failed` Error if `source` (identified by
   * `label`) uses any native k6 API the framework forbids. No-op when the
   * script is clean. Used by the standalone debug path; the run path uses
   * scanFile + format via the pre-flight gatekeeper.
   */
  static assertClean(label: string, source: string): void {
    const violations = this.scan(source);
    if (violations.length === 0) return;
    throw new Error(this.format([{ file: label, violations }]));
  }
}
