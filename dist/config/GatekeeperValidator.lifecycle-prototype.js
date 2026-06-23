"use strict";
/**
 * GatekeeperValidator.ts
 * Phase 1 – Pre-flight checklist. Runs after config merge, before k6 is invoked.
 * Accumulates ALL failures and reports them together — not just the first one.
 */
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
exports.GatekeeperValidator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DataValidator_1 = require("../data/DataValidator");
const RecordingLogResolver_1 = require("../debug/RecordingLogResolver");
const logger_1 = require("../utils/logger");
const PathResolver_1 = require("../utils/PathResolver");
class GatekeeperValidator {
    /**
     * Run the full pre-flight checklist.
     * Returns a result object — never throws; caller decides how to handle failures.
     */
    validate(config, plan, dataRoot) {
        const failures = [];
        const warnings = [];
        const debugEnabled = plan.debug?.enabled === true;
        const autoResolveRecordingLog = plan.debug?.autoResolveRecordingLog !== false;
        // -- 1. Environment checks ------------------
        if (!config.environment.baseUrl) {
            failures.push('[Environment] baseUrl is missing or empty.');
        }
        if (!config.environment.name) {
            failures.push('[Environment] name is missing or empty.');
        }
        // -- 2. Test plan structural checks --------
        if (!plan.user_journeys || plan.user_journeys.length === 0) {
            failures.push('[TestPlan] No user_journeys defined. At least one journey is required.');
        }
        // -- 3. Journey script files exist ---------
        for (let i = 0; i < (plan.user_journeys?.length ?? 0); i++) {
            const journey = plan.user_journeys[i];
            const resolvedPath = PathResolver_1.PathResolver.resolve(journey.scriptPath);
            if (!resolvedPath) {
                failures.push(`[Journey:${journey.name}] Script file not found: ${journey.scriptPath}`);
            }
            else {
                // Update the path to absolute so execution passes
                journey.scriptPath = resolvedPath;
            }
            if (!debugEnabled) {
                continue;
            }
            const explicitRecordingLogPath = journey.recordingLogPath;
            const resolution = explicitRecordingLogPath || autoResolveRecordingLog
                ? RecordingLogResolver_1.RecordingLogResolver.resolve(journey.scriptPath, explicitRecordingLogPath)
                : {
                    status: 'missing',
                    warning: `[Journey:${journey.name}] recordingLogPath was not provided and autoResolveRecordingLog is disabled.`,
                };
            if (resolution.status === 'resolved') {
                journey.recordingLogPath = resolution.resolvedPath;
                continue;
            }
            if (resolution.status === 'ambiguous') {
                failures.push(`[Journey:${journey.name}] Multiple recording logs matched this script in ${resolution.recordingsDir}. ` +
                    `Set recordingLogPath explicitly. Candidates: ${(resolution.candidates ?? []).join(', ')}`);
                continue;
            }
            journey.recordingLogPath = undefined;
            const missingMsg = `[Journey:${journey.name}] ${resolution.warning ?? 'Recording log not found. Replay-only diff report will be generated.'}`;
            if (plan.debug?.failOnMissingRecordingLog) {
                failures.push(missingMsg);
            }
            else {
                warnings.push(missingMsg);
            }
        }
        // -- 4. Weight / VU checks -----------------
        if (plan.execution_mode === 'parallel') {
            const journeysWithWeight = plan.user_journeys?.filter((j) => j.weight !== undefined) ?? [];
            const weightSum = journeysWithWeight.reduce((s, j) => s + (j.weight ?? 0), 0);
            if (journeysWithWeight.length > 0 && Math.abs(weightSum - 100) > 0.01) {
                warnings.push(`[Execution] Journey weights sum to ${weightSum.toFixed(1)}% — expected 100%. Load will be re-distributed proportionally.`);
            }
        }
        // -- 5. VU ceiling -------------------------
        if (plan.max_total_vus !== undefined) {
            const requestedVUs = this.estimateRequestedVUs(plan);
            if (requestedVUs > plan.max_total_vus) {
                failures.push(`[Execution] Requested ~${requestedVUs} VUs exceeds max_total_vus limit of ${plan.max_total_vus}.`);
            }
        }
        // -- 6. Data directory ---------------------
        const dataRootAbs = path.resolve(process.cwd(), dataRoot);
        if (!fs.existsSync(dataRootAbs)) {
            warnings.push(`[Data] Data directory not found: ${dataRootAbs}. No data files will be loaded.`);
        }
        // -- 7. Hybrid mode config -----------------
        if (plan.execution_mode === 'hybrid' && (!plan.hybrid_groups || plan.hybrid_groups.length === 0)) {
            failures.push('[TestPlan] execution_mode is "hybrid" but no hybrid_groups are defined.');
        }
        // -- 7.5. Lifecycle config checks ----------
        for (const journey of plan.user_journeys ?? []) {
            this.validateLifecycle(plan, journey, failures, warnings);
        }
        // -- 8. Data file & column validation ------
        for (const journey of plan.user_journeys ?? []) {
            const scriptPath = journey.scriptPath;
            if (!scriptPath || !fs.existsSync(scriptPath))
                continue;
            const scriptContent = fs.readFileSync(scriptPath, 'utf-8');
            const dataRefs = this.extractDataReferences(scriptContent);
            if (dataRefs.length === 0)
                continue;
            const scriptDir = path.dirname(scriptPath);
            for (const ref of dataRefs) {
                const absDataPath = path.resolve(scriptDir, ref.filePath);
                if (!fs.existsSync(absDataPath)) {
                    failures.push(`[Journey:${journey.name}] Data file not found: ${ref.filePath} (resolved: ${absDataPath})`);
                    continue;
                }
                if (ref.columns.length > 0) {
                    const result = DataValidator_1.DataValidator.validateCSV(absDataPath, ref.columns);
                    if (!result.valid) {
                        for (const err of result.errors) {
                            failures.push(`[Journey:${journey.name}] [${ref.dataset}] ${err}`);
                        }
                    }
                    for (const warn of result.warnings) {
                        warnings.push(`[Journey:${journey.name}] [${ref.dataset}] ${warn}`);
                    }
                }
            }
        }
        return {
            passed: failures.length === 0,
            failures,
            warnings,
        };
    }
    /**
     * Print the result to console in a human-readable format.
     * Returns the same result for chaining.
     */
    printResult(result) {
        logger_1.Logger.header('FRAMEWORK PRE-FLIGHT CHECKS');
        if (result.warnings.length > 0) {
            logger_1.Logger.warning('WARNINGS:');
            result.warnings.forEach((w) => logger_1.Logger.bullet(w, 'yellow'));
        }
        if (result.failures.length > 0) {
            logger_1.Logger.fail('FAILURES:');
            result.failures.forEach((f) => logger_1.Logger.bullet(f, 'red'));
            logger_1.Logger.fail('PRE-FLIGHT FAILED \u2014 fix all issues above before running.\n');
        }
        else {
            logger_1.Logger.pass('All pre-flight checks passed.\n');
        }
        return result;
    }
    /**
     * Scan a k6 script for data file references and column usage.
     * Detects: fs.open("path") → file mapping, FILES["name"]["col"] → column refs.
     */
    extractDataReferences(scriptContent) {
        // Match: datasetName: await csv.parse(await fs.open("path"), ...)
        const filePattern = /(\w+)\s*:\s*await\s+csv\.parse\(\s*await\s+fs\.open\(\s*["']([^"']+)["']\)/g;
        const datasetMap = new Map();
        let m;
        while ((m = filePattern.exec(scriptContent)) !== null) {
            datasetMap.set(m[1], m[2]);
        }
        // Match column references: FILES["dataset"]["col"] or ...FILES["dataset"])["col"]
        const colPattern = /FILES\s*\[\s*["'](\w+)["']\s*\](?:\s*\))?\s*\[\s*["'](\w+)["']\s*\]/g;
        const datasetColumns = new Map();
        while ((m = colPattern.exec(scriptContent)) !== null) {
            const dataset = m[1];
            const column = m[2];
            if (!datasetColumns.has(dataset))
                datasetColumns.set(dataset, new Set());
            datasetColumns.get(dataset).add(column);
        }
        const refs = [];
        for (const [dataset, filePath] of datasetMap) {
            refs.push({
                dataset,
                filePath,
                columns: Array.from(datasetColumns.get(dataset) ?? []),
            });
        }
        return refs;
    }
    estimateRequestedVUs(plan) {
        const globalMax = plan.global_load_profile.stages
            ? Math.max(...plan.global_load_profile.stages.map((s) => s.target))
            : plan.global_load_profile.vus ?? 0;
        return globalMax;
    }
    validateLifecycle(plan, journey, failures, warnings) {
        const lifecycle = journey.lifecycle;
        if (!lifecycle)
            return;
        const profile = journey.loadProfile ?? plan.global_load_profile;
        const initGroups = new Set(lifecycle.init ?? []);
        const endGroups = new Set(lifecycle.end ?? []);
        const overlap = [...initGroups].filter((groupName) => endGroups.has(groupName));
        if (overlap.length > 0) {
            warnings.push(`[Journey:${journey.name}] lifecycle.init and lifecycle.end overlap: ${overlap.join(', ')}.`);
        }
        const lifecycleExecutors = new Set(['ramping-vus', 'per-vu-iterations']);
        if (!lifecycleExecutors.has(profile.executor)) {
            warnings.push(`[Journey:${journey.name}] Lifecycle prototype is reliable only for ramping-vus and per-vu-iterations. Current executor '${profile.executor}' would be best-effort only.`);
        }
        if (profile.executor === 'per-vu-iterations' && (profile.iterations ?? 0) < 3) {
            failures.push(`[Journey:${journey.name}] Lifecycle with per-vu-iterations needs iterations >= 3 (Init + Action + End).`);
        }
        if (profile.executor === 'ramping-vus') {
            const stages = profile.stages ?? [];
            if (stages.length === 0 || stages[stages.length - 1].target !== 0) {
                warnings.push(`[Journey:${journey.name}] Lifecycle is most accurate when ramping-vus ends with an explicit final target 0 stage.`);
            }
        }
    }
}
exports.GatekeeperValidator = GatekeeperValidator;
//# sourceMappingURL=GatekeeperValidator.lifecycle-prototype.js.map