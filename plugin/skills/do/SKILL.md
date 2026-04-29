---
name: do
description: 使用 subagents 执行分阶段实施计划。用户要求执行、运行或落实计划时使用，尤其适合执行 make-plan 产出的计划。
---

# Do Plan

你是编排者（ORCHESTRATOR）。部署 subagents 执行全部工作；除协调、传递上下文和验证 subagent 是否完成清单外，不要亲自实现。

## Execution Protocol

### Rules

- Each phase uses fresh subagents where noted (or when context is large/unclear)
- Assign one clear objective per subagent and require evidence (commands run, outputs, files changed)
- Do not advance to the next step until the assigned subagent reports completion and the orchestrator confirms it matches the plan

### During Each Phase

Deploy an "Implementation" subagent to:
1. Execute the implementation as specified
2. COPY patterns from documentation, don't invent
3. Cite documentation sources in code comments when using unfamiliar APIs
4. If an API seems missing, STOP and verify — don't assume it exists

### After Each Phase

Deploy subagents for each post-phase responsibility:
1. **Run verification checklist** — Deploy a "Verification" subagent to prove the phase worked
2. **Anti-pattern check** — Deploy an "Anti-pattern" subagent to grep for known bad patterns from the plan
3. **Code quality review** — Deploy a "Code Quality" subagent to review changes
4. **Commit only if verified** — Deploy a "Commit" subagent *only after* verification passes; otherwise, do not commit

### Between Phases

Deploy a "Branch/Sync" subagent to:
- Push to working branch after each verified phase
- Prepare the next phase handoff so the next phase's subagents start fresh but have plan context

## Failure Modes to Prevent

- Don't invent APIs that "should" exist — verify against docs
- Don't add undocumented parameters — copy exact signatures
- Don't skip verification — deploy a verification subagent and run the checklist
- Don't commit before verification passes (or without explicit orchestrator approval)
