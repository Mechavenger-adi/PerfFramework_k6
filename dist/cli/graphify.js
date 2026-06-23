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
exports.runGraphify = runGraphify;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function runGraphify(outputDir = 'graphify-out') {
    console.log(`\n Generating architecture graph...`);
    const srcDir = path.join(process.cwd(), 'core-engine', 'src');
    if (!fs.existsSync(srcDir)) {
        console.error(`[FAIL] Could not find core-engine/src at ${srcDir}`);
        process.exit(1);
    }
    const outPath = path.join(process.cwd(), outputDir);
    if (!fs.existsSync(outPath)) {
        fs.mkdirSync(outPath, { recursive: true });
    }
    // Define layers based on directory structure
    const layerDefs = [
        { id: 'cli', label: 'CLI', color: '#f59e0b', dir: 'cli' },
        { id: 'config', label: 'Config', color: '#22d3ee', dir: 'config' },
        { id: 'types', label: 'Types', color: '#e2e8f0', dir: 'types' },
        { id: 'scenario', label: 'Scenario', color: '#a78bfa', dir: 'scenario' },
        { id: 'execution', label: 'Execution', color: '#f97316', dir: 'execution' },
        { id: 'runtime', label: 'Runtime', color: '#34d399', dir: 'runtime' },
        { id: 'data', label: 'Data', color: '#fb7185', dir: 'data' },
        { id: 'recording', label: 'Recording', color: '#60a5fa', dir: 'recording' },
        { id: 'assertions', label: 'Assertions', color: '#facc15', dir: 'assertions' },
        { id: 'correlation', label: 'Correlation', color: '#e879f9', dir: 'correlation' },
        { id: 'debug', label: 'Debug', color: '#f87171', dir: 'debug' },
        { id: 'reporters', label: 'Reporters', color: '#94a3b8', dir: 'reporters' },
        { id: 'reporting', label: 'Reporting', color: '#4ade80', dir: 'reporting' },
        { id: 'utils', label: 'Utils', color: '#fbbf24', dir: 'utils' }
    ];
    const layers = layerDefs.map(def => {
        const dirPath = path.join(srcDir, def.dir);
        const files = [];
        if (fs.existsSync(dirPath)) {
            const items = fs.readdirSync(dirPath);
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stat = fs.statSync(itemPath);
                if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.js'))) {
                    files.push({
                        name: item,
                        size: stat.size,
                        desc: `Part of ${def.label} layer` // Default description
                    });
                }
            }
        }
        return {
            id: def.id,
            label: def.label,
            color: def.color,
            files
        };
    }).filter(l => l.files.length > 0);
    // We read the existing template layout and inject data
    // Using the previous manual graph configuration we built
    const EDGES_RAW = [
        ['cli', 'config'],
        ['cli', 'scenario'],
        ['cli', 'execution'],
        ['cli', 'recording'],
        ['cli', 'debug'],
        ['cli', 'reporting'],
        ['cli', 'utils'],
        ['config', 'types'],
        ['config', 'utils'],
        ['scenario', 'types'],
        ['scenario', 'config'],
        ['scenario', 'utils'],
        ['execution', 'scenario'],
        ['execution', 'config'],
        ['execution', 'runtime'],
        ['execution', 'assertions'],
        ['execution', 'reporting'],
        ['execution', 'reporters'],
        ['execution', 'utils'],
        ['runtime', 'types'],
        ['runtime', 'utils'],
        ['data', 'types'],
        ['data', 'utils'],
        ['recording', 'types'],
        ['recording', 'correlation'],
        ['recording', 'utils'],
        ['assertions', 'types'],
        ['assertions', 'config'],
        ['correlation', 'types'],
        ['debug', 'recording'],
        ['debug', 'runtime'],
        ['debug', 'utils'],
        ['debug', 'types'],
        ['reporters', 'types'],
        ['reporting', 'types'],
        ['reporting', 'runtime'],
        ['reporting', 'assertions'],
        ['reporting', 'utils'],
        ['utils', 'types']
    ];
    const htmlContent = generateHtml(JSON.stringify(layers, null, 2), JSON.stringify(EDGES_RAW, null, 2));
    const indexHtmlPath = path.join(outPath, 'index.html');
    fs.writeFileSync(indexHtmlPath, htmlContent, 'utf-8');
    console.log(`  [PASS] Graph successfully written to ${indexHtmlPath}\n`);
}
function generateHtml(layersJson, edgesJson) {
    const templatePath = path.join(process.cwd(), 'graph.html');
    if (!fs.existsSync(templatePath)) {
        console.error('[FAIL] graph.html template not found at root.');
        return '';
    }
    let html = fs.readFileSync(templatePath, 'utf8');
    // Replace the static LAYERS array
    html = html.replace(/const LAYERS = \[[\s\S]*?\];\n/, `const LAYERS = ${layersJson};\n`);
    // Replace the static EDGES array
    html = html.replace(/const EDGES_RAW = \[[\s\S]*?\];\n/, `const EDGES_RAW = ${edgesJson};\n`);
    return html;
}
//# sourceMappingURL=graphify.js.map