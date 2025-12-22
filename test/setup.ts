import { vi, beforeEach } from 'vitest';

// Mock global fetch - vitest v4 requires function implementation
global.fetch = vi.fn(async () => ({
  ok: true,
  status: 200,
  json: async () => ({}),
})) as any;

// Reset mocks and environment before each test
beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  // Clear environment variables
  delete process.env.CODECOV_BASE_URL;
  delete process.env.CODECOV_TOKEN;
});
