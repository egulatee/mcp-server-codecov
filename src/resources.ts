import type { Resource, ReadResourceRequest } from "@modelcontextprotocol/sdk/types.js";

/**
 * Available MCP resources for documentation and examples
 */
export const RESOURCES: Resource[] = [
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
 * Creates the resource read handler function
 */
export function createResourceHandler() {
  return async (request: ReadResourceRequest) => {
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
  };
}
