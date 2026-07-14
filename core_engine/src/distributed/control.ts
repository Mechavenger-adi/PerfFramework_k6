/**
 * control.ts
 * Mid-test control for distributed runs (EDD §Mid-test Control). The controller
 * (dashboard/CLI) drops a runId-namespaced marker into `<share>/control_<runId>/
 * control.json`; each LG polls it and acts:
 *   • abort — kill the k6 child immediately (partial artifacts, flagged INVALID).
 *   • stop  — graceful early end via k6's local REST API PATCH /v1/status {stopped:true}
 *             (runs handleSummary → STOPPED-EARLY, valid). Verified on k6 v2.0.0.
 * Outbound-only (shared folder), no inbound port. `abort` supersedes a pending `stop`.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { spawn } from 'child_process';
import { Logger } from '../utils/logger';

export type ControlAction = 'abort' | 'stop';

export interface ControlFile {
  action: ControlAction;
  /** ISO time to act (stop only, for coordinated drain). Absent/past → act now. */
  effectiveAt?: string;
  by?: string;
  token?: string;
}

/** `<collectDir>/control_<runId>`. */
export function controlDirFor(collectDir: string, runId: string): string {
  return path.join(path.resolve(collectDir), `control_${runId}`);
}

/** Write the control marker atomically (tmp + rename). Returns the file path. */
export function writeControl(controlDir: string, file: ControlFile): string {
  fs.mkdirSync(controlDir, { recursive: true });
  const p = path.join(controlDir, 'control.json');
  const tmp = `${p}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(file));
  fs.renameSync(tmp, p);
  return p;
}

export function readControl(controlDir: string): ControlFile | null {
  try {
    const p = path.join(controlDir, 'control.json');
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as ControlFile;
  } catch {
    return null;
  }
}

/** Kill a process (tree) — Windows: `taskkill /F /T`; POSIX: SIGKILL. Best-effort. */
export function killProcessTree(pid: number): void {
  try {
    if (process.platform === 'win32') spawn('taskkill', ['/F', '/T', '/PID', String(pid)], { stdio: 'ignore' });
    else process.kill(pid, 'SIGKILL');
  } catch (e) {
    Logger.detail(`[control] kill failed: ${(e as Error).message}`);
  }
}

/** Read the CURRENT active VU count from k6's local REST API (/v1/status). Null if unreachable. */
export function fetchK6Vus(address = process.env.K6_PERF_K6_API || '127.0.0.1:6565'): Promise<number | null> {
  return new Promise((resolve) => {
    const [host, portStr] = address.split(':');
    const req = http.get(
      { host: host || '127.0.0.1', port: Number(portStr) || 6565, path: '/v1/status', timeout: 2000 },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          try {
            const j = JSON.parse(Buffer.concat(chunks).toString('utf-8')) as { data?: { attributes?: { vus?: number } } };
            const vus = j?.data?.attributes?.vus;
            resolve(typeof vus === 'number' ? vus : null);
          } catch { resolve(null); }
        });
      },
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

/** Graceful stop via k6's local REST API. Resolves true on 2xx/3xx. Never throws. */
export function k6ApiStop(address = process.env.K6_PERF_K6_API || '127.0.0.1:6565'): Promise<boolean> {
  return new Promise((resolve) => {
    const [host, portStr] = address.split(':');
    const body = JSON.stringify({ data: { type: 'status', id: 'default', attributes: { stopped: true } } });
    const req = http.request(
      { host: host || '127.0.0.1', port: Number(portStr) || 6565, path: '/v1/status', method: 'PATCH', timeout: 5000,
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => { res.resume(); resolve((res.statusCode ?? 500) < 400); },
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.write(body);
    req.end();
  });
}

export interface ControlWatcherOptions {
  controlDir: string;
  intervalMs?: number;
  onAbort: () => void;
  onStop: (effectiveAtMs: number) => void;
}

/** Polls the control dir; fires onAbort/onStop exactly once. */
export class ControlWatcher {
  private timer: NodeJS.Timeout | null = null;
  private handled = false;

  constructor(private readonly opts: ControlWatcherOptions) {}

  start(): void {
    this.timer = setInterval(() => this.poll(), this.opts.intervalMs ?? 3000);
    if (this.timer.unref) this.timer.unref();
    this.poll();
  }

  stop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  private poll(): void {
    if (this.handled) return;
    const c = readControl(this.opts.controlDir);
    if (!c) return;
    this.handled = true;
    this.stop();
    if (c.action === 'abort') {
      this.opts.onAbort();
    } else {
      const eff = c.effectiveAt ? Date.parse(c.effectiveAt) : Date.now();
      this.opts.onStop(Number.isFinite(eff) ? eff : Date.now());
    }
  }
}
