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

function createRoutes(): ViewerRoutes {
  return new ViewerRoutes(
    { addClient: mock(() => {}), broadcast: mock(() => {}) } as any,
    { getSessionStore: mock(() => ({ getProjectCatalog: mock(() => ({ projects: [], sources: [], projectsBySource: {} })) })) } as any,
    { getActiveSessionCount: mock(() => 0), isAnySessionProcessing: mock(() => false), getTotalActiveWork: mock(() => 0) } as any,
  );
}

function getHandler(path: string): (req: Request, res: Response) => void {
  let handler: ((req: Request, res: Response) => void) | undefined;
  const routes = createRoutes();
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
