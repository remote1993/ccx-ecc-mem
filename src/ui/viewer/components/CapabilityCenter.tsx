import React from 'react';
import type { Capability, ViewerCapabilitiesResponse } from '../types';
import type { ViewerLabels } from '../i18n';

interface CapabilityCenterProps {
  data: ViewerCapabilitiesResponse | null;
  labels: ViewerLabels;
  isLoading: boolean;
  error?: string | null;
}

function CapabilityFrame({ children }: { children: React.ReactNode }) {
  return (
    <section className="capability-shell">
      <div className="capability-center">
        {children}
      </div>
    </section>
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

export function CapabilityCenter({ data, labels, isLoading, error }: CapabilityCenterProps) {
  const [selectedStatus, setSelectedStatus] = React.useState('all');

  if (error) {
    return (
      <CapabilityFrame>
        <header className="capability-center-header">
          <h1>{labels.capabilityCenter}</h1>
        </header>
        <p className="capability-error">{error}</p>
      </CapabilityFrame>
    );
  }

  if (!data) {
    return (
      <CapabilityFrame>
        <header className="capability-center-header">
          <h1>{labels.capabilityCenter}</h1>
        </header>
        <div className="feed-state">
          {isLoading ? labels.loading : labels.noItems}
        </div>
      </CapabilityFrame>
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

  return (
    <CapabilityFrame>
      <div className="capability-center-header">
        <div>
          <h1>{labels.capabilityCenter}</h1>
          <p>{labels.capabilityCenterDescription}</p>
        </div>
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
      </div>
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
    </CapabilityFrame>
  );
}
