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
exports.runConvert = runConvert;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const promises_1 = require("node:readline/promises");
const node_process_1 = require("node:process");
const ScriptConverter_1 = require("../recording/ScriptConverter");
const logger_1 = require("../utils/logger");
const LifecyclePrompt_1 = require("./LifecyclePrompt");
/**
 * CLI handler for `convert` command.
 * Converts a conventional k6 script into a framework-compatible script
 * with logExchange calls, request definition objects, and transaction wrappers.
 */
async function runConvert(inputPath, teamName, scriptName, options) {
    const absoluteInput = path.resolve(process.cwd(), inputPath);
    if (!fs.existsSync(absoluteInput)) {
        logger_1.Logger.fail(`Input script not found: ${absoluteInput}`);
        process.exit(1);
    }
    logger_1.Logger.header('k6 Performance Framework – CONVERT');
    logger_1.Logger.detail(`Input : ${absoluteInput}`);
    const source = fs.readFileSync(absoluteInput, 'utf-8');
    const groupNames = ScriptConverter_1.ScriptConverter.extractGroupNames(source);
    let lifecycleSelection = { initGroups: [], endGroups: [] };
    if (process.stdin.isTTY && process.stdout.isTTY) {
        const rl = (0, promises_1.createInterface)({ input: node_process_1.stdin, output: node_process_1.stdout });
        try {
            lifecycleSelection = await (0, LifecyclePrompt_1.promptForLifecycleSelection)(rl, groupNames);
        }
        finally {
            rl.close();
        }
    }
    const converted = ScriptConverter_1.ScriptConverter.convert(source, lifecycleSelection);
    if (options.inPlace) {
        fs.writeFileSync(absoluteInput, converted, 'utf-8');
        logger_1.Logger.pass(`Converted in-place: ${absoluteInput}`);
        return;
    }
    // Write to scrum-suites/<team>/tests/<name>.js
    const suiteDir = path.join(process.cwd(), 'scrum-suites', teamName);
    const targetDir = path.join(suiteDir, 'tests');
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    const outFileName = scriptName.endsWith('.js') ? scriptName : `${scriptName}.js`;
    const outPath = path.join(targetDir, outFileName);
    fs.writeFileSync(outPath, converted, 'utf-8');
    logger_1.Logger.pass(`Converted script written to: ${outPath}`);
    logger_1.Logger.detail(`Team  : ${teamName}`);
    logger_1.Logger.detail(`Script: ${outFileName}\n`);
}
//# sourceMappingURL=convert.js.map