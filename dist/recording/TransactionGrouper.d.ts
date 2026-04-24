import { HAREntry } from '../types/HARContracts';
export interface TransactionGroup {
    name: string;
    entries: HAREntry[];
}
export declare class TransactionGrouper {
    /**
     * Group HAR entries by 'pageref' to define transaction boundaries.
     * If 'pageref' is missing, it creates fallback groups to ensure everything is captured.
     */
    static group(entries: HAREntry[]): TransactionGroup[];
}
//# sourceMappingURL=TransactionGrouper.d.ts.map