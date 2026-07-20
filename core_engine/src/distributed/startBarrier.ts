/**
 * startBarrier.ts
 * Phase 1 start synchronization (design §3.4). Isolated, opt-in, and removable in
 * Phase 3 without touching anything else: when K6_PERF_START_AT is set, every LG
 * waits until that shared wall-clock instant before launching k6, so their ramps
 * overlap. Unset → immediate start (today's behavior, zero change).
 *
 * Best-effort by design (no VU-init barrier); the Phase-2 controller replaces this
 * with a true rendezvous. NTP assumed.
 */

import * as readline from 'readline';
import { Logger, ansi } from '../utils/logger';

/** Human-friendly remaining time: "1h 02m 03s" / "2m 05s" / "9s". */
function fmtRemaining(totalSec: number): string {
  if (totalSec >= 3600) {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  }
  if (totalSec >= 60) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${String(s).padStart(2, '0')}s`;
  }
  return `${totalSec}s`;
}

/**
 * Block until the K6_PERF_START_AT wall-clock time (ISO 8601), if set and future.
 * On a TTY this renders a LIVE countdown that updates in place (same line) and
 * ticks down to zero; when piped/redirected (no TTY) it prints one static line and
 * waits silently so logs stay clean. Shared by the run path (LGs + local) and the
 * controller's monitor so all roles show the same countdown.
 */
export async function awaitScheduledStart(): Promise<void> {
  const raw = process.env.K6_PERF_START_AT;
  if (!raw) return;

  const target = Date.parse(raw);
  if (!Number.isFinite(target)) {
    Logger.warn(`[start] invalid K6_PERF_START_AT='${raw}' — starting now`);
    return;
  }
  const waitMs = target - Date.now();
  if (waitMs <= 0) {
    Logger.detail(`[start] scheduled start ${raw} already passed — starting now`);
    return;
  }

  // Non-TTY (piped/CI): a single static line, then wait silently. Rewriting the
  // same line with carriage returns would spam a log file with control chars.
  if (!process.stdout.isTTY) {
    Logger.info(`[start] waiting until shared start ${raw} (${Math.round(waitMs / 1000)}s) for ramp alignment`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    Logger.detail('[start] scheduled start reached — launching k6');
    return;
  }

  // TTY: live countdown that overwrites itself. Refresh a few times a second so
  // the value visibly decrements all the way to zero (never a frozen number).
  await new Promise<void>((resolve) => {
    const render = () => {
      const remMs = target - Date.now();
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      if (remMs <= 0) {
        resolve();
        return;
      }
      const sec = Math.ceil(remMs / 1000);
      process.stdout.write(
        `${ansi.bold}${ansi.cyan}⏳ [start] launching in ${fmtRemaining(sec)}${ansi.reset}`
        + `${ansi.dim}  (shared start ${raw})${ansi.reset}`,
      );
      setTimeout(render, 250);
    };
    render();
  });
  Logger.detail('[start] scheduled start reached — launching k6');
}
