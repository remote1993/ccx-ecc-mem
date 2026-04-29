import { useState, useEffect } from 'react';
import { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../constants/settings';
import { API_ENDPOINTS } from '../constants/api';
import { TIMING } from '../constants/timing';
import { authFetch } from '../utils/api';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    // Load initial settings
    authFetch(API_ENDPOINTS.SETTINGS)
      .then(async res => {
        if (!res.ok) {
          throw new Error(`Failed to load settings (${res.status})`);
        }
        return res.json();
      })
      .then(data => {
        // Use ?? (nullish coalescing) instead of || so that falsy values
        // like '0', 'false', and '' from the backend are preserved.
        // Using || would silently replace them with the UI defaults.
        setSettings({
          CLAUDE_MEM_MODEL: data.CLAUDE_MEM_MODEL ?? DEFAULT_SETTINGS.CLAUDE_MEM_MODEL,
          CLAUDE_MEM_MODE: data.CLAUDE_MEM_MODE ?? DEFAULT_SETTINGS.CLAUDE_MEM_MODE,
          CLAUDE_MEM_CONTEXT_OBSERVATIONS: data.CLAUDE_MEM_CONTEXT_OBSERVATIONS ?? DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_OBSERVATIONS,
          CLAUDE_MEM_WORKER_PORT: data.CLAUDE_MEM_WORKER_PORT ?? DEFAULT_SETTINGS.CLAUDE_MEM_WORKER_PORT,
          CLAUDE_MEM_WORKER_HOST: data.CLAUDE_MEM_WORKER_HOST ?? DEFAULT_SETTINGS.CLAUDE_MEM_WORKER_HOST,

          CLAUDE_MEM_CUSTOM_API_KEY: data.CLAUDE_MEM_CUSTOM_API_KEY ?? DEFAULT_SETTINGS.CLAUDE_MEM_CUSTOM_API_KEY,
          CLAUDE_MEM_CUSTOM_MODEL: data.CLAUDE_MEM_CUSTOM_MODEL ?? DEFAULT_SETTINGS.CLAUDE_MEM_CUSTOM_MODEL,
          CLAUDE_MEM_CUSTOM_BASE_URL: data.CLAUDE_MEM_CUSTOM_BASE_URL ?? DEFAULT_SETTINGS.CLAUDE_MEM_CUSTOM_BASE_URL,
          CLAUDE_MEM_CUSTOM_APP_NAME: data.CLAUDE_MEM_CUSTOM_APP_NAME ?? DEFAULT_SETTINGS.CLAUDE_MEM_CUSTOM_APP_NAME,
          CLAUDE_MEM_CUSTOM_MAX_CONTEXT_MESSAGES: data.CLAUDE_MEM_CUSTOM_MAX_CONTEXT_MESSAGES ?? DEFAULT_SETTINGS.CLAUDE_MEM_CUSTOM_MAX_CONTEXT_MESSAGES,
          CLAUDE_MEM_CUSTOM_MAX_TOKENS: data.CLAUDE_MEM_CUSTOM_MAX_TOKENS ?? DEFAULT_SETTINGS.CLAUDE_MEM_CUSTOM_MAX_TOKENS,

          CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS: data.CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS ?? DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS,
          CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS: data.CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS ?? DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS,
          CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT: data.CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT ?? DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT,
          CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT: data.CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT ?? DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT,

          CLAUDE_MEM_CONTEXT_FULL_COUNT: data.CLAUDE_MEM_CONTEXT_FULL_COUNT ?? DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_FULL_COUNT,
          CLAUDE_MEM_CONTEXT_FULL_FIELD: data.CLAUDE_MEM_CONTEXT_FULL_FIELD ?? DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_FULL_FIELD,
          CLAUDE_MEM_CONTEXT_SESSION_COUNT: data.CLAUDE_MEM_CONTEXT_SESSION_COUNT ?? DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_SESSION_COUNT,

          CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY: data.CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY ?? DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY,
          CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE: data.CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE ?? DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE,
          CLAUDE_MEM_CONTEXT_SHOW_TERMINAL_OUTPUT: data.CLAUDE_MEM_CONTEXT_SHOW_TERMINAL_OUTPUT ?? DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_SHOW_TERMINAL_OUTPUT,
          CLAUDE_MEM_FOLDER_CLAUDEMD_ENABLED: data.CLAUDE_MEM_FOLDER_CLAUDEMD_ENABLED ?? DEFAULT_SETTINGS.CLAUDE_MEM_FOLDER_CLAUDEMD_ENABLED,
          CLAUDE_MEM_FOLDER_USE_LOCAL_MD: data.CLAUDE_MEM_FOLDER_USE_LOCAL_MD ?? DEFAULT_SETTINGS.CLAUDE_MEM_FOLDER_USE_LOCAL_MD,
          CLAUDE_MEM_TRANSCRIPTS_ENABLED: data.CLAUDE_MEM_TRANSCRIPTS_ENABLED ?? DEFAULT_SETTINGS.CLAUDE_MEM_TRANSCRIPTS_ENABLED,
          CLAUDE_MEM_TRANSCRIPTS_CONFIG_PATH: data.CLAUDE_MEM_TRANSCRIPTS_CONFIG_PATH ?? DEFAULT_SETTINGS.CLAUDE_MEM_TRANSCRIPTS_CONFIG_PATH,
          CLAUDE_MEM_EXCLUDED_PROJECTS: data.CLAUDE_MEM_EXCLUDED_PROJECTS ?? DEFAULT_SETTINGS.CLAUDE_MEM_EXCLUDED_PROJECTS,
          CLAUDE_MEM_FOLDER_MD_EXCLUDE: data.CLAUDE_MEM_FOLDER_MD_EXCLUDE ?? DEFAULT_SETTINGS.CLAUDE_MEM_FOLDER_MD_EXCLUDE,
        });
      })
      .catch(error => {
        console.error('Failed to load settings:', error);
      });
  }, []);

  const saveSettings = async (newSettings: Settings) => {
    setIsSaving(true);
    setSaveStatus('Saving...');

    try {
      const response = await authFetch(API_ENDPOINTS.SETTINGS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });

      if (!response.ok) {
        setSaveStatus(`✗ Error: ${response.status === 401 ? 'Unauthorized' : response.statusText}`);
        setIsSaving(false);
        return;
      }

      const result = await response.json();

      if (result.success) {
        setSettings(newSettings);
        setSaveStatus('✓ Saved');
        setTimeout(() => setSaveStatus(''), TIMING.SAVE_STATUS_DISPLAY_DURATION_MS);
      } else {
        setSaveStatus(`✗ Error: ${result.error}`);
      }
    } catch (error) {
      setSaveStatus(`✗ Error: ${error instanceof Error ? error.message : 'Network error'}`);
    }

    setIsSaving(false);
  };

  return { settings, saveSettings, isSaving, saveStatus };
}
