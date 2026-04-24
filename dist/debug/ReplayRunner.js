"use strict";
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
exports.ReplayRunner = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
const PipelineRunner_1 = require("../execution/PipelineRunner");
const ScenarioBuilder_1 = require("../scenario/ScenarioBuilder");
const logger_1 = require("../utils/logger");
const ProgressBar_1 = require("../utils/ProgressBar");
const DiffChecker_1 = require("./DiffChecker");
const HTMLDiffReporter_1 = require("./HTMLDiffReporter");
class ReplayRunner {
    /**
     * Run a k6 script in debug mode, capture replay logs, compare them to the recording log,
     * and generate an HTML diff report automatically.
     */
    static async runDebug(options) {
        logger_1.Logger.detail(`Script  : ${options.scriptPath}`);
        logger_1.Logger.detail(`Recording: ${options.recordingLogPath ?? 'none (replay-only mode)'}`);
        const absScriptPath = path.resolve(options.scriptPath);
        const absRecordingLogPath = options.recordingLogPath
            ? path.resolve(options.recordingLogPath)
            : undefined;
        const absHtmlPath = path.resolve(options.outHtmlPath);
        const absReplayLogPath = path.resolve(options.replayLogPath ?? this.defaultReplayLogPath(absHtmlPath));
        let vus = options.vus ?? 1;
        const iterations = options.iterations ?? 1;
        if (vus > 1) {
            logger_1.Logger.warn(`[Debug Mode] VUs set to ${vus}, but debug mode only supports 1 VU. Overriding to 1.`);
            vus = 1;
        }
        if (!fs.existsSync(absScriptPath)) {
            throw new Error(`[ReplayRunner] Script not found: ${absScriptPath}`);
        }
        if (absRecordingLogPath && !fs.existsSync(absRecordingLogPath)) {
            logger_1.Logger.detail(`Recording log not found, replay-only mode`);
        }
        const execSpinner = (0, ProgressBar_1.createSpinner)('Executing k6 debug run');
        execSpinner.start();
        const runResult = PipelineRunner_1.PipelineRunner.execute({
            scriptPath: absScriptPath,
            k6Options: {
                noCookiesReset: options.noCookiesReset !== false,
                scenarios: {
                    debug_replay: {
                        executor: 'per-vu-iterations',
                        vus,
                        iterations,
                        env: {
                            K6_PERF_PHASES: JSON.stringify(ScenarioBuilder_1.ScenarioBuilder.computeDebugPhaseEnvelope({
                                executor: 'per-vu-iterations',
                                vus,
                                iterations,
                            })),
                        },
                    }
                }
            },
            env: { K6_PERF_DEBUG: 'true' },
            captureOutput: true,
        });
        execSpinner.done('k6 debug execution complete');
        const extractSpinner = (0, ProgressBar_1.createSpinner)('Extracting replay entries');
        extractSpinner.start();
        const replayEntries = await this.extractReplayEntries(runResult);
        this.writeJson(absReplayLogPath, replayEntries);
        extractSpinner.done(`Extracted ${replayEntries.length} replay entries`);
        // Extract k6 runtime errors and performance metrics for the HTML report
        const k6Errors = this.extractK6Errors(runResult);
        const k6Metrics = this.extractK6Metrics(runResult);
        if (replayEntries.length === 0) {
            if (runResult.status !== 0) {
                throw new Error(`[ReplayRunner] k6 debug execution failed before replay logs were captured. ` +
                    `Inspect the k6 error output above for the exact cause.`);
            }
            throw new Error(`[ReplayRunner] No replay-log entries were captured from script output. ` +
                `Make sure the script was generated by the framework or emits [k6-perf][replay-log] lines.`);
        }
        const reportSpinner = (0, ProgressBar_1.createSpinner)('Generating diff report');
        reportSpinner.start();
        const recordingEntries = absRecordingLogPath && fs.existsSync(absRecordingLogPath)
            ? this.readRecordingLog(absRecordingLogPath)
            : [];
        const missingRecordingWarning = recordingEntries.length === 0
            ? `[ReplayRunner] Recording log not found. Report shows replay data only for script ${absScriptPath}.`
            : undefined;
        const diffResults = DiffChecker_1.DiffChecker.compareTaggedLogs(recordingEntries, replayEntries, {
            missingRecordingWarning,
        });
        HTMLDiffReporter_1.HTMLDiffReporter.generateReport(diffResults, absHtmlPath, { k6Errors, k6Metrics });
        reportSpinner.done('Diff report generated');
        // Print k6 standard output (which contains the metrics summary) to the terminal
        const stdoutContent = runResult.stdoutPath && fs.existsSync(runResult.stdoutPath)
            ? fs.readFileSync(runResult.stdoutPath, 'utf8')
            : (runResult.stdout || '');
        if (stdoutContent) {
            console.log(`\n${stdoutContent.trim()}\n`);
        }
        PipelineRunner_1.PipelineRunner.ensureSuccess(runResult);
        return {
            htmlReportPath: absHtmlPath,
            replayLogPath: absReplayLogPath,
            results: diffResults,
            recordingLogPath: absRecordingLogPath,
        };
    }
    static async extractReplayEntries(runResult) {
        const entries = [];
        this.collectReplayEntriesFromText(runResult.stdout, entries);
        this.collectReplayEntriesFromText(runResult.stderr, entries);
        if (runResult.stdoutPath && fs.existsSync(runResult.stdoutPath)) {
            await this.collectReplayEntriesFromFile(runResult.stdoutPath, entries);
        }
        if (runResult.stderrPath && fs.existsSync(runResult.stderrPath)) {
            await this.collectReplayEntriesFromFile(runResult.stderrPath, entries);
        }
        return entries;
    }
    static async collectReplayEntriesFromFile(filePath, entries) {
        const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
        const reader = readline.createInterface({
            input: stream,
            crlfDelay: Infinity,
        });
        try {
            for await (const line of reader) {
                this.collectReplayEntryFromLine(line, entries);
            }
        }
        finally {
            reader.close();
            stream.close();
        }
    }
    static collectReplayEntriesFromText(output, entries) {
        if (!output)
            return;
        const lines = output.split(/\r?\n/);
        for (const line of lines) {
            this.collectReplayEntryFromLine(line, entries);
        }
    }
    static collectReplayEntryFromLine(line, entries) {
        const jsonPayload = this.extractReplayPayload(line);
        if (!jsonPayload)
            return;
        try {
            entries.push(this.parseReplayEntry(jsonPayload));
        }
        catch (error) {
            logger_1.Logger.warn(`[ReplayRunner] Failed to parse replay log line`, {
                error: error.message,
                preview: jsonPayload.slice(0, 500),
            });
        }
    }
    static extractReplayPayload(line) {
        const consoleMatch = line.match(/msg="((?:\\.|[^"])*)"\s+source=console/);
        if (consoleMatch) {
            let rawMessage;
            try {
                rawMessage = JSON.parse(`"${consoleMatch[1]}"`);
            }
            catch {
                rawMessage = consoleMatch[1].replace(/\\"/g, '"');
            }
            if (!rawMessage.includes(this.REPLAY_PREFIX)) {
                return null;
            }
            const prefixIndex = rawMessage.indexOf(this.REPLAY_PREFIX);
            return rawMessage.slice(prefixIndex + this.REPLAY_PREFIX.length).trim();
        }
        const prefixIndex = line.indexOf(this.REPLAY_PREFIX);
        if (prefixIndex === -1)
            return null;
        return line.slice(prefixIndex + this.REPLAY_PREFIX.length).trim();
    }
    static parseReplayEntry(jsonPayload) {
        return JSON.parse(jsonPayload);
    }
    static readRecordingLog(filePath) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            throw new Error(`[ReplayRunner] Recording log must be a JSON array: ${filePath}`);
        }
        return parsed.map((entry) => this.normalizeRecordingEntry(entry));
    }
    static normalizeRecordingEntry(entry) {
        const isBinaryUrl = this.STATIC_EXT_RE.test(entry.request?.url ?? '');
        return {
            ...entry,
            request: {
                ...entry.request,
                body: this.decodeBodyIfNeeded(entry.request.body),
            },
            response: {
                ...entry.response,
                body: isBinaryUrl ? '[binary: static asset]' : this.decodeBodyIfNeeded(entry.response.body),
            },
        };
    }
    static decodeBodyIfNeeded(value) {
        if (!value)
            return value;
        if (!this.looksLikeBase64(value))
            return value;
        try {
            const decoded = Buffer.from(value, 'base64').toString('utf-8');
            if (this.looksReadable(decoded)) {
                return decoded;
            }
        }
        catch {
            // keep original body if decode fails
        }
        return value;
    }
    static looksLikeBase64(value) {
        const compact = value.replace(/\s+/g, '');
        if (compact.length < 32 || compact.length % 4 !== 0)
            return false;
        return /^[A-Za-z0-9+/=]+$/.test(compact);
    }
    static looksReadable(value) {
        const trimmed = value.trim();
        return (trimmed.startsWith('<') ||
            trimmed.startsWith('{') ||
            trimmed.startsWith('[') ||
            /[\r\n\t ]/.test(value) ||
            /<!DOCTYPE html>/i.test(value));
    }
    static writeJson(filePath, data) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
    /**
     * Extract k6 runtime error messages from captured stdout/stderr.
     * k6 errors appear as `level=error msg="..."` or `ERRO[xxxx] ...` lines.
     */
    static extractK6Errors(runResult) {
        const errors = [];
        const seen = new Set();
        const processLine = (line) => {
            // k6 logfmt: level=error msg="GoError: ..." or level=error msg="..."
            const logfmtMatch = line.match(/level=error\s+msg="((?:\\.|[^"])*)"/);
            if (logfmtMatch) {
                let msg;
                try {
                    msg = JSON.parse(`"${logfmtMatch[1]}"`);
                }
                catch {
                    msg = logfmtMatch[1].replace(/\\"/g, '"');
                }
                if (!seen.has(msg)) {
                    seen.add(msg);
                    errors.push(msg);
                }
                return;
            }
            // k6 ERRO prefix: ERRO[0042] GoError: ...
            const erroMatch = line.match(/ERRO\[\d+\]\s+(.*)/);
            if (erroMatch) {
                const msg = erroMatch[1].trim();
                if (!seen.has(msg)) {
                    seen.add(msg);
                    errors.push(msg);
                }
            }
        };
        const processText = (text) => {
            if (!text)
                return;
            text.split(/\r?\n/).forEach(processLine);
        };
        processText(runResult.stdout);
        processText(runResult.stderr);
        // Also read from file paths if they exist
        if (runResult.stdoutPath && fs.existsSync(runResult.stdoutPath)) {
            processText(fs.readFileSync(runResult.stdoutPath, 'utf-8'));
        }
        if (runResult.stderrPath && fs.existsSync(runResult.stderrPath)) {
            processText(fs.readFileSync(runResult.stderrPath, 'utf-8'));
        }
        return errors;
    }
    /**
     * Parse k6 performance metrics from the TOTAL RESULTS section of stdout.
     */
    static extractK6Metrics(runResult) {
        let text = '';
        if (runResult.stdoutPath && fs.existsSync(runResult.stdoutPath)) {
            text = fs.readFileSync(runResult.stdoutPath, 'utf-8');
        }
        else if (runResult.stdout) {
            text = runResult.stdout;
        }
        const metrics = {
            checks: [],
            transactions: [],
            http: [],
            httpSummary: { reqs: '', failedPct: '' },
            execution: { duration: '', iterations: '', vus: '' },
            network: { received: '', sent: '' },
        };
        const lines = text.split(/\r?\n/);
        // Parse check results: ✓ or ✗ lines
        for (const line of lines) {
            const checkMatch = line.match(/^\s+(✓|✗)\s+(.+)$/);
            if (checkMatch) {
                metrics.checks.push({ name: checkMatch[2].trim(), passed: checkMatch[1] === '✓' });
            }
        }
        // Parse metric lines with avg/min/med/max/p(90)/p(95)
        const metricRe = /^\s{4}(\S+?)\.{2,}:\s+avg=(\S+)\s+min=(\S+)\s+med=(\S+)\s+max=(\S+)\s+p\(90\)=(\S+)\s+p\(95\)=(\S+)/;
        const subMetricRe = /^\s+\{[^}]+\}\.{2,}:\s+avg=(\S+)\s+min=(\S+)\s+med=(\S+)\s+max=(\S+)\s+p\(90\)=(\S+)\s+p\(95\)=(\S+)/;
        let section = '';
        for (const line of lines) {
            if (/^\s{4}CUSTOM\s*$/.test(line)) {
                section = 'custom';
                continue;
            }
            if (/^\s{4}HTTP\s*$/.test(line)) {
                section = 'http';
                continue;
            }
            if (/^\s{4}EXECUTION\s*$/.test(line)) {
                section = 'execution';
                continue;
            }
            if (/^\s{4}NETWORK\s*$/.test(line)) {
                section = 'network';
                continue;
            }
            const m = metricRe.exec(line);
            if (m) {
                const entry = { name: m[1], avg: m[2], min: m[3], med: m[4], max: m[5], p90: m[6], p95: m[7] };
                if (section === 'custom') {
                    metrics.transactions.push(entry);
                }
                else if (section === 'http' || m[1].startsWith('http_req_duration')) {
                    metrics.http.push(entry);
                }
                else if (m[1] === 'iteration_duration') {
                    metrics.execution.duration = `avg=${m[2]} min=${m[3]} max=${m[5]}`;
                }
                continue;
            }
            // Sub-metrics for http (e.g., { expected_response:true })
            if (section === 'http') {
                const sm = subMetricRe.exec(line);
                if (sm) {
                    const label = line.match(/\{([^}]+)\}/)?.[1]?.trim() ?? 'filtered';
                    metrics.http.push({ name: `http_req_duration {${label}}`, avg: sm[1], min: sm[2], med: sm[3], max: sm[4], p90: sm[5], p95: sm[6] });
                }
            }
            // Simple value lines
            const simpleRe = /^\s{4}(\S+?)\.{2,}:\s+(.+)$/;
            const sv = simpleRe.exec(line);
            if (sv) {
                if (sv[1] === 'http_req_failed') {
                    metrics.httpSummary.failedPct = sv[2].split(/\s+/)[0];
                }
                else if (sv[1] === 'http_reqs') {
                    metrics.httpSummary.reqs = sv[2].split(/\s+/)[0];
                }
                else if (sv[1] === 'iterations') {
                    metrics.execution.iterations = sv[2].split(/\s+/)[0];
                }
                else if (sv[1] === 'vus') {
                    metrics.execution.vus = sv[2].split(/\s+/)[0];
                }
                else if (sv[1] === 'data_received') {
                    metrics.network.received = sv[2].split(/\s+/).slice(0, 2).join(' ');
                }
                else if (sv[1] === 'data_sent') {
                    metrics.network.sent = sv[2].split(/\s+/).slice(0, 2).join(' ');
                }
            }
        }
        return metrics;
    }
    static defaultReplayLogPath(htmlPath) {
        const parsed = path.parse(htmlPath);
        return path.join(parsed.dir, `${parsed.name}.replay-log.json`);
    }
}
exports.ReplayRunner = ReplayRunner;
ReplayRunner.REPLAY_PREFIX = '[k6-perf][replay-log] ';
ReplayRunner.STATIC_EXT_RE = /\.(?:png|jpe?g|gif|svg|ico|webp|avif|bmp|tiff?|woff2?|ttf|otf|eot|mp[34]|webm|ogg|flac|wav|zip|gz|br|pdf)(?:[?#]|$)/i;
//# sourceMappingURL=ReplayRunner.js.map