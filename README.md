# MCP Server for Codecov

A Model Context Protocol (MCP) server that provides tools for querying Codecov coverage data. Supports both codecov.io and self-hosted Codecov instances with configurable URL endpoints.

## Features

- **File-level coverage**: Get detailed line-by-line coverage data for specific files
- **Commit coverage**: Retrieve coverage statistics for individual commits
- **Repository coverage**: Get overall coverage metrics for repositories
- **Configurable URL**: Point to any Codecov instance (codecov.io or self-hosted)
- **Token authentication**: Optional token support for private repositories

## Installation

```bash
npm install
npm run build
```

## Configuration

The server is configured through environment variables:

- `CODECOV_BASE_URL` (optional): Base URL for the Codecov instance. Defaults to `https://codecov.io`
- `CODECOV_TOKEN` (optional): Authentication token for accessing private repositories

### Example Configuration for Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

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

### Example Configuration for Claude Code

#### Option 1: CLI Installation (Recommended)

Use the Claude Code CLI to add the MCP server:

```bash
# First, build the server
cd /path/to/codecov-mcp
npm install && npm run build

# Add the MCP server with environment variables
claude mcp add --transport stdio codecov \
  --env CODECOV_BASE_URL=https://codecov.io \
  --env CODECOV_TOKEN=${CODECOV_TOKEN} \
  -- node /absolute/path/to/codecov-mcp/dist/index.js
```

This will automatically configure the server in your `~/.claude.json` file.

#### Option 2: Manual Configuration

Add to your Claude Code MCP settings file at `~/.claude.json`:

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

**Notes**:
- Use absolute paths for the `args` parameter in Claude Code
- Environment variable expansion is supported using `${VAR}` syntax
- Variables like `${CODECOV_TOKEN}` will be read from your shell environment (e.g., from `~/.zshrc` or `~/.bashrc`)

### Self-Hosted Codecov

For self-hosted Codecov instances, set the `CODECOV_BASE_URL` to your instance URL:

**Claude Desktop:**
```json
{
  "mcpServers": {
    "codecov": {
      "command": "node",
      "args": ["/path/to/mcp-server-codecov/dist/index.js"],
      "env": {
        "CODECOV_BASE_URL": "https://codecov.your-company.com",
        "CODECOV_TOKEN": "your-codecov-token-here"
      }
    }
  }
}
```

**Claude Code (CLI):**
```bash
claude mcp add --transport stdio codecov \
  --env CODECOV_BASE_URL=https://codecov.your-company.com \
  --env CODECOV_TOKEN=${CODECOV_TOKEN} \
  -- node /absolute/path/to/codecov-mcp/dist/index.js
```

**Claude Code (Manual - `~/.claude.json`):**
```json
{
  "mcpServers": {
    "codecov": {
      "command": "node",
      "args": ["/absolute/path/to/codecov-mcp/dist/index.js"],
      "env": {
        "CODECOV_BASE_URL": "https://codecov.your-company.com",
        "CODECOV_TOKEN": "${CODECOV_TOKEN}"
      }
    }
  }
}
```

## Verification and Troubleshooting

### Verify Installation

After configuring the MCP server, verify it's working correctly:

```bash
# List all configured MCP servers
claude mcp list

# Check the codecov server status
claude mcp get codecov
```

You should see:
```
codecov: node /path/to/codecov-mcp/dist/index.js - ✓ Connected
```

### Common Issues

**1. 401 Unauthorized Error**

If you get a `401 Unauthorized` error when using the tools:
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
