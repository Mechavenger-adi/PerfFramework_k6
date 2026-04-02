## Current Framework Flow

Date: 2026-03-30

## Overall Flow

User
  |
  v
CLI / Scripts
  |
  +--> init
  |      |
  |      v
  |   Scaffold project structure
  |   config/ + scrum-suites/ + sample files
  |
  +--> generate
  |      |
  |      v
  |   Read HAR
  |      |
  |      +--> discover domains
  |      +--> ask user which domains to include
  |      +--> ask whether to include static assets
  |      |
  |      v
  |   HARParser
  |      |
  |      +--> sort requests
  |      +--> filter domains
  |      +--> optionally remove static assets
  |      +--> strip unstable headers
  |      |
  |      v
  |   TransactionGrouper
  |      |
  |      v
  |   ScriptGenerator
  |      |
  |      +--> generated k6 script
  |      +--> replay tags/log metadata in script
  |      +--> framework transaction helpers
  |      |
  |      v
  |   ExchangeLogBuilder
  |      |
  |      v
  |   recording-log.json
  |
  +--> validate
  |      |
  |      v
  |   TestPlanLoader
  |      |
  |      v
  |   ConfigurationManager
  |      |
  |      v
  |   GatekeeperValidator
  |      |
  |      v
  |   pass/fail preflight result
  |
  +--> run
         |
         v
      TestPlanLoader
         |
         v
      ConfigurationManager
         |
         v
      GatekeeperValidator
         |
         v
      ParallelExecutionManager
         |
         +--> ScenarioBuilder
         +--> JourneyAllocator
         +--> ThresholdManager
         |
         v
      temp k6 entry script
         |
         v
      PipelineRunner
         |
         v
      k6 execution
         |
         +--> summary.json
         +--> TestSummary.html
         +--> TestDetails.html
         +--> optional other outputs

## Config and Validation Flow

Test Plan JSON
Environment JSON
Runtime Settings JSON
.env
CLI overrides
   |
   v
ConfigurationManager
   |
   +--> framework defaults
   +--> environment config
   +--> runtime settings
   +--> CLI overrides
   +--> .env secrets
   |
   v
ResolvedConfig
   |
   v
GatekeeperValidator
   |
   +--> environment checks
   +--> test plan checks
   +--> script path resolution
   +--> VU / weight checks
   +--> data-root checks
   +--> hybrid config checks
   |
   v
Validation result

## HAR Generation Flow

HAR file
  |
  v
HARParser.readEntries()
  |
  v
DomainFilter.summarize()
  |
  v
User selects domains + static asset inclusion
  |
  v
HARParser.parse()
  |
  +--> sort by startedDateTime
  +--> domain filtering
  +--> static filtering
  +--> strip unstable headers
  |
  v
TransactionGrouper.group()
  |
  v
ScriptGenerator.generate()
  |
  +--> generated script in scrum-suites/<team>/tests/
  +--> uses initTransactions/startTransaction/endTransaction
  +--> adds replay tags
  +--> adds replay logs
  |
  v
ExchangeLogBuilder.fromGroups()
  |
  v
recording-log.json in scrum-suites/<team>/recordings/

## Run Flow

run --plan <plan>
  |
  v
TestPlanLoader
  |
  v
ConfigurationManager
  |
  v
GatekeeperValidator
  |
  v
ParallelExecutionManager.resolve()
  |
  +--> JourneyAllocator.allocate()
  +--> ScenarioBuilder.build()
  +--> ThresholdManager.apply()
  |
  v
k6 options
  |
  v
CLI builds temporary entry.js
  |
  +--> re-exports each journey default as scenario exec function
  +--> injects handleSummary()
  |
  v
PipelineRunner.run()
  |
  v
k6 run

## Generated Script Runtime Flow

Generated journey script
  |
  v
init context
  |
  +--> initTransactions([...])
  |
  v
default function
  |
  +--> group(transaction)
         |
         +--> startTransaction(name)
         +--> build replayMeta object
         +--> console log replay metadata
         +--> http request with k6 tags
         +--> check(response)
         +--> endTransaction(name)
  |
  v
sleep between groups

## Diff / Debug Flow Today

recording-log.json
replay log / replay-like data
   |
   v
DiffChecker.compareTaggedLogs()
   |
   +--> match by harEntryId first
   +--> fallback to method + url
   +--> mark:
   |      - matched
   |      - missing_in_replay
   |      - extra_in_replay
   |
   v
DiffResult[]
   |
   v
HTMLDiffReporter.generateReport()
   |
   +--> group by transaction
   +--> score each step
   +--> side-by-side request/response view
   +--> full request body side-by-side
   +--> full response body side-by-side
   |
   v
HTML diff report

## Data Layer Flow

CSV / JSON files
   |
   v
DataFactory
   |
   +--> loadCSV()
   +--> loadJSON()
   |
   v
DataValidator
   |
   +--> missing columns
   +--> blank values
   +--> min row checks
   |
   v
DataPoolManager
   |
   +--> register pool
   +--> assign row by VU
   +--> assign row by iteration
   +--> overflow handling:
          - terminate
          - cycle
          - continue_with_last

## Assertions / SLA Flow

Test Plan global_slaSLARegistry per journey / transaction
   |
   v
ThresholdManager
   |
   +--> build k6 thresholds
   +--> http_req_duration
   +--> http_req_failed
   +--> txn_* metrics
   |
   v
k6 thresholds in execution
   |
   v
JourneyAssertionResolver
   |
   v
human-readable SLA pass/fail report


## Current Important Gaps

run-debug full end-to-end flow
  |
  +--> not fully wired yet
  +--> replay execution exists
  +--> diff/report generation exists
  +--> automatic replay-log capture + compare + report in one command is not fully complete