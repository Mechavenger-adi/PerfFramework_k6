import { TransactionGroup } from './TransactionGrouper';

export interface LifecycleSelection {
  initGroups: string[];
  endGroups: string[];
}

export class ScriptGenerator {
  /**
   * Generates formatted TypeScript/JavaScript source code based on Transaction Groups.
   */
  static generate(groups: TransactionGroup[], lifecycle?: LifecycleSelection): string {
    let script = `import http from 'k6/http';\n`;
    script += `import { check, sleep, group } from 'k6';\n`;
    script += `import { initTransactions, startTransaction, endTransaction } from '../../../core-engine/src/utils/transaction.js';\n`;
    script += `import { createJourneyLifecycleStore, runJourneyLifecycle } from '../../../core-engine/src/utils/lifecycle.js';\n`;
    script += `import { logExchange, trackCorrelation, trackParameter } from '../../../core-engine/src/utils/replayLogger.js';\n\n`;

    const transactionNames = groups.map((g) => g.name);
    const initSet = new Set(lifecycle?.initGroups ?? []);
    const endSet = new Set(lifecycle?.endGroups ?? []);
    const initGroups = groups.filter((groupItem) => initSet.has(groupItem.name));
    const endGroups = groups.filter((groupItem) => endSet.has(groupItem.name));
    const actionGroups = groups.filter((groupItem) => !initSet.has(groupItem.name) && !endSet.has(groupItem.name));

    script += `initTransactions(${this.formatArray(transactionNames)});\n\n`;
    script += `const __journeyLifecycleStore = createJourneyLifecycleStore();\n\n`;

    script += this.buildPhaseFunction('initPhase', initGroups);
    script += `\n`;
    script += this.buildPhaseFunction('actionPhase', actionGroups);
    script += `\n`;
    script += this.buildPhaseFunction('endPhase', endGroups);
    script += `\n`;
    script += `export default function () {\n`;
    script += `  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });\n`;
    script += `}\n`;
    return script;
  }

  private static buildPhaseFunction(functionName: string, groups: TransactionGroup[]): string {
    let script = `export function ${functionName}(ctx) {\n`;
    let globalRequestId = 0;

    if (groups.length === 0) {
      script += `}\n`;
      return script;
    }

    groups.forEach((groupItem, groupIndex) => {
      script += `  group('${groupItem.name}', function () {\n`;
      script += `    startTransaction('${groupItem.name}');\n`;

      groupItem.entries.forEach((req, reqIndex) => {
        globalRequestId++;
        script += `    // har_entry: ${req.id}\n`;

        const method = req.method.toUpperCase();
        const requestName = `request_${reqIndex + 1}`;
        const responseName = `res_${reqIndex + 1}`;
        const sequentialId = `req_${globalRequestId}`;
        const requestDefinition = this.buildRequestDefinition(req, groupItem.name, method, sequentialId);

        script += `    const ${requestName} = ${this.formatValue(requestDefinition, 4)};\n`;
        if (method === 'GET') {
          script += `    const ${responseName} = http.get(${requestName}.url, ${requestName}.params);\n`;
        } else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
          const methodFunc = method.toLowerCase();
          script += `    const ${responseName} = http.${methodFunc}(${requestName}.url, ${requestName}.body, ${requestName}.params);\n`;
        } else if (method === 'DELETE') {
          script += `    const ${responseName} = http.del(${requestName}.url, null, ${requestName}.params);\n`;
        } else {
          script += `    const ${responseName} = http.request(${requestName}.method, ${requestName}.url, ${requestName}.body, ${requestName}.params);\n`;
        }

        script += `    logExchange(${requestName}, ${responseName});\n`;
        script += `    check(${responseName}, {\n`;
        script += `      ${JSON.stringify(`${groupItem.name} - status is ${req.status}`)}: (r) => r.status === ${req.status},\n`;
        script += `    });\n`;

        if (reqIndex < groupItem.entries.length - 1) {
          script += `\n`;
        }
      });

      script += `    endTransaction('${groupItem.name}');\n`;
      script += `  });\n\n`;

      if (groupIndex < groups.length - 1) {
        script += `  sleep(1);\n\n`;
      }
    });

    script += `}\n`;
    return script;
  }

  private static buildRequestDefinition(
    req: TransactionGroup['entries'][number],
    transactionName: string,
    method: string,
    sequentialId: string,
  ): {
    id: string;
    transaction: string;
    recordingStartedAt: string;
    method: string;
    url: string;
    body: string | null;
    params: { headers?: Record<string, string>; cookies: Record<string, string>; redirects: number; tags: Record<string, string> };
  } {
    return {
      id: sequentialId,
      transaction: transactionName,
      recordingStartedAt: req.startedDateTime,
      method,
      url: req.url,
      body: this.buildRequestBody(req.postData),
      params: this.buildRequestParams(req, transactionName, sequentialId),
    };
  }

  private static buildRequestParams(
    req: TransactionGroup['entries'][number],
    transactionName: string,
    sequentialId: string,
  ): { headers?: Record<string, string>; cookies: Record<string, string>; redirects: number; tags: Record<string, string> } {
    const params: { headers?: Record<string, string>; cookies: Record<string, string>; redirects: number; tags: Record<string, string> } = {
      cookies: {},
      redirects: 0,
      tags: {
        transaction: transactionName,
        har_entry_id: sequentialId,
        recording_started_at: req.startedDateTime,
      },
    };

    if (req.headers && req.headers.length > 0) {
      const headersObj: Record<string, string> = {};
      req.headers.forEach((header) => {
        headersObj[header.name] = header.value;
      });
      params.headers = headersObj;
    }

    return params;
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
      .map((param) => `${encodeURIComponent(param.name)}=${encodeURIComponent(param.value ?? '')}`)
      .join('&');
  }

  private static formatArray(items: string[]): string {
    if (items.length === 0) return '[]';

    const lines = items.map((item) => `  ${JSON.stringify(item)}`);
    return `[\n${lines.join(',\n')}\n]`;
  }

  private static formatValue(value: unknown, indentLevel: number): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return JSON.stringify(value);
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);

    const json = JSON.stringify(value, null, 2);
    if (!json) return 'null';

    const indent = ' '.repeat(indentLevel);
    return json
      .split('\n')
      .map((line, index) => (index === 0 ? line : `${indent}${line}`))
      .join('\n')
      .replace(/"([^"]+)":/g, (_match, key: string) => {
        return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? `${key}:` : `"${key}":`;
      });
  }
}
