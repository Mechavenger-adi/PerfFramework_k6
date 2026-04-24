"use strict";
/**
 * validate.ts
 * Phase 1 – Validates configs before execution.
 * Runs the Gatekeeper checklist and reports all issues in one pass.
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
exports.runValidate = runValidate;
const path = __importStar(require("path"));
const ConfigurationManager_1 = require("../config/ConfigurationManager");
const GatekeeperValidator_1 = require("../config/GatekeeperValidator");
const TestPlanLoader_1 = require("../scenario/TestPlanLoader");
function runValidate(opts) {
    const { planPath, dataRoot = 'scrum-suites', envFilePath, } = opts;
    console.log('\n  Running pre-flight validation...\n');
    // 1. Load test plan
    let plan;
    try {
        const loader = new TestPlanLoader_1.TestPlanLoader();
        plan = loader.load(planPath);
    }
    catch (err) {
        console.error(`\n[FAIL]  Failed to load test plan:\n   ${err.message}\n`);
        return false;
    }
    // 2. Resolve env config path
    const envConfigPath = opts.envConfigPath ?? path.join('config', 'environments', `${plan.environment}.json`);
    const runtimeSettingsPath = opts.runtimeSettingsPath ?? path.join('config', 'runtime-settings', 'default.json');
    // 3. Merge configs
    let resolvedConfig;
    try {
        const configManager = new ConfigurationManager_1.ConfigurationManager(envFilePath);
        resolvedConfig = configManager.resolve({
            environmentConfigPath: envConfigPath,
            runtimeSettingsPath,
        });
    }
    catch (err) {
        console.error(`\n[FAIL]  Config resolution failed:\n   ${err.message}\n`);
        return false;
    }
    // 4. Run Gatekeeper
    const gatekeeper = new GatekeeperValidator_1.GatekeeperValidator();
    const result = gatekeeper.validate(resolvedConfig, plan, dataRoot);
    gatekeeper.printResult(result);
    return result.passed;
}
//# sourceMappingURL=validate.js.map