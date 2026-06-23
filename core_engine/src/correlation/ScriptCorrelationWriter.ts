/**
 * ScriptCorrelationWriter.ts
 * Applies a CorrelationPlan to an ALREADY-GENERATED framework script by
 * post-processing its text — so the generator itself is never touched and the
 * same writer works standalone on any framework-shaped script.
 *
 * For each applied candidate it:
 *   1. substitutes the recorded value with `${c_var}` at every consumer request,
 *   2. inserts a capture line `c_var = trackCorrelation('c_var', extractX(resN, …), …)`
 *      right after the producing request,
 *   3. hoists `let c_var;` to module scope and adds the needed `extract*` imports.
 *
 * Anchors on the generator's stable markers: `replay: { id: "req_N" }` and
 * `const resK = request(`. A request that can't be found is skipped (reported),
 * never guessed.
 */

import {
  CorrelationPlan,
  CorrelationCandidate,
  CorrelationConfidence,
  ExtractorKind,
} from './CorrelationManifest';

interface RequestCall {
  requestId: string;
  resVar: string;
  /** Offset of the statement start (the `const`/resVar token). */
  start: number;
  /** Offset just past the closing `);`. */
  end: number;
  indent: string;
  /** Original text slice [start, end). */
  text: string;
}

export interface ApplyResult {
  script: string;
  applied: Array<{ name: string; producer: string; consumers: number; substitutions: number }>;
  skipped: Array<{ name: string; reason: string }>;
}

export interface ApplyOptions {
  /** Confidence bands to apply when a candidate's own `apply` flag is not already true. */
  applyLevels?: Set<CorrelationConfidence>;
}

const EXTRACT_FN: Record<ExtractorKind, string> = {
  jsonpath: 'extractJson',
  header: 'extractHeader',
  cookie: 'extractCookie',
  boundary: 'extractBoundary',
  regex: 'extractRegex',
};

export class ScriptCorrelationWriter {
  static apply(source: string, plan: CorrelationPlan, options: ApplyOptions = {}): ApplyResult {
    const applyLevels = options.applyLevels ?? new Set<CorrelationConfidence>(['high']);
    const calls = this.indexRequestCalls(source);
    const callById = new Map(calls.map((c) => [c.requestId, c]));

    const applied: ApplyResult['applied'] = [];
    const skipped: ApplyResult['skipped'] = [];

    // Working copy of each request block's text — accumulates substitutions from
    // multiple candidates hitting the same request.
    const working = new Map<string, string>();
    const workingText = (id: string): string | undefined => {
      const c = callById.get(id);
      if (!c) return undefined;
      return working.has(id) ? working.get(id)! : c.text;
    };

    const declares: string[] = [];
    const importsNeeded = new Set<string>(['trackCorrelation']);
    const captures: Array<{ producerId: string; indent: string; text: string }> = [];

    for (const cand of plan.candidates) {
      if (!this.shouldApply(cand, applyLevels)) continue;

      const producer = callById.get(cand.producer.requestId);
      if (!producer) {
        skipped.push({ name: cand.name, reason: `producer ${cand.producer.requestId} not found in script` });
        continue;
      }

      // Tentatively substitute at each consumer; only commit if something matched.
      let substitutions = 0;
      const pending: Array<{ id: string; text: string }> = [];
      const consumerIds = new Set(cand.consumers.map((c) => c.requestId));
      for (const id of consumerIds) {
        const current = workingText(id);
        if (current === undefined) continue;
        const { text, count } = rewriteStringLiterals(current, cand.value, cand.name);
        if (count > 0) {
          pending.push({ id, text });
          substitutions += count;
        }
      }

      if (substitutions === 0) {
        skipped.push({ name: cand.name, reason: 'no consumer sites found in script' });
        continue;
      }

      for (const p of pending) working.set(p.id, p.text);

      declares.push(cand.name);
      const fn = EXTRACT_FN[cand.producer.extractor];
      importsNeeded.add(fn);
      const extractCall = buildExtractCall(producer.resVar, cand.producer.extractor, cand.producer.locator);
      const provenance = `${producer.resVar}.${cand.producer.extractor}:${cand.producer.locator}`;
      captures.push({
        producerId: cand.producer.requestId,
        indent: producer.indent,
        text: `${cand.name} = trackCorrelation(${JSON.stringify(cand.name)}, ${extractCall}, ${JSON.stringify(provenance)});`,
      });

      applied.push({
        name: cand.name,
        producer: cand.producer.requestId,
        consumers: consumerIds.size,
        substitutions,
      });
    }

    if (applied.length === 0) {
      return { script: source, applied, skipped };
    }

    // ── Apply offset-based edits (block rewrites + capture insertions) ──
    type Edit = { start: number; end: number; replacement: string };
    const edits: Edit[] = [];
    for (const [id, text] of working) {
      const call = callById.get(id)!;
      if (text !== call.text) edits.push({ start: call.start, end: call.end, replacement: text });
    }
    for (const cap of captures) {
      const call = callById.get(cap.producerId)!;
      edits.push({ start: call.end, end: call.end, replacement: `\n${cap.indent}${cap.text}` });
    }
    edits.sort((a, b) => b.start - a.start || b.end - a.end);

    let result = source;
    for (const edit of edits) {
      result = result.slice(0, edit.start) + edit.replacement + result.slice(edit.end);
    }

    // ── Module-scope declarations + imports (anchor-based, offset-independent) ──
    result = this.injectDeclarations(result, declares);
    result = this.injectImports(result, importsNeeded);

    return { script: result, applied, skipped };
  }

  private static shouldApply(cand: CorrelationCandidate, applyLevels: Set<CorrelationConfidence>): boolean {
    return cand.apply === true || applyLevels.has(cand.confidence);
  }

  /** Locate every `[const|let] resVar = request(...)` call and tag it by replay id. */
  private static indexRequestCalls(source: string): RequestCall[] {
    const calls: RequestCall[] = [];
    const re = /(?:\b(?:const|let|var)\s+)?([A-Za-z_$][\w$]*)\s*=\s*request\s*\(/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) {
      const resVar = m[1];
      const openParen = source.indexOf('(', m.index + m[0].length - 1);
      if (openParen === -1) continue;
      const closeParen = matchParen(source, openParen);
      if (closeParen === -1) continue;

      let end = closeParen + 1;
      while (end < source.length && /\s/.test(source[end])) end++;
      if (source[end] === ';') end++;

      const callText = source.slice(m.index, end);
      const idMatch = /replay\s*:\s*\{[^}]*\bid\s*:\s*['"]([^'"]+)['"]/.exec(callText);
      if (!idMatch) continue; // no replay id → not a generator-shaped request we can anchor

      calls.push({
        requestId: idMatch[1],
        resVar,
        start: m.index,
        end,
        indent: leadingIndent(source, m.index),
        text: callText,
      });
      re.lastIndex = end;
    }
    return calls;
  }

  private static injectDeclarations(source: string, names: string[]): string {
    if (names.length === 0) return source;
    const unique = [...new Set(names)];
    const block =
      `// ── auto-correlation captured variables (per-VU, module scope) ──\n` +
      unique.map((n) => `let ${n};`).join('\n') +
      `\n\n`;

    const anchor = source.indexOf('const __journeyLifecycleStore');
    if (anchor !== -1) {
      return source.slice(0, anchor) + block + source.slice(anchor);
    }
    const fnAnchor = source.search(/\nexport\s+function\s/);
    if (fnAnchor !== -1) {
      return source.slice(0, fnAnchor + 1) + block + source.slice(fnAnchor + 1);
    }
    // Fallback: after the last import line.
    return insertAfterImports(source, '\n' + block);
  }

  private static injectImports(source: string, needed: Set<string>): string {
    // Collect identifiers already imported ANYWHERE (barrel or per-util paths)
    // so we never re-declare a binding (e.g. trackCorrelation from replayLogger.js).
    const importStmtRe = /import\s*\{([^}]*)\}\s*from\s*['"][^'"]+['"]\s*;?/g;
    const already = new Set<string>();
    let im: RegExpExecArray | null;
    while ((im = importStmtRe.exec(source)) !== null) {
      for (const n of im[1].split(',').map((s) => s.trim()).filter(Boolean)) already.add(n);
    }
    const missing = [...needed].filter((n) => !already.has(n));
    if (missing.length === 0) return source;

    // Prefer merging the missing names into an existing dist/index.js barrel.
    const barrelRe = /import\s*\{([^}]*)\}\s*from\s*(['"])([^'"]*dist\/index\.js)\2\s*;?/;
    const m = barrelRe.exec(source);
    if (m) {
      const existing = m[1].split(',').map((s) => s.trim()).filter(Boolean);
      const rebuilt = `import { ${[...existing, ...missing].join(', ')} } from ${m[2]}${m[3]}${m[2]};`;
      return source.slice(0, m.index) + rebuilt + source.slice(m.index + m[0].length);
    }

    // Otherwise add a barrel import for ONLY the missing names, matching the
    // relative depth the script already uses for its dist imports.
    const depth = /from\s*['"]((?:\.\.\/)+)dist\//.exec(source);
    const prefix = depth ? depth[1] : '../../../';
    const importLine = `import { ${missing.join(', ')} } from '${prefix}dist/index.js';\n`;
    return insertAfterImports(source, importLine);
  }
}

// ── Free helpers ──

function buildExtractCall(resVar: string, extractor: ExtractorKind, locator: string): string {
  switch (extractor) {
    case 'jsonpath':
      return `extractJson(${resVar}, ${JSON.stringify(locator)})`;
    case 'header':
      return `extractHeader(${resVar}, ${JSON.stringify(locator)})`;
    case 'cookie':
      return `extractCookie(${resVar}, ${JSON.stringify(locator)})`;
    case 'boundary': {
      const bm = /lb=([\s\S]*?);;rb=([\s\S]*)$/.exec(locator);
      const left = bm ? bm[1] : '';
      const right = bm ? bm[2] : '';
      return `extractBoundary(${resVar}, ${JSON.stringify(left)}, ${JSON.stringify(right)})`;
    }
    case 'regex':
      return `extractRegex(${resVar}, ${JSON.stringify(locator)})`;
    default:
      return `extractRegex(${resVar}, ${JSON.stringify(locator)})`;
  }
}

/**
 * Rewrite string literals in `block` that contain `value`, replacing the value
 * with `${cvar}`. Double-quoted literals are converted to template literals;
 * existing template literals get an in-place substitution. Returns the new text
 * and the number of literals rewritten.
 */
function rewriteStringLiterals(block: string, value: string, cvar: string): { text: string; count: number } {
  let count = 0;
  const token = '${' + cvar + '}';

  // 1. Double-quoted "..." → backtick template when they contain the value.
  let text = block.replace(/"((?:[^"\\]|\\.)*)"/g, (whole, inner: string) => {
    if (!inner.includes(value)) return whole;
    count++;
    const escaped = inner.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    return '`' + escaped.split(value).join(token) + '`';
  });

  // 2. Existing backtick `...` literals → in-place substitution (e.g. URL templates).
  text = text.replace(/`((?:[^`\\]|\\.)*)`/g, (whole, inner: string) => {
    if (!inner.includes(value)) return whole;
    count++;
    return '`' + inner.split(value).join(token) + '`';
  });

  return { text, count };
}

/** Find the matching `)` for the `(` at openIdx, ignoring string contents. */
function matchParen(src: string, openIdx: number): number {
  let depth = 0;
  let inStr: string | null = null;
  let escaped = false;
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (inStr) {
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function leadingIndent(source: string, offset: number): string {
  let lineStart = offset;
  while (lineStart > 0 && source[lineStart - 1] !== '\n') lineStart--;
  let i = lineStart;
  while (i < source.length && (source[i] === ' ' || source[i] === '\t')) i++;
  return source.slice(lineStart, i);
}

function insertAfterImports(source: string, insertion: string): string {
  const lines = source.split('\n');
  let lastImport = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*import\s/.test(lines[i])) lastImport = i;
  }
  if (lastImport === -1) return insertion + source;
  lines.splice(lastImport + 1, 0, insertion.replace(/\n$/, ''));
  return lines.join('\n');
}
