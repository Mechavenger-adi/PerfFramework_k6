"use strict";
/**
 * docs.ts
 * Phase 6 – Documentation Automation
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
exports.generateDocs = generateDocs;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function generateDocs() {
    const schemasDir = path.resolve(process.cwd(), 'config/schemas');
    const docsDir = path.resolve(process.cwd(), 'docs');
    if (!fs.existsSync(schemasDir)) {
        console.error(`[FAIL] Schemas directory not found at ${schemasDir}`);
        process.exit(1);
    }
    if (!fs.existsSync(docsDir))
        fs.mkdirSync(docsDir, { recursive: true });
    const files = fs.readdirSync(schemasDir).filter(f => f.endsWith('.schema.json'));
    let markdown = '# K6-PerfFramework Configuration Reference\n\n';
    markdown += '*(Auto-generated from JSON Schemas)*\n\n';
    for (const file of files) {
        const absPath = path.join(schemasDir, file);
        try {
            const schema = JSON.parse(fs.readFileSync(absPath, 'utf-8'));
            markdown += `## ${schema.title || file}\n\n`;
            markdown += `${schema.description || ''}\n\n`;
            if (schema.properties) {
                markdown += '| Field | Type | Required | Description |\n';
                markdown += '|---|---|---|---|\n';
                const requiredFields = schema.required || [];
                for (const [key, prop] of Object.entries(schema.properties)) {
                    if (key === '$schema' || key === '_meta')
                        continue;
                    const isRequired = requiredFields.includes(key) ? '**Yes**' : 'No';
                    let typeStr = prop.type || 'any';
                    if (prop.enum) {
                        typeStr = `enum (${prop.enum.join(' \\| ')})`;
                    }
                    else if (prop.type === 'object' && prop.properties) {
                        typeStr = 'object';
                    }
                    else if (prop.type === 'array' && prop.items?.type) {
                        typeStr = `array<${prop.items.type}>`;
                    }
                    const desc = (prop.description || '').replace(/\n/g, ' ');
                    markdown += `| \`${key}\` | ${typeStr} | ${isRequired} | ${desc} |\n`;
                    // If it's a nested object (one level deep), document its properties too
                    if (prop.type === 'object' && prop.properties) {
                        const nestedRequired = prop.required || [];
                        for (const [nKey, nProp] of Object.entries(prop.properties)) {
                            const nIsRequired = nestedRequired.includes(nKey) ? '**Yes**' : 'No';
                            let nTypeStr = nProp.type || 'any';
                            if (nProp.enum) {
                                nTypeStr = `enum (${nProp.enum.join(' \\| ')})`;
                            }
                            const nDesc = (nProp.description || '').replace(/\n/g, ' ');
                            markdown += `| \`${key}.${nKey}\` | ${nTypeStr} | ${nIsRequired} | ${nDesc} |\n`;
                        }
                    }
                }
                markdown += '\n';
            }
        }
        catch (err) {
            console.warn(`[WARN] Failed to parse schema ${file}: ${err.message}`);
        }
    }
    const outputPath = path.join(docsDir, 'configuration-reference.md');
    fs.writeFileSync(outputPath, markdown, 'utf-8');
    console.log(`\n[PASS] Generated ${path.relative(process.cwd(), outputPath)}\n`);
}
