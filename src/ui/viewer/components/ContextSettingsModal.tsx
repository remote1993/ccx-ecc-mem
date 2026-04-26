import React, { useState, useCallback, useEffect } from 'react';
import type { Settings } from '../types';
import { TerminalPreview } from './TerminalPreview';
import { useContextPreview } from '../hooks/useContextPreview';
import type { ViewerLabels } from '../i18n';

interface ContextSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
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

export function ContextSettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
  isSaving,
  saveStatus,
  labels
}: ContextSettingsModalProps) {
  const [formState, setFormState] = useState<Settings>(settings);

  // Update form state when settings prop changes
  useEffect(() => {
    setFormState(settings);
  }, [settings]);

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
  } = useContextPreview(formState);

  const updateSetting = useCallback((key: keyof Settings, value: string) => {
    const newState = { ...formState, [key]: value };
    setFormState(newState);
  }, [formState]);

  const handleSave = useCallback(() => {
    onSave(formState);
  }, [formState, onSave]);

  const toggleBoolean = useCallback((key: keyof Settings) => {
    const currentValue = formState[key];
    const newValue = currentValue === 'true' ? 'false' : 'true';
    updateSetting(key, newValue);
  }, [formState, updateSetting]);

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
            {/* Section 1: Loading */}
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
                  value={formState.CLAUDE_MEM_CUSTOM_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions'}
                  onChange={(e) => updateSetting('CLAUDE_MEM_CUSTOM_BASE_URL', e.target.value)}
                  placeholder="https://your-provider.example/v1/chat/completions"
                />
              </FormField>
              <FormField
                label={labels.customModel}
                tooltip={labels.customModelTooltip}
              >
                <input
                  type="text"
                  value={formState.CLAUDE_MEM_CUSTOM_MODEL || 'xiaomi/mimo-v2-flash:free'}
                  onChange={(e) => updateSetting('CLAUDE_MEM_CUSTOM_MODEL', e.target.value)}
                  placeholder="e.g., xiaomi/mimo-v2-flash:free"
                />
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

              <div className="toggle-group" style={{ marginTop: '12px' }}>
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
              </div>
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
