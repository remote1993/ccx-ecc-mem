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
  <a href="docs/README.en.md">English</a>
</p>

<h4 align="center">围绕本地 worker 运行时、自定义第三方 API 提取路径，以及 Claude Code / Codex CLI 集成构建的持久记忆系统。</h4>

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
</p>

<p align="center">
  <a href="#快速开始">快速开始</a> •
  <a href="#工作原理">工作原理</a> •
  <a href="#搜索工具">搜索工具</a> •
  <a href="#配置">配置</a> •
  <a href="#故障排除">故障排除</a> •
  <a href="#许可证与原项目致谢">许可证</a>
</p>

<p align="center">
  ccx-mem 通过捕获 Claude Code 和 Codex CLI 的会话活动，将结构化观察存储到本地 worker 运行时，并在未来会话中注入相关项目历史，从而保留跨会话上下文。
</p>

---

## 快速开始

使用一条命令安装：

```bash
npx ccx-mem install
```

安装 Codex CLI transcript 采集支持：

```bash
npx ccx-mem install --ide codex-cli
```

也可以在 Claude Code 内通过插件 marketplace 安装：

```bash
/plugin marketplace add remote1993/ccx-mem
/plugin install ccx-mem
```

当前支持的宿主集成：

- Claude Code：本地插件注册、worker-backed 上下文注入与检索
- Codex CLI：transcript 监听和工作区 `AGENTS.md` 上下文同步

安装后请重启宿主客户端。Claude Code 会读取本地插件状态；Codex CLI 在 worker 运行且 transcript watch 启用后开始写入记忆。

> **注意：** ccx-mem 已发布到 npm，但 `npm install -g ccx-mem` 只会安装 **SDK/library**，不会注册 Claude Code 插件状态，也不会配置 Codex transcript 监听。请使用 `npx ccx-mem install`、`npx ccx-mem install --ide codex-cli` 或上面的 `/plugin` 命令安装。

## 核心特性

- **持久记忆**：项目上下文可跨 Claude Code 和 Codex CLI 会话延续
- **统一 hook 入口**：生命周期事件进入同一个 worker-backed 运行时
- **渐进式检索**：先读取紧凑索引，再按需展开时间线和完整观察
- **worker-backed retrieval**：通过 Web UI、HTTP API、skills 和 MCP compatibility surfaces 查询项目历史
- **Web Viewer UI**：在 http://localhost:37777 查看实时记忆流、设置、日志、来源筛选和上下文预览
- **隐私控制**：使用 `<private>` 标签排除敏感内容存储
- **自定义 API 提取**：可配置第三方兼容 API 处理结构化观察
- **聚焦宿主集成**：Claude Code 插件支持，以及可选的 Codex CLI transcript ingestion

---

## 文档

- [安装指南](docs/public/installation.mdx) - 快速开始与高级安装
- [Platform Integration Guide](docs/public/platform-integration.mdx) - Claude Code hooks 和 Codex transcript 集成模型
- [使用指南](docs/public/usage/getting-started.mdx) - ccx-mem 如何自动工作
- [搜索工具](docs/public/usage/search-tools.mdx) - 使用自然语言查询项目历史
- [配置](docs/public/configuration.mdx) - 环境变量与设置
- [故障排除](docs/public/troubleshooting.mdx) - 常见问题与解决方案

---

## 工作原理

核心组件：

1. **统一 hook 入口**：Claude Code 生命周期事件通过 `plugin/scripts/worker-service.cjs hook claude-code <event>` 和 `src/cli/` handlers 进入系统
2. **智能安装**：缓存依赖检查，降低 hook 启动成本
3. **Worker Service**：端口 37777 上的 Express HTTP API，负责 sessions、storage、search、settings、logs、SSE 和 custom API processing
4. **SQLite 数据库**：存储 sessions、prompts、observations、summaries 和 project/source 元数据
5. **检索入口**：Web viewer、HTTP APIs、skills 和 MCP compatibility tools 共享同一套 worker-backed history
6. **可选 Chroma Sync**：启用后可用向量 embedding 增强检索

详见 [Architecture Overview](docs/public/architecture/overview.mdx)。

---

## 搜索工具

ccx-mem 通过 Web viewer、HTTP endpoints、skills 和 MCP compatibility tools 暴露 worker-backed memory search。检索遵循节省 token 的渐进式模式：先看紧凑索引，再查看时间线上下文，最后只为必要 ID 获取完整观察。

三层检索流程：

1. `search`：获取紧凑索引
2. `timeline`：查看相关结果前后的上下文
3. `get_observations`：只为筛选出的 ID 获取完整详情

详见 [Search Tools Guide](docs/public/usage/search-tools.mdx)。

---

## 系统要求

- Node.js 18.0.0 或更高版本
- 支持插件的最新版 Claude Code
- Codex CLI（可选，用于 transcript-based memory capture）
- Bun（缺失时自动安装）
- uv（缺失时自动安装，用于向量搜索）
- SQLite 3（已内置）

---

## 配置

设置文件位于 `~/.claude-mem/settings.json`，首次运行会自动创建。可配置模型、worker 端口、数据目录、日志级别和上下文注入行为。

示例：

```json
{
  "CLAUDE_MEM_MODE": "code--zh"
}
```

模式文件位于 `plugin/modes/`。修改模式后请重启 Claude Code。

---

## 开发

```bash
git clone https://github.com/remote1993/ccx-mem.git
cd ccx-mem
npm install
npm run build
```

详见 [Development Guide](docs/public/development.mdx)。

---

## 故障排除

如果遇到问题，请先检查 worker 状态：

```bash
npx ccx-mem status
```

安装后的插件目录中也提供日志命令：

```bash
cd ~/.claude/plugins/marketplaces/remote1993/ccx-mem
npm run worker:logs
```

详见 [Troubleshooting Guide](docs/public/troubleshooting.mdx)。

---

## 支持

- **文档**：[docs/](docs/)
- **Issues**：[GitHub Issues](https://github.com/remote1993/ccx-mem/issues)
- **仓库**：[github.com/remote1993/ccx-mem](https://github.com/remote1993/ccx-mem)
- **作者**：Alex Newman ([@remote1993](https://github.com/remote1993))

---

## 许可证与原项目致谢

ccx-mem 源自原始 **Claude-Mem** 项目，并保留原项目的 AGPL-3.0 许可与版权声明。许可证文件中的 `Copyright (C) 2025 Alex Newman (@thedotmack)` 是原项目版权信息，应当保留。

本仓库当前由 [@remote1993](https://github.com/remote1993) 维护为 `remote1993/ccx-mem` 发布线。详见 [LICENSE](LICENSE)。
