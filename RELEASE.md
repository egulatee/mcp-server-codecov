# Release Process

This project uses an automated release workflow via GitHub Actions. Releases are published to npm automatically when you push a version tag.

## Prerequisites

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

## Creating a Release

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

## Manual Release (Emergency Only)

If the automated workflow fails or for emergency releases:

```bash
# Authenticate with npm
npm adduser

# Publish manually
npm publish --access public

# Create GitHub release manually
gh release create v1.0.2 --title "v1.0.2" --notes-file CHANGELOG.md
```

## Version Numbering

This project follows [Semantic Versioning](https://semver.org/):
- **Major (v2.0.0)**: Breaking changes
- **Minor (v1.1.0)**: New features, backward compatible
- **Patch (v1.0.1)**: Bug fixes, backward compatible
