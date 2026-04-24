# claude-mem Architecture Overview

## Current Runtime Baseline

```text
+----------------------------------------------------------------+
| Host integrations                                              |
| +-- Claude Code hooks                                          |
| +-- Codex CLI transcript watch + AGENTS.md context             |
+----------------------------------------------------------------+
| Unified CLI hook entry                                         |
| +-- worker-service.cjs hook <platform> <event>                 |
| +-- src/cli/hook-command.ts                                    |
| +-- src/cli/adapters/* normalize host payloads                 |
| +-- src/cli/handlers/* call the local worker API               |
+----------------------------------------------------------------+
| Local worker runtime                                           |
| +-- Express HTTP server                                        |
| +-- Session lifecycle + async observation queue                |
| +-- CustomApiAgent                                             |
| +-- Search / timeline / settings / viewer routes               |
| +-- Transcript ingestion / SSE / process supervision           |
+----------------------------------------------------------------+
| Storage and retrieval                                          |
| +-- SQLite (durable structured storage)                        |
| +-- Optional Chroma sync (semantic retrieval)                  |
| +-- MCP server (optional compatibility/search surface)         |
+----------------------------------------------------------------+
```

## Core Direction

The current repository direction is:

- a single worker-backed runtime
- a single custom API extraction path
- focused host integrations for Claude Code and Codex CLI
- transcript watching retained for Codex-side session capture

This means the system should be understood as **worker-first**, not provider-first and not MCP-first.

## Hook and Request Flow

### Hook-driven flow

```text
Host lifecycle event
  → worker-service.cjs hook <platform> <event>
  → adapter normalizes stdin payload
  → handler maps event to worker HTTP call
  → worker enqueues / processes session data
  → CustomApiAgent extracts observations and summaries
  → SQLite stores durable state
  → optional SSE / Chroma / MCP surfaces update
```

### Direct worker flow

```text
Viewer / integration / script
  → local worker HTTP API
  → session, search, settings, data, logs, memory routes
  → SQLite / optional Chroma
```

## Current AI Processing Path

### Custom API only

Observation extraction and summarization currently run through `CustomApiAgent` using an OpenAI-compatible chat completions interface.

```text
worker session
  → CustomApiAgent
  → custom API endpoint
  → XML-like extraction response
  → response processor
  → SQLite / optional Chroma sync
```

Important implications:

- there is no active multi-provider runtime in the main path
- old Gemini/OpenRouter provider narratives are historical unless reintroduced in code
- stateless custom APIs use a synthetic `memorySessionId` generated locally by the worker

## Session Model

Two identifiers still matter:

- `contentSessionId` — host-side session identifier from the calling integration
- `memorySessionId` — worker-side memory identifier used for storage relationships

For stateless custom APIs, the worker synthesizes `memorySessionId` locally to keep storage and retrieval consistent.

## Storage

### SQLite

Primary durable store for:

- sessions
- observations
- summaries
- prompts
- pending messages
- viewer settings

### Chroma

Optional semantic retrieval layer synchronized from stored observations.

### MCP

Optional interface layer for compatible clients and search workflows. It is useful, but it is not the primary runtime model.

## Reliability Patterns

### Graceful degradation in hook execution

```text
Transport / timeout / 5xx / 429
  → treat as worker unavailable
  → exit 0 so host workflow is not blocked

4xx / programming error
  → treat as blocking bug
  → exit 2
```

### Queue-based observation processing

Observation intake is decoupled from extraction through the pending message queue so host-side hooks stay lightweight.

### Detached worker startup

Hook commands ensure the worker is running, but the hook process does not become the worker process. This avoids host sandbox lifecycle issues.

## Integration Boundary

If you are extending claude-mem today, prefer this order of abstraction:

1. integrate a host into the unified hook entry
2. normalize host payloads with a platform adapter or transcript schema
3. reuse the worker HTTP API and existing handlers
4. keep the public install surface limited to Claude Code and Codex CLI

This keeps new CLI and tool integrations aligned with the current architecture.
