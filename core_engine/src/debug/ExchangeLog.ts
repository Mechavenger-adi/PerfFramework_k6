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

export class ExchangeLogBuilder {
  static fromGroups(groups: TransactionGroup[]): TaggedExchangeLogEntry[] {
    return groups.flatMap((group) =>
      group.entries.map((entry) => this.fromHAREntry(entry, group.name)),
    );
  }

  static fromEntries(entries: HAREntry[]): TaggedExchangeLogEntry[] {
    return entries.map((entry) => this.fromHAREntry(entry, entry.pageref || 'Ungrouped'));
  }

  static fromHAREntry(entry: HAREntry, transactionName: string): TaggedExchangeLogEntry {
    const tags = {
      transaction: transactionName,
      har_entry_id: entry.id,
      recording_started_at: entry.startedDateTime,
    };

    return {
      harEntryId: entry.id,
      transaction: transactionName,
      recordingStartedAt: entry.startedDateTime,
      tags,
      request: {
        method: entry.method,
        url: entry.url,
        headers: entry.headers ?? [],
        queryParams: this.extractQueryParams(entry.url),
        cookies: this.extractCookies(entry.headers ?? [], 'cookie'),
        body: this.buildRequestBody(entry.postData),
      },
      response: {
        status: entry.status,
        headers: entry.responseHeaders ?? [],
        cookies: this.extractCookies(entry.responseHeaders ?? [], 'set-cookie'),
        body: this.normalizeBody(entry.responseBody?.text, entry.responseBody?.encoding, entry.mimeType, entry.url),
      },
    };
  }

  private static readonly BINARY_CONTENT_RE = /^(?:image|audio|video|font)\//i;
  private static readonly BINARY_MIME_TYPES = new Set([
    'application/octet-stream', 'application/zip', 'application/pdf',
    'application/x-font-ttf', 'application/x-font-woff',
    'application/font-woff', 'application/font-woff2',
    'application/vnd.ms-fontobject',
  ]);
  private static readonly STATIC_EXT_RE = /\.(?:png|jpe?g|gif|svg|ico|webp|avif|bmp|tiff?|woff2?|ttf|otf|eot|mp[34]|webm|ogg|flac|wav|zip|gz|br|pdf)(?:[?#]|$)/i;

  private static isBinaryContent(mimeType?: string, url?: string): string | null {
    if (mimeType) {
      const ct = mimeType.split(';')[0].trim().toLowerCase();
      if (this.BINARY_CONTENT_RE.test(ct) || this.BINARY_MIME_TYPES.has(ct)) {
        return `[binary: ${ct}]`;
      }
    }
    if (url && this.STATIC_EXT_RE.test(url)) {
      return '[binary: static asset]';
    }
    return null;
  }

  private static normalizeBody(body?: string, encoding?: string, mimeType?: string, url?: string): string | undefined {
    const binaryTag = this.isBinaryContent(mimeType, url);
    if (binaryTag) return binaryTag;

    if (!body) return body;
    if ((encoding || '').toLowerCase() !== 'base64') {
      return body;
    }

    try {
      const decoded = Buffer.from(body, 'base64').toString('utf-8');
      if (this.looksReadable(decoded)) {
        return decoded;
      }
    } catch {
      // preserve original body when decode fails
    }

    return body;
  }

  private static buildRequestBody(postData?: HAREntry['postData']): string | undefined {
    if (!postData) return undefined;
    if (postData.text !== undefined && postData.text !== '') {
      return postData.text;
    }
    if (!postData.params || postData.params.length === 0) {
      return undefined;
    }

    return postData.params
      .map((param) => `${encodeURIComponent(param.name)}=${encodeURIComponent(param.value ?? '')}`)
      .join('&');
  }

  private static looksReadable(value: string): boolean {
    const trimmed = value.trim();
    return (
      trimmed.startsWith('<') ||
      trimmed.startsWith('{') ||
      trimmed.startsWith('[') ||
      /[\r\n\t ]/.test(value) ||
      /<!DOCTYPE html>/i.test(value)
    );
  }

  private static extractQueryParams(url: string): ExchangeLogParams {
    try {
      const parsed = new URL(url);
      const params: ExchangeLogParams = {};
      parsed.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      return params;
    } catch {
      return {};
    }
  }

  private static extractCookies(
    headers: ExchangeLogHeader[],
    headerName: 'cookie' | 'set-cookie',
  ): ExchangeLogCookie[] {
    const matchingHeaders = headers.filter((header) => header.name.toLowerCase() === headerName);
    const cookies: ExchangeLogCookie[] = [];

    for (const header of matchingHeaders) {
      const parts = header.value.split(';').map((part) => part.trim()).filter(Boolean);
      const firstToken = parts[0];
      const separatorIndex = firstToken.indexOf('=');
      if (separatorIndex <= 0) continue;

      cookies.push({
        name: firstToken.slice(0, separatorIndex),
        value: firstToken.slice(separatorIndex + 1),
      });
    }

    return cookies;
  }
}
