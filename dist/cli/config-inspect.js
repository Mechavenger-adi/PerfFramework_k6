"use strict";
/**
 * config-inspect.ts
 * Phase 5 – Config resolution inspection
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
exports.inspectConfig = inspectConfig;
const ConfigurationManager_1 = require("../config/ConfigurationManager");
const TestPlanLoader_1 = require("../scenario/TestPlanLoader");
const path = __importStar(require("path"));
function inspectConfig(planPath, envConfigPath, runtimeSettingsPath, envFilePath) {
    console.log('\n  Inspecting Configuration Resolution Chain...\n');
    try {
        const loader = new TestPlanLoader_1.TestPlanLoader();
        const plan = loader.load(planPath);
        const envPath = envConfigPath ?? path.join('config', 'environments', `${plan.environment}.json`);
        const runtimePath = runtimeSettingsPath ?? path.join('config', 'runtime-settings', 'default.json');
        const configManager = new ConfigurationManager_1.ConfigurationManager(envFilePath);
        // Note: resolve() internally calls printResolvedConfig if debugMode is true.
        // To explicitly inspect, we can just resolve and print it.
        console.log(`[1] Framework Defaults: Embedded in Core Engine`);
        console.log(`[2] Environment Config: ${envPath}`);
        console.log(`[3] Runtime Settings:   ${runtimePath}`);
        if (envFilePath)
            console.log(`[4] Secrets (.env):     ${envFilePath}`);
        console.log(`[5] Test Plan:          ${planPath}`);
        console.log('');
        const resolved = configManager.resolve({
            environmentConfigPath: envPath,
            runtimeSettingsPath: runtimePath,
        });
        const safe = {
            environment: resolved.environment,
            runtime: resolved.runtime,
            cliOverrides: resolved.cliOverrides,
            secrets: Object.keys(resolved.secrets).length > 0 ? '(Loaded and Redacted)' : '(None Loaded)'
        };
        console.log('--- Final Merged Resolution ---');
        console.log(JSON.stringify(safe, null, 2));
    }
    catch (err) {
        console.error(`\n[FAIL]  Config inspection failed:\n   ${err.message}\n`);
        process.exit(1);
    }
}
//# sourceMappingURL=config-inspect.js.map