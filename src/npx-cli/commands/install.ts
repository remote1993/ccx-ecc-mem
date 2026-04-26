/**
 * Install command for `npx ccx-mem install`.
 *
 * Replaces the git-clone + build workflow. The npm package already ships
 * a pre-built `plugin/` directory; this command copies it into the right
 * locations and registers it with Claude Code.
 *
 * Pure Node.js — no Bun APIs used.
 */
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { execSync } from 'child_process';
import { cpSync, existsSync, readFileSync, rmSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// Non-TTY detection: @clack/prompts crashes with ENOENT in non-TTY environments
const isInteractive = process.stdin.isTTY === true;

/** Run a list of tasks, falling back to plain console.log when non-TTY */
interface TaskDescriptor {
  title: string;
  task: (message: (msg: string) => void) => Promise<string>;
}

async function runTasks(tasks: TaskDescriptor[]): Promise<void> {
  if (isInteractive) {
    await p.tasks(tasks);
  } else {
    for (const t of tasks) {
      const result = await t.task((msg: string) => console.log(`  ${msg}`));
      console.log(`  ${result}`);
    }
  }
}

/** Log helpers that fall back to console.log in non-TTY */
const log = {
  info: (msg: string) => isInteractive ? p.log.info(msg) : console.log(`  ${msg}`),
  success: (msg: string) => isInteractive ? p.log.success(msg) : console.log(`  ${msg}`),
  warn: (msg: string) => isInteractive ? p.log.warn(msg) : console.warn(`  ${msg}`),
  error: (msg: string) => isInteractive ? p.log.error(msg) : console.error(`  ${msg}`),
};
import {
  claudeSettingsPath,
  ensureDirectoryExists,
  installedPluginsPath,
  IS_WINDOWS,
  knownMarketplacesPath,
  marketplaceDirectory,
  npmPackagePluginDirectory,
  npmPackageRootDirectory,
  pluginCacheDirectory,
  pluginsDirectory,
  readPluginVersion,
  writeJsonFileAtomic,
} from '../utils/paths.js';
import { readJsonSafe } from '../../utils/json-utils.js';
import { detectInstalledIDEs } from './ide-detection.js';
import { resolveBunBinaryPath } from '../utils/bun-resolver.js';

// ---------------------------------------------------------------------------
// Registration helpers
// ---------------------------------------------------------------------------

function registerMarketplace(): void {
  const knownMarketplaces = readJsonSafe<Record<string, any>>(knownMarketplacesPath(), {});

  knownMarketplaces['remote1993'] = {
    source: {
      source: 'github',
      repo: 'remote1993/ccx-mem',
    },
    installLocation: marketplaceDirectory(),
    lastUpdated: new Date().toISOString(),
    autoUpdate: true,
  };

  ensureDirectoryExists(pluginsDirectory());
  writeJsonFileAtomic(knownMarketplacesPath(), knownMarketplaces);
}

function registerPlugin(version: string): void {
  const installedPlugins = readJsonSafe<Record<string, any>>(installedPluginsPath(), {});

  if (!installedPlugins.version) installedPlugins.version = 2;
  if (!installedPlugins.plugins) installedPlugins.plugins = {};

  const cachePath = pluginCacheDirectory(version);
  const now = new Date().toISOString();

  installedPlugins.plugins['ccx-mem@remote1993'] = [
    {
      scope: 'user',
      installPath: cachePath,
      version,
      installedAt: now,
      lastUpdated: now,
    },
  ];

  writeJsonFileAtomic(installedPluginsPath(), installedPlugins);
}

function enablePluginInClaudeSettings(): void {
  const settings = readJsonSafe<Record<string, any>>(claudeSettingsPath(), {});

  if (!settings.enabledPlugins) settings.enabledPlugins = {};
  settings.enabledPlugins['ccx-mem@remote1993'] = true;

  writeJsonFileAtomic(claudeSettingsPath(), settings);
}

const languageModes = [
  { value: 'code', label: 'English', hint: 'default' },
  { value: 'code--zh', label: '中文', hint: 'Chinese' },
  { value: 'code--ja', label: '日本語', hint: 'Japanese' },
  { value: 'code--ko', label: '한국어', hint: 'Korean' },
  { value: 'code--es', label: 'Español', hint: 'Spanish' },
  { value: 'code--fr', label: 'Français', hint: 'French' },
  { value: 'code--de', label: 'Deutsch', hint: 'German' },
  { value: 'code--pt-br', label: 'Português do Brasil', hint: 'Brazilian Portuguese' },
];
const defaultLanguageMode = languageModes[0].value;
const availableLanguageModes = languageModes.map((mode) => mode.value).join(', ');

function supportedIDEIds(): string[] {
  return detectInstalledIDEs().filter((ide) => ide.supported).map((ide) => ide.id);
}

function availableIDEIds(): string {
  return [...supportedIDEIds(), 'all'].join(', ');
}

function expandSelectedIDEs(ide: string): string[] {
  return ide === 'all' ? supportedIDEIds() : [ide];
}

function validateSelectedIDE(ide: string): void {
  if (ide === 'all') return;

  const allIDEs = detectInstalledIDEs();
  const match = allIDEs.find((i) => i.id === ide);
  if (match && !match.supported) {
    log.error(`Support for ${match.label} coming soon.`);
    process.exit(1);
  }
  if (!match) {
    log.error(`Unknown IDE: ${ide}`);
    log.info(`Available IDEs: ${availableIDEIds()}`);
    process.exit(1);
  }
}

function settingsPath(): string {
  if (process.env.CLAUDE_MEM_DATA_DIR) {
    return join(process.env.CLAUDE_MEM_DATA_DIR, 'settings.json');
  }

  const defaultDataDir = join(homedir(), '.claude-mem');
  const defaultSettingsPath = join(defaultDataDir, 'settings.json');
  const defaultSettings = readJsonSafe<Record<string, any>>(defaultSettingsPath, {});
  const settings = defaultSettings.env ?? defaultSettings;
  const configuredDataDir = settings.CLAUDE_MEM_DATA_DIR;

  if (typeof configuredDataDir === 'string' && configuredDataDir.trim()) {
    return join(configuredDataDir.trim(), 'settings.json');
  }

  return defaultSettingsPath;
}

function readSelectedMode(): string | undefined {
  const settings = readJsonSafe<Record<string, any>>(settingsPath(), {});
  const mode = (settings.env ?? settings).CLAUDE_MEM_MODE;
  return typeof mode === 'string' && validateMode(mode) ? mode : undefined;
}

function writeSelectedMode(mode: string): void {
  const path = settingsPath();
  const settings = readJsonSafe<Record<string, any>>(path, {});
  const target = settings.env && typeof settings.env === 'object' ? settings.env : settings;
  target.CLAUDE_MEM_MODE = mode;
  writeJsonFileAtomic(path, settings);
}

// ---------------------------------------------------------------------------
// IDE setup dispatcher
// ---------------------------------------------------------------------------

/** Returns a list of host IDs that failed setup. */
async function setupIDEs(selectedIDEs: string[]): Promise<string[]> {
  const failedIDEs: string[] = [];

  for (const ideId of selectedIDEs) {
    switch (ideId) {
      case 'claude-code': {
        log.success('Claude Code: plugin files registered locally.');
        break;
      }

      case 'codex-cli': {
        const { installCodexCli } = await import('../../services/integrations/CodexCliInstaller.js');
        const codexResult = await installCodexCli();
        if (codexResult === 0) {
          log.success('Codex CLI: transcript watching configured.');
        } else {
          log.error('Codex CLI: integration setup failed.');
          failedIDEs.push(ideId);
        }
        break;
      }

      default: {
        log.error(`Unsupported IDE: ${ideId}`);
        failedIDEs.push(ideId);
        break;
      }
    }
  }

  return failedIDEs;
}

// ---------------------------------------------------------------------------
// Interactive IDE selection
// ---------------------------------------------------------------------------

async function promptForIDESelection(): Promise<string[]> {
  const detectedIDEs = detectInstalledIDEs();
  const detected = detectedIDEs.filter((ide) => ide.detected && ide.supported);

  if (detected.length === 0) {
    log.warn('No supported IDEs detected. Installing for Claude Code by default.');
    return ['claude-code'];
  }

  const options = detected.map((ide) => ({
    value: ide.id,
    label: ide.label,
    hint: ide.hint,
  }));

  const result = await p.multiselect({
    message: 'Which IDEs do you use?',
    options,
    initialValues: detected.map((ide) => ide.id),
    required: true,
  });

  if (p.isCancel(result)) {
    p.cancel('Installation cancelled.');
    process.exit(0);
  }

  return result as string[];
}

async function promptForModeSelection(initialValue: string): Promise<string> {
  const result = await p.select({
    message: 'Which language should claude-mem use for injected context?',
    options: languageModes,
    initialValue,
  });

  if (p.isCancel(result)) {
    p.cancel('Installation cancelled.');
    process.exit(0);
  }

  return result as string;
}

function validateMode(mode: string): boolean {
  return languageModes.some((languageMode) => languageMode.value === mode);
}

// ---------------------------------------------------------------------------
// Core copy logic
// ---------------------------------------------------------------------------

function copyPluginToMarketplace(): void {
  const marketplaceDir = marketplaceDirectory();
  const packageRoot = npmPackageRootDirectory();

  ensureDirectoryExists(marketplaceDir);

  // Only copy directories/files that are actually needed at runtime.
  // The npm package ships plugin/, package.json, node_modules/, and dist/.
  // When running from a dev checkout, the root contains many extra dirs
  // (.claude, .agents, src, docs, etc.) that must NOT be copied.
  const allowedTopLevelEntries = [
    'plugin',
    'package.json',
    'package-lock.json',
    'node_modules',
    'dist',
    'LICENSE',
    'README.md',
    'CHANGELOG.md',
  ];

  for (const entry of allowedTopLevelEntries) {
    const sourcePath = join(packageRoot, entry);
    const destPath = join(marketplaceDir, entry);
    if (!existsSync(sourcePath)) continue;

    // Clean replace: remove stale files from previous installs before copying
    if (existsSync(destPath)) {
      rmSync(destPath, { recursive: true, force: true });
    }
    cpSync(sourcePath, destPath, {
      recursive: true,
      force: true,
    });
  }
}

function copyPluginToCache(version: string): void {
  const sourcePluginDirectory = npmPackagePluginDirectory();
  const cachePath = pluginCacheDirectory(version);

  // Clean replace: remove stale cache before copying
  rmSync(cachePath, { recursive: true, force: true });
  ensureDirectoryExists(cachePath);
  cpSync(sourcePluginDirectory, cachePath, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// npm install in marketplace dir
// ---------------------------------------------------------------------------

function runNpmInstallInMarketplace(): void {
  const marketplaceDir = marketplaceDirectory();
  const packageJsonPath = join(marketplaceDir, 'package.json');

  if (!existsSync(packageJsonPath)) return;

  execSync('npm install --production', {
    cwd: marketplaceDir,
    stdio: 'pipe',
    ...(IS_WINDOWS ? { shell: true as const } : {}),
  });
}

function hasMarketplaceDependencies(): boolean {
  return existsSync(join(marketplaceDirectory(), 'node_modules'));
}

function hasPackageCacheDependencies(): boolean {
  return existsSync(join(npmPackageRootDirectory(), 'node_modules'));
}

// ---------------------------------------------------------------------------
// Trigger smart-install for Bun / uv
// ---------------------------------------------------------------------------

function runSmartInstall(): boolean {
  const smartInstallPath = join(marketplaceDirectory(), 'plugin', 'scripts', 'smart-install.js');

  if (!existsSync(smartInstallPath)) {
    log.warn('smart-install.js not found — skipping Bun/uv auto-install.');
    return false;
  }

  try {
    execSync(`node "${smartInstallPath}"`, {
      stdio: 'inherit',
      ...(IS_WINDOWS ? { shell: true as const } : {}),
    });
    return true;
  } catch (error: unknown) {
    console.warn('[install] smart-install error:', error instanceof Error ? error.message : String(error));
    log.warn('smart-install encountered an issue. You may need to install Bun/uv manually.');
    return false;
  }
}

function restartInstalledWorker(): boolean {
  const marketplaceDir = marketplaceDirectory();
  const workerScript = join(marketplaceDir, 'plugin', 'scripts', 'worker-service.cjs');
  const bunPath = resolveBunBinaryPath();
  if (!existsSync(workerScript) || !bunPath) return false;

  try {
    execSync(`"${bunPath}" "${workerScript}" restart`, {
      cwd: marketplaceDir,
      stdio: 'pipe',
      ...(IS_WINDOWS ? { shell: true as const } : {}),
    });
    return true;
  } catch (error: unknown) {
    console.warn('[install] worker restart error:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface InstallOptions {
  /** When provided, skip the interactive IDE multi-select and use this IDE. */
  ide?: string;
  /** When provided, skip the interactive language selector and use this mode. */
  mode?: string;
}

export async function runInstallCommand(options: InstallOptions = {}): Promise<void> {
  const version = readPluginVersion();

  if (isInteractive) {
    p.intro(pc.bgCyan(pc.black(' claude-mem install ')));
  } else {
    console.log('claude-mem install');
  }
  log.info(`Version: ${pc.cyan(version)}`);
  log.info(`Platform: ${process.platform} (${process.arch})`);

  // Check for existing installation
  const marketplaceDir = marketplaceDirectory();
  const alreadyInstalled = existsSync(join(marketplaceDir, 'plugin', '.claude-plugin', 'plugin.json'));

  if (alreadyInstalled) {
    // Read existing version
    try {
      const existingPluginJson = JSON.parse(
        readFileSync(join(marketplaceDir, 'plugin', '.claude-plugin', 'plugin.json'), 'utf-8'),
      );
      log.warn(`Existing installation detected (v${existingPluginJson.version ?? 'unknown'}).`);
    } catch (error: unknown) {
      console.warn('[install] Failed to read existing plugin version:', error instanceof Error ? error.message : String(error));
      log.warn('Existing installation detected.');
    }

    if (process.stdin.isTTY) {
      const shouldContinue = await p.confirm({
        message: 'Overwrite existing installation?',
        initialValue: true,
      });

      if (p.isCancel(shouldContinue) || !shouldContinue) {
        p.cancel('Installation cancelled.');
        process.exit(0);
      }
    }
  }

  // IDE selection
  let selectedIDEs: string[];
  if (options.ide) {
    validateSelectedIDE(options.ide);
    selectedIDEs = expandSelectedIDEs(options.ide);
  } else if (process.stdin.isTTY) {
    selectedIDEs = await promptForIDESelection();
  } else {
    // Non-interactive: default to claude-code
    selectedIDEs = ['claude-code'];
  }

  let selectedMode: string | undefined;
  if (options.mode) {
    if (!validateMode(options.mode)) {
      log.error(`Unknown mode: ${options.mode}`);
      log.info(`Available language modes: ${availableLanguageModes}`);
      process.exit(1);
    }
    selectedMode = options.mode;
  } else if (process.stdin.isTTY) {
    selectedMode = await promptForModeSelection(readSelectedMode() ?? defaultLanguageMode);
  }

  await runTasks([
    {
      title: 'Copying plugin files',
      task: async (message) => {
        message('Copying to marketplace directory...');
        copyPluginToMarketplace();
        return `Plugin files copied ${pc.green('OK')}`;
      },
    },
    {
      title: 'Caching plugin version',
      task: async (message) => {
        message(`Caching v${version}...`);
        copyPluginToCache(version);
        return `Plugin cached (v${version}) ${pc.green('OK')}`;
      },
    },
    {
      title: 'Registering marketplace',
      task: async () => {
        registerMarketplace();
        return `Marketplace registered ${pc.green('OK')}`;
      },
    },
    {
      title: 'Registering plugin',
      task: async () => {
        registerPlugin(version);
        return `Plugin registered ${pc.green('OK')}`;
      },
    },
    {
      title: 'Enabling plugin in Claude settings',
      task: async () => {
        enablePluginInClaudeSettings();
        return `Plugin enabled ${pc.green('OK')}`;
      },
    },
    {
      title: 'Configuring language mode',
      task: async () => {
        if (!selectedMode) {
          return `Language mode unchanged ${pc.green('OK')}`;
        }

        writeSelectedMode(selectedMode);
        return `Language mode set to ${selectedMode} ${pc.green('OK')}`;
      },
    },
    {
      title: 'Installing dependencies',
      task: async (message) => {
        if (hasMarketplaceDependencies()) {
          return `Dependencies copied from package cache ${pc.green('OK')}`;
        }

        if (hasPackageCacheDependencies()) {
          return `Dependencies available in package cache; reinstall skipped ${pc.green('OK')}`;
        }

        message('Running npm install...');
        try {
          runNpmInstallInMarketplace();
          return `Dependencies installed ${pc.green('OK')}`;
        } catch (error: unknown) {
          console.warn('[install] npm install error:', error instanceof Error ? error.message : String(error));
          return `Dependencies may need manual install ${pc.yellow('!')}`;
        }
      },
    },
    {
      title: 'Setting up Bun and uv',
      task: async (message) => {
        message('Running smart-install...');
        return runSmartInstall()
          ? `Runtime dependencies ready ${pc.green('OK')}`
          : `Runtime setup may need attention ${pc.yellow('!')}`;
      },
    },
    {
      title: 'Reloading worker settings',
      task: async () => {
        return restartInstalledWorker()
          ? `Worker settings reloaded ${pc.green('OK')}`
          : `Worker reload skipped ${pc.yellow('!')}`;
      },
    },
  ]);

  // IDE-specific setup
  const failedIDEs = await setupIDEs(selectedIDEs);

  // Summary
  const installStatus = failedIDEs.length > 0 ? 'Installation Partial' : 'Installation Complete';
  const summaryLines = [
    `Version:     ${pc.cyan(version)}`,
    `Plugin dir:  ${pc.cyan(marketplaceDir)}`,
    `IDEs:        ${pc.cyan(selectedIDEs.join(', '))}`,
  ];
  if (selectedMode) {
    summaryLines.push(`Mode:        ${pc.cyan(selectedMode)}`);
  }
  if (failedIDEs.length > 0) {
    summaryLines.push(`Failed:      ${pc.red(failedIDEs.join(', '))}`);
  }

  if (isInteractive) {
    p.note(summaryLines.join('\n'), installStatus);
  } else {
    console.log(`\n  ${installStatus}`);
    summaryLines.forEach(l => console.log(`  ${l}`));
  }

  const workerPort = process.env.CLAUDE_MEM_WORKER_PORT || '37777';
  const nextSteps = [`Start worker: ${pc.bold('npx ccx-mem start')}`];

  if (selectedIDEs.includes('claude-code')) {
    nextSteps.push('Restart Claude Code and start a conversation.');
    nextSteps.push(`Search past work: use ${pc.bold('/mem-search')} in Claude Code`);
  }

  if (selectedIDEs.includes('codex-cli')) {
    nextSteps.push('Run Codex CLI from your project workspace to let transcript watching capture sessions.');
  }

  nextSteps.push(`View your memories: ${pc.underline(`http://localhost:${workerPort}`)}`);

  if (isInteractive) {
    p.note(nextSteps.join('\n'), 'Next Steps');
    if (failedIDEs.length > 0) {
      p.outro(pc.yellow('claude-mem installed with some IDE setup failures.'));
    } else {
      p.outro(pc.green('claude-mem installed successfully!'));
    }
  } else {
    console.log('\n  Next Steps');
    nextSteps.forEach(l => console.log(`  ${l}`));
    if (failedIDEs.length > 0) {
      console.log('\nclaude-mem installed with some IDE setup failures.');
      process.exitCode = 1;
    } else {
      console.log('\nclaude-mem installed successfully!');
    }
  }
}
