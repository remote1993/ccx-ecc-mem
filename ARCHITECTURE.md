# Claude-mem 目录架构与功能总结

> 版本：基于仓库代码（v12.3.8）与官方文档综合整理  
> 日期：2026-04-22  
> 说明：本文档以**当前代码实现为准**，并标注了与官方文档存在偏差的地方。

---

## 1. 项目整体定位

`claude-mem` 是一个给 Claude Code 及相关 IDE/CLI 生态提供**跨会话持久记忆**的插件系统。

核心链路：

```text
Hook 生命周期事件 → Worker 后台服务 → SQLite / Chroma 存储与检索 → Viewer / HTTP retrieval / compatibility surfaces
```

从当前仓库与文档看，系统包含 6 个主层次：

1. 安装与命令层：`src/npx-cli/`
2. Hook 输入适配与事件处理层：`src/cli/`
3. Worker 核心服务层：`src/services/worker-service.ts` 与 `src/services/worker/`
4. 存储与检索层：`src/services/sqlite/`、`src/services/sync/`
5. 插件分发层：`plugin/`
6. 公开文档与测试层：`docs/public/`、`tests/`

---

## 2. 顶层目录速览

| 目录 | 作用 |
|------|------|
| `src/` | 源码主目录，后续大多数功能修改从这里入手 |
| `plugin/` | 插件实际分发目录，Claude Code 运行时真正消费的是这里 |
| `docs/public/` | 公开文档站点（Mintlify）源文件 |
| `tests/` | 测试目录，覆盖 hook、worker、搜索、SQLite、集成链路 |
| `scripts/` | 构建、同步、发布、运维、数据修复和调试脚本 |
| `openclaw/` | OpenClaw 集成相关的发布内容 |
| `cursor-hooks/` | Cursor 相关 hook 集成资料与模板 |
| `.github/workflows/` | CI/CD 与自动化流程 |

---

## 3. 源码层：`src/`

### 3.1 安装与命令入口：`src/npx-cli/`

**关键入口**：`src/npx-cli/index.ts`

这是 npm / npx 入口层，负责安装、更新、卸载和运行时命令。

**支持的命令**：
- `install` / `update` / `uninstall`
- `start` / `stop` / `restart` / `status`
- `search`
- `adopt`
- `transcript watch`

**关键文件**：
- `src/npx-cli/index.ts` — CLI 主入口，命令分发中心
- `src/npx-cli/commands/install.ts`
- `src/npx-cli/commands/runtime.ts`
- `src/npx-cli/commands/uninstall.ts`
- `src/npx-cli/utils/paths.ts`
- `src/npx-cli/utils/bun-resolver.ts`

**修改场景**：安装流程、IDE 安装检测、CLI 子命令、启停 worker 的命令行为。

---

### 3.2 Hook 适配与事件处理：`src/cli/`

**关键入口**：`src/cli/hook-command.ts`

这是当前仓库里**真正的 hook 执行入口层**。

**核心职责**：
- 从 stdin 读取 Claude Code / Cursor / Gemini CLI 等 hook 输入
- 根据平台做输入标准化
- 根据事件类型分发处理器
- 统一处理 hook 成功 / graceful degrade / blocking error 的退出码

**平台适配器**：
- `src/cli/adapters/index.ts` — 适配器工厂
- `src/cli/adapters/claude-code.ts`
- `src/cli/adapters/cursor.ts`
- `src/cli/adapters/gemini-cli.ts`
- `src/cli/adapters/windsurf.ts`
- `src/cli/adapters/raw.ts`

**事件处理器**：
- `src/cli/handlers/context.ts` — SessionStart
- `src/cli/handlers/session-init.ts` — UserPromptSubmit
- `src/cli/handlers/observation.ts` — PostToolUse
- `src/cli/handlers/file-context.ts` — PreToolUse (Read)
- `src/cli/handlers/summarize.ts` — Stop
- `src/cli/handlers/session-complete.ts` — SessionEnd
- `src/cli/handlers/user-message.ts`
- `src/cli/handlers/file-edit.ts`

**修改场景**：hook 生命周期、上下文注入、observation 采集、平台适配。

> 注意：官方文档 `docs/public/architecture/overview.mdx` 仍把 `src/hooks/` 描述为主要 hook 实现位置，但**当前代码事实**是主要逻辑在 `src/cli/`。

---

### 3.3 `src/hooks/`

当前这里很轻，只有 `src/hooks/hook-response.ts`。

这个目录现在主要是 hook 返回结构的辅助代码，**不是主要的 hook 业务实现目录**。

---

### 3.4 Worker 核心：`src/services/worker-service.ts` 与 `src/services/worker/`

**关键入口**：`src/services/worker-service.ts`

这是整个项目的运行时核心，已从单体文件重构为编排器（orchestrator），把细节委托给多个子模块。

**总体职责**：
- 启动 Express HTTP 服务
- 管理数据库、会话与 pending message
- 驱动 custom API session runtime
- 提供搜索、Viewer、设置、日志、memory、corpus 等 HTTP 路由
- 管理 SSE 实时推送
- 管理 transcript watcher
- 管理 Chroma 同步
- 管理 worker 生命周期

#### 3.4.1 服务基础设施：`src/services/infrastructure/`

负责 worker 进程与健康管理。

**关键文件**：
- `src/services/infrastructure/ProcessManager.ts`
- `src/services/infrastructure/HealthMonitor.ts`
- `src/services/infrastructure/GracefulShutdown.ts`
- `src/services/infrastructure/WorktreeAdoption.ts`

**修改场景**：worker 启停、pid file、健康检查、优雅关闭、worktree 合并收编（adopt）。

#### 3.4.2 HTTP Server 抽象：`src/services/server/`

负责 Express 服务器封装、中间件与错误处理。

**关键文件**：
- `src/services/server/Server.ts`
- `src/services/server/Middleware.ts`
- `src/services/server/ErrorHandler.ts`
- `src/services/server/allowed-constants.ts`

**修改场景**：新增全局中间件、安全头 / CORS / 输入处理、统一错误返回。

#### 3.4.3 Worker 业务层：`src/services/worker/`

真正的业务模块集合。

**关键文件**：
- `src/services/worker/DatabaseManager.ts`
- `src/services/worker/SessionManager.ts`
- `src/services/worker/SearchManager.ts`
- `src/services/worker/SettingsManager.ts`
- `src/services/worker/SSEBroadcaster.ts`
- `src/services/worker/SDKAgent.ts`
- `src/services/worker/CustomApiAgent.ts`
- `src/services/worker/RestartGuard.ts`
- `src/services/worker/PaginationHelper.ts`
- `src/services/worker/FormattingService.ts`
- `src/services/worker/TimelineService.ts`
- `src/services/worker/ProcessRegistry.ts`

**可按职责理解**：

| 职责 | 文件 |
|------|------|
| 会话与状态 | `SessionManager`, `RestartGuard`, `ProcessRegistry` |
| AI 压缩与结构化提取 | `SDKAgent`, `CustomApiAgent` |
| 搜索与格式化 | `SearchManager`, `FormattingService`, `TimelineService` |
| 实时事件 | `SSEBroadcaster`, `events/SessionEventBroadcaster.ts` |

#### 3.4.4 Worker HTTP 路由：`src/services/worker/http/routes/`

API 暴露面。

**关键文件**：
- `src/services/worker/http/routes/ViewerRoutes.ts` — 前端 viewer 页面与流式接口
- `src/services/worker/http/routes/SessionRoutes.ts` — session 初始化、完成
- `src/services/worker/http/routes/DataRoutes.ts` — prompts / observations / summaries 数据读取
- `src/services/worker/http/routes/SearchRoutes.ts` — 搜索、timeline、批量 observation 读取
- `src/services/worker/http/routes/SettingsRoutes.ts` — 配置读取与更新
- `src/services/worker/http/routes/LogsRoutes.ts` — 日志相关
- `src/services/worker/http/routes/MemoryRoutes.ts` — memory 相关 API
- `src/services/worker/http/routes/CorpusRoutes.ts` — knowledge corpus 相关 API

**修改场景**：HTTP API 参数、返回结构、viewer 后端接口、搜索接口。

---

### 3.5 上下文生成：`src/services/context/`

下次会话注入上下文的构建层。

**关键文件**：
- `src/services/context/ContextBuilder.ts`
- `src/services/context/ContextConfigLoader.ts`
- `src/services/context/ObservationCompiler.ts`
- `src/services/context/TokenCalculator.ts`

**渲染分层**：
- `src/services/context/sections/HeaderRenderer.ts`
- `src/services/context/sections/TimelineRenderer.ts`
- `src/services/context/sections/SummaryRenderer.ts`
- `src/services/context/sections/FooterRenderer.ts`

**格式化器**：
- `src/services/context/formatters/HumanFormatter.ts`
- `src/services/context/formatters/AgentFormatter.ts`

**兼容入口**：
- `src/services/context-generator.ts` — 旧入口兼容层，不是当前主逻辑组织方式

**修改场景**：上下文注入内容、token 控制、不同 section 的渲染方式。

---

### 3.6 数据存储：`src/services/sqlite/`

SQLite 持久层，使用 `bun:sqlite` 驱动。

**关键文件**：
- `src/services/sqlite/SessionStore.ts`
- `src/services/sqlite/SessionSearch.ts`
- `src/services/sqlite/PendingMessageStore.ts`
- `src/services/sqlite/Database.ts`
- `src/services/sqlite/migrations/runner.ts`

**模块划分**：

| 模块 | 目录 |
|------|------|
| sessions | `src/services/sqlite/sessions/*` |
| observations | `src/services/sqlite/observations/*` |
| prompts | `src/services/sqlite/prompts/*` |
| summaries | `src/services/sqlite/summaries/*` |
| timeline | `src/services/sqlite/timeline/*` |
| import | `src/services/sqlite/import/*` |

**核心数据表**：
- `sdk_sessions`
- `observations`
- `session_summaries`
- `user_prompts`

**搜索能力**：
- SQLite FTS5 负责全文检索
- `SessionSearch` 负责查询逻辑
- 触发器保持 FTS 表同步

---

## 10. 当前改造目标（2026-04-23）

### 10.1 背景

当前仓库已经完成从旧多 provider / 多 runtime 叙事向 `custom-only + worker-backed` 主链路的代码收口，但文档、导航和项目索引仍残留多处旧 hook 脚本时代与旧 MCP 主叙事表述，导致：

- 新用户会先读到过时入口
- 排障路径会落到旧脚本名或旧源码位置
- 开发者会误以为 MCP compatibility surface 仍是主架构

本轮改造目标不是重做架构，而是**统一“当前实现”口径**，并把历史实现明确标为历史 / 兼容说明。

### 10.2 当前统一口径

以下事实应作为文档与项目说明的默认基线：

1. **Hook Entry Layer** 以 `plugin/hooks/hooks.json` → `plugin/scripts/worker-service.cjs hook claude-code <event>` → `src/cli/hook-command.ts` → `src/cli/handlers/*` 为当前统一入口。
2. **Lifecycle Coverage** 是 `Setup` → `SessionStart` → `UserPromptSubmit` → `PostToolUse` → `PreToolUse (Read)` → `Stop` → `SessionEnd`。
3. **Worker-backed runtime** 是当前主运行时；本地 worker HTTP API 是存储、检索、设置、SSE 与异步抽取的核心。
4. **Custom API processing path** 是当前主抽取路径；Gemini / OpenRouter 的专用运行时代码已移除。
5. **Worker-backed retrieval** 是当前主检索路径；MCP compatibility surface 仅作为兼容或附加入口，不再作为主架构叙事。

### 10.3 已完成页面

本轮与前一轮已经完成以下高优先级页面收口：

- `CLAUDE.md`
- `docs/public/introduction.mdx`
- `docs/public/configuration.mdx`
- `docs/public/architecture/overview.mdx`
- `docs/public/architecture/hooks.mdx`
- `docs/public/architecture/worker-service.mdx`
- `docs/public/architecture/search-architecture.mdx`
- `docs/public/troubleshooting.mdx`
- `docs/public/progressive-disclosure.mdx`
- `docs/public/docs.json`

这些页面现已统一到当前 `custom-only / worker-backed / unified hook entry` 口径，并把旧 per-hook 脚本与旧 MCP 主叙事降级为 historical / compatibility 边界。

### 10.4 剩余工作

仍需继续完成以下扫尾项：

1. 继续检查 `docs/public/usage/`、集成页与历史页，确认是否还有旧 provider / 旧 MCP 主叙事残留。
2. 继续检查导航与交叉链接，避免历史页重新以前排当前页身份出现。
3. 如后续再触及版本或分发映射，补跑：
   - `bun test tests/infrastructure/version-consistency.test.ts`

### 10.5 本轮推进记录

#### 已完成

- 将 `docs/public/troubleshooting.mdx` 重写为基于当前 unified hook entry 与 local worker runtime 的排障指南。
  - 排障入口统一为：worker health、readiness、hooks wiring、worker logs、SQLite/pending queue。
  - 删除旧 `context-hook.js` / `new-hook.js` / `save-hook.js` 手测入口作为当前默认建议。
  - 删除把 MCP 作为当前主排障路径的叙事。

- 将 `docs/public/progressive-disclosure.mdx` 重写为基于当前 worker-backed retrieval 的检索方法论说明。
  - 保留 progressive disclosure 的方法论本体。
  - 主流程改为：index/search → context/timeline → details → code verification。
  - 明确 compatibility MCP surfaces 只是附加或历史兼容面，而不是默认 runtime model。

- 将以下 usage / integration 页面统一到当前 `custom-only / worker-backed / unified hook entry` 口径：
  - `docs/public/usage/search-tools.mdx`
  - `docs/public/usage/getting-started.mdx`
  - `docs/public/usage/claude-desktop.mdx`
  - `docs/public/platform-integration.mdx`
  - `docs/public/gemini-cli/setup.mdx`

- 已完成最小验证：
  - `npm run build` 通过。
  - `bun test tests/utils/skill-docs-placement.test.ts` 通过。
  - `bun test tests/infrastructure/plugin-distribution.test.ts` 初次失败，定位到根因是 `package.json` 的 `files` 字段未包含裸 `plugin` 项；补齐后重跑通过。

- 已同步修正 `package.json` 分发清单，使其满足当前基础设施测试约束。

- 已再次检查 `docs/public/docs.json`，当前页仍前置，历史页仍后置，没有把历史 hooks / migration 页面放到当前主入口前面。

#### 下一步

1. 对剩余 docs 长尾页继续做 spot check，确认没有遗漏的旧主叙事入口。
2. 若后续再改动分发、版本或导航映射，补跑对应测试。
3. 满足需要时再进入下一轮文档或命名收口。
