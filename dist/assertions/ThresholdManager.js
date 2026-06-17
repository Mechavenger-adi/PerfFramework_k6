"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThresholdManager = void 0;
/** Matches SLA keys like p90, p95, p99, p99.9, p50 etc. */
const PERCENTILE_KEY_RE = /^p(\d+(?:\.\d+)?)$/;
class ThresholdManager {
    /**
     * Translates SLA definitions from the test plan into k6-native thresholds.
     *
     * Scope + precedence (most specific wins, per individual percentile/errorRate):
     *   • REQUEST-level    journey_slas[j]  >  global_sla.request  >  legacy flat global_sla
     *                      → http_req_duration[{scenario:j}] / http_req_failed[...]
     *   • TRANSACTION-level transaction_slas[t]  >  global_sla.transaction
     *                      → <txn> Trend / <txn>_checkrate, applied to EVERY transaction.
     *
     * `journeyTransactionNames` (journey → transaction names, extracted from the
     * scripts) is required for the global_sla.transaction default to reach every
     * transaction; without it only explicitly-named transaction_slas get thresholds.
     */
    static apply(testPlan, journeyTransactionNames) {
        const thresholds = {};
        const global = testPlan.global_sla;
        // ── 1. Request-level global ──────────────────────────────────────────
        // global_sla.request overrides legacy flat global_sla keys, per key.
        if (global) {
            const reqSla = this.mergeSla(this.flatGlobalKeys(global), global.request);
            const rules = this.buildDurationRules(reqSla);
            if (rules.length > 0)
                thresholds['http_req_duration'] = rules;
            if (reqSla.errorRate !== undefined) {
                thresholds['http_req_failed'] = [`rate<${reqSla.errorRate / 100}`];
            }
        }
        // ── 2. Per-journey (request-scoped) ──────────────────────────────────
        if (testPlan.journey_slas) {
            for (const [journeyName, sla] of Object.entries(testPlan.journey_slas)) {
                const rules = this.buildDurationRules(sla);
                if (rules.length > 0) {
                    thresholds[`http_req_duration{scenario:${journeyName}}`] = rules;
                }
                if (sla.errorRate !== undefined) {
                    thresholds[`http_req_failed{scenario:${journeyName}}`] = [`rate<${sla.errorRate / 100}`];
                }
            }
        }
        // ── 3. Transaction-level (global default + per-transaction override) ──
        // global_sla.transaction is the DEFAULT for every transaction of every
        // journey; transaction_slas[txn] overrides it per percentile/errorRate.
        const globalTxn = global?.transaction;
        const txnNames = new Set();
        if (journeyTransactionNames) {
            for (const names of Object.values(journeyTransactionNames)) {
                for (const n of names)
                    txnNames.add(n);
            }
        }
        // Always include explicitly-named transaction SLAs (covers a name the
        // script-scan may have missed, and keeps prior behavior when no names map).
        if (testPlan.transaction_slas) {
            for (const n of Object.keys(testPlan.transaction_slas))
                txnNames.add(n);
        }
        for (const txn of txnNames) {
            const merged = this.mergeSla(globalTxn, testPlan.transaction_slas?.[txn]);
            const rules = this.buildDurationRules(merged);
            if (rules.length > 0)
                thresholds[txn] = rules;
            // errorRate maps to the per-transaction pass-rate metric `<name>_checkrate`
            // (created in transaction.ts). checkrate is the PASS rate, so an errorRate
            // budget of N% means the pass rate must stay above (1 - N/100).
            if (merged.errorRate !== undefined) {
                thresholds[`${txn}_checkrate`] = [`rate>${1 - merged.errorRate / 100}`];
            }
        }
        // ── 4. Per-request (single HTTP request submetric) ───────────────────
        // request_slas[name] targets the k6 submetric filtered by the `name` tag,
        // letting a user hold one specific request to its own threshold. Scoped to
        // that request only — independent of request/transaction-level SLAs above.
        if (testPlan.request_slas) {
            for (const [reqName, sla] of Object.entries(testPlan.request_slas)) {
                const rules = this.buildDurationRules(sla);
                if (rules.length > 0) {
                    thresholds[`http_req_duration{name:${reqName}}`] = rules;
                }
                if (sla.errorRate !== undefined) {
                    thresholds[`http_req_failed{name:${reqName}}`] = [`rate<${sla.errorRate / 100}`];
                }
            }
        }
        return thresholds;
    }
    /** Flat (non-nested) keys of a global SLA — the legacy request-level shorthand. */
    static flatGlobalKeys(global) {
        const out = {};
        for (const [key, value] of Object.entries(global)) {
            if (key === 'request' || key === 'transaction')
                continue;
            if (typeof value === 'number')
                out[key] = value;
        }
        return out;
    }
    /** Merge two SLA definitions; `override` keys win over `base` keys, per key. */
    static mergeSla(base, override) {
        const out = {};
        for (const [key, value] of Object.entries(base ?? {})) {
            if (typeof value === 'number')
                out[key] = value;
        }
        for (const [key, value] of Object.entries(override ?? {})) {
            if (typeof value === 'number')
                out[key] = value;
        }
        return out;
    }
    /**
     * Build k6 duration threshold rules from an SLA definition.
     * Dynamically handles any percentile key (p50, p75, p90, p95, p99, p99.9, etc.).
     */
    static buildDurationRules(sla) {
        const rules = [];
        for (const [key, value] of Object.entries(sla)) {
            if (value === undefined)
                continue;
            const pMatch = key.match(PERCENTILE_KEY_RE);
            if (pMatch) {
                rules.push(`p(${pMatch[1]})<${value}`);
            }
            else if (key === 'avgResponseTime') {
                rules.push(`avg<${value}`);
            }
            // errorRate is handled separately (different metric)
        }
        return rules;
    }
    /**
     * Collect all percentile values referenced across all SLA definitions in the plan.
     * Returns k6-format percentile strings like 'p(90)', 'p(99)', 'p(99.9)'.
     */
    static collectPercentiles(testPlan) {
        const percentiles = new Set();
        const extractFromSLA = (sla) => {
            for (const key of Object.keys(sla)) {
                const m = key.match(PERCENTILE_KEY_RE);
                if (m)
                    percentiles.add(`p(${m[1]})`);
            }
        };
        if (testPlan.global_sla) {
            extractFromSLA(this.flatGlobalKeys(testPlan.global_sla));
            if (testPlan.global_sla.request)
                extractFromSLA(testPlan.global_sla.request);
            if (testPlan.global_sla.transaction)
                extractFromSLA(testPlan.global_sla.transaction);
        }
        if (testPlan.journey_slas) {
            for (const sla of Object.values(testPlan.journey_slas))
                extractFromSLA(sla);
        }
        if (testPlan.transaction_slas) {
            for (const sla of Object.values(testPlan.transaction_slas))
                extractFromSLA(sla);
        }
        if (testPlan.request_slas) {
            for (const sla of Object.values(testPlan.request_slas))
                extractFromSLA(sla);
        }
        return [...percentiles];
    }
}
exports.ThresholdManager = ThresholdManager;
