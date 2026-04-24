/**
 * GatekeeperValidator.ts
 * Phase 1 – Pre-flight checklist. Runs after config merge, before k6 is invoked.
 * Accumulates ALL failures and reports them together — not just the first one.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ResolvedConfig } from '../types/ConfigContracts';
import { TestPlan } from '../types/TestPlanSchema';

import { DataValidator } from '../data/DataValidator';
import { RecordingLogResolver } from '../debug/RecordingLogResolver';
import { Logger } from '../utils/logger';
import { PathResolver } from '../utils/PathResolver';

export interface GatekeeperResult {
  passed: boolean;
  failures: string[];
  warnings: string[];
}

export class GatekeeperValidator {
  /**
   * Run the full pre-flight checklist.
   * Returns a result object — never throws; caller decides how to handle failures.
   */
  validate(config: ResolvedConfig, plan: TestPlan, dataRoot: string): GatekeeperResult {
    const failures: string[] = [];
    const warnings: string[] = [];
    const debugEnabled = plan.debug?.enabled === true;
    const autoResolveRecordingLog = plan.debug?.autoResolveRecordingLog !== false;

    // -- 1. Environment checks ------------------
    if (!config.environment.baseUrl) {
      failures.push('[Environment] baseUrl is missing or empty.');
    }
    if (!config.environment.name) {
      failures.push('[Environment] name is missing or empty.');
    }

    // -- 2. Test plan structural checks --------
    if (!plan.user_journeys || plan.user_journeys.length === 0) {
      failures.push('[TestPlan] No user_journeys defined. At least one journey is required.');
    }

    // -- 3. Journey script files exist ---------
    for (let i = 0; i < (plan.user_journeys?.length ?? 0); i++) {
      const journey = plan.user_journeys![i];
      const resolvedPath = PathResolver.resolve(journey.scriptPath);
      if (!resolvedPath) {
        failures.push(
          `[Journey:${journey.name}] Script file not found: ${journey.scriptPath}`,
        );
      } else {
        // Update the path to absolute so execution passes
        journey.scriptPath = resolvedPath;
      }

      if (!debugEnabled) {
        continue;
      }

      const explicitRecordingLogPath = journey.recordingLogPath;
      const resolution = explicitRecordingLogPath || autoResolveRecordingLog
        ? RecordingLogResolver.resolve(
            journey.scriptPath,
            explicitRecordingLogPath,
          )
        : {
            status: 'missing' as const,
            warning: `[Journey:${journey.name}] recordingLogPath was not provided and autoResolveRecordingLog is disabled.`,
          };

      if (resolution.status === 'resolved') {
        journey.recordingLogPath = resolution.resolvedPath;
        continue;
      }

      if (resolution.status === 'ambiguous') {
        failures.push(
          `[Journey:${journey.name}] Multiple recording logs matched this script in ${resolution.recordingsDir}. ` +
          `Set recordingLogPath explicitly. Candidates: ${(resolution.candidates ?? []).join(', ')}`,
        );
        continue;
      }

      journey.recordingLogPath = undefined;
      const missingMsg = `[Journey:${journey.name}] ${resolution.warning ?? 'Recording log not found. Replay-only diff report will be generated.'}`;
      if (plan.debug?.failOnMissingRecordingLog) {
        failures.push(missingMsg);
      } else {
        warnings.push(missingMsg);
      }
    }

    // -- 4. Weight / VU checks -----------------
    if (plan.execution_mode === 'parallel') {
      const journeysWithWeight = plan.user_journeys?.filter((j) => j.weight !== undefined) ?? [];
      const weightSum = journeysWithWeight.reduce((s, j) => s + (j.weight ?? 0), 0);

      if (journeysWithWeight.length > 0 && Math.abs(weightSum - 100) > 0.01) {
        warnings.push(
          `[Execution] Journey weights sum to ${weightSum.toFixed(1)}% — expected 100%. Load will be re-distributed proportionally.`,
        );
      }
    }

    // -- 5. VU ceiling -------------------------
    if (plan.max_total_vus !== undefined) {
      const requestedVUs = this.estimateRequestedVUs(plan);
      if (requestedVUs > plan.max_total_vus) {
        failures.push(
          `[Execution] Requested ~${requestedVUs} VUs exceeds max_total_vus limit of ${plan.max_total_vus}.`,
        );
      }
    }

    // -- 6. Data directory ---------------------
    const dataRootAbs = path.resolve(process.cwd(), dataRoot);
    if (!fs.existsSync(dataRootAbs)) {
      warnings.push(`[Data] Data directory not found: ${dataRootAbs}. No data files will be loaded.`);
    }

    // -- 7. Hybrid mode config -----------------
    if (plan.execution_mode === 'hybrid' && (!plan.hybrid_groups || plan.hybrid_groups.length === 0)) {
      failures.push('[TestPlan] execution_mode is "hybrid" but no hybrid_groups are defined.');
    }

    // -- 8. Data file & column validation ------
    for (const journey of plan.user_journeys ?? []) {
      const scriptPath = journey.scriptPath;
      if (!scriptPath || !fs.existsSync(scriptPath)) continue;

      const scriptContent = fs.readFileSync(scriptPath, 'utf-8');
      const dataRefs = this.extractDataReferences(scriptContent);
      if (dataRefs.length === 0) continue;

      const scriptDir = path.dirname(scriptPath);

      for (const ref of dataRefs) {
        const absDataPath = path.resolve(scriptDir, ref.filePath);

        if (!fs.existsSync(absDataPath)) {
          failures.push(
            `[Journey:${journey.name}] Data file not found: ${ref.filePath} (resolved: ${absDataPath})`,
          );
          continue;
        }

        if (ref.columns.length > 0) {
          const result = DataValidator.validateCSV(absDataPath, ref.columns);
          if (!result.valid) {
            for (const err of result.errors) {
              failures.push(`[Journey:${journey.name}] [${ref.dataset}] ${err}`);
            }
          }
          for (const warn of result.warnings) {
            warnings.push(`[Journey:${journey.name}] [${ref.dataset}] ${warn}`);
          }
        }
      }
    }

    return {
      passed: failures.length === 0,
      failures,
      warnings,
    };
  }

  /**
   * Print the result to console in a human-readable format.
   * Returns the same result for chaining.
   */
  printResult(result: GatekeeperResult): GatekeeperResult {
    Logger.header('FRAMEWORK PRE-FLIGHT CHECKS');

    if (result.warnings.length > 0) {
      Logger.warning('WARNINGS:');
      result.warnings.forEach((w) => Logger.bullet(w, 'yellow'));
    }

    if (result.failures.length > 0) {
      Logger.fail('FAILURES:');
      result.failures.forEach((f) => Logger.bullet(f, 'red'));
      Logger.fail('PRE-FLIGHT FAILED \u2014 fix all issues above before running.\n');
    } else {
      Logger.pass('All pre-flight checks passed.\n');
    }

    return result;
  }

  /**
   * Scan a k6 script for data file references and column usage.
   * Detects: fs.open("path") → file mapping, FILES["name"]["col"] → column refs.
   */
  private extractDataReferences(
    scriptContent: string,
  ): Array<{ dataset: string; filePath: string; columns: string[] }> {
    // Match: datasetName: await csv.parse(await fs.open("path"), ...)
    const filePattern = /(\w+)\s*:\s*await\s+csv\.parse\(\s*await\s+fs\.open\(\s*["']([^"']+)["']\)/g;
    const datasetMap = new Map<string, string>();
    let m;

    while ((m = filePattern.exec(scriptContent)) !== null) {
      datasetMap.set(m[1], m[2]);
    }

    // Match column references: FILES["dataset"]["col"] or ...FILES["dataset"])["col"]
    const colPattern = /FILES\s*\[\s*["'](\w+)["']\s*\](?:\s*\))?\s*\[\s*["'](\w+)["']\s*\]/g;
    const datasetColumns = new Map<string, Set<string>>();

    while ((m = colPattern.exec(scriptContent)) !== null) {
      const dataset = m[1];
      const column = m[2];
      if (!datasetColumns.has(dataset)) datasetColumns.set(dataset, new Set());
      datasetColumns.get(dataset)!.add(column);
    }

    const refs: Array<{ dataset: string; filePath: string; columns: string[] }> = [];
    for (const [dataset, filePath] of datasetMap) {
      refs.push({
        dataset,
        filePath,
        columns: Array.from(datasetColumns.get(dataset) ?? []),
      });
    }

    return refs;
  }

  private estimateRequestedVUs(plan: TestPlan): number {
    const globalMax = plan.global_load_profile.stages
      ? Math.max(...plan.global_load_profile.stages.map((s) => s.target))
      : plan.global_load_profile.vus ?? 0;

    return globalMax;
  }
}
