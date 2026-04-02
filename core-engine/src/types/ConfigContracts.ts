import { DataOverflowStrategy } from './TestPlanSchema';
export { DataOverflowStrategy };

// ---------------------------------------------
// Environment Configuration
// ---------------------------------------------

export interface EnvironmentConfig {
  /** Logical name of the environment: dev | staging | uat | prod */
  name: string;
  /** Base URL of the system under test */
  baseUrl: string;
  /** Optional secondary base URLs keyed by service name */
  serviceUrls?: Record<string, string>;
  /** Any additional environment-specific key-value pairs */
  custom?: Record<string, string | number | boolean>;
}

// ---------------------------------------------
// Runtime Settings
// ---------------------------------------------

export type ErrorBehavior = 'continue' | 'stop_iteration' | 'stop_test';
export type ThinkTimeMode = 'fixed' | 'random';

export interface ThinkTimeConfig {
  mode: ThinkTimeMode;
  /** Fixed think time in seconds (used when mode = 'fixed') */
  fixed?: number;
  /** Min seconds (used when mode = 'random') */
  min?: number;
  /** Max seconds (used when mode = 'random') */
  max?: number;
}

export interface PacingConfig {
  /** Enable pacing (iteration-based rate control) */
  enabled: boolean;
  /** Target duration between iteration starts in seconds */
  targetIntervalSeconds?: number;
}

export interface HttpConfig {
  /** Global HTTP request timeout in seconds */
  timeoutSeconds: number;
  /** Max redirects to follow */
  maxRedirects: number;
  /** Whether to throw on non-2xx by default */
  throwOnError: boolean;
}

export interface RuntimeSettings {
  thinkTime: ThinkTimeConfig;
  pacing: PacingConfig;
  http: HttpConfig;
  errorBehavior: ErrorBehavior;
  /** Debug mode – prints resolved config; enables verbose logging */
  debugMode: boolean;
}

// ---------------------------------------------
// Framework Defaults
// ---------------------------------------------

export const FRAMEWORK_DEFAULTS: RuntimeSettings = {
  thinkTime: { mode: 'fixed', fixed: 1 },
  pacing: { enabled: false },
  http: { timeoutSeconds: 60, maxRedirects: 10, throwOnError: false },
  errorBehavior: 'continue',
  debugMode: false,
};

// ---------------------------------------------
// Resolved Runtime Config (merged output)
// ---------------------------------------------

export interface ResolvedConfig {
  environment: EnvironmentConfig;
  runtime: RuntimeSettings;
  /** Merged CLI overrides (highest precedence after .env secrets) */
  cliOverrides: Record<string, unknown>;
  /** Raw .env secrets (never logged) */
  secrets: Record<string, string>;
}
