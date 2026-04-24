"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptGenerator = void 0;
class ScriptGenerator {
    /**
     * Prototype generator with optional LoadRunner-style Init / Action / End support.
     * Original generator remains untouched; this file is for lifecycle design review.
     */
    static generate(groups, options = {}) {
        const lifecycle = options.lifecycle;
        const transactionNames = groups.map((g) => g.name);
        let script = `import http from 'k6/http';\n`;
        script += `import { check, sleep, group } from 'k6';\n`;
        if (lifecycle) {
            script += `import exec from 'k6/execution';\n`;
        }
        script += `import { initTransactions, startTransaction, endTransaction } from '../../../core-engine/src/utils/transaction.js';\n`;
        script += `import { logExchange, trackCorrelation, trackParameter } from '../../../core-engine/src/utils/replayLogger.js';\n\n`;
        script += `initTransactions(${this.formatArray(transactionNames)});\n\n`;
        if (!lifecycle) {
            script += this.renderLegacyDefault(groups);
            return script;
        }
        const grouped = this.partitionGroups(groups, lifecycle);
        const initNames = grouped.init.map((g) => g.name);
        const endNames = grouped.end.map((g) => g.name);
        script += `const __LIFECYCLE = ${this.formatValue({
            init: initNames,
            end: endNames,
        }, 0)};\n`;
        script += `const __PHASES = JSON.parse(__ENV.K6_PERF_PHASES || '{"mode":"unsupported","timeline":[],"startVUs":0,"peakVUs":0,"totalIterations":0}');\n`;
        script += `let __state = {\n`;
        script += `  initialized: false,\n`;
        script += `  ended: false,\n`;
        script += `  currentWindow: -1,\n`;
        script += `  user: { username: null, password: null },\n`;
        script += `  session: { jsessionId: null, authToken: null, loggedIn: false },\n`;
        script += `  data: {},\n`;
        script += `  correlation: {},\n`;
        script += `};\n\n`;
        script += `export default function () {\n`;
        script += `  const vuId = exec.vu.idInInstance;\n`;
        script += `  const elapsed = Date.now() - exec.scenario.startTime;\n`;
        script += `  const exitInfo = __getExitInfoForVU(vuId, elapsed, __PHASES);\n\n`;
        script += `  if (exitInfo.windowIndex >= 0 && __state.currentWindow !== exitInfo.windowIndex) {\n`;
        script += `    __resetLifecycleState(exitInfo.windowIndex);\n`;
        script += `  }\n\n`;
        script += `  if (!__state.initialized) {\n`;
        script += `    if (__LIFECYCLE.init.length > 0) {\n`;
        script += `      runInit(__state);\n`;
        script += `      __state.initialized = true;\n`;
        script += `      return;\n`;
        script += `    }\n`;
        script += `    __state.initialized = true;\n`;
        script += `  }\n\n`;
        script += `  if (!__state.ended && __LIFECYCLE.end.length > 0 && exitInfo.shouldEndNow) {\n`;
        script += `    runEnd(__state);\n`;
        script += `    __state.ended = true;\n`;
        script += `    return;\n`;
        script += `  }\n\n`;
        script += `  if (__state.ended) {\n`;
        script += `    sleep(1);\n`;
        script += `    return;\n`;
        script += `  }\n\n`;
        script += `  runAction(__state);\n`;
        script += `}\n\n`;
        script += this.renderPhaseFunction('runInit', grouped.init);
        script += `\n`;
        script += this.renderPhaseFunction('runAction', grouped.action);
        script += `\n`;
        script += this.renderPhaseFunction('runEnd', grouped.end);
        script += `\n`;
        script += this.renderLifecycleHelpers();
        return script;
    }
    static renderLegacyDefault(groups) {
        let script = `export default function () {\n`;
        script += this.renderGroups(groups, 2);
        script += `}\n`;
        return script;
    }
    static renderPhaseFunction(name, groups) {
        let script = `function ${name}(state) {\n`;
        script += `  const correlation_vars = state.correlation;\n`;
        if (groups.length === 0) {
            script += `  // No groups assigned to this phase.\n`;
            script += `}\n`;
            return script;
        }
        script += this.renderGroups(groups, 2);
        script += `}\n`;
        return script;
    }
    static renderGroups(groups, baseIndent) {
        let script = '';
        let globalRequestId = 0;
        groups.forEach((groupItem, groupIndex) => {
            const indent = ' '.repeat(baseIndent);
            script += `${indent}group('${groupItem.name}', function () {\n`;
            script += `${indent}  startTransaction('${groupItem.name}');\n`;
            groupItem.entries.forEach((req, reqIndex) => {
                globalRequestId++;
                const requestName = `request_${reqIndex + 1}`;
                const responseName = `res_${reqIndex + 1}`;
                const sequentialId = `req_${globalRequestId}`;
                const requestDefinition = this.buildRequestDefinition(req, groupItem.name, req.method.toUpperCase(), sequentialId);
                script += `${indent}  // har_entry: ${req.id}\n`;
                script += `${indent}  const ${requestName} = ${this.formatValue(requestDefinition, baseIndent + 2)};\n`;
                script += `${indent}  ${this.buildHttpCall(req.method.toUpperCase(), requestName, responseName)}\n`;
                script += `${indent}  logExchange(${requestName}, ${responseName});\n`;
                script += `${indent}  check(${responseName}, {\n`;
                script += `${indent}    ${JSON.stringify(`${groupItem.name} - status is ${req.status}`)}: (r) => r.status === ${req.status},\n`;
                script += `${indent}  });\n`;
                if (reqIndex < groupItem.entries.length - 1) {
                    script += `\n`;
                }
            });
            script += `${indent}  endTransaction('${groupItem.name}');\n`;
            script += `${indent}});\n`;
            if (groupIndex < groups.length - 1) {
                script += `\n${indent}sleep(1);\n`;
            }
            script += `\n`;
        });
        return script;
    }
    static renderLifecycleHelpers() {
        return `function __resetLifecycleState(windowIndex) {\n` +
            `  __state = {\n` +
            `    initialized: false,\n` +
            `    ended: false,\n` +
            `    currentWindow: windowIndex,\n` +
            `    user: { username: null, password: null },\n` +
            `    session: { jsessionId: null, authToken: null, loggedIn: false },\n` +
            `    data: {},\n` +
            `    correlation: {},\n` +
            `  };\n` +
            `}\n\n` +
            `function __getExitInfoForVU(vuId, elapsedMs, phases) {\n` +
            `  if (phases.mode === 'per-vu-iterations') {\n` +
            `    return {\n` +
            `      shouldEndNow: exec.vu.iterationInScenario >= Math.max((phases.totalIterations || 1) - 1, 0),\n` +
            `      exitMs: null,\n` +
            `      windowIndex: 0,\n` +
            `    };\n` +
            `  }\n\n` +
            `  if (phases.mode !== 'ramping-vus' || !Array.isArray(phases.timeline)) {\n` +
            `    return { shouldEndNow: false, exitMs: null, windowIndex: -1 };\n` +
            `  }\n\n` +
            `  let previousVUs = phases.startVUs || 0;\n` +
            `  let previousEndMs = 0;\n\n` +
            `  for (let i = 0; i < phases.timeline.length; i++) {\n` +
            `    const stage = phases.timeline[i];\n` +
            `    const currentVUs = stage.vus;\n` +
            `    if (currentVUs < previousVUs && vuId > currentVUs && vuId <= previousVUs) {\n` +
            `      const removedCount = previousVUs - currentVUs;\n` +
            `      const offset = previousVUs - vuId;\n` +
            `      const segmentDuration = stage.endMs - previousEndMs;\n` +
            `      const exitMs = previousEndMs + (segmentDuration * (offset / removedCount));\n` +
            `      return {\n` +
            `        shouldEndNow: elapsedMs >= exitMs,\n` +
            `        exitMs,\n` +
            `        windowIndex: i,\n` +
            `      };\n` +
            `    }\n` +
            `    previousVUs = currentVUs;\n` +
            `    previousEndMs = stage.endMs;\n` +
            `  }\n\n` +
            `  return { shouldEndNow: false, exitMs: null, windowIndex: -1 };\n` +
            `}\n`;
    }
    static partitionGroups(groups, lifecycle) {
        const initSet = new Set(lifecycle.init ?? []);
        const endSet = new Set(lifecycle.end ?? []);
        return {
            init: groups.filter((group) => initSet.has(group.name)),
            action: groups.filter((group) => !initSet.has(group.name) && !endSet.has(group.name)),
            end: groups.filter((group) => endSet.has(group.name)),
        };
    }
    static buildHttpCall(method, requestName, responseName) {
        if (method === 'GET') {
            return `const ${responseName} = http.get(${requestName}.url, ${requestName}.params);`;
        }
        if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
            return `const ${responseName} = http.${method.toLowerCase()}(${requestName}.url, ${requestName}.body, ${requestName}.params);`;
        }
        if (method === 'DELETE') {
            return `const ${responseName} = http.del(${requestName}.url, null, ${requestName}.params);`;
        }
        return `const ${responseName} = http.request(${requestName}.method, ${requestName}.url, ${requestName}.body, ${requestName}.params);`;
    }
    static buildRequestDefinition(req, transactionName, method, sequentialId) {
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
    static buildRequestParams(req, transactionName, sequentialId) {
        const params = {
            cookies: {},
            redirects: 0,
            tags: {
                transaction: transactionName,
                har_entry_id: sequentialId,
                recording_started_at: req.startedDateTime,
            },
        };
        if (req.headers && req.headers.length > 0) {
            const headersObj = {};
            req.headers.forEach((header) => {
                headersObj[header.name] = header.value;
            });
            params.headers = headersObj;
        }
        return params;
    }
    static buildRequestBody(postData) {
        if (!postData)
            return null;
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
    static formatArray(items) {
        if (items.length === 0)
            return '[]';
        const lines = items.map((item) => `  ${JSON.stringify(item)}`);
        return `[\n${lines.join(',\n')}\n]`;
    }
    static formatValue(value, indentLevel) {
        if (value === null)
            return 'null';
        if (value === undefined)
            return 'undefined';
        if (typeof value === 'string')
            return JSON.stringify(value);
        if (typeof value === 'number' || typeof value === 'boolean')
            return String(value);
        const json = JSON.stringify(value, null, 2);
        if (!json)
            return 'null';
        const indent = ' '.repeat(indentLevel);
        return json
            .split('\n')
            .map((line, index) => (index === 0 ? line : `${indent}${line}`))
            .join('\n')
            .replace(/"([^"]+)":/g, (_match, key) => (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? `${key}:` : `"${key}":`));
    }
}
exports.ScriptGenerator = ScriptGenerator;
//# sourceMappingURL=ScriptGenerator.lifecycle-prototype.js.map