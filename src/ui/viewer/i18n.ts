export interface ViewerLabels {
  all: string;
  allProjects: string;
  settings: string;
  source: string;
  allSources: string;
  project: string;
  closeEsc: string;
  toggleConsole: string;
  connectionLive: string;
  connectionOffline: string;
  documentation: string;
  followOnX: string;
  joinDiscord: string;
  noItems: string;
  loadingMore: string;
  noMoreItems: string;
  facts: string;
  narrative: string;
  untitled: string;
  mergedInto: string;
  read: string;
  modified: string;
  prompt: string;
  sessionSummary: string;
  investigated: string;
  learned: string;
  completed: string;
  nextSteps: string;
  session: string;
  loadingPreview: string;
  errorLoadingPreview: string;
  wrap: string;
  scroll: string;
  disableWordWrap: string;
  enableWordWrap: string;
  loading: string;
  loadingDescription: string;
  observations: string;
  observationsTooltip: string;
  sessions: string;
  sessionsTooltip: string;
  display: string;
  displayDescription: string;
  fullObservations: string;
  count: string;
  countTooltip: string;
  field: string;
  fieldTooltip: string;
  tokenEconomics: string;
  readCost: string;
  readCostDescription: string;
  workInvestment: string;
  workInvestmentDescription: string;
  savings: string;
  savingsDescription: string;
  advanced: string;
  advancedDescription: string;
  customApiKey: string;
  customApiKeyTooltip: string;
  enterApiKey: string;
  customBaseUrl: string;
  customBaseUrlTooltip: string;
  customModel: string;
  customModelTooltip: string;
  loadModels: string;
  loadingModels: string;
  selectModel: string;
  noModelsLoaded: string;
  testModel: string;
  testingModel: string;
  modelTestSucceeded: string;
  modelTestFailed: string;
  appNameOptional: string;
  appNameOptionalTooltip: string;
  contextMessages: string;
  contextMessagesTooltip: string;
  contextTokens: string;
  contextTokensTooltip: string;
  requestTimeout: string;
  requestTimeoutTooltip: string;
  temperature: string;
  temperatureTooltip: string;
  workerPort: string;
  workerPortTooltip: string;
  includeLastSummary: string;
  includeLastSummaryDescription: string;
  includeLastMessage: string;
  includeLastMessageDescription: string;
  saving: string;
  save: string;
  themeLightTitle: string;
  themeDarkTitle: string;
  themeSystemTitle: string;
  scrollToTop: string;
  commands: string;
  commandCenter: string;
  commandCenterDescription: string;
  commandHistory: string;
  recommendedCommands: string;
  commandLibrary: string;
  commandSearchPlaceholder: string;
  noCommandHistory: string;
  noCommands: string;
  commandRecording: string;
  commandRecordingDescription: string;
  claudeCommandRecording: string;
  claudeCommandRecordingDescription: string;
  codexCommandRecording: string;
  codexCommandRecordingDescription: string;
  openSettings: string;
  usageCount: string;
  latestUse: string;
  contextManagement: string;
  contextManagementDescription: string;
  contextPresetLean: string;
  contextPresetBalanced: string;
  contextPresetDeep: string;
  contextPresetLeanDescription: string;
  contextPresetBalancedDescription: string;
  contextPresetDeepDescription: string;
  contextHealth: string;
  contextLean: string;
  contextBalanced: string;
  contextHeavy: string;
  semanticContext: string;
  semanticContextDescription: string;
  semanticContextLimit: string;
  semanticContextLimitTooltip: string;
  includeTerminalOutput: string;
  includeTerminalOutputDescription: string;
  capabilityCenter: string;
  capabilityCenterDescription: string;
  capabilityProfile: string;
  capabilityLocale: string;
  activeCapabilities: string;
  optionalCapabilities: string;
  referenceCapabilities: string;
  archivedCapabilities: string;
}

const en: ViewerLabels = {
  all: 'All',
  allProjects: 'All Projects',
  settings: 'Settings',
  source: 'Source',
  allSources: 'All sources',
  project: 'Project',
  closeEsc: 'Close (Esc)',
  toggleConsole: 'Toggle Console',
  connectionLive: 'Live',
  connectionOffline: 'Offline',
  documentation: 'Documentation',
  followOnX: 'Follow us on X',
  joinDiscord: 'Join our Discord community',
  noItems: 'No items to display',
  loadingMore: 'Loading more...',
  noMoreItems: 'No more items to load',
  facts: 'facts',
  narrative: 'narrative',
  untitled: 'Untitled',
  mergedInto: 'Merged into',
  read: 'read',
  modified: 'modified',
  prompt: 'Prompt',
  sessionSummary: 'Session Summary',
  investigated: 'Investigated',
  learned: 'Learned',
  completed: 'Completed',
  nextSteps: 'Next Steps',
  session: 'Session',
  loadingPreview: 'Loading preview...',
  errorLoadingPreview: 'Error loading preview',
  wrap: 'Wrap',
  scroll: 'Scroll',
  disableWordWrap: 'Disable word wrap (scroll horizontally)',
  enableWordWrap: 'Enable word wrap',
  loading: 'Loading',
  loadingDescription: 'How many observations to inject',
  observations: 'Observations',
  observationsTooltip: 'Number of recent observations to include in context (1-200)',
  sessions: 'Sessions',
  sessionsTooltip: 'Number of recent sessions to pull observations from (1-50)',
  display: 'Display',
  displayDescription: 'What to show in context tables',
  fullObservations: 'Full Observations',
  count: 'Count',
  countTooltip: 'How many observations show expanded details (0-20)',
  field: 'Field',
  fieldTooltip: 'Which field to expand for full observations',
  tokenEconomics: 'Token Economics',
  readCost: 'Read cost',
  readCostDescription: 'Tokens to read this observation',
  workInvestment: 'Work investment',
  workInvestmentDescription: 'Tokens spent creating this observation',
  savings: 'Savings',
  savingsDescription: 'Total tokens saved by reusing context',
  advanced: 'Advanced',
  advancedDescription: 'Custom third-party API settings',
  customApiKey: 'Custom API Key',
  customApiKeyTooltip: 'API key for your custom third-party endpoint',
  enterApiKey: 'Enter API key...',
  customBaseUrl: 'Custom Base URL',
  customBaseUrlTooltip: 'OpenAI-compatible chat completions endpoint',
  customModel: 'Custom Model',
  customModelTooltip: 'Load models after entering a provider URL and API key, then choose one to test',
  loadModels: 'Load models',
  loadingModels: 'Loading models...',
  selectModel: 'Select a model',
  noModelsLoaded: 'Enter Base URL and API key, then load models',
  testModel: 'Test model',
  testingModel: 'Testing model...',
  modelTestSucceeded: 'Model test succeeded',
  modelTestFailed: 'Model test failed',
  appNameOptional: 'App Name (Optional)',
  appNameOptionalTooltip: 'Optional application name sent to the provider',
  contextMessages: 'Context Messages',
  contextMessagesTooltip: 'Maximum recent messages kept before sending to the custom API (1-100)',
  contextTokens: 'Context Tokens',
  contextTokensTooltip: 'Estimated token budget for truncated custom API context (1000-1000000)',
  requestTimeout: 'Request Timeout (ms)',
  requestTimeoutTooltip: 'Abort custom API requests after this many milliseconds (1000-600000)',
  temperature: 'Temperature',
  temperatureTooltip: 'Sampling temperature sent to the custom API (0-2)',
  workerPort: 'Worker Port',
  workerPortTooltip: 'Port for the background worker service',
  includeLastSummary: 'Include last summary',
  includeLastSummaryDescription: "Add previous session's summary to context",
  includeLastMessage: 'Include last message',
  includeLastMessageDescription: "Add previous session's final message",
  saving: 'Saving...',
  save: 'Save',
  themeLightTitle: 'Theme: Light (click for Dark)',
  themeDarkTitle: 'Theme: Dark (click for System)',
  themeSystemTitle: 'Theme: System (click for Light)',
  scrollToTop: 'Scroll to top',
  commands: 'Commands',
  commandCenter: 'Command Center',
  commandCenterDescription: 'Recorded Claude and Codex command usage plus the local command catalog.',
  commandHistory: 'Recent command usage',
  recommendedCommands: 'Recommended commands',
  commandLibrary: 'Command library',
  commandSearchPlaceholder: 'Search commands, descriptions, or projects...',
  noCommandHistory: 'No recorded command usage yet',
  noCommands: 'No commands match the current filter',
  commandRecording: 'Command recording',
  commandRecordingDescription: 'Capture useful slash-command activity from Claude and Codex without duplicating native plugin resources.',
  claudeCommandRecording: 'Record Claude slash commands',
  claudeCommandRecordingDescription: 'Allow SlashCommand hook events to become memory observations when they carry useful work.',
  codexCommandRecording: 'Record Codex transcript commands',
  codexCommandRecordingDescription: 'Use the Codex transcript watcher so slash-like Codex prompts appear in command history.',
  openSettings: 'Open settings',
  usageCount: 'Uses',
  latestUse: 'Latest',
  contextManagement: 'Context Management',
  contextManagementDescription: 'Tune context size, semantic recall, and retention behavior with practical presets.',
  contextPresetLean: 'Lean',
  contextPresetBalanced: 'Balanced',
  contextPresetDeep: 'Deep',
  contextPresetLeanDescription: 'Lower token load for focused work.',
  contextPresetBalancedDescription: 'Default range for day-to-day coding.',
  contextPresetDeepDescription: 'Broader recall for long investigations.',
  contextHealth: 'Context load',
  contextLean: 'Lean',
  contextBalanced: 'Balanced',
  contextHeavy: 'Heavy',
  semanticContext: 'Semantic recall',
  semanticContextDescription: 'Inject the most relevant vector-search memories on each prompt.',
  semanticContextLimit: 'Semantic recall limit',
  semanticContextLimitTooltip: 'Maximum relevant observations to inject per prompt when semantic recall is enabled (1-20)',
  includeTerminalOutput: 'Include terminal output',
  includeTerminalOutputDescription: 'Allow terminal output to appear in generated context when useful.',
  capabilityCenter: 'Capability Center',
  capabilityCenterDescription: 'Unified view of the active, optional, reference, and archived ccx-ecc-mem capabilities.',
  capabilityProfile: 'Profile',
  capabilityLocale: 'Locale',
  activeCapabilities: 'Active capabilities',
  optionalCapabilities: 'Optional enhancements',
  referenceCapabilities: 'Reference catalog',
  archivedCapabilities: 'Archived capabilities',
};

const zh: ViewerLabels = {
  ...en,
  all: '全部',
  allProjects: '全部项目',
  settings: '设置',
  source: '来源',
  allSources: '全部来源',
  project: '项目',
  closeEsc: '关闭（Esc）',
  toggleConsole: '切换控制台',
  connectionLive: '实时',
  connectionOffline: '离线',
  documentation: '文档',
  followOnX: '在 X 上关注我们',
  joinDiscord: '加入 Discord 社区',
  noItems: '没有可显示的条目',
  loadingMore: '正在加载更多...',
  noMoreItems: '没有更多条目可加载',
  facts: '事实',
  narrative: '叙述',
  untitled: '无标题',
  mergedInto: '已合并到',
  read: '读取',
  modified: '修改',
  prompt: '提示',
  sessionSummary: '会话摘要',
  investigated: '已调查',
  learned: '已了解',
  completed: '已完成',
  nextSteps: '下一步',
  session: '会话',
  loadingPreview: '正在加载预览...',
  errorLoadingPreview: '加载预览出错',
  wrap: '换行',
  scroll: '滚动',
  disableWordWrap: '关闭自动换行（横向滚动）',
  enableWordWrap: '开启自动换行',
  loading: '加载',
  loadingDescription: '要注入多少条观察',
  observations: '观察',
  observationsTooltip: '要包含在上下文中的近期观察数量（1-200）',
  sessions: '会话',
  sessionsTooltip: '从近期多少个会话中提取观察（1-50）',
  display: '显示',
  displayDescription: '上下文表格中显示哪些内容',
  fullObservations: '完整观察',
  count: '数量',
  countTooltip: '显示展开详情的观察数量（0-20）',
  field: '字段',
  fieldTooltip: '完整观察要展开哪个字段',
  tokenEconomics: 'Token 经济性',
  readCost: '读取成本',
  readCostDescription: '读取这条观察所需的 token',
  workInvestment: '工作投入',
  workInvestmentDescription: '创建这条观察花费的 token',
  savings: '节省',
  savingsDescription: '复用上下文节省的 token 总量',
  advanced: '高级',
  advancedDescription: '自定义第三方 API 设置',
  customApiKey: '自定义 API Key',
  customApiKeyTooltip: '自定义第三方端点的 API key',
  enterApiKey: '输入 API key...',
  customBaseUrl: '自定义 Base URL',
  customBaseUrlTooltip: '兼容 OpenAI 的 chat completions 端点',
  customModel: '自定义模型',
  customModelTooltip: '填写供应商 URL 和 API key 后加载模型，再选择并测试',
  loadModels: '加载模型',
  loadingModels: '正在加载模型...',
  selectModel: '选择模型',
  noModelsLoaded: '请输入 Base URL 和 API key，然后加载模型',
  testModel: '测试模型',
  testingModel: '正在测试模型...',
  modelTestSucceeded: '模型测试成功',
  modelTestFailed: '模型测试失败',
  appNameOptional: '应用名称（可选）',
  appNameOptionalTooltip: '发送给提供商的可选应用名称',
  contextMessages: '上下文消息数',
  contextMessagesTooltip: '发送给自定义 API 前保留的近期消息上限（1-100）',
  contextTokens: '上下文 Token',
  contextTokensTooltip: '截断自定义 API 上下文的预估 token 预算（1000-1000000）',
  requestTimeout: '请求超时（ms）',
  requestTimeoutTooltip: '超过此毫秒数后中止自定义 API 请求（1000-600000）',
  temperature: '温度',
  temperatureTooltip: '发送给自定义 API 的采样温度（0-2）',
  workerPort: 'Worker 端口',
  workerPortTooltip: '后台 worker 服务端口',
  includeLastSummary: '包含上次摘要',
  includeLastSummaryDescription: '将上一个会话的摘要加入上下文',
  includeLastMessage: '包含上条消息',
  includeLastMessageDescription: '加入上一个会话的最后一条消息',
  saving: '正在保存...',
  save: '保存',
  themeLightTitle: '主题：浅色（点击切换为深色）',
  themeDarkTitle: '主题：深色（点击切换为跟随系统）',
  themeSystemTitle: '主题：跟随系统（点击切换为浅色）',
  scrollToTop: '回到顶部',
  commands: '命令',
  commandCenter: '命令中心',
  commandCenterDescription: '集中查看 Claude 与 Codex 的命令使用记录，以及本地可用命令目录。',
  commandHistory: '最近命令记录',
  recommendedCommands: '推荐命令',
  commandLibrary: '命令目录',
  commandSearchPlaceholder: '搜索命令、描述或项目...',
  noCommandHistory: '还没有记录到命令使用',
  noCommands: '没有匹配当前筛选的命令',
  commandRecording: '命令记录',
  commandRecordingDescription: '记录有价值的 Claude 与 Codex 命令活动，同时避免重复安装官方原生命令。',
  claudeCommandRecording: '记录 Claude 斜杠命令',
  claudeCommandRecordingDescription: '允许 SlashCommand hook 事件在有实际工作内容时进入记忆观察。',
  codexCommandRecording: '记录 Codex 转录命令',
  codexCommandRecordingDescription: '启用 Codex 转录监听，让类似斜杠命令的 Codex 提示进入命令历史。',
  openSettings: '打开设置',
  usageCount: '次数',
  latestUse: '最近使用',
  contextManagement: '上下文管理',
  contextManagementDescription: '用实用预设调节上下文规模、语义召回和保留策略。',
  contextPresetLean: '精简',
  contextPresetBalanced: '均衡',
  contextPresetDeep: '深度',
  contextPresetLeanDescription: '降低 token 负载，适合聚焦任务。',
  contextPresetBalancedDescription: '适合日常编码的默认范围。',
  contextPresetDeepDescription: '适合长线排查和跨会话召回。',
  contextHealth: '上下文负载',
  contextLean: '轻',
  contextBalanced: '适中',
  contextHeavy: '重',
  semanticContext: '语义召回',
  semanticContextDescription: '每次提示时注入最相关的向量检索记忆。',
  semanticContextLimit: '语义召回数量',
  semanticContextLimitTooltip: '启用语义召回时，每次提示最多注入的相关观察数量（1-20）',
  includeTerminalOutput: '包含终端输出',
  includeTerminalOutputDescription: '在有价值时允许终端输出进入生成的上下文。',
  capabilityCenter: '能力中心',
  capabilityCenterDescription: '统一查看 ccx-ecc-mem 已启用、可选增强、参考资源和归档能力。',
  capabilityProfile: '能力配置',
  capabilityLocale: '界面语言',
  activeCapabilities: '已启用能力',
  optionalCapabilities: '可选增强',
  referenceCapabilities: '参考资源',
  archivedCapabilities: '已归档能力',
};

export function getViewerLabels(mode?: string): ViewerLabels {
  if (mode === 'code' || mode?.endsWith('--en')) return en;
  return zh;
}
