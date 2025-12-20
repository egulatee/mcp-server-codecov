# MCP Server for Codecov

[![npm version](https://img.shields.io/npm/v/mcp-server-codecov.svg)](https://www.npmjs.com/package/mcp-server-codecov)
[![npm downloads](https://img.shields.io/npm/dm/mcp-server-codecov.svg)](https://www.npmjs.com/package/mcp-server-codecov)
[![codecov](https://codecov.io/gh/egulatee/mcp-server-codecov/branch/main/graph/badge.svg)](https://codecov.io/gh/egulatee/mcp-server-codecov)
![Test and Coverage](https://github.com/egulatee/mcp-server-codecov/workflows/Test%20and%20Coverage/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)
![MCP](https://img.shields.io/badge/MCP-Server-orange.svg)

A Model Context Protocol (MCP) server that provides tools for querying Codecov coverage data. Supports both codecov.io and self-hosted Codecov instances with configurable URL endpoints.

📦 **Published on npm:** [mcp-server-codecov](https://www.npmjs.com/package/mcp-server-codecov)

## Features

- **File-level coverage**: Get detailed line-by-line coverage data for specific files
- **Commit coverage**: Retrieve coverage statistics for individual commits
- **Repository coverage**: Get overall coverage metrics for repositories
- **Configurable URL**: Point to any Codecov instance (codecov.io or self-hosted)
- **Token authentication**: API token support for accessing coverage data

## Token Types

**Important**: Codecov has two different types of tokens:

- **Upload Token**: Used for pushing coverage reports TO Codecov during CI/CD. Found on your repository's Settings → General page.
- **API Token**: Used for reading coverage data FROM Codecov via the API. Created in your Codecov Settings → Access tab.

This MCP server requires an **API token**, not an upload token. To create an API token:

1. Go to your Codecov instance (e.g., `https://codecov.io` or your self-hosted URL)
2. Click on your avatar in the top right → Settings
3. Navigate to the "Access" tab
4. Click "Generate Token" and name it (e.g., "MCP Server API Access")
5. Copy the token value and use it in your configuration

## Installation

### Using npm (Recommended)

The easiest way to use this MCP server is to install it globally via npm:

```bash
npm install -g mcp-server-codecov
```

After installation, the `mcp-server-codecov` command will be available globally and you can use it directly in your MCP configuration.

**Benefits of npm installation:**
- ✅ Simple one-command installation
- ✅ Automatic updates with `npm update -g mcp-server-codecov`
- ✅ No manual build steps required
- ✅ Works across all projects
- ✅ Recommended for production use

### From Source (Development Only)

Only use this method if you're contributing to the project or need to modify the source code:

```bash
git clone https://github.com/egulatee/mcp-server-codecov.git
cd mcp-server-codecov
npm install
npm run build
```

**Note**: For regular usage, prefer the npm installation method above.

## Configuration

The server is configured through environment variables:

- `CODECOV_BASE_URL` (optional): Base URL for the Codecov instance. Defaults to `https://codecov.io`
- `CODECOV_TOKEN` (optional): Authentication token for accessing private repositories

### Example Configuration for Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Using npm package (recommended):**
```json
{
  "mcpServers": {
    "codecov": {
      "command": "npx",
      "args": ["-y", "mcp-server-codecov"],
      "env": {
        "CODECOV_BASE_URL": "https://codecov.io",
        "CODECOV_TOKEN": "your-codecov-token-here"
      }
    }
  }
}
```

<details>
<summary>Using source installation (development only)</summary>

```json
{
  "mcpServers": {
    "codecov": {
      "command": "node",
      "args": ["/path/to/mcp-server-codecov/dist/index.js"],
      "env": {
        "CODECOV_BASE_URL": "https://codecov.io",
        "CODECOV_TOKEN": "your-codecov-token-here"
      }
    }
  }
}
```
</details>

### Example Configuration for Claude Code

#### Option 1: Using CLI (Recommended)

Use the Claude Code CLI to add the MCP server with the npm package:

```bash
claude mcp add --transport stdio codecov \
  --env CODECOV_BASE_URL=https://codecov.io \
  --env CODECOV_TOKEN=${CODECOV_TOKEN} \
  -- npx -y mcp-server-codecov
```

This automatically configures the server in your `~/.claude.json` file.

<details>
<summary>Using CLI with source installation (development only)</summary>

```bash
cd /path/to/codecov-mcp
npm install && npm run build
claude mcp add --transport stdio codecov \
  --env CODECOV_BASE_URL=https://codecov.io \
  --env CODECOV_TOKEN=${CODECOV_TOKEN} \
  -- node /absolute/path/to/codecov-mcp/dist/index.js
```
</details>

#### Option 2: Manual Configuration

Add to your Claude Code MCP settings file at `~/.claude.json`:

**Using npm package (recommended):**
```json
{
  "mcpServers": {
    "codecov": {
      "command": "npx",
      "args": ["-y", "mcp-server-codecov"],
      "env": {
        "CODECOV_BASE_URL": "https://codecov.io",
        "CODECOV_TOKEN": "${CODECOV_TOKEN}"
      }
    }
  }
}
```

<details>
<summary>Using source installation (development only)</summary>

```json
{
  "mcpServers": {
    "codecov": {
      "command": "node",
      "args": ["/absolute/path/to/codecov-mcp/dist/index.js"],
      "env": {
        "CODECOV_BASE_URL": "https://codecov.io",
        "CODECOV_TOKEN": "${CODECOV_TOKEN}"
      }
    }
  }
}
```
</details>

**Notes**:
- Environment variable expansion is supported using `${VAR}` syntax
- Variables like `${CODECOV_TOKEN}` will be read from your shell environment (e.g., from `~/.zshrc` or `~/.bashrc`)
- The `-y` flag for npx automatically accepts the package installation prompt

### Self-Hosted Codecov

For self-hosted Codecov instances, simply set the `CODECOV_BASE_URL` environment variable to your instance URL.

**Claude Desktop:**
```json
{
  "mcpServers": {
    "codecov": {
      "command": "npx",
      "args": ["-y", "mcp-server-codecov"],
      "env": {
        "CODECOV_BASE_URL": "https://codecov.your-company.com",
        "CODECOV_TOKEN": "your-codecov-token-here"
      }
    }
  }
}
```

**Claude Code CLI:**
```bash
claude mcp add --transport stdio codecov \
  --env CODECOV_BASE_URL=https://codecov.your-company.com \
  --env CODECOV_TOKEN=${CODECOV_TOKEN} \
  -- npx -y mcp-server-codecov
```

**Claude Code Manual (`~/.claude.json`):**
```json
{
  "mcpServers": {
    "codecov": {
      "command": "npx",
      "args": ["-y", "mcp-server-codecov"],
      "env": {
        "CODECOV_BASE_URL": "https://codecov.your-company.com",
        "CODECOV_TOKEN": "${CODECOV_TOKEN}"
      }
    }
  }
}
```

## Verification and Troubleshooting

### Verify npm Installation

After installing via npm, verify the package is correctly installed:

```bash
# Check installed version
npm list -g mcp-server-codecov

# Verify command is accessible
which mcp-server-codecov

# Test the package info
npm view mcp-server-codecov version
```

### Verify MCP Server Configuration

After configuring the MCP server, verify it's working correctly:

```bash
# List all configured MCP servers
claude mcp list

# Check the codecov server status
claude mcp get codecov
```

**Expected output for npm installation:**
```
codecov: mcp-server-codecov - ✓ Connected
```

**Troubleshooting connection issues:**
- If you see "Failed to connect", restart Claude Code or Claude Desktop
- Verify environment variables are set correctly: `echo $CODECOV_TOKEN`
- Check the configuration: `claude mcp get codecov`

### Common Issues

**1. 401 Unauthorized Error**

If you get a `401 Unauthorized` error when using the tools:
- **Check token type**: Ensure you're using an **API token** (from Settings → Access), not an upload token
- Ensure `CODECOV_TOKEN` is set in the MCP server's `env` section
- Verify the token is valid and has access to the repository
- For self-hosted instances, confirm you're using the correct `CODECOV_BASE_URL`

**2. Environment Variable Not Expanding**

If `${CODECOV_TOKEN}` isn't being replaced:
- Make sure the variable is exported in your shell (check `~/.zshrc` or `~/.bashrc`)
- Restart Claude Code after setting environment variables
- Verify the variable exists: `echo $CODECOV_TOKEN`

**3. HTTP vs HTTPS**

Always use `https://` for the `CODECOV_BASE_URL`, not `http://`:
- Correct: `https://your-codecov-instance.com`
- Incorrect: `http://your-codecov-instance.com`

**4. Connection Failed**

If the server shows as not connected:
- Check that the path to `dist/index.js` is correct and absolute
- Ensure the server is built: `npm run build`
- Check Claude Code logs for error details

## Available Tools

### get_file_coverage

Get line-by-line coverage data for a specific file.

**Parameters:**
- `owner` (required): Repository owner (username or organization)
- `repo` (required): Repository name
- `file_path` (required): Path to the file within the repository (e.g., 'src/index.ts')
- `ref` (optional): Git reference (branch, tag, or commit SHA)

**Example:**
```
Get coverage for src/index.ts in owner/repo on main branch
```

### get_commit_coverage

Get coverage data for a specific commit.

**Parameters:**
- `owner` (required): Repository owner
- `repo` (required): Repository name
- `commit_sha` (required): Commit SHA

**Example:**
```
Get coverage for commit abc123 in owner/repo
```

### get_repo_coverage

Get overall coverage statistics for a repository.

**Parameters:**
- `owner` (required): Repository owner
- `repo` (required): Repository name
- `branch` (optional): Branch name (defaults to repository's default branch)

**Example:**
```
Get overall coverage for owner/repo on main branch
```

## Testing

This project maintains 97%+ code coverage with comprehensive unit tests using Vitest.

### Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Launch Vitest UI for debugging
npm run test:ui
```

### Coverage Requirements

All code changes must maintain a minimum of 90% coverage across all metrics:

- **Statements**: ≥90% (currently 97.46%)
- **Branches**: ≥90% (currently 93.1%)
- **Functions**: ≥90% (currently 100%)
- **Lines**: ≥90% (currently 97.46%)

Coverage reports are automatically generated in the `coverage/` directory after running `npm run test:coverage`. Open `coverage/index.html` in your browser to view detailed coverage information.

### Continuous Integration

Tests run automatically on:
- Every push to `main` and `develop` branches
- Every pull request targeting `main` or `develop`
- Multiple Node.js versions (18.x, 20.x, 22.x)

Coverage reports are uploaded to Codecov, and PR comments show coverage changes for each pull request.

### Writing Tests

Tests are located in `src/__tests__/` and use Vitest with the following patterns:

- **Unit tests**: Test individual functions and classes in isolation
- **Mocking**: Global fetch is mocked to avoid network calls
- **MCP SDK mocking**: Server components are mocked to prevent actual server startup
- **Edge cases**: All error paths and edge cases are covered

Example test structure:
```typescript
import { describe, it, expect } from 'vitest';
import { getConfig, CodecovClient } from '../index.js';

describe('getConfig', () => {
  it('returns default configuration when no env vars set', () => {
    const config = getConfig();
    expect(config.baseUrl).toBe('https://codecov.io');
  });
});
```

### Contributing Guidelines

When contributing:
1. Write tests for all new functionality
2. Ensure all tests pass: `npm test`
3. Verify coverage meets requirements: `npm run test:coverage`
4. Tests will run automatically in CI when you open a pull request

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch mode for development
npm run watch
```

## API Compatibility

This server uses Codecov's API v2. The API endpoints follow this pattern:

- File coverage: `/api/v2/gh/{owner}/repos/{repo}/file_report/{file_path}`
- Commit coverage: `/api/v2/gh/{owner}/repos/{repo}/commits/{commit_sha}`
- Repository coverage: `/api/v2/gh/{owner}/repos/{repo}`

Currently supports GitHub repositories (`gh`). Support for other providers (GitLab, Bitbucket) can be added by modifying the API paths.

## License

MIT
