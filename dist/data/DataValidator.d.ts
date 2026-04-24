/**
 * DataValidator.ts
 * Phase 1 – Pre-run validation of data files.
 * Checks for blank rows, missing required columns, and row-count vs VU demand.
 */
export interface DataValidationResult {
    valid: boolean;
    file: string;
    rowCount: number;
    errors: string[];
    warnings: string[];
}
export declare class DataValidator {
    /**
     * Validate a CSV data file.
     * @param filePath  Path to the CSV file
     * @param requiredColumns  Column names that must be present and non-empty in every row
     * @param expectedMinRows  Minimum row count required (e.g. VU count)
     */
    static validateCSV(filePath: string, requiredColumns?: string[], expectedMinRows?: number): DataValidationResult;
    /**
     * Validate a JSON array data file.
     */
    static validateJSON(filePath: string, requiredKeys?: string[], expectedMinRows?: number): DataValidationResult;
    /** Print a validation result to console */
    static printResult(result: DataValidationResult): void;
}
//# sourceMappingURL=DataValidator.d.ts.map