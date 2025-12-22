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

  private async fetch(path: string): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Accept": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `bearer ${this.token}`;
    }

    const response = await fetch(url, { headers });

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
}
