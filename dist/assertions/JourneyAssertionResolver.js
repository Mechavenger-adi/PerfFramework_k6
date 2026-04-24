"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JourneyAssertionResolver = void 0;
const logger_1 = require("../utils/logger");
class JourneyAssertionResolver {
    /**
     * Evaluates the k6 end-of-test summary statistics and prints a human-readable
     * pass/fail report based on journey-level SLAs.
     */
    static printReport(k6Data) {
        logger_1.Logger.info('\n=== SLA Verification Report ===');
        if (!k6Data.metrics) {
            logger_1.Logger.warn('No metrics found in k6 output.');
            return;
        }
        const checks = k6Data.metrics.checks;
        if (checks && checks.values) {
            const pass = checks.values.passes || 0;
            const fail = checks.values.fails || 0;
            const total = pass + fail;
            const passRate = total > 0 ? ((pass / total) * 100).toFixed(1) : '100';
            logger_1.Logger.info(`Checks: ${pass}/${total} Passed (${passRate}%)`);
        }
        let anyFailed = false;
        for (const [metricName, metricData] of Object.entries(k6Data.metrics)) {
            if (metricData.thresholds) {
                for (const [thresholdName, thresholdResult] of Object.entries(metricData.thresholds)) {
                    if (!thresholdResult.ok) {
                        anyFailed = true;
                        logger_1.Logger.error(`SLA Breach [${metricName}] -> threshold '${thresholdName}' failed.`);
                    }
                }
            }
        }
        if (!anyFailed) {
            logger_1.Logger.info('All SLAs and Thresholds Met successfully.');
        }
        logger_1.Logger.info('===============================\n');
    }
}
exports.JourneyAssertionResolver = JourneyAssertionResolver;
//# sourceMappingURL=JourneyAssertionResolver.js.map