# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project goal

This repository is intended to fuse and Chinese-localize two Claude Code related projects from `/home/remote/workspace`:

- `everything-claude-code`: present at `/home/remote/workspace/everything-claude-code`.
- `ccx-mem`: present at `/home/remote/workspace/ccx-mem`.

The user has authorized copying files from the source project directories into this repository for implementation work.

## Commands

No commands are defined in this repository yet because it currently has no package manifest, build configuration, or test configuration.

When source files are copied in, update this section from verified project files such as `package.json`, `pyproject.toml`, `Makefile`, CI configuration, or README instructions. Include at minimum:

- build command
- lint command
- test command
- single-test command
- local development command, if the merged project has one

## Architecture

There is no local application architecture yet. The intended architecture should be derived from the copied source projects, not invented in advance.

When fusion work begins, document the big-picture structure here after inspecting the imported files:

- plugin/package boundaries
- CLI or hook entry points
- memory/storage components
- Claude Code integration points
- localization/i18n strategy
- generated or vendored assets that should not be edited directly

## Fusion and localization workflow

Use an evidence-first, Karpathy-inspired workflow:

- Build the smallest runnable merged slice first, then expand coverage.
- Prefer direct, readable integration over framework-heavy rewrites.
- Preserve upstream behavior until a deliberate localization or fusion change requires otherwise.
- Keep Chinese localization complete and consistent for user-facing text, README content, plugin metadata, prompts, and command descriptions.
- Separate source import, behavior changes, and localization changes when practical so diffs remain reviewable.
- Verify each meaningful change by running the relevant command once commands exist.
- Do not invent compatibility layers, fallback behavior, or abstractions before the merged code demonstrates a need.

## Updating this file

As soon as real source files are copied into this repository, replace the placeholder command and architecture sections with verified details from the merged codebase.
