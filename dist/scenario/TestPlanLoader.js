"use strict";
/**
 * TestPlanLoader.ts
 * Phase 1 – Loads and parses a test plan JSON file.
 * Delegates schema validation to SchemaValidator.
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
exports.TestPlanLoader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const SchemaValidator_1 = require("../config/SchemaValidator");
class TestPlanLoader {
    constructor() {
        this.schemaValidator = new SchemaValidator_1.SchemaValidator();
    }
    /**
     * Load and validate a test plan from a JSON file.
     * Throws with a descriptive message on parse failure or schema violations.
     */
    load(planFilePath) {
        const abs = path.resolve(process.cwd(), planFilePath);
        if (!fs.existsSync(abs)) {
            throw new Error(`[TestPlanLoader] Test plan file not found: ${abs}`);
        }
        let raw;
        try {
            raw = JSON.parse(fs.readFileSync(abs, 'utf-8'));
        }
        catch (err) {
            throw new Error(`[TestPlanLoader] Failed to parse JSON at ${abs}: ${err.message}`);
        }
        const result = this.schemaValidator.validatePlan(raw);
        if (!result.valid) {
            throw new Error(`[TestPlanLoader] Test plan schema validation failed:\n${result.errors.join('\n')}`);
        }
        return raw;
    }
}
exports.TestPlanLoader = TestPlanLoader;
//# sourceMappingURL=TestPlanLoader.js.map