/**
 * agentServer.ts
 * Phase-2 reachability probe — the AGENT (LG) side.
 *
 * A deliberately tiny, long-lived HTTP server that a load-generator machine runs
 * so the controller can prove it can reach it *through the org firewall* before we
 * invest in the full controller/agent daemon (design §4). It is the minimal, real
 * version of the Phase-2 `/info` pre-flight endpoint (§4.3) — it does NOT run k6,
 * stage archives, or accept jobs. Its only job is to answer "can you reach me?".
 *
 * Endpoints (both GET, JSON):
 *   /ping  → cheap liveness: { ok, name, serverTime }
 *   /info  → pre-flight facts: hostname, platform, framework/k6/node versions,
 *            free disk, uptime, serverTime (for clock-skew estimation).
 *
 * Security (aligned with §4.5, kept optional so a first firewall test is frictionless):
 *   - Optional shared token (`--token` / K6_PERF_AGENT_TOKEN), constant-time compared.
 *   - Binds to a caller-chosen host (default 0.0.0.0 so reachability can be proven;
 *     lock to the intranet NIC once the firewall path is confirmed).
 *   - Every request is logged (a minimal audit trail).
 *
 * Uses only Node built-ins — no new dependencies (design §4.3).
 */

import * as http from 'http';
import * as os from 'os';
import * as crypto from 'crypto';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import { Logger } from '../utils/logger';

const FRAMEWORK_VERSION = '1.0.0';
const TOKEN_HEADER = 'x-k6-perf-token';

export interface AgentServerOptions {
  /** Port to listen on (default 7070, the design's agentPort). */
  port: number;
  /** Interface to bind (default 0.0.0.0 — all interfaces — for reachability testing). */
  host: string;
  /** Machine name reported in responses (defaults to OS hostname). */
  name?: string;
  /** Optional shared secret; when set, requests must send it in the x-k6-perf-token header. */
  token?: string;
}

/** Best-effort `k6 version` (proves k6 is installed on the LG). Never throws. */
function detectK6Version(): string | null {
  try {
    const r = spawnSync('k6', ['version'], { encoding: 'utf-8', timeout: 4000 });
    if (r.status === 0 && r.stdout) return r.stdout.trim().split(/\r?\n/)[0];
  } catch {
    /* k6 not on PATH */
  }
  return null;
}

/** Best-effort free bytes on the volume backing the process cwd. Null if unsupported. */
function freeDiskBytes(): number | null {
  try {
    const st = fs.statfsSync(process.cwd());
    return st.bavail * st.bsize;
  } catch {
    return null;
  }
}

/** Constant-time token check that never short-circuits on length. */
function tokenMatches(expected: string, provided: string | undefined): boolean {
  if (!provided) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) {
    // Still burn a compare against a fixed-size buffer to avoid a length oracle.
    crypto.timingSafeEqual(a, a);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function buildInfo(name: string, k6Version: string | null) {
  return {
    ok: true,
    name,
    hostname: os.hostname(),
    platform: `${os.platform()} ${os.release()}`,
    arch: os.arch(),
    serverTime: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
    frameworkVersion: FRAMEWORK_VERSION,
    k6Version,
    nodeVersion: process.version,
    freeDiskBytes: freeDiskBytes(),
  };
}

/** Start the agent HTTP server. Resolves once it is listening (server keeps the process alive). */
export function runAgent(options: AgentServerOptions): Promise<http.Server> {
  const name = options.name || os.hostname();
  const token = options.token;
  // Detect k6 once at startup — shelling out per /info request would inflate the
  // probe's measured RTT and clock-skew.
  const k6Version = detectK6Version();

  const server = http.createServer((req, res) => {
    const remote = req.socket.remoteAddress ?? '?';
    const url = (req.url || '/').split('?')[0];
    Logger.detail(`[agent] ${req.method} ${url} from ${remote}`);

    const send = (status: number, body: unknown): void => {
      const payload = JSON.stringify(body);
      res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) });
      res.end(payload);
    };

    if (token && !tokenMatches(token, req.headers[TOKEN_HEADER] as string | undefined)) {
      Logger.warning(`[agent] rejected ${url} from ${remote} — bad/missing token`);
      send(401, { ok: false, error: 'unauthorized' });
      return;
    }

    if (req.method === 'GET' && url === '/ping') {
      send(200, { ok: true, name, serverTime: new Date().toISOString() });
      return;
    }
    if (req.method === 'GET' && url === '/info') {
      send(200, buildInfo(name, k6Version));
      return;
    }
    send(404, { ok: false, error: 'not found', hint: 'try GET /ping or GET /info' });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port, options.host, () => {
      server.removeListener('error', reject);
      Logger.header(`k6-framework agent — reachability probe`);
      Logger.pass(`[agent] '${name}' listening on ${options.host}:${options.port}`);
      Logger.detail(`Auth: ${token ? 'token required' : 'open (no token)'}`);
      Logger.detail(`Endpoints: GET /ping · GET /info`);
      Logger.detail(`From the controller: k6-framework probe --agents <this-host>:${options.port}${token ? ' --token <token>' : ''}`);
      Logger.detail(`Press Ctrl+C to stop.`);
      resolve(server);
    });
  });
}

/** CLI handler for `k6-framework agent`. Keeps running until interrupted. */
export async function runAgentCli(opts: { port: string; host: string; name?: string; token?: string }): Promise<void> {
  const port = Number(opts.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    Logger.fail(`[agent] invalid port '${opts.port}'`);
    process.exit(1);
  }
  const token = opts.token || process.env.K6_PERF_AGENT_TOKEN;
  try {
    const server = await runAgent({ port, host: opts.host, name: opts.name, token });
    const shutdown = (): void => {
      Logger.detail('[agent] shutting down…');
      server.close(() => process.exit(0));
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'EADDRINUSE') Logger.fail(`[agent] port ${port} is already in use on ${opts.host}`);
    else if (e.code === 'EADDRNOTAVAIL') Logger.fail(`[agent] cannot bind ${opts.host} — no such interface on this machine`);
    else Logger.fail(`[agent] failed to start: ${e.message}`);
    process.exit(1);
  }
}
