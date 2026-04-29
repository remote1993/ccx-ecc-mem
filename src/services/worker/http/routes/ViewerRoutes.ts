/**
 * Viewer Routes
 *
 * Handles health check, viewer UI, and SSE stream endpoints.
 * These are used by the web viewer UI at http://localhost:37777
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { readFileSync, existsSync } from 'fs';
import { logger } from '../../../../utils/logger.js';
import { getPackageRoot } from '../../../../shared/paths.js';
import { DEFAULT_CONFIG_PATH } from '../../../transcripts/config.js';
import { SSEBroadcaster } from '../../SSEBroadcaster.js';
import { DatabaseManager } from '../../DatabaseManager.js';
import { SessionManager } from '../../SessionManager.js';
import { BaseRouteHandler } from '../BaseRouteHandler.js';

export class ViewerRoutes extends BaseRouteHandler {
  constructor(
    private sseBroadcaster: SSEBroadcaster,
    private dbManager: DatabaseManager,
    private sessionManager: SessionManager
  ) {
    super();
  }

  setupRoutes(app: express.Application): void {
    // Serve static UI assets (JS, CSS, fonts, etc.)
    const packageRoot = getPackageRoot();
    app.use(express.static(path.join(packageRoot, 'ui')));

    app.get('/health', this.handleHealth.bind(this));
    app.get('/', this.handleViewerUI.bind(this));
    app.get('/stream', this.handleSSEStream.bind(this));
    app.get('/api/viewer/integrations', this.handleViewerIntegrations.bind(this));
    app.get('/api/viewer/capabilities', this.handleViewerCapabilities.bind(this));
  }

  /**
   * Health check endpoint
   */
  private handleHealth = this.wrapHandler((req: Request, res: Response): void => {
    // Include queue liveness info so monitoring can detect dead queues (#1867)
    const activeSessions = this.sessionManager.getActiveSessionCount();

    res.json({
      status: 'ok',
      timestamp: Date.now(),
      activeSessions
    });
  });

  /**
   * Serve viewer UI
   */
  private handleViewerUI = this.wrapHandler((req: Request, res: Response): void => {
    const packageRoot = getPackageRoot();

    // Try cache structure first (ui/viewer.html), then marketplace structure (plugin/ui/viewer.html)
    const viewerPaths = [
      path.join(packageRoot, 'ui', 'viewer.html'),
      path.join(packageRoot, 'plugin', 'ui', 'viewer.html')
    ];

    const viewerPath = viewerPaths.find(p => existsSync(p));

    if (!viewerPath) {
      throw new Error('Viewer UI not found at any expected location');
    }

    const html = readFileSync(viewerPath, 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  private handleViewerIntegrations = this.wrapHandler((req: Request, res: Response): void => {
    const integrations = this.getViewerIntegrations();
    res.json({ integrations });
  });

  private handleViewerCapabilities = this.wrapHandler((req: Request, res: Response): void => {
    const packageRoot = getPackageRoot();
    const activeViewPaths = [
      path.join(packageRoot, 'fusion', 'active-view.json'),
      path.join(packageRoot, 'plugin', 'fusion', 'active-view.json')
    ];
    const activeViewPath = activeViewPaths.find(p => existsSync(p));

    if (!activeViewPath) {
      logger.error('HTTP', 'Viewer capabilities manifest not found', { packageRoot, activeViewPaths });
      res.status(500).json({
        error: 'Viewer capabilities manifest not found',
        expectedPaths: activeViewPaths,
      });
      return;
    }

    const activeView = JSON.parse(readFileSync(activeViewPath, 'utf-8'));
    const groups = activeView?.capabilitiesByStatus;
    const requiredGroups = ['active', 'optional', 'reference', 'archived'];
    const invalidGroup = requiredGroups.find(group => !Array.isArray(groups?.[group]));
    if (
      !activeView ||
      typeof activeView.defaultProfile !== 'string' ||
      !groups ||
      typeof groups !== 'object' ||
      invalidGroup
    ) {
      logger.error('HTTP', 'Viewer capabilities manifest has invalid structure', { activeViewPath, invalidGroup });
      res.status(500).json({ error: 'Viewer capabilities manifest has invalid structure', activeViewPath, invalidGroup });
      return;
    }

    res.json(activeView);
  });

  private getViewerIntegrations(): string[] {
    const integrations = ['claude'];

    if (this.isCodexInstalled()) integrations.push('codex');

    return integrations;
  }

  private isCodexInstalled(): boolean {
    const transcriptConfigPath = DEFAULT_CONFIG_PATH;
    if (!existsSync(transcriptConfigPath)) return false;

    try {
      const raw = readFileSync(transcriptConfigPath, 'utf-8');
      const parsed = JSON.parse(raw) as { watches?: Array<{ name?: string }> };
      return Array.isArray(parsed.watches) && parsed.watches.some((watch) => watch.name === 'codex');
    } catch (error: unknown) {
      const normalized = error instanceof Error ? error : new Error(String(error));
      logger.warn('HTTP', 'Failed to read Codex transcript watch configuration', { transcriptConfigPath }, normalized);
      return false;
    }
  }

  /**
   * SSE stream endpoint
   */
  private handleSSEStream = this.wrapHandler((req: Request, res: Response): void => {
    // Guard: if DB is not yet initialized, return 503 before registering client
    try {
      this.dbManager.getSessionStore();
    } catch (initError: unknown) {
      if (initError instanceof Error) {
        logger.warn('HTTP', 'SSE stream requested before DB initialization', {}, initError);
      }
      res.status(503).json({ error: 'Service initializing' });
      return;
    }

    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Add client to broadcaster
    this.sseBroadcaster.addClient(res);

    // Send initial_load event with project/source catalog
    const projectCatalog = this.dbManager.getSessionStore().getProjectCatalog();
    this.sseBroadcaster.broadcast({
      type: 'initial_load',
      projects: projectCatalog.projects,
      sources: projectCatalog.sources,
      projectsBySource: projectCatalog.projectsBySource,
      timestamp: Date.now()
    });

    // Send initial processing status (based on queue depth + active generators)
    const isProcessing = this.sessionManager.isAnySessionProcessing();
    const queueDepth = this.sessionManager.getTotalActiveWork(); // Includes queued + actively processing
    this.sseBroadcaster.broadcast({
      type: 'processing_status',
      isProcessing,
      queueDepth
    });
  });
}
