/**
 * HistogramArtifactBuilder.ts
 * Phase 0 of distributed aggregation (see
 * .md/Distributed-Load-Test-Design-Approach.md §2).
 *
 * Reads a finished k6 `metrics-stream.json` (the line-delimited `--out json=`
 * output every run already produces) and rolls duration samples into per-time-bucket
 * RelativeHistograms — one set per transaction plus an overall http_req_duration set.
 * The result is a compact, MERGEABLE per-machine artifact (`metrics-histogram.json`)
 * that the distributed merge engine sums across machines to derive exact-to-0.1%
 * percentiles for the whole run and for any sub-window.
 *
 * INVARIANT (see §2.4): the histogram ingests **100% of the data, from t=0** — it is
 * never gated by the raw-retention cap. Crossing the cap only forfeits the optional
 * raw/exact bonus; the histogram always covers the entire run.
 *
 * Non-invasive: this is a standalone post-run pass over the same file the timeseries
 * parser reads. It touches no live execution path. Live/incremental rolling (which
 * also bounds raw disk for endurance) is a Phase-2 enhancement.
 */

import * as fs from 'fs';
import * as readline from 'readline';
import { HistogramJSON, RelativeHistogram } from './Histogram';

/** Key for the overall (all-requests) http_req_duration histogram series. */
export const OVERVIEW_KEY = '__http_req_duration__';

export interface HistogramArtifact {
  schemaVersion: number;
  metric: 'duration-histograms';
  /** Histogram time-bucket size (seconds). A whole multiple of the counter bucket. */
  bucketSeconds: number;
  /** Relative-accuracy (alpha) every histogram in this artifact was built with. */
  relativeAccuracy: number;
  startTime: string;
  endTime: string;
  /** http_req_duration across all requests, keyed by bucket-start epoch ms (string). */
  overview: Record<string, HistogramJSON>;
  /** Per-transaction duration (the `<txn>` Trend), keyed by txn name → bucket → hist. */
  transactions: Record<string, Record<string, HistogramJSON>>;
}

export interface BuildHistogramOptions {
  /** Histogram time-bucket size in seconds (default 10). */
  bucketSeconds?: number;
  /** Relative accuracy alpha (default 0.001 = 0.1% / "3 significant figures"). */
  relativeAccuracy?: number;
  /**
   * Transaction-name allowlist from the run manifest, so we know which custom-named
   * Trend metrics are transaction durations. When omitted, we fall back to attributing
   * http_req_duration by the native `group` tag (`::<txn>`, stripped).
   */
  transactionNames?: string[];
}

export class HistogramArtifactBuilder {
  /** Build the artifact in memory. Returns null if the stream is missing/empty. */
  static async build(
    streamPath: string,
    options: BuildHistogramOptions = {},
  ): Promise<HistogramArtifact | null> {
    if (!fs.existsSync(streamPath) || fs.statSync(streamPath).size === 0) return null;

    const bucketSeconds = Math.max(1, Math.floor(options.bucketSeconds ?? 10));
    const alpha = options.relativeAccuracy ?? 0.001;
    const bucketMs = bucketSeconds * 1000;
    const knownTxns = new Set(options.transactionNames ?? []);

    const overview = new Map<number, RelativeHistogram>();
    const txns = new Map<string, Map<number, RelativeHistogram>>();
    let earliest = Number.POSITIVE_INFINITY;
    let latest = Number.NEGATIVE_INFINITY;

    const histFor = (map: Map<number, RelativeHistogram>, bucketKey: number): RelativeHistogram => {
      let h = map.get(bucketKey);
      if (!h) {
        h = new RelativeHistogram(alpha);
        map.set(bucketKey, h);
      }
      return h;
    };
    const txnMap = (name: string): Map<number, RelativeHistogram> => {
      let m = txns.get(name);
      if (!m) {
        m = new Map<number, RelativeHistogram>();
        txns.set(name, m);
      }
      return m;
    };

    const stream = fs.createReadStream(streamPath, { encoding: 'utf-8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (!line || line.length < 32) continue;
      if (line.indexOf('"type":"Point"') === -1) continue;

      let p: { metric?: string; data?: { time?: string; value?: number; tags?: Record<string, string> } };
      try {
        p = JSON.parse(line);
      } catch {
        continue;
      }
      const metric = p.metric;
      const time = p.data?.time;
      const value = p.data?.value;
      if (!metric || !time || typeof value !== 'number') continue;

      const tsMs = Date.parse(time);
      if (!Number.isFinite(tsMs)) continue;
      const bucketKey = Math.floor(tsMs / bucketMs) * bucketMs;

      let recorded = false;
      if (metric === 'http_req_duration') {
        histFor(overview, bucketKey).record(value);
        recorded = true;
        // When no manifest is available, attribute request durations to a
        // transaction via the native `group` tag (legacy-run fallback).
        if (knownTxns.size === 0) {
          const grp = (p.data?.tags?.group || '').replace(/^::/, '');
          if (grp) histFor(txnMap(grp), bucketKey).record(value);
        }
      } else if (knownTxns.size > 0 && knownTxns.has(metric)) {
        // Per-transaction duration Trend — the headline transaction latency that
        // global_sla.transaction percentiles are evaluated against.
        histFor(txnMap(metric), bucketKey).record(value);
        recorded = true;
      }

      if (recorded) {
        if (bucketKey < earliest) earliest = bucketKey;
        if (bucketKey > latest) latest = bucketKey;
      }
    }

    if (!Number.isFinite(earliest)) return null;

    const serialize = (map: Map<number, RelativeHistogram>): Record<string, HistogramJSON> => {
      const out: Record<string, HistogramJSON> = {};
      for (const [k, h] of map) out[String(k)] = h.toJSON();
      return out;
    };
    const transactions: Record<string, Record<string, HistogramJSON>> = {};
    for (const [name, m] of txns) transactions[name] = serialize(m);

    return {
      schemaVersion: 1,
      metric: 'duration-histograms',
      bucketSeconds,
      relativeAccuracy: alpha,
      startTime: new Date(earliest).toISOString(),
      endTime: new Date(latest + bucketMs).toISOString(),
      overview: serialize(overview),
      transactions,
    };
  }

  /** Build and write `metrics-histogram.json`. Returns the artifact (or null). */
  static async writeArtifact(
    streamPath: string,
    outPath: string,
    options: BuildHistogramOptions = {},
  ): Promise<HistogramArtifact | null> {
    const artifact = await this.build(streamPath, options);
    if (artifact) fs.writeFileSync(outPath, JSON.stringify(artifact), 'utf-8');
    return artifact;
  }
}
