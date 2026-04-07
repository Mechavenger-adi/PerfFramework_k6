/**
 * TestPlanSchema.ts
 * Phase 1 – Test plan JSON/YAML contract.
 * This is the primary input that drives scenario orchestration.
 */

export type ExecutionMode = 'parallel' | 'sequential' | 'hybrid';
export type ExecutorType =
  | 'ramping-vus'
  | 'constant-vus'
  | 'ramping-arrival-rate'
  | 'constant-arrival-rate'
  | 'shared-iterations'
  | 'per-vu-iterations';

export type WorkloadModelType = 'load' | 'stress' | 'soak' | 'spike' | 'iteration';
export type DataOverflowStrategy = 'terminate' | 'cycle' | 'continue_with_last';

export interface LifecycleConfig {
  /** Transaction groups that run once when a VU enters an active window */
  init?: string[];
  /** Transaction groups that run once when a VU is scheduled to leave an active window */
  end?: string[];
}

// ---------------------------------------------
// Load Profile Stage
// ---------------------------------------------

export interface LoadStage {
  /** k6 duration string: '2m', '30s', '1h' */
  duration: string;
  /** Target VU count at end of this stage */
  target: number;
}

// ---------------------------------------------
// Global Load Profile
// ---------------------------------------------

export interface GlobalLoadProfile {
  executor: ExecutorType;
  /** Starting VU count (ramping executors) */
  startVUs?: number;
  /** Stages for ramping executors */
  stages?: LoadStage[];
  /** Fixed VU count (constant executors) */
  vus?: number;
  /** Duration for constant executors */
  duration?: string;
  /** Total iterations for iteration-based executors */
  iterations?: number;
}

// ---------------------------------------------
// User Journey Definition
// ---------------------------------------------

export interface UserJourney {
  /** Unique name – used as the k6 scenario key */
  name: string;
  /** Path to the journey script file (relative to suite root) */
  scriptPath: string;
  /** Optional normalized recording log used only for debug replay comparison */
  recordingLogPath?: string;
  /** Weight percentage for load distribution (parallel mode) */
  weight?: number;
  /** Explicit VU override – takes priority over weight */
  vus?: number;
  /** Journey-specific load profile (overrides global) */
  loadProfile?: GlobalLoadProfile;
  /** Optional LoadRunner-style Init/Action/End split for this journey */
  lifecycle?: LifecycleConfig;
  /** Tags attached to this journey in results */
  tags?: Record<string, string>;
}

// ---------------------------------------------
// Hybrid Group (for hybrid execution mode)
// ---------------------------------------------

export interface HybridGroup {
  mode: 'parallel' | 'sequential';
  journeys: string[];
}

// ---------------------------------------------
// SLA Definition
// ---------------------------------------------

export interface SLADefinition {
  /** P95 response time threshold in milliseconds */
  p95?: number;
  /** P90 response time threshold in milliseconds */
  p90?: number;
  /** Max error rate percent (0–100) */
  errorRate?: number;
  /** Max average response time in milliseconds */
  avgResponseTime?: number;
}

// ---------------------------------------------
// Debug Execution Settings
// ---------------------------------------------

export interface DebugSettings {
  /** When true, journeys run in single-purpose debug replay mode instead of normal load mode */
  enabled: boolean;
  /** Debug mode currently supports diff-based replay validation */
  mode?: 'diff';
  /** Automatically resolve recording logs from the journey's own suite recordings folder */
  autoResolveRecordingLog?: boolean;
  /** Override VU count for debug replay */
  vus?: number;
  /** Override iteration count for debug replay */
  iterations?: number;
  /** Directory where replay logs and HTML diff reports are written */
  reportDir?: string;
  /** If true, validation fails when a journey does not provide recordingLogPath */
  failOnMissingRecordingLog?: boolean;
}

// ---------------------------------------------
// Full Test Plan
// ---------------------------------------------

export interface TestPlan {
  /** Human-readable test plan name */
  name: string;
  /** Target environment name – must match an env config file */
  environment: string;
  execution_mode: ExecutionMode;
  global_load_profile: GlobalLoadProfile;
  user_journeys: UserJourney[];
  /** Hybrid groups (required when execution_mode = 'hybrid') */
  hybrid_groups?: HybridGroup[];
  /** Global SLA defaults applied to all journeys */
  global_sla?: SLADefinition;
  /** Per-journey SLA overrides keyed by journey name */
  journey_slas?: Record<string, SLADefinition>;
  /** Max total VUs allowed across all journeys */
  max_total_vus?: number;
  /** Optional debug execution settings */
  debug?: DebugSettings;
}
