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

A Model Context Protocol (MCP) server that provides tools for querying Codecov coverage data. Supports both codecov.io and self-hosted Codecov instances with configurable URL endpoints.

📦 **Published on npm:** [mcp-server-codecov](https://www.npmjs.com/package/mcp-server-codecov)

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

### Prerequisites

Before creating releases, ensure the repository has the `NPM_TOKEN` secret configured:

1. Generate an npm access token:
   - Log in to [npmjs.com](https://www.npmjs.com)
   - Go to Account Settings → Access Tokens
   - Click "Generate New Token" → Choose "Automation" type
   - Copy the generated token

2. Add the token to GitHub repository secrets:
   - Go to your repository on GitHub
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click "Add secret"

### Creating a Release

To create a new release:

1. **Update version and changelog**:
   ```bash
   # Bump version in package.json (major.minor.patch)
   npm version patch  # or 'minor' or 'major'

   # Update CHANGELOG.md with release notes
   # Add entry following Keep a Changelog format
   ```

2. **Commit and push changes**:
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: prepare release v1.0.2"
   git push origin main
   ```

3. **Create and push version tag**:
   ```bash
   # Create annotated tag
   git tag -a v1.0.2 -m "Release v1.0.2"

   # Push tag to trigger release workflow
   git push origin v1.0.2
   ```

4. **Automated workflow runs**:
   The GitHub Actions workflow (`.github/workflows/release.yml`) automatically:
   - Runs all tests to ensure quality
   - Builds the package
   - Publishes to npm with provenance
   - Extracts changelog for this version
   - Creates GitHub release with release notes

5. **Verify release**:
   - Check [GitHub Actions](../../actions) for workflow status
   - Verify package on [npm](https://www.npmjs.com/package/mcp-server-codecov)
   - Check [GitHub Releases](../../releases) for release notes

### Manual Release (Emergency Only)

If the automated workflow fails or for emergency releases:

```bash
# Authenticate with npm
npm adduser

# Publish manually
npm publish --access public

# Create GitHub release manually
gh release create v1.0.2 --title "v1.0.2" --notes-file CHANGELOG.md
```

### Version Numbering

This project follows [Semantic Versioning](https://semver.org/):
- **Major (v2.0.0)**: Breaking changes
- **Minor (v1.1.0)**: New features, backward compatible
- **Patch (v1.0.1)**: Bug fixes, backward compatible

## API Compatibility

This server uses Codecov's API v2. The API endpoints follow this pattern:

- File coverage: `/api/v2/gh/{owner}/repos/{repo}/file_report/{file_path}`
- Commit coverage: `/api/v2/gh/{owner}/repos/{repo}/commits/{commit_sha}`
- Repository coverage: `/api/v2/gh/{owner}/repos/{repo}`

Currently supports GitHub repositories (`gh`). Support for other providers (GitLab, Bitbucket) can be added by modifying the API paths.

## License

MIT
