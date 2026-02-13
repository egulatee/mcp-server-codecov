# Publishing Guide

This guide explains how to publish new versions of `@egulatee/mcp-codecov` to npm.

## Prerequisites

1. **npm account** with publishing permissions for the package
2. **NPM_TOKEN** secret configured in GitHub repository settings
   - **CRITICAL**: Must be a **Granular Access Token** with **bypass 2FA enabled**
   - Classic tokens have been deprecated by npm
   - See "Token Management" section below for detailed setup
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

### Step 3: Trigger Version Bump Workflow

**Automated via GitHub Actions (Recommended)**:

1. Go to the GitHub repository: https://github.com/egulatee/@egulatee/mcp-codecov
2. Navigate to **Actions** → **Version Bump**
3. Click **Run workflow**
4. Select the version bump type:
   - **patch**: Bug fixes (1.0.0 → 1.0.1)
   - **minor**: New features (1.0.0 → 1.1.0)
   - **major**: Breaking changes (1.0.0 → 2.0.0)
5. Click **Run workflow**

The workflow will automatically:
- ✅ Validate you're on the `main` branch
- ✅ Check for a clean working directory
- ✅ Run `npm version` to bump the version
- ✅ Create a git commit and tag
- ✅ Push changes and tags to trigger the release workflow

**Manual via bash script (Deprecated)**:

⚠️ The bash script is deprecated and will be removed in v0.3.0. It's recommended to use the automated workflow above.

If you must use the script:
```bash
# This will show a deprecation warning
./scripts/version-bump.sh patch  # or minor/major
git push origin main --tags
```

### Step 4: Monitor and Verify Publication

The version bump workflow triggers the release workflow, which will automatically:

1. Run all tests and coverage checks
2. Build the package
3. Run integration tests
4. Publish to npm (without provenance - see Security section)
5. Create a GitHub release with auto-generated notes

**Monitor the release workflow**:
```
https://github.com/egulatee/@egulatee/mcp-codecov/actions/workflows/release.yml
```

**Expected workflow duration**: ~40 seconds

**Successful publication indicators**:
- Version bump workflow: ✅ Success
- Release workflow: ✅ Success
- npm package updated: `npm view @egulatee/mcp-codecov version`
- GitHub release created: https://github.com/egulatee/@egulatee/mcp-codecov/releases

**Verify Publication**:

After the workflow completes, verify the package was published:

**Check npm:**
```bash
npm view @egulatee/mcp-codecov version
npm view @egulatee/mcp-codecov dist.tarball
```

**Check GitHub Releases:**
```
https://github.com/egulatee/@egulatee/mcp-codecov/releases
```

**Test Installation:**
```bash
npm install -g @egulatee/mcp-codecov@latest
@egulatee/mcp-codecov --help 2>&1 | head -5
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

# Users install with: npm install @egulatee/mcp-codecov@beta
```

## Troubleshooting

### Workflow Failed to Publish

**Problem**: GitHub Actions workflow completed but npm publish failed

**Common Error - E403 Forbidden**:
```
npm error code E403
npm error 403 Forbidden - Two-factor authentication or granular access token with bypass 2fa enabled is required
```

**Root Cause**: npm token doesn't have bypass 2FA setting enabled

**Solution**:
1. Create a new Granular Access Token at: https://www.npmjs.com/settings/[USERNAME]/tokens/granular-access-tokens/new
2. **CRITICAL**: Enable "Bypass two-factor authentication when using this token to publish"
3. Set permissions: "Packages and scopes" → "Read and write"
4. Select package: `@egulatee/mcp-codecov`
5. Set expiration (max 90 days for granular tokens)
6. Copy token immediately
7. Update GitHub secret: `gh secret set NPM_TOKEN`
8. Re-trigger release by deleting and recreating the tag

**Other Solutions**:
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
- If within 72 hours: `npm unpublish @egulatee/mcp-codecov@1.0.0`

## Security

### npm Provenance

**Note**: npm provenance is currently **disabled** for this package.

The `--provenance` flag was removed from the publish workflow because:
- Granular access tokens may not support provenance attestation
- Publishing workflow works reliably without it
- Can be re-enabled in the future when token types support it

To verify package integrity, users can check:
```bash
# Verify package tarball checksum
npm view @egulatee/mcp-codecov dist.shasum

# Check package integrity
npm view @egulatee/mcp-codecov dist.integrity
```

### Token Management

**NEVER commit NPM_TOKEN to the repository!**

**Creating the Correct Token Type**:

npm has deprecated Classic tokens. You **must** use Granular Access Tokens with specific settings:

1. **Go to**: https://www.npmjs.com/settings/[YOUR_USERNAME]/tokens/granular-access-tokens/new

2. **Token Configuration**:
   - **Name**: "GitHub Actions CI/CD" (or similar)
   - **Expiration**: 90 days maximum (set calendar reminder to rotate)
   - **Packages and scopes**:
     - Select "Read and write"
     - Choose "Only select packages and scopes"
     - Add package: `@egulatee/mcp-codecov`
   - **🚨 CRITICAL SETTING**:
     - **MUST ENABLE**: "Bypass two-factor authentication when using this token to publish"
     - Without this setting, CI/CD publishing will fail with E403 error

3. **Copy token immediately** (it won't be shown again)

4. **Add to GitHub**:
   ```bash
   gh secret set NPM_TOKEN
   # Paste token when prompted
   ```

5. **Set rotation reminder**: Granular tokens expire after 90 days maximum

**Token Rotation Schedule**:
- Rotate tokens every 90 days (before expiration)
- Test new token in a separate workflow run before removing old token
- Keep backup of working token until new one is verified

**Security Best Practices**:
- Store as GitHub secret only (never commit)
- Use minimal scope (only @egulatee/mcp-codecov package)
- Enable bypass 2FA only for CI/CD tokens
- Monitor npm audit logs for unauthorized publish attempts

## Post-Release Checklist

After a successful release:

- [ ] Verify package on npm: `npm view @egulatee/mcp-codecov`
- [ ] Check GitHub release created
- [ ] Test global installation: `npm install -g @egulatee/mcp-codecov`
- [ ] Update documentation if needed
- [ ] Announce release (if major version)
- [ ] Monitor for issues in first 24 hours

## Support

If you encounter issues publishing:

1. Check [GitHub Actions logs](https://github.com/egulatee/@egulatee/mcp-codecov/actions)
2. Verify [npm package page](https://www.npmjs.com/package/@egulatee/mcp-codecov)
3. Review [GitHub releases](https://github.com/egulatee/@egulatee/mcp-codecov/releases)
4. Open an issue if automated publishing is broken
