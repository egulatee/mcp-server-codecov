# Testing

This project maintains 97%+ code coverage with comprehensive unit tests using Vitest.

## Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Launch Vitest UI for debugging
npm run test:ui
```

## Coverage Requirements

All code changes must maintain a minimum of 90% coverage across all metrics:

- **Statements**: ≥90% (currently 97.46%)
- **Branches**: ≥90% (currently 93.1%)
- **Functions**: ≥90% (currently 100%)
- **Lines**: ≥90% (currently 97.46%)

Coverage reports are automatically generated in the `coverage/` directory after running `npm run test:coverage`. Open `coverage/index.html` in your browser to view detailed coverage information.

## Continuous Integration

Tests run automatically on:
- Every push to `main` and `develop` branches
- Every pull request targeting `main` or `develop`
- Multiple Node.js versions (20.x, 22.x)

Coverage reports are uploaded to Codecov, and PR comments show coverage changes for each pull request.

## Writing Tests

Tests are located in `src/__tests__/` and use Vitest with the following patterns:

- **Unit tests**: Test individual functions and classes in isolation
- **Mocking**: Global fetch is mocked to avoid network calls
- **MCP SDK mocking**: Server components are mocked to prevent actual server startup
- **Edge cases**: All error paths and edge cases are covered

Example test structure:
```typescript
import { describe, it, expect } from 'vitest';
import { getConfig, CodecovClient } from '../index.js';

describe('getConfig', () => {
  it('returns default configuration when no env vars set', () => {
    const config = getConfig();
    expect(config.baseUrl).toBe('https://codecov.io');
  });
});
```

## Contributing Guidelines

When contributing:
1. Write tests for all new functionality
2. Ensure all tests pass: `npm test`
3. Verify coverage meets requirements: `npm run test:coverage`
4. Tests will run automatically in CI when you open a pull request
