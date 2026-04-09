/**
 * run.ts
 * Phase 1 – Main CLI entry point.
 * Orchestrates the full framework pipeline: load -> validate -> build -> execute.
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigurationManager } from '../config/ConfigurationManager';
import { GatekeeperValidator } from '../config/GatekeeperValidator';
import { RuntimeConfigManager } from '../config/RuntimeConfigManager';
import { RecordingLogResolver } from '../debug/RecordingLogResolver';
import { ReplayRunner } from '../debug/ReplayRunner';
import { HostMonitor, HostSnapshot } from '../execution/HostMonitor';
import { ParallelExecutionManager } from '../execution/ParallelExecutionManager';
import { PipelineRunner } from '../execution/PipelineRunner';
import { ArtifactWriter } from '../reporting/ArtifactWriter';
import { EventArtifactBuilder } from '../reporting/EventArtifactBuilder';
import { RunReportGenerator } from '../reporting/RunReportGenerator';
import { RunSummaryBuilder } from '../reporting/RunSummaryBuilder';
import { TimeseriesArtifactBuilder } from '../reporting/TimeseriesArtifactBuilder';
import { TransactionMetricsBuilder } from '../reporting/TransactionMetricsBuilder';
import { ScenarioRuntimeMetadata } from '../scenario/ScenarioBuilder';
import { TestPlanLoader } from '../scenario/TestPlanLoader';
import { ResolvedConfig } from '../types/ConfigContracts';
import { ReportBundle } from '../types/ReportingContracts';
import { TestPlan, UserJourney } from '../types/TestPlanSchema';
import { Logger } from '../utils/logger';
import { ProgressBar } from '../utils/ProgressBar';
import { runConvert } from './convert';
import { runGenerate } from './generate';
import { runGenerateByos } from './generate-byos';
import { runInit } from './init';
import { runValidate } from './validate';

const program = new Command();

program
  .name('k6-framework')
  .description('k6 Performance Framework CLI – Phase 1 Foundation')
  .version('1.0.0');

// ---------------------------------------------
// INIT command
// ---------------------------------------------

program
  .command('init')
  .description('Scaffold a new k6 performance project in the current directory')
  .option('-d, --dir <path>', 'Target directory to scaffold into', process.cwd())
  .action((opts) => {
    runInit(opts.dir);
  });

// ---------------------------------------------
// GENERATE BYOS command
// ---------------------------------------------

program
  .command('generate-byos <team> <script-name>')
  .description('Scaffold a BYOS (Bring Your Own Script) template for pasting raw k6 scripts')
  .action((team, scriptName) => {
    runGenerateByos(team, scriptName);
  });

// ---------------------------------------------
// CONVERT command
// ---------------------------------------------

program
  .command('convert <input-script> <team> <script-name>')
  .description('Convert a conventional k6 script to a framework-compatible script with logExchange and transaction wrappers')
  .option('--in-place', 'Overwrite the input file instead of writing to scrum-suites/<team>/tests/')
  .action(async (inputScript, team, scriptName, opts) => {
    await runConvert(inputScript, team, scriptName, { inPlace: opts.inPlace });
  });

// ---------------------------------------------
// GENERATE command
// ---------------------------------------------

program
  .command('generate <team> <script-name>')
  .description('Generate a k6 script from a HAR recording')
  .requiredOption('--har <path>', 'Path to the .har file')
  .action(async (team, scriptName, opts) => {
    await runGenerate(opts.har, team, scriptName);
  });

// ---------------------------------------------
// VALIDATE command
// ---------------------------------------------

program
  .command('validate')
  .description('Validate configs and test plan before execution')
  .requiredOption('--plan <path>', 'Path to the test plan JSON file')
  .option('--env-config <path>', 'Path to the environment config JSON file (auto-resolved if omitted)')
  .option('--runtime <path>', 'Path to the runtime-settings JSON file', 'config/runtime-settings/default.json')
  .option('--data-root <path>', 'Root directory for data files', 'scrum-suites')
  .option('--env-file <path>', 'Path to .env file', '.env')
  .action((opts) => {
    const passed = runValidate({
      planPath: opts.plan,
      envConfigPath: opts.envConfig,
      runtimeSettingsPath: opts.runtime,
      dataRoot: opts.dataRoot,
      envFilePath: opts.envFile,
    });

    if (!passed) process.exit(1);
  });

// ---------------------------------------------
// DEBUG command
// ---------------------------------------------

program
  .command('debug')
  .description('Run a script in single-iteration debug mode and generate an HTML diff report')
  .requiredOption('--script <path>', 'Path to the generated journey script')
  .option('--recording-log <path>', 'Path to the normalized recording-log JSON file')
  .option('--out <path>', 'Path to the HTML diff report', path.join('results', 'debug-diff.html'))
  .option('--replay-log <path>', 'Optional path to save the captured replay-log JSON file')
  .action(async (opts) => {
    Logger.header('k6 Performance Framework – DEBUG');

    try {
      const resolvedRecordingLogPath = opts.recordingLog
        ? opts.recordingLog
        : resolveRecordingLogForStandaloneDebug(opts.script);
      const result = await ReplayRunner.runDebug({
        scriptPath: opts.script,
        recordingLogPath: resolvedRecordingLogPath,
        outHtmlPath: opts.out,
        replayLogPath: opts.replayLog,
        vus: 1,
        iterations: 1,
      });

      Logger.pass(`Replay log saved: ${result.replayLogPath}`);
      Logger.pass(`HTML diff report: ${result.htmlReportPath}`);
      Logger.pass(`Diff steps compared: ${result.results.length}\n`);
    } catch (err) {
      Logger.fail(`Debug execution failed: ${(err as Error).message}\n`);
      process.exit(1);
    }
  });

// ---------------------------------------------
// RUN command
// ---------------------------------------------

program
  .command('run')
  .description('Execute a test plan through k6')
  .requiredOption('--plan <path>', 'Path to the test plan JSON file')
  .option('--env-config <path>', 'Path to the environment config JSON (auto-resolved if omitted)')
  .option('--runtime <path>', 'Path to the runtime-settings JSON file', 'config/runtime-settings/default.json')
  .option('--env-file <path>', 'Path to .env file', '.env')
  .option('--data-root <path>', 'Root directory for data files', 'scrum-suites')
  .option('--debug', 'Enable debug mode (prints resolved config)', false)
  .option('--out <k6-output>', 'k6 --out flag value (e.g. json=results.json)')
  .action(async (opts) => {
    Logger.header('k6 Performance Framework – RUN');

    // -- Step 1: Load test plan -----------------
    let plan;
    try {
      const loader = new TestPlanLoader();
      plan = loader.load(opts.plan);
      Logger.pass(`Test Plan loaded: ${plan.name} (${plan.environment})`);
    } catch (err) {
      Logger.fail((err as Error).message);
      process.exit(1);
    }

    // -- Step 2: Resolve configs ----------------
    const envConfigPath =
      opts.envConfig ?? path.join('config', 'environments', `${plan.environment}.json`);

    let resolvedConfig;
    try {
      const configManager = new ConfigurationManager(opts.envFile);
      resolvedConfig = configManager.resolve({
        environmentConfigPath: envConfigPath,
        runtimeSettingsPath: opts.runtime,
        cliOverrides: { debugMode: opts.debug },
      });
      Logger.pass(`Config resolved for environment: ${resolvedConfig.environment.name}`);
    } catch (err) {
      Logger.fail(`Config error: ${(err as Error).message}`);
      process.exit(1);
    }

    // -- Step 3: Gatekeeper pre-flight ----------
    const gatekeeper = new GatekeeperValidator();
    const preflight = gatekeeper.validate(resolvedConfig, plan, opts.dataRoot);
    gatekeeper.printResult(preflight);

    if (!preflight.passed) {
      Logger.fail('Pre-flight checks failed. Execution aborted.\n');
      process.exit(1);
    }

    if (plan.debug?.enabled) {
      await runPlanDebugMode(plan);
      return;
    }

    // -- Step 4: Prepare run metadata and output paths ---------------
    const { reportDir, safeReportDir, runId, runManifestPath } = prepareRunArtifacts(plan, resolvedConfig);
    const scenarioRuntimeMetadata = buildScenarioRuntimeMetadata(plan, resolvedConfig, runId, safeReportDir);
    const runtimeEnv = buildRunEnvironment(plan, runId, safeReportDir, runManifestPath);
    writeRunManifest(runManifestPath, plan, resolvedConfig, scenarioRuntimeMetadata);

    // -- Step 5: Build k6 options ---------------
    let k6Options;
    try {
      k6Options = ParallelExecutionManager.resolve(plan, scenarioRuntimeMetadata);
      const scenarioCount = Object.keys(k6Options.scenarios).length;
      Logger.pass(`Scenarios built: ${scenarioCount} journey(s) -> ${Object.keys(k6Options.scenarios).join(', ')}\n`);
    } catch (err) {
      Logger.fail(`Scenario build error: ${(err as Error).message}`);
      process.exit(1);
    }

    // -- Step 6: Execute via k6 -----------------
    // k6 parallel scenarios use "exec" to point to named exported functions.
    // Each journey script only exports a `default` function.
    // Solution: Generate a temporary combined entry script that re-exports
    // each journey's default function under its scenario exec name.

    const tempDir = path.join(process.cwd(), '.k6-temp');
    fs.mkdirSync(tempDir, { recursive: true });

    let entryCode = '';
    // k6-reporter: generates a standalone 3rd-party HTML report for validation
    entryCode += `import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";\n`;
    entryCode += `import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";\n`;
    for (const journey of plan.user_journeys) {
      const execName = journey.name.replace(/[^a-zA-Z0-9_]/g, '_');
      // Use the resolved absolute path from Gatekeeper
      const absPath = path.resolve(process.cwd(), journey.scriptPath).replace(/\\/g, '/');
      entryCode += `export { default as ${execName} } from '${absPath}';\n`;
    }
    entryCode += `\nexport function handleSummary(data) {\n`;
    entryCode += `  return {\n`;
    entryCode += `    "${safeReportDir}/k6-reporter-summary.html": htmlReport(data),\n`;
    entryCode += `    "${safeReportDir}/handleSummary.json": JSON.stringify(data),\n`;
    entryCode += `    stdout: textSummary(data, { indent: " ", enableColors: true }),\n`;
    entryCode += `  };\n`;
    entryCode += `}\n`;

    const entryScriptPath = path.join(tempDir, 'entry.js');
    fs.writeFileSync(entryScriptPath, entryCode, 'utf-8');

    const extraArgs: string[] = [
      '--summary-export', `${safeReportDir}/summary.json`,
      '--out', `web-dashboard=export=${safeReportDir}/TestSummary.html`
    ];

    if (opts.out) {
      extraArgs.push('--out', opts.out);
    }

    const influxUrl = resolvedConfig.secrets['K6_INFLUXDB_URL'];
    if (influxUrl) {
      extraArgs.push('--out', `influxdb=${influxUrl}`);
    }

    const hostSnapshots: HostSnapshot[] = [];
    if (resolvedConfig.runtime.monitoring.enabled) {
      hostSnapshots.push(await HostMonitor.captureSnapshot());
    }
    const hostSampler = HostMonitor.startPeriodicSampling(resolvedConfig.runtime.monitoring, hostSnapshots);

    Logger.pass('Prepared reporting directories');
    Logger.detail(`Run ID: ${runId}`);
    Logger.detail(`Reports will be saved to: ${reportDir}`);
    Logger.detail(`Run manifest: ${runManifestPath}`);
    Logger.detail('Launching k6...\n');
    let runResult;
    const k6StartTime = new Date().toISOString();
    try {
      runResult = await PipelineRunner.executeAsync({
        scriptPath: entryScriptPath,
        k6Options,
        extraK6Args: extraArgs,
        env: runtimeEnv,
        reportDir,
        runId,
        runManifestPath,
      });
    } finally {
      await hostSampler.stop();
      if (resolvedConfig.runtime.monitoring.enabled) {
        hostSnapshots.push(await HostMonitor.captureSnapshot());
      }
    }
    const k6EndTime = new Date().toISOString();

    const generatedArtifacts = finalizeRunArtifacts({
      runId,
      reportDir,
      plan,
      resolvedConfig,
      runStatus: runResult.status,
      hostSnapshots,
      k6StartTime,
      k6EndTime,
    });

    Logger.pass('Unified report artifacts generated');
    Logger.detail(`Unified HTML report: ${generatedArtifacts.runReportHtml}`);
    Logger.detail(`Transaction metrics: ${generatedArtifacts.transactionMetricsJson}`);
    Logger.detail(`CI summary: ${generatedArtifacts.ciSummaryJson}`);

    if (generatedArtifacts.transactionMetrics) {
      printTransactionTable(generatedArtifacts.transactionMetrics);
    }

    PipelineRunner.ensureSuccess(runResult);
  });

async function runPlanDebugMode(plan: TestPlan): Promise<void> {
  const debugSettings = plan.debug ?? { enabled: false };
  const baseDir = debugSettings.reportDir
    ? path.resolve(process.cwd(), debugSettings.reportDir)
    : path.join(process.cwd(), 'results', 'debug');
  const safePlanName = plan.name.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = path.join(baseDir, safePlanName, `Run_${timestamp}`);

  fs.mkdirSync(runDir, { recursive: true });

  const journeyCount = plan.user_journeys.length;
  Logger.pass(`Debug mode · ${journeyCount} journey(s) · ${debugSettings.vus ?? 1} VU(s) · ${debugSettings.iterations ?? 1} iteration(s) each`);
  Logger.detail(`Output: ${runDir}\n`);

  const failures: string[] = [];
  const journeyProgress = new ProgressBar('Debug journeys', plan.user_journeys.length);

  for (const journey of plan.user_journeys) {
    try {
      journeyProgress.update(journeyProgress.current, journey.name);
      const result = await runJourneyDebug(plan, journey, runDir);
      journeyProgress.done(`${journey.name} — ${result.results.length} steps`);
      journeyProgress.tick();
      Logger.detail(`  Report: ${path.basename(result.htmlReportPath)}`);
    } catch (err) {
      const message = `${journey.name}: ${(err as Error).message}`;
      journeyProgress.fail(journey.name);
      journeyProgress.tick();
      failures.push(message);
    }
  }

  if (failures.length > 0) {
    Logger.fail('Debug run finished with errors:');
    failures.forEach((failure) => Logger.bullet(failure, 'red'));
    console.error('');
    process.exit(1);
  }
}

function runJourneyDebug(plan: TestPlan, journey: UserJourney, runDir: string) {
  const safeJourneyName = journey.name.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const outHtmlPath = path.join(runDir, `${safeJourneyName}.diff.html`);
  const replayLogPath = path.join(runDir, `${safeJourneyName}.replay-log.json`);

  return ReplayRunner.runDebug({
    scriptPath: journey.scriptPath,
    recordingLogPath: journey.recordingLogPath,
    outHtmlPath,
    replayLogPath,
    vus: plan.debug?.vus ?? 1,
    iterations: plan.debug?.iterations ?? 1,
    noCookiesReset: plan.noCookiesReset,
  });
}

function resolveRecordingLogForStandaloneDebug(scriptPath: string): string | undefined {
  const resolution = RecordingLogResolver.resolve(scriptPath);
  if (resolution.status === 'ambiguous') {
    throw new Error(
      `Multiple recording logs matched this script in ${resolution.recordingsDir}. ` +
      `Set --recording-log explicitly. Candidates: ${(resolution.candidates ?? []).join(', ')}`,
    );
  }

  return resolution.resolvedPath;
}

function prepareRunArtifacts(plan: TestPlan, resolvedConfig: ResolvedConfig): {
  reportDir: string;
  safeReportDir: string;
  runId: string;
  runManifestPath: string;
} {
  const baseDir = resolvedConfig.secrets['K6_RESULTS_BASE_DIR'] || 'results';
  const safePlanName = plan.name.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runId = `Run_${timestamp}`;
  const reportDir = path.join(process.cwd(), baseDir, safePlanName, runId);

  fs.mkdirSync(reportDir, { recursive: true });

  return {
    reportDir,
    safeReportDir: reportDir.replace(/\\/g, '/'),
    runId,
    runManifestPath: path.join(reportDir, 'run-manifest.json'),
  };
}

function buildScenarioRuntimeMetadata(
  plan: TestPlan,
  resolvedConfig: ResolvedConfig,
  runId: string,
  safeReportDir: string,
): ScenarioRuntimeMetadata {
  const runtime = new RuntimeConfigManager(resolvedConfig.runtime);

  return {
    runId,
    planName: plan.name,
    environment: plan.environment,
    executionMode: plan.execution_mode,
    reportDir: safeReportDir,
    generatedAt: new Date().toISOString(),
    runtime: {
      errorBehavior: runtime.getErrorBehavior(),
      thinkTimeMode: resolvedConfig.runtime.thinkTime.mode,
      pacingEnabled: runtime.isPacingEnabled(),
      pacingSeconds: runtime.getPacingSeconds(),
      reporting: {
        transactionStats: runtime.getTransactionStats(),
        includeTransactionTable: runtime.shouldIncludeTransactionTable(),
        includeErrorTable: runtime.shouldIncludeErrorTable(),
        timeseriesEnabled: runtime.isTimeseriesEnabled(),
        timeseriesBucketSizeSeconds: runtime.getTimeseriesBucketSizeSeconds(),
      },
    },
  };
}

function buildRunEnvironment(
  plan: TestPlan,
  runId: string,
  safeReportDir: string,
  runManifestPath: string,
): Record<string, string> {
  return {
    K6_PERF_RUN_ID: runId,
    K6_PERF_PLAN_NAME: plan.name,
    K6_PERF_ENVIRONMENT: plan.environment,
    K6_PERF_EXECUTION_MODE: plan.execution_mode,
    K6_PERF_REPORT_DIR: safeReportDir,
    K6_PERF_RUN_MANIFEST_PATH: runManifestPath.replace(/\\/g, '/'),
  };
}

function writeRunManifest(
  runManifestPath: string,
  plan: TestPlan,
  resolvedConfig: ResolvedConfig,
  scenarioMetadata: ScenarioRuntimeMetadata,
): void {
  const reportDir = path.dirname(runManifestPath).replace(/\\/g, '/');
  const manifest = {
    runId: scenarioMetadata.runId,
    generatedAt: scenarioMetadata.generatedAt,
    plan: {
      name: plan.name,
      environment: plan.environment,
      executionMode: plan.execution_mode,
      journeys: plan.user_journeys.map((journey) => ({
        name: journey.name,
        scriptPath: journey.scriptPath,
        weight: journey.weight,
      })),
    },
    runtime: scenarioMetadata.runtime,
    artifacts: {
      reportDir,
      summaryJson: `${reportDir}/summary.json`,
      testDetailsHtml: `${reportDir}/TestDetails.html`,
      testSummaryHtml: `${reportDir}/TestSummary.html`,
      runReportHtml: `${reportDir}/RunReport.html`,
      transactionMetricsJson: `${reportDir}/transaction-metrics.json`,
      errorsNdjson: `${reportDir}/errors.ndjson`,
      warningsNdjson: `${reportDir}/warnings.ndjson`,
      ciSummaryJson: `${reportDir}/ci-summary.json`,
      timeseriesJson: `${reportDir}/timeseries.json`,
      systemMetricsJson: `${reportDir}/system-metrics.json`,
      runManifest: runManifestPath.replace(/\\/g, '/'),
    },
    environment: {
      name: resolvedConfig.environment.name,
      baseUrl: resolvedConfig.environment.baseUrl,
    },
  };

  fs.writeFileSync(runManifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
}

function finalizeRunArtifacts(options: {
  runId: string;
  reportDir: string;
  plan: TestPlan;
  resolvedConfig: ResolvedConfig;
  runStatus: number;
  hostSnapshots: HostSnapshot[];
  k6StartTime?: string;
  k6EndTime?: string;
}): {
  runReportHtml: string;
  transactionMetricsJson: string;
  errorsNdjson: string;
  warningsNdjson: string;
  ciSummaryJson: string;
  timeseriesJson: string;
  systemMetricsJson: string;
  transactionMetrics?: import('../types/ReportingContracts').TransactionMetricsFile;
} {
  const summaryPath = path.join(options.reportDir, 'summary.json');
  const handleSummaryPath = path.join(options.reportDir, 'handleSummary.json');
  const transactionMetricsPath = path.join(options.reportDir, 'transaction-metrics.json');
  const errorsPath = path.join(options.reportDir, 'errors.ndjson');
  const warningsPath = path.join(options.reportDir, 'warnings.ndjson');
  const ciSummaryPath = path.join(options.reportDir, 'ci-summary.json');
  const timeseriesPath = path.join(options.reportDir, 'timeseries.json');
  const systemMetricsPath = path.join(options.reportDir, 'system-metrics.json');
  const runReportPath = path.join(options.reportDir, 'RunReport.html');

  if (!fs.existsSync(summaryPath) && !fs.existsSync(handleSummaryPath)) {
    Logger.warn(`summary.json not found at ${summaryPath}. Unified report generation skipped for this run.`);
    return {
      runReportHtml: runReportPath,
      transactionMetricsJson: transactionMetricsPath,
      errorsNdjson: errorsPath,
      warningsNdjson: warningsPath,
      ciSummaryJson: ciSummaryPath,
      timeseriesJson: timeseriesPath,
      systemMetricsJson: systemMetricsPath,
      transactionMetrics: undefined,
    };
  }

  // Prefer handleSummary.json (richer format with Trend metric counts and array-based groups)
  // over --summary-export's flat format
  const primarySummaryPath = fs.existsSync(handleSummaryPath) ? handleSummaryPath : summaryPath;
  const summaryData = JSON.parse(fs.readFileSync(primarySummaryPath, 'utf-8')) as {
    metrics?: Record<string, {
      type?: string;
      values?: Record<string, number>;
      thresholds?: Record<string, { ok?: boolean }>;
    }>;
    root_group?: {
      name?: string;
      groups?: Array<{
        name?: string;
        groups?: unknown[];
        checks?: Array<{ passes?: number; fails?: number }>;
      }>;
      checks?: Array<{ passes?: number; fails?: number }>;
    };
  };
  const runtime = new RuntimeConfigManager(options.resolvedConfig.runtime);
  const journeyName = options.plan.user_journeys.length === 1 ? options.plan.user_journeys[0].name : 'all';
  const transactionMetrics = TransactionMetricsBuilder.build({
    runId: options.runId,
    stats: runtime.getTransactionStats(),
    journeyName,
    summaryData: summaryData as any,
  });
  const eventArtifacts = EventArtifactBuilder.build({
    runId: options.runId,
    planName: options.plan.name,
    environment: options.plan.environment,
    journeyName,
    errorBehavior: runtime.getErrorBehavior(),
    runStatus: options.runStatus,
    summaryData: summaryData as any,
  });
  const monitoringWarnings = HostMonitor.buildWarnings(
    options.runId,
    options.resolvedConfig.runtime.monitoring,
    options.hostSnapshots,
  );
  eventArtifacts.warnings.push(...monitoringWarnings);
  const ciSummary = RunSummaryBuilder.buildCiSummary({
    runId: options.runId,
    planName: options.plan.name,
    environment: options.plan.environment,
    executionStatus: options.runStatus,
    summaryData: summaryData as any,
    transactions: transactionMetrics,
  });
  ciSummary.errorCount = eventArtifacts.errors.length;
  ciSummary.warningCount = eventArtifacts.warnings.length;
  const startTime = options.k6StartTime ?? new Date().toISOString();
  const endTime = options.k6EndTime ?? new Date().toISOString();
  const reportAgents = buildReportAgents(eventArtifacts);
  const timeseries = TimeseriesArtifactBuilder.build({
    bucketSizeSeconds: runtime.getTimeseriesBucketSizeSeconds(),
    startTime,
    endTime,
    summaryData: summaryData as any,
    transactions: transactionMetrics,
    errors: eventArtifacts.errors,
    warnings: eventArtifacts.warnings,
    agents: reportAgents,
    systemSnapshots: options.hostSnapshots,
  });

  ArtifactWriter.writeJson(transactionMetricsPath, transactionMetrics);
  ArtifactWriter.writeNdjson(errorsPath, eventArtifacts.errors as unknown as Array<Record<string, unknown>>);
  ArtifactWriter.writeNdjson(warningsPath, eventArtifacts.warnings as unknown as Array<Record<string, unknown>>);
  ArtifactWriter.writeJson(ciSummaryPath, ciSummary);
  ArtifactWriter.writeJson(timeseriesPath, timeseries);
  ArtifactWriter.writeJson(systemMetricsPath, {
    snapshots: options.hostSnapshots,
  });

  const reportBundle: ReportBundle = {
    meta: {
      runId: options.runId,
      plan: options.plan.name,
      environment: options.plan.environment,
      startTime,
      endTime,
      status: ciSummary.status,
      bucketSizeSeconds: runtime.getTimeseriesBucketSizeSeconds(),
    },
    config: {
      transactionStats: runtime.getTransactionStats(),
      defaultTopTransactions: 5,
      timeseriesEnabled: runtime.isTimeseriesEnabled(),
    },
    summary: {
      rawSummaryPath: summaryPath.replace(/\\/g, '/'),
      ciSummary,
    },
    transactions: transactionMetrics,
    timeseries,
    errors: eventArtifacts.errors as unknown as Array<Record<string, unknown>>,
    warnings: eventArtifacts.warnings as unknown as Array<Record<string, unknown>>,
    snapshots: [],
    system: {
      agents: reportAgents,
      snapshots: options.hostSnapshots,
    },
  };

  fs.writeFileSync(runReportPath, RunReportGenerator.generate(reportBundle), 'utf-8');

  return {
    runReportHtml: runReportPath,
    transactionMetricsJson: transactionMetricsPath,
    errorsNdjson: errorsPath,
    warningsNdjson: warningsPath,
    ciSummaryJson: ciSummaryPath,
    timeseriesJson: timeseriesPath,
    systemMetricsJson: systemMetricsPath,
    transactionMetrics,
  };
}

function buildReportAgents(eventArtifacts: {
  errors: Array<{ agent?: ReportBundle['system']['agents'][number] }>;
  warnings: Array<{ agent?: ReportBundle['system']['agents'][number] }>;
}): ReportBundle['system']['agents'] {
  const firstAgent = eventArtifacts.errors[0]?.agent ?? eventArtifacts.warnings[0]?.agent;
  return firstAgent ? [firstAgent] : [];
}

/**
 * Print a LoadRunner-style transaction metrics table to the console.
 */
function printTransactionTable(metrics: import('../types/ReportingContracts').TransactionMetricsFile): void {
  const rows = metrics.transactions;
  if (!rows.length) return;

  // Columns: always show these base columns, then the configured stats (minus duplicates)
  const baseColumns = ['transaction', 'count', 'pass', 'fail', 'errorPct'];
  const statColumns = metrics.stats.filter((s) => !['count', 'pass', 'fail', 'error %', 'error%', 'errorpct'].includes(s.toLowerCase()));
  const allColumns = [...baseColumns, ...statColumns];

  // Compute column widths
  const headerLabels: Record<string, string> = {
    transaction: 'Transaction',
    count: 'Count',
    pass: 'Pass',
    fail: 'Fail',
    errorPct: 'Err%',
    avg: 'Avg(ms)',
    min: 'Min(ms)',
    max: 'Max(ms)',
  };
  // Add p(N) labels
  for (const col of statColumns) {
    if (!headerLabels[col]) {
      headerLabels[col] = col;
    }
  }

  const colWidths = allColumns.map((col) => {
    const header = headerLabels[col] ?? col;
    let max = header.length;
    for (const row of rows) {
      const val = formatCell(row[col], col);
      if (val.length > max) max = val.length;
    }
    return Math.min(max, 48); // cap column width
  });

  const c = {
    dim: process.stdout.isTTY !== false && !process.env.NO_COLOR ? '\x1b[2m' : '',
    reset: process.stdout.isTTY !== false && !process.env.NO_COLOR ? '\x1b[0m' : '',
    cyan: process.stdout.isTTY !== false && !process.env.NO_COLOR ? '\x1b[36m' : '',
    bold: process.stdout.isTTY !== false && !process.env.NO_COLOR ? '\x1b[1m' : '',
    red: process.stdout.isTTY !== false && !process.env.NO_COLOR ? '\x1b[31m' : '',
    green: process.stdout.isTTY !== false && !process.env.NO_COLOR ? '\x1b[32m' : '',
    yellow: process.stdout.isTTY !== false && !process.env.NO_COLOR ? '\x1b[33m' : '',
  };

  // Header
  console.log('');
  console.log(`${c.bold}${c.cyan}  Transaction Metrics Matrix${c.reset}`);
  const sep = colWidths.map((w) => '─'.repeat(w + 2)).join('┬');
  console.log(`  ${c.dim}┌${sep}┐${c.reset}`);

  const headerRow = allColumns.map((col, i) => {
    const label = headerLabels[col] ?? col;
    return col === 'transaction' ? ` ${label.padEnd(colWidths[i])} ` : ` ${label.padStart(colWidths[i])} `;
  }).join(`${c.dim}│${c.reset}`);
  console.log(`  ${c.dim}│${c.reset}${c.bold}${headerRow}${c.reset}${c.dim}│${c.reset}`);

  const headerSep = colWidths.map((w) => '─'.repeat(w + 2)).join('┼');
  console.log(`  ${c.dim}├${headerSep}┤${c.reset}`);

  // Rows
  for (const row of rows) {
    const cells = allColumns.map((col, i) => {
      const val = formatCell(row[col], col);
      const truncated = val.length > colWidths[i] ? val.slice(0, colWidths[i] - 1) + '…' : val;

      if (col === 'transaction') {
        return ` ${truncated.padEnd(colWidths[i])} `;
      }

      // Color coding for errorPct and fail columns
      let color = '';
      if (col === 'errorPct' || col === 'fail') {
        const numVal = typeof row[col] === 'number' ? row[col] as number : 0;
        if (numVal > 0) color = c.red;
      }
      if (col === 'pass') {
        const numVal = typeof row[col] === 'number' ? row[col] as number : 0;
        if (numVal > 0) color = c.green;
      }

      return ` ${color}${truncated.padStart(colWidths[i])}${color ? c.reset : ''} `;
    }).join(`${c.dim}│${c.reset}`);

    console.log(`  ${c.dim}│${c.reset}${cells}${c.dim}│${c.reset}`);
  }

  const bottomSep = colWidths.map((w) => '─'.repeat(w + 2)).join('┴');
  console.log(`  ${c.dim}└${bottomSep}┘${c.reset}`);
  console.log('');
}

function formatCell(value: unknown, column: string): string {
  if (value == null || value === '') return '-';
  if (typeof value === 'number') {
    if (column === 'errorPct') return value.toFixed(1) + '%';
    if (column === 'count' || column === 'pass' || column === 'fail') return value.toString();
    // Timing values in ms
    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  }
  return String(value);
}

// ---------------------------------------------
// Parse
// ---------------------------------------------

program.parse(process.argv);
