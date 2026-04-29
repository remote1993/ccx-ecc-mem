---
name: nanoclaw-repl
description: "中文优先：用于NanoclawREPL相关任务，帮助识别、设计、实现或验证对应工作流。English keywords: Operate and extend NanoClaw v2, ECC's zero-dependency session-aware REPL built on claude -p."
origin: ECC
---

# NanoClaw REPL

Use this skill when running or extending `scripts/claw.js`.

## Capabilities

- persistent markdown-backed sessions
- model switching with `/model`
- dynamic skill loading with `/load`
- session branching with `/branch`
- cross-session search with `/search`
- history compaction with `/compact`
- export to md/json/txt with `/export`
- session metrics with `/metrics`

## Operating Guidance

1. Keep sessions task-focused.
2. Branch before high-risk changes.
3. Compact after major milestones.
4. Export before sharing or archival.

## Extension Rules

- keep zero external runtime dependencies
- preserve markdown-as-database compatibility
- keep command handlers deterministic and local
