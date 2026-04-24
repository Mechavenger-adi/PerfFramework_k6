"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptConverter = void 0;
const fs = __importStar(require("fs"));
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
class ScriptConverter {
    /**
     * Read a script file and return the converted source.
     */
    static convertFile(filePath, options = {}) {
        const source = fs.readFileSync(filePath, 'utf-8');
        return this.convert(source, options);
    }
    /**
     * Convert a raw k6 script string to a framework-compatible script.
     */
    static convert(source, options = {}) {
        const lines = source.split('\n');
        const hasLogExchange = /import\s+\{[^}]*logExchange[^}]*\}/.test(source);
        if (hasLogExchange) {
            return options.lifecycle
                ? this.applyLifecycleToConvertedSource(source, options.lifecycle)
                : source; // already converted
        }
        const hasTransactionImport = /import\s+\{[^}]*initTransactions[^}]*\}/.test(source);
        const hasTrendImport = /import\s+\{[^}]*Trend[^}]*\}/.test(source);
        const hasLogReplayExchange = /import\s+\{[^}]*logReplayExchange[^}]*\}/.test(source);
        // Collect group names from `group('name', ...)` calls
        const groupNames = this.extractGroupNames(source);
        // Build output
        const result = [];
        let requestCounter = 0;
        let globalRequestId = 0;
        let currentGroupName = '';
        let insideGroup = false;
        let groupBraceDepth = 0;
        // Track the last response variable so we can rename references
        let lastOldResponseVar = '';
        let lastResponseResName = '';
        // Buffer for params and url assignments preceding an HTTP call
        let pendingParams = null;
        let pendingUrl = null;
        // Track which lines to skip (Trend declarations, Trend .add lines, manual timing)
        const trendVarNames = new Set();
        const trendDeclLines = new Set();
        const manualTimingStartLines = new Set();
        // Pre-scan: find all Trend variable names and their line numbers
        for (let i = 0; i < lines.length; i++) {
            const trendMatch = lines[i].match(/^\s*const\s+(\w+)\s*=\s*new\s+Trend\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/);
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
        const dataRowTracking = new Map(); // fileName → getUniqueItem expression
        const paramTracking = [];
        const paramSeen = new Set();
        const templateExprRegex = /\$\{([^}]+)\}/g;
        let templateExprMatch;
        while ((templateExprMatch = templateExprRegex.exec(source)) !== null) {
            const expr = templateExprMatch[1].trim();
            // Skip correlation_vars references — already tracked via trackCorrelation
            if (/^correlation_vars\s*\[/.test(expr))
                continue;
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
            let paramName;
            const propMatch = expr.match(/\["(\w+)"\]\s*$/);
            if (propMatch) {
                paramName = propMatch[1];
            }
            else {
                paramName = expr.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').substring(0, 40);
            }
            if (!paramName || paramSeen.has(paramName))
                continue;
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
        const importBlock = this.buildImportBlock(source, hasTransactionImport, hasLogReplayExchange);
        result.push(importBlock);
        // Skip original import lines and Trend declarations
        const importEndIndex = this.findImportBlockEnd(lines);
        // Emit initTransactions if not already present
        if (!hasTransactionImport && groupNames.length > 0) {
            const sanitizedNames = groupNames.map((n) => this.sanitizeTransactionName(n));
            result.push('');
            result.push(`initTransactions(${this.formatTransactionArray(sanitizedNames)});`);
        }
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
                        if (ch === '{')
                            depth++;
                        if (ch === '}')
                            depth--;
                    }
                    if (depth <= 0) {
                        // Skip the entire options block including trailing semicollon
                        i = j + 1;
                        // Skip trailing blank line after the block
                        while (i < lines.length && lines[i].trim() === '') {
                            i++;
                        }
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
            // Skip existing initTransactions line when we already emitted a replacement
            if (/^\s*initTransactions\s*\(/.test(line) && !hasTransactionImport) {
                // Skip potentially multi-line initTransactions call
                let depth = 0;
                for (let j = i; j < lines.length; j++) {
                    for (const ch of lines[j]) {
                        if (ch === '(')
                            depth++;
                        if (ch === ')')
                            depth--;
                    }
                    i = j + 1;
                    if (depth <= 0)
                        break;
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
            // Detect group start
            const groupMatch = line.match(/^(\s*)group\s*\(\s*['"`]([^'"`]+)['"`]/);
            if (groupMatch && !insideGroup) {
                // Inject variable tracking calls before the first group
                if (!paramTrackInjected && (dataRowTracking.size > 0 || paramTracking.length > 0)) {
                    paramTrackInjected = true;
                    const pIndent = groupMatch[1] || '  ';
                    // trackDataRow for each unique FILES reference (auto-registers all CSV columns)
                    for (const [fileName, expr] of dataRowTracking) {
                        result.push(`${pIndent}trackDataRow("${fileName}", ${expr});`);
                    }
                    // trackParameter for non-FILES expressions
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
                // Count braces on this line to track depth
                groupBraceDepth = 0;
                for (const ch of line) {
                    if (ch === '{')
                        groupBraceDepth++;
                    if (ch === '}')
                        groupBraceDepth--;
                }
                result.push(line);
                // If no transaction wrappers, inject startTransaction after group opening
                if (!hasTransactionImport) {
                    // Find the opening brace line
                    let braceLineIdx = i;
                    while (braceLineIdx < lines.length && !lines[braceLineIdx].includes('{')) {
                        braceLineIdx++;
                    }
                    // Emit lines up to and including the brace line if different from i
                    while (i < braceLineIdx) {
                        i++;
                        result.push(lines[i]);
                        for (const ch of lines[i]) {
                            if (ch === '{')
                                groupBraceDepth++;
                            if (ch === '}')
                                groupBraceDepth--;
                        }
                    }
                    // Use group indent + standard nesting for the body
                    const groupIndent = groupMatch[1];
                    const bodyIndent = groupIndent + '  ';
                    result.push(`${bodyIndent}startTransaction('${this.sanitizeTransactionName(currentGroupName)}');`);
                }
                i++;
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
                        if (ch === '{')
                            depth++;
                        if (ch === '}')
                            depth--;
                    }
                    if (depth <= 0)
                        break;
                }
                // Track group brace depth for the consumed lines
                for (let k = i; k <= j && k < lines.length; k++) {
                    for (const ch of lines[k]) {
                        if (ch === '{')
                            groupBraceDepth++;
                        if (ch === '}')
                            groupBraceDepth--;
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
                    if (ch === '{')
                        groupBraceDepth++;
                    if (ch === '}')
                        groupBraceDepth--;
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
                const { method, url, body, params, varName, fullCallLines } = this.parseHttpCall(lines, i, httpMatch);
                // Track braces in ALL consumed lines of the HTTP call
                for (let k = i; k < i + fullCallLines; k++) {
                    for (const ch of lines[k]) {
                        if (ch === '{')
                            groupBraceDepth++;
                        if (ch === '}')
                            groupBraceDepth--;
                    }
                }
                const reqName = `request_${requestCounter}`;
                const resName = `res_${requestCounter}`;
                // Always use sequential global ID
                const entryId = `req_${globalRequestId}`;
                // Resolve URL: prefer buffered pendingUrl, then parsed url from call args
                const resolvedUrl = pendingUrl || url;
                // Resolve params: prefer buffered pendingParams (inline object), then parsed
                const resolvedParams = pendingParams || params;
                const reqDef = this.buildRequestDefString(reqName, entryId, currentGroupName, method, resolvedUrl, body, resolvedParams, indent);
                result.push(`${indent}const ${reqName} = ${reqDef};`);
                // Reset buffers
                pendingParams = null;
                pendingUrl = null;
                // Emit the HTTP call using request def
                const httpCall = this.buildHttpCallString(method, reqName, resName, indent);
                result.push(httpCall);
                // Emit logExchange
                result.push(`${indent}logExchange(${reqName}, ${resName});`);
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
                    const checkMatch = nextLine.match(/^(\s*)check\s*\(\s*(\w+)\s*,/);
                    if (checkMatch) {
                        const newCheck = nextLine.replace(new RegExp(`check\\s*\\(\\s*${checkMatch[2]}\\s*,`), `check(${resName},`);
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
                    if (ch === '{')
                        groupBraceDepth++;
                    if (ch === '}')
                        groupBraceDepth--;
                }
                // Group closed when depth reaches 0
                if (groupBraceDepth <= 0) {
                    if (!hasTransactionImport && currentGroupName) {
                        const groupIndent = this.getLeadingWhitespace(line);
                        const bodyIndent = groupIndent + '  ';
                        result.push(`${bodyIndent}endTransaction('${this.sanitizeTransactionName(currentGroupName)}');`);
                    }
                    insideGroup = false;
                    currentGroupName = '';
                    pendingParams = null;
                    pendingUrl = null;
                    result.push(line);
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
            const corrSetMatch = emitLine.match(/^(\s*)correlation_vars\s*\[\s*["']([^"']+)["']\s*\]\s*=\s*(.+?)\s*;\s*$/);
            if (corrSetMatch) {
                const [, ws, corrName, corrExpr] = corrSetMatch;
                emitLine = `${ws}correlation_vars["${corrName}"] = trackCorrelation("${corrName}", ${corrExpr}, "body");`;
            }
            result.push(emitLine);
            i++;
        }
        const converted = result.join('\n');
        return options.lifecycle
            ? this.applyLifecycleToConvertedSource(converted, options.lifecycle)
            : converted;
    }
    // ── Helpers ──────────────────────────────────────────────────
    static extractGroupNames(source) {
        const names = [];
        const regex = /group\s*\(\s*['"`]([^'"`]+)['"`]/g;
        let match;
        while ((match = regex.exec(source)) !== null) {
            names.push(match[1]);
        }
        return names;
    }
    static buildImportBlock(source, hasTransactionImport, hasLogReplayExchange) {
        const lines = [];
        // Always keep http and check/sleep/group
        lines.push(`import http from 'k6/http';`);
        lines.push(`import { check, sleep, group } from 'k6';`);
        // Transaction utils
        if (!hasTransactionImport) {
            lines.push(`import { initTransactions, startTransaction, endTransaction } from '../../../core-engine/src/utils/transaction.js';`);
        }
        else {
            // Keep existing transaction import as-is
            const txnImport = source
                .split('\n')
                .find((l) => /import\s+\{[^}]*initTransactions/.test(l));
            if (txnImport)
                lines.push(txnImport.trim());
        }
        // logExchange + trackCorrelation + trackParameter + trackDataRow
        lines.push(`import { logExchange, trackCorrelation, trackParameter, trackDataRow } from '../../../core-engine/src/utils/replayLogger.js';`);
        // Preserve any other imports (CorrelationEngine, RuleProcessor, etc.)
        const srcLines = source.split('\n');
        for (const srcLine of srcLines) {
            if (!/^\s*import\s/.test(srcLine))
                continue;
            // Skip standard imports we already handle
            if (/from\s+['"]k6\/http['"]/.test(srcLine))
                continue;
            if (/from\s+['"]k6['"]/.test(srcLine))
                continue;
            if (/from\s+['"]k6\/metrics['"]/.test(srcLine))
                continue;
            if (/initTransactions|startTransaction|endTransaction/.test(srcLine))
                continue;
            if (/logExchange|logReplayExchange|replayLogger/.test(srcLine))
                continue;
            lines.push(srcLine.trim());
        }
        return lines.join('\n');
    }
    static findImportBlockEnd(lines) {
        let i = 0;
        let lastImportOrTrend = 0;
        for (; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            if (trimmed.startsWith('import ') ||
                /^const\s+\w+\s*=\s*new\s+Trend\s*\(/.test(trimmed) ||
                trimmed === '' ||
                trimmed.startsWith('//')) {
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
    static matchHttpCall(line) {
        // Match: `let/const res = http.get(...)`, `resp = http.request(...)`, or `http.get(...)`
        const match = line.match(/(?:(?:(?:let|const|var)\s+)?(\w+)\s*=\s*)?http\.(get|post|put|patch|del|request)\s*\(/);
        if (!match)
            return null;
        return { method: match[2], varPrefix: match[1] || '' };
    }
    static parseHttpCall(lines, startIdx, httpMatch) {
        // Consume lines until balanced parens
        let combined = '';
        let depth = 0;
        let linesConsumed = 0;
        for (let j = startIdx; j < lines.length; j++) {
            combined += lines[j] + '\n';
            linesConsumed++;
            for (const ch of lines[j]) {
                if (ch === '(')
                    depth++;
                if (ch === ')')
                    depth--;
            }
            if (depth <= 0)
                break;
        }
        let method = httpMatch.method.toUpperCase();
        const varName = httpMatch.varPrefix || '';
        // Extract arguments from the http call
        // Find the opening paren of the http.X( call
        const callMatch = combined.match(/http\.(?:get|post|put|patch|del|request)\s*\(([\s\S]*)\)\s*;?\s*$/);
        const argsStr = callMatch ? callMatch[1].trim() : '';
        const args = this.splitTopLevelArgs(argsStr);
        let url = '';
        let body = null;
        let params = null;
        if (method === 'GET') {
            url = args[0] || '""';
            params = args[1] || null;
        }
        else if (method === 'DEL') {
            url = args[0] || '""';
            body = args[1] || null;
            params = args[2] || null;
        }
        else if (method === 'REQUEST') {
            // http.request(method, url, body, params) — extract actual HTTP verb from first arg
            const rawMethod = (args[0] || '').replace(/^['"`]|['"`]$/g, '').toUpperCase();
            if (rawMethod && rawMethod !== 'REQUEST')
                method = rawMethod;
            url = args[1] || '""';
            body = args[2] || null;
            params = args[3] || null;
        }
        else {
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
    static splitTopLevelArgs(str) {
        const args = [];
        let depth = 0;
        let current = '';
        let inString = null;
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
                if (ch === inString)
                    inString = null;
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
        if (current.trim())
            args.push(current.trim());
        return args;
    }
    static buildRequestDefString(_reqName, id, transaction, method, url, body, paramsStr, indent) {
        const inner = indent + '  ';
        const innerInner = indent + '    ';
        const innerInnerInner = indent + '      ';
        const m = method === 'DEL' ? 'DELETE' : method;
        const sanitizedTxn = this.sanitizeTransactionName(transaction);
        let s = '{\n';
        s += `${inner}id: ${JSON.stringify(id)},\n`;
        s += `${inner}transaction: ${JSON.stringify(sanitizedTxn)},\n`;
        s += `${inner}recordingStartedAt: new Date().toISOString(),\n`;
        s += `${inner}method: ${JSON.stringify(m)},\n`;
        s += `${inner}url: ${url},\n`;
        // Body
        if (!body || body === 'null' || body === 'undefined') {
            s += `${inner}body: null,\n`;
        }
        else {
            s += `${inner}body: ${body},\n`;
        }
        // Params — always inline with headers, redirects: 0, and tags
        s += `${inner}params: {\n`;
        if (paramsStr && paramsStr !== 'null' && paramsStr !== 'undefined') {
            const isVarRef = /^[a-zA-Z_$]\w*$/.test(paramsStr.trim());
            if (isVarRef) {
                // Spread a variable reference — fallback case
                s += `${innerInner}...${paramsStr.trim()},\n`;
            }
            else {
                // Inline object — extract headers
                const headersContent = this.extractObjectProperty(paramsStr, 'headers');
                if (headersContent) {
                    s += `${innerInner}headers: ${this.reindent(headersContent, innerInner)},\n`;
                }
            }
        }
        // Cookies — preserve from source or default to empty object
        if (paramsStr && paramsStr !== 'null' && paramsStr !== 'undefined') {
            const cookiesContent = this.extractObjectProperty(paramsStr, 'cookies');
            if (cookiesContent) {
                s += `${innerInner}cookies: ${this.reindent(cookiesContent, innerInner)},\n`;
            }
            else {
                s += `${innerInner}cookies: {},\n`;
            }
        }
        else {
            s += `${innerInner}cookies: {},\n`;
        }
        // Always emit redirects: 0
        s += `${innerInner}redirects: 0,\n`;
        // Tags
        s += `${innerInner}tags: {\n`;
        s += `${innerInnerInner}transaction: ${JSON.stringify(sanitizedTxn)},\n`;
        s += `${innerInnerInner}har_entry_id: ${JSON.stringify(id)},\n`;
        s += `${innerInnerInner}recording_started_at: "converted"\n`;
        s += `${innerInner}}\n`;
        s += `${inner}}\n`;
        s += `${indent}}`;
        return s;
    }
    /**
     * Extract a property value from an object literal string.
     */
    static extractObjectProperty(objStr, propName) {
        const propPattern = new RegExp(`(?:^|[,{\\n])\\s*${propName}\\s*:\\s*`);
        const match = propPattern.exec(objStr);
        if (!match)
            return null;
        const startOfValue = match.index + match[0].length;
        const firstChar = objStr[startOfValue];
        if (firstChar === '{') {
            let depth = 0;
            let end = startOfValue;
            for (; end < objStr.length; end++) {
                if (objStr[end] === '{')
                    depth++;
                if (objStr[end] === '}')
                    depth--;
                if (depth === 0) {
                    end++;
                    break;
                }
            }
            return objStr.slice(startOfValue, end).trim();
        }
        let depth = 0;
        let end = startOfValue;
        for (; end < objStr.length; end++) {
            const ch = objStr[end];
            if (ch === '{' || ch === '[' || ch === '(')
                depth++;
            if (ch === '}' || ch === ']' || ch === ')') {
                if (depth === 0)
                    break;
                depth--;
            }
            if (ch === ',' && depth === 0)
                break;
        }
        return objStr.slice(startOfValue, end).trim();
    }
    /**
     * Re-indent a multi-line string to align with the given base indent.
     */
    static reindent(str, baseIndent) {
        const lines = str.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length <= 1)
            return str.trim();
        return lines
            .map((l, idx) => (idx === 0 ? l : `${baseIndent}  ${l}`))
            .join('\n');
    }
    static buildHttpCallString(method, reqName, resName, indent) {
        const m = method === 'DEL' ? 'del' : method.toLowerCase();
        if (method === 'GET') {
            return `${indent}const ${resName} = http.get(${reqName}.url, ${reqName}.params);`;
        }
        else if (['POST', 'PUT', 'PATCH'].includes(method)) {
            return `${indent}const ${resName} = http.${m}(${reqName}.url, ${reqName}.body, ${reqName}.params);`;
        }
        else if (method === 'DEL' || method === 'DELETE') {
            return `${indent}const ${resName} = http.del(${reqName}.url, null, ${reqName}.params);`;
        }
        else {
            return `${indent}const ${resName} = http.request(${reqName}.method, ${reqName}.url, ${reqName}.body, ${reqName}.params);`;
        }
    }
    static applyLifecycleToConvertedSource(source, lifecycle) {
        const marker = 'export default function () {';
        const defaultStart = source.indexOf(marker);
        if (defaultStart === -1)
            return source;
        const bodyStart = source.indexOf('{', defaultStart);
        const bodyEnd = this.findMatchingBrace(source, bodyStart);
        if (bodyStart === -1 || bodyEnd === -1)
            return source;
        let beforeDefault = source.slice(0, defaultStart);
        const defaultBody = source.slice(bodyStart + 1, bodyEnd);
        const afterDefault = source.slice(bodyEnd + 1);
        if (!/import\s+exec\s+from\s+['"]k6\/execution['"]/.test(beforeDefault)) {
            beforeDefault += `import exec from 'k6/execution';\n`;
        }
        const statements = this.splitTopLevelStatements(defaultBody);
        const grouped = this.partitionLifecycleStatements(statements, lifecycle);
        return beforeDefault
            + this.renderLifecycleHeader(lifecycle)
            + this.renderLifecycleDefault()
            + this.renderConvertedPhaseFunction('runInit', grouped.initPrelude, grouped.initGroups)
            + '\n'
            + this.renderConvertedPhaseFunction('runAction', grouped.actionPrelude, grouped.actionGroups)
            + '\n'
            + this.renderConvertedPhaseFunction('runEnd', grouped.endPrelude, grouped.endGroups)
            + '\n'
            + this.renderLifecycleHelpers()
            + afterDefault;
    }
    static renderLifecycleHeader(lifecycle) {
        return `\nconst __LIFECYCLE = ${JSON.stringify({
            init: lifecycle.init ?? [],
            end: lifecycle.end ?? [],
        }, null, 2)};\n`
            + `const __PHASES = JSON.parse(__ENV.K6_PERF_PHASES || '{"mode":"unsupported","timeline":[],"startVUs":0,"peakVUs":0,"totalIterations":0}');\n`
            + `let __state = {\n`
            + `  initialized: false,\n`
            + `  ended: false,\n`
            + `  currentWindow: -1,\n`
            + `  user: { username: null, password: null },\n`
            + `  session: { jsessionId: null, authToken: null, loggedIn: false },\n`
            + `  data: {},\n`
            + `  correlation: {},\n`
            + `};\n\n`;
    }
    static renderLifecycleDefault() {
        return `export default function () {\n`
            + `  const vuId = exec.vu.idInInstance;\n`
            + `  const elapsed = Date.now() - exec.scenario.startTime;\n`
            + `  const exitInfo = __getExitInfoForVU(vuId, elapsed, __PHASES);\n\n`
            + `  if (exitInfo.windowIndex >= 0 && __state.currentWindow !== exitInfo.windowIndex) {\n`
            + `    __resetLifecycleState(exitInfo.windowIndex);\n`
            + `  }\n\n`
            + `  if (!__state.initialized) {\n`
            + `    if (__LIFECYCLE.init.length > 0) {\n`
            + `      runInit(__state);\n`
            + `      __state.initialized = true;\n`
            + `      return;\n`
            + `    }\n`
            + `    __state.initialized = true;\n`
            + `  }\n\n`
            + `  if (!__state.ended && __LIFECYCLE.end.length > 0 && exitInfo.shouldEndNow) {\n`
            + `    runEnd(__state);\n`
            + `    __state.ended = true;\n`
            + `    return;\n`
            + `  }\n\n`
            + `  if (__state.ended) {\n`
            + `    sleep(1);\n`
            + `    return;\n`
            + `  }\n\n`
            + `  runAction(__state);\n`
            + `}\n\n`;
    }
    static renderConvertedPhaseFunction(name, preludeLines, groupStatements) {
        let out = `function ${name}(state) {\n`;
        if (preludeLines.length === 0 && groupStatements.length === 0) {
            out += `  // No groups assigned to this phase.\n`;
            out += `}\n`;
            return out;
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
    static partitionLifecycleStatements(statements, lifecycle) {
        const initSet = new Set(lifecycle.init ?? []);
        const endSet = new Set(lifecycle.end ?? []);
        const preludeLines = [];
        const groupStatements = [];
        for (const statement of statements) {
            const name = this.extractGroupName(statement);
            if (name) {
                groupStatements.push({ name, statement });
            }
            else if (statement.trim()) {
                preludeLines.push(...statement.split('\n').map((line) => line.trim()).filter(Boolean));
            }
        }
        const parameterMappings = new Map();
        const initPrelude = preludeLines.map((line) => {
            if (/^const correlation_vars\s*=\s*\{\s*\}\s*;?$/.test(line)) {
                return 'const correlation_vars = state.correlation;';
            }
            const match = line.match(/^trackParameter\("([^"]+)",\s*(.+),\s*"data"\);$/);
            if (!match)
                return line;
            parameterMappings.set(match[2], match[1]);
            return `state.data["${match[1]}"] = state.data["${match[1]}"] ?? trackParameter("${match[1]}", ${match[2]}, "data");`;
        });
        const sharedPrelude = ['const correlation_vars = state.correlation;', 'let match;', 'let regex;'];
        const initGroups = groupStatements
            .filter((group) => initSet.has(group.name))
            .map((group) => this.replaceStateDataRefs(group.statement, parameterMappings));
        const actionGroups = groupStatements
            .filter((group) => !initSet.has(group.name) && !endSet.has(group.name))
            .map((group) => this.replaceStateDataRefs(group.statement, parameterMappings));
        const endGroups = groupStatements
            .filter((group) => endSet.has(group.name))
            .map((group) => this.replaceStateDataRefs(group.statement, parameterMappings));
        return {
            initPrelude: initPrelude,
            actionPrelude: sharedPrelude,
            endPrelude: sharedPrelude,
            initGroups,
            actionGroups,
            endGroups,
        };
    }
    static replaceStateDataRefs(statement, mappings) {
        let output = statement;
        for (const [expr, name] of mappings) {
            output = output.split(expr).join(`state.data["${name}"]`);
        }
        output = output.replace(/const correlation_vars\s*=\s*\{\s*\}\s*;/g, 'const correlation_vars = state.correlation;');
        return output;
    }
    static splitTopLevelStatements(body) {
        const statements = [];
        const lines = body.split('\n');
        let current = [];
        let depth = 0;
        for (const line of lines) {
            current.push(line);
            for (const ch of line) {
                if (ch === '{')
                    depth++;
                if (ch === '}')
                    depth--;
            }
            if (depth === 0 && line.trim().endsWith(';')) {
                const statement = current.join('\n').trim();
                if (statement)
                    statements.push(statement);
                current = [];
            }
        }
        const trailing = current.join('\n').trim();
        if (trailing)
            statements.push(trailing);
        return statements;
    }
    static extractGroupName(statement) {
        const match = statement.match(/group\s*\(\s*['"`]([^'"`]+)['"`]/);
        return match ? match[1] : null;
    }
    static findMatchingBrace(source, startIndex) {
        let depth = 0;
        for (let i = startIndex; i < source.length; i++) {
            const ch = source[i];
            if (ch === '{')
                depth++;
            if (ch === '}') {
                depth--;
                if (depth === 0)
                    return i;
            }
        }
        return -1;
    }
    static indentBlock(block, spaces) {
        const indent = ' '.repeat(spaces);
        return block
            .split('\n')
            .map((line) => `${indent}${line}`)
            .join('\n');
    }
    static renderLifecycleHelpers() {
        return `function __resetLifecycleState(windowIndex) {\n`
            + `  __state = {\n`
            + `    initialized: false,\n`
            + `    ended: false,\n`
            + `    currentWindow: windowIndex,\n`
            + `    user: { username: null, password: null },\n`
            + `    session: { jsessionId: null, authToken: null, loggedIn: false },\n`
            + `    data: {},\n`
            + `    correlation: {},\n`
            + `  };\n`
            + `}\n\n`
            + `function __getExitInfoForVU(vuId, elapsedMs, phases) {\n`
            + `  if (phases.mode === 'per-vu-iterations') {\n`
            + `    return {\n`
            + `      shouldEndNow: exec.vu.iterationInScenario >= Math.max((phases.totalIterations || 1) - 1, 0),\n`
            + `      exitMs: null,\n`
            + `      windowIndex: 0,\n`
            + `    };\n`
            + `  }\n\n`
            + `  if (phases.mode !== 'ramping-vus' || !Array.isArray(phases.timeline)) {\n`
            + `    return { shouldEndNow: false, exitMs: null, windowIndex: -1 };\n`
            + `  }\n\n`
            + `  let previousVUs = phases.startVUs || 0;\n`
            + `  let previousEndMs = 0;\n\n`
            + `  for (let i = 0; i < phases.timeline.length; i++) {\n`
            + `    const stage = phases.timeline[i];\n`
            + `    const currentVUs = stage.vus;\n`
            + `    if (currentVUs < previousVUs && vuId > currentVUs && vuId <= previousVUs) {\n`
            + `      const removedCount = previousVUs - currentVUs;\n`
            + `      const offset = previousVUs - vuId;\n`
            + `      const segmentDuration = stage.endMs - previousEndMs;\n`
            + `      const exitMs = previousEndMs + (segmentDuration * (offset / removedCount));\n`
            + `      return {\n`
            + `        shouldEndNow: elapsedMs >= exitMs,\n`
            + `        exitMs,\n`
            + `        windowIndex: i,\n`
            + `      };\n`
            + `    }\n`
            + `    previousVUs = currentVUs;\n`
            + `    previousEndMs = stage.endMs;\n`
            + `  }\n\n`
            + `  return { shouldEndNow: false, exitMs: null, windowIndex: -1 };\n`
            + `}\n`;
    }
    static isTrendAddLine(line, trendVarNames) {
        if (trendVarNames.size === 0)
            return false;
        const pattern = new RegExp(`^\\s*(${[...trendVarNames].join('|')})\\.add\\s*\\(`);
        return pattern.test(line);
    }
    static getLeadingWhitespace(line) {
        const match = line.match(/^(\s*)/);
        return match ? match[1] : '';
    }
    static formatTransactionArray(names) {
        if (names.length <= 3) {
            return `[${names.map((n) => JSON.stringify(n)).join(', ')}]`;
        }
        const items = names.map((n) => `  ${JSON.stringify(n)}`);
        return `[\n${items.join(',\n')}\n]`;
    }
    /**
     * Sanitize a group name for use as a k6 metric name.
     * k6 metrics must only include ASCII letters, numbers, or underscores
     * and start with a letter or underscore (max 128 chars).
     */
    static sanitizeTransactionName(name) {
        let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');
        // Ensure it starts with a letter or underscore
        if (sanitized && !/^[a-zA-Z_]/.test(sanitized)) {
            sanitized = '_' + sanitized;
        }
        return sanitized.slice(0, 128);
    }
}
exports.ScriptConverter = ScriptConverter;
//# sourceMappingURL=ScriptConverter.lifecycle-prototype.js.map