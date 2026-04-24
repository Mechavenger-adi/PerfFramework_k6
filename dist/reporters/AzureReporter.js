"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureReporter = void 0;
const logger_1 = require("../utils/logger");
class AzureReporter {
    /**
     * Simulates pushing transformed results to Azure Application Insights.
     */
    static push(result, connectionString) {
        logger_1.Logger.info(`[AzureReporter] Pushing results to Azure App Insights`);
        // In a real implementation: telemetryClient.trackMetric(...)
        logger_1.Logger.debug(`[AzureReporter] Connection: ${connectionString.substring(0, 15)}...`);
    }
}
exports.AzureReporter = AzureReporter;
//# sourceMappingURL=AzureReporter.js.map