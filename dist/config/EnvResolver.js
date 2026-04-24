"use strict";
/**
 * EnvResolver.ts
 * Phase 1 – Loads .env file and exposes typed accessors.
 * This is the first module initialized; everything else reads from it.
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
exports.EnvResolver = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
class EnvResolver {
    /**
     * Load and parse a .env file from the given path.
     * Falls back to process.env if the file does not exist.
     */
    constructor(envFilePath) {
        this.vars = {};
        const resolvedPath = envFilePath ?? path.resolve(process.cwd(), '.env');
        if (fs.existsSync(resolvedPath)) {
            const parsed = dotenv.parse(fs.readFileSync(resolvedPath));
            Object.assign(this.vars, parsed);
        }
        // Always overlay real process.env so Docker/CI env vars win
        for (const [k, v] of Object.entries(process.env)) {
            if (v !== undefined)
                this.vars[k] = v;
        }
    }
    /** Get a required string variable. Throws if missing. */
    require(key) {
        const value = this.vars[key];
        if (value === undefined || value === '') {
            throw new Error(`[EnvResolver] Required environment variable '${key}' is missing or empty.`);
        }
        return value;
    }
    /** Get an optional string variable with a fallback default. */
    get(key, defaultValue = '') {
        return this.vars[key] ?? defaultValue;
    }
    /** Get an optional boolean variable ('true'/'false'/'1'/'0'). */
    getBool(key, defaultValue = false) {
        const raw = this.vars[key];
        if (raw === undefined)
            return defaultValue;
        return raw === 'true' || raw === '1';
    }
    /** Get an optional numeric variable. */
    getNumber(key, defaultValue = 0) {
        const raw = this.vars[key];
        if (raw === undefined)
            return defaultValue;
        const parsed = Number(raw);
        if (isNaN(parsed)) {
            throw new Error(`[EnvResolver] Variable '${key}' is not a valid number: '${raw}'`);
        }
        return parsed;
    }
    /** Expose all resolved vars (for debug printing – caller should redact secrets). */
    getAll() {
        return { ...this.vars };
    }
}
exports.EnvResolver = EnvResolver;
//# sourceMappingURL=EnvResolver.js.map