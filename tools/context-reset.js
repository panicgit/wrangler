/**
 * context-reset.js
 *
 * Manages context resets between sessions.
 * Saves the previous agent's state as a handoff artifact
 * so a new agent can resume the work.
 *
 * Context Reset vs Compaction:
 * - Compaction: Same agent continues with summarized history (continuity preserved, context anxiety remains)
 * - Context Reset: Brand new agent reads handoff artifact and starts fresh (clean slate)
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

export class ContextResetter {
  constructor(workdir) {
    this.workdir = workdir;
  }

  /**
   * Creates a handoff artifact.
   * @param {number} sprintNumber - Current sprint number
   * @param {number} iterationNumber - Current iteration number
   */
  async createHandoff(sprintNumber, iterationNumber) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `claude-handoff-sprint${sprintNumber}-iter${iterationNumber}-${timestamp}.md`;

    const progress = this.readFile("claude-progress.txt");
    const evalFeedback = this.readFile("evaluator-feedback.md");
    const gitLog = this.getGitLog();
    const dirStructure = this.getDirectoryStructure();

    const handoff = this.buildHandoffContent({
      sprintNumber,
      iterationNumber,
      timestamp: new Date().toISOString(),
      progress,
      evalFeedback,
      gitLog,
      dirStructure,
    });

    this.writeFile(filename, handoff);
    console.log(`[Context Reset] Handoff artifact created: ${filename}`);

    return filename;
  }

  /**
   * Reads the most recent handoff artifact to construct initial context for a new agent.
   */
  getLatestHandoff() {
    const files = existsSync(this.workdir)
      ? readdirSync(this.workdir).filter((f) => f.startsWith("claude-handoff-"))
      : [];

    if (files.length === 0) return null;

    // Return most recent file
    const latest = files.sort().at(-1);
    return this.readFile(latest);
  }

  /**
   * Builds the initialization message for a new agent session.
   * harness-runner.js uses this as the generator's first user message.
   */
  buildInitialMessage(sprintNumber, evalFeedback = null) {
    const latestHandoff = this.getLatestHandoff();
    const progress = this.readFile("claude-progress.txt");
    const featureList = this.readFile("feature-list.md");
    const sprintContract = this.readFile("sprint-contract.md");

    let message = `# New Agent Session Start — Sprint ${sprintNumber}

## Important: You are resuming previous agent's work

Read the following files and start working immediately.
You have no prior context, but the handoff artifact contains all necessary information.
`;

    if (latestHandoff) {
      message += `\n## Handoff Artifact\n${latestHandoff}\n`;
    }

    if (progress) {
      message += `\n## Current Progress (claude-progress.txt)\n${progress}\n`;
    }

    if (featureList) {
      message += `\n## Feature List\n${featureList}\n`;
    }

    if (sprintContract) {
      message += `\n## Sprint Contract\n${sprintContract}\n`;
    }

    if (evalFeedback) {
      message += `\n## Evaluator Feedback (Must Address)\n${evalFeedback}\n`;
    }

    message += `\n## Start Now
1. Check the "What the Next Agent Should Do" section in the handoff artifact above
2. Resume implementation from the stopping point
3. Update claude-progress.txt when each feature is complete
4. Signal completion when all sprint completion criteria are met
`;

    return message;
  }

  // ─── Helper Methods ───────────────────────────────────────────────────────

  readFile(filename) {
    const path = join(this.workdir, filename);
    return existsSync(path) ? readFileSync(path, "utf-8") : null;
  }

  writeFile(filename, content) {
    writeFileSync(join(this.workdir, filename), content, "utf-8");
  }

  getGitLog() {
    try {
      return execSync("git log --oneline -10", {
        cwd: this.workdir,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch {
      return "No git history";
    }
  }

  getDirectoryStructure() {
    try {
      return execSync("find . -type f -not -path './.git/*' | head -30", {
        cwd: this.workdir,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch {
      return "Failed to read directory structure";
    }
  }

  buildHandoffContent({
    sprintNumber,
    iterationNumber,
    timestamp,
    progress,
    evalFeedback,
    gitLog,
    dirStructure,
  }) {
    return `# Handoff Artifact — Sprint ${sprintNumber} / Iteration ${iterationNumber}

## Metadata
- Created at: ${timestamp}
- Sprint: ${sprintNumber}
- Iteration: ${iterationNumber}

---

## Current Progress
${progress || "No claude-progress.txt found"}

---

## Latest Evaluator Feedback
${evalFeedback || "No feedback"}

---

## Git History (Last 10)
\`\`\`
${gitLog}
\`\`\`

---

## File Structure
\`\`\`
${dirStructure}
\`\`\`

---

## For the Next Agent
Read this handoff artifact and resume work.
Start from the "Next Steps" section in claude-progress.txt.
If evaluator feedback exists, it must be addressed.
`;
  }
}
