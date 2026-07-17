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
  perTxn: Map<string, { count: number; fail: number; times: number[] }>;
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
  const empty: TransactionCsvStats = { perTxn: new Map(), totalCount: 0, totalFail: 0, lastVus: 0 };
  if (!fs.existsSync(file)) return empty;
  const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/);
  if (lines.length < 2) return empty;

  const header = parseCsvLine(lines[0]);
  const txnIdx = header.indexOf('Transaction');
  const rtIdx = header.indexOf('responsetime');
  const passIdx = header.indexOf('IsPass');
  const vusIdx = header.indexOf('vus');
  if (txnIdx === -1 || rtIdx === -1) return empty;

  const perTxn = new Map<string, { count: number; fail: number; times: number[] }>();
  let totalCount = 0;
  let totalFail = 0;
  let lastVus = 0;
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = parseCsvLine(lines[i]);
    const txn = cols[txnIdx];
    if (!txn) continue;
    let e = perTxn.get(txn);
    if (!e) { e = { count: 0, fail: 0, times: [] }; perTxn.set(txn, e); }
    e.count++;
    totalCount++;
    const isPass = passIdx !== -1 ? cols[passIdx] : 'true';
    if (isPass === 'false' || isPass === '0') { e.fail++; totalFail++; }
    const rtSec = parseFloat(cols[rtIdx]);
    if (Number.isFinite(rtSec)) e.times.push(rtSec * 1000);
    if (vusIdx !== -1) { const v = parseInt(cols[vusIdx], 10); if (Number.isFinite(v)) lastVus = v; }
  }
  return { perTxn, totalCount, totalFail, lastVus };
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
