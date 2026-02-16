import type { Resource, ReadResourceRequest } from "@modelcontextprotocol/sdk/types.js";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/**
 * Lazy load documentation file from docs directory
 */
function loadDocFile(relativePath: string): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const filePath = join(__dirname, '../docs', relativePath);
  return readFileSync(filePath, 'utf-8');
}

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

    try {
      switch (uri) {
        case "codecov://docs/getting-started":
          return {
            contents: [{
              uri,
              mimeType: "text/markdown",
              text: loadDocFile('getting-started.md')
            }]
          };

        case "codecov://examples/github-actions":
          return {
            contents: [{
              uri,
              mimeType: "text/yaml",
              text: loadDocFile('examples/github-actions.yaml')
            }]
          };

        case "codecov://examples/query-patterns":
          return {
            contents: [{
              uri,
              mimeType: "text/markdown",
              text: loadDocFile('query-patterns.md')
            }]
          };

        case "codecov://docs/configuration":
          return {
            contents: [{
              uri,
              mimeType: "text/markdown",
              text: loadDocFile('configuration.md')
            }]
          };

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load resource ${uri}: ${errorMessage}`);
    }
  };
}
