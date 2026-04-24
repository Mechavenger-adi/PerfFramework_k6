import { HAREntry } from '../types/HARContracts';
export interface DomainStat {
    host: string;
    count: number;
}
export declare class DomainFilter {
    /**
     * Summarize domains present in the HAR so the CLI can present user choices.
     */
    static summarize(entries: HAREntry[]): DomainStat[];
    /**
     * Filter HAR entries by allowed output domains. Supports substring matching.
     */
    static filter(entries: HAREntry[], allowedDomains: string[]): HAREntry[];
}
//# sourceMappingURL=DomainFilter.d.ts.map