/**
 * transactionCsv.ts
 * Reads a per-machine transaction CSV (`<testId>_<host>_transaction_metric.csv`)
 * and pools the raw per-transaction response times. This is the raw carrier the
 * merge uses for EXACT (R-7) merged percentiles in the histogram-parked phase
 * (EDD §Accuracy Model). Columns (see TransactionMetricLogWriter): the transaction
 * name lives in `Transaction`, the duration in `responsetime` (SECONDS, 4dp) — this
 * reader converts to milliseconds to match the metric tables.
 */

import * as fs from 'fs';
import { percentileR7 } from '../reporting/Histogram';
import { TransactionMetricRow } from '../types/ReportingContracts';

/**
 * A transaction is identified by its TAGS — (scenario, transaction). Grouping uses a
 * private nested Map<scenario, Map<transaction, …>>; the tags are then returned as
 * explicit fields. Nothing here encodes a composite key, so there is no delimiter to
 * collide on and callers never decode anything.
 */
export interface CsvTransactionAggregate {
  scenario: string;
  transaction: string;
  count: number;
  fail: number;
  times: number[];
}

/** Group into the private nested map, returning the leaf aggregate for a tag pair. */
function leafFor(
  root: Map<string, Map<string, CsvTransactionAggregate>>,
  scenario: string,
  transaction: string,
): CsvTransactionAggregate {
  let byTxn = root.get(scenario);
  if (!byTxn) { byTxn = new Map<string, CsvTransactionAggregate>(); root.set(scenario, byTxn); }
  let leaf = byTxn.get(transaction);
  if (!leaf) { leaf = { scenario, transaction, count: 0, fail: 0, times: [] }; byTxn.set(transaction, leaf); }
  return leaf;
}

/** Flatten the nested grouping map into records with the tags as explicit fields. */
function flatten(root: Map<string, Map<string, CsvTransactionAggregate>>): CsvTransactionAggregate[] {
  const out: CsvTransactionAggregate[] = [];
  for (const byTxn of root.values()) for (const leaf of byTxn.values()) out.push(leaf);
  return out;
}

/** Minimal RFC-4180-ish line parser (handles quoted fields + escaped quotes). */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/**
 * Read a transaction CSV into { transactionName: responseTimesMs[] }.
 * Returns {} if the file is missing/empty or lacks the required columns.
 */
export function readTransactionCsvRaw(file: string): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  if (!fs.existsSync(file)) return out;
  const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/);
  if (lines.length < 2) return out;

  const header = parseCsvLine(lines[0]);
  const txnIdx = header.indexOf('Transaction');
  const rtIdx = header.indexOf('responsetime');
  if (txnIdx === -1 || rtIdx === -1) return out;

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = parseCsvLine(lines[i]);
    const txn = cols[txnIdx];
    const rtSec = parseFloat(cols[rtIdx]);
    if (!txn || !Number.isFinite(rtSec)) continue; // '' responsetime stubs skipped
    (out[txn] ??= []).push(rtSec * 1000); // seconds → ms
  }
  return out;
}

export interface TransactionCsvStats {
  /** One record per (scenario, transaction) — same-named transactions in different
   * journeys stay separate, with both tags as explicit fields. */
  transactions: CsvTransactionAggregate[];
  totalCount: number;
  totalFail: number;
  /** VU count from the most recent row (approximate "current VUs"). */
  lastVus: number;
}

/**
 * Richer parse used by the live heartbeat: per-transaction count/fail/response
 * times (ms) plus totals and the latest VU count. Reads the whole file each call
 * (fine at heartbeat cadence; the file is small relative to the run).
 */
export function readTransactionCsvStats(file: string): TransactionCsvStats {
  const empty: TransactionCsvStats = { transactions: [], totalCount: 0, totalFail: 0, lastVus: 0 };
  if (!fs.existsSync(file)) return empty;
  const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/);
  if (lines.length < 2) return empty;

  const header = parseCsvLine(lines[0]);
  const txnIdx = header.indexOf('Transaction');
  const rtIdx = header.indexOf('responsetime');
  const passIdx = header.indexOf('IsPass');
  const vusIdx = header.indexOf('vus');
  const scnIdx = header.indexOf('Scenario');
  if (txnIdx === -1 || rtIdx === -1) return empty;

  const grouped = new Map<string, Map<string, CsvTransactionAggregate>>();
  let totalCount = 0;
  let totalFail = 0;
  let lastVus = 0;
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = parseCsvLine(lines[i]);
    const txn = cols[txnIdx];
    if (!txn) continue;
    const scenario = scnIdx !== -1 ? (cols[scnIdx] || '') : '';
    const e = leafFor(grouped, scenario, txn);
    e.count++;
    totalCount++;
    const isPass = passIdx !== -1 ? cols[passIdx] : 'true';
    if (isPass === 'false' || isPass === '0') { e.fail++; totalFail++; }
    const rtSec = parseFloat(cols[rtIdx]);
    if (Number.isFinite(rtSec)) e.times.push(rtSec * 1000);
    if (vusIdx !== -1) { const v = parseInt(cols[vusIdx], 10); if (Number.isFinite(v)) lastVus = v; }
  }
  return { transactions: flatten(grouped), totalCount, totalFail, lastVus };
}

/**
 * Build merged transaction table rows straight from one or more transaction CSVs,
 * keyed by (scenario, transaction) so same-named transactions in different journeys
 * stay SEPARATE (k6's end-of-test summary collapses them — the CSV is the only source
 * that preserves the scenario per row). Pools counts/pass/fail + response times across
 * files, then computes the configured stats via exact R-7 percentiles. `journey` is set
 * to the scenario so the report's SCENARIO column shows the real journey, not "all".
 */
export function buildTransactionRowsFromCsv(files: string[], stats: string[]): TransactionMetricRow[] {
  // Pool across machines/files into the same private nested grouping.
  const grouped = new Map<string, Map<string, CsvTransactionAggregate>>();
  for (const file of files) {
    for (const e of readTransactionCsvStats(file).transactions) {
      const a = leafFor(grouped, e.scenario, e.transaction);
      a.count += e.count; a.fail += e.fail;
      for (const t of e.times) a.times.push(t);
    }
  }
  const rows: TransactionMetricRow[] = [];
  for (const a of flatten(grouped)) {
    const times = a.times.sort((x, y) => x - y);
    const n = times.length;
    const mean = n ? times.reduce((s, v) => s + v, 0) / n : 0;
    const row: TransactionMetricRow = {
      journey: a.scenario,
      transaction: a.transaction,
      count: a.count,
      pass: a.count - a.fail,
      fail: a.fail,
      errorPct: a.count > 0 ? Number(((a.fail / a.count) * 100).toFixed(2)) : 0,
    };
    for (const stat of stats) {
      const key = stat.trim().toLowerCase();
      if (key === 'count' || key === 'pass' || key === 'fail') continue;
      if (key === 'avg') row.avg = mean;
      else if (key === 'min') row.min = n ? times[0] : 0;
      else if (key === 'max') row.max = n ? times[n - 1] : 0;
      else if (key === 'std' || key === 'stddev') {
        let ss = 0; for (const v of times) ss += (v - mean) * (v - mean);
        row[stat] = n ? Math.sqrt(ss / n) : 0;
      } else if (key === 'med' || key === 'median') {
        row[stat] = n ? percentileR7(times, 0.5, true) : 0;
      } else {
        const m = /^p\(?(\d+(?:\.\d+)?)\)?$/.exec(key);
        if (m) { const p = Number(m[1]); if (p > 0 && p < 100) row[stat] = n ? percentileR7(times, p / 100, true) : 0; }
      }
    }
    rows.push(row);
  }
  rows.sort((a, b) => (Number(b.count) || 0) - (Number(a.count) || 0));
  return rows;
}

/** Find the request CSV inside a folder, if present. */
export function findRequestCsv(dir: string): string | null {
  try {
    const name = fs.readdirSync(dir).find((f) => f.endsWith('_request_metric.csv'));
    return name ? `${dir}/${name}` : null;
  } catch { return null; }
}

/**
 * Request-level failure from a request CSV: total requests and failed (isError, which
 * is checks-first then status). This is the authoritative failure source for the
 * failure graph — combined correctly as Σfailed/Σtotal, never averaged percentages.
 */
export function readRequestFailure(file: string): { total: number; failed: number } {
  const out = { total: 0, failed: 0 };
  try {
    if (!fs.existsSync(file)) return out;
    const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return out;
    const errIdx = parseCsvLine(lines[0]).indexOf('isError');
    if (errIdx === -1) return out;
    for (let i = 1; i < lines.length; i++) {
      const v = (parseCsvLine(lines[i])[errIdx] || '').toLowerCase();
      out.total++;
      if (v === 'true' || v === '1') out.failed++;
    }
  } catch { /* ignore */ }
  return out;
}

/**
 * Request failure bucketed by wall-clock time (checks-first isError). Key = bucket
 * start in ms (floor(ts / bucketMs) * bucketMs). Pooled across machines then read as
 * failed/total per bucket → the request-failure-over-time series.
 */
export function readRequestFailByBucket(file: string, bucketSec: number, into?: Map<number, { total: number; failed: number }>): Map<number, { total: number; failed: number }> {
  const out = into ?? new Map<number, { total: number; failed: number }>();
  const bucketMs = Math.max(1, bucketSec) * 1000;
  try {
    if (!fs.existsSync(file)) return out;
    const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return out;
    const header = parseCsvLine(lines[0]);
    const tsIdx = header.indexOf('ts');
    const errIdx = header.indexOf('isError');
    if (tsIdx === -1 || errIdx === -1) return out;
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const ms = Date.parse(cols[tsIdx]);
      if (!Number.isFinite(ms)) continue;
      const key = Math.floor(ms / bucketMs) * bucketMs;
      const e = out.get(key) ?? { total: 0, failed: 0 };
      e.total++;
      const v = (cols[errIdx] || '').toLowerCase();
      if (v === 'true' || v === '1') e.failed++;
      out.set(key, e);
    }
  } catch { /* ignore */ }
  return out;
}

export interface RequestTiming { transaction: string; method: string; times: number[]; }

/** Per-request-name response times (ms) + method/transaction, accumulated across files. */
export function readRequestTimings(file: string, acc = new Map<string, RequestTiming>()): Map<string, RequestTiming> {
  try {
    if (!fs.existsSync(file)) return acc;
    const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return acc;
    const h = parseCsvLine(lines[0]);
    const nameIdx = h.indexOf('Request Name');
    const txnIdx = h.indexOf('Transaction');
    const rtIdx = h.indexOf('responsetime');
    const tagIdx = h.indexOf('tags');
    if (nameIdx === -1 || rtIdx === -1) return acc;
    for (let i = 1; i < lines.length; i++) {
      const c = parseCsvLine(lines[i]);
      const name = c[nameIdx];
      const rt = parseFloat(c[rtIdx]);
      if (!name || !Number.isFinite(rt)) continue;
      let e = acc.get(name);
      if (!e) {
        let method = '';
        try { method = (JSON.parse(c[tagIdx] || '{}') as { method?: string }).method ?? ''; } catch { /* ignore */ }
        e = { transaction: txnIdx !== -1 ? (c[txnIdx] || '') : '', method, times: [] };
        acc.set(name, e);
      }
      e.times.push(rt * 1000);
    }
  } catch { /* ignore */ }
  return acc;
}

/** Find the transaction CSV inside a collected machine folder, if present. */
export function findTransactionCsv(dir: string): string | null {
  try {
    const name = fs.readdirSync(dir).find((f) => f.endsWith('_transaction_metric.csv'));
    return name ? `${dir}/${name}` : null;
  } catch {
    return null;
  }
}
