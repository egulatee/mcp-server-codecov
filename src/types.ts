/**
 * Shared type definitions for the Codecov MCP server
 */

/**
 * Cache configuration options
 */
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cached entries
}

/**
 * Configuration for the Codecov API client
 */
export interface CodecovConfig {
  baseUrl: string;
  token?: string;
  cache?: CacheConfig;
}
