import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  claudeMemDataDirectory,
  fusionInstallStatePath,
} from '../src/npx-cli/utils/paths.js';

describe('NPX CLI data directory paths', () => {
  let originalDataDir: string | undefined;
  let tempDir: string;

  beforeEach(() => {
    originalDataDir = process.env.CLAUDE_MEM_DATA_DIR;
    tempDir = mkdtempSync(join(tmpdir(), 'ccx-ecc-mem-npx-paths-'));
    process.env.CLAUDE_MEM_DATA_DIR = tempDir;
  });

  afterEach(() => {
    if (originalDataDir === undefined) {
      delete process.env.CLAUDE_MEM_DATA_DIR;
    } else {
      process.env.CLAUDE_MEM_DATA_DIR = originalDataDir;
    }

    rmSync(tempDir, { recursive: true, force: true });
  });

  it('uses CLAUDE_MEM_DATA_DIR for install state paths', () => {
    expect(claudeMemDataDirectory()).toBe(tempDir);
    expect(fusionInstallStatePath()).toBe(join(tempDir, 'install-state.json'));
  });

  it('uses CLAUDE_MEM_DATA_DIR for transcript watch paths in a fresh process', () => {
    const result = Bun.spawnSync({
      cmd: [
        'bun',
        '--eval',
        [
          "import { DEFAULT_CONFIG_PATH, DEFAULT_STATE_PATH } from './src/services/transcripts/config.ts';",
          'console.log(JSON.stringify({ config: DEFAULT_CONFIG_PATH, state: DEFAULT_STATE_PATH }));',
        ].join(' '),
      ],
      cwd: process.cwd(),
      env: {
        ...process.env,
        CLAUDE_MEM_DATA_DIR: tempDir,
      },
    });

    expect(result.exitCode).toBe(0);
    const paths = JSON.parse(result.stdout.toString()) as { config: string; state: string };
    expect(paths.config).toBe(join(tempDir, 'transcript-watch.json'));
    expect(paths.state).toBe(join(tempDir, 'transcript-watch-state.json'));
  });
});
