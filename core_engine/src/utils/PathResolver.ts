/**
 * PathResolver.ts
 * Phase 2 - Dynamic Path Resolution
 * Resolves script paths dynamically so users don't need to hardcode absolute/relative paths in test plans.
 */
import * as fs from 'fs';
import * as path from 'path';

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

export class PathResolver {
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
  static resolveDetailed(targetPath: string, searchRoot: string = 'testSuites'): PathResolution {
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
    if (matches.length === 0) return { status: 'not_found' };
    if (matches.length === 1) return { status: 'resolved', path: matches[0] };
    return { status: 'ambiguous', candidates: matches.sort() };
  }

  /**
   * Back-compatible convenience wrapper. Returns the absolute path for a unique
   * match, or `null` for both "not found" and "ambiguous" — it deliberately
   * does NOT silently pick one of several matches.
   */
  static resolve(targetPath: string, searchRoot: string = 'testSuites'): string | null {
    const result = this.resolveDetailed(targetPath, searchRoot);
    return result.status === 'resolved' ? result.path! : null;
  }

  /** Collect ALL files under `dir` (recursively) whose name equals `targetFile`. */
  private static collectMatches(dir: string, targetFile: string): string[] {
    const out: string[] = [];
    const walk = (current: string): void => {
      for (const entry of fs.readdirSync(current)) {
        const fullPath = path.join(current, entry);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (entry === targetFile) {
          out.push(fullPath);
        }
      }
    };
    walk(dir);
    return out;
  }
}
