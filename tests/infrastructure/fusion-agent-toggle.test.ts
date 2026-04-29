import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

function readJson(relativePath: string): any {
  return JSON.parse(readFileSync(path.join(projectRoot, relativePath), 'utf-8'));
}

function resolveProfileCapabilityIds(registry: any, profileName: string, seen = new Set<string>()): string[] {
  const profile = registry.profiles[profileName];
  if (!profile || seen.has(profileName)) return [];
  seen.add(profileName);
  const inherited = (profile.extends ?? []).flatMap((parent: string) => resolveProfileCapabilityIds(registry, parent, seen));
  return [...new Set([...inherited, ...(profile.capabilities ?? [])])];
}

describe('Fusion agent profile toggles', () => {
  it('keeps ECC agents out of the default core profile and active viewer surface', () => {
    const registry = readJson('plugin/fusion/registry.json');
    const activeView = readJson('plugin/fusion/active-view.json');

    const coreIds = resolveProfileCapabilityIds(registry, registry.defaultProfile);
    expect(coreIds.some((id) => id.startsWith('agent.'))).toBe(false);
    expect(activeView.activeCapabilityIds.some((id: string) => id.startsWith('agent.'))).toBe(false);
    expect(activeView.activeCapabilities.some((capability: any) => capability.kind === 'agent')).toBe(false);
  });

  it('marks every ECC agent as optional and disabled by default', () => {
    const registry = readJson('plugin/fusion/registry.json');
    const agents = registry.capabilities.filter((capability: any) => capability.kind === 'agent');

    expect(agents.length).toBeGreaterThan(0);
    for (const agent of agents) {
      expect(agent.status).toBe('optional');
      expect(agent.defaultEnabled).toBe(false);
      expect(agent.dependencyTier).toBe('optional');
      expect(agent.profileTags).not.toContain('core');
    }
  });

  it('makes agents deliberately available through developer and security profiles', () => {
    const registry = readJson('plugin/fusion/registry.json');
    const developerIds = resolveProfileCapabilityIds(registry, 'developer');
    const securityIds = resolveProfileCapabilityIds(registry, 'security');

    expect(developerIds).toContain('agent.codeExplorer');
    expect(developerIds).toContain('agent.codeReviewer');
    expect(developerIds).toContain('agent.buildErrorResolver');
    expect(securityIds).toContain('agent.securityReviewer');
    expect(securityIds).toContain('agent.silentFailureHunter');
  });

  it('does not expose agent paths or agent counts in the default plugin manifest', () => {
    const pluginManifest = readJson('plugin/.claude-plugin/plugin.json');
    const hooksText = readFileSync(path.join(projectRoot, 'plugin/hooks/hooks.json'), 'utf-8');

    expect(pluginManifest.agents).toBeUndefined();
    expect(pluginManifest.features?.agents).toBe(0);
    expect(pluginManifest.features?.optionalAgents).toBeGreaterThan(0);
    expect(JSON.stringify(pluginManifest)).not.toContain('./ecc/agents');
    expect(hooksText).not.toContain('plugin/ecc/agents');
  });
});
