import React, { useState, useCallback, useEffect } from 'react';
import type { CustomModelOption, CustomModelsResponse, Settings } from '../types';
import { TerminalPreview } from './TerminalPreview';
import { useContextPreview } from '../hooks/useContextPreview';
import type { ViewerLabels } from '../i18n';
import { API_ENDPOINTS } from '../constants/api';
import { authFetch } from '../utils/api';

interface ContextSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  integrations: string[];
  onSave: (settings: Settings) => void;
  isSaving: boolean;
  saveStatus: string;
  labels: ViewerLabels;
}

// Collapsible section component
function CollapsibleSection({
  title,
  description,
  children,
  defaultOpen = true
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`settings-section-collapsible ${isOpen ? 'open' : ''}`}>
      <button
        className="section-header-btn"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <div className="section-header-content">
          <span className="section-title">{title}</span>
          {description && <span className="section-description">{description}</span>}
        </div>
        <svg
          className={`chevron-icon ${isOpen ? 'rotated' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && <div className="section-content">{children}</div>}
    </div>
  );
}

// Form field with optional tooltip
function FormField({
  label,
  tooltip,
  children
}: {
  label: string;
  tooltip?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="form-field">
      <label className="form-field-label">
        {label}
        {tooltip && (
          <span className="tooltip-trigger" title={tooltip}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

// Toggle switch component
function ToggleSwitch({
  id,
  label,
  description,
  checked,
  onChange,
  disabled
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="toggle-row">
      <div className="toggle-info">
        <label htmlFor={id} className="toggle-label">{label}</label>
        {description && <span className="toggle-description">{description}</span>}
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        className={`toggle-switch ${checked ? 'on' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
      >
        <span className="toggle-knob" />
      </button>
    </div>
  );
}

function parseSkipTools(value?: string): string[] {
  return (value || '')
    .split(',')
    .map(tool => tool.trim())
    .filter(Boolean);
}

function serializeSkipTools(tools: string[]): string {
  return Array.from(new Set(tools)).join(',');
}

export function ContextSettingsModal({
  isOpen,
  onClose,
  settings,
  integrations,
  onSave,
  isSaving,
  saveStatus,
  labels
}: ContextSettingsModalProps) {
  const [formState, setFormState] = useState<Settings>(settings);
  const [customModels, setCustomModels] = useState<CustomModelOption[]>([]);
  const [modelLoadStatus, setModelLoadStatus] = useState('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelTestStatus, setModelTestStatus] = useState('');

  // Update form state when settings prop changes
  useEffect(() => {
    setFormState(settings);
  }, [settings]);

  const loadCustomModels = useCallback(async () => {
    const baseUrl = formState.CLAUDE_MEM_CUSTOM_BASE_URL || '';
    const apiKey = formState.CLAUDE_MEM_CUSTOM_API_KEY || '';

    if (!baseUrl.trim() || !apiKey.trim()) {
      setCustomModels([]);
      setModelLoadStatus(labels.noModelsLoaded);
      return;
    }

    setIsLoadingModels(true);
    setModelLoadStatus(labels.loadingModels);
    setModelTestStatus('');

    try {
      const res = await authFetch(API_ENDPOINTS.CUSTOM_MODELS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, apiKey })
      });
      const data = await res.json() as CustomModelsResponse;
      if (!res.ok) {
        throw new Error(data.error || `Failed to load models (${res.status})`);
      }
      setCustomModels(data.models || []);
      setModelLoadStatus(data.models?.length ? '' : labels.noModelsLoaded);
    } catch (error) {
      setCustomModels([]);
      setModelLoadStatus(error instanceof Error ? error.message : 'Failed to load models');
    } finally {
      setIsLoadingModels(false);
    }
  }, [formState.CLAUDE_MEM_CUSTOM_API_KEY, formState.CLAUDE_MEM_CUSTOM_BASE_URL, labels]);

  const testCustomModel = useCallback(async () => {
    const baseUrl = formState.CLAUDE_MEM_CUSTOM_BASE_URL || '';
    const apiKey = formState.CLAUDE_MEM_CUSTOM_API_KEY || '';
    const model = formState.CLAUDE_MEM_CUSTOM_MODEL || '';

    if (!baseUrl.trim() || !apiKey.trim() || !model.trim()) {
      setModelTestStatus(labels.noModelsLoaded);
      return;
    }

    setModelTestStatus(labels.testingModel);

    try {
      const res = await authFetch(API_ENDPOINTS.CUSTOM_MODEL_TEST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, apiKey, model })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Model test failed (${res.status})`);
      }
      setModelTestStatus(labels.modelTestSucceeded);
    } catch (error) {
      setModelTestStatus(`${labels.modelTestFailed}: ${error instanceof Error ? error.message : 'Network error'}`);
    }
  }, [formState.CLAUDE_MEM_CUSTOM_API_KEY, formState.CLAUDE_MEM_CUSTOM_BASE_URL, formState.CLAUDE_MEM_CUSTOM_MODEL, labels]);

  // Get context preview based on current form state
  const {
    preview,
    isLoading,
    error,
    projects,
    sources,
    selectedSource,
    setSelectedSource,
    selectedProject,
    setSelectedProject
  } = useContextPreview(formState, integrations);

  const updateSetting = useCallback((key: keyof Settings, value: string) => {
    const newState = { ...formState, [key]: value };
    setFormState(newState);
  }, [formState]);

  const modelQuery = (formState.CLAUDE_MEM_CUSTOM_MODEL || '').trim().toLowerCase();
  const filteredCustomModels = modelQuery
    ? customModels.filter((model) => model.id.toLowerCase().startsWith(modelQuery))
    : customModels;

  const handleSave = useCallback(() => {
    onSave(formState);
  }, [formState, onSave]);

  const toggleBoolean = useCallback((key: keyof Settings) => {
    const currentValue = formState[key];
    const newValue = currentValue === 'true' ? 'false' : 'true';
    updateSetting(key, newValue);
  }, [formState, updateSetting]);

  const setSlashCommandRecording = useCallback((enabled: boolean) => {
    const skipTools = parseSkipTools(formState.CLAUDE_MEM_SKIP_TOOLS);
    const nextTools = enabled
      ? skipTools.filter(tool => tool !== 'SlashCommand')
      : [...skipTools, 'SlashCommand'];
    updateSetting('CLAUDE_MEM_SKIP_TOOLS', serializeSkipTools(nextTools));
  }, [formState.CLAUDE_MEM_SKIP_TOOLS, updateSetting]);

  const applyContextPreset = useCallback((preset: 'lean' | 'balanced' | 'deep') => {
    const presets: Record<typeof preset, Partial<Settings>> = {
      lean: {
        CLAUDE_MEM_CONTEXT_OBSERVATIONS: '25',
        CLAUDE_MEM_CONTEXT_SESSION_COUNT: '5',
        CLAUDE_MEM_CONTEXT_FULL_COUNT: '1',
        CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY: 'true',
        CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE: 'false',
        CLAUDE_MEM_SEMANTIC_INJECT_LIMIT: '3',
      },
      balanced: {
        CLAUDE_MEM_CONTEXT_OBSERVATIONS: '50',
        CLAUDE_MEM_CONTEXT_SESSION_COUNT: '10',
        CLAUDE_MEM_CONTEXT_FULL_COUNT: '3',
        CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY: 'true',
        CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE: 'false',
        CLAUDE_MEM_SEMANTIC_INJECT_LIMIT: '5',
      },
      deep: {
        CLAUDE_MEM_CONTEXT_OBSERVATIONS: '120',
        CLAUDE_MEM_CONTEXT_SESSION_COUNT: '20',
        CLAUDE_MEM_CONTEXT_FULL_COUNT: '8',
        CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY: 'true',
        CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE: 'true',
        CLAUDE_MEM_SEMANTIC_INJECT_LIMIT: '10',
      },
    };
    setFormState(prev => ({ ...prev, ...presets[preset] }));
  }, []);

  const totalContextLoad =
    Number(formState.CLAUDE_MEM_CONTEXT_OBSERVATIONS || 0) +
    Number(formState.CLAUDE_MEM_CONTEXT_SESSION_COUNT || 0) * 3 +
    Number(formState.CLAUDE_MEM_CONTEXT_FULL_COUNT || 0) * 4 +
    (formState.CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE === 'true' ? 12 : 0);
  const contextLoadLabel = totalContextLoad > 140
    ? labels.contextHeavy
    : totalContextLoad > 70
      ? labels.contextBalanced
      : labels.contextLean;
  const slashCommandRecordingEnabled = !parseSkipTools(formState.CLAUDE_MEM_SKIP_TOOLS).includes('SlashCommand');

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="context-settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>{labels.settings}</h2>
          <div className="header-controls">
            <label className="preview-selector">
              {labels.source}:
              <select
                value={selectedSource || ''}
                onChange={(e) => setSelectedSource(e.target.value)}
                disabled={sources.length === 0}
              >
                {sources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </label>
            <label className="preview-selector">
              {labels.project}:
              <select
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(e.target.value)}
                disabled={projects.length === 0}
              >
                {projects.map(project => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
            </label>
            <button
              onClick={onClose}
              className="modal-close-btn"
              title={labels.closeEsc}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body - 2 columns */}
        <div className="modal-body">
          {/* Left column - Terminal Preview */}
          <div className="preview-column">
            <div className="preview-content">
              {error ? (
                <div style={{ color: '#ff6b6b' }}>
                  {labels.errorLoadingPreview}: {error}
                </div>
              ) : (
                <TerminalPreview content={preview} isLoading={isLoading} labels={labels} />
              )}
            </div>
          </div>

          {/* Right column - Settings Panel */}
          <div className="settings-column">
            <CollapsibleSection
              title={labels.contextManagement}
              description={labels.contextManagementDescription}
            >
              <div className="context-health-grid">
                <div className="context-health-card">
                  <span>{labels.contextHealth}</span>
                  <strong>{contextLoadLabel}</strong>
                </div>
                <div className="context-health-card">
                  <span>{labels.observations}</span>
                  <strong>{formState.CLAUDE_MEM_CONTEXT_OBSERVATIONS || '50'}</strong>
                </div>
                <div className="context-health-card">
                  <span>{labels.sessions}</span>
                  <strong>{formState.CLAUDE_MEM_CONTEXT_SESSION_COUNT || '10'}</strong>
                </div>
              </div>
              <div className="context-preset-grid">
                <button type="button" className="context-preset-btn" onClick={() => applyContextPreset('lean')}>
                  <strong>{labels.contextPresetLean}</strong>
                  <span>{labels.contextPresetLeanDescription}</span>
                </button>
                <button type="button" className="context-preset-btn" onClick={() => applyContextPreset('balanced')}>
                  <strong>{labels.contextPresetBalanced}</strong>
                  <span>{labels.contextPresetBalancedDescription}</span>
                </button>
                <button type="button" className="context-preset-btn" onClick={() => applyContextPreset('deep')}>
                  <strong>{labels.contextPresetDeep}</strong>
                  <span>{labels.contextPresetDeepDescription}</span>
                </button>
              </div>
              <div className="toggle-group">
                <ToggleSwitch
                  id="semantic-context"
                  label={labels.semanticContext}
                  description={labels.semanticContextDescription}
                  checked={formState.CLAUDE_MEM_SEMANTIC_INJECT === 'true'}
                  onChange={() => toggleBoolean('CLAUDE_MEM_SEMANTIC_INJECT')}
                />
                <ToggleSwitch
                  id="show-last-summary"
                  label={labels.includeLastSummary}
                  description={labels.includeLastSummaryDescription}
                  checked={formState.CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY === 'true'}
                  onChange={() => toggleBoolean('CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY')}
                />
                <ToggleSwitch
                  id="show-last-message"
                  label={labels.includeLastMessage}
                  description={labels.includeLastMessageDescription}
                  checked={formState.CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE === 'true'}
                  onChange={() => toggleBoolean('CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE')}
                />
                <ToggleSwitch
                  id="show-terminal-output"
                  label={labels.includeTerminalOutput}
                  description={labels.includeTerminalOutputDescription}
                  checked={formState.CLAUDE_MEM_CONTEXT_SHOW_TERMINAL_OUTPUT === 'true'}
                  onChange={() => toggleBoolean('CLAUDE_MEM_CONTEXT_SHOW_TERMINAL_OUTPUT')}
                />
              </div>
              <FormField
                label={labels.semanticContextLimit}
                tooltip={labels.semanticContextLimitTooltip}
              >
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formState.CLAUDE_MEM_SEMANTIC_INJECT_LIMIT || '5'}
                  onChange={(e) => updateSetting('CLAUDE_MEM_SEMANTIC_INJECT_LIMIT', e.target.value)}
                />
              </FormField>
            </CollapsibleSection>

            <CollapsibleSection
              title={labels.commandRecording}
              description={labels.commandRecordingDescription}
              defaultOpen={false}
            >
              <div className="toggle-group">
                <ToggleSwitch
                  id="record-claude-commands"
                  label={labels.claudeCommandRecording}
                  description={labels.claudeCommandRecordingDescription}
                  checked={slashCommandRecordingEnabled}
                  onChange={setSlashCommandRecording}
                />
                <ToggleSwitch
                  id="record-codex-commands"
                  label={labels.codexCommandRecording}
                  description={labels.codexCommandRecordingDescription}
                  checked={formState.CLAUDE_MEM_TRANSCRIPTS_ENABLED === 'true'}
                  onChange={() => toggleBoolean('CLAUDE_MEM_TRANSCRIPTS_ENABLED')}
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title={labels.loading}
              description={labels.loadingDescription}
            >
              <FormField
                label={labels.observations}
                tooltip={labels.observationsTooltip}
              >
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={formState.CLAUDE_MEM_CONTEXT_OBSERVATIONS || '50'}
                  onChange={(e) => updateSetting('CLAUDE_MEM_CONTEXT_OBSERVATIONS', e.target.value)}
                />
              </FormField>
              <FormField
                label={labels.sessions}
                tooltip={labels.sessionsTooltip}
              >
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formState.CLAUDE_MEM_CONTEXT_SESSION_COUNT || '10'}
                  onChange={(e) => updateSetting('CLAUDE_MEM_CONTEXT_SESSION_COUNT', e.target.value)}
                />
              </FormField>
            </CollapsibleSection>

            {/* Section 2: Display */}
            <CollapsibleSection
              title={labels.display}
              description={labels.displayDescription}
            >
              <div className="display-subsection">
                <span className="subsection-label">{labels.fullObservations}</span>
                <FormField
                  label={labels.count}
                  tooltip={labels.countTooltip}
                >
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={formState.CLAUDE_MEM_CONTEXT_FULL_COUNT || '5'}
                    onChange={(e) => updateSetting('CLAUDE_MEM_CONTEXT_FULL_COUNT', e.target.value)}
                  />
                </FormField>
                <FormField
                  label={labels.field}
                  tooltip={labels.fieldTooltip}
                >
                  <select
                    value={formState.CLAUDE_MEM_CONTEXT_FULL_FIELD || 'narrative'}
                    onChange={(e) => updateSetting('CLAUDE_MEM_CONTEXT_FULL_FIELD', e.target.value)}
                  >
                    <option value="narrative">{labels.narrative}</option>
                    <option value="facts">{labels.facts}</option>
                  </select>
                </FormField>
              </div>

              <div className="display-subsection">
                <span className="subsection-label">{labels.tokenEconomics}</span>
                <div className="toggle-group">
                  <ToggleSwitch
                    id="show-read-tokens"
                    label={labels.readCost}
                    description={labels.readCostDescription}
                    checked={formState.CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS === 'true'}
                    onChange={() => toggleBoolean('CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS')}
                  />
                  <ToggleSwitch
                    id="show-work-tokens"
                    label={labels.workInvestment}
                    description={labels.workInvestmentDescription}
                    checked={formState.CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS === 'true'}
                    onChange={() => toggleBoolean('CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS')}
                  />
                  <ToggleSwitch
                    id="show-savings-amount"
                    label={labels.savings}
                    description={labels.savingsDescription}
                    checked={formState.CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT === 'true'}
                    onChange={() => toggleBoolean('CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT')}
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 4: Advanced */}
            <CollapsibleSection
              title={labels.advanced}
              description={labels.advancedDescription}
              defaultOpen={false}
            >
              <FormField
                label={labels.customApiKey}
                tooltip={labels.customApiKeyTooltip}
              >
                <input
                  type="password"
                  value={formState.CLAUDE_MEM_CUSTOM_API_KEY || ''}
                  onChange={(e) => updateSetting('CLAUDE_MEM_CUSTOM_API_KEY', e.target.value)}
                  placeholder={labels.enterApiKey}
                />
              </FormField>
              <FormField
                label={labels.customBaseUrl}
                tooltip={labels.customBaseUrlTooltip}
              >
                <input
                  type="text"
                  value={formState.CLAUDE_MEM_CUSTOM_BASE_URL || ''}
                  onChange={(e) => updateSetting('CLAUDE_MEM_CUSTOM_BASE_URL', e.target.value)}
                  placeholder="https://your-provider.example/v1/chat/completions"
                />
              </FormField>
              <FormField
                label={labels.customModel}
                tooltip={labels.customModelTooltip}
              >
                <div className="model-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={loadCustomModels}
                    disabled={isLoadingModels || !formState.CLAUDE_MEM_CUSTOM_BASE_URL || !formState.CLAUDE_MEM_CUSTOM_API_KEY}
                  >
                    {isLoadingModels ? labels.loadingModels : labels.loadModels}
                  </button>
                </div>
                {customModels.length > 0 ? (
                  <>
                    <input
                      type="text"
                      value={formState.CLAUDE_MEM_CUSTOM_MODEL || ''}
                      onChange={(e) => updateSetting('CLAUDE_MEM_CUSTOM_MODEL', e.target.value)}
                      placeholder={labels.selectModel}
                      list="custom-model-options"
                    />
                    <datalist id="custom-model-options">
                      {filteredCustomModels.map((model) => (
                        <option
                          key={model.id}
                          value={model.id}
                          label={model.name ? `${model.id} — ${model.name}` : model.id}
                        />
                      ))}
                    </datalist>
                  </>
                ) : (
                  <input
                    type="text"
                    value={formState.CLAUDE_MEM_CUSTOM_MODEL || ''}
                    onChange={(e) => updateSetting('CLAUDE_MEM_CUSTOM_MODEL', e.target.value)}
                    placeholder={labels.selectModel}
                  />
                )}
                <div className="model-actions model-test-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={testCustomModel}
                    disabled={!formState.CLAUDE_MEM_CUSTOM_BASE_URL || !formState.CLAUDE_MEM_CUSTOM_API_KEY || !formState.CLAUDE_MEM_CUSTOM_MODEL}
                  >
                    {modelTestStatus === labels.testingModel ? labels.testingModel : labels.testModel}
                  </button>
                </div>
                {(modelLoadStatus || modelTestStatus) && (
                  <span className="field-hint">{modelTestStatus || modelLoadStatus}</span>
                )}
              </FormField>
              <FormField
                label={labels.appNameOptional}
                tooltip={labels.appNameOptionalTooltip}
              >
                <input
                  type="text"
                  value={formState.CLAUDE_MEM_CUSTOM_APP_NAME || 'ccx-mem'}
                  onChange={(e) => updateSetting('CLAUDE_MEM_CUSTOM_APP_NAME', e.target.value)}
                  placeholder="ccx-mem"
                />
              </FormField>
              <FormField
                label={labels.contextMessages}
                tooltip={labels.contextMessagesTooltip}
              >
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formState.CLAUDE_MEM_CUSTOM_MAX_CONTEXT_MESSAGES || '20'}
                  onChange={(e) => updateSetting('CLAUDE_MEM_CUSTOM_MAX_CONTEXT_MESSAGES', e.target.value)}
                />
              </FormField>
              <FormField
                label={labels.contextTokens}
                tooltip={labels.contextTokensTooltip}
              >
                <input
                  type="number"
                  min="1000"
                  max="1000000"
                  step="1000"
                  value={formState.CLAUDE_MEM_CUSTOM_MAX_TOKENS || '100000'}
                  onChange={(e) => updateSetting('CLAUDE_MEM_CUSTOM_MAX_TOKENS', e.target.value)}
                />
              </FormField>
              <FormField
                label={labels.requestTimeout}
                tooltip={labels.requestTimeoutTooltip}
              >
                <input
                  type="number"
                  min="1000"
                  max="600000"
                  step="1000"
                  value={formState.CLAUDE_MEM_CUSTOM_TIMEOUT_MS || '120000'}
                  onChange={(e) => updateSetting('CLAUDE_MEM_CUSTOM_TIMEOUT_MS', e.target.value)}
                />
              </FormField>
              <FormField
                label={labels.temperature}
                tooltip={labels.temperatureTooltip}
              >
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formState.CLAUDE_MEM_CUSTOM_TEMPERATURE || '0.3'}
                  onChange={(e) => updateSetting('CLAUDE_MEM_CUSTOM_TEMPERATURE', e.target.value)}
                />
              </FormField>

              <FormField
                label={labels.workerPort}
                tooltip={labels.workerPortTooltip}
              >
                <input
                  type="number"
                  min="1024"
                  max="65535"
                  value={formState.CLAUDE_MEM_WORKER_PORT || '37777'}
                  onChange={(e) => updateSetting('CLAUDE_MEM_WORKER_PORT', e.target.value)}
                />
              </FormField>
            </CollapsibleSection>
          </div>
        </div>

        {/* Footer with Save button */}
        <div className="modal-footer">
          <div className="save-status">
            {saveStatus && <span className={saveStatus.includes('✓') ? 'success' : saveStatus.includes('✗') ? 'error' : ''}>{saveStatus}</span>}
          </div>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? labels.saving : labels.save}
          </button>
        </div>
      </div>
    </div>
  );
}
