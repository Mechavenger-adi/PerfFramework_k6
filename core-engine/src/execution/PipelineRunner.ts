/**
 * PipelineRunner.ts
 * Phase 1 – Spawns the k6 process with the resolved options object.
 * Writes generated options to a temp JS file and passes it to k6.
 */

import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { K6Options } from './ParallelExecutionManager';

export interface RunOptions {
  /** Path to the k6 test script (entry point) */
  scriptPath: string;
  /** Fully resolved k6 options object */
  k6Options: K6Options;
  /** Additional CLI flags to pass to k6 (e.g. ['--out', 'json=results.json']) */
  extraK6Args?: string[];
  /** Working directory for k6 process */
  cwd?: string;
  /** Extra environment variables for the k6 process */
  env?: Record<string, string>;
  /** Capture stdout/stderr instead of inheriting them */
  captureOutput?: boolean;
  /** Logical run identifier for metadata/artifact naming */
  runId?: string;
  /** Report directory prepared by the CLI */
  reportDir?: string;
  /** Path to the generated run-manifest.json */
  runManifestPath?: string;
}

export interface PipelineRunResult {
  status: number;
  stdout: string;
  stderr: string;
  stdoutPath?: string;
  stderrPath?: string;
  optionsPath?: string;
  reportDir?: string;
  runId?: string;
  runManifestPath?: string;
}

export class PipelineRunner {
  /**
   * Execute k6 with the given options.
   * Writes options.scenarios to a temp config snippet and passes it via --config.
   */
  static run(options: RunOptions): void {
    const result = this.execute(options);
    if (result.status !== 0) {
      process.exit(result.status);
    }
  }

  /**
   * Execute k6 and return the process result. Useful for debug flows that need captured logs.
   */
  static execute(options: RunOptions): PipelineRunResult {
    const {
      scriptPath,
      k6Options,
      extraK6Args = [],
      cwd = process.cwd(),
      env = {},
      captureOutput = false,
      runId,
      reportDir,
      runManifestPath,
    } = options;

    const absScript = path.resolve(cwd, scriptPath);
    if (!fs.existsSync(absScript)) {
      throw new Error(`[PipelineRunner] Script not found: ${absScript}`);
    }

    // Write options to a temp JSON file for k6 --config
    const tempDir = path.join(cwd, '.k6-temp');
    fs.mkdirSync(tempDir, { recursive: true });
    const optionsFileName = runId
      ? `resolved-options-${runId.replace(/[^a-zA-Z0-9_\-]/g, '_')}.json`
      : 'resolved-options.json';
    const optionsFile = path.join(tempDir, optionsFileName);
    fs.writeFileSync(optionsFile, JSON.stringify(k6Options, null, 2), 'utf-8');

    if (!captureOutput) {
      Logger.info(`[PipelineRunner] Starting k6 execution...`);
      Logger.info(`  Script  : ${absScript}`);
      Logger.info(`  Journeys: ${Object.keys(k6Options.scenarios ?? {}).join(', ')}\n`);
    }

    const k6Args = [
      'run',
      absScript,
      '--config', optionsFile,
      ...extraK6Args,
    ];

    let result: childProcess.SpawnSyncReturns<string | Buffer>;
    let stdoutPath: string | undefined;
    let stderrPath: string | undefined;

    if (captureOutput) {
      const scriptName = path.basename(absScript, path.extname(absScript));
      const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      stdoutPath = path.join(tempDir, `${scriptName}_stdout_${stamp}.log`);
      stderrPath = path.join(tempDir, `${scriptName}_stderr_${stamp}.log`);
      const stdoutFd = fs.openSync(stdoutPath, 'w');
      const stderrFd = fs.openSync(stderrPath, 'w');

      try {
        result = childProcess.spawnSync('k6', k6Args, {
          stdio: ['ignore', stdoutFd, stderrFd],
          cwd,
          env: {
            ...process.env,
            ...env,
          },
        });
      } finally {
        fs.closeSync(stdoutFd);
        fs.closeSync(stderrFd);
      }
    } else {
      result = childProcess.spawnSync('k6', k6Args, {
        stdio: 'inherit',
        cwd,
        env: {
          ...process.env,
          ...env,
        },
        encoding: 'utf8',
      });

      // Cleanup temp files for normal non-captured runs
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }

    if (result.error) {
      throw new Error(`[PipelineRunner] Failed to start k6: ${result.error.message}\nMake sure k6 is installed and available in PATH.`);
    }

    return {
      status: result.status ?? 1,
      stdout: captureOutput ? '' : String(result.stdout ?? ''),
      stderr: captureOutput ? '' : String(result.stderr ?? ''),
      stdoutPath,
      stderrPath,
      optionsPath: optionsFile,
      reportDir,
      runId,
      runManifestPath,
    };
  }

  static executeAsync(options: RunOptions): Promise<PipelineRunResult> {
    const {
      scriptPath,
      k6Options,
      extraK6Args = [],
      cwd = process.cwd(),
      env = {},
      captureOutput = false,
      runId,
      reportDir,
      runManifestPath,
    } = options;

    const absScript = path.resolve(cwd, scriptPath);
    if (!fs.existsSync(absScript)) {
      return Promise.reject(new Error(`[PipelineRunner] Script not found: ${absScript}`));
    }

    const tempDir = path.join(cwd, '.k6-temp');
    fs.mkdirSync(tempDir, { recursive: true });
    const optionsFileName = runId
      ? `resolved-options-${runId.replace(/[^a-zA-Z0-9_\-]/g, '_')}.json`
      : 'resolved-options.json';
    const optionsFile = path.join(tempDir, optionsFileName);
    fs.writeFileSync(optionsFile, JSON.stringify(k6Options, null, 2), 'utf-8');

    if (!captureOutput) {
      Logger.info(`[PipelineRunner] Starting k6 execution...`);
      Logger.info(`  Script  : ${absScript}`);
      Logger.info(`  Journeys: ${Object.keys(k6Options.scenarios ?? {}).join(', ')}\n`);
    }

    const k6Args = ['run', absScript, '--config', optionsFile, ...extraK6Args];

    return new Promise((resolve, reject) => {
      const child = childProcess.spawn('k6', k6Args, {
        stdio: captureOutput ? 'pipe' : 'inherit',
        cwd,
        env: {
          ...process.env,
          ...env,
        },
      });

      let stdout = '';
      let stderr = '';

      if (captureOutput && child.stdout) {
        child.stdout.on('data', (chunk) => {
          stdout += chunk.toString();
        });
      }

      if (captureOutput && child.stderr) {
        child.stderr.on('data', (chunk) => {
          stderr += chunk.toString();
        });
      }

      child.on('error', (error) => {
        reject(new Error(`[PipelineRunner] Failed to start k6: ${error.message}\nMake sure k6 is installed and available in PATH.`));
      });

      child.on('close', (code) => {
        if (!captureOutput) {
          try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
        }

        resolve({
          status: code ?? 1,
          stdout,
          stderr,
          optionsPath: optionsFile,
          reportDir,
          runId,
          runManifestPath,
        });
      });
    });
  }

  static printCapturedOutput(result: PipelineRunResult): void {
    if (result.stdoutPath && fs.existsSync(result.stdoutPath)) {
      process.stdout.write(fs.readFileSync(result.stdoutPath, 'utf8'));
    } else if (result.stdout) {
      process.stdout.write(result.stdout);
    }

    if (result.stderrPath && fs.existsSync(result.stderrPath)) {
      process.stderr.write(fs.readFileSync(result.stderrPath, 'utf8'));
    } else if (result.stderr) {
      process.stderr.write(result.stderr);
    }
  }

  static ensureSuccess(result: PipelineRunResult): void {
    if (result.status !== 0) {
      process.exit(result.status);
    }
  }
}
