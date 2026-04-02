import { SLARegistry } from './SLARegistry';
import { TestPlan } from '../types/TestPlanSchema';

export class ThresholdManager {
  /**
   * Applies SLA configuration from the TestPlan globally and from the SLARegistry per journey/transaction.
   * Translates SLA targets into k6-native thresholds.
   */
  static apply(testPlan: TestPlan): Record<string, string[]> {
    const thresholds: Record<string, string[]> = {};

    // 1. Global SLA from the test plan (applies to all HTTP requests)
    if (testPlan.global_sla) {
      const g = testPlan.global_sla;
      const httpReqDur: string[] = [];
      if (g.p90) httpReqDur.push(`p(90)<${g.p90}`);
      if (g.p95) httpReqDur.push(`p(95)<${g.p95}`);
      if (g.avgResponseTime) httpReqDur.push(`avg<${g.avgResponseTime}`);
      
      if (httpReqDur.length > 0) {
        thresholds['http_req_duration'] = httpReqDur;
      }

      if (g.errorRate !== undefined) {
        thresholds['http_req_failed'] = [`rate<${g.errorRate / 100}`];
      }
    }

    // 2. Journey and Transaction specific SLAs
    const registeredSLAs = SLARegistry.getAll();
    for (const [targetName, config] of Object.entries(registeredSLAs)) {
      const rules: string[] = [];
      if (config.p90) rules.push(`p(90)<${config.p90}`);
      if (config.p95) rules.push(`p(95)<${config.p95}`);
      if (config.avgResponseTime) rules.push(`avg<${config.avgResponseTime}`);
      
      let errorRule = '';
      if (config.errorRate !== undefined) {
        errorRule = `rate<${config.errorRate / 100}`;
      }

      if (targetName.startsWith('txn_')) {
        // Transaction Trend threshold
        if (rules.length > 0) thresholds[targetName] = rules;
      } else {
        // Scenario (journey) specific threshold
        if (rules.length > 0) {
          thresholds[`http_req_duration{scenario:${targetName}}`] = rules;
        }
        if (errorRule) {
          thresholds[`http_req_failed{scenario:${targetName}}`] = [errorRule];
        }
      }
    }

    return thresholds;
  }
}
