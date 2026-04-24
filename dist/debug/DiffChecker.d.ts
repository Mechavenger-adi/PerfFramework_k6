import { HAREntry } from '../types/HARContracts';
import { TaggedExchangeLogEntry, VariableEvent } from './ExchangeLog';
export interface HeaderDiffEntry {
    name: string;
    recordedValue?: string;
    replayedValue?: string;
    status: 'match' | 'mismatch' | 'missing_in_replay' | 'extra_in_replay';
}
export interface BodyDiffResult {
    match: boolean;
    similarity: number;
    recordedLength: number;
    replayedLength: number;
    summary: string;
}
export interface SideSnapshot {
    method?: string;
    url?: string;
    status?: number;
    requestHeaders: {
        name: string;
        value: string;
    }[];
    responseHeaders: {
        name: string;
        value: string;
    }[];
    requestBody?: string;
    responseBody?: string;
    requestCookies?: {
        name: string;
        value: string;
    }[];
    responseCookies?: {
        name: string;
        value: string;
    }[];
}
export interface DiffResult {
    harEntryId: string;
    transactionName: string;
    comparisonType: 'matched' | 'missing_in_replay' | 'extra_in_replay';
    methodMatch: boolean;
    urlMatch: boolean;
    statusMatch: boolean;
    requestHeaderDiffs: HeaderDiffEntry[];
    responseHeaderDiffs: HeaderDiffEntry[];
    requestBody: BodyDiffResult;
    responseBody: BodyDiffResult;
    requestScore: number;
    responseScore: number;
    matchScore: number;
    iteration: number;
    vu?: number;
    requestSequence?: number;
    durationMs?: number;
    tags?: TaggedExchangeLogEntry['tags'];
    variableEvents: VariableEvent[];
    warnings: string[];
    recorded: SideSnapshot;
    replayed: SideSnapshot;
}
export declare class DiffChecker {
    private static readonly LARGE_BODY_THRESHOLD;
    private static readonly REDIRECT_STATUSES;
    static compare(original: HAREntry, replay: Partial<HAREntry>): DiffResult;
    static compareBatch(originalEntries: HAREntry[], replayEntries: Partial<HAREntry>[]): DiffResult[];
    static compareTaggedLogs(recordedLogs: TaggedExchangeLogEntry[] | null | undefined, replayLogs: Partial<TaggedExchangeLogEntry>[], options?: {
        missingRecordingWarning?: string;
    }): DiffResult[];
    private static compareWithContext;
    private static diffHeaders;
    private static diffBodies;
    private static headersMatch;
    private static scorePercent;
    private static calculateStringSimilarity;
    private static calculateLargeBodySimilarity;
    private static sharedPrefixLength;
    private static sharedSuffixLength;
    private static sampledBodyMatchRatio;
    private static sampleWindow;
    private static levenshteinDistance;
    private static toHAREntry;
    private static toReplayProjection;
    private static extractHost;
    private static findReplayFallback;
    private static compareReplayOnly;
    private static groupReplayByIteration;
}
//# sourceMappingURL=DiffChecker.d.ts.map