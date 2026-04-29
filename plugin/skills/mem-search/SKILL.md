---
name: mem-search
description: 搜索 ccx-ecc-mem 的跨会话持久记忆数据库。用户询问“之前是否解决过这个问题”“上次怎么做的”或需要历史工作上下文时使用。
---

# Memory Search

搜索历史会话中的工作记录。固定流程：先搜索，再筛选，最后只拉取必要详情。

## 何时使用

当用户询问过去会话或历史工作，而不是当前对话时使用：

- “我们之前修过这个吗？”
- “上次是怎么解决 X 的？”
- “上周发生了什么？”

## 三层检索流程

不要跳过筛选直接拉取完整详情；先筛选通常能节省约 10 倍 token。

### 第 1 步：Search，获取带 ID 的索引

使用 `search` MCP tool：

```text
search(query="authentication", limit=20, project="my-project")
```

返回带 ID、时间、类型、标题的紧凑表格，约每条 50-100 tokens。

参数：

- `query`：搜索词
- `limit`：最大结果数，默认 20，最大 100
- `project`：项目名过滤
- `type`：可选，`observations`、`sessions` 或 `prompts`
- `obs_type`：可选，逗号分隔，如 `bugfix,feature,decision,discovery,change`
- `dateStart` / `dateEnd`：可选，`YYYY-MM-DD` 或 epoch ms
- `offset`：可选，跳过前 N 条
- `orderBy`：可选，`date_desc`、`date_asc` 或 `relevance`

### 第 2 步：Timeline，查看候选结果附近上下文

使用 `timeline` MCP tool：

```text
timeline(anchor=11131, depth_before=3, depth_after=3, project="my-project")
```

也可以用查询自动找 anchor：

```text
timeline(query="authentication", depth_before=3, depth_after=3, project="my-project")
```

返回 anchor 前后的 observations、sessions 和 prompts，按时间顺序交错展示。

### 第 3 步：Fetch，只拉取筛选后的完整详情

根据搜索标题和 timeline 上下文挑出相关 ID，丢弃其余结果。

使用 `get_observations` MCP tool：

```text
get_observations(ids=[11131, 10942])
```

两条及以上 observation 必须批量调用 `get_observations`，避免 N 次请求。

参数：

- `ids`：必填，observation ID 数组
- `orderBy`：可选，`date_desc` 或 `date_asc`
- `limit`：可选，最大返回数量
- `project`：可选，项目名过滤

完整 observation 通常包含 title、subtitle、narrative、facts、concepts、files，约每条 500-1000 tokens。

## 示例

查找最近 bug 修复：

```text
search(query="bug", type="observations", obs_type="bugfix", limit=20, project="my-project")
```

查找上周发生的事：

```text
search(type="observations", dateStart="2025-11-11", limit=20, project="my-project")
```

理解某个发现附近的上下文：

```text
timeline(anchor=11131, depth_before=5, depth_after=5, project="my-project")
```

批量拉取详情：

```text
get_observations(ids=[11131, 10942, 10855], orderBy="date_desc")
```

## 为什么这样做

- 搜索索引：约每条 50-100 tokens
- 完整 observation：约每条 500-1000 tokens
- 批量拉取：1 个 HTTP 请求，而不是 N 个单独请求
- 先筛选再拉取，通常能节省约 10 倍 token

## Knowledge Agents

如果需要综合答案而不是原始记录，使用 `/knowledge-agent` 从 observation 历史构建可查询语料库。knowledge agent 会读取匹配 observations，并以对话方式回答问题。
