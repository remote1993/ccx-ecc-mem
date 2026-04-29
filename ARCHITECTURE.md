# ccx-ecc-mem 架构摘要

本文以当前代码和测试约束为准。当前支持的宿主只包含 Claude Code 和 Codex CLI；VS Code 不是当前支持宿主。

## 运行边界

- Claude Code：通过 `plugin/hooks/hooks.json` 进入 `worker-service.cjs hook claude-code <event>`，再由 `src/cli/` 适配和处理。
- Codex CLI：通过 `npx ccx-mem install --ide codex-cli` 写入 transcript 配置和设置，由 worker 自动启动 transcript watcher。
- 默认记忆链路：worker、Claude hooks、SQLite、搜索、上下文注入和 Viewer 保持启用。
- 默认低负载：Chroma 默认关闭，Codex transcript 默认关闭，ECC agents 不进入默认 `core` profile。

## 核心链路

```text
Claude Code hooks / Codex transcript ingestion
  -> normalized worker request
  -> Worker HTTP API
  -> SessionManager queue
  -> CustomApiAgent
  -> SQLite
  -> search / context injection / Viewer
```

## 关键目录

| 目录 | 作用 |
|---|---|
| `src/npx-cli/` | npx 安装、卸载、worker 运行命令 |
| `src/cli/` | Claude Code hook 适配与事件处理 |
| `src/services/transcripts/` | Codex CLI transcript ingestion |
| `src/services/worker-service.ts` | Bun worker 编排入口 |
| `src/services/worker/` | 会话、队列、搜索、HTTP routes、Viewer routes |
| `src/services/sqlite/` | SQLite 持久化 |
| `plugin/` | 实际分发给 Claude Code 的插件内容 |
| `plugin/fusion/` | capability registry、active view 和 curated commands |
| `plugin/ecc/` | 预装 ECC 参考资源库 |
| `docs/public/` | 公开文档 |
| `tests/` | 测试套件 |

## 能力默认面

`plugin/fusion/registry.json` 是能力面的真源：

- `core` profile：记忆、轻量检索、核心 skills 和 curated commands。
- `developer` profile：显式启用开发类 ECC agents。
- `security` profile：显式启用安全审查类 ECC agents。
- `research` profile：显式启用 Chroma 增强检索。

构建时 `scripts/build-hooks.js` 会从 registry 生成 `plugin/fusion/active-view.json`。Viewer 通过 `GET /api/viewer/capabilities` 读取该视图。

## 不再支持的宿主

除 Claude Code 和 Codex CLI 之外的宿主不属于当前支持范围。VS Code、Cursor、OpenCode 等 IDE 或代理外壳若出现在仓库中，应视为历史资料或上游参考素材，不应作为当前安装、运行或测试入口。
