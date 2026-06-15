/** Outcome of resolving a journey scriptPath. */
export interface PathResolution {
    /**
     * - `resolved`   – exactly one file matched; `path` is the absolute path.
     * - `not_found`  – nothing matched.
     * - `ambiguous`  – a bare filename matched more than one file across the
     *                  search root (e.g. the same journey file under two teams).
     *                  `candidates` lists every match so the caller can ask the
     *                  user to disambiguate.
     */
    status: 'resolved' | 'not_found' | 'ambiguous';
    /** Absolute path of the single match (status === 'resolved'). */
    path?: string;
    /** All absolute matches when status === 'ambiguous'. */
    candidates?: string[];
    /** True when resolved via an exact/relative path rather than the name search. */
    viaExactPath?: boolean;
}
export declare class PathResolver {
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
    static resolveDetailed(targetPath: string, searchRoot?: string): PathResolution;
    /**
     * Back-compatible convenience wrapper. Returns the absolute path for a unique
     * match, or `null` for both "not found" and "ambiguous" — it deliberately
     * does NOT silently pick one of several matches.
     */
    static resolve(targetPath: string, searchRoot?: string): string | null;
    /** Collect ALL files under `dir` (recursively) whose name equals `targetFile`. */
    private static collectMatches;
}
