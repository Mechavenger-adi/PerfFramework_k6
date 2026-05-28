import { TransactionGroup } from './TransactionGrouper';

export interface LifecycleSelection {
  initGroups: string[];
  endGroups: string[];
}

export interface GenerateOptions {
  /**
   * Raw JS code to inject at module scope, AFTER the env declaration and BEFORE
   * the journey lifecycle store. Used by synthetic-source adapters (Postman)
   * that need init-context bindings — e.g. `const photoBytes = await open('../data/photo.jpg', 'b');`
   * for file uploads. The generator auto-adds the appropriate imports when
   * file bindings are detected; callers supply additional imports via
   * `extraImports`.
   */
  extraInitCode?: string;
  /**
   * Additional import statements to add at the top of the file (one per line).
   * Example: `[\"import { open } from 'k6/experimental/fs';\"]`.
   * De-duplicated by string equality with existing imports.
   */
  extraImports?: string[];
  /**
   * Per-entry comment blocks keyed by HAREntry.id (`req_1`, …). Values are
   * line arrays the generator emits verbatim:
   *   - `before` → above the `request(...)` call inside the transaction
   *   - `after`  → after the default `k6Check(...)` for that request
   * Lines may include the `__RES__` placeholder; we substitute the actual
   * response variable name (`res1`, `res2`, …) at emit time.
   */
  entryComments?: Map<string, { before: string[]; after: string[] }>;
}

export class ScriptGenerator {
  /**
   * Generates formatted TypeScript/JavaScript source code based on Transaction Groups.
   * Output uses the transaction() wrapper and request() helper from the framework utils.
   */
  static generate(
    groups: TransactionGroup[],
    lifecycle: LifecycleSelection | undefined,
    teamName: string,
    options?: GenerateOptions,
  ): string {
    let script = `import { transaction, k6Check } from '../../../dist/utils/transaction.js';\n`;
    script += `import { request } from '../../../dist/utils/request.js';\n`;
    script += `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';\n`;
    script += `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';\n`;
    script += `import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';\n`;
    if (options?.extraImports && options.extraImports.length > 0) {
      // De-dupe: skip any extraImport already present in the fixed imports above.
      const seen = new Set(script.split('\n'));
      for (const imp of options.extraImports) {
        if (!seen.has(imp)) {
          script += `${imp}\n`;
          seen.add(imp);
        }
      }
    }
    script += `\n`;

    const baseUrls = this.extractBaseUrls(groups);
    const primaryBaseUrl = baseUrls[0];

    const fallbackUrl = primaryBaseUrl ? primaryBaseUrl.replace(/\/+$/, '') : undefined;
    script += `const env = getEnvContext('${teamName}', ${fallbackUrl ? `{ baseUrl: '${fallbackUrl}' }` : 'undefined'});\n\n`;

    if (options?.extraInitCode && options.extraInitCode.trim().length > 0) {
      // Module-scope code injected here so it runs once per VU at k6 init context,
      // before the journey lifecycle store (and therefore before any actionPhase
      // request that references the bindings).
      script += `${options.extraInitCode.replace(/\n+$/, '')}\n\n`;
    }

    const initSet = new Set(lifecycle?.initGroups ?? []);
    const endSet = new Set(lifecycle?.endGroups ?? []);
    const initGroups = groups.filter((g) => initSet.has(g.name));
    const endGroups = groups.filter((g) => endSet.has(g.name));
    const actionGroups = groups.filter((g) => !initSet.has(g.name) && !endSet.has(g.name));

    script += `const __journeyLifecycleStore = createJourneyLifecycleStore();\n\n`;

    // Script-wide request counter so req_1…req_N is sequential across all phases.
    let scriptRequestId = 0;
    const entryComments = options?.entryComments;
    script += this.buildPhaseFunction('initPhase', initGroups, primaryBaseUrl, scriptRequestId, entryComments);
    scriptRequestId += initGroups.reduce((s, g) => s + g.entries.length, 0);
    script += `\n`;
    script += this.buildPhaseFunction('actionPhase', actionGroups, primaryBaseUrl, scriptRequestId, entryComments);
    scriptRequestId += actionGroups.reduce((s, g) => s + g.entries.length, 0);
    script += `\n`;
    script += this.buildPhaseFunction('endPhase', endGroups, primaryBaseUrl, scriptRequestId, entryComments);
    script += `\n`;
    script += `export default function () {\n`;
    script += `  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });\n`;
    script += `}\n`;
    return script;
  }

  private static buildPhaseFunction(
    functionName: string,
    groups: TransactionGroup[],
    primaryBaseUrl?: string,
    startRequestId = 0,
    entryComments?: Map<string, { before: string[]; after: string[] }>,
  ): string {
    let script = `export function ${functionName}(ctx) {\n`;
    let globalRequestId = startRequestId;

    if (functionName === 'initPhase') {
      script += `  clearCookies();\n\n`;
    }

    if (groups.length === 0) {
      script += `}\n`;
      return script;
    }

    groups.forEach((groupItem, groupIndex) => {
      script += `  transaction('${groupItem.name}', function () {\n`;

      groupItem.entries.forEach((req, reqIndex) => {
        globalRequestId++;
        const method = req.method.toUpperCase();
        const responseName = `res${reqIndex + 1}`;
        const sequentialId = `req_${globalRequestId}`;

        const urlExpr = this.buildUrlExpression(req.url, primaryBaseUrl);
        const hasHeaders = req.headers && req.headers.length > 0;
        const hasBody = !!req.postData?.expression || !!this.buildRequestBody(req.postData);

        // Adapter-supplied notes (Postman pre-request scripts, after
        // translation) emit ABOVE the request call so the user sees them
        // exactly where they apply. `__RES__` placeholder → the response
        // variable name for THIS request.
        const notes = entryComments?.get(req.id);
        if (notes && notes.before.length > 0) {
          for (const line of notes.before) {
            const subbed = line.replace(/__RES__/g, responseName);
            script += subbed.trim().length === 0 ? `\n` : `    ${subbed}\n`;
          }
        }

        script += `    const ${responseName} = request('${method}', ${urlExpr}, {\n`;

        if (hasHeaders) {
          const headersObj: Record<string, string> = {};
          req.headers.forEach((h) => { headersObj[h.name] = h.value; });
          script += `      headers: ${this.formatInlineObject(headersObj, 6)},\n`;
        }

        if (hasBody) {
          // `postData.expression` (when set) means "emit raw — this references
          // a module-scope binding like a file-upload var, not literal text".
          // Used by Postman adapter for file/multipart-file uploads.
          if (req.postData?.expression) {
            script += `      body: ${req.postData.expression},\n`;
          } else {
            const body = this.buildRequestBody(req.postData);
            script += `      body: ${JSON.stringify(body)},\n`;
          }
        }

        script += `      replay: {\n`;
        script += `        id: ${JSON.stringify(sequentialId)},\n`;
        script += `        recordingStartedAt: ${JSON.stringify(req.startedDateTime)},\n`;
        script += `      },\n`;
        script += `    });\n`;

        script += `    k6Check(${responseName}, {\n`;
        script += `      ${JSON.stringify(`${groupItem.name} - status is ${req.status}`)}: (r) => r.status === ${req.status},\n`;
        script += `    });\n`;

        // Test-script notes (after translation) emit BELOW the default
        // k6Check. `__RES__` substituted with the response variable.
        if (notes && notes.after.length > 0) {
          for (const line of notes.after) {
            const subbed = line.replace(/__RES__/g, responseName);
            script += subbed.trim().length === 0 ? `\n` : `    ${subbed}\n`;
          }
        }

        if (reqIndex < groupItem.entries.length - 1) {
          script += `\n`;
        }
      });

      script += `  });\n\n`;

      if (groupIndex < groups.length - 1) {
        script += `  thinktime();\n\n`;
      }
    });

    script += `}\n`;
    return script;
  }

  /**
   * Returns the URL expression to embed directly in the generated script (no extra quoting needed).
   * Same-domain paths become `${env.baseUrl}/path` template literals so request() receives an
   * absolute URL; different-domain URLs are kept as JSON string literals.
   */
  private static buildUrlExpression(absoluteUrl: string, primaryBaseUrl?: string): string {
    if (!primaryBaseUrl) {
      return JSON.stringify(absoluteUrl);
    }
    try {
      const parsed = new URL(absoluteUrl);
      const normalizedOrigin = parsed.origin + '/';
      if (normalizedOrigin === primaryBaseUrl) {
        const path = parsed.pathname + (parsed.search || '') + (parsed.hash || '');
        return `\`\${env.baseUrl}${path}\``;
      }
      return JSON.stringify(absoluteUrl);
    } catch {
      return JSON.stringify(absoluteUrl);
    }
  }

  private static buildRequestBody(
    postData?: TransactionGroup['entries'][number]['postData'],
  ): string | null {
    if (!postData) return null;
    if (postData.text !== undefined && postData.text !== '') {
      return postData.text;
    }
    if (!postData.params || postData.params.length === 0) {
      return null;
    }
    return postData.params
      .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value ?? '')}`)
      .join('&');
  }

  /** Inline-format a plain object as a JS object literal at the given indent level. */
  private static formatInlineObject(obj: Record<string, string>, indent: number): string {
    const pad = ' '.repeat(indent);
    const closePad = ' '.repeat(indent - 2);
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';
    const lines = entries.map(([k, v]) => {
      const key = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
      return `${pad}${key}: ${JSON.stringify(v)}`;
    });
    return `{\n${lines.join(',\n')},\n${closePad}}`;
  }

  /** Extract unique origin URLs (protocol+host) from all HAR entries in all groups. */
  private static extractBaseUrls(groups: TransactionGroup[]): string[] {
    const origins = new Set<string>();
    for (const group of groups) {
      for (const entry of group.entries) {
        try {
          const u = new URL(entry.url);
          origins.add(u.origin + '/');
        } catch { /* skip malformed */ }
      }
    }
    return [...origins];
  }
}
