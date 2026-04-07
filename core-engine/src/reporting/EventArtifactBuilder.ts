import * as os from 'os';
import { ErrorBehavior } from '../types/ConfigContracts';
import { AgentContext, ErrorEvent, WarningEvent } from '../types/EventContracts';
import { ErrorRuntime } from '../runtime/ErrorRuntime';

interface SummaryCheck {
  name?: string;
  passes?: number;
  fails?: number;
}

interface SummaryGroup {
  name?: string;
  path?: string;
  groups?: Record<string, SummaryGroup> | SummaryGroup[];
  checks?: Record<string, SummaryCheck> | SummaryCheck[];
}

interface SummaryMetric {
  thresholds?: Record<string, boolean | { ok?: boolean }>;
}

interface BuildEventArtifactsOptions {
  runId: string;
  planName: string;
  environment: string;
  journeyName: string;
  errorBehavior: ErrorBehavior;
  runStatus: number;
  summaryData: {
    metrics?: Record<string, SummaryMetric>;
    root_group?: SummaryGroup;
  };
}

export class EventArtifactBuilder {
  static build(options: BuildEventArtifactsOptions): {
    errors: ErrorEvent[];
    warnings: WarningEvent[];
  } {
    const agent = this.buildAgentContext();
    const errors = this.collectCheckFailureEvents(options, agent);
    const warnings = this.collectThresholdWarningEvents(options, agent);

    if (options.runStatus !== 0) {
      errors.push(ErrorRuntime.buildErrorEvent({
        runId: options.runId,
        plan: options.planName,
        environment: options.environment,
        journey: options.journeyName,
        scenario: options.journeyName,
        transaction: 'framework_execution',
        vu: null,
        iteration: null,
        phase: 'unknown',
        behavior: options.errorBehavior,
        agent,
      }, 'execution_failed', `k6 execution finished with non-zero exit code ${options.runStatus}`, {
        cause: {
          kind: 'process_exit',
          code: `EXIT_${options.runStatus}`,
          detail: 'The k6 process exited with a non-zero status.',
        },
      }));
    }

    return { errors, warnings };
  }

  private static collectCheckFailureEvents(
    options: BuildEventArtifactsOptions,
    agent: AgentContext,
  ): ErrorEvent[] {
    const root = options.summaryData.root_group;
    if (!root) {
      return [];
    }

    const failures: ErrorEvent[] = [];
    const visit = (group: SummaryGroup) => {
      const transaction = group.name || 'unknown_transaction';
      for (const check of this.toCheckArray(group.checks)) {
        const failCount = check.fails ?? 0;
        if (failCount <= 0) {
          continue;
        }

        failures.push(ErrorRuntime.buildErrorEvent({
          runId: options.runId,
          plan: options.planName,
          environment: options.environment,
          journey: options.journeyName,
          scenario: options.journeyName,
          transaction,
          requestName: check.name,
          vu: null,
          iteration: null,
          phase: 'unknown',
          behavior: options.errorBehavior,
          agent,
        }, 'assertion_failed', `Check failed in transaction "${transaction}": ${check.name ?? 'unnamed check'}`, {
          cause: {
            kind: 'check_failure',
            code: 'K6_CHECK_FAILED',
            detail: `passes=${check.passes ?? 0}, fails=${failCount}`,
          },
        }));
      }

      for (const child of this.toGroupArray(group.groups)) {
        visit(child);
      }
    };

    for (const group of this.toGroupArray(root.groups)) {
      visit(group);
    }

    return failures;
  }

  private static collectThresholdWarningEvents(
    options: BuildEventArtifactsOptions,
    agent: AgentContext,
  ): WarningEvent[] {
    const warnings: WarningEvent[] = [];
    for (const [metricName, metric] of Object.entries(options.summaryData.metrics ?? {})) {
      for (const [rule, result] of Object.entries(metric.thresholds ?? {})) {
        if (this.isThresholdBreached(result)) {
          warnings.push(ErrorRuntime.buildWarningEvent(options.runId, 'threshold_breach', `Threshold breached for ${metricName}: ${rule}`, {
            plan: options.planName,
            environment: options.environment,
            journey: options.journeyName,
            scenario: options.journeyName,
            transaction: metricName,
            phase: 'unknown',
            agent,
            metric: {
              name: metricName,
              value: 0,
            },
          }));
        }
      }
    }

    return warnings;
  }

  private static buildAgentContext(): AgentContext {
    return {
      host: os.hostname(),
      pid: process.pid,
      jobId: process.env.BUILD_BUILDID || process.env.GITHUB_RUN_ID || process.env.CI_JOB_ID,
      containerId: process.env.HOSTNAME,
    };
  }

  /** k6 --summary-export: true = breached. handleSummary: { ok: false } = breached. */
  private static isThresholdBreached(value: boolean | { ok?: boolean }): boolean {
    if (typeof value === 'boolean') return value;
    return value.ok === false;
  }

  /** Normalize k6 summary groups (object-map or array) to array. */
  private static toGroupArray(groups?: Record<string, SummaryGroup> | SummaryGroup[]): SummaryGroup[] {
    if (!groups) return [];
    if (Array.isArray(groups)) return groups;
    return Object.values(groups);
  }

  /** Normalize k6 summary checks (object-map or array) to array. */
  private static toCheckArray(checks?: Record<string, SummaryCheck> | SummaryCheck[]): SummaryCheck[] {
    if (!checks) return [];
    if (Array.isArray(checks)) return checks;
    return Object.values(checks);
  }
}
