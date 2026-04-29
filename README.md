# ccx-ecc-mem

`ccx-ecc-mem` 是一个少依赖、中文优先、支持中英文的 Claude Code 本地能力平台。它把记忆、检索、hook 治理、能力编排和 Viewer 控制台整合为一个统一产品，而不是把 `ccx-mem` 与 Everything Claude Code 作为两个可见系统硬拼在一起。

项目采用 capability-oriented 设计：核心能力通过 `plugin/fusion/registry.json` 注册为带有双语元数据、依赖等级、来源、状态和实现路径的 capability。完整 ECC skills/commands/agents/docs/rules 作为本地预装能力库随包发布；ECC skills 暴露给 Claude Code 按描述自动选择，commands 通过 curated fusion 面暴露，agents、未内化 ECC hooks、外部 MCP 和重型运行时仍必须显式启用。

## 当前状态

- 默认产品面：本地 worker、hook lifecycle、记忆捕获、SQLite 轻量检索、Viewer 能力中心、核心 skills/commands。
- 能力注册表：`plugin/fusion/registry.json`
- 构建生成能力视图：`plugin/fusion/active-view.json`
- Viewer 能力 API：`GET /api/viewer/capabilities`
- ECC 精选 skills/commands：以内化 capability 形式进入默认 core。
- ECC 完整资源：随发布包预装，skills 暴露给插件系统自动选择；commands 通过 curated fusion 暴露；hooks/MCP/runtimes 不自动运行。
- 已验证构建：`npm run build`
- 已验证测试：`npm test`
- 已验证打包：`npm pack --dry-run`

## 快速开始

安装依赖并构建：

```bash
npm install
npm run build
```

运行测试：

```bash
npm test
```

查看 CLI 帮助：

```bash
node dist/npx-cli/index.js --help
```

检查 worker 状态：

```bash
npm run worker:status
```

检查 npm 发布包内容：

```bash
npm pack --dry-run
```

## 命令

- 构建：`npm run build`
- 全量测试：`npm test`
- Server 专项测试：`npm run test:server`
- Search 专项测试：`npm run test:search`
- Context 专项测试：`npm run test:context`
- Infrastructure 专项测试：`npm run test:infra`
- Worker 状态：`npm run worker:status`
- Worker 启动：`npm run worker:start`
- Worker 停止：`npm run worker:stop`
- Worker 重启：`npm run worker:restart`

避免在普通开发验证中运行 `npm run build-and-sync`，因为它会同步到本地 Claude 插件 marketplace 并重启已安装 worker。

## 架构

核心运行链路：

```text
plugin/hooks/hooks.json
  -> src/cli/hook-command.ts
  -> src/services/worker-service.ts
  -> src/services/worker/http/routes/*
  -> src/ui/viewer/*
```

关键模块：

- CLI 入口：`src/npx-cli/index.ts`
- MCP server：`src/servers/mcp-server.ts`
- Hook command：`src/cli/hook-command.ts`
- Worker service：`src/services/worker-service.ts`
- Worker HTTP routes：`src/services/worker/http/routes/`
- Viewer UI：`src/ui/viewer/` 构建到 `plugin/ui/`
- 插件 manifest：`plugin/.claude-plugin/plugin.json`
- 插件 hooks：`plugin/hooks/hooks.json`
- 原生 skills：`plugin/skills/`
- 能力注册表：`plugin/fusion/registry.json`
- 能力 active view：`plugin/fusion/active-view.json`

## 能力边界

- `plugin/fusion/registry.json` 是用户可见能力面的唯一真源。
- `scripts/build-hooks.js` 从 registry 生成 `plugin/fusion/active-view.json`。
- `src/npx-cli/commands/install.ts` 安装时记录 capability profile、locale、启用能力和可选能力。
- `src/services/worker/http/routes/ViewerRoutes.ts` 通过 `/api/viewer/capabilities` 暴露能力视图。
- `src/ui/viewer/components/CapabilityCenter.tsx` 在 Viewer 中展示能力中心。
- 默认 core 能力必须保持少依赖，不应引入外部服务凭据、未内化 ECC hooks、Playwright、PM2、ccg-workflow 或重型语言工具链。
- 完整 ECC skills/commands/agents/docs/rules 随包预装；ECC skills 可按描述自动发现，ECC commands 仅通过 curated fusion 命令面暴露，ECC agents 仅在显式 profile 中启用。
- 未内化 ECC hooks、外部 MCP catalog、媒体生成和重型运行时不自动接入 hook/MCP 主链，必须经显式配置或后续内化。

## 系统要求

- Node.js 18 或更高版本
- Bun 1.0 或更高版本
- 支持插件的 Claude Code
- SQLite 3（运行时使用）
- uv / Chroma MCP 等增强检索依赖仅作为可选能力使用

## 语言策略

中文是默认用户语言。CLI 文案、Viewer 标签、capability 标题/摘要、插件 metadata、提示词和命令描述应中文优先，并提供英文 fallback。代码标识符、协议字段、命令和路径保持原文。

## 许可证与来源

- 本项目运行时代码使用 AGPL-3.0，见 [LICENSE](LICENSE)。
- 内化与预装的 Everything Claude Code 资源保留 MIT 许可归属，发布包内副本位于 `plugin/ecc/LICENSE.everything-claude-code` 与 `plugin/fusion/LICENSE.everything-claude-code`。
- ECC 完整资源随发布包预装，但只有 skills/commands 作为可发现能力面暴露；hooks/MCP/runtimes 不自动运行。
