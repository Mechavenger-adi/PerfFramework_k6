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
export declare class RecordingLogResolver {
    private static readonly REGISTRY_FILE;
    static resolve(scriptPath: string, explicitRecordingLogPath?: string): RecordingLogResolution;
    static upsertRegistryEntry(recordingsDir: string, entry: RecordingIndexEntry): void;
    private static getSuiteRecordingContext;
    private static readRegistry;
    private static normalizePath;
}
//# sourceMappingURL=RecordingLogResolver.d.ts.map