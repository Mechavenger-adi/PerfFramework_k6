/**
 * LiveConsoleLogStream.ts
 *
 * Tails the k6 run-log file while k6 is running and pretty-prints each new
 * script `console.*` line (and any k6 framework error/warn) through the
 * framework `Logger` so the user sees them in real time, color-coded by
 * level, instead of only seeing a recap at the end of the run.
 *
 * Polling-based (not `fs.watch`) because Goja/k6 writes the log file in
 * line buffers and `fs.watch` on Windows can miss appends to an
 * already-open file. Every `LIVE_CONSOLE_POLL_MS` we read whatever has been
 * appended since the last tick, split on lines, and route each one through
 * the Logger.
 *
 * Surface rules:
 *   - lines with `source=console`              → script console output (any level)
 *   - lines with `level=error|warn` (any src)  → k6 framework errors/warnings
 *   - everything else (k6 internal info/debug) → suppressed
 *   - framework IPC channels                   → always suppressed
 *     (`[replay-log]`, `[snapshot-event]`, `[error-event]`, `[warning-event]`
 *      — parsed by their own collectors; the human-readable error/warn line is
 *      emitted separately so a failure shows up once, not twice)
 */

import * as fs from 'fs';
import { Logger } from './logger';

const LIVE_CONSOLE_POLL_MS = 250;

/**
 * @param onMessage optional tap invoked with every extracted console message
 *   (before display). Return true to mark the message consumed — it will then
 *   be suppressed from the live display (used by FileWriteSink for writeData()).
 */
export function startLiveConsoleLogStream(
  runLogPath: string,
  onMessage?: (msg: string) => boolean,
): { stop: () => void } {
  let offset = 0;
  let stopped = false;
  let carry = ''; // partial line buffer between ticks

  function processLine(line: string): void {
    if (!line) return;
    const levelMatch = line.match(/level=(info|warn|debug|error)\s+msg="((?:\\.|[^"])*)"/);
    if (!levelMatch) return;
    const level = levelMatch[1].toUpperCase();
    let msg: string;
    try {
      msg = JSON.parse(`"${levelMatch[2]}"`) as string;
    } catch {
      msg = levelMatch[2].replace(/\\"/g, '"');
    }
    // Sink tap (e.g. writeData → FileWriteSink). Consumed messages are IPC, not
    // user-facing, so suppress them from the display.
    if (onMessage && onMessage(msg)) return;
    // Drop framework IPC noise — these are parsed elsewhere and are NOT meant
    // for the user. `[error-event]` / `[warning-event]` are the machine-readable
    // JSON twins of the human-readable `[k6-perf][check-failed]` /
    // `[k6-perf][transaction:...] ERROR:` lines; dropping them here means a
    // failed check surfaces exactly ONCE (the readable error), not twice.
    if (
      msg.includes('[replay-log]') ||
      msg.includes('[snapshot-event]') ||
      msg.includes('[error-event]') ||
      msg.includes('[warning-event]') ||
      msg.startsWith('__K6PERF_FILE__')
    ) return;

    const isConsole = line.includes('source=console');
    // Show script console output (any level) and k6's own errors/warnings.
    // Hide k6's internal info/debug chatter — too noisy.
    if (!isConsole && level !== 'ERROR' && level !== 'WARN') return;

    if (level === 'ERROR') Logger.error(msg);
    else if (level === 'WARN') Logger.warn(msg);
    else if (level === 'DEBUG') Logger.debug(msg);
    else Logger.info(msg);
  }

  function tick(): void {
    if (stopped) return;
    try {
      if (!fs.existsSync(runLogPath)) return;
      const size = fs.statSync(runLogPath).size;
      if (size <= offset) return;
      const fd = fs.openSync(runLogPath, 'r');
      try {
        const buf = Buffer.alloc(size - offset);
        fs.readSync(fd, buf, 0, buf.length, offset);
        offset = size;
        const chunk = carry + buf.toString('utf-8');
        const lines = chunk.split(/\r?\n/);
        carry = lines.pop() ?? ''; // last element is partial unless chunk ended with \n
        for (const line of lines) processLine(line);
      } finally {
        fs.closeSync(fd);
      }
    } catch {
      /* file locked / partial write — try again next tick */
    }
  }

  const timer = setInterval(tick, LIVE_CONSOLE_POLL_MS);
  timer.unref();

  return {
    stop: () => {
      stopped = true;
      clearInterval(timer);
      // Drain anything written between the final poll and now.
      tick();
      if (carry.trim()) processLine(carry);
    },
  };
}
