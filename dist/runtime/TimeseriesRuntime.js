"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeseriesRuntime = void 0;
class TimeseriesRuntime {
    constructor(bucketSizeSeconds, startTime) {
        this.bucketSizeSeconds = bucketSizeSeconds;
        this.startTime = startTime;
        this.overview = new Map();
        this.transactions = new Map();
        this.requests = new Map();
        this.system = new Map();
        this.events = [];
    }
    bucketTs(ts) {
        const ms = new Date(ts).getTime();
        const bucketMs = this.bucketSizeSeconds * 1000;
        return new Date(Math.floor(ms / bucketMs) * bucketMs).toISOString();
    }
    addOverviewPoint(ts, values) {
        const bucket = this.bucketTs(ts);
        const existing = this.overview.get(bucket) ?? { ts: bucket };
        for (const [key, value] of Object.entries(values)) {
            existing[key] = (existing[key] ?? 0) + value;
        }
        this.overview.set(bucket, existing);
    }
    addTransactionPoint(transaction, ts, values) {
        const bucket = this.bucketTs(ts);
        const bucketMap = this.transactions.get(transaction) ?? new Map();
        const existing = bucketMap.get(bucket) ?? { ts: bucket };
        for (const [key, value] of Object.entries(values)) {
            if (Array.isArray(value)) {
                // Raw sample arrays (e.g. durations) are concatenated, not summed, when
                // multiple source buckets fall into the same runtime bucket.
                const prev = existing[key] ?? [];
                existing[key] = prev.concat(value);
            }
            else {
                existing[key] = (existing[key] ?? 0) + value;
            }
        }
        bucketMap.set(bucket, existing);
        this.transactions.set(transaction, bucketMap);
    }
    /**
     * Per-request bucket point. Numeric values (count/failed/durations…) merge the
     * same way as transactions (sum numbers, concat sample arrays); string values
     * (method/transaction/url metadata) are constant per request name and simply
     * overwrite so they survive bucket merges without string concatenation.
     */
    addRequestPoint(request, ts, values) {
        const bucket = this.bucketTs(ts);
        const bucketMap = this.requests.get(request) ?? new Map();
        const existing = bucketMap.get(bucket) ?? { ts: bucket };
        for (const [key, value] of Object.entries(values)) {
            if (Array.isArray(value)) {
                const prev = existing[key] ?? [];
                existing[key] = prev.concat(value);
            }
            else if (typeof value === 'string') {
                existing[key] = value;
            }
            else {
                existing[key] = (existing[key] ?? 0) + value;
            }
        }
        bucketMap.set(bucket, existing);
        this.requests.set(request, bucketMap);
    }
    addSystemPoint(agent, ts, values) {
        const bucket = this.bucketTs(ts);
        const bucketMap = this.system.get(agent) ?? new Map();
        const existing = bucketMap.get(bucket) ?? { ts: bucket };
        for (const [key, value] of Object.entries(values)) {
            existing[key] = value;
        }
        bucketMap.set(bucket, existing);
        this.system.set(agent, bucketMap);
    }
    addEvent(ts, type, severity, transaction) {
        this.events.push({ ts, type, transaction, severity });
    }
    build(endTime) {
        return {
            bucketSizeSeconds: this.bucketSizeSeconds,
            startTime: this.startTime,
            endTime,
            series: {
                overview: [...this.overview.values()].sort((a, b) => String(a.ts).localeCompare(String(b.ts))),
                transactions: Object.fromEntries([...this.transactions.entries()].map(([transaction, bucketMap]) => [
                    transaction,
                    [...bucketMap.values()].sort((a, b) => String(a.ts).localeCompare(String(b.ts))),
                ])),
                requests: Object.fromEntries([...this.requests.entries()].map(([request, bucketMap]) => [
                    request,
                    [...bucketMap.values()].sort((a, b) => String(a.ts).localeCompare(String(b.ts))),
                ])),
                system: Object.fromEntries([...this.system.entries()].map(([agent, bucketMap]) => [
                    agent,
                    [...bucketMap.values()].sort((a, b) => String(a.ts).localeCompare(String(b.ts))),
                ])),
                events: [...this.events].sort((a, b) => a.ts.localeCompare(b.ts)),
            },
        };
    }
}
exports.TimeseriesRuntime = TimeseriesRuntime;
