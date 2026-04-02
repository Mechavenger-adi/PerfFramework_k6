/**
 * EnvResolver.ts
 * Phase 1 – Loads .env file and exposes typed accessors.
 * This is the first module initialized; everything else reads from it.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

export class EnvResolver {
  private readonly vars: Record<string, string> = {};

  /**
   * Load and parse a .env file from the given path.
   * Falls back to process.env if the file does not exist.
   */
  constructor(envFilePath?: string) {
    const resolvedPath = envFilePath ?? path.resolve(process.cwd(), '.env');

    if (fs.existsSync(resolvedPath)) {
      const parsed = dotenv.parse(fs.readFileSync(resolvedPath));
      Object.assign(this.vars, parsed);
    }

    // Always overlay real process.env so Docker/CI env vars win
    for (const [k, v] of Object.entries(process.env)) {
      if (v !== undefined) this.vars[k] = v;
    }
  }

  /** Get a required string variable. Throws if missing. */
  require(key: string): string {
    const value = this.vars[key];
    if (value === undefined || value === '') {
      throw new Error(`[EnvResolver] Required environment variable '${key}' is missing or empty.`);
    }
    return value;
  }

  /** Get an optional string variable with a fallback default. */
  get(key: string, defaultValue = ''): string {
    return this.vars[key] ?? defaultValue;
  }

  /** Get an optional boolean variable ('true'/'false'/'1'/'0'). */
  getBool(key: string, defaultValue = false): boolean {
    const raw = this.vars[key];
    if (raw === undefined) return defaultValue;
    return raw === 'true' || raw === '1';
  }

  /** Get an optional numeric variable. */
  getNumber(key: string, defaultValue = 0): number {
    const raw = this.vars[key];
    if (raw === undefined) return defaultValue;
    const parsed = Number(raw);
    if (isNaN(parsed)) {
      throw new Error(`[EnvResolver] Variable '${key}' is not a valid number: '${raw}'`);
    }
    return parsed;
  }

  /** Expose all resolved vars (for debug printing – caller should redact secrets). */
  getAll(): Record<string, string> {
    return { ...this.vars };
  }
}
