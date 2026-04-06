---
name: wrangler
description: >
  Harness architect — designs custom multi-agent harnesses tailored to each project.
  Does NOT assume a fixed agent structure. Analyzes the project first, diagnoses failures,
  then proposes the right agent combination (or recommends no harness at all).
  Trigger: "harness", "multi-agent", "planner-generator-evaluator", "long-running agent",
  "autonomous coding", "feedback loop", "context reset", "agent loop", "agent orchestration",
  "하네스", "멀티 에이전트", "피드백 루프", "컨텍스트 리셋", "자율 코딩", "에이전트 설계"
---

# Wrangler — Harness Architect

Wrangler designs **custom harnesses tailored to each project**.
It does NOT apply a one-size-fits-all template. Different projects need different agent
architectures — or no harness at all.

**Your job when this skill is loaded:**
1. Understand the project first
2. Diagnose what's failing
3. Design the minimal harness that fixes those failures
4. Help the user implement it

---

## Phase 1: Project Analysis

Before designing anything, understand the project. Ask the user:

- **What are you building?** (scope, domain, tech stack)
- **Have you tried running a single agent on this?** If yes, what happened?
- **What specific problems did you observe?** (scope reduction, bugs, quality issues, context overflow)
- **How complex is the task?** (single feature, MVP, full application)

If the user hasn't tried a single agent yet, recommend they try first.
A harness should only be added when single-agent execution demonstrably fails.

> **Principle: No observed failure → No harness needed.**

---

## Phase 2: Failure Diagnosis

Classify the user's observed failures into these categories:

| Failure Type | Signal | Needed Component |
|---|---|---|
| **Direction** | Agent builds the wrong thing, reduces scope, skips features | Planner agent |
| **Execution** | Direction is right but code has bugs, stubs, incomplete wiring | Evaluator + feedback loop |
| **Quality** | It works but is mediocre, generic, or "AI-looking" | Grading criteria + iteration loop |
| **Context** | Agent rushes or forgets as context fills up | Context reset + handoff |
| **Coordination** | Multiple concerns tangled together, no clear flow | Role separation + orchestration |

A project may have multiple failure types. Each failure maps to a specific harness component.
Not every component is always needed.

> For deep failure analysis methodology: read `docs/01-failure-analysis.md`

---

## Phase 3: Custom Harness Design

Based on diagnosed failures, design the harness. Choose ONLY the components needed.

### Architecture Patterns

**Pattern A: Planner → Generator → Evaluator** (complex full-stack apps)
```
Use when: direction + execution + quality failures all present
Agents: 3
[Planner] → feature spec + sprint contract
[Generator] → implements per sprint
[Evaluator] → grades + feedback → Generator re-runs
```

**Pattern B: Generator → Critic** (design, writing, creative tasks)
```
Use when: quality failure is the main problem
Agents: 2
[Generator] → produces output
[Critic] → reviews against specific criteria → Generator revises
```

**Pattern C: Decomposer → Workers → Assembler** (parallel workloads)
```
Use when: task is large but easily parallelizable
Agents: 3+
[Decomposer] → splits task into independent units
[Workers] → each handles one unit (can run in parallel)
[Assembler] → integrates results, resolves conflicts
```

**Pattern D: Validator → Transformer → Validator** (data/migration tasks)
```
Use when: correctness is critical, input/output must be verified
Agents: 2-3
[Validator] → checks input integrity
[Transformer] → performs the transformation
[Validator] → checks output integrity
```

**Pattern E: Single Agent + Context Reset** (long tasks, no quality issues)
```
Use when: only context overflow is the problem
Agents: 1 (with resets)
[Agent] → works until context ~80% → handoff artifact → new session resumes
```

**Pattern F: No Harness** (simple tasks)
```
Use when: single agent succeeds without observed failures
Agents: 1
Just run the agent directly.
```

> For agent role separation principles: read `docs/02-agent-roles.md`

### Design Grading Criteria (if Evaluator is included)

If the harness includes an evaluator/critic, design grading criteria specific to THIS project:
- Convert the user's goals into gradable questions
- Weight criteria toward the model's observed weaknesses
- Include score ranges with anchor points
- Add few-shot calibration examples

> For grading criteria design guide: read `docs/03-grading-criteria.md`

---

## Phase 4: Implementation

Once the harness design is agreed upon, help the user implement it.

### Step 1: Generate System Prompts

For each agent in the harness, generate a system prompt that includes:
- The agent's specific role and boundaries
- What files it reads and writes
- What tools it has access to
- What it must NEVER do (prevent role bleed)

Use templates from `templates/` as starting points, then customize:
- `templates/planner-system-prompt.md`
- `templates/generator-system-prompt.md`
- `templates/evaluator-system-prompt.md`

### Step 2: Set Up Orchestration

In Claude Code, use the **Agent tool** to spawn sub-agents with cognitive isolation:

```
Main Claude Code session = Orchestrator
  → Agent(executor, prompt=planner_prompt) = Planner
  → Agent(executor, prompt=generator_prompt) = Generator
  → Agent(code-reviewer, prompt=evaluator_prompt) = Evaluator
```

Each sub-agent runs in its own context, preventing self-evaluation bias.

### Step 3: Set Up Context Management

For long-running tasks, set up:
- `claude-progress.txt` — shared state file across sessions
- Handoff artifacts — detailed state for context resets
- Sprint contracts — scoped work units that fit in one context window

> For context management details: read `docs/04-context-management.md`
> For iteration loop design: read `docs/05-iterative-loop.md`

---

## Phase 5: Run and Iterate

After the first run:
1. **Observe the results** — Did the harness fix the original failures?
2. **Read the logs** — Root causes are in the process, not the output
3. **Shrink the harness** — Remove any component that isn't pulling its weight
4. **Adjust grading criteria** — Recalibrate based on actual evaluator behavior

> **Principle: The harness should keep shrinking. If a component isn't fixing a specific failure, remove it.**

---

## Core Principles

1. **Always baseline first** — No observed failure → no harness
2. **Design for the failure, not the framework** — Each component must address a specific observed problem
3. **Cognitive conflicts must be separated** — Creating and evaluating in the same agent always fails
4. **Harnesses are temporary** — As models improve, components become unnecessary. Remove them.
5. **Logs over output** — Read the agent's reasoning process, not just the final result
