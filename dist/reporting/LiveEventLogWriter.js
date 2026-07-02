"use strict";
/**
 * LiveEventLogWriter.ts
 *
 * Writes errors.ndjson / warnings.ndjson LIVE as the run progresses, instead of
 * only at the end. The k6 side emits each structured event as a
 * `[k6-perf][error-event] {json}` / `[k6-perf][warning-event] {json}` console
 * line; LiveConsoleLogStream already tails the run log and hands every
 * (dequoted) message to its onMessage tap, so we piggyback on that — no second
 * file tailer, no duplicated log-format parsing.
 *
 * These files are the same ones finalizeRunArtifacts writes at the end: the live
 * pass captures the per-occurrence k6-side events (check_failed, http_error,
 * transaction_error, snapshot_cap_reached, …) as they happen; the final pass
 * OVERWRITES with the complete merged set (adding run-level derivations only
 * known post-run: threshold breaches, execution_failed, host-monitor warnings).
 * A hard k6 crash before finalize therefore still leaves the live-captured
 * events on disk instead of an empty file.
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
exports.LiveEventLogWriter = void 0;
const fs = __importStar(require("fs"));
const ERROR_EVENT_PREFIX = '[k6-perf][error-event] ';
const WARNING_EVENT_PREFIX = '[k6-perf][warning-event] ';
class LiveEventLogWriter {
    constructor(errorsPath, warningsPath) {
        this.errorsPath = errorsPath;
        this.warningsPath = warningsPath;
        this.errorRows = 0;
        this.warningRows = 0;
    }
    /** Truncate both files so they fill fresh as events arrive this run. */
    start() {
        fs.writeFileSync(this.errorsPath, '', 'utf-8');
        fs.writeFileSync(this.warningsPath, '', 'utf-8');
    }
    /**
     * Feed one already-dequoted console message. Appends a line to the matching
     * ndjson file when the message is a framework error/warning event; ignores
     * everything else. Safe to call for every console line.
     */
    consume(msg) {
        if (!msg)
            return;
        if (msg.startsWith(ERROR_EVENT_PREFIX)) {
            this.append(this.errorsPath, msg.slice(ERROR_EVENT_PREFIX.length).trim(), 'error');
        }
        else if (msg.startsWith(WARNING_EVENT_PREFIX)) {
            this.append(this.warningsPath, msg.slice(WARNING_EVENT_PREFIX.length).trim(), 'warning');
        }
    }
    get errorCount() { return this.errorRows; }
    get warningCount() { return this.warningRows; }
    append(file, payload, kind) {
        if (!payload)
            return;
        // Validate + normalize so each line is exactly one JSON object (matches the
        // final writeNdjson format); skip anything that isn't parseable JSON.
        let line;
        try {
            line = JSON.stringify(JSON.parse(payload));
        }
        catch {
            return;
        }
        try {
            fs.appendFileSync(file, line + '\n', 'utf-8');
            if (kind === 'error')
                this.errorRows += 1;
            else
                this.warningRows += 1;
        }
        catch {
            /* file momentarily busy — a later event or the final overwrite still captures it */
        }
    }
}
exports.LiveEventLogWriter = LiveEventLogWriter;
