# Context Reset & Handoff

This document guides how to explicitly manage context windows in long-running agents.
When context fills up, model behavior changes — this must not be left unmanaged.

---

## What Happens When Context Fills Up

1. **Rushing**: "I'll implement the rest simply" → Sudden increase in TODOs/stubs
2. **Forgetting**: Ignores architecture decisions made earlier, implements differently
3. **Repeating**: Repeats the same mistakes or re-solves already-solved problems
4. **Overconfidence**: Declares "completed" on work that isn't finished

---

## Context Reset vs Compaction

| | Context Reset | Compaction |
|---|---|---|
| **Method** | New agent reads handoff artifact and starts fresh | Same agent continues with summarized history |
| **Context state** | Clean slate | Summarized prior context remains |
| **Pros** | Resolves context anxiety, consistent quality | Maintains continuity |
| **Cons** | Handoff cost, potential information loss | Important info may be lost in summarization, context anxiety persists |
| **Recommended for** | Long-running tasks (3+ sprints) | Small tasks within a single session |

**Recommendation**: Use context reset for long-running tasks.
Compaction creates a state where the model "did something before but can't quite remember,"
which can trigger uncertain behavior.

---

## claude-progress.txt — Shared Memory

The central state file that all agent sessions read and write to.

### What to Include
- Completed feature list (with timestamps)
- Current sprint progress
- Next steps (specific, immediately actionable items)
- Known issues
- Evaluator score history
- Environment info (tech stack, how to run)

### What NOT to Include
- Conversation history
- Trial-and-error process
- Previous agent's reasoning chain

**Principle**: The next agent should be able to understand current state within 10 seconds.

> Template: `templates/claude-progress.md`

---

## Handoff Artifact

A detailed document the previous agent passes to the next agent during context reset.
Contains richer information than claude-progress.txt.

### Must Include in Handoff

1. **Exact stopping point**: Which function in which file, doing what, when stopped
2. **Environment info**: Directory structure, how to run, config files
3. **Technical decisions and rationale**: Why this stack/pattern was chosen
4. **Known issues**: Problems discovered during execution
5. **Next steps**: Specific actions to start immediately

### Good Handoff vs Bad Handoff

**Good example**:
> "Implementing createPaymentIntent() in payment.service.ts.
> Stripe API call code is complete, error handling not yet implemented.
> Code to call this function from PaymentController also needs to be written."

**Bad example**:
> "Was implementing payment feature. Almost done."

> Template: `templates/handoff-artifact.md`

---

## Initializer Pattern

Standardizes the first action of a new agent session.

```
1. Read claude-progress.txt → Understand current state
2. Check git log → Understand recent changes
3. Read evaluator-feedback.md (if exists) → Plan feedback incorporation
4. Check incomplete features in current sprint → Start work
```

Include this sequence in the generator system prompt
so every session starts the same way.

---

## Context Reset Timing

### Automatic Reset (Recommended)
- After each sprint completion
- Before incorporating evaluator feedback

### Manual Reset
- When context usage exceeds 80%
- When signs of rushing or repetition appear

> Automation: `tools/context-reset.js`
