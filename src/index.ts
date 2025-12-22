#!/usr/bin/env node

import { realpathSync } from 'fs';
import { fileURLToPath } from 'url';

// Re-export all public APIs for backward compatibility
export type { CodecovConfig } from './types.js';
export { getConfig, logConfigurationWarnings, getPackageVersion, validateConfigForExecution } from './config.js';
export { CodecovClient } from './client.js';
export { TOOLS, createToolHandler } from './tools.js';
export { PROMPTS, createPromptHandler } from './prompts.js';
export { RESOURCES, createResourceHandler } from './resources.js';
export { startServer, main } from './server.js';

// Import for direct execution
import { startServer } from './server.js';

/**
 * Check if this file is being executed directly
 * We need to resolve symlinks because npm bin creates symlinks to the real file
 */
function isMainModule(): boolean {
  try {
    // Get the real path of the current module
    const currentModulePath = fileURLToPath(import.meta.url);

    // Get the real path of the executed script (resolves symlinks)
    const executedScriptPath = realpathSync(process.argv[1]);

    return currentModulePath === executedScriptPath;
  } catch {
    // If we can't determine, assume it's being run directly (safer for bin usage)
    return true;
  }
}

/**
 * Helper function to handle main errors
 */
export function handleMainError(error: unknown): void {
  console.error("Server error:", error);
  process.exit(1);
}

/**
 * Helper function to run main if conditions are met
 */
export function runMainIfDirect(isDirectExec: boolean): void {
  if (isDirectExec) {
    startServer().catch(handleMainError);
  }
}

// Only run server if this file is being executed directly
if (isMainModule()) {
  startServer().catch(handleMainError);
}
