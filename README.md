# MCP Server for Codecov

[![npm version](https://img.shields.io/npm/v/mcp-server-codecov.svg)](https://www.npmjs.com/package/mcp-server-codecov)
[![npm downloads](https://img.shields.io/npm/dm/mcp-server-codecov.svg)](https://www.npmjs.com/package/mcp-server-codecov)
[![codecov](https://codecov.io/gh/egulatee/mcp-server-codecov/branch/main/graph/badge.svg)](https://codecov.io/gh/egulatee/mcp-server-codecov)
![Test and Coverage](https://github.com/egulatee/mcp-server-codecov/workflows/Test%20and%20Coverage/badge.svg)
[![Security Policy](https://img.shields.io/badge/Security-Policy-blue.svg)](https://github.com/egulatee/mcp-server-codecov/security/policy)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)
![MCP](https://img.shields.io/badge/MCP-Server-orange.svg)
[![MCP Badge](https://lobehub.com/badge/mcp/egulatee-mcp-server-codecov)](https://lobehub.com/mcp/egulatee-mcp-server-codecov)

A Model Context Protocol (MCP) server that provides tools for querying Codecov coverage data. Built with [AI-augmented development](https://www.aiaugmentedsoftwaredevelopment.com/). Supports both codecov.io and self-hosted Codecov instances with configurable URL endpoints.

📦 **Published on npm:** [mcp-server-codecov](https://www.npmjs.com/package/mcp-server-codecov)

> **📖 Learn More**: Read about [building this MCP server with AI in just 2 hours](https://blog.aiaugmentedsoftwaredevelopment.com/posts/building-codecov-mcp-server-in-2-hours/) on our blog about [AI-augmented software development](https://www.aiaugmentedsoftwaredevelopment.com/).

## Quick Start (Claude Code)

Get started in under 2 minutes:

### 1. Get your Codecov API token

Create an API token (not an upload token) from your Codecov account:

1. Go to [codecov.io](https://codecov.io) (or your self-hosted URL)
2. Click your avatar → Settings → Access tab
3. Click "Generate Token" and name it "MCP Server API Access"
4. Copy the token value

### 2. Set your environment variable

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export CODECOV_TOKEN="your-api-token-here"
```

Then reload: `source ~/.zshrc`

### 3. Install the MCP server

```bash
claude mcp add --transport stdio codecov \
  --env CODECOV_BASE_URL=https://codecov.io \
  --env CODECOV_TOKEN=${CODECOV_TOKEN} \
  -- npx -y mcp-server-codecov
```

### 4. Verify installation

```bash
claude mcp get codecov
```

Expected output: `codecov: mcp-server-codecov - ✓ Connected`

**That's it!** You can now use Codecov tools in Claude Code. See [Available Tools](#available-tools) below.

---

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

This MCP server requires an **API token**, not an upload token.

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

## Verification and Troubleshooting

### Common Issues

**1. 401 Unauthorized Error**

- **Check token type**: Ensure you're using an **API token** (from Settings → Access), not an upload token
- Verify the token is valid and has access to the repository
- For self-hosted instances, confirm you're using the correct `CODECOV_BASE_URL`

**2. Environment Variable Not Expanding**

- Make sure the variable is exported in your shell (check `~/.zshrc` or `~/.bashrc`)
- Restart Claude Code after setting environment variables
- Verify the variable exists: `echo $CODECOV_TOKEN`

**3. Connection Failed**

- Restart Claude Code or Claude Desktop
- Verify environment variables are set correctly: `echo $CODECOV_TOKEN`
- Check the configuration: `claude mcp get codecov`

**4. HTTP vs HTTPS**

Always use `https://` for the `CODECOV_BASE_URL`, not `http://`:
- Correct: `https://your-codecov-instance.com`
- Incorrect: `http://your-codecov-instance.com`

## Advanced Configuration

### Self-Hosted Codecov

For self-hosted Codecov instances, use your instance URL:

```bash
claude mcp add --transport stdio codecov \
  --env CODECOV_BASE_URL=https://codecov.your-company.com \
  --env CODECOV_TOKEN=${CODECOV_TOKEN} \
  -- npx -y mcp-server-codecov
```

### Claude Desktop Setup

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

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

### Manual Configuration (Claude Code)

Add to `~/.claude.json`:

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

**Notes**:
- Environment variable expansion is supported using `${VAR}` syntax
- Variables like `${CODECOV_TOKEN}` will be read from your shell environment
- The `-y` flag for npx automatically accepts the package installation prompt

### Installing from npm Globally

```bash
npm install -g mcp-server-codecov
```

**Benefits:**
- Simple one-command installation
- Automatic updates with `npm update -g mcp-server-codecov`
- No manual build steps required
- Works across all projects

**Verify installation:**
```bash
npm list -g mcp-server-codecov
which mcp-server-codecov
npm view mcp-server-codecov version
```

### Development Installation (Source)

Only use this method if you're contributing to the project:

```bash
git clone https://github.com/egulatee/mcp-server-codecov.git
cd mcp-server-codecov
npm install
npm run build
```

Then configure with the built path:

**Claude Code CLI:**
```bash
claude mcp add --transport stdio codecov \
  --env CODECOV_BASE_URL=https://codecov.io \
  --env CODECOV_TOKEN=${CODECOV_TOKEN} \
  -- node /absolute/path/to/codecov-mcp/dist/index.js
```

**Manual (`~/.claude.json`):**
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

**Claude Desktop:**
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

## Testing

This project maintains 97%+ code coverage with comprehensive unit tests using Vitest.

For detailed testing documentation, including how to run tests, coverage requirements, CI integration, and writing tests, see **[TESTING.md](TESTING.md)**.

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch mode for development
npm run watch
```

## Release Process

This project uses an automated release workflow via GitHub Actions. Releases are published to npm automatically when you push a version tag.

For detailed release instructions, including prerequisites, creating releases, manual releases, and version numbering, see **[RELEASE.md](RELEASE.md)**.

## API Compatibility

This server uses Codecov's API v2. The API endpoints follow this pattern:

- File coverage: `/api/v2/gh/{owner}/repos/{repo}/file_report/{file_path}`
- Commit coverage: `/api/v2/gh/{owner}/repos/{repo}/commits/{commit_sha}`
- Repository coverage: `/api/v2/gh/{owner}/repos/{repo}`

Currently supports GitHub repositories (`gh`). Support for other providers (GitLab, Bitbucket) can be added by modifying the API paths.

## Resources & Community

- 📝 [Building the Codecov MCP Server in 2 Hours](https://blog.aiaugmentedsoftwaredevelopment.com/posts/building-codecov-mcp-server-in-2-hours/) - A detailed walkthrough of developing this server using AI-augmented development techniques
- 🌐 [AI Augmented Software Development](https://www.aiaugmentedsoftwaredevelopment.com/) - Explore more about building software with AI assistance

## License

MIT
