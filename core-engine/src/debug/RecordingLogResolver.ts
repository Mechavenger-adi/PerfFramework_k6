import * as fs from 'fs';
import * as path from 'path';

export interface RecordingIndexEntry {
  scriptPath: string;
  recordingLogPath: string;
  sourceHarPath?: string;
  generatedAt?: string;
}

export interface RecordingLogResolution {
  status: 'resolved' | 'missing' | 'ambiguous';
  resolvedPath?: string;
  recordingsDir?: string;
  registryPath?: string;
  expectedPath?: string;
  candidates?: string[];
  warning?: string;
}

export class RecordingLogResolver {
  private static readonly REGISTRY_FILE = '.recording-index.json';

  static resolve(scriptPath: string, explicitRecordingLogPath?: string): RecordingLogResolution {
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
    const exactMatches = new Set<string>();

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

  static upsertRegistryEntry(recordingsDir: string, entry: RecordingIndexEntry): void {
    const registryPath = path.join(recordingsDir, this.REGISTRY_FILE);
    const entries = this.readRegistry(registryPath);
    const normalizedScriptPath = this.normalizePath(path.resolve(process.cwd(), entry.scriptPath));

    const nextEntries = entries.filter((existing) => {
      const existingScriptPath = this.normalizePath(
        path.resolve(process.cwd(), existing.scriptPath),
      );
      return existingScriptPath !== normalizedScriptPath;
    });

    nextEntries.push(entry);

    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
    }

    fs.writeFileSync(registryPath, JSON.stringify(nextEntries, null, 2), 'utf-8');
  }

  private static getSuiteRecordingContext(scriptPath: string) {
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
    const expectedPath = path.join(
      recordingsDir,
      `${path.parse(absoluteScriptPath).name}.recording-log.json`,
    );

    return {
      absoluteScriptPath,
      recordingsDir,
      registryPath,
      expectedPath,
    };
  }

  private static readRegistry(registryPath: string): RecordingIndexEntry[] {
    if (!fs.existsSync(registryPath)) {
      return [];
    }

    try {
      const parsed = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
      return Array.isArray(parsed) ? parsed as RecordingIndexEntry[] : [];
    } catch {
      return [];
    }
  }

  private static normalizePath(input: string): string {
    return path.normalize(input).toLowerCase();
  }
}
