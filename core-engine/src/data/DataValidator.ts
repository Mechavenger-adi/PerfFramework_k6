/**
 * DataValidator.ts
 * Phase 1 – Pre-run validation of data files.
 * Checks for blank rows, missing required columns, and row-count vs VU demand.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface DataValidationResult {
  valid: boolean;
  file: string;
  rowCount: number;
  errors: string[];
  warnings: string[];
}

export class DataValidator {
  /**
   * Validate a CSV data file.
   * @param filePath  Path to the CSV file
   * @param requiredColumns  Column names that must be present and non-empty in every row
   * @param expectedMinRows  Minimum row count required (e.g. VU count)
   */
  static validateCSV(
    filePath: string,
    requiredColumns: string[] = [],
    expectedMinRows = 0,
  ): DataValidationResult {
    const abs = path.resolve(process.cwd(), filePath);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!fs.existsSync(abs)) {
      return { valid: false, file: filePath, rowCount: 0, errors: [`File not found: ${abs}`], warnings };
    }

    const content = fs.readFileSync(abs, 'utf-8');
    const lines = content.split(/\r?\n/).filter((l) => l.trim() !== '');

    if (lines.length === 0) {
      return { valid: false, file: filePath, rowCount: 0, errors: ['File is empty.'], warnings };
    }

    // Parse header row
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const dataRows = lines.slice(1);
    const rowCount = dataRows.length;

    // Required columns present in header
    for (const col of requiredColumns) {
      if (!headers.includes(col)) {
        errors.push(`Required column '${col}' not found in header: [${headers.join(', ')}]`);
      }
    }

    // Row-level checks
    dataRows.forEach((row, i) => {
      const lineNumber = i + 2; // 1-indexed, header is line 1
      const cells = row.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));

      if (cells.length !== headers.length) {
        warnings.push(`Row ${lineNumber}: column count mismatch (expected ${headers.length}, got ${cells.length}).`);
      }

      for (const col of requiredColumns) {
        const colIndex = headers.indexOf(col);
        if (colIndex >= 0 && (!cells[colIndex] || cells[colIndex] === '')) {
          errors.push(`Row ${lineNumber}: required column '${col}' is blank.`);
        }
      }
    });

    // Row count vs VU demand
    if (expectedMinRows > 0 && rowCount < expectedMinRows) {
      warnings.push(
        `Row count (${rowCount}) is less than expected minimum (${expectedMinRows}). Some VUs may not have unique data.`,
      );
    }

    return { valid: errors.length === 0, file: filePath, rowCount, errors, warnings };
  }

  /**
   * Validate a JSON array data file.
   */
  static validateJSON(
    filePath: string,
    requiredKeys: string[] = [],
    expectedMinRows = 0,
  ): DataValidationResult {
    const abs = path.resolve(process.cwd(), filePath);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!fs.existsSync(abs)) {
      return { valid: false, file: filePath, rowCount: 0, errors: [`File not found: ${abs}`], warnings };
    }

    let data: unknown;
    try {
      data = JSON.parse(fs.readFileSync(abs, 'utf-8'));
    } catch (e) {
      return { valid: false, file: filePath, rowCount: 0, errors: [`Invalid JSON: ${(e as Error).message}`], warnings };
    }

    if (!Array.isArray(data)) {
      return { valid: false, file: filePath, rowCount: 0, errors: ['JSON data must be an array.'], warnings };
    }

    const rowCount = data.length;

    data.forEach((item, i) => {
      if (typeof item !== 'object' || item === null) {
        errors.push(`Item ${i + 1}: expected an object, got ${typeof item}.`);
        return;
      }
      for (const key of requiredKeys) {
        const value = (item as Record<string, unknown>)[key];
        if (value === undefined || value === null || value === '') {
          errors.push(`Item ${i + 1}: required key '${key}' is missing or blank.`);
        }
      }
    });

    if (expectedMinRows > 0 && rowCount < expectedMinRows) {
      warnings.push(`Item count (${rowCount}) is less than expected minimum (${expectedMinRows}).`);
    }

    return { valid: errors.length === 0, file: filePath, rowCount, errors, warnings };
  }

  /** Print a validation result to console */
  static printResult(result: DataValidationResult): void {
    const status = result.valid ? '[PASS]' : '[FAIL]';
    console.log(`\n${status} Data file: ${result.file} (${result.rowCount} rows)`);
    if (result.warnings.length > 0) {
      result.warnings.forEach((w) => console.log(`    ${w}`));
    }
    if (result.errors.length > 0) {
      result.errors.forEach((e) => console.log(`  [FAIL]  ${e}`));
    }
  }
}
