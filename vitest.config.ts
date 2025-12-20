import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/__tests__/**',
        'dist/**',
        'node_modules/**'
      ],
      lines: 90,
      functions: 90,
      branches: 90,
      statements: 90,
      thresholdAutoUpdate: false,
      watermarks: {
        statements: [90, 95],
        functions: [90, 95],
        branches: [90, 95],
        lines: [90, 95]
      }
    }
  }
});
