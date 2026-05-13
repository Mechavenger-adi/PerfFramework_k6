# Prompt Templates

> Reusable prompt patterns for common tasks.

## PT1 — Feature Addition

```
I need to add [FEATURE] to K6-PerfFramework.

Context loaded:
- ai-context/overview.md
- ai-context/architecture-laws.md
- ai-context/integration-checklist.md
- ai-context/extension-points.md

Requirements:
- [specific requirements]

Constraints:
- Must not break existing CLI commands
- Must follow dependency direction rules
- Must update AGENT-CONTEXT.md change log
```

## PT2 — Bug Fix

```
Bug: [DESCRIPTION]
Reproduction: [STEPS]

Context loaded:
- ai-context/module-map.md (identified [FILE] as likely location)
- ai-context/fragile-areas.md (area [FN] is known fragile)

Fix constraints:
- Must preserve [EXISTING BEHAVIOR]
- Must verify against [RELATED FILES from change-impact-map.md]
```

## PT3 — Architecture Review

```
I want to review the [SUBSYSTEM] architecture.

Load these ai-context files:
- subsystem-boundaries.md
- dependency-rules.md
- decisions.md (filter for [SUBSYSTEM]-related decisions)
- known-tech-debt.md

Questions:
- Is the current design sound?
- What are the risks?
- What improvements are possible?
```

## PT4 — New Agent Onboarding

```
I am a new AI agent working on K6-PerfFramework.

Please read in this order:
1. ai-context/overview.md
2. ai-context/framework-philosophy.md
3. ai-context/architecture-laws.md
4. ai-context/module-map.md
5. ai-context/execution-flow.md

Then I will give you a task.
```

## PT5 — Change Impact Assessment

```
I'm planning to change [FILE/MODULE].

Load ai-context/change-impact-map.md.

Questions:
- What other files are impacted?
- What tests should I verify?
- Are there fragile areas involved?
```
