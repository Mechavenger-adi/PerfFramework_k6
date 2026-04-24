"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiffChecker = void 0;
class DiffChecker {
    static compare(original, replay) {
        return this.compareWithContext(original, replay, {});
    }
    static compareBatch(originalEntries, replayEntries) {
        const replayById = new Map();
        replayEntries.forEach((entry) => {
            if (entry.id)
                replayById.set(entry.id, entry);
        });
        let fallbackIndex = 0;
        return originalEntries.map((original) => {
            const replay = replayById.get(original.id) ??
                replayEntries.find((entry, index) => index >= fallbackIndex && entry.url === original.url) ??
                replayEntries[fallbackIndex] ??
                {};
            const matchedIndex = replayEntries.indexOf(replay);
            if (matchedIndex >= 0) {
                fallbackIndex = matchedIndex + 1;
            }
            return this.compareWithContext(original, replay, {});
        });
    }
    static compareTaggedLogs(recordedLogs, replayLogs, options) {
        const replayByIteration = this.groupReplayByIteration(replayLogs);
        const recorded = recordedLogs ?? [];
        const results = [];
        for (const [iterationKey, replayEntries] of replayByIteration.entries()) {
            const iteration = Number(iterationKey);
            if (recorded.length === 0) {
                replayEntries.forEach((projection) => {
                    results.push(this.compareReplayOnly(projection, options?.missingRecordingWarning, iteration));
                });
                continue;
            }
            const replayById = new Map();
            const unusedReplayEntries = new Set();
            replayEntries.forEach((projection) => {
                unusedReplayEntries.add(projection);
                if (projection.har.id) {
                    replayById.set(projection.har.id, projection);
                }
            });
            recorded.forEach((recordedLog) => {
                const original = this.toHAREntry(recordedLog);
                const matchedProjection = replayById.get(recordedLog.harEntryId) ??
                    this.findReplayFallback(original, Array.from(unusedReplayEntries));
                if (matchedProjection) {
                    unusedReplayEntries.delete(matchedProjection);
                    results.push(this.compareWithContext(original, matchedProjection.har, {
                        ...matchedProjection.meta,
                        comparisonType: 'matched',
                        iteration,
                    }));
                }
                else {
                    results.push(this.compareWithContext(original, {}, {
                        comparisonType: 'missing_in_replay',
                        transactionName: recordedLog.transaction,
                        iteration,
                    }));
                }
            });
            Array.from(unusedReplayEntries).forEach((projection) => {
                results.push(this.compareReplayOnly(projection, undefined, iteration));
            });
        }
        return results.sort((a, b) => {
            if (a.iteration !== b.iteration)
                return a.iteration - b.iteration;
            return (a.requestSequence ?? Number.MAX_SAFE_INTEGER) - (b.requestSequence ?? Number.MAX_SAFE_INTEGER);
        });
    }
    static compareWithContext(original, replay, context) {
        const methodMatch = original.method === replay.method;
        const urlMatch = original.url === replay.url;
        const statusMatch = original.status === replay.status;
        const requestHeaderDiffs = this.diffHeaders(original.headers, replay.headers ?? []);
        const responseHeaderDiffs = this.diffHeaders(original.responseHeaders ?? [], replay.responseHeaders ?? []);
        const requestBody = this.diffBodies(original.postData?.text, replay.postData?.text);
        const responseBody = this.diffBodies(original.responseBody?.text, replay.responseBody?.text);
        const isRedirectCase = original.status !== undefined &&
            this.REDIRECT_STATUSES.has(original.status) &&
            replay.status !== undefined &&
            !this.REDIRECT_STATUSES.has(replay.status);
        if (isRedirectCase) {
            responseBody.summary = `Redirect detected (${original.status} → ${replay.status}). ${responseBody.summary}`;
            const warnings = context.warnings ?? [];
            warnings.push(`Recording returned ${original.status} redirect. k6 follows redirects by default, so replayed response (${replay.status}) is the final destination. Body and status differences are expected.`);
            context.warnings = warnings;
        }
        const requestScore = this.scorePercent([
            methodMatch,
            urlMatch,
            this.headersMatch(requestHeaderDiffs),
            requestBody.match,
        ]);
        const responseScore = this.scorePercent([
            isRedirectCase ? true : statusMatch,
            this.headersMatch(responseHeaderDiffs),
            isRedirectCase ? true : responseBody.match,
        ]);
        const matchScore = Math.round((requestScore + responseScore) / 2);
        return {
            harEntryId: original.id,
            transactionName: context.transactionName ?? original.pageref ?? 'Ungrouped',
            comparisonType: context.comparisonType ??
                (replay.id || replay.url || replay.status !== undefined ? 'matched' : 'missing_in_replay'),
            methodMatch,
            urlMatch,
            statusMatch,
            requestHeaderDiffs,
            responseHeaderDiffs,
            requestBody,
            responseBody,
            requestScore,
            responseScore,
            matchScore,
            iteration: context.iteration ?? 1,
            vu: context.vu,
            requestSequence: context.requestSequence,
            durationMs: context.durationMs,
            tags: context.tags,
            variableEvents: context.variableEvents ?? [],
            warnings: context.warnings ?? [],
            recorded: {
                method: original.method,
                url: original.url,
                status: original.status,
                requestHeaders: original.headers ?? [],
                responseHeaders: original.responseHeaders ?? [],
                requestBody: original.postData?.text,
                responseBody: original.responseBody?.text,
                requestCookies: original.requestCookies ?? [],
                responseCookies: original.responseCookies ?? [],
            },
            replayed: {
                method: replay.method,
                url: replay.url,
                status: replay.status,
                requestHeaders: replay.headers ?? [],
                responseHeaders: replay.responseHeaders ?? [],
                requestBody: replay.postData?.text,
                responseBody: replay.responseBody?.text,
                requestCookies: replay.requestCookies ?? [],
                responseCookies: replay.responseCookies ?? [],
            },
        };
    }
    static diffHeaders(recordedHeaders = [], replayedHeaders = []) {
        const recordedMap = new Map(recordedHeaders.map((header) => [header.name.toLowerCase(), header.value]));
        const replayedMap = new Map(replayedHeaders.map((header) => [header.name.toLowerCase(), header.value]));
        const names = new Set([...recordedMap.keys(), ...replayedMap.keys()]);
        return Array.from(names)
            .sort()
            .map((name) => {
            const recordedValue = recordedMap.get(name);
            const replayedValue = replayedMap.get(name);
            if (recordedValue === undefined) {
                return { name, replayedValue, status: 'extra_in_replay' };
            }
            if (replayedValue === undefined) {
                return { name, recordedValue, status: 'missing_in_replay' };
            }
            if (recordedValue === replayedValue) {
                return { name, recordedValue, replayedValue, status: 'match' };
            }
            return { name, recordedValue, replayedValue, status: 'mismatch' };
        });
    }
    static diffBodies(recordedBody, replayedBody) {
        const recorded = recordedBody ?? '';
        const replayed = replayedBody ?? '';
        if (!recorded && !replayed) {
            return {
                match: true,
                similarity: 100,
                recordedLength: 0,
                replayedLength: 0,
                summary: 'Both bodies are empty.',
            };
        }
        // One side missing — no meaningful comparison possible
        if (!recorded && replayed) {
            return {
                match: false,
                similarity: 0,
                recordedLength: 0,
                replayedLength: replayed.length,
                summary: 'Recording body not available.',
            };
        }
        if (recorded && !replayed) {
            return {
                match: false,
                similarity: 0,
                recordedLength: recorded.length,
                replayedLength: 0,
                summary: 'Replay body not available.',
            };
        }
        if (recorded === replayed) {
            return {
                match: true,
                similarity: 100,
                recordedLength: recorded.length,
                replayedLength: replayed.length,
                summary: 'Bodies match exactly.',
            };
        }
        const similarity = this.calculateStringSimilarity(recorded, replayed);
        const match = similarity >= 90;
        const delta = Math.abs(recorded.length - replayed.length);
        return {
            match,
            similarity,
            recordedLength: recorded.length,
            replayedLength: replayed.length,
            summary: `Length delta ${delta} chars. Similarity ${similarity}%.`,
        };
    }
    static headersMatch(diffs) {
        return diffs.every((diff) => diff.status === 'match');
    }
    static scorePercent(checks) {
        if (checks.length === 0)
            return 100;
        const passed = checks.filter(Boolean).length;
        return Math.round((passed / checks.length) * 100);
    }
    static calculateStringSimilarity(a, b) {
        if (!a && !b)
            return 100;
        if (Math.max(a.length, b.length) > this.LARGE_BODY_THRESHOLD) {
            return this.calculateLargeBodySimilarity(a, b);
        }
        const distance = this.levenshteinDistance(a, b);
        const maxLength = Math.max(a.length, b.length, 1);
        return Math.max(0, Math.round((1 - distance / maxLength) * 100));
    }
    static calculateLargeBodySimilarity(a, b) {
        if (a === b)
            return 100;
        const maxLength = Math.max(a.length, b.length, 1);
        const prefixMatch = this.sharedPrefixLength(a, b);
        const suffixMatch = this.sharedSuffixLength(a, b, prefixMatch);
        const lengthSimilarity = 1 - Math.abs(a.length - b.length) / maxLength;
        const sampledMatch = this.sampledBodyMatchRatio(a, b);
        const weightedScore = ((prefixMatch + suffixMatch) / maxLength) * 0.4 +
            lengthSimilarity * 0.2 +
            sampledMatch * 0.4;
        return Math.max(0, Math.min(100, Math.round(weightedScore * 100)));
    }
    static sharedPrefixLength(a, b) {
        const limit = Math.min(a.length, b.length, 2000);
        let index = 0;
        while (index < limit && a[index] === b[index]) {
            index += 1;
        }
        return index;
    }
    static sharedSuffixLength(a, b, prefixLength) {
        const maxComparable = Math.min(a.length, b.length, 2000);
        let matched = 0;
        while (matched < maxComparable &&
            matched < a.length - prefixLength &&
            matched < b.length - prefixLength &&
            a[a.length - 1 - matched] === b[b.length - 1 - matched]) {
            matched += 1;
        }
        return matched;
    }
    static sampledBodyMatchRatio(a, b) {
        const sampleWindow = 400;
        const checkpoints = [0.1, 0.3, 0.5, 0.7, 0.9];
        let total = 0;
        checkpoints.forEach((checkpoint) => {
            const aSlice = this.sampleWindow(a, checkpoint, sampleWindow);
            const bSlice = this.sampleWindow(b, checkpoint, sampleWindow);
            const maxLength = Math.max(aSlice.length, bSlice.length, 1);
            let matched = 0;
            for (let index = 0; index < Math.min(aSlice.length, bSlice.length); index += 1) {
                if (aSlice[index] === bSlice[index]) {
                    matched += 1;
                }
            }
            total += matched / maxLength;
        });
        return total / checkpoints.length;
    }
    static sampleWindow(value, checkpoint, windowSize) {
        if (value.length <= windowSize)
            return value;
        const center = Math.floor(value.length * checkpoint);
        const start = Math.max(0, Math.min(value.length - windowSize, center - Math.floor(windowSize / 2)));
        return value.slice(start, start + windowSize);
    }
    static levenshteinDistance(a, b) {
        const rows = a.length + 1;
        const cols = b.length + 1;
        const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));
        for (let i = 0; i < rows; i++)
            matrix[i][0] = i;
        for (let j = 0; j < cols; j++)
            matrix[0][j] = j;
        for (let i = 1; i < rows; i++) {
            for (let j = 1; j < cols; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
            }
        }
        return matrix[rows - 1][cols - 1];
    }
    static toHAREntry(entry) {
        return {
            id: entry.harEntryId,
            method: entry.request.method,
            url: entry.request.url,
            headers: entry.request.headers ?? [],
            postData: entry.request.body !== undefined
                ? {
                    mimeType: '',
                    text: entry.request.body,
                }
                : undefined,
            status: entry.response.status,
            responseHeaders: entry.response.headers ?? [],
            responseBody: entry.response.body !== undefined
                ? {
                    mimeType: '',
                    text: entry.response.body,
                }
                : undefined,
            requestCookies: entry.request.cookies ?? [],
            responseCookies: entry.response.cookies ?? [],
            pageref: entry.transaction,
            startedDateTime: entry.recordingStartedAt,
            time: 0,
            mimeType: '',
            host: this.extractHost(entry.request.url),
        };
    }
    static toReplayProjection(entry) {
        if (!entry) {
            return { har: {}, meta: { iteration: 1, variableEvents: [], warnings: [] } };
        }
        return {
            har: {
                id: entry.harEntryId ?? entry.tags?.har_entry_id,
                method: entry.request?.method,
                url: typeof entry.request?.url === 'string' ? entry.request.url : String(entry.request?.url ?? ''),
                headers: entry.request?.headers ?? [],
                postData: entry.request?.body !== undefined
                    ? {
                        mimeType: '',
                        text: entry.request.body,
                    }
                    : undefined,
                status: entry.response?.status,
                responseHeaders: entry.response?.headers ?? [],
                responseBody: entry.response?.body !== undefined
                    ? {
                        mimeType: '',
                        text: entry.response.body,
                    }
                    : undefined,
                requestCookies: entry.request?.cookies ?? [],
                responseCookies: entry.response?.cookies ?? [],
                pageref: entry.transaction ?? entry.tags?.transaction,
                startedDateTime: entry.recordingStartedAt ?? entry.tags?.recording_started_at,
            },
            meta: {
                transactionName: entry.transaction ?? entry.tags?.transaction,
                iteration: entry.iteration ?? 1,
                vu: entry.vu,
                requestSequence: entry.requestSequence,
                durationMs: entry.durationMs,
                tags: entry.tags,
                variableEvents: entry.variableEvents ?? [],
                warnings: [],
            },
        };
    }
    static extractHost(url) {
        try {
            return new URL(url).hostname;
        }
        catch {
            return url;
        }
    }
    static findReplayFallback(original, candidates) {
        return candidates.find((entry) => {
            return entry.har.url === original.url && entry.har.method === original.method;
        });
    }
    static compareReplayOnly(replay, missingRecordingWarning, iteration) {
        const requestHeaderDiffs = this.diffHeaders([], replay.har.headers ?? []);
        const responseHeaderDiffs = this.diffHeaders([], replay.har.responseHeaders ?? []);
        const requestBody = this.diffBodies(undefined, replay.har.postData?.text);
        const responseBody = this.diffBodies(undefined, replay.har.responseBody?.text);
        return {
            harEntryId: replay.har.id ?? 'replay_only',
            transactionName: replay.meta.transactionName || replay.har.pageref || 'Replay Only',
            comparisonType: 'extra_in_replay',
            methodMatch: false,
            urlMatch: false,
            statusMatch: false,
            requestHeaderDiffs,
            responseHeaderDiffs,
            requestBody,
            responseBody,
            requestScore: 0,
            responseScore: 0,
            matchScore: 0,
            iteration: iteration ?? replay.meta.iteration ?? 1,
            vu: replay.meta.vu,
            requestSequence: replay.meta.requestSequence,
            durationMs: replay.meta.durationMs,
            tags: replay.meta.tags,
            variableEvents: replay.meta.variableEvents ?? [],
            warnings: missingRecordingWarning ? [missingRecordingWarning] : [],
            recorded: {
                method: undefined,
                url: undefined,
                status: undefined,
                requestHeaders: [],
                responseHeaders: [],
                requestBody: undefined,
                responseBody: undefined,
                requestCookies: [],
                responseCookies: [],
            },
            replayed: {
                method: replay.har.method,
                url: replay.har.url,
                status: replay.har.status,
                requestHeaders: replay.har.headers ?? [],
                responseHeaders: replay.har.responseHeaders ?? [],
                requestBody: replay.har.postData?.text,
                responseBody: replay.har.responseBody?.text,
                requestCookies: replay.har.requestCookies ?? [],
                responseCookies: replay.har.responseCookies ?? [],
            },
        };
    }
    static groupReplayByIteration(replayLogs) {
        const grouped = new Map();
        replayLogs.forEach((entry) => {
            const projection = this.toReplayProjection(entry);
            const iteration = projection.meta.iteration ?? 1;
            const existing = grouped.get(iteration) ?? [];
            existing.push(projection);
            grouped.set(iteration, existing);
        });
        if (grouped.size === 0) {
            grouped.set(1, []);
        }
        return grouped;
    }
}
exports.DiffChecker = DiffChecker;
DiffChecker.LARGE_BODY_THRESHOLD = 4000;
DiffChecker.REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
//# sourceMappingURL=DiffChecker.js.map