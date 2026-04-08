---
name: list
description: >
  List all agents in the current harness. Shows agent names, roles, models,
  workflow sequence, handoff files, and current sprint status.
  Usage: /wrangler:list
  Trigger: "list agents", "show agents", "에이전트 목록", "하네스 목록"
---

# Wrangler: List — Show Harness Agents

Displays the agents, workflow, and current sprint status.

---

## Instructions

1. Read `.wrangler/harness.json` in the current project root.

2. If the file does **not exist** → Tell the user:
   "No harness found. Run `/wrangler:design` first to create one."
   Stop here.

3. If the file exists, display the harness info:

```
## Harness: {name}

Pattern: {pattern}
Created: {createdAt}
Diagnosed failures: {failureModes joined by ", "}
Current sprint: {currentSprint}

### Agents

| # | Name | Role | Model | Type |
|---|------|------|-------|------|
| 1 | {name} | {role} | {model} | {subagentType} |
| 2 | ... | ... | ... | ... |

### Workflow

Sequence: {agent1} → {agent2} → {agent3}

### Handoffs (inter-agent communication files)

| From | To | Artifact | Filename | Iterable |
|------|----|----------|----------|----------|
| {from} | {to} | {artifact} | {filename} | {yes/no} |

### Feedback Loops

{loop.from} → {loop.to} (max {maxIterations} iterations, pass: {passThreshold})
```

4. Check `.wrangler/sprint-{currentSprint}/` directory and list existing files:

```
### Sprint {currentSprint} Files

| File | Status |
|------|--------|
| planner-to-generator--contract.md | exists |
| evaluator-to-generator--feedback-01.md | exists |
| evaluator-to-generator--feedback-02.md | not yet |
| generator-to-next--handoff.md | not yet |
```

For each handoff in `workflow.handoffs`, check if the file exists in the current sprint directory.
Show `exists` or `not yet`.

5. Read `.wrangler/progress.md` and show current status:

```
### Progress

Last agent: {last agent name}
Phase: {current phase}
Iteration: {N}
```

6. Show available commands:

```
### Commands

/wrangler:run {next-agent}    ← suggested next step
/wrangler:run <agent-name>    ← run any agent
/wrangler:design              ← redesign harness
```
