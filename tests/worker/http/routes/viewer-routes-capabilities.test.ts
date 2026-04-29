/**
 * ViewerRoutes capability manifest tests
 *
 * Tests the capability API contract without booting the full worker server.
 */

import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import type { Request, Response } from 'express';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { logger } from '../../../../src/utils/logger.js';

let packageRoot = '';

mock.module('../../../../src/shared/paths.js', () => ({
  getPackageRoot: () => packageRoot,
}));

mock.module('../../../../src/npx-cli/commands/ide-detection.js', () => ({
  getDetectedIDEs: () => [],
}));

import { ViewerRoutes } from '../../../../src/services/worker/http/routes/ViewerRoutes.js';

let loggerSpies: ReturnType<typeof spyOn>[] = [];

function createMockResponse(): { res: Partial<Response>; jsonSpy: ReturnType<typeof mock>; statusSpy: ReturnType<typeof mock> } {
  const jsonSpy = mock(() => {});
  const statusSpy = mock(() => ({ json: jsonSpy }));
  return {
    res: { json: jsonSpy, status: statusSpy, setHeader: mock(() => {}), send: mock(() => {}) } as unknown as Partial<Response>,
    jsonSpy,
    statusSpy,
  };
}

function createRoutes(sessionStore: any = { getProjectCatalog: mock(() => ({ projects: [], sources: [], projectsBySource: {} })) }): ViewerRoutes {
  return new ViewerRoutes(
    { addClient: mock(() => {}), broadcast: mock(() => {}) } as any,
    { getSessionStore: mock(() => sessionStore) } as any,
    { getActiveSessionCount: mock(() => 0), isAnySessionProcessing: mock(() => false), getTotalActiveWork: mock(() => 0) } as any,
  );
}

function getHandler(path: string, sessionStore?: any): (req: Request, res: Response) => void {
  let handler: ((req: Request, res: Response) => void) | undefined;
  const routes = createRoutes(sessionStore);
  const app = {
    use: mock(() => {}),
    get: mock((routePath: string, fn: (req: Request, res: Response) => void) => {
      if (routePath === path) handler = fn;
    }),
  };
  routes.setupRoutes(app as any);
  if (!handler) throw new Error(`Handler not registered for ${path}`);
  return handler;
}

describe('ViewerRoutes capabilities API', () => {
  beforeEach(() => {
    packageRoot = mkdtempSync(join(tmpdir(), 'viewer-capabilities-'));
    loggerSpies = [
      spyOn(logger, 'error').mockImplementation(() => {}),
      spyOn(logger, 'failure').mockImplementation(() => {}),
      spyOn(logger, 'warn').mockImplementation(() => {}),
    ];
  });

  afterEach(() => {
    loggerSpies.forEach(spy => spy.mockRestore());
    rmSync(packageRoot, { recursive: true, force: true });
    mock.restore();
  });

  it('returns the generated active-view manifest', () => {
    mkdirSync(join(packageRoot, 'fusion'), { recursive: true });
    writeFileSync(join(packageRoot, 'fusion', 'active-view.json'), JSON.stringify({
      defaultProfile: 'core',
      defaultLocale: 'zh-CN',
      capabilitiesByStatus: { active: [{ id: 'memory.search' }], optional: [], reference: [], archived: [] },
      dependencySummary: { core: 1, optional: 0, heavy: 0, external: 0 },
    }));

    const { res, jsonSpy, statusSpy } = createMockResponse();
    getHandler('/api/viewer/capabilities')({ path: '/api/viewer/capabilities' } as Request, res as Response);

    expect(statusSpy).not.toHaveBeenCalled();
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      defaultProfile: 'core',
      capabilitiesByStatus: expect.objectContaining({ active: [{ id: 'memory.search' }] }),
    }));
  });

  it('returns 500 when the active-view manifest is missing', () => {
    const { res, jsonSpy, statusSpy } = createMockResponse();
    getHandler('/api/viewer/capabilities')({ path: '/api/viewer/capabilities' } as Request, res as Response);

    expect(statusSpy).toHaveBeenCalledWith(500);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Viewer capabilities manifest not found',
    }));
  });

  it('returns 500 when the active-view manifest has an invalid structure', () => {
    mkdirSync(join(packageRoot, 'fusion'), { recursive: true });
    writeFileSync(join(packageRoot, 'fusion', 'active-view.json'), JSON.stringify({ defaultProfile: 'core' }));

    const { res, jsonSpy, statusSpy } = createMockResponse();
    getHandler('/api/viewer/capabilities')({ path: '/api/viewer/capabilities' } as Request, res as Response);

    expect(statusSpy).toHaveBeenCalledWith(500);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Viewer capabilities manifest has invalid structure',
    }));
  });

  it('returns 500 when a required capability group is missing', () => {
    mkdirSync(join(packageRoot, 'fusion'), { recursive: true });
    writeFileSync(join(packageRoot, 'fusion', 'active-view.json'), JSON.stringify({
      defaultProfile: 'core',
      capabilitiesByStatus: { active: [] },
    }));

    const { res, jsonSpy, statusSpy } = createMockResponse();
    getHandler('/api/viewer/capabilities')({ path: '/api/viewer/capabilities' } as Request, res as Response);

    expect(statusSpy).toHaveBeenCalledWith(500);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Viewer capabilities manifest has invalid structure',
      invalidGroup: 'optional',
    }));
  });
});

describe('ViewerRoutes commands API', () => {
  beforeEach(() => {
    packageRoot = mkdtempSync(join(tmpdir(), 'viewer-commands-'));
    loggerSpies = [
      spyOn(logger, 'error').mockImplementation(() => {}),
      spyOn(logger, 'failure').mockImplementation(() => {}),
      spyOn(logger, 'warn').mockImplementation(() => {}),
    ];
  });

  afterEach(() => {
    loggerSpies.forEach(spy => spy.mockRestore());
    rmSync(packageRoot, { recursive: true, force: true });
    mock.restore();
  });

  it('returns command catalog entries and grouped slash-command history', () => {
    mkdirSync(join(packageRoot, 'fusion'), { recursive: true });
    mkdirSync(join(packageRoot, 'plugin/ecc/commands'), { recursive: true });
    writeFileSync(join(packageRoot, 'plugin/ecc/commands/docs.md'), [
      '---',
      'description: Build or update project documentation',
      '---',
      '',
      '# Docs',
    ].join('\n'));
    writeFileSync(join(packageRoot, 'plugin/ecc/commands/quality-gate.md'), [
      '---',
      'description: Run project quality checks',
      '---',
      '',
      '# Quality Gate',
    ].join('\n'));
    writeFileSync(join(packageRoot, 'fusion', 'active-view.json'), JSON.stringify({
      defaultProfile: 'core',
      defaultLocale: 'zh-CN',
      activeCapabilities: [
        {
          id: 'command.qualityGate',
          kind: 'command',
          title: { 'zh-CN': '质量门禁', en: 'Quality Gate' },
          summary: { 'zh-CN': '执行发布前质量检查。', en: 'Run pre-release quality checks.' },
          source: 'internalized-ecc',
          dependencyTier: 'core',
          implementation: { path: 'plugin/ecc/commands/quality-gate.md' },
          profileTags: ['core', 'developer'],
        },
      ],
      capabilitiesByStatus: { active: [], optional: [], reference: [], archived: [] },
    }));

    const sessionStore = {
      db: {
        prepare: mock(() => ({
          all: mock(() => [
            { id: 1, content_session_id: 's1', prompt_text: '/quality-gate --fix', created_at_epoch: 3000, project: 'repo-a', platform_source: 'claude' },
            { id: 2, content_session_id: 's1', prompt_text: '/quality-gate', created_at_epoch: 2000, project: 'repo-a', platform_source: 'claude' },
            { id: 3, content_session_id: 's2', prompt_text: '/docs\n更新 README', created_at_epoch: 1000, project: 'repo-b', platform_source: 'codex' },
            { id: 4, content_session_id: 's3', prompt_text: 'plain text prompt', created_at_epoch: 500, project: 'repo-c', platform_source: 'claude' },
          ]),
        })),
      },
    };

    const { res, jsonSpy, statusSpy } = createMockResponse();
    getHandler('/api/viewer/commands', sessionStore)({ path: '/api/viewer/commands' } as Request, res as Response);

    expect(statusSpy).not.toHaveBeenCalled();
    const payload = jsonSpy.mock.calls[0]?.[0] as any;
    expect(payload.catalog).toHaveLength(2);
    expect(payload.catalog.find((item: any) => item.name === '/quality-gate')).toEqual(expect.objectContaining({
      status: 'recommended',
      title: '质量门禁',
      description: '执行发布前质量检查。',
      platforms: ['claude', 'codex'],
    }));
    expect(payload.catalog.find((item: any) => item.name === '/docs')).toEqual(expect.objectContaining({
      status: 'library',
      description: 'Build or update project documentation',
    }));
    expect(payload.history).toEqual([
      expect.objectContaining({ command: '/quality-gate', platform_source: 'claude', project: 'repo-a', count: 2, latest_prompt_id: 1 }),
      expect.objectContaining({ command: '/docs', platform_source: 'codex', project: 'repo-b', count: 1, latest_prompt_id: 3 }),
    ]);
    expect(payload.summary).toEqual(expect.objectContaining({
      catalogCount: 2,
      recommendedCount: 1,
      recordedCount: 3,
      bySource: { claude: 2, codex: 1 },
    }));
  });

  it('still exposes the command library when active-view is absent', () => {
    mkdirSync(join(packageRoot, 'plugin/ecc/commands'), { recursive: true });
    writeFileSync(join(packageRoot, 'plugin/ecc/commands/context-budget.md'), [
      '---',
      'description: Inspect context budget pressure',
      '---',
      '',
      '# Context Budget',
    ].join('\n'));

    const sessionStore = {
      db: {
        prepare: mock(() => ({ all: mock(() => []) })),
      },
    };

    const { res, jsonSpy, statusSpy } = createMockResponse();
    getHandler('/api/viewer/commands', sessionStore)({ path: '/api/viewer/commands' } as Request, res as Response);

    expect(statusSpy).not.toHaveBeenCalled();
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      catalog: [
        expect.objectContaining({
          name: '/context-budget',
          title: 'Context Budget',
          status: 'library',
          description: 'Inspect context budget pressure',
        }),
      ],
      history: [],
    }));
  });
});
