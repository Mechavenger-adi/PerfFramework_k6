export interface HAREntry {
    id: string;
    method: string;
    url: string;
    headers: {
        name: string;
        value: string;
    }[];
    postData?: {
        mimeType: string;
        text: string;
        params?: {
            name: string;
            value: string;
        }[];
        /**
         * When set, ScriptGenerator emits this string as a RAW JS expression for
         * the request body — bypassing the default JSON.stringify of `text`.
         * Use this when the body needs to reference module-scope bindings, e.g.
         * file uploads (`expression: 'photoBytes'`) or multipart with file fields
         * (`expression: "{ name: 'alice', photo: http.file(photoBytes, 'photo.jpg', 'image/jpeg') }"`).
         * Synthetic HAR sources (Postman / cURL) can use this to wire up init-context
         * code without changing the per-request emission shape.
         */
        expression?: string;
    };
    status: number;
    /** Transport-error reason when status is 0 (k6 timeout / reset / refused). */
    error?: string;
    /** k6 numeric error code paired with `error`. */
    errorCode?: number;
    responseHeaders: {
        name: string;
        value: string;
    }[];
    responseBody?: {
        mimeType: string;
        text: string;
        encoding?: string;
    };
    requestCookies?: {
        name: string;
        value: string;
    }[];
    responseCookies?: {
        name: string;
        value: string;
    }[];
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
