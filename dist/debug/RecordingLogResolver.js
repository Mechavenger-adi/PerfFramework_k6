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
exports.RecordingLogResolver = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class RecordingLogResolver {
    static resolve(scriptPath, explicitRecordingLogPath) {
        if (explicitRecordingLogPath) {
            const absolutePath = path.resolve(process.cwd(), explicitRecordingLogPath);
            if (fs.existsSync(absolutePath)) {
                return {
                    status: 'resolved',
                    resolvedPath: absolutePath,
                    recordingsDir: path.dirname(absolutePath),
                };
            }
            return {
                status: 'missing',
                expectedPath: absolutePath,
                warning: `Recording log not found at explicit path: ${absolutePath}`,
            };
        }
        const suiteInfo = this.getSuiteRecordingContext(scriptPath);
        if (!suiteInfo) {
            return {
                status: 'missing',
                warning: `Could not infer suite recordings folder from script path: ${scriptPath}`,
            };
        }
        const { absoluteScriptPath, recordingsDir, registryPath, expectedPath } = suiteInfo;
        const exactMatches = new Set();
        const registryEntries = this.readRegistry(registryPath);
        for (const entry of registryEntries) {
            const registryScriptPath = path.resolve(process.cwd(), entry.scriptPath);
            if (this.normalizePath(registryScriptPath) === this.normalizePath(absoluteScriptPath)) {
                exactMatches.add(path.resolve(process.cwd(), entry.recordingLogPath));
            }
        }
        if (fs.existsSync(expectedPath)) {
            exactMatches.add(expectedPath);
        }
        const directCandidates = Array.from(exactMatches).filter((candidate) => fs.existsSync(candidate));
        if (directCandidates.length === 1) {
            return {
                status: 'resolved',
                resolvedPath: directCandidates[0],
                recordingsDir,
                registryPath,
                expectedPath,
            };
        }
        if (directCandidates.length > 1) {
            return {
                status: 'ambiguous',
                recordingsDir,
                registryPath,
                expectedPath,
                candidates: directCandidates,
            };
        }
        const basename = path.parse(absoluteScriptPath).name;
        const fuzzyCandidates = fs.existsSync(recordingsDir)
            ? fs.readdirSync(recordingsDir)
                .filter((file) => file.endsWith('.recording-log.json'))
                .filter((file) => file === `${basename}.recording-log.json`)
                .map((file) => path.join(recordingsDir, file))
            : [];
        if (fuzzyCandidates.length === 1) {
            return {
                status: 'resolved',
                resolvedPath: fuzzyCandidates[0],
                recordingsDir,
                registryPath,
                expectedPath,
            };
        }
        if (fuzzyCandidates.length > 1) {
            return {
                status: 'ambiguous',
                recordingsDir,
                registryPath,
                expectedPath,
                candidates: fuzzyCandidates,
            };
        }
        return {
            status: 'missing',
            recordingsDir,
            registryPath,
            expectedPath,
            warning: `Recording log not found for script ${absoluteScriptPath}. Expected ${expectedPath}`,
        };
    }
    static upsertRegistryEntry(recordingsDir, entry) {
        const registryPath = path.join(recordingsDir, this.REGISTRY_FILE);
        const entries = this.readRegistry(registryPath);
        const normalizedScriptPath = this.normalizePath(path.resolve(process.cwd(), entry.scriptPath));
        const nextEntries = entries.filter((existing) => {
            const existingScriptPath = this.normalizePath(path.resolve(process.cwd(), existing.scriptPath));
            return existingScriptPath !== normalizedScriptPath;
        });
        nextEntries.push(entry);
        if (!fs.existsSync(recordingsDir)) {
            fs.mkdirSync(recordingsDir, { recursive: true });
        }
        fs.writeFileSync(registryPath, JSON.stringify(nextEntries, null, 2), 'utf-8');
    }
    static getSuiteRecordingContext(scriptPath) {
        const absoluteScriptPath = path.resolve(process.cwd(), scriptPath);
        const normalized = absoluteScriptPath.replace(/\\/g, '/');
        const marker = '/scrum-suites/';
        const markerIndex = normalized.lastIndexOf(marker);
        const testsMarker = '/tests/';
        const testsIndex = normalized.indexOf(testsMarker, markerIndex + marker.length);
        if (markerIndex === -1 || testsIndex === -1) {
            return null;
        }
        const suiteRoot = normalized.slice(0, testsIndex);
        const recordingsDir = path.normalize(`${suiteRoot}/recordings`);
        const registryPath = path.join(recordingsDir, this.REGISTRY_FILE);
        const expectedPath = path.join(recordingsDir, `${path.parse(absoluteScriptPath).name}.recording-log.json`);
        return {
            absoluteScriptPath,
            recordingsDir,
            registryPath,
            expectedPath,
        };
    }
    static readRegistry(registryPath) {
        if (!fs.existsSync(registryPath)) {
            return [];
        }
        try {
            const parsed = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
            return Array.isArray(parsed) ? parsed : [];
        }
        catch {
            return [];
        }
    }
    static normalizePath(input) {
        return path.normalize(input).toLowerCase();
    }
}
exports.RecordingLogResolver = RecordingLogResolver;
RecordingLogResolver.REGISTRY_FILE = '.recording-index.json';
//# sourceMappingURL=RecordingLogResolver.js.map