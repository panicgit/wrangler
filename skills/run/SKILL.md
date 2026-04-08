---
name: run
description: >
  Invoke an agent from a designed harness. Reads .wrangler/harness.json to find
  the agent config, loads its system prompt, and spawns it via the Agent tool.
  Manages sprint directories and inter-agent communication files automatically.
  Usage: /wrangler:run <agent-name>
  Trigger: "run agent", "run harness", "에이전트 실행", "하네스 실행"
---

# Wrangler: Run — Agent Runner

Dispatches a specific agent from the user's harness configuration.
Manages sprint directories and inter-agent handoff files.

## Architecture: Sub-Agent + File-Only Communication

```
Main Session (Orchestrator = you)
  │
  │  1. Read harness.json → identify agent + handoff config
  │  2. Read input files from .wrangler/sprint-N/
  │  3. Spawn sub-agent via Agent tool (separate context)
  │  4. Verify output files were created
  │  5. Suggest next agent
  │
  ├─ Agent(planner)   ← cannot see main session or other agents
  ├─ Agent(generator)  ← cannot see main session or other agents
  └─ Agent(evaluator)  ← cannot see main session or other agents
```

**Key rules:**
- Each agent runs as a **sub-agent via the Agent tool** (separate context window)
- Agents **cannot** see the main session conversation or each other's reasoning
- The **only** communication channel between agents is `.wrangler/sprint-N/` files
- The orchestrator reads input files and passes them in the agent's prompt
- The orchestrator **never** summarizes or interprets another agent's output — it passes file contents verbatim

---

## Step 1: Load Harness Config

Read `.wrangler/harness.json` in the current project root.

- If the file does **not exist** → Tell the user:
  "No harness found. Run `/wrangler:design` first to create one."
  Stop here.

---

## Step 2: Determine Current Sprint

Read `harness.json.currentSprint` to get the sprint number (default: 1).

Ensure the sprint directory exists:
```
.wrangler/sprint-{currentSprint}/
```
If it doesn't exist, create it.

---

## Step 3: Identify Target Agent

Check the skill argument for an agent name (e.g., `/wrangler:run planner`).

- If **no argument given** → List available agents and ask:
  "Which agent do you want to run? Available agents:"
  Then list each agent with its role. Stop and wait.

- If **argument given** → Look up the agent in `harness.json.agents`.
  If not found, show available agents and ask.

---

## Step 4: Gather Input Files for This Agent

Using `harness.json.workflow.handoffs`, find all handoffs where `to` matches 
the target agent. These are the **input files** the agent needs.

For each matching handoff:
1. Build the file path: `.wrangler/sprint-{currentSprint}/{handoff.filename}`
2. If `iterable: true`, find the **highest-numbered** file 
   (e.g., `evaluator-to-generator--feedback-03.md`)
3. Read the file contents

Also read:
- `.wrangler/progress.md` (if exists)
- `.wrangler/sprint-{currentSprint}/planner-to-generator--contract.md` (if exists and agent is not planner)

**If a required input file does not exist yet:**
- This is normal if the previous agent hasn't run yet
- Note which files are missing and include that info in the agent prompt

---

## Step 5: Determine Output Files for This Agent

Using `harness.json.workflow.handoffs`, find all handoffs where `from` matches 
the target agent. These are the **output files** the agent must write.

For each matching handoff:
1. Build the expected output path: `.wrangler/sprint-{currentSprint}/{handoff.filename}`
2. If `iterable: true`, determine the next number:
   - Count existing files matching the pattern
   - Next file = count + 1, zero-padded (01, 02, 03...)
   - Replace `{n}` in filename with the number

---

## Step 6: Spawn the Agent

Read the agent's system prompt from `.wrangler/{agent.promptFile}`.

Construct and execute an Agent tool call:

```
Agent({
  description: "Wrangler: {agent-name} (sprint {currentSprint})",
  subagent_type: "{agent.subagentType}",
  model: "{agent.model}",
  prompt: `
{contents of the agent's promptFile}

---

## Sprint Info

- Sprint: {currentSprint}
- Sprint directory: .wrangler/sprint-{currentSprint}/

## Input Files

{for each input handoff file that exists:}
### {filename}
{file contents}

{for each input that is missing:}
### {filename} — NOT YET CREATED
(The previous agent has not run yet for this sprint.)

## Current Progress

{contents of progress.md, if exists}

## Output Requirements

You MUST write the following files when done:

{for each output handoff:}
- .wrangler/sprint-{currentSprint}/{resolved filename}
  Content: {artifact description}

## Additional Instructions

1. Write all output files to .wrangler/sprint-{currentSprint}/
2. Update .wrangler/progress.md with:
   - What you accomplished
   - Current sprint phase
   - Last agent: {agent-name}
3. Working directory: {current project root path}
`
})
```

---

## Step 7: Post-Run Verification

After the agent completes:

### 7.1 Verify output files were created

Check that each expected output file exists in `.wrangler/sprint-{currentSprint}/`.
If any are missing, warn the user.

### 7.2 Update progress tracking

Read `.wrangler/progress.md` and verify it was updated by the agent.
If not, update it with:
```markdown
- Last agent: {agent-name}
- Sprint: {currentSprint}
- Phase: {agent-name} completed
- Iteration: {current iteration count for feedback loops}
```

### 7.3 Check feedback loop (if evaluator just ran)

If the agent that just ran is the `from` side of a `workflow.loops` entry:

1. Read the evaluator's latest feedback file
2. Extract the score (look for "Overall Score: X / 100" or similar)
3. Compare against `loop.passThreshold`:
   - **Score >= threshold** → 
     "Score {score}/{threshold} — passed. Moving to sprint {currentSprint + 1}."
     Update `harness.json.currentSprint` to `currentSprint + 1`.
     Create new sprint directory: `.wrangler/sprint-{newSprint}/`
   - **Score < threshold** →
     Count how many feedback files exist for this sprint.
     If count >= `loop.maxIterations`:
       "Max iterations ({maxIterations}) reached. Consider adjusting criteria or moving on."
     Else:
       "Score {score}/{threshold}. Iteration {count}/{maxIterations}. 
        Run `/wrangler:run {loop.to}` to iterate."

### 7.4 Suggest next step

Look at `workflow.sequence` to find the next agent after the one that just ran.

Display:
```
Sprint {currentSprint} status:
- {agent-name}: done
- {next-agent}: ready → /wrangler:run {next-agent}

Created files:
- .wrangler/sprint-{N}/{output-file-1}
- .wrangler/sprint-{N}/{output-file-2}
```
