export interface HAREntry {
  id: string;
  method: string;
  url: string;
  headers: { name: string; value: string }[];
  postData?: {
    mimeType: string;
    text: string;
    params?: { name: string; value: string }[];
  };
  status: number;
  responseHeaders: { name: string; value: string }[];
  responseBody?: {
    mimeType: string;
    text: string;
    encoding?: string;
  };
  requestCookies?: { name: string; value: string }[];
  responseCookies?: { name: string; value: string }[];
  pageref?: string;
  startedDateTime: string;
  time: number;
  mimeType: string;
  host: string;
}

export interface HARRefinementOptions {
  allowedDomains?: string[];
  excludeStaticAssets?: boolean;
  stripHeaders?: string[];
}
