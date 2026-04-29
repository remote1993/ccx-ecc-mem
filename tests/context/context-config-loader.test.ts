import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadContextConfig } from '../../src/services/context/ContextConfigLoader.js';
import { ModeManager } from '../../src/services/domain/ModeManager.js';

describe('ContextConfigLoader', () => {
  let originalDataDir: string | undefined;
  let tempDir: string;

  beforeEach(() => {
    originalDataDir = process.env.CLAUDE_MEM_DATA_DIR;
    tempDir = mkdtempSync(join(tmpdir(), 'ccx-context-config-'));
    process.env.CLAUDE_MEM_DATA_DIR = tempDir;
    ModeManager.getInstance().loadMode('code');
  });

  afterEach(() => {
    if (originalDataDir === undefined) {
      delete process.env.CLAUDE_MEM_DATA_DIR;
    } else {
      process.env.CLAUDE_MEM_DATA_DIR = originalDataDir;
    }

    rmSync(tempDir, { recursive: true, force: true });
  });

  it('loads context settings from CLAUDE_MEM_DATA_DIR', () => {
    writeFileSync(join(tempDir, 'settings.json'), JSON.stringify({
      CLAUDE_MEM_CONTEXT_OBSERVATIONS: '7',
      CLAUDE_MEM_CONTEXT_FULL_COUNT: '2',
      CLAUDE_MEM_CONTEXT_SESSION_COUNT: '3',
      CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS: 'true',
    }, null, 2));

    const config = loadContextConfig();

    expect(config.totalObservationCount).toBe(7);
    expect(config.fullObservationCount).toBe(2);
    expect(config.sessionCount).toBe(3);
    expect(config.showReadTokens).toBe(true);
  });
});
