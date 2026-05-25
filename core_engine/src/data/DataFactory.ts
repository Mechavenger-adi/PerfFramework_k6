/**
 * DataFactory.ts
 * Phase 1 – Loads CSV and JSON data files into typed arrays.
 *
 * NOTE: In production k6 scripts, data is loaded via k6's SharedArray.
 * This DataFactory is the Node.js-side counterpart used by the CLI,
 * Gatekeeper, and DataPoolManager for validation and allocation.
 * The k6-side SharedArray wrapper is in the generated test script template.
 */

import * as fs from 'fs';
import * as path from 'path';

export type DataRow = Record<string, string | number | boolean | null>;

export interface LoadedDataset {
  name: string;
  rows: DataRow[];
  source: string;
}

export class DataFactory {
  /**
   * Load a CSV file into an array of row objects.
   * First row is treated as header.
   * Supports quoted fields and comma-separated values.
   */
  static loadCSV(filePath: string, datasetName?: string): LoadedDataset {
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
    const rows: DataRow[] = lines.slice(1).map((line, i) => {
      const cells = this.parseCSVRow(line);
      const row: DataRow = {};
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
  static loadJSON(filePath: string, datasetName?: string): LoadedDataset {
    const abs = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(abs)) {
      throw new Error(`[DataFactory] JSON file not found: ${abs}`);
    }

    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(abs, 'utf-8'));
    } catch (e) {
      throw new Error(`[DataFactory] Invalid JSON at ${abs}: ${(e as Error).message}`);
    }

    if (!Array.isArray(raw)) {
      throw new Error(`[DataFactory] JSON data must be an array of objects at ${abs}`);
    }

    return {
      name: datasetName ?? path.basename(filePath, '.json'),
      rows: raw as DataRow[],
      source: abs,
    };
  }

  /**
   * Auto-detect file type and load accordingly.
   */
  static load(filePath: string, datasetName?: string): LoadedDataset {
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
  private static parseCSVRow(row: string): string[] {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  }

  /** Attempt to coerce a string cell value to a native type */
  private static coerceValue(value: string): string | number | boolean | null {
    if (value === '') return null;
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    const num = Number(value);
    if (!isNaN(num) && value !== '') return num;
    return value;
  }
}
