<h1 align="center">
  <br>
  <a href="https://github.com/remote1993/ccx-mem">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/remote1993/ccx-mem/main/docs/public/claude-mem-logo-for-dark-mode.webp">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/remote1993/ccx-mem/main/docs/public/claude-mem-logo-for-light-mode.webp">
      <img src="https://raw.githubusercontent.com/remote1993/ccx-mem/main/docs/public/claude-mem-logo-for-light-mode.webp" alt="ccx-mem" width="400">
    </picture>
  </a>
  <br>
</h1>

<p align="center">
  <a href="../README.md">中文</a>
</p>

<h4 align="center">Persistent memory system built around a local worker runtime, custom third-party API extraction, and focused host integrations for Claude Code and Codex CLI.</h4>

<p align="center">
  <a href="../LICENSE">
    <img src="https://img.shields.io/badge/License-AGPL%203.0-blue.svg" alt="License">
  </a>
  <a href="../package.json">
    <img src="https://img.shields.io/badge/version-0.1.1-green.svg" alt="Version">
  </a>
  <a href="../package.json">
    <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node">
  </a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#search-tools">Search Tools</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#troubleshooting">Troubleshooting</a> •
  <a href="#license-and-original-project-attribution">License</a>
</p>

<p align="center">
  ccx-mem preserves coding-session context across Claude Code and Codex CLI by capturing lifecycle events, storing structured observations in a local worker-backed runtime, and injecting relevant project history into future sessions.
</p>

---

## Quick Start

Install with a single command:

```bash
npx ccx-mem install
```

Install for Codex CLI transcript ingestion:

```bash
npx ccx-mem install --ide codex-cli
```

Or install from the plugin marketplace inside Claude Code:

```bash
/plugin marketplace add remote1993/ccx-mem
/plugin install ccx-mem
```

Current supported host integrations:

- Claude Code: local plugin registration and worker-backed context/search
- Codex CLI: transcript watching plus workspace `AGENTS.md` context sync

Restart your host client after installation. Claude Code picks up the local plugin state, and Codex CLI starts feeding memory once the worker is running and transcript watching is enabled.

> **Note:** ccx-mem is published on npm, but `npm install -g ccx-mem` installs the **SDK/library only** — it does not register the Claude Code plugin state or configure Codex transcript watching. Always install via `npx ccx-mem install`, `npx ccx-mem install --ide codex-cli`, or the `/plugin` commands above.

## Key Features

- **Persistent Memory** - Project context survives across Claude Code and Codex CLI sessions
- **Unified Hook Entry** - Lifecycle events flow through one worker-backed runtime
- **Progressive Disclosure** - Search starts with compact indexes, then fetches detailed observations only when needed
- **Worker-Backed Retrieval** - Query project history through HTTP APIs, skills, MCP compatibility surfaces, and the web viewer
- **Web Viewer UI** - Real-time memory stream, settings, logs, source filters, and context preview at http://localhost:37777
- **Privacy Control** - Use `<private>` tags to exclude sensitive content from storage
- **Custom API Extraction** - Configure a third-party compatible API for structured observation processing
- **Focused Host Integrations** - Claude Code plugin support plus optional Codex CLI transcript ingestion

---

## Documentation

- [Installation Guide](public/installation.mdx) - Quick start and advanced installation
- [Platform Integration Guide](public/platform-integration.mdx) - Claude Code hooks and Codex transcript integration model
- [Usage Guide](public/usage/getting-started.mdx) - How ccx-mem works automatically
- [Search Tools](public/usage/search-tools.mdx) - Query your project history with natural language
- [Configuration](public/configuration.mdx) - Environment variables and settings
- [Troubleshooting](public/troubleshooting.mdx) - Common issues and fixes

---

## How It Works

Core components:

1. **Unified Hook Entry** - Claude Code lifecycle events enter through `plugin/scripts/worker-service.cjs hook claude-code <event>` and `src/cli/` handlers
2. **Smart Install** - Cached dependency checks keep hook startup lightweight
3. **Worker Service** - Express HTTP API on port 37777 for sessions, storage, search, settings, logs, SSE, and custom API processing
4. **SQLite Database** - Stores sessions, prompts, observations, summaries, and project/source metadata
5. **Retrieval Surfaces** - Web viewer, HTTP APIs, skills, and MCP compatibility tools expose the same worker-backed history
6. **Optional Chroma Sync** - Vector embeddings can augment retrieval when enabled

See [Architecture Overview](public/architecture/overview.mdx).

---

## Search Tools

ccx-mem exposes worker-backed memory search through the web viewer, HTTP endpoints, skills, and MCP compatibility tools. Retrieval is intentionally token-efficient: start with a compact index, inspect nearby timeline context, then fetch full observation details only for the IDs that matter.

Three-layer retrieval flow:

1. `search` - Get a compact index
2. `timeline` - Inspect context around relevant results
3. `get_observations` - Fetch full details only for selected IDs

See [Search Tools Guide](public/usage/search-tools.mdx).

---

## System Requirements

- Node.js 18.0.0 or higher
- Latest Claude Code with plugin support
- Codex CLI, optional for transcript-based memory capture
- Bun, auto-installed if missing
- uv, auto-installed if missing for vector search
- SQLite 3, bundled

---

## Configuration

Settings live in `~/.claude-mem/settings.json`, which is created automatically on first run. Configure model behavior, worker port, data directory, log level, and context injection behavior there.

Example:

```json
{
  "CLAUDE_MEM_MODE": "code--zh"
}
```

Modes live under `plugin/modes/`. Restart Claude Code after changing modes.

---

## Development

```bash
git clone https://github.com/remote1993/ccx-mem.git
cd ccx-mem
npm install
npm run build
```

See [Development Guide](public/development.mdx).

---

## Troubleshooting

Check worker status first:

```bash
npx ccx-mem status
```

Installed plugin logs are also available from the plugin directory:

```bash
cd ~/.claude/plugins/marketplaces/remote1993/ccx-mem
npm run worker:logs
```

See [Troubleshooting Guide](public/troubleshooting.mdx).

---

## Support

- **Docs**: [docs/](./)
- **Issues**: [GitHub Issues](https://github.com/remote1993/ccx-mem/issues)
- **Repository**: [github.com/remote1993/ccx-mem](https://github.com/remote1993/ccx-mem)
- **Author**: Alex Newman ([@remote1993](https://github.com/remote1993))

---

## License and Original Project Attribution

ccx-mem is derived from the original **Claude-Mem** project and preserves the original AGPL-3.0 license and copyright notice. The `Copyright (C) 2025 Alex Newman (@thedotmack)` line in [LICENSE](../LICENSE) is original project attribution and should be retained.

This repository is currently maintained by [@remote1993](https://github.com/remote1993) as the `remote1993/ccx-mem` release line.
