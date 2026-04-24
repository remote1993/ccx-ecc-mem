/**
 * Worker API Endpoints Integration Tests
 *
 * Tests all REST API endpoints with real HTTP and database.
 * Uses real Server instance with in-memory database.
 *
 * Sources:
 * - Server patterns from tests/server/server.test.ts
 * - Session routes from src/services/worker/http/routes/SessionRoutes.ts
 * - Search routes from src/services/worker/http/routes/SearchRoutes.ts
 */

import { describe, it, expect, beforeEach, afterEach, spyOn, mock } from 'bun:test';
import express from 'express';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { logger } from '../../src/utils/logger.js';

let originalDataDir: string | undefined;
let originalChromaEnabled: string | undefined;

// Mock middleware with JSON parsing preserved so route integration tests exercise real request bodies.
mock.module('../../src/services/worker/http/middleware.js', () => ({
  createMiddleware: () => [express.json()],
  requireLocalhost: (_req: any, _res: any, next: any) => next(),
  summarizeRequestBody: () => 'test body',
}));

// Mock CustomApiAgent availability so session route tests exercise route contracts,
// not external settings/env validation.
mock.module('../../src/services/worker/CustomApiAgent.js', () => ({
  isCustomApiAvailable: () => true,
  CustomApiAgent: class CustomApiAgent {},
}));

// Import after mocks
import { Server } from '../../src/services/server/Server.js';
import type { ServerOptions } from '../../src/services/server/Server.js';
import { SessionRoutes } from '../../src/services/worker/http/routes/SessionRoutes.js';
import { DatabaseManager } from '../../src/services/worker/DatabaseManager.js';
import { SessionManager } from '../../src/services/worker/SessionManager.js';
import { SessionStore } from '../../src/services/sqlite/SessionStore.js';
import { SessionEventBroadcaster } from '../../src/services/worker/events/SessionEventBroadcaster.js';
import { SSEBroadcaster } from '../../src/services/worker/SSEBroadcaster.js';

// Suppress logger output during tests
let loggerSpies: ReturnType<typeof spyOn>[] = [];

describe('Worker API Endpoints Integration', () => {
  let server: Server;
  let testPort: number;
  let mockOptions: ServerOptions;
  let dbManager: DatabaseManager | null;
  let sessionManager: SessionManager | null;
  let sessionStore: SessionStore | null;
  let testDataDir: string;

  async function startServer(serverInstance: Server): Promise<void> {
    await serverInstance.listen(0, '127.0.0.1');
    const address = serverInstance.getHttpServer()?.address();
    if (!address || typeof address === 'string') {
      throw new Error('Failed to resolve listening port');
    }
    testPort = address.port;
  }

  beforeEach(() => {
    originalDataDir = process.env.CLAUDE_MEM_DATA_DIR;
    originalChromaEnabled = process.env.CLAUDE_MEM_CHROMA_ENABLED;
    testDataDir = mkdtempSync(join(tmpdir(), 'claude-mem-worker-api-'));
    process.env.CLAUDE_MEM_DATA_DIR = testDataDir;
    process.env.CLAUDE_MEM_CHROMA_ENABLED = 'false';

    loggerSpies = [
      spyOn(logger, 'info').mockImplementation(() => {}),
      spyOn(logger, 'debug').mockImplementation(() => {}),
      spyOn(logger, 'warn').mockImplementation(() => {}),
      spyOn(logger, 'error').mockImplementation(() => {}),
    ];

    mockOptions = {
      getInitializationComplete: () => true,
      getMcpReady: () => true,
      onShutdown: mock(() => Promise.resolve()),
      onRestart: mock(() => Promise.resolve()),
      workerPath: '/test/worker-service.cjs',
      getAiStatus: () => ({
        runtime: 'custom-api',
        authMethod: 'cli',
        lastInteraction: null,
      }),
    };

    testPort = 0;
    dbManager = null;
    sessionManager = null;
    sessionStore = null;
  });

  afterEach(async () => {
    loggerSpies.forEach(spy => spy.mockRestore());

    if (server && server.getHttpServer()) {
      try {
        await server.close();
      } catch {
        // Ignore cleanup errors
      }
    }

    try {
      await dbManager?.close();
    } catch {
      // Ignore cleanup errors
    }

    mock.restore();
    rmSync(testDataDir, { recursive: true, force: true });

    if (originalDataDir === undefined) {
      delete process.env.CLAUDE_MEM_DATA_DIR;
    } else {
      process.env.CLAUDE_MEM_DATA_DIR = originalDataDir;
    }

    if (originalChromaEnabled === undefined) {
      delete process.env.CLAUDE_MEM_CHROMA_ENABLED;
    } else {
      process.env.CLAUDE_MEM_CHROMA_ENABLED = originalChromaEnabled;
    }
  });

  async function registerSessionRoutes(): Promise<{
    store: SessionStore;
    manager: SessionManager;
  }> {
    const ensureGeneratorRunningSpy = spyOn(
      SessionRoutes.prototype as unknown as { ensureGeneratorRunning: (...args: unknown[]) => void },
      'ensureGeneratorRunning'
    ).mockImplementation(() => {});

    dbManager = new DatabaseManager();
    await dbManager.initialize();
    sessionStore = dbManager.getSessionStore();
    sessionManager = new SessionManager(dbManager);

    const sseBroadcaster = new SSEBroadcaster();
    const workerService = {
      broadcastProcessingStatus: mock(() => {})
    };
    const eventBroadcaster = new SessionEventBroadcaster(
      sseBroadcaster,
      workerService as any
    );
    const customApiAgent = {
      startSession: mock(async () => undefined)
    };

    server = new Server(mockOptions);
    server.registerRoutes(new SessionRoutes(
      sessionManager,
      dbManager,
      customApiAgent as any,
      eventBroadcaster,
      workerService as any
    ));
    server.finalizeRoutes();

    return {
      store: sessionStore,
      manager: sessionManager
    };
  }

  describe('Health/Readiness/Version Endpoints', () => {
    describe('GET /api/health', () => {
      it('should return status, initialized, mcpReady, platform, pid', async () => {
        server = new Server(mockOptions);
        await startServer(server);

        const response = await fetch(`http://127.0.0.1:${testPort}/api/health`);
        expect(response.status).toBe(200);

        const body = await response.json();
        expect(body).toHaveProperty('status', 'ok');
        expect(body).toHaveProperty('initialized', true);
        expect(body).toHaveProperty('mcpReady', true);
        expect(body).toHaveProperty('platform');
        expect(body).toHaveProperty('pid');
        expect(body.ai.runtime).toBe('custom-api');
        expect(typeof body.platform).toBe('string');
        expect(typeof body.pid).toBe('number');
      });

      it('should reflect uninitialized state', async () => {
        const uninitOptions: ServerOptions = {
          getInitializationComplete: () => false,
          getMcpReady: () => false,
          onShutdown: mock(() => Promise.resolve()),
          onRestart: mock(() => Promise.resolve()),
          workerPath: '/test/worker-service.cjs',
          getAiStatus: () => ({ runtime: 'custom-api', authMethod: 'cli', lastInteraction: null }),
        };

        server = new Server(uninitOptions);
        await startServer(server);

        const response = await fetch(`http://127.0.0.1:${testPort}/api/health`);
        const body = await response.json();

        expect(body.status).toBe('ok'); // Health always returns ok
        expect(body.initialized).toBe(false);
        expect(body.mcpReady).toBe(false);
      });
    });

    describe('GET /api/readiness', () => {
      it('should return 200 with status ready when initialized', async () => {
        server = new Server(mockOptions);
        await startServer(server);

        const response = await fetch(`http://127.0.0.1:${testPort}/api/readiness`);
        expect(response.status).toBe(200);

        const body = await response.json();
        expect(body.status).toBe('ready');
        expect(body.mcpReady).toBe(true);
      });

      it('should return 503 with status initializing when not ready', async () => {
        const uninitOptions: ServerOptions = {
          getInitializationComplete: () => false,
          getMcpReady: () => false,
          onShutdown: mock(() => Promise.resolve()),
          onRestart: mock(() => Promise.resolve()),
          workerPath: '/test/worker-service.cjs',
          getAiStatus: () => ({ runtime: 'custom-api', authMethod: 'cli', lastInteraction: null }),
        };

        server = new Server(uninitOptions);
        await startServer(server);

        const response = await fetch(`http://127.0.0.1:${testPort}/api/readiness`);
        expect(response.status).toBe(503);

        const body = await response.json();
        expect(body.status).toBe('initializing');
        expect(body.message).toContain('initializing');
      });
    });

    describe('GET /api/version', () => {
      it('should return version string', async () => {
        server = new Server(mockOptions);
        await startServer(server);

        const response = await fetch(`http://127.0.0.1:${testPort}/api/version`);
        expect(response.status).toBe(200);

        const body = await response.json();
        expect(body).toHaveProperty('version');
        expect(typeof body.version).toBe('string');
      });
    });
  });

  describe('Session Routes', () => {
    it('should normalize platform_source on init and reuse the same sessionDbId across codex aliases', async () => {
      const { store } = await registerSessionRoutes();
      await startServer(server);

      const initResponse = await fetch(`http://127.0.0.1:${testPort}/api/sessions/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentSessionId: 'session-route-codex-alias',
          project: 'worker-api-test',
          prompt: 'hello',
          platformSource: 'transcript'
        })
      });

      expect(initResponse.status).toBe(200);
      const initBody = await initResponse.json();
      expect(initBody.sessionDbId).toBeGreaterThan(0);
      expect(initBody.promptNumber).toBeGreaterThan(0);
      expect(initBody.skipped).toBe(false);

      let session = store.getSessionById(initBody.sessionDbId);
      expect(session?.platform_source).toBe('codex');

      const summarizeResponse = await fetch(`http://127.0.0.1:${testPort}/api/sessions/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentSessionId: 'session-route-codex-alias',
          last_assistant_message: 'done',
          platformSource: 'codex-cli'
        })
      });

      expect(summarizeResponse.status).toBe(200);
      expect(await summarizeResponse.json()).toEqual({ status: 'queued' });

      session = store.getSessionById(initBody.sessionDbId);
      expect(session?.platform_source).toBe('codex');

      const aliasSessionId = store.createSDKSession('session-route-codex-alias', '', '', undefined, 'codex-cli');
      expect(aliasSessionId).toBe(initBody.sessionDbId);
    });

    it('should return completed_db_only for non-active sessions and mark them completed', async () => {
      const { store } = await registerSessionRoutes();
      await startServer(server);

      const initResponse = await fetch(`http://127.0.0.1:${testPort}/api/sessions/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentSessionId: 'session-route-claude-db-only',
          project: 'worker-api-test',
          prompt: 'hello',
          platformSource: 'claude-code'
        })
      });
      const initBody = await initResponse.json();

      const completeResponse = await fetch(`http://127.0.0.1:${testPort}/api/sessions/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentSessionId: 'session-route-claude-db-only',
          platformSource: 'claude'
        })
      });

      expect(completeResponse.status).toBe(200);
      expect(await completeResponse.json()).toEqual({
        status: 'completed_db_only',
        sessionDbId: initBody.sessionDbId
      });

      const session = store.getSessionById(initBody.sessionDbId);
      expect(session).toEqual(expect.objectContaining({
        id: initBody.sessionDbId,
        content_session_id: 'session-route-claude-db-only',
        platform_source: 'claude'
      }));
    });

    it('should return completed for active sessions and remove them from SessionManager', async () => {
      const { store, manager } = await registerSessionRoutes();
      await startServer(server);

      const initResponse = await fetch(`http://127.0.0.1:${testPort}/api/sessions/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentSessionId: 'session-route-codex',
          project: 'worker-api-test',
          prompt: 'hello',
          platformSource: 'transcript'
        })
      });
      const initBody = await initResponse.json();

      manager.initializeSession(initBody.sessionDbId, 'hello', 1);
      expect(manager.getSession(initBody.sessionDbId)).toBeDefined();

      const completeResponse = await fetch(`http://127.0.0.1:${testPort}/api/sessions/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentSessionId: 'session-route-codex',
          platformSource: 'codex-cli'
        })
      });

      expect(completeResponse.status).toBe(200);
      expect(await completeResponse.json()).toEqual({
        status: 'completed',
        sessionDbId: initBody.sessionDbId
      });

      expect(manager.getSession(initBody.sessionDbId)).toBeUndefined();
      const session = store.getSessionById(initBody.sessionDbId);
      expect(session).toEqual(expect.objectContaining({
        id: initBody.sessionDbId,
        content_session_id: 'session-route-codex',
        platform_source: 'codex'
      }));
    });

    it('should reject real platform conflicts on init', async () => {
      await registerSessionRoutes();
      await startServer(server);

      const firstInit = await fetch(`http://127.0.0.1:${testPort}/api/sessions/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentSessionId: 'session-route-conflict',
          project: 'worker-api-test',
          prompt: 'hello',
          platformSource: 'codex'
        })
      });
      const firstInitBody = await firstInit.json();
      expect({ status: firstInit.status, body: firstInitBody }).toEqual({
        status: 200,
        body: expect.objectContaining({ skipped: false })
      });

      const conflictingInit = await fetch(`http://127.0.0.1:${testPort}/api/sessions/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentSessionId: 'session-route-conflict',
          project: 'worker-api-test',
          prompt: 'hello again',
          platformSource: 'claude'
        })
      });

      expect(conflictingInit.status).toBe(500);
      const body = await conflictingInit.json();
      expect(body.error).toContain('Platform source conflict');
    });
  });

  describe('Error Handling', () => {
    describe('404 Not Found', () => {
      it('should return 404 for unknown GET routes', async () => {
        server = new Server(mockOptions);
        server.finalizeRoutes();
        await startServer(server);

        const response = await fetch(`http://127.0.0.1:${testPort}/api/unknown-endpoint`);
        expect(response.status).toBe(404);

        const body = await response.json();
        expect(body.error).toBe('NotFound');
      });

      it('should return 404 for unknown POST routes', async () => {
        server = new Server(mockOptions);
        server.finalizeRoutes();
        await startServer(server);

        const response = await fetch(`http://127.0.0.1:${testPort}/api/unknown-endpoint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: 'data' })
        });
        expect(response.status).toBe(404);
      });

      it('should return 404 for nested unknown routes', async () => {
        server = new Server(mockOptions);
        server.finalizeRoutes();
        await startServer(server);

        const response = await fetch(`http://127.0.0.1:${testPort}/api/search/nonexistent/nested`);
        expect(response.status).toBe(404);
      });
    });

    describe('Method handling', () => {
      it('should handle OPTIONS requests', async () => {
        server = new Server(mockOptions);
        await startServer(server);

        const response = await fetch(`http://127.0.0.1:${testPort}/api/health`, {
          method: 'OPTIONS'
        });
        // OPTIONS should either return 200 or 204 (CORS preflight)
        expect([200, 204]).toContain(response.status);
      });
    });
  });

  describe('Content-Type Handling', () => {
    it('should accept application/json content type', async () => {
      server = new Server(mockOptions);
      server.finalizeRoutes();
      await startServer(server);

      const response = await fetch(`http://127.0.0.1:${testPort}/api/nonexistent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'value' })
      });

      // Should get 404 (route not found), not a content-type error
      expect(response.status).toBe(404);
    });

    it('should return JSON responses with correct content type', async () => {
      server = new Server(mockOptions);
      await startServer(server);

      const response = await fetch(`http://127.0.0.1:${testPort}/api/health`);
      const contentType = response.headers.get('content-type');

      expect(contentType).toContain('application/json');
    });
  });

  describe('Server State Management', () => {
    it('should track initialization state dynamically', async () => {
      let initialized = false;
      const dynamicOptions: ServerOptions = {
        getInitializationComplete: () => initialized,
        getMcpReady: () => true,
        onShutdown: mock(() => Promise.resolve()),
        onRestart: mock(() => Promise.resolve()),
        workerPath: '/test/worker-service.cjs',
        getAiStatus: () => ({ runtime: 'custom-api', authMethod: 'cli', lastInteraction: null }),
      };

      server = new Server(dynamicOptions);
      await startServer(server);

      // Check uninitialized
      let response = await fetch(`http://127.0.0.1:${testPort}/api/readiness`);
      expect(response.status).toBe(503);

      // Initialize
      initialized = true;

      // Check initialized
      response = await fetch(`http://127.0.0.1:${testPort}/api/readiness`);
      expect(response.status).toBe(200);
    });

    it('should track MCP ready state dynamically', async () => {
      let mcpReady = false;
      const dynamicOptions: ServerOptions = {
        getInitializationComplete: () => true,
        getMcpReady: () => mcpReady,
        onShutdown: mock(() => Promise.resolve()),
        onRestart: mock(() => Promise.resolve()),
        workerPath: '/test/worker-service.cjs',
        getAiStatus: () => ({ runtime: 'custom-api', authMethod: 'cli', lastInteraction: null }),
      };

      server = new Server(dynamicOptions);
      await startServer(server);

      // Check MCP not ready
      let response = await fetch(`http://127.0.0.1:${testPort}/api/health`);
      let body = await response.json();
      expect(body.mcpReady).toBe(false);

      // Set MCP ready
      mcpReady = true;

      // Check MCP ready
      response = await fetch(`http://127.0.0.1:${testPort}/api/health`);
      body = await response.json();
      expect(body.mcpReady).toBe(true);
    });
  });

  describe('Server Lifecycle', () => {
    it('should start listening on specified port', async () => {
      server = new Server(mockOptions);
      await startServer(server);

      const httpServer = server.getHttpServer();
      expect(httpServer).not.toBeNull();
      expect(httpServer!.listening).toBe(true);
    });

    it('should close gracefully', async () => {
      server = new Server(mockOptions);
      await startServer(server);

      // Verify it's running
      const response = await fetch(`http://127.0.0.1:${testPort}/api/health`);
      expect(response.status).toBe(200);

      // Close
      try {
        await server.close();
      } catch (e: any) {
        if (e.code !== 'ERR_SERVER_NOT_RUNNING') throw e;
      }

      // Verify closed
      const httpServer = server.getHttpServer();
      if (httpServer) {
        expect(httpServer.listening).toBe(false);
      }
    });

    it('should handle port conflicts', async () => {
      server = new Server(mockOptions);
      const server2 = new Server(mockOptions);

      await startServer(server);

      // Second server should fail on same port
      await expect(server2.listen(testPort, '127.0.0.1')).rejects.toThrow();

      // Clean up second server if it has a reference
      const httpServer2 = server2.getHttpServer();
      if (httpServer2) {
        expect(httpServer2.listening).toBe(false);
      }
    });

    it('should allow restart on same port after close', async () => {
      server = new Server(mockOptions);
      await startServer(server);

      // Close first server
      try {
        await server.close();
      } catch (e: any) {
        if (e.code !== 'ERR_SERVER_NOT_RUNNING') throw e;
      }

      // Wait for port to be released
      await new Promise(resolve => setTimeout(resolve, 100));

      // Start second server on same port
      const server2 = new Server(mockOptions);
      await server2.listen(testPort, '127.0.0.1');

      expect(server2.getHttpServer()!.listening).toBe(true);

      // Clean up
      try {
        await server2.close();
      } catch {
        // Ignore cleanup errors
      }
    });
  });

  describe('Route Registration', () => {
    it('should register route handlers', () => {
      server = new Server(mockOptions);

      const setupRoutesMock = mock(() => {});
      const mockRouteHandler = {
        setupRoutes: setupRoutesMock,
      };

      server.registerRoutes(mockRouteHandler);

      expect(setupRoutesMock).toHaveBeenCalledTimes(1);
      expect(setupRoutesMock).toHaveBeenCalledWith(server.app);
    });

    it('should register multiple route handlers', () => {
      server = new Server(mockOptions);

      const handler1Mock = mock(() => {});
      const handler2Mock = mock(() => {});

      server.registerRoutes({ setupRoutes: handler1Mock });
      server.registerRoutes({ setupRoutes: handler2Mock });

      expect(handler1Mock).toHaveBeenCalledTimes(1);
      expect(handler2Mock).toHaveBeenCalledTimes(1);
    });
  });
});
