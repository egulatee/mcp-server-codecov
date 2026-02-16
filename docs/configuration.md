# Configuration Guide

## Environment Variables

### CODECOV_BASE_URL (Optional)
- Default: `https://codecov.io`
- For self-hosted: `https://codecov.yourcompany.com`
- Must start with `http://` or `https://`

### CODECOV_TOKEN (Recommended)
- Required for private repositories
- Optional for public repositories
- Get your token from Codecov settings

### Cache Configuration (Optional)

#### CODECOV_CACHE_ENABLED
- Default: `true`
- Set to `false` to disable response caching
- Reduces API calls and improves response time

#### CODECOV_CACHE_TTL
- Default: `300000` (5 minutes in milliseconds)
- How long cached responses remain valid
- Increase for less frequent data updates
- Decrease for more real-time data

#### CODECOV_CACHE_MAX_SIZE
- Default: `100` entries
- Maximum number of responses to cache
- Adjust based on available memory

## Example Configurations

### Public Repository (codecov.io)
```bash
# No configuration needed for public repos
# Caching enabled by default
```

### Private Repository (codecov.io)
```bash
export CODECOV_TOKEN="your-token-here"
```

### Self-Hosted Codecov
```bash
export CODECOV_BASE_URL="https://codecov.yourcompany.com"
export CODECOV_TOKEN="your-token-here"
```

### Performance Optimization
```bash
# Increase cache size and TTL for better performance
export CODECOV_CACHE_MAX_SIZE="200"
export CODECOV_CACHE_TTL="600000"  # 10 minutes
```

### Disable Caching
```bash
# For testing or real-time requirements
export CODECOV_CACHE_ENABLED="false"
```
