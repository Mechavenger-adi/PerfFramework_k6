# Current Framework Flow

Date: 2026-03-30

This document describes how the current `K6-PerfFramework` works today, based on the present implementation.

## 1. End-to-End Framework Flow

```mermaid
flowchart TD
    U[User] --> CLI[CLI Commands]

    CLI --> INIT[init]
    CLI --> GEN[generate]
    CLI --> VAL[validate]
    CLI --> RUN[run]
    CLI --> DBG[debug utilities]

    INIT --> INIT_SCAFFOLD[Scaffold config, scrum-suites, sample files]

    GEN --> HAR_READ[HARParser.readEntries]
    HAR_READ --> DOMAIN_SUMMARY[DomainFilter.summarize]
    DOMAIN_SUMMARY --> DOMAIN_PROMPTS[Prompt for domains and static asset inclusion]
    DOMAIN_PROMPTS --> HAR_PARSE[HARParser.parse]
    HAR_PARSE --> TXN_GROUP[TransactionGrouper.group]
    TXN_GROUP --> SCRIPT_GEN[ScriptGenerator.generate]
    TXN_GROUP --> REC_LOG[ExchangeLogBuilder.fromGroups]
    SCRIPT_GEN --> SCRIPT_OUT[Generated k6 script]
    REC_LOG --> REC_LOG_OUT[recording-log.json]

    VAL --> PLAN_LOAD[TestPlanLoader]
    PLAN_LOAD --> CONFIG_RESOLVE[ConfigurationManager]
    CONFIG_RESOLVE --> GATEKEEPER[GatekeeperValidator]
    GATEKEEPER --> VAL_RESULT[Validation result]

    RUN --> RUN_PLAN[TestPlanLoader]
    RUN_PLAN --> RUN_CONFIG[ConfigurationManager]
    RUN_CONFIG --> RUN_GATE[GatekeeperValidator]
    RUN_GATE --> PAR_EXEC[ParallelExecutionManager.resolve]
    PAR_EXEC --> SCENARIO_BUILD[ScenarioBuilder]
    PAR_EXEC --> JOURNEY_ALLOC[JourneyAllocator]
    PAR_EXEC --> THRESHOLDS[ThresholdManager]
    THRESHOLDS --> K6_OPTIONS[k6 options]
    K6_OPTIONS --> TEMP_ENTRY[Temporary entry script]
    TEMP_ENTRY --> PIPELINE[PipelineRunner]
    PIPELINE --> K6_RUN[k6 execution]
    K6_RUN --> REPORTS[summary.json, HTML reports, optional outputs]

    DBG --> REPLAY_RUN[ReplayRunner]
    DBG --> DIFF[DiffChecker]
    DBG --> HTML_DIFF[HTMLDiffReporter]
```

## 2. Configuration and Validation Flow

```mermaid
flowchart TD
    A[Test Plan JSON]
    B[Environment JSON]
    C[Runtime Settings JSON]
    D[.env]
    E[CLI overrides]

    A --> TPL[TestPlanLoader]
    B --> CM[ConfigurationManager]
    C --> CM
    D --> CM
    E --> CM

    CM --> RC[ResolvedConfig]
    RC --> GK[GatekeeperValidator]
    TPL --> GK

    GK --> GK1[Environment checks]
    GK --> GK2[Test plan checks]
    GK --> GK3[Script path resolution]
    GK --> GK4[Weight and VU checks]
    GK --> GK5[Data root checks]
    GK --> GK6[Hybrid mode checks]

    GK6 --> RESULT[Pass / Fail preflight result]
```

## 3. HAR Generation Flow

```mermaid
flowchart TD
    HAR[HAR file] --> READ[HARParser.readEntries]
    READ --> SUM[DomainFilter.summarize]
    SUM --> PROMPTS[Prompt user for domains and static assets]
    PROMPTS --> PARSE[HARParser.parse]

    PARSE --> SORT[Sort by startedDateTime]
    PARSE --> DOM_FILTER[Filter selected domains]
    PARSE --> STATIC_FILTER[Optionally remove static assets]
    PARSE --> STRIP[Strip unstable headers]

    STRIP --> GROUP[TransactionGrouper.group]
    GROUP --> GEN_SCRIPT[ScriptGenerator.generate]
    GROUP --> GEN_REC_LOG[ExchangeLogBuilder.fromGroups]

    GEN_SCRIPT --> SCRIPT_FILE[scrum-suites/team/tests/generated-script.js]
    GEN_REC_LOG --> REC_FILE[scrum-suites/team/recordings/generated-script.recording-log.json]
```

## 4. Run Command Flow

```mermaid
flowchart TD
    RUNCMD[run --plan] --> LOAD[TestPlanLoader]
    LOAD --> RESOLVE[ConfigurationManager]
    RESOLVE --> PREFLIGHT[GatekeeperValidator]
    PREFLIGHT --> EXEC[ParallelExecutionManager.resolve]

    EXEC --> ALLOC[JourneyAllocator.allocate]
    EXEC --> BUILD[ScenarioBuilder.build]
    EXEC --> THR[ThresholdManager.apply]

    BUILD --> OPTIONS[k6 options]
    THR --> OPTIONS

    OPTIONS --> ENTRY[Temporary entry.js generation]
    ENTRY --> PR[PipelineRunner.run]
    PR --> K6[k6 execution]
    K6 --> OUT[Reports and outputs]
```

## 5. Generated Script Runtime Flow

```mermaid
flowchart TD
    SCRIPT[Generated journey script] --> INITCTX[Init context]
    INITCTX --> INITTXN[initTransactions([...])]

    INITTXN --> DEFAULT[export default function]
    DEFAULT --> GROUP[group(transaction)]
    GROUP --> START[startTransaction(name)]
    START --> META[Create replay metadata object]
    META --> LOG[console.log replay metadata]
    LOG --> HTTP[http request with k6 tags]
    HTTP --> CHECK[check(response)]
    CHECK --> END[endTransaction(name)]
    END --> SLEEP[sleep between groups]
```

## 6. Data Layer Flow

```mermaid
flowchart TD
    DATA[CSV / JSON data] --> FACTORY[DataFactory]
    FACTORY --> VALIDATOR[DataValidator]
    VALIDATOR --> POOL[DataPoolManager]

    POOL --> VU[Assign row by VU]
    POOL --> ITER[Assign row by iteration]
    POOL --> OVERFLOW[Overflow handling]

    OVERFLOW --> TERM[terminate]
    OVERFLOW --> CYCLE[cycle]
    OVERFLOW --> LAST[continue_with_last]
```

## 7. Assertion and SLA Flow

```mermaid
flowchart TD
    GSLA[Test plan global_sla]
    RSLA[SLARegistry per journey / transaction]

    GSLA --> TM[ThresholdManager]
    RSLA --> TM

    TM --> K6TH[k6 thresholds]
    K6TH --> K6RUN[k6 execution]
    K6RUN --> JAR[JourneyAssertionResolver]
    JAR --> SLAREP[SLA pass / fail report]
```

## 8. Diff and Debug Flow Today

```mermaid
flowchart TD
    RECLOG[recording-log.json]
    REPLAYLOG[replay log or replay-like normalized data]

    RECLOG --> DCHK[DiffChecker.compareTaggedLogs]
    REPLAYLOG --> DCHK

    DCHK --> MATCH1[Match by harEntryId]
    DCHK --> MATCH2[Fallback to method + URL]
    DCHK --> STATES[matched / missing_in_replay / extra_in_replay]

    STATES --> RESULTS[DiffResult[]]
    RESULTS --> HTML[HTMLDiffReporter.generateReport]
    HTML --> REPORT[HTML diff report]
```

## 9. Recording vs Replay Matching Logic

```mermaid
flowchart TD
    REC[Recorded entry] --> IDCHK{harEntryId match?}
    IDCHK -- yes --> MATCHED[Matched]
    IDCHK -- no --> FALLBACK{Method + URL match?}
    FALLBACK -- yes --> MATCHED
    FALLBACK -- no --> MISS[Missing In Replay]

    REPLAY[Replay entry] --> USED{Matched already?}
    USED -- yes --> IGNORE[Ignore as already matched]
    USED -- no --> EXTRA[Extra In Replay]
```

## 10. Current Known Gaps

```mermaid
flowchart TD
    GAP[Current Gaps] --> G1[run-debug not fully end-to-end]
    GAP --> G2[Replay log capture is not yet fully automated from real k6 execution]
    GAP --> G3[PipelineRunner alias/runtime issues still affect some command paths]
    GAP --> G4[HAR generator still lacks think-time prompt]
    GAP --> G5[Generator does not yet produce init/action/teardown structure]
```

## 11. Practical Summary

- `init` scaffolds the framework structure.
- `generate` turns HAR into:
  - a generated k6 script
  - a normalized recording log JSON
- `validate` performs preflight checks manually.
- `run` performs validation automatically before executing k6.
- generated scripts use:
  - `initTransactions`
  - `startTransaction`
  - `endTransaction`
  - replay tags and replay logs
- diff reporting currently works well when supplied with normalized recording and replay data.
- the remaining gap is a fully automated real replay-log capture pipeline from `run-debug` / debug execution.

