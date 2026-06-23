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
exports.PathResolver = void 0;
/**
 * PathResolver.ts
 * Phase 2 - Dynamic Path Resolution
 * Resolves script paths dynamically so users don't need to hardcode absolute/relative paths in test plans.
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class PathResolver {
    /**
     * Resolve a script path, distinguishing "not found" from "ambiguous".
     *
     * Resolution order:
     * 1. Treat `targetPath` as an explicit path (absolute, or relative to the
     *    current working directory). If it points at an existing file, use it —
     *    this is how users disambiguate duplicate filenames.
     * 2. Otherwise treat it as a bare filename and deep-search `searchRoot`.
     *    Collect EVERY match: one → resolved, none → not_found, many → ambiguous.
     *
     * @param targetPath The path or filename to resolve.
     * @param searchRoot The root directory to search in, defaults to 'testSuites'.
     */
    static resolveDetailed(targetPath, searchRoot = 'testSuites') {
        // 1. Explicit path (absolute or relative to cwd) that points at a real file.
        const directAbsPath = path.resolve(process.cwd(), targetPath);
        if (fs.existsSync(directAbsPath) && fs.statSync(directAbsPath).isFile()) {
            return { status: 'resolved', path: directAbsPath, viaExactPath: true };
        }
        // 2. Bare-filename deep search across the suite root.
        const rootAbsDir = path.resolve(process.cwd(), searchRoot);
        if (!fs.existsSync(rootAbsDir)) {
            return { status: 'not_found' };
        }
        const matches = this.collectMatches(rootAbsDir, path.basename(targetPath));
        if (matches.length === 0)
            return { status: 'not_found' };
        if (matches.length === 1)
            return { status: 'resolved', path: matches[0] };
        return { status: 'ambiguous', candidates: matches.sort() };
    }
    /**
     * Back-compatible convenience wrapper. Returns the absolute path for a unique
     * match, or `null` for both "not found" and "ambiguous" — it deliberately
     * does NOT silently pick one of several matches.
     */
    static resolve(targetPath, searchRoot = 'testSuites') {
        const result = this.resolveDetailed(targetPath, searchRoot);
        return result.status === 'resolved' ? result.path : null;
    }
    /** Collect ALL files under `dir` (recursively) whose name equals `targetFile`. */
    static collectMatches(dir, targetFile) {
        const out = [];
        const walk = (current) => {
            for (const entry of fs.readdirSync(current)) {
                const fullPath = path.join(current, entry);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    walk(fullPath);
                }
                else if (entry === targetFile) {
                    out.push(fullPath);
                }
            }
        };
        walk(dir);
        return out;
    }
}
exports.PathResolver = PathResolver;
