# Integration Capability Matrix

This matrix reflects the supported host surface for the current repository: Claude Code and Codex CLI only. VS Code is not a supported host. Other upstream or historical host assets are reference material unless they are explicitly reintroduced through code, tests, and documentation.

## Capability Legend

- yes: implemented in the current primary path
- partial: implemented with host-specific limits
- no: not implemented in the current primary path

## Matrix

| Host / Tool | Native integration type | Context inject | Session init | Observation intake | Summarize | Session complete | Notes |
|---|---|---:|---:|---:|---:|---:|---|
| Claude Code | Plugin hooks | yes | yes | yes | yes | yes | Primary hook-driven host |
| Codex CLI | Worker-managed transcript ingestion | partial | partial | partial | partial | partial | Enabled only after `npx ccx-mem install --ide codex-cli`; worker starts the watcher automatically |

## Interpretation

- Claude Code remains the full-fidelity lifecycle integration through plugin hooks.
- Codex CLI uses transcript ingestion plus workspace-local `AGENTS.md` context. It does not expose a public `transcript watch` CLI command.
- Both hosts converge on the local worker, SQLite storage, search APIs, and the Custom API extraction path.
- Chroma, MCP compatibility surfaces, ECC agents, and other heavy assets are optional and are not part of the default low-load runtime.

## Architectural Rule

Keep the supported host list narrow:

1. Claude Code hook integration
2. Codex CLI worker-managed transcript ingestion
3. shared worker API and SQLite-first storage
4. optional features only through explicit install/profile/settings choices
