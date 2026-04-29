import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

const forbiddenPackages = [
  'playwright',
  'pm2',
  'jira',
  'googleapis',
  'videodb',
  'fal-ai',
  'ccg-workflow',
];

function readJson(relativePath: string): any {
  return JSON.parse(readFileSync(path.join(projectRoot, relativePath), 'utf-8'));
}

function readSelectedFile(selectedPath: string): string {
  const fullPath = path.join(projectRoot, selectedPath);
  const stat = Bun.file(fullPath);
  if (selectedPath.endsWith('.md') || selectedPath.endsWith('.ts')) return readFileSync(fullPath, 'utf-8');
  return readFileSync(path.join(fullPath, 'SKILL.md'), 'utf-8');
}

function resolveProfileCapabilityIds(registry: any, profileName: string, seen = new Set<string>()): string[] {
  const profile = registry.profiles[profileName];
  if (!profile || seen.has(profileName)) return [];
  seen.add(profileName);
  const inherited = (profile.extends ?? []).flatMap((parent: string) => resolveProfileCapabilityIds(registry, parent, seen));
  return [...new Set([...inherited, ...(profile.capabilities ?? [])])];
}

describe('Fusion dependency policy', () => {
  it('does not add external service SDKs or heavy runtimes to package dependencies', () => {
    const packageJson = readJson('package.json');
    const pluginPackageJson = readJson('plugin/package.json');
    const dependencyNames = new Set([
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.optionalDependencies ?? {}),
      ...Object.keys(pluginPackageJson.dependencies ?? {}),
    ]);

    for (const packageName of forbiddenPackages) {
      expect(dependencyNames.has(packageName)).toBe(false);
    }
  });

  it('keeps non-curated ECC hook runtime out of active hooks.json', () => {
    const hooksContent = readFileSync(path.join(projectRoot, 'plugin/hooks/hooks.json'), 'utf-8');
    expect(hooksContent).not.toContain('everything-claude-code');
    expect(hooksContent).not.toContain('ecc@ecc');
    expect(hooksContent).not.toContain('scripts/hooks/plugin-hook-bootstrap.js');
  });

  it('keeps forbidden runtime terms out of the core fusion surface', () => {
    const registry = readJson('plugin/fusion/registry.json');
    const forbiddenTerms = registry.dependencyPolicy.coreMustAvoid.map((term: string) => term.toLowerCase());
    const capabilitiesById = new Map(registry.capabilities.map((capability: any) => [capability.id, capability]));
    const selectedCapabilities = resolveProfileCapabilityIds(registry, registry.defaultProfile)
      .map((id) => capabilitiesById.get(id))
      .filter((capability: any) => capability?.dependencyTier === 'core');

    for (const capability of selectedCapabilities) {
      const content = readSelectedFile(capability.implementation.path).toLowerCase();
      for (const forbiddenTerm of forbiddenTerms) {
        expect(content.includes(forbiddenTerm)).toBe(false);
      }
    }
  });
});
