# Presentation Outline: K6 Performance Framework

## Slide 1: Welcome & Intro
*   **Title:** Beyond Basic Testing: The Enterprise K6 Performance Framework
*   **Talking Points:** 
    *   What is K6? (Open-source, developer-friendly load testing tool)
    *   Why a framework? Native k6 lacks built-in reporting, complex scenario structures, and data handling out-of-the-box. We built this to scale our testing seamlessly.
    *   **Goal of Session:** Learn where your scripts go, how to run them, and how to read the results.

## Slide 2: The Core Concepts (The Restaurant Analogy)
*   **Visual Idea:** A diagram of a restaurant pipeline.
*   **Talking Points:** 
    *   **Test Plan (JSON):** The Manager's shift schedule.
    *   **Core Engine (TypeScript):** The Expediter. It loads configs, sets SLAs, builds the run environment, and summarizes results.
    *   **k6 (Binary):** The Line Cook. Only cares about executing HTTP requests quickly.
    *   **Your Script:** The Recipe.

## Slide 3: Folder Structure (Where you live)
*   **Visual Idea:** Callouts pointing to `scrum-suites/` and `config/`.
*   **Talking Points:** 
    *   **`core-engine/`:** Do not touch (Engine internals).
    *   **`scrum-suites/your-team/`:** Your home base!
        *   `tests/` -> Your `.js` definitions.
        *   `data/` -> Your `.csv` test users.
    *   **`config/`:** Changing behavior without changing code.
        *   `test-plans/load-test.json` -> Toggling load spikes and mixing scripts.

## Slide 4: Writing a Script (The Three Phases)
*   **Visual:** Code snippet showing `initPhase`, `actionPhase`, `endPhase`.
*   **Talking Points:** 
    *   Old k6: One massive loop.
    *   New Framework: Three distinct, manageable phases.
    *   **Init:** Setup specific to a user (e.g., getting a unique username from CSV). 
    *   **Action:** The core business transactions that are timed.
    *   **End:** Clean tear-downs.

## Slide 5: The Command Line (Running tests)
*   **Visual Idea:** Screenshot of terminal running the command.
*   **Talking Points:** 
    *   Command: `npm run cli -- run --plan config/test-plans/load-test.json`
    *   **What happens?** Progress bars show validation -> The test executes silently -> The report is built.

## Slide 6: Reading the Report 
*   **Visual:** Screenshot of the `RunReport.html` dashboard.
*   **Talking Points:** 
    *   Stop guessing if a test "felt" slow.
    *   **Key Section 1:** Execution Summary (Did it pass?).
    *   **Key Section 2:** Thresholds/SLAs (Which transaction failed?).
    *   **Key Section 3:** Transaction Timings (Min, Max, Avg, p95).

---

## Interactive Demo (Live Walkthrough)

*Explain to the audience that you will now scaffold a brand new script and execute it to prove how simple it is.*

**Step 1: Scaffold a new script**
Run this in the terminal:
```bash
npm run cli -- init
```
Explain: "This creates the basic folder structure and journey template automatically. No need to write from scratch."

**Step 2: Take a peek at the generated script**
Open `scrum-suites/sample-team/tests/browse-journey.js`
Say: "Notice the three phases. The framework has already wired up `initPhase`, `actionPhase`, and `endPhase` for us. It also automatically wired up `startTransaction`."

**Step 3: Show the Test Plan**
Open `config/test-plans/debug-test.json`
Say: "This is a pre-configured debug test plan. It only spins up 1 Virtual User for 5 iterations. Perfect for making sure the script compiles."

**Step 4: Execute the Run**
Run the following:
```bash
npm run cli -- run --plan config/test-plans/debug-test.json
```
Say: "The engine is validating everything. Now it's passing it to k6. Bam. HTML Report generated."

**Step 5: View the Report**
Open the output location shown in the terminal: `results/Debug_Test/Run_.../RunReport.html`.
Say: "Without having to configure Grafana or parse JSON, we have a complete breakdown of every transaction our new script just executed."

---
## Must-Know Points for your Team (Takeaways)
1. **Always run `npm run build`** if you touch anything in `/core-engine`.
2. **Never hardcode URLs in your script.** Use the environment manager (`config/environments/dev.json`).
3. **If K6 exits with Code `99`, your SLA failed.** Your test didn't crash, the website was just too slow!
