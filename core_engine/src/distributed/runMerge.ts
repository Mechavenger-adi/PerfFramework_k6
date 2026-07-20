/**
 * runMerge.ts
 * CLI handler for `k6-framework merge --run-dir <shared>/<runId>`.
 *
 * Discovers per-machine subdirectories, validates their manifests agree, merges
 * their artifacts (MergeEngine) into a single set, builds the merged timeseries +
 * report (MergedReportBuilder), and writes everything to `<run-dir>/_merged/`.
 * Reuses the existing RunReportGenerator unchanged.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { ArtifactWriter } from '../reporting/ArtifactWriter';
import { RunReportGenerator } from '../reporting/RunReportGenerator';
import { MergeEngine, MachineArtifacts } from './MergeEngine';
import { MergedReportBuilder, MachineTimeseries } from './MergedReportBuilder';
import { readTransactionCsvRaw, findTransactionCsv, findRequestCsv, readRequestFailByBucket, readRequestTimings } from './transactionCsv';
import { percentileR7 } from '../reporting/Histogram';
import { CiSummary, TimeSeriesFile, TransactionMetricsFile } from '../types/ReportingContracts';
import { HistogramArtifact } from '../reporting/HistogramArtifactBuilder';

const MERGED_DIR = '_merged';
const FINAL_PREFIX = 'Final_';

/** dd_MM_yyyyTHH_mm — Windows-path-safe merged-output folder timestamp. */
function finalTimestamp(d = new Date()): string {
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${p(d.getDate())}_${p(d.getMonth() + 1)}_${d.getFullYear()}T${p(d.getHours())}_${p(d.getMinutes())}`;
}

/**
 * Concatenate the per-machine CSVs (whose names end with `suffix`, e.g.
 * `_request_metric.csv`) into one merged CSV — header once, all data rows. The rows
 * already carry a hostName column so each machine stays identifiable. Returns row count.
 */
function writeMergedCsv(machineDirs: string[], suffix: string, outPath: string): number {
  let header = '';
  const rows: string[] = [];
  for (const dir of machineDirs) {
    let name: string | undefined;
    try { name = fs.readdirSync(dir).find((n) => n.endsWith(suffix)); } catch { name = undefined; }
    if (!name) continue;
    const lines = fs.readFileSync(path.join(dir, name), 'utf-8').split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) continue;
    if (!header) header = lines[0];
    for (let i = 1; i < lines.length; i++) rows.push(lines[i]);
  }
  if (!header) return 0;
  fs.writeFileSync(outPath, `${header}\n${rows.join('\n')}\n`, 'utf-8');
  return rows.length;
}

function readJson<T>(file: string): T | undefined {
  try {
    if (!fs.existsSync(file)) return undefined;
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
  } catch (err) {
    Logger.warn(`[merge] could not parse ${file}: ${(err as Error).message}`);
    return undefined;
  }
}

function readNdjson(file: string): Array<Record<string, unknown>> {
  try {
    if (!fs.existsSync(file)) return [];
    return fs.readFileSync(file, 'utf-8')
      .split(/\r?\n/).filter((l) => l.trim().length > 0)
      .map((l) => { try { return JSON.parse(l); } catch { return null; } })
      .filter((x): x is Record<string, unknown> => x !== null);
  } catch { return []; }
}

interface MergeCliOptions {
  runDir: string;
  out?: string;
  /** Wait until every machine in `machines` has landed (run-manifest.json), then merge. */
  wait?: boolean;
  machines?: string[];
  pollSec?: number;
  waitTimeoutSec?: number;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** A machine folder is "landed" once its run-manifest.json (written last) is present. */
function machineLanded(runDir: string, name: string): boolean {
  return fs.existsSync(path.join(runDir, name, 'run-manifest.json'));
}

async function waitForMachines(runDir: string, machines: string[], pollSec: number, timeoutSec: number): Promise<boolean> {
  const deadline = Date.now() + timeoutSec * 1000;
  for (;;) {
    const missing = machines.filter((m) => !machineLanded(runDir, m));
    if (missing.length === 0) return true;
    if (Date.now() >= deadline) {
      Logger.error(`[merge] timed out after ${timeoutSec}s waiting for: ${missing.join(', ')}`);
      return false;
    }
    Logger.info(`[merge] waiting for ${missing.length}/${machines.length} machine(s): ${missing.join(', ')}`);
    await sleep(pollSec * 1000);
  }
}

export async function runMerge(options: MergeCliOptions): Promise<boolean> {
  const runDir = path.resolve(options.runDir);
  if (!fs.existsSync(runDir) || !fs.statSync(runDir).isDirectory()) {
    // With --wait the run dir may not exist yet; create/tolerate and keep polling below.
    if (!options.wait) { Logger.error(`[merge] run dir not found: ${runDir}`); return false; }
    fs.mkdirSync(runDir, { recursive: true });
  }

  // ── Auto-finalize: block until all expected machines have collected in. ──
  if (options.wait) {
    if (!options.machines || options.machines.length === 0) {
      Logger.error('[merge] --wait requires --machines <lg1,lg2,...> so it knows when the run is complete');
      return false;
    }
    Logger.info(`[merge] --wait: expecting ${options.machines.length} machine(s): ${options.machines.join(', ')}`);
    const ready = await waitForMachines(runDir, options.machines, options.pollSec ?? 5, options.waitTimeoutSec ?? 600);
    if (!ready) return false;
    Logger.pass('[merge] all machines collected — finalizing');
  }

  // ── Discover per-machine subdirs (any subdir with at least one artifact). ──
  const machineDirs = fs.readdirSync(runDir)
    .filter((name) => name !== MERGED_DIR && !name.startsWith(FINAL_PREFIX))
    .map((name) => path.join(runDir, name))
    .filter((dir) => fs.statSync(dir).isDirectory())
    .filter((dir) =>
      fs.existsSync(path.join(dir, 'metrics-histogram.json')) ||
      fs.existsSync(path.join(dir, 'transaction-metrics.json')));

  if (machineDirs.length === 0) {
    Logger.error(`[merge] no per-machine artifact folders found under ${runDir}`);
    Logger.detail('Expected layout: <run-dir>/<machineName>/{transaction-metrics.json, metrics-histogram.json, ...}');
    return false;
  }

  Logger.info(`[merge] merging ${machineDirs.length} machine(s) from ${runDir}`);

  const machineArtifacts: MachineArtifacts[] = [];
  const machineTimeseries: MachineTimeseries[] = [];
  const manifests: Array<{ machine: string; runId?: string; testId?: string; scriptHash?: string; plan?: { name?: string; environment?: string; executionMode?: string } }> = [];

  for (const dir of machineDirs) {
    const machineName = path.basename(dir);
    const tm = readJson<TransactionMetricsFile>(path.join(dir, 'transaction-metrics.json'));
    const hist = readJson<HistogramArtifact>(path.join(dir, 'metrics-histogram.json'));
    const ci = readJson<CiSummary>(path.join(dir, 'ci-summary.json'));
    const ts = readJson<TimeSeriesFile>(path.join(dir, 'timeseries.json'));
    const manifest = readJson<{ runId?: string; testId?: string; scriptHash?: string; plan?: { name?: string; environment?: string; executionMode?: string } }>(path.join(dir, 'run-manifest.json'));

    // Raw transaction CSV → exact (R-7) pooled percentiles (histogram-parked phase).
    const csvPath = findTransactionCsv(dir);
    const transactionRaw = csvPath ? readTransactionCsvRaw(csvPath) : undefined;
    if (!csvPath && !hist) {
      Logger.warn(`[merge] ${machineName}: no transaction CSV and no histogram — percentiles unavailable for this machine`);
    } else if (!csvPath) {
      Logger.warn(`[merge] ${machineName}: no transaction CSV — falling back to the histogram for percentiles`);
    }

    machineArtifacts.push({ machineName, transactionMetrics: tm, histogram: hist, ciSummary: ci, transactionRaw });
    const sysMetrics = readJson<{ snapshots?: Array<Record<string, unknown>> }>(path.join(dir, 'system-metrics.json'));
    // Failure snapshots (request/response captured at failure) live in snapshots.json.
    // These are DISTINCT from the host CPU/mem samples in system-metrics.json.
    const failureSnapshots = readJson<Array<Record<string, unknown>>>(path.join(dir, 'snapshots.json')) ?? [];
    machineTimeseries.push({
      machineName, timeseries: ts,
      // Tag each error/warning with its machine so the merged report can show "on which machine".
      errors: readNdjson(path.join(dir, 'errors.ndjson')).map((e) => ({ machine: machineName, ...e })),
      warnings: readNdjson(path.join(dir, 'warnings.ndjson')).map((e) => ({ machine: machineName, ...e })),
      hostSnapshots: sysMetrics?.snapshots ?? [],
      failureSnapshots,
    });
    manifests.push({ machine: machineName, runId: manifest?.runId, testId: manifest?.testId, scriptHash: manifest?.scriptHash, plan: manifest?.plan });
  }

  // ── Pre-merge validation (design §6.2). ──
  const validationWarnings = validateManifests(manifests);
  for (const w of validationWarnings) Logger.warn(`[merge] ${w}`);

  // ── Merge ──
  const merge = MergeEngine.merge(machineArtifacts);
  for (const w of merge.warnings) Logger.warn(`[merge] ${w}`);

  const planInfo = manifests.find((m) => m.plan)?.plan ?? {};
  const counterBucketSeconds = machineTimeseries.find((m) => m.timeseries)?.timeseries?.bucketSizeSeconds ?? 2;
  // Pool checks-first request failure (isError) across machines, bucketed → the
  // request-failure-over-time series (correct Σfailed/Σtotal, not summed percentages).
  const requestFailBuckets = new Map<number, { total: number; failed: number }>();
  const reqTimings = new Map<string, import('./transactionCsv').RequestTiming>();
  for (const dir of machineDirs) {
    const rc = findRequestCsv(dir);
    if (rc) { readRequestFailByBucket(rc, counterBucketSeconds, requestFailBuckets); readRequestTimings(rc, reqTimings); }
  }
  // Top-5 slowest requests (by p90), pooled across machines.
  const topRequests = [...reqTimings.entries()]
    .map(([name, e]) => {
      const sorted = e.times.slice().sort((a, b) => a - b);
      const count = sorted.length;
      return {
        name, method: e.method, transaction: e.transaction, count,
        avg: count ? sorted.reduce((s, v) => s + v, 0) / count : 0,
        min: count ? sorted[0] : 0,
        max: count ? sorted[count - 1] : 0,
        p90: count ? percentileR7(sorted, 0.9, true) : 0,
      };
    })
    .sort((a, b) => b.p90 - a.p90)
    .slice(0, 5);
  const { bundle, timeseries } = MergedReportBuilder.build({
    merge,
    machines: machineTimeseries,
    plan: { name: planInfo.name ?? merge.ciSummary.plan ?? 'Distributed Run', environment: planInfo.environment ?? merge.ciSummary.environment ?? '', executionMode: planInfo.executionMode },
    counterBucketSeconds,
    transactionStats: merge.transactionMetrics.stats,
    requestFailBuckets,
    topRequests,
  });

  // ── Write merged artifacts to Final_<testname>_<ts>/ (EDD §End) ──
  const testName = planInfo.name ?? merge.ciSummary.plan ?? 'DistributedRun';
  const safeTestName = testName.replace(/[^a-zA-Z0-9_]/g, '_');
  const finalFolder = `${FINAL_PREFIX}${safeTestName}_${finalTimestamp()}`;
  // New layout: run-dir is <collectDir>/<runId>/shared → put Final_ in the runId folder
  // (a sibling of shared). Legacy/other run-dirs → Final_ inside the run-dir.
  const finalParent = path.basename(runDir) === 'shared' ? path.dirname(runDir) : runDir;
  const outDir = options.out ? path.resolve(options.out) : path.join(finalParent, finalFolder);
  fs.mkdirSync(outDir, { recursive: true });

  ArtifactWriter.writeJson(path.join(outDir, 'transaction-metrics.json'), merge.transactionMetrics);
  ArtifactWriter.writeJson(path.join(outDir, 'ci-summary.json'), merge.ciSummary);
  ArtifactWriter.writeJson(path.join(outDir, 'timeseries.json'), timeseries);
  if (merge.histogram) ArtifactWriter.writeJson(path.join(outDir, 'metrics-histogram.json'), merge.histogram);
  ArtifactWriter.writeJson(path.join(outDir, 'run-manifest.json'), {
    schemaVersion: 1,
    merged: true,
    runId: merge.runId,
    generatedAt: new Date().toISOString(),
    machines: merge.machines,
    counterBucketSeconds,
    histogramBucketSeconds: merge.histogram?.bucketSeconds,
    histogramRelativeAccuracy: merge.histogram?.relativeAccuracy,
    plan: planInfo,
    validationWarnings: [...validationWarnings, ...merge.warnings],
  });

  // Merged raw CSVs (all machines concatenated; rows keep their hostName column).
  const reqRows = writeMergedCsv(machineDirs, '_request_metric.csv', path.join(outDir, 'merged_request_metric.csv'));
  const txnRows = writeMergedCsv(machineDirs, '_transaction_metric.csv', path.join(outDir, 'merged_transaction_metric.csv'));

  const reportPath = path.join(outDir, 'RunReport.html');
  fs.writeFileSync(reportPath, RunReportGenerator.generate(bundle), 'utf-8');

  Logger.pass(`[merge] merged ${merge.machines.length} machine(s) → ${outDir}`);
  Logger.detail(`Merged CSVs: ${reqRows} request row(s), ${txnRows} transaction row(s)`);
  Logger.detail(`Machines: ${merge.machines.join(', ')}`);
  Logger.detail(`Status: ${merge.ciSummary.status} · transaction failure rate ${(merge.ciSummary.transactionFailureRate ?? 0).toFixed(2)}% (budget ${merge.ciSummary.transactionErrorBudget ?? 0}%)`);
  Logger.detail(`Transactions: ${merge.transactionMetrics.transactions.length}`);
  Logger.detail(`Report: ${reportPath}`);

  // Exit-code contract for CI: non-zero on failed/aborted.
  return merge.ciSummary.status === 'passed';
}

function validateManifests(
  manifests: Array<{ machine: string; runId?: string; testId?: string; scriptHash?: string }>,
): string[] {
  const warnings: string[] = [];
  const runIds = new Set(manifests.map((m) => m.runId).filter(Boolean));
  if (runIds.size > 1) warnings.push(`machines report different runIds (${[...runIds].join(', ')}) — are you merging the same run?`);
  const testIds = new Set(manifests.map((m) => m.testId).filter(Boolean));
  if (testIds.size > 1) warnings.push(`machines report different testIds (${[...testIds].join(', ')}) — are these the same test?`);
  const hashes = new Set(manifests.map((m) => m.scriptHash).filter(Boolean));
  if (hashes.size > 1) warnings.push(`machines report different scriptHashes — scripts may differ across agents`);
  return warnings;
}
