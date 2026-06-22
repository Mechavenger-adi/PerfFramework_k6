# Execution Flow

> How code runs, from CLI invocation to k6 process and artifacts.

## Normal Load Run (`npm run cli -- run --plan <path>`)

```
1. CLI parses args (Commander)
2. TestPlanLoader.load(planPath) → validates JSON Schema → TestPlan
3. ConfigurationManager.resolve() → merges 6 config layers → ResolvedConfig
4. GatekeeperValidator.validate() → pre-flight checks (scripts, weights, data, journey_slas keys)
4b. ScriptContractGuard → reject journey scripts using native k6 check()/group()
5. Check plan.debug.enabled:
   - true  → runPlanDebugMode() (see Debug Flow below)
   - false → continue
6. RuntimeConfigManager wraps resolved config for typed access
7. prepareRunArtifacts() → creates results/<PlanName>/Run_<timestamp>/
8. buildScenarioRuntimeMetadata() → thinkTime, errorBehavior, pacing config
9. ParallelExecutionManager.resolve(plan, metadata, resolvedConfig.environment):
   a. JourneyAllocator.allocate() → weight-based VU distribution
   b. ScenarioBuilder.build() → k6 scenarios with injected env vars:
      - K6_PERF_RUN_ID, K6_PERF_PLAN_NAME, K6_PERF_ENVIRONMENT
      - K6_PERF_RUNTIME_METADATA (JSON), K6_PERF_SCENARIO_METADATA (JSON)
      - K6_PERF_PHASES (JSON) — lifecycle phase envelope
      - K6_PERF_BASE_URL / K6_PERF_SERVICE_URLS / K6_PERF_ENV_CUSTOM per journey
      - team-specific environment overrides resolved from testSuites/<team>/... when configured
   c. ThresholdManager.apply() → dynamic SLA thresholds (global + journey + transaction)
   d. buildSummaryTrendStats() → custom percentiles for k6
10. writeRunManifest() → run-manifest.json
11. HostMonitor.startPeriodicSampling() (if monitoring.enabled)
11b. FileWriteSink subscribes to LiveConsoleLogStream → persists writeData() output under run dir
12. PipelineRunner.executeAsync() → spawns k6 with options JSON + env vars
13. k6 executes scripts, VU lifecycle runs via lifecycle.ts
14. HostMonitor.stop() → collects final snapshots
15. finalizeRunArtifacts():
    a. TransactionMetricsBuilder → transaction-metrics.json
    b. EventArtifactBuilder → errors.ndjson + warnings.ndjson
    c. RunSummaryBuilder → ci-summary.json
    d. TimeseriesArtifactBuilder → timeseries.json
    e. RunReportGenerator → RunReport.html
16. printTransactionTable() → console output
```

## Debug Replay Flow (`plan.debug.enabled = true`)

```
For each journey in plan.user_journeys:
  1. RecordingLogResolver.resolve() → find recording log
     (explicit → .recording-index.json → expected path → fuzzy match)
  2. ReplayRunner.runDebug():
     a. Forces VUs=1, iterations=plan.debug.iterations
     b. PipelineRunner.execute() → sync k6, captureOutput=true
        - Injects K6_PERF_DEBUG=true so logExchange() emits logs
     c. extractReplayEntries() → parses [k6-perf][replay-log] JSON from output
     d. extractK6Errors() → parses k6 stderr for error patterns
     e. extractK6Metrics() → parses k6 stdout for performance tables
     f. DiffChecker.compareTaggedLogs() → recording vs replay comparison
     g. HTMLDiffReporter.generateReport() → interactive HTML report
```

## HAR Generation Flow (`npm run cli -- generate`)

```
1. HARParser.readEntries() → raw HAR entries
2. DomainFilter.summarize() → domain stats
3. User selects domains (interactive prompt)
4. HARParser.parse() → 4-step refinement:
   sort → domain filter → static removal → header strip
5. TransactionGrouper.group() → groups by pageref
6. LifecyclePrompt → user assigns groups to init/action/end phases
7. ScriptGenerator.generate() → k6 script with lifecycle phases
8. ExchangeLogBuilder.fromGroups() → recording-log.json
9. RecordingLogResolver.upsertRegistryEntry() → update .recording-index.json
```

## Auto-Correlation Flow (`npm run cli -- correlate --script <path>`)

```
1. RecordingLogResolver.resolve() → find the recording (or use --har/--log)
   - Reads UNSTRIPPED entries (HARParser.readEntries / raw recording-log) so
     cookie/authorization consumer evidence survives.
2. CorrelationScanner.scan(exchanges):
   a. ValueIndexer → producer (response) + consumer (request) occurrences
   b. LinkMatcher → link each consumer to its nearest-preceding producer
   c. CandidateScorer → high/medium/low; drop noise; flag handledByJar; p_ vs c_
   d. ExtractorSynthesizer → jsonpath/header/cookie/boundary capture per candidate
   → CorrelationPlan (manifest, reviewable JSON)
3. --list / --dry-run → print candidate table + write manifest (script untouched)
   --apply high|medium|all → ScriptCorrelationWriter rewrites the generated script:
     - emits extract*()+trackCorrelation() right after the producing request
     - hoists c_* var to module scope, substitutes matched literal → `${c_*}`
4. At run time, extract.ts helpers pull values; a miss degrades to {NOTFOUND:name}.
```

## k6-Side VU Lifecycle (inside k6 runtime)

```
Script loads:
  1. createJourneyLifecycleStore() → per-script state
  2. registerFrameworkEnvironmentUrls() → cookie jar URL registry using runtime env URLs or recorded fallbacks
  
Default function called per VU iteration:
  3. runJourneyLifecycle(store, { initPhase, actionPhase, endPhase }):
     a. First call → initPhase(ctx) once
        - clearCookies() → clean session
        - Login, data setup, etc.
     b. Every call → actionPhase(ctx)
        - resolveFrameworkUrl() → relative request paths mapped to current env/team base URL
        - startTransaction()/endTransaction() around groups
        - logExchange() per request (gated by K6_PERF_DEBUG)
        - sleep(getFrameworkThinkTime()) between groups
     c. End detection — PROACTIVE, onboard-ranked (V1/getEndSignal deleted 2026-06-10):
        - On a VU's first iteration, computeEndPlan derives rank =
          round(interpolateTarget(curve, now − scenario.startTime)), which recovers
          k6's actual cull order (handle index) on stock k6.
        - terminalDeadlineMs(curve, rank) = the VU's cull instant; the VU plans to
          log out LIFECYCLE_END_SAFETY_MS (5s) before it.
        - The transaction gate (getTransactionGate, phase-scoped to action) skips
          remaining action transactions mid-iteration so endPhase runs promptly;
          thinktime() also early-returns once ending. isEnding() stays for long loops.
     d. When ending → endPhase(ctx) once
        - Logout, cleanup, etc.
     e. Error behavior enforcement (handlePhaseError):
        - continue → log, proceed
        - stop_iteration → skip remaining phases
        - stop_vu → state.terminated = true, VU sleeps
        - abort_test → re-throw, k6 terminates
```

## Config Resolution Chain

```
Layer 1: FRAMEWORK_DEFAULTS (ConfigContracts.ts)
Layer 2: config/environments/{plan.environment}.json
Layer 3: config/runtime_settings/default.json (or --runtime flag)
Layer 4: Suite-level overrides (future)
Layer 5: CLI flags (--debug, --out, etc.)
Layer 6: .env secrets (dotenv)
```
