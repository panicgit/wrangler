#!/usr/bin/env node

/**
 * harness-runner.js
 *
 * Main orchestrator for the harness engineering plugin.
 * Runs the Planner → Generator → Evaluator 3-agent loop.
 *
 * Usage:
 *   node harness-runner.js --task "task description" [options]
 *
 * Options:
 *   --task        <string>  Task description (required)
 *   --mode        <string>  Execution mode: design | fullstack | custom (default: fullstack)
 *   --iterations  <number>  Evaluator iteration count (default: 5, max: 15)
 *   --model       <string>  Claude model to use (default: claude-sonnet-4-5)
 *   --workdir     <string>  Working directory (default: ./workspace)
 *   --skip-planner          Skip planner and use existing feature-list.md
 *
 * Environment variables:
 *   ANTHROPIC_API_KEY  Anthropic API key (required)
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, resolve } from "path";
import { execSync } from "child_process";
import { parseArgs } from "util";
import { ProgressTracker } from "./progress-tracker.js";
import { ContextResetter } from "./context-reset.js";
import { getToolSchemasForRole, executeTool } from "./tool-executor.js";

// ─── Argument Parsing ────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    task: { type: "string" },
    mode: { type: "string", default: "fullstack" },
    iterations: { type: "string", default: "5" },
    model: { type: "string", default: "claude-sonnet-4-5" },
    workdir: { type: "string", default: "./workspace" },
    "skip-planner": { type: "boolean", default: false },
  },
});

if (!args.task) {
  console.error("Error: --task argument is required.");
  console.error(
    "  Usage: node harness-runner.js --task \"what to build\" --mode fullstack"
  );
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY environment variable is not set.");
  process.exit(1);
}

const CONFIG = {
  task: args.task,
  mode: args.mode,
  iterations: Math.min(parseInt(args.iterations), 15),
  model: args.model,
  workdir: resolve(args.workdir),
  skipPlanner: args["skip-planner"],
};

const DOCS_DIR = new URL("../docs", import.meta.url).pathname;
const TEMPLATES_DIR = new URL("../templates", import.meta.url).pathname;

// ─── Anthropic Client ────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── File Loaders ────────────────────────────────────────────────────────────

function loadDoc(filename) {
  const path = join(DOCS_DIR, filename);
  if (!existsSync(path)) {
    console.error(`Error: Doc file not found: ${path}`);
    process.exit(1);
  }
  return readFileSync(path, "utf-8");
}

function loadTemplate(filename) {
  const path = join(TEMPLATES_DIR, filename);
  if (!existsSync(path)) {
    console.error(`Error: Template file not found: ${path}`);
    process.exit(1);
  }
  return readFileSync(path, "utf-8");
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function log(emoji, message) {
  const timestamp = new Date().toLocaleTimeString("en-US");
  console.log(`[${timestamp}] ${emoji} ${message}`);
}

function readWorkFile(filename) {
  const path = join(CONFIG.workdir, filename);
  return existsSync(path) ? readFileSync(path, "utf-8") : null;
}

function writeWorkFile(filename, content) {
  const path = join(CONFIG.workdir, filename);
  writeFileSync(path, content, "utf-8");
}

function extractTextContent(response) {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

// ─── Agent Runner ────────────────────────────────────────────────────────────

const MAX_TOOL_STEPS = 100;

/**
 * Runs a Claude agent with optional tool use (agentic loop).
 * If tools are provided, loops until the agent stops calling tools.
 * @param {string} systemPrompt - Agent system prompt
 * @param {string} userMessage - User message
 * @param {Object} options - Additional options
 */
async function runAgent(systemPrompt, userMessage, options = {}) {
  const {
    agentName = "Agent",
    maxTokens = 8192,
    tools = [],
    workdir = null,
  } = options;

  log("🤖", `Running ${agentName}...`);

  const messages = [{ role: "user", content: userMessage }];
  let stepCount = 0;

  try {
    while (true) {
      const apiParams = {
        model: CONFIG.model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
      };
      if (tools.length > 0) {
        apiParams.tools = tools;
      }

      const response = await anthropic.messages.create(apiParams);

      // If no tools or agent is done, return text
      const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");

      if (tools.length === 0 || toolUseBlocks.length === 0 || response.stop_reason === "end_turn") {
        log("✅", `${agentName} complete (${stepCount} tool calls)`);
        return extractTextContent(response);
      }

      // Execute each tool call
      messages.push({ role: "assistant", content: response.content });
      const toolResults = [];

      for (const block of toolUseBlocks) {
        stepCount++;
        const inputPreview = block.name === "bash"
          ? block.input.command?.slice(0, 80)
          : block.input.path || "";
        log("🔧", `[${agentName}] Step ${stepCount}: ${block.name}(${inputPreview})`);

        const result = executeTool(block.name, block.input, workdir);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result.output,
          ...(result.success ? {} : { is_error: true }),
        });
      }

      messages.push({ role: "user", content: toolResults });

      // Safety valve
      if (stepCount >= MAX_TOOL_STEPS) {
        log("⚠️", `${agentName}: Tool call limit (${MAX_TOOL_STEPS}) reached, forcing final response`);
        messages.push({
          role: "user",
          content: "Tool call limit reached. Provide your final summary now.",
        });
        const finalResponse = await anthropic.messages.create({
          model: CONFIG.model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages,
        });
        return extractTextContent(finalResponse);
      }
    }
  } catch (error) {
    console.error(`Error: ${agentName} failed:`, error.message);
    throw error;
  }
}

// ─── Planner Agent ───────────────────────────────────────────────────────────

async function runPlanner() {
  log("📋", "Starting Planner agent...");

  const plannerSkill = loadTemplate("planner-system-prompt.md");
  const systemPrompt = `
You are a planner agent for a software project.
Your role is to expand the user's brief idea into a detailed spec
that the generator agent can implement.

${plannerSkill}

## Output Instructions
You must write a response that includes these two sections:
1. Starting with "=== FEATURE-LIST.MD ===" — the feature list
2. Starting with "=== SPRINT-CONTRACT.MD ===" — the sprint contract
`;

  const userMessage = `
Please write the feature list and sprint contract for the following project.

Project description:
${CONFIG.task}

Execution mode: ${CONFIG.mode}
`;

  const response = await runAgent(systemPrompt, userMessage, {
    agentName: "Planner",
    maxTokens: 4096,
  });

  // Parse file contents from response
  const featureListMatch = response.match(
    /=== FEATURE-LIST\.MD ===([\s\S]*?)(?==== SPRINT-CONTRACT\.MD ===|$)/
  );
  const sprintContractMatch = response.match(
    /=== SPRINT-CONTRACT\.MD ===([\s\S]*?)$/
  );

  if (featureListMatch) {
    writeWorkFile("feature-list.md", featureListMatch[1].trim());
    log("📄", "feature-list.md created");
  }

  if (sprintContractMatch) {
    writeWorkFile("sprint-contract.md", sprintContractMatch[1].trim());
    log("📄", "sprint-contract.md created");
  }

  return response;
}

// ─── Generator Agent ─────────────────────────────────────────────────────────

async function runGenerator(sprintNumber, evalFeedback = null) {
  log("⚙️", `Starting Generator agent (Sprint ${sprintNumber})...`);

  const generatorSkill = loadTemplate("generator-system-prompt.md");
  const handoffTemplate = loadTemplate("handoff-artifact.md");
  const progress = readWorkFile("claude-progress.txt") || "No progress state";
  const featureList = readWorkFile("feature-list.md") || "";
  const sprintContract = readWorkFile("sprint-contract.md") || "";

  const systemPrompt = `
You are a software development agent.
${generatorSkill}

## Available Tools
You have access to bash, read_file, write_file, and list_files tools.
Use them to implement the project:
- Use bash for: running commands, installing packages, git commits, running tests
- Use write_file for: creating and editing source files
- Use read_file for: reading existing files to understand current state
- Use list_files for: exploring the project structure

Always work within the project working directory.
Commit completed features with: git commit -m "feat: [feature name]"
Update claude-progress.txt when each feature is complete.
Do NOT leave TODO stubs — implement fully.

## Current Progress
${progress}

## Handoff Format (use when approaching context limit)
${handoffTemplate}
`;

  let userMessage = `
Please proceed with Sprint ${sprintNumber} using the following files.

## Feature List
${featureList}

## Sprint Contract
${sprintContract}

## Current Progress
${progress}
`;

  if (evalFeedback) {
    userMessage += `
## Evaluator Feedback (Must Address)
${evalFeedback}
`;
  }

  const response = await runAgent(systemPrompt, userMessage, {
    agentName: `Generator (Sprint ${sprintNumber})`,
    maxTokens: 16384,
    tools: getToolSchemasForRole("generator"),
    workdir: CONFIG.workdir,
  });

  return response;
}

// ─── Evaluator Agent ─────────────────────────────────────────────────────────

async function runEvaluator(iteration) {
  log("🔍", `Starting Evaluator agent (Iteration ${iteration}/${CONFIG.iterations})...`);

  const evaluatorSkill = loadTemplate("evaluator-system-prompt.md");
  const progress = readWorkFile("claude-progress.txt") || "";
  const sprintContract = readWorkFile("sprint-contract.md") || "";

  // Select grading criteria by mode
  const modeSection =
    CONFIG.mode === "design"
      ? "### Mode B: Frontend Design"
      : "### Mode A: Full-Stack Software";

  const systemPrompt = `
You are a strict quality evaluation agent.
You independently evaluate the output produced by the generator agent.
Resist the tendency to be lenient when evaluating LLM-generated output.

${evaluatorSkill}

Grading criteria to apply: ${modeSection}

## Available Tools
You have access to bash, read_file, and list_files tools.
Use them to verify the implementation:
- Use bash to: run the application, execute tests, check for errors
- Use read_file to: inspect source code, check file contents
- Use list_files to: verify project structure

## Verification Process
1. Use list_files to see the project structure
2. Use read_file to check key files
3. Use bash to run the application and tests
4. Compare results against sprint-contract.md completion criteria
5. Write your evaluation in the response text (not via write_file)
`;

  const userMessage = `
Please evaluate the current implementation state based on the following information.

## Sprint Contract (Completion Criteria)
${sprintContract}

## Current Progress
${progress}

## Evaluation Instructions
1. Actually run the code to verify behavior
2. Verify sprint contract completion criteria one by one
3. Write results in evaluator-feedback.md format

Iteration ${iteration}/${CONFIG.iterations} — evaluate more strictly than before.
`;

  const response = await runAgent(systemPrompt, userMessage, {
    agentName: `Evaluator (Iteration ${iteration})`,
    maxTokens: 16384,
    tools: getToolSchemasForRole("evaluator"),
    workdir: CONFIG.workdir,
  });

  writeWorkFile("evaluator-feedback.md", response);
  log("📊", `Evaluator feedback saved (Iteration ${iteration})`);

  return response;
}

// ─── Score Parsing ───────────────────────────────────────────────────────────

function parseScore(feedback) {
  const scoreMatch = feedback.match(/Overall Score[:\s]+(\d+)\s*\/\s*100/);
  return scoreMatch ? parseInt(scoreMatch[1]) : null;
}

// ─── Main Harness Loop ──────────────────────────────────────────────────────

async function main() {
  log("🚀", "Harness engineering started");
  log("📌", `Task: ${CONFIG.task}`);
  log("⚙️", `Mode: ${CONFIG.mode} | Iterations: ${CONFIG.iterations} | Model: ${CONFIG.model}`);

  // Create working directory
  if (!existsSync(CONFIG.workdir)) {
    mkdirSync(CONFIG.workdir, { recursive: true });
    log("📁", `Working directory created: ${CONFIG.workdir}`);
  }

  const tracker = new ProgressTracker(CONFIG.workdir);
  const resetter = new ContextResetter(CONFIG.workdir);

  const startTime = Date.now();

  try {
    // ── Phase 1: Planner ───────────────────────────────────────────────────
    if (!CONFIG.skipPlanner) {
      log("─".repeat(50), "");
      log("📋", "Phase 1: Planner Agent");
      await runPlanner();
    } else {
      log("⏭️", "Planner skipped (using existing feature-list.md)");
    }

    // Initialize progress state
    tracker.initialize(CONFIG.task);

    // ── Phase 2: Generator + Evaluator Loop ────────────────────────────────
    log("─".repeat(50), "");
    log("🔄", "Phase 2: Generator-Evaluator loop starting");

    let currentSprint = 1;
    let evalFeedback = null;
    let bestScore = 0;

    for (let i = 1; i <= CONFIG.iterations; i++) {
      log("─".repeat(30), "");
      log("🔄", `Iteration ${i}/${CONFIG.iterations}`);

      // Run generator
      const generatorOutput = await runGenerator(currentSprint, evalFeedback);
      tracker.update({ lastGeneratorOutput: generatorOutput.slice(0, 500) });

      // Run evaluator
      evalFeedback = await runEvaluator(i);
      const score = parseScore(evalFeedback);

      if (score !== null) {
        log("📊", `Current score: ${score}/100`);
        if (score > bestScore) {
          bestScore = score;
          log("⭐", `New best score: ${bestScore}/100`);
        }

        // Sprint transition on high score
        if (score >= 80) {
          currentSprint++;
          log("🎯", `Transitioning to Sprint ${currentSprint} (score: ${score})`);
        }
      }

      // Create context reset artifact
      if (i < CONFIG.iterations) {
        await resetter.createHandoff(currentSprint, i);
      }
    }

    // ── Completion Summary ─────────────────────────────────────────────────
    const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
    log("─".repeat(50), "");
    log("🎉", "Harness execution complete!");
    log("⏱️", `Total time: ${elapsed} minutes`);
    log("⭐", `Final best score: ${bestScore}/100`);
    log("📁", `Output location: ${CONFIG.workdir}`);
  } catch (error) {
    console.error("Error during harness execution:", error);
    process.exit(1);
  }
}

main();
