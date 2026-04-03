import * as fs from 'fs';
import { HAREntry, HARRefinementOptions } from '../types/HARContracts';
import { Logger } from '../utils/logger';
import { DomainFilter } from './DomainFilter';

export class HARParser {
  /**
   * Parse a HAR file, extract internal entry models, and perform the current refinement steps.
   */
  static parse(filePath: string, options: HARRefinementOptions = {}): HAREntry[] {
    let entries = this.readEntries(filePath);

    // 1. Sort by DateTime
    entries.sort((a, b) => new Date(a.startedDateTime).getTime() - new Date(b.startedDateTime).getTime());

    // 2. Domain filtering
    if (options.allowedDomains && options.allowedDomains.length > 0) {
      entries = DomainFilter.filter(entries, options.allowedDomains);
    }

    // 3. Static asset removal
    if (options.excludeStaticAssets) {
      const staticExts = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.ico'];
      entries = entries.filter((req) => {
        const urlLower = req.url.toLowerCase();
        // Check extension or mimeType
        const isMimeStatic = req.mimeType.includes('image/') || req.mimeType.includes('font/') || req.mimeType.includes('text/css');
        const isExtStatic = staticExts.some(ext => urlLower.includes(ext));
        return !(isExtStatic || isMimeStatic);
      });
      Logger.debug(`[HARParser] Filtered static assets, ${entries.length} requests remaining.`);
    }

    // 4. Header stripping
    const stripHeaders = (options.stripHeaders || ['x-request-id', 'traceparent', 'x-correlation-id', 'cookie', 'authorization']).map(h => h.toLowerCase());
    entries.forEach(req => {
      req.headers = req.headers.filter(h => !stripHeaders.includes(h.name.toLowerCase()));
    });

    // 5. Re-sequence IDs after filtering (1-based)
    entries.forEach((req, idx) => {
      req.id = `req_${idx + 1}`;
    });

    return entries;
  }

  /**
   * Read entries from a HAR file without applying filters so the CLI can inspect domains first.
   */
  static readEntries(filePath: string): HAREntry[] {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const har = JSON.parse(rawData);

    if (!har.log || !har.log.entries) {
      throw new Error(`Invalid HAR file at ${filePath}`);
    }

    return har.log.entries.filter((e: any) => e.request && e.response).map((e: any, index: number) => {
      let host = '';
      try {
        host = new URL(e.request.url).hostname;
      } catch (err) {
        host = e.request.url;
      }

      return {
        id: `req_${index}`,
        method: e.request.method,
        url: e.request.url,
        headers: e.request.headers,
        postData: e.request.postData,
        status: e.response.status,
        responseHeaders: e.response.headers,
        responseBody: e.response.content,
        requestCookies: Array.isArray(e.request.cookies)
          ? e.request.cookies.map((c: any) => ({ name: c.name, value: c.value }))
          : [],
        responseCookies: Array.isArray(e.response.cookies)
          ? e.response.cookies.map((c: any) => ({ name: c.name, value: c.value }))
          : [],
        pageref: e.pageref,
        startedDateTime: e.startedDateTime,
        time: e.time,
        mimeType: e.response.content?.mimeType || '',
        host
      };
    });
  }
}
