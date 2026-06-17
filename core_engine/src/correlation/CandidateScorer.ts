/**
 * CandidateScorer.ts
 * Phase 3 of the scan — the "smart" filter. Turns raw producer→consumer links
 * into scored candidates, dropping noise and ranking the rest high/medium/low.
 *
 * Drops:
 *   • cookie round-trips k6's jar already replays (handledByJar)
 *   • values the client already had before the server "produced" them (constants/inputs)
 *   • known parameterisation values (those are p_, not c_)
 *   • deny-listed literals / too-short low-entropy values without a name hint
 *
 * Boosts: dynamic-vocabulary key names, JWT/UUID/hex shapes, high entropy, length.
 */

import * as fs from 'fs';
import { RawCandidate } from './LinkMatcher';
import { IndexedValues } from './ValueIndexer';
import { CorrelationConfidence } from './CorrelationManifest';

export interface ScorerConfig {
  minValueLength: number;
  vocabulary: string[];
  denyValues: string[];
  thresholds: { high: number; medium: number; low: number };
}

export interface ScoredCandidate extends RawCandidate {
  confidence: CorrelationConfidence;
  score: number;
  reasons: string[];
  handledByJar: boolean;
  /** Best vocabulary/locator-derived name hint (no c_ prefix yet). */
  nameHint: string;
}

export interface ScoreOptions {
  /** Values known to come from data files — treated as parameterisation, not correlation. */
  knownParameterValues?: Set<string>;
  /** Path to a JSON config overriding the embedded defaults. */
  configPath?: string;
}

const DEFAULT_CONFIG: ScorerConfig = {
  minValueLength: 6,
  vocabulary: [
    'csrf', 'xsrf', 'token', 'jwt', 'bearer', 'session', 'sid', 'ssid',
    'viewstate', 'eventvalidation', 'nonce', 'state', 'code', 'verification',
    'requestverificationtoken', 'antiforgery', 'authenticity', 'saml', 'oauth',
    'auth', 'access', 'refresh', 'id_token', 'transaction', 'txn', 'order',
    'cart', 'correlation', 'request', 'trace', 'challenge', 'otp', 'ticket',
    'continuation', 'sync', 'execution', 'flowkey', 'formkey',
  ],
  denyValues: ['true', 'false', 'null', 'undefined', 'none', 'application/json', 'text/html'],
  thresholds: { high: 5, medium: 3, low: 1 },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const JWT_RE = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]*)?$/;
const HEX_RE = /^[0-9a-f]+$/i;
const BASE64ISH_RE = /^[A-Za-z0-9+/_=-]+$/;

export class CandidateScorer {
  static loadConfig(configPath?: string): ScorerConfig {
    if (!configPath || !fs.existsSync(configPath)) return DEFAULT_CONFIG;
    try {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Partial<ScorerConfig>;
      return {
        minValueLength: parsed.minValueLength ?? DEFAULT_CONFIG.minValueLength,
        vocabulary: parsed.vocabulary ?? DEFAULT_CONFIG.vocabulary,
        denyValues: parsed.denyValues ?? DEFAULT_CONFIG.denyValues,
        thresholds: { ...DEFAULT_CONFIG.thresholds, ...(parsed.thresholds ?? {}) },
      };
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  static score(
    candidates: RawCandidate[],
    indexed: IndexedValues,
    options: ScoreOptions = {},
  ): ScoredCandidate[] {
    const config = this.loadConfig(options.configPath);
    const vocab = config.vocabulary.map((v) => v.toLowerCase());
    const deny = new Set(config.denyValues.map((v) => v.toLowerCase()));
    const knownParams = options.knownParameterValues ?? new Set<string>();

    // Earliest exchange in which each value was SENT (used to detect constants/inputs).
    const minConsumerIndex = new Map<string, number>();
    for (const c of indexed.consumers) {
      const prev = minConsumerIndex.get(c.value);
      if (prev === undefined || c.exchangeIndex < prev) minConsumerIndex.set(c.value, c.exchangeIndex);
    }

    const out: ScoredCandidate[] = [];

    for (const cand of candidates) {
      const value = cand.value;
      const lower = value.toLowerCase();

      // ── Hard drops ──
      if (deny.has(lower)) continue;
      if (knownParams.has(value)) continue; // parameterisation, not correlation

      // Cookie round-trip the jar already handles: produced as Set-Cookie and only
      // ever sent back as that same cookie. Correlating it is redundant/harmful.
      const handledByJar =
        cand.producer.source === 'set-cookie' &&
        cand.consumers.length > 0 &&
        cand.consumers.every((c) => c.in === 'cookie' && c.locator === cand.producer.locator);
      if (handledByJar) continue;

      // Constant/input: the client already sent this value at or before the
      // response that supposedly produced it.
      const firstSent = minConsumerIndex.get(value);
      if (firstSent !== undefined && firstSent <= cand.producer.exchangeIndex) continue;

      // ── Scoring ──
      const reasons: string[] = [];
      let score = 0;

      const locators = [cand.producer.locator, ...cand.consumers.map((c) => c.locator)].join(' ').toLowerCase();
      const matchedWord = vocab.find((w) => locators.includes(w));
      const nameMatch = Boolean(matchedWord);
      if (nameMatch) {
        score += 3;
        reasons.push(`name-match:${matchedWord}`);
      }

      if (JWT_RE.test(value)) {
        score += 4;
        reasons.push('jwt-shape');
      } else if (UUID_RE.test(value)) {
        score += 3;
        reasons.push('uuid-shape');
      } else if (HEX_RE.test(value) && value.length >= 24) {
        score += 2;
        reasons.push('long-hex');
      } else if (BASE64ISH_RE.test(value) && value.length >= 20) {
        score += 2;
        reasons.push('opaque-token');
      }

      const entropy = shannonBits(value);
      if (entropy >= 3.2) {
        score += 2;
        reasons.push('high-entropy');
      } else if (entropy < 2.0 && !nameMatch) {
        score -= 2;
        reasons.push('low-entropy');
      }

      if (value.length >= 20) {
        score += 1;
        reasons.push('long-value');
      }
      if (cand.producer.source === 'html') {
        score += 1;
        reasons.push('html-hidden-field');
      }
      if (cand.consumers.length === 1) {
        score += 0.5;
        reasons.push('single-use');
      }

      // Pure short numeric ids with no name hint are usually static enums.
      if (/^\d+$/.test(value) && value.length < 8 && !nameMatch) {
        score -= 2;
        reasons.push('short-numeric');
      }

      // Too short / weak with no supporting signal → drop.
      if (value.length < config.minValueLength && !nameMatch) continue;
      if (score < config.thresholds.low) continue;

      const confidence: CorrelationConfidence =
        score >= config.thresholds.high ? 'high' : score >= config.thresholds.medium ? 'medium' : 'low';

      out.push({
        ...cand,
        confidence,
        score: Math.round(score * 10) / 10,
        reasons,
        handledByJar: false,
        nameHint: deriveNameHint(matchedWord, cand),
      });
    }

    // Most confident first — nicer manifest + stable apply order.
    out.sort((a, b) => b.score - a.score);
    return out;
  }
}

function shannonBits(s: string): number {
  if (!s) return 0;
  const freq: Record<string, number> = {};
  for (const ch of s) freq[ch] = (freq[ch] || 0) + 1;
  let h = 0;
  const n = s.length;
  for (const ch of Object.keys(freq)) {
    const p = freq[ch] / n;
    h -= p * Math.log2(p);
  }
  return h;
}

/** Pick a readable base name from a vocab hit or the most descriptive locator. */
function deriveNameHint(matchedWord: string | undefined, cand: RawCandidate): string {
  if (matchedWord) return matchedWord;
  const candidates = [
    cand.producer.locator,
    ...cand.consumers.map((c) => c.locator),
  ].filter((l) => l && l !== 'path');
  for (const loc of candidates) {
    const seg = loc.split('.').pop() || loc;
    const clean = seg.replace(/[^A-Za-z0-9]/g, '');
    if (clean.length >= 2) return clean;
  }
  return 'value';
}
