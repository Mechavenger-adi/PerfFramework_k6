"use strict";
/**
 * ConfigurationManager.ts
 * Phase 1 – Merges configs in documented precedence order:
 *   framework defaults -> environment -> runtime -> suite -> CLI -> .env secrets
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
exports.ConfigurationManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ConfigContracts_1 = require("../types/ConfigContracts");
const EnvResolver_1 = require("./EnvResolver");
const SchemaValidator_1 = require("./SchemaValidator");
class ConfigurationManager {
    constructor(envFilePath) {
        this.envResolver = new EnvResolver_1.EnvResolver(envFilePath);
        this.schemaValidator = new SchemaValidator_1.SchemaValidator();
    }
    /**
     * Load and merge all config layers, returning a fully resolved config.
     * Throws descriptively if any required piece is missing or schema-invalid.
     */
    resolve(options) {
        // 1. Framework defaults
        let runtime = structuredClone(ConfigContracts_1.FRAMEWORK_DEFAULTS);
        // 2. Environment config
        const environment = this.loadEnvironmentConfig(options.environmentConfigPath);
        // 3. Runtime settings (merge on top of defaults)
        const runtimeFromFile = this.loadRuntimeSettings(options.runtimeSettingsPath);
        runtime = this.deepMerge(runtime, runtimeFromFile);
        // 4. CLI overrides (applied after file-level merge)
        const cliOverrides = options.cliOverrides ?? {};
        if (cliOverrides['debugMode'] !== undefined) {
            runtime.debugMode = cliOverrides['debugMode'];
        }
        // 5. .env secrets
        const secrets = this.envResolver.getAll();
        const resolved = { environment, runtime, cliOverrides, secrets };
        if (runtime.debugMode) {
            this.printResolvedConfig(resolved);
        }
        return resolved;
    }
    // ---------------------------------------------
    // Loaders
    // ---------------------------------------------
    loadTestPlan(planPath) {
        const raw = this.readJsonFile(planPath, 'Test Plan');
        const result = this.schemaValidator.validatePlan(raw);
        if (!result.valid) {
            throw new Error(`[ConfigurationManager] Test plan validation failed:\n${result.errors.join('\n')}`);
        }
        return raw;
    }
    loadEnvironmentConfig(filePath) {
        return this.readJsonFile(filePath, 'Environment Config');
    }
    loadRuntimeSettings(filePath) {
        if (!fs.existsSync(filePath)) {
            console.warn(`[ConfigurationManager] No runtime-settings file found at '${filePath}'. Using framework defaults.`);
            return {};
        }
        const raw = this.readJsonFile(filePath, 'Runtime Settings');
        const result = this.schemaValidator.validateRuntime(raw);
        if (!result.valid) {
            throw new Error(`[ConfigurationManager] Runtime settings validation failed:\n${result.errors.join('\n')}`);
        }
        return raw;
    }
    // ---------------------------------------------
    // Utilities
    // ---------------------------------------------
    readJsonFile(filePath, label) {
        const abs = path.resolve(process.cwd(), filePath);
        if (!fs.existsSync(abs)) {
            throw new Error(`[ConfigurationManager] ${label} file not found: ${abs}`);
        }
        try {
            return JSON.parse(fs.readFileSync(abs, 'utf-8'));
        }
        catch (err) {
            throw new Error(`[ConfigurationManager] Failed to parse ${label} JSON at ${abs}: ${err.message}`);
        }
    }
    /** Recursive deep merge – source keys override target keys. */
    deepMerge(target, source) {
        if (typeof target !== 'object' ||
            target === null ||
            typeof source !== 'object' ||
            source === null ||
            Array.isArray(source)) {
            return source ?? target;
        }
        const result = { ...target };
        for (const [key, value] of Object.entries(source)) {
            result[key] = this.deepMerge(result[key], value);
        }
        return result;
    }
    printResolvedConfig(config) {
        const safe = {
            environment: config.environment,
            runtime: config.runtime,
            cliOverrides: config.cliOverrides,
            secrets: Object.keys(config.secrets).reduce((acc, key) => {
                acc[key] = '***REDACTED***';
                return acc;
            }, {}),
        };
        console.log('[ConfigurationManager] Resolved Config:\n' + JSON.stringify(safe, null, 2));
    }
}
exports.ConfigurationManager = ConfigurationManager;
//# sourceMappingURL=ConfigurationManager.js.map