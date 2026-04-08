---
name: list
description: >
  List all agents in the current harness. Shows agent names, roles, models,
  workflow sequence, and feedback loops from .wrangler/harness.json.
  Usage: /wrangler:list
  Trigger: "list agents", "show agents", "에이전트 목록", "하네스 목록"
---

# Wrangler: List — Show Harness Agents

Displays the agents configured in the current project's harness.

---

## Instructions

1. Read `.wrangler/harness.json` in the current project root.

2. If the file does **not exist** → Tell the user:
   "No harness found. Run `/wrangler:design` first to create one."
   Stop here.

3. If the file exists, display the harness info in this format:

```
## Harness: {name}

Pattern: {pattern}
Created: {createdAt}
Diagnosed failures: {failureModes joined by ", "}

### Agents

| # | Name | Role | Model | Type |
|---|------|------|-------|------|
| 1 | {name} | {role} | {model} | {subagentType} |
| 2 | ... | ... | ... | ... |

### Workflow

Sequence: {agent1} → {agent2} → {agent3}

### Feedback Loops

{loop.from} → {loop.to} (max {maxIterations} iterations, pass threshold: {passThreshold})

### Commands

- Run an agent: `/wrangler:run <agent-name>`
- Redesign harness: `/wrangler:design`
```

4. Also check `.wrangler/progress.md` — if it exists, show current sprint status:

```
### Current Status

Sprint: {current sprint number}
Last updated: {timestamp from progress.md}
```
