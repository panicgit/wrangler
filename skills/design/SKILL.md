---
name: design
description: >
  Interactive harness design wizard. Analyzes a project's single-agent failures,
  diagnoses root causes, and generates a custom multi-agent harness config
  (.wrangler/harness.json) with tailored system prompts.
  Trigger: "design harness", "harness design", "하네스 설계", "에이전트 설계",
  "multi-agent design", "멀티 에이전트 설계"
---

# Wrangler: Design — Harness Design Wizard

This skill walks the user through designing a custom multi-agent harness.
Follow each phase in order. Ask **one question at a time** — never multiple.

---

## Phase 1: Project Analysis

**Step 1** → Ask: "What are you building?"
Let the user describe. Listen.

**Step 2** → Ask: "Have you tried running this with a single agent?"
- If **no** → Recommend trying a single agent first. Stop here.
- If **yes** → Proceed.

**Step 3** → Ask: "What went wrong?"
Let the user describe failures in their own words. Do not offer categories yet.

> **Principle: No observed failure → No harness needed.**

---

## Phase 2: Failure Diagnosis

Classify the user's failures:

| Failure Type | Signal | Component Needed |
|---|---|---|
| **Direction** | Builds wrong thing, reduces scope, skips features | Planner agent |
| **Execution** | Direction right but bugs, stubs, broken wiring | Evaluator + feedback loop |
| **Quality** | Works but mediocre, generic, "AI-looking" | Grading criteria + iteration |
| **Context** | Rushes or forgets as context fills up | Context reset + handoff |
| **Coordination** | Concerns tangled, no clear flow | Role separation |

> For detailed methodology: read `docs/01-failure-analysis.md`

---

## Phase 3: Pattern Selection

Based on diagnosed failures, recommend ONE pattern:

**Pattern A: Planner → Generator → Evaluator**
- When: direction + execution + quality failures all present
- Agents: planner, generator, evaluator

**Pattern B: Generator → Critic**
- When: quality failure is the main problem
- Agents: generator, critic

**Pattern C: Decomposer → Workers → Assembler**
- When: task is large and parallelizable
- Agents: decomposer, worker, assembler

**Pattern D: Validator → Transformer → Validator**
- When: correctness is critical (data/migration)
- Agents: validator, transformer

**Pattern E: Single Agent + Context Reset**
- When: only context overflow is the problem
- Agents: agent (with resets)

**Pattern F: No Harness**
- When: single agent succeeds
- No config needed. Stop here.

> For agent role principles: read `docs/02-agent-roles.md`

---

## Phase 4: Generate Harness Config

After the user agrees to a pattern, generate two things:

### 4.1 Create `.wrangler/harness.json`

```json
{
  "name": "<project-name>",
  "pattern": "<pattern-id>",
  "createdAt": "<ISO timestamp>",
  "failureModes": ["<diagnosed failures>"],
  "agents": {
    "<agent-name>": {
      "role": "<human-readable role description>",
      "promptFile": "agents/<agent-name>.md",
      "subagentType": "<executor | code-reviewer>",
      "model": "<opus | sonnet | haiku>",
      "reads": ["<files this agent reads>"],
      "writes": ["<files this agent writes>"]
    }
  },
  "workflow": {
    "sequence": ["<ordered agent names>"],
    "loops": [
      {
        "from": "<evaluator agent name>",
        "to": "<generator agent name>",
        "maxIterations": 5,
        "passThreshold": 80
      }
    ]
  },
  "context": {
    "resetStrategy": "per-sprint | manual | none",
    "progressFile": "progress.md"
  }
}
```

**Valid `subagentType` values:**
- `executor` — Full tools (bash, file read/write). Use for generator/worker agents.
- `code-reviewer` — Read-only evaluation. Use for evaluator/critic agents.

**Model guidelines:**
- `opus` — Deep analysis, planning, complex generation
- `sonnet` — Standard implementation, evaluation
- `haiku` — Quick lookups, simple tasks

### 4.2 Create agent system prompts

For each agent in `harness.json`, create `.wrangler/agents/<agent-name>.md`.

Use templates from the plugin as starting points:
- `templates/planner-system-prompt.md`
- `templates/generator-system-prompt.md`
- `templates/evaluator-system-prompt.md`

**Customize each prompt for THIS project:**
- Replace generic placeholders with project-specific details
- Add project-specific grading criteria (if evaluator)
- Define what files the agent reads and writes
- Specify what the agent must NEVER do

> For grading criteria design: read `docs/03-grading-criteria.md`
> For context management: read `docs/04-context-management.md`

### 4.3 Create `.wrangler/progress.md`

Initialize the progress file using `templates/claude-progress.md` as a template.

### 4.4 Summary

After generating, tell the user:
1. What files were created
2. How to list agents: `/wrangler:list`
3. How to run an agent: `/wrangler:run <agent-name>`
4. Recommended first agent to run (usually the first in the sequence)
