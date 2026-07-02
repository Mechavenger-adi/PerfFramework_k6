/**
 * LiveEventLogWriter.ts
 *
 * Writes errors.ndjson / warnings.ndjson LIVE as the run progresses, instead of
 * only at the end. The k6 side emits each structured event as a
 * `[k6-perf][error-event] {json}` / `[k6-perf][warning-event] {json}` console
 * line; LiveConsoleLogStream already tails the run log and hands every
 * (dequoted) message to its onMessage tap, so we piggyback on that — no second
 * file tailer, no duplicated log-format parsing.
 *
 * These files are the same ones finalizeRunArtifacts writes at the end: the live
 * pass captures the per-occurrence k6-side events (check_failed, http_error,
 * transaction_error, snapshot_cap_reached, …) as they happen; the final pass
 * OVERWRITES with the complete merged set (adding run-level derivations only
 * known post-run: threshold breaches, execution_failed, host-monitor warnings).
 * A hard k6 crash before finalize therefore still leaves the live-captured
 * events on disk instead of an empty file.
 */

import * as fs from 'fs';

const ERROR_EVENT_PREFIX = '[k6-perf][error-event] ';
const WARNING_EVENT_PREFIX = '[k6-perf][warning-event] ';

export class LiveEventLogWriter {
  private errorRows = 0;
  private warningRows = 0;

  constructor(
    private readonly errorsPath: string,
    private readonly warningsPath: string,
  ) {}

  /** Truncate both files so they fill fresh as events arrive this run. */
  start(): void {
    fs.writeFileSync(this.errorsPath, '', 'utf-8');
    fs.writeFileSync(this.warningsPath, '', 'utf-8');
  }

  /**
   * Feed one already-dequoted console message. Appends a line to the matching
   * ndjson file when the message is a framework error/warning event; ignores
   * everything else. Safe to call for every console line.
   */
  consume(msg: string): void {
    if (!msg) return;
    if (msg.startsWith(ERROR_EVENT_PREFIX)) {
      this.append(this.errorsPath, msg.slice(ERROR_EVENT_PREFIX.length).trim(), 'error');
    } else if (msg.startsWith(WARNING_EVENT_PREFIX)) {
      this.append(this.warningsPath, msg.slice(WARNING_EVENT_PREFIX.length).trim(), 'warning');
    }
  }

  get errorCount(): number { return this.errorRows; }
  get warningCount(): number { return this.warningRows; }

  private append(file: string, payload: string, kind: 'error' | 'warning'): void {
    if (!payload) return;
    // Validate + normalize so each line is exactly one JSON object (matches the
    // final writeNdjson format); skip anything that isn't parseable JSON.
    let line: string;
    try {
      line = JSON.stringify(JSON.parse(payload));
    } catch {
      return;
    }
    try {
      fs.appendFileSync(file, line + '\n', 'utf-8');
      if (kind === 'error') this.errorRows += 1;
      else this.warningRows += 1;
    } catch {
      /* file momentarily busy — a later event or the final overwrite still captures it */
    }
  }
}
