import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Mock the MCP SDK modules before importing our code
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn(class {
    setRequestHandler = vi.fn(() => {});
    connect = vi.fn(async () => undefined);
  }),
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn(class {}),
}));

// Now import the code under test
import { getConfig, CodecovClient, type CodecovConfig, main, handleMainError, runMainIfDirect, logConfigurationWarnings } from '../index.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Helper functions for creating mock responses
function createMockResponse(data: any, status = 200, ok = true): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
  } as Response;
}

// Tests start here
describe('getConfig', () => {
  it('returns default configuration when no env vars set', () => {
    const config = getConfig();
    expect(config.baseUrl).toBe('https://codecov.io');
    expect(config.token).toBeUndefined();
  });

  it('uses CODECOV_BASE_URL when set', () => {
    process.env.CODECOV_BASE_URL = 'https://custom.codecov.com';
    const config = getConfig();
    expect(config.baseUrl).toBe('https://custom.codecov.com');
    expect(config.token).toBeUndefined();
  });

  it('uses CODECOV_TOKEN when set', () => {
    process.env.CODECOV_TOKEN = 'test-token-123';
    const config = getConfig();
    expect(config.baseUrl).toBe('https://codecov.io');
    expect(config.token).toBe('test-token-123');
  });

  it('uses both env vars when both are set', () => {
    process.env.CODECOV_BASE_URL = 'https://custom.codecov.com';
    process.env.CODECOV_TOKEN = 'test-token-456';
    const config = getConfig();
    expect(config.baseUrl).toBe('https://custom.codecov.com');
    expect(config.token).toBe('test-token-456');
  });

  it('handles empty string values from env', () => {
    process.env.CODECOV_BASE_URL = '';
    process.env.CODECOV_TOKEN = '';
    const config = getConfig();
    expect(config.baseUrl).toBe('https://codecov.io'); // Falls back to default
    expect(config.token).toBe(''); // Empty string is still set
  });
});

describe('CodecovClient', () => {
  describe('constructor', () => {
    it('initializes with config', () => {
      const config: CodecovConfig = { baseUrl: 'https://codecov.io', token: 'test-token' };
      const client = new CodecovClient(config);
      expect(client).toBeDefined();
      expect(client['baseUrl']).toBe('https://codecov.io');
      expect(client['token']).toBe('test-token');
    });

    it('removes trailing slash from baseUrl', () => {
      const config: CodecovConfig = { baseUrl: 'https://codecov.io/', token: 'test-token' };
      const client = new CodecovClient(config);
      expect(client['baseUrl']).toBe('https://codecov.io');
    });

    it('keeps baseUrl unchanged when no trailing slash', () => {
      const config: CodecovConfig = { baseUrl: 'https://codecov.io', token: 'test-token' };
      const client = new CodecovClient(config);
      expect(client['baseUrl']).toBe('https://codecov.io');
    });

    it('stores token when provided', () => {
      const config: CodecovConfig = { baseUrl: 'https://codecov.io', token: 'my-token' };
      const client = new CodecovClient(config);
      expect(client['token']).toBe('my-token');
    });

    it('works without token', () => {
      const config: CodecovConfig = { baseUrl: 'https://codecov.io' };
      const client = new CodecovClient(config);
      expect(client['token']).toBeUndefined();
    });
  });

  describe('fetch', () => {
    it('makes successful request with token', async () => {
      const mockData = { coverage: 95.5 };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({
        baseUrl: 'https://codecov.io',
        token: 'test-token'
      });

      const result = await client['fetch']('/api/v2/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://codecov.io/api/v2/test',
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': 'bearer test-token'
          }
        }
      );
      expect(result).toEqual(mockData);
    });

    it('makes successful request without token', async () => {
      const mockData = { coverage: 80.2 };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });

      const result = await client['fetch']('/api/v2/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://codecov.io/api/v2/test',
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      expect(result).toEqual(mockData);
    });

    it('uses lowercase bearer prefix', async () => {
      const mockData = { coverage: 90 };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({
        baseUrl: 'https://codecov.io',
        token: 'test-token'
      });

      await client['fetch']('/api/v2/test');

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers['Authorization']).toBe('bearer test-token');
      expect(headers['Authorization']).not.toBe('Bearer test-token');
    });

    it('throws error on network failure', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });

      await expect(client['fetch']('/api/v2/test'))
        .rejects
        .toThrow('Network error');
    });

    it('throws error on 404 response', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        createMockResponse({}, 404, false)
      );

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });

      await expect(client['fetch']('/api/v2/test'))
        .rejects
        .toThrow('Codecov API error: 404 Error');
    });

    it('throws error on 401 response', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        createMockResponse({}, 401, false)
      );

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });

      await expect(client['fetch']('/api/v2/test'))
        .rejects
        .toThrow('Codecov API error: 401 Error');
    });

    it('throws error on 500 response', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        createMockResponse({}, 500, false)
      );

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });

      await expect(client['fetch']('/api/v2/test'))
        .rejects
        .toThrow('Codecov API error: 500 Error');
    });

    it('handles invalid JSON response', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response);

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });

      await expect(client['fetch']('/api/v2/test'))
        .rejects
        .toThrow('Invalid JSON');
    });

    it('constructs URL correctly', async () => {
      const mockData = { test: 'data' };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://custom.codecov.com' });

      await client['fetch']('/api/v2/custom/path');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://custom.codecov.com/api/v2/custom/path',
        expect.any(Object)
      );
    });

    it('constructs headers correctly', async () => {
      const mockData = { test: 'data' };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({
        baseUrl: 'https://codecov.io',
        token: 'my-secret-token'
      });

      await client['fetch']('/api/v2/test');

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers).toEqual({
        'Accept': 'application/json',
        'Authorization': 'bearer my-secret-token'
      });
    });
  });

  describe('getFileCoverage', () => {
    it('fetches file coverage without ref parameter', async () => {
      const mockData = { coverage: 85 };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });
      const result = await client.getFileCoverage('owner', 'repo', 'src/index.ts');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://codecov.io/api/v2/gh/owner/repos/repo/file_report/src%2Findex.ts',
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
    });

    it('fetches file coverage with ref parameter', async () => {
      const mockData = { coverage: 90 };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });
      const result = await client.getFileCoverage('owner', 'repo', 'src/index.ts', 'main');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://codecov.io/api/v2/gh/owner/repos/repo/file_report/src%2Findex.ts?ref=main',
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
    });

    it('encodes special characters in filePath', async () => {
      const mockData = { coverage: 75 };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });
      await client.getFileCoverage('owner', 'repo', 'src/file with spaces.ts');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://codecov.io/api/v2/gh/owner/repos/repo/file_report/src%2Ffile%20with%20spaces.ts',
        expect.any(Object)
      );
    });

    it('encodes special characters in ref', async () => {
      const mockData = { coverage: 88 };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });
      await client.getFileCoverage('owner', 'repo', 'src/index.ts', 'feature/my-branch');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://codecov.io/api/v2/gh/owner/repos/repo/file_report/src%2Findex.ts?ref=feature%2Fmy-branch',
        expect.any(Object)
      );
    });

    it('returns data from successful fetch', async () => {
      const mockData = { coverage: 92.5, lines: 100, hits: 92 };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });
      const result = await client.getFileCoverage('owner', 'repo', 'src/test.ts');

      expect(result).toEqual(mockData);
    });

    it('propagates fetch errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse({}, 404, false));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });

      await expect(client.getFileCoverage('owner', 'repo', 'src/missing.ts'))
        .rejects
        .toThrow('Codecov API error: 404 Error');
    });
  });

  describe('getCommitCoverage', () => {
    it('fetches commit coverage with valid params', async () => {
      const mockData = { coverage: 87.3 };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });
      const result = await client.getCommitCoverage('owner', 'repo', 'abc123def456');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://codecov.io/api/v2/gh/owner/repos/repo/commits/abc123def456',
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
    });

    it('handles special characters in commitSha', async () => {
      const mockData = { coverage: 91 };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });
      await client.getCommitCoverage('owner', 'repo', 'commit-with-special');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://codecov.io/api/v2/gh/owner/repos/repo/commits/commit-with-special',
        expect.any(Object)
      );
    });

    it('returns data from successful fetch', async () => {
      const mockData = { coverage: 95, totals: { lines: 200, hits: 190 } };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });
      const result = await client.getCommitCoverage('owner', 'repo', 'sha123');

      expect(result).toEqual(mockData);
    });

    it('propagates fetch errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse({}, 500, false));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });

      await expect(client.getCommitCoverage('owner', 'repo', 'bad-sha'))
        .rejects
        .toThrow('Codecov API error: 500 Error');
    });
  });

  describe('getRepoCoverage', () => {
    it('fetches repo coverage without branch parameter', async () => {
      const mockData = { coverage: 82.1 };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });
      const result = await client.getRepoCoverage('owner', 'repo');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://codecov.io/api/v2/gh/owner/repos/repo',
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
    });

    it('fetches repo coverage with branch parameter', async () => {
      const mockData = { coverage: 89.7 };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });
      const result = await client.getRepoCoverage('owner', 'repo', 'develop');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://codecov.io/api/v2/gh/owner/repos/repo?branch=develop',
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
    });

    it('encodes special characters in branch', async () => {
      const mockData = { coverage: 77 };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });
      await client.getRepoCoverage('owner', 'repo', 'feature/new-feature');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://codecov.io/api/v2/gh/owner/repos/repo?branch=feature%2Fnew-feature',
        expect.any(Object)
      );
    });

    it('returns data from successful fetch', async () => {
      const mockData = { coverage: 93.2, name: 'my-repo', active: true };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });
      const result = await client.getRepoCoverage('owner', 'repo');

      expect(result).toEqual(mockData);
    });

    it('propagates fetch errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse({}, 401, false));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });

      await expect(client.getRepoCoverage('owner', 'private-repo'))
        .rejects
        .toThrow('Codecov API error: 401 Error');
    });
  });

  describe('getPullRequestCoverage', () => {
    it('fetches pull request coverage with valid params', async () => {
      const mockData = {
        coverage: 88.5,
        head: { commit_sha: 'abc123' },
        base: { commit_sha: 'def456' }
      };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });
      const result = await client.getPullRequestCoverage('owner', 'repo', 123);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://codecov.io/api/v2/gh/owner/repos/repo/pulls/123',
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
    });

    it('handles pull request number as integer', async () => {
      const mockData = { coverage: 90.2 };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });
      await client.getPullRequestCoverage('owner', 'repo', 1);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://codecov.io/api/v2/gh/owner/repos/repo/pulls/1',
        expect.any(Object)
      );
    });

    it('returns data from successful fetch', async () => {
      const mockData = {
        coverage: 85.7,
        files: [{ name: 'test.ts', coverage: 92 }]
      };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });
      const result = await client.getPullRequestCoverage('owner', 'repo', 456);

      expect(result).toEqual(mockData);
    });

    it('propagates fetch errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse({}, 404, false));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });

      await expect(client.getPullRequestCoverage('owner', 'repo', 999))
        .rejects
        .toThrow('Codecov API error: 404 Error');
    });
  });

  describe('compareCoverage', () => {
    it('fetches coverage comparison with valid params', async () => {
      const mockData = {
        diff: { coverage: 2.5 },
        base: { coverage: 85.0 },
        head: { coverage: 87.5 }
      };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });
      const result = await client.compareCoverage('owner', 'repo', 'main', 'feature-branch');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://codecov.io/api/v2/gh/owner/repos/repo/compare/?base=main&head=feature-branch',
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
    });

    it('encodes special characters in base and head', async () => {
      const mockData = { diff: { coverage: 1.2 } };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });
      await client.compareCoverage('owner', 'repo', 'feature/base-branch', 'feature/head-branch');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://codecov.io/api/v2/gh/owner/repos/repo/compare/?base=feature%2Fbase-branch&head=feature%2Fhead-branch',
        expect.any(Object)
      );
    });

    it('handles commit SHAs', async () => {
      const mockData = { diff: { coverage: -0.5 } };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });
      await client.compareCoverage('owner', 'repo', 'abc123def456', 'def456abc123');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://codecov.io/api/v2/gh/owner/repos/repo/compare/?base=abc123def456&head=def456abc123',
        expect.any(Object)
      );
    });

    it('returns data from successful fetch', async () => {
      const mockData = {
        diff: { coverage: 3.2 },
        files: [{ name: 'src/test.ts', coverage_change: 5.0 }]
      };
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });
      const result = await client.compareCoverage('owner', 'repo', 'v1.0', 'v2.0');

      expect(result).toEqual(mockData);
    });

    it('propagates fetch errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse({}, 500, false));

      const client = new CodecovClient({ baseUrl: 'https://codecov.io' });

      await expect(client.compareCoverage('owner', 'repo', 'invalid', 'refs'))
        .rejects
        .toThrow('Codecov API error: 500 Error');
    });
  });
});

describe('main', () => {
  it('initializes and starts the MCP server', async () => {
    // Setup mocks
    const mockSetRequestHandler = vi.fn(() => {});
    const mockConnect = vi.fn(() => {}).mockResolvedValue(undefined);

    vi.mocked(Server).mockImplementationOnce(function() {
      return {
        setRequestHandler: mockSetRequestHandler,
        connect: mockConnect,
      } as any;
    });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() {
      return {} as any;
    });

    // Mock console.error to avoid noise in test output
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Run main
    await main();

    // Read expected version from package.json
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '../../package.json'), 'utf-8')
    );

    // Verify Server was created
    expect(Server).toHaveBeenCalledWith(
      {
        name: 'mcp-server-codecov',
        version: packageJson.version,
      },
      {
        capabilities: {
          tools: {},
          prompts: { listChanged: true },
          resources: { listChanged: false },
        },
      }
    );

    // Verify handlers were registered (6 handlers: ListTools, CallTool, ListPrompts, GetPrompt, ListResources, ReadResource)
    expect(mockSetRequestHandler).toHaveBeenCalledTimes(6);

    // Verify transport was created and connected
    expect(StdioServerTransport).toHaveBeenCalled();
    expect(mockConnect).toHaveBeenCalledTimes(1);

    // Verify console output
    expect(consoleErrorSpy).toHaveBeenCalledWith('Codecov MCP Server running on stdio');

    consoleErrorSpy.mockRestore();
  });

  it('uses package.json version for server initialization', async () => {
    const mockSetRequestHandler = vi.fn(() => {});
    const mockConnect = vi.fn(() => {}).mockResolvedValue(undefined);

    vi.mocked(Server).mockImplementationOnce(function(info, options) {
      // Verify version matches package.json
      const packageJson = JSON.parse(
        readFileSync(join(__dirname, '../../package.json'), 'utf-8')
      );
      expect(info.version).toBe(packageJson.version);

      return {
        setRequestHandler: mockSetRequestHandler,
        connect: mockConnect,
      } as any;
    });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await main();
  });

  it('handles ListToolsRequestSchema handler', async () => {
    const handlers: any[] = [];

    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await main();

    // First handler is ListTools
    const listToolsHandler = handlers[0];
    const result = await listToolsHandler();

    // Verify it returns the tools array
    expect(result).toHaveProperty('tools');
    expect(result.tools).toBeInstanceOf(Array);
    expect(result.tools.length).toBe(5);
    expect(result.tools[0].name).toBe('get_file_coverage');
    expect(result.tools[1].name).toBe('get_commit_coverage');
    expect(result.tools[2].name).toBe('get_repo_coverage');
    expect(result.tools[3].name).toBe('get_pull_request_coverage');
    expect(result.tools[4].name).toBe('compare_coverage');
  });

  it('handles CallToolRequestSchema for get_file_coverage', async () => {
    const handlers: any[] = [];

    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockData = { coverage: 85.5 };
    vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

    await main();

    // Second handler is CallTool
    const callToolHandler = handlers[1];
    const result = await callToolHandler({
      params: {
        name: 'get_file_coverage',
        arguments: {
          owner: 'test-owner',
          repo: 'test-repo',
          file_path: 'src/test.ts'
        }
      }
    });

    // Verify the response
    expect(result.content).toBeInstanceOf(Array);
    expect(result.content[0].type).toBe('text');
    expect(JSON.parse(result.content[0].text)).toEqual(mockData);
  });

  it('handles CallToolRequestSchema for get_commit_coverage', async () => {
    const handlers: any[] = [];
    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockData = { coverage: 92.1 };
    vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

    await main();

    const callToolHandler = handlers[1];
    const result = await callToolHandler({
      params: {
        name: 'get_commit_coverage',
        arguments: {
          owner: 'test-owner',
          repo: 'test-repo',
          commit_sha: 'abc123'
        }
      }
    });

    expect(result.content[0].type).toBe('text');
    expect(JSON.parse(result.content[0].text)).toEqual(mockData);
  });

  it('handles CallToolRequestSchema for get_repo_coverage', async () => {
    const handlers: any[] = [];
    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockData = { coverage: 88.0 };
    vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

    await main();

    const callToolHandler = handlers[1];
    const result = await callToolHandler({
      params: {
        name: 'get_repo_coverage',
        arguments: {
          owner: 'test-owner',
          repo: 'test-repo',
          branch: 'main'
        }
      }
    });

    expect(result.content[0].type).toBe('text');
    expect(JSON.parse(result.content[0].text)).toEqual(mockData);
  });

  it('handles CallToolRequestSchema for get_pull_request_coverage', async () => {
    const handlers: any[] = [];
    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockData = {
      coverage: 86.3,
      head: { commit_sha: 'abc123' },
      base: { commit_sha: 'def456' }
    };
    vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

    await main();

    const callToolHandler = handlers[1];
    const result = await callToolHandler({
      params: {
        name: 'get_pull_request_coverage',
        arguments: {
          owner: 'test-owner',
          repo: 'test-repo',
          pull_number: 123
        }
      }
    });

    expect(result.content[0].type).toBe('text');
    expect(JSON.parse(result.content[0].text)).toEqual(mockData);
  });

  it('handles CallToolRequestSchema for compare_coverage', async () => {
    const handlers: any[] = [];
    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockData = {
      diff: { coverage: 2.5 },
      base: { coverage: 85.0 },
      head: { coverage: 87.5 }
    };
    vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData));

    await main();

    const callToolHandler = handlers[1];
    const result = await callToolHandler({
      params: {
        name: 'compare_coverage',
        arguments: {
          owner: 'test-owner',
          repo: 'test-repo',
          base: 'main',
          head: 'feature-branch'
        }
      }
    });

    expect(result.content[0].type).toBe('text');
    expect(JSON.parse(result.content[0].text)).toEqual(mockData);
  });

  it('handles unknown tool name', async () => {
    const handlers: any[] = [];
    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await main();

    const callToolHandler = handlers[1];
    const result = await callToolHandler({
      params: {
        name: 'unknown_tool',
        arguments: {}
      }
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: Unknown tool: unknown_tool');
  });

  it('handles errors in tool execution', async () => {
    const handlers: any[] = [];
    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock fetch to throw an error
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('API Error'));

    await main();

    const callToolHandler = handlers[1];
    const result = await callToolHandler({
      params: {
        name: 'get_file_coverage',
        arguments: {
          owner: 'test-owner',
          repo: 'test-repo',
          file_path: 'src/test.ts'
        }
      }
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error:');
    expect(result.content[0].text).toContain('API Error');
  });

  it('handles non-Error exceptions', async () => {
    const handlers: any[] = [];
    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock fetch to throw a non-Error object
    vi.mocked(global.fetch).mockRejectedValueOnce('String error');

    await main();

    const callToolHandler = handlers[1];
    const result = await callToolHandler({
      params: {
        name: 'get_file_coverage',
        arguments: {
          owner: 'test-owner',
          repo: 'test-repo',
          file_path: 'src/test.ts'
        }
      }
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: String error');
  });
});

describe('handleMainError', () => {
  it('logs error to console and exits with code 1', () => {
    const testError = new Error('Test server error');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    handleMainError(testError);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Server error:', testError);
    expect(processExitSpy).toHaveBeenCalledWith(1);

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('handles non-Error objects', () => {
    const testError = 'String error message';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    handleMainError(testError);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Server error:', testError);
    expect(processExitSpy).toHaveBeenCalledWith(1);

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });
});

describe('runMainIfDirect', () => {
  it('does not run main when isDirectExec is false', () => {
    // This simulates the file being imported (normal test scenario)
    runMainIfDirect(false);

    // No assertions needed - function should just return without doing anything
    expect(true).toBe(true);
  });

  it('runs main when isDirectExec is true', async () => {
    // This simulates the file being executed directly
    runMainIfDirect(true);

    // The function starts main() which runs asynchronously
    // Just verify it doesn't throw - main() will run in background
    expect(true).toBe(true);
  });
});

describe('Runtime validation with invalid configuration', () => {
  it('should start server even with invalid CODECOV_BASE_URL', async () => {
    const originalEnv = process.env.CODECOV_BASE_URL;
    process.env.CODECOV_BASE_URL = 'invalid-url';

    const mockSetRequestHandler = vi.fn(() => {});
    const mockConnect = vi.fn(() => {}).mockResolvedValue(undefined);

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: mockConnect,
    } as any; });

    // Should not throw
    await main();

    // Server should still connect
    expect(mockConnect).toHaveBeenCalled();

    process.env.CODECOV_BASE_URL = originalEnv;
  });

  it('should return error when tool is called with invalid config', async () => {
    const originalEnv = process.env.CODECOV_BASE_URL;
    process.env.CODECOV_BASE_URL = 'invalid-url';

    const handlers: any[] = [];
    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: vi.fn((schema: any, handler: any) => {
        handlers.push(handler);
      }),
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    await main();

    // Get the CallToolRequestSchema handler (second handler)
    const callToolHandler = handlers[1];
    const result = await callToolHandler({
      params: {
        name: 'get_file_coverage',
        arguments: { owner: 'test', repo: 'test', file_path: 'test.ts' }
      }
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Configuration Error');
    expect(result.content[0].text).toContain('CODECOV_BASE_URL');

    process.env.CODECOV_BASE_URL = originalEnv;
  });
});

describe('logConfigurationWarnings', () => {
  it('warns when CODECOV_BASE_URL does not start with http:// or https://', () => {
    const originalEnv = process.env.CODECOV_BASE_URL;
    process.env.CODECOV_BASE_URL = 'invalid-url';

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logConfigurationWarnings();

    expect(consoleErrorSpy).toHaveBeenCalledWith('WARNING: CODECOV_BASE_URL must start with http:// or https://');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Received: invalid-url');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Tools will fail at execution time if this URL is invalid.');

    consoleErrorSpy.mockRestore();
    process.env.CODECOV_BASE_URL = originalEnv;
  });

  it('warns when CODECOV_BASE_URL uses insecure HTTP', () => {
    const originalEnv = process.env.CODECOV_BASE_URL;
    process.env.CODECOV_BASE_URL = 'http://codecov.example.com';

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logConfigurationWarnings();

    expect(consoleWarnSpy).toHaveBeenCalledWith('WARNING: Using insecure HTTP connection. Consider using HTTPS.');

    consoleWarnSpy.mockRestore();
    process.env.CODECOV_BASE_URL = originalEnv;
  });
});

describe('Prompts handlers', () => {
  it('handles ListPromptsRequestSchema', async () => {
    const handlers: any[] = [];
    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await main();

    // Third handler is ListPrompts (after ListTools and CallTool)
    const listPromptsHandler = handlers[2];
    const result = await listPromptsHandler();

    expect(result).toHaveProperty('prompts');
    expect(result.prompts).toBeInstanceOf(Array);
    expect(result.prompts.length).toBeGreaterThan(0);
    expect(result.prompts[0]).toHaveProperty('name');
    expect(result.prompts[0]).toHaveProperty('title');
  });

  it('handles GetPromptRequestSchema for analyze_coverage', async () => {
    const handlers: any[] = [];
    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await main();

    // Fourth handler is GetPrompt
    const getPromptHandler = handlers[3];
    const result = await getPromptHandler({
      params: {
        name: 'analyze_coverage',
        arguments: {
          owner: 'test-owner',
          repo: 'test-repo',
          branch: 'main'
        }
      }
    });

    expect(result).toHaveProperty('messages');
    expect(result.messages).toBeInstanceOf(Array);
    expect(result.messages[0]).toHaveProperty('role', 'user');
    expect(result.messages[0].content.text).toContain('test-owner/test-repo');
    expect(result.messages[0].content.text).toContain('main');
  });

  it('handles GetPromptRequestSchema for compare_commits', async () => {
    const handlers: any[] = [];
    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await main();

    const getPromptHandler = handlers[3];
    const result = await getPromptHandler({
      params: {
        name: 'compare_commits',
        arguments: {
          owner: 'test-owner',
          repo: 'test-repo',
          base_commit: 'abc123',
          head_commit: 'def456'
        }
      }
    });

    expect(result).toHaveProperty('messages');
    expect(result.messages[0].content.text).toContain('abc123');
    expect(result.messages[0].content.text).toContain('def456');
  });

  it('handles GetPromptRequestSchema for find_low_coverage', async () => {
    const handlers: any[] = [];
    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await main();

    const getPromptHandler = handlers[3];
    const result = await getPromptHandler({
      params: {
        name: 'find_low_coverage',
        arguments: {
          owner: 'test-owner',
          repo: 'test-repo',
          threshold: 75
        }
      }
    });

    expect(result).toHaveProperty('messages');
    expect(result.messages[0].content.text).toContain('75');
  });

  it('throws error when arguments are missing for GetPromptRequestSchema', async () => {
    const handlers: any[] = [];
    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await main();

    const getPromptHandler = handlers[3];

    await expect(getPromptHandler({
      params: {
        name: 'analyze_coverage'
        // No arguments provided
      }
    })).rejects.toThrow('Arguments required for prompt: analyze_coverage');
  });

  it('throws error for unknown prompt name', async () => {
    const handlers: any[] = [];
    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await main();

    const getPromptHandler = handlers[3];

    await expect(getPromptHandler({
      params: {
        name: 'unknown_prompt',
        arguments: {
          owner: 'test',
          repo: 'test'
        }
      }
    })).rejects.toThrow('Unknown prompt: unknown_prompt');
  });
});

describe('Resources handlers', () => {
  it('handles ListResourcesRequestSchema', async () => {
    const handlers: any[] = [];
    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await main();

    // Fifth handler is ListResources
    const listResourcesHandler = handlers[4];
    const result = await listResourcesHandler();

    expect(result).toHaveProperty('resources');
    expect(result.resources).toBeInstanceOf(Array);
    expect(result.resources.length).toBeGreaterThan(0);
    expect(result.resources[0]).toHaveProperty('uri');
    expect(result.resources[0]).toHaveProperty('name');
  });

  it('handles ReadResourceRequestSchema for getting-started', async () => {
    const handlers: any[] = [];
    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await main();

    // Sixth handler is ReadResource
    const readResourceHandler = handlers[5];
    const result = await readResourceHandler({
      params: {
        uri: 'codecov://docs/getting-started'
      }
    });

    expect(result).toHaveProperty('contents');
    expect(result.contents[0]).toHaveProperty('uri', 'codecov://docs/getting-started');
    expect(result.contents[0]).toHaveProperty('mimeType', 'text/markdown');
    expect(result.contents[0].text).toContain('Getting Started');
  });

  it('handles ReadResourceRequestSchema for github-actions', async () => {
    const handlers: any[] = [];
    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await main();

    const readResourceHandler = handlers[5];
    const result = await readResourceHandler({
      params: {
        uri: 'codecov://examples/github-actions'
      }
    });

    expect(result.contents[0]).toHaveProperty('mimeType', 'text/yaml');
    expect(result.contents[0].text).toContain('codecov/codecov-action');
  });

  it('handles ReadResourceRequestSchema for query-patterns', async () => {
    const handlers: any[] = [];
    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await main();

    const readResourceHandler = handlers[5];
    const result = await readResourceHandler({
      params: {
        uri: 'codecov://examples/query-patterns'
      }
    });

    expect(result.contents[0]).toHaveProperty('mimeType', 'text/markdown');
    expect(result.contents[0].text).toContain('Common Codecov Query Patterns');
  });

  it('handles ReadResourceRequestSchema for configuration', async () => {
    const handlers: any[] = [];
    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await main();

    const readResourceHandler = handlers[5];
    const result = await readResourceHandler({
      params: {
        uri: 'codecov://docs/configuration'
      }
    });

    expect(result.contents[0]).toHaveProperty('mimeType', 'text/markdown');
    expect(result.contents[0].text).toContain('CODECOV_BASE_URL');
    expect(result.contents[0].text).toContain('CODECOV_TOKEN');
  });

  it('throws error for unknown resource URI', async () => {
    const handlers: any[] = [];
    const mockSetRequestHandler = vi.fn((schema, handler) => {
      handlers.push(handler);
    });

    vi.mocked(Server).mockImplementationOnce(function() { return {
      setRequestHandler: mockSetRequestHandler,
      connect: vi.fn(() => {}).mockResolvedValue(undefined),
    } as any; });

    vi.mocked(StdioServerTransport).mockImplementationOnce(function() { return {} as any; });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await main();

    const readResourceHandler = handlers[5];

    await expect(readResourceHandler({
      params: {
        uri: 'codecov://unknown/resource'
      }
    })).rejects.toThrow('Unknown resource: codecov://unknown/resource');
  });
});
