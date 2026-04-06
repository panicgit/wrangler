# Wrangler — Claude Code Plugin

A Claude Code plugin that designs **custom multi-agent harnesses tailored to each project**.
Not a fixed template — Wrangler analyzes your project's specific failures and proposes
the right agent architecture (or recommends no harness at all).

## What It Does

Wrangler is a **harness architect**. When triggered, it walks you through:

1. **Project analysis** — Understands what you're building (one question at a time)
2. **Failure diagnosis** — Classifies observed single-agent failures (direction / execution / quality / context)
3. **Custom harness design** — Proposes the minimal agent combination that fixes YOUR failures
4. **Implementation** — Generates system prompts and sets up orchestration via Claude Code's Agent tool
5. **Iteration** — Run, observe, shrink unnecessary components

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

### Via Claude Code Plugin System

```bash
/plugin install wrangler
```

### Manual Installation

```bash
git clone https://github.com/panicgit/wrangler.git
cp -r wrangler ~/.claude/plugins/cache/wrangler/wrangler/1.0.0
```

## Usage

Once installed, describe your situation in Claude Code:

```
My single agent keeps reducing scope when building a full-stack app.
Help me design a harness.
```

Wrangler will ask about your project step by step, diagnose the failures,
and design a custom harness. All generated files (progress, handoff artifacts,
sprint contracts, etc.) are stored in `.wrangler/` at your project root.

### Trigger Keywords

| Language | Keywords |
|----------|----------|
| English | "harness", "multi-agent", "feedback loop", "long-running agent", "context reset", "agent orchestration" |
| Korean | "하네스", "멀티 에이전트", "피드백 루프", "컨텍스트 리셋", "자율 코딩", "에이전트 설계" |

## Plugin Structure

```
wrangler/
├── .claude-plugin/
│   ├── plugin.json                    ← Plugin metadata
│   └── marketplace.json               ← Marketplace catalog
├── skills/
│   └── wrangler/
│       └── SKILL.md                   ← Main skill (auto-loaded by Claude Code)
├── docs/
│   ├── 01-failure-analysis.md         ← Failure mode classification framework
│   ├── 02-agent-roles.md              ← Agent role separation principles
│   ├── 03-grading-criteria.md         ← Grading criteria design guide
│   ├── 04-context-management.md       ← Context reset & handoff
│   └── 05-iterative-loop.md           ← Iteration loop design
├── templates/
│   ├── planner-system-prompt.md       ← Planner agent system prompt
│   ├── generator-system-prompt.md     ← Generator agent system prompt
│   ├── evaluator-system-prompt.md     ← Evaluator agent system prompt
│   ├── handoff-artifact.md            ← Cross-session handoff artifact
│   ├── claude-progress.md             ← Progress tracking file
│   └── sprint-contract.md             ← Sprint contract
└── tools/                             ← Optional: standalone CLI runner
    ├── harness-runner.js
    ├── tool-executor.js
    ├── context-reset.js
    └── progress-tracker.js
```

## Optional: Standalone CLI Runner

The `tools/` directory includes a standalone runner that executes a 3-agent loop
via the Anthropic API directly. This is independent of Claude Code and requires
an Anthropic API key.

```bash
cd tools && npm install

export ANTHROPIC_API_KEY=sk-ant-...

node harness-runner.js \
  --task "Real-time chat app with React + Node.js" \
  --mode fullstack \
  --iterations 8
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
