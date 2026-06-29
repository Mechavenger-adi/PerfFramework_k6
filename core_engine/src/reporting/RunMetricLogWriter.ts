/**
 * RunMetricLogWriter.ts
 *
 * Live, per-request CSV log derived from the k6 `--out json=` stream
 * (metrics-stream.json). One row per HTTP request — sourced from each
 * `http_req_duration` Point, which carries the request's tags (status, name,
 * group, scenario, and — when vu/iter system tags are enabled — vu/iter).
 *
 * Unlike the bucketed TimeseriesStreamParser (aggregates for charts), this is a
 * flat transaction-level log meant for spreadsheet / BI ingestion: every request
 * is one line, columns fixed, the leftover tags preserved as one JSON column.
 *
 * Lifecycle mirrors the framework's other live tailers (FileWriteSink): poll the
 * growing stream file on an interval, append rows for newly-arrived samples, and
 * do one final sweep on stop() so a fast run that flushes its last lines after
 * the tailer stops still gets them. Byte-offset + partial-line buffering makes
 * incremental reads safe across chunk boundaries.
 */

import * as fs from 'fs';

const POLL_INTERVAL_MS = 500;

// Fixed column order. `tags` is a JSON-encoded catch-all for any request tag not
// promoted to its own column.
const COLUMNS = [
  'ts',
  'testId',
  'runID',
  'hostName',
  'vus',
  'i',
  'Scenario',
  'Transaction',
  'Request Name',
  'status',
  'isError',
  'responsetime',
  'tags',
] as const;

// Tag keys promoted to dedicated columns — removed from the leftover `tags` blob.
const PROMOTED_TAGS = new Set(['vu', 'iter', 'scenario', 'group', 'name', 'status']);

interface RawPoint {
  type?: string;
  metric?: string;
  data?: {
    time?: string;
    value?: number;
    tags?: Record<string, string>;
    // Newer k6 emits high-cardinality values (vu, iter) here, separate from
    // `tags`. Older k6 put them in `tags` when the vu/iter system tags were on.
    metadata?: Record<string, string>;
  };
}

export interface RunMetricLogContext {
  /** `TID_<planName>` */
  testId: string;
  /** Machine name (K6_PERF_MACHINE or OS hostname). */
  hostName: string;
}

/** RFC-4180-style CSV field escaping. */
function csvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export class RunMetricLogWriter {
  private offset = 0;
  private partial = '';
  private timer: NodeJS.Timeout | null = null;
  private rows = 0;

  constructor(
    private readonly streamPath: string,
    private readonly outPath: string,
    private readonly ctx: RunMetricLogContext,
  ) {}

  /** Begin polling the stream file and appending rows. */
  start(): void {
    // Fresh file each run (truncate) + header row.
    fs.writeFileSync(this.outPath, COLUMNS.map(csvField).join(',') + '\n', 'utf-8');
    this.timer = setInterval(() => this.tick(), POLL_INTERVAL_MS);
    if (this.timer.unref) this.timer.unref();
  }

  /** Stop polling and flush any remaining samples. */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    // Final sweep: pick up bytes written after the last poll.
    this.tick();
  }

  /** Number of request rows written this run. */
  get rowCount(): number { return this.rows; }

  /** Path of the generated CSV. */
  get path(): string { return this.outPath; }

  private tick(): void {
    let size: number;
    try {
      if (!fs.existsSync(this.streamPath)) return;
      size = fs.statSync(this.streamPath).size;
    } catch {
      return;
    }
    if (size <= this.offset) return;

    let buf: Buffer;
    const fd = fs.openSync(this.streamPath, 'r');
    try {
      buf = Buffer.alloc(size - this.offset);
      fs.readSync(fd, buf, 0, buf.length, this.offset);
      this.offset = size;
    } finally {
      fs.closeSync(fd);
    }

    this.partial += buf.toString('utf-8');
    const lines = this.partial.split('\n');
    // Last element is an incomplete line (no trailing newline yet) — hold it.
    this.partial = lines.pop() ?? '';

    let out = '';
    for (const line of lines) {
      const row = this.lineToRow(line);
      if (row) out += row + '\n';
    }
    if (out) {
      fs.appendFileSync(this.outPath, out, 'utf-8');
    }
  }

  /** Parse one stream line; return a CSV row for http_req_duration Points only. */
  private lineToRow(line: string): string | null {
    if (!line || line.indexOf('"type":"Point"') === -1) return null;
    if (line.indexOf('"metric":"http_req_duration"') === -1) return null;

    let p: RawPoint;
    try {
      p = JSON.parse(line) as RawPoint;
    } catch {
      return null;
    }
    if (p.type !== 'Point' || p.metric !== 'http_req_duration') return null;
    const time = p.data?.time;
    const value = p.data?.value;
    if (!time || typeof value !== 'number') return null;

    const tags = { ...(p.data?.tags ?? {}) };
    const meta = p.data?.metadata ?? {};
    // vu/iter live in `metadata` on newer k6, `tags` on older — prefer metadata.
    const vu = meta.vu ?? tags.vu ?? '';
    const iter = meta.iter ?? tags.iter ?? '';
    const scenario = tags.scenario ?? '';
    const transaction = (tags.group ?? '').replace(/^::/, '');
    const requestName = tags.name ?? tags.url ?? '';
    const statusStr = tags.status ?? '';
    const status = Number(statusStr);
    // Success = 2xx/3xx; anything else (incl. status 0 transport errors) is an error.
    const isError = !(status >= 200 && status < 400);

    const runID = `RID_${this.ctx.hostName}_${vu || 'NA'}`;
    const responsetime = (value / 1000).toFixed(4);

    // Leftover tags: drop the keys promoted to columns, keep the rest losslessly.
    const leftover: Record<string, string> = {};
    for (const [k, v] of Object.entries(tags)) {
      if (!PROMOTED_TAGS.has(k)) leftover[k] = v;
    }
    const tagsJson = Object.keys(leftover).length > 0 ? JSON.stringify(leftover) : '';

    this.rows += 1;
    return [
      time,
      this.ctx.testId,
      runID,
      this.ctx.hostName,
      vu,
      iter,
      scenario,
      transaction,
      requestName,
      statusStr,
      String(isError),
      responsetime,
      tagsJson,
    ].map(csvField).join(',');
  }
}
