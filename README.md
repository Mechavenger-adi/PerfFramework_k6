Performance Engineering Framework
This framework is a performance testing solution for k6 based on the 12-Factor App principles. It provides a structured approach to define, organize, and execute performance tests with advanced features like journey-based execution, variable-driven environments, data-driven testing, and real-time execution insights.

Core Features
User Journey Execution
Journeys are composed of distinct user actions, each with:

Step-based recording/replay execution
Built-in cookie management
Action-level response validation
Smart transaction tagging (with error classification)
Transaction Instrumentation
Automatic instrumentation of k6 transactions for k6-to-LoadRunner correlation
Session-aware metric collectors
Error tracking for transaction failure analysis
Test Management
TestPlan and UserJourney schemas for organizing tests
Execution Modes
Parallel — all journeys run concurrently
Sequential — journeys run one after another with controlled timing
Hybrid — custom groups of journeys with mixed execution modes
Scenario Organization
Dynamic scenario generation based on test plan
Automatic mapping of journeys to k6 exec functions
Support for complex execution patterns
Test Infrastructure
Variable-driven environments with per-environment configs
Environment-specific session management
Flexible test data management
Execution Flow
1. Test Plan Definition
A test plan defines:

Overall execution configuration (mode, duration, stages, etc.)
List of user journeys
Load profiles for each journey
Environment variables and base URLs
Example:

// testplan.ts
export const demoTestPlan: TestPlan = {
  description: 'E-commerce demo test plan',
  execution_mode: 'parallel',
  global_load_profile: {
    stages: [
      { target: 100, duration: '5m' },
      { target: 200, duration: '10m' },
    ],
  },
  user_journeys: [
    {
      name: 'plp_to_pdp',
      execution_profile: 'random',
      load_profile: {
        stages: [
          { target: 50, duration: '5m' },
          { target: 100, duration: '5m' },
        ],
      },
      actions: [...],
    },
  ],
  environments: {
    dev: {
      base_url: 'https://dev.example.com',
      vars: {},
    },
    qa: {
      base_url: 'https://qa.example.com',
      vars: {},
    },
  },
};
2. Scenario Compilation
ScenarioBuilder compiles the test plan into k6 scenarios:

Scenarios are generated based on execution mode (parallel, sequential, hybrid)
Each journey becomes an exec function with unique name
Load profiles are mapped to appropriate k6 executors (ramping-vus, constant-vus, etc.)
StartTime offsets are calculated for sequential/hybrid modes
3. Session Initialization
clearCookies() clears browser cookies before each VU run
registerBaseUrl() registers environment-specific base URLs
Session context manages state per VU and per iteration
4. VU Execution
runJourneyLifecycle() executes a journey within a VU: Runs all user actions in order Collects request/response data Tracks session state (cookies, correlation tokens) Applies error behavior rules
5. Runtime Monitoring
check()
Performs step-level response validation
Critical for catching soft failures
sleep() Adds realistic delays between steps
logExchange()
Records request/response data for analysis
Tracks correlation variables
Applies data-driven transforms
trackDataRow()
Links data rows to specific journeys
Supports row-based data mapping
trackCorrelation()
Extracts correlation IDs from responses
Maps correlation values to data table columns
Error Behavior
Runtime error behaviors:

try_continue — non-critical errors are logged but VU continues
try_until_stop — continue until a hard error is encountered
stop — stop the entire scenario on any error
Application-level error handling within journeys
Error classification for transactions
File Management
CSV parsing for test data management
CSV file management utilities
JSON file management utilities
File-based data transformation with:

find_replace
extract_between
string_manipulation
File management for environment data
Environment Configuration
Supports multiple environments with:

Environment-specific base URLs
Environment-specific variables
File-based variable management
Environment-aware data transformations
Performance Optimization
Load Profile Support
Support for both stages and standalone duration
Automatic executor selection based on profile type:

stages → ramping-vus or constant-vus (duration-based)
standalone duration → constant-arrival-rate or constant-vus
Variable-Driven Design
Environment variables drive:

Base URLs
API endpoints
Test data paths
Data transformation rules
Dynamic Data Management
Row-level test data isolation per journey
Shared data tables with row-based selection
Environment-aware CSV and JSON operations
Smart Metrics & Data Collection
Transaction-specific metrics
Request/response logging with correlation tracking
Data-driven response validation
Application-specific response extraction
Data-driven test data transformations
Execution Management
Run parallel, sequential, or hybrid execution plans
Automatic scenario generation for each execution mode
StartTime offsets for sequential execution
Hybrid grouping of parallel and sequential journeys
Error Behavior Control
Per-transaction error handling
Runtime error behavior settings
Error classification and logging
Test Termination Controls
Execution Modes
Parallel — All journeys run at the same time
Sequential — Journeys run one after another with computed start times
Hybrid — Group parallel and sequential journeys together
Error Behavior Policies
Continue — Keep going even after errors
Stop — Halt the scenario on first error
Try_continue — Stop on critical errors only
Try_until_stop — Continue until hard failure
Execution Workflow
TestPlanDefinition
-> ScenarioCompilation
-> EnvironmentConfiguration
-> VUExecution
-> RuntimeMonitoring
-> DataManagement
Key Components
test-plan.ts
Defines overall test plan and execution configuration.

user-journey.ts
Defines individual user actions and their properties.

scenario-compiler.ts
Compiles test plans into k6 scenarios for different execution modes.

scenario-builder.ts
Builds k6 scenarios from test plans with execution mode support.

lifecycle.ts
Manages VU lifecycle and journey execution control.

transaction.ts
Manages transaction start/end tracking for LoadRunner correlation.

session.ts
Manages session state and cookie handling.

replayLogger.ts
Logs request/response exchanges and correlation data.

fileManager.ts
Handles CSV and JSON file operations for test data.

gate.ts
Manages execution gates for scenarios.

validation.ts
Performs request response validation.

dataRow.ts
Manages row-level test data and transformations.

dataTable.ts
Manages shared data tables and lookup operations.

correlate.ts
Handles correlation variable extraction and management.

env.ts
Manages environment-specific configurations.

performanceMetrics.ts
Collects performance metrics from requests.

baseMetrics.ts
Collects base metrics from requests.

usageMetrics.ts
Collects usage metrics from requests.

correlation Metrics.ts
Collects correlation metrics from requests.

errorMetrics.ts
Collects error metrics from responses.

sessionMetrics.ts
Collects session-related metrics.