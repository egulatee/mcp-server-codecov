/**
 * Shared type definitions for the Codecov MCP server
 */

/**
 * Configuration for the Codecov API client
 */
export interface CodecovConfig {
  baseUrl: string;
  token?: string;
}
