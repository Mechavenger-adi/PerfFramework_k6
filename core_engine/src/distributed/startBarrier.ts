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

import { Logger } from '../utils/logger';

/** Block until the K6_PERF_START_AT wall-clock time (ISO 8601), if set and future. */
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
  Logger.info(`[start] waiting until shared start ${raw} (${Math.round(waitMs / 1000)}s) for ramp alignment`);
  await new Promise((resolve) => setTimeout(resolve, waitMs));
  Logger.detail('[start] scheduled start reached — launching k6');
}
