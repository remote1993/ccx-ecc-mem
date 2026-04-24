/**
 * IDE Auto-Detection
 *
 * Detects the currently supported host clients for claude-mem.
 *
 * Pure Node.js — no Bun APIs used.
 */
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// ---------------------------------------------------------------------------
// IDE type and metadata
// ---------------------------------------------------------------------------

export interface IDEInfo {
  /** Machine-readable identifier. */
  id: string;
  /** Human-readable label for display in prompts. */
  label: string;
  /** Whether the IDE was detected on this system. */
  detected: boolean;
  /** Whether claude-mem has implemented setup for this IDE. */
  supported: boolean;
  /** Short hint text shown in the multi-select. */
  hint?: string;
}

// ---------------------------------------------------------------------------
// Detection map
// ---------------------------------------------------------------------------

/**
 * Detect all known IDEs and return an array of `IDEInfo` objects.
 * Each entry indicates whether the IDE was found and whether claude-mem
 * currently supports setting it up.
 */
export function detectInstalledIDEs(): IDEInfo[] {
  const home = homedir();

  return [
    {
      id: 'claude-code',
      label: 'Claude Code',
      detected: existsSync(join(home, '.claude')),
      supported: true,
      hint: 'plugin-based integration',
    },
    {
      id: 'codex-cli',
      label: 'Codex CLI',
      detected: existsSync(join(home, '.codex')),
      supported: true,
      hint: 'transcript-based integration',
    },
  ];
}

/**
 * Return only the IDEs that were detected on this system.
 */
export function getDetectedIDEs(): IDEInfo[] {
  return detectInstalledIDEs().filter((ide) => ide.detected);
}
