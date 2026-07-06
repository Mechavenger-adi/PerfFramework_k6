/**
 * TransactionMetricLogWriter.ts
 *
 * Live, per-transaction CSV log derived from the k6 `--out json=` stream
 * (metrics-stream.json). One row per transaction iteration — anchored on each
 * `<transaction>_checkrate` Rate Point, which the framework emits exactly once
 * per transaction() iteration in its finally block (value 1 = pass, 0 = fail).
 *
 * IsPass is read straight off the checkrate metric: it already encodes the
 * checks-first outcome plus the fallbacks (a failed k6Check, a thrown error, or
 * the HTTP-error backstop for an unchecked failing request all mark the
 * iteration failed).
 *
 * responsetime is the transaction's own duration. endTransaction() emits it as
 * a Trend named exactly `<transaction>` (elapsed ms since startTransaction),
 * once per iteration, right AFTER the checkrate Point inside the same finally.
 * The two Points share the same vu/iter, so we join them on `vu|iter|txn`: the
 * checkrate Point creates the row, the matching duration Point fills in the
 * response time, and the row is emitted once duration arrives (or on stop() with
 * an empty responsetime if — defensively — it never did). Value is reported in
 * seconds with 4 decimals to match RequestMetricLogWriter's `responsetime`.
 *
 * Byte-offset + partial-line buffering makes incremental reads safe across
 * chunk boundaries (mirrors RequestMetricLogWriter's tailer).
 */

import * as fs from 'fs';

const POLL_INTERVAL_MS = 500;

const CHECKRATE_SUFFIX = '_checkrate';

// Fixed column order. `responsetime` is the transaction duration in seconds.
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
  'responsetime',
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

/** A transaction row anchored on its checkrate Point, awaiting its duration. */
interface PendingRow {
  time: string;
  vu: string;
  iter: string;
  scenario: string;
  transaction: string;
  isPass: boolean;
  /** Duration in seconds (4dp); '' until the matching duration Trend arrives. */
  responsetime: string;
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

  // Transaction names learned from `<name>_checkrate` metrics. Used to recognise
  // a bare `<name>` duration Trend Point without a static transaction manifest.
  private knownTxns = new Set<string>();
  // Rows anchored on a checkrate Point, keyed by `vu|iter|txn`, held until the
  // matching duration Trend Point arrives (emitted first-come within the finally).
  private pending = new Map<string, PendingRow>();
  private outBuf = '';

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
    // Emit anything still awaiting a duration (defensive — duration should always
    // arrive, but never drop a transaction iteration on shutdown).
    this.flushAllPending();
    this.writeOut();
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

    for (const line of lines) this.processLine(line);
    this.writeOut();
  }

  private writeOut(): void {
    if (this.outBuf) {
      fs.appendFileSync(this.outPath, this.outBuf, 'utf-8');
      this.outBuf = '';
    }
  }

  /**
   * Parse one stream line; route `<txn>_checkrate` Rate Points (the row anchor)
   * and their matching `<txn>` duration Trend Points.
   */
  private processLine(line: string): void {
    // Fast reject: only Points can carry a checkrate or a transaction duration.
    if (!line || line.indexOf('"type":"Point"') === -1) return;

    let p: RawPoint;
    try {
      p = JSON.parse(line) as RawPoint;
    } catch {
      return;
    }
    if (p.type !== 'Point' || !p.metric) return;

    if (p.metric.endsWith(CHECKRATE_SUFFIX)) {
      this.handleCheckrate(p);
    } else if (this.knownTxns.has(p.metric)) {
      this.handleDuration(p);
    }
  }

  /** A `<txn>_checkrate` Point: create the row, emit if duration already seen. */
  private handleCheckrate(p: RawPoint): void {
    const time = p.data?.time;
    const value = p.data?.value;
    if (!time || typeof value !== 'number') return;

    const transaction = p.metric!.slice(0, -CHECKRATE_SUFFIX.length);
    this.knownTxns.add(transaction);

    const tags = p.data?.tags ?? {};
    const meta = p.data?.metadata ?? {};
    // vu/iter live in `metadata` on newer k6, `tags` on older — prefer metadata.
    const vu = String(meta.vu ?? tags.vu ?? '');
    const iter = String(meta.iter ?? tags.iter ?? '');
    const scenario = tags.scenario ?? '';
    // Rate .add(true) → 1 (pass), .add(false) → 0 (fail). Value is final at emit.
    const isPass = value === 1;

    const key = this.rowKey(vu, iter, transaction);
    // A duration Point for this iteration may (defensively) have arrived first —
    // preserve whatever responsetime it stashed.
    const existing = this.pending.get(key);
    const row: PendingRow = {
      time, vu, iter, scenario, transaction, isPass,
      responsetime: existing?.responsetime ?? '',
    };
    if (row.responsetime !== '') {
      this.emitRow(row);
      this.pending.delete(key);
    } else {
      this.pending.set(key, row);
    }
  }

  /** A `<txn>` duration Trend Point (ms): fill the row's responsetime, emit it. */
  private handleDuration(p: RawPoint): void {
    const value = p.data?.value;
    if (typeof value !== 'number') return;

    const transaction = p.metric!;
    const tags = p.data?.tags ?? {};
    const meta = p.data?.metadata ?? {};
    const vu = String(meta.vu ?? tags.vu ?? '');
    const iter = String(meta.iter ?? tags.iter ?? '');
    const responsetime = (value / 1000).toFixed(4);

    const key = this.rowKey(vu, iter, transaction);
    const row = this.pending.get(key);
    if (row) {
      // Normal path: checkrate arrived first — complete and emit the row.
      row.responsetime = responsetime;
      this.emitRow(row);
      this.pending.delete(key);
    } else {
      // Duration seen before its checkrate — stash a stub so handleCheckrate can
      // pick up the responsetime when it lands.
      this.pending.set(key, {
        time: '', vu, iter, scenario: '', transaction, isPass: false, responsetime,
      });
    }
  }

  private rowKey(vu: string, iter: string, transaction: string): string {
    return vu + '|' + iter + '|' + transaction;
  }

  private flushAllPending(): void {
    for (const [key, row] of this.pending) {
      // Only emit rows that have a real checkrate anchor (non-empty time). A bare
      // duration stub with no matching checkrate isn't a transaction iteration.
      if (row.time !== '') this.emitRow(row);
      this.pending.delete(key);
    }
  }

  private emitRow(row: PendingRow): void {
    const runID = `RID_${this.ctx.hostName}_${row.vu || 'NA'}`;
    const line = [
      row.time,
      this.ctx.testId,
      runID,
      this.ctx.hostName,
      row.vu,
      row.iter,
      row.scenario,
      row.transaction,
      String(row.isPass),
      row.responsetime,
    ].map(csvField).join(',');
    this.outBuf += line + '\n';
    this.rows += 1;
  }
}
