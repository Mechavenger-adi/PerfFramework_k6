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
import { RecordingLogResolver } from '../debug/RecordingLogResolver';
import { ReplayRunner } from '../debug/ReplayRunner';
import { ParallelExecutionManager } from '../execution/ParallelExecutionManager';
import { PipelineRunner } from '../execution/PipelineRunner';
import { TestPlanLoader } from '../scenario/TestPlanLoader';
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
  .action((inputScript, team, scriptName, opts) => {
    runConvert(inputScript, team, scriptName, { inPlace: opts.inPlace });
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

    // -- Step 4: Build k6 options ---------------
    let k6Options;
    try {
      k6Options = ParallelExecutionManager.resolve(plan);
      const scenarioCount = Object.keys(k6Options.scenarios).length;
      Logger.pass(`Scenarios built: ${scenarioCount} journey(s) -> ${Object.keys(k6Options.scenarios).join(', ')}\n`);
    } catch (err) {
      Logger.fail(`Scenario build error: ${(err as Error).message}`);
      process.exit(1);
    }

    // -- Step 5: Execute via k6 -----------------
    // k6 parallel scenarios use "exec" to point to named exported functions.
    // Each journey script only exports a `default` function.
    // Solution: Generate a temporary combined entry script that re-exports
    // each journey's default function under its scenario exec name.

    const tempDir = path.join(process.cwd(), '.k6-temp');
    fs.mkdirSync(tempDir, { recursive: true });

    let entryCode = '';
    for (const journey of plan.user_journeys) {
      const execName = journey.name.replace(/[^a-zA-Z0-9_]/g, '_');
      // Use the resolved absolute path from Gatekeeper
      const absPath = path.resolve(process.cwd(), journey.scriptPath).replace(/\\/g, '/');
      entryCode += `export { default as ${execName} } from '${absPath}';\n`;
    }

    // -- Step 5.5: Setup Native Reporters -----------------
    const baseDir = resolvedConfig.secrets['K6_RESULTS_BASE_DIR'] || 'results';
    const safePlanName = plan.name.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportDir = path.join(process.cwd(), baseDir, safePlanName, `Run_${timestamp}`);
    const safeReportDir = reportDir.replace(/\\/g, '/');
    
    fs.mkdirSync(reportDir, { recursive: true });

    // Inject handleSummary for 3rd-party reporting
    entryCode += `
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export function handleSummary(data) {
    return {
        "${safeReportDir}/TestDetails.html": htmlReport(data),
    };
}
`;

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

    Logger.pass('Prepared reporting directories');
    Logger.detail(`Reports will be saved to: ${reportDir}`);
    Logger.detail('Launching k6...\n');
    PipelineRunner.run({
      scriptPath: entryScriptPath,
      k6Options,
      extraK6Args: extraArgs,
    });
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

// ---------------------------------------------
// Parse
// ---------------------------------------------

program.parse(process.argv);
