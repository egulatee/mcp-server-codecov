# Publishing Guide

This guide explains how to publish new versions of `mcp-server-codecov` to npm.

## Prerequisites

1. **npm account** with publishing permissions for the package
2. **NPM_TOKEN** secret configured in GitHub repository settings
3. **Maintainer access** to the repository

## Release Process

### Step 1: Ensure Clean State

Make sure you're on the `main` branch with no uncommitted changes:

```bash
git checkout main
git pull origin main
git status  # Should show clean working tree
```

### Step 2: Run Tests

Verify all tests pass before releasing:

```bash
npm test
npm run test:coverage
npm run build
npm run test:integration
```

### Step 3: Bump Version

Use the version bump script to increment the version number:

```bash
# For patch releases (bug fixes): 0.1.0 -> 0.1.1
./scripts/version-bump.sh patch

# For minor releases (new features): 0.1.1 -> 0.2.0
./scripts/version-bump.sh minor

# For major releases (breaking changes): 0.2.0 -> 1.0.0
./scripts/version-bump.sh major
```

The script will:
- Validate you're on the `main` branch
- Check for a clean working directory
- Run `npm version` to bump the version
- Create a git commit and tag

### Step 4: Push to GitHub

Push the version commit and tags to trigger the automated release:

```bash
git push origin main --tags
```

### Step 5: Monitor Release Workflow

The GitHub Actions release workflow will automatically:

1. Run all tests
2. Build the package
3. Publish to npm with provenance
4. Create a GitHub release

Monitor the workflow at:
```
https://github.com/egulatee/mcp-server-codecov/actions
```

### Step 6: Verify Publication

After the workflow completes, verify the package was published:

**Check npm:**
```bash
npm view mcp-server-codecov version
npm view mcp-server-codecov dist.tarball
```

**Check GitHub Releases:**
```
https://github.com/egulatee/mcp-server-codecov/releases
```

**Test Installation:**
```bash
npm install -g mcp-server-codecov@latest
mcp-server-codecov --help 2>&1 | head -5
```

## Manual Publishing (Emergency Only)

If the automated workflow fails, you can publish manually:

### Prerequisites

```bash
# Login to npm (one time)
npm login
```

### Manual Publish Steps

```bash
# Ensure you're on a clean, tested state
git checkout main
git pull origin main

# Run all tests
npm test
npm run test:coverage

# Build the package
npm run build

# Verify package contents
npm pack --dry-run

# Publish to npm (with provenance if supported)
npm publish --access public

# Create git tag manually if needed
git tag v1.0.0
git push origin v1.0.0

# Create GitHub release manually
gh release create v1.0.0 \
  --title "v1.0.0" \
  --generate-notes
```

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **Major (1.0.0)**: Breaking changes, incompatible API changes
- **Minor (0.1.0)**: New features, backward compatible
- **Patch (0.0.1)**: Bug fixes, backward compatible

## Pre-Release Versions

For beta or alpha releases:

```bash
# Create a pre-release version
npm version prerelease --preid=beta
# Result: 0.1.0 -> 0.1.1-beta.0

# Publish with beta tag
npm publish --tag beta

# Users install with: npm install mcp-server-codecov@beta
```

## Troubleshooting

### Workflow Failed to Publish

**Problem**: GitHub Actions workflow completed but npm publish failed

**Solutions**:
1. Check NPM_TOKEN secret is valid in repository settings
2. Verify token has publish permissions
3. Check if package version already exists (can't republish same version)
4. Try manual publish as fallback

### Version Tag Already Exists

**Problem**: `git tag v1.0.0` fails because tag exists

**Solutions**:
```bash
# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push origin :refs/tags/v1.0.0

# Create new tag
git tag v1.0.0
git push origin v1.0.0
```

### Package Already Published

**Problem**: `npm publish` fails with "version already published"

**Solutions**:
- Cannot unpublish after 72 hours
- Bump to next version instead
- If within 72 hours: `npm unpublish mcp-server-codecov@1.0.0`

## Security

### npm Provenance

We use npm provenance for trusted publishing:

- Enabled via `--provenance` flag
- Uses GitHub OIDC tokens (no long-lived secrets)
- Provides verifiable build attestation
- Users can verify with: `npm view mcp-server-codecov --json | jq .dist.provenance`

### Token Management

**NEVER commit NPM_TOKEN to the repository!**

- Store as GitHub secret only
- Rotate tokens annually
- Use automation tokens (not personal tokens)
- Limit token scope to publish-only if possible

## Post-Release Checklist

After a successful release:

- [ ] Verify package on npm: `npm view mcp-server-codecov`
- [ ] Check GitHub release created
- [ ] Test global installation: `npm install -g mcp-server-codecov`
- [ ] Update documentation if needed
- [ ] Announce release (if major version)
- [ ] Monitor for issues in first 24 hours

## Support

If you encounter issues publishing:

1. Check [GitHub Actions logs](https://github.com/egulatee/mcp-server-codecov/actions)
2. Verify [npm package page](https://www.npmjs.com/package/mcp-server-codecov)
3. Review [GitHub releases](https://github.com/egulatee/mcp-server-codecov/releases)
4. Open an issue if automated publishing is broken
