"use strict";
/**
 * run.ts
 * Phase 1 – Main CLI entry point.
 * Orchestrates the full framework pipeline: load -> validate -> build -> execute.
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
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ConfigurationManager_1 = require("../config/ConfigurationManager");
const GatekeeperValidator_1 = require("../config/GatekeeperValidator");
const RuntimeConfigManager_1 = require("../config/RuntimeConfigManager");
const RecordingLogResolver_1 = require("../debug/RecordingLogResolver");
const ReplayRunner_1 = require("../debug/ReplayRunner");
const HostMonitor_1 = require("../execution/HostMonitor");
const ParallelExecutionManager_1 = require("../execution/ParallelExecutionManager");
const PipelineRunner_1 = require("../execution/PipelineRunner");
const ArtifactWriter_1 = require("../reporting/ArtifactWriter");
const EventArtifactBuilder_1 = require("../reporting/EventArtifactBuilder");
const RunReportGenerator_1 = require("../reporting/RunReportGenerator");
const RunSummaryBuilder_1 = require("../reporting/RunSummaryBuilder");
const TimeseriesArtifactBuilder_1 = require("../reporting/TimeseriesArtifactBuilder");
const TransactionMetricsBuilder_1 = require("../reporting/TransactionMetricsBuilder");
const TestPlanLoader_1 = require("../scenario/TestPlanLoader");
const logger_1 = require("../utils/logger");
const ProgressBar_1 = require("../utils/ProgressBar");
const convert_1 = require("./convert");
const generate_1 = require("./generate");
const generate_byos_1 = require("./generate-byos");
const init_1 = require("./init");
const validate_1 = require("./validate");
const program = new commander_1.Command();
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
    (0, init_1.runInit)(opts.dir);
});
// ---------------------------------------------
// GENERATE BYOS command
// ---------------------------------------------
program
    .command('generate-byos <team> <script-name>')
    .description('Scaffold a BYOS (Bring Your Own Script) template for pasting raw k6 scripts')
    .action((team, scriptName) => {
    (0, generate_byos_1.runGenerateByos)(team, scriptName);
});
// ---------------------------------------------
// CONVERT command
// ---------------------------------------------
program
    .command('convert <input-script> <team> <script-name>')
    .description('Convert a conventional k6 script to a framework-compatible script with logExchange and transaction wrappers')
    .option('--in-place', 'Overwrite the input file instead of writing to scrum-suites/<team>/tests/')
    .action(async (inputScript, team, scriptName, opts) => {
    await (0, convert_1.runConvert)(inputScript, team, scriptName, { inPlace: opts.inPlace });
});
// ---------------------------------------------
// GENERATE command
// ---------------------------------------------
program
    .command('generate <team> <script-name>')
    .description('Generate a k6 script from a HAR recording')
    .requiredOption('--har <path>', 'Path to the .har file')
    .action(async (team, scriptName, opts) => {
    await (0, generate_1.runGenerate)(opts.har, team, scriptName);
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
    const passed = (0, validate_1.runValidate)({
        planPath: opts.plan,
        envConfigPath: opts.envConfig,
        runtimeSettingsPath: opts.runtime,
        dataRoot: opts.dataRoot,
        envFilePath: opts.envFile,
    });
    if (!passed)
        process.exit(1);
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
    logger_1.Logger.header('k6 Performance Framework – DEBUG');
    try {
        const resolvedRecordingLogPath = opts.recordingLog
            ? opts.recordingLog
            : resolveRecordingLogForStandaloneDebug(opts.script);
        const result = await ReplayRunner_1.ReplayRunner.runDebug({
            scriptPath: opts.script,
            recordingLogPath: resolvedRecordingLogPath,
            outHtmlPath: opts.out,
            replayLogPath: opts.replayLog,
            vus: 1,
            iterations: 1,
        });
        logger_1.Logger.pass(`Replay log saved: ${result.replayLogPath}`);
        logger_1.Logger.pass(`HTML diff report: ${result.htmlReportPath}`);
        logger_1.Logger.pass(`Diff steps compared: ${result.results.length}\n`);
    }
    catch (err) {
        logger_1.Logger.fail(`Debug execution failed: ${err.message}\n`);
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
    .option('--debug', 'Enable debug mode (prints resolved config)')
    .option('--out <k6-output>', 'k6 --out flag value (e.g. json=results.json)')
    .action(async (opts) => {
    logger_1.Logger.header('k6 Performance Framework – RUN');
    // -- Step 1: Load test plan -----------------
    let plan;
    try {
        const loader = new TestPlanLoader_1.TestPlanLoader();
        plan = loader.load(opts.plan);
        logger_1.Logger.pass(`Test Plan loaded: ${plan.name} (${plan.environment})`);
    }
    catch (err) {
        logger_1.Logger.fail(err.message);
        process.exit(1);
    }
    // -- Step 2: Resolve configs ----------------
    const envConfigPath = opts.envConfig ?? path.join('config', 'environments', `${plan.environment}.json`);
    let resolvedConfig;
    try {
        const configManager = new ConfigurationManager_1.ConfigurationManager(opts.envFile);
        resolvedConfig = configManager.resolve({
            environmentConfigPath: envConfigPath,
            runtimeSettingsPath: opts.runtime,
            cliOverrides: {
                debugMode: opts.debug !== undefined ? opts.debug : (plan.debug?.enabled ? true : undefined)
            },
        });
        logger_1.Logger.pass(`Config resolved for environment: ${resolvedConfig.environment.name}`);
    }
    catch (err) {
        logger_1.Logger.fail(`Config error: ${err.message}`);
        process.exit(1);
    }
    // -- Step 3: Gatekeeper pre-flight ----------
    const gatekeeper = new GatekeeperValidator_1.GatekeeperValidator();
    const preflight = gatekeeper.validate(resolvedConfig, plan, opts.dataRoot);
    gatekeeper.printResult(preflight);
    if (!preflight.passed) {
        logger_1.Logger.fail('Pre-flight checks failed. Execution aborted.\n');
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
        k6Options = ParallelExecutionManager_1.ParallelExecutionManager.resolve(plan, scenarioRuntimeMetadata);
        const scenarioCount = Object.keys(k6Options.scenarios).length;
        logger_1.Logger.pass(`Scenarios built: ${scenarioCount} journey(s) -> ${Object.keys(k6Options.scenarios).join(', ')}\n`);
    }
    catch (err) {
        logger_1.Logger.fail(`Scenario build error: ${err.message}`);
        process.exit(1);
    }
    // -- Step 6: Execute via k6 -----------------
    // k6 parallel scenarios use "exec" to point to named exported functions.
    // Each journey script only exports a `default` function.
    // Solution: Generate a temporary combined entry script that re-exports
    // each journey's default function under its scenario exec name.
    const entryScriptDir = getEntryScriptDirectory(plan.user_journeys);
    fs.mkdirSync(entryScriptDir, { recursive: true });
    let entryCode = '';
    // k6-reporter: generates a standalone 3rd-party HTML report for validation
    entryCode += `import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";\n`;
    entryCode += `import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";\n`;
    for (const journey of plan.user_journeys) {
        const execName = journey.name.replace(/[^a-zA-Z0-9_]/g, '_');
        const importPath = toImportSpecifier(entryScriptDir, journey.scriptPath);
        entryCode += `export { default as ${execName} } from '${importPath}';\n`;
    }
    entryCode += `\nexport function handleSummary(data) {\n`;
    entryCode += `  return {\n`;
    entryCode += `    "${safeReportDir}/k6-reporter-summary.html": htmlReport(data),\n`;
    entryCode += `    "${safeReportDir}/handleSummary.json": JSON.stringify(data),\n`;
    entryCode += `    stdout: textSummary(data, { indent: " ", enableColors: true }),\n`;
    entryCode += `  };\n`;
    entryCode += `}\n`;
    const entryScriptPath = path.join(entryScriptDir, `.k6-perf-entry-${runId.replace(/[^a-zA-Z0-9_\-]/g, '_')}.js`);
    fs.writeFileSync(entryScriptPath, entryCode, 'utf-8');
    // Robust cleanup handlers for the generated orchestration file
    const cleanupEntryScript = () => {
        try {
            if (fs.existsSync(entryScriptPath)) {
                fs.unlinkSync(entryScriptPath);
            }
        }
        catch {
            // Silent best-effort fail
        }
    };
    const forceExitHandler = () => {
        cleanupEntryScript();
        process.exit(130);
    };
    process.on('exit', cleanupEntryScript);
    process.once('SIGINT', forceExitHandler);
    process.once('SIGTERM', forceExitHandler);
    const extraArgs = [
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
    const hostSnapshots = [];
    if (resolvedConfig.runtime.monitoring.enabled) {
        hostSnapshots.push(await HostMonitor_1.HostMonitor.captureSnapshot());
    }
    const hostSampler = HostMonitor_1.HostMonitor.startPeriodicSampling(resolvedConfig.runtime.monitoring, hostSnapshots);
    logger_1.Logger.pass('Prepared reporting directories');
    logger_1.Logger.detail(`Run ID: ${runId}`);
    logger_1.Logger.detail(`Reports will be saved to: ${reportDir}`);
    logger_1.Logger.detail(`Run manifest: ${runManifestPath}`);
    logger_1.Logger.detail('Launching k6...\n');
    let runResult;
    const k6StartTime = new Date().toISOString();
    try {
        runResult = await PipelineRunner_1.PipelineRunner.executeAsync({
            scriptPath: entryScriptPath,
            k6Options,
            extraK6Args: extraArgs,
            env: runtimeEnv,
            reportDir,
            runId,
            runManifestPath,
        });
    }
    finally {
        await hostSampler.stop();
        if (resolvedConfig.runtime.monitoring.enabled) {
            hostSnapshots.push(await HostMonitor_1.HostMonitor.captureSnapshot());
        }
        cleanupEntryScript();
        process.removeListener('exit', cleanupEntryScript);
        process.removeListener('SIGINT', forceExitHandler);
        process.removeListener('SIGTERM', forceExitHandler);
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
    logger_1.Logger.pass('Unified report artifacts generated');
    logger_1.Logger.detail(`Unified HTML report: ${generatedArtifacts.runReportHtml}`);
    logger_1.Logger.detail(`Transaction metrics: ${generatedArtifacts.transactionMetricsJson}`);
    logger_1.Logger.detail(`CI summary: ${generatedArtifacts.ciSummaryJson}`);
    if (generatedArtifacts.transactionMetrics) {
        printTransactionTable(generatedArtifacts.transactionMetrics);
    }
    PipelineRunner_1.PipelineRunner.ensureSuccess(runResult);
});
async function runPlanDebugMode(plan) {
    const debugSettings = plan.debug ?? { enabled: false };
    const baseDir = debugSettings.reportDir
        ? path.resolve(process.cwd(), debugSettings.reportDir)
        : path.join(process.cwd(), 'results', 'debug');
    const safePlanName = plan.name.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const runDir = path.join(baseDir, safePlanName, `Run_${timestamp}`);
    fs.mkdirSync(runDir, { recursive: true });
    const journeyCount = plan.user_journeys.length;
    logger_1.Logger.pass(`Debug mode · ${journeyCount} journey(s) · ${debugSettings.vus ?? 1} VU(s) · ${debugSettings.iterations ?? 1} iteration(s) each`);
    logger_1.Logger.detail(`Output: ${runDir}\n`);
    const failures = [];
    const journeyProgress = new ProgressBar_1.ProgressBar('Debug journeys', plan.user_journeys.length);
    for (const journey of plan.user_journeys) {
        try {
            journeyProgress.update(journeyProgress.current, journey.name);
            const result = await runJourneyDebug(plan, journey, runDir);
            journeyProgress.done(`${journey.name} — ${result.results.length} steps`);
            journeyProgress.tick();
            logger_1.Logger.detail(`  Report: ${path.basename(result.htmlReportPath)}`);
        }
        catch (err) {
            const message = `${journey.name}: ${err.message}`;
            journeyProgress.fail(journey.name);
            journeyProgress.tick();
            failures.push(message);
        }
    }
    if (failures.length > 0) {
        logger_1.Logger.fail('Debug run finished with errors:');
        failures.forEach((failure) => logger_1.Logger.bullet(failure, 'red'));
        console.error('');
        process.exit(1);
    }
}
function runJourneyDebug(plan, journey, runDir) {
    const safeJourneyName = journey.name.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const outHtmlPath = path.join(runDir, `${safeJourneyName}.diff.html`);
    const replayLogPath = path.join(runDir, `${safeJourneyName}.replay-log.json`);
    return ReplayRunner_1.ReplayRunner.runDebug({
        scriptPath: journey.scriptPath,
        recordingLogPath: journey.recordingLogPath,
        outHtmlPath,
        replayLogPath,
        vus: plan.debug?.vus ?? 1,
        iterations: plan.debug?.iterations ?? 1,
        noCookiesReset: plan.noCookiesReset,
    });
}
function resolveRecordingLogForStandaloneDebug(scriptPath) {
    const resolution = RecordingLogResolver_1.RecordingLogResolver.resolve(scriptPath);
    if (resolution.status === 'ambiguous') {
        throw new Error(`Multiple recording logs matched this script in ${resolution.recordingsDir}. ` +
            `Set --recording-log explicitly. Candidates: ${(resolution.candidates ?? []).join(', ')}`);
    }
    return resolution.resolvedPath;
}
function getEntryScriptDirectory(journeys) {
    const scriptDirs = Array.from(new Set(journeys.map((journey) => path.dirname(path.resolve(process.cwd(), journey.scriptPath)))));
    if (scriptDirs.length === 1) {
        return scriptDirs[0];
    }
    return path.join(process.cwd(), '.k6-temp');
}
function toImportSpecifier(fromDir, targetPath) {
    const relativePath = path.relative(fromDir, path.resolve(process.cwd(), targetPath)).replace(/\\/g, '/');
    return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}
function prepareRunArtifacts(plan, resolvedConfig) {
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
function buildScenarioRuntimeMetadata(plan, resolvedConfig, runId, safeReportDir) {
    const runtime = new RuntimeConfigManager_1.RuntimeConfigManager(resolvedConfig.runtime);
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
function buildRunEnvironment(plan, runId, safeReportDir, runManifestPath) {
    return {
        K6_PERF_RUN_ID: runId,
        K6_PERF_PLAN_NAME: plan.name,
        K6_PERF_ENVIRONMENT: plan.environment,
        K6_PERF_EXECUTION_MODE: plan.execution_mode,
        K6_PERF_REPORT_DIR: safeReportDir,
        K6_PERF_RUN_MANIFEST_PATH: runManifestPath.replace(/\\/g, '/'),
    };
}
function writeRunManifest(runManifestPath, plan, resolvedConfig, scenarioMetadata) {
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
function finalizeRunArtifacts(options) {
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
        logger_1.Logger.warn(`summary.json not found at ${summaryPath}. Unified report generation skipped for this run.`);
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
    const summaryData = JSON.parse(fs.readFileSync(primarySummaryPath, 'utf-8'));
    const runtime = new RuntimeConfigManager_1.RuntimeConfigManager(options.resolvedConfig.runtime);
    const journeyName = options.plan.user_journeys.length === 1 ? options.plan.user_journeys[0].name : 'all';
    const transactionMetrics = TransactionMetricsBuilder_1.TransactionMetricsBuilder.build({
        runId: options.runId,
        stats: runtime.getTransactionStats(),
        journeyName,
        summaryData: summaryData,
    });
    const eventArtifacts = EventArtifactBuilder_1.EventArtifactBuilder.build({
        runId: options.runId,
        planName: options.plan.name,
        environment: options.plan.environment,
        journeyName,
        errorBehavior: runtime.getErrorBehavior(),
        runStatus: options.runStatus,
        summaryData: summaryData,
    });
    const monitoringWarnings = HostMonitor_1.HostMonitor.buildWarnings(options.runId, options.resolvedConfig.runtime.monitoring, options.hostSnapshots);
    eventArtifacts.warnings.push(...monitoringWarnings);
    const ciSummary = RunSummaryBuilder_1.RunSummaryBuilder.buildCiSummary({
        runId: options.runId,
        planName: options.plan.name,
        environment: options.plan.environment,
        executionStatus: options.runStatus,
        summaryData: summaryData,
        transactions: transactionMetrics,
    });
    ciSummary.errorCount = eventArtifacts.errors.length;
    ciSummary.warningCount = eventArtifacts.warnings.length;
    const startTime = options.k6StartTime ?? new Date().toISOString();
    const endTime = options.k6EndTime ?? new Date().toISOString();
    const reportAgents = buildReportAgents(eventArtifacts);
    const timeseries = TimeseriesArtifactBuilder_1.TimeseriesArtifactBuilder.build({
        bucketSizeSeconds: runtime.getTimeseriesBucketSizeSeconds(),
        startTime,
        endTime,
        summaryData: summaryData,
        transactions: transactionMetrics,
        errors: eventArtifacts.errors,
        warnings: eventArtifacts.warnings,
        agents: reportAgents,
        systemSnapshots: options.hostSnapshots,
    });
    ArtifactWriter_1.ArtifactWriter.writeJson(transactionMetricsPath, transactionMetrics);
    ArtifactWriter_1.ArtifactWriter.writeNdjson(errorsPath, eventArtifacts.errors);
    ArtifactWriter_1.ArtifactWriter.writeNdjson(warningsPath, eventArtifacts.warnings);
    ArtifactWriter_1.ArtifactWriter.writeJson(ciSummaryPath, ciSummary);
    ArtifactWriter_1.ArtifactWriter.writeJson(timeseriesPath, timeseries);
    ArtifactWriter_1.ArtifactWriter.writeJson(systemMetricsPath, {
        snapshots: options.hostSnapshots,
    });
    const reportBundle = {
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
        errors: eventArtifacts.errors,
        warnings: eventArtifacts.warnings,
        snapshots: [],
        system: {
            agents: reportAgents,
            snapshots: options.hostSnapshots,
        },
    };
    fs.writeFileSync(runReportPath, RunReportGenerator_1.RunReportGenerator.generate(reportBundle), 'utf-8');
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
function buildReportAgents(eventArtifacts) {
    const firstAgent = eventArtifacts.errors[0]?.agent ?? eventArtifacts.warnings[0]?.agent;
    return firstAgent ? [firstAgent] : [];
}
/**
 * Print a LoadRunner-style transaction metrics table to the console.
 */
function printTransactionTable(metrics) {
    const rows = metrics.transactions;
    if (!rows.length)
        return;
    // Columns: always show these base columns, then the configured stats (minus duplicates)
    const baseColumns = ['transaction', 'count', 'pass', 'fail', 'errorPct'];
    const statColumns = metrics.stats.filter((s) => !['count', 'pass', 'fail', 'error %', 'error%', 'errorpct'].includes(s.toLowerCase()));
    const allColumns = [...baseColumns, ...statColumns];
    // Compute column widths
    const headerLabels = {
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
            if (val.length > max)
                max = val.length;
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
                const numVal = typeof row[col] === 'number' ? row[col] : 0;
                if (numVal > 0)
                    color = c.red;
            }
            if (col === 'pass') {
                const numVal = typeof row[col] === 'number' ? row[col] : 0;
                if (numVal > 0)
                    color = c.green;
            }
            return ` ${color}${truncated.padStart(colWidths[i])}${color ? c.reset : ''} `;
        }).join(`${c.dim}│${c.reset}`);
        console.log(`  ${c.dim}│${c.reset}${cells}${c.dim}│${c.reset}`);
    }
    const bottomSep = colWidths.map((w) => '─'.repeat(w + 2)).join('┴');
    console.log(`  ${c.dim}└${bottomSep}┘${c.reset}`);
    console.log('');
}
function formatCell(value, column) {
    if (value == null || value === '')
        return '-';
    if (typeof value === 'number') {
        if (column === 'errorPct')
            return value.toFixed(1) + '%';
        if (column === 'count' || column === 'pass' || column === 'fail')
            return value.toString();
        // Timing values in ms
        return Number.isInteger(value) ? value.toString() : value.toFixed(1);
    }
    return String(value);
}
// ---------------------------------------------
// Parse
// ---------------------------------------------
program.parse(process.argv);
//# sourceMappingURL=run.js.map