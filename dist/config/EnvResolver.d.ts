/**
 * EnvResolver.ts
 * Phase 1 – Loads .env file and exposes typed accessors.
 * This is the first module initialized; everything else reads from it.
 */
export declare class EnvResolver {
    private readonly vars;
    /**
     * Load and parse a .env file from the given path.
     * Falls back to process.env if the file does not exist.
     */
    constructor(envFilePath?: string);
    /** Get a required string variable. Throws if missing. */
    require(key: string): string;
    /** Get an optional string variable with a fallback default. */
    get(key: string, defaultValue?: string): string;
    /** Get an optional boolean variable ('true'/'false'/'1'/'0'). */
    getBool(key: string, defaultValue?: boolean): boolean;
    /** Get an optional numeric variable. */
    getNumber(key: string, defaultValue?: number): number;
    /** Expose all resolved vars (for debug printing – caller should redact secrets). */
    getAll(): Record<string, string>;
}
//# sourceMappingURL=EnvResolver.d.ts.map