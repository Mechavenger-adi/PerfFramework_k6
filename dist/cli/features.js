"use strict";
/**
 * features.ts
 * Phase 5 – Framework Features Discovery
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFeatures = listFeatures;
function listFeatures() {
    console.log(`
============================================
|     K6-PerfFramework Capabilities        |
============================================

1. Architecture & Execution
   - Parallel Execution (Multiple VUs/Journeys)
   - Sequential Execution (Step-by-step logic)
   - Hybrid Execution (Background + active load)
   - Dynamic Pacing & Think Time calculation

2. Testing Paradigms
   - Standard Load Testing
   - Spike Testing
   - Soak / Endurance Testing
   - Breakpoint Testing
   - Smoke Testing

3. Resilience & Debugging
   - Automatic HTTP request/response Snapshotting on Failure
   - Replay Debugging with interactive logging
   - "Did you mean?" schema validation UX
   - Fallback error behaviors (continue, stop_iteration, stop_vu, abort_test)

4. Observability & Reporting
   - Interactive HTML Summary Reports (Chart.js timeseries)
   - Native K6 metrics (p90, p95, avg, max)
   - Transaction metrics (Pass/Fail counts, Time to complete)
   - Host monitoring (CPU/Memory)

5. Developer Experience
   - Editor-agnostic JSON Schema validation ($schema)
   - JSONC configuration (allows comments in .jsonc config files)
   - BYOS (Bring Your Own Script) scaffolding
   - Built-in Template Library (run 'templates list')
`);
}
