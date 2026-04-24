export interface ResultContract {
    timestamp: string;
    totalRequests: number;
    httpErrors: number;
    virtualUsers: number;
    data: Record<string, any>;
}
export declare class ResultTransformer {
    /**
     * Transforms raw k6 summary JSON into a standardized ResultContract payload.
     */
    static transform(k6Data: any): ResultContract;
}
//# sourceMappingURL=ResultTransformer.d.ts.map