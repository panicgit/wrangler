# Context Handoff Artifact Template

This file defines the format of the handoff artifact that the previous agent
passes to the next agent during context reset.

The handoff artifact must contain enough information for the next agent to
understand previous work and resume immediately.
At the same time, it must not be unnecessarily long and waste context.

---

## Handoff Artifact Format

Save as `claude-handoff-[sprint-number]-[timestamp].md`.

```markdown
# Handoff Artifact — Sprint {{SPRINT_NUMBER}}

## Metadata
- Created at: {{TIMESTAMP}}
- Previous session started: {{SESSION_START}}
- Reason for stop: [Context limit / Sprint complete / Starting evaluator feedback incorporation]

---

## Project Status

### Completed Features
{{COMPLETED_FEATURES_LIST}}

### Current Sprint Progress
**Sprint {{SPRINT_NUMBER}}** — {{SPRINT_COMPLETION_PERCENTAGE}}% complete
- [x] {{COMPLETED_IN_THIS_SPRINT}}
- [ ] {{REMAINING_IN_THIS_SPRINT}} ← Stopped here

### Exact Stopping Point
{{EXACT_STOPPING_POINT}}
(e.g., "Implementing avatar upload in UserProfile component. 
File picker UI is complete, S3 upload logic not yet implemented")

---

## Environment Info

### Directory Structure
\`\`\`
{{KEY_DIRECTORY_STRUCTURE}}
\`\`\`

### How to Run
\`\`\`bash
{{HOW_TO_RUN}}
\`\`\`

### Key Config Files
- {{CONFIG_FILE_1}}: {{WHAT_IT_DOES}}
- {{CONFIG_FILE_2}}: {{WHAT_IT_DOES}}

---

## Known Issues and Decisions

### Issues to Resolve
{{KNOWN_ISSUES}}

### Technical Decisions (with rationale)
{{TECHNICAL_DECISIONS_WITH_REASONS}}
(e.g., "Chose Zustand over Redux — state structure is simple and 
wanted to reduce bundle size")

---

## Evaluator Feedback Summary
(if available)

Latest feedback: {{LATEST_EVAL_SCORE}} / 100
- Key issues raised: {{MAIN_ISSUES}}
- Changes applied: {{APPLIED_CHANGES}}
- Not yet applied: {{PENDING_CHANGES}}

---

## What the Next Agent Should Do

### Start Immediately
1. {{IMMEDIATE_NEXT_STEP}}
2. {{SECOND_STEP}}

### Goal for This Session
{{SESSION_GOAL}}
(e.g., "Complete Sprint 2 — implement full user auth flow and pass evaluator tests")

### Files to Reference
- `sprint-contract.md` — Check Sprint {{SPRINT_NUMBER}} completion criteria
- `feature-list.md` — Overall feature status
- `evaluator-feedback.md` — Latest evaluator feedback (if exists)
```

---

## Good Handoff vs Bad Handoff

### Good Handoff Example

```markdown
## Exact Stopping Point
Implementing createPaymentIntent() in payment.service.ts.
Stripe API call code is complete, error handling not yet done.
Code to call this function from PaymentController also needs to be written.

## Start Immediately
1. Open src/services/payment.service.ts
2. Complete the try-catch block in createPaymentIntent()
3. Add POST /payments endpoint to PaymentController
```

### Bad Handoff Example

```markdown
## Exact Stopping Point
Was working on payment feature. Almost done.

## Next Steps
Finish payment and continue with the rest.
```

---

## Automation Points

`context-reset.js` auto-generates handoff artifacts based on this template.
However, the following items must be filled in by the agent:
- Exact stopping point (only the agent knows this)
- Technical decisions and rationale (information in context)
- Known issues (discovered during execution)
