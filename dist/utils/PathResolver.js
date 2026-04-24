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
     * Resolves a script path name.
     * 1. If it's an exact file that exists, returns the absolute path.
     * 2. If it's just a filename (e.g. `browse-journey.js`), deeply searches `scrum-suites` for a match.
     *
     * @param targetPath The path or filename to resolve.
     * @param searchRoot The root directory to search in, defaults to 'scrum-suites'.
     * @returns The resolved absolute path, or null if not found.
     */
    static resolve(targetPath, searchRoot = 'scrum-suites') {
        const directAbsPath = path.resolve(process.cwd(), targetPath);
        if (fs.existsSync(directAbsPath) && fs.statSync(directAbsPath).isFile()) {
            return directAbsPath;
        }
        // Dynamic search fallback
        const rootAbsDir = path.resolve(process.cwd(), searchRoot);
        if (!fs.existsSync(rootAbsDir)) {
            return null;
        }
        const foundPath = this.recursiveSearch(rootAbsDir, path.basename(targetPath));
        return foundPath;
    }
    static recursiveSearch(dir, targetFile) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                const found = this.recursiveSearch(fullPath, targetFile);
                if (found)
                    return found;
            }
            else if (file === targetFile) {
                return fullPath;
            }
        }
        return null;
    }
}
exports.PathResolver = PathResolver;
//# sourceMappingURL=PathResolver.js.map