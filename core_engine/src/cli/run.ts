/**
 * run.ts
 * Phase 1 – Main CLI entry point.
 * Orchestrates the full framework pipeline: load -> validate -> build -> execute.
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as readline from 'readline';
import { ConfigurationManager } from '../config/ConfigurationManager';
import { GatekeeperValidator } from '../config/GatekeeperValidator';
import { RuntimeConfigManager } from '../config/RuntimeConfigManager';
import { RecordingLogResolver } from '../debug/RecordingLogResolver';
import { ReplayRunner } from '../debug/ReplayRunner';
import { HostMonitor, HostSnapshot } from '../execution/HostMonitor';
import { ParallelExecutionManager } from '../execution/ParallelExecutionManager';
import { FileWriteSink } from '../execution/FileWriteSink';
import { PipelineRunner } from '../execution/PipelineRunner';
import { ScenarioBuilder } from '../scenario/ScenarioBuilder';
import { ArtifactWriter } from '../reporting/ArtifactWriter';
import { EventArtifactBuilder } from '../reporting/EventArtifactBuilder';
import { RunReportGenerator } from '../reporting/RunReportGenerator';
import { RunSummaryBuilder } from '../reporting/RunSummaryBuilder';
import { TimeseriesArtifactBuilder } from '../reporting/TimeseriesArtifactBuilder';
import { TransactionMetricsBuilder } from '../reporting/TransactionMetricsBuilder';
import { HistogramArtifactBuilder } from '../reporting/HistogramArtifactBuilder';
import { RequestMetricLogWriter } from '../reporting/RequestMetricLogWriter';
import { TransactionMetricLogWriter } from '../reporting/TransactionMetricLogWriter';
import { LiveEventLogWriter } from '../reporting/LiveEventLogWriter';
import { ScenarioRuntimeMetadata } from '../scenario/ScenarioBuilder';
import { TestPlanLoader } from '../scenario/TestPlanLoader';
import { ResolvedConfig } from '../types/ConfigContracts';
import { ReportBundle } from '../types/ReportingContracts';
import { TestPlan, UserJourney } from '../types/TestPlanSchema';
import { Logger } from '../utils/logger';
import { startLiveConsoleLogStream } from '../utils/LiveConsoleLogStream';
import { ProgressBar } from '../utils/ProgressBar';
import { runConvert } from './convert';
import { runCorrelate } from './correlate';
import { runGenerate } from './generate';
import { runGenerateByos } from './generate-byos';
import { runImportCurl, runImportPostman } from './import';
import { runInit } from './init';
import { runValidate } from './validate';
import { runMerge } from '../distributed/runMerge';
import { runCollect, collectRunDir } from '../distributed/collectRun';
import { awaitScheduledStart } from '../distributed/startBarrier';
import { runAgentCli } from '../distributed/agentServer';
import { runProbe } from '../distributed/probe';
import { printControllerShareSuggestion } from '../distributed/shareSetup';
import type { ChildProcess } from 'child_process';
import { LiveStatusHeartbeat } from '../distributed/LiveStatusHeartbeat';
import { runMonitor } from '../distributed/monitor';
import { runDashboardCli } from '../distributed/liveDashboard';
import { ControlWatcher, controlDirFor, killProcessTree, k6ApiStop, writeControl } from '../distributed/control';
import { listTemplates, showTemplate } from './templates';
import { listFeatures } from './features';
import { inspectConfig } from './config-inspect';
import { runNewWizard } from './new';
import { generateDocs } from './docs';

const program = new Command();

program
  .name('k6-framework')
  .description('k6 Performance Framework CLI – Phase 1 Foundation')
  .version('1.0.0');

// ---------------------------------------------
// Root action — launch the interactive panel when no subcommand is given
// AND we're attached to a TTY. CI / piped invocations fall through to
// commander's default help output so scripting behavior is unchanged.
// ---------------------------------------------
program.action(async () => {
  // commander already runs subcommand actions; this only fires when no
  // subcommand is supplied. Gate on TTY so `k6-framework | tee` etc. still
  // show help rather than blocking on an interactive prompt that nobody can
  // answer.
  if (process.stdin.isTTY && process.stdout.isTTY) {
    const { runInteractivePanel } = await import('./interactive.js');
    await runInteractivePanel();
    return;
  }
  program.outputHelp();
});

// Explicit `menu` alias for users who prefer to type a command. Same handler
// as the bare invocation — does NOT gate on TTY because asking for `menu`
// is explicit intent.
program
  .command('menu')
  .description('Launch the interactive command panel (same as running with no subcommand on a TTY)')
  .action(async () => {
    const { runInteractivePanel } = await import('./interactive.js');
    await runInteractivePanel();
  });

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
// NEW command
// ---------------------------------------------

program
  .command('new')
  .description('Interactive wizard to create a new test plan or runtime settings from templates')
  .action(() => {
    runNewWizard();
  });

// ---------------------------------------------
// DOCS command
// ---------------------------------------------

program
  .command('docs')
  .description('Auto-generate Markdown reference documentation from JSON schemas')
  .action(() => {
    generateDocs();
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
  .option('--in-place', 'Overwrite the input file instead of writing to testSuites/<team>/tests/')
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
// CORRELATE command (auto-correlation / "scan for correlations")
// ---------------------------------------------

program
  .command('correlate')
  .description('Scan a recording for dynamic values and (optionally) auto-correlate a generated script')
  .option('--script <path>', 'Generated script to correlate (required for --apply; auto-resolves its recording log)')
  .option('--har <path>', 'Scan a .har file directly (list mode; request IDs follow HAR order)')
  .option('--log <path>', 'Scan a recording-log.json (recommended — IDs align with the generated script)')
  .option('--manifest <path>', 'Apply/list an existing correlation manifest instead of rescanning')
  .option('--list', 'Print suspected dynamic values + write the manifest; do not modify the script (default)')
  .option('--apply <level>', 'Rewrite the script: high | medium | all')
  .option('--out <path>', 'Write the correlated script here (default: overwrite --script)')
  .option('--manifest-out <path>', 'Where to write the manifest (default: alongside the recording log)')
  .option('--dry-run', 'Alias for --list')
  .action(async (opts) => {
    await runCorrelate({
      script: opts.script,
      har: opts.har,
      log: opts.log,
      manifest: opts.manifest,
      list: opts.list,
      apply: opts.apply,
      out: opts.out,
      manifestOut: opts.manifestOut,
      dryRun: opts.dryRun,
    });
  });

// ---------------------------------------------
// IMPORT command family (Request Import — Phase 1)
// ---------------------------------------------

const importCmd = program
  .command('import')
  .description('Import requests from external sources (cURL in v1; Postman/OpenAPI planned)');

importCmd
  .command('curl <team> <script-name>')
  .description('Import a cURL command into a framework-shaped k6 script')
  .option('--curl <string>', 'Inline cURL command string (shell-quoting required; for browser-copied curls prefer --clipboard or --file)')
  .option('--file <path>', 'Path to a file containing one or more cURL blocks (blank-line separated; optional `# name` comment names each transaction)')
  .option('--stdin', 'Read cURL command from stdin (pipe-friendly: `clip | npm run import:curl … --stdin`)')
  .option('--clipboard', 'Read cURL command from the OS clipboard (works directly with Chrome/Edge/Firefox "Copy as cURL")')
  .option('--transaction-name <name>', 'Override the inferred transaction name (single-curl only)')
  .action(async (team, scriptName, opts) => {
    await runImportCurl(team, scriptName, {
      curl: opts.curl,
      file: opts.file,
      stdin: opts.stdin,
      clipboard: opts.clipboard,
      transactionName: opts.transactionName,
    });
  });

importCmd
  .command('postman <team> <script-name>')
  .description('Import a Postman v2.1 collection into a framework-shaped k6 script')
  .requiredOption('--file <path>', 'Path to a Postman v2.1 collection JSON file')
  .option('--folder <path>', 'Only emit requests under this folder. Supports nested paths, e.g. "API/Auth" (includes the whole subtree)')
  .option('--split-per-request', 'Emit one script per request (API) instead of a single combined script')
  .action(async (team, scriptName, opts) => {
    await runImportPostman(team, scriptName, {
      file: opts.file,
      folder: opts.folder,
      splitPerRequest: opts.splitPerRequest === true,
    });
  });

// ---------------------------------------------
// VALIDATE command
// ---------------------------------------------


program
  .command('validate')
  .description('Validate configs and test plan before execution')
  .requiredOption('--plan <path>', 'Path to the test plan JSON file')
  .option('--env-config <path>', 'Path to the environment config JSON file (auto-resolved if omitted)')
  .option('--runtime <path>', 'Path to the runtime_settings JSON file', 'config/runtime_settings/default.json')
  .option('--data-root <path>', 'Root directory for data files', 'testSuites')
  .option('--env-file <path>', 'Path to .env file', '.env')
  .option('--verbose', 'Print verbose validation output including completeness score')
  .action((opts) => {
    const passed = runValidate({
      planPath: opts.plan,
      envConfigPath: opts.envConfig,
      runtimeSettingsPath: opts.runtime,
      dataRoot: opts.dataRoot,
      envFilePath: opts.envFile,
      verbose: opts.verbose,
    });

    if (!passed) process.exit(1);
  });

// ---------------------------------------------
// MERGE command (distributed) — combine per-machine results into one report
// ---------------------------------------------
program
  .command('merge')
  .description('Merge per-machine distributed run artifacts into a single report')
  .requiredOption('--run-dir <path>', 'Shared run dir containing <machineName>/ subfolders for one runId')
  .option('--out <path>', 'Output dir for the merged result (default: <run-dir>/Final_<testname>_<ts>)')
  .option('--wait', 'Block until all --machines have collected in, then merge (auto-finalize)')
  .option('--machines <list>', 'Comma-separated machine names to wait for (with --wait)')
  .option('--poll <sec>', 'Poll interval while waiting', '5')
  .option('--wait-timeout <sec>', 'Max seconds to wait before giving up', '600')
  .action(async (opts) => {
    const passed = await runMerge({
      runDir: opts.runDir,
      out: opts.out,
      wait: opts.wait,
      machines: opts.machines ? String(opts.machines).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
      pollSec: Number(opts.poll) || 5,
      waitTimeoutSec: Number(opts.waitTimeout) || 600,
    });
    if (!passed) process.exit(1);
  });

// ---------------------------------------------
// COLLECT command (distributed) — copy a local run folder into the shared location
// ---------------------------------------------
program
  .command('collect')
  .description('Copy a finished local run folder into <collectDir>/shared_<runId>/<machine>/')
  .requiredOption('--from <path>', 'Local run dir to collect (e.g. results/<plan>/<runId>)')
  .requiredOption('--into <path>', 'Shared collect base dir')
  .option('--machine <name>', 'Machine name (defaults to hostname)')
  .option('--run-id <id>', 'Shared runId (defaults to the run-manifest runId)')
  .option('--include-raw', 'Also copy the large raw metrics-stream.json (excluded by default)')
  .action((opts) => {
    const ok = runCollect({ from: opts.from, into: opts.into, machine: opts.machine || os.hostname(), runId: opts.runId, includeRaw: opts.includeRaw });
    if (!ok) process.exit(1);
  });

// ---------------------------------------------
// AGENT command (distributed / Phase-2 probe) — run on each LG so the controller
// can verify the firewall permits the controller→agent inbound path.
// ---------------------------------------------
program
  .command('agent')
  .description('Run a minimal reachability agent on a load generator (Phase-2 firewall probe)')
  .option('--port <port>', 'Port to listen on', '7070')
  .option('--host <host>', 'Interface to bind (0.0.0.0 = all interfaces)', '0.0.0.0')
  .option('--name <name>', 'Machine name reported to the controller (defaults to hostname)')
  .option('--token <token>', 'Optional shared secret required on every request (or K6_PERF_AGENT_TOKEN)')
  .action(async (opts) => {
    await runAgentCli({ port: opts.port, host: opts.host, name: opts.name, token: opts.token });
  });

// ---------------------------------------------
// PROBE command (distributed / Phase-2 probe) — run on the controller to check
// reachability of one or more agents (the firewall go/no-go for the controller approach).
// ---------------------------------------------
program
  .command('probe')
  .description('Probe reachability of one or more distributed agents from the controller')
  .requiredOption('--agents <list>', 'Comma-separated agent targets, e.g. host1:7070,host2:7070')
  .option('--port <port>', 'Default port when a target omits one', '7070')
  .option('--timeout <ms>', 'Per-agent timeout in milliseconds', '5000')
  .option('--token <token>', 'Shared secret to send (or K6_PERF_AGENT_TOKEN)')
  .option('--tcp', 'Raw TCP connect test (works on any port; no HTTP) — for firewall port discovery')
  .action(async (opts) => {
    const ok = await runProbe({ agents: opts.agents, port: opts.port, timeout: opts.timeout, token: opts.token, tcp: opts.tcp });
    if (!ok) process.exit(1);
  });

// ---------------------------------------------
// SHARE-SETUP command (distributed) — print how to share the controller results dir
// ---------------------------------------------
program
  .command('share-setup')
  .description('Print how to share the controller results folder for distributed collection (manual this phase)')
  .option('--results-dir <path>', 'Results base dir to share (default: K6_RESULTS_BASE_DIR or results)')
  .option('--share-name <name>', 'Windows share name to suggest', 'k6results')
  .option('--host <host>', 'Controller hostname/IP shown in the UNC path (default: hostname)')
  .action((opts) => {
    printControllerShareSuggestion({ resultsDir: opts.resultsDir, shareName: opts.shareName, host: opts.host });
  });

// ---------------------------------------------
// MONITOR command (distributed) — combined live view from the shared heartbeats
// ---------------------------------------------
program
  .command('monitor')
  .description('Live-monitor a distributed run (console, or --serve for a browser dashboard)')
  .option('--live-dir <path>', 'Path to the live_<runId> folder')
  .option('--collect-dir <path>', 'Shared collect base dir (use with --run-id)')
  .option('--run-id <id>', 'Shared runId (use with --collect-dir)')
  .option('--interval <ms>', 'Refresh interval in milliseconds', '3000')
  .option('--once', 'Print a single snapshot and exit (console only)')
  .option('--serve', 'Serve a live browser dashboard instead of the console view')
  .option('--host <host>', 'Dashboard bind host (localhost now; 0.0.0.0 to share once a port is open)', '127.0.0.1')
  .option('--port <port>', 'Dashboard port', '8787')
  .option('--no-auto-merge', 'Do NOT auto-merge when all machines finish (run `merge` yourself)')
  .option('--merge-timeout <sec>', 'Max seconds to wait for collects before auto-merge gives up', '300')
  .action(async (opts) => {
    if (opts.serve) {
      await runDashboardCli({
        liveDir: opts.liveDir,
        collectDir: opts.collectDir,
        runId: opts.runId,
        host: opts.host,
        port: Number(opts.port) || 8787,
        intervalMs: Number(opts.interval) || 3000,
        autoMerge: opts.autoMerge,
        mergeTimeoutSec: Number(opts.mergeTimeout) || 300,
      });
      return;
    }
    const ok = await runMonitor({
      liveDir: opts.liveDir,
      collectDir: opts.collectDir,
      runId: opts.runId,
      intervalMs: Number(opts.interval) || 3000,
      once: opts.once,
      autoMerge: opts.autoMerge,
      mergeTimeoutSec: Number(opts.mergeTimeout) || 300,
    });
    if (!ok) process.exit(1);
  });

// ---------------------------------------------
// SIGNAL command (distributed) — send an abort/stop to a running distributed run
// ---------------------------------------------
program
  .command('signal')
  .description('Send abort/stop to a running distributed run (writes control_<runId>/control.json)')
  .requiredOption('--mode <mode>', 'abort | stop')
  .option('--collect-dir <path>', 'Shared collect base dir (use with --run-id)')
  .option('--run-id <id>', 'Shared runId (use with --collect-dir)')
  .option('--control-dir <path>', 'Explicit control_<runId> dir (alternative to --collect-dir/--run-id)')
  .option('--effective-at <sec>', 'stop only: seconds from now to drain together', '10')
  .action((opts) => {
    if (opts.mode !== 'abort' && opts.mode !== 'stop') {
      Logger.fail('[signal] --mode must be abort or stop'); process.exit(1);
    }
    const dir = opts.controlDir
      || (opts.collectDir && opts.runId ? controlDirFor(opts.collectDir, opts.runId) : null);
    if (!dir) { Logger.fail('[signal] provide --control-dir, or --collect-dir together with --run-id'); process.exit(1); }
    const effectiveAt = opts.mode === 'stop'
      ? new Date(Date.now() + (Number(opts.effectiveAt) || 10) * 1000).toISOString()
      : undefined;
    const p = writeControl(dir, { action: opts.mode, effectiveAt, by: 'cli' });
    Logger.pass(`[signal] ${opts.mode}${effectiveAt ? ` (effective ${effectiveAt})` : ''} → ${p}`);
  });

// ---------------------------------------------
// TEMPLATES command
// ---------------------------------------------

const templatesCmd = program
  .command('templates')
  .description('Discover and view built-in config templates');

templatesCmd
  .command('list')
  .description('List all available templates')
  .option('--type <type>', 'Type of templates (test_plans | runtime_settings)', 'test_plans')
  .action((opts) => {
    if (opts.type !== 'test_plans' && opts.type !== 'runtime_settings') {
      console.error('Invalid type. Must be test_plans or runtime_settings.');
      process.exit(1);
    }
    listTemplates(opts.type);
  });

templatesCmd
  .command('show <name>')
  .description('Show the content of a specific template')
  .option('--type <type>', 'Type of template (test_plans | runtime_settings)', 'test_plans')
  .action((name, opts) => {
    if (opts.type !== 'test_plans' && opts.type !== 'runtime_settings') {
      console.error('Invalid type. Must be test_plans or runtime_settings.');
      process.exit(1);
    }
    showTemplate(opts.type, name);
  });

// ---------------------------------------------
// FEATURES command
// ---------------------------------------------

program
  .command('features')
  .description('Discover built-in framework capabilities')
  .action(() => {
    listFeatures();
  });

// ---------------------------------------------
// CONFIG command
// ---------------------------------------------

const configCmd = program
  .command('config')
  .description('Configuration utilities');

configCmd
  .command('inspect')
  .description('Inspect the final merged configuration resolution chain')
  .requiredOption('--plan <path>', 'Path to the test plan JSON file')
  .option('--env-config <path>', 'Path to the environment config JSON file')
  .option('--runtime <path>', 'Path to the runtime_settings JSON file')
  .option('--env-file <path>', 'Path to .env file')
  .action((opts) => {
    inspectConfig(opts.plan, opts.envConfig, opts.runtime, opts.envFile);
  });

// ---------------------------------------------
// DEBUG command
// ---------------------------------------------

program
  .command('debug')
  .description('Run a script in debug mode (single VU) and generate an HTML diff report')
  .requiredOption('--script <path>', 'Path to the generated journey script')
  .option('--recording-log <path>', 'Path to the normalized recording-log JSON file')
  .option('--out <path>', 'Path to the HTML diff report', path.join('results', 'debug-diff.html'))
  .option('--replay-log <path>', 'Optional path to save the captured replay-log JSON file')
  .option('--iterations <n>', 'Number of iterations to run (single VU; default 1)', '1')
  .option('--i <n>', 'Alias for --iterations')
  .allowUnknownOption()
  .allowExcessArguments()
  .action(async (opts, cmd) => {
    Logger.header('k6 Performance Framework – DEBUG');
    const passthroughArgs = filterPassthroughArgs(cmd.args as string[]);
    // Debug mode is always single-VU (ReplayRunner enforces vus=1); iterations
    // are configurable so a script can be smoke-run a few times (e.g. to verify
    // cookie/session persistence across iterations) without authoring a plan.
    // Accept any of -i / --i / --iterations (--i wins if both are supplied).
    const iterations = Math.max(1, Number.parseInt(opts.i ?? opts.iterations, 10) || 1);

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
        iterations,
        extraK6Args: passthroughArgs,
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
  .option('--runtime <path>', 'Path to the runtime_settings JSON file', 'config/runtime_settings/default.json')
  .option('--env-file <path>', 'Path to .env file', '.env')
  .option('--data-root <path>', 'Root directory for data files', 'testSuites')
  .option('--debug', 'Enable debug mode (prints resolved config)')
  .option('--out <k6-output>', 'k6 --out flag value (e.g. json=results.json)')
  .option('--distributed', 'Enable distributed mode (or set K6_PERF_DISTRIBUTED=1)')
  .option('--role <role>', 'Distributed role: controller | agent')
  .allowUnknownOption()
  .allowExcessArguments()
  .action(async (opts, cmd) => {
    const passthroughArgs = filterPassthroughArgs(cmd.args as string[]);
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
        cliOverrides: {
          ...(opts.debug !== undefined ? { debugMode: opts.debug as boolean } : {}),
        },
      });
      Logger.pass(`Config resolved for environment: ${resolvedConfig.environment.name}`);
    } catch (err) {
      Logger.fail(`Config error: ${(err as Error).message}`);
      process.exit(1);
    }

    // -- Distributed mode (opt-in) --------------
    // K6_PERF_DISTRIBUTED=1 (or --distributed). Resolved AFTER config resolve so values
    // set in .env (bridged into process.env by the config layer) are honored too.
    // One boolean + role → downstream (tags, HTML policy, forced CSV, collect, control)
    // has a single source of truth. Non-distributed (local) runs are unaffected.
    const distributed =
      opts.distributed === true || /^(1|true|yes)$/i.test(process.env.K6_PERF_DISTRIBUTED ?? '');
    const distRole = (opts.role || process.env.K6_PERF_ROLE || '').toLowerCase();
    // Shared test id — stamped as a k6 tag (distributed), the manifest, and CSV filenames.
    const testId = process.env.K6_PERF_TEST_ID?.trim() || `TID_${plan.name}`;
    if (distributed) {
      process.env.K6_PERF_DISTRIBUTED = '1'; // normalize for children/downstream
      Logger.detail(`[distributed] mode ON${distRole ? `, role=${distRole}` : ''} · testId=${testId}`);
      if (!process.env.K6_PERF_MACHINE)
        Logger.warning('[distributed] K6_PERF_MACHINE not set — defaulting to hostname; set a unique name per machine.');
      if (!process.env.K6_PERF_START_AT)
        Logger.warning('[distributed] K6_PERF_START_AT not set — machines will not start together; ramps may not align.');
    }

    // Distributed controller: remind the operator how to share this machine's results
    // folder so LGs can collect into it (manual this phase — see EDD §Shared-Location).
    if (distributed && distRole === 'controller') {
      printControllerShareSuggestion({ resultsDir: resolvedConfig.secrets['K6_RESULTS_BASE_DIR'] });
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
      await runPlanDebugMode(plan, resolvedConfig, passthroughArgs);
      return;
    }

    // -- Step 4: Prepare run metadata and output paths ---------------
    const { reportDir, safeReportDir, runId, runManifestPath } = prepareRunArtifacts(plan, resolvedConfig);
    const scenarioRuntimeMetadata = buildScenarioRuntimeMetadata(plan, resolvedConfig, runId, safeReportDir);
    const runtimeEnv = buildRunEnvironment(plan, resolvedConfig, runId, safeReportDir, runManifestPath);
    writeRunManifest(runManifestPath, plan, resolvedConfig, scenarioRuntimeMetadata, {
      distributed, role: distRole, machine: process.env.K6_PERF_MACHINE || os.hostname(), testId,
    });

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

    const entryScriptDir = getEntryScriptDirectory(plan.user_journeys);
    fs.mkdirSync(entryScriptDir, { recursive: true });

    let entryCode = '';
    // In distributed mode the LG is headless: no CDN imports (air-gap safe — both
    // benc-uk/k6-reporter and jslib.k6.io are remote) and no per-machine HTML. Only
    // handleSummary.json (a data artifact the report/threshold logic consumes) is
    // written; the single merged RunReport comes from the merge step. Local
    // (non-distributed) runs keep the full HTML + textSummary behavior unchanged.
    if (!distributed) {
      entryCode += `import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";\n`;
      entryCode += `import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";\n`;
    }
    for (const journey of plan.user_journeys) {
      const execName = journey.name.replace(/[^a-zA-Z0-9_]/g, '_');
      const importPath = toImportSpecifier(entryScriptDir, journey.scriptPath);
      entryCode += `export { default as ${execName} } from '${importPath}';\n`;
    }
    entryCode += `\nexport function handleSummary(data) {\n`;
    entryCode += `  return {\n`;
    if (!distributed) {
      entryCode += `    "${safeReportDir}/k6-reporter-summary.html": htmlReport(data),\n`;
    }
    entryCode += `    "${safeReportDir}/handleSummary.json": JSON.stringify(data),\n`;
    if (!distributed) {
      entryCode += `    stdout: textSummary(data, { indent: " ", enableColors: true }),\n`;
    }
    entryCode += `  };\n`;
    entryCode += `}\n`;

    const entryScriptPath = path.join(
      entryScriptDir,
      `.k6-perf-entry-${runId.replace(/[^a-zA-Z0-9_]/g, '_')}.js`,
    );
    fs.writeFileSync(entryScriptPath, entryCode, 'utf-8');

    // Robust cleanup handlers for the generated orchestration file
    const cleanupEntryScript = () => {
      try {
        if (fs.existsSync(entryScriptPath)) {
          fs.unlinkSync(entryScriptPath);
        }
      } catch {
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

    const metricsStreamPath = path.join(reportDir, 'metrics-stream.json');
    const safeMetricsStreamPath = metricsStreamPath.replace(/\\/g, '/');
    const runLogPath = path.join(reportDir, 'k6-run.log');
    const safeRunLogPath = runLogPath.replace(/\\/g, '/');

    const extraArgs: string[] = [
      '--summary-export', `${safeReportDir}/summary.json`,
      '--out', `web-dashboard=export=${safeReportDir}/TestSummary.html`,
      '--out', `json=${safeMetricsStreamPath}`,
      // Send k6 log output (console.log, framework events) ONLY to the log
      // file. A live tailer (`startLiveConsoleLogStream`) reads the file as
      // it's written and pretty-prints each line via `Logger.*` so script
      // console output appears in the terminal in real time, color-coded.
      // Dropping `--log-output stderr` avoids duplicate (raw + pretty)
      // output. k6's animated progress bar still renders normally — it does
      // not flow through `--log-output`.
      '--log-output', `file=${safeRunLogPath}`,
      // User-supplied k6 flags forwarded verbatim (e.g. --http-debug=full).
      ...passthroughArgs,
    ];

    if (opts.out) {
      extraArgs.push('--out', opts.out);
    }

    // Per-request CSV log (Test_ID_<host>_run_metric.csv) — one row per HTTP
    // request, derived live from the json stream. On by default; disable by
    // setting K6_PERF_REQUEST_LOG=0 (or false). Modern k6 emits the current VU
    // and iteration under each Point's `metadata` automatically, so the log gets
    // those for free. We still pass the default system-tag set plus vu,iter for
    // older k6 (which exposed vu/iter as tags only when explicitly enabled); the
    // list mirrors k6's defaults so no system tag is dropped, and custom/user
    // tags are unaffected. Gated by the toggle so the flag is only added when on.
    const requestLogEnabled = !/^(0|false|no)$/i.test(process.env.K6_PERF_REQUEST_LOG ?? '');
    // Per-transaction CSV log — separate toggle. Independent of the request log,
    // but shares the same vu/iter system-tag requirement.
    // Distributed mode forces the transaction CSV on — it is the raw carrier the
    // merge pools for R-7 percentiles, so it must not be disabled on an LG.
    const transactionLogEnabled = distributed || !/^(0|false|no)$/i.test(process.env.K6_PERF_TRANSACTION_LOG ?? '');
    if (requestLogEnabled || transactionLogEnabled) {
      extraArgs.push(
        '--system-tags',
        'proto,subproto,status,method,url,name,group,check,error,error_code,tls_version,scenario,service,expected_response,vu,iter',
      );
    }

    const influxUrl = resolvedConfig.secrets['K6_INFLUXDB_URL'];
    if (influxUrl) {
      extraArgs.push('--out', `influxdb=${influxUrl}`);
    }

    // Distributed identity tags: machine + shared runId (+ testId in distributed
    // mode) so the merge can attribute every point to (machine, run, test). Legacy
    // K6_PERF_MACHINE-only runs keep exactly their prior machine+runId tags.
    const distMachine = process.env.K6_PERF_MACHINE;
    if (distributed || distMachine) {
      const machineName = distMachine || os.hostname();
      extraArgs.push('--tag', `machine=${machineName}`, '--tag', `runId=${runId}`);
      if (distributed) {
        extraArgs.push('--tag', `testId=${testId}`);
        // Enable k6's local REST API so mid-test graceful stop can PATCH /v1/status.
        // (This k6 build does not expose it by default.) Same address k6ApiStop uses.
        extraArgs.push('--address', process.env.K6_PERF_K6_API || '127.0.0.1:6565');
      }
    }

    // Execution provenance for the report's "How this test was invoked" panel.
    // Captures the three pieces the framework assembles to drive k6: the exact
    // CLI command, the generated combined entry script (re-exports each
    // journey's default under its scenario exec name + handleSummary), and the
    // resolved k6 options/scenarios passed via --config. Lets users see how the
    // test plan was translated into a real k6 invocation. `--config` path mirrors
    // what PipelineRunner writes under .k6-temp.
    const optionsFileNameForReport = `resolved-options-${runId.replace(/[^a-zA-Z0-9_]/g, '_')}.json`;
    const executionDetails = {
      command: ['k6 run', entryScriptPath, '--config', path.join('.k6-temp', optionsFileNameForReport), ...extraArgs].join(' '),
      entryScript: entryCode,
      options: k6Options,
    };

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
    // Distributed start barrier (opt-in via K6_PERF_START_AT): wait for the shared
    // wall-clock start so all LGs ramp together. No-op when unset.
    await awaitScheduledStart();
    const k6StartTime = new Date().toISOString();
    const txnNamesForLive = runtimeEnv.K6_PERF_TRANSACTION_NAMES
      ? (JSON.parse(runtimeEnv.K6_PERF_TRANSACTION_NAMES) as string[])
      : [];
    const liveRuntime = new RuntimeConfigManager(resolvedConfig.runtime);
    const liveDisplay = txnNamesForLive.length > 0
      ? startLiveTransactionDisplay(metricsStreamPath, txnNamesForLive, liveRuntime.getTransactionStats(), runLogPath)
      : null;
    // Pretty-print script console.log/warn/error and k6 framework errors in
    // real time as k6 writes them to the run log file. Replaces the previous
    // post-run summary panel so output appears LIVE, not after the run.
    // FileWriteSink consumes writeData() lines from the same live log stream and
    // writes them under the run output dir as the test runs (Proposal 7).
    const fileWriteSink = new FileWriteSink(reportDir);
    // Write errors.ndjson / warnings.ndjson LIVE off the same console tap. The
    // final finalizeRunArtifacts pass overwrites them with the complete merged
    // set; until then they fill in real time as failures occur.
    const liveEventLog = new LiveEventLogWriter(
      path.join(reportDir, 'errors.ndjson'),
      path.join(reportDir, 'warnings.ndjson'),
    );
    liveEventLog.start();
    const liveConsole = startLiveConsoleLogStream(runLogPath, (m) => {
      liveEventLog.consume(m);
      return fileWriteSink.consume(m);
    });

    // Per-request CSV log (one row per HTTP request) tailed live from the json
    // stream. Filename: <testId>_<host>_request_metric.csv. Gated by the same
    // K6_PERF_REQUEST_LOG toggle that enables the vu/iter system tags above.
    let requestLog: RequestMetricLogWriter | null = null;
    let transactionLog: TransactionMetricLogWriter | null = null;
    let liveHeartbeat: LiveStatusHeartbeat | null = null;
    let controlWatcher: ControlWatcher | null = null;
    let k6Child: ChildProcess | null = null;
    let controlResult: 'aborted' | 'stopped' | null = null;
    if (requestLogEnabled || transactionLogEnabled) {
      const hostName = process.env.K6_PERF_MACHINE || os.hostname();
      // testId is resolved once at action scope (used for the k6 tag + these filenames).
      const safe = (s: string) => s.replace(/[^a-zA-Z0-9_.-]/g, '_');
      if (requestLogEnabled) {
        const requestLogPath = path.join(reportDir, `${safe(testId)}_${safe(hostName)}_request_metric.csv`);
        requestLog = new RequestMetricLogWriter(metricsStreamPath, requestLogPath, { testId, hostName });
        requestLog.start();
      }
      if (transactionLogEnabled) {
        const transactionLogPath = path.join(reportDir, `${safe(testId)}_${safe(hostName)}_transaction_metric.csv`);
        transactionLog = new TransactionMetricLogWriter(metricsStreamPath, transactionLogPath, { testId, hostName });
        transactionLog.start();
        // Distributed live heartbeat: push a light status file to the share so the
        // controller's `monitor` can render a combined live view. Needs a share.
        if (distributed) {
          const collectDir = process.env.K6_PERF_COLLECT_DIR;
          if (collectDir) {
            liveHeartbeat = new LiveStatusHeartbeat({
              machine: hostName, runId, testId, csvPath: transactionLogPath,
              liveDir: path.join(path.resolve(collectDir), runId, 'live'),
              stats: resolvedConfig.runtime.reporting.transactionStats,
            });
            liveHeartbeat.start();
            // Mid-test control: poll <share>/control_<runId>/control.json and act.
            controlWatcher = new ControlWatcher({
              controlDir: controlDirFor(collectDir, runId),
              onAbort: () => {
                controlResult = 'aborted';
                Logger.warning('[control] ABORT received — terminating k6 now');
                liveHeartbeat?.setState('aborting');
                if (k6Child?.pid) killProcessTree(k6Child.pid);
              },
              onStop: (effMs) => {
                const waitMs = Math.max(0, effMs - Date.now());
                Logger.warning(`[control] STOP received — graceful stop in ${Math.round(waitMs / 1000)}s`);
                liveHeartbeat?.setState('stopping');
                setTimeout(async () => {
                  controlResult = 'stopped';
                  const ok = await k6ApiStop();
                  if (!ok && k6Child?.pid) {
                    Logger.warning('[control] k6 REST stop failed — killing k6');
                    killProcessTree(k6Child.pid);
                  }
                }, waitMs);
              },
            });
            controlWatcher.start();
          } else {
            Logger.warning('[distributed] K6_PERF_COLLECT_DIR not set — live status heartbeat disabled (no share to write to).');
          }
        }
      }
    }
    try {
      // No onLine → stdio is fully inherited → k6's live progress bar renders correctly.
      // Snapshot events are captured via --log-output file=... and parsed post-run.
      runResult = await PipelineRunner.executeAsync({
        scriptPath: entryScriptPath,
        k6Options,
        extraK6Args: extraArgs,
        env: runtimeEnv,
        reportDir,
        runId,
        runManifestPath,
        onChild: (c: ChildProcess) => { k6Child = c; },
      });
    } finally {
      liveConsole.stop();
      if (liveDisplay) liveDisplay.stop();
      if (controlWatcher) controlWatcher.stop();
      // Final heartbeat state reflects any mid-test control action.
      if (liveHeartbeat) liveHeartbeat.stop(controlResult === 'aborted' ? 'aborted' : controlResult === 'stopped' ? 'stopped' : 'done');
      if (requestLog) {
        requestLog.stop(); // final sweep flushes samples written after the last poll
        Logger.detail(`Per-request log: ${requestLog.rowCount} request(s) → ${path.basename(requestLog.path)}`);
      }
      if (transactionLog) {
        transactionLog.stop(); // final sweep flushes samples written after the last poll
        Logger.detail(`Per-transaction log: ${transactionLog.rowCount} transaction(s) → ${path.basename(transactionLog.path)}`);
      }
      // Reconcile any writeData lines the live tail missed (fast runs flush last).
      fileWriteSink.flushFromLog(runLogPath);
      if (fileWriteSink.fileCount > 0) {
        Logger.detail(`Data files written (writeData): ${fileWriteSink.fileCount} file(s), ${fileWriteSink.writeCount} write(s)`);
      }
      // Parse and persist snapshots from the mirrored log file
      parseAndFlushSnapshots(runLogPath, reportDir);
      await hostSampler.stop();
      if (resolvedConfig.runtime.monitoring.enabled) {
        hostSnapshots.push(await HostMonitor.captureSnapshot());
      }
      cleanupEntryScript();
      process.removeListener('exit', cleanupEntryScript);
      process.removeListener('SIGINT', forceExitHandler);
      process.removeListener('SIGTERM', forceExitHandler);
    }
    const k6EndTime = new Date().toISOString();
    if (controlResult === 'stopped') Logger.warning('Run STOPPED early (graceful) — report reflects the shorter window (STOPPED-EARLY).');
    else if (controlResult === 'aborted') Logger.warning('Run ABORTED — artifacts are partial (INVALID).');

    const generatedArtifacts = await finalizeRunArtifacts({
      runId,
      reportDir,
      plan,
      resolvedConfig,
      runStatus: runResult.status,
      distributed,
      hostSnapshots,
      k6StartTime,
      k6EndTime,
      transactionNames: txnNamesForLive,
      execution: executionDetails,
    });

    Logger.pass(distributed ? 'Run artifacts generated (distributed: per-machine HTML suppressed)' : 'Unified report artifacts generated');
    if (!distributed) Logger.detail(`Unified HTML report: ${generatedArtifacts.runReportHtml}`);
    Logger.detail(`Transaction metrics: ${generatedArtifacts.transactionMetricsJson}`);
    Logger.detail(`CI summary: ${generatedArtifacts.ciSummaryJson}`);

    if (generatedArtifacts.transactionMetrics) {
      printTransactionTable(generatedArtifacts.transactionMetrics);
    }

    // Distributed collect (opt-in via K6_PERF_COLLECT_DIR): after the local run is
    // fully written, copy this machine's result folder into the shared location at
    // <collectDir>/shared_<runId>/<machineName>/. A one-shot post-run copy (no live
    // shared writes). machineName defaults to the OS hostname when unset.
    const collectDir = process.env.K6_PERF_COLLECT_DIR;
    if (collectDir) {
      const machineName = process.env.K6_PERF_MACHINE || os.hostname();
      try {
        const dest = collectRunDir(reportDir, runId, machineName, collectDir);
        Logger.pass(`Collected results to shared location: ${dest}`);
      } catch (err) {
        Logger.warn(`[collect] copy to shared location failed (non-fatal): ${(err as Error).message}`);
      }
    }

    PipelineRunner.ensureSuccess(runResult);
  });

async function runPlanDebugMode(plan: TestPlan, resolvedConfig: ResolvedConfig, passthroughArgs: string[] = []): Promise<void> {
  const debugSettings = plan.debug ?? { enabled: false };
  const baseDir = debugSettings.reportDir
    ? path.resolve(process.cwd(), debugSettings.reportDir)
    : path.join(process.cwd(), 'results', 'debug');
  const safePlanName = plan.name.replace(/[^a-zA-Z0-9_]/g, '_');
  const override = new RuntimeConfigManager(resolvedConfig.runtime).shouldOverrideExistingResults();
  // Override → reuse a single stable folder (wiped each run); otherwise a fresh
  // timestamped folder per run so debug history is preserved.
  const runDir = override
    ? path.join(baseDir, safePlanName, 'Run_latest')
    : path.join(baseDir, safePlanName, `Run_${new Date().toISOString().replace(/[-:.]/g, '_')}`);

  if (override && fs.existsSync(runDir)) {
    fs.rmSync(runDir, { recursive: true, force: true });
  }
  fs.mkdirSync(runDir, { recursive: true });

  const journeyCount = plan.user_journeys.length;
  Logger.pass(`Debug mode · ${journeyCount} journey(s) · ${debugSettings.vus ?? 1} VU(s) · ${debugSettings.iterations ?? 1} iteration(s) each`);
  Logger.detail(`Output: ${runDir}\n`);

  const failures: string[] = [];
  const journeyProgress = new ProgressBar('Debug journeys', plan.user_journeys.length);

  for (const journey of plan.user_journeys) {
    try {
      journeyProgress.update(journeyProgress.current, journey.name);
      const result = await runJourneyDebug(plan, journey, runDir, resolvedConfig, passthroughArgs);
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

function runJourneyDebug(plan: TestPlan, journey: UserJourney, runDir: string, resolvedConfig: ResolvedConfig, passthroughArgs: string[] = []) {
  const safeJourneyName = journey.name.replace(/[^a-zA-Z0-9_]/g, '_');
  const outHtmlPath = path.join(runDir, `${safeJourneyName}.diff.html`);
  const replayLogPath = path.join(runDir, `${safeJourneyName}.replay-log.json`);

  const runtime = new RuntimeConfigManager(resolvedConfig.runtime);
  return ReplayRunner.runDebug({
    scriptPath: journey.scriptPath,
    recordingLogPath: journey.recordingLogPath,
    outHtmlPath,
    replayLogPath,
    vus: plan.debug?.vus ?? 1,
    iterations: plan.debug?.iterations ?? 1,
    noCookiesReset: plan.noCookiesReset,
    teamEnvironments: resolvedConfig.environment.testSuites,
    errorBehavior: runtime.getErrorBehavior(),
    extraK6Args: passthroughArgs,
    transactionStats: runtime.getTransactionStats(),
    // Forward the FULL runtime block so debug honors the same http (timeout /
    // redirects / throwOnError), thinkTime, pacing and snapshot settings as a
    // load run. Without this, debug ran with redirects off / no timeout and
    // could pass scripts that fail under load (see redirect-following parity).
    runtimeMetadata: buildRuntimeMetadataBlock(resolvedConfig),
  });
}

// Flags the framework always injects into the k6 command itself.
// Passing them again via CLI passthrough would silently override framework
// internals (--config discards all built scenarios; --summary-export loses
// the post-run JSON that reporting depends on).
const FRAMEWORK_OWNED_FLAGS = new Set(['--config', '--summary-export']);

function filterPassthroughArgs(args: string[]): string[] {
  const filtered: string[] = [];
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    const flagKey = arg.startsWith('--')
      ? (arg.includes('=') ? arg.slice(0, arg.indexOf('=')) : arg)
      : null;
    if (flagKey && FRAMEWORK_OWNED_FLAGS.has(flagKey)) {
      Logger.warn(`Ignoring passthrough flag '${arg}' — managed by the framework.`);
      // Standalone form (--flag value or --flag =value): skip the next token too
      if (!arg.includes('=') && i + 1 < args.length && !args[i + 1].startsWith('-')) {
        i += 2;
      } else {
        i += 1;
      }
      continue;
    }
    // Merge "--flag =value" (space before =) into "--flag=value" so k6 doesn't
    // interpret "=value" as a second positional script argument.
    if (flagKey && !arg.includes('=') && i + 1 < args.length && args[i + 1].startsWith('=')) {
      filtered.push(arg + args[i + 1]);
      i += 2;
      continue;
    }
    filtered.push(arg);
    i++;
  }
  return filtered;
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

function getEntryScriptDirectory(journeys: UserJourney[]): string {
  const scriptDirs = Array.from(
    new Set(journeys.map((journey) => path.dirname(path.resolve(process.cwd(), journey.scriptPath)))),
  );

  if (scriptDirs.length === 1) {
    return scriptDirs[0];
  }

  return path.join(process.cwd(), '.k6-temp');
}

function toImportSpecifier(fromDir: string, targetPath: string): string {
  const relativePath = path.relative(fromDir, path.resolve(process.cwd(), targetPath)).replace(/\\/g, '/');
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

function prepareRunArtifacts(plan: TestPlan, resolvedConfig: ResolvedConfig): {
  reportDir: string;
  safeReportDir: string;
  runId: string;
  runManifestPath: string;
} {
  const baseDir = resolvedConfig.secrets['K6_RESULTS_BASE_DIR'] || 'results';
  const safePlanName = plan.name.replace(/[^a-zA-Z0-9_]/g, '_');
  const override = new RuntimeConfigManager(resolvedConfig.runtime).shouldOverrideExistingResults();
  // With override on, reuse a single stable folder (wiped each run); otherwise
  // create a fresh timestamped folder so run history is preserved.
  // Distributed runs need a SHARED runId across machines so every LG's local result
  // folder carries the same id and `collect` groups them. Resolution order:
  //   1. explicit K6_PERF_RUN_ID (set the same value on every machine), else
  //   2. derived from the shared K6_PERF_START_AT (already identical on all machines,
  //      so the runId falls out identically with no extra coordination), else
  //   3. a fresh timestamped id (single-machine / non-distributed).
  // Normalize the shared start time into the same ISO-underscore shape used by the
  // fallback timestamp so both branches yield the same folder pattern. Parsing then
  // re-serializing to ISO also canonicalizes it (UTC, ms), so every machine derives
  // an identical runId regardless of how the operator wrote K6_PERF_START_AT.
  // Only derive the runId from K6_PERF_START_AT while it is still upcoming: once
  // that instant has passed the start barrier no longer waits, so reusing the
  // stale scheduled time would collide every subsequent run into one folder.
  // A past start time therefore falls through to the fresh current-time id below.
  const startAtMs = Date.parse(process.env.K6_PERF_START_AT || '');
  const startAtId = Number.isFinite(startAtMs) && startAtMs >= Date.now()
    ? `Run_${new Date(startAtMs).toISOString().replace(/[-:.]/g, '_')}`
    : null;
  const runId = process.env.K6_PERF_RUN_ID
    || startAtId
    || (override ? 'Run_latest' : `Run_${new Date().toISOString().replace(/[-:.]/g, '_')}`);
  // Use resolve (not join) so an absolute K6_RESULTS_BASE_DIR is honored as-is;
  // a relative value still resolves against the framework cwd.
  const reportDir = path.resolve(process.cwd(), baseDir, safePlanName, runId);

  if (override && fs.existsSync(reportDir)) {
    fs.rmSync(reportDir, { recursive: true, force: true });
  }
  fs.mkdirSync(reportDir, { recursive: true });

  return {
    reportDir,
    safeReportDir: reportDir.replace(/\\/g, '/'),
    runId,
    runManifestPath: path.join(reportDir, 'run-manifest.json'),
  };
}

/**
 * Build the `runtime` block injected into K6_PERF_RUNTIME_METADATA — the single
 * source of truth the in-script runtime (request.ts / lifecycle.ts /
 * transaction.ts) reads for errorBehavior, thinkTime, pacing, http
 * (timeout/redirects/throwOnError), reporting and snapshot config.
 *
 * Shared by the load path (buildScenarioRuntimeMetadata) AND the debug path
 * (runJourneyDebug) so debug honors EXACTLY the same runtime settings as load.
 * That parity is intentional: debug exists to validate script behavior and
 * shake out load-test scenarios, so it must follow redirects, time out, pace
 * and think-time identically to load — otherwise a script can pass in debug and
 * fail under load purely because debug used different HTTP semantics.
 */
function buildRuntimeMetadataBlock(resolvedConfig: ResolvedConfig): ScenarioRuntimeMetadata['runtime'] {
  const runtime = new RuntimeConfigManager(resolvedConfig.runtime);
  return {
    errorBehavior: runtime.getErrorBehavior(),
    thinkTime: {
      mode: resolvedConfig.runtime.thinkTime.mode,
      fixed: resolvedConfig.runtime.thinkTime.fixed,
      min: resolvedConfig.runtime.thinkTime.min,
      max: resolvedConfig.runtime.thinkTime.max,
    },
    pacing: runtime.getPacingRuntimeConfig(),
    http: {
      timeoutMs: runtime.getTimeoutMs(),
      maxRedirects: runtime.getMaxRedirects(),
      throwOnError: runtime.shouldThrowOnError(),
    },
    reporting: {
      transactionStats: runtime.getTransactionStats(),
      includeTransactionTable: runtime.shouldIncludeTransactionTable(),
      includeErrorTable: runtime.shouldIncludeErrorTable(),
      timeseriesEnabled: runtime.isTimeseriesEnabled(),
      timeseriesBucketSizeSeconds: runtime.getTimeseriesBucketSizeSeconds(),
    },
    errors: {
      captureSnapshotOnFailure: runtime.shouldCaptureSnapshotOnFailure(),
      maxSnapshotsPerRun: runtime.getMaxSnapshotsPerRun(),
      includeRequestHeaders: runtime.shouldIncludeRequestHeadersInSnapshots(),
      includeRequestBody: runtime.shouldIncludeRequestBodyInSnapshots(),
      includeResponseHeaders: runtime.shouldIncludeResponseHeadersInSnapshots(),
      includeResponseBody: runtime.shouldIncludeResponseBodyInSnapshots(),
    },
  };
}

function buildScenarioRuntimeMetadata(
  plan: TestPlan,
  resolvedConfig: ResolvedConfig,
  runId: string,
  safeReportDir: string,
): ScenarioRuntimeMetadata {
  const journeyTransactionNames = extractJourneyTransactionNames(plan);

  return {
    runId,
    planName: plan.name,
    environment: plan.environment,
    executionMode: plan.execution_mode,
    reportDir: safeReportDir,
    generatedAt: new Date().toISOString(),
    journeyTransactionNames,
    runtime: buildRuntimeMetadataBlock(resolvedConfig),
  };
}

function buildRunEnvironment(
  plan: TestPlan,
  resolvedConfig: ResolvedConfig,
  runId: string,
  safeReportDir: string,
  runManifestPath: string,
): Record<string, string> {
  const transactionNames = collectUniqueTransactionNames(extractJourneyTransactionNames(plan));

  // Optional .env overrides surfaced to the VU runtime. Base URLs normally come
  // from config/environments/*.json (K6_PERF_TEAM_ENVIRONMENTS); K6_BASE_URL is
  // an optional global fallback consumed by session.ts (resolvePath/auto-register).
  // K6_API_KEY is exposed via getApiKey() for scripts that need an auth header.
  const baseUrlOverride = resolvedConfig.secrets['K6_BASE_URL'];
  const apiKey = resolvedConfig.secrets['K6_API_KEY'];

  return {
    K6_PERF_RUN_ID: runId,
    K6_PERF_PLAN_NAME: plan.name,
    K6_PERF_ENVIRONMENT: plan.environment,
    K6_PERF_EXECUTION_MODE: plan.execution_mode,
    K6_PERF_REPORT_DIR: safeReportDir,
    K6_PERF_RUN_MANIFEST_PATH: runManifestPath.replace(/\\/g, '/'),
    K6_PERF_TEAM_ENVIRONMENTS: JSON.stringify(resolvedConfig.environment.testSuites || {}),
    ...(transactionNames.length > 0
      ? { K6_PERF_TRANSACTION_NAMES: JSON.stringify(transactionNames) }
      : {}),
    ...(baseUrlOverride ? { K6_PERF_BASE_URL: baseUrlOverride } : {}),
    ...(apiKey ? { K6_PERF_API_KEY: apiKey } : {}),
  };
}

function extractJourneyTransactionNames(plan: TestPlan): Record<string, string[]> {
  const journeyTransactionNames: Record<string, string[]> = {};

  for (const journey of plan.user_journeys) {
    const resolvedScriptPath = path.isAbsolute(journey.scriptPath)
      ? journey.scriptPath
      : path.resolve(journey.scriptPath);

    if (!fs.existsSync(resolvedScriptPath)) {
      continue;
    }

    const source = fs.readFileSync(resolvedScriptPath, 'utf-8');
    const names = extractTransactionNamesFromSource(source);
    if (names.length > 0) {
      journeyTransactionNames[journey.name] = names;
    }
  }

  return journeyTransactionNames;
}

function collectUniqueTransactionNames(journeyTransactionNames: Record<string, string[]>): string[] {
  const unique = new Set<string>();

  for (const names of Object.values(journeyTransactionNames)) {
    for (const name of names) {
      unique.add(name);
    }
  }

  return [...unique];
}

function extractTransactionNamesFromSource(source: string): string[] {
  const matches = new Set<string>();
  const patterns = [
    /transaction\(\s*(['"`])([^'"`]+)\1\s*,/g,
    /startTransaction\(\s*(['"`])([^'"`]+)\1\s*\)/g,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) {
      const name = match[2]?.trim();
      if (name) {
        matches.add(name);
      }
    }
  }

  return [...matches];
}

function writeRunManifest(
  runManifestPath: string,
  plan: TestPlan,
  resolvedConfig: ResolvedConfig,
  scenarioMetadata: ScenarioRuntimeMetadata,
  dist?: { distributed: boolean; role?: string; machine: string; testId: string },
): void {
  const reportDir = path.dirname(runManifestPath).replace(/\\/g, '/');
  const manifest = {
    runId: scenarioMetadata.runId,
    generatedAt: scenarioMetadata.generatedAt,
    // Distributed identity — the merge validates these agree across machines.
    testId: dist?.testId,
    ...(dist?.distributed ? { distributed: true, role: dist.role || undefined, machine: dist.machine } : {}),
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
      testSuites: resolvedConfig.environment.testSuites,
    },
  };

  fs.writeFileSync(runManifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
}

/**
 * Extract percentile numbers from a transactionStats list (e.g. ["avg","p(90)",
 * "p(99)"] → [90, 99]). Used to tell the timeseries parser which percentile
 * lines the report should plot. p90 is always added by the parser.
 */
/**
 * Stream the raw k6 metrics JSON and rank individual requests by p90 response
 * time. Each `http_req_duration` Point carries a `name` tag (set by request());
 * we group durations by that name, compute p90/avg/max/count per request, and
 * return the slowest `topN` by p90. Single pass; values are held in memory per
 * request name — fine for typical runs, heavier for very large ones.
 */
async function computeTopRequestsByP90(
  streamPath: string,
  topN = 5,
): Promise<Array<{ name: string; method: string; transaction: string; url: string; count: number; p90: number; avg: number; min: number; max: number }>> {
  if (!fs.existsSync(streamPath) || fs.statSync(streamPath).size === 0) return [];
  interface Acc { values: number[]; method: string; transaction: string; url: string; }
  const byName = new Map<string, Acc>();
  const stream = fs.createReadStream(streamPath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  try {
    for await (const line of rl) {
      // Cheap pre-filter before JSON.parse — most lines aren't http_req_duration.
      if (line.indexOf('"http_req_duration"') === -1 || line.indexOf('"Point"') === -1) continue;
      let p: { metric?: string; data?: { value?: number; tags?: Record<string, string> } };
      try { p = JSON.parse(line); } catch { continue; }
      if (p.metric !== 'http_req_duration') continue;
      const tags = p.data?.tags ?? {};
      const name = tags.name;
      const value = p.data?.value;
      if (!name || typeof value !== 'number') continue;
      let acc = byName.get(name);
      if (!acc) {
        // k6 aggregates HTTP metrics by the `name` tag, replacing the `url` tag
        // with the name to bound cardinality — so `tags.url` equals the name for
        // framework requests. We keep method + transaction (genuinely useful) and
        // a best-effort url tag (falls back to name).
        acc = { values: [], method: tags.method || '', transaction: tags.transaction || tags.group || '', url: tags.url || name };
        byName.set(name, acc);
      }
      acc.values.push(value);
    }
  } catch { /* unreadable stream — return what we have */ }
  finally { rl.close(); stream.close(); }

  // Linear interpolation between closest ranks — matches k6's TrendSink.P and the
  // report's other percentiles. Nearest-rank would collapse p90 onto max for small
  // samples (e.g. n=6 → ceil(0.9·6)-1 = 5 = last element), so we interpolate instead.
  const pctl = (sorted: number[], p: number): number => {
    const n = sorted.length;
    if (n === 0) return 0;
    if (n === 1) return sorted[0];
    const idx = (p / 100) * (n - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  };
  const rows = [...byName.entries()].map(([name, acc]) => {
    const sorted = acc.values.slice().sort((a, b) => a - b);
    const sum = sorted.reduce((s, v) => s + v, 0);
    return {
      name,
      method: acc.method,
      transaction: acc.transaction.replace(/^::/, ''),
      url: acc.url,
      count: sorted.length,
      p90: Math.round(pctl(sorted, 90)),
      avg: Math.round(sum / sorted.length),
      min: Math.round(sorted[0]),
      max: Math.round(sorted[sorted.length - 1]),
    };
  });
  rows.sort((a, b) => b.p90 - a.p90 || b.max - a.max);
  return rows.slice(0, topN);
}

function percentilesFromStats(stats: string[]): number[] {
  const out = new Set<number>();
  for (const s of stats) {
    const m = /^p\(?(\d+(?:\.\d+)?)\)?$/i.exec(String(s).trim());
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n) && n > 0 && n < 100) out.add(n);
    }
  }
  return [...out].sort((a, b) => a - b);
}

async function finalizeRunArtifacts(options: {
  runId: string;
  reportDir: string;
  plan: TestPlan;
  resolvedConfig: ResolvedConfig;
  runStatus: number;
  /** Distributed mode: suppress the per-machine custom RunReport.html (the merge produces the single report). */
  distributed?: boolean;
  hostSnapshots: HostSnapshot[];
  k6StartTime?: string;
  k6EndTime?: string;
  /**
   * Transaction-name manifest (the same array fed to `K6_PERF_TRANSACTION_NAMES`).
   * Lets the post-run time-series parser distinguish per-transaction Trend/
   * Counter/Rate metric points from unrelated user-defined metrics.
   */
  transactionNames?: string[];
  /**
   * Execution provenance (k6 command, generated entry script, resolved
   * options/scenarios) surfaced in the report so users can see how the test
   * plan was turned into a real k6 invocation. Optional — older callers omit it.
   */
  execution?: { command: string; entryScript: string; options: unknown };
}): Promise<{
  runReportHtml: string;
  transactionMetricsJson: string;
  errorsNdjson: string;
  warningsNdjson: string;
  ciSummaryJson: string;
  timeseriesJson: string;
  systemMetricsJson: string;
  transactionMetrics?: import('../types/ReportingContracts').TransactionMetricsFile;
}> {
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
  // Hoisted from later in the function — `summaryMetricsAny` is read by
  // both the Wave 3 error-pipeline expansion (threshold breaches → errors)
  // and the Summary tab data build. Declaring once here avoids reading the
  // metrics map twice and keeps the threshold-iteration order deterministic.
  const summaryMetricsAny = (summaryData.metrics ?? {}) as Record<string, {
    thresholds?: Record<string, boolean | { ok?: boolean }>;
    values?: Record<string, number>;
  }>;

  const runtime = new RuntimeConfigManager(options.resolvedConfig.runtime);
  const journeyName = options.plan.user_journeys.length === 1 ? options.plan.user_journeys[0].name : 'all';
  const transactionMetrics = TransactionMetricsBuilder.build({
    runId: options.runId,
    stats: runtime.getTransactionStats(),
    journeyName,
    summaryData: summaryData as any,
  });

  // Pass/fail is always exact: the per-iteration `<name>_checkrate` Rate metric
  // backs every transaction (the pre-flight ScriptContractGuard rejects the raw
  // check()/group() shapes that used to need native-check estimation), so there
  // is no estimated-pass/fail provenance warning any more.
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

  // Wave 3: merge k6-side `[k6-perf][error-event]` / `[k6-perf][warning-event]`
  // markers emitted by transaction.ts / request.ts (check failures, caught
  // exceptions, snapshot cap-hit). Without this merge, those failures only
  // existed in the raw k6 log and never made it to the report's Errors /
  // Warnings tabs.
  const runLogPath = path.join(options.reportDir, 'k6-run.log');
  const k6Events = extractK6PerfEvents(runLogPath);
  // `check_failed` events are per-occurrence and carry the request + script
  // location; they supersede the aggregate `assertion_failed` rows derived from
  // k6's check summary. When present, drop the aggregates so the same failures
  // aren't listed twice (once detailed, once summarized).
  if (k6Events.errors.some((e) => e.type === 'check_failed')) {
    const errs = eventArtifacts.errors as unknown as Array<Record<string, unknown>>;
    (eventArtifacts as unknown as { errors: Array<Record<string, unknown>> }).errors =
      errs.filter((e) => e.type !== 'assertion_failed');
  }
  if (k6Events.errors.length > 0) {
    // Cast loosely — these payloads were produced by the k6 side and may have
    // arbitrary extras (failingChecks[], message, etc.). The reporting bundle
    // accepts Record<string, unknown> rows for errors/warnings.
    (eventArtifacts.errors as unknown as Array<Record<string, unknown>>).push(...k6Events.errors);
  }
  if (k6Events.warnings.length > 0) {
    (eventArtifacts.warnings as unknown as Array<Record<string, unknown>>).push(...k6Events.warnings);
  }

  // Surface check/assertion failures on the console post-run — which check
  // failed, on which request, and at which script line. The live console can
  // race these out during fast runs (and the live table owns the terminal), so
  // we always print a concise summary here after the run completes.
  const checkFailures = (k6Events.errors as unknown as Array<Record<string, unknown>>)
    .filter((e) => e.type === 'check_failed' || e.type === 'transaction_error' || e.type === 'http_error');
  if (checkFailures.length > 0) {
    const MAX = 20;
    Logger.warn(`${checkFailures.length} check/request failure(s):`);
    for (const e of checkFailures.slice(0, MAX)) {
      const txn = e.transaction ? `[transaction:${e.transaction}] ` : '';
      const where = e.vu !== undefined ? `(VU ${e.vu}, iter ${e.iteration}) ` : '';
      const msg = String(e.message ?? 'failed');
      const req = e.request ? ` ${e.request}` : '';
      const loc = e.location ? `  at ${e.location}` : '';
      Logger.detail(`${txn}${where}${msg}${req}${loc}`);
    }
    if (checkFailures.length > MAX) {
      Logger.detail(`… and ${checkFailures.length - MAX} more (see the report's Errors tab / errors.ndjson)`);
    }
  }

  // Threshold breaches are surfaced as WARNINGS only (see
  // EventArtifactBuilder.collectThresholdWarningEvents) — a breached SLA is not
  // an execution error. The run's pass/fail status still reflects it via
  // ciSummary.status; keeping it out of the Errors tab avoids conflating SLA
  // breaches with genuine request/script errors. We only tally the names here
  // for a concise post-run log line.
  const breachedThresholdMetricNames: string[] = [];
  for (const [metricName, m] of Object.entries(summaryMetricsAny)) {
    for (const [rule, res] of Object.entries(m.thresholds ?? {})) {
      const breached = typeof res === 'boolean' ? res : (res as { ok?: boolean })?.ok === false;
      if (!breached) continue;
      breachedThresholdMetricNames.push(`${metricName}:${rule}`);
    }
  }
  if (breachedThresholdMetricNames.length > 0) {
    Logger.detail(`Threshold breaches surfaced as warnings: ${breachedThresholdMetricNames.slice(0, 5).join(', ')}${breachedThresholdMetricNames.length > 5 ? ` (+${breachedThresholdMetricNames.length - 5} more)` : ''}`);
  }

  const ciSummary = RunSummaryBuilder.buildCiSummary({
    runId: options.runId,
    planName: options.plan.name,
    environment: options.plan.environment,
    executionStatus: options.runStatus,
    summaryData: summaryData as any,
    transactions: transactionMetrics,
    // Transaction failure-rate budget: prefer the transaction-scoped SLA, fall
    // back to the flat/legacy global errorRate. Undefined → 0 (strict) in builder.
    transactionErrorBudget: options.plan.global_sla?.transaction?.errorRate
      ?? options.plan.global_sla?.errorRate,
  });
  ciSummary.errorCount = eventArtifacts.errors.length;
  ciSummary.warningCount = eventArtifacts.warnings.length;
  const startTime = options.k6StartTime ?? new Date().toISOString();
  const endTime = options.k6EndTime ?? new Date().toISOString();
  const reportAgents = buildReportAgents(eventArtifacts);
  const timeseries = await TimeseriesArtifactBuilder.build({
    bucketSizeSeconds: runtime.getTimeseriesBucketSizeSeconds(),
    startTime,
    endTime,
    summaryData: summaryData as any,
    transactions: transactionMetrics,
    errors: eventArtifacts.errors,
    warnings: eventArtifacts.warnings,
    agents: reportAgents,
    systemSnapshots: options.hostSnapshots,
    // Path the live-metrics tail was already reading from — re-parse it
    // post-run to build per-second buckets for the report's line charts.
    metricsStreamPath: path.join(options.reportDir, 'metrics-stream.json'),
    // Transaction manifest from the same env var the runtime auto-init uses,
    // so the parser knows which custom-named metrics are transactions.
    transactionNames: options.transactionNames,
    // Percentiles to plot on the duration graphs — taken from the configured
    // reporting.transactionStats so adding e.g. p(50) makes it appear in the
    // charts. p90 is always included by the parser.
    percentiles: percentilesFromStats(runtime.getTransactionStats()),
  });

  // Slowest individual requests by p90 — derived from the same raw metrics
  // stream (per-request `name` tag). Computed before the stream may be removed
  // below when reporting.timeseries.keepRawMetricsStream=false.
  const topRequestsByP90 = await computeTopRequestsByP90(
    path.join(options.reportDir, 'metrics-stream.json'),
    5,
  );

  // Percentiles declared in global_sla.transaction — the report renders one
  // "P(x) Compliance" pie per percentile (transactions passing vs breaching it).
  const compliancePercentiles: string[] = [];
  {
    const txnSla = options.plan.global_sla?.transaction;
    if (txnSla) {
      for (const [key, value] of Object.entries(txnSla)) {
        const m = key.match(/^p(\d+(?:\.\d+)?)$/);
        if (m && typeof value === 'number') compliancePercentiles.push(`p(${m[1]})`);
      }
    }
  }

  ArtifactWriter.writeJson(transactionMetricsPath, transactionMetrics);
  ArtifactWriter.writeNdjson(errorsPath, eventArtifacts.errors as unknown as Array<Record<string, unknown>>);
  ArtifactWriter.writeNdjson(warningsPath, eventArtifacts.warnings as unknown as Array<Record<string, unknown>>);
  ArtifactWriter.writeJson(ciSummaryPath, ciSummary);
  ArtifactWriter.writeJson(timeseriesPath, timeseries);
  ArtifactWriter.writeJson(systemMetricsPath, {
    snapshots: options.hostSnapshots,
  });

  // Distributed Phase 0 (opt-in): emit a compact, mergeable per-machine histogram
  // artifact from the same metrics stream. Off by default so normal/local runs are
  // unaffected; the distributed config turns it on. Histograms ingest 100% of the
  // data regardless of any raw cap (see design §2.4).
  if (process.env.K6_PERF_EMIT_HISTOGRAM === '1' || process.env.K6_PERF_EMIT_HISTOGRAM === 'true' || !!process.env.K6_PERF_MACHINE) {
    try {
      const histogramPath = path.join(options.reportDir, 'metrics-histogram.json');
      // Histogram bucket is a whole multiple of the counter bucket; defaults to 10s
      // until the distributed runtime setting is wired (Phase 0 config scaffold).
      const counterBucket = Math.max(1, runtime.getTimeseriesBucketSizeSeconds());
      // Adaptive histogram bucket sized from the PLANNED duration (design §2.8/§2.9):
      // fine for short/spike tests (down to the counter bucket), bounded for long
      // soaks (~600 points, capped 60s). Explicit override wins:
      // K6_PERF_HISTOGRAM_BUCKET or reporting.histogram.bucketSizeSeconds. Planned
      // duration (not actual) keeps the bucket identical across machines for merge.
      const plannedDurationSec = ScenarioBuilder.estimateTotalDurationSeconds(options.plan.global_load_profile);
      const reportingCfg = options.resolvedConfig.runtime.reporting as ({ histogram?: { bucketSizeSeconds?: number } } | undefined);
      const bucketOverride = Number(process.env.K6_PERF_HISTOGRAM_BUCKET) || reportingCfg?.histogram?.bucketSizeSeconds || undefined;
      const histBucketSeconds = HistogramArtifactBuilder.resolveBucketSeconds(counterBucket, plannedDurationSec, bucketOverride);
      const art = await HistogramArtifactBuilder.writeArtifact(
        path.join(options.reportDir, 'metrics-stream.json'),
        histogramPath,
        {
          bucketSeconds: histBucketSeconds,
          relativeAccuracy: Number(process.env.K6_PERF_HISTOGRAM_ALPHA) || 0.001,
          transactionNames: options.transactionNames,
        },
      );
      if (art) {
        Logger.detail(
          `Histogram artifact: ${Object.keys(art.transactions).length} transaction(s), ` +
          `${histBucketSeconds}s buckets, ${art.relativeAccuracy * 100}% precision`,
        );
      }
    } catch (err) {
      Logger.warn(`[histogram] emission failed (non-fatal): ${(err as Error).message}`);
    }
  }

  const snapshotsFile = path.join(options.reportDir, 'snapshots.json');
  let snapshotFiles: Array<Record<string, unknown>> = [];
  if (fs.existsSync(snapshotsFile)) {
    try {
      snapshotFiles = JSON.parse(fs.readFileSync(snapshotsFile, 'utf-8')) as Array<Record<string, unknown>>;
    } catch { /* skip malformed */ }
  }

  // Wave 3: build a structured threshold table for the Summary tab. Reads
  // every metric's `thresholds` block from handleSummary.json. `ok === true`
  // (or `boolean === false` in --summary-export style) means the threshold
  // held; otherwise it breached.
  // Storytelling enrichment (#12): parse each rule into its stat key,
  // comparison operator and limit, then look up the actual observed value
  // from the same metric's `values` block. Lets the report show
  // "Expected p(95) < 500ms · Actual 781ms · exceeded by 1.56×" instead of a
  // bare pass/fail pill. Stat keys map 1:1 to k6's value keys (avg, med,
  // min, max, p(90), p(95), p(99), rate, count, …).
  const thresholdRows: Array<{
    metric: string;
    rule: string;
    ok: boolean;
    stat?: string;
    op?: string;
    limit?: number;
    actual?: number;
  }> = [];
  for (const [metricName, m] of Object.entries(summaryMetricsAny)) {
    for (const [rule, res] of Object.entries(m.thresholds ?? {})) {
      const breached = typeof res === 'boolean' ? res : res?.ok === false;
      const parsed = /^\s*([a-zA-Z()0-9_]+)\s*(<=|>=|<|>|===|==|!=)\s*([\d.]+)\s*$/.exec(rule);
      const stat = parsed ? parsed[1] : undefined;
      const op = parsed ? parsed[2] : undefined;
      const limit = parsed ? Number(parsed[3]) : undefined;
      const actual = stat && m.values && typeof m.values[stat] === 'number' ? m.values[stat] : undefined;
      thresholdRows.push({ metric: metricName, rule, ok: !breached, stat, op, limit, actual });
    }
  }

  // Plan profile for the Summary tab. Surfaces executor + key shape fields
  // (stages, vus, iterations, rate, …) so users see "what did I just run"
  // without opening the test plan JSON. Strips function fields if any
  // serializer choked.
  const planProfile = {
    name: options.plan.name,
    environment: options.plan.environment,
    executionMode: options.plan.execution_mode,
    journeys: (options.plan.user_journeys ?? []).map((j) => ({
      name: j.name,
      scriptPath: j.scriptPath,
      weight: j.weight,
      vus: j.vus,
    })),
    globalLoadProfile: options.plan.global_load_profile,
  };

  // Runtime settings snippet — the knobs users most often want to confirm
  // matched their intent. Full config still lives in the resolved-config
  // JSON; this is a quick at-a-glance pane.
  const runtimeSnapshot = {
    thinkTime: options.resolvedConfig.runtime.thinkTime,
    pacing: options.resolvedConfig.runtime.pacing,
    http: options.resolvedConfig.runtime.http,
    errorBehavior: options.resolvedConfig.runtime.errorBehavior,
    debugMode: options.resolvedConfig.runtime.debugMode,
    reporting: {
      transactionStats: options.resolvedConfig.runtime.reporting.transactionStats,
      timeseries: options.resolvedConfig.runtime.reporting.timeseries,
    },
    errors: options.resolvedConfig.runtime.errors,
    monitoring: options.resolvedConfig.runtime.monitoring,
  };

  // Run-wide totals from the per-bucket timeseries (Proposal 5 Wave 1).
  // Falls back to k6 summary-aggregate values when the stream wasn't parsed.
  const totals = ((timeseries as unknown) as { totals?: { requests: number; iterations: number; httpFailures: number; dataReceived: number; dataSent: number } }).totals
    ?? {
      requests: (summaryMetricsAny.http_reqs?.values?.count) ?? 0,
      iterations: (summaryMetricsAny.iterations?.values?.count) ?? 0,
      httpFailures: 0,
      dataReceived: (summaryMetricsAny.data_received?.values?.count) ?? 0,
      dataSent: (summaryMetricsAny.data_sent?.values?.count) ?? 0,
    };

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
      planProfile,
      runtimeSnapshot,
      thresholds: thresholdRows,
      totals,
      topRequests: topRequestsByP90,
      compliancePercentiles,
      ...(options.execution ? { execution: options.execution } : {}),
    },
    transactions: transactionMetrics,
    timeseries,
    errors: eventArtifacts.errors as unknown as Array<Record<string, unknown>>,
    warnings: eventArtifacts.warnings as unknown as Array<Record<string, unknown>>,
    snapshots: snapshotFiles,
    system: {
      agents: reportAgents,
      snapshots: options.hostSnapshots,
    },
  };

  // Distributed LGs are headless — the single merged RunReport is produced by the
  // merge step, so skip the per-machine custom HTML here (JSON/CSV artifacts remain).
  if (!options.distributed) {
    fs.writeFileSync(runReportPath, RunReportGenerator.generate(reportBundle), 'utf-8');
  }

  // Honor `reporting.timeseries.keepRawMetricsStream` (default true). When
  // false, the raw k6 streaming JSON is removed now that the per-bucket
  // time-series artifact has been derived from it. Useful for CI runs
  // where the file would otherwise sit in storage indefinitely.
  if (!runtime.shouldKeepRawMetricsStream()) {
    const streamFile = path.join(options.reportDir, 'metrics-stream.json');
    try {
      if (fs.existsSync(streamFile)) {
        fs.rmSync(streamFile, { force: true });
        Logger.detail(`Removed raw metrics stream (reporting.timeseries.keepRawMetricsStream=false): ${streamFile}`);
      }
    } catch (err) {
      Logger.warn(`Could not remove ${streamFile}: ${(err as Error).message}`);
    }
  }

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
// Live transaction display (reads --out json stream)
// ---------------------------------------------

const LIVE_TXN_INTERVAL_MS = 5_000;

interface LiveTxnStats {
  count: number;
  total: number;
  min: number;
  max: number;
  values: number[];
  wMean: number;
  wM2: number;
  checkPasses: Map<string, number>; // checkName → cumulative pass count
  checkFails:  Map<string, number>; // checkName → cumulative fail count
  // Per-iteration pass/fail derived from the framework's `<name>_checkrate`
  // Rate metric (one Point per transaction iteration; value=1 pass, value=0
  // fail). When at least one such sample arrives, these are EXACT counts and
  // override the native-check estimate below. Without these samples (old runs
  // or scripts not using `transaction()`), the renderer falls back to the
  // max(check.fails) approximation over the `checkPasses`/`checkFails` maps.
  txnPasses: number;
  txnFails: number;
  hasRateSamples: boolean;
}

function pct(values: number[], p: number): string {
  if (!values.length) return '-';
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 1) return String(Math.round(sorted[0]));
  // Linear interpolation — matches k6's TrendSink.P and the report's percentiles.
  const idx = p * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const val = lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  return String(Math.round(val));
}

function startLiveTransactionDisplay(
  metricsStreamPath: string,
  transactionNames: string[],
  transactionStats: string[],
  _logPath: string,
): { stop: () => void } {
  const normToDisplay = new Map<string, string>();
  for (const name of transactionNames) {
    normToDisplay.set(name, name);
    normToDisplay.set(name.replace(/[^a-zA-Z0-9]+/g, '_'), name);
  }

  const stats = new Map<string, LiveTxnStats>();
  let metricsOffset = 0;
  const isTTY = process.stdout.isTTY === true;
  const useColor = isTTY && !process.env.NO_COLOR;

  // Live-table display mode. The fixed scroll-region table (below) relies on ANSI
  // DECSTBM (`\x1b[1;Nr`) + absolute cursor positioning, which xterm.js/ConPTY
  // terminals — notably the VS Code integrated terminal — mishandle: the table
  // area flickers/blanks as it fights k6's sub-second progress-bar redraws.
  // Modes via env K6_PERF_LIVE_TABLE:
  //   off        → no live table (the final table still prints after the run)
  //   scrollback → append the table to scrollback each tick (stable, no scroll region)
  //   fixed      → force the scroll-region table even in editor terminals
  //   (unset)    → auto: fixed on a real TTY, scrollback in the VS Code terminal
  const liveTableMode = (process.env.K6_PERF_LIVE_TABLE || '').trim().toLowerCase();
  if (liveTableMode === 'off') {
    return { stop: () => { /* nothing rendered live; final table prints post-run */ } };
  }
  const editorTerminal = process.env.TERM_PROGRAM === 'vscode';

  // Reserve the bottom of the terminal for the live table; confine k6's
  // output (banner + animated progress bar) to the top region via an ANSI
  // scroll region. The two never overlap. Falls back to scrollback printing
  // when stdout is not a TTY or the terminal is too short to fit both areas.
  // Both `termRows` and `tableTop` recompute on terminal resize via the
  // SIGWINCH handler installed below — without it, resizing mid-run drops the
  // table off the visible region and previous renders persist as ghost copies.
  // title + top border + header row + header separator + N data rows + bottom border
  const tableRows = transactionNames.length + 5;
  let termRows = process.stdout.rows || 40;
  // k6 needs at least ~12 rows for its banner + progress bar to remain readable.
  // Editor terminals (VS Code) flicker with the scroll-region table, so default
  // them to scrollback unless the user forces `fixed`.
  let useFixedTable = isTTY && termRows >= tableRows + 12
    && (liveTableMode === 'fixed' || (liveTableMode !== 'scrollback' && !editorTerminal));
  let tableTop = useFixedTable ? termRows - tableRows + 1 : 0;
  let scrollRegionSet = false;

  function recomputeLayout(): void {
    const newRows = process.stdout.rows || 40;
    if (newRows === termRows) return;
    termRows = newRows;
    useFixedTable = isTTY && termRows >= tableRows + 12;
    const newTableTop = useFixedTable ? termRows - tableRows + 1 : 0;
    if (newTableTop === tableTop) return;
    tableTop = newTableTop;
    // Reapply the scroll region so subsequent k6 output stays bounded above
    // the new table position. Cursor parking below is done on the next tick.
    if (scrollRegionSet && useFixedTable) {
      process.stdout.write(`\x1b[1;${tableTop - 1}r\x1b[${tableTop - 1};1H`);
    }
  }
  process.stdout.on('resize', recomputeLayout);

  function tick(): void {
    try {
      // ── Read new metric data points ──────────────────────────
      if (fs.existsSync(metricsStreamPath)) {
        const metricsSize = fs.statSync(metricsStreamPath).size;
        if (metricsSize > metricsOffset) {
          const fd = fs.openSync(metricsStreamPath, 'r');
          let buf: Buffer;
          try {
            buf = Buffer.alloc(metricsSize - metricsOffset);
            fs.readSync(fd, buf, 0, buf.length, metricsOffset);
            metricsOffset = metricsSize;
          } finally {
            fs.closeSync(fd);
          }
          for (const line of buf.toString('utf-8').split('\n')) {
            if (!line.trim()) continue;
            try {
              type StreamEntry = { type?: string; metric?: string; data?: { value?: number; tags?: Record<string, string> } };
              const entry = JSON.parse(line) as StreamEntry;
              if (entry.type !== 'Point' || typeof entry.metric !== 'string') continue;

              // ── checks metric → pass/fail counts (mirrors TransactionMetricsBuilder) ──
              if (entry.metric === 'checks') {
                const tags = entry.data?.tags;
                if (!tags?.group || typeof entry.data?.value !== 'number') continue;
                // group is "::outer::txnName" — last non-empty segment is the transaction
                const lastName = tags.group.split('::').filter(Boolean).at(-1) ?? '';
                const checkDisplay = normToDisplay.get(lastName)
                  ?? normToDisplay.get(lastName.replace(/[^a-zA-Z0-9]+/g, '_'));
                if (!checkDisplay) continue;
                const cs: LiveTxnStats = stats.get(checkDisplay) ?? {
                  count: 0, total: 0, min: Infinity, max: -Infinity,
                  values: [], wMean: 0, wM2: 0,
                  checkPasses: new Map(), checkFails: new Map(),
                  txnPasses: 0, txnFails: 0, hasRateSamples: false,
                };
                const checkName = tags.check ?? 'check';
                if (entry.data.value === 1) {
                  cs.checkPasses.set(checkName, (cs.checkPasses.get(checkName) ?? 0) + 1);
                } else {
                  cs.checkFails.set(checkName, (cs.checkFails.get(checkName) ?? 0) + 1);
                }
                stats.set(checkDisplay, cs);
                continue;
              }

              // ── per-iteration pass/fail Rate metric → exact counts ──
              // `<name>_checkrate` emits one Point per `Rate.add(...)` call
              // (value=1 pass, value=0 fail) — pushed exactly once per
              // transaction iteration from `transaction()`'s finally block.
              // When present, these are ground truth and override the native-
              // check estimate used by the renderer below.
              if (entry.metric.endsWith('_checkrate')) {
                const baseName = entry.metric.slice(0, -'_checkrate'.length);
                const rateDisplay = normToDisplay.get(baseName)
                  ?? normToDisplay.get(baseName.replace(/[^a-zA-Z0-9]+/g, '_'));
                if (!rateDisplay || typeof entry.data?.value !== 'number') continue;
                const rs: LiveTxnStats = stats.get(rateDisplay) ?? {
                  count: 0, total: 0, min: Infinity, max: -Infinity,
                  values: [], wMean: 0, wM2: 0,
                  checkPasses: new Map(), checkFails: new Map(),
                  txnPasses: 0, txnFails: 0, hasRateSamples: false,
                };
                if (entry.data.value === 1) rs.txnPasses++;
                else                        rs.txnFails++;
                rs.hasRateSamples = true;
                stats.set(rateDisplay, rs);
                continue;
              }

              // ── transaction timing metric → count + timing stats ──
              const displayName = normToDisplay.get(entry.metric);
              if (!displayName || typeof entry.data?.value !== 'number') continue;
              const v = entry.data.value;
              const s: LiveTxnStats = stats.get(displayName) ?? {
                count: 0, total: 0, min: Infinity, max: -Infinity,
                values: [], wMean: 0, wM2: 0,
                checkPasses: new Map(), checkFails: new Map(),
                txnPasses: 0, txnFails: 0, hasRateSamples: false,
              };
              s.count++;
              s.total += v;
              s.min = Math.min(s.min, v);
              s.max = Math.max(s.max, v);
              const delta = v - s.wMean;
              s.wMean += delta / s.count;
              s.wM2 += delta * (v - s.wMean);
              s.values.push(v);
              if (s.values.length > 100_000) s.values = s.values.slice(-50_000);
              stats.set(displayName, s);
            } catch { /* skip malformed */ }
          }
        }
      }

      if (stats.size === 0) return;

      if (useFixedTable) {
        // First render: install a scroll region that confines k6's banner +
        // progress bar to the rows above the table. Anything k6 prints from
        // here on stays inside rows 1..(tableTop - 1) — our table area is
        // never overwritten. Done lazily on first tick so k6 has time to draw
        // its banner before we modify terminal state.
        if (!scrollRegionSet) {
          process.stdout.write(`\x1b[1;${tableTop - 1}r`);
          // Place cursor at the bottom of the scroll region so k6's progress
          // bar continues redrawing inside it.
          process.stdout.write(`\x1b[${tableTop - 1};1H`);
          scrollRegionSet = true;
        }
        renderFixedTable(stats, transactionStats, useColor, tableTop, termRows);
      } else {
        renderScrollbackTable(stats, transactionStats, useColor);
      }
    } catch { /* file not ready yet */ }
  }

  const timer = setInterval(tick, LIVE_TXN_INTERVAL_MS);
  timer.unref();

  return {
    stop: () => {
      clearInterval(timer);
      process.stdout.off('resize', recomputeLayout);
      if (stats.size === 0) {
        if (scrollRegionSet) {
          // Reset scroll region and park cursor below the table area
          process.stdout.write(`\x1b[r\x1b[${termRows};1H\n`);
        }
        return;
      }
      if (useFixedTable && scrollRegionSet) {
        renderFixedTable(stats, transactionStats, useColor, tableTop, termRows);
        // Reset full-screen scroll region, then move cursor below the table so
        // anything that prints after (transaction summary, etc.) appears below.
        process.stdout.write(`\x1b[r\x1b[${termRows};1H\n`);
      } else {
        renderScrollbackTable(stats, transactionStats, useColor);
      }
    },
  };
}

/**
 * Build the rendered table as a list of strings (one per row). Pure helper
 * shared by both fixed-position and scrollback renderers.
 */
function buildLiveTableLines(
  stats: Map<string, LiveTxnStats>,
  transactionStats: string[],
  useColor: boolean,
): string[] {
  // Estimate failed-iteration count from native k6 check aggregates. Only
  // used when the framework's `<name>_checkrate` Rate metric is unavailable
  // (legacy data path). Imperfect — see TransactionMetricsBuilder for the
  // full discussion. This estimate can under-count (failures spread across
  // multiple checks) and over-count (a single check evaluated multiple times
  // per iteration); the cap at `count` clamps the worst over-count to "all
  // failed" rather than producing impossible values, but it's still wrong in
  // both directions on edge cases.
  const failedIterations = (s: LiveTxnStats): number => {
    if (s.checkFails.size === 0) return 0;
    let maxFails = 0;
    for (const f of s.checkFails.values()) if (f > maxFails) maxFails = f;
    return Math.min(maxFails, s.count);
  };

  type ColDef = { header: string; width: number; val: (name: string, s: LiveTxnStats) => string };
  const ALL_COLS: Record<string, ColDef> = {
    count:   { header: 'Count',   width: 7,  val: (_n, s) => String(s.count) },
    // Pass/Fail resolution mirrors TransactionMetricsBuilder so the live view
    // and the final report agree:
    //   1. PREFERRED — exact counts from the `<name>_checkrate` Rate metric.
    //      Each transaction iteration emits exactly one sample, so
    //      txnPasses + txnFails === count by construction.
    //   2. FALLBACK — estimate from native check aggregates (older runs /
    //      scripts without `transaction()`).
    pass:    { header: 'Pass',    width: 7,  val: (_n, s) => {
      if (s.hasRateSamples) return String(s.txnPasses);
      // No check data at all → assume the transaction passed (it completed)
      if (s.checkPasses.size === 0 && s.checkFails.size === 0) return String(s.count);
      return String(Math.max(0, s.count - failedIterations(s)));
    } },
    fail:    { header: 'Fail',    width: 6,  val: (_n, s) => {
      if (s.hasRateSamples) return String(s.txnFails);
      return String(failedIterations(s));
    } },
    avg:     { header: 'Avg(ms)', width: 8,  val: (_n, s) => s.count > 0 ? String(Math.round(s.total / s.count)) : '-' },
    min:     { header: 'Min(ms)', width: 8,  val: (_n, s) => s.count > 0 ? String(Math.round(s.min)) : '-' },
    max:     { header: 'Max(ms)', width: 8,  val: (_n, s) => s.count > 0 ? String(Math.round(s.max)) : '-' },
    'p(90)': { header: 'p90(ms)', width: 8,  val: (_n, s) => pct(s.values, 0.90) },
    'p(97)': { header: 'p97(ms)', width: 8,  val: (_n, s) => pct(s.values, 0.97) },
    std:     { header: 'Std(ms)', width: 8,  val: (_n, s) => s.count < 2 ? '-' : String(Math.round(Math.sqrt(s.wM2 / s.count))) },
  };

  const activeCols = transactionStats.filter((k) => ALL_COLS[k]).map((k) => ({ key: k, ...ALL_COLS[k] }));
  if (!activeCols.length) return [];

  const rows = [...stats.entries()].sort(([a], [b]) => a.localeCompare(b));
  if (!rows.length) return [];

  const c = {
    dim:   useColor ? '\x1b[2m'  : '',
    reset: useColor ? '\x1b[0m'  : '',
    cyan:  useColor ? '\x1b[36m' : '',
    bold:  useColor ? '\x1b[1m'  : '',
  };

  const txnW = Math.min(48, Math.max(11, ...rows.map(([n]) => n.length)));
  const widths = [txnW, ...activeCols.map((col) => col.width)];
  const headers = ['Transaction', ...activeCols.map((col) => col.header)];

  const lines: string[] = [];
  const now = new Date().toLocaleTimeString();
  lines.push(`${c.bold}${c.cyan}  Live Metrics  ${c.dim}[updated ${now}]${c.reset}`);
  lines.push(`  ${c.dim}┌${widths.map((w) => '─'.repeat(w + 2)).join('┬')}┐${c.reset}`);

  const hRow = headers.map((h, i) =>
    i === 0 ? ` ${h.padEnd(widths[i])} ` : ` ${h.padStart(widths[i])} `,
  ).join(`${c.dim}│${c.reset}`);
  lines.push(`  ${c.dim}│${c.reset}${c.bold}${hRow}${c.reset}${c.dim}│${c.reset}`);
  lines.push(`  ${c.dim}├${widths.map((w) => '─'.repeat(w + 2)).join('┼')}┤${c.reset}`);

  for (const [name, s] of rows) {
    const label = name.length > txnW ? name.slice(0, txnW - 1) + '…' : name;
    const cells = [
      ` ${label.padEnd(txnW)} `,
      ...activeCols.map((col) => ` ${col.val(name, s).padStart(col.width)} `),
    ].join(`${c.dim}│${c.reset}`);
    lines.push(`  ${c.dim}│${c.reset}${cells}${c.dim}│${c.reset}`);
  }

  lines.push(`  ${c.dim}└${widths.map((w) => '─'.repeat(w + 2)).join('┴')}┘${c.reset}`);
  return lines;
}

/**
 * Fixed-position rendering: the table lives at rows `tableTop..termRows`,
 * frozen below k6's scroll region. Save cursor → clear table area → draw
 * table → restore cursor, so k6's progress bar continues animating above
 * without ever touching our table area.
 */
function renderFixedTable(
  stats: Map<string, LiveTxnStats>,
  transactionStats: string[],
  useColor: boolean,
  tableTop: number,
  termRows: number,
): void {
  const lines = buildLiveTableLines(stats, transactionStats, useColor);
  if (lines.length === 0) return;

  // Single write batch: no separate "clear all rows then redraw" pass — that
  // gap was the visible flicker. Instead, for each table row we move the
  // cursor to the start, write the new content, then `\x1b[K` to clear any
  // tail from a previous longer render. If this render is SHORTER than the
  // last (e.g. terminal got taller, fewer transactions shown), tail rows
  // through `termRows` are blanked explicitly.
  //
  // Cursor save/restore uses `\x1b[s`/`\x1b[u` (SCO) instead of `\x1b7`/`\x1b8`
  // (DECSC). SCO ignores the scroll region — DECSC's behavior with scroll
  // regions varies on Windows Terminal / ConPTY and was contributing to the
  // "new copy of the table appears each tick" symptom.
  let out = '\x1b[s'; // save cursor (k6's position in its scroll region)
  for (let i = 0; i < lines.length; i++) {
    const row = tableTop + i;
    if (row > termRows) break;
    // Move to row, write content, clear to EOL — one operation, no gap.
    out += `\x1b[${row};1H${lines[i]}\x1b[K`;
  }
  // Blank any rows below the table that were occupied by a previous, longer
  // render (e.g. fewer transactions shown now).
  for (let row = tableTop + lines.length; row <= termRows; row++) {
    out += `\x1b[${row};1H\x1b[K`;
  }
  out += '\x1b[u'; // restore cursor → k6 keeps animating where it left off
  process.stdout.write(out);
}

/**
 * Fallback for non-TTY stdout or terminals too short for fixed positioning:
 * just append the latest snapshot as scrollback.
 */
function renderScrollbackTable(
  stats: Map<string, LiveTxnStats>,
  transactionStats: string[],
  useColor: boolean,
): void {
  const lines = buildLiveTableLines(stats, transactionStats, useColor);
  if (lines.length === 0) return;
  process.stdout.write('\n' + lines.join('\n') + '\n');
}

// ---------------------------------------------
// Snapshot event parser (reads k6 log file post-run)
// ---------------------------------------------

const SNAPSHOT_EVENT_PREFIX = '[k6-perf][snapshot-event] ';
const ERROR_EVENT_PREFIX = '[k6-perf][error-event] ';
const WARNING_EVENT_PREFIX = '[k6-perf][warning-event] ';

/**
 * Reads the mirrored k6 log file, extracts snapshot events emitted during the
 * run, and writes a consolidated snapshots.json to the report directory.
 */
function parseAndFlushSnapshots(runLogPath: string, reportDir: string): void {
  if (!fs.existsSync(runLogPath)) return;
  const snapshots: Array<Record<string, unknown>> = [];
  try {
    const content = fs.readFileSync(runLogPath, 'utf-8');
    for (const line of content.split('\n')) {
      const payload = extractSnapshotPayload(line);
      if (!payload) continue;
      try {
        snapshots.push(JSON.parse(payload) as Record<string, unknown>);
      } catch { /* skip malformed */ }
    }
  } catch { /* log file unreadable */ }

  if (snapshots.length === 0) return;
  try {
    fs.writeFileSync(
      path.join(reportDir, 'snapshots.json'),
      JSON.stringify(snapshots, null, 2),
      'utf-8',
    );
  } catch { /* ignore */ }
}

/**
 * Wave 3: scan the mirrored run log for any `[k6-perf][*-event]` JSON
 * payloads emitted by the k6 side (`transaction.ts` and `request.ts`) and
 * return them as structured event lists. Used by `finalizeRunArtifacts` to
 * merge per-iteration check failures, transaction exceptions, and snapshot-
 * cap warnings into the same error/warning pipelines the rest of reporting
 * consumes. Best-effort — malformed lines are skipped.
 */
function extractK6PerfEvents(runLogPath: string): {
  errors: Array<Record<string, unknown>>;
  warnings: Array<Record<string, unknown>>;
} {
  const errors: Array<Record<string, unknown>> = [];
  const warnings: Array<Record<string, unknown>> = [];
  if (!fs.existsSync(runLogPath)) return { errors, warnings };
  try {
    const content = fs.readFileSync(runLogPath, 'utf-8');
    for (const line of content.split('\n')) {
      const errPayload = extractPayloadWithPrefix(line, ERROR_EVENT_PREFIX);
      if (errPayload) {
        try { errors.push(JSON.parse(errPayload) as Record<string, unknown>); } catch { /* skip */ }
        continue;
      }
      const warnPayload = extractPayloadWithPrefix(line, WARNING_EVENT_PREFIX);
      if (warnPayload) {
        try { warnings.push(JSON.parse(warnPayload) as Record<string, unknown>); } catch { /* skip */ }
      }
    }
  } catch { /* log file unreadable */ }
  return { errors, warnings };
}

/** Same dequote logic as snapshot extraction, parameterized on the prefix. */
function extractPayloadWithPrefix(line: string, prefix: string): string | null {
  const consoleMatch = line.match(/msg="((?:\\.|[^"])*)"\s+source=console/);
  if (consoleMatch) {
    let rawMessage: string;
    try { rawMessage = JSON.parse(`"${consoleMatch[1]}"`) as string; }
    catch { rawMessage = consoleMatch[1].replace(/\\"/g, '"'); }
    const idx = rawMessage.indexOf(prefix);
    if (idx !== -1) return rawMessage.slice(idx + prefix.length).trim();
    return null;
  }
  const idx = line.indexOf(prefix);
  return idx !== -1 ? line.slice(idx + prefix.length).trim() : null;
}

function extractSnapshotPayload(line: string): string | null {
  // k6 logfmt format: level=info msg="[k6-perf][snapshot-event] {...}" source=console
  const consoleMatch = line.match(/msg="((?:\\.|[^"])*)"\s+source=console/);
  if (consoleMatch) {
    let rawMessage: string;
    try {
      rawMessage = JSON.parse(`"${consoleMatch[1]}"`) as string;
    } catch {
      rawMessage = consoleMatch[1].replace(/\\"/g, '"');
    }
    const idx = rawMessage.indexOf(SNAPSHOT_EVENT_PREFIX);
    if (idx !== -1) return rawMessage.slice(idx + SNAPSHOT_EVENT_PREFIX.length).trim();
    return null;
  }
  const idx = line.indexOf(SNAPSHOT_EVENT_PREFIX);
  return idx !== -1 ? line.slice(idx + SNAPSHOT_EVENT_PREFIX.length).trim() : null;
}

// ---------------------------------------------
// Live console-log stream → Logger
// ---------------------------------------------
// Implementation lives in `utils/LiveConsoleLogStream.ts` so both the load-
// run path (this file) and the debug-replay path (`ReplayRunner.ts`) share
// the same tailer logic.

// ---------------------------------------------
// Parse
// ---------------------------------------------

program.parse(process.argv);
