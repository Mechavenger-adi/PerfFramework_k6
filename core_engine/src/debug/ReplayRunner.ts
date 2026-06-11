import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { PipelineRunner } from '../execution/PipelineRunner';
import { ScenarioBuilder } from '../scenario/ScenarioBuilder';
import { Logger } from '../utils/logger';
import { startLiveConsoleLogStream } from '../utils/LiveConsoleLogStream';
import { createSpinner } from '../utils/ProgressBar';
import { DiffChecker, DiffResult } from './DiffChecker';
import { TaggedExchangeLogEntry } from './ExchangeLog';
import { HTMLDiffReporter } from './HTMLDiffReporter';

/** Extract transaction names declared in a script source via transaction() or startTransaction(). */
function extractTransactionNames(source: string): string[] {
  const matches = new Set<string>();
  const patterns = [
    /transaction\(\s*(['"`])([^'"`]+)\1\s*,/g,
    /startTransaction\(\s*(['"`])([^'"`]+)\1\s*\)/g,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) {
      const name = match[2]?.trim();
      if (name) matches.add(name);
    }
  }
  return [...matches];
}

export interface DebugReplayOptions {
  scriptPath: string;
  recordingLogPath?: string;
  outHtmlPath: string;
  replayLogPath?: string;
  vus?: number;
  iterations?: number;
  noCookiesReset?: boolean;
  /** Team environment configs (testSuites from the loaded environment file). */
  teamEnvironments?: Record<string, unknown>;
  /** Error behavior for the debug run (continue | stop_iteration | stop_vu | abort_test). Defaults to 'continue'. */
  errorBehavior?: string;
  /** Extra CLI flags forwarded verbatim to k6 (e.g. ['--http-debug=full', '--verbose']). */
  extraK6Args?: string[];
  /**
   * Stat columns from runtime `reporting.transactionStats`. The debug report's
   * default columns (min/avg/max/p90/p95) are always shown; any extra stats
   * here are appended. Omitted for the standalone `debug` command, which has no
   * resolved runtime config.
   */
  transactionStats?: string[];
}

export interface DebugReplayResult {
  htmlReportPath: string;
  replayLogPath: string;
  results: DiffResult[];
  recordingLogPath?: string;
}

/** One metric row with stat values keyed by stat id (e.g. 'avg', 'p(90)'). */
export interface K6MetricRow {
  name: string;
  values: Record<string, string>;
}

export interface K6Metrics {
  checks: { name: string; passed: boolean }[];
  transactions: K6MetricRow[];
  http: K6MetricRow[];
  httpSummary: { reqs: string; failedPct: string };
  execution: { duration: string; iterations: string; vus: string };
  network: { received: string; sent: string };
  /** Ordered stat-column ids the report should render for transaction/http tables. */
  statsColumns: string[];
}

export class ReplayRunner {
  private static readonly REPLAY_PREFIX = '[k6-perf][replay-log] ';

  /**
   * Run a k6 script in debug mode, capture replay logs, compare them to the recording log,
   * and generate an HTML diff report automatically.
   */
  static async runDebug(options: DebugReplayOptions): Promise<DebugReplayResult> {
    Logger.detail(`Script  : ${options.scriptPath}`);
    Logger.detail(`Recording: ${options.recordingLogPath ?? 'none (replay-only mode)'}`);

    const absScriptPath = path.resolve(options.scriptPath);
    const absRecordingLogPath = options.recordingLogPath
      ? path.resolve(options.recordingLogPath)
      : undefined;
    const absHtmlPath = path.resolve(options.outHtmlPath);
    const absReplayLogPath = path.resolve(
      options.replayLogPath ?? this.defaultReplayLogPath(absHtmlPath),
    );
    let vus = options.vus ?? 1;
    const iterations = options.iterations ?? 1;

    if (vus > 1) {
      Logger.warn(`[Debug Mode] VUs set to ${vus}, but debug mode only supports 1 VU. Overriding to 1.`);
      vus = 1;
    }

    if (!fs.existsSync(absScriptPath)) {
      throw new Error(`[ReplayRunner] Script not found: ${absScriptPath}`);
    }
    if (absRecordingLogPath && !fs.existsSync(absRecordingLogPath)) {
      Logger.detail(`Recording log not found, replay-only mode`);
    }

    // Scan script for transaction names so metrics are pre-registered in init context.
    const scriptSource = fs.readFileSync(absScriptPath, 'utf-8');
    const transactionNames = extractTransactionNames(scriptSource);

    // Set up a log-capture file so replay entries and user console.log can be
    // extracted after the run, while stderr stays inherited (TTY → progress bar).
    const tempDir = path.join(process.cwd(), '.k6-temp');
    fs.mkdirSync(tempDir, { recursive: true });
    const scriptName = path.basename(absScriptPath, path.extname(absScriptPath));
    const stamp = new Date().toISOString().slice(0, 19).replace(/[-:.]/g, '_');
    const logOutputPath = path.join(tempDir, `${scriptName}_debug_${stamp}.log`);

    const outputDir = path.dirname(absHtmlPath);
    fs.mkdirSync(outputDir, { recursive: true });

    // k6 writes its end-of-test summary as JSON here. We parse this file (not
    // k6's stdout) for the diff report's Performance Metrics — that keeps
    // stdout fully inherited so k6's animated, in-place progress bar renders
    // instead of degrading to one fresh progress line per second (which is
    // what happens whenever stdout is piped and k6 sees a non-TTY).
    const summaryExportPath = path.join(tempDir, `${scriptName}_summary_${stamp}.json`);
    const summaryExportFwd = summaryExportPath.replace(/\\/g, '/');

    // k6's summary-export carries avg/min/med/max/p(N)/count but NOT std. So we
    // also stream the raw per-point JSON here and compute std the same way the
    // live console table does (Welford). Temp file, cleaned up after parsing.
    const metricsStreamPath = path.join(tempDir, `${scriptName}_stream_${stamp}.json`);
    const metricsStreamFwd = metricsStreamPath.replace(/\\/g, '/');

    // Resolve the stat columns the report renders and the trend stats k6 must
    // compute so the summary JSON actually contains them.
    const statsColumns = this.resolveDebugStats(options.transactionStats);
    const summaryTrendStats = this.buildTrendStats(statsColumns);

    // `--out web-dashboard` serves k6's live dashboard on http://127.0.0.1:5665
    // while the run is in progress. No `export=` sub-option — we deliberately
    // don't persist the dashboard HTML to the output folder.
    const debugK6Args = [
      '--out', 'web-dashboard',
      '--out', `json=${metricsStreamFwd}`,
      '--summary-export', summaryExportFwd,
      ...(options.extraK6Args ?? []),
    ];

    Logger.info(`\nRunning k6 debug execution for: ${scriptName}\n`);
    Logger.detail(`Output directory: ${outputDir}`);
    Logger.detail('Live k6 web dashboard: http://127.0.0.1:5665 (served while k6 runs)');
    // Live tailer pretty-prints script console.log/warn/error and k6 framework
    // errors in real time while k6 is running. Replaces the previous post-run
    // recap so output appears LIVE instead of dumping at the end of the run.
    const liveConsole = startLiveConsoleLogStream(logOutputPath);
    let runResult;
    try {
      runResult = await PipelineRunner.executeAsync({
        scriptPath: absScriptPath,
        k6Options: {
          noCookiesReset: options.noCookiesReset !== false,
          summaryTrendStats,
          scenarios: {
            debug_replay: {
              executor: 'per-vu-iterations',
              vus,
              iterations,
              env: {
                K6_PERF_PHASES: JSON.stringify(
                  ScenarioBuilder.computeDebugPhaseEnvelope({
                    executor: 'per-vu-iterations',
                    vus,
                    iterations,
                  }),
                ),
              },
            }
          }
        },
        env: {
          K6_PERF_DEBUG: 'true',
          ...(transactionNames.length > 0
            ? { K6_PERF_TRANSACTION_NAMES: JSON.stringify(transactionNames) }
            : {}),
          ...(options.teamEnvironments
            ? { K6_PERF_TEAM_ENVIRONMENTS: JSON.stringify(options.teamEnvironments) }
            : {}),
          K6_PERF_RUNTIME_METADATA: JSON.stringify({
            errorBehavior: options.errorBehavior ?? 'continue',
            pacing: { enabled: false },
          }),
        },
        // stdout/stderr both inherited (default) so k6's animated progress bar
        // renders in place. The summary is read from `summaryExportPath`, not
        // captured here.
        extraK6Args: debugK6Args,
        logOutputPath,
      });
    } finally {
      liveConsole.stop();
    }
    Logger.info(`\nk6 execution complete.\n`);

    const extractSpinner = createSpinner('Extracting replay entries');
    extractSpinner.start();
    const replayEntries = await this.extractReplayEntries(runResult, logOutputPath);
    this.writeJson(absReplayLogPath, replayEntries);
    extractSpinner.done(`Extracted ${replayEntries.length} replay entries`);

    // Extract k6 runtime errors, performance metrics, and console.log lines
    const k6Errors = this.extractK6Errors(runResult);
    const k6Metrics = this.extractK6Metrics(summaryExportPath, transactionNames, statsColumns);
    // std isn't in k6's summary export — compute it from the raw point stream
    // (same approach as the live console table) and fill the std column.
    if (statsColumns.includes('std')) {
      await this.fillStdDevs(k6Metrics, metricsStreamPath);
    }
    const consoleLogs = this.extractConsoleLogs(runResult);

    if (replayEntries.length === 0) {
      if (runResult.status !== 0) {
        throw new Error(
          `[ReplayRunner] k6 debug execution failed before replay logs were captured. ` +
          `Inspect the k6 error output above for the exact cause.`,
        );
      }
      throw new Error(
        `[ReplayRunner] No replay-log entries were captured from script output. ` +
        `Make sure the script was generated by the framework or emits [k6-perf][replay-log] lines.`,
      );
    }

    const reportSpinner = createSpinner('Generating diff report');
    reportSpinner.start();
    const recordingEntries = absRecordingLogPath && fs.existsSync(absRecordingLogPath)
      ? this.readRecordingLog(absRecordingLogPath)
      : [];
    const missingRecordingWarning =
      recordingEntries.length === 0
        ? `[ReplayRunner] Recording log not found. Report shows replay data only for script ${absScriptPath}.`
        : undefined;
    const diffResults = DiffChecker.compareTaggedLogs(recordingEntries, replayEntries, {
      missingRecordingWarning,
    });
    HTMLDiffReporter.generateReport(diffResults, absHtmlPath, { k6Errors, k6Metrics, consoleLogs });
    reportSpinner.done('Diff report generated');

    // (Script console output is now printed LIVE during the run via the
    // `liveConsole` tailer started before k6 launch. No post-run recap is
    // needed here — `consoleLogs` is still populated for embedding in the
    // HTML diff report, but the terminal already showed them in real time.)


    // Clean up the temp log + summary-export files now that all parsing is done
    if (logOutputPath && fs.existsSync(logOutputPath)) {
      try { fs.rmSync(logOutputPath); } catch { /* ignore */ }
    }
    if (fs.existsSync(summaryExportPath)) {
      try { fs.rmSync(summaryExportPath); } catch { /* ignore */ }
    }
    if (fs.existsSync(metricsStreamPath)) {
      try { fs.rmSync(metricsStreamPath); } catch { /* ignore */ }
    }

    PipelineRunner.ensureSuccess(runResult);

    return {
      htmlReportPath: absHtmlPath,
      replayLogPath: absReplayLogPath,
      results: diffResults,
      recordingLogPath: absRecordingLogPath,
    };
  }

  /** Stats the debug timing tables always show, regardless of runtime config. */
  private static readonly DEBUG_DEFAULT_STATS = ['min', 'avg', 'max', 'p(90)', 'p(95)'];

  /** Normalize a stat id, collapsing pN / p(N) percentile notation to `p(N)`. */
  private static normalizeStat(s: string): string {
    const m = s.trim().toLowerCase().match(/^p\(?(\d+(?:\.\d+)?)\)?$/);
    return m ? `p(${m[1]})` : s.trim();
  }

  /**
   * Resolve the ordered stat columns for the debug report: the fixed defaults
   * (min/avg/max/p90/p95) plus any extra stats the user configured in runtime
   * `reporting.transactionStats`, in config order, de-duplicated.
   */
  private static resolveDebugStats(configured?: string[]): string[] {
    const out = [...this.DEBUG_DEFAULT_STATS];
    for (const raw of configured ?? []) {
      const stat = this.normalizeStat(raw);
      if (stat && !out.includes(stat)) out.push(stat);
    }
    return out;
  }

  /**
   * Build the `summaryTrendStats` array k6 needs so the summary-export JSON
   * actually contains every stat we plan to render. Only k6-computable trend
   * stats are forwarded (avg/min/med/max/count and p(N)); pass/fail/std are
   * derived elsewhere or unavailable. The k6 defaults are always included.
   */
  private static buildTrendStats(statsColumns: string[]): string[] {
    const valid = new Set(['avg', 'min', 'med', 'max', 'p(90)', 'p(95)']);
    for (const s of statsColumns) {
      if (['avg', 'min', 'med', 'max', 'count'].includes(s) || /^p\(\d+(?:\.\d+)?\)$/.test(s)) {
        valid.add(s);
      }
    }
    return [...valid];
  }

  private static async extractReplayEntries(
    runResult: { stdout?: string; stderr?: string; stdoutPath?: string; stderrPath?: string },
    logFilePath?: string,
  ): Promise<TaggedExchangeLogEntry[]> {
    const entries: TaggedExchangeLogEntry[] = [];
    this.collectReplayEntriesFromText(runResult.stdout, entries);
    this.collectReplayEntriesFromText(runResult.stderr, entries);

    // Deduplicate file paths before reading. `PipelineRunner.executeAsync`
    // sets `runResult.stderrPath = logOutputPath`, so the same physical file
    // would otherwise be read twice — that bug doubled every replay entry,
    // doubled every console-log line, and inflated the diff report's request
    // count vs the actual k6 traffic.
    const filePaths = new Set<string>();
    if (runResult.stdoutPath && fs.existsSync(runResult.stdoutPath)) {
      filePaths.add(path.resolve(runResult.stdoutPath));
    }
    if (runResult.stderrPath && fs.existsSync(runResult.stderrPath)) {
      filePaths.add(path.resolve(runResult.stderrPath));
    }
    if (logFilePath && fs.existsSync(logFilePath)) {
      filePaths.add(path.resolve(logFilePath));
    }

    for (const p of filePaths) {
      await this.collectReplayEntriesFromFile(p, entries);
    }

    return entries;
  }

  private static async collectReplayEntriesFromFile(filePath: string, entries: TaggedExchangeLogEntry[]): Promise<void> {
    const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const reader = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    try {
      for await (const line of reader) {
        this.collectReplayEntryFromLine(line, entries);
      }
    } finally {
      reader.close();
      stream.close();
    }
  }

  private static collectReplayEntriesFromText(output: string | undefined, entries: TaggedExchangeLogEntry[]): void {
    if (!output) return;

    const lines = output.split(/\r?\n/);
    for (const line of lines) {
      this.collectReplayEntryFromLine(line, entries);
    }
  }

  private static collectReplayEntryFromLine(line: string, entries: TaggedExchangeLogEntry[]): void {
    const jsonPayload = this.extractReplayPayload(line);
    if (!jsonPayload) return;

    try {
      entries.push(this.parseReplayEntry(jsonPayload));
    } catch (error) {
      Logger.warn(`[ReplayRunner] Failed to parse replay log line`, {
        error: (error as Error).message,
        preview: jsonPayload.slice(0, 500),
      });
    }
  }

  private static extractReplayPayload(line: string): string | null {
    const consoleMatch = line.match(/msg="((?:\\.|[^"])*)"\s+source=console/);
    if (consoleMatch) {
      let rawMessage: string;
      try {
        rawMessage = JSON.parse(`"${consoleMatch[1]}"`) as string;
      } catch {
        rawMessage = consoleMatch[1].replace(/\\"/g, '"');
      }

      if (!rawMessage.includes(this.REPLAY_PREFIX)) {
        return null;
      }

      const prefixIndex = rawMessage.indexOf(this.REPLAY_PREFIX);
      return rawMessage.slice(prefixIndex + this.REPLAY_PREFIX.length).trim();
    }

    const prefixIndex = line.indexOf(this.REPLAY_PREFIX);
    if (prefixIndex === -1) return null;

    return line.slice(prefixIndex + this.REPLAY_PREFIX.length).trim();
  }

  private static parseReplayEntry(jsonPayload: string): TaggedExchangeLogEntry {
    return JSON.parse(jsonPayload) as TaggedExchangeLogEntry;
  }

  private static readRecordingLog(filePath: string): TaggedExchangeLogEntry[] {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`[ReplayRunner] Recording log must be a JSON array: ${filePath}`);
    }
    return (parsed as TaggedExchangeLogEntry[]).map((entry) => this.normalizeRecordingEntry(entry));
  }

  private static readonly STATIC_EXT_RE = /\.(?:png|jpe?g|gif|svg|ico|webp|avif|bmp|tiff?|woff2?|ttf|otf|eot|mp[34]|webm|ogg|flac|wav|zip|gz|br|pdf)(?:[?#]|$)/i;

  private static normalizeRecordingEntry(entry: TaggedExchangeLogEntry): TaggedExchangeLogEntry {
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

  private static decodeBodyIfNeeded(value?: string): string | undefined {
    if (!value) return value;
    if (!this.looksLikeBase64(value)) return value;

    try {
      const decoded = Buffer.from(value, 'base64').toString('utf-8');
      if (this.looksReadable(decoded)) {
        return decoded;
      }
    } catch {
      // keep original body if decode fails
    }

    return value;
  }

  private static looksLikeBase64(value: string): boolean {
    const compact = value.replace(/\s+/g, '');
    if (compact.length < 32 || compact.length % 4 !== 0) return false;
    return /^[A-Za-z0-9+/=]+$/.test(compact);
  }

  private static looksReadable(value: string): boolean {
    const trimmed = value.trim();
    return (
      trimmed.startsWith('<') ||
      trimmed.startsWith('{') ||
      trimmed.startsWith('[') ||
      /[\r\n\t ]/.test(value) ||
      /<!DOCTYPE html>/i.test(value)
    );
  }

  private static writeJson(filePath: string, data: unknown): void {
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
  private static extractK6Errors(runResult: { stdout?: string; stderr?: string; stdoutPath?: string; stderrPath?: string }): string[] {
    const errors: string[] = [];
    const seen = new Set<string>();

    const processLine = (line: string) => {
      // k6 logfmt: level=error msg="GoError: ..." or level=error msg="..."
      const logfmtMatch = line.match(/level=error\s+msg="((?:\\.|[^"])*)"/);
      if (logfmtMatch) {
        let msg: string;
        try {
          msg = JSON.parse(`"${logfmtMatch[1]}"`) as string;
        } catch {
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

    const processText = (text?: string) => {
      if (!text) return;
      text.split(/\r?\n/).forEach(processLine);
    };

    processText(runResult.stdout);
    processText(runResult.stderr);

    // Deduplicate file reads. `stderrPath` is set to the same value as
    // `logOutputPath` by `PipelineRunner.executeAsync`, so reading both keys
    // produced duplicated error entries previously.
    const errorFilePaths = new Set<string>();
    if (runResult.stdoutPath && fs.existsSync(runResult.stdoutPath)) {
      errorFilePaths.add(path.resolve(runResult.stdoutPath));
    }
    if (runResult.stderrPath && fs.existsSync(runResult.stderrPath)) {
      errorFilePaths.add(path.resolve(runResult.stderrPath));
    }
    for (const p of errorFilePaths) {
      processText(fs.readFileSync(p, 'utf-8'));
    }

    return errors;
  }

  /**
   * Build the diff report's performance-metrics view from k6's `--summary-export`
   * JSON file. We read this file rather than scraping k6's stdout so stdout can
   * stay fully inherited — that's what lets k6 render its animated, in-place
   * progress bar instead of printing one fresh progress line per second.
   *
   * `transactionNames` are the custom transaction metrics declared in the
   * script (via `transaction()` / `startTransaction()`); they let us pick the
   * per-transaction timing Trends out of the otherwise-flat metrics map.
   */
  private static extractK6Metrics(
    summaryExportPath: string,
    transactionNames: string[] = [],
    statsColumns: string[] = this.DEBUG_DEFAULT_STATS,
  ): K6Metrics {
    const metrics: K6Metrics = {
      checks: [],
      transactions: [],
      http: [],
      httpSummary: { reqs: '', failedPct: '' },
      execution: { duration: '', iterations: '', vus: '' },
      network: { received: '', sent: '' },
      statsColumns,
    };

    if (!fs.existsSync(summaryExportPath)) return metrics;

    type MetricVal = {
      avg?: number; min?: number; med?: number; max?: number;
      count?: number; rate?: number; value?: number; passes?: number; fails?: number;
      [stat: string]: number | undefined; // p(N) percentiles
    };
    type Group = {
      checks?: Record<string, { passes?: number; fails?: number }>;
      groups?: Record<string, Group>;
    };

    let parsed: { metrics?: Record<string, MetricVal>; root_group?: Group };
    try {
      parsed = JSON.parse(fs.readFileSync(summaryExportPath, 'utf-8')) as typeof parsed;
    } catch {
      return metrics;
    }

    const m = parsed.metrics ?? {};

    // Checks live under root_group and recurse through nested groups (the
    // framework wraps each transaction's checks in a k6 group).
    const collectChecks = (group?: Group): void => {
      if (!group) return;
      for (const [name, c] of Object.entries(group.checks ?? {})) {
        metrics.checks.push({ name, passed: (c.fails ?? 0) === 0 });
      }
      for (const g of Object.values(group.groups ?? {})) collectChecks(g);
    };
    collectChecks(parsed.root_group);

    const isTrend = (v: MetricVal): boolean => typeof v.avg === 'number';

    // Resolve a single stat id to a display string for a given trend metric.
    // `rate` (the `<name>_checkrate` Rate) supplies pass/fail for transactions.
    const statValue = (stat: string, v: MetricVal, rate?: MetricVal): string => {
      switch (stat) {
        case 'avg': return this.fmtDuration(v.avg);
        case 'min': return this.fmtDuration(v.min);
        case 'med': return this.fmtDuration(v.med);
        case 'max': return this.fmtDuration(v.max);
        case 'count': return typeof v.count === 'number' ? String(Math.round(v.count)) : '-';
        case 'pass': return rate && typeof rate.passes === 'number' ? String(rate.passes) : '-';
        case 'fail': return rate && typeof rate.fails === 'number' ? String(rate.fails) : '-';
        case 'std': return '-'; // not derivable from summary-export aggregates
        default: {
          const mp = stat.match(/^p\((\d+(?:\.\d+)?)\)$/);
          return mp ? this.fmtDuration(v[`p(${mp[1]})`]) : '-';
        }
      }
    };

    const buildValues = (v: MetricVal, rate?: MetricVal): Record<string, string> => {
      const out: Record<string, string> = {};
      for (const stat of statsColumns) out[stat] = statValue(stat, v, rate);
      return out;
    };

    // Transaction timing Trends, in declaration order.
    for (const name of transactionNames) {
      const v = m[name];
      if (!v || !isTrend(v)) continue;
      metrics.transactions.push({ name, values: buildValues(v, m[`${name}_checkrate`]) });
    }

    // HTTP timing Trends (http_req_*) and execution iteration_duration.
    for (const [name, v] of Object.entries(m)) {
      if (name.startsWith('http_req') && isTrend(v)) {
        metrics.http.push({ name, values: buildValues(v) });
      } else if (name === 'iteration_duration' && isTrend(v)) {
        metrics.execution.duration = `avg=${this.fmtDuration(v.avg)} min=${this.fmtDuration(v.min)} max=${this.fmtDuration(v.max)}`;
      }
    }

    if (typeof m.http_reqs?.count === 'number') metrics.httpSummary.reqs = String(m.http_reqs.count);
    if (typeof m.http_req_failed?.value === 'number') metrics.httpSummary.failedPct = `${(m.http_req_failed.value * 100).toFixed(2)}%`;
    if (typeof m.iterations?.count === 'number') metrics.execution.iterations = String(m.iterations.count);
    if (typeof m.vus?.value === 'number') metrics.execution.vus = String(m.vus.value);
    else if (typeof m.vus_max?.value === 'number') metrics.execution.vus = String(m.vus_max.value);
    if (typeof m.data_received?.count === 'number') metrics.network.received = this.fmtBytes(m.data_received.count);
    if (typeof m.data_sent?.count === 'number') metrics.network.sent = this.fmtBytes(m.data_sent.count);

    return metrics;
  }

  /**
   * Compute population std-dev (ms) per metric from the raw k6 `--out json`
   * point stream — k6's summary export doesn't include std. Uses Welford's
   * online algorithm (O(1) memory per metric), matching the live console
   * table's `sqrt(M2/n)`. Fills the 'std' column on each transaction/http row;
   * leaves '-' when a metric had no points. Best-effort — never throws.
   */
  private static async fillStdDevs(metrics: K6Metrics, streamPath: string): Promise<void> {
    if (!fs.existsSync(streamPath) || fs.statSync(streamPath).size === 0) return;
    const acc = new Map<string, { n: number; mean: number; m2: number }>();
    try {
      const stream = fs.createReadStream(streamPath, { encoding: 'utf-8' });
      const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
      try {
        for await (const line of rl) {
          if (line.indexOf('"type":"Point"') === -1) continue;
          let p: { metric?: string; data?: { value?: number } };
          try { p = JSON.parse(line) as typeof p; } catch { continue; }
          const metric = p.metric;
          const value = p.data?.value;
          if (!metric || typeof value !== 'number') continue;
          let a = acc.get(metric);
          if (!a) { a = { n: 0, mean: 0, m2: 0 }; acc.set(metric, a); }
          a.n += 1;
          const delta = value - a.mean;
          a.mean += delta / a.n;
          a.m2 += delta * (value - a.mean);
        }
      } finally {
        rl.close();
        stream.close();
      }
    } catch { return; }

    const stdFor = (name: string): string => {
      // Sub-metrics like `http_req_duration{expected_response:true}` aren't
      // separate stream metrics — fall back to the base metric's std.
      const base = name.replace(/\{.*\}$/, '');
      const a = acc.get(name) ?? acc.get(base);
      return a && a.n > 0 ? this.fmtDuration(Math.sqrt(a.m2 / a.n)) : '-';
    };
    for (const r of metrics.transactions) r.values['std'] = stdFor(r.name);
    for (const r of metrics.http) r.values['std'] = stdFor(r.name);
  }

  /** Format a millisecond duration the way k6's text summary does (ms vs s). */
  private static fmtDuration(ms?: number): string {
    if (typeof ms !== 'number' || Number.isNaN(ms)) return '-';
    return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(2)}ms`;
  }

  /** Format a byte count into a compact string (B / kB / MB). */
  private static fmtBytes(n?: number): string {
    if (typeof n !== 'number' || Number.isNaN(n)) return '-';
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)} kB`;
    return `${n} B`;
  }

  private static defaultReplayLogPath(htmlPath: string): string {
    const parsed = path.parse(htmlPath);
    return path.join(parsed.dir, `${parsed.name}.replay-log.json`);
  }

  /**
   * Extract user console.log / console.info / console.warn messages from k6 output.
   * k6 emits these as logfmt lines: level=info msg="..." source=console
   * Excludes internal framework prefixes like [k6-perf] and [replay-log].
   */
  private static extractConsoleLogs(runResult: { stdout?: string; stderr?: string; stdoutPath?: string; stderrPath?: string }): string[] {
    const logs: string[] = [];

    const processLine = (line: string) => {
      // Include `error` so console.error() lines surface in the debug summary.
      // Previously this regex was `(info|warn|debug)` which silently dropped
      // every error-level log — exactly the lines a user debugging a failed
      // run needs to see.
      const consoleMatch = line.match(/level=(info|warn|debug|error)\s+msg="((?:\\.|[^"])*)"\s+source=console/);
      if (!consoleMatch) return;

      let msg: string;
      try {
        msg = JSON.parse(`"${consoleMatch[2]}"`) as string;
      } catch {
        msg = consoleMatch[2].replace(/\\"/g, '"');
      }

      // Skip only the framework's internal IPC channels — replay-log entries
      // and snapshot-event payloads are parsed elsewhere and are noise here.
      // We DO surface `[k6-perf][transaction:...] ERROR:` lines (and other
      // framework error context) because those are essential debug info.
      if (msg.includes('[replay-log]') || msg.includes('[snapshot-event]')) return;

      const level = consoleMatch[1].toUpperCase();
      logs.push(`[${level}] ${msg}`);
    };

    const processText = (text?: string) => {
      if (!text) return;
      text.split(/\r?\n/).forEach(processLine);
    };

    processText(runResult.stdout);
    processText(runResult.stderr);

    // Deduplicate file reads — same fix as extractReplayEntries.
    const consoleFilePaths = new Set<string>();
    if (runResult.stdoutPath && fs.existsSync(runResult.stdoutPath)) {
      consoleFilePaths.add(path.resolve(runResult.stdoutPath));
    }
    if (runResult.stderrPath && fs.existsSync(runResult.stderrPath)) {
      consoleFilePaths.add(path.resolve(runResult.stderrPath));
    }
    for (const p of consoleFilePaths) {
      processText(fs.readFileSync(p, 'utf-8'));
    }

    return logs;
  }
}
