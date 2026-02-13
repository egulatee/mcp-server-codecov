# Troubleshooting Guide

This guide helps resolve common issues with the Codecov MCP Server.

## Installation Issues

### Verify npm Package Installation

Before troubleshooting, verify the package is correctly installed:

**Check package version:**
```bash
# Check installed version
npm list -g @egulatee/mcp-codecov

# Verify command exists
which mcp-codecov

# View package info on npm
npm view @egulatee/mcp-codecov version
npm view @egulatee/mcp-codecov dist.tarball
```

**Expected output:**
```
/Users/yourname/.npm-global/lib
└── @egulatee/mcp-codecov@1.0.0

/Users/yourname/.npm-global/bin/mcp-codecov
```

**Verify package contents:**
```bash
# Check installed files
ls -la $(npm root -g)/@egulatee/mcp-codecov/dist/

# Should show:
# index.js
# index.js.map
# index.d.ts
# index.d.ts.map
```

**Test the command:**
```bash
# Should start the MCP server
mcp-codecov

# Expected output:
# Codecov MCP Server running on stdio
# Base URL: https://codecov.io
# Token configured: No (or Yes if CODECOV_TOKEN is set)
```

### "command not found: mcp-codecov"

After global installation, if the command is not found:

**Diagnosis:**
```bash
# Check if npm global bin is in your PATH
npm bin -g
echo $PATH | grep "$(npm bin -g)"
```

**Solution 1: Add npm global bin to PATH**
```bash
# Find npm global bin directory
NPM_BIN=$(npm bin -g)

# Add to your shell profile (~/.zshrc or ~/.bashrc)
echo "export PATH=\"\$PATH:$NPM_BIN\"" >> ~/.zshrc

# Reload shell
source ~/.zshrc
```

**Solution 2: Reinstall globally**
```bash
npm uninstall -g @egulatee/mcp-codecov
npm install -g @egulatee/mcp-codecov
```

**Solution 3: Use npx (temporary)**
```bash
npx @egulatee/mcp-codecov
```

### Permission Denied During Install

**Problem**: `EACCES` or permission errors when installing globally

**Solution 1: Fix npm permissions (Recommended)**
```bash
# Create a directory for global packages
mkdir ~/.npm-global

# Configure npm to use this directory
npm config set prefix '~/.npm-global'

# Add to PATH in ~/.zshrc or ~/.bashrc
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc

# Reinstall package
npm install -g @egulatee/mcp-codecov
```

**Solution 2: Use sudo (Not Recommended)**
```bash
sudo npm install -g @egulatee/mcp-codecov
```

### Package Installation Fails

**Problem**: npm install fails with network or dependency errors

**Diagnosis:**
```bash
# Check npm registry connectivity
npm ping

# Check npm cache
npm cache verify
```

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Try different registry
npm install -g @egulatee/mcp-codecov --registry=https://registry.npmjs.org

# Update npm
npm install -g npm@latest
```

## Configuration Issues

### "CODECOV_BASE_URL must start with http:// or https://"

**Problem**: Environment validation fails on startup

**Cause**: `CODECOV_BASE_URL` is set but doesn't include the protocol

**Solution:**
```bash
# ❌ WRONG
CODECOV_BASE_URL=codecov.io

# ✅ CORRECT
CODECOV_BASE_URL=https://codecov.io
```

Update your configuration:

```json
{
  "mcpServers": {
    "codecov": {
      "command": "mcp-codecov",
      "env": {
        "CODECOV_BASE_URL": "https://codecov.io"
      }
    }
  }
}
```

### WARNING: Using insecure HTTP connection

**Problem**: Server warns about HTTP usage

**Solution**: Change to HTTPS unless you have a specific reason to use HTTP:

```bash
# Change from
CODECOV_BASE_URL=http://codecov.example.com

# To
CODECOV_BASE_URL=https://codecov.example.com
```

### Environment Variables Not Expanding

**Problem**: `${CODECOV_TOKEN}` appears literally instead of being replaced

**Cause**: Variable not exported in shell environment

**Diagnosis:**
```bash
# Check if variable is set
echo $CODECOV_TOKEN

# Check if variable is exported
env | grep CODECOV_TOKEN
```

**Solutions:**

**Solution 1: Export in shell profile**
```bash
# Add to ~/.zshrc or ~/.bashrc
export CODECOV_TOKEN="your-token-here"

# Reload shell
source ~/.zshrc

# Restart Claude Code after exporting
```

**Solution 2: Use literal value in config** (less secure)
```json
{
  "mcpServers": {
    "codecov": {
      "command": "mcp-codecov",
      "env": {
        "CODECOV_TOKEN": "your-actual-token"
      }
    }
  }
}
```

## Runtime Issues

### Connection Failed

**Problem**: MCP server shows as not connected in Claude

**Diagnosis:**
```bash
# Test the server manually
mcp-codecov

# Should show:
# Codecov MCP Server running on stdio
# Base URL: https://codecov.io
# Token configured: Yes/No
```

**Solutions:**

**Check 1: Verify server is built**
```bash
# For source installations only
npm run build
```

**Check 2: Verify configuration path**
```bash
# For Claude Desktop
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# For Claude Code
cat ~/.claude.json
```

**Check 3: Check Claude logs**
- macOS: `~/Library/Logs/Claude/`
- Look for error messages related to MCP servers

**Check 4: Restart Claude**
- Quit Claude completely
- Restart Claude
- Check if server connects

### 401 Unauthorized Error

**Problem**: API requests return `401 Unauthorized`

**Cause 1: Using wrong token type**

Codecov has two token types:
- **Upload Token**: For pushing coverage (found in Settings → General)
- **API Token**: For reading coverage (found in Settings → Access)

**This MCP server requires an API token, not an upload token.**

**Solution:**
1. Go to your Codecov instance (e.g., `https://codecov.io`)
2. Click your avatar → Settings
3. Navigate to "Access" tab
4. Click "Generate Token"
5. Name it (e.g., "MCP Server API Access")
6. Copy the token and update your configuration

**Cause 2: Token invalid or expired**

**Solution:**
```bash
# Test token manually
curl -H "Authorization: bearer YOUR_TOKEN" \
  https://codecov.io/api/v2/gh/owner/repos

# Should return JSON, not 401
```

**Cause 3: Token lacks repository access**

**Solution:**
- Verify token has access to the repository
- For private repos, ensure API token has appropriate permissions
- Try creating a new token with full access

### 404 Not Found Error

**Problem**: API requests return `404 Not Found`

**Possible Causes:**

**Cause 1: Repository doesn't exist or is private**
```bash
# Check repository exists
curl https://codecov.io/gh/owner/repo

# For private repos, ensure token is configured
```

**Cause 2: Wrong base URL**
```bash
# Self-hosted instances must include full URL
CODECOV_BASE_URL=https://codecov.your-company.com  # ✅
CODECOV_BASE_URL=https://your-company.com  # ❌
```

**Cause 3: File path doesn't exist in repository**
```bash
# Verify file exists in repository
gh api repos/owner/repo/contents/path/to/file.ts
```

### Server Starts But Tools Don't Work

**Problem**: Server connects but coverage tools fail

**Diagnosis:**
```bash
# Test with MCP Inspector
npx @modelcontextprotocol/inspector @egulatee/mcp-codecov

# Lists available tools:
# - get_file_coverage
# - get_commit_coverage
# - get_repo_coverage
```

**Solutions:**

**Check 1: Verify tool parameters**
- `owner`: Repository owner (username or organization)
- `repo`: Repository name
- `file_path`: Path within repository (e.g., `src/index.ts`)

**Check 2: Check repository has coverage**
```bash
# Verify coverage exists
curl -H "Authorization: bearer $CODECOV_TOKEN" \
  https://codecov.io/api/v2/gh/owner/repos/repo
```

### Build Failures

**Problem**: `npm run build` fails

**Diagnosis:**
```bash
# Check TypeScript version
npx tsc --version

# Check for type errors
npm run build -- --noEmit
```

**Solutions:**

**Missing dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Type errors:**
```bash
# Check specific errors
npm run build

# Fix type errors in source files
# Then rebuild
npm run build
```

### Test Failures

**Problem**: `npm test` fails

**Diagnosis:**
```bash
# Run tests with verbose output
npm test -- --reporter=verbose

# Check coverage
npm run test:coverage
```

**Solutions:**

**Missing test dependencies:**
```bash
npm install
```

**Integration test failures:**
```bash
# Build first (required for CLI tests)
npm run build

# Run integration tests
npm run test:integration
```

## Claude-Specific Issues

### Server Not Appearing in Claude

**Problem**: MCP server doesn't show in Claude's MCP servers list

**Solutions:**

**For Claude Desktop:**
1. Quit Claude Desktop completely
2. Verify config file exists and is valid JSON:
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   python3 -m json.tool < ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```
3. Restart Claude Desktop
4. Check MCP servers menu

**For Claude Code:**
1. Verify config exists:
   ```bash
   cat ~/.claude.json
   ```
2. Use CLI to verify:
   ```bash
   claude mcp list
   claude mcp get codecov
   ```
3. Restart Claude Code

### Tools Not Available in Conversation

**Problem**: Can't access Codecov tools in conversation

**Solutions:**

1. **Check server status**:
   - Claude Desktop: Check MCP servers menu
   - Claude Code: Run `claude mcp list`

2. **Verify server is running**:
   ```bash
   # Should show "Connected" or similar
   claude mcp get codecov
   ```

3. **Try mentioning tools explicitly**:
   - "Use the get_repo_coverage tool for owner/repo"

## Advanced Troubleshooting

### Debug Mode

Enable detailed logging:

```bash
# Run server with stdio output visible
mcp-codecov 2>&1 | tee /tmp/mcp-debug.log

# Check what's being logged
tail -f /tmp/mcp-debug.log
```

### Verify Package Contents

```bash
# Check what was installed
npm list -g @egulatee/mcp-codecov

# Verify dist folder exists
ls -la $(npm root -g)/@egulatee/mcp-codecov/dist/

# Check package.json
cat $(npm root -g)/@egulatee/mcp-codecov/package.json
```

### Clean Reinstall

```bash
# Complete clean reinstall
npm uninstall -g @egulatee/mcp-codecov
npm cache clean --force
npm install -g @egulatee/mcp-codecov

# Verify
mcp-codecov --help 2>&1 | head -5
```

## Getting Help

If you're still experiencing issues:

1. **Check existing issues**: https://github.com/egulatee/@egulatee/mcp-codecov/issues
2. **Create a new issue** with:
   - Your operating system
   - Node.js version: `node --version`
   - npm version: `npm --version`
   - Installation method (global npm vs source)
   - Error messages (full output)
   - Configuration (with tokens redacted)
3. **Include diagnostic output**:
   ```bash
   # System info
   node --version
   npm --version
   which mcp-codecov
   npm list -g @egulatee/mcp-codecov

   # Test server
   mcp-codecov 2>&1 | head -20
   ```

## Common Patterns

### Fresh Start Checklist

If nothing works, try this complete reset:

```bash
# 1. Uninstall everything
npm uninstall -g @egulatee/mcp-codecov
rm -rf ~/.npm-global/lib/node_modules/@egulatee/mcp-codecov

# 2. Clean npm cache
npm cache clean --force

# 3. Reinstall
npm install -g @egulatee/mcp-codecov

# 4. Verify installation
which mcp-codecov
mcp-codecov 2>&1 | head -5

# 5. Update configuration
# (Edit Claude config files)

# 6. Restart Claude
# (Quit and reopen Claude completely)

# 7. Test connection
# (Check MCP servers in Claude)
```

### Debugging Checklist

Use this checklist to diagnose issues:

- [ ] Server command exists: `which mcp-codecov`
- [ ] Server runs manually: `mcp-codecov`
- [ ] Environment variables set: `echo $CODECOV_TOKEN`
- [ ] Configuration file valid: `python3 -m json.tool < ~/.claude.json`
- [ ] Claude restarted after config changes
- [ ] Server appears in Claude's MCP server list
- [ ] API token (not upload token) configured
- [ ] Base URL includes protocol (`https://`)
- [ ] Repository exists and has coverage data
- [ ] Token has access to repository
