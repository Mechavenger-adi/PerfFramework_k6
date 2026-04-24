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
const HARParser_1 = require("../recording/HARParser");
const TransactionGrouper_1 = require("../recording/TransactionGrouper");
const ScriptGenerator_1 = require("../recording/ScriptGenerator");
function runGenerate(harPath, teamName, outName) {
    const absoluteHarPath = path.resolve(process.cwd(), harPath);
    if (!fs.existsSync(absoluteHarPath)) {
        console.error(`HAR file not found: ${absoluteHarPath}`);
        process.exit(1);
    }
    console.log(`Loading HAR from: ${absoluteHarPath}`);
    // Using sensible defaults for refinement
    const entries = HARParser_1.HARParser.parse(absoluteHarPath, { excludeStaticAssets: true });
    const groups = TransactionGrouper_1.TransactionGrouper.group(entries);
    const scriptContent = ScriptGenerator_1.ScriptGenerator.generate(groups);
    const targetDir = path.join(process.cwd(), 'scrum-suites', teamName, 'tests');
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    const scriptName = outName.endsWith('.js') ? outName : `${outName}.js`;
    const outPath = path.join(targetDir, scriptName);
    fs.writeFileSync(outPath, scriptContent);
    console.log(`[PASS] Generated k6 script from HAR at: ${outPath}`);
}
//# sourceMappingURL=generate.backup.js.map