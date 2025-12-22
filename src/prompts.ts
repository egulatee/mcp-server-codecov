import type { GetPromptRequest, Prompt } from "@modelcontextprotocol/sdk/types.js";

/**
 * Available MCP prompts for common Codecov queries
 */
export const PROMPTS: Prompt[] = [
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

/**
 * Creates the prompt handler function
 */
export function createPromptHandler() {
  return async (request: GetPromptRequest) => {
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
              role: "user" as const,
              content: {
                type: "text" as const,
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
              role: "user" as const,
              content: {
                type: "text" as const,
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
              role: "user" as const,
              content: {
                type: "text" as const,
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
  };
}
