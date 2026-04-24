/**
 * Default settings values for Claude Memory
 * Shared across UI components and hooks
 */
export const DEFAULT_SETTINGS = {
  CLAUDE_MEM_MODEL: 'claude-sonnet-4-6',
  CLAUDE_MEM_MODE: 'code',
  CLAUDE_MEM_CONTEXT_OBSERVATIONS: '50',
  CLAUDE_MEM_WORKER_PORT: '37777',
  CLAUDE_MEM_WORKER_HOST: '127.0.0.1',

  CLAUDE_MEM_CUSTOM_API_KEY: '',
  CLAUDE_MEM_CUSTOM_MODEL: 'xiaomi/mimo-v2-flash:free',
  CLAUDE_MEM_CUSTOM_BASE_URL: 'https://openrouter.ai/api/v1/chat/completions',
  CLAUDE_MEM_CUSTOM_APP_NAME: 'claude-mem',
  CLAUDE_MEM_CUSTOM_MAX_CONTEXT_MESSAGES: '20',
  CLAUDE_MEM_CUSTOM_MAX_TOKENS: '100000',
  CLAUDE_MEM_CUSTOM_TIMEOUT_MS: '120000',
  CLAUDE_MEM_CUSTOM_TEMPERATURE: '0.3',

  // Token Economics — match SettingsDefaultsManager defaults (off by default to keep context lean)
  CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS: 'false',
  CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS: 'false',
  CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT: 'false',
  CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT: 'true',

  // Display Configuration — match SettingsDefaultsManager defaults
  CLAUDE_MEM_CONTEXT_FULL_COUNT: '0',
  CLAUDE_MEM_CONTEXT_FULL_FIELD: 'narrative',
  CLAUDE_MEM_CONTEXT_SESSION_COUNT: '10',

  // Feature Toggles
  CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY: 'true',
  CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE: 'false',
  CLAUDE_MEM_CONTEXT_SHOW_TERMINAL_OUTPUT: 'true',
  CLAUDE_MEM_FOLDER_CLAUDEMD_ENABLED: 'false',
  CLAUDE_MEM_FOLDER_USE_LOCAL_MD: 'false',
  CLAUDE_MEM_TRANSCRIPTS_ENABLED: 'true',
  CLAUDE_MEM_TRANSCRIPTS_CONFIG_PATH: '~/.claude-mem/transcript-watch.json',

  // Exclusion Settings
  CLAUDE_MEM_EXCLUDED_PROJECTS: '',
  CLAUDE_MEM_FOLDER_MD_EXCLUDE: '[]',
} as const;
