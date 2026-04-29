/**
 * Shared path utilities for the NPX CLI.
 *
 * All platform-specific path logic is centralized here so that every command
 * resolves directories in exactly the same way, regardless of OS.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export const PLUGIN_OWNER = 'remote1993';
export const PLUGIN_SLUG = 'ccx-mem';
export const INSTALLED_PLUGIN_ID = `${PLUGIN_SLUG}@${PLUGIN_OWNER}`;
export const DEFAULT_FUSION_PROFILE = 'core';

// ---------------------------------------------------------------------------
// Platform detection
// ---------------------------------------------------------------------------

export const IS_WINDOWS = process.platform === 'win32';

// ---------------------------------------------------------------------------
// Core paths
// ---------------------------------------------------------------------------

/** Root of the Claude Code config directory. */
export function claudeConfigDirectory(): string {
  return process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
}

/** Marketplace install directory for remote1993/ccx-mem. */
export function marketplaceDirectory(): string {
  return join(claudeConfigDirectory(), 'plugins', 'marketplaces', PLUGIN_OWNER, PLUGIN_SLUG);
}

/** Top-level plugins directory. */
export function pluginsDirectory(): string {
  return join(claudeConfigDirectory(), 'plugins');
}

/** Path to `known_marketplaces.json`. */
export function knownMarketplacesPath(): string {
  return join(pluginsDirectory(), 'known_marketplaces.json');
}

/** Path to `installed_plugins.json`. */
export function installedPluginsPath(): string {
  return join(pluginsDirectory(), 'installed_plugins.json');
}

/** Path to `~/.claude/settings.json`. */
export function claudeSettingsPath(): string {
  return join(claudeConfigDirectory(), 'settings.json');
}

/** Plugin cache directory for a specific version. */
export function pluginCacheDirectory(version: string): string {
  return join(pluginsDirectory(), 'cache', PLUGIN_OWNER, PLUGIN_SLUG, version);
}

/** ccx-ecc-mem data directory (default `~/.claude-mem`). */
export function claudeMemDataDirectory(): string {
  if (process.env.CLAUDE_MEM_DATA_DIR) {
    return process.env.CLAUDE_MEM_DATA_DIR;
  }

  const defaultDataDirectory = join(homedir(), '.claude-mem');
  const defaultSettingsPath = join(defaultDataDirectory, 'settings.json');
  if (existsSync(defaultSettingsPath)) {
    try {
      const raw = JSON.parse(readFileSync(defaultSettingsPath, 'utf-8'));
      const settings = raw.env && typeof raw.env === 'object' ? raw.env : raw;
      const configuredDataDirectory = settings.CLAUDE_MEM_DATA_DIR;
      if (typeof configuredDataDirectory === 'string' && configuredDataDirectory.trim()) {
        return configuredDataDirectory.trim();
      }
    } catch {
      // Fall through to the default data directory.
    }
  }

  return defaultDataDirectory;
}

/** Install state persisted for the fused default surface. */
export function fusionInstallStatePath(): string {
  return join(claudeMemDataDirectory(), 'install-state.json');
}

// ---------------------------------------------------------------------------
// NPM package root (where the NPX package lives on disk)
// ---------------------------------------------------------------------------

/**
 * Resolve the root of the installed npm package.
 *
 * After bundling, the CLI entry point lives at `<pkg>/dist/npx-cli/index.js`.
 * Walking up 2 levels from `import.meta.url` reaches the package root
 * where `plugin/` and `package.json` can be found.
 */
export function npmPackageRootDirectory(): string {
  const currentFilePath = fileURLToPath(import.meta.url);
  // <pkg>/dist/npx-cli/index.js  ->  up 2 levels  ->  <pkg>
  const root = join(dirname(currentFilePath), '..', '..');
  if (!existsSync(join(root, 'package.json'))) {
    throw new Error(
      `npmPackageRootDirectory: expected package.json at ${root}. ` +
      `Bundle structure may have changed — update the path walk.`,
    );
  }
  return root;
}

/**
 * Path to the `plugin/` directory bundled inside the npm package.
 */
export function npmPackagePluginDirectory(): string {
  return join(npmPackageRootDirectory(), 'plugin');
}

// ---------------------------------------------------------------------------
// Version helpers
// ---------------------------------------------------------------------------

/**
 * Read the current plugin version from the npm package's
 * `plugin/.claude-plugin/plugin.json` (preferred) or from `package.json`.
 */
export function readPluginVersion(): string {
  // Try plugin.json first (authoritative for plugin version)
  const pluginJsonPath = join(npmPackagePluginDirectory(), '.claude-plugin', 'plugin.json');
  if (existsSync(pluginJsonPath)) {
    try {
      const pluginJson = JSON.parse(readFileSync(pluginJsonPath, 'utf-8'));
      if (pluginJson.version) return pluginJson.version;
    } catch {
      // Fall through to package.json
    }
  }

  // Fall back to package.json at package root
  const packageJsonPath = join(npmPackageRootDirectory(), 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.version) return packageJson.version;
    } catch {
      // Unable to read
    }
  }

  return '0.0.0';
}

// ---------------------------------------------------------------------------
// Installation detection
// ---------------------------------------------------------------------------

/** Returns true if the plugin appears to be installed in the marketplace dir. */
export function isPluginInstalled(): boolean {
  const marketplaceDir = marketplaceDirectory();
  return existsSync(join(marketplaceDir, 'plugin', '.claude-plugin', 'plugin.json'));
}

// ---------------------------------------------------------------------------
// JSON file helpers
// ---------------------------------------------------------------------------

export function ensureDirectoryExists(directoryPath: string): void {
  if (!existsSync(directoryPath)) {
    mkdirSync(directoryPath, { recursive: true });
  }
}

/**
 * @deprecated Use `readJsonSafe` from `../../utils/json-utils.js` instead.
 * Kept as re-export for backward compatibility.
 */
export { readJsonSafe } from '../../utils/json-utils.js';

export function writeJsonFileAtomic(filepath: string, data: any): void {
  ensureDirectoryExists(dirname(filepath));
  writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}
