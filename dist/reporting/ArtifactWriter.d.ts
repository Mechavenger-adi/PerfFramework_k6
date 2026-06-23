export declare class ArtifactWriter {
    static ensureDir(dirPath: string): void;
    static writeJson(filePath: string, data: unknown): void;
    static writeNdjson(filePath: string, rows: Array<Record<string, unknown>>): void;
}
