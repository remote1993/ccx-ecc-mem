export interface Observation {
  id: number;
  memory_session_id: string;
  project: string;
  merged_into_project?: string | null;
  platform_source: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  narrative: string | null;
  text: string | null;
  facts: string | null;
  concepts: string | null;
  files_read: string | null;
  files_modified: string | null;
  prompt_number: number | null;
  created_at: string;
  created_at_epoch: number;
}

export interface Summary {
  id: number;
  session_id: string;
  project: string;
  platform_source: string;
  request?: string;
  investigated?: string;
  learned?: string;
  completed?: string;
  next_steps?: string;
  created_at_epoch: number;
}

export interface UserPrompt {
  id: number;
  content_session_id: string;
  project: string;
  platform_source: string;
  prompt_number: number;
  prompt_text: string;
  created_at_epoch: number;
}

export type FeedItem =
  | (Observation & { itemType: 'observation' })
  | (Summary & { itemType: 'summary' })
  | (UserPrompt & { itemType: 'prompt' });

export interface StreamEvent {
  type: 'initial_load' | 'new_observation' | 'new_summary' | 'new_prompt' | 'processing_status';
  observations?: Observation[];
  summaries?: Summary[];
  prompts?: UserPrompt[];
  projects?: string[];
  sources?: string[];
  projectsBySource?: Record<string, string[]>;
  observation?: Observation;
  summary?: Summary;
  prompt?: UserPrompt;
  isProcessing?: boolean;
  queueDepth?: number;
}

export interface ProjectCatalog {
  projects: string[];
  sources: string[];
  projectsBySource: Record<string, string[]>;
}

export interface ViewerIntegrationsResponse {
  integrations: string[];
}

export interface CustomModelOption {
  id: string;
  name?: string;
}

export interface CustomModelsResponse {
  provider: 'openrouter' | 'custom';
  models: CustomModelOption[];
  error?: string;
}

export interface Settings {
  CLAUDE_MEM_MODEL: string;
  CLAUDE_MEM_MODE?: string;
  CLAUDE_MEM_CONTEXT_OBSERVATIONS: string;
  CLAUDE_MEM_WORKER_PORT: string;
  CLAUDE_MEM_WORKER_HOST: string;

  // Custom API Configuration
  CLAUDE_MEM_CUSTOM_API_KEY?: string;
  CLAUDE_MEM_CUSTOM_MODEL?: string;
  CLAUDE_MEM_CUSTOM_BASE_URL?: string;
  CLAUDE_MEM_CUSTOM_APP_NAME?: string;
  CLAUDE_MEM_CUSTOM_MAX_CONTEXT_MESSAGES?: string;
  CLAUDE_MEM_CUSTOM_MAX_TOKENS?: string;
  CLAUDE_MEM_CUSTOM_TIMEOUT_MS?: string;
  CLAUDE_MEM_CUSTOM_TEMPERATURE?: string;

  // Token Economics Display
  CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS?: string;
  CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS?: string;
  CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT?: string;
  CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT?: string;

  // Display Configuration
  CLAUDE_MEM_CONTEXT_FULL_COUNT?: string;
  CLAUDE_MEM_CONTEXT_FULL_FIELD?: string;
  CLAUDE_MEM_CONTEXT_SESSION_COUNT?: string;

  // Feature Toggles
  CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY?: string;
  CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE?: string;
  CLAUDE_MEM_CONTEXT_SHOW_TERMINAL_OUTPUT?: string;
  CLAUDE_MEM_FOLDER_CLAUDEMD_ENABLED?: string;
  CLAUDE_MEM_FOLDER_USE_LOCAL_MD?: string;
  CLAUDE_MEM_TRANSCRIPTS_ENABLED?: string;
  CLAUDE_MEM_TRANSCRIPTS_CONFIG_PATH?: string;

  // Exclusion Settings
  CLAUDE_MEM_EXCLUDED_PROJECTS?: string;
  CLAUDE_MEM_FOLDER_MD_EXCLUDE?: string;
}

export interface WorkerStats {
  version?: string;
  uptime?: number;
  activeSessions?: number;
  sseClients?: number;
}

export interface DatabaseStats {
  size?: number;
  observations?: number;
  sessions?: number;
  summaries?: number;
}

export interface Stats {
  worker?: WorkerStats;
  database?: DatabaseStats;
}
