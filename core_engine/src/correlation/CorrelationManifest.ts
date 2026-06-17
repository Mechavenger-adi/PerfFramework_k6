/**
 * CorrelationManifest.ts
 * Types + load/save for the auto-correlation feature.
 *
 * The scanner consumes a normalized `RecordingExchange[]` (built by the CLI from
 * either a HAR file or a recording-log.json) and produces a `CorrelationPlan`.
 * The plan is persisted as a human-reviewable manifest (`<name>.correlation.json`)
 * that users can edit (toggle `apply`, rename a variable, fix a boundary) and
 * re-apply. Nothing here runs inside k6 — it is all design-time, Node-side.
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Input model (structural subset of debug/ExchangeLog TaggedExchangeLogEntry) ──

export interface RecordingHeader {
  name: string;
  value: string;
}

export interface RecordingCookie {
  name: string;
  value: string;
}

export interface RecordingRequest {
  method: string;
  url: string;
  headers: RecordingHeader[];
  queryParams?: Record<string, string>;
  cookies?: RecordingCookie[];
  body?: string;
}

export interface RecordingResponse {
  status: number;
  headers: RecordingHeader[];
  cookies?: RecordingCookie[];
  body?: string;
}

/**
 * One recorded request/response exchange in recording order. `id` mirrors the
 * generator's `replay.id` (`req_1`, `req_2`, …) so the script writer can anchor
 * captures and substitutions to specific requests.
 */
export interface RecordingExchange {
  id: string;
  transaction: string;
  request: RecordingRequest;
  response: RecordingResponse;
}

// ── Output model ──

export type CorrelationConfidence = 'high' | 'medium' | 'low';
export type ProducerSource = 'json' | 'header' | 'set-cookie' | 'html';
export type ExtractorKind = 'jsonpath' | 'header' | 'cookie' | 'boundary' | 'regex';
export type ConsumerLocation = 'url' | 'query' | 'body' | 'header' | 'cookie';

export interface CorrelationProducer {
  /** Recording request whose RESPONSE produced the value (e.g. 'req_1'). */
  requestId: string;
  source: ProducerSource;
  extractor: ExtractorKind;
  /**
   * Extractor argument: a JSON dot-path, header name, cookie name, regex, or
   * a boundary spec `lb=<left>;;rb=<right>`.
   */
  locator: string;
}

export interface CorrelationConsumer {
  /** Recording request that SENT the value (e.g. 'req_2'). */
  requestId: string;
  in: ConsumerLocation;
  /** Header name, query key, or json path where the value appeared. */
  locator: string;
}

export interface CorrelationCandidate {
  /** Generated variable name, `c_`-prefixed and unique within the plan. */
  name: string;
  /** Sample value from the recording — for human review only, not used at runtime. */
  value: string;
  confidence: CorrelationConfidence;
  /** Whether the writer applies this candidate. Auto-true for `high`. User-editable. */
  apply: boolean;
  producer: CorrelationProducer;
  consumers: CorrelationConsumer[];
  /** Human-readable scoring reasons, e.g. ['name-match:csrf', 'jwt-shape']. */
  reason: string[];
  /** True when this value is a plain cookie k6's jar already replays — informational. */
  handledByJar?: boolean;
}

export interface CorrelationPlan {
  /** Schema/version marker so future manifests can migrate. */
  version: 1;
  generatedAt: string;
  /** Source the scan ran against (har path or recording-log path), for provenance. */
  source?: string;
  candidates: CorrelationCandidate[];
}

// ── Persistence ──

export class CorrelationManifest {
  static save(plan: CorrelationPlan, outPath: string): void {
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outPath, JSON.stringify(plan, null, 2), 'utf-8');
  }

  static load(manifestPath: string): CorrelationPlan {
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const parsed = JSON.parse(raw) as CorrelationPlan;
    if (!parsed || !Array.isArray(parsed.candidates)) {
      throw new Error(`Invalid correlation manifest at ${manifestPath}: missing candidates[]`);
    }
    return parsed;
  }

  /** Default manifest path alongside a recording log: <dir>/<base>.correlation.json. */
  static defaultPathForScript(scriptPath: string, recordingsDir: string): string {
    const base = path.parse(scriptPath).name;
    return path.join(recordingsDir, `${base}.correlation.json`);
  }
}
