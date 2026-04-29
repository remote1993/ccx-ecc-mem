/**
 * Viewer Routes
 *
 * Handles health check, viewer UI, and SSE stream endpoints.
 * These are used by the web viewer UI at http://localhost:37777
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { logger } from '../../../../utils/logger.js';
import { getPackageRoot } from '../../../../shared/paths.js';
import { DEFAULT_CONFIG_PATH } from '../../../transcripts/config.js';
import { SSEBroadcaster } from '../../SSEBroadcaster.js';
import { DatabaseManager } from '../../DatabaseManager.js';
import { SessionManager } from '../../SessionManager.js';
import { BaseRouteHandler } from '../BaseRouteHandler.js';

interface ViewerCommandCatalogItem {
  id: string;
  name: string;
  title: string;
  description: string;
  path: string;
  status: 'recommended' | 'library';
  source: string;
  dependencyTier?: string;
  platforms: string[];
  tags: string[];
}

interface ViewerCommandHistoryItem {
  command: string;
  platform_source: string;
  project: string;
  count: number;
  latest_prompt_id: number;
  latest_prompt_text: string;
  latest_epoch: number;
  content_session_id: string;
}

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
    app.get('/api/viewer/commands', this.handleViewerCommands.bind(this));
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
    const { activeViewPath, activeViewPaths } = this.resolveActiveViewPath();

    if (!activeViewPath) {
      logger.error('HTTP', 'Viewer capabilities manifest not found', { packageRoot: getPackageRoot(), activeViewPaths });
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

  private handleViewerCommands = this.wrapHandler((req: Request, res: Response): void => {
    const { activeViewPath } = this.resolveActiveViewPath();
    const activeView = activeViewPath ? JSON.parse(readFileSync(activeViewPath, 'utf-8')) : null;
    const catalog = this.buildCommandCatalog(activeView);
    const history = this.buildCommandHistory();
    const bySource = history.reduce<Record<string, number>>((acc, item) => {
      acc[item.platform_source] = (acc[item.platform_source] ?? 0) + item.count;
      return acc;
    }, {});

    res.json({
      catalog,
      history,
      summary: {
        catalogCount: catalog.length,
        recommendedCount: catalog.filter(command => command.status === 'recommended').length,
        recordedCount: history.reduce((count, item) => count + item.count, 0),
        bySource,
      },
    });
  });

  private resolveActiveViewPath(): { activeViewPath?: string; activeViewPaths: string[] } {
    const packageRoot = getPackageRoot();
    const activeViewPaths = [
      path.join(packageRoot, 'fusion', 'active-view.json'),
      path.join(packageRoot, 'plugin', 'fusion', 'active-view.json')
    ];
    return {
      activeViewPath: activeViewPaths.find(p => existsSync(p)),
      activeViewPaths,
    };
  }

  private resolveCommandsDir(): string | undefined {
    const packageRoot = getPackageRoot();
    const commandsDirs = [
      path.join(packageRoot, 'ecc', 'commands'),
      path.join(packageRoot, 'plugin', 'ecc', 'commands')
    ];
    return commandsDirs.find(dir => existsSync(dir));
  }

  private buildCommandCatalog(activeView: any): ViewerCommandCatalogItem[] {
    const commandsDir = this.resolveCommandsDir();
    if (!commandsDir) return [];

    const commandCapabilities = [
      ...(activeView?.activeCapabilities ?? []),
      ...Object.values(activeView?.capabilitiesByStatus ?? {}).flatMap((items) => Array.isArray(items) ? items : []),
    ].filter((capability: any) => capability?.kind === 'command');

    const capabilitiesByFile = new Map<string, any>();
    for (const capability of commandCapabilities) {
      const implementationPath = capability?.implementation?.path;
      if (typeof implementationPath === 'string') {
        capabilitiesByFile.set(path.basename(implementationPath), capability);
      }
    }

    const files = readdirSync(commandsDir)
      .filter(file => file.endsWith('.md'))
      .sort((a, b) => a.localeCompare(b));

    return files.map((file): ViewerCommandCatalogItem => {
      const filePath = path.join(commandsDir, file);
      const commandName = `/${file.replace(/\.md$/, '')}`;
      const frontmatter = this.readCommandFrontmatter(filePath);
      const capability = capabilitiesByFile.get(file);
      const status = capability ? 'recommended' : 'library';
      const title = this.localized(capability?.title) || this.titleFromCommand(commandName);
      const description = this.localized(capability?.summary) || frontmatter.description || '';

      return {
        id: capability?.id || `command.${file.replace(/\.md$/, '')}`,
        name: commandName,
        title,
        description,
        path: `plugin/ecc/commands/${file}`,
        status,
        source: capability?.source || 'internalized-ecc',
        dependencyTier: capability?.dependencyTier,
        platforms: ['claude', 'codex'],
        tags: Array.isArray(capability?.profileTags) ? capability.profileTags : [],
      };
    });
  }

  private buildCommandHistory(): ViewerCommandHistoryItem[] {
    const store = this.dbManager.getSessionStore();
    const rows = store.db.prepare(`
      SELECT
        up.id,
        up.content_session_id,
        up.prompt_text,
        up.created_at_epoch,
        COALESCE(s.project, '') as project,
        COALESCE(s.platform_source, 'claude') as platform_source
      FROM user_prompts up
      LEFT JOIN sdk_sessions s ON up.content_session_id = s.content_session_id
      WHERE TRIM(up.prompt_text) LIKE '/%'
      ORDER BY up.created_at_epoch DESC
      LIMIT 500
    `).all() as Array<{
      id: number;
      content_session_id: string;
      prompt_text: string;
      created_at_epoch: number;
      project: string;
      platform_source: string;
    }>;

    const grouped = new Map<string, ViewerCommandHistoryItem>();
    for (const row of rows) {
      const command = this.extractSlashCommand(row.prompt_text);
      if (!command) continue;

      const platformSource = row.platform_source || 'claude';
      const project = row.project || 'unknown';
      const key = `${platformSource}:${project}:${command}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.count += 1;
        continue;
      }

      grouped.set(key, {
        command,
        platform_source: platformSource,
        project,
        count: 1,
        latest_prompt_id: row.id,
        latest_prompt_text: row.prompt_text,
        latest_epoch: row.created_at_epoch,
        content_session_id: row.content_session_id,
      });
    }

    return Array.from(grouped.values())
      .sort((a, b) => b.latest_epoch - a.latest_epoch)
      .slice(0, 100);
  }

  private readCommandFrontmatter(filePath: string): { description?: string } {
    const content = readFileSync(filePath, 'utf-8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};

    const descriptionLine = match[1]
      .split('\n')
      .find(line => line.trim().startsWith('description:'));
    if (!descriptionLine) return {};

    return {
      description: descriptionLine
        .replace(/^description:\s*/, '')
        .replace(/^["']|["']$/g, '')
        .trim(),
    };
  }

  private localized(text: any): string {
    if (!text || typeof text !== 'object') return '';
    return text['zh-CN'] || text.en || '';
  }

  private titleFromCommand(commandName: string): string {
    return commandName
      .replace(/^\//, '')
      .split('-')
      .map(part => part ? part[0].toUpperCase() + part.slice(1) : part)
      .join(' ');
  }

  private extractSlashCommand(promptText: string): string | null {
    const firstLine = promptText.trim().split(/\r?\n/, 1)[0] || '';
    const match = firstLine.match(/^\/([A-Za-z0-9][A-Za-z0-9_-]*)\b/);
    return match ? `/${match[1]}` : null;
  }

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
