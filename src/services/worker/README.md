# Worker Service Architecture

## Overview

The Worker Service is the local Express HTTP server that backs ccx-ecc-mem's current runtime. It runs on port 37777 by default (configurable via `CLAUDE_MEM_WORKER_PORT`) and serves as the main orchestration layer for session lifecycle handling, search, settings, viewer APIs, and async extraction.

## Current Request Flow

```text
unified hook entry or direct local HTTP request
  → worker-service
    → route handler
      → service / manager layer
        → SQLite / optional Chroma / SDK process helpers
```

For the current architecture, treat the worker HTTP API as the source of truth. Legacy MCP endpoints may still exist as compatibility surfaces, but they are not the main runtime model.

## Directory Structure

```text
src/services/worker/
├── README.md
├── SDKAgent.ts
├── CustomApiAgent.ts
├── SessionManager.ts
├── SearchManager.ts
├── SettingsManager.ts
├── ProcessRegistry.ts
├── agents/
│   ├── ResponseProcessor.ts
│   ├── ObservationBroadcaster.ts
│   ├── FallbackErrorHandler.ts
│   └── ...
├── domain/
├── events/
└── http/
    ├── BaseRouteHandler.ts
    └── routes/
        ├── SessionRoutes.ts
        ├── DataRoutes.ts
        ├── SearchRoutes.ts
        ├── SettingsRoutes.ts
        ├── ViewerRoutes.ts
        ├── LogsRoutes.ts
        ├── MemoryRoutes.ts
        └── CorpusRoutes.ts
```

## Route Organization

### ViewerRoutes
- `GET /health` - Worker health check
- `GET /` - Serve the viewer UI
- `GET /stream` - SSE stream for live updates

### SessionRoutes
Current session lifecycle endpoints such as:
- `POST /api/sessions/init`
- `POST /api/sessions/observations`
- `POST /api/sessions/summarize`
- `POST /api/sessions/complete`

These routes support the worker-backed hook lifecycle and runtime session bookkeeping.

### DataRoutes
Current data retrieval endpoints such as:
- `GET /api/observations`
- `GET /api/summaries`
- `GET /api/prompts`
- `GET /api/stats`
- `GET /api/projects`

These read persisted state directly through the worker's service layer.

### SearchRoutes
Search and context endpoints are handled through `SearchManager`, including:
- `GET /api/search`
- `GET /api/timeline`
- `GET /api/context/recent`
- `GET /api/context/timeline`
- `GET /api/context/preview`
- `GET /api/context/inject`

Backward-compatibility search endpoints still exist, but the current model is worker-backed retrieval rather than MCP-first search proxying.

### SettingsRoutes
Settings routes handle persisted runtime configuration:
- `GET /api/settings`
- `POST /api/settings`

Legacy MCP and branch endpoints remain available as compatibility or operational surfaces where still needed, but they are not the primary architecture story.

## Current Architecture Notes

The current baseline is:
- unified hook entry for supported clients
- local worker-backed runtime
- custom API processing as the main extraction path
- worker-backed retrieval through HTTP routes and service managers
- compatibility MCP surfaces only where explicitly retained

That means older descriptions such as:
- per-hook script entrypoints as the main runtime contract
- search being primarily an MCP proxy
- a future plan to move the whole worker behind MCP
- PM2 as the canonical worker manager

should be treated as historical design material unless the code explicitly still depends on them.

## Adding New Endpoints

When adding a new endpoint:
1. choose the route file that matches the feature area
2. add the handler method
3. register the route in `setupRoutes()`
4. call the relevant service or manager directly
5. follow the existing error-handling and logging style

Example:

```ts
private handleGetFoo = this.wrapHandler(async (req, res): Promise<void> => {
  const result = await this.someManager.getFoo(req.query);
  res.json(result);
});
```

## Design Principles

1. **Worker-backed truth**: prefer the local worker HTTP + service layer when describing the runtime
2. **Progressive disclosure**: show compact search/context first, then narrower detail fetches
3. **Single responsibility**: keep route handlers thin and delegate logic to services/managers
4. **Compatibility boundaries stay explicit**: if a route exists only for legacy reasons, document it that way
