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
  <a href="docs/i18n/README.zh.md">中文</a>
</p>

<h4 align="center">Persistent memory system built around a local worker runtime, custom third-party API extraction, and focused host integrations for Claude Code and Codex CLI.</h4>

<p align="center">
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-AGPL%203.0-blue.svg" alt="License">
  </a>
  <a href="package.json">
    <img src="https://img.shields.io/badge/version-0.1.1-green.svg" alt="Version">
  </a>
  <a href="package.json">
    <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node">
  </a>
  <a href="https://github.com/remote1993/awesome-claude-code">
    <img src="https://awesome.re/mentioned-badge.svg" alt="Mentioned in Awesome Claude Code">
  </a>
</p>

<p align="center">
  <a href="https://trendshift.io/repositories/15496" target="_blank">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/remote1993/ccx-mem/main/docs/public/trendshift-badge-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/remote1993/ccx-mem/main/docs/public/trendshift-badge.svg">
      <img src="https://raw.githubusercontent.com/remote1993/ccx-mem/main/docs/public/trendshift-badge.svg" alt="remote1993/ccx-mem | Trendshift" width="250" height="55"/>
    </picture>
  </a>
</p>

<br>

<table align="center">
  <tr>
    <td align="center">
      <a href="https://github.com/remote1993/ccx-mem">
        <picture>
          <img
            src="https://raw.githubusercontent.com/remote1993/ccx-mem/main/docs/public/cm-preview.gif"
            alt="ccx-mem Preview"
            width="500"
          >
        </picture>
      </a>
    </td>
    <td align="center">
      <a href="https://www.star-history.com/#remote1993/ccx-mem&Date">
        <picture>
          <source
            media="(prefers-color-scheme: dark)"
            srcset="https://api.star-history.com/image?repos=remote1993/ccx-mem&type=date&theme=dark&legend=top-left"
          />
          <source
            media="(prefers-color-scheme: light)"
            srcset="https://api.star-history.com/image?repos=remote1993/ccx-mem&type=date&legend=top-left"
          />
          <img
            alt="Star History Chart"
            src="https://api.star-history.com/image?repos=remote1993/ccx-mem&type=date&legend=top-left"
            width="500"
          />
        </picture>
      </a>
    </td>
  </tr>
</table>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#mcp-search-tools">Search Tools</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#troubleshooting">Troubleshooting</a> •
  <a href="#license">License</a>
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

**Key Features:**

- 🧠 **Persistent Memory** - Project context survives across Claude Code and Codex CLI sessions
- 🔁 **Unified Hook Entry** - Lifecycle events flow through one worker-backed runtime instead of scattered hook scripts
- 📊 **Progressive Disclosure** - Search starts with compact indexes, then fetches detailed observations only when needed
- 🔍 **Worker-Backed Retrieval** - Query project history through HTTP APIs, skills, MCP compatibility surfaces, and the web viewer
- 🖥️ **Web Viewer UI** - Real-time memory stream, settings, logs, source filters, and context preview at http://localhost:37777
- 🔒 **Privacy Control** - Use `<private>` tags to exclude sensitive content from storage
- ⚙️ **Custom API Extraction** - Configure a third-party compatible API for structured observation processing
- 🧩 **Focused Host Integrations** - Claude Code plugin support plus optional Codex CLI transcript ingestion

---

## Documentation

📚 **[View Full Documentation](https://docs.claude-mem.ai/)** - Browse on official website

### Getting Started

- **[Installation Guide](https://docs.claude-mem.ai/installation)** - Quick start & advanced installation
- **[Platform Integration Guide](https://docs.claude-mem.ai/platform-integration)** - Claude Code hooks and Codex transcript integration model
- **[Usage Guide](https://docs.claude-mem.ai/usage/getting-started)** - How ccx-mem works automatically
- **[Search Tools](https://docs.claude-mem.ai/usage/search-tools)** - Query your project history with natural language

### Best Practices

- **[Context Engineering](https://docs.claude-mem.ai/context-engineering)** - AI agent context optimization principles
- **[Progressive Disclosure](https://docs.claude-mem.ai/progressive-disclosure)** - Philosophy behind ccx-mem's context priming strategy

### Architecture

- **[Overview](https://docs.claude-mem.ai/architecture/overview)** - System components & data flow
- **[Architecture Evolution](https://docs.claude-mem.ai/architecture-evolution)** - The journey from v3 to v5
- **[Hooks Architecture](https://docs.claude-mem.ai/hooks-architecture)** - Historical hook architecture reference
- **[Hooks Reference](https://docs.claude-mem.ai/architecture/hooks)** - Current unified hook entry and lifecycle coverage
- **[Worker Service](https://docs.claude-mem.ai/architecture/worker-service)** - HTTP API & Bun management
- **[Database](https://docs.claude-mem.ai/architecture/database)** - SQLite schema & FTS5 search
- **[Search Architecture](https://docs.claude-mem.ai/architecture/search-architecture)** - Hybrid search with Chroma vector database

### Configuration & Development

- **[Configuration](https://docs.claude-mem.ai/configuration)** - Environment variables & settings
- **[Development](https://docs.claude-mem.ai/development)** - Building, testing, contributing
- **[Troubleshooting](https://docs.claude-mem.ai/troubleshooting)** - Common issues & solutions

---

## How It Works

**Core Components:**

1. **Unified Hook Entry** - Claude Code lifecycle events enter through `plugin/scripts/worker-service.cjs hook claude-code <event>` and `src/cli/` handlers
2. **Smart Install** - Cached dependency checker keeps hook startup lightweight
3. **Worker Service** - Express HTTP API on port 37777 with sessions, storage, search, settings, logs, SSE, and custom API processing
4. **SQLite Database** - Stores sessions, prompts, observations, summaries, and project/source metadata
5. **Retrieval Surfaces** - Web viewer, HTTP APIs, skills, and MCP compatibility tools expose the same worker-backed history
6. **Optional Chroma Sync** - Vector embeddings can augment retrieval when enabled

See [Architecture Overview](https://docs.claude-mem.ai/architecture/overview) for details.

---

## Search Tools

ccx-mem exposes worker-backed memory search through the web viewer, HTTP endpoints, skills, and MCP compatibility tools. The retrieval pattern is intentionally token-efficient: start with a compact index, inspect nearby timeline context, then fetch full observation details only for the IDs that matter.

**The 3-Layer Workflow:**

1. **`search`** - Get compact index with IDs (~50-100 tokens/result)
2. **`timeline`** - Get chronological context around interesting results
3. **`get_observations`** - Fetch full details ONLY for filtered IDs (~500-1,000 tokens/result)

**How It Works:**
- Start with `search` to get an index of results
- Use `timeline` to see what was happening around specific observations
- Use `get_observations` to fetch full details for relevant IDs
- **~10x token savings** by filtering before fetching details

**Core retrieval tools:**

1. **`search`** - Search memory index with full-text queries, filters by type/date/project
2. **`timeline`** - Get chronological context around a specific observation or query
3. **`get_observations`** - Fetch full observation details by IDs (always batch multiple IDs)

**Example Usage:**

```typescript
// Step 1: Search for index
search(query="authentication bug", type="bugfix", limit=10)

// Step 2: Review index, identify relevant IDs (e.g., #123, #456)

// Step 3: Fetch full details
get_observations(ids=[123, 456])
```

See [Search Tools Guide](https://docs.claude-mem.ai/usage/search-tools) for detailed examples.

---

## System Requirements

- **Node.js**: 18.0.0 or higher
- **Claude Code**: Latest version with plugin support
- **Codex CLI**: Optional, for transcript-based memory capture
- **Bun**: JavaScript runtime and process manager (auto-installed if missing)
- **uv**: Python package manager for vector search (auto-installed if missing)
- **SQLite 3**: For persistent storage (bundled)

---
### Windows Setup Notes

If you see an error like:

```powershell
npm : The term 'npm' is not recognized as the name of a cmdlet
```

Make sure Node.js and npm are installed and added to your PATH. Download the latest Node.js installer from https://nodejs.org and restart your terminal after installation.

---

## Configuration

Settings are managed in `~/.claude-mem/settings.json` (auto-created with defaults on first run). Configure AI model, worker port, data directory, log level, and context injection settings.

See the **[Configuration Guide](https://docs.claude-mem.ai/configuration)** for all available settings and examples.

### Mode & Language Configuration

ccx-mem supports multiple workflow modes and languages via the `CLAUDE_MEM_MODE` setting.

This option controls both:
- The workflow behavior (e.g. code, chill, investigation)
- The language used in generated observations

#### How to Configure

Edit your settings file at `~/.claude-mem/settings.json`:

```json
{
  "CLAUDE_MEM_MODE": "code--zh"
}
```

Modes are defined in `plugin/modes/`. To see all available modes locally:

```bash
ls ~/.claude/plugins/marketplaces/remote1993/ccx-mem/plugin/modes/
```

#### Available Modes

| Mode | Description |
|------------|-------------------------|
| `code` | Default English mode |
| `code--zh` | Simplified Chinese mode |
| `code--ja` | Japanese mode |

Language-specific modes follow the pattern `code--[lang]` where `[lang]` is the ISO 639-1 language code (e.g., `zh` for Chinese, `ja` for Japanese, `es` for Spanish).

> Note: `code--zh` (Simplified Chinese) is already built-in — no additional installation or plugin update is required.

#### After Changing Mode

Restart Claude Code to apply the new mode configuration.
---

## Development

See the **[Development Guide](https://docs.claude-mem.ai/development)** for build instructions, testing, and contribution workflow.

---

## Troubleshooting

If experiencing issues, describe the problem to Claude and the troubleshoot skill will automatically diagnose and provide fixes.

See the **[Troubleshooting Guide](https://docs.claude-mem.ai/troubleshooting)** for common issues and solutions.

---

## Bug Reports

Create comprehensive bug reports with the automated generator:

```bash
cd ~/.claude/plugins/marketplaces/remote1993/ccx-mem
npm run bug-report
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Update documentation
5. Submit a Pull Request

See [Development Guide](https://docs.claude-mem.ai/development) for contribution workflow.

---

## License

This project is licensed under the **GNU Affero General Public License v3.0** (AGPL-3.0).

Copyright (C) 2025 remote1993. All rights reserved.

See the [LICENSE](LICENSE) file for full details.

**What This Means:**

- You can use, modify, and distribute this software freely
- If you modify and deploy on a network server, you must make your source code available
- Derivative works must also be licensed under AGPL-3.0
- There is NO WARRANTY for this software

**Note on Ragtime**: The `ragtime/` directory is licensed separately under the **PolyForm Noncommercial License 1.0.0**. See [ragtime/LICENSE](ragtime/LICENSE) for details.

---

## Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/remote1993/ccx-mem/issues)
- **Repository**: [github.com/remote1993/ccx-mem](https://github.com/remote1993/ccx-mem)
- **Official X Account**: [@Claude_Memory](https://x.com/Claude_Memory)
- **Official Discord**: [Join Discord](https://discord.com/invite/J4wttp9vDu)
- **Author**: Alex Newman ([@remote1993](https://github.com/remote1993))

---

**Powered by the local worker runtime** | **Custom API extraction path** | **Made with TypeScript**

---

### What About $CMEM?

$CMEM is a solana token created by a 3rd party without Claude-Mem's prior consent, but officially embraced by the creator of Claude-Mem (remote1993). The token acts as a community catalyst for growth and a vehicle for bringing real-time agent data to the developers and knowledge workers that need it most. $CMEM: 2TsmuYUrsctE57VLckZBYEEzdokUF8j8e1GavekWBAGS

## Integration Model

The original Claude-Mem project follows this rule:

- each host integrates through its native mechanism
- internal processing converges on the local worker runtime
- observation extraction and summaries converge on the custom API path

See `docs/integration-capability-matrix.md` for the current host capability matrix.
