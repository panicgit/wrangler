# Agent Role Separation Principles

This document guides how to decide the number and separation of agents in a harness.
The key principle is **never assigning cognitively conflicting roles to the same agent**.

---

## What Is Cognitive Conflict?

Role combinations that degrade quality when performed simultaneously by a single agent.

| Conflicting Role Combination | Reason |
|---|---|
| Creating + Evaluating | Self-evaluation bias — agents are lenient with their own work |
| Planning + Executing | Tendency to reduce scope during execution |
| Big picture + Detail implementation | Context congestion makes both shallow |

---

## Basic 3-Agent Structure

```
[Planner]     User prompt → Detailed feature spec (feature-list.md)
                           + Sprint contract (sprint-contract.md)
     ↓
[Generator]   Feature spec → Actual implementation (per sprint)
                           → Update claude-progress.txt
     ↓
[Evaluator]   Output → Grading → Specific feedback (evaluator-feedback.md)
     ↓                           → Re-run generator
     └───────────────────────────┘  (N iterations)
```

### Planner

- **Input**: User's raw prompt
- **Output**: feature-list.md, sprint-contract.md
- **Core role**: Lock scope so the generator cannot reduce it
- **Tools**: None (pure reasoning)
- **Prompt**: `templates/planner-system-prompt.md`

### Generator

- **Input**: feature-list.md, sprint-contract.md, evaluator-feedback.md (if available)
- **Output**: Actual code/deliverables
- **Core role**: Implement per spec without leaving TODOs or stubs
- **Tools**: bash, text_editor, (optional) web_search
- **Prompt**: `templates/generator-system-prompt.md`

### Evaluator

- **Input**: Generator's output, sprint-contract.md (completion criteria)
- **Output**: evaluator-feedback.md (scores + specific feedback)
- **Core role**: Evaluate skeptically, verify by actually running code
- **Tools**: bash (code execution), Playwright MCP (design verification)
- **Prompt**: `templates/evaluator-system-prompt.md`

---

## When to Add or Remove Agents

### When to Add an Agent

| Signal | Agent to Add |
|---|---|
| Model reduces scope | Planner |
| Model overrates its own output | Evaluator |
| Model rushes when context fills up | Initializer (context reset) |
| Domain-specific expertise needed | Domain expert agent |

### When to Remove an Agent

- If a single agent produces sufficient quality, the harness itself is unnecessary
- If the planner's spec is always identical to the original, the planner is unnecessary
- If evaluator scores are already high on the first iteration, the iteration loop is unnecessary

**Principle**: The harness should keep shrinking. Remove unnecessary structure as models improve.

---

## Inter-Agent Communication

Agents do not communicate directly. They share state **through files**.

```
Planner ──writes──→ feature-list.md ──reads──→ Generator
Planner ──writes──→ sprint-contract.md ──reads──→ Generator, Evaluator
Generator ──writes──→ claude-progress.txt ──reads──→ Next session Generator
Evaluator ──writes──→ evaluator-feedback.md ──reads──→ Generator
```

Benefits of file-based communication:
- State is preserved even after context reset
- Each agent's inputs and outputs are clear
- Easy to debug (just read the files directly)
