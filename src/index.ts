#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, realpathSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configuration interface
export interface CodecovConfig {
  baseUrl: string;
  token?: string;
}

// Log configuration warnings without blocking server startup
export function logConfigurationWarnings(): void {
  const baseUrl = process.env.CODECOV_BASE_URL;

  if (baseUrl && !baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    console.error("WARNING: CODECOV_BASE_URL must start with http:// or https://");
    console.error(`Received: ${baseUrl}`);
    console.error("Tools will fail at execution time if this URL is invalid.");
  }

  if (baseUrl && baseUrl.startsWith("http://")) {
    console.warn("WARNING: Using insecure HTTP connection. Consider using HTTPS.");
  }
}

// Parse configuration from environment variables
export function getConfig(): CodecovConfig {
  const baseUrl = process.env.CODECOV_BASE_URL || "https://codecov.io";
  const token = process.env.CODECOV_TOKEN;

  return { baseUrl, token };
}

/**
 * Validates configuration at tool execution time
 * Returns error message if invalid, undefined if valid
 */
function validateConfigForExecution(config: CodecovConfig): string | undefined {
  if (!config.baseUrl.startsWith("http://") && !config.baseUrl.startsWith("https://")) {
    return `Invalid CODECOV_BASE_URL: "${config.baseUrl}". Must start with http:// or https://.\n\nPlease set a valid CODECOV_BASE_URL environment variable.`;
  }
  return undefined;
}

// Codecov API client
export class CodecovClient {
  private baseUrl: string;
  private token?: string;

  constructor(config: CodecovConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.token = config.token;
  }

  private async fetch(path: string): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Accept": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `bearer ${this.token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Codecov API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getFileCoverage(owner: string, repo: string, filePath: string, ref?: string): Promise<any> {
    const refParam = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    const encodedPath = encodeURIComponent(filePath);
    return this.fetch(`/api/v2/gh/${owner}/repos/${repo}/file_report/${encodedPath}${refParam}`);
  }

  async getCommitCoverage(owner: string, repo: string, commitSha: string): Promise<any> {
    return this.fetch(`/api/v2/gh/${owner}/repos/${repo}/commits/${commitSha}`);
  }

  async getRepoCoverage(owner: string, repo: string, branch?: string): Promise<any> {
    const branchParam = branch ? `?branch=${encodeURIComponent(branch)}` : "";
    return this.fetch(`/api/v2/gh/${owner}/repos/${repo}${branchParam}`);
  }
}

// Define available tools
const TOOLS: Tool[] = [
  {
    name: "get_file_coverage",
    description: "Get line-by-line coverage data for a specific file in a repository. Returns coverage percentages and line-level hit/miss information.",
    inputSchema: {
      type: "object",
      properties: {
        owner: {
          type: "string",
          description: "Repository owner (username or organization)",
        },
        repo: {
          type: "string",
          description: "Repository name",
        },
        file_path: {
          type: "string",
          description: "Path to the file within the repository (e.g., 'src/index.ts')",
        },
        ref: {
          type: "string",
          description: "Git reference (branch, tag, or commit SHA). Defaults to default branch if not specified.",
        },
      },
      required: ["owner", "repo", "file_path"],
    },
  },
  {
    name: "get_commit_coverage",
    description: "Get coverage data for a specific commit, including overall coverage percentage and file-level changes.",
    inputSchema: {
      type: "object",
      properties: {
        owner: {
          type: "string",
          description: "Repository owner (username or organization)",
        },
        repo: {
          type: "string",
          description: "Repository name",
        },
        commit_sha: {
          type: "string",
          description: "Commit SHA to get coverage for",
        },
      },
      required: ["owner", "repo", "commit_sha"],
    },
  },
  {
    name: "get_repo_coverage",
    description: "Get overall coverage statistics for a repository, optionally for a specific branch.",
    inputSchema: {
      type: "object",
      properties: {
        owner: {
          type: "string",
          description: "Repository owner (username or organization)",
        },
        repo: {
          type: "string",
          description: "Repository name",
        },
        branch: {
          type: "string",
          description: "Branch name (defaults to repository's default branch)",
        },
      },
      required: ["owner", "repo"],
    },
  },
];

// Define available prompts
const PROMPTS = [
  {
    name: "analyze_coverage",
    title: "Analyze Repository Coverage",
    description: "Get comprehensive coverage analysis for a repository",
    arguments: [
      {
        name: "owner",
        description: "Repository owner (username or organization)",
        required: true
      },
      {
        name: "repo",
        description: "Repository name",
        required: true
      },
      {
        name: "branch",
        description: "Branch name (optional, defaults to default branch)",
        required: false
      }
    ]
  },
  {
    name: "compare_commits",
    title: "Compare Coverage Between Commits",
    description: "Compare coverage changes between two commits",
    arguments: [
      {
        name: "owner",
        description: "Repository owner",
        required: true
      },
      {
        name: "repo",
        description: "Repository name",
        required: true
      },
      {
        name: "base_commit",
        description: "Base commit SHA",
        required: true
      },
      {
        name: "head_commit",
        description: "Head commit SHA",
        required: true
      }
    ]
  },
  {
    name: "find_low_coverage",
    title: "Find Low Coverage Files",
    description: "Identify files with coverage below a threshold",
    arguments: [
      {
        name: "owner",
        description: "Repository owner",
        required: true
      },
      {
        name: "repo",
        description: "Repository name",
        required: true
      },
      {
        name: "threshold",
        description: "Coverage threshold percentage (default: 80)",
        required: false
      }
    ]
  }
];

// Define available resources
const RESOURCES = [
  {
    uri: "codecov://docs/getting-started",
    name: "Getting Started Guide",
    description: "Quick start guide for using the Codecov MCP server",
    mimeType: "text/markdown"
  },
  {
    uri: "codecov://examples/github-actions",
    name: "GitHub Actions Integration",
    description: "Example GitHub Actions workflow for Codecov",
    mimeType: "text/yaml"
  },
  {
    uri: "codecov://examples/query-patterns",
    name: "Common Query Patterns",
    description: "Examples of common Codecov queries",
    mimeType: "text/markdown"
  },
  {
    uri: "codecov://docs/configuration",
    name: "Configuration Guide",
    description: "How to configure CODECOV_BASE_URL and CODECOV_TOKEN",
    mimeType: "text/markdown"
  }
];

/**
 * Reads version from package.json to ensure consistency
 */
function getPackageVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packageJsonPath = join(__dirname, '../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  } catch (error) {
    console.error('Warning: Could not read version from package.json');
    return '1.0.3'; // Fallback to current version
  }
}

// Main server setup
export async function main() {
  logConfigurationWarnings();
  const config = getConfig();
  const client = new CodecovClient(config);

  const server = new Server(
    {
      name: "mcp-server-codecov",
      version: getPackageVersion(),
    },
    {
      capabilities: {
        tools: {},
        prompts: { listChanged: true },
        resources: { listChanged: false },
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // Validate configuration before executing tools
    const configError = validateConfigForExecution(config);
    if (configError) {
      return {
        content: [{
          type: "text",
          text: `Configuration Error:\n\n${configError}`,
        }],
        isError: true,
      };
    }

    try {
      switch (name) {
        case "get_file_coverage": {
          const { owner, repo, file_path, ref } = args as {
            owner: string;
            repo: string;
            file_path: string;
            ref?: string;
          };
          const result = await client.getFileCoverage(owner, repo, file_path, ref);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "get_commit_coverage": {
          const { owner, repo, commit_sha } = args as {
            owner: string;
            repo: string;
            commit_sha: string;
          };
          const result = await client.getCommitCoverage(owner, repo, commit_sha);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "get_repo_coverage": {
          const { owner, repo, branch } = args as {
            owner: string;
            repo: string;
            branch?: string;
          };
          const result = await client.getRepoCoverage(owner, repo, branch);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  // List available prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts: PROMPTS };
  });

  // Get prompt handler
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const prompt = PROMPTS.find(p => p.name === name);
    if (!prompt) {
      throw new Error(`Unknown prompt: ${name}`);
    }

    if (!args) {
      throw new Error(`Arguments required for prompt: ${name}`);
    }

    // Generate appropriate prompt message based on template
    switch (name) {
      case "analyze_coverage":
        return {
          description: "Analyze coverage for repository",
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Analyze the code coverage for ${args.owner}/${args.repo}${args.branch ? ` on branch ${args.branch}` : ''}.

Please provide:
1. Overall coverage percentage
2. Coverage trends
3. Areas needing attention
4. Recommendations for improvement

Use the get_repo_coverage tool to retrieve the data.`
              }
            }
          ]
        };

      case "compare_commits":
        return {
          description: "Compare coverage between commits",
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Compare code coverage between commits ${args.base_commit} and ${args.head_commit} for ${args.owner}/${args.repo}.

Analyze:
1. Coverage change (increase/decrease)
2. Newly covered files
3. Files with reduced coverage
4. Impact assessment

Use the get_commit_coverage tool for both commits.`
              }
            }
          ]
        };

      case "find_low_coverage":
        const threshold = args.threshold || 80;
        return {
          description: "Find files with low coverage",
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Identify all files in ${args.owner}/${args.repo} with coverage below ${threshold}%.

For each file:
1. Current coverage percentage
2. Number of uncovered lines
3. Priority for improvement
4. Suggested testing approach

Use get_repo_coverage and get_file_coverage tools.`
              }
            }
          ]
        };

      default:
        throw new Error(`Prompt implementation missing: ${name}`);
    }
  });

  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources: RESOURCES };
  });

  // Read resource handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    switch (uri) {
      case "codecov://docs/getting-started":
        return {
          contents: [{
            uri,
            mimeType: "text/markdown",
            text: `# Getting Started with Codecov MCP Server

## Installation

\`\`\`bash
npm install -g mcp-server-codecov
\`\`\`

## Configuration

Set environment variables:
- \`CODECOV_BASE_URL\`: Codecov instance URL (default: https://codecov.io)
- \`CODECOV_TOKEN\`: Your Codecov API token

## Basic Usage

1. Configure your MCP client to use \`mcp-server-codecov\`
2. Use the available tools:
   - \`get_repo_coverage\`: Get overall repository coverage
   - \`get_commit_coverage\`: Get coverage for specific commit
   - \`get_file_coverage\`: Get line-by-line file coverage

## Example Query

"Show me the coverage for my-org/my-repo"
`
          }]
        };

      case "codecov://examples/github-actions":
        return {
          contents: [{
            uri,
            mimeType: "text/yaml",
            text: `name: Code Coverage

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: codecov/codecov-action@v3
        with:
          token: \${{ secrets.CODECOV_TOKEN }}
          fail_ci_if_error: true
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
`
          }]
        };

      case "codecov://examples/query-patterns":
        return {
          contents: [{
            uri,
            mimeType: "text/markdown",
            text: `# Common Codecov Query Patterns

## Repository Coverage
\`\`\`
"What's the overall coverage for owner/repo?"
"Show me coverage trends for owner/repo on main branch"
\`\`\`

## File-Level Coverage
\`\`\`
"Get coverage for src/index.ts in owner/repo"
"Which lines are uncovered in src/utils/helper.ts?"
\`\`\`

## Commit Analysis
\`\`\`
"Show coverage for commit abc123 in owner/repo"
"How did coverage change in the latest commit?"
\`\`\`

## Comparative Analysis
\`\`\`
"Compare coverage between main and feature-branch"
"Find files with coverage below 80% in owner/repo"
\`\`\`
`
          }]
        };

      case "codecov://docs/configuration":
        return {
          contents: [{
            uri,
            mimeType: "text/markdown",
            text: `# Configuration Guide

## Environment Variables

### CODECOV_BASE_URL (Optional)
- Default: \`https://codecov.io\`
- For self-hosted: \`https://codecov.yourcompany.com\`
- Must start with \`http://\` or \`https://\`

### CODECOV_TOKEN (Recommended)
- Required for private repositories
- Optional for public repositories
- Get your token from Codecov settings

## Example Configurations

### Public Repository (codecov.io)
\`\`\`bash
# No configuration needed for public repos
\`\`\`

### Private Repository (codecov.io)
\`\`\`bash
export CODECOV_TOKEN="your-token-here"
\`\`\`

### Self-Hosted Codecov
\`\`\`bash
export CODECOV_BASE_URL="https://codecov.yourcompany.com"
export CODECOV_TOKEN="your-token-here"
\`\`\`
`
          }]
        };

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Codecov MCP Server running on stdio");
  console.error(`Base URL: ${config.baseUrl}`);
  console.error(`Token configured: ${config.token ? "Yes" : "No"}`);
}

// Helper function to handle main errors
export function handleMainError(error: unknown): void {
  console.error("Server error:", error);
  process.exit(1);
}

// Helper function to run main if conditions are met
export function runMainIfDirect(isDirectExec: boolean): void {
  if (isDirectExec) {
    main().catch(handleMainError);
  }
}

// Check if this file is being executed directly
// We need to resolve symlinks because npm bin creates symlinks to the real file
function isMainModule(): boolean {
  try {
    // Get the real path of the current module
    const currentModulePath = fileURLToPath(import.meta.url);

    // Get the real path of the executed script (resolves symlinks)
    const executedScriptPath = realpathSync(process.argv[1]);

    return currentModulePath === executedScriptPath;
  } catch {
    // If we can't determine, assume it's being run directly (safer for bin usage)
    return true;
  }
}

// Only run main if this file is being executed directly
runMainIfDirect(isMainModule());
