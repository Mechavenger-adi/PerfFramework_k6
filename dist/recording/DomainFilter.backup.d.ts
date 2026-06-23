import { HAREntry } from '../types/HARContracts';
export declare class DomainFilter {
    /**
     * Filter HAR entries by allowed output domains. Supports substring matching.
     */
    static filter(entries: HAREntry[], allowedDomains: string[]): HAREntry[];
}
//# sourceMappingURL=DomainFilter.backup.d.ts.map