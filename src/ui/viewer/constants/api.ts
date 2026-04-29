/**
 * API endpoint paths
 * Centralized to avoid magic strings scattered throughout the codebase
 */
export const API_ENDPOINTS = {
  OBSERVATIONS: '/api/observations',
  SUMMARIES: '/api/summaries',
  PROMPTS: '/api/prompts',
  SETTINGS: '/api/settings',
  CUSTOM_MODELS: '/api/settings/custom-models',
  CUSTOM_MODEL_TEST: '/api/settings/custom-models/test',
  VIEWER_INTEGRATIONS: '/api/viewer/integrations',
  VIEWER_CAPABILITIES: '/api/viewer/capabilities',
  VIEWER_COMMANDS: '/api/viewer/commands',
  STATS: '/api/stats',
  PROCESSING_STATUS: '/api/processing-status',
  STREAM: '/stream',
} as const;
