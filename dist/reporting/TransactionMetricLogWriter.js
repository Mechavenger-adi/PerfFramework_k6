"use strict";
/**
 * TransactionMetricLogWriter.ts
 *
 * Live, per-transaction CSV log derived from the k6 `--out json=` stream
 * (metrics-stream.json). One row per transaction iteration — sourced from each
 * `<transaction>_checkrate` Rate Point, which the framework emits exactly once
 * per transaction() iteration in its finally block (value 1 = pass, 0 = fail).
 *
 * IsPass is therefore read straight off the metric: the checkrate already
 * encodes the checks-first outcome plus the fallbacks (a failed k6Check, a
 * thrown error, or the HTTP-error backstop for an unchecked failing request all
 * mark the iteration failed). There is no correlation or buffering to do — the
 * sample is final at emit time, so rows are appended live.
 *
 * Byte-offset + partial-line buffering makes incremental reads safe across
 * chunk boundaries (mirrors RequestMetricLogWriter's tailer).
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionMetricLogWriter = void 0;
const fs = __importStar(require("fs"));
const POLL_INTERVAL_MS = 500;
const CHECKRATE_SUFFIX = '_checkrate';
// Fixed column order.
const COLUMNS = [
    'ts',
    'testId',
    'runID',
    'hostName',
    'vus',
    'i',
    'Scenario',
    'Transaction',
    'IsPass',
];
/** RFC-4180-style CSV field escaping. */
function csvField(value) {
    if (/[",\r\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}
class TransactionMetricLogWriter {
    constructor(streamPath, outPath, ctx) {
        this.streamPath = streamPath;
        this.outPath = outPath;
        this.ctx = ctx;
        this.offset = 0;
        this.partial = '';
        this.timer = null;
        this.rows = 0;
    }
    /** Begin polling the stream file and appending rows. */
    start() {
        // Fresh file each run (truncate) + header row.
        fs.writeFileSync(this.outPath, COLUMNS.map(csvField).join(',') + '\n', 'utf-8');
        this.timer = setInterval(() => this.tick(), POLL_INTERVAL_MS);
        if (this.timer.unref)
            this.timer.unref();
    }
    /** Stop polling and flush any remaining samples. */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        // Final sweep: pick up bytes written after the last poll.
        this.tick();
    }
    /** Number of transaction rows written this run. */
    get rowCount() { return this.rows; }
    /** Path of the generated CSV. */
    get path() { return this.outPath; }
    tick() {
        let size;
        try {
            if (!fs.existsSync(this.streamPath))
                return;
            size = fs.statSync(this.streamPath).size;
        }
        catch {
            return;
        }
        if (size <= this.offset)
            return;
        let buf;
        const fd = fs.openSync(this.streamPath, 'r');
        try {
            buf = Buffer.alloc(size - this.offset);
            fs.readSync(fd, buf, 0, buf.length, this.offset);
            this.offset = size;
        }
        finally {
            fs.closeSync(fd);
        }
        this.partial += buf.toString('utf-8');
        const lines = this.partial.split('\n');
        // Last element is an incomplete line (no trailing newline yet) — hold it.
        this.partial = lines.pop() ?? '';
        let out = '';
        for (const line of lines) {
            const row = this.lineToRow(line);
            if (row)
                out += row + '\n';
        }
        if (out) {
            fs.appendFileSync(this.outPath, out, 'utf-8');
        }
    }
    /** Parse one stream line; return a CSV row for `<txn>_checkrate` Points only. */
    lineToRow(line) {
        // Fast reject: must be a Point carrying a `_checkrate` metric.
        if (!line || line.indexOf('"type":"Point"') === -1)
            return null;
        if (line.indexOf(CHECKRATE_SUFFIX + '"') === -1)
            return null;
        let p;
        try {
            p = JSON.parse(line);
        }
        catch {
            return null;
        }
        if (p.type !== 'Point' || !p.metric || !p.metric.endsWith(CHECKRATE_SUFFIX))
            return null;
        const time = p.data?.time;
        const value = p.data?.value;
        if (!time || typeof value !== 'number')
            return null;
        const transaction = p.metric.slice(0, -CHECKRATE_SUFFIX.length);
        const tags = p.data?.tags ?? {};
        const meta = p.data?.metadata ?? {};
        // vu/iter live in `metadata` on newer k6, `tags` on older — prefer metadata.
        const vu = meta.vu ?? tags.vu ?? '';
        const iter = meta.iter ?? tags.iter ?? '';
        const scenario = tags.scenario ?? '';
        // Rate .add(true) → 1 (pass), .add(false) → 0 (fail). Value is final at emit.
        const isPass = value === 1;
        const runID = `RID_${this.ctx.hostName}_${vu || 'NA'}`;
        this.rows += 1;
        return [
            time,
            this.ctx.testId,
            runID,
            this.ctx.hostName,
            vu,
            iter,
            scenario,
            transaction,
            String(isPass),
        ].map(csvField).join(',');
    }
}
exports.TransactionMetricLogWriter = TransactionMetricLogWriter;
