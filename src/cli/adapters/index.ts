import type { PlatformAdapter } from '../types.js';
import { claudeCodeAdapter } from './claude-code.js';

const PLATFORM_ADAPTERS: Record<string, PlatformAdapter> = {
  'claude-code': claudeCodeAdapter,
  'codex-cli': claudeCodeAdapter,
};

export function getPlatformAdapter(platform: string): PlatformAdapter {
  const adapter = PLATFORM_ADAPTERS[platform];
  if (!adapter) {
    throw new Error(`Unsupported platform "${platform}". Supported platforms: ${getSupportedPlatforms().join(', ')}`);
  }
  return adapter;
}

export function getSupportedPlatforms(): string[] {
  return ['claude-code', 'codex-cli'];
}

export { PLATFORM_ADAPTERS, claudeCodeAdapter };
