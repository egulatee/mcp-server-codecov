# Getting Started with Codecov MCP Server

## Installation

```bash
npm install -g @egulatee/mcp-codecov
```

## Configuration

Set environment variables:
- `CODECOV_BASE_URL`: Codecov instance URL (default: https://codecov.io)
- `CODECOV_TOKEN`: Your Codecov API token
- `CODECOV_CACHE_ENABLED`: Enable response caching (default: true)
- `CODECOV_CACHE_TTL`: Cache time-to-live in milliseconds (default: 300000 = 5 minutes)
- `CODECOV_CACHE_MAX_SIZE`: Maximum cache entries (default: 100)

## Basic Usage

1. Configure your MCP client to use `@egulatee/mcp-codecov`
2. Use the available tools:
   - `get_repo_coverage`: Get overall repository coverage
   - `get_commit_coverage`: Get coverage for specific commit
   - `get_file_coverage`: Get line-by-line file coverage
   - `get_pull_request_coverage`: Get PR coverage data
   - `compare_coverage`: Compare coverage between references

## Example Query

"Show me the coverage for my-org/my-repo"
