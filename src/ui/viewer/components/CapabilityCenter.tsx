import React from 'react';
import type { Capability, ViewerCapabilitiesResponse } from '../types';
import type { ViewerLabels } from '../i18n';

interface CapabilityCenterProps {
  isOpen: boolean;
  onClose: () => void;
  data: ViewerCapabilitiesResponse | null;
  labels: ViewerLabels;
  isLoading: boolean;
  error?: string | null;
}

function CapabilityDialog({
  children,
  labels,
  onClose,
  runtime,
}: {
  children: React.ReactNode;
  labels: ViewerLabels;
  onClose: () => void;
  runtime?: React.ReactNode;
}) {
  return (
    <div className="modal-backdrop capability-backdrop" onClick={onClose}>
      <div className="capability-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header capability-modal-header">
          <div className="capability-modal-title">
            <h2>{labels.capabilityCenter}</h2>
            <p>{labels.capabilityCenterDescription}</p>
          </div>
          <div className="header-controls capability-header-controls">
            {runtime}
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
        <div className="capability-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

function localized(text: Capability['title'] | Capability['summary'], locale = 'zh-CN'): string {
  return text?.[locale as 'zh-CN'] || text?.en || text?.['zh-CN'] || '';
}

function CapabilityCard({ capability, locale }: { capability: Capability; locale: string }) {
  return (
    <article className="capability-card">
      <div className="capability-card-header">
        <div className="capability-title-group">
          <h3 className="capability-title">{localized(capability.title, locale) || capability.id}</h3>
          <div className="capability-id">{capability.id}</div>
        </div>
        <span className="capability-tier">
          {capability.dependencyTier || 'core'}
        </span>
      </div>
      <p className="capability-summary">{localized(capability.summary, locale)}</p>
      <div className="capability-meta">
        <span>{capability.kind}</span>
        <span>{capability.source}</span>
        {capability.risks?.map((risk) => <span key={risk}>{risk}</span>)}
      </div>
    </article>
  );
}

function CapabilityGroup({ title, capabilities, locale }: { title: string; capabilities: Capability[]; locale: string }) {
  if (capabilities.length === 0) return null;

  return (
    <section className="capability-group">
      <div className="capability-group-header">
        <h2>{title}</h2>
        <span>{capabilities.length}</span>
      </div>
      <div className="capability-grid">
        {capabilities.map((capability) => (
          <CapabilityCard key={capability.id} capability={capability} locale={locale} />
        ))}
      </div>
    </section>
  );
}

export function CapabilityCenter({ isOpen, onClose, data, labels, isLoading, error }: CapabilityCenterProps) {
  const [selectedStatus, setSelectedStatus] = React.useState('all');

  React.useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (error) {
    return (
      <CapabilityDialog labels={labels} onClose={onClose}>
        <p className="capability-error">{error}</p>
      </CapabilityDialog>
    );
  }

  if (!data) {
    return (
      <CapabilityDialog labels={labels} onClose={onClose}>
        <div className="feed-state">
          {isLoading ? labels.loading : labels.noItems}
        </div>
      </CapabilityDialog>
    );
  }

  const locale = data.defaultLocale || 'zh-CN';
  const groups = data.capabilitiesByStatus || { active: [], optional: [], reference: [], archived: [] };
  const groupDefinitions = [
    { status: 'active', label: labels.activeCapabilities, capabilities: groups.active || [] },
    { status: 'optional', label: labels.optionalCapabilities, capabilities: groups.optional || [] },
    { status: 'reference', label: labels.referenceCapabilities, capabilities: groups.reference || [] },
    { status: 'archived', label: labels.archivedCapabilities, capabilities: groups.archived || [] },
  ];
  const totalCapabilities = groupDefinitions.reduce((count, group) => count + group.capabilities.length, 0);
  const tabs = [
    { status: 'all', label: labels.all, value: totalCapabilities },
    ...groupDefinitions.map(group => ({
      status: group.status,
      label: group.label,
      value: group.capabilities.length,
    })),
  ];
  const visibleGroups = selectedStatus === 'all'
    ? groupDefinitions
    : groupDefinitions.filter(group => group.status === selectedStatus);

  const runtime = (
    <dl className="capability-runtime">
      <div>
        <dt>{labels.capabilityProfile}</dt>
        <dd>{data.defaultProfile}</dd>
      </div>
      <div>
        <dt>{labels.capabilityLocale}</dt>
        <dd>{locale}</dd>
      </div>
    </dl>
  );

  return (
    <CapabilityDialog labels={labels} onClose={onClose} runtime={runtime}>
      <div className="capability-tabs" role="tablist" aria-label={labels.capabilityCenter}>
        {tabs.map(tab => (
          <button
            type="button"
            role="tab"
            aria-selected={selectedStatus === tab.status}
            className={`capability-tab${selectedStatus === tab.status ? ' is-active' : ''}`}
            key={tab.status}
            onClick={() => setSelectedStatus(tab.status)}
          >
            <span>{tab.value}</span>
            <strong>{tab.label}</strong>
          </button>
        ))}
      </div>
      <div className="capability-panel-body">
        {isLoading ? <div className="feed-state feed-state-inline">{labels.loading}</div> : null}
        {visibleGroups.map(group => (
          <CapabilityGroup
            key={group.status}
            title={group.label}
            capabilities={group.capabilities}
            locale={locale}
          />
        ))}
      </div>
    </CapabilityDialog>
  );
}
