---
name: knowledge-agent
description: 从 ccx-ecc-mem observations 构建并查询 AI 知识库。用户想基于历史观察创建聚焦“知识脑”、询问过往工作模式或整理某个主题的经验时使用。
---

# Knowledge Agent

从 ccx-ecc-mem observations 构建并查询 AI 知识库。

## Knowledge Agent 是什么

Knowledge agent 是由筛选后的 observations 编译成的对话式 AI 语料库。先从历史 observations 构建 corpus，再 prime corpus，把知识加载到 AI 会话中，之后即可用自然语言连续提问。

可以把它理解为自定义“知识脑”：例如“hooks 生命周期的一切”“最近一个月的所有决策”“worker service 的全部 bugfix”。

## 工作流

### 第 1 步：构建 corpus

```text
build_corpus name="hooks-expertise" description="Everything about the hooks lifecycle" project="ccx-ecc-mem" concepts="hooks" limit=500
```

过滤选项：

- `project`：按项目名过滤
- `types`：逗号分隔，如 `decision,bugfix,feature,refactor,discovery,change`
- `concepts`：逗号分隔的 concept tags
- `files`：逗号分隔的文件路径，按前缀匹配
- `query`：语义搜索查询
- `dateStart` / `dateEnd`：ISO 日期范围
- `limit`：最大 observations 数，默认 500

### 第 2 步：prime corpus

```text
prime_corpus name="hooks-expertise"
```

这会创建一个载入 corpus 知识的 AI 会话。大型 corpus 需要等待一段时间。

### 第 3 步：查询

```text
query_corpus name="hooks-expertise" question="What are the 5 lifecycle hooks and when does each fire?"
```

knowledge agent 会基于 corpus 回答。后续问题会保留对话上下文。

### 第 4 步：列出 corpora

```text
list_corpora
```

显示所有 corpora 的统计信息和 priming 状态。

## 使用建议

- 聚焦 corpus 效果最好：“hooks architecture” 优于 “everything ever”。
- 先 prime 一次，再多次 query；session 会跨查询保留。
- 如果对话偏离主题，使用 reprime 重置上下文。
- 新 observations 加入后，先 rebuild，再 reprime。

## 维护

刷新已有 corpus：

```text
rebuild_corpus name="hooks-expertise"
```

刷新后重新 prime：

```text
reprime_corpus name="hooks-expertise"
```

`reprime_corpus` 会清空之前的 Q&A 上下文，并把 corpus 重新加载到新会话中。
