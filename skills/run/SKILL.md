---
name: run
description: >
  Invoke an agent from a designed harness. Reads .wrangler/harness.json to find
  the agent config, loads its system prompt, and spawns it via the Agent tool.
  Usage: /wrangler:run <agent-name>
  Trigger: "run agent", "run harness", "에이전트 실행", "하네스 실행"
---

# Wrangler: Run — Agent Runner

Dispatches a specific agent from the user's harness configuration.

---

## Step 1: Load Harness Config

Read `.wrangler/harness.json` in the current project root.

- If the file does **not exist** → Tell the user:
  "No harness found. Run `/wrangler:design` first to create one."
  Stop here.

---

## Step 2: Identify Target Agent

Check the skill argument for an agent name (e.g., `/wrangler:run planner`).

- If **no argument given** → Read agents from `harness.json` and ask:
  "Which agent do you want to run? Available agents:"
  Then list each agent with its role. Stop and wait for the user's choice.

- If **argument given** → Look up the agent name in `harness.json.agents`.
  If not found, show available agents and ask the user to pick one.

---

## Step 3: Gather Context

Before spawning the agent, gather sprint context:

1. **Read `.wrangler/progress.md`** (if exists) — current project state
2. **Check for feedback files** — find the latest `evaluator-to-generator--feedback-*.md` 
   or similar files in the current sprint directory
3. **Read the sprint contract** — `sprint-N/planner-to-generator--contract.md` if exists
4. **Determine current sprint number** from progress.md

---

## Step 4: Spawn the Agent

Read the agent's system prompt from `.wrangler/{agent.promptFile}`.

Construct and execute an Agent tool call:

```
Agent({
  description: "Wrangler: {agent-name}",
  subagent_type: "{agent.subagentType}",   // "executor" or "code-reviewer"
  model: "{agent.model}",                   // "opus", "sonnet", or "haiku"
  prompt: `
{contents of the agent's promptFile}

---

## Current Project State

{contents of progress.md, if exists}

## Current Sprint Context

{sprint contract contents, if exists}

## Evaluator Feedback (if any)

{latest feedback file contents, if exists}

## Working Directory

{current project root path}

## Instructions

Begin your work now. When done:
1. Update .wrangler/progress.md with what you accomplished
2. If you created evaluatable output, note it for the evaluator
`
})
```

---

## Step 5: Post-Run

After the agent completes:

1. **Show the result** to the user
2. **Check the workflow sequence** in `harness.json.workflow.sequence`
3. **Suggest the next agent** in the sequence:
   - "The next agent in the sequence is `{next-agent}`. Run it with `/wrangler:run {next-agent}`"
4. **If a feedback loop exists** and the evaluator just ran:
   - Read the evaluator's score from the feedback file
   - If score >= `passThreshold` → Suggest moving to the next sprint
   - If score < `passThreshold` → Suggest re-running the generator:
     "Score is {score}/{passThreshold}. Run `/wrangler:run {loop.to}` to iterate."
   - If iterations >= `maxIterations` → Warn:
     "Max iterations reached. Consider moving to the next sprint or adjusting criteria."

---

## File Naming Convention

When agents write handoff files, use this pattern:
- `{from-agent}-to-{to-agent}--{content}.md`
- Iterating files get numbered: `--feedback-01.md`, `--feedback-02.md`
- Sprint-scoped files go in `.wrangler/sprint-N/`
- Global files go in `.wrangler/` root
