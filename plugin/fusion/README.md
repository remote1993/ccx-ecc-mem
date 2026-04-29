# Fusion capability registry

`registry.json` is the curated capability registry for the `ccx-ecc-mem` product surface.

The default `core` profile is Chinese-first, low-dependency, and local-first. It exposes named capabilities for the Viewer and install state, while the plugin also ships the complete ECC capability library so Claude Code can discover relevant skills and curated commands from their descriptions at use time. ECC agents are optional profile capabilities and are not part of the default active surface.

Each registry capability declares its type, bilingual title and summary, source, maturity status, dependency tier, default enablement, implementation path, and known risks. `scripts/build-hooks.js` turns this registry into `active-view.json`, which is served to the Viewer through `/api/viewer/capabilities`.

The full upstream ECC import is preinstalled under `plugin/ecc/`. `plugin/ecc/skills/` is exposed to the plugin manifest so Claude Code can select relevant skills without fetching or searching later. Commands are available locally but exposed through the curated fusion command surface by default, because the full ECC command catalog contains heavyweight and external-service workflows. ECC agents, hooks, external MCP catalogs, orchestration flows, media-generation flows, and heavyweight runtimes remain non-executing assets until an explicit profile or controlled configuration enables them.
