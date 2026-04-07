/**
 * RuntimeConfigManager.ts
 * Phase 1/2 – Typed accessors for runtime behavior the test scripts call at runtime.
 * Lives in Phase 1 because the Gatekeeper needs it for pre-flight; scripts use it at run-time.
 */

import { RuntimeSettings, ThinkTimeConfig } from '../types/ConfigContracts';

export class RuntimeConfigManager {
  constructor(private readonly settings: RuntimeSettings) {}

  // ---------------------------------------------
  // Think Time
  // ---------------------------------------------

  /**
   * Returns the think time in seconds to apply between transactions.
   * When mode = 'random', returns a value in [min, max].
   */
  getThinkTimeSeconds(): number {
    const cfg: ThinkTimeConfig = this.settings.thinkTime;
    if (cfg.mode === 'fixed') {
      return cfg.fixed ?? 1;
    }
    // random mode
    const min = cfg.min ?? 0.5;
    const max = cfg.max ?? 3;
    return min + Math.random() * (max - min);
  }

  // ---------------------------------------------
  // Pacing
  // ---------------------------------------------

  isPacingEnabled(): boolean {
    return this.settings.pacing.enabled;
  }

  getPacingIntervalMs(): number {
    return (this.settings.pacing.targetIntervalSeconds ?? 0) * 1000;
  }

  // ---------------------------------------------
  // HTTP
  // ---------------------------------------------

  getTimeoutMs(): number {
    return this.settings.http.timeoutSeconds * 1000;
  }

  getMaxRedirects(): number {
    return this.settings.http.maxRedirects;
  }

  shouldThrowOnError(): boolean {
    return this.settings.http.throwOnError;
  }

  // ---------------------------------------------
  // Error Behavior
  // ---------------------------------------------

  getErrorBehavior(): RuntimeSettings['errorBehavior'] {
    return this.settings.errorBehavior;
  }

  // ---------------------------------------------
  // Debug
  // ---------------------------------------------

  isDebugMode(): boolean {
    return this.settings.debugMode;
  }

  /** Return all settings (useful for logging) */
  dump(): RuntimeSettings {
    return { ...this.settings };
  }
}
