# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project goal

This repository builds `ccx-ecc-mem` as a low-dependency, Chinese-first, bilingual Claude Code local capability platform.

The product goal is no longer to expose `ccx-mem` and Everything Claude Code as two visible halves. Instead, the project uses a capability-oriented model:

- Runtime, hooks, worker APIs, memory capture, local retrieval, and Viewer are owned by this repository.
- High-value Everything Claude Code assets are internalized through `plugin/fusion/registry.json` as named capabilities.
- The full ECC import remains source/reference material, not the default runtime surface.
- Default behavior should stay local-first and low-dependency; heavy or external-service capabilities must be optional and explicit.

## Commands

Verified from `package.json` after importing `ccx-mem`:

- Build: `npm run build`
- Test all: `npm test`
- Single test area examples:
  - `npm run test:server`
  - `npm run test:search`
  - `npm run test:context`
- Worker status: `npm run worker:status`
- Worker start/stop/restart:
  - `npm run worker:start`
  - `npm run worker:stop`
  - `npm run worker:restart`
- Package dry run: `npm pack --dry-run`

Avoid `npm run build-and-sync` unless explicitly needed, because it syncs to the local Claude plugin marketplace and restarts the installed worker.

## Architecture

- CLI entry: `src/npx-cli/index.ts`
- MCP server: `src/servers/mcp-server.ts`
- Hook command entry: `src/cli/hook-command.ts`
- Worker service: `src/services/worker-service.ts`
- Claude Code plugin slice: `plugin/`
- Plugin manifest: `plugin/.claude-plugin/plugin.json`
- Plugin hooks: `plugin/hooks/hooks.json`
- Plugin skills: `plugin/skills/`
- Viewer UI source: `src/ui/viewer/`
- Built viewer asset: `plugin/ui/viewer.html`
- Capability registry: `plugin/fusion/registry.json`
- Capability active view: `plugin/fusion/active-view.json`
- Everything Claude Code reference namespace: `plugin/ecc/`

The runtime chain is `plugin/hooks/hooks.json` -> `src/cli/hook-command.ts` -> `src/services/worker-service.ts` -> `src/services/worker/http/routes/*` -> `src/ui/viewer/*`. `plugin/fusion/registry.json` is the source of truth for the user-visible capability surface, while `plugin/ecc/` is reference/source material until a capability is internalized.

## Capability and localization workflow

Use an evidence-first, Karpathy-inspired workflow:

- Build the smallest runnable capability slice first, then expand coverage.
- Prefer direct, readable integration over framework-heavy rewrites.
- Preserve upstream behavior until a deliberate localization or internalization change requires otherwise.
- Keep Chinese localization complete and consistent for user-facing text, README content, plugin metadata, prompts, command descriptions, and Viewer labels.
- Keep Everything Claude Code resources source-only until naming, permissions, dependencies, and hook behavior have been reviewed.
- Do not enable imported ECC hooks automatically; review `plugin/ecc/hooks/hooks.json` before any internalization into `plugin/hooks/hooks.json`.
- Default capabilities must avoid Python, Go, Cargo, Playwright, PM2, ccg-workflow, external service credentials, and raw ECC runtimes.
- Verify each meaningful change with the relevant command.
- Do not invent compatibility layers, fallback behavior, or abstractions before the merged code demonstrates a need.

## Licensing

The runtime core imported from `ccx-mem` is AGPL-3.0. Everything Claude Code resources are MIT licensed. Preserve upstream license files and source attribution when importing ECC assets.
