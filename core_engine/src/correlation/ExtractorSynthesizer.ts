/**
 * ExtractorSynthesizer.ts
 * Phase 4 of the scan: turn scored candidates into final manifest candidates by
 * choosing the most robust extractor and a unique variable name.
 *
 *   json       → jsonpath  (dot path)
 *   header     → header    (name)
 *   set-cookie → cookie    (name)
 *   html       → boundary  (lb=<left>;;rb=<right>, widened until it uniquely
 *                           locates the value) — or a regex fallback
 */

import { ScoredCandidate } from './CandidateScorer';
import {
  RecordingExchange,
  CorrelationCandidate,
  CorrelationConsumer,
  ExtractorKind,
} from './CorrelationManifest';

export class ExtractorSynthesizer {
  static synthesize(scored: ScoredCandidate[], exchanges: RecordingExchange[]): CorrelationCandidate[] {
    const usedNames = new Set<string>();
    const out: CorrelationCandidate[] = [];

    for (const cand of scored) {
      const name = this.uniqueName(cand.nameHint, usedNames);
      const { extractor, locator } = this.chooseExtractor(cand, exchanges);

      const consumers: CorrelationConsumer[] = cand.consumers.map((c) => ({
        requestId: c.requestId,
        in: c.in,
        locator: c.locator,
      }));

      out.push({
        name,
        value: cand.value,
        confidence: cand.confidence,
        apply: cand.confidence === 'high',
        producer: {
          requestId: cand.producer.requestId,
          source: cand.producer.source,
          extractor,
          locator,
        },
        consumers,
        reason: cand.reasons,
        handledByJar: cand.handledByJar,
      });
    }

    return out;
  }

  private static chooseExtractor(
    cand: ScoredCandidate,
    exchanges: RecordingExchange[],
  ): { extractor: ExtractorKind; locator: string } {
    switch (cand.producer.source) {
      case 'json':
        return { extractor: 'jsonpath', locator: cand.producer.locator };
      case 'header':
        return { extractor: 'header', locator: cand.producer.locator };
      case 'set-cookie':
        return { extractor: 'cookie', locator: cand.producer.locator };
      case 'html': {
        const body = exchanges[cand.producer.exchangeIndex]?.response.body ?? '';
        // Prefer a clean, semantic boundary built from the field name
        // (`name="field" value="` / `"`); fall back to a scanned boundary.
        const boundary =
          semanticHtmlBoundary(body, cand.producer.locator, cand.value) ??
          synthesizeBoundary(body, cand.value);
        if (boundary) {
          return { extractor: 'boundary', locator: `lb=${boundary.left};;rb=${boundary.right}` };
        }
        // Fallback: anchored regex capturing the exact value occurrence.
        return { extractor: 'regex', locator: buildRegexFallback(body, cand.value) };
      }
      default:
        return { extractor: 'regex', locator: escapeRegex(cand.value) };
    }
  }

  private static uniqueName(hint: string, used: Set<string>): string {
    let base = `c_${sanitizeIdentifier(hint)}`;
    if (base === 'c_') base = 'c_value';
    let name = base;
    let n = 2;
    while (used.has(name)) {
      name = `${base}_${n++}`;
    }
    used.add(name);
    return name;
  }
}

function sanitizeIdentifier(raw: string): string {
  let s = (raw || 'value').replace(/[^A-Za-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  if (!s) s = 'value';
  if (!/^[A-Za-z_]/.test(s)) s = `v_${s}`;
  return s.slice(0, 40);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a left/right boundary that locates `value` in `body`. Grows the left
 * boundary until the (lb, rb) pair uniquely points at the value; falls back to
 * the shortest boundary whose first match is the value.
 */
/**
 * Build a clean boundary from a known HTML field name, e.g.
 * `name="csrf" value="<value>"` → lb=`name="csrf" value="`, rb=`"`. Tries the
 * common attribute orderings/quotings and returns the first whose first match
 * is the value. Returns null when the field/value layout doesn't fit (caller
 * falls back to a scanned boundary).
 */
function semanticHtmlBoundary(body: string, field: string, value: string): { left: string; right: string } | null {
  if (!body || !field) return null;
  const tries: Array<{ left: string; right: string }> = [
    { left: `name="${field}" value="`, right: '"' },
    { left: `name='${field}' value='`, right: "'" },
    { left: `id="${field}" value="`, right: '"' },
    { left: `name="${field}" content="`, right: '"' },
    { left: `property="${field}" content="`, right: '"' },
  ];
  for (const t of tries) {
    if (locateWithBoundary(body, t.left, t.right).firstValue === value) return t;
  }
  return null;
}

function synthesizeBoundary(body: string, value: string): { left: string; right: string } | null {
  if (!body) return null;
  const idx = body.indexOf(value);
  if (idx === -1) return null;

  const after = body.slice(idx + value.length);
  // Prefer a structural right boundary (quote, angle bracket, amp) when present.
  const right = after.length > 0 ? after[0] : '';

  let firstCorrect: { left: string; right: string } | null = null;
  for (let lbLen = 1; lbLen <= 48; lbLen++) {
    const start = idx - lbLen;
    if (start < 0) break;
    const left = body.slice(start, idx);
    if (left.includes(value)) continue;
    const match = locateWithBoundary(body, left, right);
    if (match.firstValue !== value) continue;
    if (match.count === 1) return { left, right }; // unique — best
    if (!firstCorrect) firstCorrect = { left, right };
  }
  return firstCorrect;
}

function locateWithBoundary(
  body: string,
  left: string,
  right: string,
): { count: number; firstValue: string | null } {
  let from = 0;
  let count = 0;
  let firstValue: string | null = null;
  while (true) {
    const start = left ? body.indexOf(left, from) : from;
    if (start === -1) break;
    const valueStart = start + left.length;
    const end = right ? body.indexOf(right, valueStart) : body.length;
    if (end === -1) break;
    if (count === 0) firstValue = body.slice(valueStart, end);
    count++;
    from = right ? end + right.length : valueStart + 1;
    if (count > 1) break;
    if (from > body.length) break;
  }
  return { count, firstValue };
}

function buildRegexFallback(body: string, value: string): string {
  // Use a short left anchor + capture group so extractRegex returns the value.
  const idx = body.indexOf(value);
  if (idx === -1) return `(${escapeRegex(value)})`;
  const left = body.slice(Math.max(0, idx - 12), idx);
  return `${escapeRegex(left)}(${escapeRegex(value)})`;
}
