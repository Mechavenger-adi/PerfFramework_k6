"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventArtifactBuilder = void 0;
const os = __importStar(require("os"));
const ErrorRuntime_1 = require("../runtime/ErrorRuntime");
class EventArtifactBuilder {
    static build(options) {
        const agent = this.buildAgentContext();
        const errors = this.collectCheckFailureEvents(options, agent);
        const warnings = this.collectThresholdWarningEvents(options, agent);
        if (options.runStatus !== 0) {
            errors.push(ErrorRuntime_1.ErrorRuntime.buildErrorEvent({
                runId: options.runId,
                plan: options.planName,
                environment: options.environment,
                journey: options.journeyName,
                scenario: options.journeyName,
                transaction: 'framework_execution',
                vu: null,
                iteration: null,
                phase: 'unknown',
                behavior: options.errorBehavior,
                agent,
            }, 'execution_failed', `k6 execution finished with non-zero exit code ${options.runStatus}`, {
                cause: {
                    kind: 'process_exit',
                    code: `EXIT_${options.runStatus}`,
                    detail: 'The k6 process exited with a non-zero status.',
                },
            }));
        }
        return { errors, warnings };
    }
    static collectCheckFailureEvents(options, agent) {
        const root = options.summaryData.root_group;
        if (!root) {
            return [];
        }
        const failures = [];
        const visit = (group) => {
            const transaction = group.name || 'unknown_transaction';
            for (const check of this.toCheckArray(group.checks)) {
                const failCount = check.fails ?? 0;
                if (failCount <= 0) {
                    continue;
                }
                failures.push(ErrorRuntime_1.ErrorRuntime.buildErrorEvent({
                    runId: options.runId,
                    plan: options.planName,
                    environment: options.environment,
                    journey: options.journeyName,
                    scenario: options.journeyName,
                    transaction,
                    requestName: check.name,
                    vu: null,
                    iteration: null,
                    phase: 'unknown',
                    behavior: options.errorBehavior,
                    agent,
                }, 'assertion_failed', `Check failed in transaction "${transaction}": ${check.name ?? 'unnamed check'}`, {
                    cause: {
                        kind: 'check_failure',
                        code: 'K6_CHECK_FAILED',
                        detail: `passes=${check.passes ?? 0}, fails=${failCount}`,
                    },
                }));
            }
            for (const child of this.toGroupArray(group.groups)) {
                visit(child);
            }
        };
        for (const group of this.toGroupArray(root.groups)) {
            visit(group);
        }
        return failures;
    }
    static collectThresholdWarningEvents(options, agent) {
        const warnings = [];
        for (const [metricName, metric] of Object.entries(options.summaryData.metrics ?? {})) {
            for (const [rule, result] of Object.entries(metric.thresholds ?? {})) {
                if (this.isThresholdBreached(result)) {
                    warnings.push(ErrorRuntime_1.ErrorRuntime.buildWarningEvent(options.runId, 'threshold_breach', `Threshold breached for ${metricName}: ${rule}`, {
                        plan: options.planName,
                        environment: options.environment,
                        journey: options.journeyName,
                        scenario: options.journeyName,
                        transaction: metricName,
                        phase: 'unknown',
                        agent,
                        metric: {
                            name: metricName,
                            value: 0,
                        },
                    }));
                }
            }
        }
        return warnings;
    }
    static buildAgentContext() {
        return {
            host: os.hostname(),
            pid: process.pid,
            jobId: process.env.BUILD_BUILDID || process.env.GITHUB_RUN_ID || process.env.CI_JOB_ID,
            containerId: process.env.HOSTNAME,
        };
    }
    /** k6 --summary-export: true = breached. handleSummary: { ok: false } = breached. */
    static isThresholdBreached(value) {
        if (typeof value === 'boolean')
            return value;
        return value.ok === false;
    }
    /** Normalize k6 summary groups (object-map or array) to array. */
    static toGroupArray(groups) {
        if (!groups)
            return [];
        if (Array.isArray(groups))
            return groups;
        return Object.values(groups);
    }
    /** Normalize k6 summary checks (object-map or array) to array. */
    static toCheckArray(checks) {
        if (!checks)
            return [];
        if (Array.isArray(checks))
            return checks;
        return Object.values(checks);
    }
}
exports.EventArtifactBuilder = EventArtifactBuilder;
//# sourceMappingURL=EventArtifactBuilder.js.map