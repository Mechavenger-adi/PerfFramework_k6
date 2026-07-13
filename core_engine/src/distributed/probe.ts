/**
 * probe.ts
 * Phase-2 reachability probe — the CONTROLLER side.
 *
 * Connects from the controller to each load-generator's `agent` server and reports
 * whether the org firewall actually permits the controller→agent inbound path that
 * the full Phase-2 daemon (design §4) depends on. This is the cheap go/no-go check:
 * if the controller can reach two LGs here, the controller/agent approach is viable;
 * if it times out, the standing inbound service is blocked and §4.6's lower-clearance
 * transports (pull-via-shared / SSH / CI) are the fallback.
 *
 * The distinction that matters for a firewall verdict:
 *   - REFUSED (ECONNREFUSED)  → host reachable, port open in firewall, but nothing is
 *                               listening (agent not started / wrong port). NOT a firewall block.
 *   - TIMED OUT (ETIMEDOUT / no response) → packets silently dropped — the classic
 *                               firewall DROP rule. THIS is the clearance blocker.
 *   - NO ROUTE / DNS          → network/name-resolution problem, distinct from the firewall.
 *
 * Also reports round-trip latency and estimated clock skew (both needed later by the
 * merge's timeseries alignment, §1.5).
 *
 * Uses only Node built-ins — no new dependencies.
 */

import * as http from 'http';
import * as net from 'net';
import { Logger } from '../utils/logger';

const TOKEN_HEADER = 'x-k6-perf-token';

export interface ProbeTarget {
  raw: string;
  host: string;
  port: number;
}

export interface ProbeResult {
  target: ProbeTarget;
  reachable: boolean;
  status?: number;
  rttMs?: number;
  /** Estimated (agentClock − controllerClock), ms; positive → agent ahead. */
  clockSkewMs?: number;
  name?: string;
  frameworkVersion?: string;
  k6Version?: string | null;
  /** Human diagnosis (what the failure means for firewall clearance). */
  diagnosis: string;
  /** TCP mode only: did the packet reach the host (connected or refused)? True → firewall permits this port. */
  firewallAllowed?: boolean;
}

/** Parse "host:port" (port optional, defaults to 7070). */
export function parseTarget(raw: string, defaultPort: number): ProbeTarget | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const idx = trimmed.lastIndexOf(':');
  if (idx === -1) return { raw: trimmed, host: trimmed, port: defaultPort };
  const host = trimmed.slice(0, idx);
  const port = Number(trimmed.slice(idx + 1));
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) return null;
  return { raw: trimmed, host, port };
}

/** Translate a socket errno into a firewall-relevant diagnosis. */
function diagnose(code: string | undefined, timeoutMs: number): string {
  switch (code) {
    case 'ECONNREFUSED':
      return `connection REFUSED — host is reachable and the port is open through the firewall, but no agent is listening (start the agent / check the port). This is NOT a firewall block.`;
    case 'ETIMEDOUT':
    case 'ESOCKETTIMEDOUT':
      return `TIMED OUT after ${timeoutMs}ms — packets are being silently dropped. This is the classic firewall DROP and IS the clearance blocker for the controller approach.`;
    case 'EHOSTUNREACH':
      return `NO ROUTE to host — routing/subnet issue, not necessarily the firewall.`;
    case 'ENETUNREACH':
      return `NETWORK unreachable — no route from the controller's network to the agent's.`;
    case 'ENOTFOUND':
    case 'EAI_AGAIN':
      return `DNS resolution FAILED — the hostname can't be resolved (try the raw IP).`;
    case 'ECONNRESET':
      return `connection RESET — something (often a firewall/proxy) actively closed the connection mid-handshake.`;
    default:
      return `unreachable${code ? ` (${code})` : ''}.`;
  }
}

/** Probe a single agent's /info endpoint. Never rejects — failures come back as reachable:false. */
export function probeOne(target: ProbeTarget, timeoutMs: number, token?: string): Promise<ProbeResult> {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const headers: http.OutgoingHttpHeaders = {};
    if (token) headers[TOKEN_HEADER] = token;

    const req = http.get(
      { host: target.host, port: target.port, path: '/info', timeout: timeoutMs, headers },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          const rttMs = Date.now() - t0;
          const status = res.statusCode ?? 0;
          if (status === 401) {
            resolve({ target, reachable: true, status, rttMs, diagnosis: `reached, but agent REJECTED the token (401) — connectivity is fine; fix the shared token.` });
            return;
          }
          let body: Record<string, unknown> = {};
          try { body = JSON.parse(Buffer.concat(chunks).toString('utf-8')); } catch { /* ignore */ }
          const serverTime = typeof body.serverTime === 'string' ? Date.parse(body.serverTime) : NaN;
          // Estimate skew: assume symmetric latency, so the agent's clock at the
          // response ≈ controller midpoint (t0 + rtt/2).
          const clockSkewMs = Number.isFinite(serverTime) ? Math.round(serverTime - (t0 + rttMs / 2)) : undefined;
          resolve({
            target,
            reachable: status >= 200 && status < 300,
            status,
            rttMs,
            clockSkewMs,
            name: typeof body.name === 'string' ? body.name : undefined,
            frameworkVersion: typeof body.frameworkVersion === 'string' ? body.frameworkVersion : undefined,
            k6Version: (body.k6Version as string | null | undefined) ?? undefined,
            diagnosis: status >= 200 && status < 300 ? `reachable — controller→agent path is OPEN through the firewall.` : `reached but agent returned HTTP ${status}.`,
          });
        });
      },
    );

    req.on('timeout', () => req.destroy(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })));
    req.on('error', (err) => {
      const code = (err as NodeJS.ErrnoException).code;
      resolve({ target, reachable: false, rttMs: Date.now() - t0, diagnosis: diagnose(code, timeoutMs) });
    });
  });
}

/**
 * Raw TCP connect test — no HTTP, so it works on ANY port (RDP, an app port, etc.),
 * not just agents. This is the firewall port-discovery tool: connecting proves the
 * port is reachable; REFUSED proves the firewall LETS the packet through (host RST'd
 * an empty port) so the port is safe to run the agent on; TIMED OUT proves the
 * firewall drops that port. Never rejects.
 */
export function probeTcp(target: ProbeTarget, timeoutMs: number): Promise<ProbeResult> {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const socket = new net.Socket();
    let settled = false;
    const done = (r: ProbeResult): void => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(r);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      done({ target, reachable: true, firewallAllowed: true, rttMs: Date.now() - t0, diagnosis: `TCP connect OK — the firewall permits this port and something is listening.` });
    });
    socket.once('timeout', () => {
      done({ target, reachable: false, firewallAllowed: false, rttMs: Date.now() - t0, diagnosis: diagnose('ETIMEDOUT', timeoutMs) });
    });
    socket.once('error', (err) => {
      const code = (err as NodeJS.ErrnoException).code;
      // REFUSED means the packet reached the host (firewall let it through) but the port
      // is empty — a green light to run the agent on this port.
      const allowed = code === 'ECONNREFUSED';
      const hint = allowed ? ' → the firewall ALLOWS this port; it is free and safe to run the agent here.' : '';
      done({ target, reachable: false, firewallAllowed: allowed, rttMs: Date.now() - t0, diagnosis: diagnose(code, timeoutMs) + hint });
    });
    socket.connect(target.port, target.host);
  });
}

/** CLI handler for `k6-framework probe`. Returns true iff every target was reachable. */
export async function runProbe(opts: { agents: string; port: string; timeout: string; token?: string; tcp?: boolean }): Promise<boolean> {
  const defaultPort = Number(opts.port) || 7070;
  const timeoutMs = Number(opts.timeout) || 5000;
  const token = opts.token || process.env.K6_PERF_AGENT_TOKEN;

  const targets: ProbeTarget[] = [];
  for (const part of opts.agents.split(',')) {
    if (!part.trim()) continue;
    const t = parseTarget(part, defaultPort);
    if (!t) { Logger.fail(`[probe] invalid agent target '${part.trim()}' (expected host or host:port)`); return false; }
    targets.push(t);
  }
  if (targets.length === 0) { Logger.fail('[probe] no agents given — use --agents host1:7070,host2:7070'); return false; }

  Logger.header('k6-framework probe — controller → agents');
  Logger.info(`[probe] probing ${targets.length} target(s), timeout ${timeoutMs}ms, mode ${opts.tcp ? 'raw-TCP' : 'HTTP'}${opts.tcp ? '' : token ? ', with token' : ', no token'}`);

  const results = await Promise.all(
    targets.map((t) => (opts.tcp ? probeTcp(t, timeoutMs) : probeOne(t, timeoutMs, token))),
  );

  // ── Raw-TCP discovery mode: report per port whether the FIREWALL permits it, ──
  // ── distinct from whether something is listening there. ──
  if (opts.tcp) {
    for (const r of results) {
      const label = `${r.target.host}:${r.target.port}`;
      if (r.reachable) {
        Logger.pass(`${label} — OPEN (firewall-permitted, listening) · ${r.rttMs}ms`);
      } else if (r.firewallAllowed) {
        Logger.warning(`${label} — FIREWALL-ALLOWED but free (nothing listening) · ${r.rttMs}ms`);
      } else {
        Logger.fail(`${label} — BLOCKED`);
      }
      Logger.detail(r.diagnosis);
    }
    const permitted = results.filter((r) => r.firewallAllowed);
    const free = permitted.filter((r) => !r.reachable).map((r) => r.target.port);
    Logger.header(`Result: ${permitted.length}/${results.length} port(s) firewall-permitted`);
    if (permitted.length > 0) {
      Logger.pass(`Firewall permits: ${permitted.map((r) => r.target.port).join(', ')}`);
      if (free.length > 0) Logger.detail(`Free to bind the agent (run: agent --port ${free[0]}): ${free.join(', ')}`);
    } else {
      Logger.warning('No probed port is firewall-permitted (all TIMED OUT). Ask IT which ports are open server-to-server, or use §4.6 (pull-via-shared / SSH / CI).');
    }
    return permitted.length > 0;
  }

  let allOk = true;
  for (const r of results) {
    const label = `${r.target.host}:${r.target.port}`;
    if (r.reachable) {
      Logger.pass(`${label} — ${r.name ?? '(unnamed)'} · ${r.rttMs}ms · k6 ${r.k6Version ?? 'n/a'} · skew ${r.clockSkewMs ?? '?'}ms`);
      Logger.detail(r.diagnosis);
    } else {
      allOk = false;
      Logger.fail(`${label} — UNREACHABLE`);
      Logger.detail(r.diagnosis);
    }
  }

  const okCount = results.filter((r) => r.reachable).length;
  Logger.header(`Result: ${okCount}/${results.length} agent(s) reachable`);
  if (allOk) {
    Logger.pass('Controller approach is viable — the firewall permits the controller→agent inbound path.');
  } else {
    Logger.warning('At least one agent is unreachable. If the cause is TIMED OUT, the firewall blocks the standing inbound service —');
    Logger.detail('consider the lower-clearance transports (pull-via-shared / SSH / CI) from design §4.6.');
  }
  return allOk;
}
