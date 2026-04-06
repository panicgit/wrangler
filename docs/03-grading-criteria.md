# Grading Criteria Design Guide

This document guides how to design grading criteria for the evaluator.
Without good grading criteria, the evaluator produces meaningless feedback loops.

---

## Core Principles

### 1. "Is it good?" Is Not a Grading Criterion

Subjective judgments must be converted into specific, verifiable questions.

| Bad Criterion | Good Criterion |
|---|---|
| "Is the code good?" | "Do all completion criteria in sprint-contract.md pass?" |
| "Is the design okay?" | "Are there no AI slop patterns (purple gradients, default fonts, etc.)?" |
| "Is usability high?" | "Can the main workflow be followed without guidance?" |

### 2. Weight Criteria Toward Model Weaknesses

Assign higher weights to areas the model struggles with (e.g., design originality, edge case handling)
rather than areas it already does well (e.g., basic code structure).

```
# Example: Full-stack app
Correctness: 40%  ← Models often leave bugs, so high weight
Completeness: 30% ← Tendency to reduce scope
Code Quality: 20%
Usability: 10%
```

### 3. Specify Score Ranges

Include score ranges with specific descriptions for each criterion.
The evaluator needs anchor points to score consistently.

```
25+ points: [Best — specific description]
15-24 points: [Middle — specific description]
14 or below: [Low — specific description]
```

### 4. Generator and Evaluator Share the Same Criteria

If the evaluator grades on criteria the generator doesn't know about, the feedback loop is inefficient.
Include the core grading criteria in sprint-contract.md so both sides share the same goals.

---

## Few-Shot Calibration

When the evaluator's judgments diverge from the criteria, add calibration examples to the prompt.

### Example 1: Overly Lenient Evaluation (Incorrect)

```
Situation: Button click causes console error, but evaluated as 
           "some issues but overall well implemented"

Correct evaluation: 
  Correctness 5/40 (blocker)
  Completeness 20/30
  Code Quality 15/20
  Usability 5/10
  → Total 45/100
```

### Example 2: Design Originality Criterion

```
Situation: Purple gradient header, Inter font, card layout

Correct evaluation: 
  Originality 8/30 (3+ AI slop patterns detected)
  → "Full redesign recommended"
```

---

## Customization Points

Modify these based on project characteristics:

1. **Weight adjustment**: Increase originality weight if P0 features are design-focused
2. **Domain-specific criteria**: Add security items for payment systems, performance items for data apps
3. **Completion criteria linkage**: Directly include sprint-contract.md checklists in grading criteria
4. **Blocker threshold adjustment**: Specify what level constitutes a blocker based on usage context

---

## Grading Criteria Authoring Checklist

```
[ ] Are all criteria specific and verifiable?
[ ] Does each score range have anchor points?
[ ] Are model weaknesses weighted higher?
[ ] Does the generator know these criteria?
[ ] Are few-shot calibration examples included?
[ ] Are blocker criteria clearly defined?
```
