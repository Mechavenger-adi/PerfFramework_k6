/**
 * GatekeeperValidator.ts
 * Phase 1 – Pre-flight checklist. Runs after config merge, before k6 is invoked.
 * Accumulates ALL failures and reports them together — not just the first one.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ResolvedConfig } from '../types/ConfigContracts';
import { TestPlan } from '../types/TestPlanSchema';

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

  private estimateRequestedVUs(plan: TestPlan): number {
    const globalMax = plan.global_load_profile.stages
      ? Math.max(...plan.global_load_profile.stages.map((s) => s.target))
      : plan.global_load_profile.vus ?? 0;

    return globalMax;
  }
}
