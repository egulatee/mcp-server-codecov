import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getConfig, logConfigurationWarnings, getPackageVersion } from './config.js';
import { CodecovClient } from './client.js';
import { TOOLS, createToolHandler } from './tools.js';
import { PROMPTS, createPromptHandler } from './prompts.js';
import { RESOURCES, createResourceHandler } from './resources.js';

/**
 * Main server setup and initialization
 */
export async function startServer() {
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

  // Register tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  server.setRequestHandler(CallToolRequestSchema, createToolHandler(client, config));

  // Register prompt handlers
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts: PROMPTS };
  });

  server.setRequestHandler(GetPromptRequestSchema, createPromptHandler());

  // Register resource handlers
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources: RESOURCES };
  });

  server.setRequestHandler(ReadResourceRequestSchema, createResourceHandler());

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Codecov MCP Server running on stdio");
  console.error(`Base URL: ${config.baseUrl}`);
  console.error(`Token configured: ${config.token ? "Yes" : "No"}`);
}

/**
 * Alias for startServer to maintain backward compatibility
 * @deprecated Use startServer instead
 */
export const main = startServer;
