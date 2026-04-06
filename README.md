# Wrangler — Claude Code Plugin

A Claude Code plugin for designing and running multi-agent harnesses.
Based on Anthropic's 3-agent architecture (Planner → Generator → Evaluator).

## What It Does

When you mention "harness", "multi-agent", "feedback loop", or similar terms,
Claude Code loads the wrangler skill and guides you through:

1. **Baseline measurement** — Run a single agent first, classify failures
2. **Agent role separation** — Split conflicting roles (creating vs evaluating)
3. **Grading criteria design** — Convert subjective judgments into gradable criteria
4. **Context management** — Context reset, handoff artifacts, progress tracking

## Installation

### Via Claude Code Plugin System

```bash
# If published to a marketplace:
/plugin install wrangler
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/panicgit/wrangler.git

# Copy to Claude Code plugins directory
cp -r wrangler ~/.claude/plugins/local/wrangler
```

Then enable in Claude Code:
```
/plugin enable wrangler
```

## Usage

Once installed, simply describe your task in Claude Code:

```
I need to build a full-stack chat app, but single-agent keeps failing.
Help me design a harness for this.
```

Claude Code will automatically load the wrangler skill and walk you through the design process.

### Available Skill

| Skill | Trigger |
|-------|---------|
| `wrangler` | "harness", "multi-agent", "planner-generator-evaluator", "long-running agent", "feedback loop", "context reset" |

## Plugin Structure

```
wrangler/
├── .claude-plugin/
│   └── plugin.json                    ← Plugin metadata
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

The `tools/` directory includes a standalone runner that executes the 3-agent loop
via the Anthropic API. This is independent of Claude Code.

```bash
cd tools && npm install

export ANTHROPIC_API_KEY=sk-ant-...

node harness-runner.js \
  --task "Real-time chat app with React + Node.js" \
  --mode fullstack \
  --iterations 8
```

## References

- [Harnessing Claude's Intelligence](https://claude.com/blog/harnessing-claudes-intelligence)
- [Harness Design for Long-Running Apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

## License

MIT
