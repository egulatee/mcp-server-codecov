# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2025-12-21

### Fixed
- Fixed server version mismatch causing LobeHub validation failures (#36)
- Server now reports version dynamically from package.json for consistency
- Ensures MCP server metadata matches npm package version

### Added
- Version consistency test to prevent future version drift
- Helper function `getPackageVersion()` to read version from package.json at runtime

## [1.0.1] - 2025-12-20

### Fixed
- Fixed critical bug where MCP server failed to start when executed via npm bin symlink or npx (#28)
- Added proper symlink resolution in main module detection using `realpathSync()`
- Server now correctly starts with all three execution methods:
  - `npx -y mcp-server-codecov` (standard MCP pattern)
  - `mcp-server-codecov` (npm bin symlink)
  - `node /path/to/dist/index.js` (direct execution)

### Changed
- Updated README.md to use standard `npx` configuration pattern
- Removed version-specific path workarounds from documentation
- Configuration now portable across Node.js versions and package managers

## [1.0.0] - 2025-12-19

### Added
- Initial release of MCP server for Codecov
- Support for querying Codecov coverage data via MCP protocol
- Three main tools:
  - `get_file_coverage`: Get line-by-line coverage for specific files
  - `get_commit_coverage`: Get coverage data for specific commits
  - `get_repo_coverage`: Get overall repository coverage statistics
- Configurable URL support for both codecov.io and self-hosted Codecov instances
- API token authentication for private repositories
- Comprehensive test suite with 97%+ code coverage
- Published to npm registry as `mcp-server-codecov`

[1.0.1]: https://github.com/egulatee/mcp-server-codecov/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/egulatee/mcp-server-codecov/releases/tag/v1.0.0
