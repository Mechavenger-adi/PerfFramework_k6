"use strict";
/**
 * templates.ts
 * Phase 3 – Template Library Discovery
 */
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
exports.listTemplates = listTemplates;
exports.showTemplate = showTemplate;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const jsonc_parser_1 = require("jsonc-parser");
function listTemplates(type) {
    const templatesDir = path.resolve(process.cwd(), `templates/${type}`);
    if (!fs.existsSync(templatesDir)) {
        console.log(`\nNo templates found in ${templatesDir}\n`);
        return;
    }
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.jsonc') || f.endsWith('.json'));
    if (files.length === 0) {
        console.log(`\nNo templates found in ${templatesDir}\n`);
        return;
    }
    console.log(`\nAvailable ${type === 'test-plans' ? 'Test Plan' : 'Runtime Settings'} Templates:\n`);
    for (const file of files) {
        const absPath = path.join(templatesDir, file);
        try {
            const content = (0, jsonc_parser_1.parse)(fs.readFileSync(absPath, 'utf-8'));
            const title = content?._meta?.title || file;
            const desc = content?._meta?.description || 'No description available.';
            console.log(`  \x1b[36m${file}\x1b[0m — ${title}`);
            console.log(`    ${desc}\n`);
        }
        catch {
            console.log(`  \x1b[36m${file}\x1b[0m — (failed to parse)`);
        }
    }
}
function showTemplate(type, name) {
    let fileName = name;
    if (!fileName.endsWith('.jsonc') && !fileName.endsWith('.json')) {
        fileName += '.jsonc';
    }
    const templatePath = path.resolve(process.cwd(), `templates/${type}`, fileName);
    if (!fs.existsSync(templatePath)) {
        // Try .json if .jsonc failed
        const altPath = path.resolve(process.cwd(), `templates/${type}`, name + '.json');
        if (fs.existsSync(altPath)) {
            console.log(fs.readFileSync(altPath, 'utf-8'));
            return;
        }
        console.error(`\n[FAIL] Template '${name}' not found in templates/${type}/\n`);
        process.exit(1);
    }
    console.log('\n' + fs.readFileSync(templatePath, 'utf-8') + '\n');
}
//# sourceMappingURL=templates.js.map