/**
 * Install command for `npx ccx-ecc-mem install`.
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
  DEFAULT_FUSION_PROFILE,
  ensureDirectoryExists,
  fusionInstallStatePath,
  INSTALLED_PLUGIN_ID,
  installedPluginsPath,
  IS_WINDOWS,
  knownMarketplacesPath,
  marketplaceDirectory,
  npmPackagePluginDirectory,
  npmPackageRootDirectory,
  PLUGIN_OWNER,
  PLUGIN_SLUG,
  pluginCacheDirectory,
  pluginsDirectory,
  readPluginVersion,
  writeJsonFileAtomic,
} from '../utils/paths.js';
import { readJsonSafe } from '../../utils/json-utils.js';
import { detectInstalledIDEs } from './ide-detection.js';
import { resolveBunBinaryPath } from '../utils/bun-resolver.js';

const LEGACY_PLUGIN_IDS = ['ccx-mem@remote1993'];

// ---------------------------------------------------------------------------
// Registration helpers
// ---------------------------------------------------------------------------

function registerMarketplace(): void {
  const knownMarketplaces = readJsonSafe<Record<string, any>>(knownMarketplacesPath(), {});

  knownMarketplaces[PLUGIN_OWNER] = {
    source: {
      source: 'github',
      repo: `${PLUGIN_OWNER}/${PLUGIN_SLUG}`,
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

  installedPlugins.plugins[INSTALLED_PLUGIN_ID] = [
    {
      scope: 'user',
      installPath: cachePath,
      version,
      installedAt: now,
      lastUpdated: now,
    },
  ];
  for (const legacyPluginId of LEGACY_PLUGIN_IDS) {
    delete installedPlugins.plugins[legacyPluginId];
  }

  writeJsonFileAtomic(installedPluginsPath(), installedPlugins);
}

function enablePluginInClaudeSettings(): void {
  const settings = readJsonSafe<Record<string, any>>(claudeSettingsPath(), {});

  if (!settings.enabledPlugins) settings.enabledPlugins = {};
  settings.enabledPlugins[INSTALLED_PLUGIN_ID] = true;
  for (const legacyPluginId of LEGACY_PLUGIN_IDS) {
    delete settings.enabledPlugins[legacyPluginId];
  }

  writeJsonFileAtomic(claudeSettingsPath(), settings);
}

function readFusionRegistry(): Record<string, any> {
  return readJsonSafe<Record<string, any>>(
    join(npmPackagePluginDirectory(), 'fusion', 'registry.json'),
    {},
  );
}

function readFusionProfile(profile?: string): { name: string; registry: Record<string, any>; profile: Record<string, any> } {
  const registry = readFusionRegistry();
  const profiles = registry.profiles ?? {};
  const defaultProfile = typeof registry.defaultProfile === 'string'
    ? registry.defaultProfile
    : DEFAULT_FUSION_PROFILE;
  const profileName = profile ?? defaultProfile;

  if (!Object.prototype.hasOwnProperty.call(profiles, profileName)) {
    const availableProfiles = Object.keys(profiles).join(', ') || DEFAULT_FUSION_PROFILE;
    throw new Error(`未知能力配置：${profileName}。可用配置：${availableProfiles}`);
  }

  return { name: profileName, registry, profile: profiles[profileName] };
}

function registryCapabilities(registry: Record<string, any>): Map<string, Record<string, any>> {
  const capabilities = Array.isArray(registry.capabilities) ? registry.capabilities : [];
  return new Map(capabilities.map((capability: Record<string, any>) => [String(capability.id), capability]));
}

function resolveProfileCapabilityIds(registry: Record<string, any>, profileName: string, seen = new Set<string>()): string[] {
  const profile = registry.profiles?.[profileName] ?? {};
  if (seen.has(profileName)) return [];
  seen.add(profileName);

  const inherited = Array.isArray(profile.extends)
    ? profile.extends.flatMap((parent: string) => resolveProfileCapabilityIds(registry, parent, seen))
    : [];
  return [...new Set([...inherited, ...(profile.capabilities ?? [])])];
}

function localeForMode(mode?: string): string {
  if (!mode) return 'zh-CN';
  if (mode === 'code') return 'en';
  if (mode === 'code--zh') return 'zh-CN';
  return mode.replace(/^code--/, '');
}

function writeFusionInstallState(version: string, selectedIDEs: string[], selectedMode?: string, selectedProfile?: string): void {
  const { name, registry } = readFusionProfile(selectedProfile);
  const capabilitiesById = registryCapabilities(registry);
  const enabledCapabilityIds = resolveProfileCapabilityIds(registry, name);
  const enabledCapabilities = enabledCapabilityIds
    .map((id) => capabilitiesById.get(id))
    .filter(Boolean);
  const optionalCapabilities = (registry.capabilities ?? [])
    .filter((capability: Record<string, any>) => capability.status === 'optional' && !enabledCapabilityIds.includes(capability.id));

  writeJsonFileAtomic(fusionInstallStatePath(), {
    plugin: INSTALLED_PLUGIN_ID,
    productName: 'ccx-ecc-mem',
    version,
    installedAt: new Date().toISOString(),
    locale: localeForMode(selectedMode),
    contextProfile: selectedMode ?? null,
    capabilityProfile: name,
    profile: name,
    enabledCapabilityIds,
    enabledCapabilities,
    optionalCapabilities,
    catalogPaths: registry.catalogPaths ?? {},
    archived: registry.archived ?? {},
    ides: selectedIDEs,
    mode: selectedMode ?? null,
  });
}

const languageModes = [
  { value: 'code--zh', label: '中文', hint: '默认' },
  { value: 'code', label: 'English', hint: '英文' },
  { value: 'code--ja', label: '日本語', hint: 'Japanese' },
  { value: 'code--ko', label: '한국어', hint: 'Korean' },
  { value: 'code--es', label: 'Español', hint: 'Spanish' },
  { value: 'code--fr', label: 'Français', hint: 'French' },
  { value: 'code--de', label: 'Deutsch', hint: 'German' },
  { value: 'code--pt-br', label: 'Português do Brasil', hint: 'Brazilian Portuguese' },
];
const defaultLanguageMode = 'code--zh';
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
    log.error(`暂不支持 ${match.label}，后续版本会补齐。`);
    process.exit(1);
  }
  if (!match) {
    log.error(`未知 IDE：${ide}`);
    log.info(`可用 IDE：${availableIDEIds()}`);
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
          log.success('Codex CLI: transcript ingestion configured.');
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
    log.warn('未检测到已支持的 IDE，默认安装到 Claude Code。');
    return ['claude-code'];
  }

  const options = detected.map((ide) => ({
    value: ide.id,
    label: ide.label,
    hint: ide.hint,
  }));

  const result = await p.multiselect({
    message: '你使用哪些 IDE 或 CLI？',
    options,
    initialValues: detected.map((ide) => ide.id),
    required: true,
  });

  if (p.isCancel(result)) {
    p.cancel('已取消安装。');
    process.exit(0);
  }

  return result as string[];
}

async function promptForModeSelection(initialValue: string): Promise<string> {
  const result = await p.select({
    message: '注入上下文使用哪种语言？',
    options: languageModes,
    initialValue,
  });

  if (p.isCancel(result)) {
    p.cancel('已取消安装。');
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

  rmSync(marketplaceDir, { recursive: true, force: true });
  ensureDirectoryExists(marketplaceDir);

  // Only copy directories/files that are actually needed at runtime.
  // The npm package ships plugin/, package.json, node_modules/, and dist/.
  // When running from a dev checkout, the root contains many extra dirs
  // (.claude, .agents, src, docs, etc.) that must NOT be copied.
  const allowedTopLevelEntries = [
    '.claude-plugin',
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
// Runtime dependency detection
// ---------------------------------------------------------------------------

function hasMarketplaceDependencies(): boolean {
  return existsSync(join(marketplaceDirectory(), 'node_modules'));
}

function hasPackageCacheDependencies(): boolean {
  return existsSync(join(npmPackageRootDirectory(), 'node_modules'));
}

function packagedInstallHasRuntimeDependencies(): boolean {
  return hasMarketplaceDependencies() || hasPackageCacheDependencies();
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
  /** Fusion capability profile to activate. */
  profile?: string;
}

export async function runInstallCommand(options: InstallOptions = {}): Promise<void> {
  const version = readPluginVersion();

  if (isInteractive) {
    p.intro(pc.bgCyan(pc.black(' ccx-ecc-mem install ')));
  } else {
    console.log('ccx-ecc-mem install');
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
      log.warn(`检测到已有安装（v${existingPluginJson.version ?? 'unknown'}）。`);
    } catch (error: unknown) {
      console.warn('[install] Failed to read existing plugin version:', error instanceof Error ? error.message : String(error));
      log.warn('检测到已有安装。');
    }

    if (process.stdin.isTTY) {
      const shouldContinue = await p.confirm({
        message: '是否覆盖已有安装？',
        initialValue: true,
      });

      if (p.isCancel(shouldContinue) || !shouldContinue) {
        p.cancel('已取消安装。');
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
      log.error(`未知语言模式：${options.mode}`);
      log.info(`可用语言模式：${availableLanguageModes}`);
      process.exit(1);
    }
    selectedMode = options.mode;
  } else if (process.stdin.isTTY) {
    selectedMode = await promptForModeSelection(readSelectedMode() ?? defaultLanguageMode);
  } else {
    selectedMode = readSelectedMode() ?? defaultLanguageMode;
  }

  const selectedProfile = options.profile;
  try {
    readFusionProfile(selectedProfile);
  } catch (error: unknown) {
    log.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  await runTasks([
    {
      title: '复制插件文件',
      task: async (message) => {
        message('正在复制到 marketplace 目录...');
        copyPluginToMarketplace();
        return `插件文件已复制 ${pc.green('OK')}`;
      },
    },
    {
      title: '缓存插件版本',
      task: async (message) => {
        message(`正在缓存 v${version}...`);
        copyPluginToCache(version);
        return `插件已缓存（v${version}）${pc.green('OK')}`;
      },
    },
    {
      title: '注册 marketplace',
      task: async () => {
        registerMarketplace();
        return `marketplace 已注册 ${pc.green('OK')}`;
      },
    },
    {
      title: '注册插件',
      task: async () => {
        registerPlugin(version);
        return `插件已注册 ${pc.green('OK')}`;
      },
    },
    {
      title: '启用 Claude 插件设置',
      task: async () => {
        enablePluginInClaudeSettings();
        return `插件已启用 ${pc.green('OK')}`;
      },
    },
    {
      title: '配置语言模式',
      task: async () => {
        if (!selectedMode) {
          return `语言模式未改变 ${pc.green('OK')}`;
        }

        writeSelectedMode(selectedMode);
        return `语言模式已设为 ${selectedMode} ${pc.green('OK')}`;
      },
    },
    {
      title: '记录能力安装状态',
      task: async () => {
        writeFusionInstallState(version, selectedIDEs, selectedMode, selectedProfile);
        return `能力安装状态已记录 ${pc.green('OK')}`;
      },
    },
    {
      title: '检查运行时依赖',
      task: async () => {
        return packagedInstallHasRuntimeDependencies()
          ? `运行时依赖已存在 ${pc.green('OK')}`
          : `运行时依赖未预装，相关功能会在首次使用时提示 ${pc.yellow('!')}`;
      },
    },
    {
      title: '准备 Bun 和 uv',
      task: async (message) => {
        message('正在运行 smart-install...');
        return runSmartInstall()
          ? `运行时依赖已就绪 ${pc.green('OK')}`
          : `运行时依赖可能需要检查 ${pc.yellow('!')}`;
      },
    },
  ]);

  // IDE-specific setup
  const failedIDEs = await setupIDEs(selectedIDEs);

  await runTasks([
    {
      title: '重新加载 worker 设置',
      task: async () => {
        return restartInstalledWorker()
          ? `worker 设置已重新加载 ${pc.green('OK')}`
          : `worker 重新加载已跳过 ${pc.yellow('!')}`;
      },
    },
  ]);

  // Summary
  const installStatus = failedIDEs.length > 0 ? '安装部分完成' : '安装完成';
  const summaryLines = [
    `版本：        ${pc.cyan(version)}`,
    `插件目录：    ${pc.cyan(marketplaceDir)}`,
    `IDE：        ${pc.cyan(selectedIDEs.join(', '))}`,
  ];
  summaryLines.push(`能力配置：    ${pc.cyan(selectedProfile ?? readFusionProfile().name)}`);
  if (selectedMode) {
    summaryLines.push(`语言模式：    ${pc.cyan(selectedMode)}`);
  }
  if (failedIDEs.length > 0) {
    summaryLines.push(`失败项：      ${pc.red(failedIDEs.join(', '))}`);
  }

  if (isInteractive) {
    p.note(summaryLines.join('\n'), installStatus);
  } else {
    console.log(`\n  ${installStatus}`);
    summaryLines.forEach(l => console.log(`  ${l}`));
  }

  const workerPort = process.env.CLAUDE_MEM_WORKER_PORT || '37777';
  const nextSteps = [`启动 worker：${pc.bold('npx ccx-ecc-mem start')}`];

  if (selectedIDEs.includes('claude-code')) {
    nextSteps.push('重启 Claude Code，然后开始一个新会话。');
    nextSteps.push(`搜索历史工作：在 Claude Code 中使用 ${pc.bold('/mem-search')}`);
  }

  if (selectedIDEs.includes('codex-cli')) {
    nextSteps.push('在项目工作区运行 Codex CLI，worker 会自动监听已启用的 transcript。');
  }

  nextSteps.push(`打开 Viewer：${pc.underline(`http://localhost:${workerPort}`)}`);

  if (isInteractive) {
    p.note(nextSteps.join('\n'), '下一步');
    if (failedIDEs.length > 0) {
      p.outro(pc.yellow('ccx-ecc-mem 已安装，但部分 IDE 设置失败。'));
    } else {
      p.outro(pc.green('ccx-ecc-mem 安装成功。'));
    }
  } else {
    console.log('\n  下一步');
    nextSteps.forEach(l => console.log(`  ${l}`));
    if (failedIDEs.length > 0) {
      console.log('\nccx-ecc-mem 已安装，但部分 IDE 设置失败。');
      process.exitCode = 1;
    } else {
      console.log('\nccx-ecc-mem 安装成功。');
    }
  }
}
