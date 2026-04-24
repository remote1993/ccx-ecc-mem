# Integration Capability Matrix

This matrix reflects the current repository implementation model: hosts integrate through native mechanisms, then converge on the worker-backed runtime and shared storage path.

## Capability legend

- yes: implemented in the current primary path
- partial: implemented, but with host/runtime-specific limits
- no: not implemented in the current primary path

## Matrix

| Host / Tool | Native integration type | Context inject | Session init | Observation intake | Summarize | Session complete | Notes |
|---|---|---:|---:|---:|---:|---:|---|
| Claude Code | Hook-based | yes | yes | yes | yes | yes | Primary historical host; hook-driven |
| Cursor | Hook-based | yes | yes | yes | yes | yes | Includes file-edit-specific flows |
| Gemini CLI | Hook-based | yes | yes | yes | yes | yes | Maps multiple native hook events into shared handlers |
| Windsurf | Hook-based | partial | yes | yes | no | no | Context via workspace rules file; hook coverage is observation-heavy |
| Codex CLI | Transcript-based | partial | partial | partial | partial | partial | Relies on transcript watch, not native hooks |
| OpenCode | Plugin-based | yes | partial | partial | partial | partial | Plugin/runtime path plus AGENTS.md context sync |
| OpenClaw | Plugin-based | partial | partial | partial | partial | partial | Plugin installation path present; host runtime controls exact lifecycle coverage |
| Copilot CLI | MCP-based compatibility | partial | no | no | no | no | MCP/config compatibility surface, not full runtime capture |
| Antigravity | MCP-based compatibility | partial | no | no | no | no | MCP/config compatibility surface |
| Goose | MCP-based compatibility | partial | no | no | no | no | MCP/config compatibility surface |
| Crush | MCP-based compatibility | partial | no | no | no | no | MCP/config compatibility surface |
| Roo Code | MCP-based compatibility | partial | no | no | no | no | MCP/config compatibility surface |
| Warp | MCP-based compatibility | partial | no | no | no | no | MCP/config compatibility surface |

## Interpretation

- Hook-based hosts currently provide the fullest lifecycle coverage.
- Transcript-based and plugin-based hosts are valid first-class integration styles, but lifecycle fidelity depends on what the host exposes.
- MCP-based hosts are compatibility/search surfaces, not full observation-capture runtimes.
- All full-fidelity extraction currently converges on the local worker plus `CustomApiAgent`.

## Architectural rule

Do not force every host into the same external integration pattern.

Prefer:
1. native host integration
2. normalized internal event model
3. shared worker API and storage model
4. shared custom API extraction path
