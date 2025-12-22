import type { Tool, CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import type { CodecovClient } from './client.js';
import type { CodecovConfig } from './types.js';
import { validateConfigForExecution } from './config.js';

/**
 * Available MCP tools for querying Codecov
 */
export const TOOLS: Tool[] = [
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

/**
 * Creates the tool call handler function
 */
export function createToolHandler(client: CodecovClient, config: CodecovConfig) {
  return async (request: CallToolRequest) => {
    const { name, arguments: args } = request.params;

    // Validate configuration before executing tools
    const configError = validateConfigForExecution(config);
    if (configError) {
      return {
        content: [{
          type: "text" as const,
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
                type: "text" as const,
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
                type: "text" as const,
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
                type: "text" as const,
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
            type: "text" as const,
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  };
}
