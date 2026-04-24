"use strict";
/**
 * DataFactory.ts
 * Phase 1 – Loads CSV and JSON data files into typed arrays.
 *
 * NOTE: In production k6 scripts, data is loaded via k6's SharedArray.
 * This DataFactory is the Node.js-side counterpart used by the CLI,
 * Gatekeeper, and DataPoolManager for validation and allocation.
 * The k6-side SharedArray wrapper is in the generated test script template.
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
exports.DataFactory = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DataFactory {
    /**
     * Load a CSV file into an array of row objects.
     * First row is treated as header.
     * Supports quoted fields and comma-separated values.
     */
    static loadCSV(filePath, datasetName) {
        const abs = path.resolve(process.cwd(), filePath);
        if (!fs.existsSync(abs)) {
            throw new Error(`[DataFactory] CSV file not found: ${abs}`);
        }
        const content = fs.readFileSync(abs, 'utf-8');
        const lines = content.split(/\r?\n/).filter((l) => l.trim() !== '');
        if (lines.length < 2) {
            throw new Error(`[DataFactory] CSV file has no data rows: ${abs}`);
        }
        const headers = this.parseCSVRow(lines[0]);
        const rows = lines.slice(1).map((line, i) => {
            const cells = this.parseCSVRow(line);
            const row = {};
            headers.forEach((header, j) => {
                row[header] = this.coerceValue(cells[j] ?? '');
            });
            return row;
        });
        return {
            name: datasetName ?? path.basename(filePath, '.csv'),
            rows,
            source: abs,
        };
    }
    /**
     * Load a JSON array file.
     */
    static loadJSON(filePath, datasetName) {
        const abs = path.resolve(process.cwd(), filePath);
        if (!fs.existsSync(abs)) {
            throw new Error(`[DataFactory] JSON file not found: ${abs}`);
        }
        let raw;
        try {
            raw = JSON.parse(fs.readFileSync(abs, 'utf-8'));
        }
        catch (e) {
            throw new Error(`[DataFactory] Invalid JSON at ${abs}: ${e.message}`);
        }
        if (!Array.isArray(raw)) {
            throw new Error(`[DataFactory] JSON data must be an array of objects at ${abs}`);
        }
        return {
            name: datasetName ?? path.basename(filePath, '.json'),
            rows: raw,
            source: abs,
        };
    }
    /**
     * Auto-detect file type and load accordingly.
     */
    static load(filePath, datasetName) {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
            case '.csv': return this.loadCSV(filePath, datasetName);
            case '.json': return this.loadJSON(filePath, datasetName);
            default:
                throw new Error(`[DataFactory] Unsupported file type '${ext}'. Use .csv or .json.`);
        }
    }
    // ---------------------------------------------
    // Private helpers
    // ---------------------------------------------
    /** Parse a single CSV row respecting quoted fields */
    static parseCSVRow(row) {
        const cells = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
            const ch = row[i];
            if (ch === '"') {
                if (inQuotes && row[i + 1] === '"') {
                    current += '"';
                    i++;
                }
                else {
                    inQuotes = !inQuotes;
                }
            }
            else if (ch === ',' && !inQuotes) {
                cells.push(current.trim());
                current = '';
            }
            else {
                current += ch;
            }
        }
        cells.push(current.trim());
        return cells;
    }
    /** Attempt to coerce a string cell value to a native type */
    static coerceValue(value) {
        if (value === '')
            return null;
        if (value.toLowerCase() === 'true')
            return true;
        if (value.toLowerCase() === 'false')
            return false;
        const num = Number(value);
        if (!isNaN(num) && value !== '')
            return num;
        return value;
    }
}
exports.DataFactory = DataFactory;
//# sourceMappingURL=DataFactory.js.map