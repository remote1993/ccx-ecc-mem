/**
 * NPX CLI entry point for ccx-ecc-mem.
 *
 * Usage:
 *   npx ccx-ecc-mem                 → interactive install
 *   npx ccx-ecc-mem install         → interactive install
 *   npx ccx-ecc-mem install --ide <id|all> → direct host setup
 *   npx ccx-ecc-mem update          → update to latest version
 *   npx ccx-ecc-mem uninstall       → remove plugin and Codex config
 *   npx ccx-ecc-mem version         → print version
 *   npx ccx-ecc-mem start           → start worker service
 *   npx ccx-ecc-mem stop            → stop worker service
 *   npx ccx-ecc-mem restart         → restart worker service
 *   npx ccx-ecc-mem status          → show worker status
 *   npx ccx-ecc-mem search <query>  → search observations
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
${pc.bold('ccx-ecc-mem')} v${version} — 中文优先、少依赖的 Claude Code 本地能力、记忆与治理插件

${pc.bold('安装命令')}（不需要 Bun）：
  ${pc.cyan('npx ccx-ecc-mem')}                 交互式安装
  ${pc.cyan('npx ccx-ecc-mem install')}          交互式安装
  ${pc.cyan('npx ccx-ecc-mem install --ide <id|all>')} 为指定宿主安装
  ${pc.cyan('npx ccx-ecc-mem install --mode <mode>')} 设置注入上下文语言
  ${pc.cyan('npx ccx-ecc-mem install --profile <profile>')} 选择能力配置
  ${pc.cyan('npx ccx-ecc-mem update')}           更新到最新版本
  ${pc.cyan('npx ccx-ecc-mem uninstall')}        卸载插件和 Codex 配置
  ${pc.cyan('npx ccx-ecc-mem version')}          输出版本

${pc.bold('运行命令')}（需要 Bun，委托给已安装插件）：
  ${pc.cyan('npx ccx-ecc-mem start')}            启动 worker 服务
  ${pc.cyan('npx ccx-ecc-mem stop')}             停止 worker 服务
  ${pc.cyan('npx ccx-ecc-mem restart')}          重启 worker 服务
  ${pc.cyan('npx ccx-ecc-mem status')}           查看 worker 状态
  ${pc.cyan('npx ccx-ecc-mem search <query>')}   搜索记忆观察
  ${pc.cyan('npx ccx-ecc-mem adopt [--dry-run] [--branch <name>]')}    将已合并 worktree 归档到父项目

${pc.bold('兼容别名')}:
  ${pc.cyan('npx ccx-mem')} 仍可作为兼容别名使用

${pc.bold('IDE 标识')}:
  claude-code, codex-cli, all

${pc.bold('语言模式')}:
  code--zh, code, code--ja, code--ko, code--es, code--fr, code--de, code--pt-br
`);
}

function readOptionValue(flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;

  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    console.error(pc.red(`${flag} 缺少参数值`));
    console.error(`运行 ${pc.bold('npx ccx-ecc-mem --help')} 查看用法。`);
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

      const profileValue = readOptionValue('--profile');

      const { runInstallCommand } = await import('./commands/install.js');
      await runInstallCommand({ ide: ideValue, mode: modeValue, profile: profileValue });
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

    // -- Unknown -----------------------------------------------------------
    default: {
      console.error(pc.red(`未知命令：${command}`));
      console.error(`运行 ${pc.bold('npx ccx-ecc-mem --help')} 查看用法。`);
      process.exit(1);
    }
  }
}

main().catch((error) => {
  console.error(pc.red('Fatal error:'), error.message || error);
  process.exit(1);
});
