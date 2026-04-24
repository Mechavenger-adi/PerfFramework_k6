import { HAREntry, HARRefinementOptions } from '../types/HARContracts';
export declare class HARParser {
    /**
     * Parse a HAR file, extract internal entry models, and perform the current refinement steps.
     */
    static parse(filePath: string, options?: HARRefinementOptions): HAREntry[];
    /**
     * Read entries from a HAR file without applying filters so the CLI can inspect domains first.
     */
    static readEntries(filePath: string): HAREntry[];
}
//# sourceMappingURL=HARParser.d.ts.map