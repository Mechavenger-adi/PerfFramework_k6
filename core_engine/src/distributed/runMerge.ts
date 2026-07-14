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
import { readTransactionCsvRaw, findTransactionCsv } from './transactionCsv';
import { CiSummary, TimeSeriesFile, TransactionMetricsFile } from '../types/ReportingContracts';
import { HistogramArtifact } from '../reporting/HistogramArtifactBuilder';

const MERGED_DIR = '_merged';
const FINAL_PREFIX = 'Final_';

/** dd_MM_yyyyTHH_mm — Windows-path-safe merged-output folder timestamp. */
function finalTimestamp(d = new Date()): string {
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${p(d.getDate())}_${p(d.getMonth() + 1)}_${d.getFullYear()}T${p(d.getHours())}_${p(d.getMinutes())}`;
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
}

export function runMerge(options: MergeCliOptions): boolean {
  const runDir = path.resolve(options.runDir);
  if (!fs.existsSync(runDir) || !fs.statSync(runDir).isDirectory()) {
    Logger.error(`[merge] run dir not found: ${runDir}`);
    return false;
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
  const manifests: Array<{ machine: string; runId?: string; scriptHash?: string; plan?: { name?: string; environment?: string; executionMode?: string } }> = [];

  for (const dir of machineDirs) {
    const machineName = path.basename(dir);
    const tm = readJson<TransactionMetricsFile>(path.join(dir, 'transaction-metrics.json'));
    const hist = readJson<HistogramArtifact>(path.join(dir, 'metrics-histogram.json'));
    const ci = readJson<CiSummary>(path.join(dir, 'ci-summary.json'));
    const ts = readJson<TimeSeriesFile>(path.join(dir, 'timeseries.json'));
    const manifest = readJson<{ runId?: string; scriptHash?: string; plan?: { name?: string; environment?: string; executionMode?: string } }>(path.join(dir, 'run-manifest.json'));

    // Raw transaction CSV → exact (R-7) pooled percentiles (histogram-parked phase).
    const csvPath = findTransactionCsv(dir);
    const transactionRaw = csvPath ? readTransactionCsvRaw(csvPath) : undefined;
    if (!csvPath && !hist) {
      Logger.warn(`[merge] ${machineName}: no transaction CSV and no histogram — percentiles unavailable for this machine`);
    } else if (!csvPath) {
      Logger.warn(`[merge] ${machineName}: no transaction CSV — falling back to the histogram for percentiles`);
    }

    machineArtifacts.push({ machineName, transactionMetrics: tm, histogram: hist, ciSummary: ci, transactionRaw });
    machineTimeseries.push({
      machineName, timeseries: ts,
      errors: readNdjson(path.join(dir, 'errors.ndjson')),
      warnings: readNdjson(path.join(dir, 'warnings.ndjson')),
    });
    manifests.push({ machine: machineName, runId: manifest?.runId, scriptHash: manifest?.scriptHash, plan: manifest?.plan });
  }

  // ── Pre-merge validation (design §6.2). ──
  const validationWarnings = validateManifests(manifests);
  for (const w of validationWarnings) Logger.warn(`[merge] ${w}`);

  // ── Merge ──
  const merge = MergeEngine.merge(machineArtifacts);
  for (const w of merge.warnings) Logger.warn(`[merge] ${w}`);

  const planInfo = manifests.find((m) => m.plan)?.plan ?? {};
  const counterBucketSeconds = machineTimeseries.find((m) => m.timeseries)?.timeseries?.bucketSizeSeconds ?? 2;
  const { bundle, timeseries } = MergedReportBuilder.build({
    merge,
    machines: machineTimeseries,
    plan: { name: planInfo.name ?? merge.ciSummary.plan ?? 'Distributed Run', environment: planInfo.environment ?? merge.ciSummary.environment ?? '', executionMode: planInfo.executionMode },
    counterBucketSeconds,
    transactionStats: merge.transactionMetrics.stats,
  });

  // ── Write merged artifacts to Final_<testname>_<ts>/ (EDD §End) ──
  const testName = planInfo.name ?? merge.ciSummary.plan ?? 'DistributedRun';
  const safeTestName = testName.replace(/[^a-zA-Z0-9_]/g, '_');
  const finalFolder = `${FINAL_PREFIX}${safeTestName}_${finalTimestamp()}`;
  const outDir = options.out ? path.resolve(options.out) : path.join(runDir, finalFolder);
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

  const reportPath = path.join(outDir, 'RunReport.html');
  fs.writeFileSync(reportPath, RunReportGenerator.generate(bundle), 'utf-8');

  Logger.pass(`[merge] merged ${merge.machines.length} machine(s) → ${outDir}`);
  Logger.detail(`Machines: ${merge.machines.join(', ')}`);
  Logger.detail(`Status: ${merge.ciSummary.status} · transaction failure rate ${(merge.ciSummary.transactionFailureRate ?? 0).toFixed(2)}% (budget ${merge.ciSummary.transactionErrorBudget ?? 0}%)`);
  Logger.detail(`Transactions: ${merge.transactionMetrics.transactions.length}`);
  Logger.detail(`Report: ${reportPath}`);

  // Exit-code contract for CI: non-zero on failed/aborted.
  return merge.ciSummary.status === 'passed';
}

function validateManifests(
  manifests: Array<{ machine: string; runId?: string; scriptHash?: string }>,
): string[] {
  const warnings: string[] = [];
  const runIds = new Set(manifests.map((m) => m.runId).filter(Boolean));
  if (runIds.size > 1) warnings.push(`machines report different runIds (${[...runIds].join(', ')}) — are you merging the same run?`);
  const hashes = new Set(manifests.map((m) => m.scriptHash).filter(Boolean));
  if (hashes.size > 1) warnings.push(`machines report different scriptHashes — scripts may differ across agents`);
  return warnings;
}
