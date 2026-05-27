/**
 * PostmanAdapter — parses Postman Collection v2.1 JSON into framework TransactionGroup[].
 *
 * Phase 2 of the Request Import feature. See `ai_context/design-proposals.md`
 * → "Request Import" → "Phase 2" for scope and constraints.
 *
 * Design choices that matter:
 *  - In-house parser (no `postman-collection` SDK dep). Postman v2.1 is a
 *    stable, well-documented JSON schema; the v1 mapping is dumb 1:1 and does
 *    not need the SDK's runtime model (variable resolution, request executor,
 *    response evaluator, etc.).
 *  - Produces `TransactionGroup[]` containing synthetic `HAREntry` objects so
 *    the existing ScriptGenerator emits the script unchanged.
 *  - Nested folders flatten with dot notation (`API.Auth.Login`).
 *  - Request-level auth only. Collection/folder auth cascade is out of scope
 *    for v1 — flagged as a warning when seen.
 *  - Pre-request and test scripts are not translatable (different runtime);
 *    they are preserved verbatim inside `// TODO:` block comments on the
 *    transaction body.
 */

import * as fs from 'fs';
import * as path from 'path';
import { HAREntry } from '../types/HARContracts';
import { TransactionGroup } from './TransactionGrouper';

export interface PostmanParseResult {
  groups: TransactionGroup[];
  warnings: string[];
  /**
   * Module-scope code (file `open()` bindings) that the generator should
   * inject at init context, populated when the collection contains file
   * uploads or multipart-with-files. Empty string when not needed.
   */
  extraInitCode: string;
  /**
   * Additional imports required by `extraInitCode`. Empty when not needed.
   * Typically contains `import { open } from 'k6/experimental/fs';` plus
   * `import http from 'k6/http';` for `http.file(...)` in multipart bodies.
   */
  extraImports: string[];
  /**
   * Files that were successfully copied from the Postman-recorded path into
   * the team's `data/` folder. Caller uses this to emit copy artifacts and
   * inform the user. Path is the absolute source path.
   */
  copiedFiles: { source: string; destRelative: string }[];
}

export interface PostmanParseOptions {
  /** Only emit requests under this folder name (direct match only; no path nesting). */
  folderFilter?: string;
  /**
   * Where to copy file-upload source files into. Should be the absolute path
   * to `testSuites/<team>/data/`. When set, the adapter tries to copy every
   * `body.mode = "file"` (and formdata file fields) into this dir and rewrite
   * the path to be relative to the generated script (`../data/<filename>`).
   * Files that don't exist on disk get a placeholder path + a warning.
   */
  dataDir?: string;
}

/** Internal: a tracked file binding for k6 init-context code generation. */
interface FileBinding {
  /** JS identifier used at module scope (`photoBytes_1`). */
  varName: string;
  /** Path k6 will `open()` — relative to the script (`'../data/photo.jpg'`). */
  scriptRelPath: string;
  /** MIME type guessed from extension; used for `http.file()` in multipart. */
  mime: string;
  /** Original Postman path; preserved so we can warn if file wasn't copied. */
  originalSrc: string;
  /** True if the source file was found locally and copied into data/. */
  copied: boolean;
}

// ---------------------------------------------------------------------------
// Minimal Postman v2.1 typings — only the fields we read.
// ---------------------------------------------------------------------------

interface PostmanCollectionFile {
  info?: { name?: string; schema?: string };
  item?: PostmanItem[];
  auth?: PostmanAuth;
  variable?: { key: string; value: string }[];
}

interface PostmanItem {
  name?: string;
  item?: PostmanItem[]; // folder
  request?: PostmanRequest | string;
  event?: PostmanEvent[];
  auth?: PostmanAuth;
}

type PostmanRequest =
  | string
  | {
      method?: string;
      url?: PostmanUrl;
      header?: PostmanHeader[] | string;
      body?: PostmanBody;
      auth?: PostmanAuth;
      description?: string;
    };

type PostmanUrl =
  | string
  | {
      raw?: string;
      protocol?: string;
      host?: string | string[];
      path?: string | string[];
      port?: string;
      query?: { key: string; value?: string; disabled?: boolean }[];
      hash?: string;
    };

interface PostmanHeader {
  key: string;
  value?: string;
  disabled?: boolean;
  type?: string;
}

interface PostmanBody {
  mode?: 'raw' | 'urlencoded' | 'formdata' | 'file' | 'graphql' | 'none';
  raw?: string;
  urlencoded?: { key: string; value?: string; disabled?: boolean }[];
  formdata?: {
    key: string;
    value?: string;
    type?: 'text' | 'file';
    src?: string | string[];
    disabled?: boolean;
  }[];
  file?: { src?: string };
  graphql?: { query?: string; variables?: string };
  options?: { raw?: { language?: 'json' | 'text' | 'xml' | 'html' | 'javascript' } };
}

interface PostmanAuth {
  type:
    | 'bearer'
    | 'basic'
    | 'apikey'
    | 'oauth1'
    | 'oauth2'
    | 'digest'
    | 'awsv4'
    | 'ntlm'
    | 'noauth'
    | string;
  bearer?: PostmanAuthParam[];
  basic?: PostmanAuthParam[];
  apikey?: PostmanAuthParam[];
  [key: string]: unknown;
}

interface PostmanAuthParam {
  key: string;
  value?: string;
  type?: string;
}

interface PostmanEvent {
  listen: 'prerequest' | 'test' | string;
  script?: { exec?: string[] | string; type?: string };
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// PostmanAdapter
// ---------------------------------------------------------------------------

export class PostmanAdapter {
  /**
   * Read a Postman v2.1 collection JSON file and convert to TransactionGroup[].
   */
  static parseFile(filePath: string, opts: PostmanParseOptions = {}): PostmanParseResult {
    const content = fs.readFileSync(filePath, 'utf-8');
    let json: PostmanCollectionFile;
    try {
      json = JSON.parse(content);
    } catch (err) {
      throw new Error(
        `[PostmanAdapter] failed to parse collection JSON at "${filePath}": ${(err as Error).message}`,
      );
    }
    return this.parse(json, opts);
  }

  /**
   * Convert a parsed Postman collection object to TransactionGroup[].
   */
  static parse(
    collection: PostmanCollectionFile,
    opts: PostmanParseOptions = {},
  ): PostmanParseResult {
    const warnings: string[] = [];

    this.assertCollectionShape(collection, warnings);

    if (collection.auth) {
      warnings.push(
        'Collection-level auth found; request-level auth only is honored in v1. Apply auth per request or update generated script.',
      );
    }

    const groupBuckets = new Map<string, HAREntry[]>();
    const groupOrder: string[] = [];

    // Shared file-binding tracker — accumulated across all requests so the
    // same source file referenced twice maps to one open() declaration.
    const fileBindings: FileBinding[] = [];
    const copiedFiles: PostmanParseResult['copiedFiles'] = [];

    let requestCounter = 0;

    const visit = (
      items: PostmanItem[],
      folderPath: string[],
      parentAuth: PostmanAuth | undefined,
    ): void => {
      for (const item of items) {
        const itemAuth = item.auth ?? parentAuth;
        if (item.item) {
          // It's a folder.
          const nextPath = [...folderPath, sanitizeName(item.name ?? 'folder')];
          if (item.auth) {
            warnings.push(
              `Folder "${nextPath.join('.')}" has folder-level auth; cascade not applied in v1. Re-declare auth on each request or post-edit the script.`,
            );
          }
          visit(item.item, nextPath, itemAuth);
          continue;
        }

        if (item.request === undefined) {
          warnings.push(`Item "${item.name ?? '<unnamed>'}" has no request or sub-items; skipped.`);
          continue;
        }

        const requestName = sanitizeName(item.name ?? `request_${requestCounter + 1}`);
        const groupName = folderPath.length > 0 ? folderPath.join('.') : requestName;

        if (opts.folderFilter && folderPath[0] !== sanitizeName(opts.folderFilter)) {
          continue;
        }

        requestCounter++;
        const entry = this.requestToHAREntry(
          item,
          `req_${requestCounter}`,
          groupName,
          itemAuth,
          warnings,
          { fileBindings, copiedFiles, dataDir: opts.dataDir },
        );
        if (!groupBuckets.has(groupName)) {
          groupBuckets.set(groupName, []);
          groupOrder.push(groupName);
        }
        groupBuckets.get(groupName)!.push(entry);
      }
    };

    visit(collection.item ?? [], [], collection.auth);

    const groups: TransactionGroup[] = groupOrder.map((name) => ({
      name,
      entries: groupBuckets.get(name)!,
    }));

    if (groups.length === 0) {
      warnings.push('No requests found in the collection.');
    }

    // Build the module-scope init code from collected file bindings. Each
    // unique file becomes one `await open(...)` declaration. Imports come
    // from a stable set so the generator can de-dupe against its own.
    const extraImports: string[] = [];
    let extraInitCode = '';
    if (fileBindings.length > 0) {
      extraImports.push("import { open } from 'k6/experimental/fs';");
      // If any binding is used inside multipart form-data, we also need k6/http
      // for `http.file(...)`. Detect by scanning entries' postData.expression.
      const usesHttpFile = groups.some((g) =>
        g.entries.some((e) => e.postData?.expression?.includes('http.file(')),
      );
      if (usesHttpFile) {
        extraImports.push("import http from 'k6/http';");
      }
      const lines: string[] = [
        '// ---------------------------------------------',
        '// File upload bindings (from Postman file/formdata-file items)',
        '// k6 init-context reads: each VU loads these once at module init.',
        '// ---------------------------------------------',
      ];
      for (const b of fileBindings) {
        if (!b.copied) {
          lines.push(
            `// TODO: file not found at recorded path "${b.originalSrc}".`,
            `//       Place it at "${b.scriptRelPath}" relative to this script.`,
          );
        }
        lines.push(`const ${b.varName} = await open('${b.scriptRelPath}', 'b');`);
      }
      extraInitCode = lines.join('\n');
    }

    return { groups, warnings, extraInitCode, extraImports, copiedFiles };
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private static assertCollectionShape(
    collection: PostmanCollectionFile,
    warnings: string[],
  ): void {
    const schema = collection.info?.schema ?? '';
    if (!schema.includes('v2.1') && !schema.includes('v2.0')) {
      warnings.push(
        `Collection schema "${schema || '<missing>'}" is not v2.0/v2.1. Parse will proceed but may miss fields.`,
      );
    }
  }

  private static requestToHAREntry(
    item: PostmanItem,
    id: string,
    pageref: string,
    effectiveAuth: PostmanAuth | undefined,
    warnings: string[],
    fileCtx: {
      fileBindings: FileBinding[];
      copiedFiles: PostmanParseResult['copiedFiles'];
      dataDir?: string;
    },
  ): HAREntry {
    const reqAny = item.request;
    if (typeof reqAny === 'string') {
      // Shorthand: request is just a URL string → GET.
      const url = reqAny;
      return this.makeEntry({
        id,
        pageref,
        method: 'GET',
        url,
        headers: [],
        body: undefined,
        bodyMime: undefined,
      });
    }

    const req = reqAny ?? {};
    const method = (req.method ?? 'GET').toUpperCase();
    const url = this.resolveUrl(req.url, warnings, item.name ?? id);
    const headers = this.resolveHeaders(req.header);
    const { body, bodyMime, expression, bodyWarnings } = this.resolveBody(
      req.body,
      item.name ?? id,
      fileCtx,
    );
    for (const w of bodyWarnings) {
      warnings.push(`[${item.name ?? id}] ${w}`);
    }

    // Auth: request-level overrides folder/collection auth.
    const auth = req.auth ?? effectiveAuth;
    const authHeaders = this.authToHeaders(auth, warnings, item.name ?? id);
    for (const h of authHeaders) {
      // Don't duplicate Authorization if already present.
      if (
        h.name.toLowerCase() === 'authorization' &&
        headers.some((existing) => existing.name.toLowerCase() === 'authorization')
      ) {
        continue;
      }
      headers.push(h);
    }

    this.warnOnEvents(item.event, warnings, item.name ?? id);

    return this.makeEntry({ id, pageref, method, url, headers, body, bodyMime, expression });
  }

  private static makeEntry(args: {
    id: string;
    pageref: string;
    method: string;
    url: string;
    headers: { name: string; value: string }[];
    body: string | undefined;
    bodyMime: string | undefined;
    /** Raw JS expression to emit as the request body — used for file uploads. */
    expression?: string;
  }): HAREntry {
    let host = '';
    try {
      host = new URL(args.url).host;
    } catch {
      host = '';
    }
    // When `expression` is set, we still surface a stub `text` (empty) so
    // downstream consumers that only read `text` see something coherent, but
    // ScriptGenerator branches on `expression` first.
    const hasBody = args.body !== undefined || args.expression !== undefined;
    return {
      id: args.id,
      method: args.method,
      url: args.url,
      headers: args.headers,
      postData: hasBody
        ? {
            mimeType: args.bodyMime ?? 'application/octet-stream',
            text: args.body ?? '',
            ...(args.expression ? { expression: args.expression } : {}),
          }
        : undefined,
      status: 200,
      responseHeaders: [],
      responseBody: undefined,
      pageref: args.pageref,
      startedDateTime: '1970-01-01T00:00:00.000Z',
      time: 0,
      mimeType: args.bodyMime ?? '',
      host,
    };
  }

  private static resolveUrl(
    url: PostmanUrl | undefined,
    warnings: string[],
    where: string,
  ): string {
    if (!url) {
      warnings.push(`[${where}] request has no URL; emitting "/".`);
      return '/';
    }
    if (typeof url === 'string') return url;
    if (url.raw) return url.raw;

    // Reconstruct from parts.
    const protocol = url.protocol ? `${url.protocol}://` : '';
    const host = Array.isArray(url.host) ? url.host.join('.') : url.host ?? '';
    const port = url.port ? `:${url.port}` : '';
    const pathParts = Array.isArray(url.path) ? url.path : url.path ? [url.path] : [];
    const pathStr = pathParts.length > 0 ? `/${pathParts.join('/')}` : '';
    const queryPairs = (url.query ?? []).filter((q) => !q.disabled);
    const queryStr =
      queryPairs.length > 0
        ? `?${queryPairs.map((q) => `${q.key}=${q.value ?? ''}`).join('&')}`
        : '';
    const hash = url.hash ? `#${url.hash}` : '';
    return `${protocol}${host}${port}${pathStr}${queryStr}${hash}`;
  }

  private static resolveHeaders(
    header: PostmanHeader[] | string | undefined,
  ): { name: string; value: string }[] {
    if (!header) return [];
    if (typeof header === 'string') {
      // Raw header block "Name: value\nName2: value2"
      return header
        .split(/\r?\n/)
        .map((line) => {
          const idx = line.indexOf(':');
          if (idx === -1) return null;
          return { name: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
        })
        .filter((x): x is { name: string; value: string } => x !== null);
    }
    return header
      .filter((h) => !h.disabled && h.key)
      .map((h) => ({ name: h.key, value: h.value ?? '' }));
  }

  private static resolveBody(
    body: PostmanBody | undefined,
    where: string,
    fileCtx: {
      fileBindings: FileBinding[];
      copiedFiles: PostmanParseResult['copiedFiles'];
      dataDir?: string;
    },
  ): {
    body: string | undefined;
    bodyMime: string | undefined;
    /** When set, a raw JS expression for the body — used for file uploads. */
    expression?: string;
    bodyWarnings: string[];
  } {
    const warnings: string[] = [];
    if (!body || body.mode === 'none' || !body.mode) {
      return { body: undefined, bodyMime: undefined, bodyWarnings: warnings };
    }

    if (body.mode === 'raw') {
      const lang = body.options?.raw?.language;
      const bodyMime =
        lang === 'json'
          ? 'application/json'
          : lang === 'xml'
            ? 'application/xml'
            : lang === 'html'
              ? 'text/html'
              : lang === 'javascript'
                ? 'application/javascript'
                : 'text/plain';
      return { body: body.raw ?? '', bodyMime, bodyWarnings: warnings };
    }

    if (body.mode === 'urlencoded') {
      const pairs = (body.urlencoded ?? []).filter((p) => !p.disabled);
      const encoded = pairs
        .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value ?? '')}`)
        .join('&');
      return {
        body: encoded,
        bodyMime: 'application/x-www-form-urlencoded',
        bodyWarnings: warnings,
      };
    }

    if (body.mode === 'formdata') {
      // Mixed text + file multipart. Emit a JS object expression so k6's
      // http.* builds the multipart wrapper itself. File fields become
      // `http.file(varBytes, 'name.ext', 'mime/type')` — see init code at
      // module scope for the corresponding `open()` declarations.
      const entries = (body.formdata ?? []).filter((e) => !e.disabled);
      const objectParts: string[] = [];
      for (const e of entries) {
        const keyExpr = JSON.stringify(e.key);
        if (e.type === 'file') {
          const src = Array.isArray(e.src) ? e.src[0] : e.src;
          if (!src) {
            warnings.push(`formdata file field "${e.key}" missing src; emitting null placeholder.`);
            objectParts.push(`  ${keyExpr}: null /* TODO: provide file */`);
            continue;
          }
          const binding = this.registerFileBinding(src, fileCtx, warnings, where);
          const fileName = path.basename(binding.scriptRelPath);
          objectParts.push(
            `  ${keyExpr}: http.file(${binding.varName}, ${JSON.stringify(fileName)}, ${JSON.stringify(binding.mime)})`,
          );
        } else {
          objectParts.push(`  ${keyExpr}: ${JSON.stringify(e.value ?? '')}`);
        }
      }
      const expression = `{\n${objectParts.join(',\n')},\n}`;
      // For multipart-with-files, do NOT set `Content-Type` ourselves —
      // k6 generates the boundary. If headers contain Content-Type the caller
      // should remove it. We surface a warning so the user knows.
      if (entries.some((e) => e.type === 'file')) {
        warnings.push(
          'Multipart body has file field(s). If you also pass a Content-Type header, k6 will overwrite it with the multipart boundary; safe to remove the manual header.',
        );
      }
      return {
        body: undefined,
        bodyMime: 'multipart/form-data',
        expression,
        bodyWarnings: warnings,
      };
    }

    if (body.mode === 'file') {
      // Raw binary upload: register a file binding and emit the var as the
      // body expression. k6 accepts an ArrayBuffer body directly.
      const src = body.file?.src;
      if (!src) {
        warnings.push('Body mode `file` declared but no `file.src` provided; emitting empty body.');
        return { body: undefined, bodyMime: undefined, bodyWarnings: warnings };
      }
      const binding = this.registerFileBinding(src, fileCtx, warnings, where);
      return {
        body: undefined,
        bodyMime: binding.mime,
        expression: binding.varName,
        bodyWarnings: warnings,
      };
    }

    if (body.mode === 'graphql') {
      const payload = {
        query: body.graphql?.query ?? '',
        variables: body.graphql?.variables ? safeJsonParse(body.graphql.variables) : {},
      };
      return {
        body: JSON.stringify(payload),
        bodyMime: 'application/json',
        bodyWarnings: warnings,
      };
    }

    warnings.push(`Unknown body mode "${body.mode}" — emitting empty body.`);
    return { body: undefined, bodyMime: undefined, bodyWarnings: warnings };
  }

  /**
   * Register a file referenced by a Postman item. De-duplicates by source
   * path: the same file used twice in the collection produces one binding.
   * If the file exists on the local filesystem AND a `dataDir` was supplied,
   * copies the file into `dataDir/<basename>` so the generated script can
   * reference it portably. If the file is missing, still emits the binding
   * (with a TODO comment via `binding.copied=false`) so users can drop the
   * file in later without re-running the import.
   */
  private static registerFileBinding(
    src: string,
    ctx: {
      fileBindings: FileBinding[];
      copiedFiles: PostmanParseResult['copiedFiles'];
      dataDir?: string;
    },
    warnings: string[],
    where: string,
  ): FileBinding {
    // Dedupe by source path.
    const existing = ctx.fileBindings.find((b) => b.originalSrc === src);
    if (existing) return existing;

    const fileName = path.basename(src);
    const varName = `__file_${ctx.fileBindings.length + 1}_${sanitizeName(
      fileName.replace(/\.[^.]+$/, ''),
    )}`;
    const scriptRelPath = `../data/${fileName}`;
    const mime = mimeFromExt(fileName);

    // Warnings here use no `[where]` prefix — the caller (`requestToHAREntry`)
    // wraps every emitted warning with `[item.name]` so adding it here would
    // produce `[Name] [Name] ...` in the user-visible output.
    let copied = false;
    void where;
    if (ctx.dataDir) {
      try {
        if (fs.existsSync(src)) {
          fs.mkdirSync(ctx.dataDir, { recursive: true });
          const dest = path.join(ctx.dataDir, fileName);
          fs.copyFileSync(src, dest);
          copied = true;
          ctx.copiedFiles.push({ source: src, destRelative: scriptRelPath });
        } else {
          warnings.push(
            `file "${src}" not found on disk; emitting binding with placeholder path "${scriptRelPath}". Drop the file into the suite's data/ folder before running the script.`,
          );
        }
      } catch (err) {
        warnings.push(
          `failed to copy "${src}" into data dir: ${(err as Error).message}. Binding still emitted; place the file manually.`,
        );
      }
    } else {
      warnings.push(
        `no dataDir configured; emitted binding "${scriptRelPath}" but did not copy file. Place "${fileName}" at that path manually.`,
      );
    }

    const binding: FileBinding = {
      varName,
      scriptRelPath,
      mime,
      originalSrc: src,
      copied,
    };
    ctx.fileBindings.push(binding);
    return binding;
  }

  private static authToHeaders(
    auth: PostmanAuth | undefined,
    warnings: string[],
    where: string,
  ): { name: string; value: string }[] {
    if (!auth || auth.type === 'noauth') return [];

    const lookup = (params: PostmanAuthParam[] | undefined, key: string): string | undefined =>
      params?.find((p) => p.key === key)?.value;

    if (auth.type === 'bearer') {
      const token = lookup(auth.bearer, 'token');
      if (token) return [{ name: 'Authorization', value: `Bearer ${token}` }];
      warnings.push(`[${where}] bearer auth declared without token; skipping.`);
      return [];
    }

    if (auth.type === 'basic') {
      const username = lookup(auth.basic, 'username') ?? '';
      const password = lookup(auth.basic, 'password') ?? '';
      const encoded = Buffer.from(`${username}:${password}`, 'utf-8').toString('base64');
      return [{ name: 'Authorization', value: `Basic ${encoded}` }];
    }

    if (auth.type === 'apikey') {
      const key = lookup(auth.apikey, 'key') ?? 'X-API-Key';
      const value = lookup(auth.apikey, 'value') ?? '';
      const inLoc = lookup(auth.apikey, 'in');
      if (inLoc && inLoc !== 'header') {
        warnings.push(
          `[${where}] apikey in "${inLoc}" not supported in v1; emitting as header instead.`,
        );
      }
      return [{ name: key, value }];
    }

    warnings.push(
      `[${where}] auth type "${auth.type}" not supported in v1; emit auth header manually.`,
    );
    return [];
  }

  private static warnOnEvents(
    events: PostmanEvent[] | undefined,
    warnings: string[],
    where: string,
  ): void {
    if (!events || events.length === 0) return;
    for (const ev of events) {
      if (ev.disabled) continue;
      if (ev.listen === 'prerequest' || ev.listen === 'test') {
        warnings.push(
          `[${where}] Postman ${ev.listen} script present; ports do not translate to k6. Emit a TODO comment and review manually.`,
        );
      }
    }
  }
}

function sanitizeName(s: string): string {
  return s.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'unnamed';
}

function safeJsonParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

/**
 * Guess a MIME type from a filename extension. Covers the formats users
 * realistically upload via Postman; unknowns fall back to octet-stream so the
 * generated script is always runnable.
 */
function mimeFromExt(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    pdf: 'application/pdf',
    zip: 'application/zip',
    gz: 'application/gzip',
    tar: 'application/x-tar',
    json: 'application/json',
    xml: 'application/xml',
    csv: 'text/csv',
    txt: 'text/plain',
    md: 'text/markdown',
    html: 'text/html',
    htm: 'text/html',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    wav: 'audio/wav',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  return map[ext] ?? 'application/octet-stream';
}
