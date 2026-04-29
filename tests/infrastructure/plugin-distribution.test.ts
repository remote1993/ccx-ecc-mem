import { describe, it, expect } from 'bun:test';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

/**
 * Regression tests for plugin distribution completeness.
 * Ensures all required files (skills, hooks, manifests) are present
 * and correctly structured for end-user installs.
 *
 * Prevents issue #1187 (missing skills/ directory after install).
 */
describe('Plugin Distribution - Skills', () => {
  const skillPath = path.join(projectRoot, 'plugin/skills/mem-search/SKILL.md');

  it('should include plugin/skills/mem-search/SKILL.md', () => {
    expect(existsSync(skillPath)).toBe(true);
  });

  it('should have valid YAML frontmatter with name and description', () => {
    const content = readFileSync(skillPath, 'utf-8');

    // Must start with YAML frontmatter
    expect(content.startsWith('---\n')).toBe(true);

    // Extract frontmatter
    const frontmatterEnd = content.indexOf('\n---\n', 4);
    expect(frontmatterEnd).toBeGreaterThan(0);

    const frontmatter = content.slice(4, frontmatterEnd);
    expect(frontmatter).toContain('name:');
    expect(frontmatter).toContain('description:');
  });

  it('should reference the 3-layer search workflow', () => {
    const content = readFileSync(skillPath, 'utf-8');
    // The skill must document the search → timeline → get_observations workflow
    expect(content).toContain('search');
    expect(content).toContain('timeline');
    expect(content).toContain('get_observations');
  });
});

describe('Plugin Distribution - Required Files', () => {
  const requiredFiles = [
    'plugin/hooks/hooks.json',
    'plugin/.claude-plugin/plugin.json',
    'plugin/skills/mem-search/SKILL.md',
    'dist/index.js',
    'dist/index.d.ts',
    'dist/sdk/index.js',
    'dist/sdk/index.d.ts',
    'dist/npx-cli/index.js',
  ];

  for (const filePath of requiredFiles) {
    it(`should include ${filePath}`, () => {
      const fullPath = path.join(projectRoot, filePath);
      expect(existsSync(fullPath)).toBe(true);
    });
  }
});

describe('Plugin Distribution - Manifest Sync', () => {
  it('keeps the root Claude manifest aligned with the published plugin manifest', () => {
    const rootManifest = JSON.parse(readFileSync(path.join(projectRoot, '.claude-plugin/plugin.json'), 'utf-8'));
    const publishedManifest = JSON.parse(readFileSync(path.join(projectRoot, 'plugin/.claude-plugin/plugin.json'), 'utf-8'));
    const expectedRootManifest = {
      ...publishedManifest,
      skills: publishedManifest.skills.map((entry: string) => `./plugin/${entry.replace(/^\.\//, '')}`),
      commands: publishedManifest.commands.map((entry: string) => `./plugin/${entry.replace(/^\.\//, '')}`)
    };

    expect(rootManifest).toEqual(expectedRootManifest);
  });

  it('keeps Claude manifests compatible with Claude Code validation', () => {
    const marketplaceManifest = JSON.parse(readFileSync(path.join(projectRoot, '.claude-plugin/marketplace.json'), 'utf-8'));
    const publishedManifest = JSON.parse(readFileSync(path.join(projectRoot, 'plugin/.claude-plugin/plugin.json'), 'utf-8'));

    expect(marketplaceManifest.version).toBeUndefined();
    expect(publishedManifest.features).toBeUndefined();
  });
});

describe('Plugin Distribution - hooks.json Integrity', () => {
  it('should have valid JSON in hooks.json', () => {
    const hooksPath = path.join(projectRoot, 'plugin/hooks/hooks.json');
    const content = readFileSync(hooksPath, 'utf-8');
    const parsed = JSON.parse(content);
    expect(parsed.hooks).toBeDefined();
  });

  it('should reference CLAUDE_PLUGIN_ROOT in all hook commands', () => {
    const hooksPath = path.join(projectRoot, 'plugin/hooks/hooks.json');
    const parsed = JSON.parse(readFileSync(hooksPath, 'utf-8'));

    for (const [eventName, matchers] of Object.entries(parsed.hooks)) {
      for (const matcher of matchers as any[]) {
        for (const hook of matcher.hooks) {
          if (hook.type === 'command') {
            expect(hook.command).toContain('${CLAUDE_PLUGIN_ROOT}');
          }
        }
      }
    }
  });

  it('should include CLAUDE_PLUGIN_ROOT fallback in all hook commands (#1215)', () => {
    const hooksPath = path.join(projectRoot, 'plugin/hooks/hooks.json');
    const parsed = JSON.parse(readFileSync(hooksPath, 'utf-8'));
    const expectedFallbackPath = '$HOME/.claude/plugins/marketplaces/remote1993/plugin';

    for (const [eventName, matchers] of Object.entries(parsed.hooks)) {
      for (const matcher of matchers as any[]) {
        for (const hook of matcher.hooks) {
          if (hook.type === 'command') {
            expect(hook.command).toContain(expectedFallbackPath);
          }
        }
      }
    }
  });

  it('should try cache path before marketplaces fallback in all hook commands (#1533)', () => {
    const hooksPath = path.join(projectRoot, 'plugin/hooks/hooks.json');
    const parsed = JSON.parse(readFileSync(hooksPath, 'utf-8'));
    const cachePath = '$HOME/.claude/plugins/cache/remote1993/ccx-ecc-mem';
    const marketplacesPath = '$HOME/.claude/plugins/marketplaces/remote1993/plugin';

    for (const [eventName, matchers] of Object.entries(parsed.hooks)) {
      for (const matcher of matchers as any[]) {
        for (const hook of matcher.hooks) {
          if (hook.type === 'command') {
            expect(hook.command).toContain(cachePath);
            // Cache lookup must appear before the final marketplaces fallback
            expect(hook.command.indexOf(cachePath)).toBeLessThan(hook.command.indexOf(marketplacesPath));
          }
        }
      }
    }
  });
});

describe('Plugin Distribution - package.json Files Field', () => {
  it('should include only the plugin distribution subpaths required by the npm package', () => {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    expect(packageJson.files).toBeDefined();
    expect(packageJson.files).toContain('.claude-plugin');
    expect(packageJson.files).toContain('plugin/.claude-plugin');
    expect(packageJson.files).toContain('plugin/.mcp.json');
    expect(packageJson.files).toContain('plugin/hooks');
    expect(packageJson.files).toContain('plugin/modes');
    expect(packageJson.files).toContain('plugin/scripts/*.js');
    expect(packageJson.files).toContain('plugin/scripts/*.cjs');
    expect(packageJson.files).toContain('plugin/skills');
    expect(packageJson.files).toContain('plugin/ecc');
    expect(packageJson.files).toContain('plugin/fusion');
    expect(packageJson.files).toContain('plugin/ui');
    expect(packageJson.files).not.toContain('plugin');
  });

  it('should expose preinstalled ECC skills while keeping commands curated', () => {
    const pluginManifest = JSON.parse(readFileSync(path.join(projectRoot, 'plugin/.claude-plugin/plugin.json'), 'utf-8'));
    expect(pluginManifest.skills).toContain('./ecc/skills/');
    expect(pluginManifest.commands).not.toContain('./ecc/commands/');
    expect(pluginManifest.commands).toContain('./fusion/');
  });

  it('should keep non-curated ECC hooks and external MCP catalogs inert', () => {
    const pluginManifest = JSON.parse(readFileSync(path.join(projectRoot, 'plugin/.claude-plugin/plugin.json'), 'utf-8'));
    const manifestText = JSON.stringify(pluginManifest);
    const hooksText = readFileSync(path.join(projectRoot, 'plugin/hooks/hooks.json'), 'utf-8');
    const mcpConfig = JSON.parse(readFileSync(path.join(projectRoot, 'plugin/.mcp.json'), 'utf-8'));

    expect(manifestText).not.toContain('ecc/hooks');
    expect(manifestText).not.toContain('ecc/mcp-configs');
    expect(hooksText).not.toContain('plugin/ecc/hooks/hooks.json');
    expect(Object.keys(mcpConfig.mcpServers)).toEqual(['mcp-search']);
  });

  it('should include the complete preinstalled ECC capability library', () => {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    expect(packageJson.files).toContain('plugin/ecc');
  });
});

describe('Plugin Distribution - Native Claude Resource Dedupe', () => {
  it('should not re-bundle skills already provided by official Claude plugins', () => {
    const installModules = JSON.parse(readFileSync(path.join(projectRoot, 'plugin/ecc/manifests/install-modules.json'), 'utf-8'));
    const installPaths = installModules.modules.flatMap((module: any) => module.paths ?? []);

    expect(existsSync(path.join(projectRoot, 'plugin/ecc/skills/frontend-design/SKILL.md'))).toBe(false);
    expect(installPaths).not.toContain('skills/frontend-design');
  });
});

describe('Plugin Distribution - package.json Entry Points', () => {
  it('should point bin and non-wildcard exports at files produced by the build', () => {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const entryPaths: string[] = [];

    for (const entryPath of Object.values(packageJson.bin ?? {})) {
      entryPaths.push(String(entryPath));
    }

    for (const [exportKey, exportValue] of Object.entries(packageJson.exports ?? {})) {
      if (exportKey.includes('*')) continue;
      if (typeof exportValue === 'string') {
        entryPaths.push(exportValue);
      } else if (exportValue && typeof exportValue === 'object') {
        for (const entryPath of Object.values(exportValue as Record<string, string>)) {
          entryPaths.push(String(entryPath));
        }
      }
    }

    for (const entryPath of entryPaths) {
      expect(existsSync(path.join(projectRoot, entryPath.replace(/^\.\//, '')))).toBe(true);
    }
  });
});

describe('Plugin Distribution - Build Script Verification', () => {
  it('should verify distribution files in build-hooks.js', () => {
    const buildScriptPath = path.join(projectRoot, 'scripts/build-hooks.js');
    const content = readFileSync(buildScriptPath, 'utf-8');

    // Build script must check for critical distribution files
    expect(content).toContain('plugin/skills/mem-search/SKILL.md');
    expect(content).toContain('plugin/hooks/hooks.json');
    expect(content).toContain('plugin/.claude-plugin/plugin.json');
  });
});

describe('Plugin Distribution - Fusion Registry', () => {
  it('should include the curated fusion registry and generated active view', () => {
    const registryPath = path.join(projectRoot, 'plugin/fusion/registry.json');
    const activeViewPath = path.join(projectRoot, 'plugin/fusion/active-view.json');
    expect(existsSync(registryPath)).toBe(true);
    expect(existsSync(activeViewPath)).toBe(true);

    const registry = JSON.parse(readFileSync(registryPath, 'utf-8'));
    const activeView = JSON.parse(readFileSync(activeViewPath, 'utf-8'));
    expect(registry.defaultProfile).toBe('core');
    expect(registry.schema).toBe('capability-registry');
    expect(activeView.defaultProfile).toBe('core');
    expect(activeView.schema).toBe('capability-registry');
    expect(activeView.activeCapabilities.length).toBeGreaterThan(0);
    expect(activeView.activeCapabilities.some((capability: any) => capability.kind === 'skill')).toBe(true);
    expect(activeView.activeCapabilities.some((capability: any) => capability.kind === 'command')).toBe(true);
    expect(activeView.activeCapabilities.some((capability: any) => capability.kind === 'agent')).toBe(false);
    expect(activeView.capabilitiesByStatus.optional.some((capability: any) => capability.kind === 'agent')).toBe(true);
  });

  it('should publish every default active capability implementation path', () => {
    const registryPath = path.join(projectRoot, 'plugin/fusion/registry.json');
    const registry = JSON.parse(readFileSync(registryPath, 'utf-8'));
    const packageJson = JSON.parse(readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'));
    const publishedEntries = packageJson.files as string[];
    const capabilitiesById = new Map(registry.capabilities.map((capability: any) => [capability.id, capability]));

    function resolveProfile(profileName: string, seen = new Set<string>()): string[] {
      const profile = registry.profiles[profileName];
      if (!profile || seen.has(profileName)) return [];
      seen.add(profileName);
      const inherited = (profile.extends ?? []).flatMap((parent: string) => resolveProfile(parent, seen));
      return [...new Set([...inherited, ...(profile.capabilities ?? [])])];
    }

    const activeCapabilities = resolveProfile(registry.defaultProfile)
      .map((id) => capabilitiesById.get(id))
      .filter(Boolean) as any[];

    for (const capability of activeCapabilities) {
      const implementationPath = capability.implementation.path;
      const isPublished = publishedEntries.some((entry) =>
        implementationPath === entry || implementationPath.startsWith(`${entry}/`),
      );
      expect(isPublished).toBe(true);
    }
  });
});

describe('Plugin Distribution - Setup Hook (#1547)', () => {
  it('should not reference removed setup.sh in Setup hook', () => {
    // setup.sh was removed; the Setup hook must not reference it or the
    // plugin silently fails to install on Linux (hooks disabled on setup failure).
    const hooksPath = path.join(projectRoot, 'plugin/hooks/hooks.json');
    const content = readFileSync(hooksPath, 'utf-8');
    expect(content).not.toContain('setup.sh');
  });

  it('should call smart-install.js in the Setup hook', () => {
    const hooksPath = path.join(projectRoot, 'plugin/hooks/hooks.json');
    const parsed = JSON.parse(readFileSync(hooksPath, 'utf-8'));
    const setupHooks: any[] = parsed.hooks['Setup'] ?? [];

    // Collect all command hooks from all matchers
    const commandHooks = setupHooks.flatMap((matcher: any) =>
      (matcher.hooks ?? []).filter((h: any) => h.type === 'command')
    );

    // There must be at least one command hook — otherwise the test vacuously passes
    expect(commandHooks.length).toBeGreaterThan(0);

    // At least one command hook must reference smart-install.js
    const smartInstallHooks = commandHooks.filter((h: any) =>
      h.command?.includes('smart-install.js')
    );
    expect(smartInstallHooks.length).toBeGreaterThan(0);
  });

  it('smart-install.js referenced by Setup hook should exist on disk', () => {
    const smartInstallPath = path.join(projectRoot, 'plugin/scripts/smart-install.js');
    expect(existsSync(smartInstallPath)).toBe(true);
  });
});
