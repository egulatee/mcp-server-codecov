#!/bin/bash
set -e

# ⚠️ DEPRECATION NOTICE ⚠️
# This script is deprecated and will be removed in v0.3.0
# Please use the GitHub Actions workflow instead:
#   https://github.com/egulatee/mcp-server-codecov/actions/workflows/version-bump.yml
#
# To trigger the workflow:
#   1. Go to Actions → Version Bump → Run workflow
#   2. Select version type (major/minor/patch)
#   3. Click "Run workflow"
#
# The automated workflow provides better audit trails and eliminates manual steps.

echo "⚠️  WARNING: This script is deprecated"
echo "Please use the GitHub Actions workflow instead:"
echo "https://github.com/egulatee/mcp-server-codecov/actions/workflows/version-bump.yml"
echo ""
echo "Continuing in 5 seconds... (Press Ctrl+C to cancel)"
sleep 5
echo ""

VERSION_TYPE=${1:-patch}

if [[ ! "$VERSION_TYPE" =~ ^(major|minor|patch)$ ]]; then
  echo "Usage: $0 [major|minor|patch]"
  exit 1
fi

# Ensure on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "Error: Must be on main branch to release"
  echo "Current branch: $CURRENT_BRANCH"
  exit 1
fi

# Ensure clean working directory
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: Working directory not clean"
  echo "Please commit or stash your changes first"
  git status --short
  exit 1
fi

# Bump version
echo "Bumping version ($VERSION_TYPE)..."
npm version $VERSION_TYPE -m "chore(release): v%s"

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")

echo ""
echo "✅ Version bumped to v$NEW_VERSION"
echo ""
echo "To publish, run:"
echo "  git push origin main --tags"
echo ""
echo "This will trigger the automated release workflow that will:"
echo "  1. Run all tests"
echo "  2. Build the package"
echo "  3. Publish to npm"
echo "  4. Create a GitHub release"
