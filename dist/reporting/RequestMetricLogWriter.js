"use strict";
/**
 * RequestMetricLogWriter.ts
 *
 * Live, per-request CSV log derived from the k6 `--out json=` stream
 * (metrics-stream.json). One row per HTTP request — sourced from each
 * `http_req_duration` Point, which carries the request's tags (status, name,
 * group, scenario, har_entry_id, and vu/iter).
 *
 * isError is CHECKS-FIRST. The framework's k6Check() tags every `checks` sample
 * with the request's `har_entry_id`, so this writer correlates checks back to
 * their request. A request is an error iff ANY of its checks failed; a passing
 * check always wins — even over a >=400 status. When a request has NO check we
 * fall back to the HTTP status (not 2xx/3xx, incl. status 0 = error).
 *
 * Because a request's `checks` Points arrive AFTER its `http_req_duration`
 * Point, rows are buffered and flushed once all of a request's checks are in:
 * every check for a request runs within its iteration, so a VU's pending rows
 * are flushed when that VU advances to a new iteration (and whatever is left is
 * flushed on stop()). This adds a one-iteration lag to the otherwise-live log.
 *
 * Byte-offset + partial-line buffering makes incremental reads safe across
 * chunk boundaries.
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
exports.RequestMetricLogWriter = void 0;
const fs = __importStar(require("fs"));
const POLL_INTERVAL_MS = 500;
// Fixed column order. `tags` is a JSON-encoded catch-all for any request tag not
// promoted to its own column.
const COLUMNS = [
    'ts',
    'testId',
    'runID',
    'hostName',
    'vus',
    'i',
    'Scenario',
    'Transaction',
    'Request Name',
    'status',
    'isError',
    'responsetime',
    'tags',
];
// Tag keys promoted to dedicated columns — removed from the leftover `tags` blob.
const PROMOTED_TAGS = new Set(['vu', 'iter', 'scenario', 'group', 'name', 'status']);
/** RFC-4180-style CSV field escaping. */
function csvField(value) {
    if (/[",\r\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}
class RequestMetricLogWriter {
    constructor(streamPath, outPath, ctx) {
        this.streamPath = streamPath;
        this.outPath = outPath;
        this.ctx = ctx;
        this.offset = 0;
        this.partial = '';
        this.timer = null;
        this.rows = 0;
        // Buffered rows keyed by `${vu}|${reqId}` (reqId = har_entry_id). A request
        // with no id (e.g. a raw http.* call) gets a unique synthetic key so it still
        // produces its own row — it just can't correlate checks.
        this.pending = new Map();
        // Highest iteration observed per VU — drives the flush-on-iteration-advance.
        this.curIterByVu = new Map();
        this.seq = 0;
        this.outBuf = '';
    }
    /** Begin polling the stream file and appending rows. */
    start() {
        // Fresh file each run (truncate) + header row.
        fs.writeFileSync(this.outPath, COLUMNS.map(csvField).join(',') + '\n', 'utf-8');
        this.timer = setInterval(() => this.tick(), POLL_INTERVAL_MS);
        if (this.timer.unref)
            this.timer.unref();
    }
    /** Stop polling, flush any remaining buffered rows, and write them out. */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.tick(); // final read of any bytes written after the last poll
        this.flushAllPending(); // emit everything still buffered (last iterations)
        this.writeOut();
    }
    /** Number of request rows written this run. */
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
        for (const line of lines)
            this.processLine(line);
        this.writeOut();
    }
    writeOut() {
        if (this.outBuf) {
            fs.appendFileSync(this.outPath, this.outBuf, 'utf-8');
            this.outBuf = '';
        }
    }
    /** Parse one stream line; route http_req_duration + checks Points. */
    processLine(line) {
        if (!line || line.indexOf('"type":"Point"') === -1)
            return;
        const isReq = line.indexOf('"metric":"http_req_duration"') !== -1;
        const isCheck = !isReq && line.indexOf('"metric":"checks"') !== -1;
        if (!isReq && !isCheck)
            return;
        let p;
        try {
            p = JSON.parse(line);
        }
        catch {
            return;
        }
        if (p.type !== 'Point')
            return;
        const tags = p.data?.tags ?? {};
        const meta = p.data?.metadata ?? {};
        const vu = String(meta.vu ?? tags.vu ?? '');
        const iterStr = String(meta.iter ?? tags.iter ?? '');
        const iterNum = iterStr === '' ? 0 : Number(iterStr);
        // A new iteration for this VU means every request from earlier iterations
        // has had all of its checks — flush those rows now.
        this.maybeAdvanceIteration(vu, iterNum);
        if (p.metric === 'http_req_duration') {
            this.handleRequest(p, tags, vu, iterStr, iterNum);
        }
        else if (p.metric === 'checks') {
            this.handleCheck(p, tags, vu);
        }
    }
    handleRequest(p, tags, vu, iterStr, iterNum) {
        const time = p.data?.time;
        const value = p.data?.value;
        if (!time || typeof value !== 'number')
            return;
        const reqId = tags.har_entry_id ?? '';
        const key = reqId ? vu + '|' + reqId : vu + '|__seq' + (this.seq++);
        const scenario = tags.scenario ?? '';
        const transaction = (tags.group ?? '').replace(/^::/, '');
        const requestName = tags.name ?? tags.url ?? '';
        const statusStr = tags.status ?? '';
        const status = Number(statusStr);
        const responsetime = (value / 1000).toFixed(4);
        // Leftover tags: drop the keys promoted to columns, keep the rest losslessly.
        const leftover = {};
        for (const [k, v] of Object.entries(tags)) {
            if (!PROMOTED_TAGS.has(k))
                leftover[k] = v;
        }
        const tagsJson = Object.keys(leftover).length > 0 ? JSON.stringify(leftover) : '';
        // A check-only stub may already exist (a check arrived before this Point) —
        // preserve its tally. A duplicate http_req_duration for the same key (e.g.
        // redirect hops) simply overwrites: one row per request id.
        const existing = this.pending.get(key);
        this.pending.set(key, {
            hasRequest: true,
            time, vu, iter: iterStr, iterNum,
            scenario, transaction, requestName, statusStr, status, responsetime, tagsJson,
            checkPass: existing?.checkPass ?? 0,
            checkFail: existing?.checkFail ?? 0,
        });
    }
    handleCheck(p, tags, vu) {
        const reqId = tags.har_entry_id ?? '';
        // A check with no request id (a raw check() not routed through k6Check) can't
        // be tied to a request, so it doesn't affect any per-request isError.
        if (!reqId)
            return;
        const key = vu + '|' + reqId;
        const passed = Number(p.data?.value) === 1;
        let row = this.pending.get(key);
        if (!row) {
            // Orphan check (arrived before its request row) — stub a row to hold the
            // tally; handleRequest fills in the request fields when its Point arrives.
            row = {
                hasRequest: false, time: '', vu, iter: '', iterNum: 0,
                scenario: '', transaction: '', requestName: '', statusStr: '', status: 0,
                responsetime: '', tagsJson: '', checkPass: 0, checkFail: 0,
            };
            this.pending.set(key, row);
        }
        if (passed)
            row.checkPass += 1;
        else
            row.checkFail += 1;
    }
    maybeAdvanceIteration(vu, iterNum) {
        const cur = this.curIterByVu.get(vu);
        if (cur === undefined || iterNum > cur) {
            this.curIterByVu.set(vu, iterNum);
            // Flush this VU's rows from earlier iterations (their checks are complete).
            for (const [key, row] of this.pending) {
                if (row.vu === vu && row.hasRequest && row.iterNum < iterNum) {
                    this.emitRow(row);
                    this.pending.delete(key);
                }
            }
        }
    }
    flushAllPending() {
        for (const [key, row] of this.pending) {
            if (row.hasRequest)
                this.emitRow(row);
            this.pending.delete(key);
        }
    }
    emitRow(row) {
        // Checks-first: any failed check → error; all checks passed → not an error
        // (even for status >= 400). No checks at all → fall back to the HTTP status.
        const hasChecks = row.checkPass + row.checkFail > 0;
        const isError = hasChecks
            ? row.checkFail > 0
            : !(row.status >= 200 && row.status < 400);
        const runID = `RID_${this.ctx.hostName}_${row.vu || 'NA'}`;
        const line = [
            row.time,
            this.ctx.testId,
            runID,
            this.ctx.hostName,
            row.vu,
            row.iter,
            row.scenario,
            row.transaction,
            row.requestName,
            row.statusStr,
            String(isError),
            row.responsetime,
            row.tagsJson,
        ].map(csvField).join(',');
        this.outBuf += line + '\n';
        this.rows += 1;
    }
}
exports.RequestMetricLogWriter = RequestMetricLogWriter;
