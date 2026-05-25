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
import { HAREntry } from '../types/HARContracts';
import { TransactionGroup } from './TransactionGrouper';

export interface PostmanParseResult {
  groups: TransactionGroup[];
  warnings: string[];
}

export interface PostmanParseOptions {
  /** Only emit requests under this folder name (direct match only; no path nesting). */
  folderFilter?: string;
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

    return { groups, warnings };
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
    const { body, bodyMime, bodyWarnings } = this.resolveBody(req.body);
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

    return this.makeEntry({ id, pageref, method, url, headers, body, bodyMime });
  }

  private static makeEntry(args: {
    id: string;
    pageref: string;
    method: string;
    url: string;
    headers: { name: string; value: string }[];
    body: string | undefined;
    bodyMime: string | undefined;
  }): HAREntry {
    let host = '';
    try {
      host = new URL(args.url).host;
    } catch {
      host = '';
    }
    return {
      id: args.id,
      method: args.method,
      url: args.url,
      headers: args.headers,
      postData:
        args.body !== undefined
          ? { mimeType: args.bodyMime ?? 'application/octet-stream', text: args.body }
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
  ): {
    body: string | undefined;
    bodyMime: string | undefined;
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
      warnings.push(
        'Body mode `formdata` (multipart) not fully supported in Phase 2. Emitted as a literal JSON representation; review and convert to k6 FormData manually.',
      );
      const repr = JSON.stringify(body.formdata ?? [], null, 2);
      return {
        body: repr,
        bodyMime: 'multipart/form-data',
        bodyWarnings: warnings,
      };
    }

    if (body.mode === 'file') {
      warnings.push(
        'Body mode `file` (binary upload) not supported in Phase 2. Emitting empty body. Re-add file content manually.',
      );
      return { body: undefined, bodyMime: undefined, bodyWarnings: warnings };
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
