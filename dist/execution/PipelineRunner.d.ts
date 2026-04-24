/**
 * PipelineRunner.ts
 * Phase 1 – Spawns the k6 process with the resolved options object.
 * Writes generated options to a temp JS file and passes it to k6.
 */
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
export declare class PipelineRunner {
    /**
     * Execute k6 with the given options.
     * Writes options.scenarios to a temp config snippet and passes it via --config.
     */
    static run(options: RunOptions): void;
    /**
     * Execute k6 and return the process result. Useful for debug flows that need captured logs.
     */
    static execute(options: RunOptions): PipelineRunResult;
    static executeAsync(options: RunOptions): Promise<PipelineRunResult>;
    static printCapturedOutput(result: PipelineRunResult): void;
    static ensureSuccess(result: PipelineRunResult): void;
}
//# sourceMappingURL=PipelineRunner.d.ts.map