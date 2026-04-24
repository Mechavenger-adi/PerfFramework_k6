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
exports.runGenerate = runGenerate;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const promises_1 = require("node:readline/promises");
const node_process_1 = require("node:process");
const HARParser_1 = require("../recording/HARParser");
const DomainFilter_1 = require("../recording/DomainFilter");
const TransactionGrouper_1 = require("../recording/TransactionGrouper");
const ScriptGenerator_1 = require("../recording/ScriptGenerator");
const ExchangeLog_1 = require("../debug/ExchangeLog");
const RecordingLogResolver_1 = require("../debug/RecordingLogResolver");
const LifecyclePrompt_1 = require("./LifecyclePrompt");
async function runGenerate(harPath, teamName, outName) {
    const absoluteHarPath = path.resolve(process.cwd(), harPath);
    if (!fs.existsSync(absoluteHarPath)) {
        console.error(`HAR file not found: ${absoluteHarPath}`);
        process.exit(1);
    }
    console.log(`Loading HAR from: ${absoluteHarPath}`);
    const discoveredEntries = HARParser_1.HARParser.readEntries(absoluteHarPath);
    const domainStats = DomainFilter_1.DomainFilter.summarize(discoveredEntries);
    const rl = (0, promises_1.createInterface)({ input: node_process_1.stdin, output: node_process_1.stdout });
    let allowedDomains;
    let excludeStaticAssets;
    let lifecycleSelection = { initGroups: [], endGroups: [] };
    let groups;
    try {
        allowedDomains = await promptForDomains(rl, domainStats);
        excludeStaticAssets = await promptForStaticAssetPreference(rl);
        const entries = HARParser_1.HARParser.parse(absoluteHarPath, {
            allowedDomains,
            excludeStaticAssets,
        });
        groups = TransactionGrouper_1.TransactionGrouper.group(entries);
        lifecycleSelection = await (0, LifecyclePrompt_1.promptForLifecycleSelection)(rl, groups.map((group) => group.name));
    }
    finally {
        rl.close();
    }
    const scriptContent = ScriptGenerator_1.ScriptGenerator.generate(groups, lifecycleSelection);
    const recordingLog = ExchangeLog_1.ExchangeLogBuilder.fromGroups(groups);
    const suiteDir = path.join(process.cwd(), 'scrum-suites', teamName);
    const targetDir = path.join(suiteDir, 'tests');
    const recordingDir = path.join(suiteDir, 'recordings');
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    if (!fs.existsSync(recordingDir)) {
        fs.mkdirSync(recordingDir, { recursive: true });
    }
    const scriptName = outName.endsWith('.js') ? outName : `${outName}.js`;
    const outPath = path.join(targetDir, scriptName);
    const recordingLogName = `${path.parse(scriptName).name}.recording-log.json`;
    const recordingLogPath = path.join(recordingDir, recordingLogName);
    fs.writeFileSync(outPath, scriptContent);
    fs.writeFileSync(recordingLogPath, JSON.stringify(recordingLog, null, 2), 'utf-8');
    RecordingLogResolver_1.RecordingLogResolver.upsertRegistryEntry(recordingDir, {
        scriptPath: path.relative(process.cwd(), outPath),
        recordingLogPath: path.relative(process.cwd(), recordingLogPath),
        sourceHarPath: path.relative(process.cwd(), absoluteHarPath),
        generatedAt: new Date().toISOString(),
    });
    console.log(`[PASS] Selected domains: ${allowedDomains.join(', ')}`);
    console.log(`[PASS] Static assets: ${excludeStaticAssets ? 'excluded' : 'included'}`);
    console.log(`[PASS] Generated k6 script from HAR at: ${outPath}`);
    console.log(`[PASS] Generated recording log at: ${recordingLogPath}`);
    console.log(`[PASS] Updated recording registry in: ${recordingDir}`);
}
async function promptForDomains(rl, domainStats) {
    if (domainStats.length === 0) {
        throw new Error('No request domains were found in the HAR file.');
    }
    console.log('\nDiscovered domains in HAR:');
    domainStats.forEach((domain, index) => {
        console.log(`  ${index + 1}. ${domain.host} (${domain.count} request${domain.count === 1 ? '' : 's'})`);
    });
    const answer = await rl.question('\nEnter the domain numbers or host names to include (comma-separated, or "all"): ');
    const trimmed = answer.trim();
    if (!trimmed) {
        return [domainStats[0].host];
    }
    if (trimmed.toLowerCase() === 'all') {
        return domainStats.map((domain) => domain.host);
    }
    const selections = trimmed.split(',').map((token) => token.trim()).filter(Boolean);
    const chosen = new Set();
    for (const selection of selections) {
        const asNumber = Number(selection);
        if (!Number.isNaN(asNumber) && Number.isInteger(asNumber)) {
            const domain = domainStats[asNumber - 1];
            if (!domain) {
                throw new Error(`Invalid domain selection index: ${selection}`);
            }
            chosen.add(domain.host);
            continue;
        }
        const directMatch = domainStats.find((domain) => domain.host === selection);
        if (!directMatch) {
            throw new Error(`Unknown domain selection: ${selection}`);
        }
        chosen.add(directMatch.host);
    }
    if (chosen.size === 0) {
        throw new Error('At least one domain must be selected.');
    }
    return Array.from(chosen);
}
async function promptForStaticAssetPreference(rl) {
    const answer = await rl.question('Do you want to include static assets such as css, js, images, and fonts? [y/N]: ');
    const normalized = answer.trim().toLowerCase();
    const includeStatic = normalized === 'y' || normalized === 'yes';
    return !includeStatic;
}
//# sourceMappingURL=generate.js.map