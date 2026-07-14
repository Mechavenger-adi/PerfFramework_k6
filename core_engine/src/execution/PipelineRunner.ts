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
  /** Pipe and capture stdout only; stderr is inherited (TTY) so k6's progress bar renders. Use with logOutputPath. */
  captureStdout?: boolean;
  /** Path to write k6 log output (passes --log-output file=<path>). Use with captureStdout to capture logs while stderr stays as TTY. */
  logOutputPath?: string;
  /** Called for each line of stdout/stderr (only when captureOutput is false). Used for live event interception. */
  onLine?: (line: string) => void;
  /** Logical run identifier for metadata/artifact naming */
  runId?: string;
  /** Report directory prepared by the CLI */
  reportDir?: string;
  /** Path to the generated run-manifest.json */
  runManifestPath?: string;
  /** Called with the spawned k6 child (async path only) so callers can abort/stop it. */
  onChild?: (child: childProcess.ChildProcess) => void;
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
  /** The exact k6 command line the framework launched (for report/debug traceability). */
  command?: string;
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
      ? `resolved-options-${runId.replace(/[^a-zA-Z0-9_]/g, '_')}.json`
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
      const stamp = new Date().toISOString().slice(0, 19).replace(/[-:.]/g, '_');
      stdoutPath = path.join(tempDir, `${scriptName}_stdout_${stamp}.log`);
      stderrPath = path.join(tempDir, `${scriptName}_stderr_${stamp}.log`);
      const stdoutFd = fs.openSync(stdoutPath, 'w');

      // Route k6 logs to both the terminal (so the progress bar and console.log appear)
      // and to a file (so replay log parsing can read them afterward).
      // k6 supports multiple --log-output flags simultaneously.
      const captureArgs = [
        ...k6Args,
        '--log-output', 'stderr',
        '--log-output', `file=${stderrPath}`,
      ];

      try {
        result = childProcess.spawnSync('k6', captureArgs, {
          // stdout → file for metrics summary; stderr → inherited so k6's
          // progress bar renders in the terminal and console.log is visible.
          stdio: ['ignore', stdoutFd, 'inherit'],
          cwd,
          env: {
            ...process.env,
            ...env,
          },
        });
      } finally {
        fs.closeSync(stdoutFd);
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
      captureStdout = false,
      logOutputPath,
      onLine,
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
      ? `resolved-options-${runId.replace(/[^a-zA-Z0-9_]/g, '_')}.json`
      : 'resolved-options.json';
    const optionsFile = path.join(tempDir, optionsFileName);
    fs.writeFileSync(optionsFile, JSON.stringify(k6Options, null, 2), 'utf-8');

    if (!captureOutput && !captureStdout) {
      Logger.info(`[PipelineRunner] Starting k6 execution...`);
      Logger.info(`  Script  : ${absScript}`);
      Logger.info(`  Journeys: ${Object.keys(k6Options.scenarios ?? {}).join(', ')}\n`);
    }

    // Forward slashes required for k6's --log-output file= argument on Windows.
    // We deliberately route logs ONLY to the file (no stderr) — a live tailer
    // in the calling code reads the file as it's written and pretty-prints
    // each line via the framework Logger. This avoids duplicate raw + pretty
    // output in the terminal. k6's progress bar still renders normally
    // because it does not flow through `--log-output`.
    const logPathFwd = logOutputPath ? logOutputPath.replace(/\\/g, '/') : undefined;
    const k6Args = [
      'run', absScript, '--config', optionsFile,
      ...(logPathFwd ? ['--log-output', `file=${logPathFwd}`] : []),
      ...extraK6Args,
    ];
    const k6Command = `k6 ${k6Args.join(' ')}`;

    return new Promise((resolve, reject) => {
      // stdio strategy:
      //   captureOutput=true  → fully piped (no TTY, full capture)
      //   captureStdout=true  → stdout piped (captured), stderr inherited (TTY → progress bar)
      //   onLine set          → stdout piped for line interception, stderr inherited (TTY)
      //   neither             → fully inherited (cleanest output for simple runs)
      const stdioCfg: childProcess.StdioOptions = captureOutput
        ? 'pipe'
        : (captureStdout || onLine)
          ? ['ignore', 'pipe', 'inherit']
          : 'inherit';

      const child = childProcess.spawn('k6', k6Args, {
        stdio: stdioCfg,
        cwd,
        env: {
          ...process.env,
          ...env,
        },
      });
      if (options.onChild) options.onChild(child);

      let stdout = '';
      let stderr = '';
      const stdoutBuf = { val: '' };
      const stderrBuf = { val: '' };

      function processChunk(chunk: Buffer, buf: { val: string }): void {
        if (!onLine) return;
        buf.val += chunk.toString();
        const lines = buf.val.split(/\r?\n/);
        buf.val = lines.pop() ?? '';
        for (const line of lines) onLine(line);
      }

      if (child.stdout) {
        child.stdout.on('data', (chunk: Buffer) => {
          if (captureOutput) {
            stdout += chunk.toString();
          } else if (captureStdout) {
            stdout += chunk.toString();
            process.stdout.write(chunk); // tee: live progress visible + captured for HTML report
          } else {
            process.stdout.write(chunk);
          }
          processChunk(chunk, stdoutBuf);
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (chunk: Buffer) => {
          if (captureOutput) stderr += chunk.toString();
          else if (!onLine && !captureStdout) process.stderr.write(chunk);
          processChunk(chunk, stderrBuf);
        });
      }

      child.on('error', (error) => {
        reject(new Error(`[PipelineRunner] Failed to start k6: ${error.message}\nMake sure k6 is installed and available in PATH.`));
      });

      child.on('close', (code) => {
        // Flush any partial line remaining in buffers
        if (onLine) {
          if (stdoutBuf.val) onLine(stdoutBuf.val);
          if (stderrBuf.val) onLine(stderrBuf.val);
        }

        if (!captureOutput && !captureStdout && !logOutputPath) {
          try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
        }

        resolve({
          status: code ?? 1,
          stdout,
          stderr,
          stderrPath: logOutputPath,
          optionsPath: optionsFile,
          reportDir,
          runId,
          runManifestPath,
          command: k6Command,
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
