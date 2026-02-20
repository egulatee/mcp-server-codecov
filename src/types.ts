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

// ---------------------------------------------------------------------------
// API response types (partial — Codecov v2 API)
// Index signatures allow unknown fields returned by the API.
// ---------------------------------------------------------------------------

export interface CoverageTotal {
  coverage: number | null;
  lines: number;
  hits: number;
  misses: number;
  partials: number;
  [key: string]: unknown;
}

export interface FileCoverageResponse {
  name: string;
  commitid?: string;
  totals?: CoverageTotal;
  line_coverage?: Record<string, number>;
  [key: string]: unknown;
}

export interface CommitCoverageResponse {
  commitid: string;
  totals?: CoverageTotal;
  [key: string]: unknown;
}

export interface RepoCoverageResponse {
  name: string;
  branch?: string;
  totals?: CoverageTotal;
  [key: string]: unknown;
}

export interface PullRequestCoverageResponse {
  pullid: number;
  state?: string;
  base?: { totals?: CoverageTotal };
  head?: { totals?: CoverageTotal };
  [key: string]: unknown;
}

export interface CompareCoverageResponse {
  base?: CommitCoverageResponse;
  head?: CommitCoverageResponse;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Tool argument interfaces — used in tools.ts switch cases
// ---------------------------------------------------------------------------

export interface GetFileCoverageArgs {
  owner: string;
  repo: string;
  file_path: string;
  ref?: string;
}

export interface GetCommitCoverageArgs {
  owner: string;
  repo: string;
  commit_sha: string;
}

export interface GetRepoCoverageArgs {
  owner: string;
  repo: string;
  branch?: string;
}

export interface GetPullRequestCoverageArgs {
  owner: string;
  repo: string;
  pull_number: number;
}

export interface CompareCoverageArgs {
  owner: string;
  repo: string;
  base: string;
  head: string;
}
