/**
 * NPX CLI entry point for claude-mem.
 *
 * Usage:
 *   npx ccx-mem                     → interactive install
 *   npx ccx-mem install             → interactive install
 *   npx ccx-mem install --ide <id|all> → direct host setup
 *   npx ccx-mem update              → update to latest version
 *   npx ccx-mem uninstall           → remove plugin and Codex config
 *   npx ccx-mem version             → print version
 *   npx ccx-mem start               → start worker service
 *   npx ccx-mem stop                → stop worker service
 *   npx ccx-mem restart             → restart worker service
 *   npx ccx-mem status              → show worker status
 *   npx ccx-mem search <query>      → search observations
 *   npx ccx-mem transcript watch    → start transcript watcher
 *
 * This file is pure Node.js — Bun is NOT required for install commands.
 * Runtime commands (`start`, `stop`, etc.) delegate to Bun via the installed plugin.
 */
import pc from 'picocolors';
import { readPluginVersion } from './utils/paths.js';

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const command = args[0]?.toLowerCase() ?? '';

// ---------------------------------------------------------------------------
// Help text
// ---------------------------------------------------------------------------

function printHelp(): void {
  const version = readPluginVersion();

  console.log(`
${pc.bold('claude-mem')} v${version} — persistent memory for AI coding assistants

${pc.bold('Install Commands')} (no Bun required):
  ${pc.cyan('npx ccx-mem')}                     Interactive install
  ${pc.cyan('npx ccx-mem install')}              Interactive install
  ${pc.cyan('npx ccx-mem install --ide <id|all>')} Install for specific host(s)
  ${pc.cyan('npx ccx-mem install --mode <mode>')} Set injected-context language
  ${pc.cyan('npx ccx-mem update')}               Update to latest version
  ${pc.cyan('npx ccx-mem uninstall')}            Remove plugin and Codex config
  ${pc.cyan('npx ccx-mem version')}              Print version

${pc.bold('Runtime Commands')} (requires Bun, delegates to installed plugin):
  ${pc.cyan('npx ccx-mem start')}                Start worker service
  ${pc.cyan('npx ccx-mem stop')}                 Stop worker service
  ${pc.cyan('npx ccx-mem restart')}              Restart worker service
  ${pc.cyan('npx ccx-mem status')}               Show worker status
  ${pc.cyan('npx ccx-mem search <query>')}       Search observations
  ${pc.cyan('npx ccx-mem adopt [--dry-run] [--branch <name>]')}    Stamp merged worktrees into parent project
  ${pc.cyan('npx ccx-mem transcript watch')}     Start transcript watcher

${pc.bold('IDE Identifiers')}:
  claude-code, codex-cli, all

${pc.bold('Language Modes')}:
  code, code--zh, code--ja, code--ko, code--es, code--fr, code--de, code--pt-br
`);
}

function readOptionValue(flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;

  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    console.error(pc.red(`Missing value for ${flag}`));
    console.error(`Run ${pc.bold('npx ccx-mem --help')} for usage information.`);
    process.exit(1);
  }

  return value;
}

// ---------------------------------------------------------------------------
// Command routing
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  switch (command) {
    // -- No command: default to install ------------------------------------
    case '': {
      const { runInstallCommand } = await import('./commands/install.js');
      await runInstallCommand();
      break;
    }

    // -- Install -----------------------------------------------------------
    case 'install': {
      const ideValue = readOptionValue('--ide');
      const modeValue = readOptionValue('--mode');

      const { runInstallCommand } = await import('./commands/install.js');
      await runInstallCommand({ ide: ideValue, mode: modeValue });
      break;
    }

    // -- Update (alias for install — overwrite with latest) ----------------
    case 'update':
    case 'upgrade': {
      const { runInstallCommand } = await import('./commands/install.js');
      await runInstallCommand();
      break;
    }

    // -- Uninstall ---------------------------------------------------------
    case 'uninstall':
    case 'remove': {
      const { runUninstallCommand } = await import('./commands/uninstall.js');
      await runUninstallCommand();
      break;
    }

    // -- Version -----------------------------------------------------------
    case 'version':
    case '--version':
    case '-v': {
      console.log(readPluginVersion());
      break;
    }

    // -- Help --------------------------------------------------------------
    case 'help':
    case '--help':
    case '-h': {
      printHelp();
      break;
    }

    // -- Runtime: start / stop / restart / status --------------------------
    case 'start': {
      const { runStartCommand } = await import('./commands/runtime.js');
      runStartCommand();
      break;
    }
    case 'stop': {
      const { runStopCommand } = await import('./commands/runtime.js');
      runStopCommand();
      break;
    }
    case 'restart': {
      const { runRestartCommand } = await import('./commands/runtime.js');
      runRestartCommand();
      break;
    }
    case 'status': {
      const { runStatusCommand } = await import('./commands/runtime.js');
      runStatusCommand();
      break;
    }

    // -- Search ------------------------------------------------------------
    case 'search': {
      const { runSearchCommand } = await import('./commands/runtime.js');
      await runSearchCommand(args.slice(1));
      break;
    }

    // -- Adopt merged worktrees -------------------------------------------
    case 'adopt': {
      const { runAdoptCommand } = await import('./commands/runtime.js');
      runAdoptCommand(args.slice(1));
      break;
    }

    // -- Transcript --------------------------------------------------------
    case 'transcript': {
      const subCommand = args[1]?.toLowerCase();
      if (subCommand === 'watch') {
        const { runTranscriptWatchCommand } = await import('./commands/runtime.js');
        runTranscriptWatchCommand();
      } else {
        console.error(pc.red(`Unknown transcript subcommand: ${subCommand ?? '(none)'}`));
        console.error(`Usage: npx ccx-mem transcript watch`);
        process.exit(1);
      }
      break;
    }

    // -- Unknown -----------------------------------------------------------
    default: {
      console.error(pc.red(`Unknown command: ${command}`));
      console.error(`Run ${pc.bold('npx ccx-mem --help')} for usage information.`);
      process.exit(1);
    }
  }
}

main().catch((error) => {
  console.error(pc.red('Fatal error:'), error.message || error);
  process.exit(1);
});
