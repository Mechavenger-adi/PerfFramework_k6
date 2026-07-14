/**
 * collectRun.ts
 * Collection step for the "write-local, then collect" model (design §1.4 / §3).
 * Each LG runs and writes results to its OWN local disk; afterward its finished
 * run folder is copied (one-shot, post-run) into the shared collect location under
 *   <collectDir>/shared_<runId>/<machineName>/
 * The `shared_<runId>` prefix namespaces the distributed aggregation folder so a
 * different test/person can't accidentally overwrite the same location, and makes
 * the folder self-identifying as a shared (multi-machine) collection.
 *
 * This is a post-run COPY into a per-machine subfolder — never a concurrent/live
 * shared write — so there is no corruption risk. (Until the Phase-2 controller
 * exists, the shared location is passed via K6_PERF_COLLECT_DIR.)
 */

import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';

/** Folder name for a run's shared collection dir. */
export function sharedRunFolder(runId: string): string {
  return `shared_${runId}`;
}

/** k6's raw metrics firehose — kept LOCAL by default; the merge needs only the CSV + JSON artifacts. */
const DEFAULT_EXCLUDE = new Set(['metrics-stream.json']);

function copyDirInto(src: string, dest: string, exclude: Set<string>): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (exclude.has(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirInto(s, d, exclude);
    else fs.copyFileSync(s, d);
  }
}

/**
 * Copy a finished local run folder into <collectDir>/shared_<runId>/<machineName>/.
 * The raw metrics-stream.json is excluded by default (large, local-only); pass
 * `includeRaw` to copy it too. Returns the destination path.
 */
export function collectRunDir(reportDir: string, runId: string, machineName: string, collectDir: string, includeRaw = false): string {
  const dest = path.join(path.resolve(collectDir), sharedRunFolder(runId), machineName);
  copyDirInto(reportDir, dest, includeRaw ? new Set<string>() : DEFAULT_EXCLUDE);
  return dest;
}

function readRunId(dir: string): string | undefined {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(dir, 'run-manifest.json'), 'utf-8')) as { runId?: string };
    return m.runId;
  } catch {
    return undefined;
  }
}

/** CLI handler: `k6-framework collect --from <runDir> --into <collectDir> --machine <name>`. */
export function runCollect(opts: { from: string; into: string; machine: string; runId?: string; includeRaw?: boolean }): boolean {
  const from = path.resolve(opts.from);
  if (!fs.existsSync(from) || !fs.statSync(from).isDirectory()) {
    Logger.error(`[collect] source run dir not found: ${from}`);
    return false;
  }
  const runId = opts.runId || readRunId(from) || path.basename(from);
  const dest = collectRunDir(from, runId, opts.machine, opts.into, opts.includeRaw);
  Logger.pass(`[collect] ${from} → ${dest}`);
  Logger.detail(`Merge with: k6-framework merge --run-dir ${path.join(path.resolve(opts.into), sharedRunFolder(runId))}`);
  return true;
}
