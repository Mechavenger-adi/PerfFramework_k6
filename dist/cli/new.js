"use strict";
/**
 * new.ts
 * Phase 5 – Basic interactive wizard for 'new' command
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
exports.runNewWizard = runNewWizard;
const readline = __importStar(require("readline"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function runNewWizard() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    console.log('\n============================================');
    console.log('|     K6-PerfFramework Config Wizard       |');
    console.log('============================================\n');
    rl.question('What would you like to create? (1: test-plan, 2: runtime-settings): ', (typeChoice) => {
        const typeStr = typeChoice.trim() === '2' ? 'runtime-settings' : 'test-plans';
        const templatesDir = path.resolve(process.cwd(), `templates/${typeStr}`);
        if (!fs.existsSync(templatesDir)) {
            console.log(`\n[FAIL] No templates found in ${templatesDir}\n`);
            rl.close();
            return;
        }
        const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.jsonc') || f.endsWith('.json'));
        console.log(`\nAvailable ${typeStr} templates:`);
        files.forEach((f, idx) => {
            console.log(`  ${idx + 1}. ${f}`);
        });
        rl.question(`\nEnter template number (1-${files.length}): `, (templateChoice) => {
            const idx = parseInt(templateChoice.trim()) - 1;
            if (isNaN(idx) || idx < 0 || idx >= files.length) {
                console.log('\n[FAIL] Invalid template choice.\n');
                rl.close();
                return;
            }
            const selectedTemplate = files[idx];
            rl.question('Enter filename to save as (e.g., my-load-test.jsonc): ', (filename) => {
                let finalName = filename.trim() || `my-${typeStr}-1.jsonc`;
                if (!finalName.endsWith('.json') && !finalName.endsWith('.jsonc')) {
                    finalName += '.jsonc';
                }
                const destDir = path.resolve(process.cwd(), `config/${typeStr}`);
                if (!fs.existsSync(destDir))
                    fs.mkdirSync(destDir, { recursive: true });
                const destPath = path.join(destDir, finalName);
                const srcPath = path.join(templatesDir, selectedTemplate);
                fs.copyFileSync(srcPath, destPath);
                console.log(`\n[PASS] Successfully created ${path.relative(process.cwd(), destPath)} from template '${selectedTemplate}'.\n`);
                rl.close();
            });
        });
    });
}
//# sourceMappingURL=new.js.map