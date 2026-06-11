/**
 * FileWriteSink.ts
 * Runner-side consumer for writeData() lines (Proposal 7).
 *
 * Subscribes to the live k6 console log stream (LiveConsoleLogStream). For each
 * tagged `__K6PERF_FILE__{…}` message it writes/appends the payload to a file
 * confined under the run's output directory. A single sink instance serializes
 * every VU's write, so concurrent same-file appends stay ordered and intact.
 */

import * as fs from 'fs';
import * as path from 'path';

/** Keep in sync with utils/dataWriter.ts. */
const FILE_TAG = '__K6PERF_FILE__';

interface FilePayload {
  f: string;            // relative path under the output dir
  m: 'a' | 'w';         // append | overwrite
  e: 'utf8' | 'base64'; // encoding of `d`
  d: string;            // data
}

export class FileWriteSink {
  // Files already touched this run → first touch truncates (fresh file even if
  // the run dir is reused), subsequent appends add on.
  private readonly seen = new Set<string>();
  private writes = 0;

  constructor(private readonly outputDir: string) {}

  /**
   * Consume one extracted console message. Returns true if it was a file-write
   * line (so the caller can suppress it from the live display), false otherwise.
   */
  consume(msg: string): boolean {
    if (!msg.startsWith(FILE_TAG)) return false;
    try {
      const payload = JSON.parse(msg.slice(FILE_TAG.length)) as FilePayload;
      this.write(payload);
    } catch {
      /* malformed line — ignore rather than crash the run */
    }
    return true;
  }

  private write(p: FilePayload): void {
    const abs = this.resolvePath(p.f);
    // Create the file (and any missing parent directories) on first write.
    fs.mkdirSync(path.dirname(abs), { recursive: true });

    const bytes = p.e === 'base64'
      ? Buffer.from(p.d, 'base64')
      : Buffer.from(p.d, 'utf-8');

    const firstTouch = !this.seen.has(abs);
    this.seen.add(abs);

    // First write of the run truncates; 'overwrite' always truncates; otherwise append.
    if (p.m === 'w' || firstTouch) {
      fs.writeFileSync(abs, bytes);
    } else {
      fs.appendFileSync(abs, bytes);
    }
    this.writes += 1;
  }

  /**
   * Resolve where to write:
   *   - ABSOLUTE path (e.g. 'D:/exports/ids.csv', '/var/data/ids.csv') → written
   *     verbatim, so scripts can target any location of their choice.
   *   - relative path → resolved under the run's output directory (the default
   *     home for run artifacts).
   * Missing parent directories are created by write().
   */
  private resolvePath(file: string): string {
    const cleaned = String(file).replace(/\\/g, '/');
    return path.isAbsolute(cleaned)
      ? path.normalize(cleaned)
      : path.resolve(this.outputDir, cleaned);
  }

  /**
   * Post-run reconciliation: re-read the COMPLETE k6 log file and apply any
   * writeData lines the live tail did not process. The live tailer polls every
   * ~250ms, so a very fast run can finish and flush its final lines after the
   * tailer stops — this sweep guarantees completeness. Idempotent: file-write
   * lines appear in a stable order, so we skip the first N already written live.
   */
  flushFromLog(logPath: string): void {
    let content: string;
    try {
      content = fs.readFileSync(logPath, 'utf-8');
    } catch {
      return;
    }
    const already = this.writes; // file-write lines already applied live
    let idx = 0;
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/msg="((?:\\.|[^"])*)"/);
      if (!m) continue;
      let msg: string;
      try {
        msg = JSON.parse(`"${m[1]}"`) as string;
      } catch {
        msg = m[1].replace(/\\"/g, '"');
      }
      if (!msg.startsWith(FILE_TAG)) continue;
      if (idx++ < already) continue; // already written by the live tail
      try {
        this.write(JSON.parse(msg.slice(FILE_TAG.length)) as FilePayload);
      } catch {
        /* malformed — ignore */
      }
    }
  }

  /** Number of distinct files written this run. */
  get fileCount(): number { return this.seen.size; }
  /** Total number of write/append operations. */
  get writeCount(): number { return this.writes; }
}
