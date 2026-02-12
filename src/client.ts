import type { CodecovConfig } from './types.js';

/**
 * Codecov API client for querying coverage data
 */
export class CodecovClient {
  private baseUrl: string;
  private token?: string;

  constructor(config: CodecovConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.token = config.token;
  }

  private async fetch(
    path: string,
    options?: { method?: string; body?: any }
  ): Promise<any> {
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

  async getFileCoverage(owner: string, repo: string, filePath: string, ref?: string): Promise<any> {
    const refParam = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    const encodedPath = encodeURIComponent(filePath);
    return this.fetch(`/api/v2/gh/${owner}/repos/${repo}/file_report/${encodedPath}${refParam}`);
  }

  async getCommitCoverage(owner: string, repo: string, commitSha: string): Promise<any> {
    return this.fetch(`/api/v2/gh/${owner}/repos/${repo}/commits/${commitSha}`);
  }

  async getRepoCoverage(owner: string, repo: string, branch?: string): Promise<any> {
    const branchParam = branch ? `?branch=${encodeURIComponent(branch)}` : "";
    return this.fetch(`/api/v2/gh/${owner}/repos/${repo}${branchParam}`);
  }

  async activateRepository(owner: string, repo: string): Promise<any> {
    return this.fetch(`/api/v2/gh/${owner}/repos/${repo}/activate`, {
      method: "POST",
      body: {},
    });
  }
}
