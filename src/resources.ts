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
 * Single source of truth mapping URI → { file, mimeType }.
 * Adding a new resource only requires a new entry here.
 */
const RESOURCE_FILES: Record<string, { file: string; mimeType: string; name: string; description: string }> = {
  "codecov://docs/getting-started": {
    file: "getting-started.md",
    mimeType: "text/markdown",
    name: "Getting Started Guide",
    description: "Quick start guide for using the Codecov MCP server",
  },
  "codecov://examples/github-actions": {
    file: "examples/github-actions.yaml",
    mimeType: "text/yaml",
    name: "GitHub Actions Integration",
    description: "Example GitHub Actions workflow for Codecov",
  },
  "codecov://examples/query-patterns": {
    file: "query-patterns.md",
    mimeType: "text/markdown",
    name: "Common Query Patterns",
    description: "Examples of common Codecov queries",
  },
  "codecov://docs/configuration": {
    file: "configuration.md",
    mimeType: "text/markdown",
    name: "Configuration Guide",
    description: "How to configure CODECOV_BASE_URL and CODECOV_TOKEN",
  },
};

/**
 * Available MCP resources for documentation and examples.
 * Derived from RESOURCE_FILES so there is no duplication.
 */
export const RESOURCES: Resource[] = Object.entries(RESOURCE_FILES).map(
  ([uri, { name, description, mimeType }]) => ({ uri, name, description, mimeType })
);

/**
 * Creates the resource read handler function
 */
export function createResourceHandler() {
  return async (request: ReadResourceRequest) => {
    const { uri } = request.params;

    try {
      const meta = RESOURCE_FILES[uri];
      if (!meta) {
        throw new Error(`Unknown resource: ${uri}`);
      }
      return {
        contents: [{ uri, mimeType: meta.mimeType, text: loadDocFile(meta.file) }],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load resource ${uri}: ${errorMessage}`);
    }
  };
}
