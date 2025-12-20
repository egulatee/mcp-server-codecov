import { vi, beforeEach } from 'vitest';

// Mock global fetch
global.fetch = vi.fn() as any;

// Reset mocks and environment before each test
beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  // Clear environment variables
  delete process.env.CODECOV_BASE_URL;
  delete process.env.CODECOV_TOKEN;
});
