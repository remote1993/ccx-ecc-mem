---
name: claude-code-plugin-release
description: Claude Code 插件的自动化语义版本与发布工作流。处理 package.json、marketplace.json、plugin.json 的版本递增、构建验证、git tag、GitHub release 和 changelog 生成。
---

# Version Bump & Release Workflow

重要：开始 version bump 前，必须先规划并写好详细 release notes。

关键要求：提交所有内容，包括构建产物。工作流结束时不应留下未提交或未推送的变更；最后运行 `git status` 验证。

## Preparation

1.  **Analyze**: Determine if the change is a **PATCH** (bug fixes), **MINOR** (features), or **MAJOR** (breaking) update.
2.  **Environment**: Identify the repository owner and name (e.g., from `git remote -v`).
3.  **Paths**: Verify existence of `package.json`, `.claude-plugin/marketplace.json`, and `plugin/.claude-plugin/plugin.json`.

## Workflow

1.  **Update**: Increment version strings in all configuration files.
2.  **Verify**: Use `grep` to ensure all files match the new version.
3.  **Build**: Run `npm run build` to generate fresh artifacts.
4.  **Commit**: Stage all changes including artifacts: `git add -A && git commit -m "chore: bump version to X.Y.Z"`.
5.  **Tag**: Create an annotated tag: `git tag -a vX.Y.Z -m "Version X.Y.Z"`.
6.  **Push**: `git push origin main && git push origin vX.Y.Z`.
7.  **Release**: `gh release create vX.Y.Z --title "vX.Y.Z" --notes "RELEASE_NOTES"`.
8.  **Changelog**: Regenerate `CHANGELOG.md` using the GitHub API and the provided script:
    ```bash
    gh api repos/{owner}/{repo}/releases --paginate | ./scripts/generate_changelog.js > CHANGELOG.md
    ```
9.  **Sync**: Commit and push the updated `CHANGELOG.md`.
10. **Notify**: Run `npm run discord:notify vX.Y.Z` if applicable.
11. **Finalize**: Run `git status` to ensure a clean working tree.

## Checklist

- [ ] All config files have matching versions
- [ ] `npm run build` succeeded
- [ ] Git tag created and pushed
- [ ] GitHub release created with notes
- [ ] `CHANGELOG.md` updated and pushed
- [ ] `git status` shows clean tree
