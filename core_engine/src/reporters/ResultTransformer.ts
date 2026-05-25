export interface ResultContract {
  timestamp: string;
  totalRequests: number;
  httpErrors: number;
  virtualUsers: number;
  data: Record<string, any>;
}

export class ResultTransformer {
  /**
   * Transforms raw k6 summary JSON into a standardized ResultContract payload.
   */
  static transform(k6Data: any): ResultContract {
    return {
      timestamp: new Date().toISOString(),
      totalRequests: k6Data.metrics?.http_reqs?.values?.count || 0,
      httpErrors: k6Data.metrics?.http_req_failed?.values?.passes || 0,
      virtualUsers: k6Data.metrics?.vus?.values?.value || 0,
      data: k6Data.metrics || {}
    };
  }
}
