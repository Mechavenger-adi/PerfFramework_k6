import { SLADefinition, TestPlan } from '../types/TestPlanSchema';

/** Matches SLA keys like p90, p95, p99, p99.9, p50 etc. */
const PERCENTILE_KEY_RE = /^p(\d+(?:\.\d+)?)$/;

export class ThresholdManager {
  /**
   * Translates SLA definitions from the test plan into k6-native thresholds.
   * Supports global, per-journey, and per-transaction SLAs.
   * Percentile keys are dynamic — any key matching /^p\d+(\.\d+)?$/ is accepted.
   */
  static apply(testPlan: TestPlan): Record<string, string[]> {
    const thresholds: Record<string, string[]> = {};

    // 1. Global SLA (applies to all HTTP requests)
    if (testPlan.global_sla) {
      const rules = this.buildDurationRules(testPlan.global_sla);
      if (rules.length > 0) {
        thresholds['http_req_duration'] = rules;
      }
      if (testPlan.global_sla.errorRate !== undefined) {
        thresholds['http_req_failed'] = [`rate<${testPlan.global_sla.errorRate / 100}`];
      }
    }

    // 2. Per-journey SLAs (applies to scenario-scoped metrics)
    if (testPlan.journey_slas) {
      for (const [journeyName, sla] of Object.entries(testPlan.journey_slas)) {
        const rules = this.buildDurationRules(sla);
        if (rules.length > 0) {
          thresholds[`http_req_duration{scenario:${journeyName}}`] = rules;
        }
        if (sla.errorRate !== undefined) {
          thresholds[`http_req_failed{scenario:${journeyName}}`] = [`rate<${sla.errorRate / 100}`];
        }
      }
    }

    // 3. Per-transaction SLAs (applies to Trend metrics by transaction name)
    if (testPlan.transaction_slas) {
      for (const [txnName, sla] of Object.entries(testPlan.transaction_slas)) {
        const rules = this.buildDurationRules(sla);
        if (rules.length > 0) {
          thresholds[txnName] = rules;
        }
      }
    }

    return thresholds;
  }

  /**
   * Build k6 duration threshold rules from an SLA definition.
   * Dynamically handles any percentile key (p50, p75, p90, p95, p99, p99.9, etc.).
   */
  private static buildDurationRules(sla: SLADefinition): string[] {
    const rules: string[] = [];

    for (const [key, value] of Object.entries(sla)) {
      if (value === undefined) continue;

      const pMatch = key.match(PERCENTILE_KEY_RE);
      if (pMatch) {
        rules.push(`p(${pMatch[1]})<${value}`);
      } else if (key === 'avgResponseTime') {
        rules.push(`avg<${value}`);
      }
      // errorRate is handled separately (different metric)
    }

    return rules;
  }

  /**
   * Collect all percentile values referenced across all SLA definitions in the plan.
   * Returns k6-format percentile strings like 'p(90)', 'p(99)', 'p(99.9)'.
   */
  static collectPercentiles(testPlan: TestPlan): string[] {
    const percentiles = new Set<string>();

    const extractFromSLA = (sla: SLADefinition) => {
      for (const key of Object.keys(sla)) {
        const m = key.match(PERCENTILE_KEY_RE);
        if (m) percentiles.add(`p(${m[1]})`);
      }
    };

    if (testPlan.global_sla) extractFromSLA(testPlan.global_sla);
    if (testPlan.journey_slas) {
      for (const sla of Object.values(testPlan.journey_slas)) extractFromSLA(sla);
    }
    if (testPlan.transaction_slas) {
      for (const sla of Object.values(testPlan.transaction_slas)) extractFromSLA(sla);
    }

    return [...percentiles];
  }
}
