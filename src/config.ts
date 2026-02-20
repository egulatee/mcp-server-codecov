import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { CodecovConfig, CacheConfig } from './types.js';

/**
 * Log configuration warnings without blocking server startup
 */
export function logConfigurationWarnings(): void {
  const baseUrl = process.env.CODECOV_BASE_URL;

  if (baseUrl && !baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    console.error("WARNING: CODECOV_BASE_URL must start with http:// or https://");
    console.error(`Received: ${baseUrl}`);
    console.error("Tools will fail at execution time if this URL is invalid.");
  }

  if (baseUrl && baseUrl.startsWith("http://")) {
    console.warn("WARNING: Using insecure HTTP connection. Consider using HTTPS.");
  }
}

/**
 * Parse cache configuration from environment variables
 */
function getCacheConfig(): CacheConfig {
  const enabled = process.env.CODECOV_CACHE_ENABLED !== 'false'; // Default: true
  const ttl = parseInt(process.env.CODECOV_CACHE_TTL || '300000', 10); // Default: 5 minutes
  const maxSize = parseInt(process.env.CODECOV_CACHE_MAX_SIZE || '100', 10); // Default: 100 entries

  return {
    enabled,
    ttl: Number.isNaN(ttl) ? 300000 : ttl,
    maxSize: Number.isNaN(maxSize) ? 100 : maxSize,
  };
}

/**
 * Parse configuration from environment variables
 */
export function getConfig(): CodecovConfig {
  const baseUrl = process.env.CODECOV_BASE_URL || "https://codecov.io";
  const token = process.env.CODECOV_TOKEN;
  const cache = getCacheConfig();

  return { baseUrl, token, cache };
}

/**
 * Validates configuration at tool execution time
 * Returns error message if invalid, undefined if valid
 */
export function validateConfigForExecution(config: CodecovConfig): string | undefined {
  if (!config.baseUrl.startsWith("http://") && !config.baseUrl.startsWith("https://")) {
    return `Invalid CODECOV_BASE_URL: "${config.baseUrl}". Must start with http:// or https://.\n\nPlease set a valid CODECOV_BASE_URL environment variable.`;
  }
  return undefined;
}

/**
 * Reads version from package.json to ensure consistency
 */
export function getPackageVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packageJsonPath = join(__dirname, '../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  /* istanbul ignore next -- only reachable when package.json is missing or unreadable */
  } catch (error) {
    console.error('Warning: Could not read version from package.json');
    return 'unknown'; // Fallback if package.json cannot be read
  }
}
