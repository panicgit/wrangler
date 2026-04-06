# Failure Mode Classification Framework

After running a single agent, use this framework to classify failures.
The failure mode must be diagnosed before harness components can be determined.

## 3 Failure Categories

### 1. Direction Failure

**Symptoms:** The model is building the wrong thing entirely. There is a fundamental gap between what the user wants and what the model produces.

**Specific signals:**
- Scope is overly narrow (only half of requested features implemented)
- Core requirements were missed
- A different tech stack was chosen
- Core features left as stubs

**What to look for in logs:**
- Agent self-reducing scope ("I'll implement this simply")
- Proceeding without referencing original requirements

**Solution:** → **Add a Planner agent**
- Expand raw prompt into detailed spec
- Explicitly define feature list
- Lock generator scope with sprint contracts

---

### 2. Execution Failure

**Symptoms:** Direction is correct but problems arise during implementation.

**Specific signals:**
- Code has bugs (errors on execution)
- Features are only half-implemented
- Wiring between components is broken (entity definitions disconnected from runtime)
- Context fills up and the agent rushes to finish

**What to look for in logs:**
- Sudden "I'm done" declarations as context window fills
- Stub patterns: `TODO`, `// implement later`, `pass`
- Files from previous sessions not recognized in new sessions

**Solution:** → **Context reset** + **Evaluator agent** + **Feedback loop**
- Context reset to resolve context anxiety
- `claude-progress.txt` for cross-session state persistence
- Evaluator runs actual code to verify bugs

---

### 3. Quality Failure

**Symptoms:** Direction is correct and features work, but the output quality falls short of expectations.

**Specific signals:**
- Design is generic (white cards on purple gradients)
- User experience is rough
- Edge cases are not handled
- Agent rates its own output highly but actual quality is low

**What to look for in logs:**
- Agent self-evaluating as "excellent" without an evaluator
- Same patterns repeated across iterations with no improvement

**Solution:** → **Define grading criteria** + **Iterative evaluator loop**
- Convert subjective judgments into specific grading criteria
- Separate generator and evaluator
- Calibrate evaluator with few-shot examples

---

## Failure Mode → Harness Component Mapping

| Failure Mode | Required Component | File |
|---|---|---|
| Direction failure | Planner agent | `planner-system-prompt.md` |
| Execution failure (context) | Context reset | `context-reset.js` |
| Execution failure (bugs) | Evaluator + feedback loop | `evaluator-system-prompt.md` |
| Quality failure | Grading criteria + iteration loop | `evaluator-system-prompt.md` |

## Diagnostic Checklist

After running a single agent, verify the following:

```
[ ] Did you actually run/use the output yourself?
[ ] Are all requested features implemented?
[ ] Does it run without bugs?
[ ] Does behavior change when context fills up?
[ ] Does the agent's self-assessment match actual quality?
[ ] Are there expressions like "simply", "TODO", "later" in logs?
```

## Caution

If there are no failure modes, no harness is needed. Adding unnecessary components
only makes the harness slower and more expensive. If a single agent is sufficient, that is the best approach.
