# Wrangler — Claude Code Plugin

A Claude Code plugin that designs **custom multi-agent harnesses tailored to each project**.
Not a fixed template — Wrangler analyzes your project's specific failures and proposes
the right agent architecture (or recommends no harness at all).

## Commands

| Command | Description |
|---------|-------------|
| `/wrangler:design` | Interactive harness design wizard — analyzes failures, picks a pattern, generates agent configs |
| `/wrangler:run <agent>` | Invoke a specific agent from your harness (e.g., `/wrangler:run planner`) |
| `/wrangler:list` | Show all agents in your harness with roles, models, and workflow |

### Quick Start

```
/wrangler:design          # Design your harness (first time)
/wrangler:list            # See what agents were created
/wrangler:run planner     # Run the planner agent
/wrangler:run generator   # Run the generator agent
/wrangler:run evaluator   # Run the evaluator agent
```

## What It Does

Wrangler is a **harness architect**. The `/wrangler:design` wizard walks you through:

1. **Project analysis** — Understands what you're building (one question at a time)
2. **Failure diagnosis** — Classifies observed single-agent failures (direction / execution / quality / context)
3. **Custom harness design** — Proposes the minimal agent combination that fixes YOUR failures
4. **Config generation** — Creates `.wrangler/harness.json` + agent system prompts

Then use `/wrangler:run <agent>` to invoke each agent with its tailored system prompt.

### Not Every Project Needs a Harness

Wrangler may recommend **no harness at all** if a single agent is sufficient.
Different projects get different architectures:

| Project | Recommended Architecture |
|---------|------------------------|
| Complex full-stack app | Planner → Generator → Evaluator |
| Design / creative task | Generator → Critic |
| Data migration | Validator → Transformer → Validator |
| Parallelizable workload | Decomposer → Workers → Assembler |
| Long task, no quality issues | Single agent + context reset |
| Simple feature | No harness needed |

## Installation

### Via Marketplace (recommended)

```bash
# In Claude Code:
/marketplace add panicgit/wrangler
/plugin install wrangler
```

### Manual Installation

```bash
# 1. Clone the repository
git clone https://github.com/panicgit/wrangler.git

# 2. Create the plugin directory
mkdir -p ~/.claude/plugins/cache/wrangler/wrangler/1.0.1

# 3. Copy contents (not the directory itself)
cp -r wrangler/* ~/.claude/plugins/cache/wrangler/wrangler/1.0.1/
cp -r wrangler/.claude-plugin ~/.claude/plugins/cache/wrangler/wrangler/1.0.1/

# 4. Install dependencies
cd ~/.claude/plugins/cache/wrangler/wrangler/1.0.1
npm install

# 5. Restart Claude Code
```

## Generated Files

After running `/wrangler:design`, all harness files are stored in `.wrangler/` at your project root:

```
.wrangler/
├── harness.json                               ← Harness config (agents, workflow, loops)
├── progress.md                                ← Global progress (all agents read/write)
├── agents/
│   ├── planner.md                             ← Planner system prompt
│   ├── generator.md                           ← Generator system prompt
│   └── evaluator.md                           ← Evaluator system prompt
├── sprint-1/
│   ├── planner-to-generator--contract.md      ← Sprint scope + completion criteria
│   ├── evaluator-to-generator--feedback-01.md ← 1st evaluation
│   └── generator-to-next--handoff.md          ← Handoff when sprint ends
└── sprint-2/
    └── ...
```

## Plugin Structure

```
wrangler/
├── .claude-plugin/
│   ├── plugin.json                    ← Plugin metadata
│   └── marketplace.json               ← Marketplace catalog
├── skills/
│   ├── design/
│   │   └── SKILL.md                   ← /wrangler:design — harness design wizard
│   ├── run/
│   │   └── SKILL.md                   ← /wrangler:run — agent runner
│   └── list/
│       └── SKILL.md                   ← /wrangler:list — show agents
├── docs/
│   ├── 01-failure-analysis.md         ← Failure mode classification framework
│   ├── 02-agent-roles.md              ← Agent role separation principles
│   ├── 03-grading-criteria.md         ← Grading criteria design guide
│   ├── 04-context-management.md       ← Context reset & handoff
│   └── 05-iterative-loop.md           ← Iteration loop design
├── templates/
│   ├── planner-system-prompt.md       ← Planner agent system prompt template
│   ├── generator-system-prompt.md     ← Generator agent system prompt template
│   ├── evaluator-system-prompt.md     ← Evaluator agent system prompt template
│   ├── handoff-artifact.md            ← Cross-session handoff artifact
│   ├── claude-progress.md             ← Progress tracking file
│   └── sprint-contract.md             ← Sprint contract
└── tools/                             ← Optional: standalone CLI runner
    ├── tool-executor.js
    ├── context-reset.js
    └── progress-tracker.js
```

## Core Principles

1. **Always baseline first** — No observed failure → no harness
2. **Design for the failure, not the framework** — Each component must address a specific problem
3. **Cognitive conflicts must be separated** — Creating and evaluating in the same agent always fails
4. **Harnesses are temporary** — Remove unnecessary components as models improve
5. **Logs over output** — Read the agent's process, not just the result

## References

- [Harnessing Claude's Intelligence](https://claude.com/blog/harnessing-claudes-intelligence)
- [Harness Design for Long-Running Apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

## License

MIT
