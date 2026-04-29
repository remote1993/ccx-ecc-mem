import type { EventHandler, NormalizedHookInput, HookResult } from '../types.js';

const CONFIG_FILE_PATTERNS = [
  /(^|\/)\.?(eslint|prettier|biome|markdownlint)rc(\.|$)/i,
  /(^|\/)(eslint|prettier|biome)\.config\.[cm]?[jt]s$/i,
  /(^|\/)tsconfig(\.|$|\.json$)/i,
  /(^|\/)package-lock\.json$/i,
  /(^|\/)bun\.lockb?$/i,
  /(^|\/)pnpm-lock\.yaml$/i,
  /(^|\/)yarn\.lock$/i,
];

const ROOT_DOC_NAMES = new Set([
  'ARCHITECTURE.md',
  'CHANGELOG.md',
  'CLAUDE.md',
  'README.md',
]);

function normalizePath(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.replace(/\\/g, '/') : undefined;
}

function extractTargetPath(input: NormalizedHookInput): string | undefined {
  const toolInput = input.toolInput as Record<string, unknown> | undefined;
  return normalizePath(toolInput?.file_path)
    ?? normalizePath(toolInput?.path)
    ?? normalizePath(toolInput?.notebook_path)
    ?? normalizePath(input.filePath);
}

function isProtectedConfigPath(filePath: string): boolean {
  return CONFIG_FILE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function isNonStandardRootDoc(filePath: string): boolean {
  const parts = filePath.split('/');
  const basename = parts[parts.length - 1];
  if (!basename?.endsWith('.md')) return false;
  if (parts.length > 1) return false;
  return !ROOT_DOC_NAMES.has(basename);
}

export const fusionPolicyHandler: EventHandler = {
  async execute(input: NormalizedHookInput): Promise<HookResult> {
    const toolName = input.toolName;
    if (!toolName || !['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(toolName)) {
      return { continue: true, suppressOutput: true };
    }

    const targetPath = extractTargetPath(input);
    if (!targetPath) {
      return { continue: true, suppressOutput: true };
    }

    if (isProtectedConfigPath(targetPath)) {
      return {
        continue: true,
        suppressOutput: true,
        systemMessage: `Fusion policy: ${targetPath} 是配置/锁文件。除非用户明确要求修改配置，否则应优先修正代码或测试，而不是放宽规则。`,
      };
    }

    if (isNonStandardRootDoc(targetPath)) {
      return {
        continue: true,
        suppressOutput: true,
        systemMessage: `Fusion policy: ${targetPath} 是新的根目录文档。默认优先更新现有 README、CLAUDE、ARCHITECTURE 或 CHANGELOG，避免增加分散文档。`,
      };
    }

    return { continue: true, suppressOutput: true };
  },
};
