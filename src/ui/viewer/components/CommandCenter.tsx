import React from 'react';
import type { Settings, ViewerCommandCatalogItem, ViewerCommandHistoryItem, ViewerCommandsResponse } from '../types';
import type { ViewerLabels } from '../i18n';

interface CommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  data: ViewerCommandsResponse;
  settings: Settings;
  labels: ViewerLabels;
  isLoading: boolean;
  error?: string | null;
  onOpenSettings: () => void;
}

type CommandTab = 'history' | 'recommended' | 'library';

function isClaudeSlashRecordingEnabled(settings: Settings): boolean {
  const skipTools = (settings.CLAUDE_MEM_SKIP_TOOLS || '')
    .split(',')
    .map(tool => tool.trim())
    .filter(Boolean);
  return !skipTools.includes('SlashCommand');
}

function formatSource(source: string): string {
  if (source === 'claude') return 'Claude';
  if (source === 'codex') return 'Codex';
  return source.charAt(0).toUpperCase() + source.slice(1);
}

function formatTime(epoch: number): string {
  if (!Number.isFinite(epoch)) return '';
  return new Date(epoch).toLocaleString();
}

function matchesQuery(value: string, query: string): boolean {
  return value.toLowerCase().includes(query);
}

function CommandHistoryCard({ item, labels }: { item: ViewerCommandHistoryItem; labels: ViewerLabels }) {
  return (
    <article className="command-card command-history-card">
      <div className="command-card-header">
        <div className="command-title-group">
          <h3 className="command-title">{item.command}</h3>
          <div className="command-id">{item.project}</div>
        </div>
        <span className={`card-source source-${item.platform_source}`}>
          {formatSource(item.platform_source)}
        </span>
      </div>
      <p className="command-summary">{item.latest_prompt_text}</p>
      <div className="command-meta">
        <span>{labels.usageCount}: {item.count}</span>
        <span>{labels.latestUse}: {formatTime(item.latest_epoch)}</span>
      </div>
    </article>
  );
}

function CommandCatalogCard({ item }: { item: ViewerCommandCatalogItem }) {
  return (
    <article className="command-card">
      <div className="command-card-header">
        <div className="command-title-group">
          <h3 className="command-title">{item.name}</h3>
          <div className="command-id">{item.title}</div>
        </div>
        <span className={`command-status command-status-${item.status}`}>
          {item.status}
        </span>
      </div>
      <p className="command-summary">{item.description}</p>
      <div className="command-meta">
        {item.platforms.map(platform => (
          <span key={platform}>{formatSource(platform)}</span>
        ))}
        {item.dependencyTier ? <span>{item.dependencyTier}</span> : null}
        {item.tags.slice(0, 3).map(tag => <span key={tag}>{tag}</span>)}
      </div>
    </article>
  );
}

export function CommandCenter({
  isOpen,
  onClose,
  data,
  settings,
  labels,
  isLoading,
  error,
  onOpenSettings,
}: CommandCenterProps) {
  const [selectedTab, setSelectedTab] = React.useState<CommandTab>('history');
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedQuery = query.trim().toLowerCase();
  const recommended = data.catalog.filter(command => command.status === 'recommended');
  const library = data.catalog;
  const tabs: Array<{ id: CommandTab; label: string; count: number }> = [
    { id: 'history', label: labels.commandHistory, count: data.history.length },
    { id: 'recommended', label: labels.recommendedCommands, count: recommended.length },
    { id: 'library', label: labels.commandLibrary, count: library.length },
  ];

  const filteredHistory = data.history.filter(item => {
    if (!normalizedQuery) return true;
    return [item.command, item.project, item.latest_prompt_text, item.platform_source]
      .some(value => matchesQuery(value || '', normalizedQuery));
  });
  const filteredRecommended = recommended.filter(item => {
    if (!normalizedQuery) return true;
    return [item.name, item.title, item.description, item.path, ...item.tags]
      .some(value => matchesQuery(value || '', normalizedQuery));
  });
  const filteredLibrary = library.filter(item => {
    if (!normalizedQuery) return true;
    return [item.name, item.title, item.description, item.path, ...item.tags]
      .some(value => matchesQuery(value || '', normalizedQuery));
  });

  const claudeRecording = isClaudeSlashRecordingEnabled(settings);
  const codexRecording = settings.CLAUDE_MEM_TRANSCRIPTS_ENABLED === 'true';

  return (
    <div className="modal-backdrop command-backdrop" onClick={onClose}>
      <div className="command-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header command-modal-header">
          <div className="command-modal-title">
            <h2>{labels.commandCenter}</h2>
            <p>{labels.commandCenterDescription}</p>
          </div>
          <div className="header-controls command-header-controls">
            <button type="button" className="secondary-btn" onClick={onOpenSettings}>
              {labels.openSettings}
            </button>
            <button onClick={onClose} className="modal-close-btn" title={labels.closeEsc}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="command-modal-body">
          <div className="command-recording-strip">
            <div className="command-recording-item">
              <span className={`status-dot ${claudeRecording ? 'connected' : ''}`} />
              <div>
                <strong>{labels.claudeCommandRecording}</strong>
                <span>{claudeRecording ? labels.connectionLive : labels.connectionOffline}</span>
              </div>
            </div>
            <div className="command-recording-item">
              <span className={`status-dot ${codexRecording ? 'connected' : ''}`} />
              <div>
                <strong>{labels.codexCommandRecording}</strong>
                <span>{codexRecording ? labels.connectionLive : labels.connectionOffline}</span>
              </div>
            </div>
          </div>

          <div className="command-toolbar">
            <div className="capability-tabs command-tabs" role="tablist" aria-label={labels.commandCenter}>
              {tabs.map(tab => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedTab === tab.id}
                  className={`capability-tab${selectedTab === tab.id ? ' is-active' : ''}`}
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                >
                  <span>{tab.count}</span>
                  <strong>{tab.label}</strong>
                </button>
              ))}
            </div>
            <input
              className="command-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={labels.commandSearchPlaceholder}
            />
          </div>

          {error ? <p className="capability-error">{error}</p> : null}
          {isLoading ? <div className="feed-state feed-state-inline">{labels.loading}</div> : null}

          <div className="command-panel-body">
            {selectedTab === 'history' && (
              filteredHistory.length > 0 ? (
                <div className="command-grid">
                  {filteredHistory.map(item => (
                    <CommandHistoryCard key={`${item.platform_source}:${item.command}:${item.project}`} item={item} labels={labels} />
                  ))}
                </div>
              ) : (
                <div className="feed-state">{labels.noCommandHistory}</div>
              )
            )}

            {selectedTab === 'recommended' && (
              filteredRecommended.length > 0 ? (
                <div className="command-grid">
                  {filteredRecommended.map(item => <CommandCatalogCard key={item.id} item={item} />)}
                </div>
              ) : (
                <div className="feed-state">{labels.noCommands}</div>
              )
            )}

            {selectedTab === 'library' && (
              filteredLibrary.length > 0 ? (
                <div className="command-grid">
                  {filteredLibrary.map(item => <CommandCatalogCard key={item.id} item={item} />)}
                </div>
              ) : (
                <div className="feed-state">{labels.noCommands}</div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
