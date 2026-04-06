# Iteration Loop Design

This document guides how to design the feedback loop between Generator and Evaluator.
This loop is the core of the harness — it enables self-improvement that a single agent cannot achieve.

---

## Basic Loop Structure

```
[Generator] → Produce output
     ↓
[Evaluator] → Grade + specific feedback
     ↓
  Score >= target?
     ├── Yes → Next sprint or terminate
     └── No  → Pass feedback to Generator → Repeat
```

---

## Setting Iteration Count

### Recommended Ranges

| Task Complexity | Iterations | Rationale |
|---|---|---|
| Simple (single feature) | 3-5 | If not converging in 3, revisit grading criteria |
| Medium (MVP app) | 5-10 | Including sprint transitions |
| Complex (full-stack app) | 10-15 | 3+ sprint transitions, gradual quality improvement |

### Beyond 15 Is Inefficient

When iterations exceed 15:
- Costs increase rapidly
- Same feedback is likely being repeated
- Modifying grading criteria or system prompts is more effective

---

## Sprint Transitions

### Transition Criteria

Transition to the next sprint when evaluator score reaches **80 points or above**.

```
Iteration 1: Score 45/100 → Incorporate feedback → Continue
Iteration 2: Score 62/100 → Incorporate feedback → Continue
Iteration 3: Score 78/100 → Incorporate feedback → Continue
Iteration 4: Score 85/100 → Transition to Sprint 2
```

### What Happens at Transition
1. Context reset (generate handoff artifact)
2. Update claude-progress.txt
3. Start next sprint in new agent session

### Adjusting the Threshold

- **80 points**: Default. Core features work with no major bugs.
- **90 points**: For high quality requirements. More iterations but higher output quality.
- **70 points**: When speed is priority. Complete MVP first, improve quality later.

---

## Termination Conditions

Conditions for terminating the harness loop:

1. **Goal achieved**: All P0 features in feature-list.md completed + final score 80+
2. **Iteration limit reached**: Maximum configured iterations exhausted
3. **Convergence plateau**: Score changes within 5 points for 3 consecutive iterations

### Handling Convergence Plateau

When scores plateau, continuing the loop is pointless.

```
Iteration 5: 62 points
Iteration 6: 65 points  ← +3
Iteration 7: 63 points  ← -2
→ Convergence plateau. Stop loop and analyze root cause.
```

Response by cause:
- **Grading criteria are vague** → Make criteria more specific and add few-shot examples
- **Generator doesn't understand feedback** → Change feedback format to be more specific
- **Fundamental approach is wrong** → Accept when evaluator recommends "full redesign"

---

## Feedback Delivery

### Effective Feedback (Evaluator → Generator)

```markdown
## Blocker Issues (Fix Immediately)
- src/api/payment.ts:42 — createPaymentIntent() does not catch 
  Stripe API errors. App crashes on invalid card number input.
  Fix: Add try-catch + display error message to user

## Strategic Suggestions for Next Iteration
Maintain current direction. Fix 1 blocker then re-verify payment flow.
```

### Ineffective Feedback

```markdown
## Issues
- Error handling is insufficient
- Overall improvement is needed
```

---

## Anti-Patterns

### 1. Infinite Loop

If the evaluator keeps adding new requirements each time, it never ends.
→ The evaluator must only evaluate against sprint-contract.md completion criteria.

### 2. Score Inflation

Evaluators tend to become more lenient as iterations progress.
→ Include "Iteration N — evaluate more strictly than before" in the prompt.

### 3. Feedback Ignored

Generator ignores evaluator feedback and implements something else.
→ Deliver feedback as a user message rather than system prompt (higher priority).
