import { ErrorBehavior } from '../types/ConfigContracts';
import { ErrorEvent, WarningEvent, AgentContext, ErrorCause, VariableUsage, SnapshotReference } from '../types/EventContracts';

export interface ErrorRuntimeContext {
  runId: string;
  plan?: string;
  environment?: string;
  journey: string;
  scenario?: string;
  transaction: string;
  requestName?: string;
  requestId?: string;
  method?: string;
  url?: string;
  status?: number;
  vu: number | null;
  iteration: number | null;
  phase: 'init' | 'action' | 'end' | 'unknown';
  behavior: ErrorBehavior;
  agent?: AgentContext;
}

export class ErrorRuntime {
  static buildErrorEvent(
    ctx: ErrorRuntimeContext,
    type: string,
    message: string,
    extras?: {
      cause?: ErrorCause;
      correlation?: VariableUsage;
      data?: VariableUsage;
      snapshot?: SnapshotReference;
    },
  ): ErrorEvent {
    return {
      ts: new Date().toISOString(),
      level: 'error',
      type,
      runId: ctx.runId,
      plan: ctx.plan,
      environment: ctx.environment,
      journey: ctx.journey,
      scenario: ctx.scenario,
      transaction: ctx.transaction,
      requestName: ctx.requestName,
      requestId: ctx.requestId,
      method: ctx.method,
      url: ctx.url,
      status: ctx.status,
      vu: ctx.vu,
      iteration: ctx.iteration,
      phase: ctx.phase,
      behavior: ctx.behavior,
      agent: ctx.agent,
      message,
      cause: extras?.cause,
      correlation: extras?.correlation,
      data: extras?.data,
      snapshot: extras?.snapshot,
    };
  }

  static buildWarningEvent(
    runId: string,
    type: string,
    message: string,
    extras?: Partial<WarningEvent>,
  ): WarningEvent {
    return {
      ts: new Date().toISOString(),
      level: 'warning',
      type,
      runId,
      message,
      ...extras,
    };
  }
}
