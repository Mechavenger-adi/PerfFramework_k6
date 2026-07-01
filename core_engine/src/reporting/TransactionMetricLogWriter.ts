/**
 * TransactionMetricLogWriter.ts
 *
 * Live, per-transaction CSV log derived from the k6 `--out json=` stream
 * (metrics-stream.json). One row per transaction iteration — sourced from each
 * `<transaction>_checkrate` Rate Point, which the framework emits exactly once
 * per transaction() iteration in its finally block (value 1 = pass, 0 = fail).
 *
 * IsPass is therefore read straight off the metric: the checkrate already
 * encodes the checks-first outcome plus the fallbacks (a failed k6Check, a
 * thrown error, or the HTTP-error backstop for an unchecked failing request all
 * mark the iteration failed). There is no correlation or buffering to do — the
 * sample is final at emit time, so rows are appended live.
 *
 * Byte-offset + partial-line buffering makes incremental reads safe across
 * chunk boundaries (mirrors RequestMetricLogWriter's tailer).
 */

import * as fs from 'fs';

const POLL_INTERVAL_MS = 500;

const CHECKRATE_SUFFIX = '_checkrate';

// Fixed column order.
const COLUMNS = [
  'ts',
  'testId',
  'runID',
  'hostName',
  'vus',
  'i',
  'Scenario',
  'Transaction',
  'IsPass',
] as const;

interface RawPoint {
  type?: string;
  metric?: string;
  data?: {
    time?: string;
    value?: number;
    tags?: Record<string, string>;
    metadata?: Record<string, string>;
  };
}

export interface TransactionMetricLogContext {
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

export class TransactionMetricLogWriter {
  private offset = 0;
  private partial = '';
  private timer: NodeJS.Timeout | null = null;
  private rows = 0;

  constructor(
    private readonly streamPath: string,
    private readonly outPath: string,
    private readonly ctx: TransactionMetricLogContext,
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

  /** Number of transaction rows written this run. */
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

  /** Parse one stream line; return a CSV row for `<txn>_checkrate` Points only. */
  private lineToRow(line: string): string | null {
    // Fast reject: must be a Point carrying a `_checkrate` metric.
    if (!line || line.indexOf('"type":"Point"') === -1) return null;
    if (line.indexOf(CHECKRATE_SUFFIX + '"') === -1) return null;

    let p: RawPoint;
    try {
      p = JSON.parse(line) as RawPoint;
    } catch {
      return null;
    }
    if (p.type !== 'Point' || !p.metric || !p.metric.endsWith(CHECKRATE_SUFFIX)) return null;
    const time = p.data?.time;
    const value = p.data?.value;
    if (!time || typeof value !== 'number') return null;

    const transaction = p.metric.slice(0, -CHECKRATE_SUFFIX.length);
    const tags = p.data?.tags ?? {};
    const meta = p.data?.metadata ?? {};
    // vu/iter live in `metadata` on newer k6, `tags` on older — prefer metadata.
    const vu = meta.vu ?? tags.vu ?? '';
    const iter = meta.iter ?? tags.iter ?? '';
    const scenario = tags.scenario ?? '';
    // Rate .add(true) → 1 (pass), .add(false) → 0 (fail). Value is final at emit.
    const isPass = value === 1;

    const runID = `RID_${this.ctx.hostName}_${vu || 'NA'}`;

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
      String(isPass),
    ].map(csvField).join(',');
  }
}
