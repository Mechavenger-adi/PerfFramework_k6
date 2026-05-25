# Orchestration Map

> How CLI commands wire through the engine layers to k6 execution.

## Command → Layer Flow

### `run --plan <path>`
```
CLI/run.ts
  → TestPlanLoader (Scenario)
  → ConfigurationManager (Config)
  → GatekeeperValidator (Config)
  → RuntimeConfigManager (Config)
  → ParallelExecutionManager (Execution)
    → JourneyAllocator (Execution)
    → ScenarioBuilder (Scenario)
    → ThresholdManager (Assertions)
  → HostMonitor.start (Execution)
  → PipelineRunner.executeAsync (Execution)
    → k6 process (external)
  → HostMonitor.stop (Execution)
  → TransactionMetricsBuilder (Reporting)
  → EventArtifactBuilder (Reporting)
  → RunSummaryBuilder (Reporting)
  → TimeseriesArtifactBuilder (Reporting)
  → RunReportGenerator (Reporting)
```

### `run --plan <path>` with `debug.enabled: true`
```
CLI/run.ts
  → TestPlanLoader (Scenario)
  → ConfigurationManager (Config)
  → GatekeeperValidator (Config)
  → For each journey:
    → RecordingLogResolver (Debug)
    → ReplayRunner.runDebug (Debug)
      → PipelineRunner.execute [sync] (Execution)
        → k6 process with K6_PERF_DEBUG=true
      → extractReplayEntries (Debug)
      → extractK6Errors (Debug)
      → extractK6Metrics (Debug)
      → DiffChecker.compareTaggedLogs (Debug)
      → HTMLDiffReporter.generateReport (Debug)
```

### `generate <team> <name> --har <path>`
```
CLI/generate.ts
  → HARParser.readEntries (Recording)
  → DomainFilter.summarize (Recording)
  → [interactive prompt]
  → HARParser.parse (Recording)
  → TransactionGrouper.group (Recording)
  → LifecyclePrompt [interactive] (CLI)
  → ScriptGenerator.generate (Recording)
  → ExchangeLogBuilder.fromGroups (Debug)
  → RecordingLogResolver.upsertRegistryEntry (Debug)
```

### `convert <input> <team> <name>`
```
CLI/convert.ts
  → ScriptConverter.convertFile (Recording)
  → LifecyclePrompt [interactive] (CLI)
  → ScriptConverter.applyPhaseContract (Recording)
  → Write output file
```

### `validate --plan <path>`
```
CLI/validate.ts
  → TestPlanLoader (Scenario)
  → ConfigurationManager (Config)
  → GatekeeperValidator (Config)
    → DataValidator (Data) [for data dir checks]
    → RecordingLogResolver (Debug) [for recording log checks]
```

### `init`
```
CLI/init.ts
  → Create directory structure
  → Write sample configs with $schema
  → Write sample journey scripts
  → Write sample test plans
```

### `debug --script <path>`
```
CLI/run.ts (debug command)
  → RecordingLogResolver (Debug)
  → ReplayRunner.runDebug (Debug)
    → [same as debug flow above]
```
