"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptGenerator = void 0;
class ScriptGenerator {
    /**
     * Generates formatted TypeScript/JavaScript source code based on Transaction Groups.
     */
    static generate(groups) {
        let script = `import http from 'k6/http';\n`;
        script += `import { check, sleep, group } from 'k6';\n`;
        script += `import { Trend } from 'k6/metrics';\n\n`;
        // Define Trends globally outside export default
        groups.forEach(g => {
            script += `const txn_${g.name} = new Trend('txn_${g.name}');\n`;
        });
        script += `\nexport default function () {\n`;
        groups.forEach((g, index) => {
            script += `  group('${g.name}', function () {\n`;
            script += `    const start = Date.now();\n`;
            g.entries.forEach(req => {
                script += `    // har_entry: ${req.id}\n`;
                let optionsStr = '';
                if (req.headers && req.headers.length > 0) {
                    const headersObj = {};
                    req.headers.forEach(h => { headersObj[h.name] = h.value; });
                    optionsStr = `, { headers: ${JSON.stringify(headersObj)} }`;
                }
                const method = req.method.toUpperCase();
                if (method === 'GET') {
                    script += `    let res = http.get('${req.url}'${optionsStr});\n`;
                }
                else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
                    const methodFunc = method.toLowerCase();
                    const payload = req.postData?.text ? JSON.stringify(req.postData.text) : 'null';
                    script += `    let res = http.${methodFunc}('${req.url}', ${payload}${optionsStr});\n`;
                }
                else if (method === 'DELETE') {
                    script += `    let res = http.del('${req.url}'${optionsStr});\n`;
                }
                script += `    check(res, { '${g.name} - status is ${req.status}': (r) => r.status === ${req.status} });\n`;
            });
            script += `    txn_${g.name}.add(Date.now() - start);\n`;
            script += `  });\n\n`;
            if (index < groups.length - 1) {
                script += `  sleep(1);\n\n`;
            }
        });
        script += `}\n`;
        return script;
    }
}
exports.ScriptGenerator = ScriptGenerator;
//# sourceMappingURL=ScriptGenerator.backup.js.map