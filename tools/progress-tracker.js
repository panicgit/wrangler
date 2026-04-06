/**
 * progress-tracker.js
 *
 * Manages the claude-progress.txt file.
 * This file serves as the "shared memory" of the harness.
 * All agent sessions read and write to this file to share state.
 *
 * claude-progress.txt should contain only concise, actionable information
 * so the next agent can quickly understand the current state.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

export class ProgressTracker {
  constructor(workdir) {
    this.workdir = workdir;
    this.filepath = join(workdir, "claude-progress.txt");
  }

  /**
   * Creates the initial claude-progress.txt
   */
  initialize(task) {
    if (existsSync(this.filepath)) {
      console.log("[Progress Tracker] claude-progress.txt already exists, keeping it");
      return;
    }

    const initialContent = this.buildInitialContent(task);
    writeFileSync(this.filepath, initialContent, "utf-8");
    console.log("[Progress Tracker] claude-progress.txt initialized");
  }

  /**
   * Reads and returns the current progress state
   */
  read() {
    if (!existsSync(this.filepath)) return null;
    return readFileSync(this.filepath, "utf-8");
  }

  /**
   * Partially updates the progress state
   * @param {Object} updates - Sections and content to update
   */
  update(updates) {
    let content = this.read();
    if (!content) {
      console.warn("[Progress Tracker] claude-progress.txt not found.");
      return;
    }

    // Apply each update item to the content
    if (updates.completedFeature) {
      content = this.appendCompletedFeature(content, updates.completedFeature);
    }

    if (updates.currentSprint) {
      content = this.updateCurrentSprint(content, updates.currentSprint);
    }

    if (updates.nextStep) {
      content = this.updateNextStep(content, updates.nextStep);
    }

    if (updates.knownIssue) {
      content = this.appendKnownIssue(content, updates.knownIssue);
    }

    if (updates.evalScore) {
      content = this.appendEvalScore(content, updates.evalScore);
    }

    writeFileSync(this.filepath, content, "utf-8");
  }

  /**
   * Returns a progress summary (for logging)
   */
  getSummary() {
    const content = this.read();
    if (!content) return "No progress state";

    const completedMatch = content.match(/## Completed Features([\s\S]*?)## Current Sprint/);
    const nextMatch = content.match(/## Next Steps\n([^\n]+)/);
    const scoreMatch = content.match(/Latest score: (\d+)\/100/);

    return {
      completed: completedMatch ? completedMatch[1].trim() : "none",
      nextStep: nextMatch ? nextMatch[1] : "undetermined",
      lastScore: scoreMatch ? parseInt(scoreMatch[1]) : null,
    };
  }

  // ─── Internal Parsing Methods ─────────────────────────────────────────────

  appendCompletedFeature(content, featureName) {
    const timestamp = new Date().toISOString();
    const entry = `- [x] ${featureName} (completed: ${timestamp})`;

    if (content.includes("## Completed Features\n(none)")) {
      return content.replace("## Completed Features\n(none)", `## Completed Features\n${entry}`);
    }

    return content.replace(
      /## Completed Features\n([\s\S]*?)## Current Sprint/,
      (match, existing) =>
        `## Completed Features\n${existing.trim()}\n${entry}\n\n## Current Sprint`
    );
  }

  updateCurrentSprint(content, sprintInfo) {
    const sprintSection = `## Current Sprint\n${sprintInfo}`;
    return content.replace(
      /## Current Sprint\n[\s\S]*?(?=## Next Steps)/,
      `${sprintSection}\n\n`
    );
  }

  updateNextStep(content, nextStep) {
    return content.replace(
      /## Next Steps\n[^\n]*/,
      `## Next Steps\n${nextStep}`
    );
  }

  appendKnownIssue(content, issue) {
    const timestamp = new Date().toISOString();
    const entry = `- [${timestamp}] ${issue}`;

    if (content.includes("## Known Issues\n(none)")) {
      return content.replace("## Known Issues\n(none)", `## Known Issues\n${entry}`);
    }

    return content.replace(
      /## Known Issues\n([\s\S]*?)(?=##|$)/,
      (match, existing) =>
        `## Known Issues\n${existing.trim()}\n${entry}\n\n`
    );
  }

  appendEvalScore(content, scoreInfo) {
    const { score, iteration } = scoreInfo;
    const timestamp = new Date().toISOString();
    const entry = `- Iteration ${iteration}: ${score}/100 (${timestamp})`;

    if (content.includes("## Evaluator Score History")) {
      return content.replace(
        /## Evaluator Score History\n([\s\S]*?)(?=##|$)/,
        (match, existing) =>
          `## Evaluator Score History\n${existing.trim()}\n${entry}\n\n`
      );
    }

    return content + `\n## Evaluator Score History\n${entry}\n`;
  }

  buildInitialContent(task) {
    const timestamp = new Date().toISOString();

    return `# Project Progress

## Metadata
- Started at: ${timestamp}
- Project: ${task}
- Current sprint: 1

---

## Completed Features
(none)

---

## Current Sprint
**Sprint 1 in progress**
See sprint-contract.md

---

## Next Steps
Read feature-list.md and sprint-contract.md, then start implementing the first feature of Sprint 1

---

## Known Issues
(none)

---

## Environment Info
- Tech stack: See sprint-contract.md
- How to run: (fill after implementation)
- Main entry point: (fill after implementation)

---

## Evaluator Score History
(none yet)
`;
  }
}
