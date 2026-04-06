/**
 * tool-executor.js
 *
 * Defines tool schemas for the Claude API and implements their execution.
 * All tools are sandboxed to the working directory.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join, resolve, dirname } from "path";
import { execSync } from "child_process";

// ─── Security ────────────────────────────────────────────────────────────────

const MAX_OUTPUT_BYTES = 50 * 1024; // 50KB output truncation limit

function safePath(workdir, relativePath) {
  const resolved = resolve(workdir, relativePath);
  if (!resolved.startsWith(workdir)) {
    throw new Error("Path is outside the working directory");
  }
  return resolved;
}

function truncateOutput(output) {
  if (output.length > MAX_OUTPUT_BYTES) {
    return output.slice(0, MAX_OUTPUT_BYTES) +
      "\n\n[Output truncated at 50KB. Use more specific commands to see relevant sections.]";
  }
  return output;
}

// ─── Tool Schemas ────────────────────────────────────────────────────────────

const TOOL_SCHEMAS = [
  {
    name: "bash",
    description:
      "Execute a shell command in the project working directory. " +
      "Use for: running code, installing packages, git operations, running tests, " +
      "and any general shell tasks.",
    input_schema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The shell command to execute",
        },
        timeout_ms: {
          type: "number",
          description: "Timeout in milliseconds (default: 60000, max: 300000)",
        },
      },
      required: ["command"],
    },
  },
  {
    name: "read_file",
    description:
      "Read the contents of a file. Path is relative to the working directory.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "File path relative to working directory",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description:
      "Write content to a file. Creates parent directories if needed. " +
      "Path is relative to the working directory.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "File path relative to working directory",
        },
        content: {
          type: "string",
          description: "Content to write to the file",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "list_files",
    description:
      "List files and directories at the given path. " +
      "Path is relative to the working directory.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Directory path relative to working directory (default: '.')",
        },
      },
      required: [],
    },
  },
];

// ─── Schema Exports ──────────────────────────────────────────────────────────

export function getToolSchemas() {
  return TOOL_SCHEMAS;
}

export function getToolSchemasForRole(role) {
  switch (role) {
    case "generator":
      return TOOL_SCHEMAS;
    case "evaluator":
      return TOOL_SCHEMAS.filter((t) => t.name !== "write_file");
    case "planner":
      return [];
    default:
      return TOOL_SCHEMAS;
  }
}

// ─── Tool Execution ──────────────────────────────────────────────────────────

function executeBash(command, workdir, timeoutMs = 60000) {
  const timeout = Math.min(timeoutMs, 300000);
  try {
    const output = execSync(command, {
      cwd: workdir,
      encoding: "utf-8",
      timeout,
      maxBuffer: 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { success: true, output: truncateOutput(output || "(no output)") };
  } catch (error) {
    if (error.killed) {
      return { success: false, output: `Command timed out after ${timeout}ms` };
    }
    const stderr = error.stderr || "";
    const stdout = error.stdout || "";
    return {
      success: false,
      output: truncateOutput(
        `Exit code: ${error.status}\nstdout:\n${stdout}\nstderr:\n${stderr}`
      ),
    };
  }
}

function executeReadFile(filePath, workdir) {
  try {
    const fullPath = safePath(workdir, filePath);
    if (!existsSync(fullPath)) {
      return { success: false, output: `File not found: ${filePath}` };
    }
    const content = readFileSync(fullPath, "utf-8");
    return { success: true, output: truncateOutput(content) };
  } catch (error) {
    return { success: false, output: `Error: ${error.message}` };
  }
}

function executeWriteFile(filePath, content, workdir) {
  try {
    const fullPath = safePath(workdir, filePath);
    const dir = dirname(fullPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(fullPath, content, "utf-8");
    return { success: true, output: `File written: ${filePath}` };
  } catch (error) {
    return { success: false, output: `Error: ${error.message}` };
  }
}

function executeListFiles(dirPath, workdir) {
  try {
    const fullPath = safePath(workdir, dirPath || ".");
    if (!existsSync(fullPath)) {
      return { success: false, output: `Directory not found: ${dirPath}` };
    }
    const entries = readdirSync(fullPath, { withFileTypes: true });
    const listing = entries
      .map((e) => `${e.isDirectory() ? "[dir]  " : "       "}${e.name}`)
      .join("\n");
    return { success: true, output: listing || "(empty directory)" };
  } catch (error) {
    return { success: false, output: `Error: ${error.message}` };
  }
}

// ─── Main Dispatcher ─────────────────────────────────────────────────────────

export function executeTool(name, input, workdir) {
  switch (name) {
    case "bash":
      return executeBash(input.command, workdir, input.timeout_ms);
    case "read_file":
      return executeReadFile(input.path, workdir);
    case "write_file":
      return executeWriteFile(input.path, input.content, workdir);
    case "list_files":
      return executeListFiles(input.path, workdir);
    default:
      return { success: false, output: `Unknown tool: ${name}` };
  }
}
