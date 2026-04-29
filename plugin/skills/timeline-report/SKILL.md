---
name: timeline-report
description: 生成 “Journey Into [Project]” 叙事报告，基于 ccx-ecc-mem timeline 分析项目完整开发历史。用户要求 timeline report、项目历史分析、开发历程或完整项目报告时使用。
---

# Timeline Report

基于 ccx-ecc-mem 的持久记忆 timeline，生成项目完整开发历史的叙事分析报告。

## 何时使用

当用户提出以下请求时使用：

- “写一份 timeline report”
- “Journey into [project]”
- “分析这个项目的历史”
- “生成完整项目报告”
- “总结整个开发历程”
- “这个项目是怎么一路发展过来的？”

## 前置条件

ccx-ecc-mem worker 必须在 `localhost:37777` 运行，目标项目必须已有 recorded observations。

## 工作流

### 第 1 步：确定项目名

如果上下文不明显，先询问用户要分析哪个项目。项目名通常是项目目录名，例如 `tokyo` 或 `my-app`。如果用户说“这个项目”，使用当前工作目录的 basename。

Worktree 检测：在使用目录 basename 前，先检查当前目录是否是 git worktree。若是 worktree，数据源通常是父项目，而不是 worktree 目录本身。运行：

```bash
git_dir=$(git rev-parse --git-dir 2>/dev/null)
git_common_dir=$(git rev-parse --git-common-dir 2>/dev/null)
if [ "$git_dir" != "$git_common_dir" ]; then
  parent_project=$(basename "$(dirname "$git_common_dir")")
  echo "Worktree detected. Parent project: $parent_project"
else
  parent_project=$(basename "$PWD")
fi
echo "$parent_project"
```

如果检测到 worktree，后续 API 调用使用 `$parent_project`。同时告知用户：检测到 git worktree，正在使用父项目 `[name]` 作为数据源。

### 第 2 步：获取完整 timeline

用 Bash 从 ccx-ecc-mem worker API 获取完整 timeline：

```bash
curl -s "http://localhost:37777/api/context/inject?project=PROJECT_NAME&full=true"
```

返回内容是该项目全历史的压缩 timeline，包含 observations、session boundaries 和 summaries，已格式化为适合 LLM 阅读的 markdown。

Token 粗略估计：

- 小项目（少于 1,000 observations）：约 20-50K tokens
- 中型项目（1,000-10,000 observations）：约 50-300K tokens
- 大型项目（10,000-35,000 observations）：约 300-750K tokens

如果响应为空或报错，可能是 worker 未运行或项目名错误。可用以下命令验证 worker：

```bash
curl -s "http://localhost:37777/api/search?query=*&limit=1"
```

### 第 3 步：估算 token 成本

继续前先估算 timeline token 数，粗略按 4 字符约 1 token。向用户报告：

```text
已获取 timeline：约 X 条 observations，估算约 Yk tokens。
本次分析大约消耗 Yk input tokens + 5-10k output tokens。
是否继续？(y/n)
```

如果 timeline 超过 100K tokens，继续前必须等待用户确认。

### 第 4 步：用 subagent 分析

启动 Agent，并把完整 timeline 作为上下文传入。要求 agent 也查询 SQLite 数据库 `~/.claude-mem/claude-mem.db` 来完成 Token Economics 部分。

Agent prompt：

```text
You are a technical historian analyzing a software project's complete development timeline from ccx-ecc-mem's persistent memory system. The timeline below contains every observation, session boundary, and summary recorded across the project's entire history.

You also have access to the ccx-ecc-mem SQLite database at ~/.claude-mem/claude-mem.db. Use it to run queries for the Token Economics & Memory ROI section. The database has an "observations" table with columns: id, memory_session_id, project, text, type, title, subtitle, facts, narrative, concepts, files_read, files_modified, prompt_number, discovery_tokens, created_at, created_at_epoch, source_tool, source_input_summary.

Write a comprehensive narrative report titled "Journey Into [PROJECT_NAME]" that covers:

## Required Sections

1. **Project Genesis** -- When and how the project started. What were the first commits, the initial vision, the founding technical decisions? What problem was being solved?

2. **Architectural Evolution** -- How did the architecture change over time? What were the major pivots? Why did they happen? Trace the evolution from initial design through each significant restructuring.

3. **Key Breakthroughs** -- Identify the "aha" moments: when a difficult problem was finally solved, when a new approach unlocked progress, when a prototype first worked. These are the observations where the tone shifts from investigation to resolution.

4. **Work Patterns** -- Analyze the rhythm of development. Identify debugging cycles, feature sprints, refactoring phases, and exploration phases.

5. **Technical Debt** -- Track where shortcuts were taken and when they were paid back. Identify patterns of accumulation and resolution.

6. **Challenges and Debugging Sagas** -- The hardest problems encountered, including multi-session debugging efforts and architectural dead ends.

7. **Memory and Continuity** -- How did persistent memory, including ccx-ecc-mem itself if applicable, affect the development process?

8. **Token Economics & Memory ROI** -- Quantitative analysis of how memory recall saved work:
   - Query the database directly using `sqlite3 ~/.claude-mem/claude-mem.db`
   - Count total discovery_tokens across all observations
   - Count sessions that had context injection available
   - Calculate compression ratio: average discovery_tokens vs average read_tokens per observation
   - Identify highest-value observations by discovery_tokens
   - Identify explicit recall events
   - Estimate passive recall savings and explicit recall savings
   - Calculate net ROI
   - Present a monthly breakdown table

   Use these SQL queries as a starting point:
   ```sql
   SELECT SUM(discovery_tokens) FROM observations WHERE project = 'PROJECT_NAME';
   SELECT COUNT(DISTINCT memory_session_id) FROM observations WHERE project = 'PROJECT_NAME';
   SELECT AVG(discovery_tokens) as avg_discovery, AVG(LENGTH(title || COALESCE(subtitle,'') || COALESCE(narrative,'') || COALESCE(facts,'')) / 4) as avg_read FROM observations WHERE project = 'PROJECT_NAME' AND discovery_tokens > 0;
   SELECT id, title, discovery_tokens FROM observations WHERE project = 'PROJECT_NAME' ORDER BY discovery_tokens DESC LIMIT 5;
   SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as obs, SUM(discovery_tokens) as total_discovery, COUNT(DISTINCT memory_session_id) as sessions FROM observations WHERE project = 'PROJECT_NAME' GROUP BY month ORDER BY month;
   SELECT COUNT(*) FROM observations WHERE project = 'PROJECT_NAME' AND (source_tool LIKE '%search%' OR source_tool LIKE '%timeline%' OR source_tool LIKE '%get_observations%' OR narrative LIKE '%recalled%' OR narrative LIKE '%from memory%' OR narrative LIKE '%previous session%');
   ```

9. **Timeline Statistics** -- Date range, total observations/sessions, type breakdown, most active periods, longest debugging sessions.

10. **Lessons and Meta-Observations** -- What patterns emerge from the full history, and what would a new developer learn?

## Writing Style

- Write as a technical narrative, not just bullet points.
- Use specific observation IDs and timestamps when referencing events.
- Connect events across time and show consequences.
- Be honest about struggles and dead ends.
- Target 3,000-6,000 words depending on project size.
- Use markdown headings and code references where helpful.

## Important

- Analyze the entire timeline chronologically.
- Look for narrative arcs: problem -> investigation -> solution.
- Identify turning points where project direction changed.
- Note observations about tooling, workflow, and collaboration patterns.

Here is the complete project timeline:

[TIMELINE CONTENT GOES HERE]
```

### 第 5 步：保存报告

默认保存为：

```text
./journey-into-PROJECT_NAME.md
```

如果用户指定了输出路径，使用用户指定路径。

### 第 6 步：报告完成情况

告知用户：

- 报告保存路径
- 估算 token 成本
- 覆盖的日期范围
- 分析的 observations 数量

## 错误处理

- 空 timeline：`No observations found for project 'X'. Check the project name with: curl -s 'http://localhost:37777/api/search?query=*&limit=1'`
- Worker 未运行：`ccx-ecc-mem worker is not responding on port 37777. Start it with your usual method or check ps aux | grep worker-service.`
- Timeline 过大：超过 50,000 observations 的项目可能超出上下文限制。建议按时间窗口拆分分析。

## 示例

用户：“Write a journey report for the tokyo project”

1. 获取：`curl -s "http://localhost:37777/api/context/inject?project=tokyo&full=true"`
2. 估算：“Timeline fetched: ~34,722 observations, estimated ~718K tokens. Proceed?”
3. 用户确认
4. 启动分析 agent 并传入完整 timeline
5. 保存到 `./journey-into-tokyo.md`
6. 回复：“Report saved. Analyzed 34,722 observations spanning Oct 2025 - Mar 2026 (~718K input tokens, ~8K output tokens).”
