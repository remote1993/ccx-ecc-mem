# Plugin guidance

This directory is the packaged Claude Code plugin slice for `ccx-ecc-mem`.

## Runtime surface

The active runtime is the local `ccx-ecc-mem` capability platform:

- Hooks: `hooks/hooks.json`
- Worker/MCP scripts: `scripts/`
- Built UI: `ui/`
- Native memory skills: `skills/`
- Preinstalled ECC skills, commands, agents, docs, and rules: `ecc/`
- Language and context modes: `modes/`
- Capability registry and active view: `fusion/`

The runtime chain is hook event -> `scripts/worker-service.cjs` -> worker HTTP APIs -> Viewer. Keep this chain local-first and low-dependency.

## Capability model

`fusion/registry.json` is the source of truth for the user-visible capability surface. It defines named capabilities with bilingual metadata, dependency tiers, source, status, implementation path, and risk labels.

`fusion/active-view.json` is generated during build from the registry and is served to the Viewer by `/api/viewer/capabilities`.

Default runtime capabilities should stay in the `core` dependency tier. ECC skills are preinstalled so Claude Code can select them by description when relevant. ECC commands are preinstalled locally but must be exposed through the curated fusion command surface unless they are explicitly reviewed for heavy dependencies and external credentials.

## ECC preinstalled capability library

Everything Claude Code assets under `ecc/` are installed with the plugin so they are available when Claude Code decides a skill or command is relevant. Do not treat ECC as something to fetch later during a task.

The automatic discovery surface is `ecc/skills/` plus curated commands from `fusion/`. ECC commands, agents, docs, rules, schemas, manifests, hooks, and MCP configs are also present locally for capability context and future orchestration, but raw hooks, external MCP servers, heavyweight commands, and heavyweight runtimes must not be wired into active behavior without explicit control.

Keep attribution through `ecc/LICENSE.everything-claude-code` and `fusion/LICENSE.everything-claude-code`.

## Localization

Chinese is the primary user-facing language. Keep plugin metadata, prompts, command descriptions, hook messages, capability titles/summaries, and Viewer labels Chinese-first with English fallback where applicable. Keep code identifiers, protocol fields, and file paths unchanged.
