import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

describe('Fusion MCP catalog policy', () => {
  it('keeps the runtime .mcp.json limited to the core memory MCP server', () => {
    const mcpConfigPath = path.join(projectRoot, 'plugin/.mcp.json');
    const mcpConfig = JSON.parse(readFileSync(mcpConfigPath, 'utf-8'));

    expect(Object.keys(mcpConfig.mcpServers)).toEqual(['mcp-search']);
  });

  it('keeps ECC MCP servers as a catalog referenced by the fusion registry', () => {
    const catalogPath = path.join(projectRoot, 'plugin/ecc/mcp-configs/mcp-servers.json');
    const registryPath = path.join(projectRoot, 'plugin/fusion/registry.json');
    const activeViewPath = path.join(projectRoot, 'plugin/fusion/active-view.json');

    expect(existsSync(catalogPath)).toBe(true);

    const registry = JSON.parse(readFileSync(registryPath, 'utf-8'));
    const activeView = JSON.parse(readFileSync(activeViewPath, 'utf-8'));
    expect(registry.catalogPaths.mcpCatalog).toBe('plugin/ecc/mcp-configs/mcp-servers.json');
    expect(activeView.catalogPaths.mcpCatalog).toBe('plugin/ecc/mcp-configs/mcp-servers.json');
    expect(activeView.activeCapabilities.some((capability: any) => capability.kind === 'mcp-catalog')).toBe(false);
  });
});
