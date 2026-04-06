---
name: wrangler
description: >
  Use when designing and configuring AI multi-agent harnesses.
  Trigger situations: user mentions "harness", "multi-agent", "planner-generator-evaluator",
  "long-running agent", "autonomous coding", "feedback loop", "context reset", etc.
  Use when single-agent execution hits its limits, or when designing complex autonomous tasks.
---

# Harness Engineering Guide

Harness engineering begins **when prompt engineering reaches its limits**.
Instead of telling the model what to do, you design the **environment (harness)** in which the model operates.

## When to Use This Skill

A harness is needed if any of these symptoms are present:
- A single agent gives up mid-task or reduces scope on long-running tasks
- The model always says "looks good" when evaluating its own output
- Consistency breaks down as the context window fills up
- Attempts to build a complex app in one shot keep failing

## 4 Steps to Harness Design

### Step 1 — Measure the Baseline (Always First)

Run the task with a single agent without a harness. Use the output yourself and read the logs.

Classify failures into three categories:
- **Direction failure**: The model builds the wrong thing → Planner needed
- **Execution failure**: Direction is right but implementation breaks → Evaluator + feedback loop needed
- **Quality failure**: It works but is mediocre → Grading criteria + iteration loop needed

> Detailed failure analysis: read `docs/01-failure-analysis.md`

### Step 2 — Separate Agent Roles

Roles with cognitive conflicts must be separated.
"Creating" and "evaluating" can never be done by the same agent.

Basic 3-agent structure:

```
[Planner]     User prompt → Detailed feature spec (features.md)
[Generator]   Feature spec → Actual implementation (per sprint)
[Evaluator]   Output → Grading → Specific feedback → Generator re-run
```

> Role separation details: read `docs/02-agent-roles.md`

### Step 3 — Design Grading Criteria

"Is it good?" is not a grading criterion. Criteria must be **specific and gradable**.

Grading criteria design principles:
1. Convert subjective judgments into specific questions
2. Assign weights to each criterion (weight weaknesses more than strengths)
3. Calibrate scoring standards with few-shot examples
4. Generator and Evaluator share the same criteria

> Grading criteria design: read `docs/03-grading-criteria.md`

### Step 4 — Context Management

Context must be explicitly managed in long-running tasks.

Core principles:
- Use **Context Reset** instead of compaction (provides a clean slate)
- Update `claude-progress.md` at the end of each session
- Initializer agent reads the progress file and sets up the environment at session start

> Context management details: read `docs/04-context-management.md`
> Iteration loop design: read `docs/05-iterative-loop.md`

## Ready-to-Use Templates

| File | Purpose |
|------|---------|
| `templates/planner-system-prompt.md` | Planner agent system prompt |
| `templates/generator-system-prompt.md` | Generator agent system prompt |
| `templates/evaluator-system-prompt.md` | Evaluator agent system prompt |
| `templates/handoff-artifact.md` | Cross-session handoff artifact |
| `templates/claude-progress.md` | Progress tracking file |

## Core Principles Summary

1. **Always start with a baseline** — Never design a harness without observing failures
2. **Separate roles based on cognitive conflicts** — Creating and evaluating must be separate
3. **Make grading criteria specific** — Convert subjectivity into objective questions
4. **Keep shrinking the harness** — Remove unnecessary structure as models improve
5. **Always read the logs** — Root causes are found in the process, not the output
