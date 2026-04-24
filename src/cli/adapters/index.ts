import type { PlatformAdapter } from '../types.js';
import { claudeCodeAdapter } from './claude-code.js';
import { rawAdapter } from './raw.js';

const PLATFORM_ADAPTERS: Record<string, PlatformAdapter> = {
  'claude-code': claudeCodeAdapter,
  'codex': claudeCodeAdapter,
  'codex-cli': claudeCodeAdapter,
  'raw': rawAdapter,
};

export function getPlatformAdapter(platform: string): PlatformAdapter {
  return PLATFORM_ADAPTERS[platform] ?? rawAdapter;
}

export function getSupportedPlatforms(): string[] {
  return Object.keys(PLATFORM_ADAPTERS);
}

export { PLATFORM_ADAPTERS, claudeCodeAdapter, rawAdapter };
