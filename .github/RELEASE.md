# Release Process Guide

This comprehensive guide covers the complete release process for `@egulatee/mcp-codecov`, including standard procedures, troubleshooting, rollback procedures, and best practices.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Standard Release Process](#standard-release-process)
3. [Pre-Release Validation](#pre-release-validation)
4. [Troubleshooting](#troubleshooting)
5. [Rollback Procedures](#rollback-procedures)
6. [Emergency Releases](#emergency-releases)
7. [Release Verification](#release-verification)
8. [Best Practices](#best-practices)
9. [Integration with Workflows](#integration-with-workflows)
10. [FAQ](#faq)

---

## Prerequisites

Before creating any release, ensure you have the following configured:

### 1. npm Authentication

You must have an npm account with publish permissions for `@egulatee/mcp-codecov`.

```bash
# Test if you're logged in
npm whoami

# If not logged in, authenticate
npm adduser
```

### 2. GitHub Repository Secrets

The automated release workflow requires the `NPM_TOKEN` secret:

**Creating an npm Automation Token:**

1. Log in to [npmjs.com](https://www.npmjs.com)
2. Navigate to Account Settings → Access Tokens
3. Click "Generate New Token"
4. Select "Automation" type (required for CI/CD)
5. Copy the generated token immediately (you won't see it again)

**Adding Token to GitHub:**

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `NPM_TOKEN`
4. Value: Paste your npm automation token
5. Click "Add secret"

**Verify Secret Exists:**

```bash
gh secret list
# Should show: NPM_TOKEN
```

### 3. Local Development Setup

```bash
# Clone repository
git clone https://github.com/egulatee/mcp-server-codecov.git
cd mcp-server-codecov

# Install dependencies
npm install

# Verify tests pass
npm test

# Verify build succeeds
npm run build
```

### 4. Required Tools

- **Git** (v2.0+)
- **Node.js** (v20.0.0+)
- **npm** (v9.0+)
- **GitHub CLI** (`gh`) - For creating releases and managing issues

```bash
# Verify tool versions
git --version
node --version
npm --version
gh --version
```

---

## Standard Release Process

The standard release process uses automated workflows triggered by Git tags.

### Step 1: Update Version and CHANGELOG

**Choose Version Number:**

Follow [Semantic Versioning](https://semver.org/):
- **Patch** (v1.0.X): Bug fixes, backward compatible
- **Minor** (v1.X.0): New features, backward compatible
- **Major** (vX.0.0): Breaking changes

**Bump Version:**

```bash
# For patch release (1.0.1 → 1.0.2)
npm version patch

# For minor release (1.0.2 → 1.1.0)
npm version minor

# For major release (1.1.0 → 2.0.0)
npm version major
```

This command automatically updates `package.json` and `package-lock.json`.

**Update CHANGELOG.md:**

Follow [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [1.0.2] - 2025-12-21

### Added
- New feature description

### Fixed
- Bug fix description (#issue-number)

### Changed
- Updated behavior description

### Deprecated
- Features marked for removal

### Removed
- Features removed from this version

### Security
- Security vulnerability fixes
```

**Important Notes:**
- Always date entries with ISO format (YYYY-MM-DD)
- Reference issue/PR numbers for traceability
- Use past tense ("Added" not "Add")
- Group changes by category

### Step 2: Commit Changes

```bash
# Stage version and changelog changes
git add package.json package-lock.json CHANGELOG.md

# Commit with conventional commit message
git commit -m "chore: prepare release v1.0.2

- Bumped version to 1.0.2
- Updated CHANGELOG with release notes
- Ready for automated release workflow"

# Push to main
git push origin main
```

### Step 3: Create and Push Tag

**Create Annotated Tag:**

```bash
# Create annotated tag (REQUIRED for workflow)
git tag -a v1.0.2 -m "Release v1.0.2"

# Verify tag created
git tag -l "v1.0.2"
```

**Push Tag to Trigger Workflow:**

```bash
# Push tag to origin (triggers release.yml workflow)
git push origin v1.0.2
```

⚠️ **IMPORTANT:** Pushing the tag triggers the automated release workflow immediately.

### Step 4: Monitor Workflow

**Watch GitHub Actions:**

1. Go to repository → Actions tab
2. Find "Release to npm" workflow run
3. Monitor progress through each step:
   - ✅ Checkout code
   - ✅ Setup Node.js
   - ✅ Install dependencies
   - ✅ Run tests
   - ✅ Build package
   - ✅ Publish to npm
   - ✅ Create GitHub Release

**Via CLI:**

```bash
# List recent workflow runs
gh run list --workflow=release.yml --limit 5

# Watch specific run (get ID from list)
gh run watch <run-id>

# View run logs
gh run view <run-id> --log
```

### Step 5: Verify Release

See [Release Verification](#release-verification) section for detailed verification steps.

---

## Pre-Release Validation

**ALWAYS** perform these validations before creating a release to avoid failed releases.

### Validation Checklist

Run through this checklist before pushing a version tag:

- [ ] **All tests pass locally**
  ```bash
  npm test
  ```

- [ ] **Build succeeds without errors**
  ```bash
  npm run build
  ```

- [ ] **prepublishOnly script succeeds**
  ```bash
  npm run prepublishOnly
  # This runs: npm test && npm run build
  ```

- [ ] **CHANGELOG.md is updated**
  - Version number matches package.json
  - Date is set to today (YYYY-MM-DD)
  - All changes documented
  - Issue/PR references included

- [ ] **Version number is correct**
  - Follows semantic versioning
  - No typos in version string
  - package.json and package-lock.json match

- [ ] **No uncommitted changes**
  ```bash
  git status
  # Should show "working tree clean"
  ```

- [ ] **On main branch and up-to-date**
  ```bash
  git branch --show-current  # Should show "main"
  git pull origin main       # Should show "Already up to date"
  ```

- [ ] **NPM_TOKEN secret is valid**
  ```bash
  gh secret list
  # Verify NPM_TOKEN exists
  ```

- [ ] **npm authentication works**
  ```bash
  npm whoami
  # Should show your npm username
  ```

### Dry-Run Testing

**Test Package Creation Locally:**

```bash
# Create tarball without publishing
npm pack

# Inspect tarball contents
tar -tzf egulatee-mcp-codecov-*.tgz

# Test installation from local tarball
npm install -g ./egulatee-mcp-codecov-*.tgz

# Verify installed package works
mcp-codecov --help

# Clean up
npm uninstall -g @egulatee/mcp-codecov
rm egulatee-mcp-codecov-*.tgz
```

**Test prepublishOnly Script:**

```bash
# This is what runs during npm publish
npm run prepublishOnly

# Verify:
# 1. All tests pass
# 2. Build completes successfully
# 3. dist/ directory is populated
ls -la dist/
```

### Version Number Validation

**Semantic Versioning Rules:**

```bash
# Check current version
npm version --json | jq .@egulatee/mcp-codecov

# Preview version bump (doesn't actually change it)
npm version patch --dry-run
npm version minor --dry-run
npm version major --dry-run
```

**Version Constraints:**
- Must follow format: `MAJOR.MINOR.PATCH`
- Cannot reuse existing version numbers
- Cannot skip versions (1.0.1 → 1.0.3 is invalid)

---

## Troubleshooting

Common issues and solutions when releasing.

### Issue 1: Workflow Doesn't Trigger on Tag Push

**Symptoms:**
- Tag pushed successfully
- No workflow run appears in Actions tab

**Diagnosis:**

```bash
# Verify tag exists on remote
git ls-remote --tags origin | grep v1.0.2

# Check workflow file exists
cat .github/workflows/release.yml

# Verify trigger configuration
grep -A 5 "on:" .github/workflows/release.yml
```

**Solutions:**

1. **Ensure annotated tag** (not lightweight):
   ```bash
   # Wrong: lightweight tag
   git tag v1.0.2

   # Correct: annotated tag
   git tag -a v1.0.2 -m "Release v1.0.2"
   ```

2. **Verify tag pattern** matches workflow trigger:
   ```yaml
   on:
     push:
       tags:
         - 'v*'  # Tag must start with 'v'
   ```

3. **Check workflow permissions:**
   - Go to Settings → Actions → General
   - Ensure "Allow all actions and reusable workflows" is enabled

### Issue 2: npm Authentication Error (ENEEDAUTH)

**Symptoms:**
```
npm error code ENEEDAUTH
npm error need auth This command requires you to be logged in
```

**Diagnosis:**

```bash
# Check if NPM_TOKEN secret exists
gh secret list | grep NPM_TOKEN

# Verify token is valid (cannot view actual value)
# Token must be "Automation" type from npmjs.com
```

**Solutions:**

1. **Regenerate npm token:**
   - Go to npmjs.com → Account Settings → Access Tokens
   - Delete old token (if exists)
   - Create new "Automation" token
   - Update GitHub secret

2. **Update GitHub secret:**
   ```bash
   # Set new token (you'll be prompted for value)
   gh secret set NPM_TOKEN
   # Paste your new npm token when prompted
   ```

3. **Verify token permissions:**
   - Token must have "Automation" type
   - Must have publish permissions for @egulatee/mcp-codecov

### Issue 3: npm Publish Fails (Version Already Exists)

**Symptoms:**
```
npm error You cannot publish over the previously published versions: 1.0.2
```

**Diagnosis:**

```bash
# Check published versions
npm view @egulatee/mcp-codecov versions

# Check if version already exists
npm view @egulatee/mcp-codecov@1.0.2 version
```

**Solutions:**

1. **Bump to next version:**
   ```bash
   # If 1.0.2 exists, bump to 1.0.3
   npm version patch
   git add package.json package-lock.json
   git commit -m "chore: bump to v1.0.3"
   git push origin main

   # Create new tag
   git tag -a v1.0.3 -m "Release v1.0.3"
   git push origin v1.0.3
   ```

2. **Delete local tag** (if not pushed to remote):
   ```bash
   git tag -d v1.0.2
   ```

3. **Do NOT unpublish** unless absolutely necessary (see Rollback Procedures)

### Issue 4: GitHub Release Creation Fails

**Symptoms:**
```
HTTP 422: Validation Failed
Release.tag_name already exists
```

**Diagnosis:**

```bash
# Check if release already exists
gh release view v1.0.2

# List all releases
gh release list
```

**Solutions:**

1. **Delete existing release** (if it's a draft or incorrect):
   ```bash
   gh release delete v1.0.2 --yes
   ```

2. **Edit existing release** instead:
   ```bash
   gh release edit v1.0.2 --notes "Updated release notes"
   ```

### Issue 5: Test Failures During prepublishOnly

**Symptoms:**
```
npm error code ELIFECYCLE
npm error errno 1
npm error @egulatee/mcp-codecov@1.0.2 prepublishOnly: `npm test && npm run build`
```

**Diagnosis:**

```bash
# Run tests locally
npm test

# Check for failing tests
npm test -- --reporter=verbose

# Run specific test file
npm test -- src/__tests__/index.test.ts
```

**Solutions:**

1. **Fix failing tests** before releasing:
   ```bash
   # Identify failures
   npm test

   # Fix code or tests
   # Re-run tests to verify
   npm test
   ```

2. **Verify test script** doesn't use watch mode:
   ```json
   {
     "scripts": {
       "test": "vitest run"  // Correct
       // NOT: "test": "vitest"  // Wrong - watch mode
     }
   }
   ```

3. **Never skip tests** - they exist for a reason

### Issue 6: Build Failures During Release

**Symptoms:**
```
npm error code ELIFECYCLE
npm error @egulatee/mcp-codecov@1.0.2 build: `tsc`
npm error Exit status 2
```

**Diagnosis:**

```bash
# Run build locally
npm run build

# Check TypeScript errors
npx tsc --noEmit

# Verify tsconfig.json is valid
cat tsconfig.json
```

**Solutions:**

1. **Fix TypeScript errors:**
   ```bash
   # Show all errors
   npx tsc --noEmit

   # Fix errors in source files
   # Re-run build
   npm run build
   ```

2. **Verify dependencies installed:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

3. **Check Node.js version compatibility:**
   ```bash
   node --version
   # Must be >= 20.0.0 (check engines in package.json)
   ```

### Issue 7: Network/Timeout Errors

**Symptoms:**
```
npm error network timeout
npm error network This is a problem related to network connectivity
```

**Solutions:**

1. **Retry the workflow:**
   ```bash
   # Re-run failed workflow from GitHub UI
   # Or re-push the tag
   git push origin v1.0.2 --force
   ```

2. **Check npm registry status:**
   - Visit https://status.npmjs.org/
   - Check for ongoing incidents

3. **Increase timeout** (if persistent):
   ```bash
   npm config set timeout 60000
   ```

### Issue 8: Permission Issues

**Symptoms:**
```
npm error 403 Forbidden
npm error You do not have permission to publish
```

**Solutions:**

1. **Verify npm account** has publish permissions:
   ```bash
   npm owner ls @egulatee/mcp-codecov
   # Your username should be listed
   ```

2. **Add yourself as owner** (if needed):
   ```bash
   npm owner add <your-username> @egulatee/mcp-codecov
   ```

3. **Check package scope** (if using scoped package):
   - Scoped packages require organization membership
   - Verify you're part of the organization

---

## Rollback Procedures

What to do if a release has critical bugs or needs to be reverted.

### Scenario 1: Release Has Critical Bug

**If bug discovered immediately after release:**

1. **Assess severity:**
   - **Critical/Blocker**: Proceed with emergency patch
   - **High**: Schedule hotfix within 24 hours
   - **Medium/Low**: Include in next regular release

2. **Create hotfix branch:**
   ```bash
   git checkout -b hotfix/critical-bug-issue<N> main
   ```

3. **Fix bug and test thoroughly:**
   ```bash
   # Make minimal changes to fix bug
   # Run full test suite
   npm test

   # Test prepublishOnly
   npm run prepublishOnly
   ```

4. **Create emergency patch release** (see Emergency Releases section)

### Scenario 2: Unpublish from npm (EXTREME CAUTION)

⚠️ **WARNING:** Unpublishing is highly discouraged and may be prevented by npm policy.

**npm Unpublish Rules:**
- Can only unpublish within 72 hours of publishing
- Cannot unpublish if package has dependencies
- Unpublished versions cannot be reused

**Unpublish Command:**

```bash
# EXTREME CAUTION - Only use if absolutely necessary
npm unpublish @egulatee/mcp-codecov@1.0.2

# Verify unpublished
npm view @egulatee/mcp-codecov@1.0.2
# Should show: npm error 404 Not Found
```

**Better Alternative: Deprecate**

```bash
# Mark version as deprecated (preferred over unpublish)
npm deprecate @egulatee/mcp-codecov@1.0.2 "Critical bug - use v1.0.3 instead"

# Users will see warning when installing:
# npm WARN deprecated @egulatee/mcp-codecov@1.0.2: Critical bug - use v1.0.3 instead
```

### Scenario 3: Delete/Update GitHub Release

**Delete GitHub Release:**

```bash
# Delete release (keeps tag)
gh release delete v1.0.2 --yes

# Optionally delete tag too
git push origin --delete v1.0.2
git tag -d v1.0.2
```

**Update GitHub Release:**

```bash
# Edit release notes
gh release edit v1.0.2 --notes "DEPRECATED: Critical bug found. Use v1.0.3 instead."

# Mark as pre-release
gh release edit v1.0.2 --prerelease
```

### Scenario 4: Version Number Conflicts

**Problem:** Accidentally created wrong version number

**Solution:**

1. **If tag not pushed yet:**
   ```bash
   # Delete local tag
   git tag -d v1.0.2

   # Fix version in package.json
   npm version 1.0.3

   # Create correct tag
   git tag -a v1.0.3 -m "Release v1.0.3"
   ```

2. **If tag already pushed:**
   ```bash
   # Delete remote tag
   git push origin --delete v1.0.2

   # Delete local tag
   git tag -d v1.0.2

   # Create new tag with correct version
   npm version 1.0.3
   git tag -a v1.0.3 -m "Release v1.0.3"
   git push origin v1.0.3
   ```

3. **If already published to npm:**
   - Cannot reuse version number
   - Must bump to next version (1.0.4)
   - Deprecate incorrect version

### Scenario 5: Emergency Patch Release

**Fast-track process for critical fixes:**

1. **Create hotfix branch from tag:**
   ```bash
   git checkout -b hotfix/emergency-fix v1.0.2
   ```

2. **Make minimal fix:**
   ```bash
   # Fix ONLY the critical bug
   # Avoid scope creep - no extra features
   ```

3. **Test thoroughly:**
   ```bash
   npm test
   npm run prepublishOnly
   ```

4. **Bump patch version:**
   ```bash
   npm version patch  # 1.0.2 → 1.0.3
   ```

5. **Update CHANGELOG:**
   ```markdown
   ## [1.0.3] - 2025-12-21

   ### Fixed
   - Critical bug in X causing Y (#issue)
   ```

6. **Merge to main and release:**
   ```bash
   git checkout main
   git merge hotfix/emergency-fix
   git push origin main

   git tag -a v1.0.3 -m "Emergency patch release v1.0.3"
   git push origin v1.0.3
   ```

7. **Deprecate buggy version:**
   ```bash
   npm deprecate @egulatee/mcp-codecov@1.0.2 "Critical bug - upgrade to v1.0.3"
   ```

---

## Emergency Releases

Fast-track procedures for critical production issues.

### When to Use Emergency Release

**Criteria for Emergency Release:**
- Security vulnerability (CVE)
- Data loss/corruption bug
- Service unavailable (complete failure)
- Critical performance regression

**NOT Emergency:**
- Minor bugs
- Feature requests
- Documentation updates
- Code cleanup

### Emergency Release Workflow

**1. Assess and Communicate**

```bash
# Create emergency issue
gh issue create \
  --title "[EMERGENCY] Critical bug in X" \
  --label "critical,bug" \
  --body "## Impact
Production users affected: <number>
Severity: Critical

## Root Cause
<description>

## Proposed Fix
<description>

## Testing Plan
<description>"
```

**2. Create Hotfix Branch**

```bash
# Branch from last stable tag
git checkout -b hotfix/emergency-issue<N> v1.0.2
```

**3. Implement Minimal Fix**

- Fix ONLY the critical issue
- No refactoring
- No additional features
- Keep changes minimal and focused

**4. Expedited Testing**

```bash
# Run full test suite
npm test

# Manual testing of affected functionality
# Smoke test critical paths

# Test prepublishOnly
npm run prepublishOnly
```

**5. Fast-Track Review**

- Get immediate code review from team lead
- Focus on correctness of fix
- Verify no unintended side effects

**6. Release Immediately**

```bash
# Bump patch version
npm version patch

# Update CHANGELOG (brief entry)
cat >> CHANGELOG.md <<EOF
## [1.0.3] - $(date +%Y-%m-%d)

### Fixed
- [EMERGENCY] Critical bug description (#issue)
EOF

# Commit and merge to main
git add .
git commit -m "fix: emergency patch for critical bug

Fixes #<issue-number>"

git checkout main
git merge hotfix/emergency-issue<N>
git push origin main

# Tag and trigger release
git tag -a v1.0.3 -m "Emergency patch release v1.0.3"
git push origin v1.0.3
```

**7. Monitor Release**

```bash
# Watch workflow closely
gh run watch

# Verify npm publish
npm view @egulatee/mcp-codecov@1.0.3

# Verify GitHub release
gh release view v1.0.3
```

**8. Post-Release**

- Deprecate buggy version
- Notify users via GitHub release notes
- Update documentation
- Post-mortem: why didn't tests catch this?

### Testing Requirements for Hotfixes

**Minimum Required Tests:**
- All automated tests pass (`npm test`)
- Affected functionality manually tested
- Regression testing of related features
- Installation test (`npm install -g ./egulatee-mcp-codecov-*.tgz`)

**Acceptable to Skip (for emergency only):**
- Extended integration testing
- Performance benchmarking
- Cross-platform testing (if fix is platform-agnostic)

---

## Release Verification

After a release completes, verify everything worked correctly.

### npm Package Verification

**1. Verify Package Published:**

```bash
# Check latest version
npm view @egulatee/mcp-codecov version

# Should show: 1.0.2 (your new version)

# View full package info
npm view @egulatee/mcp-codecov

# Check published files
npm view @egulatee/mcp-codecov files
```

**2. Verify Package Metadata:**

```bash
# Check package description
npm view @egulatee/mcp-codecov description

# Verify repository URL
npm view @egulatee/mcp-codecov repository.url

# Check homepage
npm view @egulatee/mcp-codecov homepage
```

**3. Test Installation:**

```bash
# Install globally from npm
npm install -g @egulatee/mcp-codecov@1.0.2

# Verify command is available
which mcp-codecov

# Test execution
mcp-codecov --version

# Uninstall
npm uninstall -g @egulatee/mcp-codecov
```

**4. Test with npx:**

```bash
# Test standard MCP pattern
npx -y @egulatee/mcp-codecov

# Should start server without errors
```

### GitHub Release Verification

**1. Verify Release Created:**

```bash
# View release
gh release view v1.0.2

# Should show:
# - title: v1.0.2
# - tag: v1.0.2
# - draft: false
# - prerelease: false
```

**2. Verify Changelog Included:**

```bash
# Check release notes
gh release view v1.0.2 --json body --jq .body

# Should contain changelog from CHANGELOG.md
```

**3. Verify Tag Exists:**

```bash
# List tags
git tag -l "v1.0.2"

# Fetch latest tags
git fetch --tags

# Verify tag on remote
git ls-remote --tags origin | grep v1.0.2
```

### Workflow Verification

**1. Check Workflow Completion:**

```bash
# List recent runs
gh run list --workflow=release.yml --limit 3

# View specific run
gh run view <run-id>

# Should show all steps completed successfully
```

**2. Review Workflow Logs:**

```bash
# View logs for specific run
gh run view <run-id> --log

# Check for any warnings or errors
gh run view <run-id> --log | grep -i error
gh run view <run-id> --log | grep -i warn
```

### Smoke Testing

**1. Test Package Installation:**

```bash
# Create temporary directory
mkdir /tmp/mcp-test && cd /tmp/mcp-test

# Install package
npm install @egulatee/mcp-codecov@1.0.2

# Verify installation
npx mcp-codecov --version

# Clean up
cd ~ && rm -rf /tmp/mcp-test
```

**2. Test MCP Integration:**

```bash
# Test that package works with Claude Desktop
# Add to claude_desktop_config.json:
{
  "mcpServers": {
    "codecov-test": {
      "command": "npx",
      "args": ["-y", "@egulatee/mcp-codecov@1.0.2"],
      "env": {
        "CODECOV_BASE_URL": "https://codecov.io"
      }
    }
  }
}

# Restart Claude Desktop and verify MCP server connects
```

**3. Functional Testing:**

Test core functionality:
- Server starts without errors
- Responds to MCP protocol requests
- Environment variables are read correctly
- API authentication works

### Verification Checklist

After each release, check:

- [ ] **npm package published**
  ```bash
  npm view @egulatee/mcp-codecov@1.0.2
  ```

- [ ] **GitHub release created**
  ```bash
  gh release view v1.0.2
  ```

- [ ] **Changelog in release notes**
  ```bash
  gh release view v1.0.2 --json body
  ```

- [ ] **Git tag exists**
  ```bash
  git tag -l "v1.0.2"
  ```

- [ ] **Workflow completed successfully**
  ```bash
  gh run list --workflow=release.yml --limit 1
  ```

- [ ] **Package installs correctly**
  ```bash
  npx -y @egulatee/mcp-codecov@1.0.2
  ```

- [ ] **README shows latest version**
  - Check npm badge shows correct version
  - GitHub release link is updated

- [ ] **Users can install without issues**
  - Monitor GitHub issues for installation problems
  - Check npm download stats

---

## Best Practices

Guidelines for maintaining high-quality releases.

### Release Preparation

**1. Always Update CHANGELOG First**

```bash
# Before bumping version, update CHANGELOG
vim CHANGELOG.md

# Add entry for new version
## [1.0.2] - 2025-12-21

### Fixed
- Bug description (#42)

# Then bump version
npm version patch
```

**Why:** Ensures changelog is included in the version commit

**2. Never Reuse Version Numbers**

```bash
# Wrong: Deleting tag and reusing version
git tag -d v1.0.2
git tag -a v1.0.2 -m "Different release"  # DON'T DO THIS

# Correct: Bump to next version
npm version patch  # Creates v1.0.3
```

**Why:** npm doesn't allow republishing same version; causes confusion

**3. Test prepublishOnly Locally**

```bash
# Always run this before tagging
npm run prepublishOnly

# Verify:
# - Tests pass
# - Build succeeds
# - No errors or warnings
```

**Why:** Catches failures before the automated workflow runs

**4. Ensure NPM_TOKEN is Valid**

```bash
# Periodically verify token works
gh secret list | grep NPM_TOKEN

# npm tokens expire after 90 days
# Regenerate before expiry
```

**Why:** Prevents last-minute authentication failures

**5. Watch Workflow Progress**

```bash
# Don't just push tag and walk away
git push origin v1.0.2

# Watch the workflow
gh run watch
```

**Why:** Catch issues immediately and respond quickly

**6. Don't Force-Push Tags**

```bash
# Wrong: Force-pushing tag
git push origin v1.0.2 --force  # AVOID THIS

# Correct: Delete and create new tag with different version
git push origin --delete v1.0.2
git tag -a v1.0.3 -m "Release v1.0.3"
git push origin v1.0.3
```

**Why:** Force-pushing tags can confuse users and break workflows

### Version Management

**1. Follow Semantic Versioning Strictly**

```
MAJOR.MINOR.PATCH

Examples:
1.0.0 → 1.0.1  (patch: bug fix)
1.0.1 → 1.1.0  (minor: new feature, backward compatible)
1.1.0 → 2.0.0  (major: breaking change)
```

**2. Document Breaking Changes Prominently**

```markdown
## [2.0.0] - 2025-12-21

### BREAKING CHANGES

- **API endpoint changed**: `/api/v1/` → `/api/v2/`
- **Configuration format**: Now uses YAML instead of JSON
- **Migration guide**: See MIGRATION.md

### Changed
- Complete API redesign for better performance
```

**3. Use Pre-release Versions for Testing**

```bash
# Alpha release
npm version 2.0.0-alpha.1

# Beta release
npm version 2.0.0-beta.1

# Release candidate
npm version 2.0.0-rc.1

# Final release
npm version 2.0.0
```

### Testing Best Practices

**1. Comprehensive Test Coverage**

- Maintain >90% code coverage
- Test edge cases and error paths
- Include integration tests

**2. Never Skip Tests**

```bash
# Wrong: Skipping tests to release faster
npm publish --ignore-scripts  # DON'T DO THIS

# Correct: Fix failing tests before releasing
npm test  # Fix any failures
npm run prepublishOnly
```

**3. Test Installation from Tarball**

```bash
# Before releasing, test local install
npm pack
npm install -g ./egulatee-mcp-codecov-*.tgz
mcp-codecov --version
npm uninstall -g @egulatee/mcp-codecov
```

### Documentation

**1. Keep README and CHANGELOG in Sync**

- Update README version numbers
- Ensure examples reflect latest API
- Document new features immediately

**2. Write Clear Release Notes**

```markdown
## [1.0.2] - 2025-12-21

### Fixed
- Fixed symlink resolution bug preventing npx execution (#28)
  - Added realpathSync() to resolve npm bin symlinks
  - Now works with npx, npm bin, and direct execution
  - Tested across Node.js v20 and v22

### Changed
- Updated README configuration examples to use npx pattern
```

**3. Link to Issues and PRs**

Always reference:
- Issue numbers (#42)
- PR numbers (#43)
- Related documentation

### Security

**1. Audit Dependencies Before Releasing**

```bash
# Check for vulnerabilities
npm audit

# Fix automatically if possible
npm audit fix

# Review changes
git diff package-lock.json
```

**2. Keep npm Token Secure**

- Never commit tokens to repository
- Use GitHub Secrets for automation
- Rotate tokens every 90 days
- Use "Automation" type tokens (read-only where possible)

**3. Enable 2FA on npm Account**

```bash
# Enable 2FA for npm account
npm profile enable-2fa

# Use authentication app (not SMS)
```

### Common Pitfalls to Avoid

❌ **Forgetting to update CHANGELOG**
✅ Update CHANGELOG before every release

❌ **Not testing prepublishOnly locally**
✅ Always run `npm run prepublishOnly` before tagging

❌ **Pushing tag before committing version bump**
✅ Commit package.json changes first, then tag

❌ **Using lightweight tags instead of annotated**
✅ Always use `git tag -a` for releases

❌ **Not watching workflow after pushing tag**
✅ Monitor workflow completion and address failures

❌ **Releasing on Friday afternoon**
✅ Release early in the week to handle issues

❌ **Skipping verification steps**
✅ Complete full verification checklist

❌ **Not documenting breaking changes**
✅ Clearly mark and explain all breaking changes

---

## Integration with Workflows

How release process integrates with other repository workflows.

### Automated Version Bump Workflow

**Location:** `.github/workflows/version-bump.yml`

**Purpose:** Automates version bumping based on conventional commits

**Integration with Releases:**

1. **Commit with conventional format:**
   ```bash
   git commit -m "fix: resolve authentication bug"
   ```

2. **Version bump workflow runs automatically:**
   - Analyzes commit messages since last tag
   - Determines version bump type (major/minor/patch)
   - Updates package.json
   - Updates CHANGELOG.md
   - Creates commit and tag

3. **Release workflow triggers:**
   - Tag push triggers release.yml
   - Automated npm publish
   - GitHub release creation

**Manual Override:**

```bash
# If version bump workflow is not desired for this commit:
git commit -m "chore: update docs [skip ci]"
```

### Milestone Management Integration

**Purpose:** Track features and fixes for each release

**Workflow:**

1. **All issues assigned to milestone:**
   ```bash
   # Example: v1.0.2 milestone
   gh issue list --milestone "v1.0.2"
   ```

2. **Close milestone when releasing:**
   ```bash
   # After successful release
   gh api repos/:owner/:repo/milestones/1 -X PATCH -f state=closed
   ```

3. **Create next milestone:**
   ```bash
   # For next release
   gh api repos/:owner/:repo/milestones \
     -f title="v1.0.3" \
     -f state="open" \
     -f description="Next patch release"
   ```

**Best Practices:**
- Assign all issues to appropriate milestone
- Close milestone only after successful release
- Review milestone before releasing (ensure all issues closed)

### Branch Management

**Release Preparation:**

```
main ─────────┬─────────── v1.0.2 tag
              │
              └─ feature branches merged before release
```

**For Major Releases:**

```
main ─────────┬─────────── v2.0.0 tag
              │
release/v2.0.0 branch (for preparation)
              │
              └─ merge to main when ready
```

**Hotfix Workflow:**

```
main ─────┬───── v1.0.2 tag
          │
          ├───── hotfix/critical-bug
          │      (minimal fix)
          │
          └───── v1.0.3 tag
```

### Issue and PR Linking

**Linking PRs to Releases:**

```markdown
## PR Description Template

Fixes #42
Part of milestone v1.0.2

### Changes
- Fixed authentication bug
- Added test coverage

### Release Notes
<!-- This will be included in CHANGELOG -->
Fixed critical authentication bug affecting npx users
```

**Automated Changelog Generation:**

The release workflow extracts changelog from `CHANGELOG.md`:

```yaml
- name: Extract changelog for this version
  id: changelog
  run: |
    VERSION=${{ steps.get_version.outputs.VERSION }}
    sed -n "/## \[$VERSION\]/,/## \[/p" CHANGELOG.md | sed '$d' > release_notes.md
```

### CI/CD Integration

**Pre-Release Checks:**

```yaml
# .github/workflows/ci.yml runs on all PRs
on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
      - run: npm run build
      - run: npm run test:coverage
```

**Release Workflow:**

```yaml
# .github/workflows/release.yml runs on tag push
on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    steps:
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm publish
      - run: create GitHub release
```

**Quality Gates:**

- All tests must pass before merge to main
- Coverage must be >90%
- Build must succeed
- No security vulnerabilities (npm audit)

### Notification Integration

**Workflow Notifications:**

```yaml
- name: Notify on failure
  if: failure()
  run: |
    gh issue comment <issue-number> \
      --body "Release workflow failed. See [workflow run](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})"
```

**Release Announcements:**

- GitHub release notes (automatic)
- npm package page update (automatic)
- Manual: Update project README
- Manual: Announce in team chat/Discord

---

## FAQ

Frequently asked questions about the release process.

### Q: How often should we release?

**A:** Release frequency depends on changes:
- **Bug fixes:** As soon as tested (patch release)
- **New features:** When feature is complete and tested (minor release)
- **Breaking changes:** Plan carefully, coordinate with users (major release)

**Recommended cadence:**
- **Patch releases:** As needed (weekly if bugs found)
- **Minor releases:** Every 2-4 weeks
- **Major releases:** Every 6-12 months

### Q: Can I skip a version number?

**A:** No, follow sequential versioning:
- ✅ Correct: 1.0.1 → 1.0.2 → 1.0.3
- ❌ Wrong: 1.0.1 → 1.0.3 (skipping 1.0.2)

**Why:** Creates confusion and breaks semantic versioning expectations

### Q: What if I accidentally released the wrong version?

**A:**

1. **Cannot unpublish after 72 hours**
2. **Cannot reuse version numbers**

**Solutions:**
- Deprecate incorrect version
- Release corrected version with next number
- Update documentation to guide users to correct version

```bash
# Deprecate wrong version
npm deprecate @egulatee/mcp-codecov@1.0.2 "Incorrect release - use v1.0.3"

# Release correct version
npm version patch  # 1.0.3
```

### Q: Should I create releases from a branch or from main?

**A:** Always release from `main` branch

**Exception:** Hotfixes for old versions
```bash
# Hotfix for v1.x while main is on v2.x
git checkout -b hotfix/v1.0.3 v1.0.2
# Make fix, test, release as v1.0.3
```

### Q: How do I handle security vulnerabilities?

**A:**

1. **Assess severity** (use CVSS score)
2. **Create private security advisory** on GitHub
3. **Develop fix** in private
4. **Test thoroughly**
5. **Release as patch version**
6. **Publish security advisory** after release
7. **Notify users** via GitHub release notes

```bash
# Security release workflow
git checkout -b security/fix-cve-2025-12345
# Fix vulnerability
npm version patch
# Update CHANGELOG with security notice
git tag -a v1.0.3 -m "Security release v1.0.3"
git push origin v1.0.3
```

### Q: What's the difference between npm deprecate and npm unpublish?

**A:**

**npm deprecate:**
- Package remains available
- Warning shown during install
- Version still works
- Preferred method

**npm unpublish:**
- Removes package completely
- Only allowed within 72 hours
- Version cannot be reused
- Use only as last resort

### Q: Can I test the release workflow without actually publishing?

**A:** Yes, using manual workflow dispatch:

```yaml
# Add to release.yml
on:
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'Dry run (skip npm publish)'
        required: false
        default: 'false'
```

Then use `--dry-run` flag for npm publish in workflow.

**Alternatively:** Test with private npm registry or local verdaccio instance

### Q: How do I release a pre-release version?

**A:**

```bash
# Alpha release
npm version 2.0.0-alpha.1
git tag -a v2.0.0-alpha.1 -m "Alpha release"
git push origin v2.0.0-alpha.1

# When creating GitHub release, mark as pre-release
gh release create v2.0.0-alpha.1 --prerelease --notes "Alpha release for testing"
```

Users install with:
```bash
npm install @egulatee/mcp-codecov@alpha
# or specific version
npm install @egulatee/mcp-codecov@2.0.0-alpha.1
```

### Q: What if the workflow fails halfway through?

**A:**

**Scenario 1: npm publish succeeded, GitHub release failed**
```bash
# Manually create GitHub release
gh release create v1.0.2 --notes "$(sed -n '/## \[1.0.2\]/,/## \[/p' CHANGELOG.md | sed '$d')"
```

**Scenario 2: npm publish failed**
```bash
# Fix the issue (e.g., update NPM_TOKEN)
# Re-push tag to trigger workflow again
git push origin v1.0.2 --force
```

**Scenario 3: Tests failed**
```bash
# Fix tests on main
git checkout main
# Fix issue
git add .
git commit -m "fix: resolve test failure"
git push origin main

# Delete tag and recreate
git push origin --delete v1.0.2
git tag -d v1.0.2
npm version patch  # Bump to v1.0.3
git tag -a v1.0.3 -m "Release v1.0.3"
git push origin v1.0.3
```

### Q: How long does a release take?

**A:** Typical timeline:

- **Preparation:** 15-30 minutes
  - Update CHANGELOG
  - Version bump
  - Testing locally

- **Automated workflow:** 3-5 minutes
  - Tests: 1-2 minutes
  - Build: 30 seconds
  - npm publish: 30 seconds
  - GitHub release: 30 seconds

- **Verification:** 5-10 minutes
  - Check npm package
  - Test installation
  - Verify GitHub release

**Total:** ~30-45 minutes for standard release

### Q: Who can create releases?

**A:**

**Requirements:**
- Repository write access (to push tags)
- npm publish permissions for @egulatee/mcp-codecov
- Access to NPM_TOKEN secret (maintainers only)

**Best practice:**
- Limit release permissions to core maintainers
- Document release process for knowledge transfer
- Require code review before releases

### Q: How do I know if a release was successful?

**A:** Check all of these:

```bash
# 1. Workflow completed successfully
gh run list --workflow=release.yml --limit 1

# 2. npm package published
npm view @egulatee/mcp-codecov@1.0.2

# 3. GitHub release created
gh release view v1.0.2

# 4. Tag exists on remote
git ls-remote --tags origin | grep v1.0.2

# 5. Package installs correctly
npx -y @egulatee/mcp-codecov@1.0.2
```

All must succeed for a successful release.

---

## Additional Resources

- **npm Documentation:** https://docs.npmjs.com/
- **Semantic Versioning:** https://semver.org/
- **Keep a Changelog:** https://keepachangelog.com/
- **GitHub Actions:** https://docs.github.com/en/actions
- **GitHub Releases:** https://docs.github.com/en/repositories/releasing-projects-on-github

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-12-20  
**Maintainer:** MCP Server Codecov Team
