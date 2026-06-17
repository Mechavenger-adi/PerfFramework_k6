import * as fs from 'fs';
import * as path from 'path';
import { HARParser } from '../recording/HARParser';
import { ExchangeLogBuilder } from '../debug/ExchangeLog';
import { RecordingLogResolver } from '../debug/RecordingLogResolver';
import { CorrelationScanner } from '../correlation/CorrelationScanner';
import { ScriptCorrelationWriter } from '../correlation/ScriptCorrelationWriter';
import {
  CorrelationManifest,
  CorrelationPlan,
  CorrelationCandidate,
  CorrelationConfidence,
  RecordingExchange,
} from '../correlation/CorrelationManifest';
import { Logger, ansi } from '../utils/logger';

export interface CorrelateOptions {
  script?: string;
  har?: string;
  log?: string;
  manifest?: string;
  list?: boolean;
  apply?: string;          // 'high' | 'medium' | 'all'
  out?: string;
  manifestOut?: string;
  dryRun?: boolean;
}

/**
 * Standalone auto-correlation. Two modes:
 *   • list  (default)  — scan a recording, print suspected dynamic values, write a manifest
 *   • apply <level>    — rewrite a generated script to capture-and-substitute the values
 *
 * Input source priority: --manifest (pre-scanned) > --log > --har > recording log
 * auto-resolved from --script. The recording-log.json is recommended for --apply
 * because its request IDs align with the generated script.
 */
export async function runCorrelate(options: CorrelateOptions): Promise<void> {
  Logger.header('k6 Performance Framework – CORRELATE');

  const wantApply = Boolean(options.apply) && !options.list && !options.dryRun;

  // ── 1. Obtain the plan (load an existing manifest, or scan a recording) ──
  let plan: CorrelationPlan;
  let manifestOutPath: string | undefined;

  if (options.manifest) {
    const manifestPath = path.resolve(process.cwd(), options.manifest);
    if (!fs.existsSync(manifestPath)) {
      Logger.fail(`Manifest not found: ${manifestPath}`);
      process.exit(1);
    }
    plan = CorrelationManifest.load(manifestPath);
    Logger.detail(`Loaded manifest: ${manifestPath} (${plan.candidates.length} candidate(s))`);
  } else {
    const resolved = resolveExchanges(options);
    if (!resolved) process.exit(1);
    const { exchanges, source } = resolved;
    Logger.detail(`Scanning ${exchanges.length} recorded exchange(s) from ${source}`);
    plan = CorrelationScanner.scan(exchanges, { source });

    manifestOutPath = options.manifestOut
      ? path.resolve(process.cwd(), options.manifestOut)
      : defaultManifestPath(options, source);
    CorrelationManifest.save(plan, manifestOutPath);
    Logger.pass(`Manifest written: ${path.relative(process.cwd(), manifestOutPath)}`);
  }

  // ── 2. Always print the candidate table ──
  printCandidateTable(plan);

  if (plan.candidates.length === 0) {
    Logger.detail('No dynamic values detected. Nothing to correlate.');
    return;
  }

  // ── 3. List mode ends here ──
  if (!wantApply) {
    const highCount = plan.candidates.filter((c) => c.confidence === 'high').length;
    Logger.detail(
      `\nReview the manifest, then apply with:  ` +
      `${ansi.cyan}cli correlate --script <path> --apply high${ansi.reset}` +
      (highCount > 0 ? `   (${highCount} high-confidence candidate(s) ready)` : ''),
    );
    return;
  }

  // ── 4. Apply mode — rewrite the script ──
  if (!options.script) {
    Logger.fail('--apply requires --script <path> (the generated script to correlate).');
    process.exit(1);
  }
  const scriptPath = path.resolve(process.cwd(), options.script);
  if (!fs.existsSync(scriptPath)) {
    Logger.fail(`Script not found: ${scriptPath}`);
    process.exit(1);
  }

  const applyLevels = resolveApplyLevels(options.apply);
  const source = fs.readFileSync(scriptPath, 'utf-8');
  const result = ScriptCorrelationWriter.apply(source, plan, { applyLevels });

  if (result.applied.length === 0) {
    Logger.warn('No candidates were applied (none matched the chosen level or the script could not be anchored).');
    for (const s of result.skipped) Logger.detail(`  skipped ${s.name}: ${s.reason}`);
    return;
  }

  const outPath = options.out ? path.resolve(process.cwd(), options.out) : scriptPath;
  fs.writeFileSync(outPath, result.script, 'utf-8');

  Logger.pass(`Correlated script written: ${path.relative(process.cwd(), outPath)}`);
  for (const a of result.applied) {
    Logger.detail(`  + ${a.name}  ←  ${a.producer}  →  ${a.consumers} consumer(s), ${a.substitutions} substitution(s)`);
  }
  if (result.skipped.length > 0) {
    Logger.detail(`  (${result.skipped.length} candidate(s) skipped)`);
    for (const s of result.skipped) Logger.detail(`    - ${s.name}: ${s.reason}`);
  }
  Logger.warn('Run `npm run build` so the new extract* helpers are available in dist/ before executing the script.');
}

// ── Input resolution ──

function resolveExchanges(
  options: CorrelateOptions,
): { exchanges: RecordingExchange[]; source: string } | null {
  // Explicit recording-log.json (IDs align with a generated script).
  if (options.log) {
    const logPath = path.resolve(process.cwd(), options.log);
    if (!fs.existsSync(logPath)) {
      Logger.fail(`Recording log not found: ${logPath}`);
      return null;
    }
    return { exchanges: loadRecordingLog(logPath), source: path.relative(process.cwd(), logPath) };
  }

  // HAR (fresh scan — list mode; IDs are HAR order and may not match a script).
  if (options.har) {
    const harPath = path.resolve(process.cwd(), options.har);
    if (!fs.existsSync(harPath)) {
      Logger.fail(`HAR file not found: ${harPath}`);
      return null;
    }
    // readEntries() keeps cookie/authorization headers (parse() would strip them),
    // so consumer evidence in those headers survives the scan.
    const entries = HARParser.readEntries(harPath);
    const exchanges = toRecordingExchanges(ExchangeLogBuilder.fromEntries(entries));
    return { exchanges, source: path.relative(process.cwd(), harPath) };
  }

  // Auto-resolve the recording log from the script.
  if (options.script) {
    const resolution = RecordingLogResolver.resolve(options.script);
    if (resolution.status === 'resolved' && resolution.resolvedPath) {
      return {
        exchanges: loadRecordingLog(resolution.resolvedPath),
        source: path.relative(process.cwd(), resolution.resolvedPath),
      };
    }
    Logger.fail(
      resolution.status === 'ambiguous'
        ? `Multiple recording logs match this script — pass --log explicitly. Candidates: ${(resolution.candidates ?? []).join(', ')}`
        : `Could not find a recording log for ${options.script}. Pass --log or --har.`,
    );
    return null;
  }

  Logger.fail('Provide an input: --log <recording-log.json>, --har <file.har>, or --script <path> (to auto-resolve its recording log).');
  return null;
}

function loadRecordingLog(logPath: string): RecordingExchange[] {
  const parsed = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
  if (!Array.isArray(parsed)) {
    throw new Error(`Recording log at ${logPath} is not an array of exchanges.`);
  }
  return toRecordingExchanges(parsed);
}

/**
 * Normalize raw recording entries (recording-log.json or ExchangeLogBuilder
 * output) into RecordingExchange[]. The on-disk/builder shape names the request
 * identifier `harEntryId`; the scanner and script writer key on `id` (mirroring
 * the generator's `replay.id`), so map it across here.
 */
function toRecordingExchanges(raw: unknown[]): RecordingExchange[] {
  return raw.map((entry) => {
    const e = entry as Record<string, any>;
    return {
      id: e.id ?? e.harEntryId ?? '',
      transaction: e.transaction ?? '',
      request: e.request,
      response: e.response,
    } as RecordingExchange;
  });
}

function defaultManifestPath(options: CorrelateOptions, source: string): string {
  const baseRef = options.script ?? source;
  const dir = path.dirname(path.resolve(process.cwd(), source));
  return CorrelationManifest.defaultPathForScript(baseRef, dir);
}

function resolveApplyLevels(level?: string): Set<CorrelationConfidence> {
  switch ((level ?? 'high').toLowerCase()) {
    case 'all':
    case 'low':
      return new Set<CorrelationConfidence>(['high', 'medium', 'low']);
    case 'medium':
      return new Set<CorrelationConfidence>(['high', 'medium']);
    case 'high':
    default:
      return new Set<CorrelationConfidence>(['high']);
  }
}

// ── Output ──

function printCandidateTable(plan: CorrelationPlan): void {
  if (plan.candidates.length === 0) return;

  Logger.detail('');
  Logger.detail('Suspected dynamic values:');
  const color = (c: CorrelationConfidence): string =>
    c === 'high' ? ansi.green : c === 'medium' ? ansi.yellow : ansi.reset;

  for (const cand of plan.candidates) {
    const conf = `${color(cand.confidence)}${cand.confidence.toUpperCase().padEnd(6)}${ansi.reset}`;
    const flag = cand.apply ? `${ansi.green}apply${ansi.reset}` : 'skip ';
    const prod = `${cand.producer.requestId} ${cand.producer.extractor}:${truncate(cand.producer.locator, 28)}`;
    Logger.detail(
      `  ${conf} ${flag}  ${cand.name.padEnd(20)} ${prod.padEnd(44)} ` +
      `→ ${cand.consumers.length} use(s)  ${ansi.dim ?? ''}[${cand.reason.join(', ')}]${ansi.reset}`,
    );
    Logger.detail(`        value: ${truncate(cand.value, 64)}`);
  }
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}
