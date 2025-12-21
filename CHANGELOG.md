# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.4] - 2025-12-21

### Added
- **MCP Registry Metadata** for proper LobeHub marketplace discovery (#53)
  - Added `mcpName: "io.github.egulatee/codecov"` field for MCP registry indexing
  - Added `publisher: "egulatee"` field for package attribution
- **Prompts Capability** - 3 interactive prompt templates for common workflows (#53)
  - `analyze_coverage`: Comprehensive repository coverage analysis
  - `compare_commits`: Compare coverage changes between two commits
  - `find_low_coverage`: Identify files with coverage below threshold
- **Resources Capability** - 4 documentation resources for better UX (#53)
  - `codecov://docs/getting-started`: Quick start guide
  - `codecov://examples/github-actions`: CI/CD integration example
  - `codecov://examples/query-patterns`: Common query patterns
  - `codecov://docs/configuration`: Configuration guide
- **Enhanced Package Metadata** - Phase 1 improvements for marketplace scoring (#44)
  - TypeScript declarations reference (`types` field)
  - Modern `exports` field for better module resolution
  - Expanded keywords from 4 to 10 for improved npm discoverability
  - Rich author object format with GitHub profile link
  - `sideEffects: false` flag for better tree-shaking
  - `publishConfig` for public npm access

### Changed
- Server now declares 3 capabilities: `tools`, `prompts`, and `resources`
- Updated test suite to verify new prompts and resources handlers (6 total handlers)

### Fixed
- LobeHub marketplace now properly discovers and displays MCP server (#53)
  - Tools are now visible (3 tools)
  - Prompts are now visible (3 prompts)
  - Resources are now visible (4 resources)
  - Server version correctly displays as 1.0.4

### Impact
- Expected +40-55% improvement in LobeHub marketplace scoring
- Better discoverability through expanded keywords
- Enhanced user experience with prompts and documentation resources
- Improved TypeScript integration for users

## [1.0.3] - 2025-12-21

### Fixed
- Fixed LobeHub validation failures by deferring environment validation (#42)
- Server no longer exits early when `CODECOV_BASE_URL` has invalid format
- Environment validation now logs warnings instead of calling `process.exit(1)`
- Invalid configuration errors now occur at tool execution time with helpful messages

### Changed
- Renamed `validateEnvironment()` to `logConfigurationWarnings()` to reflect new behavior
- Added `validateConfigForExecution()` for runtime configuration validation
- Updated CLI test expectations to verify server continues running with invalid config
- Updated version fallback to 1.0.3

### Added
- Runtime validation test suite to verify server behavior with invalid configuration
- Configuration error messages now include guidance for fixing invalid URLs

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

[1.0.3]: https://github.com/egulatee/mcp-server-codecov/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/egulatee/mcp-server-codecov/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/egulatee/mcp-server-codecov/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/egulatee/mcp-server-codecov/releases/tag/v1.0.0
