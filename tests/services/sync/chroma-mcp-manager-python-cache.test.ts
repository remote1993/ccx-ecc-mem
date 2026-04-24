import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';

const CHROMA_MCP_MANAGER_PATH = join(
  import.meta.dir, '..', '..', '..', 'src', 'services', 'sync', 'ChromaMcpManager.ts'
);
const source = readFileSync(CHROMA_MCP_MANAGER_PATH, 'utf-8');

describe('ChromaMcpManager Python/cache fallback', () => {
  it('prefers a local Python executable before forcing uv to download a managed runtime', () => {
    expect(source).toContain('resolveLocalPythonForUv');
    expect(source).toContain("const exactBinary = `python${configuredVersion}`");
    expect(source).toContain("spawnSync('python3'");
    expect(source).toContain("return 'python3'");
  });

  it('injects writable uv cache paths into the chroma-mcp subprocess environment', () => {
    expect(source).toContain('UV_CACHE_DIR');
    expect(source).toContain('XDG_CACHE_HOME');
    expect(source).toContain("path.join(dataDir, 'uv-cache')");
  });
});
