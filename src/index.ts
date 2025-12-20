#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Configuration interface
export interface CodecovConfig {
  baseUrl: string;
  token?: string;
}

// Validate environment variables
export function validateEnvironment(): void {
  const baseUrl = process.env.CODECOV_BASE_URL;

  if (baseUrl && !baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    console.error("ERROR: CODECOV_BASE_URL must start with http:// or https://");
    console.error(`Received: ${baseUrl}`);
    process.exit(1);
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

// Main server setup
export async function main() {
  validateEnvironment();
  const config = getConfig();
  const client = new CodecovClient(config);

  const server = new Server(
    {
      name: "mcp-server-codecov",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
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

// Only run main if this file is being executed directly
runMainIfDirect(import.meta.url === `file://${process.argv[1]}`);
