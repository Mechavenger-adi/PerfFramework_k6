/**
 * CurlAdapter — parses cURL command strings into framework HAREntry shape.
 *
 * Phase 1 of the Request Import feature. See `ai_context/design-proposals.md`
 * → "Request Import" for scope, constraints, and the phased plan.
 *
 * Design choices that matter:
 *  - In-house parser (no external dep). Covers the v1 flag subset documented in
 *    the design proposal. Unsupported flags → warning + TODO note in the output
 *    rather than a crash.
 *  - Produces HAREntry[] so the existing ScriptGenerator can emit the script
 *    unchanged. We synthesize response-side fields with defaults — the emitter
 *    only consumes request-side fields, so synthetic values never leak through.
 *  - Idempotent: same input → identical HAREntry[] (deterministic ids, no
 *    timestamps from the wall clock).
 */

import * as fs from 'fs';
import * as path from 'path';
import { HAREntry } from '../types/HARContracts';

export interface CurlParseResult {
  entry: HAREntry;
  warnings: string[];
}

export interface ParsedCurlBlock {
  /** Optional transaction name from a leading `# name` comment in multi-curl files. */
  transactionName?: string;
  /** Raw curl text after stripping the optional comment. */
  curlText: string;
}

export class CurlAdapter {
  /**
   * Parse a single cURL string into a HAREntry.
   *
   * @param curl    Raw curl string. Multi-line `\`-continued curls allowed.
   * @param id      Deterministic id assigned to this entry (e.g. "req_1").
   * @param pageref Transaction-group name this entry belongs to.
   * @param baseDir Working directory for resolving `--data @file` references.
   *                Defaults to process.cwd().
   */
  static parse(
    curl: string,
    id: string,
    pageref: string,
    baseDir: string = process.cwd(),
  ): CurlParseResult {
    const warnings: string[] = [];
    const normalized = this.normalizeContinuations(curl);
    const tokens = this.tokenize(normalized);

    if (tokens.length === 0) {
      throw new Error('[CurlAdapter] empty cURL input.');
    }
    if (tokens[0] !== 'curl') {
      throw new Error(
        `[CurlAdapter] input must start with "curl"; got "${tokens[0]}".`,
      );
    }

    let method: string | undefined;
    let url: string | undefined;
    const headers: { name: string; value: string }[] = [];
    let body: string | undefined;
    let bodyMime: string | undefined;
    let basicAuth: string | undefined;

    for (let i = 1; i < tokens.length; i++) {
      const tok = tokens[i];

      if (tok === '-X' || tok === '--request') {
        method = tokens[++i];
        continue;
      }

      if (tok === '-H' || tok === '--header') {
        const raw = tokens[++i];
        const sepIdx = raw.indexOf(':');
        if (sepIdx === -1) {
          warnings.push(`Header without colon ignored: "${raw}".`);
          continue;
        }
        const name = raw.slice(0, sepIdx).trim();
        const value = raw.slice(sepIdx + 1).trim();
        headers.push({ name, value });
        continue;
      }

      if (
        tok === '-d' ||
        tok === '--data' ||
        tok === '--data-raw' ||
        tok === '--data-binary' ||
        tok === '--data-ascii'
      ) {
        const raw = tokens[++i];
        body = this.resolveBody(raw, baseDir, warnings);
        if (tok === '--data-binary' && !bodyMime) {
          bodyMime = 'application/octet-stream';
        }
        continue;
      }

      if (tok === '--data-urlencode') {
        const raw = tokens[++i];
        body = this.resolveBody(raw, baseDir, warnings);
        warnings.push(
          '`--data-urlencode` semantics not preserved (emitted as plain body). Review encoding manually.',
        );
        continue;
      }

      if (tok === '-u' || tok === '--user') {
        const credentials = tokens[++i];
        basicAuth = Buffer.from(credentials, 'utf-8').toString('base64');
        continue;
      }

      if (tok === '-A' || tok === '--user-agent') {
        const ua = tokens[++i];
        headers.push({ name: 'User-Agent', value: ua });
        continue;
      }

      if (tok === '-e' || tok === '--referer') {
        const referer = tokens[++i];
        headers.push({ name: 'Referer', value: referer });
        continue;
      }

      if (tok === '-b' || tok === '--cookie') {
        const cookies = tokens[++i];
        // Cookies as a request header — k6 will also manage its own jar at
        // runtime, but the user's intent is preserved.
        headers.push({ name: 'Cookie', value: cookies });
        warnings.push(
          'Cookie jar flags (`-b`/`-c`) ignored for jar semantics; cookie string emitted as header. k6 manages cookies natively at runtime.',
        );
        continue;
      }

      if (tok === '-F' || tok === '--form') {
        const raw = tokens[++i];
        warnings.push(
          `Multipart form (\`-F\`) not fully supported in Phase 1: "${raw}". Review the generated body manually.`,
        );
        // Best-effort: emit form line as part of the body so the user sees something.
        body = body ? `${body}\n${raw}` : raw;
        if (!bodyMime) bodyMime = 'multipart/form-data';
        continue;
      }

      // Silently-ignored flags: connection/output tweaks that don't affect the
      // shape of the request itself.
      if (this.isSilentlyIgnoredFlag(tok)) {
        // Some of these take an arg, some don't. Consume the arg only if the
        // next token looks like an arg (not another flag and not the URL).
        if (this.flagTakesArg(tok) && i + 1 < tokens.length) {
          i++;
        }
        continue;
      }

      // Bare value: most likely the URL (curl convention: URL is positional).
      if (!tok.startsWith('-')) {
        if (url) {
          warnings.push(
            `Multiple bare arguments seen; using "${url}" as the URL and ignoring "${tok}".`,
          );
        } else {
          url = tok;
        }
        continue;
      }

      // Unknown flag — warn but keep going.
      warnings.push(`Unrecognized cURL flag ignored: "${tok}".`);
    }

    if (!url) {
      throw new Error('[CurlAdapter] cURL input contained no URL.');
    }

    if (basicAuth && !headers.some((h) => h.name.toLowerCase() === 'authorization')) {
      headers.push({ name: 'Authorization', value: `Basic ${basicAuth}` });
    }

    if (!method) {
      // curl convention: -d implies POST when -X is absent.
      method = body !== undefined ? 'POST' : 'GET';
    }

    if (!bodyMime && body !== undefined) {
      const contentType = headers.find(
        (h) => h.name.toLowerCase() === 'content-type',
      );
      bodyMime = contentType?.value ?? 'application/x-www-form-urlencoded';
    }

    let host = '';
    try {
      host = new URL(url).host;
    } catch {
      warnings.push(`URL "${url}" is not absolute; host left blank.`);
    }

    const entry: HAREntry = {
      id,
      method: method.toUpperCase(),
      url,
      headers,
      postData:
        body !== undefined
          ? {
              mimeType: bodyMime ?? 'application/octet-stream',
              text: body,
            }
          : undefined,
      status: 200,
      responseHeaders: [],
      responseBody: undefined,
      pageref,
      startedDateTime: '1970-01-01T00:00:00.000Z',
      time: 0,
      mimeType: bodyMime ?? '',
      host,
    };

    return { entry, warnings };
  }

  /**
   * Split a multi-curl file into individual blocks.
   *
   * Format: blank-line-separated blocks. A leading `# name` comment line on a
   * block sets the transaction name for that block.
   */
  static splitMultiCurlFile(content: string): ParsedCurlBlock[] {
    const blocks: ParsedCurlBlock[] = [];
    const rawBlocks = content
      .split(/\r?\n\s*\r?\n/)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    for (const raw of rawBlocks) {
      const lines = raw.split(/\r?\n/);
      let transactionName: string | undefined;
      let i = 0;
      // Consume leading comment lines; the first `# <text>` line becomes the
      // transaction name. Subsequent comment lines are dropped.
      while (i < lines.length && lines[i].trim().startsWith('#')) {
        if (transactionName === undefined) {
          transactionName = lines[i].trim().replace(/^#\s*/, '').trim() || undefined;
        }
        i++;
      }
      const curlText = lines.slice(i).join('\n').trim();
      if (!curlText) continue;
      blocks.push({ transactionName, curlText });
    }

    return blocks;
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  /** Join lines ending with `\` (POSIX continuation) into one logical line. */
  private static normalizeContinuations(s: string): string {
    return s.replace(/\\\r?\n\s*/g, ' ').trim();
  }

  /**
   * Shell-like tokenizer that respects single/double quotes and backslash
   * escapes within double quotes. Sufficient for the vast majority of
   * real-world curls; documented limitations: no `$'...'` ANSI-C handling,
   * no command substitution, no env expansion.
   */
  private static tokenize(s: string): string[] {
    const tokens: string[] = [];
    let cur = '';
    let started = false; // true once any char (incl. quote) has been seen for this token
    let i = 0;
    let inSingle = false;
    let inDouble = false;

    const flush = (): void => {
      if (started) {
        tokens.push(cur);
        cur = '';
        started = false;
      }
    };

    while (i < s.length) {
      const c = s[i];

      if (inSingle) {
        if (c === "'") {
          inSingle = false;
        } else {
          cur += c;
        }
        i++;
        continue;
      }

      if (inDouble) {
        if (c === '\\' && i + 1 < s.length) {
          // In double quotes, only \, $, `, ", and newline are special. We
          // pass through anything else literally with the backslash.
          const next = s[i + 1];
          if (next === '"' || next === '\\' || next === '$' || next === '`') {
            cur += next;
            i += 2;
            continue;
          }
          cur += c;
          i++;
          continue;
        }
        if (c === '"') {
          inDouble = false;
          i++;
          continue;
        }
        cur += c;
        i++;
        continue;
      }

      // Unquoted context
      if (c === "'") {
        inSingle = true;
        started = true; // empty quoted string is still a token
        i++;
        continue;
      }
      if (c === '"') {
        inDouble = true;
        started = true;
        i++;
        continue;
      }
      if (c === '\\' && i + 1 < s.length) {
        cur += s[i + 1];
        started = true;
        i += 2;
        continue;
      }
      if (/\s/.test(c)) {
        flush();
        i++;
        continue;
      }
      cur += c;
      started = true;
      i++;
    }

    flush();
    return tokens;
  }

  /**
   * `-d @file` / `--data-binary @file` references — load the file contents.
   * Anything else returns the raw string.
   */
  private static resolveBody(raw: string, baseDir: string, warnings: string[]): string {
    if (!raw.startsWith('@')) return raw;
    const ref = raw.slice(1);
    const resolved = path.isAbsolute(ref) ? ref : path.join(baseDir, ref);
    try {
      return fs.readFileSync(resolved, 'utf-8');
    } catch {
      warnings.push(
        `Body file reference "${raw}" could not be read; literal "${raw}" emitted instead.`,
      );
      return raw;
    }
  }

  private static isSilentlyIgnoredFlag(tok: string): boolean {
    return new Set([
      '-k',
      '--insecure',
      '--compressed',
      '-v',
      '--verbose',
      '-s',
      '--silent',
      '-S',
      '--show-error',
      '-L',
      '--location',
      '-o',
      '-O',
      '-i',
      '--include',
      '--max-time',
      '--connect-timeout',
      '-w',
      '--write-out',
      '-c',
      '--cookie-jar',
      '--http2',
      '--http1.1',
      '--http1.0',
      '--resolve',
      '-4',
      '-6',
    ]).has(tok);
  }

  private static flagTakesArg(tok: string): boolean {
    return new Set([
      '-o',
      '-O',
      '--max-time',
      '--connect-timeout',
      '-w',
      '--write-out',
      '-c',
      '--cookie-jar',
      '--resolve',
    ]).has(tok);
  }
}
