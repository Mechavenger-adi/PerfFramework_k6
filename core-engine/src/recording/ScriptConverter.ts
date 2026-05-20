import * as fs from 'fs';
import { LifecycleSelection } from './ScriptGenerator';

/**
 * ScriptConverter
 *
 * Converts conventional k6 scripts (e.g. from Grafana k6 Studio, raw HAR
 * exports, or hand-written scripts) into framework-compatible scripts that
 * include:
 *   - `logExchange()` calls for debug replay
 *   - Request definition objects with `{id, transaction, method, url, body, params}`
 *   - `initTransactions / startTransaction / endTransaction` wrappers
 *   - Proper framework imports
 *   - Runtime variable tracking via `trackCorrelation` / `trackParameter`
 *
 * Handles two major input patterns:
 *   A) "Studio" scripts with `Trend`, `group()`, manual `Date.now()` timing
 *   B) "Semi-framework" scripts that already have transaction helpers but lack logExchange
 */
export class ScriptConverter {
  /**
   * Read a script file and return the converted source.
   */
  static convertFile(filePath: string, teamName?: string, lifecycle?: LifecycleSelection): string {
    const source = fs.readFileSync(filePath, 'utf-8');
    if (!teamName) {
      const match = filePath.match(/[\\/]scrum-suites[\\/]([^\\/]+)[\\/]/);
      teamName = match ? match[1] : 'unknown_team';
    }
    return this.convert(source, teamName, lifecycle);
  }

  /**
   * Convert a raw k6 script string to a framework-compatible script.
   */
  static convert(source: string, teamName: string, lifecycle?: LifecycleSelection): string {
    const lines = source.split('\n');

    const hasLogExchange = /import\s+\{[^}]*logExchange[^}]*\}/.test(source);
    if (hasLogExchange) {
      return this.applyPhaseContract(source, teamName, lifecycle); // already converted
    }

    const hasTrendImport = /import\s+\{[^}]*Trend[^}]*\}/.test(source);

    const detectedBaseUrls = this.extractBaseUrlsFromSource(source);
    const primaryBaseUrl = detectedBaseUrls[0];

    // Build output
    const result: string[] = [];
    let requestCounter = 0;
    let globalRequestId = 0;
    let currentGroupName = '';
    let insideGroup = false;
    let groupBraceDepth = 0;
    // Track the last response variable so we can rename references
    let lastOldResponseVar = '';
    let lastResponseResName = '';

    // Buffer for params and url assignments preceding an HTTP call
    let pendingParams: string | null = null;
    let pendingUrl: string | null = null;

    // Track which lines to skip (Trend declarations, Trend .add lines, manual timing)
    const trendVarNames = new Set<string>();
    const trendDeclLines = new Set<number>();
    const manualTimingStartLines = new Set<number>();

    // Pre-scan: find all Trend variable names and their line numbers
    for (let i = 0; i < lines.length; i++) {
      const trendMatch = lines[i].match(
        /^\s*const\s+(\w+)\s*=\s*new\s+Trend\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/,
      );
      if (trendMatch) {
        trendVarNames.add(trendMatch[1]);
        trendDeclLines.add(i);
      }
    }

    // Pre-scan: find ALL ${...} template expressions for variable tracking.
    // Anything inside ${...} is treated as a variable and will be captured
    // and displayed in the report, irrespective of type.
    //
    // Two tracking strategies:
    //   1. FILES references: emit trackDataRow("fileName", getUniqueItem(FILES["fileName"]))
    //      which auto-registers ALL columns from that CSV row at once.
    //   2. Other expressions: emit trackParameter("name", expression, "expression")
    //      for individual non-data expressions.
    const dataRowTracking = new Map<string, string>(); // fileName → getUniqueItem expression
    const paramTracking: { paramName: string; expression: string }[] = [];
    const paramSeen = new Set<string>();
    const templateExprRegex = /\$\{([^}]+)\}/g;
    let templateExprMatch;
    while ((templateExprMatch = templateExprRegex.exec(source)) !== null) {
      const expr = templateExprMatch[1].trim();
      // Skip correlation_vars references — already tracked via trackCorrelation
      if (/^correlation_vars\s*\[/.test(expr)) continue;
      // Check if this is a FILES data access pattern
      const filesMatch = expr.match(/getUniqueItem\(FILES\[["'](\w+)["']\]\)/);
      if (filesMatch) {
        const fileName = filesMatch[1];
        if (!dataRowTracking.has(fileName)) {
          dataRowTracking.set(fileName, `getUniqueItem(FILES["${fileName}"])`);
        }
        continue; // trackDataRow will cover all properties
      }
      // Non-FILES expression: derive a display name
      let paramName: string;
      const propMatch = expr.match(/\["(\w+)"\]\s*$/);
      if (propMatch) {
        paramName = propMatch[1];
      } else {
        paramName = expr.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').substring(0, 40);
      }
      if (!paramName || paramSeen.has(paramName)) continue;
      paramSeen.add(paramName);
      paramTracking.push({ paramName, expression: expr });
    }
    let paramTrackInjected = false;

    // Pre-scan: find manual timing lines (`const start = Date.now()` and `txn_X.add(Date.now() - start)`)
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*const\s+start\s*=\s*Date\.now\(\)\s*;?\s*$/.test(lines[i])) {
        manualTimingStartLines.add(i);
      }
    }

    let i = 0;
    // Phase 1: Emit imports
    const importBlock = this.buildImportBlock(source, false, false);
    result.push(importBlock);
    result.push(`\nconst env = getEnvContext('${teamName}', ${primaryBaseUrl ? `'${primaryBaseUrl}'` : 'undefined'});`);
    result.push(`registerBaseUrl(env.baseUrl);`);
    for (let j = 1; j < detectedBaseUrls.length; j++) {
      result.push(`registerBaseUrl('${detectedBaseUrls[j]}');`);
    }

    // Skip original import lines and Trend declarations
    const importEndIndex = this.findImportBlockEnd(lines);

    // Transaction names are auto-registered via K6_PERF_TRANSACTION_NAMES env var injected
    // by the framework at run time — no initTransactions() call needed in generated scripts.

    // Phase 2: Process body
    i = importEndIndex;
    while (i < lines.length) {
      let line = lines[i];

      // Strip `http.url` tagged template — replace `http.url\`...\`` with plain template literal
      // The framework uses its own transaction tagging, so http.url grouping is unnecessary
      // and it returns a URL object that causes [object Object] in logging
      line = line.replace(/http\.url\s*`/g, '`');
      lines[i] = line;

      // Skip `export const options = { ... }` block — framework manages k6 options
      // via resolved-options.json. Leaving script-level options would override debug config.
      if (/^\s*export\s+const\s+options\s*=\s*\{/.test(line)) {
        let depth = 0;
        for (let j = i; j < lines.length; j++) {
          for (const ch of lines[j]) {
            if (ch === '{') depth++;
            if (ch === '}') depth--;
          }
          if (depth <= 0) {
            // Skip the entire options block including trailing semicollon
            i = j + 1;
            // Skip trailing blank line after the block
            while (i < lines.length && lines[i].trim() === '') { i++; }
            break;
          }
        }
        continue;
      }

      // Skip Trend declarations
      if (trendDeclLines.has(i)) {
        i++;
        continue;
      }

      // Skip any existing initTransactions() call — no longer emitted in new format
      if (/^\s*initTransactions\s*\(/.test(line)) {
        // Skip potentially multi-line initTransactions call
        let depth = 0;
        for (let j = i; j < lines.length; j++) {
          for (const ch of lines[j]) {
            if (ch === '(') depth++;
            if (ch === ')') depth--;
          }
          i = j + 1;
          if (depth <= 0) break;
        }
        continue;
      }

      // Skip manual timing: `const start = Date.now();`
      if (manualTimingStartLines.has(i)) {
        i++;
        continue;
      }

      // Skip Trend.add lines: `txn_X.add(Date.now() - start);`
      if (this.isTrendAddLine(line, trendVarNames)) {
        i++;
        continue;
      }

      // Skip `let params;`, `let url;`, `let resp;` bare declarations (no longer needed — inlined/renamed)
      // Keep `let match;` and `let regex;` as they're still used for correlation extraction
      if (/^\s*let\s+(params|url|resp)\s*;\s*$/.test(line)) {
        i++;
        continue;
      }

      // Detect group start → emit transaction() wrapper
      const groupMatch = line.match(/^(\s*)group\s*\(\s*['"`]([^'"`]+)['"`]/);
      if (groupMatch && !insideGroup) {
        // Inject variable tracking calls before the first group
        if (!paramTrackInjected && (dataRowTracking.size > 0 || paramTracking.length > 0)) {
          paramTrackInjected = true;
          const pIndent = groupMatch[1] || '  ';
          for (const [fileName, expr] of dataRowTracking) {
            result.push(`${pIndent}trackDataRow("${fileName}", ${expr});`);
          }
          for (const pt of paramTracking) {
            result.push(`${pIndent}trackParameter("${pt.paramName}", ${pt.expression}, "expression");`);
          }
          result.push('');
        }

        insideGroup = true;
        currentGroupName = groupMatch[2];
        requestCounter = 0;
        lastOldResponseVar = '';
        lastResponseResName = '';
        pendingParams = null;
        pendingUrl = null;

        // Skip original group(...) lines until we pass the opening { of the group body
        let braceLineIdx = i;
        while (braceLineIdx < lines.length && !lines[braceLineIdx].includes('{')) {
          braceLineIdx++;
        }
        i = braceLineIdx + 1;

        // Emit transaction() wrapper instead of group() + startTransaction()
        const groupIndent = groupMatch[1];
        const sanitizedName = this.sanitizeTransactionName(currentGroupName);
        result.push(`${groupIndent}transaction('${sanitizedName}', () => {`);
        groupBraceDepth = 1; // the transaction body { is now open

        continue;
      }

      // Capture pending har_entry comment for the next HTTP call
      const harEntryComment = line.match(/^\s*\/\/\s*har_entry:\s*(req_\d+)/);
      if (harEntryComment) {
        result.push(line);
        i++;
        continue;
      }

      // Inside a group: buffer `params = { ... };` blocks instead of emitting
      if (insideGroup && /^\s*params\s*=\s*\{/.test(line)) {
        let depth = 0;
        let buf = '';
        let j = i;
        for (; j < lines.length; j++) {
          let bufLine = lines[j].replace(/http\.url\s*`/g, '`');
          buf += bufLine + '\n';
          for (const ch of bufLine) {
            if (ch === '{') depth++;
            if (ch === '}') depth--;
          }
          if (depth <= 0) break;
        }
        // Track group brace depth for the consumed lines
        for (let k = i; k <= j && k < lines.length; k++) {
          for (const ch of lines[k]) {
            if (ch === '{') groupBraceDepth++;
            if (ch === '}') groupBraceDepth--;
          }
        }
        // Remove leading `params = ` and trailing `;`
        pendingParams = buf.replace(/^\s*params\s*=\s*/, '').replace(/;\s*$/, '').trim();
        i = j + 1;
        continue;
      }

      // Inside a group: buffer `url = ...;` assignments instead of emitting
      if (insideGroup && /^\s*url\s*=\s*/.test(line) && !this.matchHttpCall(line)) {
        let urlExpr = line.replace(/^\s*url\s*=\s*/, '').replace(/;\s*$/, '').trim();
        urlExpr = urlExpr.replace(/http\.url\s*`/g, '`');
        pendingUrl = urlExpr;
        // Track group brace depth
        for (const ch of line) {
          if (ch === '{') groupBraceDepth++;
          if (ch === '}') groupBraceDepth--;
        }
        i++;
        continue;
      }

      // Detect HTTP calls — check BEFORE general brace tracking
      const httpMatch = this.matchHttpCall(line);
      if (httpMatch && insideGroup) {
        requestCounter++;
        globalRequestId++;
        const indent = this.getLeadingWhitespace(line);
        const { method, url, body, params, varName, fullCallLines } =
          this.parseHttpCall(lines, i, httpMatch);

        // Track braces in ALL consumed lines of the HTTP call
        for (let k = i; k < i + fullCallLines; k++) {
          for (const ch of lines[k]) {
            if (ch === '{') groupBraceDepth++;
            if (ch === '}') groupBraceDepth--;
          }
        }

        const resName = `res_${requestCounter}`;

        // Always use sequential global ID
        const entryId = `req_${globalRequestId}`;

        // Resolve URL: prefer buffered pendingUrl, then parsed url from call args
        const resolvedUrl = pendingUrl || url;

        // Resolve params: prefer buffered pendingParams (inline object), then parsed
        const resolvedParams = pendingParams || params;

        // Reset buffers
        pendingParams = null;
        pendingUrl = null;

        // Emit request() call — resolves URL, sanitizes headers, emits snapshots on failure
        const requestCall = this.buildRequestCallString(
          method,
          resolvedUrl,
          body,
          resolvedParams,
          entryId,
          resName,
          indent,
          primaryBaseUrl,
        );
        result.push(requestCall);

        // Track response variable mapping for renaming later references
        if (varName) {
          lastOldResponseVar = varName;
          lastResponseResName = resName;
        }

        // Skip original lines consumed by the HTTP call
        i += fullCallLines;

        // Look ahead for check() — skip blank lines and comments
        while (i < lines.length) {
          const nextLine = lines[i];
          const trimmed = nextLine.trim();
          if (trimmed === '' || trimmed.startsWith('//')) {
            result.push(nextLine);
            i++;
            continue;
          }
          const checkMatch = nextLine.match(
            /^(\s*)check\s*\(\s*(\w+)\s*,/,
          );
          if (checkMatch) {
            const newCheck = nextLine.replace(
              new RegExp(`check\\s*\\(\\s*${checkMatch[2]}\\s*,`),
              `check(${resName},`,
            );
            result.push(newCheck);
            i++;
          }
          break;
        }

        continue;
      }

      // Track brace depth inside groups (for non-HTTP lines)
      if (insideGroup) {
        for (const ch of line) {
          if (ch === '{') groupBraceDepth++;
          if (ch === '}') groupBraceDepth--;
        }

        // Group closed when depth reaches 0 — close the transaction() arrow function
        if (groupBraceDepth <= 0) {
          insideGroup = false;
          currentGroupName = '';
          pendingParams = null;
          pendingUrl = null;
          const groupIndent = this.getLeadingWhitespace(line);
          result.push(`${groupIndent}});`);
          i++;
          continue;
        }
      }

      // Rename references to old response variable (e.g. resp → res_X)
      let emitLine = line;
      if (lastOldResponseVar && insideGroup) {
        const varPattern = new RegExp(`\\b${lastOldResponseVar}\\b`, 'g');
        emitLine = emitLine.replace(varPattern, lastResponseResName);
      }

      // Rewrite correlation_vars assignment to use trackCorrelation
      // Pattern: `correlation_vars["key"] = match[1];` → `correlation_vars["key"] = trackCorrelation("key", match[1], "body");`
      const corrSetMatch = emitLine.match(
        /^(\s*)correlation_vars\s*\[\s*["']([^"']+)["']\s*\]\s*=\s*(.+?)\s*;\s*$/,
      );
      if (corrSetMatch) {
        const [, ws, corrName, corrExpr] = corrSetMatch;
        emitLine = `${ws}correlation_vars["${corrName}"] = trackCorrelation("${corrName}", ${corrExpr}, "body");`;
      }

      result.push(emitLine);
      i++;
    }

    return this.applyPhaseContract(result.join('\n'), teamName, lifecycle);
  }

  // ── Helpers ──────────────────────────────────────────────────

  static extractGroupNames(source: string): string[] {
    const names: string[] = [];
    const regex = /group\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = regex.exec(source)) !== null) {
      names.push(match[1]);
    }
    return names;
  }

  private static buildImportBlock(
    source: string,
    _hasTransactionImport: boolean,
    _hasLogReplayExchange: boolean,
  ): string {
    const lines: string[] = [];

    lines.push(`import { check, sleep } from 'k6';`);
    lines.push(`import { transaction } from '../../../core-engine/src/utils/transaction.js';`);
    lines.push(`import { request } from '../../../core-engine/src/utils/request.js';`);
    // trackCorrelation / trackParameter / trackDataRow still needed for correlation/data tracking
    lines.push(
      `import { trackCorrelation, trackParameter, trackDataRow } from '../../../core-engine/src/utils/replayLogger.js';`,
    );
    lines.push(
      `import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../core-engine/src/utils/lifecycle.js';`,
    );
    lines.push(
      `import { clearCookies, registerBaseUrl, getEnvContext } from '../../../core-engine/src/utils/session.js';`,
    );

    // Preserve any other imports from the original source (CorrelationEngine, RuleProcessor, etc.)
    const srcLines = source.split('\n');
    for (const srcLine of srcLines) {
      if (!/^\s*import\s/.test(srcLine)) continue;
      if (/from\s+['"]k6(\/http|\/metrics)?['"]/.test(srcLine)) continue;
      if (/initTransactions|startTransaction|endTransaction|transaction/.test(srcLine)) continue;
      if (/logExchange|logReplayExchange|replayLogger/.test(srcLine)) continue;
      if (/lifecycle\.js/.test(srcLine)) continue;
      if (/session\.js/.test(srcLine)) continue;
      if (/request\.js/.test(srcLine)) continue;
      lines.push(srcLine.trim());
    }

    return lines.join('\n');
  }

  private static findImportBlockEnd(lines: string[]): number {
    let i = 0;
    let lastImportOrTrend = 0;
    for (; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (
        trimmed.startsWith('import ') ||
        /^const\s+\w+\s*=\s*new\s+Trend\s*\(/.test(trimmed) ||
        trimmed === '' ||
        trimmed.startsWith('//')
      ) {
        // Check if this is likely still the import/declaration block
        if (trimmed.startsWith('import ') || /new\s+Trend/.test(trimmed)) {
          lastImportOrTrend = i;
        }
        continue;
      }
      // Stop at initTransactions — it will be handled by the main loop
      if (/^initTransactions\s*\(/.test(trimmed)) {
        break;
      }
      break;
    }
    return lastImportOrTrend + 1;
  }

  private static matchHttpCall(
    line: string,
  ): { method: string; varPrefix: string } | null {
    // Match: `let/const res = http.get(...)`, `resp = http.request(...)`, or `http.get(...)`
    const match = line.match(
      /(?:(?:(?:let|const|var)\s+)?(\w+)\s*=\s*)?http\.(get|post|put|patch|del|request)\s*\(/,
    );
    if (!match) return null;
    return { method: match[2], varPrefix: match[1] || '' };
  }

  private static parseHttpCall(
    lines: string[],
    startIdx: number,
    httpMatch: { method: string; varPrefix: string },
  ): {
    method: string;
    url: string;
    body: string | null;
    params: string | null;
    varName: string;
    fullCallLines: number;
  } {
    // Consume lines until balanced parens
    let combined = '';
    let depth = 0;
    let linesConsumed = 0;
    for (let j = startIdx; j < lines.length; j++) {
      combined += lines[j] + '\n';
      linesConsumed++;
      for (const ch of lines[j]) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
      }
      if (depth <= 0) break;
    }

    let method = httpMatch.method.toUpperCase();
    const varName = httpMatch.varPrefix || '';

    // Extract arguments from the http call
    // Find the opening paren of the http.X( call
    const callMatch = combined.match(
      /http\.(?:get|post|put|patch|del|request)\s*\(([\s\S]*)\)\s*;?\s*$/,
    );
    const argsStr = callMatch ? callMatch[1].trim() : '';

    const args = this.splitTopLevelArgs(argsStr);

    let url = '';
    let body: string | null = null;
    let params: string | null = null;

    if (method === 'GET') {
      url = args[0] || '""';
      params = args[1] || null;
    } else if (method === 'DEL') {
      url = args[0] || '""';
      body = args[1] || null;
      params = args[2] || null;
    } else if (method === 'REQUEST') {
      // http.request(method, url, body, params) — extract actual HTTP verb from first arg
      const rawMethod = (args[0] || '').replace(/^['"`]|['"`]$/g, '').toUpperCase();
      if (rawMethod && rawMethod !== 'REQUEST') method = rawMethod;
      url = args[1] || '""';
      body = args[2] || null;
      params = args[3] || null;
    } else {
      // POST, PUT, PATCH
      url = args[0] || '""';
      body = args[1] || null;
      params = args[2] || null;
    }

    return { method, url, body, params, varName, fullCallLines: linesConsumed };
  }

  /**
   * Split a string of function arguments at the top level (respecting nested
   * braces, brackets, parens, and strings).
   */
  private static splitTopLevelArgs(str: string): string[] {
    const args: string[] = [];
    let depth = 0;
    let current = '';
    let inString: string | null = null;
    let escaped = false;

    for (const ch of str) {
      if (escaped) {
        current += ch;
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        current += ch;
        escaped = true;
        continue;
      }
      if (inString) {
        current += ch;
        if (ch === inString) inString = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        inString = ch;
        current += ch;
        continue;
      }
      if (ch === '(' || ch === '{' || ch === '[') {
        depth++;
        current += ch;
        continue;
      }
      if (ch === ')' || ch === '}' || ch === ']') {
        depth--;
        current += ch;
        continue;
      }
      if (ch === ',' && depth === 0) {
        args.push(current.trim());
        current = '';
        continue;
      }
      current += ch;
    }
    if (current.trim()) args.push(current.trim());
    return args;
  }


  /**
   * Build a `request()` call string using the framework helper.
   * Replaces the old request-def + http.* + logExchange pattern.
   */
  private static buildRequestCallString(
    method: string,
    url: string,
    body: string | null,
    paramsStr: string | null,
    entryId: string,
    resName: string,
    indent: string,
    primaryBaseUrl?: string,
  ): string {
    const inner = indent + '  ';
    const m = method === 'DEL' ? 'DELETE' : method;
    const resolvedUrl = this.toRuntimeUrlExpression(url, primaryBaseUrl);

    let s = `${indent}const ${resName} = request('${m}', ${resolvedUrl}, {\n`;

    // Headers — extract from paramsStr if present
    if (paramsStr && paramsStr !== 'null' && paramsStr !== 'undefined') {
      const isVarRef = /^[a-zA-Z_$]\w*$/.test(paramsStr.trim());
      if (isVarRef) {
        s += `${inner}headers: ${paramsStr.trim()}.headers,\n`;
      } else {
        const headersContent = this.extractObjectProperty(paramsStr, 'headers');
        if (headersContent) {
          s += `${inner}headers: ${this.reindent(headersContent, inner)},\n`;
        }
      }
    }

    // Body
    if (body && body !== 'null' && body !== 'undefined') {
      s += `${inner}body: ${body},\n`;
    }

    // Replay metadata for debug diff tracing
    s += `${inner}replay: { harEntryId: ${JSON.stringify(entryId)}, recordingStartedAt: 'converted' },\n`;

    s += `${indent}});`;
    return s;
  }

  /**
   * Extract a property value from an object literal string.
   */
  private static extractObjectProperty(objStr: string, propName: string): string | null {
    const propPattern = new RegExp(`(?:^|[,{\\n])\\s*${propName}\\s*:\\s*`);
    const match = propPattern.exec(objStr);
    if (!match) return null;

    const startOfValue = match.index + match[0].length;
    const firstChar = objStr[startOfValue];

    if (firstChar === '{') {
      let depth = 0;
      let end = startOfValue;
      for (; end < objStr.length; end++) {
        if (objStr[end] === '{') depth++;
        if (objStr[end] === '}') depth--;
        if (depth === 0) { end++; break; }
      }
      return objStr.slice(startOfValue, end).trim();
    }

    let depth = 0;
    let end = startOfValue;
    for (; end < objStr.length; end++) {
      const ch = objStr[end];
      if (ch === '{' || ch === '[' || ch === '(') depth++;
      if (ch === '}' || ch === ']' || ch === ')') {
        if (depth === 0) break;
        depth--;
      }
      if (ch === ',' && depth === 0) break;
    }
    return objStr.slice(startOfValue, end).trim();
  }

  /**
   * Re-indent a multi-line string to align with the given base indent.
   */
  private static reindent(str: string, baseIndent: string): string {
    const lines = str.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 1) return str.trim();
    return lines
      .map((l, idx) => (idx === 0 ? l : `${baseIndent}  ${l}`))
      .join('\n');
  }

  private static isTrendAddLine(line: string, trendVarNames: Set<string>): boolean {
    if (trendVarNames.size === 0) return false;
    const pattern = new RegExp(
      `^\\s*(${[...trendVarNames].join('|')})\\.add\\s*\\(`,
    );
    return pattern.test(line);
  }

  private static getLeadingWhitespace(line: string): string {
    const match = line.match(/^(\s*)/);
    return match ? match[1] : '';
  }

  /**
   * Sanitize a group name for use as a k6 metric name.
   * k6 metrics must only include ASCII letters, numbers, or underscores
   * and start with a letter or underscore (max 128 chars).
   */
  private static sanitizeTransactionName(name: string): string {
    let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');
    // Ensure it starts with a letter or underscore
    if (sanitized && !/^[a-zA-Z_]/.test(sanitized)) {
      sanitized = '_' + sanitized;
    }
    return sanitized.slice(0, 128);
  }

  private static applyPhaseContract(source: string, teamName: string, lifecycle?: LifecycleSelection): string {
    // Normalize stale patterns before phase splitting
    let cleaned = source;
    cleaned = cleaned.replace(/^\s*variableEvents:\s*\[\],?\n/gm, '');
    cleaned = cleaned.replace(
      /from\s+['"](\.\.\/)+(dist\/utils\/)/g,
      `from '../../../core-engine/src/utils/`,
    );

    const markerMatch = cleaned.match(/export\s+default\s+function\s*\(\s*\)\s*\{/);
    if (!markerMatch) {
      return cleaned;
    }
    const defaultStart = markerMatch.index!;

    const bodyStart = cleaned.indexOf('{', defaultStart);
    const bodyEnd = this.findMatchingBrace(cleaned, bodyStart);
    if (bodyStart === -1 || bodyEnd === -1) {
      return cleaned;
    }

    let beforeDefault = cleaned.slice(0, defaultStart);
    const defaultBody = cleaned.slice(bodyStart + 1, bodyEnd);
    const afterDefault = cleaned.slice(bodyEnd + 1);
    const statements = this.splitTopLevelStatements(defaultBody);
    const grouped = this.partitionLifecycleStatements(statements, lifecycle ?? { initGroups: [], endGroups: [] });

    if (!/createJourneyLifecycleStore/.test(beforeDefault)) {
      beforeDefault += `\nimport { createJourneyLifecycleStore, runJourneyLifecycle } from '../../../core-engine/src/utils/lifecycle.js';\n`;
    }

    // Extract and register base URLs from the cleaned script
    const baseUrls = this.extractBaseUrlsFromSource(cleaned);
    const primaryBaseUrl = baseUrls[0];
    const registerBlock = `const env = getEnvContext('${teamName}', ${primaryBaseUrl ? `'${primaryBaseUrl}'` : 'undefined'});\nregisterBaseUrl(env.baseUrl);`;

    return beforeDefault
      + (baseUrls.length > 0 ? registerBlock + '\n\n' : '')
      + `const __journeyLifecycleStore = createJourneyLifecycleStore();\n\n`
      + this.renderPhaseFunction('initPhase', grouped.initPrelude, grouped.initGroups)
      + `\n`
      + this.renderPhaseFunction('actionPhase', grouped.actionPrelude, grouped.actionGroups)
      + `\n`
      + this.renderPhaseFunction('endPhase', grouped.endPrelude, grouped.endGroups)
      + `\n`
      + `export default function () {\n`
      + `  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });\n`
      + `}\n`
      + afterDefault;
  }

  private static renderPhaseFunction(name: string, preludeLines: string[], groupStatements: string[]): string {
    let out = `export function ${name}(ctx) {\n`;
    // Clear cookies at the start of initPhase so each VU starts with a clean session
    if (name === 'initPhase') {
      out += `  clearCookies();\n\n`;
    }
    for (const line of preludeLines) {
      out += `  ${line.trim()}\n`;
    }
    if (preludeLines.length > 0 && groupStatements.length > 0) {
      out += `\n`;
    }
    for (const statement of groupStatements) {
      out += this.indentBlock(statement.trim(), 2) + `\n\n`;
    }
    out += `}\n`;
    return out;
  }

  private static partitionLifecycleStatements(
    statements: string[],
    lifecycle: LifecycleSelection,
  ): {
    initPrelude: string[];
    actionPrelude: string[];
    endPrelude: string[];
    initGroups: string[];
    actionGroups: string[];
    endGroups: string[];
  } {
    const initSet = new Set(lifecycle.initGroups ?? []);
    const endSet = new Set(lifecycle.endGroups ?? []);
    const groupStatements: Array<{ name: string; statement: string }> = [];

    // Classify prelude lines by category
    const correlationSetup: string[] = [];   // const correlation_vars = ... → ctx.correlation bridge
    const dataSetup: string[] = [];          // getUniqueItem(FILES[...]) assignments → initPhase only
    const trackCalls: string[] = [];         // trackDataRow / trackParameter → initPhase only
    const regexDecls: string[] = [];         // let match; let regex; → phases using correlation
    const otherPrelude: string[] = [];       // everything else → all phases

    const initGroupStmts: string[] = [];
    const actionGroupStmts: string[] = [];
    const endGroupStmts: string[] = [];
    let lastPhase: 'init' | 'action' | 'end' | null = null;

    for (const statement of statements) {
      const name = this.extractGroupName(statement);
      if (name) {
        if (initSet.has(name)) {
          initGroupStmts.push(statement);
          lastPhase = 'init';
        } else if (endSet.has(name)) {
          endGroupStmts.push(statement);
          lastPhase = 'end';
        } else {
          actionGroupStmts.push(statement);
          lastPhase = 'action';
        }
        continue;
      }

      if (!statement.trim()) continue;

      const sleepMatch = statement.match(/^\s*sleep\s*\(\s*([^)]*)\s*\)\s*;?/);
      if (sleepMatch) {
        const thinktimeStmt = `thinktime(${sleepMatch[1]});`;
        if (lastPhase === 'init') initGroupStmts.push(thinktimeStmt);
        else if (lastPhase === 'action') actionGroupStmts.push(thinktimeStmt);
        else if (lastPhase === 'end') endGroupStmts.push(thinktimeStmt);
        continue;
      }

      const lines = statement.split('\n').map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (/^\s*const\s+correlation_vars\s*=/.test(line)) {
          correlationSetup.push(line);
        } else if (/^\s*let\s+(match|regex)\s*;/.test(line)) {
          regexDecls.push(line);
        } else if (/getUniqueItem\s*\(/.test(line) || /^\s*(const|let|var)\s+\w+\s*=\s*.*FILES\b/.test(line)) {
          dataSetup.push(line);
        } else if (/^\s*trackDataRow\s*\(/.test(line) || /^\s*trackParameter\s*\(/.test(line)) {
          trackCalls.push(line);
        } else {
          otherPrelude.push(line);
        }
      }
    }

    const usesCorrelation = (stmts: string[]) => stmts.some((s) => /correlation_vars/.test(s));

    // Build per-phase preludes
    // initPhase: correlation bridge + data setup + tracking + regex (if needed) + other
    const initPrelude: string[] = [];
    initPrelude.push('const correlation_vars = ctx.correlation;');
    for (const line of dataSetup) {
      // Convert direct data assignment to ctx.data caching:
      // `const userdetails = getUniqueItem(FILES["userdetails"]);`
      // → `ctx.data.userdetails = ctx.data.userdetails || getUniqueItem(FILES["userdetails"]);`
      // → `const userdetails = ctx.data.userdetails;`
      const dataMatch = line.match(/^\s*(?:const|let|var)\s+(\w+)\s*=\s*(.+?)\s*;?\s*$/);
      if (dataMatch) {
        const varName = dataMatch[1];
        const expr = dataMatch[2].replace(/;$/, '');
        initPrelude.push(`ctx.data.${varName} = ctx.data.${varName} || ${expr};`);
        initPrelude.push(`const ${varName} = ctx.data.${varName};`);
      } else {
        initPrelude.push(line);
      }
    }
    initPrelude.push(...trackCalls);
    if (usesCorrelation(initGroupStmts)) {
      initPrelude.push(...regexDecls);
    }
    initPrelude.push(...otherPrelude);

    // actionPhase: correlation bridge + local data refs from ctx.data + regex (if needed)
    const actionPrelude: string[] = [];
    actionPrelude.push('const correlation_vars = ctx.correlation;');
    // Make data vars available from ctx.data
    for (const line of dataSetup) {
      const dataMatch = line.match(/^\s*(?:const|let|var)\s+(\w+)\s*=\s*.+$/);
      if (dataMatch) {
        actionPrelude.push(`const ${dataMatch[1]} = ctx.data.${dataMatch[1]};`);
      }
    }
    if (usesCorrelation(actionGroupStmts)) {
      actionPrelude.push(...regexDecls);
    }
    actionPrelude.push(...otherPrelude);

    // endPhase: correlation bridge + local data refs + regex (if needed)
    const endPrelude: string[] = [];
    endPrelude.push('const correlation_vars = ctx.correlation;');
    for (const line of dataSetup) {
      const dataMatch = line.match(/^\s*(?:const|let|var)\s+(\w+)\s*=\s*.+$/);
      if (dataMatch) {
        endPrelude.push(`const ${dataMatch[1]} = ctx.data.${dataMatch[1]};`);
      }
    }
    if (usesCorrelation(endGroupStmts)) {
      endPrelude.push(...regexDecls);
    }

    return {
      initPrelude,
      actionPrelude,
      endPrelude,
      initGroups: initGroupStmts,
      actionGroups: actionGroupStmts,
      endGroups: endGroupStmts,
    };
  }

  private static splitTopLevelStatements(body: string): string[] {
    const statements: string[] = [];
    const lines = body.split('\n');
    let current: string[] = [];
    let depth = 0;

    for (const line of lines) {
      current.push(line);
      for (const ch of line) {
        if (ch === '{') depth++;
        if (ch === '}') depth--;
      }

      if (depth === 0 && (line.trim().endsWith(';') || line.trim().endsWith('})') || line.trim() === '}')) {
        const statement = current.join('\n').trim();
        if (statement) statements.push(statement);
        current = [];
      }
    }

    const trailing = current.join('\n').trim();
    if (trailing) statements.push(trailing);

    return statements;
  }

  private static extractGroupName(statement: string): string | null {
    const match = statement.match(/(?:group|transaction)\s*\(\s*['"`]([^'"`]+)['"`]/);
    return match ? match[1] : null;
  }

  private static findMatchingBrace(source: string, startIndex: number): number {
    let depth = 0;
    for (let i = startIndex; i < source.length; i++) {
      const ch = source[i];
      if (ch === '{') depth++;
      if (ch === '}') {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  private static indentBlock(block: string, spaces: number): string {
    const indent = ' '.repeat(spaces);
    return block
      .split('\n')
      .map((line) => `${indent}${line}`)
      .join('\n');
  }

  /** Extract unique base URLs (origin) from URL literals in source code. */
  private static extractBaseUrlsFromSource(source: string): string[] {
    const origins = new Set<string>();
    const urlRe = /https?:\/\/[^\s`'"\\)]+/g;
    let match: RegExpExecArray | null;
    while ((match = urlRe.exec(source)) !== null) {
      try {
        const u = new URL(match[0]);
        origins.add(u.origin + '/');
      } catch { /* skip malformed */ }
    }
    return [...origins];
  }

  private static toRuntimeUrlExpression(url: string, primaryBaseUrl?: string): string {
    const rawUrl = url.replace(/^['"`]|['"`]$/g, '');
    if (!primaryBaseUrl) return `\`\${env.baseUrl}${rawUrl}\``;

    try {
      const parsedUrl = new URL(rawUrl);
      const normalizedOrigin = parsedUrl.origin + '/';
      if (normalizedOrigin === primaryBaseUrl) {
        const pathWithQuery = rawUrl.slice(parsedUrl.origin.length);
        return `\`\${env.baseUrl}${pathWithQuery}\``;
      }
    } catch {
      // Not a valid absolute URL, assume relative
      return `\`\${env.baseUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}\``;
    }

    return url; // fallback to keeping it as is
  }

  private static extractStringLiteralValue(value: string): string | null {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      return null;
    }

    const quote = trimmed[0];
    const lastQuote = trimmed[trimmed.length - 1];
    if ((quote !== '"' && quote !== '\'' && quote !== '`') || quote !== lastQuote) {
      return null;
    }

    const inner = trimmed.slice(1, -1);
    if (quote === '`' && inner.includes('${')) {
      return null;
    }

    return inner;
  }
}
