export declare class PathResolver {
    /**
     * Resolves a script path name.
     * 1. If it's an exact file that exists, returns the absolute path.
     * 2. If it's just a filename (e.g. `browse-journey.js`), deeply searches `scrum-suites` for a match.
     *
     * @param targetPath The path or filename to resolve.
     * @param searchRoot The root directory to search in, defaults to 'scrum-suites'.
     * @returns The resolved absolute path, or null if not found.
     */
    static resolve(targetPath: string, searchRoot?: string): string | null;
    private static recursiveSearch;
}
//# sourceMappingURL=PathResolver.d.ts.map