#!/usr/bin/env node
/**
 * Generates dist/tools.json — a static, versioned snapshot of the MCP tool catalog.
 *
 * Run automatically as part of `npm run build`. Consumers that cannot call
 * `tools/list` at startup (e.g. synchronous plugin hosts like OpenClaw) can
 * read this file to register tools without making a live MCP request.
 *
 * Output shape mirrors the MCP `tools/list` response so no translation layer
 * is needed:
 *   {
 *     "version": "2.2.3",
 *     "generatedAt": "2026-02-17T00:00:00.000Z",
 *     "tools": [ { "name": "...", "description": "...", "inputSchema": {...} } ]
 *   }
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read version from package.json (synchronous, no runtime dep required)
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

// Import compiled tool definitions (requires `tsc` to have run first)
const { TOOLS } = await import('../dist/tools.js');

const manifest = {
  version: pkg.version,
  generatedAt: new Date().toISOString(),
  tools: TOOLS,
};

const outPath = join(root, 'dist', 'tools.json');
writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(`tools.json written → dist/tools.json (${TOOLS.length} tools, v${pkg.version})`);
