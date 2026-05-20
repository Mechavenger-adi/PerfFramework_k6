import { TransactionGroup } from './TransactionGrouper';

export interface LifecycleSelection {
  initGroups: string[];
  endGroups: string[];
}

export class ScriptGenerator {
  /**
   * Generates formatted TypeScript/JavaScript source code based on Transaction Groups.
   * Output uses the transaction() wrapper and request() helper from the framework utils.
   */
  static generate(groups: TransactionGroup[], lifecycle: LifecycleSelection | undefined, teamName: string): string {
    let script = `import { check } from 'k6';\n`;
    script += `import { transaction } from '../../../dist/utils/transaction.js';\n`;
    script += `import { request } from '../../../dist/utils/request.js';\n`;
    script += `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';\n`;
    script += `import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';\n`;
    script += `import { clearCookies, registerBaseUrl, getEnvContext } from '../../../dist/utils/session.js';\n\n`;

    const baseUrls = this.extractBaseUrls(groups);
    const primaryBaseUrl = baseUrls[0];

    script += `const env = getEnvContext('${teamName}', ${primaryBaseUrl ? `'${primaryBaseUrl}'` : 'undefined'});\n`;
    script += `registerBaseUrl(env.baseUrl);\n`;
    for (let i = 1; i < baseUrls.length; i++) {
      script += `registerBaseUrl('${baseUrls[i]}');\n`;
    }
    script += `\n`;

    const initSet = new Set(lifecycle?.initGroups ?? []);
    const endSet = new Set(lifecycle?.endGroups ?? []);
    const initGroups = groups.filter((g) => initSet.has(g.name));
    const endGroups = groups.filter((g) => endSet.has(g.name));
    const actionGroups = groups.filter((g) => !initSet.has(g.name) && !endSet.has(g.name));

    script += `const __journeyLifecycleStore = createJourneyLifecycleStore();\n\n`;

    script += this.buildPhaseFunction('initPhase', initGroups, primaryBaseUrl);
    script += `\n`;
    script += this.buildPhaseFunction('actionPhase', actionGroups, primaryBaseUrl);
    script += `\n`;
    script += this.buildPhaseFunction('endPhase', endGroups, primaryBaseUrl);
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
  ): string {
    let script = `export function ${functionName}(ctx) {\n`;
    let globalRequestId = 0;

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

        const relativePath = this.buildRelativePath(req.url, primaryBaseUrl);
        const hasHeaders = req.headers && req.headers.length > 0;
        const hasBody = !!this.buildRequestBody(req.postData);

        script += `    const ${responseName} = request('${method}', ${JSON.stringify(relativePath)}, {\n`;

        if (hasHeaders) {
          const headersObj: Record<string, string> = {};
          req.headers.forEach((h) => { headersObj[h.name] = h.value; });
          script += `      headers: ${this.formatInlineObject(headersObj, 6)},\n`;
        }

        if (hasBody) {
          const body = this.buildRequestBody(req.postData);
          script += `      body: ${JSON.stringify(body)},\n`;
        }

        script += `      replay: {\n`;
        script += `        harEntryId: ${JSON.stringify(sequentialId)},\n`;
        script += `        recordingStartedAt: ${JSON.stringify(req.startedDateTime)},\n`;
        script += `      },\n`;
        script += `    });\n`;

        script += `    check(${responseName}, {\n`;
        script += `      ${JSON.stringify(`${groupItem.name} - status is ${req.status}`)}: (r) => r.status === ${req.status},\n`;
        script += `    });\n`;

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

  /** Build a relative path from an absolute URL, falling back to the absolute URL if origin differs. */
  private static buildRelativePath(absoluteUrl: string, primaryBaseUrl?: string): string {
    if (!primaryBaseUrl) {
      return absoluteUrl;
    }
    try {
      const parsed = new URL(absoluteUrl);
      const normalizedOrigin = parsed.origin + '/';
      if (normalizedOrigin !== primaryBaseUrl) {
        return absoluteUrl;
      }
      return parsed.pathname + (parsed.search || '') + (parsed.hash || '');
    } catch {
      return absoluteUrl;
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
