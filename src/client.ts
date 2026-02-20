import type {
  CodecovConfig,
  FileCoverageResponse,
  CommitCoverageResponse,
  RepoCoverageResponse,
  PullRequestCoverageResponse,
  CompareCoverageResponse,
} from './types.js';
import { LRUCache } from './cache.js';

/**
 * Codecov API client for querying coverage data
 */
export class CodecovClient {
  private baseUrl: string;
  private token?: string;
  private cache?: LRUCache<unknown>;

  constructor(config: CodecovConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.token = config.token;

    // Initialize cache if enabled
    if (config.cache?.enabled) {
      this.cache = new LRUCache(config.cache.maxSize, config.cache.ttl);
    }
  }

  private async fetch(
    path: string,
    options?: { method?: string; body?: unknown }
  ): Promise<unknown> {
    // Only cache GET requests without body
    const shouldCache = this.cache && !options?.method && !options?.body;
    const cacheKey = shouldCache ? `${this.baseUrl}${path}` : '';

    // Try to get from cache first
    if (shouldCache && this.cache) {
      return this.cache.getOrFetch(cacheKey, async () => {
        return this.performFetch(path, options);
      });
    }

    // Perform fetch without caching
    return this.performFetch(path, options);
  }

  private async performFetch(
    path: string,
    options?: { method?: string; body?: unknown }
  ): Promise<unknown> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Accept": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `bearer ${this.token}`;
    }

    if (options?.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const fetchOptions: RequestInit = { headers };

    if (options?.method) {
      fetchOptions.method = options.method;
    }

    if (options?.body !== undefined) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`Codecov API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getFileCoverage(owner: string, repo: string, filePath: string, ref?: string): Promise<FileCoverageResponse> {
    const refParam = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    const encodedPath = encodeURIComponent(filePath);
    return this.fetch(`/api/v2/gh/${owner}/repos/${repo}/file_report/${encodedPath}${refParam}`) as Promise<FileCoverageResponse>;
  }

  async getCommitCoverage(owner: string, repo: string, commitSha: string): Promise<CommitCoverageResponse> {
    return this.fetch(`/api/v2/gh/${owner}/repos/${repo}/commits/${commitSha}`) as Promise<CommitCoverageResponse>;
  }

  async getRepoCoverage(owner: string, repo: string, branch?: string): Promise<RepoCoverageResponse> {
    const branchParam = branch ? `?branch=${encodeURIComponent(branch)}` : "";
    return this.fetch(`/api/v2/gh/${owner}/repos/${repo}${branchParam}`) as Promise<RepoCoverageResponse>;
  }

  async getPullRequestCoverage(owner: string, repo: string, pullNumber: number): Promise<PullRequestCoverageResponse> {
    return this.fetch(`/api/v2/gh/${owner}/repos/${repo}/pulls/${pullNumber}`) as Promise<PullRequestCoverageResponse>;
  }

  async compareCoverage(owner: string, repo: string, base: string, head: string): Promise<CompareCoverageResponse> {
    return this.fetch(`/api/v2/gh/${owner}/repos/${repo}/compare/?base=${encodeURIComponent(base)}&head=${encodeURIComponent(head)}`) as Promise<CompareCoverageResponse>;
  }
}
