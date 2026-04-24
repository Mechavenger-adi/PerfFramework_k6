import { TransactionGroup } from '../recording/TransactionGrouper';
import { HAREntry } from '../types/HARContracts';
export interface ExchangeLogHeader {
    name: string;
    value: string;
}
export interface ExchangeLogCookie {
    name: string;
    value: string;
}
export interface ExchangeLogParams {
    [key: string]: string;
}
export interface ExchangeLogRequest {
    method: string;
    url: string;
    headers: ExchangeLogHeader[];
    queryParams: ExchangeLogParams;
    cookies: ExchangeLogCookie[];
    body?: string;
}
export interface ExchangeLogResponse {
    status: number;
    headers: ExchangeLogHeader[];
    cookies: ExchangeLogCookie[];
    body?: string;
}
export interface VariableEvent {
    name: string;
    type: 'parameter' | 'correlation';
    action: 'used' | 'set';
    value: string;
    source?: string;
}
export interface TaggedExchangeLogEntry {
    harEntryId: string;
    transaction: string;
    recordingStartedAt: string;
    iteration?: number;
    vu?: number;
    requestSequence?: number;
    durationMs?: number;
    tags: {
        transaction: string;
        har_entry_id: string;
        recording_started_at: string;
    };
    variableEvents?: VariableEvent[];
    request: ExchangeLogRequest;
    response: ExchangeLogResponse;
}
export declare class ExchangeLogBuilder {
    static fromGroups(groups: TransactionGroup[]): TaggedExchangeLogEntry[];
    static fromEntries(entries: HAREntry[]): TaggedExchangeLogEntry[];
    static fromHAREntry(entry: HAREntry, transactionName: string): TaggedExchangeLogEntry;
    private static readonly BINARY_CONTENT_RE;
    private static readonly BINARY_MIME_TYPES;
    private static readonly STATIC_EXT_RE;
    private static isBinaryContent;
    private static normalizeBody;
    private static buildRequestBody;
    private static looksReadable;
    private static extractQueryParams;
    private static extractCookies;
}
//# sourceMappingURL=ExchangeLog.d.ts.map