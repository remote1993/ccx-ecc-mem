import React from 'react';
import type { Capability, ViewerCapabilitiesResponse } from '../types';
import type { ViewerLabels } from '../i18n';

interface CapabilityCenterProps {
  data: ViewerCapabilitiesResponse | null;
  labels: ViewerLabels;
  isLoading: boolean;
  error?: string | null;
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
  if (error) {
    return (
      <section className="capability-center">
        <header className="capability-center-header">
          <h1>{labels.capabilityCenter}</h1>
        </header>
        <p className="capability-error">{error}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="capability-center">
        <header className="capability-center-header">
          <h1>{labels.capabilityCenter}</h1>
        </header>
        <div className="feed-state">
          {isLoading ? labels.loading : labels.noItems}
        </div>
      </section>
    );
  }

  const locale = data.defaultLocale || 'zh-CN';
  const groups = data.capabilitiesByStatus || { active: [], optional: [], reference: [], archived: [] };
  const groupStats = [
    { label: labels.activeCapabilities, value: groups.active?.length || 0 },
    { label: labels.optionalCapabilities, value: groups.optional?.length || 0 },
    { label: labels.referenceCapabilities, value: groups.reference?.length || 0 },
    { label: labels.archivedCapabilities, value: groups.archived?.length || 0 },
  ];

  return (
    <section className="capability-center">
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
      <div className="capability-stats" aria-label={labels.capabilityCenter}>
        {groupStats.map(stat => (
          <div className="capability-stat" key={stat.label}>
            <span>{stat.value}</span>
            <strong>{stat.label}</strong>
          </div>
        ))}
      </div>
      {isLoading ? <div className="feed-state feed-state-inline">{labels.loading}</div> : null}
      <CapabilityGroup title={labels.activeCapabilities} capabilities={groups.active || []} locale={locale} />
      <CapabilityGroup title={labels.optionalCapabilities} capabilities={groups.optional || []} locale={locale} />
      <CapabilityGroup title={labels.referenceCapabilities} capabilities={groups.reference || []} locale={locale} />
      <CapabilityGroup title={labels.archivedCapabilities} capabilities={groups.archived || []} locale={locale} />
    </section>
  );
}
