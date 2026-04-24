/**
 * ExtractorRegistry.ts
 * Phase 3 – Pluggable extractors for correlation.
 *
 * NOTE: This module defines types compatible with k6's RefinedResponse at runtime.
 * Since the core engine compiles under Node (not k6), we use a generic response interface
 * that mirrors the k6 response shape. At runtime inside k6, the actual k6 response objects
 * are passed in and work transparently.
 */
export interface K6ResponseLike {
    status: number;
    body: string | null;
    headers: Record<string, string>;
    json(selector?: string): any;
}
export type ExtractorFn = (res: K6ResponseLike, pattern: string) => string | null;
export declare class ExtractorRegistry {
    private static extractors;
    static register(type: string, fn: ExtractorFn): void;
    static get(type: string): ExtractorFn | undefined;
}
//# sourceMappingURL=ExtractorRegistry.d.ts.map