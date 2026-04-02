import { Logger } from '../utils/logger';

export class JourneyAssertionResolver {
  /**
   * Evaluates the k6 end-of-test summary statistics and prints a human-readable 
   * pass/fail report based on journey-level SLAs.
   */
  static printReport(k6Data: any): void {
    Logger.info('\n=== SLA Verification Report ===');
    
    if (!k6Data.metrics) {
        Logger.warn('No metrics found in k6 output.');
        return;
    }

    const checks = k6Data.metrics.checks;
    if (checks && checks.values) {
       const pass = checks.values.passes || 0;
       const fail = checks.values.fails || 0;
       const total = pass + fail;
       const passRate = total > 0 ? ((pass/total)*100).toFixed(1) : '100';
       Logger.info(`Checks: ${pass}/${total} Passed (${passRate}%)`);
    }

    let anyFailed = false;
    for (const [metricName, metricData] of Object.entries<any>(k6Data.metrics)) {
      if (metricData.thresholds) {
        for (const [thresholdName, thresholdResult] of Object.entries<any>(metricData.thresholds)) {
          if (!thresholdResult.ok) {
            anyFailed = true;
            Logger.error(`SLA Breach [${metricName}] -> threshold '${thresholdName}' failed.`);
          }
        }
      }
    }

    if (!anyFailed) {
      Logger.info('All SLAs and Thresholds Met successfully.');
    }
    
    Logger.info('===============================\n');
  }
}
