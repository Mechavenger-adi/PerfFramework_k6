/**
 * PathResolver.ts
 * Phase 2 - Dynamic Path Resolution
 * Resolves script paths dynamically so users don't need to hardcode absolute/relative paths in test plans.
 */
import * as fs from 'fs';
import * as path from 'path';

export class PathResolver {
  /**
   * Resolves a script path name.
   * 1. If it's an exact file that exists, returns the absolute path.
   * 2. If it's just a filename (e.g. `browse-journey.js`), deeply searches `scrum-suites` for a match.
   *
   * @param targetPath The path or filename to resolve.
   * @param searchRoot The root directory to search in, defaults to 'scrum-suites'.
   * @returns The resolved absolute path, or null if not found.
   */
  static resolve(targetPath: string, searchRoot: string = 'scrum-suites'): string | null {
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

  private static recursiveSearch(dir: string, targetFile: string): string | null {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const found = this.recursiveSearch(fullPath, targetFile);
        if (found) return found;
      } else if (file === targetFile) {
        return fullPath;
      }
    }

    return null;
  }
}
