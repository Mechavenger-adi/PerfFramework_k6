/**
 * DataFactory.ts
 * Phase 1 – Loads CSV and JSON data files into typed arrays.
 *
 * NOTE: In production k6 scripts, data is loaded via k6's SharedArray.
 * This DataFactory is the Node.js-side counterpart used by the CLI,
 * Gatekeeper, and DataPoolManager for validation and allocation.
 * The k6-side SharedArray wrapper is in the generated test script template.
 */
export type DataRow = Record<string, string | number | boolean | null>;
export interface LoadedDataset {
    name: string;
    rows: DataRow[];
    source: string;
}
export declare class DataFactory {
    /**
     * Load a CSV file into an array of row objects.
     * First row is treated as header.
     * Supports quoted fields and comma-separated values.
     */
    static loadCSV(filePath: string, datasetName?: string): LoadedDataset;
    /**
     * Load a JSON array file.
     */
    static loadJSON(filePath: string, datasetName?: string): LoadedDataset;
    /**
     * Auto-detect file type and load accordingly.
     */
    static load(filePath: string, datasetName?: string): LoadedDataset;
    /** Parse a single CSV row respecting quoted fields */
    private static parseCSVRow;
    /** Attempt to coerce a string cell value to a native type */
    private static coerceValue;
}
//# sourceMappingURL=DataFactory.d.ts.map