"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeseriesRuntime = void 0;
class TimeseriesRuntime {
    constructor(bucketSizeSeconds, startTime) {
        this.bucketSizeSeconds = bucketSizeSeconds;
        this.startTime = startTime;
        this.overview = new Map();
        this.transactions = new Map();
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
            existing[key] = (existing[key] ?? 0) + value;
        }
        bucketMap.set(bucket, existing);
        this.transactions.set(transaction, bucketMap);
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
//# sourceMappingURL=TimeseriesRuntime.js.map