# k6 Performance Testing Framework: Requirements & Design

## 1. Project Goal

To design and build a reusable, maintainable, and portable performance testing framework using k6. The framework aims to be easy to adopt across different projects with minimal rework, abstracting away complexities and promoting a convention-over-configuration approach.

## 2. Core Principles

- **Configuration-Driven:** Behavior should be controlled through configuration files rather than hard-coded in scripts.
- **Convention-Based:** Follow sensible defaults and established patterns to reduce boilerplate.
- **Minimize Custom Scripting:** Enable rapid test creation through automated generation and reusable modules.
- **CI/CD Ready:** Ensure seamless integration into automated pipelines.
- **Portable:** Package the framework for easy distribution and setup in new projects.

## 3. Key Features & Requirements

### 3.1. Test Authoring & Scripting

#### 3.1.1. HAR-based Script Generation
- **Requirement:** Generate k6 scripts automatically from HAR files.
- **Implementation:**
    - The generator will be an interactive CLI tool.
    - It will parse a HAR file (e.g., from k6 Studio or browser DevTools).
    - **URL Filtering:** The tool will prompt the user to select the target domain(s) to include in the script, automatically filtering out third-party requests.
    - **Transaction Grouping:** Requests will be grouped into transactions based on the `pageref` attribute in the HAR file's `entries`. These correspond to the groups/pages defined during recording (e.g., in k6 Studio).
    - **Think Time:** The generator will prompt the user for a default think time (e.g., 5 seconds) to be inserted between transactions.
    - **Structure:** Generated scripts will follow a `init`, `action`, `teardown` structure similar to LoadRunner.

#### 3.1.2. Parameterization
- **Requirement:** Provide robust and flexible data parameterization utilities.
- **Implementation:**
    - **Data Sources:** Support for CSV, JSON, and inline data arrays.
    - **Variable Naming:** All parameterized variables will be prefixed with `p_` (e.g., `p_username`).
    - **Unique Data Handling:** When using unique data from a file, the user can configure the behavior when the number of VUs exceeds the available data:
        1.  `terminate`: Abort the test immediately.
        2.  `cycle`: Start over from the beginning of the data file.
        3.  `continue_with_last`: Reuse the last data value for all subsequent iterations.
    - **Pre-run Validation:** Before the test starts, the framework will perform checks on data files for issues like blank rows or missing values.
    - **Built-in Functions:** Provide helper functions for common dynamic data needs, such as a `timestamp()` function that accepts a custom format string.

#### 3.1.3. Correlation
- **Requirement:** Automate the process of extracting dynamic values from responses and using them in subsequent requests.
- **Implementation:**
    - **Variable Naming:** All correlated variables will be prefixed with `c_` (e.g., `c_sessionToken`).
    - **Rule-Based Correlation:** A configuration file will define correlation rules. Each rule will specify:
        - The `regex` or `jsonpath` to find the value.
        - The `scope` to search within (e.g., response body, headers).
    - **Auto-Correlation (AI-Assisted):** An optional, toggleable feature that uses an AI backend (OpenAI/Azure OpenAI) to automatically identify potential values for correlation.
    - **Failover Plan:** When correlation fails, the framework will follow a configured fallback plan:
        1.  Use a hardcoded default value.
        2.  Gracefully skip the dependent request and log a warning.

#### 3.1.4. Reusable Modules
- **Header & Cookie Managers:** Provide utilities to manage headers and cookies consistently across requests and scripts, reducing boilerplate.
- **Automatic Status Code Validation:** By default, all generated scripts will automatically include checks to validate that response status codes are in the 2xx range.

### 3.2. Test Execution & Orchestration

#### 3.2.1. Test Runner & Scenarios
- **Requirement:** Simplify the execution of multiple user journeys in parallel.
- **Implementation:**
    - **Test Plan:** A central configuration file will define the overall test plan.
    - **User Journeys:** Instead of complex `scenarios` in the k6 script, the user will define a list of `user_journeys` (scripts) in the test plan.
    - **Parallel Execution:** The framework runner will dynamically construct the k6 `scenarios` object to run all specified journeys in parallel, ensuring concurrency.
    - **Global Load Profile:** Users can define a single load profile (ramp-up, steady-state duration, ramp-down, or iterations) that applies to all user journeys.
    - **Per-Journey Overrides:** The option to override the global load profile for specific journeys will still be available for complex scenarios.

#### 3.2.2. Runtime Settings
- **Requirement:** Allow users to easily configure test behavior via a central file.
- **Implementation:** A `runtime-settings.json` file will provide toggleable options for:
    - **Think Time:** Configure globally (fixed or random range).
    - **Pacing:** Control the time between iterations.
    - **Iteration Logic:** Start the next iteration upon completion of the last, or after a fixed delay.
    - **Timeouts:** Set global HTTP request timeouts.
    - **Error Behavior:** Define test behavior on error (`continue`, `stop_iteration`, `stop_test`).
    - **k6 Options:** Expose common k6 settings like `maxRedirects`.

### 3.3. Debugging & Analysis

#### 3.3.1. Record & Replay Logging
- **Requirement:** Link script execution back to the original recording for easy debugging.
- **Implementation:**
    - During script generation from HAR, each request will be annotated with a unique identifier linking it to the corresponding HAR entry (e.g., `har_entry: "log_R01"`).
    - This ID will be propagated into the k6 logs and results, enabling quick cross-reference.

#### 3.3.2. Debugging Utility (Diff Checker)
- **Requirement:** An optional tool to compare a test run against the original HAR recording.
- **Implementation:**
    - A toggleable feature that, when enabled, runs the script for a single iteration.
    - It compares the request and response of each step against the corresponding entry in the HAR file.
    - **Output:** Generates a detailed HTML report that:
        - Groups requests by transaction.
        - Highlights differences with a percentage score.
        - Provides a side-by-side, expandable view of the recorded vs. replayed request/response headers and bodies.

### 3.4. Reporting & Trend Analysis

#### 3.4.1. Custom Reporting Hooks
- **Requirement:** Allow test results to be pushed to a custom database for analysis in tools like Power BI.
- **Implementation:**
    - The framework will include a hook for a post-test data processing script.
    - A provided Node.js script (`upload-results.js`) will be responsible for transforming the k6 output and uploading it to a specified database endpoint.
    - This uploader will be enabled or disabled via a toggle in the main configuration file.

### 3.5. Advanced Features (Optional)

#### 3.5.1. AI/MCP Integration Layer
- **Requirement:** An optional, toggleable layer for AI-assisted capabilities.
- **Implementation:**
    - A global flag will enable/disable all AI features.
    - **Backend Support:** Can be configured to point to OpenAI, Azure OpenAI, or a custom MCP server.
    - **Initial Use Case:** Auto-correlation of dynamic variables.
    - **Fallback:** When disabled, the framework relies on the rule-based correlation engine.
    - **Future Scope:** The architecture will allow for adding new AI capabilities like anomaly detection in results.

### 3.6. Framework Architecture & Packaging

- **Packaging:** The core framework will be packaged as an npm package for easy installation and version management.
- **Portability:** A simple CLI command (`k6-framework init`) will scaffold a new project, separating the core framework logic (in `node_modules`) from project-specific configuration (e.g., `config/`, `scripts/`, `data/`).
- **CI/CD Integration:** The framework will be executed via standard CLI commands (`npm test`), making it trivial to integrate into any CI/CD pipeline (GitHub Actions, GitLab CI, etc.).
