import { describe, it, expect, mock } from 'bun:test';
import { SearchManager } from '../../src/services/worker/SearchManager.js';

describe('SearchManager unified search fallback', () => {
  it('falls back to SQLite search when Chroma semantic search throws', async () => {
    const fallbackObservation = {
      id: 1,
      memory_session_id: 'memory-1',
      project: 'demo-project',
      merged_into_project: null,
      platform_source: 'claude',
      type: 'discovery',
      title: 'Recovered via FTS fallback',
      subtitle: null,
      narrative: null,
      text: 'fallback result',
      facts: null,
      concepts: null,
      files_read: null,
      files_modified: null,
      prompt_number: 1,
      created_at: new Date().toISOString(),
      created_at_epoch: Date.now(),
    };

    const sessionSearch = {
      searchObservations: mock(() => [fallbackObservation]),
      searchSessions: mock(() => []),
      searchUserPrompts: mock(() => []),
    };

    const sessionStore = {
      getObservationsByIds: mock(() => []),
      getSessionSummariesByIds: mock(() => []),
      getUserPromptsByIds: mock(() => []),
    };

    const chromaSync = {
      queryChroma: mock(async () => {
        throw new Error('MCP connection to chroma-mcp timed out after 30000ms');
      }),
    };

    const manager = new SearchManager(
      sessionSearch as any,
      sessionStore as any,
      chromaSync as any,
      {} as any,
      {} as any,
    );

    const result = await manager.search({
      query: 'smoke',
      format: 'json',
      project: 'demo-project',
    });

    expect(sessionSearch.searchObservations).toHaveBeenCalledTimes(1);
    expect(result.observations).toEqual([fallbackObservation]);
    expect(result.sessions).toEqual([]);
    expect(result.prompts).toEqual([]);
    expect(result.totalResults).toBe(1);
  });
});
