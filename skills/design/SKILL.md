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

After the user agrees to a pattern, generate the following:

### 4.1 Create `.wrangler/harness.json`

```json
{
  "name": "<project-name>",
  "pattern": "<pattern-id>",
  "createdAt": "<ISO timestamp>",
  "failureModes": ["<diagnosed failures>"],
  "currentSprint": 1,
  "agents": {
    "<agent-name>": {
      "role": "<human-readable role description>",
      "promptFile": "agents/<agent-name>.md",
      "subagentType": "<executor | code-reviewer>",
      "model": "<opus | sonnet | haiku>"
    }
  },
  "workflow": {
    "sequence": ["<ordered agent names>"],
    "handoffs": [
      {
        "from": "<source agent>",
        "to": "<target agent>",
        "artifact": "<what is being passed>",
        "filename": "<from>-to-<to>--<artifact>.md",
        "iterable": false
      }
    ],
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

#### handoffs 설계 규칙

`workflow.handoffs`는 에이전트 간 소통 파일을 정의합니다:

- **`from`/`to`**: 소통하는 에이전트 쌍
- **`artifact`**: 전달하는 내용 (contract, feedback, handoff 등)
- **`filename`**: 파일명 패턴. `{from}-to-{to}--{artifact}.md`
- **`iterable`**: `true`이면 번호 붙음 (`--feedback-01.md`, `--feedback-02.md`)

**Pattern A 예시:**

```json
"handoffs": [
  {
    "from": "planner",
    "to": "generator",
    "artifact": "contract",
    "filename": "planner-to-generator--contract.md",
    "iterable": false
  },
  {
    "from": "evaluator",
    "to": "generator",
    "artifact": "feedback",
    "filename": "evaluator-to-generator--feedback-{n}.md",
    "iterable": true
  },
  {
    "from": "generator",
    "to": "next",
    "artifact": "handoff",
    "filename": "generator-to-next--handoff.md",
    "iterable": false
  }
]
```

모든 핸드오프 파일은 `.wrangler/sprint-{currentSprint}/` 안에 생성됩니다.

#### Valid `subagentType` values

- `executor` — Full tools (bash, file read/write). Use for generator/worker agents.
- `code-reviewer` — Read-only evaluation. Use for evaluator/critic agents.

#### Model guidelines

- `opus` — Deep analysis, planning, complex generation
- `sonnet` — Standard implementation, evaluation
- `haiku` — Quick lookups, simple tasks

### 4.2 Create sprint-1 directory

```bash
mkdir -p .wrangler/sprint-1
```

### 4.3 Create agent system prompts

For each agent in `harness.json`, create `.wrangler/agents/<agent-name>.md`.

Use templates from the plugin as starting points:
- `templates/planner-system-prompt.md`
- `templates/generator-system-prompt.md`
- `templates/evaluator-system-prompt.md`

**Customize each prompt for THIS project.** Each prompt MUST include:
- The agent's role and boundaries
- **Exactly which files to read** (full paths relative to `.wrangler/`)
- **Exactly which files to write** (with naming convention)
- What the agent must NEVER do

**Example — planner prompt must include:**
```
## Output Files
Write the following files to .wrangler/sprint-{N}/:
- planner-to-generator--contract.md  (sprint scope and completion criteria)
```

**Example — evaluator prompt must include:**
```
## Input Files
Read from .wrangler/sprint-{N}/:
- planner-to-generator--contract.md  (what to evaluate against)

## Output Files
Write to .wrangler/sprint-{N}/:
- evaluator-to-generator--feedback-{NN}.md  (numbered: 01, 02, 03...)
```

> For grading criteria design: read `docs/03-grading-criteria.md`
> For context management: read `docs/04-context-management.md`

### 4.4 Create `.wrangler/progress.md`

Initialize the progress file using `templates/claude-progress.md` as a template.
Include:
```markdown
## Current State
- Sprint: 1
- Phase: not started
- Last agent: none
- Iteration: 0
```

### 4.5 Summary

After generating, tell the user:
1. What files were created
2. How to list agents: `/wrangler:list`
3. How to run an agent: `/wrangler:run <agent-name>`
4. Recommended first agent to run (usually the first in the sequence)
5. The workflow: `planner → generator → evaluator → (feedback loop) → next sprint`
