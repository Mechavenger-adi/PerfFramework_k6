/**
 * TestPlanSchema.ts
 * Phase 1 – Test plan JSON/YAML contract.
 * This is the primary input that drives scenario orchestration.
 */
export type ExecutionMode = 'parallel' | 'sequential' | 'hybrid';
export type ExecutorType = 'ramping-vus' | 'constant-vus' | 'ramping-arrival-rate' | 'constant-arrival-rate' | 'shared-iterations' | 'per-vu-iterations';
export type WorkloadModelType = 'load' | 'stress' | 'soak' | 'spike' | 'iteration';
export type DataOverflowStrategy = 'terminate' | 'cycle' | 'continue_with_last';
export interface LoadStage {
    /** k6 duration string: '2m', '30s', '1h' */
    duration: string;
    /** Target VU count at end of this stage */
    target: number;
}
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
    /** Tags attached to this journey in results */
    tags?: Record<string, string>;
    /**
     * Per-journey cookie reset override.
     * - true (default): cookies persist across iterations for this journey.
     * - false: cookies are cleared at the start of each iteration.
     * Note: k6 noCookiesReset is global; per-journey control requires using
     * clearCookies() from core-engine/src/utils/session.js in initPhase/actionPhase.
     */
    noCookiesReset?: boolean;
}
export interface HybridGroup {
    mode: 'parallel' | 'sequential';
    journeys: string[];
}
export interface SLADefinition {
    /** Max error rate percent (0–100) */
    errorRate?: number;
    /** Max average response time in milliseconds */
    avgResponseTime?: number;
    /**
     * Percentile thresholds in milliseconds.
     * Any key matching /^p\d+(\.\d+)?$/ is treated as a percentile SLA.
     * Examples: p50, p75, p90, p95, p99, p99.9
     */
    [key: string]: number | undefined;
}
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
    /** Per-journey SLA overrides keyed by journey name (applies to http_req_duration{scenario:name}) */
    journey_slas?: Record<string, SLADefinition>;
    /** Per-transaction SLA overrides keyed by transaction name (applies to the Trend metric directly) */
    transaction_slas?: Record<string, SLADefinition>;
    /** Max total VUs allowed across all journeys */
    max_total_vus?: number;
    /** Optional debug execution settings */
    debug?: DebugSettings;
    /**
     * When true (default), cookies persist across VU iterations.
     * Set to false to clear the cookie jar after each iteration.
     */
    noCookiesReset?: boolean;
}
//# sourceMappingURL=TestPlanSchema.d.ts.map