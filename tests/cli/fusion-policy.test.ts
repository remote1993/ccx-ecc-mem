import { describe, expect, it } from 'bun:test';
import { fusionPolicyHandler } from '../../src/cli/handlers/fusion-policy.js';

const baseInput = {
  sessionId: 'test-session',
  cwd: '/tmp/project',
};

describe('fusionPolicyHandler', () => {
  it('returns no-op for unrelated tools', async () => {
    const result = await fusionPolicyHandler.execute({
      ...baseInput,
      toolName: 'Read',
      toolInput: { file_path: 'README.md' },
    });

    expect(result).toEqual({ continue: true, suppressOutput: true });
  });

  it('warns before editing config files without blocking', async () => {
    const result = await fusionPolicyHandler.execute({
      ...baseInput,
      toolName: 'Edit',
      toolInput: { file_path: 'eslint.config.js' },
    });

    expect(result.continue).toBe(true);
    expect(result.suppressOutput).toBe(true);
    expect(result.systemMessage).toContain('配置/锁文件');
  });

  it('warns before creating non-standard root docs without blocking', async () => {
    const result = await fusionPolicyHandler.execute({
      ...baseInput,
      toolName: 'Write',
      toolInput: { file_path: 'NOTES.md' },
    });

    expect(result.continue).toBe(true);
    expect(result.suppressOutput).toBe(true);
    expect(result.systemMessage).toContain('新的根目录文档');
  });

  it('allows established root docs silently', async () => {
    const result = await fusionPolicyHandler.execute({
      ...baseInput,
      toolName: 'Write',
      toolInput: { file_path: 'README.md' },
    });

    expect(result).toEqual({ continue: true, suppressOutput: true });
  });
});
